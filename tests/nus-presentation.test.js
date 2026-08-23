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
  assert.doesNotMatch(view.pageHead("DSA5104", "Title", ""), /nus-quick-nav|Practice|Planner/);
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
  const html = view.visualCard("visual");
  assert.match(html, /nus-visual-table/);
  assert.match(html, /Study target/);
  assert.match(html, /Try before revealing the answer/);
  assert.match(html, /data-nus-visual-practice="visual"/);
  assert.match(view.visualCard("missing"), /^$/);
  assert.match(view.studyCompass({ sections: [], examples: [], criticalQuestions: [], questions: [] }), /Read/);
});

test("lesson helpers keep practice contextual and extra material collapsed", () => {
  const view = presentation();
  const section = view.lessonSection({ title: "Empirical risk", body: "Observed loss." }, 2);
  const practice = view.studyKit({ questions: [{ id: "q1" }], flashcards: [], homework: [], codeExercises: [] }, { practiceHref: "#/nus/exam/DSA5105/erm", practiceClass: "ghost" });
  assert.match(section, /id="nus-lesson-concept-2"/);
  assert.match(practice, /Ready to test yourself\?/);
  assert.match(practice, /Practice 1 questions/);
  assert.match(practice, /More practice materials/);
});

test("same-lesson visual labs use an in-page anchor instead of an SPA route", () => {
  const view = createPresentation({
    getSourceTypes: () => ({}),
    getVisuals: () => ({ visual: { kind: "diagram", title: "A visual", labId: "lesson-1" } })
  });
  const html = view.visualCard("visual", { courseCode: "DSA5101", lessonId: "lesson-1", labId: "lesson-1", hasLab: true });
  assert.match(html, /href="#nus-lab-lesson-1"/);
  assert.match(html, /data-nus-lab-anchor="nus-lab-lesson-1"/);
  assert.doesNotMatch(html, /data-route/);
});

test("linked visual labs retain a routable lesson destination", () => {
  const view = createPresentation({
    getSourceTypes: () => ({}),
    getVisuals: () => ({ visual: { kind: "diagram", title: "A visual", labId: "target-lesson" } })
  });
  const html = view.visualCard("visual", { courseCode: "DSA5101", lessonId: "source-lesson", hasLab: false });
  assert.match(html, /href="#\/nus\/lesson\/DSA5101\/target-lesson"/);
  assert.match(html, /data-route/);
});
