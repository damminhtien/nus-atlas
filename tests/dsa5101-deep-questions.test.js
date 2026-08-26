const test = require("node:test");
const assert = require("node:assert/strict");
const { validateDsa5101DeepQuestions } = require("../scripts/validate-dsa5101-deep-questions");

test("DSA5101 deep-dive bank has 30 hard six-choice MCQs", () => {
  const result = validateDsa5101DeepQuestions();
  assert.deepEqual(result.errors, []);
  assert.equal(result.counts.total, 30);
  assert.equal(result.counts.mcq, 30);
  assert.equal(result.counts.sixChoice, 30);
  assert.equal(result.counts.lessons, 7);
});
