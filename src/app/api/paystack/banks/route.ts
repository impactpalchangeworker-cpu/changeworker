import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: "Missing PAYSTACK_SECRET_KEY" }, { status: 500 })

    const resp = await fetch("https://api.paystack.co/bank?country=nigeria&perPage=200", {
      headers: { Authorization: `Bearer ${secret}` },
    })
    const json = await resp.json()

    if (!resp.ok || !json?.status) {
      console.error("[/api/paystack/banks] Paystack error:", json)
      return NextResponse.json({ error: "Failed to fetch banks", details: json }, { status: 400 })
    }

    // Return only what UI needs
    const banks = (json.data || []).map((b: any) => ({
      name: b.name,
      code: b.code,
      slug: b.slug,
    }))

    return NextResponse.json({ banks })
  } catch (e: any) {
    console.error("[/api/paystack/banks]", e)
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}
