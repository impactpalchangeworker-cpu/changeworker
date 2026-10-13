import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"

async function getUid(req: Request) {
  const header = req.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) throw new Error("Unauthorized")
  return (await getAdminApp().auth().verifyIdToken(header.slice(7))).uid
}

export async function POST(req: Request) {
  try {
    const uid = await getUid(req); const { subscription } = await req.json()
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 })
    const id = crypto.createHash("sha256").update(subscription.endpoint).digest("hex").slice(0, 40)
    const db = getAdminDb(); await db.collection("users").doc(uid).collection("pushSubscriptions").doc(id).set({ subscription, updatedAt: new Date() }, { merge: true })
    await db.collection("users").doc(uid).set({ pushNotificationsEnabled: true }, { merge: true })
    return NextResponse.json({ enabled: true })
  } catch (error: any) { return NextResponse.json({ error: error?.message || "Unable to save push subscription" }, { status: error?.message === "Unauthorized" ? 401 : 500 }) }
}

export async function DELETE(req: Request) {
  try {
    const uid = await getUid(req); const { endpoint } = await req.json().catch(() => ({})); const db = getAdminDb(); const ref = db.collection("users").doc(uid).collection("pushSubscriptions")
    if (endpoint) { const id = crypto.createHash("sha256").update(endpoint).digest("hex").slice(0, 40); await ref.doc(id).delete() } else { const snap = await ref.get(); await Promise.all(snap.docs.map((subscriptionDoc: any) => subscriptionDoc.ref.delete())) }
    await db.collection("users").doc(uid).set({ pushNotificationsEnabled: false }, { merge: true })
    return NextResponse.json({ enabled: false })
  } catch (error: any) { return NextResponse.json({ error: error?.message || "Unable to disable push notifications" }, { status: error?.message === "Unauthorized" ? 401 : 500 }) }
}
