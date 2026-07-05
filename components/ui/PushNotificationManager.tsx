'use client';

import { useEffect, useState, useCallback } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((ch) => ch.charCodeAt(0)));
}

export default function PushNotificationManager() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.warn('[Push] VAPID public key not configured');
        return;
      }

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: existingSubscription }),
        });
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });
    } catch (err) {
      console.error('[Push] Subscription error:', err);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
    } catch (err) {
      console.error('[Push] Unsubscribe error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (supported && permission === 'default') {
      subscribe();
    }
  }, [supported, permission, subscribe]);

  if (!supported) return null;

  return (
    <button
      onClick={permission === 'granted' ? unsubscribe : subscribe}
      disabled={loading}
      className="flex items-center gap-2 text-[12px] text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
      title={permission === 'granted' ? 'Disable notifications' : 'Enable notifications'}
    >
      <i className={`ti ${permission === 'granted' ? 'ti-bell-ringing text-green-500' : 'ti-bell-off'}`} />
      <span className="hidden sm:inline">
        {loading ? 'Setting up...' : permission === 'granted' ? 'Notifications on' : 'Notify me'}
      </span>
    </button>
  );
}