const test = require("node:test");
const assert = require("node:assert/strict");
const { validateDsa5208Quality } = require("../scripts/validate-dsa5208-quality");

test("DSA5208 lecture slides and quizzes pass the anti-slop contract", () => {
  const result = validateDsa5208Quality();
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.deepEqual(result.counts, { slides: 119, slidePrompts: 119, questions: 51, questionPrompts: 51 });
});
