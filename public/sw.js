const CACHE_NAME = "changeworker-static-v2"
const ASSETS = ["/", "/manifest.webmanifest", "/logo.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await Promise.all(
        ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset, { cache: "no-cache" })
            if (response.ok) {
              await cache.put(asset, response.clone())
            }
          } catch {
            // ignore individual asset failures during install
          }
        })
      )
      await self.skipWaiting()
    })()
  )
})

self.addEventListener("push", (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(self.registration.showNotification(data.title || "changeworker", { body: data.message || "You have a new platform notification.", icon: "/logo.png", badge: "/logo.png", data: { link: data.link || "/dashboard/notifications" } }))
})
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); const link = event.notification.data?.link || "/dashboard/notifications"
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((items) => { const existing = items.find((client) => "focus" in client); if (existing) { existing.navigate(link); return existing.focus() }; return clients.openWindow(link) }))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key)
            }
            return Promise.resolve()
          })
        )
      )
      .then(() => self.clients.claim())
  )
})
