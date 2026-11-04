/* Morocco Weather Today — service worker.
 * Scope: app shell + static assets only. Weather data (Open-Meteo), map tiles, RainViewer and /api/* are NEVER cached here:
 * they always go to the network so forecasts are never silently stale. The page itself shows the last in-memory data when a refresh fails. */
const VERSION = "v2";
const SHELL = `mwt-shell-${VERSION}`;
const RUNTIME = `mwt-runtime-${VERSION}`;
const PRECACHE = ["/offline.html", "/manifest.webmanifest", "/favicon.svg", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png", "/icons/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => Promise.allSettled(PRECACHE.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("mwt-") && k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isStatic = (url) => url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/favicon.svg" || url.pathname === "/manifest.webmanifest";

async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res && res.ok) { const copy = res.clone(); caches.open(RUNTIME).then((c) => c.put(request, copy)).catch(() => {}); }
  return res;
}

async function networkFirstPage(request) {
  try {
    const res = await fetch(request);
    if (res && res.ok) { const copy = res.clone(); caches.open(RUNTIME).then((c) => c.put(request, copy)).catch(() => {}); }
    return res;
  } catch (err) {
    const hit = await caches.match(request, { ignoreSearch: true });
    if (hit) return hit;
    const offline = await caches.match("/offline.html");
    if (offline) return offline;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;            // Open-Meteo, RainViewer, tile servers: network only
  if (url.pathname.startsWith("/api/")) return;                // wind grid etc.: network only
  if (url.searchParams.has("_rsc") || request.headers.get("RSC")) return; // Next.js client-navigation payloads: network only
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") { event.respondWith(networkFirstPage(request)); return; }
  if (isStatic(url)) { event.respondWith(cacheFirst(request)); }
});
