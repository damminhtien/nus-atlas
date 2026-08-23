const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const createRetrievalFeature = require("../src/features/nus/retrieval.js");

test("spaced retrieval selects no more than two prompts and keeps lesson rereading optional", () => {
  const lesson = {
    id: "ridge",
    courseId: "DSA5105",
    title: "Ridge regression",
    questions: [
      { id: "q1", type: "short", prompt: "What does ridge change?", accepted: ["The objective"] },
      { id: "q2", type: "mcq", prompt: "State the ridge system.", choices: ["A + lambda I", "The labels"], answer: 0 },
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
  assert.match(root.innerHTML, /class="nus-answer-input"/);
});

test("free-response inputs share the Atlas control theme", () => {
  const styles = fs.readFileSync("css/styles.css", "utf8");
  const exam = fs.readFileSync("src/features/nus/exam.js", "utf8");

  assert.match(exam, /class="nus-answer-input"/);
  assert.match(styles, /\.nus-sql-editor textarea, \.nus-answer-input \{[^}]*background:var\(--bg\);[^}]*color:var\(--ink\);/);
  assert.match(styles, /\.nus-answer-input:focus \{[^}]*border-color:var\(--gold\);/);
});
