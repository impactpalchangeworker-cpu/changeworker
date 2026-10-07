import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const adminApp = getAdminApp()
    const decoded = await adminApp.auth().verifyIdToken(token)
    const db = getAdminDb()

    const adminUser = (await db.collection("users").doc(decoded.uid).get()).data() as any
    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { commercialNote, templateNotes } = await req.json()
    const fee = 10

    await db.collection("adminSettings").doc("platform").set(
      {
        platformFeePercent: fee,
        commercialNote: String(commercialNote || ""),
        templateNotes: String(templateNotes || ""),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: decoded.uid,
      },
      { merge: true }
    )

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Admin settings save failed", error)
    return NextResponse.json({ error: error?.message || "Failed to save settings" }, { status: 500 })
  }
}
