const test = require("node:test");
const assert = require("node:assert/strict");
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

test("compiler rejects a partial canonical timeline", () => {
  const source = loadCourseSource(process.cwd(), "DSA5105");
  const broken = {
    ...source,
    course: { ...source.course, timelineLessonIds: source.course.timelineLessonIds.slice(1) }
  };
  assert.throws(() => compileCourseSource(broken, "DSA5105"), /Canonical timeline is invalid/);
});
