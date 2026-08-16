const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { validateAll } = require("../scripts/validate-slides");

test("DSA5105 slide packages preserve page, block, explanation, question, and asset provenance", () => {
  const result = validateAll();
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.counts.slideSets, 3);
  assert.equal(result.counts.slides, 197);
});

test("DSA5104 Chapter 1 reader keeps 52 pages and source-layer assets", () => {
  const set = JSON.parse(fs.readFileSync("content/courses/DSA5104/slides/dsa5104-chapter1.json", "utf8"));
  assert.equal(set.courseId, "DSA5104");
  assert.equal(set.source.pageCount, 52);
  assert.equal(set.slides.length, 52);
  assert.ok(set.slides.every(slide => slide.sourceRef.sourceType === "lecture" && slide.extraction.blocks.every(block => block.sourceId === set.source.sourceId)));
});

test("DSA5101 lecture reader keeps 90 pages and source-layer assets", () => {
  const set = JSON.parse(fs.readFileSync("content/courses/DSA5101/slides/dsa5101-lecture1.json", "utf8"));
  assert.equal(set.courseId, "DSA5101");
  assert.equal(set.source.pageCount, 90);
  assert.equal(set.slides.length, 90);
  assert.ok(set.slides.every(slide => slide.sourceRef.sourceType === "lecture" && slide.extraction.blocks.every(block => block.sourceId === set.source.sourceId)));
});
