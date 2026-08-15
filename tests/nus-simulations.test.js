const test = require("node:test");
const assert = require("node:assert/strict");
const createSimulations = require("../src/features/nus/simulations.js");

test("simulation feature keeps vector-clock relation logic isolated", () => {
  const feature = createSimulations({ root: {}, pageHead: () => "" });
  assert.match(feature.vectorRelation([0, 0], [1, 0]), /happens-before P2/);
  assert.match(feature.vectorRelation([1, 0], [0, 1]), /concurrent/);
});
