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
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../data/nus/generated/content-manifest.js"), "utf8"), context);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../data/nus/generated/dsa5101.js"), "utf8"), context);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../data/nus/generated/dsa5105.js"), "utf8"), context);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../data/nus/generated/dsa5104.js"), "utf8"), context);
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
  assert.equal(repo.getTextbook("DSA5105").schemaVersion, "nus.textbook-index.v1");
  assert.equal(repo.getTextbook("DSA5105").chapters.length, 4);
  assert.equal(repo.getTextbook("DSA5105").source.sourceType, "textbook");
  assert.equal(repo.getQuestionBank("DSA5105").extensionCount, 44);
});

test("DSA5101 package joins textbook, labs, and source-backed questions", () => {
  const repo = createContentRepository({ ...loadLegacyState(), packages: generatedPackage() });
  const lesson = repo.getLesson("DSA5101", "dsa5101-minhash-lsh");
  assert.equal(lesson.schemaVersion, "nus.lesson.v1");
  assert.ok(lesson.questionIds.length >= 3);
  assert.ok(repo.getLab("dsa5101-minhash-lsh"));
  assert.equal(repo.getSlideSets("DSA5101").length, 1);
  assert.equal(repo.getSlideSets("DSA5101")[0].slides.length, 90);
  assert.equal(repo.getTextbook("DSA5101").source.sourceType, "textbook");
  assert.ok(repo.getQuestionBank("DSA5101").extensionCount >= 12);
});

test("DSA5104 package joins textbook, slide reader, labs, and source-backed questions", () => {
  const repo = createContentRepository({ ...loadLegacyState(), packages: generatedPackage() });
  const lesson = repo.getLesson("DSA5104", "dsa5104-sql-foundations");
  assert.equal(lesson.schemaVersion, "nus.lesson.v1");
  assert.ok(lesson.sourceRefs.some(ref => ref.sourceId === "DSA5104/chapter1.pdf"));
  assert.ok(repo.getLab("dsa5104-query-processing"));
  assert.equal(repo.getSlideSets("DSA5104")[0].slides.length, 52);
  assert.equal(repo.getTextbook("DSA5104").chapters.length, 5);
  assert.equal(repo.getQuestionBank("DSA5104").extensionCount, 12);
});

test("browser script order installs the same repository boundary", () => {
  const files = [
    "data/nus/provenance.js", "data/nus/courses.js", "data/nus/schedule.js", "data/nus/assessments.js",
    "data/nus/visuals.js", "data/nus/dsa5101.js", "data/nus/dsa5104.js",
    "data/nus/generated/content-manifest.js", "data/nus/dsa5208.js", "data/nus/artifacts.js", "data/nus/formula-depth.js",
    "data/nus/visual-labs.js", "src/core/content-loader.js", "src/core/content-repository.js"
  ];
  const context = { console };
  context.window = context;
  vm.createContext(context);
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context, { filename: file }));
  const stats = context.NUS_REPOSITORY.stats();
  assert.equal(stats.courses, 4);
  assert.equal(stats.lessons, 15, "migrated course payload is not loaded at startup");
  assert.equal(stats.assessments, 12);
  assert.equal(stats.labs, 34);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../data/nus/generated/dsa5105.js"), "utf8"), context, { filename: "data/nus/generated/dsa5105.js" });
  context.NUS_REPOSITORY.registerPackage("DSA5105", context.NUS_CONTENT_PACKAGES.DSA5105);
  assert.equal(context.NUS_REPOSITORY.stats().lessons, 38);
  assert.equal(context.NUS_REPOSITORY.getLesson("DSA5105", "dsa5105-erm").flashcards.length, 7);
});

test("a package-only course is discoverable without changing the app shell", () => {
  const legacy = loadLegacyState();
  const packageOnly = {
    NEW5100: {
      course: { code: "NEW5100", title: "New package course", semester: "AY2026/27", schemaVersion: "nus.course.v1" },
      content: { modules: [{ id: "new-module", title: "Module", lessons: [{ id: "new-lesson", title: "New lesson", sourceRefs: [{ sourceId: "new.pdf", page: 1 }], blocks: [{ type: "note" }], questionIds: [], labIds: [], schemaVersion: "nus.lesson.v1" }] }] },
      assessments: [], sources: [], visuals: {}, labs: {}
    }
  };
  const repo = createContentRepository({ ...legacy, packages: packageOnly });
  assert.ok(repo.listCourses().some(course => course.code === "NEW5100"));
  assert.equal(repo.getLesson("NEW5100", "new-lesson").courseId, "NEW5100");
});

test("repository loads a metadata-only package through the injected loader", async () => {
  const legacy = loadLegacyState();
  const loaded = {
    course: { code: "NEW5100", title: "New package course", schemaVersion: "nus.course.v1" },
    content: { modules: [{ id: "new-module", lessons: [{ id: "new-lesson", title: "New lesson", sourceRefs: [{ sourceId: "new.pdf", page: 1 }], blocks: [{ type: "note" }], questionIds: [], labIds: [], schemaVersion: "nus.lesson.v1" }] }] },
    assessments: [], sources: [], visuals: {}, labs: {}
  };
  let calls = 0;
  const repo = createContentRepository({
    ...legacy,
    packages: { NEW5100: { ...loaded.course, course: loaded.course, asset: "new5100.js", counts: { lessons: 1 } } },
    packageLoader: async courseId => { calls += 1; assert.equal(courseId, "NEW5100"); return loaded; }
  });

  assert.equal(repo.needsLoad("NEW5100"), true);
  await repo.loadCourse("NEW5100");
  assert.equal(calls, 1);
  assert.equal(repo.needsLoad("NEW5100"), false);
  assert.equal(repo.getLesson("NEW5100", "new-lesson").id, "new-lesson");
});
