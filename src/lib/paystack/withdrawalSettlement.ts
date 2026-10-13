import admin from "firebase-admin"
import type { DocumentReference, Firestore, Transaction } from "firebase-admin/firestore"

export type WithdrawalSettlementStatus = "paid" | "failed" | "reversed"

export async function settleWithdrawal(
  db: Firestore,
  withdrawalRef: DocumentReference,
  status: WithdrawalSettlementStatus,
  details: { eventName?: string; failureReason?: string } = {}
) {
  const walletRef = withdrawalRef.parent.parent
  if (!walletRef) return { changed: false, userId: "", amount: 0, status }

  return db.runTransaction(async (tx: Transaction) => {
    const [withdrawalSnap, walletSnap] = await Promise.all([tx.get(withdrawalRef), tx.get(walletRef)])
    if (!withdrawalSnap.exists || !walletSnap.exists) return { changed: false, userId: walletRef.id, amount: 0, status }

    const withdrawal = withdrawalSnap.data() as any
    const wallet = walletSnap.data() as any
    const amount = Number(withdrawal?.amount || 0)
    const currentStatus = String(withdrawal?.status || "")
    if (!amount || ["paid", "failed", "reversed"].includes(currentStatus)) {
      return { changed: false, userId: walletRef.id, amount, status: currentStatus || status }
    }

    const transactionRef = walletRef.collection("transactions").doc(withdrawalRef.id)
    if (status === "paid") {
      tx.update(walletRef, {
        pendingBalance: Math.max(0, Number(wallet?.pendingBalance || 0) - amount),
        totalWithdrawn: Number(wallet?.totalWithdrawn || 0) + amount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      tx.set(withdrawalRef, {
        status: "paid",
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        paystackEvent: details.eventName || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
      tx.set(transactionRef, { status: "paid", settlementStatus: "paid", updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
    } else {
      tx.update(walletRef, {
        availableBalance: Number(wallet?.availableBalance || 0) + amount,
        pendingBalance: Math.max(0, Number(wallet?.pendingBalance || 0) - amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      tx.set(withdrawalRef, {
        status,
        paystackEvent: details.eventName || null,
        failureReason: details.failureReason || "Transfer was not completed",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
      tx.set(transactionRef, { status, settlementStatus: status, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      tx.set(walletRef.collection("transactions").doc(`${withdrawalRef.id}_${status}`), {
        type: "credit",
        reason: "withdrawal_reversal",
        amount,
        currency: "NGN",
        status: "completed",
        meta: { withdrawalId: withdrawalRef.id, source: "paystack" },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
    }

    return { changed: true, userId: walletRef.id, amount, status }
  })
}
