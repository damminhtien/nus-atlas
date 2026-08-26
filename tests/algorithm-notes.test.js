const test = require("node:test");
const assert = require("node:assert/strict");
const { loadCanonicalState } = require("../scripts/validate-content.js");
const { NOTE_FIELDS, validateAlgorithmNotes } = require("../scripts/validate-algorithm-notes.js");
const createPresentation = require("../src/features/nus/presentation.js");

test("DSA5101 algorithm notes satisfy the five-part contract", () => {
  const result = validateAlgorithmNotes(loadCanonicalState());
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.counts.fields, 5);
  assert.equal(result.counts.notes, 14);
});

test("algorithm note renderer keeps the five parts visible and ordered", () => {
  const view = createPresentation({ getSourceTypes: () => ({ lecture: { tone: "sage", shortLabel: "Lecture" } }), getVisuals: () => ({}) });
  const html = view.algorithmNotes({ algorithmNotes: [{ algorithm: "PageRank", ...Object.fromEntries(NOTE_FIELDS.map((field, index) => [field, `part ${index + 1}`])), sourceRefs: [{ sourceId: "lecture.pdf", sourceType: "lecture", page: 4 }] }] });
  assert.match(html, /Algorithm note standard/);
  for (const label of ["Problem definition", "Assumptions", "Core invariant", "Formula \/ algorithm", "Failure modes &amp; common mistakes"]) assert.match(html, new RegExp(label));
  assert.ok(html.indexOf("Problem definition") < html.indexOf("Assumptions"));
  assert.ok(html.indexOf("Assumptions") < html.indexOf("Core invariant"));
  assert.ok(html.indexOf("Core invariant") < html.indexOf("Formula / algorithm"));
  assert.ok(html.indexOf("Formula / algorithm") < html.indexOf("Failure modes"));
});
