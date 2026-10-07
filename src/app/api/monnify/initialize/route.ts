import crypto from "crypto"
import admin from "firebase-admin"
import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { initializeMonnifyTransaction } from "@/lib/monnify"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { wsId } = await req.json() as { wsId?: string }
    if (!wsId) return NextResponse.json({ error: "Workspace is required" }, { status: 400 })

    const decoded = await getAdminApp().auth().verifyIdToken(token)
    const db = getAdminDb()
    const workspaceRef = db.collection("workspaces").doc(wsId)
    const workspaceSnap = await workspaceRef.get()
    if (!workspaceSnap.exists) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    const workspace = workspaceSnap.data() as any
    if (workspace.clientUid !== decoded.uid) return NextResponse.json({ error: "Only the client can fund this project" }, { status: 403 })
    if (workspace.payment?.status === "funded") return NextResponse.json({ error: "Project payment has already been confirmed" }, { status: 409 })

    const threadId = String(workspace.threadId || workspace.chatThreadId || "")
    const agreementSnap = threadId ? await db.doc(`threads/${threadId}/agreement/current`).get() : null
    const agreement = agreementSnap?.data() as any
    const agreedAmount = Number(agreement?.terms?.amountAgreed || 0)
    const hours = Number(agreement?.terms?.hoursDuration || 0)
    const amount = String(agreement?.terms?.billingType || "fixed") === "hourly" ? agreedAmount * hours : agreedAmount
    if (!amount || amount < 100) return NextResponse.json({ error: "The agreed project amount is invalid" }, { status: 400 })

    const user = (await db.collection("users").doc(decoded.uid).get()).data() as any
    const email = String(user?.email || decoded.email || "")
    if (!email) return NextResponse.json({ error: "A client email is required to continue" }, { status: 400 })

    const reference = `cw_project_${crypto.randomBytes(10).toString("hex")}`
    await workspaceRef.collection("payments").doc(reference).set({
      reference, amount, currency: "NGN", status: "initiated", provider: "monnify", createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")
    const result = await initializeMonnifyTransaction({
      amount, customerEmail: email, customerName: String(user?.fullName || user?.displayName || "Changeworker client"), reference,
      description: `Project payment for ${workspace.gigTitle || "Changeworker workspace"}`,
      redirectUrl: `${appUrl}/dashboard/workspaces/${wsId}?payment=processing`, metadata: { workspaceId: wsId, type: "project_payment" },
    })
    if (!result.checkoutUrl) throw new Error("Monnify did not return a checkout URL")
    await workspaceRef.collection("payments").doc(reference).set({ monnifyTransactionReference: result.transactionReference || null, checkoutUrl: result.checkoutUrl, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
    return NextResponse.json({ checkoutUrl: result.checkoutUrl, reference, amount })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unable to initialize project payment" }, { status: 500 })
  }
}
