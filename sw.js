/* Atlas service worker — generated asset manifest + runtime caching.
   `prerender.js` replaces the placeholder cache name and writes asset-manifest.json.
   The source file remains usable during zero-build local development. */
const CACHE = "__ATLAS_CACHE__";
const CACHE_PREFIX = "nus-atlas:";
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
  // CacheStorage is shared by every GitHub Pages app on this origin. Only
  // remove caches owned by NUS Atlas; never sweep another app's namespace.
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isNavigation = req.mode === "navigate";
  const isControlFile = url.origin === self.location.origin && /\/(?:sw\.js|asset-manifest\.json)$/.test(url.pathname);
  // The content manifest is the version boundary for every lazy content shard
  // (slide sets, lessons, question banks). It is not content-hashed, so a stale
  // cached copy would keep serving old asset references and hide newly added
  // content (for example a new lecture slide set) behind a "not found" page.
  const isContentManifest = url.origin === self.location.origin && /\/content\/manifest\.json$/.test(url.pathname);

  // Never let the worker hide its own update script or the generated manifest.
  // The browser's service-worker update check also bypasses the HTTP cache.
  if (isControlFile) return;

  // HTML and the content manifest are version boundaries: always check the
  // network first on reload, while retaining the cached copy as an offline
  // fallback.
  if (isNavigation || isContentManifest) {
    e.respondWith(
      fetch(req, { cache: "no-store" })
        .then(res => {
          if (res && res.ok) caches.open(CACHE).then(cache => cache.put(req, res.clone())).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || (isNavigation ? caches.match("./index.html") : undefined)))
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
