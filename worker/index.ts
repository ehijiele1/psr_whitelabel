// @ts-nocheck
/// <reference lib="webworker" />

self.__WB_MANIFEST;

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || '',
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-96.png',
      tag: data.tag || 'psr-notification',
      vibrate: data.vibrate || [200, 100, 200],
      data: data.data || {},
      requireInteraction: true,
      actions: data.actions || [],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'PrinceSteve Residence', options)
    );
  } catch {
    const text = event.data.text();
    if (text) {
      event.waitUntil(
        self.registration.showNotification('PrinceSteve Residence', { body: text })
      );
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url
    || event.notification.data?.path
    || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', () => {});
