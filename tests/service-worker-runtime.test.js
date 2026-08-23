const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const test = require("node:test");

function loadWorker() {
  const listeners = {};
  const deleted = [];
  let activationPromise = null;
  const context = {
    self: {
      addEventListener(type, handler) { listeners[type] = handler; },
      clients: { claim: async () => {} },
      skipWaiting: async () => {}
    },
    caches: {
      keys: async () => ["other-app-cache", "nus-atlas:old", "nus-atlas:current"],
      delete: async key => { deleted.push(key); return true; },
      open: async () => ({ addAll: async () => {}, put: async () => {} }),
      match: async () => undefined
    },
    URL,
    Promise,
    fetch: async () => ({ ok: true, clone() { return this; }, json: async () => ({ eager: [] }) })
  };
  const source = fs.readFileSync("sw.js", "utf8").replace('"__ATLAS_CACHE__"', '"nus-atlas:current"');
  vm.runInNewContext(source, context, { filename: "sw.js" });
  listeners.activate({ waitUntil(promise) { activationPromise = promise; } });
  return { deleted, done: () => activationPromise };
}

test("service worker activation deletes only Atlas-owned caches", async () => {
  const worker = loadWorker();
  await worker.done();
  assert.deepEqual(worker.deleted, ["nus-atlas:old"]);
});
