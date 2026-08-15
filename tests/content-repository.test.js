const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const createContentRepository = require("../src/core/content-repository.js");
const { loadLegacyState } = require("../scripts/validate-content");

function repository() {
  const legacy = loadLegacyState();
  return createContentRepository({
    ...legacy,
    schedule: legacy.schedule,
    sourceTypes: legacy.sourceTypes
  });
}

function generatedPackage() {
  const context = { window: {} };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../data/nus/generated/dsa5105.js"), "utf8"), context);
  return context.NUS_CONTENT_PACKAGES;
}

test("repository exposes normalized course and lesson identity", () => {
  const repo = repository();
  const course = repo.getCourse("DSA5105");
  const lesson = repo.getLesson("DSA5105", "dsa5105-erm");
  assert.equal(course.code, "DSA5105");
  assert.equal(course.schemaVersion, "nus.course.v1");
  assert.equal(lesson.courseId, "DSA5105");
  assert.equal(lesson.moduleId, "dsa5105-foundations");
  assert.equal(lesson.schemaVersion, "nus.lesson.v1");
  assert.ok(lesson.questionIds.includes("dsa5105-e-q1"));
});

test("repository joins assessments, labs, visuals, and source types without mutation", () => {
  const legacy = loadLegacyState();
  const before = JSON.stringify(legacy.content.DSA5105.modules[0].lessons[0]);
  const repo = createContentRepository(legacy);
  assert.equal(repo.getAssessment("DSA5105").length, 3);
  assert.equal(repo.getLab("dsa5105-weighted-ols").lessonId, "dsa5105-weighted-ols");
  assert.equal(repo.getVisual("dsa5105-ordinal-nominal").courseCode, "DSA5105");
  assert.ok(repo.getSourceTypes().lecture);
  assert.equal(JSON.stringify(legacy.content.DSA5105.modules[0].lessons[0]), before);
});

test("missing course or lesson is a safe lookup", () => {
  const repo = repository();
  assert.equal(repo.getCourse("MISSING"), null);
  assert.equal(repo.getLesson("DSA5105", "MISSING"), null);
  assert.deepEqual(repo.getAssessment("MISSING"), []);
});

test("migrated package is preferred and joins ID-linked study artifacts", () => {
  const legacy = loadLegacyState();
  const repo = createContentRepository({ ...legacy, packages: generatedPackage() });
  const lesson = repo.getLesson("DSA5105", "dsa5105-erm");
  assert.equal(lesson.schemaVersion, "nus.lesson.v1");
  assert.ok(lesson.blocks.some(block => block.type === "teaching-note"));
  assert.ok(lesson.questionIds.length > 0);
  assert.equal(lesson.questions.length, lesson.questionIds.length);
  assert.ok(lesson.flashcards.length > 0);
  assert.equal(repo.getAssessment("DSA5105").length, 3);
});

test("browser script order installs the same repository boundary", () => {
  const files = [
    "data/nus/provenance.js", "data/nus/courses.js", "data/nus/schedule.js", "data/nus/assessments.js",
    "data/nus/visuals.js", "data/nus/dsa5101.js", "data/nus/dsa5104.js", "data/nus/dsa5105.js",
    "data/nus/generated/dsa5105.js", "data/nus/dsa5208.js", "data/nus/artifacts.js", "data/nus/formula-depth.js",
    "data/nus/visual-labs.js", "src/core/content-repository.js"
  ];
  const context = { console };
  context.window = context;
  vm.createContext(context);
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context, { filename: file }));
  const stats = context.NUS_REPOSITORY.stats();
  assert.equal(stats.courses, 4);
  assert.equal(stats.lessons, 34);
  assert.equal(stats.assessments, 12);
  assert.equal(stats.labs, 17);
  assert.equal(context.NUS_REPOSITORY.getLesson("DSA5105", "dsa5105-erm").flashcards.length, 4);
});
