// VierAfrik Service Worker — Cache & Offline
const CACHE_NAME = 'vierafrik-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Installation — mise en cache des assets statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation — nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — Network first, fallback cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne jamais intercepter les appels API (Supabase, NotchPay, Anthropic, et
  // toutes nos propres routes serverless /api/* — paiement, facture, coach).
  // Sans cette exclusion, un échec réseau sur un POST /api/fedapay ou
  // /api/invoice retombait sur le index.html mis en cache (réponse 200 en
  // HTML au lieu d'une vraie erreur réseau), et le code appelant qui fait
  // `await res.json()` plantait ou se comportait de façon incohérente —
  // exactement sur les flux de paiement, là où c'est le plus critique.
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache la réponse fraîche
        if (response.ok && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback sur le cache si pas de réseau
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/');
        });
      })
  );
});
