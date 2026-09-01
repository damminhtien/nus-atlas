const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { compileCourse, loadCourseSource, compileCourseSource } = require("../tools/content-compiler");

test("DSA5105 keeps topic modules separate from its chronological lecture timeline", () => {
  const source = loadCourseSource(process.cwd(), "DSA5105");
  const compiled = compileCourse(process.cwd(), "DSA5105");
  const expectedModules = ["dsa5105-foundations", "dsa5105-linear", "dsa5105-unsupervised", "dsa5105-advanced"];

  assert.deepEqual(source.course.moduleIds, expectedModules);
  assert.deepEqual(compiled.package.content.modules.map(module => module.id), expectedModules);
  assert.deepEqual(compiled.package.course.moduleIds, expectedModules);
  assert.deepEqual(compiled.package.collections.map(collection => collection.id), ["dsa5105-exam-core"]);
  assert.deepEqual(compiled.package.course.timelineLessonIds, source.course.timelineLessonIds);

  const timeline = source.course.timelineLessonIds.map(id => compiled.lessons[id]);
  assert.deepEqual(timeline.map(lesson => lesson.sequence), timeline.map((_, index) => index + 1));
  assert.ok(timeline.every((lesson, index) => index === 0 || lesson.week >= timeline[index - 1].week), "timeline weeks must be chronological");
  assert.equal(compiled.lessons["dsa5105-weighted-ols"].moduleId, "dsa5105-linear");
  assert.deepEqual(compiled.lessons["dsa5105-weighted-ols"].collectionIds, ["dsa5105-exam-core"]);
  assert.deepEqual(compiled.package.collections[0].lessonIds, [
    "dsa5105-weighted-ols",
    "dsa5105-svm-dual-kkt",
    "dsa5105-trees-ensembles",
    "dsa5105-neural-backprop",
    "dsa5105-pca-numerical",
    "dsa5105-gmm-em-numerical",
    "dsa5105-mdp-value-iteration",
    "dsa5105-dynamic-programming",
    "dsa5105-graph-kernel-pagerank",
    "dsa5105-spectral-clustering",
    "dsa5105-ls-svm-loo"
  ]);
});

test("DSA5208 maps its content to four numbered lecture weeks", () => {
  const source = loadCourseSource(process.cwd(), "DSA5208");
  const compiled = compileCourse(process.cwd(), "DSA5208");
  const timeline = source.course.timelineLessonIds.map(id => compiled.lessons[id]);
  const weekIds = week => timeline.filter(lesson => lesson.week === week).map(lesson => lesson.id);
  const orientation = source.modules.flatMap(module => module.lessons).find(lesson => lesson.id === "dsa5208-orientation");

  assert.deepEqual([...new Set(timeline.map(lesson => lesson.week))], [1, 2, 3, 4]);
  assert.equal(orientation.math.length, 1);
  assert.equal(new Set(orientation.sections.map(section => section.title)).size, 2);
  assert.equal(Object.prototype.hasOwnProperty.call(orientation, "blocks"), false);
  assert.ok(compiled.lessons["dsa5208-orientation"].blocks.length > 0);
  assert.deepEqual(weekIds(1), [
    "dsa5208-orientation",
    "dsa5208-distributed-models",
    "dsa5208-happens-before",
    "dsa5208-communication-ordering",
    "dsa5208-physical-clocks",
    "dsa5208-lamport-scalar",
    "dsa5208-vector-clocks",
    "dsa5208-compressed-timestamps"
  ]);
  assert.deepEqual(weekIds(2), ["dsa5208-broadcast", "dsa5208-shortest-path", "dsa5208-synchronizers"]);
  assert.deepEqual(weekIds(3), ["dsa5208-consistency-spark"]);
  assert.deepEqual(weekIds(4), ["dsa5208-spark"]);
});

test("compiler rejects a partial canonical timeline", () => {
  const source = loadCourseSource(process.cwd(), "DSA5105");
  const broken = {
    ...source,
    course: { ...source.course, timelineLessonIds: source.course.timelineLessonIds.slice(1) }
  };
  assert.throws(() => compileCourseSource(broken, "DSA5105"), /Canonical timeline is invalid/);
});

test("NUS course UI renders the canonical timeline and collection route", () => {
  const source = fs.readFileSync("src/app/nus-ui.js", "utf8");
  assert.match(source, /function courseTimeline\(code\)/);
  assert.match(source, /catalog\.timelineLessonIds/);
  assert.match(source, /collection: \(parts, context\) => renderCollection/);
  assert.match(source, /getAssessmentMap\(c\.code\)/);
  assert.doesNotMatch(source, /lessonsByWeek/);
});
