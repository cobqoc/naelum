const CACHE_NAME = 'naelum-v2';
const STATIC_CACHE = 'naelum-static-v2';
const RECIPE_CACHE = 'naelum-recipes-v2';
const IMAGE_CACHE = 'naelum-images-v2';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
];

const MAX_RECIPE_CACHE = 50;
const MAX_IMAGE_CACHE = 100;

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, STATIC_CACHE, RECIPE_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => !currentCaches.includes(key)).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Helper: limit cache size
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    return trimCache(cacheName, maxItems);
  }
}

// Fetch handler with strategy per resource type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API and auth requests
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  // Strategy: Images - Cache First
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, clone);
              trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE);
            });
          }
          return response;
        }).catch(() => {
          // Return a placeholder for failed images
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // Strategy: Recipe pages - Network First with cache fallback
  if (url.pathname.startsWith('/recipes/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            caches.open(RECIPE_CACHE).then((cache) => {
              cache.put(request, clone);
              trimCache(RECIPE_CACHE, MAX_RECIPE_CACHE);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Strategy: Everything else - Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          if (cached) return cached;
          if (request.mode === 'navigate') {
            return caches.match('/offline.html').then(r => r || caches.match('/'));
          }
          return new Response('Offline', { status: 503 });
        });

      return cached || fetchPromise;
    })
  );
});

// Push 알림 수신
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, url } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: { url },
      tag: url, // 같은 재료 알림은 덮어쓰기
      renotify: false,
    })
  );
});

// 알림 클릭 시 해당 페이지로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url);
      } else {
        clients.openWindow(url);
      }
    })
  );
});

// Handle recipe download for offline reading
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_RECIPE') {
    const { url, assets } = event.data;
    caches.open(RECIPE_CACHE).then((cache) => {
      cache.add(url);
      if (assets && assets.length > 0) {
        const imageCache = caches.open(IMAGE_CACHE);
        imageCache.then((ic) => {
          assets.forEach((asset) => {
            ic.add(asset).catch(() => {});
          });
        });
      }
    });
  }

  if (event.data && event.data.type === 'CLEAR_RECIPE_CACHE') {
    caches.delete(RECIPE_CACHE);
  }
});
