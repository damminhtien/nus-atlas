const test = require("node:test");
const assert = require("node:assert/strict");
const createSyncClient = require("../src/core/sync-client");

class MemoryStorage {
  constructor(values = {}) { this.values = new Map(Object.entries(values)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function clientWithState(legacy, study, preferences = {}) {
  const storage = new MemoryStorage(preferences);
  const session = new MemoryStorage();
  const root = {
    Store: { exportData: () => JSON.stringify(legacy), importData: value => { root.importedLegacy = JSON.parse(value); } },
    ATLAS_STUDY_STORE: { raw: study, importData: value => { root.importedStudy = value; } }
  };
  return { client: createSyncClient({ root, storage, sessionStorage: session, endpoint: "https://example.test/api/sync", fetchImpl: async () => ({ ok: true, json: async () => ({}) }) }), root, storage };
}

test("sync merge preserves progress from both devices", () => {
  const { client } = clientWithState(
    { xp: 50, lessons: { foundation: true }, cards: { one: { reps: 2, due: 10 } }, tests: [{ id: "local" }] },
    { lessons: { linear: true }, attempts: [{ attemptId: "local" }], mastery: { linear: { score: 0.4 } } }
  );
  const merged = client.mergeSnapshots(client.snapshot(), {
    schemaVersion: "atlas.sync.v1",
    legacy: { xp: 100, lessons: { advanced: true }, cards: { one: { reps: 1, due: 99 } }, tests: [{ id: "remote" }] },
    study: { lessons: { unsupervised: true }, attempts: [{ attemptId: "remote" }], mastery: { linear: { score: 0.8 } } },
    preferences: { "atlas.textScale": "large" }
  });

  assert.equal(merged.legacy.xp, 100);
  assert.deepEqual(merged.legacy.lessons, { advanced: true, foundation: true });
  assert.equal(merged.legacy.cards.one.reps, 2);
  assert.deepEqual(merged.legacy.tests.map(item => item.id).sort(), ["local", "remote"]);
  assert.deepEqual(merged.study.lessons, { unsupervised: true, linear: true });
  assert.equal(merged.study.mastery.linear.score, 0.8);
  assert.equal(merged.preferences["atlas.textScale"], "large");
});

test("applySnapshot imports both stores and whitelisted preferences", () => {
  const { client, root, storage } = clientWithState({}, {});
  const snapshot = { schemaVersion: "atlas.sync.v1", legacy: { xp: 12 }, study: { lessons: { week1: true } }, preferences: { "atlas.theme": "light", "not-allowed": "ignore" } };
  client.applySnapshot(snapshot);

  assert.deepEqual(root.importedLegacy, { xp: 12 });
  assert.deepEqual(root.importedStudy, { lessons: { week1: true } });
  assert.equal(storage.getItem("atlas.theme"), "light");
  assert.equal(storage.getItem("not-allowed"), null);
});

test("empty last-lesson values remain null instead of becoming an empty object", () => {
  const { client } = clientWithState({}, {});
  const merged = client.mergeSnapshots({ schemaVersion: "atlas.sync.v1", legacy: {}, study: {}, preferences: {} }, { schemaVersion: "atlas.sync.v1", legacy: {}, study: {}, preferences: {} });
  assert.equal(merged.legacy.lastLesson, null);
  assert.equal(merged.study.lastLesson, null);
});
