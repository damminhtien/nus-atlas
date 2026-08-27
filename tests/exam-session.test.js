const test = require("node:test");
const assert = require("node:assert/strict");
const createExamSession = require("../src/features/nus/exam-session.js");

function session() {
  let current = 1000;
  return createExamSession({ now: () => current, makeId: () => "attempt-1", advance: value => { current += value; } });
}

const questions = [{ id: "q1" }, { id: "q2" }, { id: "q3" }];

test("session answers, advances, backs up, and edits without duplicate records", () => {
  const api = session();
  let state = api.create({ courseCode: "DSA5105", questions, limitMinutes: 30, startedAt: new Date(1000).toISOString() });
  state = api.answer(state, { questionId: "q1", raw: "0", correct: true, gradingMode: "exact" });
  state = api.advance(state);
  assert.equal(state.currentIndex, 1);
  state = api.back(state);
  state = api.answer(state, { questionId: "q1", raw: "1", correct: false, gradingMode: "exact" });
  assert.equal(state.answers.length, 1);
  assert.equal(state.answers[0].raw, "1");
});

test("skip moves forward and records no scored answer", () => {
  const api = session();
  let state = api.create({ questions });
  state = api.skip(state);
  assert.equal(state.currentIndex, 1);
  assert.deepEqual(state.skippedQuestionIds, ["q1"]);
  assert.equal(state.answers.length, 0);
});

test("advance wraps to the first unanswered question after navigator jumps", () => {
  const api = session();
  let state = api.create({ questions });
  state = api.goTo(state, 2);
  state = api.answer(state, { raw: "last", correct: true, gradingMode: "exact" });
  state = api.advance(state);
  assert.equal(state.currentIndex, 0);
});

test("snapshot excludes question payload and restores it by stable ids", () => {
  const api = session();
  const state = api.create({ courseCode: "DSA5105", mode: "mock", questions, limitMinutes: 90 });
  const saved = api.snapshot(state);
  assert.equal(saved.questions, undefined);
  const restored = api.fromSnapshot(saved, questions);
  assert.deepEqual(restored.questionIds, ["q1", "q2", "q3"]);
  assert.equal(restored.questions[1].id, "q2");
  assert.equal(restored.mode, "mock");
});

test("deep mode survives the serializable session boundary", () => {
  const api = session();
  const state = api.create({ courseCode: "DSA5105", mode: "deep", questions, limitMinutes: 45 });
  assert.equal(api.fromSnapshot(api.snapshot(state), questions).mode, "deep");
});

test("timeout finishes a session and records timeout state", () => {
  const api = session();
  const state = api.create({ questions, startedAt: new Date(0).toISOString(), limitMinutes: 1 });
  const timedOut = api.timeout(state);
  assert.equal(timedOut.status, "finished");
  assert.equal(timedOut.timedOut, true);
});
