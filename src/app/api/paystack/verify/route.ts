import admin from "firebase-admin"
import type { Transaction } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { verifyPaystackTransaction } from "@/lib/paystack"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const header = req.headers.get("authorization") || ""
    if (!header.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = await getAdminApp().auth().verifyIdToken(header.slice(7)); const { workspaceId, reference } = await req.json() as { workspaceId?: string; reference?: string }
    if (!workspaceId) return NextResponse.json({ error: "Workspace is required" }, { status: 400 })
    const db = getAdminDb(); const workspaceRef = db.doc(`workspaces/${workspaceId}`); const workspaceSnap = await workspaceRef.get()
    if (!workspaceSnap.exists) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    const workspace = workspaceSnap.data() as any
    if (workspace.clientUid !== decoded.uid) return NextResponse.json({ error: "Only the client can verify this payment" }, { status: 403 })
    if (workspace.payment?.status === "funded") return NextResponse.json({ funded: true })
    const payments = reference
      ? await workspaceRef.collection("payments").where("reference", "==", reference).limit(1).get()
      : await workspaceRef.collection("payments").orderBy("createdAt", "desc").limit(1).get()
    if (payments.empty) return NextResponse.json({ funded: false, status: "not_started" })
    const paymentRef = payments.docs[0].ref; const payment = payments.docs[0].data() as any
    const verified = await verifyPaystackTransaction(String(payment.reference || paymentRef.id))
    const amount = Number(verified.amount || 0) / 100; const expected = Number(payment.amount || 0)
    if (String(verified.status || "").toLowerCase() !== "success" || amount < expected) return NextResponse.json({ funded: false, status: verified.status || payment.status || "pending" })
    let changed = false
    await db.runTransaction(async (tx: Transaction) => {
      const latest = await tx.get(paymentRef as any) as any
      if (latest.data()?.status === "funded") return
      changed = true
      tx.set(paymentRef, { status: "funded", paidAt: admin.firestore.FieldValue.serverTimestamp(), paystackTransactionId: verified.id || null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      tx.set(workspaceRef, { payment: { status: "funded", amount: expected, reference: payment.reference || paymentRef.id, provider: "paystack", fundedAt: admin.firestore.FieldValue.serverTimestamp() }, status: "active", updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
    })
    if (changed) await Promise.all([notifyUser({ userId: workspace.clientUid, type: "workspace_funded", title: "Project payment confirmed", message: "Your payment is confirmed. Work can now begin.", link: `/dashboard/workspaces/${workspaceId}` }), workspace.talentUid && notifyUser({ userId: workspace.talentUid, type: "workspace_funded", title: "Project payment confirmed", message: "The project payment is confirmed. You can now begin work.", link: `/dashboard/workspaces/${workspaceId}` })])
    return NextResponse.json({ funded: true })
  } catch (error: any) { return NextResponse.json({ error: error?.message || "Unable to verify project payment" }, { status: 500 }) }
}
