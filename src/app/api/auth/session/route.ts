import crypto from "crypto"
import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

const COOKIE_SECRET =
  process.env.COOKIE_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "changeworker-cookie-secret"

function signSession(payload: string) {
  const sig = crypto.createHmac("sha256", COOKIE_SECRET).update(payload).digest("base64url")
  return `${payload}.${sig}`
}

function makeCookieOptions(maxAge: number) {
  return {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const adminApp = getAdminApp()
    const adminDb = getAdminDb()
    const decoded = await adminApp.auth().verifyIdToken(token)

    const userSnap = await adminDb.collection("users").doc(decoded.uid).get()
    const userData = userSnap.data() as any
    const role = String(userData?.role || decoded.role || "user")
    const onboardingComplete = Boolean(userData?.onboardingComplete)

    const sessionPayload = JSON.stringify({
      uid: decoded.uid,
      email: decoded.email || userData?.email || "",
      role,
      onboardingComplete,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3 * 60 * 60 * 1000,
    })

    const csrfToken = crypto.randomBytes(24).toString("base64url")
    const prefsPayload = JSON.stringify({
      searchType: role === "client" ? "talent" : "job",
      density: "comfortable",
      updatedAt: Date.now(),
    })
    const onboardingValue = onboardingComplete ? "complete" : "pending"

    const response = NextResponse.json({
      ok: true,
      role,
      onboardingComplete,
    })

    response.cookies.set("cw_session", signSession(sessionPayload), {
      ...makeCookieOptions(3 * 60 * 60),
      httpOnly: true,
    })
    response.cookies.set("cw_csrf", csrfToken, {
      ...makeCookieOptions(3 * 60 * 60),
      httpOnly: false,
    })
    response.cookies.set("cw_prefs", prefsPayload, {
      ...makeCookieOptions(60 * 60 * 24 * 365),
      httpOnly: false,
    })
    response.cookies.set("cw_onboarding", onboardingValue, {
      ...makeCookieOptions(60 * 60 * 24 * 30),
      httpOnly: false,
    })

    return response
  } catch (error: any) {
    console.error("[/api/auth/session]", error)
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  const expired = {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  }
  response.cookies.set("cw_session", "", { ...expired, httpOnly: true })
  response.cookies.set("cw_csrf", "", { ...expired, httpOnly: false })
  response.cookies.set("cw_prefs", "", { ...expired, httpOnly: false })
  response.cookies.set("cw_onboarding", "", { ...expired, httpOnly: false })
  response.cookies.set("cw_usage", "", { ...expired, httpOnly: false })
  return response
}
