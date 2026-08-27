const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("browser script order loads NUS dependencies before the entrypoint", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const before = ["src/core/content/transport.js", "src/core/content/repository.js", "src/app/bootstrap.js", "src/core/study-store.js", "src/core/router.js", "src/features/nus/presentation.js", "src/features/nus/sql.js", "src/features/nus/simulations.js", "src/features/nus/retrieval.js", "src/features/nus/exam-schedule.js", "src/features/nus/exam-selection.js", "src/features/nus/exam-session.js", "src/features/nus/exam-generators.js", "src/features/nus/exam-renderer.js"];
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
  assert.match(css, /body\.nus-slide-focus-mode \.nus-slide-reader-grid[^}]*grid-template-columns:minmax\(0, 3fr\) minmax\(0, 1fr\)/);
  assert.match(css, /body\.nus-slide-focus-mode \.nus-slide-reader-page \.nus-slide-main,[\s\S]*height:clamp\(520px, 75vh, 820px\)/);
  assert.match(css, /\.nus-socratic-modal/);
  assert.match(css, /\.nus-exam-schedule-overlay/);
  assert.match(css, /body\.nus-slide-focus-mode \.nus-slide-image[^}]*height:100%/);
  assert.match(css, /body\.nus-slide-focus-mode \.nus-slide-context \.nus-slide-depth[^}]*display:none/);
  assert.match(css, /\.nus-derivation-trace \.nus-lab-step \{ grid-template-columns:minmax\(0, 1fr\); \}/);
  assert.match(css, /\.nus-derivation-trace \.nus-lab-step > \.nus-lab-formula[^}]*justify-content:center/);
  assert.match(css, /\.nus-derivation-trace \.nus-lab-step > \.nus-lab-formula[^}]*font-size:clamp\(16px, 1\.45vw, 20px\)/);
  assert.match(css, /\.nus-source-disclosure:not\(\[open\]\) > :not\(summary\), \.nus-lab-foot details:not\(\[open\]\) > :not\(summary\)/);
  assert.match(css, /#app\.nus-root \{ font-size:1\.06rem; \}/);
  assert.match(css, /#app\.nus-root \.nus-slide-note p \{ font-size:16px; line-height:1\.62; \}/);
  assert.match(css, /body\.nus-slide-focus-mode #app\.nus-root \.nus-slide-note p \{ font-size:clamp\(16px, 1\.15vw, 20px\)/);
});

test("KaTeX boundary guards against double-escaped authored commands", () => {
  const app = fs.readFileSync("js/app.js", "utf8");
  assert.match(app, /normalizeDoubleEscapedMath/);
  assert.match(app, /normalizeMathTextNodes/);
});

test("visual lab provenance stays collapsed by default", () => {
  const components = fs.readFileSync("js/nus-components.js", "utf8");
  assert.doesNotMatch(components, /Source lens/);
  assert.match(components, /nus-lab-source-details/);
});
