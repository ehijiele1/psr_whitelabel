"use client"

import { useEffect, useState } from "react"
import { Bell, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { csrfFetch } from "@/lib/csrf-client"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function BrowserNotifications() {
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    Boolean(VAPID_PUBLIC_KEY)

  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!supported) return
    let active = true
    ;(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        const subscription = registration
          ? await registration.pushManager.getSubscription()
          : null
        if (active) setEnabled(Boolean(subscription))
      } catch {
        // Ignore: browser may block service worker access.
      }
    })()
    return () => {
      active = false
    }
  }, [supported])

  async function subscribe() {
    if (!supported) return
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        toast.error("Permission denied. Enable browser notifications to continue.")
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const res = await csrfFetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Failed to save subscription")
        return
      }

      setEnabled(true)
      toast.success("Browser notifications enabled")
    } catch {
      toast.error("Could not enable browser notifications")
    } finally {
      setBusy(false)
    }
  }

  async function unsubscribe() {
    if (!supported) return
    setBusy(true)
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      const subscription = registration
        ? await registration.pushManager.getSubscription()
        : null

      if (subscription) {
        const endpoint = subscription.endpoint
        await subscription.unsubscribe()
        await csrfFetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        })
      }

      setEnabled(false)
      toast.success("Browser notifications disabled")
    } catch {
      toast.error("Could not disable browser notifications")
    } finally {
      setBusy(false)
    }
  }

  async function sendTest() {
    if (!supported) return
    setSending(true)
    try {
      const res = await csrfFetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test notification",
          body: "If you can read this, browser notifications are working.",
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Failed to send test notification")
        return
      }
      toast.success(data.sent > 0 ? "Test notification sent" : "No active subscriptions")
    } catch {
      toast.error("Failed to send test notification")
    } finally {
      setSending(false)
    }
  }

  if (!supported) return null

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Browser Notifications</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Receive push notifications in this browser when payments, tickets, or rent reminders occur.
        </p>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium">Push notifications</p>
            <p className="text-xs text-muted-foreground">
              {enabled ? "Subscribed on this device" : "Not subscribed on this device"}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              disabled={busy}
              onChange={() => (enabled ? unsubscribe() : subscribe())}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
          </label>
        </div>

        {enabled && (
          <Button variant="outline" size="sm" onClick={sendTest} disabled={sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send test notification
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
