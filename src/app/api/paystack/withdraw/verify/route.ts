import { NextResponse } from "next/server"
import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
import admin from "firebase-admin"
import { settleWithdrawal } from "@/lib/paystack/withdrawalSettlement"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { withdrawalId } = await req.json()
    if (!withdrawalId) return NextResponse.json({ error: "Missing withdrawalId" }, { status: 400 })

    const adminApp = getAdminApp()
    const decoded = await adminApp.auth().verifyIdToken(token)
    const db = getAdminDb()
    const matches = await db
      .collectionGroup("withdrawals")
      .where(admin.firestore.FieldPath.documentId(), "==", String(withdrawalId))
      .limit(1)
      .get()
    if (matches.empty) return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 })

    const withdrawalRef = matches.docs[0].ref
    const walletRef = withdrawalRef.parent.parent
    if (!walletRef || walletRef.id !== decoded.uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const withdrawal = matches.docs[0].data() as any
    const transferCode = String(withdrawal?.paystack?.transferCode || "")
    if (!transferCode) return NextResponse.json({ status: withdrawal?.status || "processing" })

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: "Missing PAYSTACK_SECRET_KEY" }, { status: 500 })
    const response = await fetch(`https://api.paystack.co/transfer/${encodeURIComponent(transferCode)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    })
    const data = await response.json()
    if (!response.ok || !data?.status) {
      return NextResponse.json({ error: data?.message || "Unable to verify transfer" }, { status: 502 })
    }

    const transferStatus = String(data?.data?.status || "").toLowerCase()
    if (["success", "successful"].includes(transferStatus)) {
      await settleWithdrawal(db, withdrawalRef, "paid", { eventName: "transfer.success" })
      return NextResponse.json({ status: "paid" })
    }
    if (["failed", "reversed"].includes(transferStatus)) {
      await settleWithdrawal(db, withdrawalRef, transferStatus as "failed" | "reversed", {
        eventName: `transfer.${transferStatus}`,
        failureReason: String(data?.data?.reason || data?.data?.failure_reason || "Transfer was not completed"),
      })
      return NextResponse.json({ status: transferStatus })
    }

    return NextResponse.json({ status: "processing" })
  } catch (error: any) {
    console.error("withdrawal verification failed", error)
    return NextResponse.json({ error: error?.message || "Unable to verify withdrawal" }, { status: 500 })
  }
}
