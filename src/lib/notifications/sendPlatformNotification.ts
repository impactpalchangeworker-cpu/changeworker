import { sendNotification } from "./sendNotification"
import { sendEmail } from "@/lib/email/sendEmail"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { buildNotificationEmail } from "./template"
import { sendPushNotification } from "./push"

export async function notifyUser({
  userId,
  type,
  title,
  message,
  link,
  emailSubject,
  emailHtml,
  sendEmail: shouldSendEmail = true,
}: any) {
  try {
    await sendNotification({
      userId,
      type,
      title,
      message,
      link,
    })
  } catch (err) {
    console.error("notifyUser: in-app notification error", err)
  }

  try { await sendPushNotification(userId, { title, message, link }) }
  catch (err) { console.error("notifyUser: push notification error", err) }

  try {
    const adminDb = getAdminDb()
    const user = await adminDb.collection("users").doc(userId).get()

    if (user.exists) {
      const email = user.data()?.email
      if (email && shouldSendEmail) {
        const htmlContent = emailHtml || buildNotificationEmail({ title, message, link })
        await sendEmail({
          to: email,
          subject: emailSubject || title,
          html: htmlContent,
        }).catch((err) => console.error("notifyUser: sendEmail error", err))
      }
    }
  } catch (err) {
    console.error("notifyUser: user lookup error", err)
  }
}
