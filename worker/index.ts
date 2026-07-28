/// <reference lib="webworker" />
/* eslint-disable @typescript-eslint/no-explicit-any, no-var */

const sw = self as unknown as ServiceWorkerGlobalScope

interface PushNotificationData {
  title?: string
  body?: string
  icon?: string
  badge?: string
  tag?: string
  vibrate?: number[]
  data?: { url?: string; path?: string; [key: string]: unknown }
  actions?: { action: string; title: string; icon?: string }[]
}

const DEFAULT_ICON = '/icons/icon-192.png'
const DEFAULT_BADGE = '/icons/icon-96.png'
const DEFAULT_TAG = 'psr-notification'
const DEFAULT_VIBRATE: number[] = [200, 100, 200]

;(sw as any).__WB_MANIFEST

sw.addEventListener('push', (event: any) => {
  if (!event.data) return

  try {
    const data = event.data.json() as PushNotificationData

    const options: any = {
      body: data.body || '',
      icon: data.icon || DEFAULT_ICON,
      badge: data.badge || DEFAULT_BADGE,
      tag: data.tag || DEFAULT_TAG,
      vibrate: data.vibrate || DEFAULT_VIBRATE,
      data: (data.data as any) || {},
      requireInteraction: true,
      actions: data.actions || [],
    }

    event.waitUntil(
      sw.registration.showNotification(data.title || 'PrinceSteve Residence', options)
    )
  } catch {
    const text = event.data.text()
    if (text) {
      event.waitUntil(
        sw.registration.showNotification('PrinceSteve Residence', { body: text })
      )
    }
  }
})

sw.addEventListener('notificationclick', (event: any) => {
  event.notification.close()

  const data = event.notification.data as PushNotificationData['data']
  const urlToOpen = data?.url || data?.path || '/dashboard'

  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList as any[]) {
        if (client.url === urlToOpen && 'focus' in client) {
          return (client as any).focus()
        }
      }
      const clientsAny = sw.clients as any
      if (clientsAny.openWindow) {
        return clientsAny.openWindow(urlToOpen)
      }
    })
  )
})

sw.addEventListener('notificationclose', () => {})
