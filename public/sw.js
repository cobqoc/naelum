const CACHE_VERSION = 'v6';
const CACHE_NAME = `naelum-${CACHE_VERSION}`;
const STATIC_CACHE = `naelum-static-${CACHE_VERSION}`;
const RECIPE_CACHE = `naelum-recipes-${CACHE_VERSION}`;
const IMAGE_CACHE = `naelum-images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/manifest.json',
  '/offline.html',
];

const MAX_RECIPE_CACHE = 50;
const MAX_IMAGE_CACHE = 100;

// Install - cache static assets (홈은 캐시 안 함 — SSR 결과가 요청마다 다름)
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

  // Skip API, auth, 페이지 탐색 요청 (Next.js SSR 페이지는 항상 네트워크에서)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  // Strategy: Next.js 정적 자산 — Cache First (hash 포함되어 영구 캐시 안전)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Strategy: 이미지 — Cache First
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
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  // Strategy: 개별 레시피 페이지 (/recipes/[id]) — Network First with cache fallback
  if (url.pathname.match(/^\/recipes\/[^/]+$/)) {
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
        .catch(() =>
          caches.match(request).then((cached) =>
            cached || caches.match('/offline.html')
          )
        )
    );
    return;
  }

  // Strategy: 페이지 탐색 (/, /recipes, /search 등) — Network Only
  // SSR 페이지는 캐시하지 않고 항상 서버에서 최신 내용을 받음
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline.html')
      )
    );
    return;
  }

  // Strategy: 나머지 — Network First (캐시 없으면 자연 실패 — 합성 503 제거)
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
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
      tag: url,
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

// 특정 레시피 오프라인 저장
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_RECIPE') {
    const { url, assets } = event.data;
    caches.open(RECIPE_CACHE).then((cache) => {
      cache.add(url);
      if (assets && assets.length > 0) {
        caches.open(IMAGE_CACHE).then((ic) => {
          assets.forEach((asset) => ic.add(asset).catch(() => {}));
        });
      }
    });
  }

  if (event.data && event.data.type === 'CLEAR_RECIPE_CACHE') {
    caches.delete(RECIPE_CACHE);
  }
});
