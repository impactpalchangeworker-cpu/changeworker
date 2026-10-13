import crypto from "crypto"
import admin from "firebase-admin"
import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

function setPaymentCookie(response: NextResponse, reference: string, maxAge = 60 * 60 * 2) {
  response.cookies.set("pstk_wallet_reference", reference, {
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
    return { status: false, message: text || "Paystack returned an invalid response" }
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const adminApp = getAdminApp()
    const adminDb = getAdminDb()
    const decoded = await adminApp.auth().verifyIdToken(token)
    const uid = decoded.uid

    const { amount } = await req.json()
    const amountNaira = Number(amount || 0)
    if (!amountNaira || amountNaira < 10000) {
      return NextResponse.json({ error: "Minimum top-up is NGN 10,000" }, { status: 400 })
    }

    const userSnap = await adminDb.doc(`users/${uid}`).get()
    const userData = userSnap.data() as any
    const email = String(userData?.email || decoded.email || "")
    if (!email) return NextResponse.json({ error: "User email missing" }, { status: 400 })

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: "Missing PAYSTACK_SECRET_KEY" }, { status: 500 })

    const reference = `wt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`
    const walletRef = adminDb.doc(`wallets/${uid}`)
    const walletTxRef = walletRef.collection("transactions").doc(reference)
    const topupRef = walletRef.collection("topups").doc(reference)

    await walletTxRef.set({
      type: "credit",
      reason: "wallet_topup",
      amount: amountNaira,
      currency: "NGN",
      status: "pending",
      meta: { reference },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    await topupRef.set({
      amount: amountNaira,
      currency: "NGN",
      status: "initiated",
      reconciliationAttempts: 0,
      nextReconciliationAt: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    const initResp = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: Math.round(amountNaira * 100),
        reference,
        metadata: { walletUid: uid, type: "wallet_topup" },
        // Keep the user on the exact host where their Firebase session was created.
        callback_url: `${new URL(req.url).origin}/dashboard/wallet?topup=1&reference=${encodeURIComponent(reference)}`,
      }),
    })

    const json = await parsePaystackResponse(initResp)
    if (!initResp.ok || !json?.status) {
      await topupRef.set({ status: "failed", error: json, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      await walletTxRef.set({ status: "failed", updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      return NextResponse.json({ error: json?.message || "Failed to initialize top up", details: json }, { status: 400 })
    }

    await topupRef.set(
      {
        paystack: {
          authorizationUrl: json.data.authorization_url,
          accessCode: json.data.access_code,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    const response = NextResponse.json({
      authorizationUrl: json.data.authorization_url,
      reference,
      amount: amountNaira,
    })
    setPaymentCookie(response, reference)
    return response
  } catch (error: any) {
    console.error("[/api/paystack/wallet-topup]", error)
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 })
  }
}
