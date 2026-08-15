const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("browser script order loads NUS dependencies before the entrypoint", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const before = ["src/core/content-loader.js", "src/core/content-repository.js", "src/core/study-store.js", "src/core/router.js", "src/features/nus/presentation.js", "src/features/nus/sql.js", "src/features/nus/simulations.js"];
  const nus = html.indexOf('src="js/nus.js"');
  assert.ok(nus > 0);
  before.forEach(script => assert.ok(html.indexOf(script) < nus, `${script} must load before js/nus.js`));
});
