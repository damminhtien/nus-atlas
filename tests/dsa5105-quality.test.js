const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const courseRoot = path.join(ROOT, "content", "courses", "DSA5105");

function json(relative) {
  return JSON.parse(fs.readFileSync(path.join(courseRoot, relative), "utf8"));
}

function walkJson(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walkJson(file) : entry.name.endsWith(".json") ? [file] : [];
  });
}

test("DSA5105 question cues are specific instead of generic AI filler", () => {
  const files = walkJson(path.join(courseRoot, "questions"));
  const generic = "Explain the idea with a small diagram or example.";
  for (const file of files) assert.doesNotMatch(fs.readFileSync(file, "utf8"), new RegExp(generic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), file);
});

test("DSA5105 study lessons do not present textbook/reference synthesis as current lecture", () => {
  const expected = {
    "dsa5105-cluster-gmm": "TEXTBOOK DEPTH",
    "dsa5105-kernel-pca-cluster": "TEXTBOOK DEPTH",
    "dsa5105-neural-backprop": "TEXTBOOK DEPTH",
    "dsa5105-pca-deep-dive": "TEXTBOOK DEPTH",
    "dsa5105-trees-ensembles": "TEXTBOOK DEPTH",
    "dsa5105-rl-bellman": "TEXTBOOK DEPTH",
    "dsa5105-rl-gnn": "REFERENCE ONLY",
    "dsa5105-gnn": "REFERENCE ONLY"
  };
  for (const [id, status] of Object.entries(expected)) assert.equal(json(`lessons/${id}.json`).contentStatus, status, id);
});

test("DSA5105 content cites the canonical annotated Week 1 lecture", () => {
  for (const file of walkJson(courseRoot)) {
    if (!file.includes(`${path.sep}lessons${path.sep}`) && !file.includes(`${path.sep}questions${path.sep}`) && !file.includes(`${path.sep}artifacts${path.sep}`)) continue;
    assert.doesNotMatch(fs.readFileSync(file, "utf8"), /DSA5105\/Lec1\.pdf/, file);
  }
});

test("DSA5105 Friday Week 2 slides do not repeat placeholder annotations", () => {
  const slides = json("slides/dsa5105-week2-friday-annotated.json").slides;
  assert.equal(slides.length, 48);
  assert.ok(slides.every(slide => slide.title && slide.explanation && slide.lecturePriority), "every slide needs a specific reader note");
  assert.ok(slides.every(slide => !JSON.stringify(slide).includes("Read the page as one claim")));
});
