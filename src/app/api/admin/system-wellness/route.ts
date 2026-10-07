import { NextRequest, NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

type CheckStatus = "ok" | "warning" | "error"

type WellnessCheck = {
  key: string
  label: string
  status: CheckStatus
  detail: string
}

function overallStatus(checks: WellnessCheck[]) {
  if (checks.some((check) => check.status === "error")) return "degraded"
  if (checks.some((check) => check.status === "warning")) return "watch"
  return "healthy"
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 })
    }

    const adminApp = getAdminApp()
    const decoded = await adminApp.auth().verifyIdToken(token)
    const adminDb = getAdminDb()

    const userSnap = await adminDb.collection("users").doc(decoded.uid).get()
    const userData = userSnap.data() as any
    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const checks: WellnessCheck[] = []

    checks.push({
      key: "firebase_admin_env",
      label: "Firebase admin credentials",
      status:
        process.env.FIREBASE_ADMIN_PROJECT_ID &&
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
        process.env.FIREBASE_ADMIN_PRIVATE_KEY
          ? "ok"
          : "error",
      detail:
        process.env.FIREBASE_ADMIN_PROJECT_ID &&
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
        process.env.FIREBASE_ADMIN_PRIVATE_KEY
          ? "All required Firebase admin environment variables are present."
          : "One or more Firebase admin environment variables are missing.",
    })

    try {
      await adminDb.collection("users").limit(1).get()
      checks.push({
        key: "firestore_read",
        label: "Firestore admin read",
        status: "ok",
        detail: "Admin Firestore reads are working.",
      })
    } catch (error: any) {
      checks.push({
        key: "firestore_read",
        label: "Firestore admin read",
        status: "error",
        detail: error?.message || "Firestore read failed.",
      })
    }

    try {
      await adminDb.collection("notifications").limit(1).get()
      checks.push({
        key: "notifications_feed",
        label: "Notifications feed",
        status: "ok",
        detail: "Notifications collection is reachable.",
      })
    } catch (error: any) {
      checks.push({
        key: "notifications_feed",
        label: "Notifications feed",
        status: "warning",
        detail: error?.message || "Notifications check could not be confirmed.",
      })
    }

    checks.push({
      key: "monnify_env",
      label: "Monnify configuration",
      status: process.env.MONNIFY_API_KEY && process.env.MONNIFY_SECRET_KEY && process.env.MONNIFY_CONTRACT_CODE ? "ok" : "warning",
      detail: process.env.MONNIFY_API_KEY && process.env.MONNIFY_SECRET_KEY && process.env.MONNIFY_CONTRACT_CODE
        ? "Monnify credentials are configured."
        : "Monnify credentials are not configured in this environment.",
    })

    checks.push({
      key: "admin_user",
      label: "Admin identity",
      status: "ok",
      detail: `Authenticated as ${userData?.fullName || userData?.email || decoded.uid}.`,
    })

    return NextResponse.json({
      status: overallStatus(checks),
      checkedAt: new Date().toISOString(),
      checks,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: error?.message || "System wellness check failed",
      },
      { status: 500 }
    )
  }
}
