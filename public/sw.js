// Minimal service worker — satisfies PWA installability requirement.
// Pass-through fetch (no offline caching yet; add cache strategies later).

const CACHE_NAME = 'lawma-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests; let everything else pass through normally.
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request));
});
