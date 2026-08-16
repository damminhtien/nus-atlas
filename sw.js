/* Atlas service worker — generated asset manifest + runtime caching.
   `prerender.js` replaces the placeholder cache name and writes asset-manifest.json.
   The source file remains usable during zero-build local development. */
const CACHE = "__ATLAS_CACHE__";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];
const MANIFEST = "./asset-manifest.json";

self.addEventListener("install", e => {
  // Cache the new immutable asset set, then take control immediately. The page
  // reloads once after controllerchange, so the user never needs to clear cache
  // or click an update prompt.
  e.waitUntil(
    fetch(MANIFEST, { cache: "no-store" })
      .then(response => response.json())
      .then(manifest => caches.open(CACHE).then(cache => cache.addAll(CORE.concat(manifest.eager || manifest.assets || []))))
      .catch(() => caches.open(CACHE).then(cache => cache.addAll(CORE)).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// the page posts this when the user accepts an update
self.addEventListener("message", e => { if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting(); });

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isNavigation = req.mode === "navigate";
  const isControlFile = url.origin === self.location.origin && /\/(?:sw\.js|asset-manifest\.json)$/.test(url.pathname);

  // Never let the worker hide its own update script or the generated manifest.
  // The browser's service-worker update check also bypasses the HTTP cache.
  if (isControlFile) return;

  // HTML is the version boundary: always check the network first on reload,
  // while retaining the cached shell as an offline fallback.
  if (isNavigation) {
    e.respondWith(
      fetch(req, { cache: "no-store" })
        .then(res => {
          if (res && res.ok) caches.open(CACHE).then(cache => cache.put(req, res.clone())).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

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
