import crypto from "crypto"
import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { createPaystackRecipient, initiatePaystackTransfer } from "@/lib/paystack"
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
    let refundStatus = "processing"
    if (outcome.clientRefundAmount > 0) {
      const clientProfile = (await db.collection("payoutProfiles").doc(String(dispute.clientUid)).get()).data() as any
      const clientBank = clientProfile?.bank
      if (!clientBank?.accountNumber || !clientBank?.bankCode || !clientBank?.accountName) {
        throw new Error("The client needs a verified refund bank account before a refund can be sent")
      }
      refundResult = `cw_refund_${crypto.randomBytes(10).toString("hex")}`
      const recipient = clientBank.recipientCode || (await createPaystackRecipient({ name: String(clientBank.accountName), accountNumber: String(clientBank.accountNumber), bankCode: String(clientBank.bankCode) })).recipient_code
      const response = await initiatePaystackTransfer({ amount: outcome.clientRefundAmount, reference: refundResult, recipient, reason: "Changeworker project refund" })
      const transferStatus = String(response.status || "processing").toLowerCase()
      refundStatus = ["success", "successful"].includes(transferStatus) ? "paid" : "processing"
      await workspaceRef.collection("refunds").doc(refundResult).set({ reference: refundResult, amount: outcome.clientRefundAmount, status: refundStatus, provider: "paystack_transfer", disputeId, recipientCode: recipient, transferCode: response.transfer_code || null, createdAt: FieldValue.serverTimestamp() })
    }
    if (talentAmount > 0) {
      talentResult = `cw_dispute_${crypto.randomBytes(10).toString("hex")}`
      const walletRef = db.collection("wallets").doc(String(workspace.talentUid))
      await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
        const walletSnap = (await tx.getAll(walletRef))[0]
        const wallet = walletSnap.exists ? (walletSnap.data() as any) : {}
        tx.set(workspaceRef.collection("payouts").doc(talentResult), { reference: talentResult, amount: talentAmount, grossAmount: outcome.talentGrossAmount, platformFee, status: "paid", settlement: "wallet_credit", disputeId, createdAt: FieldValue.serverTimestamp() })
        tx.set(walletRef, { uid: workspace.talentUid, role: "talent", availableBalance: Number(wallet.availableBalance || 0) + talentAmount, totalEarned: Number(wallet.totalEarned || 0) + talentAmount, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
        tx.set(walletRef.collection("transactions").doc(talentResult), { type: "credit", reason: "dispute_payout", amount: talentAmount, currency: "NGN", status: "completed", workspaceId: workspace.id || dispute.workspaceId, reference: talentResult, platformFee, disputeId, createdAt: FieldValue.serverTimestamp() })
      })
    }

    const resolutionStatus = action === "close_case" ? "closed" : "resolved"
    const paymentUpdate: Record<string, unknown> = {
      ...(workspace.payment || {}),
      payoutStatus: talentAmount ? "processing" : workspace.payment?.payoutStatus || "not_started",
      disputeResolution: { ...outcome, platformFee, talentAmount },
    }
    if (outcome.clientRefundAmount > 0) paymentUpdate.refundStatus = refundStatus
    if (refundResult) paymentUpdate.refundReference = refundResult
    if (talentResult) paymentUpdate.payoutReference = talentResult
    await Promise.all([
      disputeRef.set({ status: resolutionStatus, stage: "resolved", resolution: action, resolvedAt: FieldValue.serverTimestamp(), paymentReferences: { ...(refundResult ? { refundResult } : {}), ...(talentResult ? { talentResult } : {}) }, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
      workspaceRef.set({ disputeStatus: resolutionStatus, payment: paymentUpdate, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
    ])
    await Promise.all([
      dispute.clientUid && notifyUser({ userId: dispute.clientUid, type: "admin_decision", title: "Dispute resolved", message: outcome.clientRefundAmount ? `A refund of ${money(outcome.clientRefundAmount)} is being sent to your verified bank account.` : "The dispute has been resolved. Review the case outcome.", link: `/dashboard/disputes/${disputeId}` }),
      dispute.talentUid && notifyUser({ userId: dispute.talentUid, type: "admin_decision", title: "Dispute resolved", message: talentAmount ? `${money(talentAmount)} has been added to your wallet.` : "The dispute has been resolved. Review the case outcome.", link: `/dashboard/wallet` }),
    ])
    return NextResponse.json({ ok: true, outcome: { ...outcome, platformFee, talentAmount, refundReference: refundResult, payoutReference: talentResult } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unable to resolve dispute" }, { status: 500 })
  }
}
