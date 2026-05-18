// Service Worker — Cara de Cooky Push Notifications
const CACHE_NAME = 'caradecooky-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  let data = {
    title: '🍪 Cara de Cooky',
    body: 'Novo pedido recebido!',
    orderId: '',
    total: '',
    itemCount: 0,
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: `order-${data.orderId || Date.now()}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: '/admin',
      orderId: data.orderId,
    },
    actions: [
      { action: 'view', title: '👀 Ver pedido' },
      { action: 'dismiss', title: 'Fechar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing admin tab if open
      for (const client of windowClients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
