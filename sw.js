/**
 * Network-first Service Worker for TowerDeChess PWA.
 * Ensures fast web iteration always pulls latest updates when online,
 * while still supporting offline play on Android home screen.
 */

const CACHE_NAME = 'towerdechess-v18';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept Range requests or large audio/video media streams —
  // Safari/iOS and mobile WebViews require native 206 Partial Content streaming.
  if (
    req.headers.has('range') ||
    req.destination === 'video' ||
    req.destination === 'audio' ||
    /\.(mp4|webm|mp3|ogg|m4a)(\?|$)/i.test(url.pathname)
  ) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
