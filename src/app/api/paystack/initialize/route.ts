import { NextResponse } from "next/server"
import crypto from "crypto"
import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
import admin from "firebase-admin"

export const runtime = "nodejs"

function setPaymentCookie(response: NextResponse, reference: string, maxAge = 60 * 60 * 2) {
  response.cookies.set("pstk_reference", reference, {
    path: "/",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { wsId } = body as { wsId: string }

    if (!wsId) return NextResponse.json({ error: "wsId required" }, { status: 400 })

    // Auth: use Firebase ID token from Authorization: Bearer <token>
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const adminApp = getAdminApp()
    const adminDb = getAdminDb()
    const decoded = await adminApp.auth().verifyIdToken(token)
    const uid = decoded.uid

    const wsRef = adminDb.doc(`workspaces/${wsId}`)
    const wsSnap = await wsRef.get()
    if (!wsSnap.exists) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    const ws = wsSnap.data() as any

    if (ws.clientUid !== uid) return NextResponse.json({ error: "Client only" }, { status: 403 })

    // Find agreement via workspace.threadId - agreements are stored at threads/{threadId}/agreement/current
    const threadId = String(ws.threadId || ws.chatThreadId || "")
    if (!threadId) return NextResponse.json({ error: "Workspace missing threadId/chatThreadId to find agreement" }, { status: 400 })

    // Try agreement location: threads/{threadId}/agreement/current (NOT agreements/{threadId})
    const agreementSnap = await adminDb.doc(`threads/${threadId}/agreement/current`).get()
    if (!agreementSnap.exists) return NextResponse.json({ error: "Agreement not found for this workspace at threads/{threadId}/agreement/current" }, { status: 404 })
    const agreement = agreementSnap.data() as any

    // amountAgreed is nested in agreement.terms
    const amountAgreed = Number(agreement.terms?.amountAgreed || 0)
    if (!amountAgreed) {
      console.log("[Paystack Initialize] Agreement invalid:", {
        agreementStatus: agreement.status,
        amountAgreed: agreement.terms?.amountAgreed,
        agreementKeys: Object.keys(agreement),
        termsKeys: agreement.terms ? Object.keys(agreement.terms) : null,
      })
      return NextResponse.json({ 
        error: "agreement.terms.amountAgreed missing/invalid", 
        details: { status: agreement.status, amountAgreed: agreement.terms?.amountAgreed }
      }, { status: 400 })
    }

    const billingType = String(agreement.terms?.billingType || agreement.terms?.payType || "fixed")
    const hoursDuration = Number(agreement.terms?.hoursDuration || 0)
    const totalAmountNaira = billingType === "hourly" ? amountAgreed * hoursDuration : amountAgreed

    if (!totalAmountNaira || totalAmountNaira < 100) {
      return NextResponse.json({ error: "Computed total amount invalid" }, { status: 400 })
    }

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: "Missing PAYSTACK_SECRET_KEY" }, { status: 500 })

    // create a shorter, human-readable reference using gig title
    const rawTitle = String(ws?.gigTitle || "workspace").toLowerCase()
    const slug = rawTitle
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) // limit length
    const shortId = crypto.randomBytes(3).toString("hex")
    const reference = `ws_${slug}_${shortId}`
    await wsRef.collection("payments").doc(reference).set({
      reference,
      amount: totalAmountNaira,
      currency: "NGN",
      status: "initiated",
      reconciliationAttempts: 0,
      nextReconciliationAt: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // Determine client email (source of truth: users/{uid}.email)
    const userSnap = await adminDb.doc(`users/${uid}`).get()
    const clientEmail = String((userSnap.data() as any)?.email || decoded.email || "")
    if (!clientEmail) return NextResponse.json({ error: "Client email missing in users/{uid}.email" }, { status: 400 })

    const initResp = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: clientEmail,
        amount: Math.round(totalAmountNaira * 100),
        reference,
        metadata: { wsId, threadId, type: "workspace_funding", gigTitle: ws?.gigTitle || null },
        callback_url: `${new URL(req.url).origin}/dashboard/workspaces/${wsId}?payment=processing&reference=${encodeURIComponent(reference)}`,
      }),
    })

    const initText = await initResp.text()
    console.log("[Paystack Initialize] Response status:", initResp.status)
    console.log("[Paystack Initialize] Response text:", initText.substring(0, 200))

    let initJson
    try {
      initJson = JSON.parse(initText)
    } catch (parseErr) {
      console.error("[Paystack Initialize] JSON parse failed:", parseErr)
      return NextResponse.json({ error: "Paystack returned invalid JSON", text: initText.substring(0, 500) }, { status: 500 })
    }

    if (!initResp.ok || !initJson?.status) {
      await wsRef.collection("payments").doc(reference).set(
        { status: "failed", error: initJson, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      )
      return NextResponse.json({ error: "Paystack init failed", details: initJson }, { status: 400 })
    }

    await wsRef.collection("payments").doc(reference).set(
      {
        paystack: {
          authorizationUrl: initJson.data.authorization_url,
          accessCode: initJson.data.access_code,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    const response = NextResponse.json({ authorizationUrl: initJson.data.authorization_url, reference, amount: totalAmountNaira })
    setPaymentCookie(response, reference)
    return response
  } catch (e: any) {
    console.error("[/api/paystack/initialize]", e)
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}
