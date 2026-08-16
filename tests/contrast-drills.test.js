const test = require("node:test");
const assert = require("node:assert/strict");
const { loadLegacyState } = require("../scripts/validate-content.js");
const { REQUIRED_PAIRS, DSA5101_REQUIRED_PAIRS, DSA5104_REQUIRED_PAIRS, validateContrastDrills } = require("../scripts/validate-contrast-drills.js");
const createContrastDrills = require("../src/features/nus/contrast-drills.js");

test("DSA5105 has the required concept contrast set", () => {
  const state = loadLegacyState();
  const result = validateContrastDrills(state);
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.counts.drills, REQUIRED_PAIRS.length);
});

test("DSA5101 has a complete concept contrast set", () => {
  const state = loadLegacyState();
  const result = validateContrastDrills(state);
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.ok(DSA5101_REQUIRED_PAIRS.every(pair => state.content.DSA5101.modules.flatMap(module => module.lessons || []).some(lesson => (lesson.contrastDrills || []).some(drill => drill.pair === pair))));
});

test("DSA5104 has a complete concept contrast set", () => {
  const state = loadLegacyState();
  const result = validateContrastDrills(state);
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.ok(DSA5104_REQUIRED_PAIRS.every(pair => state.content.DSA5104.modules.flatMap(module => module.lessons || []).some(lesson => (lesson.contrastDrills || []).some(drill => drill.pair === pair))));
});

test("contrast feature flattens lesson drills and supports lesson scope", () => {
  const state = loadLegacyState();
  const lessons = state.content.DSA5105.modules.flatMap(module => module.lessons || []);
  const feature = createContrastDrills({ getLessons: () => lessons });
  assert.equal(feature.drillsFor("DSA5105").length, REQUIRED_PAIRS.length);
  assert.equal(feature.drillsFor("DSA5105", "dsa5105-erm").length, REQUIRED_PAIRS.length);
  assert.equal(feature.drillsFor("DSA5105", "dsa5105-contrast-splits").length, 1);
});
