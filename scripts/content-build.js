/* Build normalized course packages from the current legacy registry.
 *
 * The first migration keeps the legacy files as a rollback source. The package
 * directory is the editable source for migrated courses; the generated browser
 * bundle joins IDs at build time so views do not need to know the file layout.
 */
const fs = require("fs");
const path = require("path");
const { loadLegacyState } = require("./validate-content");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_COURSE = "DSA5105";

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function cleanObject(value) {
  return JSON.parse(JSON.stringify(value));
}

function blockRefs(lesson) {
  return Array.isArray(lesson.sourceRefs) ? lesson.sourceRefs : [];
}

function lessonBlocks(lesson) {
  const blocks = [];
  (lesson.sections || []).forEach((section, index) => blocks.push({
    id: `${lesson.id}-section-${index + 1}`,
    type: "teaching-note",
    title: section.title,
    body: section.body,
    sourceType: section.sourceType,
    sourceRefs: blockRefs(lesson)
  }));
  (lesson.math || []).forEach((formula, index) => blocks.push({
    id: `${lesson.id}-formula-${index + 1}`,
    type: "formula",
    latex: formula.latex,
    explanation: formula.explanation,
    symbols: formula.symbols || [],
    sourceType: formula.sourceType,
    sourceRefs: blockRefs(lesson)
  }));
  (lesson.examples || []).forEach((example, index) => blocks.push({
    id: `${lesson.id}-example-${index + 1}`,
    type: "worked-example",
    ...example,
    sourceRefs: blockRefs(lesson)
  }));
  (lesson.criticalQuestions || []).forEach((question, index) => blocks.push({
    id: `${lesson.id}-critical-${index + 1}`,
    type: "critical-question",
    ...question,
    sourceRefs: blockRefs(lesson)
  }));
  return blocks;
}

function normalizeLesson(courseId, module, lesson, artifactsByLesson = {}) {
  const questions = Array.isArray(lesson.questions) ? lesson.questions.map(question => ({
    ...cleanObject(question),
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
  (catalog.modules || []).forEach(module => (module.lessons || []).forEach(lesson => (lesson.sourceRefs || []).forEach(add)));
  return [...byKey.values()];
}

function packageCourse(state, courseId) {
  const course = state.courses.find(item => item.code === courseId);
  const catalog = state.content[courseId];
  if (!course || !catalog) throw new Error(`Cannot build missing course: ${courseId}`);
  const packageRoot = path.join(ROOT, "content", "courses", courseId);
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
    visuals: Object.fromEntries([...visualIds].filter(id => state.visuals[id]).map(id => [id, cleanObject(state.visuals[id])])),
    labs: Object.fromEntries([...labIds].filter(id => state.labs[id]).map(id => [id, cleanObject(state.labs[id])])),
    counts: { modules: modules.length, lessons: joinedModules.reduce((n, module) => n + module.lessons.length, 0), questions: questions.length, artifacts: artifacts.length }
  };
}

function build(courseId = DEFAULT_COURSE) {
  const state = loadLegacyState(ROOT);
  const packageData = packageCourse(state, courseId);
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
  const bundle = Object.fromEntries(packageData.map(item => [item.courseId, item.data]));
  const output = path.join(ROOT, "data", "nus", "generated", "content-manifest.js");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `/* Generated by scripts/content-build.js; edit content/courses/ instead. */\n(function () { window.NUS_CONTENT_PACKAGES = ${JSON.stringify(bundle)}; })();\n`);
  console.log(`CONTENT MANIFEST GREEN · ${packageData.length} package(s) · output ${path.relative(ROOT, output)}`);
}

if (require.main === module) {
  if (process.argv[2] === "--all" || !process.argv[2]) buildAll();
  else build(process.argv[2]);
}

module.exports = { build, buildAll, lessonBlocks, normalizeLesson, packageCourse };
