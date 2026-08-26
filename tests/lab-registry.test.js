const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const createLabRegistry = require("../src/ui/labs/registry.js");
const { compileCourse } = require("../tools/content-compiler");

function coursePackage(courseId) { return compileCourse(path.join(__dirname, ".."), courseId).package; }

test("lab registry registers, resolves, and lists renderer plugins", () => {
  const registry = createLabRegistry();
  const renderer = () => "ok";
  registry.register("demo", renderer);
  assert.equal(registry.get("demo"), renderer);
  assert.equal(registry.has("demo"), true);
  assert.deepEqual(registry.types(), ["demo"]);
});

test("lab registry rejects accidental duplicate renderer registration", () => {
  const registry = createLabRegistry();
  registry.register("demo", () => "first");
  assert.throws(() => registry.register("demo", () => "second"), /already registered/);
});

test("every DSA5105 lesson has a source-backed visual lab", () => {
  const packageData = coursePackage("DSA5105");
  const lessons = packageData.content.modules.flatMap(module => module.lessons);
  const labs = new Map(Object.values(packageData.labs).map(lab => [lab.lessonId, lab]));
  assert.equal(lessons.length, 23);
  assert.equal(lessons.filter(lesson => labs.has(lesson.id)).length, 23);
  assert.ok(["concept-map", "decision-tree", "deep-dive"].every(type => Object.values(packageData.labs).some(lab => lab.type === type)));
});

test("every DSA5101 lesson has a source-backed visual lab", () => {
  const packageData = coursePackage("DSA5101");
  const lessons = packageData.content.modules.flatMap(module => module.lessons);
  const labs = new Map(Object.values(packageData.labs).map(lab => [lab.lessonId, lab]));
  assert.equal(lessons.length, 9);
  assert.equal(lessons.filter(lesson => labs.has(lesson.id)).length, lessons.length);
  assert.ok(lessons.every(lesson => labs.get(lesson.id).sourceRefs.every(ref => ref.sourceType)));
});

test("every DSA5104 lesson has a source-backed visual lab", () => {
  const packageData = coursePackage("DSA5104");
  const lessons = packageData.content.modules.flatMap(module => module.lessons);
  const labs = new Map(Object.values(packageData.labs).map(lab => [lab.lessonId, lab]));
  assert.equal(lessons.length, 7);
  assert.equal(lessons.filter(lesson => labs.has(lesson.id)).length, lessons.length);
  assert.ok(lessons.every(lesson => labs.get(lesson.id).sourceRefs.every(ref => ref.sourceType)));
});

test("every DSA5208 lesson has a source-backed visual lab", () => {
  const packageData = coursePackage("DSA5208");
  const lessons = packageData.content.modules.flatMap(module => module.lessons);
  const labs = new Map(Object.values(packageData.labs).map(lab => [lab.lessonId, lab]));
  assert.equal(lessons.length, 12);
  assert.equal(lessons.filter(lesson => labs.has(lesson.id)).length, lessons.length);
  assert.ok(lessons.every(lesson => labs.get(lesson.id).sourceRefs.every(ref => ref.sourceType)));
});

test("formula-bearing labs use exactly-once math wrapping", () => {
  const source = fs.readFileSync("js/nus-components.js", "utf8");
  assert.match(source, /function mathSource\(value\)/);
  assert.match(source, /const mathMarkup = value =>/);
  assert.match(source, /mathMarkup\(step\[1\]\)/);
  assert.doesNotMatch(source, /\$\\?\$\{step\[1\]\}\\?\$/);
});
