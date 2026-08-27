const test = require("node:test");
const assert = require("node:assert/strict");
const createExamRenderer = require("../src/features/nus/exam-renderer.js");

function renderer() {
  return createExamRenderer({
    pageHead: (_kicker, title, description) => `<h1>${title}</h1><p>${description || ""}</p>`,
    sourceItem: ref => `<span>${ref.sourceId}</span>`,
    text: value => String(value),
    esc: value => String(value),
    button: label => `<button>${label}</button>`
  });
}

test("exam renderer keeps setup modes and question controls explicit", () => {
  const view = renderer();
  const setup = view.setup({
    courses: [{ code: "DSA5105", title: "Principles of Machine Learning" }],
    selectedCode: "DSA5105",
    scope: "",
    lessons: [],
    practicePlan: null
  });
  assert.match(setup, /Adaptive practice/);
  assert.match(setup, /Deep practice/);
  assert.match(setup, /Mock exam/);

  const question = view.question({
    state: { courseCode: "DSA5105", mode: "adaptive", focus: "smart", currentIndex: 0, questionIds: ["q1"] },
    item: { id: "q1", type: "short", prompt: "State the invariant.", skill: "ols", selectionReasons: ["new concept"] },
    answerInput: '<textarea id="nus-answer"></textarea>',
    rubricHint: "",
    questionNav: '<button data-exam-go="0">○ 1</button>',
    answersSoFar: 0
  });
  assert.match(question, /Why this question\?/);
  assert.match(question, /Save & finish/);
  assert.match(question, /nus-question-navigator/);
});

test("exam renderer exposes safe result grading breakdowns", () => {
  const view = renderer();
  const state = { courseCode: "DSA5105", mode: "deep", questionIds: ["q1"], skippedQuestionIds: [] };
  const answers = [{ q: { id: "q1", prompt: "Compute.", type: "calculation", skill: "ridge", topic: "regularization", cognitiveLevel: "apply", grading: { type: "numeric", expected: 1, tolerance: 0.01 }, solution: "1" }, correct: true, raw: "1", gradedBy: "local" }];
  const result = view.result({ state, answers, correct: 1, total: 1, skipped: 0, gradingMode: question => question.grading ? "exact" : "heuristic", masteryEligible: question => !!question.grading });
  assert.match(result, /Generated practice/);
  assert.match(result, /By skill/);
  assert.match(result, /By topic/);
  assert.match(result, /By cognitive level/);
  assert.match(result, /deterministic local/);
});
