"use client"

import { useEffect } from "react"
import { COOKIE_NAMES, getCookie, setCookie, setJsonCookie } from "@/lib/cookies"

function makeToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "")
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function CookieBootstrap() {
  useEffect(() => {
    if (!getCookie(COOKIE_NAMES.csrf)) {
      setCookie(COOKIE_NAMES.csrf, makeToken(), { maxAge: 60 * 60 * 3 })
    }

    const consent = getCookie(COOKIE_NAMES.consent)
    if (consent === "accepted" && !getCookie(COOKIE_NAMES.prefs)) {
      setJsonCookie(
        COOKIE_NAMES.prefs,
        { searchType: "talent", density: "comfortable", updatedAt: Date.now() },
        { maxAge: 60 * 60 * 24 * 365 }
      )
    }

    const onConsent = (event: Event) => {
      if ((event as CustomEvent).detail !== "accepted") return
      if (!getCookie(COOKIE_NAMES.prefs)) {
        setJsonCookie(COOKIE_NAMES.prefs, { searchType: "talent", density: "comfortable", updatedAt: Date.now() }, { maxAge: 60 * 60 * 24 * 365 })
      }
    }
    window.addEventListener("cw-cookie-consent", onConsent)
    return () => window.removeEventListener("cw-cookie-consent", onConsent)
  }, [])

  return null
}
