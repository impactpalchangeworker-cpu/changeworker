import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const adminApp = getAdminApp()
    const adminDb = getAdminDb()
    const { accountNumber, bankCode } = await req.json()

    if (!accountNumber || String(accountNumber).length !== 10) {
      return NextResponse.json({ error: "Valid 10-digit accountNumber required" }, { status: 400 })
    }
    if (!bankCode) return NextResponse.json({ error: "bankCode required" }, { status: 400 })

    // Optional: require auth (recommended)
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await adminApp.auth().verifyIdToken(token)

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: "Missing PAYSTACK_SECRET_KEY" }, { status: 500 })

    const url = `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(
      String(accountNumber)
    )}&bank_code=${encodeURIComponent(String(bankCode))}`

    const respText = await (await fetch(url, { headers: { Authorization: `Bearer ${secret}` } })).text()
    let json
    try {
      json = JSON.parse(respText)
    } catch (e) {
      console.error("[/api/paystack/resolve-bank] JSON parse failed:", e)
      return NextResponse.json({ error: "Paystack returned invalid JSON", text: respText.substring(0, 200) }, { status: 500 })
    }

    if (!json?.status) {
      return NextResponse.json({ error: "Resolve failed", details: json }, { status: 400 })
    }

    return NextResponse.json({
      accountName: json.data.account_name,
      accountNumber: json.data.account_number,
      bankId: json.data.bank_id,
    })
  } catch (e: any) {
    console.error("[/api/paystack/resolve-bank]", e)
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}
