const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("Pages prerender copies public slide assets into the deploy artifact", () => {
  const prerender = fs.readFileSync("prerender.js", "utf8");
  assert.match(prerender, /\["index\.html"[\s\S]*"data", "assets"\]/);
});

test("Pages prerender scopes generated caches to NUS Atlas", () => {
  const prerender = fs.readFileSync("prerender.js", "utf8");
  assert.match(prerender, /nus-atlas:atlas-\$\{VERSION\}/);
});
