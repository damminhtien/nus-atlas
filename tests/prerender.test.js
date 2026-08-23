const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const packageJson = require("../package.json");

test("Pages prerender copies public slide assets into the deploy artifact", () => {
  const prerender = fs.readFileSync("prerender.js", "utf8");
  assert.match(prerender, /\["index\.html"[\s\S]*"data", "assets"\]/);
});

test("Pages prerender scopes generated caches to NUS Atlas", () => {
  const prerender = fs.readFileSync("prerender.js", "utf8");
  assert.match(prerender, /nus-atlas:atlas-\$\{VERSION\}/);
});

test("runtime and prerender use the npm KaTeX version", () => {
  const expected = packageJson.devDependencies.katex;
  const index = fs.readFileSync("index.html", "utf8");
  const prerender = fs.readFileSync("prerender.js", "utf8");
  assert.match(index, new RegExp(`katex@${expected.replace(/\\./g, "\\\\.")}`));
  assert.match(prerender, new RegExp(`const KATEX = '[^']*';`));
  assert.match(prerender, new RegExp(`const KATEX = '${expected.replace(/\\./g, "\\\\.")}';`));
});
