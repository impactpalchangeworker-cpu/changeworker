"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { COOKIE_NAMES, getCookie, setCookie } from "@/lib/cookies"

const CONSENT_MAX_AGE = 60 * 60 * 24 * 365

export default function CookieConsentBanner() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(pathname === "/" && !getCookie(COOKIE_NAMES.consent))
  }, [pathname])

  const choose = (value: "accepted" | "rejected") => {
    setCookie(COOKIE_NAMES.consent, value, { maxAge: CONSENT_MAX_AGE })
    setVisible(false)
    window.dispatchEvent(new CustomEvent("cw-cookie-consent", { detail: value }))
  }

  if (!visible || pathname !== "/") return null

  return (
    <aside
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl md:inset-x-auto md:right-6 md:mx-0"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="font-bold text-gray-950">Cookies on changeworker</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            We use essential cookies to keep the platform secure and signed in. With your permission, we also use preference and performance cookies to remember settings and improve the experience. You can change your browser settings at any time.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => choose("rejected")} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Reject optional
          </button>
          <button type="button" onClick={() => choose("accepted")} className="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90">
            Accept all
          </button>
        </div>
      </div>
    </aside>
  )
}
