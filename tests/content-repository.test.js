const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const createTransport = require("../src/core/content/transport.js");
const createRepository = require("../src/core/content/repository.js");
const { compileAll } = require("../tools/content-compiler");

const contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nus-atlas-repository-"));
compileAll(path.join(__dirname, ".."), contentRoot);
const manifest = JSON.parse(fs.readFileSync(path.join(contentRoot, "manifest.json"), "utf8"));
test.after(() => fs.rmSync(contentRoot, { recursive: true, force: true }));
function fetchJson(url) {
  const file = path.join(contentRoot, url.replace(/^content\//, ""));
  return Promise.resolve(fs.existsSync(file)
    ? { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(file, "utf8")) }
    : { ok: false, status: 404, json: async () => ({}) });
}

function repository() {
  const transport = createTransport({ roots: ["content/"], fetcher: fetchJson });
  return createRepository({ catalog: manifest, transport, sourceTypes: manifest.sourceTypes });
}

test("repository exposes catalog and outline without loading lesson bodies", () => {
  const repo = repository();
  assert.deepEqual(repo.listCourses().map(course => course.code), ["DSA5101", "DSA5104", "DSA5105", "DSA5208"]);
  assert.equal(repo.stats().loadedCourses, 0);
  assert.equal(repo.listLessons("DSA5105").length, 23);
  assert.equal(repo.peekLesson("DSA5105", "dsa5105-erm").questions.length, 0);
});

test("repository joins lazy lesson, questions, study kit, and course artifacts", async () => {
  const repo = repository();
  const lesson = await repo.loadLesson("DSA5105", "dsa5105-erm");
  assert.equal(lesson.schemaVersion, "nus.lesson.v1");
  assert.ok(lesson.questions.length > 0);
  assert.ok(lesson.flashcards.length > 0);
  assert.equal(repo.getAssessment("DSA5105").length, 5);
  assert.equal(repo.getAssessmentMap("DSA5105").topics.length, 12);
  const slideSets = await repo.loadSlides("DSA5105");
  assert.equal(slideSets[0].slides.length, 55);
  assert.ok(await repo.loadTextbook("DSA5105"));
});

test("repository loads the canonical DSA5104 SQL practice package", async () => {
  const repo = repository();
  assert.equal(repo.getCourse("DSA5104").sqlPractice, undefined);
  const packageData = await repo.loadCourse("DSA5104");
  assert.equal(packageData.course.sqlPractice.schemaVersion, "nus.sql-practice.v1");
  assert.deepEqual(Object.keys(packageData.course.sqlPractice.modes), ["concept", "mysql"]);
  assert.deepEqual(packageData.course.sqlPractice.modes.concept.schema.map(table => table.name), ["Department", "Student", "Enrollment"]);
  assert.equal(packageData.course.sqlPractice.modes.mysql.exercises.length, 7);
});

test("missing course and lesson are safe async lookups", async () => {
  const repo = repository();
  assert.equal(repo.getCourse("MISSING"), null);
  assert.equal(await repo.loadCourse("MISSING"), null);
  assert.equal(await repo.loadLesson("DSA5105", "MISSING"), null);
});
