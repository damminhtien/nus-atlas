/* NUS content gate — run: node nus-gate.js */
const fs = require("fs");
global.window = {};
function load(file) { new Function("window", fs.readFileSync(file, "utf8")).call(global.window, global.window); }
[
  "data/nus/provenance.js", "data/nus/courses.js", "data/nus/schedule.js", "data/nus/assessments.js", "data/nus/visuals.js",
  "data/nus/dsa5101.js", "data/nus/dsa5104.js", "data/nus/dsa5105.js", "data/nus/generated/content-manifest.js", "data/nus/dsa5208.js", "data/nus/artifacts.js", "data/nus/formula-depth.js", "data/nus/visual-labs.js"
].forEach(load);

const errors = [];
const courses = global.window.NUS_COURSES || [], allowed = new Set(courses.map(course => course.code));
const packageContent = global.window.NUS_CONTENT_PACKAGES || {};
const artifacts = global.window.NUS_ARTIFACTS || {};
const content = global.window.NUS_CONTENT || {};
const assessments = global.window.NUS_ASSESSMENTS || [], schedule = global.window.NUS_SCHEDULE || {}, visuals = global.window.NUS_VISUALS || {};
const sourceTypes = new Set(Object.keys(global.window.NUS_SOURCE_TYPES || {}));
const visualLabs = global.window.NUS_VISUAL_LABS || {};
const unicodeFormula = /[₀₁₂₃₄₅₆₇₈₉ᵀᵥᵢₜₐₑₘ′Σσπγλμδ̂∑≤≥∈√∞→∪]/;
let formulaCount = 0, criticalCount = 0;
const mathBlocks = lesson => [...(lesson.math || []), ...(lesson.sections || []).map(section => section.math).filter(Boolean)];
if (!courses.length || new Set(courses.map(c => c.code)).size !== courses.length) errors.push("must define at least one unique NUS course");
courses.forEach(c => {
  if (!c.title || !c.semester || !Array.isArray(c.prerequisites) || !c.nusmods || !c.nusmods.apiModule) errors.push("missing course metadata: " + c.code);
  if (c.prerequisites.some(code => !allowed.has(code))) errors.push("bad prerequisite on course: " + c.code);
  const packageData = packageContent[c.code];
  const lessons = ((packageData && packageData.content) || content[c.code] || { modules: [] }).modules.flatMap(m => m.lessons || []).map(lesson => ({ ...lesson, ...(artifacts[lesson.id] || {}) }));
  if (!lessons.length) errors.push("course has no lessons: " + c.code);
  const sourceCatalog = [c.lectureSources, c.textbookSources, c.referenceSources].flat().filter(Boolean);
  sourceCatalog.forEach(r => { if (!r.sourceId || !sourceTypes.has(r.sourceType) || !r.role || !r.status) errors.push("incomplete course source: " + (r.sourceId || c.code)); });
  const ids = new Set();
  lessons.forEach(l => {
    if (!l.id || ids.has(l.id)) errors.push("duplicate/missing lesson id: " + c.code);
    ids.add(l.id);
    const lessonMath = mathBlocks(l);
    formulaCount += lessonMath.length;
    criticalCount += (l.criticalQuestions || []).length;
    if (!Array.isArray(l.criticalQuestions) || l.criticalQuestions.length < 2) errors.push("missing critical-thinking questions: " + l.id);
    if (!lessonMath.length) errors.push("missing LaTeX formula: " + l.id);
    lessonMath.forEach(m => {
      if (!m.name || !m.purpose || !m.latex || !m.explanation || !Array.isArray(m.symbols) || !m.symbols.length || !m.sourceType || !sourceTypes.has(m.sourceType)) errors.push("incomplete named LaTeX formula model: " + l.id);
      (m.symbols || []).forEach(s => { if (!s.latex || !s.meaning) errors.push("incomplete formula symbol: " + l.id); });
    });
    if (unicodeFormula.test(JSON.stringify(l))) errors.push("Unicode formula detected; use LaTeX: " + l.id);
    (l.sourceRefs || []).forEach(r => {
      if (!r.sourceId || !Number.isInteger(r.page) || r.page < 1) errors.push("bad lesson source ref: " + l.id);
      if (c.code === "DSA5105" && (!sourceTypes.has(r.sourceType) || !r.role || !r.status)) errors.push("untyped DSA5105 lesson source ref: " + l.id);
    });
    (l.visualIds || []).forEach(id => { if (!visuals[id]) errors.push("unknown visual ref: " + id); });
    (l.questions || []).forEach(q => {
      if (!q.id || !q.type || !q.prompt || !q.explanation && !q.solution) errors.push("incomplete question: " + (q.id || l.id));
      if (q.type === "mcq" && (!Array.isArray(q.choices) || typeof q.answer !== "number" || q.answer < 0 || q.answer >= q.choices.length)) errors.push("bad MCQ: " + q.id);
      if (q.type !== "mcq" && (!Array.isArray(q.accepted) || !q.accepted.length)) errors.push("missing accepted answer: " + q.id);
      if (q.rubric && (!Array.isArray(q.rubric) || !q.rubric.length || q.rubric.some(item => !item || !item.label || !Array.isArray(item.required) || !item.required.length))) errors.push("invalid derivation rubric: " + q.id);
      (q.sourceRefs || []).forEach(r => { if (packageData && (!sourceTypes.has(r.sourceType) || !r.role || !r.status)) errors.push("untyped question source ref: " + q.id); });
    });
    if (!Array.isArray(l.flashcards) || l.flashcards.length < 3) errors.push("missing flashcards: " + l.id);
    if (!Array.isArray(l.homework) || l.homework.length < 2) errors.push("missing homework: " + l.id);
    (l.codeExercises || []).forEach(ex => { if (!ex.id || !ex.language || !ex.prompt || typeof ex.expected !== "string" || !ex.solution) errors.push("incomplete code exercise: " + (ex.id || l.id)); });
  });
});
assessments.forEach(a => {
  if (!allowed.has(a.courseCode)) errors.push("assessment outside allowlist: " + a.id);
  if (a.dateStatus === "pending" && a.date !== null) errors.push("pending assessment has a guessed date: " + a.id);
  if (a.date && Number.isNaN(new Date(a.date).getTime())) errors.push("invalid assessment date: " + a.id);
  if (!Array.isArray(a.checklist) || !a.checklist.length) errors.push("missing checklist: " + a.id);
});
allowed.forEach(code => {
  const total = assessments.filter(a => a.courseCode === code).reduce((sum, a) => sum + Number(a.weight || 0), 0);
  if (total !== 100) errors.push(`${code} assessment weights sum to ${total}, expected 100`);
  if (!schedule.courses || !schedule.courses[code]) errors.push("missing schedule: " + code);
});
Object.entries(visuals).forEach(([id, v]) => {
  if (!allowed.has(v.courseCode) || !v.title || !v.kind || !v.source || !v.source.sourceId || !Number.isInteger(v.source.page) || !v.observation) errors.push("incomplete visual ref: " + id);
  if (v.source.externalUrl && !/^https:\/\//.test(v.source.externalUrl)) errors.push("external visual source must use HTTPS: " + id);
});
Object.entries(visualLabs).forEach(([id, lab]) => {
  if (!lab || !allowed.has(lab.courseCode) || !lab.lessonId || !lab.type || !lab.learningGoal || typeof lab.check !== "function" || lab.reducedMotion !== true || !Array.isArray(lab.sourceRefs) || !lab.sourceRefs.length) errors.push("incomplete visual lab: " + id);
  (lab && lab.sourceRefs || []).forEach(ref => { if (!ref.sourceId || !Number.isInteger(ref.page) || ref.page < 1 || !sourceTypes.has(ref.sourceType) || !ref.role || !ref.status) errors.push("incomplete visual lab source: " + id); });
});
const labTypes = new Set(["compare", "geometry", "math-stepper", "algorithm-trace", "derivation-trace", "event-timeline", "pipeline-builder", "concept-map", "decision-tree", "deep-dive"]);
Object.entries(visualLabs).forEach(([id, lab]) => { if (!labTypes.has(lab.type)) errors.push("unknown visual lab type: " + id); });
const publicFiles = fs.readdirSync("data/nus").filter(f => f.endsWith(".js")).map(f => "data/nus/" + f).concat(["js/nus.js", "js/nus-store.js", "js/nus-components.js"]);
const publicText = publicFiles.map(file => fs.readFileSync(file, "utf8"));
if (publicText.some(t => /\/Users\/|Desktop\/NUS|(?:passport|medical|identity)[^\n]{0,80}\.(?:pdf|docx?|png|jpe?g)/i.test(t))) errors.push("public NUS layer contains a private/raw source marker");
if (errors.length) { console.error("NUS GATE FAILED"); errors.forEach(e => console.error("- " + e)); process.exit(1); }
const lessonCount = courses.reduce((total, course) => {
  const catalog = (packageContent[course.code] && packageContent[course.code].content) || content[course.code] || {};
  return total + (catalog.modules || []).reduce((count, module) => count + (module.lessons || []).length, 0);
}, 0);
console.log(`NUS GATE GREEN · ${courses.length} courses · ${lessonCount} lessons · ${formulaCount} LaTeX formulas · ${criticalCount} critical questions · ${assessments.length} assessment milestones · ${Object.keys(visuals).length} visual refs`);
