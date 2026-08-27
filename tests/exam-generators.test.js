const test = require("node:test");
const assert = require("node:assert/strict");
const createExamGenerators = require("../src/features/nus/exam-generators.js");

test("deep-practice generators are reproducible and provenance-labelled", () => {
  const generators = createExamGenerators();
  const first = generators.generate({ seed: "DSA5105-week1", limit: 6 });
  const second = generators.generate({ seed: "DSA5105-week1", limit: 6 });
  assert.deepEqual(first, second);
  assert.equal(new Set(first.map(question => question.generatedFrom)).size, 6);
  first.forEach(question => {
    assert.equal(question.origin, "generated");
    assert.ok(question.generationSeed);
    assert.equal(question.assessmentLayer, "generated-practice");
    assert.ok(question.sourceRefs.length);
    assert.ok(question.grading && question.grading.type === "numeric" || question.type === "mcq");
  });
});

test("generator registry maps only available skills and keeps six families", () => {
  const generators = createExamGenerators();
  assert.deepEqual(generators.list().map(item => item.id), ["weighted-ols", "svm", "pca", "gmm-em", "backprop", "mdp"]);
  assert.deepEqual(generators.forSkills(["pca-variance"]).map(item => item.id), ["pca"]);
});
