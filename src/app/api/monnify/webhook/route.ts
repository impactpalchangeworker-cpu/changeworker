import admin from "firebase-admin"
import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { hasValidMonnifySignature, verifyMonnifyTransaction } from "@/lib/monnify"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const rawBody = Buffer.from(await req.arrayBuffer())
  const signature = req.headers.get("monnify-signature") || ""
  if (process.env.NODE_ENV === "production" && !hasValidMonnifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }
  try {
    const event = JSON.parse(rawBody.toString("utf8")) as any
    const eventType = String(event.eventType || "")
    const data = event.eventData || {}
    const reference = String(data.paymentReference || data.reference || "")
    const db = getAdminDb()

    if (eventType === "SUCCESSFUL_TRANSACTION" && reference) {
      const match = await db.collectionGroup("payments").where("reference", "==", reference).limit(1).get()
      if (!match.empty) {
        const paymentRef = match.docs[0].ref
        const workspaceRef = paymentRef.parent.parent!
        const payment = paymentRef.data() as any
        const verified = await verifyMonnifyTransaction(reference)
        const amountPaid = Number(verified.amountPaid || 0)
        if (verified.paymentStatus === "PAID" && amountPaid >= Number(payment.amount || 0)) {
          let didConfirm = false
          await db.runTransaction(async (tx: admin.firestore.Transaction) => {
            const latestPayment = await tx.get(paymentRef as unknown as admin.firestore.DocumentReference)
            if (latestPayment.data()?.status === "funded") return
            didConfirm = true
            tx.set(paymentRef, { status: "funded", paidAt: admin.firestore.FieldValue.serverTimestamp(), monnifyTransactionReference: verified.transactionReference || data.transactionReference || null, paymentMethod: verified.paymentMethod || data.paymentMethod || null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
            tx.set(workspaceRef, { payment: { status: "funded", amount: Number(payment.amount || amountPaid), reference, provider: "monnify", fundedAt: admin.firestore.FieldValue.serverTimestamp() }, status: "active", updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
          })
          if (didConfirm) {
            const workspace = (await workspaceRef.get()).data() as any
            await Promise.all([workspace?.clientUid && notifyUser({ userId: workspace.clientUid, type: "workspace_funded", title: "Project payment confirmed", message: "Your payment is confirmed. Work can now begin.", link: `/dashboard/workspaces/${workspaceRef.id}` }), workspace?.talentUid && notifyUser({ userId: workspace.talentUid, type: "workspace_funded", title: "Project payment confirmed", message: "The project payment is confirmed. You can now begin work.", link: `/dashboard/workspaces/${workspaceRef.id}` })])
          }
        }
      }
    }

    if (["SUCCESSFUL_DISBURSEMENT", "FAILED_DISBURSEMENT", "REVERSED_DISBURSEMENT"].includes(eventType)) {
      const payoutReference = String(data.reference || data.paymentReference || "")
      const match = payoutReference ? await db.collectionGroup("payouts").where("reference", "==", payoutReference).limit(1).get() : null
      if (match && !match.empty) {
        const payoutRef = match.docs[0].ref
        const status = eventType === "SUCCESSFUL_DISBURSEMENT" ? "paid" : eventType === "REVERSED_DISBURSEMENT" ? "reversed" : "failed"
        await payoutRef.set({ status, providerStatus: data.status || status, transactionReference: data.transactionReference || null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
        await payoutRef.parent.parent?.set({ payment: { payoutStatus: status, payoutReference: payoutRef.id, payoutUpdatedAt: admin.firestore.FieldValue.serverTimestamp() }, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      }
    }
    if (["SUCCESSFUL_REFUND", "FAILED_REFUND"].includes(eventType)) {
      const refundReference = String(data.refundReference || "")
      const match = refundReference ? await db.collectionGroup("refunds").where("reference", "==", refundReference).limit(1).get() : null
      if (match && !match.empty) {
        const refundRef = match.docs[0].ref
        const status = eventType === "SUCCESSFUL_REFUND" ? "completed" : "failed"
        await refundRef.set({ status, providerStatus: data.refundStatus || null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
        await refundRef.parent.parent?.set({ payment: { refundStatus: status, refundReference: refundRef.id, refundUpdatedAt: admin.firestore.FieldValue.serverTimestamp() }, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      }
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[monnify webhook]", error)
    return NextResponse.json({ ok: true })
  }
}
