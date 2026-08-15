const test = require('node:test');
const assert = require('node:assert/strict');
const { findRawMath, findUnicodeMath } = require('../scripts/validate-latex');
const { AUTHORED_TEXT_KEYS } = require('../scripts/latex-utils');

test('accepts delimited inline and display math', () => {
  assert.deepEqual(findRawMath('Use $x_i$ and $$R(h)=0$$.'), []);
});

test('rejects an authored raw formula fragment', () => {
  assert.ok(findRawMath('The update uses x_i and gamma<1.').length > 0);
});

test('rejects Unicode operators inside a delimited formula', () => {
  assert.ok(findUnicodeMath('$x≈y$').length > 0);
});

test('covers Atlas explanations and lab derivation steps as authored text', () => {
  assert.ok(AUTHORED_TEXT_KEYS.has('whatYouSee'));
  assert.ok(AUTHORED_TEXT_KEYS.has('steps'));
  assert.ok(AUTHORED_TEXT_KEYS.has('misconception'));
});
