"use client"
import { useEffect, useState } from "react"
import { Bell, BellOff } from "lucide-react"
import { auth } from "@/lib/firebase"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import toast from "react-hot-toast"

function decodeKey(value: string) { const padding = "=".repeat((4 - value.length % 4) % 4); const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)) }

export default function PushNotificationsToggle({ enabled = false }: { enabled?: boolean }) {
  const [active, setActive] = useState(enabled); const [busy, setBusy] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [isIos, setIsIos] = useState(false)
  useEffect(() => { setActive(enabled); if (auth.currentUser) void getDoc(doc(db, "users", auth.currentUser.uid)).then((snap) => setActive(Boolean(snap.data()?.pushNotificationsEnabled))) }, [enabled])
  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    setIsIos(ios)
    const onInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event) }
    window.addEventListener("beforeinstallprompt", onInstall)
    return () => window.removeEventListener("beforeinstallprompt", onInstall)
  }, [])
  const installApp = async () => {
    if (isIos) {
      setShowHelp(true)
      return
    }
    if (!installPrompt) {
      setShowHelp(true)
      return
    }
    await installPrompt.prompt()
    setInstallPrompt(null)
  }
  const toggle = async () => {
    if (!auth.currentUser || !("serviceWorker" in navigator) || !("PushManager" in window)) return toast.error("Push notifications are not supported in this browser.")
    setBusy(true)
    try {
      const token = await auth.currentUser.getIdToken()
      const registration = await Promise.race([
        navigator.serviceWorker.register("/sw.js"),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Push setup timed out. Please refresh and try again.")), 10000)),
      ])
      if (active) {
        const subscription = await registration.pushManager.getSubscription(); await fetch("/api/notifications/push-subscription", { method: "DELETE", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription?.endpoint }) }); await subscription?.unsubscribe(); setActive(false); toast.success("Push notifications disabled")
      } else {
        if (!("Notification" in window)) throw new Error("Notifications are not supported in this browser.")
        if (await Notification.requestPermission() !== "granted") throw new Error("Notification permission was not granted")
        const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || "") })
        const response = await fetch("/api/notifications/push-subscription", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ subscription }) }); if (!response.ok) throw new Error((await response.json()).error || "Unable to enable push notifications"); setActive(true); toast.success("Push notifications enabled")
      }
    } catch (error: any) { toast.error(error?.message || "Unable to update push notifications") } finally { setBusy(false) }
  }
  return <div className="rounded-2xl border bg-white p-4 shadow-sm">
    <button type="button" onClick={toggle} disabled={busy} className="flex w-full items-center justify-between text-left transition disabled:opacity-60">
      <span className="flex items-center gap-3"><span className="rounded-xl bg-orange-50 p-2 text-orange-600">{active ? <Bell size={18} /> : <BellOff size={18} />}</span><span><span className="block font-extrabold">Push notifications</span><span className="text-xs text-gray-500">{active ? "Enabled on this device" : "Optional alerts on this device"}</span></span></span>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>{busy ? "Saving..." : active ? "On" : "Off"}</span>
    </button>
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
      {(installPrompt || isIos) && <button type="button" onClick={installApp} className="rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-bold text-white hover:opacity-90">Install changeworker</button>}
      <button type="button" onClick={() => setShowHelp((value) => !value)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">{showHelp ? "Hide setup steps" : "How to receive alerts"}</button>
    </div>
    {showHelp && <div className="mt-3 space-y-2 rounded-xl bg-gray-50 p-3 text-xs leading-5 text-gray-600">
      {isIos ? <p><strong className="text-gray-900">iPhone:</strong> Open changeworker in Safari, tap Share, choose <strong>Add to Home Screen</strong>, open the installed app, then enable notifications here and allow the notification prompt.</p> : <p><strong className="text-gray-900">Android:</strong> In Chrome, tap the three dots, choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, then enable notifications here and allow Chrome notifications in your phone settings.</p>}
      <p>If alerts are delayed, check that notifications are enabled for Chrome or the installed app, and disable battery restrictions for it.</p>
    </div>}
  </div>
}
