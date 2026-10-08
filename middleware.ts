import { NextRequest, NextResponse } from "next/server"

type RateBucket = {
  count: number
  resetAt: number
}

type RateRule = {
  prefix: string
  limit: number
  windowMs: number
}

const RULES: RateRule[] = [
  { prefix: "/api/admin/disputes/resolve", limit: 10, windowMs: 60_000 },
  { prefix: "/api/admin", limit: 30, windowMs: 60_000 },
  { prefix: "/api/monnify", limit: 20, windowMs: 60_000 },
  { prefix: "/api/disputes/upload-evidence", limit: 8, windowMs: 60_000 },
  { prefix: "/api/disputes/send-message", limit: 20, windowMs: 60_000 },
  { prefix: "/api/disputes/create", limit: 8, windowMs: 60_000 },
  { prefix: "/api/messages/send", limit: 25, windowMs: 60_000 },
  { prefix: "/api/support/send", limit: 10, windowMs: 60_000 },
  { prefix: "/api/wallets", limit: 10, windowMs: 60_000 },
  { prefix: "/api", limit: 120, windowMs: 60_000 },
]

const rateStore = (globalThis as typeof globalThis & {
  __skillsMarketRateStore?: Map<string, RateBucket>
}).__skillsMarketRateStore || new Map<string, RateBucket>()

const MAX_RATE_BUCKETS = 10_000

;(globalThis as typeof globalThis & {
  __skillsMarketRateStore?: Map<string, RateBucket>
}).__skillsMarketRateStore = rateStore

function getRule(pathname: string) {
  return RULES.find((rule) => pathname.startsWith(rule.prefix)) || RULES[RULES.length - 1]
}

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for") || ""
  const firstForwardedIp = forwardedFor.split(",")[0]?.trim()
  const realIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    firstForwardedIp ||
    "unknown-ip"

  return realIp
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  if (request.method === "OPTIONS") {
    return NextResponse.next()
  }

  const csrfExemptPaths = [
    "/api/auth/session",
    "/api/auth/send-password-reset",
    "/api/auth/send-verification",
    "/api/monnify/webhook",
    "/api/test-firebase",
  ]
  const unsafeMethod = !["GET", "HEAD"].includes(request.method.toUpperCase())
  if (unsafeMethod && !csrfExemptPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    const csrfCookie = request.cookies.get("cw_csrf")?.value || ""
    const csrfHeader = request.headers.get("x-csrf-token") || ""
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return NextResponse.json(
        { error: "Invalid CSRF token. Please refresh and try again." },
        { status: 403 }
      )
    }
  }

  const rule = getRule(pathname)
  const clientKey = `${getClientKey(request)}:${rule.prefix}`
  const now = Date.now()
  const bucket = rateStore.get(clientKey)

  if (rateStore.size > MAX_RATE_BUCKETS) {
    for (const [key, value] of rateStore) {
      if (value.resetAt <= now) rateStore.delete(key)
    }
    if (rateStore.size > MAX_RATE_BUCKETS) rateStore.clear()
  }

  if (!bucket || bucket.resetAt <= now) {
    rateStore.set(clientKey, { count: 1, resetAt: now + rule.windowMs })
    const response = NextResponse.next()
    response.headers.set("X-RateLimit-Limit", String(rule.limit))
    response.headers.set("X-RateLimit-Remaining", String(rule.limit - 1))
    response.headers.set("X-RateLimit-Reset", String(Math.ceil((now + rule.windowMs) / 1000)))
    return response
  }

  if (bucket.count >= rule.limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(rule.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1000)),
        },
      }
    )
  }

  bucket.count += 1
  rateStore.set(clientKey, bucket)

  const response = NextResponse.next()
  response.headers.set("X-RateLimit-Limit", String(rule.limit))
  response.headers.set("X-RateLimit-Remaining", String(Math.max(0, rule.limit - bucket.count)))
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)))
  return response
}

export const config = {
  matcher: ["/api/:path*"],
}
