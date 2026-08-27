const test = require("node:test");
const assert = require("node:assert/strict");
const createExamFeature = require("../src/features/nus/exam.js");

test("exam feature keeps question selection scoped to a lesson", () => {
  const root = { innerHTML: "", querySelector: () => ({ addEventListener() {} }), querySelectorAll: () => [] };
  const feature = createExamFeature({
    root,
    getCourses: () => [{ code: "DSA5105", title: "Machine Learning" }],
    getLessons: code => code === "DSA5105" ? [{
      id: "lesson-a",
      title: "Linear models",
      sourceRefs: [{ sourceId: "lecture.pdf", page: 1 }],
      questions: [{ id: "q1", type: "mcq", prompt: "Which?", choices: ["A", "B"], answer: 1 }],
      sections: [{ body: "A short review." }]
    }] : [],
    getStore: () => ({ recordEvidence() {}, recordAttempt() {} }),
    pageHead: (_kicker, title, description) => `<h1>${title}</h1><p>${description || ""}</p>`,
    sourceItem: ref => ref.sourceId,
    text: value => value,
    esc: value => String(value),
    button: label => label,
    typeset() {}
  });

  feature.render("DSA5105", "lesson-a");

  assert.match(root.innerHTML, /Practice/);
  assert.match(root.innerHTML, /Linear models/);
  assert.match(root.innerHTML, /Start practice/);
  assert.match(root.innerHTML, /Adaptive practice/);
  assert.match(root.innerHTML, /open responses are clearly labeled feedback/);
});

test("exam feature runs the canonical DSA5101 timed mixed plan", () => {
  const root = { innerHTML: "", querySelector: () => ({ addEventListener() {} }), querySelectorAll: () => [] };
  const lessons = [{
    id: "lesson-a",
    title: "Clustering",
    questions: [{ id: "q1", type: "mcq", prompt: "Which?", choices: ["A", "B"], answer: 1 }]
  }, {
    id: "lesson-b",
    title: "Streams",
    questions: [{ id: "q2", type: "short", prompt: "Why?", accepted: ["bounded"] }]
  }];
  const feature = createExamFeature({
    root,
    getCourses: () => [{ code: "DSA5101", title: "Big Data" }],
    getLessons: () => lessons,
    getAssessmentMap: () => ({ practicePlan: { durationMinutes: 90, questionCount: 2, questionIds: ["q1", "q2"] } }),
    getStore: () => ({ recordEvidence() {}, recordAttempt() {} }),
    pageHead: (_kicker, title) => `<h1>${title}</h1>`,
    sourceItem: ref => ref.sourceId,
    text: value => value,
    esc: value => String(value),
    button: label => label,
    typeset() {}
  });

  const plan = feature.practicePlanFor("DSA5101", "mixed-exam");
  assert.equal(feature.questionsForPracticePlan("DSA5101", plan).length, 2);
  feature.render("DSA5101", "mixed-exam");
  assert.match(root.innerHTML, /Mock exam/);
  assert.match(root.innerHTML, /90 minutes/);
});

test("derivation rubric requires every declared concept", () => {
  const feature = createExamFeature({
    root: { innerHTML: "" }, getCourses: () => [], getLessons: () => [], getStore: () => ({}),
    pageHead: () => "", sourceItem: () => "", text: value => value, esc: value => String(value), button: () => "", typeset() {}
  });
  const question = {
    type: "derivation",
    rubric: [
      { label: "normal equation", required: ["a lambda i", "w", "b"] },
      { label: "interpretation", required: ["weak", "shrink"] }
    ],
    accepted: ["ridge spectral filter"]
  };
  assert.equal(feature.answerKey(question, "(A + lambda I) w = b"), false);
  assert.equal(feature.answerKey(question, "(A + lambda I) w = b; weak directions shrink"), true);
});

test("only deterministic grades are eligible for mastery evidence", () => {
  const feature = createExamFeature({
    root: { innerHTML: "" }, getCourses: () => [], getLessons: () => [], getStore: () => ({}),
    pageHead: () => "", sourceItem: () => "", text: value => value, esc: value => String(value), button: () => "", typeset() {}
  });
  const mcq = { type: "mcq", answer: 0, choices: ["A"] };
  const derivation = { type: "derivation", rubric: [{ label: "step", required: ["step"] }] };
  const short = { type: "short", accepted: ["answer"] };

  assert.equal(feature.gradingMode(mcq), "exact");
  assert.equal(feature.gradingMode(derivation), "rubric");
  assert.equal(feature.gradingMode(short), "heuristic");
  assert.equal(feature.masteryEligible(mcq), true);
  assert.equal(feature.masteryEligible(derivation), false);
  assert.equal(feature.masteryEligible(short), false);
});

test("numeric grading is local and open-response grading stays outside mastery", () => {
  const feature = createExamFeature({
    root: { innerHTML: "" }, getCourses: () => [], getLessons: () => [], getStore: () => ({}),
    pageHead: () => "", sourceItem: () => "", text: value => value, esc: value => String(value), button: () => "", typeset() {},
    gradeOpenResponse: async () => { throw new Error("offline"); }
  });
  const numeric = { type: "calculation", grading: { type: "numeric", expected: 2, tolerance: 0.01 } };
  assert.equal(feature.answerKey(numeric, "2.005"), true);
  assert.equal(feature.masteryEligible(numeric), true);
});
