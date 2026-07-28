/* eslint-disable no-restricted-globals */
/**
 * PrinceSteve Residence Service Worker
 *
 * Manual service worker implementation. Provides:
 * - Offline fallback page
 * - Cache-first strategy for static assets
 * - Network-first strategy for API calls
 * - Push notification handling
 *
 * If SERWIST_ENABLED=1 is set in next.config.ts, this file is replaced
 * with a serwist-generated bundle from src/app/sw.ts.
 */

const CACHE_VERSION = "psr-v1"
const STATIC_CACHE = `${CACHE_VERSION}-static`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const OFFLINE_URL = "/offline"

const PRECACHE_URLS = ["/", "/offline", "/manifest.json"]

// ── Install: precache static assets ──────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      // Best-effort precache; failures don't block install.
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
      await self.skipWaiting()
    })()
  )
})

// ── Activate: clean up old caches ────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
      await self.clients.claim()
    })()
  )
})

// ── Fetch: cache-first for static, network-first for API ────────────────

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return

  const url = new URL(request.url)

  // Skip cross-origin
  if (url.origin !== self.location.origin) return

  // API calls: network-first with cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request))
    return
  }

  // Static assets: cache-first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Navigation: network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request))
    return
  }
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    return cached || Response.error()
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    const cached = await caches.match(request)
    return cached || Response.error()
  }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request)
    return response
  } catch (err) {
    const cached = await caches.match(request)
    if (cached) return cached
    const offlinePage = await caches.match(OFFLINE_URL)
    return offlinePage || Response.error()
  }
}

// ── Push Notifications ──────────────────────────────────────────────────

const DEFAULT_ICON = "/icons/icon-192.png"
const DEFAULT_BADGE = "/icons/icon-96.png"
const DEFAULT_TAG = "psr-notification"
const DEFAULT_VIBRATE = [200, 100, 200]

self.addEventListener("push", (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch (e) {
    const text = event.data.text()
    if (text) {
      event.waitUntil(
        self.registration.showNotification("PrinceSteve Residence", { body: text })
      )
    }
    return
  }

  const options = {
    body: data.body || "",
    icon: data.icon || DEFAULT_ICON,
    badge: data.badge || DEFAULT_BADGE,
    tag: data.tag || DEFAULT_TAG,
    vibrate: data.vibrate || DEFAULT_VIBRATE,
    data: data.data || {},
    requireInteraction: true,
    actions: data.actions || [],
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || "PrinceSteve Residence",
      options
    )
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const urlToOpen = data.url || data.path || "/dashboard"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
})

self.addEventListener("notificationclose", () => {})
