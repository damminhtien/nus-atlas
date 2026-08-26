const test = require("node:test");
const assert = require("node:assert/strict");
const { validateDsa5101ContentQuality } = require("../scripts/validate-dsa5101-content-quality.js");

test("DSA5101 content quality keeps exam signals and study metadata specific", () => {
  const result = validateDsa5101ContentQuality();
  assert.deepEqual(result.errors, []);
});
