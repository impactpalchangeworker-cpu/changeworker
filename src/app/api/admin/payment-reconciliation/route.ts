import { NextRequest, NextResponse } from "next/server"
import admin from "firebase-admin"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { verifyMonnifyTransaction } from "@/lib/monnify"

export const runtime = "nodejs"

async function requireAdmin(request: NextRequest) {
  const header = request.headers.get("authorization") || ""
  if (!header.startsWith("Bearer ")) throw new Error("Unauthorized")
  const decoded = await getAdminApp().auth().verifyIdToken(header.slice(7))
  const user = await getAdminDb().doc(`users/${decoded.uid}`).get()
  if (user.data()?.role !== "admin") throw new Error("Forbidden")
  return decoded.uid
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    const snap = await getAdminDb().collection("paymentReconciliationCases").get()
    const cases = snap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item: any) => item.provider === "monnify" || item.kind === "project_payment").sort((a: any, b: any) => Number(b.updatedAt?.toMillis?.() || 0) - Number(a.updatedAt?.toMillis?.() || 0))
    return NextResponse.json({ cases })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load reconciliation cases" }, { status: error?.message === "Unauthorized" ? 401 : error?.message === "Forbidden" ? 403 : 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    const { caseId, note } = await request.json()
    if (!caseId) return NextResponse.json({ error: "caseId is required" }, { status: 400 })
    const db = getAdminDb()
    const caseRef = db.collection("paymentReconciliationCases").doc(String(caseId))
    const paymentCase = (await caseRef.get()).data() as any
    if (!paymentCase) return NextResponse.json({ error: "Reconciliation case not found" }, { status: 404 })
    if (paymentCase.status === "resolved") return NextResponse.json({ error: "This case is already resolved" }, { status: 409 })
    const reference = String(paymentCase.reference || "")
    const workspaceId = String(paymentCase.workspaceId || "")
    if (!reference || !workspaceId) return NextResponse.json({ error: "This case is missing a project payment reference" }, { status: 400 })

    const verified = await verifyMonnifyTransaction(reference)
    const expectedAmount = Number(paymentCase.amount || 0)
    const paidAmount = Number(verified.amountPaid || 0)
    if (verified.paymentStatus !== "PAID" || (expectedAmount > 0 && paidAmount < expectedAmount)) return NextResponse.json({ error: "Monnify has not confirmed a matching payment for this project" }, { status: 409 })

    const workspaceRef = db.collection("workspaces").doc(workspaceId)
    const paymentRef = workspaceRef.collection("payments").doc(reference)
    await db.runTransaction(async (tx) => {
      const [workspaceSnap, paymentSnap] = await Promise.all([tx.get(workspaceRef), tx.get(paymentRef)])
      if (!workspaceSnap.exists || !paymentSnap.exists) throw new Error("Project payment record not found")
      const payment = paymentSnap.data() as any
      if (payment.status !== "funded") {
        tx.set(paymentRef, { status: "funded", provider: "monnify", paidAt: admin.firestore.FieldValue.serverTimestamp(), monnifyTransactionReference: verified.transactionReference || null, reconciledBy: adminUid, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
        tx.set(workspaceRef, { payment: { status: "funded", provider: "monnify", reference, amount: Number(payment.amount || paidAmount), fundedAt: admin.firestore.FieldValue.serverTimestamp(), reconciledBy: adminUid }, status: "active", updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      }
    })
    await caseRef.set({ status: "resolved", resolvedBy: adminUid, resolutionNote: String(note || "Verified with Monnify by admin"), resolvedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to reconcile project payment" }, { status: error?.message === "Unauthorized" ? 401 : error?.message === "Forbidden" ? 403 : 500 })
  }
}
