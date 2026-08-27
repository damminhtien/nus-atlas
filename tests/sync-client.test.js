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

test("legacy last-lesson strings survive a cross-device merge", () => {
  const { client } = clientWithState({}, {});
  const merged = client.mergeSnapshots(
    { schemaVersion: "atlas.sync.v1", legacy: { lastLesson: "DSA5105/week1" }, study: {}, preferences: {} },
    { schemaVersion: "atlas.sync.v1", legacy: { lastLesson: "DSA5105/week2" }, study: {}, preferences: {} }
  );
  assert.equal(merged.legacy.lastLesson, "DSA5105/week1");
});

test("an expired session becomes signed out so the user can sign in again", async () => {
  const session = new MemoryStorage({ "atlas.sync.session.v1": "expired-token" });
  const root = { Store: { exportData: () => "{}" }, ATLAS_STUDY_STORE: { raw: {} } };
  const client = createSyncClient({
    root,
    storage: new MemoryStorage(),
    sessionStorage: session,
    endpoint: "https://example.test/api/sync",
    fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ error: "Authentication required" }) })
  });
  assert.equal(await client.syncNow(), false);
  assert.equal(client.status(), "signed-out");
  assert.equal(session.getItem("atlas.sync.session.v1"), null);
});

test("switching accounts never uploads the previous account's local mirror", async () => {
  const storage = new MemoryStorage({ "atlas.sync.account.v1": "damminhtien" });
  const session = new MemoryStorage();
  let legacy = { xp: 900, lessons: { privateToDefault: true } };
  let study = { lessons: { privateToDefault: true } };
  let uploaded;
  const root = {
    Store: { exportData: () => JSON.stringify(legacy), importData: value => { legacy = JSON.parse(value); } },
    ATLAS_STUDY_STORE: { get raw() { return study; }, importData: value => { study = value; } }
  };
  const client = createSyncClient({
    root,
    storage,
    sessionStorage: session,
    endpoint: "https://example.test/api/sync",
    fetchImpl: async (_url, options) => {
      if (options.method === "POST") return { ok: true, json: async () => ({ token: "new-token", username: "secondUser", revision: 0, state: { schemaVersion: "atlas.sync.v1", legacy: { xp: 4 }, study: { lessons: { second: true } }, preferences: {} } }) };
      uploaded = JSON.parse(options.body).state;
      return { ok: true, json: async () => ({ revision: 1 }) };
    }
  });
  await client.login("secondUser", "second-password");
  assert.equal(legacy.xp, 4);
  assert.deepEqual(study.lessons, { second: true });
  assert.equal(uploaded.legacy.xp, 4);
  assert.equal(storage.getItem("atlas.sync.account.v1"), "seconduser");
});

test("active practice merges answers by attempt and answer timestamps", () => {
  const { client } = clientWithState({}, {});
  const merged = client.mergeSnapshots(
    { schemaVersion: "atlas.sync.v1", legacy: {}, study: { activePractice: { attemptId: "a1", updatedAt: "2026-08-15T10:00:00.000Z", currentIndex: 2, questionIds: ["q1", "q2"], answers: [{ questionId: "q1", raw: "old", answeredAt: "2026-08-15T09:00:00.000Z" }] } }, preferences: {} },
    { schemaVersion: "atlas.sync.v1", legacy: {}, study: { activePractice: { attemptId: "a1", updatedAt: "2026-08-15T11:00:00.000Z", currentIndex: 1, questionIds: ["q1", "q2", "q3"], answers: [{ questionId: "q1", raw: "new", answeredAt: "2026-08-15T10:30:00.000Z" }, { questionId: "q2", raw: "remote", answeredAt: "2026-08-15T10:45:00.000Z" }] } }, preferences: {} }
  );
  assert.equal(merged.study.activePractice.currentIndex, 1, "newer session metadata wins");
  assert.deepEqual(merged.study.activePractice.questionIds, ["q1", "q2", "q3"]);
  assert.deepEqual(merged.study.activePractice.answers.map(item => item.raw).sort(), ["new", "remote"]);
});
