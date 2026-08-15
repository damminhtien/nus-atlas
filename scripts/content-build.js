/* Build normalized course packages from the current legacy registry.
 *
 * The first migration keeps the legacy files as a rollback source. The package
 * directory is the editable source for migrated courses; the generated browser
 * bundle joins IDs at build time so views do not need to know the file layout.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { loadLegacyState } = require("./validate-content");
const { normalizeDocument } = require("./latex-utils");
const { validateDocument } = require("./validate-latex");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_COURSE = "DSA5105";

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(normalizeDocument(value), null, 2)}\n`);
}

function readJsonIfExists(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

function readQuestionBank(courseId) {
  const file = path.join(ROOT, "content", "courses", courseId, "questions", "bank.json");
  return readJsonIfExists(file);
}

function mergeQuestionBank(catalog, bank) {
  if (!bank || !Array.isArray(bank.questions)) return catalog;
  const extrasByLesson = new Map();
  bank.questions.forEach(question => {
    const list = extrasByLesson.get(question.lessonId) || [];
    list.push(question);
    extrasByLesson.set(question.lessonId, list);
  });
  return {
    ...catalog,
    modules: (catalog.modules || []).map(module => ({
      ...module,
      lessons: (module.lessons || []).map(lesson => ({
        ...lesson,
        questions: [...(lesson.questions || []), ...(extrasByLesson.get(lesson.id) || [])]
      }))
    }))
  };
}

const QUESTION_DEFAULTS = {
  mcq: { difficulty: "easy", skill: "recall", cognitiveLevel: "understand", estimatedSeconds: 60 },
  short: { difficulty: "medium", skill: "explain", cognitiveLevel: "understand", estimatedSeconds: 90 },
  derivation: { difficulty: "hard", skill: "derive", cognitiveLevel: "analyze", estimatedSeconds: 150 },
  calculation: { difficulty: "medium", skill: "calculate", cognitiveLevel: "apply", estimatedSeconds: 120 }
};

function normalizeQuestion(question) {
  const defaults = QUESTION_DEFAULTS[question.type] || QUESTION_DEFAULTS.short;
  return {
    ...cleanObject(question),
    difficulty: question.difficulty || defaults.difficulty,
    skill: question.skill || defaults.skill,
    cognitiveLevel: question.cognitiveLevel || defaults.cognitiveLevel,
    estimatedSeconds: question.estimatedSeconds || defaults.estimatedSeconds,
    misconception: question.misconception || "Check the assumption behind your answer.",
    visualHook: question.visualHook || "Explain the idea with a small diagram or example."
  };
}

function loadSlideSets(packageRoot) {
  const slidesRoot = path.join(packageRoot, "slides");
  if (!fs.existsSync(slidesRoot)) return [];
  return fs.readdirSync(slidesRoot)
    .filter(file => file.endsWith(".json"))
    .sort()
    .map(file => JSON.parse(fs.readFileSync(path.join(slidesRoot, file), "utf8")));
}

function cleanObject(value) {
  return JSON.parse(JSON.stringify(value));
}

function courseManifest(course) {
  const fields = ["code", "title", "semester", "color", "description", "prerequisites", "workload", "department", "faculty", "nusmods"];
  return Object.fromEntries(fields.filter(field => course[field] !== undefined).map(field => [field, cleanObject(course[field])]));
}

function blockRefs(lesson) {
  return Array.isArray(lesson.sourceRefs) ? lesson.sourceRefs : [];
}

function lessonBlocks(lesson) {
  const blocks = [];
  const refsFor = block => Array.isArray(block && block.sourceRefs) && block.sourceRefs.length ? block.sourceRefs : blockRefs(lesson);
  (lesson.sections || []).forEach((section, index) => blocks.push({
    id: `${lesson.id}-section-${index + 1}`,
    type: "teaching-note",
    title: section.title,
    body: section.body,
    sourceType: section.sourceType,
    sourceRefs: refsFor(section)
  }));
  (lesson.math || []).forEach((formula, index) => blocks.push({
    id: `${lesson.id}-formula-${index + 1}`,
    type: "formula",
    latex: formula.latex,
    explanation: formula.explanation,
    symbols: formula.symbols || [],
    sourceType: formula.sourceType,
    sourceRefs: refsFor(formula)
  }));
  (lesson.examples || []).forEach((example, index) => blocks.push({
    id: `${lesson.id}-example-${index + 1}`,
    type: "worked-example",
    ...example,
    sourceRefs: refsFor(example)
  }));
  (lesson.criticalQuestions || []).forEach((question, index) => blocks.push({
    id: `${lesson.id}-critical-${index + 1}`,
    type: "critical-question",
    ...question,
    sourceRefs: refsFor(question)
  }));
  return blocks;
}

function normalizeLesson(courseId, module, lesson, artifactsByLesson = {}) {
  const questions = Array.isArray(lesson.questions) ? lesson.questions.map(question => ({
    ...normalizeQuestion(question),
    courseId,
    lessonId: lesson.id,
    schemaVersion: "nus.question.v1"
  })) : [];
  const kit = artifactsByLesson[lesson.id] || lesson;
  const artifacts = {
    lessonId: lesson.id,
    schemaVersion: "nus.study-kit.v1",
    flashcards: cleanObject(kit.flashcards || []),
    homework: cleanObject(kit.homework || []),
    codeExercises: cleanObject(kit.codeExercises || [])
  };
  const core = cleanObject(lesson);
  delete core.questions;
  delete core.flashcards;
  delete core.homework;
  delete core.codeExercises;
  return {
    lesson: {
      ...core,
      courseId,
      moduleId: module.id,
      blocks: lessonBlocks(lesson),
      sourceRefs: blockRefs(lesson),
      questionIds: questions.map(question => question.id),
      labIds: Array.isArray(lesson.visualIds) ? lesson.visualIds.slice() : [],
      schemaVersion: "nus.lesson.v1"
    },
    questions,
    artifacts
  };
}

function collectSources(course, catalog) {
  const byKey = new Map();
  const add = ref => {
    if (!ref || !ref.sourceId) return;
    const key = `${ref.sourceId}#${ref.page || 0}#${ref.sourceType || ""}`;
    if (!byKey.has(key)) byKey.set(key, cleanObject(ref));
  };
  [course.lectureSources, course.textbookSources, course.referenceSources].flat().forEach(add);
  (catalog.modules || []).forEach(module => (module.lessons || []).forEach(lesson => {
    (lesson.sourceRefs || []).forEach(add);
    (lesson.questions || []).forEach(question => (question.sourceRefs || []).forEach(add));
  }));
  return [...byKey.values()];
}

function packageCourse(state, courseId) {
  const course = state.courses.find(item => item.code === courseId);
  const questionBank = readQuestionBank(courseId);
  const catalog = mergeQuestionBank(state.content[courseId], questionBank);
  if (!course || !catalog) throw new Error(`Cannot build missing course: ${courseId}`);
  const packageRoot = path.join(ROOT, "content", "courses", courseId);
  const textbookFile = path.join(packageRoot, "textbook.json");
  const textbook = fs.existsSync(textbookFile)
    ? JSON.parse(fs.readFileSync(textbookFile, "utf8"))
    : null;
  const sourceManifest = readJsonIfExists(path.join(packageRoot, "sources", "manifest.json"));
  const slideSets = loadSlideSets(packageRoot);
  const modules = [];
  const joinedModules = [];
  const questions = [];
  const artifacts = [];
  const labIds = new Set();
  const visualIds = new Set();

  for (const module of catalog.modules || []) {
    const moduleLessons = [];
    const moduleMeta = { id: module.id, title: module.title, schemaVersion: "nus.module.v1", lessonIds: [] };
    for (const legacyLesson of module.lessons || []) {
      const normalized = normalizeLesson(courseId, module, legacyLesson, state.artifacts || {});
      writeJson(path.join(packageRoot, "lessons", `${legacyLesson.id}.json`), normalized.lesson);
      writeJson(path.join(packageRoot, "questions", `${legacyLesson.id}.json`), normalized.questions);
      writeJson(path.join(packageRoot, "artifacts", `${legacyLesson.id}.json`), normalized.artifacts);
      const joinedLesson = { ...normalized.lesson, questions: normalized.questions, ...normalized.artifacts };
      moduleLessons.push(joinedLesson);
      moduleMeta.lessonIds.push(legacyLesson.id);
      questions.push(...normalized.questions);
      artifacts.push(normalized.artifacts);
      (legacyLesson.visualIds || []).forEach(id => visualIds.add(id));
      if (state.labs[legacyLesson.id]) labIds.add(legacyLesson.id);
      (legacyLesson.visualIds || []).filter(id => state.labs[id]).forEach(id => labIds.add(id));
    }
    modules.push(moduleMeta);
    joinedModules.push({ ...moduleMeta, lessons: moduleLessons });
    writeJson(path.join(packageRoot, "modules", `${module.id}.json`), moduleMeta);
  }

  const packageCourse = {
    ...cleanObject(course),
    code: courseId,
    schemaVersion: "nus.course.v1",
    moduleIds: modules.map(module => module.id),
    assessmentIds: state.assessments.filter(item => item.courseCode === courseId).map(item => item.id),
    sourceCatalog: collectSources(course, catalog),
    questionBank: questionBank ? {
      schemaVersion: questionBank.schemaVersion,
      purpose: questionBank.purpose,
      blueprint: cleanObject(questionBank.blueprint || {}),
      questionIds: questionBank.questions.map(question => question.id),
      extensionCount: questionBank.questions.length
    } : null,
    slideSetIds: slideSets.map(slideSet => slideSet.id),
    sourcePolicy: sourceManifest ? cleanObject(sourceManifest.policy || {}) : {},
    visualIds: [...visualIds],
    labIds: [...labIds]
  };
  writeJson(path.join(packageRoot, "course.json"), packageCourse);
  writeJson(path.join(packageRoot, "assessments.json"), state.assessments.filter(item => item.courseCode === courseId));
  writeJson(path.join(packageRoot, "sources.json"), packageCourse.sourceCatalog);
  writeJson(path.join(packageRoot, "visuals.json"), Object.fromEntries([...visualIds].filter(id => state.visuals[id]).map(id => [id, cleanObject(state.visuals[id])])))
  writeJson(path.join(packageRoot, "labs", "index.json"), Object.fromEntries([...labIds].filter(id => state.labs[id]).map(id => [id, cleanObject(state.labs[id])])))

  return {
    course: packageCourse,
    content: { modules: joinedModules },
    assessments: state.assessments.filter(item => item.courseCode === courseId),
    sources: packageCourse.sourceCatalog,
    ...(sourceManifest ? { sourceManifest: cleanObject(sourceManifest) } : {}),
    slideSets: cleanObject(slideSets),
    ...(textbook ? { textbook } : {}),
    ...(questionBank ? { questionBank: cleanObject(packageCourse.questionBank) } : {}),
    visuals: Object.fromEntries([...visualIds].filter(id => state.visuals[id]).map(id => [id, cleanObject(state.visuals[id])])),
    labs: Object.fromEntries([...labIds].filter(id => state.labs[id]).map(id => [id, cleanObject(state.labs[id])])),
    counts: { modules: modules.length, lessons: joinedModules.reduce((n, module) => n + module.lessons.length, 0), questions: questions.length, questionBank: questionBank ? questionBank.questions.length : 0, artifacts: artifacts.length, slideSets: slideSets.length, slides: slideSets.reduce((total, slideSet) => total + (slideSet.slides || []).length, 0) }
  };
}

function build(courseId = DEFAULT_COURSE) {
  const state = loadLegacyState(ROOT);
  const sourceErrors = validateDocument(normalizeDocument(state), path.join(ROOT, "data", "nus", "normalized-source.json"));
  if (sourceErrors.length) {
    const detail = sourceErrors.slice(0, 10).map(error => error.location + " [" + error.label + ": " + error.token + "]").join("\n- ");
    throw new Error("Normalized authored math contract failed:\n- " + detail);
  }
  const packageData = normalizeDocument(packageCourse(state, courseId));
  const output = path.join(ROOT, "data", "nus", "generated", `${courseId.toLowerCase()}.js`);
  const serialized = JSON.stringify(packageData);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `/* Generated by scripts/content-build.js; edit content/courses/${courseId}/ instead. */\n(function () { window.NUS_CONTENT_PACKAGES = window.NUS_CONTENT_PACKAGES || {}; window.NUS_CONTENT_PACKAGES[${JSON.stringify(courseId)}] = ${serialized}; })();\n`);
  console.log(`CONTENT BUILD GREEN · ${courseId} · ${packageData.counts.modules} modules · ${packageData.counts.lessons} lessons · ${packageData.counts.questions} questions · output ${path.relative(ROOT, output)}`);
  return packageData;
}

function buildAll() {
  const coursesRoot = path.join(ROOT, "content", "courses");
  const ids = fs.existsSync(coursesRoot) ? fs.readdirSync(coursesRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort() : [];
  const packageData = (ids.length ? ids : [DEFAULT_COURSE]).map(courseId => ({ courseId, data: build(courseId) }));
  const courses = packageData.map(item => {
    const serialized = JSON.stringify(item.data);
    return {
      code: item.courseId,
      course: { ...courseManifest(item.data.course), schemaVersion: "nus.course.v1" },
      asset: `data/nus/generated/${item.courseId.toLowerCase()}.js`,
      counts: item.data.counts,
      version: crypto.createHash("sha1").update(serialized).digest("hex").slice(0, 12),
      schemaVersion: "nus.package-manifest.v1"
    };
  });
  const manifest = { schemaVersion: "nus.content-manifest.v2", courses };
  const packageMap = Object.fromEntries(courses.map(course => [course.code, course]));
  const output = path.join(ROOT, "data", "nus", "generated", "content-manifest.js");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `/* Generated by scripts/content-build.js; edit content/courses/ instead. */\n(function () { window.NUS_CONTENT_MANIFEST = ${JSON.stringify(manifest)}; window.NUS_CONTENT_PACKAGES = ${JSON.stringify(packageMap)}; })();\n`);
  console.log(`CONTENT MANIFEST GREEN · ${packageData.length} package(s) · output ${path.relative(ROOT, output)}`);
}

if (require.main === module) {
  if (process.argv[2] === "--all" || !process.argv[2]) buildAll();
  else build(process.argv[2]);
}

module.exports = { build, buildAll, lessonBlocks, normalizeLesson, packageCourse };
