const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { loadLegacyState } = require("../scripts/validate-content");
const { isGenericSocraticPrompt } = require("../scripts/validate-slides");

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

test("DSA5105 lecture cores expose a teachable reasoning contract", () => {
  const lessonCore = loadLegacyState().content.DSA5105;
  const missing = [];
  for (const module of lessonCore.modules || []) {
    for (const lesson of module.lessons || []) {
      for (const section of lesson.sections || []) {
        if (!/^(?:Lecture core|Core derivation)/.test(section.title)) continue;
        for (const field of ["concept", "useWhen", "examMove", "trap"]) {
          if (!section.teaching || typeof section.teaching[field] !== "string" || section.teaching[field].trim().length < 30) {
            missing.push(`${lesson.id}/${section.title}: ${field}`);
          }
        }
      }
    }
  }
  assert.deepEqual(missing, []);
});

test("DSA5105 Week 1 formula cards are named and actionable", () => {
  const slides = JSON.parse(fs.readFileSync("content/courses/DSA5105/slides/dsa5105-week1-annotated.json", "utf8")).slides;
  const cards = slides.map(slide => slide.keyFormula).filter(Boolean);
  assert.ok(cards.length >= 20);
  assert.ok(cards.every(card => card.name && card.latex && card.purpose && card.purpose.length >= 30));
});

test("DSA5208 slide notes teach the page instead of repeating extraction metadata", () => {
  const files = ["content/courses/DSA5208/slides/dsa5208-lec0.json", "content/courses/DSA5208/slides/dsa5208-lec1.json"];
  const slides = files.flatMap(file => JSON.parse(fs.readFileSync(file, "utf8")).slides);
  assert.equal(slides.length, 52);
  assert.ok(slides.every(slide => !slide.explanation.whatYouSee.includes("rendered page belongs")));
  assert.ok(slides.every(slide => slide.socraticQuestions.length >= 2));
  assert.ok(slides.every(slide => slide.socraticQuestions.some(question => /why|what|can|which|give|state/i.test(question.prompt))));
});

test("all course slide readers use content-specific Socratic prompts", () => {
  const files = [
    "content/courses/DSA5101/slides/dsa5101-lecture1.json",
    "content/courses/DSA5104/slides/dsa5104-chapter1.json",
    "content/courses/DSA5105/slides/dsa5105-week1-annotated.json",
    "content/courses/DSA5208/slides/dsa5208-lec0.json",
    "content/courses/DSA5208/slides/dsa5208-lec1.json"
  ];
  const generic = [];
  for (const file of files) {
    const set = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const slide of set.slides) {
      for (const question of slide.socraticQuestions || []) {
        if (isGenericSocraticPrompt(question.prompt)) generic.push(`${file}#${slide.slideNumber}`);
      }
    }
  }
  assert.deepEqual(generic, []);
});
