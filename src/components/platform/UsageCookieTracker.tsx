"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { COOKIE_NAMES, getCookie, getJsonCookie, setJsonCookie } from "@/lib/cookies"

type UsageCookie = {
  lastPath?: string
  lastSeenAt?: number
  visits?: number
}

export default function UsageCookieTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    if (getCookie(COOKIE_NAMES.consent) !== "accepted") return
    const prev = getJsonCookie<UsageCookie>(COOKIE_NAMES.usage, {})
    setJsonCookie(
      COOKIE_NAMES.usage,
      {
        ...prev,
        lastPath: pathname,
        lastSeenAt: Date.now(),
        visits: Number(prev.visits || 0) + 1,
      },
      { maxAge: 60 * 60 * 24 * 90 }
    )
  }, [pathname])

  return null
}
