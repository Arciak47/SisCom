const CACHE_NAME = "siscom-cache-v1";
const urlsToCache = [
  "/",
  "/login",
  "/manifest.json",
  "/logo-invecem.png",
  "/logo-invecem-gerente.png",
  "/background.png"
];

// Install SW and cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Cache and return requests (network-first strategy)
self.addEventListener("fetch", (event) => {
  // Only handle GET requests from our origin
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Never cache Next.js build chunks – they change on every build
  if (event.request.url.includes("/_next/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Got a valid network response – update cache and return it
        if (res && res.status === 200 && res.type === "basic") {
          const responseToCache = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return res;
      })
      .catch(() => {
        // Network failed – try cache fallback (offline support)
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/login");
        });
      })
  );
});

// Update SW and delete old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
