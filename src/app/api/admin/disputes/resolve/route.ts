import crypto from "crypto"
import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { initiateMonnifyDisbursement, initiateMonnifyRefund } from "@/lib/monnify"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export const runtime = "nodejs"

const money = (amount: number) => `₦${amount.toLocaleString("en-NG")}`

export async function POST(req: Request) {
  try {
    const header = req.headers.get("authorization") || ""
    if (!header.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = await getAdminApp().auth().verifyIdToken(header.slice(7))
    const db = getAdminDb()
    const adminUser = (await db.collection("users").doc(decoded.uid).get()).data() as any
    if (adminUser?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { disputeId, action, amount, adminNotes } = await req.json() as { disputeId?: string; action?: string; amount?: number; adminNotes?: string }
    if (!disputeId || !action || !["release_talent", "refund_client", "partial_refund", "close_case"].includes(action)) return NextResponse.json({ error: "Invalid resolution request" }, { status: 400 })
    const disputeRef = db.collection("disputes").doc(disputeId)
    const dispute = (await disputeRef.get()).data() as any
    if (!dispute || String(dispute.status || "").includes("resolved") || dispute.status === "closed") return NextResponse.json({ error: "This case is unavailable for resolution" }, { status: 409 })
    const workspaceRef = db.collection("workspaces").doc(String(dispute.workspaceId))
    const workspace = (await workspaceRef.get()).data() as any
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    const projectAmount = Number(workspace.payment?.amount || workspace.escrowAmount || 0)
    const requestedAmount = Number(amount || 0)
    if (["release_talent", "refund_client", "partial_refund"].includes(action) && (!requestedAmount || requestedAmount > projectAmount)) return NextResponse.json({ error: "Enter a valid project amount" }, { status: 400 })

    const paymentRef = workspace.payment?.reference ? workspaceRef.collection("payments").doc(String(workspace.payment.reference)) : null
    const payment = paymentRef ? (await paymentRef.get()).data() as any : null
    const originalTransaction = String(payment?.monnifyTransactionReference || "")
    const outcome = {
      action, projectAmount, clientRefundAmount: action === "refund_client" ? requestedAmount : action === "partial_refund" ? requestedAmount : 0,
      talentGrossAmount: action === "release_talent" ? requestedAmount : action === "partial_refund" ? projectAmount - requestedAmount : 0,
      adminNotes: String(adminNotes || "").slice(0, 5000), resolvedBy: decoded.uid,
    }
    const platformFee = outcome.talentGrossAmount > 0 ? Math.round(outcome.talentGrossAmount * 0.1) : 0
    const talentAmount = Math.max(0, outcome.talentGrossAmount - platformFee)
    await disputeRef.set({ status: "resolving", stage: "settlement", resolutionSummary: outcome, updatedAt: FieldValue.serverTimestamp() }, { merge: true })

    let talentResult: string | null = null
    let refundResult: string | null = null
    if (outcome.clientRefundAmount > 0) {
      if (!originalTransaction) throw new Error("The original Monnify transaction is missing, so this refund needs provider support")
      refundResult = `cw_refund_${crypto.randomBytes(10).toString("hex")}`
      await initiateMonnifyRefund({ transactionReference: originalTransaction, refundReference: refundResult, amount: outcome.clientRefundAmount, reason: "Resolved project dispute" })
      await workspaceRef.collection("refunds").doc(refundResult).set({ reference: refundResult, amount: outcome.clientRefundAmount, status: "processing", provider: "monnify", disputeId, createdAt: FieldValue.serverTimestamp() })
    }
    if (talentAmount > 0) {
      const payoutProfile = (await db.collection("payoutProfiles").doc(String(workspace.talentUid)).get()).data() as any
      const bank = payoutProfile?.bank
      if (!bank?.accountNumber || !bank?.bankCode || !bank?.accountName) throw new Error("The talent needs a verified payout bank account before payment can be sent")
      const sourceAccountNumber = process.env.MONNIFY_DISBURSEMENT_ACCOUNT_NUMBER
      if (!sourceAccountNumber) throw new Error("MONNIFY_DISBURSEMENT_ACCOUNT_NUMBER is not configured")
      talentResult = `cw_dispute_${crypto.randomBytes(10).toString("hex")}`
      const response = await initiateMonnifyDisbursement({ amount: talentAmount, reference: talentResult, narration: `Changeworker project payment`, destinationBankCode: String(bank.bankCode), destinationAccountNumber: String(bank.accountNumber), destinationAccountName: String(bank.accountName), sourceAccountNumber })
      await workspaceRef.collection("payouts").doc(talentResult).set({ reference: talentResult, amount: talentAmount, grossAmount: outcome.talentGrossAmount, platformFee, status: String(response.status || "PROCESSING").toLowerCase() === "success" ? "paid" : "processing", provider: "monnify", disputeId, createdAt: FieldValue.serverTimestamp(), transactionReference: response.transactionReference || null })
    }

    const resolutionStatus = action === "close_case" ? "closed" : "resolved"
    await Promise.all([
      disputeRef.set({ status: resolutionStatus, stage: "resolved", resolution: action, resolvedAt: FieldValue.serverTimestamp(), paymentReferences: { refundResult, talentResult }, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
      workspaceRef.set({ disputeStatus: resolutionStatus, payment: { ...(workspace.payment || {}), payoutStatus: talentAmount ? "processing" : workspace.payment?.payoutStatus || "not_started", refundStatus: outcome.clientRefundAmount ? "processing" : undefined, disputeResolution: { ...outcome, platformFee, talentAmount } }, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
    ])
    await Promise.all([
      dispute.clientUid && notifyUser({ userId: dispute.clientUid, type: "admin_decision", title: "Dispute resolved", message: outcome.clientRefundAmount ? `A refund of ${money(outcome.clientRefundAmount)} is being processed to the original payment method.` : "The dispute has been resolved. Review the case outcome.", link: `/dashboard/disputes/${disputeId}` }),
      dispute.talentUid && notifyUser({ userId: dispute.talentUid, type: "admin_decision", title: "Dispute resolved", message: talentAmount ? `A payment of ${money(talentAmount)} is being processed to your verified bank account.` : "The dispute has been resolved. Review the case outcome.", link: `/dashboard/disputes/${disputeId}` }),
    ])
    return NextResponse.json({ ok: true, outcome: { ...outcome, platformFee, talentAmount, refundReference: refundResult, payoutReference: talentResult } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unable to resolve dispute" }, { status: 500 })
  }
}
