/* eslint-disable no-restricted-globals */
/**
 * Zodiak — Service Worker
 *
 * Rôles :
 *   1. Web Push : afficher les notifications avec le branding cosmic.
 *   2. Offline shell : cache de la guidance du jour pour ouverture instantanée.
 *   3. Stale-while-revalidate sur les assets Vite chunkés.
 *
 * On reste lean : pas de Workbox, juste les APIs natives.
 */

const VERSION = 'zodiak-v1';
const PRECACHE = `precache-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;

const PRECACHE_URLS = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW] precache failed', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![PRECACHE, RUNTIME].includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Stratégie : network-first pour HTML/API (toujours frais), cache-first pour assets,
// fallback offline minimal sur le shell racine.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // On ignore tout ce qui n'est pas GET ou cross-origin (Supabase REST, OpenAI, etc.).
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Assets statiques (vite chunked, fonts, images) : stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkPromise = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkPromise;
    })
  );
});

// =============================================================================
// PUSH NOTIFICATIONS
// =============================================================================

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Zodiak', body: event.data.text() };
  }

  const title = payload.title || 'Zodiak ✦';
  const options = {
    body: payload.body || 'Le ciel a un message pour toi.',
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/badge-72.png',
    image: payload.image,
    vibrate: [80, 40, 80],
    tag: payload.tag || 'zodiak-default',
    renotify: !!payload.renotify,
    data: {
      url: payload.url || '/guidance',
      ...(payload.data || {}),
    },
    actions: payload.actions || [
      { action: 'open', title: 'Voir' },
      { action: 'dismiss', title: 'Plus tard' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/guidance';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(targetUrl).catch(() => {});
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});

// Permet de forcer un skipWaiting depuis l'app (postMessage).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
