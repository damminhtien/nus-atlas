const test = require("node:test");
const assert = require("node:assert/strict");
const createPresentation = require("../src/features/nus/presentation.js");

function presentation() {
  return createPresentation({
    getSourceTypes: () => ({ lecture: { tone: "sage", shortLabel: "Lecture" }, exercise: { tone: "gold", shortLabel: "Exercise" }, textbook: { tone: "gold", shortLabel: "Textbook" } }),
    getVisuals: () => ({ visual: { kind: "table", title: "A visual", observation: "Compare < and >", source: { sourceId: "lecture.pdf", page: 2 } } })
  });
}

test("presentation helpers escape reader content and preserve source labels", () => {
  const view = presentation();
  assert.equal(view.esc("<script>"), "&lt;script&gt;");
  assert.match(view.pageHead("Week 1", "Title", "A & B"), /A &amp; B/);
  assert.match(view.pageHead("DSA5104", "Title", ""), /href="#\/nus\/exam\/DSA5104"/);
  assert.match(view.sourceItem({ sourceId: "Textbook.pdf", sourceType: "textbook", page: 31, role: "depth" }), /Textbook\.pdf · p\.31/);
});

test("source provenance is compact until explicitly opened", () => {
  const view = presentation();
  const refs = [
    { sourceId: "lecture.pdf", sourceType: "lecture", page: 39 },
    { sourceId: "Textbook.pdf", sourceType: "textbook", page: 18 }
  ];
  assert.equal(view.sourceSummary(refs), "2 refs · 1 Lecture · 1 Textbook");
  const html = view.sourceDisclosure(refs);
  assert.match(html, /<details class="nus-source-disclosure">/);
  assert.match(html, /2 refs · 1 Lecture · 1 Textbook/);
  assert.match(html, /lecture\.pdf · p\.39/);
});

test("source lens explains examinability and keeps exercise depth distinct", () => {
  const view = presentation();
  const html = view.sourceLens({
    status: "core Week-1 derivation",
    whyExaminable: "Lecture defines the objective; Exercise 2 requires the closed form and eigen analysis.",
    lecture: [{ sourceId: "Lec1_annotated.pdf", sourceType: "lecture", page: 48 }],
    officialExercise: [{ sourceId: "Lec1_exercises-solutions.pdf", sourceType: "exercise", page: 2, role: "closed form + eigen analysis" }]
  });
  assert.match(html, /Why is this examinable\?/);
  assert.match(html, /Lecture scope/);
  assert.match(html, /Official exercise depth/);
  assert.match(html, /Lec1_exercises-solutions\.pdf · p\.2/);
});

test("course source groups keep official exercises out of lecture core", () => {
  const groups = presentation().sourceGroups({
    lectureSources: [{ sourceId: "lecture.pdf", sourceType: "lecture", page: 48 }],
    exerciseSources: [{ sourceId: "exercise-solutions.pdf", sourceType: "exercise", page: 2 }],
    textbookSources: [],
    referenceSources: []
  });
  assert.deepEqual(groups.map(group => group.label), ["Lecture core", "Official exercise depth"]);
  assert.equal(groups[0].refs[0].sourceType, "lecture");
  assert.equal(groups[1].refs[0].sourceType, "exercise");
});

test("presentation helpers render visual cues without owning data", () => {
  const view = presentation();
  assert.match(view.visualCard("visual"), /nus-visual-table/);
  assert.match(view.visualCard("missing"), /^$/);
  assert.match(view.studyCompass({ sections: [], examples: [], criticalQuestions: [], questions: [] }), /Read/);
});
