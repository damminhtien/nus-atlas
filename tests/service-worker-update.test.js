const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "sw.js"), "utf8");

test("service worker activates new versions without a manual prompt", () => {
  assert.match(serviceWorker, /self\.skipWaiting\(\)/);
  assert.match(index, /reg\.update\(\)\.catch/);
  assert.match(index, /worker\.postMessage\(\{ type: "SKIP_WAITING" \}\)/);
  assert.match(index, /location\.reload\(\)/);
  assert.doesNotMatch(index, /sw-refresh/);
});

test("reloads fetch fresh HTML and keeps an offline fallback", () => {
  assert.match(serviceWorker, /req\.mode === "navigate"/);
  assert.match(serviceWorker, /fetch\(req, \{ cache: "no-store" \}\)/);
  assert.match(serviceWorker, /caches\.match\("\.\/index\.html"\)/);
});

test("service worker update files bypass runtime cache", () => {
  assert.match(serviceWorker, /sw\\\.js\|asset-manifest\\\.json/);
  assert.match(serviceWorker, /if \(isControlFile\) return/);
});

test("content manifest is fetched network-first so new content is not hidden", () => {
  // The content manifest is not content-hashed; a stale cached copy would keep
  // serving old slide/lesson asset references and surface as a "not found" page.
  assert.match(serviceWorker, /content\\\/manifest\\\.json/);
  assert.match(serviceWorker, /isNavigation \|\| isContentManifest/);
});

test("service worker installs only eager shell assets", () => {
  assert.match(serviceWorker, /manifest\.eager \|\| manifest\.assets/);
  assert.match(fs.readFileSync(path.join(root, "prerender.js"), "utf8"), /const lazy = assets\.filter\(file => file\.startsWith\("content\//);
});
