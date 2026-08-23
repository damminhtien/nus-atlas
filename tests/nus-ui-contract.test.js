const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const indexHtml = fs.readFileSync("index.html", "utf8");
const nusSource = fs.readFileSync("js/nus.js", "utf8");
const styles = fs.readFileSync("css/styles.css", "utf8");

test("NUS navigation keeps the four learning destinations and one reference surface", () => {
  assert.match(indexHtml, /Reference library/);
  assert.match(indexHtml, /Progress &amp; achievements/);
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

test("mobile course rows retain a compact progress percentage", () => {
  assert.match(styles, /\.nus-course-directory-row > div:nth-of-type\(2\) strong/);
  assert.doesNotMatch(styles, /\.nus-course-directory-row > div:nth-of-type\(2\) \{ display:none; \}/);
});
