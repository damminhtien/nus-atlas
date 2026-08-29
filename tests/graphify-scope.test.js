const test = require("node:test");
const assert = require("node:assert/strict");
const { scopes } = require("../scripts/graphify-scope");

test("Graphify scopes exclude generated inputs", () => {
  for (const paths of Object.values(scopes)) {
    assert.ok(paths.every(file => !/^(?:dist|graphify-out|data\/nus|legacy)(?:\/|$)/.test(file)));
  }
});
