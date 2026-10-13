import crypto from "crypto"
import admin from "firebase-admin"
import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const header = req.headers.get("authorization") || ""
    if (!header.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = await getAdminApp().auth().verifyIdToken(header.slice(7))
    const { workspaceId } = await req.json() as { workspaceId?: string }
    if (!workspaceId) return NextResponse.json({ error: "Workspace is required" }, { status: 400 })
    const db = getAdminDb(); const workspaceRef = db.doc(`workspaces/${workspaceId}`); const snap = await workspaceRef.get()
    if (!snap.exists) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    const workspace = snap.data() as any
    if (workspace.clientUid !== decoded.uid) return NextResponse.json({ error: "Only the client can confirm completed work" }, { status: 403 })
    if (workspace.payment?.status !== "funded") return NextResponse.json({ error: "Project payment has not been confirmed" }, { status: 409 })
    if (workspace.disputeId || ["open", "under_review"].includes(String(workspace.disputeStatus || ""))) return NextResponse.json({ error: "Payment is paused while a dispute is active" }, { status: 409 })
    const finalWork = (await workspaceRef.collection("finalWork").doc("submission").get()).data() as any
    if (finalWork?.status !== "approved") return NextResponse.json({ error: "Completed work must be confirmed before payout" }, { status: 409 })
    const existing = await workspaceRef.collection("payouts").where("status", "in", ["processing", "paid", "pending"]).limit(1).get()
    if (!existing.empty) return NextResponse.json({ error: "A payment is already being processed for this project" }, { status: 409 })
    const agreement = (await db.doc(`threads/${workspace.threadId || workspace.chatThreadId}/agreement/current`).get()).data() as any
    const unit = Number(agreement?.terms?.amountAgreed || workspace.payment?.amount || 0)
    const gross = String(agreement?.terms?.billingType || "fixed") === "hourly" ? unit * Number(agreement?.terms?.hoursDuration || 0) : unit
    const platformFee = Math.round(gross * 0.1); const amount = gross - platformFee
    const reference = `cw_payout_${crypto.randomBytes(10).toString("hex")}`; const payoutRef = workspaceRef.collection("payouts").doc(reference)
    const walletRef = db.doc(`wallets/${workspace.talentUid}`)
    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      const walletSnap = (await tx.getAll(walletRef))[0]
      const wallet = walletSnap.exists ? (walletSnap.data() as any) : {}
      tx.set(payoutRef, { reference, amount, grossAmount: gross, platformFee, currency: "NGN", status: "paid", settlement: "wallet_credit", talentUid: workspace.talentUid, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() })
      tx.set(walletRef, { uid: workspace.talentUid, role: "talent", availableBalance: Number(wallet.availableBalance || 0) + amount, totalEarned: Number(wallet.totalEarned || 0) + amount, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      tx.set(walletRef.collection("transactions").doc(reference), { type: "credit", reason: "workspace_payout", amount, currency: "NGN", status: "completed", workspaceId, reference, platformFee, createdAt: admin.firestore.FieldValue.serverTimestamp() })
      tx.set(workspaceRef, { payment: { ...workspace.payment, payoutStatus: "paid", payoutReference: reference, payoutStartedAt: admin.firestore.FieldValue.serverTimestamp(), settlement: "wallet_credit" }, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
    })
    await notifyUser({ userId: workspace.talentUid, type: "payout", title: "Payment added to wallet", message: `Your NGN ${amount.toLocaleString()} project earnings have been added to your wallet.`, link: "/dashboard/wallet" })
    return NextResponse.json({ ok: true, status: "paid", reference, settlement: "wallet_credit" })
  } catch (error: any) { return NextResponse.json({ error: error?.message || "Unable to process payment" }, { status: 500 }) }
}
