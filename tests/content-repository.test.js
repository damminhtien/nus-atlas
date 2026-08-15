const test = require("node:test");
const assert = require("node:assert/strict");
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
