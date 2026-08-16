const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const createTransport = require("../src/core/content/transport.js");
const createRepository = require("../src/core/content/repository.js");

const contentRoot = path.join(__dirname, "..", "dist", "content");
const manifest = JSON.parse(fs.readFileSync(path.join(contentRoot, "manifest.json"), "utf8"));

function fakeFetch(url) {
  const relative = url.replace(/^test-content\//, "");
  const file = path.join(contentRoot, relative);
  if (!fs.existsSync(file)) return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  return Promise.resolve({ ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(file, "utf8")) });
}

function makeRepository() {
  const transport = createTransport({ roots: ["test-content/"], fetcher: fakeFetch });
  return { transport, repository: createRepository({ catalog: manifest, transport, sourceTypes: manifest.sourceTypes }) };
}

test("transport loads a small catalog, then course and lesson shards", async () => {
  const { transport } = makeRepository();
  const loadedManifest = await transport.loadManifest();
  assert.equal(loadedManifest.courses.length, 4);
  const course = await transport.loadCourse("DSA5105");
  assert.equal(course.course.code, "DSA5105");
  assert.equal(course.content.modules.length, 5);
  const lesson = await transport.loadLesson("DSA5105", "dsa5105-erm");
  assert.equal(lesson.lesson.id, "dsa5105-erm");
  assert.ok(lesson.questions.length > 0);
  assert.ok(lesson.studyKit.flashcards.length > 0);
});

test("repository keeps dashboard metadata cold and lazy-loads lesson payloads", async () => {
  const { repository } = makeRepository();
  assert.equal(repository.listCourses().length, 4);
  assert.equal(repository.stats().loadedCourses, 0);
  const stubs = repository.listLessons("DSA5105");
  assert.equal(stubs.length, 23);
  assert.equal(stubs[0].questions.length, 0);
  assert.ok(stubs[0].questionIds.length > 0);
  assert.equal(repository.stats().loadedLessons, 0);
  const lesson = await repository.loadLesson("DSA5105", "dsa5105-erm");
  assert.equal(lesson.id, "dsa5105-erm");
  assert.ok(lesson.questions.length > 0);
  assert.equal(repository.stats().loadedCourses, 1);
  assert.equal(repository.stats().loadedLessons, 1);
});
