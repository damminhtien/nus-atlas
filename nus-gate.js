/* Canonical NUS content gate — run: node nus-gate.js */
const fs = require("fs");
const path = require("path");
const { compileCourse, assessmentWeightTotal } = require("./tools/content-compiler");

const ROOT = __dirname;
const courseIds = fs.readdirSync(path.join(ROOT, "content", "courses"), { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
const sourceTypes = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, "content", "source-types.json"), "utf8"))));
const packages = courseIds.map(courseId => compileCourse(ROOT, courseId).package);
const courses = packages.map(packageData => packageData.course);
const allowed = new Set(courseIds);
const errors = [];
const unicodeFormula = /[₀₁₂₃₄₅₆₇₈₉ᵀᵥᵢₜₐₑₘ′Σσπγλμδ̂∑≤≥∈√∞→∪]/;
let formulaCount = 0;
let criticalCount = 0;

function mathBlocks(lesson) { return [...(lesson.math || []), ...(lesson.sections || []).map(section => section.math).filter(Boolean)]; }
function sourceCatalog(course) { return [course.lectureSources, course.textbookSources, course.referenceSources, course.exerciseSources].flat().filter(Boolean); }
function checkSourceRef(ref, owner) {
  if (!ref || !ref.sourceId || !Number.isInteger(ref.page) || ref.page < 1) errors.push(`bad source ref: ${owner}`);
  if (ref && ref.sourceType && !sourceTypes.has(ref.sourceType)) errors.push(`unknown source type: ${owner}`);
}
function checkLabContract(lab, id) {
  const owner = `${lab.courseCode}/${id}`;
  if (lab.type === "compare") {
    if (!["choice", "model-risk"].includes(lab.mode)) errors.push(`compare lab needs an explicit renderer mode: ${owner}`);
    if (lab.mode === "choice") {
      if (!lab.requiresChoice || !Array.isArray(lab.options) || !lab.options.length) errors.push(`choice comparison needs options and requiresChoice: ${owner}`);
      (lab.options || []).forEach(option => {
        if (!option || !option.id || !option.label || !option.detail || !option.scope) errors.push(`incomplete comparison option: ${owner}`);
      });
    }
    if (lab.mode === "model-risk" && (!lab.initialState || typeof lab.initialState.complexity !== "number")) errors.push(`model-risk comparison needs complexity state: ${owner}`);
  }
  if (lab.type === "decision-tree") {
    if (!["generic", "evaluation"].includes(lab.mode) || !Array.isArray(lab.splits) || !lab.splits.length) errors.push(`decision tree needs an explicit mode and branches: ${owner}`);
    (lab.splits || []).forEach(split => {
      if (!split || !split.id || !split.label || !split.detail || (lab.mode === "generic" ? !split.scope : typeof split.impurity !== "number")) errors.push(`incomplete decision branch: ${owner}`);
    });
  }
  if (lab.type === "delivery-guarantee") {
    if (!lab.invariant || !lab.requiredChoice || !Array.isArray(lab.splits) || !lab.splits.length || !lab.splits.some(split => split.id === lab.requiredChoice)) errors.push(`delivery guarantee needs invariant, branches, and a valid requiredChoice: ${owner}`);
    (lab.splits || []).forEach(split => {
      if (!split || !split.id || !split.label || !split.detail || !split.scope) errors.push(`incomplete delivery guarantee branch: ${owner}`);
    });
  }
  if (["algorithm-trace", "derivation-trace", "event-timeline"].includes(lab.type) && (!Array.isArray(lab.steps) || !lab.steps.length)) errors.push(`step-based lab needs configured steps: ${owner}`);
  if (lab.type === "concept-map" && (!Array.isArray(lab.nodes) || !lab.nodes.length || !Array.isArray(lab.edges))) errors.push(`concept map needs configured nodes and edges: ${owner}`);
  if (lab.type === "deep-dive" && (!Array.isArray(lab.exercises) || !lab.exercises.length || lab.exercises.some(exercise => !Array.isArray(exercise.steps) || !exercise.steps.length))) errors.push(`deep-dive needs configured exercises and steps: ${owner}`);
}

if (!courses.length || new Set(courses.map(course => course.code)).size !== courses.length) errors.push("must define at least one unique NUS course");
for (const packageData of packages) {
  const course = packageData.course;
  if (!course.title || !course.semester || !Array.isArray(course.prerequisites) || !course.nusmods || !course.nusmods.apiModule) errors.push(`missing course metadata: ${course.code}`);
  if (course.prerequisites.some(code => !allowed.has(code))) errors.push(`bad prerequisite on course: ${course.code}`);
  const lessons = (packageData.content.modules || []).flatMap(module => module.lessons || []);
  if (!lessons.length) errors.push(`course has no lessons: ${course.code}`);
  sourceCatalog(course).forEach(ref => { if (!ref.sourceId || !sourceTypes.has(ref.sourceType) || !ref.role || !ref.status) errors.push(`incomplete course source: ${ref.sourceId || course.code}`); });
  const lessonIds = new Set();
  for (const lesson of lessons) {
    if (!lesson.id || lessonIds.has(lesson.id)) errors.push(`duplicate/missing lesson id: ${course.code}`);
    lessonIds.add(lesson.id);
    const lessonMath = mathBlocks(lesson);
    formulaCount += lessonMath.length;
    criticalCount += (lesson.criticalQuestions || []).length;
    if (!Array.isArray(lesson.criticalQuestions) || lesson.criticalQuestions.length < 2) errors.push(`missing critical-thinking questions: ${lesson.id}`);
    if (!lessonMath.length) errors.push(`missing LaTeX formula: ${lesson.id}`);
    lessonMath.forEach(formula => {
      if (!formula.name || !formula.purpose || !formula.latex || !formula.explanation || !Array.isArray(formula.symbols) || !formula.symbols.length || !formula.sourceType || !sourceTypes.has(formula.sourceType)) errors.push(`incomplete named LaTeX formula model: ${lesson.id}`);
      (formula.symbols || []).forEach(symbol => { if (!symbol.latex || !symbol.meaning) errors.push(`incomplete formula symbol: ${lesson.id}`); });
    });
    if (unicodeFormula.test(JSON.stringify(lesson))) errors.push(`Unicode formula detected; use LaTeX: ${lesson.id}`);
    (lesson.sourceRefs || []).forEach(ref => checkSourceRef(ref, lesson.id));
    (lesson.questions || []).forEach(question => {
      if (!question.id || !question.type || !question.prompt || (!question.explanation && !question.solution)) errors.push(`incomplete question: ${question.id || lesson.id}`);
      if (question.type === "mcq" && (!Array.isArray(question.choices) || typeof question.answer !== "number" || question.answer < 0 || question.answer >= question.choices.length)) errors.push(`bad MCQ: ${question.id}`);
      if (question.type !== "mcq" && (!Array.isArray(question.accepted) || !question.accepted.length)) errors.push(`missing accepted answer: ${question.id}`);
      if (question.rubric && (!Array.isArray(question.rubric) || !question.rubric.length || question.rubric.some(item => !item || !item.label || !Array.isArray(item.required) || !item.required.length))) errors.push(`invalid derivation rubric: ${question.id}`);
      (question.sourceRefs || []).forEach(ref => checkSourceRef(ref, question.id));
    });
    if (!Array.isArray(lesson.flashcards) || lesson.flashcards.length < 3) errors.push(`missing flashcards: ${lesson.id}`);
    if (!Array.isArray(lesson.homework) || lesson.homework.length < 2) errors.push(`missing homework: ${lesson.id}`);
  }
  for (const assessment of packageData.assessments || []) {
    if (assessment.courseCode !== course.code) errors.push(`assessment outside course: ${assessment.id}`);
    if (assessment.schemaVersion !== "nus.assessment.v2" || !assessment.officialFacts || !assessment.studentGuidance) errors.push(`assessment must use v2 facts/guidance model: ${assessment.id}`);
    if (assessment.dateStatus === "pending" && assessment.date !== null) errors.push(`pending assessment has a guessed date: ${assessment.id}`);
    if (assessment.date && Number.isNaN(new Date(assessment.date).getTime())) errors.push(`invalid assessment date: ${assessment.id}`);
    if (!Array.isArray(assessment.checklist) || !assessment.checklist.length) errors.push(`missing checklist: ${assessment.id}`);
    for (const [field, fact] of Object.entries(assessment.officialFacts || {})) {
      if (!Array.isArray(fact.sourceRefs) || !fact.sourceRefs.length) errors.push(`official assessment fact needs source refs: ${assessment.id}/${field}`);
      for (const ref of fact.sourceRefs || []) checkSourceRef(ref, `${assessment.id}/${field}`);
      for (const exclusion of fact.explicitExclusions || []) for (const ref of exclusion.sourceRefs || []) checkSourceRef(ref, `${assessment.id}/${field}/exclusion`);
    }
  }
  const weight = assessmentWeightTotal(packageData.assessments || []);
  if (weight !== 100) errors.push(`${course.code} assessment weights sum to ${weight}, expected 100`);
  if (!packageData.schedule) errors.push(`missing schedule: ${course.code}`);
  else if (packageData.schedule.hasFinalExam === false) {
    if (packageData.schedule.exam !== null) errors.push(`no-exam schedule must set exam to null: ${course.code}`);
    if (!packageData.schedule.assessmentNote) errors.push(`no-exam schedule needs assessment note: ${course.code}`);
  } else if (!packageData.schedule.exam) errors.push(`missing schedule: ${course.code}`);
  Object.entries(packageData.visuals || {}).forEach(([id, visual]) => {
    if (!visual.courseCode || visual.courseCode !== course.code || !visual.title || !visual.kind || !visual.source || !visual.source.sourceId || !Number.isInteger(visual.source.page) || !visual.observation) errors.push(`incomplete visual ref: ${id}`);
  });
  Object.entries(packageData.labs || {}).forEach(([id, lab]) => {
    if (!lab || lab.courseCode !== course.code || !lab.lessonId || !lab.type || !lab.learningGoal || lab.reducedMotion !== true || !Array.isArray(lab.sourceRefs) || !lab.sourceRefs.length) errors.push(`incomplete visual lab: ${id}`);
    (lab.sourceRefs || []).forEach(ref => checkSourceRef(ref, id));
    if (lab) checkLabContract(lab, id);
  });
}

const labTypes = new Set(["compare", "geometry", "math-stepper", "algorithm-trace", "derivation-trace", "event-timeline", "pipeline-builder", "concept-map", "decision-tree", "delivery-guarantee", "deep-dive"]);
for (const packageData of packages) for (const [id, lab] of Object.entries(packageData.labs || {})) if (!labTypes.has(lab.type)) errors.push(`unknown visual lab type: ${id}`);
const publicFiles = ["js/nus.js", "js/nus-store.js", "js/nus-components.js", "src/app/bootstrap.js", "src/core/content/transport.js", "src/core/content/repository.js"];
const publicText = publicFiles.map(file => fs.readFileSync(path.join(ROOT, file), "utf8"));
if (publicText.some(text => /\/Users\/|Desktop\/NUS|(?:passport|medical|identity)[^\n]{0,80}\.(?:pdf|docx?|png|jpe?g)/i.test(text))) errors.push("public NUS runtime contains a private/raw source marker");
if (errors.length) { console.error("NUS GATE FAILED"); errors.forEach(error => console.error(`- ${error}`)); process.exit(1); }
const lessonCount = packages.reduce((total, packageData) => total + (packageData.content.modules || []).reduce((count, module) => count + (module.lessons || []).length, 0), 0);
const assessmentCount = packages.reduce((total, packageData) => total + packageData.assessments.length, 0);
const visualCount = packages.reduce((total, packageData) => total + Object.keys(packageData.visuals || {}).length, 0);
console.log(`NUS GATE GREEN · ${courses.length} courses · ${lessonCount} lessons · ${formulaCount} LaTeX formulas · ${criticalCount} critical questions · ${assessmentCount} assessment milestones · ${visualCount} visual refs`);
