import { NextResponse } from "next/server"
import crypto from "crypto"
import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
import admin from "firebase-admin"
import type { DocumentReference, Firestore, Transaction } from "firebase-admin/firestore"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"
import { settleWithdrawal } from "@/lib/paystack/withdrawalSettlement"

export const runtime = "nodejs"

function setPaymentCookie(response: NextResponse, reference: string, maxAge = 60 * 60 * 2) {
  response.cookies.set("pstk_withdraw_reference", reference, {
    path: "/",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
  })
}

async function parsePaystackResponse(resp: Response) {
  const text = await resp.text()
  try {
    return JSON.parse(text)
  } catch {
    return {
      status: false,
      message: text || "Paystack returned an invalid response",
    }
  }
}

async function createTransferRecipient(secret: string, bank: any) {
  const recipientResp = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "nuban",
      name: bank.accountName,
      account_number: bank.accountNumber,
      bank_code: bank.bankCode,
      currency: "NGN",
    }),
  })

  const recipientJson = await parsePaystackResponse(recipientResp)
  if (!recipientResp.ok || !recipientJson?.status || !recipientJson?.data?.recipient_code) {
    throw new Error(recipientJson?.message || "Unable to create transfer recipient")
  }

  return String(recipientJson.data.recipient_code)
}

async function initiateTransfer(secret: string, recipientCode: string, amountNaira: number, withdrawalId: string) {
  const transferResp = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "balance",
      amount: Math.round(amountNaira * 100),
      recipient: recipientCode,
      reason: "changeworker withdrawal",
      reference: withdrawalId,
    }),
  })

  const transferJson = await parsePaystackResponse(transferResp)
  return { transferResp, transferJson }
}

async function returnReservedWithdrawalFunds(
  db: Firestore,
  walletRef: DocumentReference,
  withdrawalId: string,
  amount: number,
  error: unknown,
  status: "failed" | "reversed" = "failed"
) {
  await db.runTransaction(async (tx: Transaction) => {
    const [walletSnap, withdrawalSnap] = await Promise.all([
      tx.get(walletRef),
      tx.get(walletRef.collection("withdrawals").doc(withdrawalId)),
    ])
    const withdrawal = withdrawalSnap.data() as any
    if (!withdrawalSnap.exists || ["failed", "reversed"].includes(String(withdrawal?.status || ""))) return

    const wallet = walletSnap.data() as any
    tx.update(walletRef, {
      availableBalance: Number(wallet?.availableBalance || 0) + amount,
      pendingBalance: Math.max(0, Number(wallet?.pendingBalance || 0) - amount),
      totalWithdrawn: withdrawal?.status === "paid"
        ? Math.max(0, Number(wallet?.totalWithdrawn || 0) - amount)
        : Number(wallet?.totalWithdrawn || 0),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    tx.set(walletRef.collection("withdrawals").doc(withdrawalId), {
      status,
      error: error instanceof Error ? error.message : String(error || "Transfer failed"),
      reversedAt: status === "reversed" ? admin.firestore.FieldValue.serverTimestamp() : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })
    tx.set(walletRef.collection("transactions").doc(withdrawalId), {
      status,
      settlementStatus: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })
    tx.set(walletRef.collection("transactions").doc(`${withdrawalId}_${status}`), {
      type: "credit",
      reason: "withdrawal_reversal",
      amount,
      currency: "NGN",
      status: "completed",
      meta: { withdrawalId, source: "paystack" },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })
  })
}

export async function POST(req: Request) {
  let reservedWalletRef: DocumentReference | null = null
  let reservedWithdrawalId = ""
  let reservedAmount = 0
  try {
    const adminDb = getAdminDb()
    const adminApp = getAdminApp()
    const { amount } = await req.json()
    const amountNaira = Number(amount || 0)

    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = await adminApp.auth().verifyIdToken(token)
    const uid = decoded.uid

    if (!amountNaira || amountNaira < 1000) {
      return NextResponse.json({ error: "Minimum withdrawal is ₦1,000" }, { status: 400 })
    }

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: "Missing PAYSTACK_SECRET_KEY" }, { status: 500 })

    const db = adminDb
    const walletRef = db.doc(`wallets/${uid}`)

    const withdrawalId = `wd_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`
    reservedWalletRef = walletRef
    reservedWithdrawalId = withdrawalId
    reservedAmount = amountNaira

    await db.runTransaction(async (tx: Transaction) => {
      const wSnap = (await tx.get(walletRef)) as any
      if (!wSnap?.exists) throw new Error("Wallet not found")
      const w = wSnap.data() as any
      if (!["talent", "client"].includes(String(w.role))) throw new Error("Only talent and client wallets can withdraw")
      if (!w.bank?.recipientCode) throw new Error("Add & verify bank account first")

      const avail = Number(w.availableBalance || 0)
      if (amountNaira > avail) throw new Error("Insufficient balance")

      // move to pending
      tx.update(walletRef, {
        availableBalance: avail - amountNaira,
        pendingBalance: Number(w.pendingBalance || 0) + amountNaira,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      tx.set(walletRef.collection("withdrawals").doc(withdrawalId), {
        amount: amountNaira,
        status: "requested",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      tx.set(walletRef.collection("transactions").doc(withdrawalId), {
        type: "debit",
        reason: "withdrawal",
        amount: amountNaira,
        currency: "NGN",
        status: "pending",
        meta: { withdrawalId },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    // initiate Paystack transfer
    const wSnap2 = await walletRef.get()
    const w2 = wSnap2.data() as any

    let recipientCode = String(w2?.bank?.recipientCode || "")
    if (!recipientCode && w2?.bank?.accountNumber && w2?.bank?.bankCode && w2?.bank?.accountName) {
      recipientCode = await createTransferRecipient(secret, w2.bank)
      await walletRef.set(
        {
          bank: {
            ...w2.bank,
            recipientCode,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    }

    let { transferResp, transferJson } = await initiateTransfer(secret, recipientCode, amountNaira, withdrawalId)

    if (
      (!transferResp.ok || !transferJson?.status) &&
      String(transferJson?.message || "").toLowerCase().includes("recipient") &&
      w2?.bank?.accountNumber &&
      w2?.bank?.bankCode &&
      w2?.bank?.accountName
    ) {
      recipientCode = await createTransferRecipient(secret, w2.bank)
      await walletRef.set(
        {
          bank: {
            ...w2.bank,
            recipientCode,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      ;({ transferResp, transferJson } = await initiateTransfer(secret, recipientCode, amountNaira, withdrawalId))
    }

    if (!transferResp.ok || !transferJson?.status) {
      // rollback pending -> available
      await returnReservedWithdrawalFunds(db, walletRef, withdrawalId, amountNaira, transferJson)

      return NextResponse.json(
        {
          error: transferJson?.message || "Transfer failed",
          details: transferJson,
        },
        { status: 400 }
      )
    }

    const withdrawalRef = walletRef.collection("withdrawals").doc(withdrawalId)
    await withdrawalRef.set(
      {
        status: "processing",
        paystack: {
          transferCode: transferJson.data.transfer_code,
          reference: withdrawalId,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    await walletRef.collection("transactions").doc(withdrawalId).set({
      status: "processing",
      settlementStatus: "processing",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })

    const transferStatus = String(transferJson?.data?.status || "").toLowerCase()
    if (transferStatus === "success" || transferStatus === "successful") {
      await settleWithdrawal(db, withdrawalRef, "paid", { eventName: "transfer.success" })
    } else if (["failed", "reversed"].includes(transferStatus)) {
      await settleWithdrawal(db, withdrawalRef, transferStatus as "failed" | "reversed", {
        eventName: `transfer.${transferStatus}`,
        failureReason: String(transferJson?.data?.reason || transferJson?.data?.failure_reason || "Transfer was not completed"),
      })
    }

    const roleLabel = String(w2?.role || "user") === "client" ? "Client" : "Talent"

    // Send notification for withdrawal request
    await notifyUser({
      userId: uid,
      type: "withdrawal",
      title: transferStatus === "success" || transferStatus === "successful" ? "Withdrawal paid" : "Withdrawal requested",
      message: transferStatus === "success" || transferStatus === "successful"
        ? `Your withdrawal of ₦${amountNaira.toLocaleString()} has been paid to your bank account.`
        : `Your withdrawal of ₦${amountNaira.toLocaleString()} has been requested.`,
      link: `/dashboard/wallet`,
    })

    // also notify admins
    try {
      await notifyAdmins({
        type: "admin:withdrawal",
        title: "Withdrawal requested",
        message: `${roleLabel} ${uid} has requested withdrawal of NGN ${amountNaira.toLocaleString()}.`,
        link: `/admin/wallets`,
      })
    } catch (err) {
      console.error("admin notify withdrawal failed", err)
    }

    const response = NextResponse.json({ ok: true, withdrawalId })
    setPaymentCookie(response, withdrawalId)
    return response
  } catch (e: any) {
    console.error(e)
    if (reservedWalletRef && reservedWithdrawalId && reservedAmount > 0) {
      try {
        await returnReservedWithdrawalFunds(getAdminDb(), reservedWalletRef, reservedWithdrawalId, reservedAmount, e)
      } catch (rollbackError) {
        console.error("withdrawal rollback failed", rollbackError)
      }
    }
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

