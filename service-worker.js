/**
 * ChemTable PWA - Service Worker (Main)
 * Offline-First Single Page Application (SPA) Caching Engine
 * PWABuilder Compliant - Production Ready v3.0.0
 * 
 * Lifecycle: Install → Activate → Fetch/Message/Sync
 * Strategy: Cache-First with Network Update (Stale-While-Revalidate variant)
 */

const CACHE_NAME = 'chemtable-spa-v3.0.0';
const RUNTIME_CACHE = 'chemtable-runtime-v3.0.0';
const IMAGE_CACHE = 'chemtable-images-v3.0.0';

// Static assets to pre-cache on install
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

// Max cache sizes for runtime caching
const CACHE_LIMITS = {
  runtime: 50,
  images: 100,
  api: 30
};

/**
 * INSTALL EVENT
 * Pre-caches all static assets and skipWaiting for immediate activation
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Install event triggered');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Pre-caching static offline assets');
      
      // Resolve all assets relative to service worker scope
      const urlsToCache = STATIC_ASSETS.map((asset) => {
        try {
          return new URL(asset, self.registration ? self.registration.scope : self.location.href).href;
        } catch (e) {
          console.warn('[SW] Asset URL parse error:', asset, e);
          return asset;
        }
      });

      // Use Promise.allSettled to gracefully handle failures
      const results = await Promise.allSettled(
        urlsToCache.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Pre-cache skip for ${url}:`, err.message);
            return null;
          })
        )
      );

      const cached = results.filter(r => r.status === 'fulfilled').length;
      console.log(`[SW] Pre-cached ${cached}/${urlsToCache.length} assets`);
    }).then(() => {
      // Immediately activate new service worker
      self.skipWaiting();
      console.log('[SW] skipWaiting triggered - new SW will activate immediately');
    })
  );
});

/**
 * ACTIVATE EVENT
 * Cleans up old cache versions and claims all clients
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event triggered');
  
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          const isOldCache = 
            key !== CACHE_NAME && 
            key !== RUNTIME_CACHE && 
            key !== IMAGE_CACHE &&
            key.startsWith('chemtable-');
          
          if (isOldCache) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // Claim all clients to ensure new SW controls all pages
      self.clients.claim();
      console.log('[SW] clients.claim() - new SW is now active');
    })
  );
});

/**
 * FETCH EVENT
 * Implements offline-first caching with different strategies per resource type
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests and http/https schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Route to appropriate caching strategy
  if (request.mode === 'navigate') {
    // Navigation requests - serve cached SPA entry point
    event.respondWith(handleNavigationRequest(request));
  } else if (url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
    // Image requests - use network-first with image cache
    event.respondWith(handleImageRequest(request));
  } else if (url.origin === self.location.origin) {
    // Same-origin API/data requests - cache-first with update
    event.respondWith(handleSameOriginRequest(request));
  } else {
    // Cross-origin requests - network-first
    event.respondWith(handleCrossOriginRequest(request));
  }
});

/**
 * Handle navigation requests (page loads, links)
 * Returns cached SPA entry point when offline
 */
async function handleNavigationRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Update cache in background if online
      updateCacheInBackground(request);
      return cachedResponse;
    }

    // Not in cache - try network
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Navigation fetch failed, serving offline fallback:', error);
    
    // Return cached SPA entry point
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
}

/**
 * Handle image requests
 * Network-first, cache for offline access
 */
async function handleImageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    return networkResponse;
  } catch (error) {
    // Return cached image or placeholder
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return a transparent placeholder if no cache available
    return new Response(
      new Blob([], { type: 'image/png' }),
      { headers: { 'Content-Type': 'image/png' } }
    );
  }
}

/**
 * Handle same-origin requests (API, data files)
 * Cache-first with background update
 */
async function handleSameOriginRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached, update in background
    updateCacheInBackground(request);
    return cachedResponse;
  }

  // Not cached - fetch and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      await trimCache(RUNTIME_CACHE, CACHE_LIMITS.runtime);
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Same-origin fetch failed:', error);
    return new Response('Offline - Resource not available', { status: 503 });
  }
}

/**
 * Handle cross-origin requests (CDN, third-party APIs)
 * Network-first with graceful fallback
 */
async function handleCrossOriginRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      await trimCache(RUNTIME_CACHE, CACHE_LIMITS.runtime);
    }
    return networkResponse;
  } catch (error) {
    // Return cached if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    return new Response('Network unavailable', { status: 503 });
  }
}

/**
 * Update cache in background without blocking response
 */
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cacheName = 
        request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) ? IMAGE_CACHE : RUNTIME_CACHE;
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silently fail - we already have cached response
  }
}

/**
 * Trim cache to specified size limit
 */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    const keysToDelete = keys.slice(0, keys.length - maxItems);
    for (const key of keysToDelete) {
      await cache.delete(key);
    }
  }
}

/**
 * MESSAGE EVENT
 * Handle messages from client pages and background tasks
 */
self.addEventListener('message', (event) => {
  const { data } = event;

  if (data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING message received');
    self.skipWaiting();
  }

  if (data.type === 'CLEAR_CACHE') {
    console.log('[SW] CLEAR_CACHE message received');
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key.startsWith('chemtable-')) {
              return caches.delete(key);
            }
          })
        );
      })
    );
  }

  if (data.type === 'CACHE_URLS') {
    console.log('[SW] CACHE_URLS message received for:', data.urls);
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return Promise.all(
          data.urls.map((url) =>
            cache.add(url).catch((err) => 
              console.warn('[SW] Failed to cache URL:', url, err)
            )
          )
        );
      })
    );
  }
});

/**
 * SYNC EVENT
 * Background sync for periodic data updates
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'sync-chemistry-data') {
    event.waitUntil(syncChemistryData());
  }

  if (event.tag === 'sync-periodic-table') {
    event.waitUntil(syncPeriodicTableData());
  }
});

/**
 * Sync chemistry database
 */
async function syncChemistryData() {
  try {
    const response = await fetch('./chemistry_data.json');
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put('./chemistry_data.json', response.clone());
      
      // Notify all clients of successful sync
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          data: 'Chemistry data updated'
        });
      });
    }
  } catch (error) {
    console.error('[SW] Chemistry data sync failed:', error);
  }
}

/**
 * Sync periodic table data
 */
async function syncPeriodicTableData() {
  try {
    const response = await fetch('./data.json');
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put('./data.json', response.clone());
      
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          data: 'Periodic table data updated'
        });
      });
    }
  } catch (error) {
    console.error('[SW] Periodic table sync failed:', error);
  }
}

/**
 * PUSH EVENT
 * Handle push notifications from server
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: './pwa-192x192.png',
      badge: './icon.svg',
      tag: 'chemtable-notification',
      requireInteraction: false,
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'close', title: 'Dismiss' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification('ChemTable Update', options)
    );
  }
});

/**
 * NOTIFICATION CLICK EVENT
 * Handle notification interactions
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Focus existing window if open
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
    );
  }
});

console.log('[SW] Service Worker loaded successfully - v3.0.0 PWABuilder Compliant');
