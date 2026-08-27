const test = require("node:test");
const assert = require("node:assert/strict");
const { validateDsa5101QuestionMix } = require("../scripts/validate-dsa5101-question-mix");

test("DSA5101 keeps the canonical runtime question mix", () => {
  const result = validateDsa5101QuestionMix();
  assert.deepEqual(result.errors, []);
  assert.equal(result.counts.total, 92);
  assert.equal(result.counts.mcq, 77);
  assert.equal(result.counts.calculation, 8);
  assert.equal(result.counts.derivation, 7);
  assert.equal(result.counts.bank, 60);
  assert.equal(result.counts.bankT3, 12);
  assert.equal(result.counts.sixChoiceMcq, 77);
});
