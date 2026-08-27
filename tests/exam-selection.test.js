const test = require("node:test");
const assert = require("node:assert/strict");
const createExamSelection = require("../src/features/nus/exam-selection.js");

function makeSelection({ lessons, stats = {}, due = [], mistakes = [], map = {} }) {
  return createExamSelection({
    getLessons: () => lessons,
    getStore: () => ({
      questionStats: id => stats[id] || { attempts: 0, correct: 0, misses: 0, accuracy: 0 },
      dueRetrievals: () => due,
      mistakes: () => mistakes,
      lessonDone: () => false
    }),
    getAssessmentMap: () => map
  });
}

const lesson = (id, week, questions, extra = {}) => ({ id, title: id, week, sequence: week, ...extra, questions });
const question = (id, skill, extra = {}) => ({ id, type: "mcq", prompt: id, choices: ["yes", "no"], answer: 0, skill, topic: skill, ...extra });

test("selection excludes non-exam lessons even for a scoped route", () => {
  const selector = makeSelection({ lessons: [lesson("core", 1, [question("q1", "risk")]), lesson("supplement", 2, [question("q2", "ref")], { examEligible: false })] });
  assert.deepEqual(selector.selectQuestions({ courseCode: "DSA5105", scope: "supplement", limit: 2 }), []);
});

test("selection prioritizes due retrieval, mistakes, weak accuracy, and assessment priority", () => {
  const lessons = [
    lesson("new", 1, [question("new-q", "new")]),
    lesson("weak", 2, [question("weak-q", "weak")]),
    lesson("due", 3, [question("due-q", "due")]),
    lesson("exam", 4, [question("exam-q", "exam")])
  ];
  const selector = makeSelection({
    lessons,
    stats: { "weak-q": { attempts: 2, misses: 2, accuracy: 0 } },
    due: [{ lessonId: "due" }],
    mistakes: [{ questionId: "weak-q" }],
    map: { topics: [{ priority: "A+ focus", lessonIds: ["exam"] }] }
  });
  const selected = selector.selectQuestions({ courseCode: "DSA5105", limit: 4 });
  assert.equal(selected[0].id, "due-q");
  assert.match(selected[0].selectionReasons.join(" "), /retrieval is due/);
  assert.match(selected[1].selectionReasons.join(" "), /missed this recently/);
});

test("selection falls back to canonical chronology with no learner signals", () => {
  const selector = makeSelection({ lessons: [lesson("week2", 2, [question("q2", "same")]), lesson("week1", 1, [question("q1", "same")])] });
  const selected = selector.selectQuestions({ courseCode: "DSA5105", limit: 2 });
  assert.deepEqual(selected.map(item => item.id), ["q1", "q2"]);
  assert.deepEqual(selected[0].selectionReasons, ["chronological course order"]);
});

test("selection keeps skills and topics diverse before filling the attempt", () => {
  const selector = makeSelection({ lessons: [lesson("all", 1, [question("q1", "risk"), question("q2", "risk"), question("q3", "svm"), question("q4", "pca")])], stats: { "q1": { attempts: 2, misses: 1, accuracy: 0.5 } } });
  const selected = selector.selectQuestions({ courseCode: "DSA5105", limit: 3 });
  assert.deepEqual(selected.map(item => item.skill), ["risk", "svm", "pca"]);
});
