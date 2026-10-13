import webpush from "web-push"
import { getAdminDb } from "@/lib/firebaseAdmin"

type PushSubscriptionRecord = { endpoint: string; keys?: { p256dh?: string; auth?: string }; expirationTime?: number | null }

function configured() {
  return Boolean(process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY && process.env.WEB_PUSH_SUBJECT)
}

export async function sendPushNotification(userId: string, payload: { title: string; message: string; link?: string }) {
  if (!configured()) return
  webpush.setVapidDetails(process.env.WEB_PUSH_SUBJECT!, process.env.WEB_PUSH_PUBLIC_KEY!, process.env.WEB_PUSH_PRIVATE_KEY!)
  const db = getAdminDb()
  const snap = await db.collection("users").doc(userId).collection("pushSubscriptions").get()
  await Promise.all(snap.docs.map(async (doc: any) => {
    const subscription = doc.data().subscription as PushSubscriptionRecord | undefined
    if (!subscription?.endpoint) return
    try { await webpush.sendNotification(subscription as any, JSON.stringify(payload)) }
    catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) await doc.ref.delete()
      else console.error("Push notification delivery failed:", error?.message || error)
    }
  }))
}
