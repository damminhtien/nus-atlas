/* Canonical content compiler.
 *
 * The compiler reads only content/** and writes only the deployment artifact.
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
function orderedJsonFiles(dir, ids, label) {
  const files = sortedJsonFiles(dir);
  if (!Array.isArray(ids)) return files;
  const fileIds = new Set(files.map(file => path.basename(file, ".json")));
  const expectedIds = new Set(ids);
  const missing = ids.filter(id => !fileIds.has(id));
  const unexpected = files.filter(file => !expectedIds.has(path.basename(file, ".json")));
  if (missing.length || unexpected.length || new Set(ids).size !== ids.length) {
    const details = [
      missing.length ? `missing ${label} files: ${missing.join(", ")}` : "",
      unexpected.length ? `unlisted ${label} files: ${unexpected.map(file => path.basename(file, ".json")).join(", ")}` : "",
      new Set(ids).size !== ids.length ? `duplicate ${label} ids in course manifest` : ""
    ].filter(Boolean).join("; ");
    throw new Error(`Canonical ${label} order is invalid: ${details}`);
  }
  return ids.map(id => `${id}.json`);
}
function mergeQuestions(primary, extras, options = {}) {
  const merged = [];
  const positions = new Map();
  for (const [source, prefer] of [[primary, false], [extras, true]]) {
    for (const question of source || []) {
      if (!question || !question.id) continue;
      const position = positions.get(question.id);
      if (position === undefined) {
        positions.set(question.id, merged.length);
        merged.push(question);
      } else if (options.preferExtras && prefer) {
        merged[position] = question;
      }
    }
  }
  return merged;
}

function mergeQuestionBanks(primary, supplementalBanks) {
  const banks = [primary, ...(supplementalBanks || [])].filter(Boolean);
  if (!banks.length) return null;
  const supplementalQuestions = banks.slice(1).flatMap(bank => (bank.questions || []).map(question => ({
    ...question,
    ...(bank.assessmentLayer && !question.assessmentLayer ? { assessmentLayer: bank.assessmentLayer } : {}),
    ...(bank.origin && !question.origin ? { origin: bank.origin } : {})
  })));
  const assessmentLayers = banks
    .filter(bank => bank.assessmentLayer)
    .map(bank => ({
      id: bank.assessmentLayer,
      origin: bank.origin || "unspecified",
      status: bank.status || "unclassified",
      questionIds: (bank.questions || []).map(question => question.id)
    }));
  return {
    ...banks[0],
    questions: mergeQuestions(banks[0].questions, supplementalQuestions),
    ...(assessmentLayers.length ? { assessmentLayers } : {})
  };
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
    entityKey: `question:${courseId}/${lessonId}/${question.id}`,
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

function firstAssessmentSource(facts) {
  for (const fact of Object.values(facts || {})) {
    if (fact && Array.isArray(fact.sourceRefs) && fact.sourceRefs.length) return fact.sourceRefs[0];
    if (fact && Array.isArray(fact.explicitExclusions)) {
      for (const exclusion of fact.explicitExclusions) if (exclusion && Array.isArray(exclusion.sourceRefs) && exclusion.sourceRefs.length) return exclusion.sourceRefs[0];
    }
  }
  return undefined;
}

function normalizeAssessment(assessment) {
  if (!assessment || !assessment.id) return assessment;
  const facts = cleanObject(assessment.officialFacts || {});
  const guidance = cleanObject(assessment.studentGuidance || {});
  const weightSpec = facts.weight || {};
  const timing = facts.timing || {};
  const weight = Number.isFinite(weightSpec.value) ? weightSpec.value : null;
  const normalized = {
    ...cleanObject(assessment),
    schemaVersion: "nus.assessment.v2",
    officialFacts: facts,
    studentGuidance: guidance,
    weight,
    weightLabel: weightSpec.label || (Number.isFinite(weightSpec.groupTotal) ? `part of ${weightSpec.groupTotal}%` : (weight == null ? "Weight pending" : `${weight}%`)),
    date: timing.date ?? null,
    dateStatus: timing.dateStatus || (timing.date ? "confirmed" : "pending"),
    timeStatus: timing.timeStatus || (timing.time ? "confirmed" : "pending"),
    timing: cleanObject(timing),
    checklist: Array.isArray(guidance.checklist) ? guidance.checklist.slice() : [],
    source: firstAssessmentSource(facts)
  };
  if (weightSpec.groupId) normalized.weightGroup = { id: weightSpec.groupId, total: weightSpec.groupTotal, label: weightSpec.label };
  ["format", "submission", "scope", "groupPolicy"].forEach(field => {
    if (facts[field] !== undefined) normalized[field] = cleanObject(facts[field]);
  });
  return normalized;
}

function assessmentWeightTotal(assessments) {
  let total = 0;
  const groups = new Set();
  for (const assessment of assessments || []) {
    const spec = assessment && assessment.officialFacts && assessment.officialFacts.weight;
    if (spec && spec.groupId) {
      if (!groups.has(spec.groupId) && Number.isFinite(spec.groupTotal)) {
        total += spec.groupTotal;
        groups.add(spec.groupId);
      }
    } else if (spec && Number.isFinite(spec.value)) total += spec.value;
    else if (Number.isFinite(assessment && assessment.weight)) total += assessment.weight;
  }
  return total;
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

function normalizeLesson(courseId, module, lesson, questions, kit, ordering = {}) {
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
      entityKey: `lesson:${courseId}/${lesson.id}`,
      courseId,
      moduleId: module.id,
      ...(Number.isInteger(ordering.sequence) ? { sequence: ordering.sequence } : {}),
      ...(Number.isInteger(ordering.orderInWeek) ? { orderInWeek: ordering.orderInWeek } : {}),
      ...(Array.isArray(ordering.collectionIds) && ordering.collectionIds.length ? { collectionIds: ordering.collectionIds.slice() } : {}),
      slideSetIds: Array.isArray(lesson.slideSetIds) ? lesson.slideSetIds.slice() : [],
      visualIds: Array.isArray(lesson.visualIds) ? lesson.visualIds.slice() : [],
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
  const sqlPractice = readJsonIfExists(path.join(courseRoot, "sql-practice.json"));
  const canonicalCourse = sqlPractice ? { ...course, sqlPractice } : course;
  const moduleFiles = orderedJsonFiles(path.join(courseRoot, "modules"), canonicalCourse.moduleIds, "module");
  const lessonFiles = new Map(sortedJsonFiles(path.join(courseRoot, "lessons")).map(file => [path.basename(file, ".json"), file]));
  const questionBank = mergeQuestionBanks(
    readJsonIfExists(path.join(courseRoot, "questions", "bank.json")),
    ["exam-bank.json", "deep-dive-bank.json"]
      .map(file => readJsonIfExists(path.join(courseRoot, "questions", file)))
  );
  const questionTemplates = readJsonIfExists(path.join(courseRoot, "questions", "templates.json"));
  const bankByLesson = new Map();
  (questionBank && questionBank.questions || []).forEach(question => {
    const list = bankByLesson.get(question.lessonId) || [];
    list.push(question);
    bankByLesson.set(question.lessonId, list);
  });
  const loadLessons = (lessonIds, ownerId) => (lessonIds || []).map(id => {
    const lessonFile = lessonFiles.get(id) || `${id}.json`;
    if (!fs.existsSync(path.join(courseRoot, "lessons", lessonFile))) throw new Error(`Missing lesson ${id} referenced by ${ownerId}`);
    const lesson = readJson(path.join(courseRoot, "lessons", lessonFile));
    const questionFile = path.join(courseRoot, "questions", `${id}.json`);
    const artifactFile = path.join(courseRoot, "artifacts", `${id}.json`);
    // Authored lesson order remains stable, but the bank owns any colliding ID.
    const questions = mergeQuestions(fs.existsSync(questionFile) ? readJson(questionFile) : [], bankByLesson.get(id) || [], { preferExtras: true });
    const kit = fs.existsSync(artifactFile) ? readJson(artifactFile) : {};
    return { ...lesson, questions, ...kit };
  });
  const modules = moduleFiles.map(file => {
    const module = readJson(path.join(courseRoot, "modules", file));
    if (module.id !== path.basename(file, ".json")) throw new Error(`Module filename/id mismatch: ${courseId}/${file}`);
    const lessons = loadLessons(module.lessonIds, module.id);
    const mismatched = lessons.filter(lesson => lesson.moduleId && lesson.moduleId !== module.id).map(lesson => `${lesson.id} -> ${lesson.moduleId}`);
    if (mismatched.length) throw new Error(`Lesson module ownership mismatch in ${module.id}: ${mismatched.join(", ")}`);
    return { ...module, lessons };
  });
  const allModuleLessonIds = modules.flatMap(module => module.lessons.map(lesson => lesson.id));
  if (new Set(allModuleLessonIds).size !== allModuleLessonIds.length) throw new Error(`Duplicate lesson ownership in ${courseId}`);
  const moduleLessonIds = new Set(allModuleLessonIds);
  const collectionFiles = orderedJsonFiles(path.join(courseRoot, "collections"), course.collectionIds, "collection");
  const collections = collectionFiles.map(file => {
    const collection = readJson(path.join(courseRoot, "collections", file));
    if (collection.id !== path.basename(file, ".json")) throw new Error(`Collection filename/id mismatch: ${courseId}/${file}`);
    const lessonIds = Array.isArray(collection.lessonIds) ? collection.lessonIds.slice() : [];
    const missing = lessonIds.filter(id => !moduleLessonIds.has(id));
    if (missing.length) throw new Error(`Collection ${collection.id} references lessons outside the course timeline: ${missing.join(", ")}`);
    return { ...collection, lessonIds };
  });
  return {
    course: canonicalCourse,
    modules,
    collections,
    assessments: readJsonIfExists(path.join(courseRoot, "assessments.json")) || [],
    labs: readJsonIfExists(path.join(courseRoot, "labs", "index.json")) || {},
    visuals: readJsonIfExists(path.join(courseRoot, "visuals.json")) || {},
    sources: readJsonIfExists(path.join(courseRoot, "sources.json")) || [],
    sourceManifest: readJsonIfExists(path.join(courseRoot, "sources", "manifest.json")),
    slideSets: sortedJsonFiles(path.join(courseRoot, "slides")).map(file => readJson(path.join(courseRoot, "slides", file))),
    textbook: readJsonIfExists(path.join(courseRoot, "textbook.json")),
    assessmentMap: readJsonIfExists(path.join(courseRoot, "assessment-map.json")),
    schedule: readJsonIfExists(path.join(courseRoot, "schedule.json")),
    questionBank,
    questionTemplates
  };
}

function courseManifest(course) {
  const fields = ["code", "entityKey", "title", "semester", "color", "description", "coverage", "prerequisites", "workload", "department", "faculty", "nusmods"];
  return Object.fromEntries(fields.filter(field => course[field] !== undefined).map(field => [field, cleanObject(course[field])]));
}

function collectSources(course, modules, assessments = [], sourceManifest = null) {
  const byKey = new Map();
  const add = ref => {
    if (!ref || !ref.sourceId) return;
    const key = `${ref.sourceId}#${ref.page || 0}#${ref.sourceType || ""}`;
    if (!byKey.has(key)) byKey.set(key, cleanObject(ref));
  };
  ((sourceManifest && sourceManifest.sources) || [course.lectureSources, course.exerciseSources, course.textbookSources, course.referenceSources].flat()).forEach(add);
  [course.lectureSources, course.exerciseSources, course.textbookSources, course.referenceSources].flat().forEach(add);
  modules.forEach(module => (module.lessons || []).forEach(lesson => {
    (lesson.sourceRefs || []).forEach(add);
    (lesson.questions || []).forEach(question => (question.sourceRefs || []).forEach(add));
  }));
  assessments.forEach(assessment => {
    Object.values(assessment.officialFacts || {}).forEach(fact => {
      (fact.sourceRefs || []).forEach(add);
      (fact.explicitExclusions || []).forEach(exclusion => (exclusion.sourceRefs || []).forEach(add));
    });
  });
  return [...byKey.values()];
}

function timelineMetadata(course, modules) {
  const entries = modules.flatMap((module, moduleIndex) => (module.lessons || []).map((lesson, lessonIndex) => ({ lesson, moduleIndex, lessonIndex })));
  const byId = new Map(entries.map(entry => [entry.lesson.id, entry]));
  const authoredIds = entries.map(entry => entry.lesson.id);
  let orderedIds;
  if (Array.isArray(course.timelineLessonIds)) {
    const seen = new Set(course.timelineLessonIds);
    const missing = authoredIds.filter(id => !seen.has(id));
    const unknown = course.timelineLessonIds.filter(id => !byId.has(id));
    if (seen.size !== course.timelineLessonIds.length || missing.length || unknown.length || course.timelineLessonIds.length !== authoredIds.length) {
      throw new Error(`Canonical timeline is invalid for ${course.code}: missing [${missing.join(", ")}], unknown [${unknown.join(", ")}]`);
    }
    orderedIds = course.timelineLessonIds.slice();
  } else {
    orderedIds = entries.slice().sort((a, b) => {
      const week = (Number(a.lesson.week) || 0) - (Number(b.lesson.week) || 0);
      if (week) return week;
      const order = (Number(a.lesson.orderInWeek) || Number.MAX_SAFE_INTEGER) - (Number(b.lesson.orderInWeek) || Number.MAX_SAFE_INTEGER);
      if (order) return order;
      return a.moduleIndex - b.moduleIndex || a.lessonIndex - b.lessonIndex;
    }).map(entry => entry.lesson.id);
  }
  const orderById = new Map(orderedIds.map((id, index) => [id, index + 1]));
  const weekCounts = new Map();
  const metadata = new Map();
  orderedIds.forEach((id, index) => {
    const lesson = byId.get(id).lesson;
    const week = Number(lesson.week) || 0;
    const orderInWeek = (weekCounts.get(week) || 0) + 1;
    weekCounts.set(week, orderInWeek);
    metadata.set(id, { sequence: index + 1, orderInWeek });
  });
  return { ids: orderedIds, orderById, metadata };
}

function compileCourseSource(source, courseId = source && source.course && source.course.code) {
  if (!source || !source.course || !courseId) throw new TypeError("compileCourseSource requires a course source and course id");
  const course = source.course;
  const modules = [];
  const lessons = {};
  const questions = {};
  const studyKits = {};
  const assessments = (source.assessments || []).map(normalizeAssessment);
  const joinedModules = [];
  const visualIds = new Set();
  const labIds = new Set();
  const timeline = timelineMetadata(course, source.modules);
  const collectionIdsByLesson = new Map();
  (source.collections || []).forEach(collection => (collection.lessonIds || []).forEach(lessonId => {
    const ids = collectionIdsByLesson.get(lessonId) || [];
    ids.push(collection.id);
    collectionIdsByLesson.set(lessonId, ids);
  }));
  for (const module of source.modules) {
    const lessonMeta = [];
    const joinedLessons = [];
    for (const rawLesson of module.lessons || []) {
      const slideSetIds = source.slideSets.filter(slideSet => (slideSet.lessonIds || []).includes(rawLesson.id)).map(slideSet => slideSet.id);
      const normalized = normalizeLesson(courseId, module, { ...rawLesson, slideSetIds }, rawLesson.questions, rawLesson, {
        ...timeline.metadata.get(rawLesson.id),
        collectionIds: collectionIdsByLesson.get(rawLesson.id) || []
      });
      lessons[rawLesson.id] = normalized.lesson;
      questions[rawLesson.id] = normalized.questions;
      studyKits[rawLesson.id] = normalized.artifacts;
      lessonMeta.push({ id: rawLesson.id, title: rawLesson.title, week: rawLesson.week, sequence: normalized.lesson.sequence, orderInWeek: normalized.lesson.orderInWeek, minutes: rawLesson.minutes, summary: rawLesson.summary, objectiveCount: (rawLesson.objectives || []).length, questionCount: normalized.questions.length, questionIds: normalized.questions.map(question => question.id), hasVisualLab: !!source.labs[rawLesson.id], visualIds: rawLesson.visualIds || [], slideSetIds });
      joinedLessons.push({ ...normalized.lesson, questions: normalized.questions, ...normalized.artifacts });
      (rawLesson.visualIds || []).forEach(id => visualIds.add(id));
      if (source.labs[rawLesson.id]) labIds.add(rawLesson.id);
    }
    modules.push({ id: module.id, entityKey: `module:${courseId}/${module.id}`, title: module.title, ...(module.description ? { description: module.description } : {}), ...(module.scope ? { scope: module.scope } : {}), ...(module.examEligible !== undefined ? { examEligible: module.examEligible } : {}), schemaVersion: "nus.module.v1", lessonIds: lessonMeta.map(lesson => lesson.id) });
    joinedModules.push({ id: module.id, title: module.title, ...(module.description ? { description: module.description } : {}), ...(module.scope ? { scope: module.scope } : {}), ...(module.examEligible !== undefined ? { examEligible: module.examEligible } : {}), schemaVersion: "nus.module.v1", lessons: joinedLessons });
  }
  const packageCourse = {
    ...cleanObject(course),
    code: courseId,
    entityKey: `course:${courseId}/course`,
    schemaVersion: "nus.course.v1",
    moduleIds: Array.isArray(course.moduleIds) ? course.moduleIds.slice() : modules.map(module => module.id),
    collectionIds: Array.isArray(course.collectionIds) ? course.collectionIds.slice() : (source.collections || []).map(collection => collection.id),
    timelineLessonIds: timeline.ids,
    assessmentIds: assessments.map(item => item.id),
    sourceCatalog: collectSources(course, source.modules, assessments, source.sourceManifest),
    questionBank: source.questionBank ? { schemaVersion: source.questionBank.schemaVersion, purpose: source.questionBank.purpose, blueprint: cleanObject(source.questionBank.blueprint || {}), questionIds: source.questionBank.questions.map(question => question.id), extensionCount: source.questionBank.questions.length, ...(source.questionTemplates ? { templateCount: (source.questionTemplates.templates || []).length } : {}), ...(source.questionBank.assessmentLayers ? { assessmentLayers: cleanObject(source.questionBank.assessmentLayers) } : {}) } : null,
    ...(source.questionTemplates ? { questionTemplates: cleanObject(source.questionTemplates) } : {}),
    slideSetIds: source.slideSets.map(slideSet => slideSet.id),
    sourcePolicy: source.sourceManifest ? cleanObject(source.sourceManifest.policy || {}) : {},
    visualIds: [...visualIds],
    labIds: [...labIds]
  };
  const collections = (source.collections || []).map(collection => ({
    id: collection.id,
    entityKey: `collection:${courseId}/${collection.id}`,
    title: collection.title,
    description: collection.description,
    lessonIds: collection.lessonIds.slice(),
    schemaVersion: "nus.collection.v1"
  }));
  const joined = {
    course: packageCourse,
    content: { modules: joinedModules, collections, timelineLessonIds: timeline.ids },
    collections,
    assessments,
    sources: packageCourse.sourceCatalog,
    ...(source.assessmentMap ? { assessmentMap: cleanObject(source.assessmentMap) } : {}),
    ...(source.sourceManifest ? { sourceManifest: cleanObject(source.sourceManifest) } : {}),
    slideSets: cleanObject(source.slideSets),
    ...(source.textbook ? { textbook: source.textbook } : {}),
    ...(source.questionBank ? { questionBank: cleanObject(packageCourse.questionBank) } : {}),
    ...(source.questionTemplates ? { questionTemplates: cleanObject(source.questionTemplates) } : {}),
    visuals: Object.fromEntries([...visualIds].filter(id => source.visuals[id]).map(id => [id, cleanObject(source.visuals[id])])),
    labs: Object.fromEntries([...labIds].filter(id => source.labs[id]).map(id => [id, cleanObject(source.labs[id])])),
    schedule: source.schedule || null,
    counts: { modules: modules.length, lessons: Object.keys(lessons).length, questions: Object.values(questions).reduce((n, list) => n + list.length, 0), questionBank: source.questionBank ? source.questionBank.questions.length : 0, questionTemplates: source.questionTemplates ? (source.questionTemplates.templates || []).length : 0, artifacts: Object.keys(studyKits).length, slideSets: source.slideSets.length, slides: source.slideSets.reduce((total, set) => total + (set.slides || []).length, 0) }
  };
  const outline = { schemaVersion: "nus.course-outline.v1", courseId, entityKey: `course:${courseId}/outline`, course: courseManifest(packageCourse), timelineLessonIds: timeline.ids, collections, modules: modules.map((module, index) => ({ ...module, title: source.modules[index].title, lessons: source.modules[index].lessons.map(lesson => ({ id: lesson.id, entityKey: `lesson:${courseId}/${lesson.id}`, title: lesson.title, courseId, moduleId: module.id, ...(lesson.scope ? { scope: lesson.scope } : {}), ...(lesson.examEligible !== undefined ? { examEligible: lesson.examEligible } : {}), ...(lesson.contentStatus ? { contentStatus: lesson.contentStatus } : {}), week: lesson.week, sequence: timeline.metadata.get(lesson.id).sequence, orderInWeek: timeline.metadata.get(lesson.id).orderInWeek, collectionIds: collectionIdsByLesson.get(lesson.id) || [], minutes: lesson.minutes, summary: lesson.summary, objectiveCount: (lesson.objectives || []).length, questionCount: questions[lesson.id].length, questionIds: questions[lesson.id].map(question => question.id), hasVisualLab: !!source.labs[lesson.id], visualIds: lesson.visualIds || [], slideSetIds: source.slideSets.filter(slideSet => (slideSet.lessonIds || []).includes(lesson.id)).map(slideSet => slideSet.id), schemaVersion: "nus.lesson-outline.v1" })) })), labs: Object.values(source.labs).map(lab => ({ id: lab.id || lab.lessonId, courseCode: lab.courseCode, lessonId: lab.lessonId, title: lab.title, type: lab.type })) };
  return { source, package: joined, outline, lessons, questions, studyKits };
}

function compileCourse(root, courseId) {
  return compileCourseSource(loadCourseSource(root, courseId), courseId);
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
  const labAssets = {};
  const visualAssets = {};
  for (const id of Object.keys(compiled.lessons).sort()) {
    const lesson = compiled.lessons[id];
    const questionList = compiled.questions[id] || [];
    const studyKit = compiled.studyKits[id] || {};
    const visualIds = Array.isArray(lesson.visualIds) ? lesson.visualIds : [];
    const labs = compiled.source.labs[id] ? { [id]: cleanObject(compiled.source.labs[id]) } : {};
    const visuals = Object.fromEntries(visualIds.filter(visualId => compiled.source.visuals[visualId]).map(visualId => [visualId, cleanObject(compiled.source.visuals[visualId])]));
    const lessonAsset = `lessons/${id}.${hash(lesson)}.json`;
    const questionAsset = `questions/${id}.${hash(questionList)}.json`;
    const studyKitAsset = `study-kits/${id}.${hash(studyKit)}.json`;
    let labAsset;
    let visualAsset;
    if (Object.keys(labs).length) {
      labAsset = `labs/${id}.${hash(labs)}.json`;
      writeJson(path.join(courseRoot, labAsset), { schemaVersion: "nus.lab-payload.v1", labs });
      labAssets[id] = labAsset;
    }
    if (Object.keys(visuals).length) {
      visualAsset = `visuals/${id}.${hash(visuals)}.json`;
      writeJson(path.join(courseRoot, visualAsset), { schemaVersion: "nus.visual-payload.v1", visuals });
      visualAssets[id] = visualAsset;
    }
    writeJson(path.join(courseRoot, lessonAsset), { schemaVersion: "nus.lesson-payload.v1", lesson, questionsAsset: questionAsset, studyKitAsset, ...(labAsset ? { labAsset } : {}), ...(visualAsset ? { visualAsset } : {}) });
    writeJson(path.join(courseRoot, questionAsset), { schemaVersion: "nus.question-payload.v1", questions: questionList });
    writeJson(path.join(courseRoot, studyKitAsset), studyKit);
    lessonAssets[id] = lessonAsset;
    questionAssets[id] = questionAsset;
    studyKitAssets[id] = studyKitAsset;
  }
  const slideAssets = {};
  for (const slideSet of compiled.source.slideSets) {
    const asset = `slides/${slideSet.id}.${hash(slideSet)}.json`;
    writeJson(path.join(courseRoot, asset), { schemaVersion: "nus.slide-set-payload.v1", slideSet: cleanObject(slideSet) });
    slideAssets[slideSet.id] = asset;
  }
  let textbookAsset;
  if (compiled.source.textbook) {
    textbookAsset = `textbook.${hash(compiled.source.textbook)}.json`;
    writeJson(path.join(courseRoot, textbookAsset), { schemaVersion: "nus.textbook-payload.v1", textbook: cleanObject(compiled.source.textbook) });
  }
  let sourceManifestAsset;
  if (compiled.source.sourceManifest) {
    sourceManifestAsset = `source-manifest.${hash(compiled.source.sourceManifest)}.json`;
    writeJson(path.join(courseRoot, sourceManifestAsset), { schemaVersion: "nus.source-manifest-payload.v1", sourceManifest: cleanObject(compiled.source.sourceManifest) });
  }
  const courseAssetValue = {
    course: compiled.package.course,
    collections: compiled.package.collections || [],
    timelineLessonIds: compiled.package.course.timelineLessonIds || [],
    assessments: compiled.package.assessments,
    sources: compiled.package.sources,
    assessmentMap: compiled.package.assessmentMap,
    questionBank: compiled.package.questionBank,
    questionTemplates: compiled.package.questionTemplates,
    schedule: compiled.package.schedule,
    counts: compiled.package.counts,
    lessonAssets,
    questionAssets,
    studyKitAssets,
    labAssets,
    visualAssets,
    slideAssets,
    ...(textbookAsset ? { textbookAsset } : {}),
    ...(sourceManifestAsset ? { sourceManifestAsset } : {}),
    schemaVersion: "nus.course-payload.v1"
  };
  const courseAsset = `course.${hash(courseAssetValue)}.json`;
  writeJson(path.join(courseRoot, courseAsset), courseAssetValue);
  const outline = { ...compiled.outline, courseAsset, lessonAssets, questionAssets, studyKitAssets, labAssets, visualAssets, slideAssets, ...(textbookAsset ? { textbookAsset } : {}) };
  writeJson(path.join(courseRoot, "outline.json"), outline);
  return { code: courseId, courseId, course: compiled.outline.course, modules: compiled.outline.modules, collections: compiled.outline.collections || [], timelineLessonIds: compiled.outline.timelineLessonIds || [], labs: compiled.outline.labs, assessments: compiled.package.assessments, schedule: compiled.package.schedule, outline: `${courseId}/outline.json`, courseAsset: `${courseId}/${courseAsset}`, lessonAssets: Object.fromEntries(Object.entries(lessonAssets).map(([id, asset]) => [id, `${courseId}/${asset}`])), questionAssets: Object.fromEntries(Object.entries(questionAssets).map(([id, asset]) => [id, `${courseId}/${asset}`])), studyKitAssets: Object.fromEntries(Object.entries(studyKitAssets).map(([id, asset]) => [id, `${courseId}/${asset}`])), labAssets: Object.fromEntries(Object.entries(labAssets).map(([id, asset]) => [id, `${courseId}/${asset}`])), visualAssets: Object.fromEntries(Object.entries(visualAssets).map(([id, asset]) => [id, `${courseId}/${asset}`])), slideAssets: Object.fromEntries(Object.entries(slideAssets).map(([id, asset]) => [id, `${courseId}/${asset}`])), ...(textbookAsset ? { textbookAsset: `${courseId}/${textbookAsset}` } : {}), ...(sourceManifestAsset ? { sourceManifestAsset: `${courseId}/${sourceManifestAsset}` } : {}), hasTextbook: !!textbookAsset, counts: compiled.package.counts, version: hash({ outline, courseAssetValue }), schemaVersion: "nus.content-course-manifest.v1" };
}

function compileAll(root, outputRoot) {
  const coursesRoot = path.join(root, "content", "courses");
  const ids = fs.readdirSync(coursesRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });
  const courses = ids.map(courseId => {
    validateCanonical(root, courseId);
    return writeCourseArtifacts(outputRoot, compileCourse(root, courseId));
  });
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

module.exports = { compileAll, compileCourse, compileCourseSource, loadCourseSource, stableStringify, hash, validateCanonical, writeCourseArtifacts, normalizeLesson, normalizeAssessment, assessmentWeightTotal };
