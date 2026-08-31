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

test("study store migrates an earlier v1 state without losing progress", () => {
  const storage = memoryStorage({
    tasks: { hw1: { status: "done", checks: [true] } },
    lessons: { lesson1: true },
    attempts: [{ attemptId: "old-attempt", score: 3, total: 5 }],
    events: { "lesson:lesson1": { eventId: "lesson:lesson1", type: "lesson_complete", lessonId: "lesson1", at: "2026-08-15T09:00:00.000Z" } },
    mastery: { lesson1: { score: 0.35, attempts: 1, correct: 0, lastAt: "2026-08-15T09:00:00.000Z" } },
    questHistory: {}
  });
  const store = createStudyStore({ storage, now: () => new Date("2026-08-15T10:00:00.000Z") });

  assert.equal(store.schemaVersion, "nus.study.v5");
  assert.equal(store.raw.schemaVersion, "nus.study.v5");
  assert.equal(store.lessonDone("lesson1"), true);
  assert.equal(store.task("hw1").status, "done");
  assert.equal(store.attempts()[0].attemptId, "old-attempt");
  assert.equal(storage.read().schemaVersion, undefined, "migration persists at the next write");

  store.recordEvidence({ eventId: "recall:q1", type: "recall_correct", lessonId: "lesson1", xp: 5 });
  assert.equal(storage.read().schemaVersion, "nus.study.v5");
});

test("study store persists and resumes slide/textbook reading positions", () => {
  let now = new Date("2026-08-15T10:00:00.000Z");
  const storage = memoryStorage();
  const store = createStudyStore({ storage, now: () => now });

  const slide = store.recordReading({
    resourceId: "slide:DSA5105:dsa5105-week1-annotated",
    kind: "slide",
    courseCode: "DSA5105",
    sourceId: "DSA5105/Lec1_annotated.pdf",
    title: "Week 1 · Annotated lecture slide reader",
    unit: "slide",
    position: 12,
    total: 55
  });
  const textbook = store.recordReading({
    resourceId: "textbook:DSA5105:DSA5105/Textbook.pdf",
    kind: "textbook",
    courseCode: "DSA5105",
    sourceId: "DSA5105/Textbook.pdf",
    title: "Principles of Machine Learning textbook",
    unit: "page",
    position: 29,
    total: 129
  });

  assert.equal(slide.position, 12);
  assert.equal(slide.furthest, 12);
  assert.equal(textbook.position, 29);
  assert.equal(store.readingFor(slide.resourceId).position, 12);
  assert.equal(store.readingList("DSA5105", "textbook")[0].position, 29);
  assert.equal(storage.read().reading[slide.resourceId].unit, "slide");

  now = new Date("2026-08-15T11:00:00.000Z");
  store.recordReading({ resourceId: slide.resourceId, position: 8, total: 55 });
  assert.equal(store.readingFor(slide.resourceId).position, 8, "resume uses the latest position");
  assert.equal(store.readingFor(slide.resourceId).furthest, 12, "furthest progress is never lost");
});

test("study store remembers the last lesson without awarding learning evidence", () => {
  const storage = memoryStorage();
  const store = createStudyStore({ storage, now: () => new Date("2026-08-15T10:00:00.000Z") });

  assert.deepEqual(store.lastLesson(), null);
  assert.deepEqual(store.setLastLesson({ courseCode: "DSA5105", lessonId: "basis-functions" }), {
    courseCode: "DSA5105", lessonId: "basis-functions", at: "2026-08-15T10:00:00.000Z"
  });
  assert.deepEqual(store.lastLesson(), {
    courseCode: "DSA5105", lessonId: "basis-functions", at: "2026-08-15T10:00:00.000Z"
  });
  assert.equal(store.events().length, 0);
  assert.equal(storage.read().lastLesson.lessonId, "basis-functions");
});

test("study store derives gamification from canonical DSA evidence", () => {
  const store = createStudyStore({ storage: memoryStorage(), now: () => new Date("2026-08-15T10:00:00.000Z") });
  store.recordEvidence({ eventId: "lesson:one", type: "lesson_complete", courseCode: "DSA5105", lessonId: "one", xp: 40 });
  store.recordEvidence({ eventId: "recall:one", type: "recall_correct", courseCode: "DSA5105", lessonId: "one", xp: 5 });
  const snapshot = store.gamification();
  assert.equal(snapshot.xp, 45);
  assert.equal(snapshot.streak, 1);
  assert.equal(snapshot.todayXp, 45);
  assert.deepEqual(snapshot.activeDays, { "2026-08-15": 1 });
  assert.equal(snapshot.goalXp, 50);
  assert.deepEqual(snapshot.level, { level: 1, name: "Novice", xp: 45, pct: 30, toNext: 105, next: { level: 2, name: "Apprentice", xp: 150 } });
});

test("study store uses the Singapore calendar day for streak activity", () => {
  const store = createStudyStore({
    storage: memoryStorage(),
    now: () => new Date("2026-08-15T16:30:00.000Z")
  });

  store.recordEvidence({ eventId: "study:after-midnight", type: "study_action", xp: 7 });

  assert.deepEqual(store.gamification().activeDays, { "2026-08-16": 1 });
  assert.equal(store.gamification().streak, 1);
  assert.equal(store.gamification().todayXp, 7);
});

test("study store preserves yesterday's streak until a full day is missed", () => {
  let now = new Date("2026-08-15T10:00:00.000Z");
  const store = createStudyStore({ storage: memoryStorage(), now: () => now });
  store.recordEvidence({ eventId: "study:yesterday", type: "study_action", xp: 0 });

  now = new Date("2026-08-16T10:00:00.000Z");
  assert.equal(store.gamification().streak, 1);

  now = new Date("2026-08-17T10:00:00.000Z");
  assert.equal(store.gamification().streak, 0);
});

test("meaningful reading progress keeps the study streak active without XP", () => {
  let now = new Date("2026-08-15T10:00:00.000Z");
  const store = createStudyStore({ storage: memoryStorage(), now: () => now });
  const reading = { resourceId: "slide:DSA5105:week1", kind: "slide", courseCode: "DSA5105", position: 1, total: 10 };

  store.recordReading(reading);
  assert.equal(store.events().length, 0, "opening a resource is not study evidence");
  store.recordReading({ ...reading, position: 2 });
  assert.equal(store.events()[0].type, "reading_progress");
  assert.equal(store.gamification().streak, 1);
  assert.equal(store.gamification().xp, 0);

  now = new Date("2026-08-15T11:00:00.000Z");
  store.recordReading({ ...reading, position: 3 });
  assert.equal(store.events().length, 1, "reading activity is idempotent within a calendar day");
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

test("submitting an exam never creates mastery evidence", () => {
  const store = createStudyStore({ storage: memoryStorage(), now: () => new Date("2026-08-15T10:00:00.000Z") });

  store.recordAttempt({ attemptId: "zero", mode: "exam", courseCode: "DSA5105", lessonId: "lesson1", score: 0, total: 5 });
  assert.deepEqual(store.masteryFor("lesson1"), { score: 0, attempts: 0, correct: 0, lastAt: null });

  store.recordAttempt({ attemptId: "perfect", mode: "exam", courseCode: "DSA5105", lessonId: "lesson1", score: 5, total: 5 });
  assert.deepEqual(store.masteryFor("lesson1"), { score: 0, attempts: 0, correct: 0, lastAt: null });
  assert.equal(store.events().filter(event => event.type === "exam_submitted").length, 2);
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

test("study store persists a compact active practice snapshot and clears only its completed attempt", () => {
  const storage = memoryStorage();
  const store = createStudyStore({ storage, now: () => new Date("2026-08-15T10:00:00.000Z") });
  store.setActivePractice({
    attemptId: "practice-1", courseCode: "DSA5105", mode: "adaptive", scope: "", questionIds: ["q1"],
    generatedSeeds: { q1: 42 }, answers: [{ questionId: "q1", raw: "answer", correct: true, gradingMode: "exact" }],
    currentIndex: 1, startedAt: "2026-08-15T09:00:00.000Z", elapsedSeconds: 60, limitMinutes: 30,
    updatedAt: "2026-08-15T10:00:00.000Z", status: "active"
  });
  assert.equal(store.activePractice().attemptId, "practice-1");
  assert.equal(storage.read().activePractice.answers[0].questionId, "q1");
  store.recordAttempt({ attemptId: "other", courseCode: "DSA5105", score: 0, total: 1 });
  assert.equal(store.activePractice().attemptId, "practice-1");
  store.recordAttempt({ attemptId: "practice-1", courseCode: "DSA5105", score: 1, total: 1 });
  assert.equal(store.activePractice(), null);
});
