const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAll } = require("../scripts/validate-slides");

test("DSA5105 slide packages preserve page, block, explanation, question, and asset provenance", () => {
  const result = validateAll();
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.counts.slideSets, 1);
  assert.equal(result.counts.slides, 55);
});
