/* Atlas service worker — generated asset manifest + runtime caching.
   `prerender.js` replaces the placeholder cache name and writes asset-manifest.json.
   The source file remains usable during zero-build local development. */
const CACHE = "__ATLAS_CACHE__";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];
const MANIFEST = "./asset-manifest.json";

self.addEventListener("install", e => {
  // Pre-cache the generated app asset set, but WAIT (don't skipWaiting) so the
  // page can offer a "refresh for new version" prompt.
  e.waitUntil(fetch(MANIFEST).then(response => response.json()).then(manifest => caches.open(CACHE).then(cache => cache.addAll(CORE.concat(manifest.assets || [])))).catch(() => caches.open(CACHE).then(cache => cache.addAll(CORE)).catch(() => {})));
});

// the page posts this when the user accepts an update
self.addEventListener("message", e => { if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting(); });

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        // opportunistically cache same-origin + CDN (KaTeX, fonts, Pyodide)
        try { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } catch (_) {}
        return res;
      }).catch(() => req.mode === "navigate" ? caches.match("./index.html") : undefined);
    })
  );
});
