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

// Cache and return requests
self.addEventListener("fetch", (event) => {
  // Only cache GET requests, ignore firestore / api / chrome extension requests
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request).then((res) => {
        // Check if we received a valid response
        if (!res || res.status !== 200 || res.type !== "basic") {
          return res;
        }

        const responseToCache = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return res;
      }).catch(() => {
        // Fallback for offline if not in cache
        return caches.match("/login");
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
