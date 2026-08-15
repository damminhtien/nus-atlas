const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("browser script order loads NUS dependencies before the entrypoint", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const before = ["src/core/content-loader.js", "src/core/content-repository.js", "src/core/study-store.js", "src/core/router.js", "src/features/nus/presentation.js", "src/features/nus/sql.js", "src/features/nus/simulations.js"];
  const nus = html.indexOf('src="js/nus.js');
  assert.ok(nus > 0);
  before.forEach(script => assert.ok(html.indexOf(script) < nus, `${script} must load before js/nus.js`));
});

test("app shell exposes a persistent collapsible left navigation", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const app = fs.readFileSync("js/app.js", "utf8");
  const css = fs.readFileSync("css/styles.css", "utf8");
  assert.match(html, /id="menu-btn"[^>]+aria-controls="sidebar"/);
  assert.match(app, /atlas\.sidebarCollapsed/);
  assert.match(app, /e\.key === "\\\\"/);
  assert.match(css, /body\.nus-sidebar-collapsed \.shell/);
  assert.match(css, /body\.nus-slide-focus-mode \.nus-slide-reader-page \.nus-slide-reader-grid[^}]*height:clamp\(380px, 68vh, 560px\)/);
});
