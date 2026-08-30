const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const nusUi = fs.readFileSync(path.join(root, "src", "app", "nus-ui.js"), "utf8");

test("NUS primary navigation exposes the four learning-loop destinations", () => {
  const primary = html.match(/<nav class="nav nav-nus"[\s\S]*?<\/nav>/)?.[0] || "";
  assert.match(primary, /href="#\/"[\s\S]*?>[\s\S]*?Home/);
  assert.match(primary, /href="#\/nus\/courses"[\s\S]*?>[\s\S]*?Courses/);
  assert.match(primary, /href="#\/nus\/review"[\s\S]*?>[\s\S]*?Review/);
  assert.match(primary, /href="#\/nus\/planner"[\s\S]*?>[\s\S]*?Plan/);
  assert.doesNotMatch(primary, /Practice mode|Contrast drills|SQL studio|Systems lab/);
  assert.match(html, /<nav class="mobile-primary-nav"[\s\S]*?Home[\s\S]*?Courses[\s\S]*?Review[\s\S]*?Plan[\s\S]*?<\/nav>/);
});

test("NUS UI derives the focus course from saved study context instead of a fixed course", () => {
  assert.match(nusUi, /lastLesson\(\)/);
  assert.match(nusUi, /function recommendedNext\(\)/);
  assert.doesNotMatch(nusUi, /DEFAULT_FOCUS_COURSE/);
});

test("lazy readers keep a page shell while course content loads", () => {
  assert.match(nusUi, /function renderLoadingSurface\(/);
  assert.match(nusUi, /class="nus-loading-surface"/);
  assert.match(nusUi, /renderLoadingSurface\("Loading lesson"/);
  assert.match(nusUi, /renderLoadingSurface\("Preparing practice"/);
});
