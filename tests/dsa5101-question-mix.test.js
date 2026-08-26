const test = require("node:test");
const assert = require("node:assert/strict");
const { validateDsa5101QuestionMix } = require("../scripts/validate-dsa5101-question-mix");

test("DSA5101 keeps an approximately 80% MCQ study mix", () => {
  const result = validateDsa5101QuestionMix();
  assert.deepEqual(result.errors, []);
  assert.equal(result.counts.total, 44);
  assert.equal(result.counts.mcq, 35);
  assert.equal(result.counts.sixChoiceConverted, 23);
});
