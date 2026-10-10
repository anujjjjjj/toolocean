/**
 * Runtime cache for hashed build assets and the self-hosted fonts.
 *
 * HTML is never stored. A new deploy ships new /assets/ URLs, and activate
 * deletes every cache that is not this name, so an old shell cannot pin a
 * visitor to a stale prerender.
 *
 * clients.claim() runs only after the page's cache-urls message has stored
 * the chunks for this tool. Claiming earlier is what left caches.keys() empty
 * while navigator.serviceWorker.controller was already set.
 */
const CACHE = "toolocean-assets-v2";

function cacheable(url) {
  if (url.origin !== self.location.origin) return false;
  return url.pathname.startsWith("/assets/") || url.pathname.startsWith("/fonts/");
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!cacheable(url)) return;

  const font = url.pathname.startsWith("/fonts/");
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (!font) {
        const hit = await cache.match(request);
        if (hit) return hit;
      }
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (error) {
        const hit = await cache.match(request);
        if (hit) return hit;
        throw error;
      }
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "cache-urls") return;
  event.waitUntil(
    (async () => {
      // The page already stored these responses. Claiming earlier left the
      // controller set while the cache was still empty, and fetching them
      // again from here bypasses the HTTP cache.
      await self.clients.claim();
      event.source?.postMessage({ type: "cache-urls-done", stored: 0 });
    })(),
  );
});
