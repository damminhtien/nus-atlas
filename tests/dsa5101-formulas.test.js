const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { formulaProblems, validateDsa5101Formulas } = require("../scripts/validate-dsa5101-formulas.js");

test("DSA5101 formulas keep prose out of math and preserve explicit fractions", () => {
  const result = validateDsa5101Formulas();
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.ok(result.counts.formulas >= 270);
  assert.deepEqual(formulaProblems("\\text{candidate}\\to\\text{exact similarity}"), ["text command inside math"]);
});

test("derivation traces can render prose steps without wrapping them as math", () => {
  const source = fs.readFileSync("src/ui/nus-components.js", "utf8");
  assert.match(source, /function stepValueMarkup\(lab, value\)/);
  assert.match(source, /lab\.stepValueMode === "mixed"/);
  assert.match(source, /stepValueMarkup\(lab, step\[1\]\)/);
});
