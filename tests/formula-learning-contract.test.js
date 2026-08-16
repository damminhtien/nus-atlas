const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { loadLegacyState } = require("../scripts/validate-content");

function formulas(lesson) {
  return [...(lesson.math || []), ...(lesson.sections || []).map(section => section.math).filter(Boolean)];
}

test("every authored formula has a name and a use case", () => {
  const state = loadLegacyState();
  const missing = [];
  for (const [courseCode, catalog] of Object.entries(state.content)) {
    for (const module of catalog.modules || []) {
      for (const lesson of module.lessons || []) {
        formulas(lesson).forEach(formula => {
          if (!formula.name || formula.name === "Named formula" || !formula.purpose || formula.purpose.length < 20) {
            missing.push(`${courseCode}/${lesson.id}: ${formula.latex}`);
          }
        });
      }
    }
  }
  assert.deepEqual(missing, []);
});

test("DSA5208 slide notes teach the page instead of repeating extraction metadata", () => {
  const files = ["content/courses/DSA5208/slides/dsa5208-lec0.json", "content/courses/DSA5208/slides/dsa5208-lec1.json"];
  const slides = files.flatMap(file => JSON.parse(fs.readFileSync(file, "utf8")).slides);
  assert.equal(slides.length, 52);
  assert.ok(slides.every(slide => !slide.explanation.whatYouSee.includes("rendered page belongs")));
  assert.ok(slides.every(slide => slide.socraticQuestions.length >= 2));
  assert.ok(slides.every(slide => slide.socraticQuestions.some(question => /why|what|can|which|give|state/i.test(question.prompt))));
});
