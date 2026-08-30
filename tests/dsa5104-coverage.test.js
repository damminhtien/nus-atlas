const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { compileCourse, loadCourseSource } = require("../tools/content-compiler");
const createExamFeature = require("../src/features/nus/exam.js");
const { check: checkSources } = require("../scripts/validate-dsa5104-sources.js");

function dsa5104SlideSets() {
  return ["dsa5104-chapter1.json", "dsa5104-chapter2.json", "dsa5104-chapter3.json"].map(file =>
    JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/courses/DSA5104/slides", file), "utf8"))
  );
}

test("DSA5104 source manifest is the canonical metadata for every source view", () => {
  const result = checkSources();
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.count, 17);
});

test("DSA5104 keeps lecture coverage, exercise coverage, and source-pending targets distinct", () => {
  const source = loadCourseSource(process.cwd(), "DSA5104");
  assert.deepEqual(source.course.coverage.verifiedLecture, ["Ch1", "Ch2", "Ch3"]);
  assert.deepEqual(source.course.coverage.exerciseOnly, ["Ch4", "Ch5", "Ch6", "Ch7"]);
  assert.deepEqual(source.course.coverage.plannedOrUnverified, ["Ch9", "XML", "MongoDB", "MapReduce", "Spark SQL", "VectorDB"]);
  assert.deepEqual(source.course.coverage.targets.map(target => target.id), ["Ch4", "Ch5", "Ch6", "Ch7", "Ch9", "XML", "MongoDB", "MapReduce", "Spark SQL", "VectorDB"]);
  assert.equal(source.course.coverage.status, "partial-current-scope");
});

test("DSA5104 slide annotations are sparse and high-yield focused", () => {
  const slides = dsa5104SlideSets().flatMap(set => set.slides);
  const annotated = slides.filter(slide => slide.studyNote);
  assert.equal(annotated.length, 95);
  assert.ok(annotated.length < slides.length / 2);
  assert.ok(annotated.every(slide => slide.studyPriority === "high-yield" && slide.studyNote.focus && slide.studyNote.trap));
  assert.ok(slides.every(slide => !slide.explanation && !slide.socraticQuestions));
  assert.ok(slides.some(slide => slide.studyPriority === "context"));
  assert.ok(slides.some(slide => slide.studyPriority === "exercise"));
});

test("DSA5104 Ch3 core lessons use topic-specific exam checks", () => {
  const source = loadCourseSource(process.cwd(), "DSA5104");
  const lessons = source.modules.flatMap(module => module.lessons)
    .filter(lesson => lesson.id.startsWith("dsa5104-sql-") && lesson.examEligible);
  assert.equal(lessons.length, 8);
  const generic = [
    "Which tempting shortcut would produce a plausible but incorrect answer?",
    "State the output, input relations, predicate, and one edge case before checking the solution.",
    "A strong answer names the semantic boundary and cites the source page or exercise file."
  ];
  const text = JSON.stringify(lessons);
  assert.ok(generic.every(value => !text.includes(value)), "generic AI-study filler leaked into a Ch3 core lesson");
  assert.ok(lessons.every(lesson => lesson.criticalQuestions.length === 2));
  assert.ok(lessons.every(lesson => lesson.criticalQuestions.every(question => question.modelAnswer.length > 40)));
  assert.ok(lessons.some(lesson => lesson.criticalQuestions.some(question => question.prompt.includes("NOT IN"))));
  assert.ok(lessons.some(lesson => lesson.criticalQuestions.some(question => question.prompt.includes("HAVING"))));
});

test("DSA5104 splits Ch3 into eight core learning units and keeps Ch6/future previews out of default exam scope", () => {
  const source = loadCourseSource(process.cwd(), "DSA5104");
  const sql = source.modules.find(module => module.id === "dsa5104-sql");
  assert.deepEqual(sql.lessonIds, [
    "dsa5104-sql-ddl", "dsa5104-sql-query-shape", "dsa5104-sql-joins", "dsa5104-sql-null",
    "dsa5104-sql-aggregation", "dsa5104-sql-nested", "dsa5104-sql-cte", "dsa5104-sql-mutations", "dsa5104-query-processing"
  ]);
  assert.ok(sql.lessonIds.slice(0, 8).every(id => source.modules.flatMap(module => module.lessons).find(lesson => lesson.id === id).examEligible === true));
  const supplementary = source.modules.find(module => module.id === "dsa5104-supplementary");
  const planned = source.modules.find(module => module.id === "dsa5104-planned");
  assert.equal(supplementary.examEligible, false);
  assert.equal(planned.examEligible, false);
  assert.equal(source.modules.flatMap(module => module.lessons).find(lesson => lesson.id === "dsa5104-database-design").examEligible, false);
  const bridge = source.modules.flatMap(module => module.lessons).find(lesson => lesson.id === "dsa5104-relational-model");
  assert.deepEqual(bridge.sourceRefs.filter(ref => ref.sourceId === "DSA5104/chapter2.pdf" && [43, 44].includes(ref.page)).map(ref => ref.page), [43, 44]);
});

test("DSA5104 synthetic checkpoint is runnable and clearly separate from past-year evidence", () => {
  const compiled = compileCourse(process.cwd(), "DSA5104");
  const plan = compiled.source.assessmentMap.practicePlan;
  const lessons = compiled.package.content.modules.flatMap(module => module.lessons);
  const questions = lessons.flatMap(lesson => lesson.questions);
  const byId = new Map(questions.map(question => [question.id, question]));
  assert.equal(plan.origin, "synthetic");
  assert.equal(plan.questionCount, 12);
  assert.equal(plan.questionIds.length, 12);
  assert.ok(plan.questionIds.every(id => byId.get(id).assessmentLayer === "synthetic-final" && byId.get(id).origin === "synthetic"));
  assert.deepEqual(compiled.package.course.questionBank.assessmentLayers.map(layer => [layer.id, layer.status]), [
    ["synthetic-final", "not-past-year"],
    ["deep-dive-traps", "not-past-year"]
  ]);
});

test("DSA5104 keeps lesson scope labels while admitting exactly the promoted bank questions", () => {
  const packageData = compileCourse(process.cwd(), "DSA5104").package;
  const targetLessons = new Set(["dsa5104-database-design", "dsa5104-ch4-preview", "dsa5104-ch5-preview", "dsa5104-ch7-preview"]);
  const targetQuestions = packageData.content.modules.flatMap(module => module.lessons)
    .filter(lesson => targetLessons.has(lesson.id))
    .flatMap(lesson => lesson.questions);
  const promoted = targetQuestions.filter(question => question.examEligible === true);
  const feature = createExamFeature({
    root: { innerHTML: "" },
    getCourses: () => [],
    getLessons: () => packageData.content.modules.flatMap(module => module.lessons),
    getStore: () => ({ questionStats: () => ({ attempts: 0, correct: 0, misses: 0, accuracy: 0 }) }),
    pageHead: () => "",
    sourceItem: () => "",
    text: value => value,
    esc: value => String(value),
    button: () => "",
    typeset() {}
  });
  const selected = feature.questionsFor("DSA5104", "", "new", Infinity);
  assert.ok(selected.length > 0);
  assert.equal(targetQuestions.length, 127);
  assert.equal(promoted.length, 125);
  assert.equal(new Set(promoted.map(question => question.id)).size, 125);
  assert.deepEqual(selected.filter(question => targetLessons.has(question.lessonId)).map(question => question.id), promoted.map(question => question.id));
  assert.ok(!selected.some(question => ["dsa5104-dd-q1", "dsa5104-dd-q2"].includes(question.id)));
  assert.ok(selected.some(question => question.id === "dsa5104-synthetic-final-001"));
});
