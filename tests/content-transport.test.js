const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const createTransport = require("../src/core/content/transport.js");
const createRepository = require("../src/core/content/repository.js");
const { compileAll } = require("../tools/content-compiler");

const contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nus-atlas-transport-"));
compileAll(path.join(__dirname, ".."), contentRoot);
const manifest = JSON.parse(fs.readFileSync(path.join(contentRoot, "manifest.json"), "utf8"));
test.after(() => fs.rmSync(contentRoot, { recursive: true, force: true }));

function fakeFetch(url) {
  const relative = url.replace(/^test-content\//, "");
  const file = path.join(contentRoot, relative);
  if (!fs.existsSync(file)) return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  return Promise.resolve({ ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(file, "utf8")) });
}

function makeRepository() {
  const calls = [];
  const transport = createTransport({ roots: ["test-content/"], fetcher: async (...args) => { calls.push(args[0]); return fakeFetch(...args); } });
  return { calls, transport, repository: createRepository({ catalog: manifest, transport, sourceTypes: manifest.sourceTypes }) };
}

test("transport loads a small catalog, then course and lesson shards", async () => {
  const { transport } = makeRepository();
  const loadedManifest = await transport.loadManifest();
  assert.equal(loadedManifest.courses.length, 4);
  const course = await transport.loadCourse("DSA5105");
  assert.equal(course.course.code, "DSA5105");
  assert.equal(course.content.modules.length, 4);
  assert.deepEqual(course.content.collections.map(collection => collection.id), ["dsa5105-exam-core"]);
  const lesson = await transport.loadLesson("DSA5105", "dsa5105-erm");
  assert.equal(lesson.lesson.id, "dsa5105-erm");
  assert.ok(lesson.questions.length > 0);
  assert.ok(lesson.studyKit.flashcards.length > 0);
});

test("transport refreshes a stale manifest after a fingerprinted shard returns 404", async () => {
  const staleManifest = JSON.parse(JSON.stringify(manifest));
  const staleEntry = staleManifest.courses.find(course => course.code === "DSA5105");
  staleEntry.courseAsset = "DSA5105/course.stale.json";
  let manifestRequests = 0;
  const calls = [];
  const transport = createTransport({
    roots: ["test-content/"],
    fetcher: async url => {
      calls.push(url);
      if (url.replace(/^test-content\//, "").startsWith("manifest.json")) {
        manifestRequests += 1;
        const value = manifestRequests === 1 ? staleManifest : manifest;
        return { ok: true, status: 200, json: async () => value };
      }
      if (url.endsWith("DSA5105/course.stale.json")) return { ok: false, status: 404, json: async () => ({}) };
      return fakeFetch(url);
    }
  });

  const course = await transport.loadCourse("DSA5105");

  assert.equal(course.course.code, "DSA5105");
  assert.equal(manifestRequests, 2);
  assert.ok(calls.some(url => /manifest\.json\?refresh=/.test(url)));
  assert.ok(calls.some(url => url.includes(manifest.courses.find(item => item.code === "DSA5105").courseAsset)));
});

test("repository keeps dashboard metadata cold and lazy-loads lesson payloads", async () => {
  const { calls, repository } = makeRepository();
  assert.equal(repository.listCourses().length, 4);
  assert.equal(repository.stats().loadedCourses, 0);
  const stubs = repository.listLessons("DSA5105");
  assert.equal(stubs.length, 23);
  assert.equal(stubs[0].questions.length, 0);
  assert.ok(stubs[0].questionIds.length > 0);
  assert.equal(repository.stats().loadedLessons, 0);
  assert.deepEqual(calls, []);
  const lesson = await repository.loadLesson("DSA5105", "dsa5105-erm");
  assert.equal(lesson.id, "dsa5105-erm");
  assert.ok(lesson.questions.length > 0);
  assert.equal(repository.stats().loadedCourses, 1);
  assert.equal(repository.stats().loadedLessons, 1);
  assert.ok(calls.some(url => url.includes("lessons/dsa5105-erm.")));
  assert.ok(!calls.some(url => url.includes("slides/")), "lesson load must not preload slides");
  await repository.loadSlides("DSA5105");
  assert.ok(calls.some(url => url.includes("slides/dsa5105-week1-annotated.")));
});
