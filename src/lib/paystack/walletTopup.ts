import admin from "firebase-admin"
import type { Firestore, Transaction } from "firebase-admin/firestore"

type ConfirmWalletTopupInput = {
  db: Firestore
  reference: string
  walletUid: string
  amount: number
  source: "paystack_webhook" | "paystack_callback"
}

/** Credits a verified Paystack top-up once, regardless of webhook retries or browser returns. */
export async function confirmWalletTopup({
  db,
  reference,
  walletUid,
  amount,
  source,
}: ConfirmWalletTopupInput) {
  const walletRef = db.doc(`wallets/${walletUid}`)
  const walletTxRef = walletRef.collection("transactions").doc(reference)
  const topupRef = walletRef.collection("topups").doc(reference)

  return db.runTransaction(async (tx: Transaction) => {
    const [walletSnap, walletTxSnap, topupSnap] = await Promise.all([
      tx.get(walletRef),
      tx.get(walletTxRef),
      tx.get(topupRef),
    ])

    if (!walletTxSnap.exists || !topupSnap.exists) {
      throw new Error("Wallet top-up reference was not found")
    }

    const priorTopup = topupSnap.data() as any
    const expectedAmount = Number(priorTopup?.amount || walletTxSnap.data()?.amount || 0)
    if (!expectedAmount || Math.abs(expectedAmount - amount) > 0.01) {
      throw new Error("Paid amount does not match the wallet top-up request")
    }

    // Paystack can resend webhooks and users may return before it arrives.
    if (priorTopup?.status === "funded") return { credited: false, amount: expectedAmount }

    const walletData = walletSnap.exists ? (walletSnap.data() as any) : {}
    const previousAccountFunding = Number(
      walletData?.totalFundingReceived ??
        (Number(walletData?.totalLoaded || 0) + Number((walletData?.totalDirectWorkspaceFunded ?? walletData?.totalSpent) || 0))
    )
    tx.set(
      walletRef,
      {
        uid: walletUid,
        role: String(walletData?.role || "client"),
        availableBalance: Number(walletData?.availableBalance || 0) + expectedAmount,
        totalLoaded: Number(walletData?.totalLoaded || 0) + expectedAmount,
        totalFundingReceived: previousAccountFunding + expectedAmount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: walletData?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    tx.set(
      walletTxRef,
      {
        type: "credit",
        reason: "wallet_topup",
        amount: expectedAmount,
        currency: "NGN",
        status: "completed",
        meta: { reference, confirmedBy: source },
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    tx.set(
      topupRef,
      {
        amount: expectedAmount,
        currency: "NGN",
        status: "funded",
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        confirmedBy: source,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return { credited: true, amount: expectedAmount }
  })
}
