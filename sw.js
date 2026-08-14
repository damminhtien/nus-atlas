/* Atlas service worker — offline app shell + runtime caching.
   Bump CACHE when the asset list changes (e.g. after adding per-topic data files). */
const CACHE = "atlas-v1130";
// Pre-cache ONLY the lightweight app shell at install. The heavy per-topic data files
// (~6.4MB combined), viz.js, glossary/references/prereqs are deliberately left out:
// the page loads them on first visit and the fetch handler below caches every
// same-origin GET, so they end up cached anyway — without forcing a redundant
// multi-megabyte double-download at install time (page fetch + SW pre-fetch).
// Net: ~7MB lighter first visit; identical offline support after the first full load.
const CORE = [
  "./", "./index.html", "./css/styles.css",
  "./js/app.js", "./js/store.js", "./js/nus.js", "./js/nus-store.js",
  "./data/nus/provenance.js", "./data/nus/courses.js", "./data/nus/schedule.js", "./data/nus/assessments.js", "./data/nus/visuals.js",
  "./data/nus/dsa5101.js", "./data/nus/dsa5104.js", "./data/nus/dsa5105.js", "./data/nus/dsa5208.js",
  "./data/nus/artifacts.js",
  "./manifest.webmanifest", "./icon.svg"
];

self.addEventListener("install", e => {
  // pre-cache the shell, but WAIT (don't skipWaiting) so the page can offer a "refresh for new version" prompt
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
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
