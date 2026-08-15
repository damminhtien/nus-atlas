const test = require("node:test");
const assert = require("node:assert/strict");
const createPresentation = require("../src/features/nus/presentation.js");

function presentation() {
  return createPresentation({
    getSourceTypes: () => ({ lecture: { tone: "sage", shortLabel: "Lecture" }, textbook: { tone: "gold", shortLabel: "Textbook" } }),
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

test("presentation helpers render visual cues without owning data", () => {
  const view = presentation();
  assert.match(view.visualCard("visual"), /nus-visual-table/);
  assert.match(view.visualCard("missing"), /^$/);
  assert.match(view.studyCompass({ sections: [], examples: [], criticalQuestions: [], questions: [] }), /Read/);
});
