const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parseContents } = require("../scripts/build-textbook-index");
const { validateTextbookDirectory } = require("../scripts/validate-textbook");

test("textbook contents parser keeps chapter and section page references", () => {
  const entries = parseContents("  1 Introduction 5\n  1.1 Overview . . . 5\n  2 Supervised Learning 10\n");
  assert.deepEqual(entries, [
    { number: "1", title: "Introduction", page: 5 },
    { number: "1.1", title: "Overview", page: 5 },
    { number: "2", title: "Supervised Learning", page: 10 }
  ]);
});

test("committed textbook indexes satisfy provenance and copyright boundary", () => {
  const result = validateTextbookDirectory();
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.ok(result.indexes >= 1);
  const index = JSON.parse(fs.readFileSync(path.join(__dirname, "../content/courses/DSA5105/textbook.json"), "utf8"));
  assert.equal(index.source.sourceType, "textbook");
  assert.equal(index.source.page, 1);
  assert.ok(index.chapters.every(chapter => chapter.sections.every(section => !section.body && !section.text)));
});
