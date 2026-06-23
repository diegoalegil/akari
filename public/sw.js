/* Akari offline service worker — hand-written, no build step. */
const CACHE = "akari-v1";

const PRECACHE_URLS = [
  "/",
  "/akari.db.gz",
  "/sql-wasm.wasm",
  "/manifest.webmanifest",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Add each asset individually so one miss doesn't fail the whole install.
      for (const url of PRECACHE_URLS) {
        try {
          await cache.add(url);
        } catch (_) {
          /* asset missing at install time — ignore */
        }
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
        );
      } catch (_) {
        /* ignore cache cleanup errors */
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle same-origin GET requests.
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network-first, fall back to app shell, then cache.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (_) {
          const cache = await caches.open(CACHE);
          const shell = await cache.match("/");
          if (shell) return shell;
          const cached = await cache.match(request);
          if (cached) return cached;
          return Response.error();
        }
      })()
    );
    return;
  }

  // Other GETs: cache-first, then network with stale-while-revalidate caching.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        // Only cache successful, basic (same-origin, non-opaque) responses.
        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {
          try {
            await cache.put(request, response.clone());
          } catch (_) {
            /* ignore put errors */
          }
        }
        return response;
      } catch (_) {
        return Response.error();
      }
    })()
  );
});
