"use client"

export type CookieOptions = {
  maxAge?: number
  path?: string
  sameSite?: "Lax" | "Strict" | "None"
  secure?: boolean
}

function isBrowser() {
  return typeof window !== "undefined"
}

function normalizeOptions(options: CookieOptions = {}) {
  return {
    path: options.path || "/",
    sameSite: options.sameSite || "Lax",
    secure: options.secure ?? (typeof window !== "undefined" ? window.location.protocol === "https:" : false),
    maxAge: options.maxAge,
  }
}

export function getCookie(name: string) {
  if (!isBrowser()) return ""
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[$()*+./?[\\\]^{|}-]/g, "\\$&")}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ""
}

export function setCookie(name: string, value: string, options: CookieOptions = {}) {
  if (!isBrowser()) return
  const opts = normalizeOptions(options)
  let cookie = `${name}=${encodeURIComponent(value)}; Path=${opts.path}; SameSite=${opts.sameSite}`
  if (opts.maxAge !== undefined) cookie += `; Max-Age=${Math.floor(opts.maxAge)}`
  if (opts.secure) cookie += `; Secure`
  document.cookie = cookie
}

export function deleteCookie(name: string, path = "/") {
  if (!isBrowser()) return
  document.cookie = `${name}=; Path=${path}; Max-Age=0; SameSite=Lax`
}

export function getJsonCookie<T>(name: string, fallback: T): T {
  try {
    const raw = getCookie(name)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function setJsonCookie(name: string, value: unknown, options: CookieOptions = {}) {
  setCookie(name, JSON.stringify(value), options)
}

export const COOKIE_NAMES = {
  session: "cw_session",
  csrf: "cw_csrf",
  prefs: "cw_prefs",
  onboarding: "cw_onboarding",
  usage: "cw_usage",
  consent: "cw_cookie_consent",
} as const
