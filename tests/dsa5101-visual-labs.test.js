const test = require("node:test");
const assert = require("node:assert/strict");
const { validateDsa5101VisualLabs } = require("../scripts/validate-dsa5101-visual-labs");

test("DSA5101 visual labs preserve worked-solution checkpoints", () => {
  const result = validateDsa5101VisualLabs();
  assert.deepEqual(result.errors, []);
  assert.equal(result.count, 9);
});
