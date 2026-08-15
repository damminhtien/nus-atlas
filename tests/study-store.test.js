const test = require("node:test");
const assert = require("node:assert/strict");
const createStudyStore = require("../src/core/study-store.js");

function memoryStorage(value) {
  let data = value == null ? null : JSON.stringify(value);
  return {
    getItem() { return data; },
    setItem(_key, next) { data = next; },
    read() { return data ? JSON.parse(data) : null; }
  };
}

test("study store migrates legacy v1 state without losing progress", () => {
  const storage = memoryStorage({
    tasks: { hw1: { status: "done", checks: [true] } },
    lessons: { lesson1: true },
    attempts: [{ attemptId: "old-attempt", score: 3, total: 5 }],
    events: { "lesson:lesson1": { eventId: "lesson:lesson1", type: "lesson_complete", lessonId: "lesson1", at: "2026-08-15T09:00:00.000Z" } },
    mastery: { lesson1: { score: 0.35, attempts: 1, correct: 0, lastAt: "2026-08-15T09:00:00.000Z" } },
    questHistory: {}
  });
  const store = createStudyStore({ storage, now: () => new Date("2026-08-15T10:00:00.000Z") });

  assert.equal(store.schemaVersion, "nus.study.v2");
  assert.equal(store.raw.schemaVersion, "nus.study.v2");
  assert.equal(store.lessonDone("lesson1"), true);
  assert.equal(store.task("hw1").status, "done");
  assert.equal(store.attempts()[0].attemptId, "old-attempt");
  assert.equal(storage.read().schemaVersion, undefined, "migration persists at the next write");

  store.recordEvidence({ eventId: "recall:q1", type: "recall_correct", lessonId: "lesson1", xp: 5 });
  assert.equal(storage.read().schemaVersion, "nus.study.v2");
});

test("study store keeps evidence idempotent and updates mastery", () => {
  const store = createStudyStore({ storage: memoryStorage(), now: () => new Date("2026-08-15T10:00:00.000Z") });
  const first = store.recordEvidence({ eventId: "recall:q1", type: "recall_correct", lessonId: "lesson1", xp: 5 });
  const duplicate = store.recordEvidence({ eventId: "recall:q1", type: "recall_correct", lessonId: "lesson1", xp: 5 });

  assert.equal(first.awarded, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(store.events().length, 1);
  assert.equal(store.masteryFor("lesson1").score, 0.12);
});
