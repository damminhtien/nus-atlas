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

  assert.equal(store.schemaVersion, "nus.study.v3");
  assert.equal(store.raw.schemaVersion, "nus.study.v3");
  assert.equal(store.lessonDone("lesson1"), true);
  assert.equal(store.task("hw1").status, "done");
  assert.equal(store.attempts()[0].attemptId, "old-attempt");
  assert.equal(storage.read().schemaVersion, undefined, "migration persists at the next write");

  store.recordEvidence({ eventId: "recall:q1", type: "recall_correct", lessonId: "lesson1", xp: 5 });
  assert.equal(storage.read().schemaVersion, "nus.study.v3");
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

test("study store schedules mastered concepts and adapts retrieval intervals", () => {
  let now = new Date("2026-08-15T10:00:00.000Z");
  const store = createStudyStore({ storage: memoryStorage(), now: () => now });

  store.recordEvidence({ eventId: "lesson:ridge", type: "lesson_complete", courseCode: "DSA5105", lessonId: "ridge", xp: 0 });
  for (let index = 0; index < 4; index += 1) {
    store.recordEvidence({ eventId: `recall:ridge:${index}`, type: "recall_correct", courseCode: "DSA5105", lessonId: "ridge", xp: 0 });
  }

  assert.deepEqual(store.retrievalFor("ridge"), {
    lessonId: "ridge", courseCode: "DSA5105", interval: 1,
    dueAt: "2026-08-16T10:00:00.000Z", reps: 0, lastAt: null,
    lastResult: null, lastConfidence: null, lastQuestionId: null
  });

  now = new Date("2026-08-16T10:00:00.000Z");
  assert.equal(store.dueRetrievals("DSA5105").length, 1);
  const advanced = store.recordRetrieval({ reviewId: "r1", courseCode: "DSA5105", lessonId: "ridge", questionId: "q1", correct: true, confidence: "high" });
  assert.equal(advanced.interval, 3);
  assert.equal(advanced.dueAt, "2026-08-19T10:00:00.000Z");

  now = new Date("2026-08-19T10:00:00.000Z");
  const failed = store.recordRetrieval({ reviewId: "r2", courseCode: "DSA5105", lessonId: "ridge", questionId: "q1", correct: false, confidence: "low" });
  assert.equal(failed.interval, 1);
  assert.equal(failed.lastResult, "failed");
  assert.equal(store.events().some(event => event.type === "retrieval_failed"), true);
});

test("question attempts build a repairable mistake signal without passive XP", () => {
  const store = createStudyStore({ storage: memoryStorage(), now: () => new Date("2026-08-15T10:00:00.000Z") });
  const question = { id: "q1", lessonId: "lesson1", type: "short", prompt: "Why?", solution: "Because.", sourceRefs: [{ sourceId: "lecture.pdf", page: 2 }] };
  store.recordQuestionAttempt({ attemptId: "a1", courseCode: "DSA5105", correct: false, raw: "No", question });
  assert.deepEqual(store.questionStats("q1"), {
    questionId: "q1", attempts: 1, correct: 0, misses: 1, accuracy: 0, redeemed: 0,
    lastAt: "2026-08-15T10:00:00.000Z", lastCorrectAt: null
  });
  assert.equal(store.mistakes("DSA5105").length, 1);
  assert.equal(store.events()[0].xp, 0);
  store.redeemMistake("q1", "question:a1:q1");
  assert.equal(store.mistakes("DSA5105").length, 0);
  assert.equal(store.masteryFor("lesson1").score, 0.18);
  store.recordQuestionAttempt({ attemptId: "a2", courseCode: "DSA5105", correct: false, raw: "Still no", question });
  store.recordQuestionAttempt({ attemptId: "a3", courseCode: "DSA5105", correct: true, raw: "Because", question });
  assert.equal(store.mistakes("DSA5105").length, 0, "a later correct answer clears the unresolved queue");
});
