const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { compileCourse } = require("../tools/content-compiler");

function coursePackage(courseId) {
  return compileCourse(path.join(__dirname, ".."), courseId).package;
}

function renderLab(lessonId) {
  const packageData = coursePackage("DSA5208");
  const renderers = new Map();
  const registry = {
    register(type, renderer) {
      renderers.set(type, renderer);
      return this;
    },
    get(type) { return renderers.get(type); },
    types() { return [...renderers.keys()]; }
  };
  const context = { window: { ATLAS_LAB_REGISTRY: () => registry } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "src", "ui", "nus-components.js"), "utf8"), context);
  const components = context.ATLAS_COMPONENTS_FACTORY({ labRegistry: context.window.ATLAS_LAB_REGISTRY });
  const lesson = { id: lessonId, courseId: "DSA5208" };
  return components.renderLab(lesson, packageData.labs[lessonId]);
}

test("DSA5208 Lecture 2 and 3 lessons expose worked examples and expanded quizzes", () => {
  const packageData = coursePackage("DSA5208");
  const lessons = packageData.content.modules.flatMap(module => module.lessons);
  for (const id of ["dsa5208-broadcast", "dsa5208-shortest-path", "dsa5208-synchronizers", "dsa5208-consistency-spark"]) {
    const lesson = lessons.find(item => item.id === id);
    assert.ok(lesson, `missing lesson ${id}`);
    assert.ok(lesson.examples.length >= 2, `${id} needs a worked visual example`);
    assert.ok(lesson.questions.length >= 5, `${id} needs at least five retrieval questions`);
    assert.ok(lesson.questions.every(question => question.sourceRefs.every(ref => ref.sourceId.includes("DSA5208/Lec"))));
  }
});

test("DSA5208 visual labs render configured Lecture 2 and 3 algorithms", () => {
  const shortest = renderLab("dsa5208-shortest-path");
  assert.match(shortest, /Initialize/);
  assert.match(shortest, /d\(s\)=0/);
  assert.doesNotMatch(shortest, /E-step|Advance EM trace/);

  const synchronizers = renderLab("dsa5208-synchronizers");
  assert.match(synchronizers, /current simulated round/);
  assert.doesNotMatch(synchronizers, /State s|Bellman backup|Advance Bellman step/);

  const consistency = renderLab("dsa5208-consistency-spark");
  assert.match(consistency, /Data-centric history/);
  assert.match(consistency, /Read-your-writes/);
  assert.match(consistency, /Digest read repair/);
  assert.doesNotMatch(consistency, /Roadmap-to-measurement|Week 1 derivation/);
});

test("DSA5208 delivery ordering uses a guarantee-specific lab", () => {
  const packageData = coursePackage("DSA5208");
  const lab = packageData.labs["dsa5208-communication-ordering"];
  assert.equal(lab.type, "delivery-guarantee");
  assert.equal(lab.requiredChoice, "causal");
  const html = renderLab("dsa5208-communication-ordering");
  assert.match(html, /Application invariant/);
  assert.match(html, /FIFO channel|Causal delivery|Total order/);
  assert.doesNotMatch(html, /Model complexity|Training risk|Validation risk/);
});
