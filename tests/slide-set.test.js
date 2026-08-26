const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { validateAll } = require("../scripts/validate-slides");

test("all slide packages preserve page, block, explanation, question, and asset provenance", () => {
  const result = validateAll();
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.counts.slideSets, 13);
  assert.equal(result.counts.slides, 815);
});

test("DSA5104 Chapter 1 reader keeps 52 pages and source-layer assets", () => {
  const set = JSON.parse(fs.readFileSync("content/courses/DSA5104/slides/dsa5104-chapter1.json", "utf8"));
  assert.equal(set.courseId, "DSA5104");
  assert.equal(set.source.pageCount, 52);
  assert.equal(set.slides.length, 52);
  assert.ok(set.slides.every(slide => slide.sourceRef.sourceType === "lecture" && slide.extraction.blocks.every(block => block.sourceId === set.source.sourceId)));
});

test("DSA5104 Chapter 2 reader exposes core algebra formulas and textbook pointers", () => {
  const set = JSON.parse(fs.readFileSync("content/courses/DSA5104/slides/dsa5104-chapter2.json", "utf8"));
  assert.equal(set.source.pageCount, 46);
  assert.equal(set.slides.length, 46);
  assert.ok(set.coreSlideNumbers.includes(24));
  assert.equal(set.slides.find(slide => slide.slideNumber === 24).keyFormula.name, "Theta join");
  assert.match(set.slides.find(slide => slide.slideNumber === 24).keyFormula.latex, /bowtie/);
  assert.ok(set.slides.find(slide => slide.slideNumber === 46).textbookRefs.length > 0);
  assert.ok(set.slides.every(slide => slide.sourceRef.sourceId === "DSA5104/chapter2.pdf"));
});

test("DSA5104 Chapter 3 reader exposes SQL formulas, priorities, and textbook pointers", () => {
  const set = JSON.parse(fs.readFileSync("content/courses/DSA5104/slides/dsa5104-chapter3.json", "utf8"));
  assert.equal(set.source.pageCount, 99);
  assert.equal(set.slides.length, 99);
  assert.equal(set.coreSlideNumbers.length, 93);
  assert.equal(set.slides.find(slide => slide.slideNumber === 54).keyFormula.name, "SQL logical query order");
  assert.match(set.slides.find(slide => slide.slideNumber === 73).keyFormula.latex, /subseteq/);
  assert.ok(set.slides.find(slide => slide.slideNumber === 79).textbookRefs.length > 0);
  assert.equal(set.slides.find(slide => slide.slideNumber === 99).lecturePriority, "exercise");
  assert.ok(set.slides.every(slide => slide.sourceRef.sourceId === "DSA5104/chapter3.pdf"));
});

test("DSA5101 lecture reader keeps 90 pages and source-layer assets", () => {
  const set = JSON.parse(fs.readFileSync("content/courses/DSA5101/slides/dsa5101-lecture1.json", "utf8"));
  assert.equal(set.courseId, "DSA5101");
  assert.equal(set.source.pageCount, 90);
  assert.equal(set.slides.length, 90);
  assert.ok(set.slides.every(slide => slide.sourceRef.sourceType === "lecture" && slide.extraction.blocks.every(block => block.sourceId === set.source.sourceId)));
});

test("DSA5101 Lecture 3 reader keeps 91 pages and source-layer assets", () => {
  const set = JSON.parse(fs.readFileSync("content/courses/DSA5101/slides/dsa5101-lecture3.json", "utf8"));
  assert.equal(set.courseId, "DSA5101");
  assert.equal(set.source.pageCount, 91);
  assert.equal(set.slides.length, 91);
  assert.ok(set.slides.some(slide => slide.lecturePriority === "core"));
  assert.ok(set.slides.every(slide => slide.sourceRef.sourceType === "lecture" && slide.extraction.blocks.every(block => block.sourceId === set.source.sourceId)));
});

test("DSA5208 readers preserve both supplied lectures and page-aware assets", () => {
  const lec0 = JSON.parse(fs.readFileSync("content/courses/DSA5208/slides/dsa5208-lec0.json", "utf8"));
  const lec1 = JSON.parse(fs.readFileSync("content/courses/DSA5208/slides/dsa5208-lec1.json", "utf8"));
  const lec2 = JSON.parse(fs.readFileSync("content/courses/DSA5208/slides/dsa5208-lec2.json", "utf8"));
  const lec3 = JSON.parse(fs.readFileSync("content/courses/DSA5208/slides/dsa5208-lec3.json", "utf8"));
  assert.equal(lec0.courseId, "DSA5208");
  assert.equal(lec0.source.pageCount, 16);
  assert.equal(lec1.source.pageCount, 36);
  assert.equal(lec2.source.pageCount, 58);
  assert.equal(lec3.source.pageCount, 61);
  assert.equal(lec0.slides.length, 16);
  assert.equal(lec1.slides.length, 36);
  assert.equal(lec2.slides.length, 58);
  assert.equal(lec3.slides.length, 61);
  assert.ok([lec0, lec1, lec2, lec3].every(set => set.slides.every(slide => slide.sourceRef.sourceType === "lecture" && slide.extraction.blocks.every(block => block.sourceId === set.source.sourceId))));
});
