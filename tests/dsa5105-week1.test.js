const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

test("Week 1 keeps lecture and textbook error frameworks separate", () => {
  const lesson = read("content/courses/DSA5105/lessons/dsa5105-erm.json");
  const text = JSON.stringify(lesson);
  assert.match(text, /Approximation.*Estimation.*Optimization/);
  assert.match(text, /Textbook depth · Three broader paradigms/);
  assert.doesNotMatch(text, /f_opt/);
  assert.doesNotMatch(text, /P0 ·|P1 ·/);
});

test("Week 1 derivations retain exact source pages and strict rubrics", () => {
  const questions = read("content/courses/DSA5105/questions/dsa5105-week1-derivations.json");
  const byId = new Map(questions.map(question => [question.id, question]));
  const refPages = id => byId.get(id).sourceRefs.map(ref => `${ref.sourceId}:${ref.page}`);

  assert.deepEqual(refPages("dsa5105-w1d-q2"), ["DSA5105/Lec1_annotated.pdf:35", "DSA5105/Lec1_exercises-solutions.pdf:1"]);
  assert.deepEqual(refPages("dsa5105-w1d-q3"), ["DSA5105/Lec1_annotated.pdf:47"]);
  assert.deepEqual(refPages("dsa5105-w1d-q4"), ["DSA5105/Lec1_annotated.pdf:48", "DSA5105/Lec1_exercises-solutions.pdf:2"]);
  assert.deepEqual(refPages("dsa5105-w1d-q6"), ["DSA5105/Lec1_annotated.pdf:54", "DSA5105/Lec1_exercises-solutions.pdf:3"]);
  for (const id of ["dsa5105-w1d-q1", "dsa5105-w1d-q2", "dsa5105-w1d-q3", "dsa5105-w1d-q4", "dsa5105-w1d-q6"]) {
    assert.ok(Array.isArray(byId.get(id).rubric) && byId.get(id).rubric.length, `${id} must require derivation components`);
  }
});

test("Week 1 labs and artifacts use canonical lecture provenance", () => {
  const labs = read("content/courses/DSA5105/labs/index.json");
  for (const id of ["dsa5105-erm", "dsa5105-week1-derivations", "dsa5105-linear-week1"]) {
    assert.ok(labs[id].sourceRefs.every(ref => ref.sourceId !== "DSA5105/syllabus.pdf"), `${id} must not cite the one-page syllabus for lecture content`);
    assert.ok(labs[id].sourceRefs.every(ref => !ref.sourceId.includes("week1_DSA5105_lecture1_with_note")), `${id} must use the canonical lecture source`);
  }

  const artifacts = read("content/courses/DSA5105/artifacts/dsa5105-week1-derivations.json");
  assert.match(artifacts.flashcards[1].front, /score equation/);
  assert.match(artifacts.homework[0].rubric, /score contribution/);
  assert.equal(artifacts.flashcards[2].source.sourceType, "exercise");
  assert.equal(artifacts.flashcards[3].source.sourceType, "exercise");
  assert.equal(artifacts.homework[0].source.sourceType, "exercise");
  assert.equal(artifacts.homework[1].sourceRefs[1].sourceType, "exercise");
});

test("A+ source lenses separate lecture scope from official exercise depth", () => {
  const lesson = read("content/courses/DSA5105/lessons/dsa5105-linear-week1.json");
  const regularization = lesson.sections.find(section => section.title === "Lecture core · Regularization");
  assert.equal(regularization.sourceLens.status, "core Week-1 derivation");
  assert.deepEqual(regularization.sourceLens.lecture.map(ref => ref.page), [47, 48]);
  assert.deepEqual(regularization.sourceLens.officialExercise.map(ref => [ref.sourceType, ref.page]), [["exercise", 2]]);

  const labs = read("content/courses/DSA5105/labs/index.json");
  const derivations = labs["dsa5105-week1-derivations"];
  const ridge = derivations.exercises.find(exercise => exercise.id === "ridge");
  const huber = derivations.exercises.find(exercise => exercise.id === "huber");
  assert.match(ridge.sourceLens.whyExaminable, /Exercise 2 requires the closed form and eigen analysis/);
  assert.equal(ridge.sourceLens.officialExercise[0].sourceType, "exercise");
  assert.equal(ridge.sourceLens.officialExercise[0].page, 2);
  assert.match(huber.sourceLens.whyExaminable, /derivative, stationarity, and bounded score contribution/);
  assert.equal(huber.sourceLens.officialExercise[0].page, 1);

  const manifest = read("content/courses/DSA5105/sources/manifest.json");
  const exerciseSources = manifest.sources.filter(source => source.sourceId.includes("Lec1_exercises"));
  assert.equal(exerciseSources.length, 2);
  assert.ok(exerciseSources.every(source => source.sourceType === "exercise"));
});

test("textbook paradigm question labels the vocabulary boundary", () => {
  const bank = read("content/courses/DSA5105/questions/bank.json");
  const question = bank.questions.find(item => item.id === "dsa5105-bank-006");
  assert.match(question.explanation, /textbook.*broader/);
  assert.match(question.explanation, /approximation-estimation-optimization/);
  assert.ok(question.sourceRefs.some(ref => ref.sourceId === "DSA5105/Textbook.pdf" && ref.page === 11));
});
