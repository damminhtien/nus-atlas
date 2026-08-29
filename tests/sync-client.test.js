const test = require("node:test");
const assert = require("node:assert/strict");
const createSyncClient = require("../src/core/sync-client");

class MemoryStorage {
  constructor(values = {}) { this.values = new Map(Object.entries(values)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function clientWithState(study = {}, preferences = {}) {
  const storage = new MemoryStorage(preferences);
  const session = new MemoryStorage();
  const root = { ATLAS_STUDY_STORE: { raw: study, importData: value => { root.importedStudy = value; } } };
  const client = createSyncClient({
    root,
    storage,
    sessionStorage: session,
    endpoint: "https://example.test/api/sync",
    fetchImpl: async () => ({ ok: true, json: async () => ({}) })
  });
  return { client, root, storage };
}

test("sync merge preserves canonical study progress from both devices", () => {
  const { client } = clientWithState(
    { lessons: { linear: true }, attempts: [{ attemptId: "local" }], mastery: { linear: { score: 0.4 } } }
  );
  const merged = client.mergeSnapshots(client.snapshot(), {
    schemaVersion: "atlas.sync.v1",
    study: { lessons: { unsupervised: true }, attempts: [{ attemptId: "remote" }], mastery: { linear: { score: 0.8 } } },
    preferences: { "atlas.textScale": "large" }
  });

  assert.deepEqual(merged.study.lessons, { unsupervised: true, linear: true });
  assert.deepEqual(merged.study.attempts.map(item => item.attemptId).sort(), ["local", "remote"]);
  assert.equal(merged.study.mastery.linear.score, 0.8);
  assert.equal(merged.preferences["atlas.textScale"], "large");
  assert.equal(Object.prototype.hasOwnProperty.call(merged, "legacy"), false);
});

test("applySnapshot imports canonical study state and whitelisted preferences", () => {
  const { client, root, storage } = clientWithState();
  client.applySnapshot({ schemaVersion: "atlas.sync.v1", study: { lessons: { week1: true } }, preferences: { "atlas.theme": "light", "not-allowed": "ignore" } });

  assert.deepEqual(root.importedStudy, { lessons: { week1: true } });
  assert.equal(storage.getItem("atlas.theme"), "light");
  assert.equal(storage.getItem("not-allowed"), null);
});

test("empty last-lesson values remain null instead of becoming an empty object", () => {
  const { client } = clientWithState();
  const merged = client.mergeSnapshots({ schemaVersion: "atlas.sync.v1", study: {}, preferences: {} }, { schemaVersion: "atlas.sync.v1", study: {}, preferences: {} });
  assert.equal(merged.study.lastLesson, null);
});

test("an expired session becomes signed out so the user can sign in again", async () => {
  const session = new MemoryStorage({ "atlas.sync.session.v1": "expired-token" });
  const root = { ATLAS_STUDY_STORE: { raw: {} } };
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
  let study = { lessons: { privateToDefault: true } };
  let uploaded;
  const root = { ATLAS_STUDY_STORE: { get raw() { return study; }, importData: value => { study = value; } } };
  const client = createSyncClient({
    root,
    storage,
    sessionStorage: session,
    endpoint: "https://example.test/api/sync",
    fetchImpl: async (_url, options) => {
      if (options.method === "POST") return { ok: true, json: async () => ({ token: "new-token", username: "secondUser", revision: 0, state: { schemaVersion: "atlas.sync.v1", study: { lessons: { second: true } }, preferences: {} } }) };
      uploaded = JSON.parse(options.body).state;
      return { ok: true, json: async () => ({ revision: 1 }) };
    }
  });
  await client.login("secondUser", "second-password");
  assert.deepEqual(study.lessons, { second: true });
  assert.deepEqual(uploaded.study.lessons, { second: true });
  assert.equal(Object.prototype.hasOwnProperty.call(uploaded, "legacy"), false);
  assert.equal(storage.getItem("atlas.sync.account.v1"), "seconduser");
});

test("active practice merges answers by attempt and answer timestamps", () => {
  const { client } = clientWithState();
  const merged = client.mergeSnapshots(
    { schemaVersion: "atlas.sync.v1", study: { activePractice: { attemptId: "a1", updatedAt: "2026-08-15T10:00:00.000Z", currentIndex: 2, questionIds: ["q1", "q2"], answers: [{ questionId: "q1", raw: "old", answeredAt: "2026-08-15T09:00:00.000Z" }] } }, preferences: {} },
    { schemaVersion: "atlas.sync.v1", study: { activePractice: { attemptId: "a1", updatedAt: "2026-08-15T11:00:00.000Z", currentIndex: 1, questionIds: ["q1", "q2", "q3"], answers: [{ questionId: "q1", raw: "new", answeredAt: "2026-08-15T10:30:00.000Z" }, { questionId: "q2", raw: "remote", answeredAt: "2026-08-15T10:45:00.000Z" }] } }, preferences: {} }
  );
  assert.equal(merged.study.activePractice.currentIndex, 1);
  assert.deepEqual(merged.study.activePractice.questionIds, ["q1", "q2", "q3"]);
  assert.deepEqual(merged.study.activePractice.answers.map(item => item.raw).sort(), ["new", "remote"]);
});
