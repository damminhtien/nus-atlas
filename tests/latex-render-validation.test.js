const test = require("node:test");
const assert = require("node:assert/strict");
const { renderFormula, validateCourse } = require("../scripts/validate-latex-render");

test("KaTeX accepts supported activation notation and rejects invented commands", () => {
  assert.doesNotThrow(() => renderFormula(String.raw`\operatorname{ReLU}(u)`));
  assert.throws(() => renderFormula(String.raw`\sigmoid(u)`), /Undefined control sequence/);
});

test("all DSA5105 authored formulas render with KaTeX", () => {
  const result = validateCourse("DSA5105");
  assert.ok(result.formulas.length > 1000);
  assert.deepEqual(result.errors, []);
});

test("all DSA5101 authored formulas render with KaTeX", () => {
  const result = validateCourse("DSA5101");
  assert.ok(result.formulas.length > 0);
  assert.deepEqual(result.errors, []);
});

test("all DSA5104 authored formulas render with KaTeX", () => {
  const result = validateCourse("DSA5104");
  assert.ok(result.formulas.length > 0);
  assert.deepEqual(result.errors, []);
});

test("all DSA5208 authored formulas render with KaTeX", () => {
  const result = validateCourse("DSA5208");
  assert.ok(result.formulas.length > 0);
  assert.deepEqual(result.errors, []);
});
