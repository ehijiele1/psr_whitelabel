import webPush from 'web-push';
import { env } from '@/src/lib/env';

const vapidPublicKey = env.vapidPublicKey;
const vapidPrivateKey = env.vapidPrivateKey;
const vapidSubject = env.appUrl || 'mailto:beckydin63@gmail.com';

let initialized = false;

export function ensureVapidConfigured(): boolean {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[Push] VAPID keys not configured. Skipping push notification.');
    return false;
  }
  if (!initialized) {
    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    initialized = true;
  }
  return true;
}

export async function sendPushNotification(
  subscription: webPush.PushSubscription,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
    tag?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!ensureVapidConfigured()) {
    return { success: false, error: 'VAPID not configured' };
  }

  try {
    await webPush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192.png',
        badge: payload.badge || '/icons/icon-96.png',
        data: payload.data || {},
        tag: payload.tag || 'psr-notification',
        vibrate: [200, 100, 200],
      }),
      { TTL: 86400 }
    );
    return { success: true };
  } catch (err: unknown) {
    const msg = (err as Error).message || 'Push send failed';
    if (msg.includes('410') || msg.includes('404') || msg.includes('unsubscribed')) {
      return { success: false, error: 'subscription_expired' };
    }
    console.error('[Push] Send error:', err);
    return { success: false, error: msg };
  }
}

export { webPush };
export { vapidPublicKey, vapidPrivateKey };