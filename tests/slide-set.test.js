const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { validateAll } = require("../scripts/validate-slides");

test("DSA5105 slide packages preserve page, block, explanation, question, and asset provenance", () => {
  const result = validateAll();
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.counts.slideSets, 5);
  assert.equal(result.counts.slides, 249);
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

test("DSA5208 readers preserve both supplied lectures and page-aware assets", () => {
  const lec0 = JSON.parse(fs.readFileSync("content/courses/DSA5208/slides/dsa5208-lec0.json", "utf8"));
  const lec1 = JSON.parse(fs.readFileSync("content/courses/DSA5208/slides/dsa5208-lec1.json", "utf8"));
  assert.equal(lec0.courseId, "DSA5208");
  assert.equal(lec0.source.pageCount, 16);
  assert.equal(lec1.source.pageCount, 36);
  assert.equal(lec0.slides.length, 16);
  assert.equal(lec1.slides.length, 36);
  assert.ok([lec0, lec1].every(set => set.slides.every(slide => slide.sourceRef.sourceType === "lecture" && slide.extraction.blocks.every(block => block.sourceId === set.source.sourceId))));
});
