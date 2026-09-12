/**
 * ChemTable PWA - Service Worker
 * Offline-First Single Page Application (SPA) Caching Engine
 * Fully compatible with GitHub Pages subpaths, custom domains, and PWABuilder
 */

const CACHE_NAME = 'chemtable-spa-v2.4.0';

const STATIC_ASSETS = [
  './',
  './index.html',
  './element.html',
  './styles.css',
  './app.js',
  './element-renderer.js',
  './data.json',
  './chemistry_data.json',
  './manifest.json',
  './favicon.png',
  './icon.svg',
  './apple-touch-icon.png',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './pwa-maskable-512x512.png',
  './screenshot-wide.png',
  './screenshot-narrow.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Pre-caching static offline assets');
      // Resolve all assets relative to service worker scope for GitHub Pages subpath compatibility
      const urlsToCache = STATIC_ASSETS.map((asset) => {
        try {
          return new URL(asset, self.registration ? self.registration.scope : self.location.href).href;
        } catch {
          return asset;
        }
      });

      await Promise.allSettled(
        urlsToCache.map((url) =>
          cache.add(url).catch((err) => console.warn(`[SW] Pre-cache skip for ${url}:`, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests and http/https schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Offline-First Strategy: Cache First, falling back to Network and updating cache
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Asynchronously update local assets if online
        if (url.origin === self.location.origin) {
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache response
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch(async () => {
          // If offline and requesting navigation, serve cached SPA entry
          if (request.mode === 'navigate') {
            const scope = self.registration ? self.registration.scope : self.location.origin;
            const indexFull = new URL('./index.html', scope).href;
            return (
              (await caches.match(indexFull)) ||
              (await caches.match(scope)) ||
              (await caches.match('./index.html')) ||
              (await caches.match('/index.html')) ||
              (await caches.match('/'))
            );
          }
        });
    })
  );
});

// Support immediate manual or programmatic activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
