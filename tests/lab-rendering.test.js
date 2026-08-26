const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { compileCourse } = require("../tools/content-compiler");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "nus-components.js"), "utf8");

function renderLab(courseId, lessonId) {
  const renderers = new Map();
  const registry = {
    register(type, renderer) { renderers.set(type, renderer); return this; },
    get(type) { return renderers.get(type); }
  };
  const context = { window: { ATLAS_LAB_REGISTRY: () => registry } };
  vm.runInNewContext(source, context);
  const packageData = compileCourse(path.join(__dirname, ".."), courseId).package;
  const lab = packageData.labs[lessonId];
  return { lab, html: context.window.ATLAS_COMPONENTS.renderLab({ id: lessonId, courseId }, lab) };
}

test("non-model labs do not render model-selection copy", () => {
  const cases = [
    ["DSA5101", "dsa5101-ranking-streams", "Rank nodes by link structure"],
    ["DSA5104", "dsa5104-database-design", "One-to-many"],
    ["DSA5104", "dsa5104-semi-structured", "Relational schema"],
    ["DSA5208", "dsa5208-happens-before", "Same process"],
    ["DSA5208", "dsa5208-compressed-timestamps", "Full vector"],
    ["DSA5208", "dsa5208-communication-ordering", "Application invariant"],
    ["DSA5208", "dsa5208-broadcast", "FIFO-total order"]
  ];
  for (const [courseId, lessonId, expected] of cases) {
    const { html } = renderLab(courseId, lessonId);
    assert.match(html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${courseId}/${lessonId} should render its own content`);
    assert.doesNotMatch(html, /Model complexity|Training risk|Validation risk|Evaluation decision branches|risk \d/, `${courseId}/${lessonId} fell through to a model renderer`);
  }
});

test("model-risk copy remains limited to explicitly configured DSA5105 labs", () => {
  for (const lessonId of ["dsa5105-erm", "dsa5105-linear-regularization"]) {
    const { lab, html } = renderLab("DSA5105", lessonId);
    assert.equal(lab.mode, "model-risk");
    assert.match(html, /Model complexity/);
    assert.match(html, /Training risk/);
    assert.match(html, /Validation risk/);
  }
  const { lab, html } = renderLab("DSA5105", "dsa5105-learning-theory");
  assert.equal(lab.mode, "evaluation");
  assert.match(html, /Evaluation decision branches/);
});

test("fallback algorithm labs carry their steps in canonical content", () => {
  for (const lessonId of ["dsa5105-cluster-gmm", "dsa5105-rl-bellman"]) {
    const { lab } = renderLab("DSA5105", lessonId);
    assert.ok(Array.isArray(lab.steps) && lab.steps.length >= 4, `${lessonId} needs canonical trace steps`);
  }
});

test("DSA5101 priority labs expose child-friendly story animations", () => {
  for (const lessonId of [
    "dsa5101-frequent-itemsets",
    "dsa5101-minhash-lsh",
    "dsa5101-clustering",
    "dsa5101-recommenders",
    "dsa5101-pagerank",
    "dsa5101-streams",
    "dsa5101-balance"
  ]) {
    const { lab, html } = renderLab("DSA5101", lessonId);
    assert.ok(lab.animation && lab.animation.status === "intuition-only", `${lessonId} needs an intuition boundary`);
    assert.ok(lab.animation.frames.length >= 3, `${lessonId} needs at least three visual frames`);
    assert.match(html, /Kid-friendly intuition/);
    assert.match(html, /Play story/);
    assert.match(html, /data-animation-frame/);
  }
});
