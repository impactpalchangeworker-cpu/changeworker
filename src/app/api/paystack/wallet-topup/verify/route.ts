import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { confirmWalletTopup } from "@/lib/paystack/walletTopup"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { reference } = await req.json()
    if (!reference || typeof reference !== "string") {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
    }

    const app = getAdminApp()
    const decoded = await app.auth().verifyIdToken(token)
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: "Payment service is unavailable" }, { status: 500 })

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    })
    const verified = await verifyResponse.json()
    const data = verified?.data

    if (!verifyResponse.ok || !verified?.status || data?.status !== "success") {
      // A browser can return before Paystack has finished processing. This is not an error.
      return NextResponse.json({ ok: true, pending: true })
    }
    if (String(data?.metadata?.type || "") !== "wallet_topup" || String(data?.metadata?.walletUid || "") !== decoded.uid) {
      return NextResponse.json({ error: "This payment does not belong to this wallet" }, { status: 403 })
    }

    const result = await confirmWalletTopup({
      db: getAdminDb(),
      reference,
      walletUid: decoded.uid,
      amount: Number(data?.amount || 0) / 100,
      source: "paystack_callback",
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error: any) {
    console.error("[/api/paystack/wallet-topup/verify]", error)
    return NextResponse.json({ error: error?.message || "Unable to confirm wallet top-up" }, { status: 500 })
  }
}
