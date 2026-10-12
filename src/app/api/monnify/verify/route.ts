import admin from "firebase-admin"
import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { verifyMonnifyTransaction } from "@/lib/monnify"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization") || ""
    if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = await getAdminApp().auth().verifyIdToken(authorization.slice(7))
    const { workspaceId } = await req.json() as { workspaceId?: string }
    if (!workspaceId) return NextResponse.json({ error: "Workspace is required" }, { status: 400 })

    const db = getAdminDb()
    const workspaceRef = db.collection("workspaces").doc(workspaceId)
    const workspaceSnap = await workspaceRef.get()
    if (!workspaceSnap.exists) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    const workspace = workspaceSnap.data() as any
    if (workspace.clientUid !== decoded.uid) return NextResponse.json({ error: "Only the client can verify this payment" }, { status: 403 })
    if (workspace.payment?.status === "funded") return NextResponse.json({ funded: true })

    const paymentSnapshot = await workspaceRef.collection("payments").orderBy("createdAt", "desc").limit(1).get()
    if (paymentSnapshot.empty) return NextResponse.json({ funded: false, status: "not_started" })
    const paymentRef = paymentSnapshot.docs[0].ref
    const payment = paymentSnapshot.docs[0].data() as any
    const verified = await verifyMonnifyTransaction(String(payment.reference || paymentRef.id))
    const amountPaid = Number(verified.amountPaid || 0)
    const expectedAmount = Number(payment.amount || 0)
    if (verified.paymentStatus !== "PAID" || amountPaid < expectedAmount) {
      return NextResponse.json({ funded: false, status: verified.paymentStatus || payment.status || "pending" })
    }

    let newlyFunded = false
    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      const latestPayment = await tx.get(paymentRef as unknown as admin.firestore.DocumentReference)
      if (latestPayment.data()?.status === "funded") return
      newlyFunded = true
      tx.set(paymentRef, {
        status: "funded",
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        monnifyTransactionReference: verified.transactionReference || null,
        paymentMethod: verified.paymentMethod || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
      tx.set(workspaceRef, {
        payment: {
          status: "funded",
          amount: expectedAmount,
          reference: payment.reference || paymentRef.id,
          provider: "monnify",
          fundedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        status: "active",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
    })

    if (newlyFunded) {
      await Promise.all([
        workspace.clientUid && notifyUser({ userId: workspace.clientUid, type: "workspace_funded", title: "Project payment confirmed", message: "Your payment is confirmed. Work can now begin.", link: `/dashboard/workspaces/${workspaceId}` }),
        workspace.talentUid && notifyUser({ userId: workspace.talentUid, type: "workspace_funded", title: "Project payment confirmed", message: "The project payment is confirmed. You can now begin work.", link: `/dashboard/workspaces/${workspaceId}` }),
      ])
    }

    return NextResponse.json({ funded: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unable to verify project payment" }, { status: 500 })
  }
}
