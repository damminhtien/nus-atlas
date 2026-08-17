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

  assert.match(root.innerHTML, /Exam mode/);
  assert.match(root.innerHTML, /Linear models/);
  assert.match(root.innerHTML, /Start attempt/);
  assert.match(root.innerHTML, /Mistake Clinic/);
  assert.match(root.innerHTML, /open responses use heuristic rubric\/phrase checks/);
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
