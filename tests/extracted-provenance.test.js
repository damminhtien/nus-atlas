const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAll } = require("../scripts/validate-extracted");

test("normalized PDF extraction keeps page-aware provenance", () => {
  const result = validateAll();
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.ok(result.counts.files > 0);
  assert.ok(result.counts.blocks > 0);
});
