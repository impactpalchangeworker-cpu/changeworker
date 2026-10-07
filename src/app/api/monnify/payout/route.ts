import crypto from "crypto"
import admin from "firebase-admin"
import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { initiateMonnifyDisbursement } from "@/lib/monnify"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = await getAdminApp().auth().verifyIdToken(token)
    const { workspaceId } = await req.json() as { workspaceId?: string }
    if (!workspaceId) return NextResponse.json({ error: "Workspace is required" }, { status: 400 })

    const db = getAdminDb()
    const workspaceRef = db.collection("workspaces").doc(workspaceId)
    const workspaceSnap = await workspaceRef.get()
    if (!workspaceSnap.exists) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    const workspace = workspaceSnap.data() as any
    if (workspace.clientUid !== decoded.uid) return NextResponse.json({ error: "Only the client can confirm final delivery" }, { status: 403 })
    if (workspace.disputeId || ["open", "under_review"].includes(String(workspace.disputeStatus || ""))) return NextResponse.json({ error: "Payment is paused while a dispute is active" }, { status: 409 })
    if (workspace.payment?.status !== "funded") return NextResponse.json({ error: "Project payment has not been confirmed" }, { status: 409 })

    const finalWork = (await workspaceRef.collection("finalWork").doc("submission").get()).data() as any
    if (finalWork?.status !== "approved") return NextResponse.json({ error: "Final delivery must be approved before payment" }, { status: 409 })

    const existingPayout = await workspaceRef.collection("payouts").where("status", "in", ["processing", "paid", "pending_authorization"]).limit(1).get()
    if (!existingPayout.empty) return NextResponse.json({ error: "A payment is already being processed for this project" }, { status: 409 })

    const agreement = (await db.doc(`threads/${workspace.threadId || workspace.chatThreadId}/agreement/current`).get()).data() as any
    const unitAmount = Number(agreement?.terms?.amountAgreed || workspace.payment?.amount || 0)
    const totalAmount = String(agreement?.terms?.billingType || "fixed") === "hourly" ? unitAmount * Number(agreement?.terms?.hoursDuration || 0) : unitAmount
    // The platform keeps a transparent 10% service fee on every approved project.
    const platformFee = Math.round(totalAmount * 0.1)
    const amount = Math.max(0, totalAmount - platformFee)
    if (!amount) return NextResponse.json({ error: "The talent payment amount is invalid" }, { status: 400 })

    const profile = (await db.collection("payoutProfiles").doc(String(workspace.talentUid)).get()).data() as any
    const bank = profile?.bank
    if (!bank?.accountNumber || !bank?.bankCode || !bank?.accountName) return NextResponse.json({ error: "The talent must add a verified payout bank account before payment can be sent" }, { status: 409 })
    const sourceAccountNumber = process.env.MONNIFY_DISBURSEMENT_ACCOUNT_NUMBER
    if (!sourceAccountNumber) return NextResponse.json({ error: "MONNIFY_DISBURSEMENT_ACCOUNT_NUMBER is not configured" }, { status: 500 })

    const reference = `cw_payout_${crypto.randomBytes(10).toString("hex")}`
    const payoutRef = workspaceRef.collection("payouts").doc(reference)
    await payoutRef.set({ reference, amount, currency: "NGN", status: "processing", provider: "monnify", talentUid: workspace.talentUid, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() })
    try {
      const result = await initiateMonnifyDisbursement({ amount, reference, narration: `Changeworker payment: ${workspace.gigTitle || "project"}`, destinationBankCode: String(bank.bankCode), destinationAccountNumber: String(bank.accountNumber), destinationAccountName: String(bank.accountName), sourceAccountNumber })
      const payoutStatus = String(result.status || "PROCESSING").toUpperCase()
      const status = payoutStatus === "SUCCESS" ? "paid" : payoutStatus === "PENDING_AUTHORIZATION" ? "pending_authorization" : "processing"
      await payoutRef.set({ status, providerStatus: payoutStatus, transactionReference: result.transactionReference || null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      await workspaceRef.set({ payment: { ...workspace.payment, payoutStatus: status, payoutReference: reference, payoutStartedAt: admin.firestore.FieldValue.serverTimestamp() }, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      await notifyUser({ userId: workspace.talentUid, type: "payout", title: status === "paid" ? "Payment sent" : "Payment processing", message: status === "paid" ? "Your payment has been sent to your verified bank account." : "Your payment is being processed and will be confirmed shortly.", link: `/dashboard/workspaces/${workspaceId}` })
      return NextResponse.json({ ok: true, status, reference })
    } catch (error: any) {
      await payoutRef.set({ status: "failed", error: error?.message || "Disbursement failed", updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      throw error
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unable to process payment" }, { status: 500 })
  }
}
