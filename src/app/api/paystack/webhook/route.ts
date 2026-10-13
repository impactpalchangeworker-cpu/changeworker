import { NextResponse } from "next/server"
import crypto from "crypto"
import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
import admin from "firebase-admin"
import type { DocumentReference, Firestore, Transaction } from "firebase-admin/firestore"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"
import { getWorkspaceNotificationContext } from "@/lib/notifications/context"
import { confirmWalletTopup } from "@/lib/paystack/walletTopup"

export const runtime = "nodejs"

async function readRawBody(req: Request) {
  const arrayBuffer = await req.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function settleWithdrawalEvent(db: Firestore, event: any) {
  const reference = String(event?.data?.reference || "")
  const eventName = String(event?.event || "")
  if (!reference || !["transfer.success", "transfer.failed", "transfer.reversed"].includes(eventName)) return false

  const withdrawalMatches = await db
    .collectionGroup("withdrawals")
    .where(admin.firestore.FieldPath.documentId(), "==", reference)
    .limit(1)
    .get()
  if (withdrawalMatches.empty) return false

  const withdrawalRef = withdrawalMatches.docs[0].ref
  const walletRef = withdrawalRef.parent.parent
  if (!walletRef) return false

  const result = await db.runTransaction(async (tx: Transaction) => {
    const [withdrawalSnap, walletSnap] = await Promise.all([tx.get(withdrawalRef), tx.get(walletRef)])
    if (!withdrawalSnap.exists || !walletSnap.exists) return { changed: false, userId: "", amount: 0 }
    const withdrawal = withdrawalSnap.data() as any
    const wallet = walletSnap.data() as any
    const amount = Number(withdrawal?.amount || 0)
    const currentStatus = String(withdrawal?.status || "")
    if (!amount || ["paid", "failed", "reversed"].includes(currentStatus)) return { changed: false, userId: walletRef.id, amount }

    const transactionRef = walletRef.collection("transactions").doc(reference)
    if (eventName === "transfer.success") {
      tx.update(walletRef, {
        pendingBalance: Math.max(0, Number(wallet?.pendingBalance || 0) - amount),
        totalWithdrawn: Number(wallet?.totalWithdrawn || 0) + amount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      tx.set(withdrawalRef, {
        status: "paid",
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        paystackEvent: eventName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
      tx.set(transactionRef, { status: "paid", settlementStatus: "paid", updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      return { changed: true, userId: walletRef.id, amount, status: "paid" }
    }

    const status = eventName === "transfer.reversed" ? "reversed" : "failed"
    tx.update(walletRef, {
      availableBalance: Number(wallet?.availableBalance || 0) + amount,
      pendingBalance: Math.max(0, Number(wallet?.pendingBalance || 0) - amount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    tx.set(withdrawalRef, {
      status,
      paystackEvent: eventName,
      failureReason: String(event?.data?.reason || event?.data?.failure_reason || "Transfer was not completed"),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })
    tx.set(transactionRef, { status, settlementStatus: status, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
    tx.set(walletRef.collection("transactions").doc(`${reference}_${status}`), {
      type: "credit", reason: "withdrawal_reversal", amount, currency: "NGN", status: "completed",
      meta: { withdrawalId: reference, source: "paystack_webhook" }, createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })
    return { changed: true, userId: walletRef.id, amount, status }
  })

  if (result.changed) {
    const paid = result.status === "paid"
    await notifyUser({
      userId: result.userId,
      type: "withdrawal",
      title: paid ? "Withdrawal paid" : "Withdrawal returned to wallet",
      message: paid
        ? `Your withdrawal of ₦${result.amount.toLocaleString()} has been paid to your bank account.`
        : `Your withdrawal of ₦${result.amount.toLocaleString()} was not completed, so the money is available in your wallet again.`,
      link: "/dashboard/wallet",
    })
  }
  return true
}

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: "Missing PAYSTACK secret" }, { status: 500 })

  const signature = req.headers.get("x-paystack-signature") || ""
  const raw = await readRawBody(req)

  const hash = crypto.createHmac("sha512", secret).update(raw).digest("hex")
  if (hash !== signature) {
    console.error("[Paystack Webhook] Signature mismatch")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const event = JSON.parse(raw.toString("utf8"))
  console.log("[Paystack Webhook] Event received:", event.event, "Reference:", event?.data?.reference)
  console.log("[Paystack Webhook] Full event data:", JSON.stringify(event, null, 2))

  try {
    const adminDb = getAdminDb()
    const adminApp = getAdminApp()
    const db = adminDb

    if (await settleWithdrawalEvent(db, event)) {
      return NextResponse.json({ ok: true })
    }

    // We only handle charge.success for funding after transfer settlements.
    if (event?.event !== "charge.success") {
      console.log("[Paystack Webhook] Ignoring event type:", event?.event)
      return NextResponse.json({ ok: true })
    }

    const reference = String(event?.data?.reference || "")
    const metadata = event?.data?.metadata || {}
    const wsId = String(metadata?.wsId || "")
    const walletUid = String(metadata?.walletUid || "")
    const paymentType = String(metadata?.type || "workspace_funding")

    console.log("[Paystack Webhook] charge.success - wsId:", wsId, "reference:", reference)

    if (!reference || (!wsId && !walletUid)) {
      console.warn("[Paystack Webhook] Missing reference or wsId")
      return NextResponse.json({ ok: true })
    }

    // Verify with Paystack to be safe
    const verifyResp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    })
    
    const verifyText = await verifyResp.text()
    let verifyJson
    try {
      verifyJson = JSON.parse(verifyText)
    } catch (e) {
      console.error("[Paystack Verify Webhook] JSON parse failed:", e, "Text:", verifyText.substring(0, 200))
      return NextResponse.json({ ok: true })
    }
    
    if (!verifyResp.ok || !verifyJson?.status || verifyJson?.data?.status !== "success") {
      return NextResponse.json({ ok: true })
    }

    const paidKobo = Number(verifyJson.data.amount || 0)
    const paidNaira = paidKobo / 100

    if (paymentType === "wallet_topup" && walletUid) {
      await confirmWalletTopup({
        db,
        reference,
        walletUid,
        amount: paidNaira,
        source: "paystack_webhook",
      })

      return NextResponse.json({ ok: true })
    }

    const payRef = db.doc(`workspaces/${wsId}/payments/${reference}`) as DocumentReference
    console.log("[Paystack Webhook] Updating payment and workspace status...")

    // Update payment doc + workspace escrow status (store Paystack event id for audit)
    const wsRef = db.doc(`workspaces/${wsId}`) as DocumentReference
    let funded = false
    await db.runTransaction(async (tx: Transaction) => {
      const eventId = String(event?.id || "")
      const paySnap = await tx.get(payRef)
      const wsSnap = await tx.get(wsRef)

      if (paySnap.exists && (paySnap.data() as any)?.status === "funded") return
      if (!wsSnap.exists) throw new Error("Workspace not found")

      funded = true

      tx.set(
        payRef,
        {
          reference,
          amount: paidNaira,
          currency: "NGN",
          status: "funded",
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          paystackEventId: eventId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      tx.set(
        wsRef,
        {
          payment: {
            status: "funded",
            fundedAt: admin.firestore.FieldValue.serverTimestamp(),
            fundedBy: "paystack_webhook",
            reference,
            amount: paidNaira,
            escrow: true,
          },
          status: "active",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      // Write escrow ledger entry for funding
      const escrowLedgerRef = db.collection(`workspaces/${wsId}/escrowLedger`).doc()
      tx.set(escrowLedgerRef, {
        type: "hold",
        reference,
        amount: paidNaira,
        currency: "NGN",
        paystackEventId: eventId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    if (!funded) {
      console.log("[Paystack Webhook] Payment already funded, skipping")
      return NextResponse.json({ ok: true })
    }

    console.log("[Paystack Webhook] Payment and workspace updated successfully")

    // Notify client and talent that workspace is funded
    const wsSnap = await wsRef.get()
    const ws = wsSnap.data() as any
    const clientUid = ws?.clientUid
    const talentUid = ws?.talentUid

    const context = await getWorkspaceNotificationContext(wsId)

    if (clientUid) {
      await notifyUser({
        userId: clientUid,
        type: "workspace_funded",
        title: "Workspace funded",
        message: `Your payment for ${context?.gigTitle || "this workspace"} has been confirmed and work can now begin.`,
        link: `/dashboard/workspaces/${wsId}`,
      })
    }

    if (talentUid) {
      await notifyUser({
        userId: talentUid,
        type: "workspace_funded",
        title: "Workspace funded",
        message: `${context?.clientName || "Client"} funded ${context?.gigTitle || "your workspace"} and you can now start work.`,
        link: `/dashboard/workspaces/${wsId}`,
      })
    }

    // notify admins as well
    try {
      await notifyAdmins({
        type: "admin:workspace",
        title: "Workspace funded",
        message: `${context?.clientName || "Client"} funded ${context?.gigTitle || "a workspace"} with ${context?.talentName || "the talent"}.`,
        link: `/admin/workspaces/${wsId}`,
      })
    } catch (err) {
      console.error("admin notify workspace funded failed", err)
    }

    // Client spend tally (wallet)
    const walletRef = db.doc(`wallets/${clientUid}`)
    if (clientUid) {
      await db.runTransaction(async (tx: Transaction) => {
        const wSnap = (await tx.get(walletRef)) as any
        const existing = wSnap?.exists ? (wSnap.data() as any) : {}
        tx.set(
          walletRef,
          {
            uid: clientUid,
            role: "client",
            totalSpent: Number(existing.totalSpent || 0) + paidNaira,
            totalWorkspaceFunded: Number((existing.totalWorkspaceFunded ?? existing.totalSpent) || 0) + paidNaira,
            totalDirectWorkspaceFunded: Number(existing.totalDirectWorkspaceFunded || 0) + paidNaira,
            totalFundingReceived: Number(existing.totalFundingReceived ?? (Number(existing.totalLoaded || 0) + Number(existing.totalSpent || 0))) + paidNaira,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: existing.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
        tx.set(walletRef.collection("transactions").doc(reference), {
          type: "debit",
          reason: "workspace_funding",
          amount: paidNaira,
          currency: "NGN",
          status: "completed",
          meta: { wsId, reference },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[paystack webhook] error", e)
    return NextResponse.json({ ok: true })
  }
}
