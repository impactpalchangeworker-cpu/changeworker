import { NextResponse } from "next/server"
import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
import admin from "firebase-admin"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const adminDb = getAdminDb()
    const adminApp = getAdminApp()
    const { accountNumber, bankCode, accountName, bankName } = await req.json()

    if (!accountNumber || String(accountNumber).length !== 10) {
      return NextResponse.json({ error: "Valid 10-digit accountNumber required" }, { status: 400 })
    }
    if (!bankCode) return NextResponse.json({ error: "bankCode required" }, { status: 400 })
    if (!accountName) return NextResponse.json({ error: "accountName required" }, { status: 400 })
    if (!bankName) return NextResponse.json({ error: "bankName required" }, { status: 400 })

    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = await adminApp.auth().verifyIdToken(token)
    const uid = decoded.uid

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: "Missing PAYSTACK_SECRET_KEY" }, { status: 500 })

    // Create recipient on Paystack
    const recipientResp = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "nuban",
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
      }),
    })

    const recipientText = await recipientResp.text()
    let recipientJson
    try {
      recipientJson = JSON.parse(recipientText)
    } catch (e) {
      console.error("[/api/paystack/create-recipient] JSON parse failed:", e)
      return NextResponse.json(
        { error: "Paystack returned invalid JSON", text: recipientText.substring(0, 200) },
        { status: 500 }
      )
    }

    if (!recipientResp.ok || !recipientJson?.status) {
      return NextResponse.json({ error: "Recipient create failed", details: recipientJson }, { status: 400 })
    }

    // Save to wallet
    await adminDb.doc(`wallets/${uid}`).set(
      {
        bank: {
          accountNumber,
          bankCode,
          bankName,
          accountName,
          recipientCode: recipientJson.data.recipient_code,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({
      ok: true,
      recipientCode: recipientJson.data.recipient_code,
    })
  } catch (e: any) {
    console.error("[/api/paystack/create-recipient]", e)
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}
