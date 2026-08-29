const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const indexHtml = fs.readFileSync("index.html", "utf8");
const nusSource = fs.readFileSync("js/nus.js", "utf8");
const styles = fs.readFileSync("css/styles.css", "utf8");

test("NUS navigation keeps course study destinations and focused tools", () => {
  assert.match(indexHtml, /Assessment map/);
  assert.match(indexHtml, /SQL Studio/);
  assert.match(indexHtml, /Systems lab/);
  assert.match(indexHtml, /DSA courses/);
  assert.doesNotMatch(indexHtml, /Reference library|Visualization lab|Knowledge map|Code playground|Glossary/);
  assert.doesNotMatch(indexHtml, /> Daily review</);
  assert.doesNotMatch(indexHtml, /> Custom test</);
  assert.doesNotMatch(indexHtml, /> Foundation library</);
});

test("NUS Home keeps gamification as a compact supporting surface", () => {
  assert.match(nusSource, /function gamificationSurface\(recommended\)/);
  assert.match(nusSource, /Weekly goal/);
  assert.match(nusSource, /Current concept/);
  assert.doesNotMatch(nusSource, /function learningSignals\(/);
  assert.doesNotMatch(nusSource, /Today’s quests/);
  assert.doesNotMatch(nusSource, /#nus-focus-course/);
});

test("lesson primary action is state-driven and slides stay in More", () => {
  assert.match(nusSource, /function lessonPrimaryAction\(/);
  assert.match(nusSource, /Start learning/);
  assert.match(nusSource, /Continue lesson/);
  assert.match(nusSource, /Practice \$\{lessonRecord\.questions\.length\} questions/);
  assert.match(nusSource, /Next lesson →/);
  assert.doesNotMatch(nusSource, /const primaryHref = slideSet/);
});

test("lesson in-page navigation never falls through to the SPA router", () => {
  assert.match(nusSource, /\[data-nus-lab-anchor\], \[data-nus-jump\]/);
  assert.match(nusSource, /event\.preventDefault\(\);[\s\S]*?const targetId = link\.dataset\.nusLabAnchor \|\| link\.dataset\.nusJump/);
});

test("mobile course rows retain a compact progress percentage", () => {
  assert.match(styles, /\.nus-course-directory-row > div:nth-of-type\(2\) strong/);
  assert.doesNotMatch(styles, /\.nus-course-directory-row > div:nth-of-type\(2\) \{ display:none; \}/);
});
