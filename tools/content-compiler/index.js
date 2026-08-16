/* Canonical content compiler.
 *
 * The compiler reads only content/** and writes only the deployment artifact.
 * Migration from data/nus is deliberately outside this module.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { normalizeDocument } = require("../../scripts/latex-utils");
const { validateDocument } = require("../../scripts/validate-latex");

const QUESTION_DEFAULTS = {
  mcq: { difficulty: "easy", skill: "recall", cognitiveLevel: "understand", estimatedSeconds: 60 },
  short: { difficulty: "medium", skill: "explain", cognitiveLevel: "understand", estimatedSeconds: 90 },
  derivation: { difficulty: "hard", skill: "derive", cognitiveLevel: "analyze", estimatedSeconds: 150 },
  calculation: { difficulty: "medium", skill: "calculate", cognitiveLevel: "apply", estimatedSeconds: 120 }
};

function cleanObject(value) { return JSON.parse(JSON.stringify(value)); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function readJsonIfExists(file) { return fs.existsSync(file) ? readJson(file) : null; }
function sortedJsonFiles(dir) { return fs.existsSync(dir) ? fs.readdirSync(dir).filter(file => file.endsWith(".json")).sort() : []; }
function mergeQuestions(primary, extras) {
  const seen = new Set();
  return [...(primary || []), ...(extras || [])].filter(question => {
    if (!question || !question.id || seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
  return value;
}

function stableStringify(value) { return JSON.stringify(stableValue(value)); }
function hash(value) { return crypto.createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 12); }

function normalizeQuestion(question, courseId, lessonId) {
  const defaults = QUESTION_DEFAULTS[question.type] || QUESTION_DEFAULTS.short;
  return {
    ...cleanObject(question),
    courseId,
    lessonId,
    difficulty: question.difficulty || defaults.difficulty,
    skill: question.skill || defaults.skill,
    cognitiveLevel: question.cognitiveLevel || defaults.cognitiveLevel,
    estimatedSeconds: question.estimatedSeconds || defaults.estimatedSeconds,
    misconception: question.misconception || "Check the assumption behind your answer.",
    visualHook: question.visualHook || "Explain the idea with a small diagram or example.",
    schemaVersion: "nus.question.v1"
  };
}

function lessonBlocks(lesson) {
  const blocks = [];
  const refsFor = block => Array.isArray(block && block.sourceRefs) && block.sourceRefs.length ? block.sourceRefs : (lesson.sourceRefs || []);
  (lesson.sections || []).forEach((section, index) => {
    blocks.push({ id: `${lesson.id}-section-${index + 1}`, type: "teaching-note", title: section.title, body: section.body, teaching: section.teaching, sourceType: section.sourceType, sourceRefs: refsFor(section) });
    if (section.math) blocks.push({ id: `${lesson.id}-section-${index + 1}-formula`, type: "formula", name: section.math.name, purpose: section.math.purpose, latex: section.math.latex, explanation: section.math.explanation, symbols: section.math.symbols || [], sourceType: section.math.sourceType || section.sourceType, sourceRefs: refsFor(section) });
  });
  (lesson.math || []).forEach((formula, index) => blocks.push({ id: `${lesson.id}-formula-${index + 1}`, type: "formula", name: formula.name, purpose: formula.purpose, latex: formula.latex, explanation: formula.explanation, symbols: formula.symbols || [], sourceType: formula.sourceType, sourceRefs: refsFor(formula) }));
  (lesson.examples || []).forEach((example, index) => blocks.push({ id: `${lesson.id}-example-${index + 1}`, type: "worked-example", ...example, sourceRefs: refsFor(example) }));
  (lesson.criticalQuestions || []).forEach((question, index) => blocks.push({ id: `${lesson.id}-critical-${index + 1}`, type: "critical-question", ...question, sourceRefs: refsFor(question) }));
  return blocks;
}

function normalizeLesson(courseId, module, lesson, questions, kit) {
  const normalizedQuestions = (questions || []).map(question => normalizeQuestion(question, courseId, lesson.id));
  const artifacts = {
    lessonId: lesson.id,
    schemaVersion: "nus.study-kit.v1",
    flashcards: cleanObject((kit && kit.flashcards) || []),
    homework: cleanObject((kit && kit.homework) || []),
    codeExercises: cleanObject((kit && kit.codeExercises) || [])
  };
  const core = cleanObject(lesson);
  for (const field of ["questions", "flashcards", "homework", "codeExercises"]) delete core[field];
  return {
    lesson: {
      ...core,
      courseId,
      moduleId: module.id,
      blocks: Array.isArray(core.blocks) && core.blocks.length ? core.blocks : lessonBlocks(lesson),
      sourceRefs: Array.isArray(lesson.sourceRefs) ? lesson.sourceRefs : [],
      questionIds: normalizedQuestions.map(question => question.id),
      labIds: Array.isArray(lesson.visualIds) ? lesson.visualIds.slice() : (lesson.labIds || []),
      schemaVersion: "nus.lesson.v1"
    },
    questions: normalizedQuestions,
    artifacts
  };
}

function loadCourseSource(root, courseId) {
  const courseRoot = path.join(root, "content", "courses", courseId);
  const course = readJson(path.join(courseRoot, "course.json"));
  const moduleFiles = sortedJsonFiles(path.join(courseRoot, "modules"));
  const lessonFiles = new Map(sortedJsonFiles(path.join(courseRoot, "lessons")).map(file => [path.basename(file, ".json"), file]));
  const questionBank = readJsonIfExists(path.join(courseRoot, "questions", "bank.json"));
  const bankByLesson = new Map();
  (questionBank && questionBank.questions || []).forEach(question => {
    const list = bankByLesson.get(question.lessonId) || [];
    list.push(question);
    bankByLesson.set(question.lessonId, list);
  });
  const modules = moduleFiles.map(file => {
    const module = readJson(path.join(courseRoot, "modules", file));
    const lessons = (module.lessonIds || []).map(id => {
      const lesson = readJson(path.join(courseRoot, "lessons", lessonFiles.get(id) || `${id}.json`));
      const questionFile = path.join(courseRoot, "questions", `${id}.json`);
      const artifactFile = path.join(courseRoot, "artifacts", `${id}.json`);
      const questions = mergeQuestions(fs.existsSync(questionFile) ? readJson(questionFile) : [], bankByLesson.get(id) || []);
      const kit = fs.existsSync(artifactFile) ? readJson(artifactFile) : {};
      return { ...lesson, questions, ...kit };
    });
    return { ...module, lessons };
  });
  return {
    course,
    modules,
    assessments: readJsonIfExists(path.join(courseRoot, "assessments.json")) || [],
    labs: readJsonIfExists(path.join(courseRoot, "labs", "index.json")) || {},
    visuals: readJsonIfExists(path.join(courseRoot, "visuals.json")) || {},
    sources: readJsonIfExists(path.join(courseRoot, "sources.json")) || [],
    sourceManifest: readJsonIfExists(path.join(courseRoot, "sources", "manifest.json")),
    slideSets: sortedJsonFiles(path.join(courseRoot, "slides")).map(file => readJson(path.join(courseRoot, "slides", file))),
    textbook: readJsonIfExists(path.join(courseRoot, "textbook.json")),
    assessmentMap: readJsonIfExists(path.join(courseRoot, "assessment-map.json")),
    schedule: readJsonIfExists(path.join(courseRoot, "schedule.json")),
    questionBank
  };
}

function courseManifest(course) {
  const fields = ["code", "title", "semester", "color", "description", "prerequisites", "workload", "department", "faculty", "nusmods"];
  return Object.fromEntries(fields.filter(field => course[field] !== undefined).map(field => [field, cleanObject(course[field])]));
}

function collectSources(course, modules) {
  const byKey = new Map();
  const add = ref => {
    if (!ref || !ref.sourceId) return;
    const key = `${ref.sourceId}#${ref.page || 0}#${ref.sourceType || ""}`;
    if (!byKey.has(key)) byKey.set(key, cleanObject(ref));
  };
  [course.lectureSources, course.exerciseSources, course.textbookSources, course.referenceSources].flat().forEach(add);
  modules.forEach(module => (module.lessons || []).forEach(lesson => {
    (lesson.sourceRefs || []).forEach(add);
    (lesson.questions || []).forEach(question => (question.sourceRefs || []).forEach(add));
  }));
  return [...byKey.values()];
}

function compileCourse(root, courseId) {
  const source = loadCourseSource(root, courseId);
  const course = source.course;
  const modules = [];
  const lessons = {};
  const questions = {};
  const studyKits = {};
  const joinedModules = [];
  const visualIds = new Set();
  const labIds = new Set();
  for (const module of source.modules) {
    const lessonMeta = [];
    const joinedLessons = [];
    for (const rawLesson of module.lessons || []) {
      const normalized = normalizeLesson(courseId, module, rawLesson, rawLesson.questions, rawLesson);
      lessons[rawLesson.id] = normalized.lesson;
      questions[rawLesson.id] = normalized.questions;
      studyKits[rawLesson.id] = normalized.artifacts;
      lessonMeta.push({ id: rawLesson.id, title: rawLesson.title, week: rawLesson.week, minutes: rawLesson.minutes, summary: rawLesson.summary, objectiveCount: (rawLesson.objectives || []).length, questionCount: normalized.questions.length, questionIds: normalized.questions.map(question => question.id), hasVisualLab: !!source.labs[rawLesson.id], visualIds: rawLesson.visualIds || [] });
      joinedLessons.push({ ...normalized.lesson, questions: normalized.questions, ...normalized.artifacts });
      (rawLesson.visualIds || []).forEach(id => visualIds.add(id));
      if (source.labs[rawLesson.id]) labIds.add(rawLesson.id);
    }
    modules.push({ id: module.id, title: module.title, schemaVersion: "nus.module.v1", lessonIds: lessonMeta.map(lesson => lesson.id) });
    joinedModules.push({ id: module.id, title: module.title, schemaVersion: "nus.module.v1", lessons: joinedLessons });
  }
  const packageCourse = {
    ...cleanObject(course),
    code: courseId,
    schemaVersion: "nus.course.v1",
    moduleIds: modules.map(module => module.id),
    assessmentIds: source.assessments.map(item => item.id),
    sourceCatalog: collectSources(course, source.modules),
    questionBank: source.questionBank ? { schemaVersion: source.questionBank.schemaVersion, purpose: source.questionBank.purpose, blueprint: cleanObject(source.questionBank.blueprint || {}), questionIds: source.questionBank.questions.map(question => question.id), extensionCount: source.questionBank.questions.length } : null,
    slideSetIds: source.slideSets.map(slideSet => slideSet.id),
    sourcePolicy: source.sourceManifest ? cleanObject(source.sourceManifest.policy || {}) : {},
    visualIds: [...visualIds],
    labIds: [...labIds]
  };
  const joined = {
    course: packageCourse,
    content: { modules: joinedModules },
    assessments: source.assessments,
    sources: packageCourse.sourceCatalog,
    ...(source.assessmentMap ? { assessmentMap: cleanObject(source.assessmentMap) } : {}),
    ...(source.sourceManifest ? { sourceManifest: cleanObject(source.sourceManifest) } : {}),
    slideSets: cleanObject(source.slideSets),
    ...(source.textbook ? { textbook: source.textbook } : {}),
    ...(source.questionBank ? { questionBank: cleanObject(packageCourse.questionBank) } : {}),
    visuals: Object.fromEntries([...visualIds].filter(id => source.visuals[id]).map(id => [id, cleanObject(source.visuals[id])])),
    labs: Object.fromEntries([...labIds].filter(id => source.labs[id]).map(id => [id, cleanObject(source.labs[id])])),
    schedule: source.schedule || null,
    counts: { modules: modules.length, lessons: Object.keys(lessons).length, questions: Object.values(questions).reduce((n, list) => n + list.length, 0), questionBank: source.questionBank ? source.questionBank.questions.length : 0, artifacts: Object.keys(studyKits).length, slideSets: source.slideSets.length, slides: source.slideSets.reduce((total, set) => total + (set.slides || []).length, 0) }
  };
  const outline = { schemaVersion: "nus.course-outline.v1", courseId, course: courseManifest(packageCourse), modules: modules.map((module, index) => ({ ...module, title: source.modules[index].title, lessons: source.modules[index].lessons.map(lesson => ({ id: lesson.id, title: lesson.title, week: lesson.week, minutes: lesson.minutes, summary: lesson.summary, objectiveCount: (lesson.objectives || []).length, questionCount: questions[lesson.id].length, questionIds: questions[lesson.id].map(question => question.id), hasVisualLab: !!source.labs[lesson.id], visualIds: lesson.visualIds || [] })) })), labs: Object.values(source.labs).map(lab => ({ id: lab.id || lab.lessonId, courseCode: lab.courseCode, lessonId: lab.lessonId, title: lab.title, type: lab.type })) };
  return { source, package: joined, outline, lessons, questions, studyKits };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(stableValue(normalizeDocument(value)), null, 2)}\n`);
}

function writeCourseArtifacts(outputRoot, compiled) {
  const courseId = compiled.package.course.code;
  const courseRoot = path.join(outputRoot, courseId);
  const lessonAssets = {};
  const questionAssets = {};
  const studyKitAssets = {};
  for (const id of Object.keys(compiled.lessons).sort()) {
    const lesson = compiled.lessons[id];
    const questionList = compiled.questions[id] || [];
    const studyKit = compiled.studyKits[id] || {};
    const lessonAsset = `lessons/${id}.${hash(lesson)}.json`;
    const questionAsset = `questions/${id}.${hash(questionList)}.json`;
    const studyKitAsset = `study-kits/${id}.${hash(studyKit)}.json`;
    writeJson(path.join(courseRoot, lessonAsset), { schemaVersion: "nus.lesson-payload.v1", lesson, questionsAsset: questionAsset, studyKitAsset });
    writeJson(path.join(courseRoot, questionAsset), { schemaVersion: "nus.question-payload.v1", questions: questionList });
    writeJson(path.join(courseRoot, studyKitAsset), studyKit);
    lessonAssets[id] = lessonAsset;
    questionAssets[id] = questionAsset;
    studyKitAssets[id] = studyKitAsset;
  }
  const courseAssetValue = { ...compiled.package, content: undefined, lessonAssets, questionAssets, studyKitAssets };
  delete courseAssetValue.content;
  const courseAsset = `course.${hash(courseAssetValue)}.json`;
  writeJson(path.join(courseRoot, courseAsset), courseAssetValue);
  const outline = { ...compiled.outline, courseAsset, lessonAssets, questionAssets, studyKitAssets };
  writeJson(path.join(courseRoot, "outline.json"), outline);
  return { code: courseId, courseId, course: compiled.outline.course, modules: compiled.outline.modules, labs: compiled.outline.labs, outline: `${courseId}/outline.json`, courseAsset: `${courseId}/${courseAsset}`, lessonAssets: Object.fromEntries(Object.entries(lessonAssets).map(([id, asset]) => [id, `${courseId}/${asset}`])), questionAssets: Object.fromEntries(Object.entries(questionAssets).map(([id, asset]) => [id, `${courseId}/${asset}`])), studyKitAssets: Object.fromEntries(Object.entries(studyKitAssets).map(([id, asset]) => [id, `${courseId}/${asset}`])), counts: compiled.package.counts, version: hash({ outline, courseAssetValue }), schemaVersion: "nus.content-course-manifest.v1" };
}

function compileAll(root, outputRoot) {
  const coursesRoot = path.join(root, "content", "courses");
  const ids = fs.readdirSync(coursesRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });
  const courses = ids.map(courseId => writeCourseArtifacts(outputRoot, compileCourse(root, courseId)));
  const sourceTypes = readJsonIfExists(path.join(root, "content", "source-types.json"));
  const manifest = { schemaVersion: "nus.content-manifest.v3", version: hash({ courses, sourceTypes }), sourceTypes, courses };
  writeJson(path.join(outputRoot, "manifest.json"), manifest);
  return { manifest, courses };
}

function validateCanonical(root, courseId) {
  const source = loadCourseSource(root, courseId);
  const normalized = normalizeDocument({ courses: [source.course], content: { [courseId]: { modules: source.modules } }, assessments: source.assessments, labs: source.labs, visuals: source.visuals });
  const errors = validateDocument(normalized, path.join(root, "content", "courses", courseId, "course.json"));
  if (errors.length) throw new Error(`Canonical authored math contract failed for ${courseId}:\n- ${errors.slice(0, 10).map(error => `${error.location} [${error.label}: ${error.token}]`).join("\n- ")}`);
}

module.exports = { compileAll, compileCourse, loadCourseSource, stableStringify, hash, validateCanonical, writeCourseArtifacts, normalizeLesson };
