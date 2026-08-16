const test = require("node:test");
const assert = require("node:assert/strict");
const createRetrievalFeature = require("../src/features/nus/retrieval.js");

test("spaced retrieval selects no more than two prompts and keeps lesson rereading optional", () => {
  const lesson = {
    id: "ridge",
    courseId: "DSA5105",
    title: "Ridge regression",
    questions: [
      { id: "q1", type: "mcq", prompt: "What does ridge change?", choices: ["The objective", "The labels"], answer: 0 },
      { id: "q2", type: "short", prompt: "State the ridge system.", accepted: ["A + lambda I"] },
      { id: "q3", type: "short", prompt: "Why use it?", accepted: ["stability"] }
    ]
  };
  const root = { innerHTML: "", querySelector() { return { addEventListener() {} }; } };
  const store = {
    ensureRetrievalSchedules() {},
    dueRetrievals() { return [{ lessonId: "ridge", courseCode: "DSA5105", reps: 0, dueAt: "2026-08-16T10:00:00.000Z" }]; },
    upcomingRetrievals() { return []; },
    masteryFor() { return { score: 0.8 }; }
  };
  const feature = createRetrievalFeature({
    root,
    getCourses: () => [{ code: "DSA5105" }],
    getLessons: () => [lesson],
    getStore: () => store,
    pageHead: () => "<header>Spaced retrieval</header>",
    sourceItem: () => "",
    text: value => String(value),
    esc: value => String(value),
    button: label => `<a>${label}</a>`,
    typeset() {},
    answerKey() { return true; }
  });

  assert.equal(feature.dueQuestions("DSA5105").length, 2);
  feature.render("DSA5105");
  assert.match(root.innerHTML, /Do not reopen the lesson/);
});
