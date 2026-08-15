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
    pageHead: (_kicker, title) => `<h1>${title}</h1>`,
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
});
