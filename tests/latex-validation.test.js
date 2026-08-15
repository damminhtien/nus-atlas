const test = require('node:test');
const assert = require('node:assert/strict');
const { findRawMath, findUnicodeMath, findDelimiterIssues, findMalformedMath } = require('../scripts/validate-latex');
const { AUTHORED_TEXT_KEYS, hasMalformedDelimiters, normalizeText } = require('../scripts/latex-utils');

test('accepts delimited inline and display math', () => {
  assert.deepEqual(findRawMath('Use $x_i$ and $$R(h)=0$$.'), []);
});

test('rejects an authored raw formula fragment', () => {
  assert.ok(findRawMath('The update uses x_i and gamma<1.').length > 0);
});

test('rejects Unicode operators inside a delimited formula', () => {
  assert.ok(findUnicodeMath('$x≈y$').length > 0);
});

test('rejects malformed delimiters and leaked normalizer markers', () => {
  assert.ok(findDelimiterIssues('dL/$dw = $z = wx$.').length > 0);
  assert.ok(findDelimiterIssues('unclosed \\\\(x').length > 0);
  assert.ok(findMalformedMath('$Phiinmathbb{R}^{N\\\\times M}$').length > 0);
  assert.ok(findMalformedMath('$s=z_1-z_2 remains$').some(match => match.label === 'prose inside math'));
  assert.ok(findMalformedMath('\u0001FORMULA0\u0001').some(match => match.label === 'normalizer placeholder'));
});

test('rejects double-escaped TeX commands without flagging matrix row breaks', () => {
  assert.ok(findMalformedMath(String.raw`$\\psi_\\delta(r)=r$`).some(match => match.label === 'double-escaped TeX command'));
  assert.equal(findMalformedMath(String.raw`$\begin{bmatrix}0&y^\top\\y&K\end{bmatrix}$`).some(match => match.label === 'double-escaped TeX command'), false);
});

test('normalizing authored text is idempotent and fail-closed', () => {
  const malformed = 'dL/$dw = $z = wx$.';
  assert.equal(hasMalformedDelimiters(malformed), true);
  assert.equal(normalizeText(malformed), malformed);

  const valid = 'Use $\\\\Phi\\\\in\\\\mathbb{R}^{N\\\\times M}$ in the model.';
  assert.equal(normalizeText(normalizeText(valid)), normalizeText(valid));
});

test('covers Atlas explanations and lab derivation steps as authored text', () => {
  assert.ok(AUTHORED_TEXT_KEYS.has('whatYouSee'));
  assert.ok(AUTHORED_TEXT_KEYS.has('steps'));
  assert.ok(AUTHORED_TEXT_KEYS.has('misconception'));
});
