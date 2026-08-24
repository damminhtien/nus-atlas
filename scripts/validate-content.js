/* Content contract and referential-integrity checks.
 *
 * The production validator reads canonical JSON packages. Legacy globals remain
 * available only for the one-way migration tool and compatibility tests.
 */
const fs = require("fs");
const path = require("path");
const { loadCourseSource, normalizeAssessment, assessmentWeightTotal } = require("../tools/content-compiler");

const ROOT = path.resolve(__dirname, "..");
const NUS_FILES = [
  "data/nus/provenance.js",
  "data/nus/courses.js",
  "data/nus/schedule.js",
  "data/nus/assessments.js",
  "data/nus/visuals.js",
  "data/nus/dsa5101.js",
  "data/nus/dsa5104.js",
  "data/nus/dsa5105.js",
  "data/nus/dsa5208.js",
  "data/nus/artifacts.js",
  "data/nus/formula-depth.js",
  "data/nus/visual-labs.js"
];

function loadLegacyState(root = ROOT) {
  const window = {};
  for (const relative of NUS_FILES) {
    const source = fs.readFileSync(path.join(root, relative), "utf8");
    new Function("window", source)(window);
  }
  return {
    courses: window.NUS_COURSES || [],
    content: window.NUS_CONTENT || {},
    assessments: window.NUS_ASSESSMENTS || [],
    artifacts: window.NUS_ARTIFACTS || {},
    labs: window.NUS_VISUAL_LABS || {},
    visuals: window.NUS_VISUALS || {},
    sourceTypes: window.NUS_SOURCE_TYPES || {}
  };
}

function loadCanonicalState(root = ROOT) {
  const coursesRoot = path.join(root, "content", "courses");
  const sourceTypes = JSON.parse(fs.readFileSync(path.join(root, "content", "source-types.json"), "utf8"));
  const state = { courses: [], content: {}, assessments: [], artifacts: {}, labs: {}, visuals: {}, sourceTypes };
  const courseIds = fs.readdirSync(coursesRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  for (const courseId of courseIds) {
    const source = loadCourseSource(root, courseId);
    const bankIds = new Set((source.questionBank && source.questionBank.questions || []).map(question => question.id));
    state.courses.push(source.course);
    // The question-bank validator owns extension questions. Keep the base
    // content contract focused on authored lesson questions so a bank item is
    // not reported as a false duplicate after compilation merges both layers.
    state.content[courseId] = {
      timelineLessonIds: Array.isArray(source.course.timelineLessonIds) ? source.course.timelineLessonIds.slice() : [],
      collections: (source.collections || []).map(collection => ({ ...collection, lessonIds: (collection.lessonIds || []).slice() })),
      modules: source.modules.map(module => ({
        ...module,
        lessons: (module.lessons || []).map(lesson => ({
          ...lesson,
          questions: (lesson.questions || []).filter(question => !bankIds.has(question.id))
        }))
      }))
    };
    state.assessments.push(...source.assessments.map(normalizeAssessment));
    Object.assign(state.labs, source.labs);
    Object.assign(state.visuals, source.visuals);
  }
  return state;
}

function validateContentState(state) {
  const errors = [];
  const courses = Array.isArray(state && state.courses) ? state.courses : [];
  const content = state && state.content && typeof state.content === "object" ? state.content : {};
  const assessments = Array.isArray(state && state.assessments) ? state.assessments : [];
  const labs = state && state.labs && typeof state.labs === "object" ? state.labs : {};
  const sourceTypes = state && state.sourceTypes && typeof state.sourceTypes === "object" ? state.sourceTypes : {};
  const courseIds = new Set();
  const lessonIds = new Set();
  const questionIds = new Set();

  if (!courses.length) errors.push("no courses loaded");
  for (const course of courses) {
    if (!course || !course.code) { errors.push("course is missing code"); continue; }
    if (courseIds.has(course.code)) errors.push(`duplicate course id: ${course.code}`);
    courseIds.add(course.code);
    if (!course.title) errors.push(`missing course title: ${course.code}`);
    const modules = content[course.code] && Array.isArray(content[course.code].modules) ? content[course.code].modules : [];
    const courseContent = content[course.code] || {};
    if (!modules.length) errors.push(`course has no modules: ${course.code}`);
    const moduleIds = modules.map(module => module && module.id).filter(Boolean);
    if (Array.isArray(course.moduleIds) && JSON.stringify(moduleIds) !== JSON.stringify(course.moduleIds)) errors.push(`module order does not match course.moduleIds: ${course.code}`);
    const declaredTimeline = Array.isArray(course.timelineLessonIds) ? course.timelineLessonIds : (Array.isArray(courseContent.timelineLessonIds) && courseContent.timelineLessonIds.length ? courseContent.timelineLessonIds : null);
    if (declaredTimeline) {
      const seenTimeline = new Set(declaredTimeline);
      const authoredIds = modules.flatMap(module => (module && module.lessons || []).map(lesson => lesson && lesson.id).filter(Boolean));
      const missingTimeline = authoredIds.filter(id => !seenTimeline.has(id));
      const unknownTimeline = declaredTimeline.filter(id => !authoredIds.includes(id));
      if (seenTimeline.size !== declaredTimeline.length || missingTimeline.length || unknownTimeline.length || declaredTimeline.length !== authoredIds.length) errors.push(`timeline does not cover each lesson exactly once: ${course.code}`);
      const weekById = new Map(modules.flatMap(module => (module.lessons || []).map(lesson => [lesson.id, Number(lesson.week) || 0])));
      const weeks = declaredTimeline.map(id => weekById.get(id)).filter(week => week !== undefined);
      if (weeks.some((week, index) => index > 0 && week < weeks[index - 1])) errors.push(`timeline weeks are not chronological: ${course.code}`);
    }
    const collections = Array.isArray(courseContent.collections) ? courseContent.collections : [];
    const knownLessonIds = new Set(modules.flatMap(module => (module.lessons || []).map(lesson => lesson && lesson.id).filter(Boolean)));
    const collectionIds = new Set();
    for (const collection of collections) {
      if (!collection || !collection.id) { errors.push(`collection missing id: ${course.code}`); continue; }
      if (collectionIds.has(collection.id)) errors.push(`duplicate collection id: ${collection.id}`);
      collectionIds.add(collection.id);
      for (const lessonId of collection.lessonIds || []) if (!knownLessonIds.has(lessonId)) errors.push(`collection references unknown lesson: ${course.code}/${collection.id}/${lessonId}`);
    }
    for (const module of modules) {
      if (!module || !module.id) { errors.push(`module missing id: ${course.code}`); continue; }
      for (const lesson of Array.isArray(module.lessons) ? module.lessons : []) {
        if (!lesson || !lesson.id) { errors.push(`lesson missing id: ${course.code}/${module.id}`); continue; }
        if (lessonIds.has(lesson.id)) errors.push(`duplicate lesson id: ${lesson.id}`);
        lessonIds.add(lesson.id);
        if (!lesson.title) errors.push(`missing lesson title: ${lesson.id}`);
        const refs = Array.isArray(lesson.sourceRefs) ? lesson.sourceRefs : [];
        if (!refs.length) errors.push(`lesson has no source refs: ${lesson.id}`);
        for (const ref of refs) checkSourceRef(ref, sourceTypes, errors, `lesson ${lesson.id}`);
        checkSourceLens(lesson.sourceLens, sourceTypes, errors, `lesson ${lesson.id}`);
        for (const block of [...(lesson.sections || []), ...(lesson.math || []), ...(lesson.examples || [])]) {
          for (const ref of block.sourceRefs || []) checkSourceRef(ref, sourceTypes, errors, `lesson block ${lesson.id}`);
          checkSourceLens(block.sourceLens, sourceTypes, errors, `lesson block ${lesson.id}`);
        }
        for (const question of Array.isArray(lesson.questions) ? lesson.questions : []) {
          if (!question || !question.id) { errors.push(`question missing id: ${lesson.id}`); continue; }
          if (questionIds.has(question.id)) errors.push(`duplicate question id: ${question.id}`);
          questionIds.add(question.id);
          for (const ref of question.sourceRefs || []) checkSourceRef(ref, sourceTypes, errors, `question ${question.id}`);
        }
        for (const visualId of lesson.visualIds || []) {
          if (!state.visuals || !state.visuals[visualId]) errors.push(`missing visual ref ${visualId} from lesson ${lesson.id}`);
        }
      }
    }
  }

  const assessmentIds = new Set();
  for (const assessment of assessments) {
    if (!assessment || !assessment.id) { errors.push("assessment missing id"); continue; }
    if (assessmentIds.has(assessment.id)) errors.push(`duplicate assessment id: ${assessment.id}`);
    assessmentIds.add(assessment.id);
    if (!courseIds.has(assessment.courseCode)) errors.push(`assessment references unknown course: ${assessment.id}`);
    if (!assessment.title || !assessment.kind) errors.push(`assessment missing title/kind: ${assessment.id}`);
    if (assessment.schemaVersion !== "nus.assessment.v2") errors.push(`assessment has invalid schema version: ${assessment.id}`);
    if (!assessment.officialFacts || !assessment.studentGuidance) errors.push(`assessment must separate official facts and guidance: ${assessment.id}`);
    if (!Array.isArray(assessment.checklist) || !assessment.checklist.length) errors.push(`assessment missing checklist: ${assessment.id}`);
    if (assessment.source) checkSourceRef(assessment.source, sourceTypes, errors, `assessment ${assessment.id}`);
    const facts = assessment.officialFacts || {};
    for (const [field, fact] of Object.entries(facts)) {
      if (!fact || typeof fact !== "object") continue;
      if (!Array.isArray(fact.sourceRefs) || !fact.sourceRefs.length) errors.push(`official assessment fact needs source refs: ${assessment.id}/${field}`);
      for (const ref of fact.sourceRefs || []) checkSourceRef(ref, sourceTypes, errors, `assessment ${assessment.id}/${field}`);
      for (const exclusion of fact.explicitExclusions || []) for (const ref of exclusion.sourceRefs || []) checkSourceRef(ref, sourceTypes, errors, `assessment ${assessment.id}/${field}/exclusion`);
    }
  }
  for (const course of courses) {
    const weightTotal = assessmentWeightTotal(assessments.filter(assessment => assessment.courseCode === course.code));
    if (weightTotal !== 100) errors.push(`${course.code} assessment weights sum to ${weightTotal}, expected 100`);
  }

  for (const [labId, lab] of Object.entries(labs)) {
    if (!lab || !lab.courseCode || !courseIds.has(lab.courseCode)) errors.push(`lab references unknown course: ${labId}`);
    if (!lab || !lab.lessonId) errors.push(`lab missing lessonId: ${labId}`);
    if (lab && lab.lessonId && !lessonIds.has(lab.lessonId)) errors.push(`lab references unknown lesson: ${labId}`);
    for (const ref of (lab && lab.sourceRefs) || []) checkSourceRef(ref, sourceTypes, errors, `lab ${labId}`);
    checkSourceLens(lab && lab.sourceLens, sourceTypes, errors, `lab ${labId}`);
    for (const exercise of (lab && lab.exercises) || []) checkSourceLens(exercise.sourceLens, sourceTypes, errors, `lab ${labId}/${exercise.id || "exercise"}`);
  }
  return { ok: errors.length === 0, errors, counts: { courses: courseIds.size, lessons: lessonIds.size, questions: questionIds.size, assessments: assessmentIds.size, labs: Object.keys(labs).length } };
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { return { __error: `${path.relative(ROOT, file)}: ${error.message}` }; }
}

function validatePackageDirectory(root = ROOT) {
  const errors = [];
  const coursesRoot = path.join(root, "content", "courses");
  if (!fs.existsSync(coursesRoot)) return { ok: true, errors, counts: { courses: 0, lessons: 0, questions: 0 } };
  const courseDirs = fs.readdirSync(coursesRoot, { withFileTypes: true }).filter(entry => entry.isDirectory());
  let lessonCount = 0, questionCount = 0;
  for (const entry of courseDirs) {
    const dir = path.join(coursesRoot, entry.name);
    const course = readJson(path.join(dir, "course.json"));
    if (course.__error) { errors.push(course.__error); continue; }
    if (course.code !== entry.name) errors.push(`package directory/code mismatch: ${entry.name}`);
    if (course.schemaVersion !== "nus.course.v1") errors.push(`invalid course schema version: ${entry.name}`);
    const moduleFiles = fs.existsSync(path.join(dir, "modules")) ? fs.readdirSync(path.join(dir, "modules")).filter(file => file.endsWith(".json")) : [];
    const lessonFiles = fs.existsSync(path.join(dir, "lessons")) ? fs.readdirSync(path.join(dir, "lessons")).filter(file => file.endsWith(".json")) : [];
    const lessonIds = new Set();
    for (const file of lessonFiles) {
      const lesson = readJson(path.join(dir, "lessons", file));
      if (lesson.__error) { errors.push(lesson.__error); continue; }
      lessonCount++;
      if (!lesson.id || lesson.id !== path.basename(file, ".json")) errors.push(`lesson filename/id mismatch: ${entry.name}/${file}`);
      if (lesson.courseId !== entry.name || lesson.schemaVersion !== "nus.lesson.v1") errors.push(`invalid lesson identity/schema: ${lesson.id || file}`);
      if (lessonIds.has(lesson.id)) errors.push(`duplicate package lesson id: ${lesson.id}`);
      lessonIds.add(lesson.id);
      const hasCanonicalBlocks = Array.isArray(lesson.blocks) && lesson.blocks.length;
      const hasStructuredContent = [lesson.sections, lesson.math, lesson.examples, lesson.criticalQuestions]
        .some(value => Array.isArray(value) && value.length);
      if (!hasCanonicalBlocks && !hasStructuredContent) errors.push(`package lesson has no source blocks: ${lesson.id}`);
      if (!Array.isArray(lesson.sourceRefs) || !lesson.sourceRefs.length) errors.push(`package lesson has no source refs: ${lesson.id}`);
      (lesson.sourceRefs || []).forEach(ref => checkSourceRef(ref, { lecture: {}, exercise: {}, textbook: {}, ref: {}, "assessment-derived": {} }, errors, `package lesson ${lesson.id}`));
      const questionFile = path.join(dir, "questions", file);
      const questions = fs.existsSync(questionFile) ? readJson(questionFile) : [];
      if (!Array.isArray(questions)) errors.push(`question package must be an array: ${lesson.id}`);
      const ids = (questions || []).map(question => question.id).filter(Boolean);
      questionCount += ids.length;
      if (JSON.stringify(ids) !== JSON.stringify(lesson.questionIds || [])) errors.push(`question IDs do not match lesson: ${lesson.id}`);
      const artifactFile = path.join(dir, "artifacts", file);
      if (!fs.existsSync(artifactFile)) errors.push(`missing artifact package: ${lesson.id}`);
    }
    if (course.moduleIds && course.moduleIds.length !== moduleFiles.length) errors.push(`module manifest mismatch: ${entry.name}`);
    if (course.assessmentIds && !fs.existsSync(path.join(dir, "assessments.json"))) errors.push(`missing assessment package: ${entry.name}`);
  }
  return { ok: errors.length === 0, errors, counts: { courses: courseDirs.length, lessons: lessonCount, questions: questionCount } };
}

function checkSourceRef(ref, sourceTypes, errors, owner) {
  if (!ref || !ref.sourceId || !Number.isInteger(ref.page) || ref.page < 1) errors.push(`${owner} has invalid source ref`);
  if (ref && ref.sourceType && !sourceTypes[ref.sourceType]) errors.push(`${owner} has unknown source type: ${ref.sourceType}`);
}

function checkSourceLens(lens, sourceTypes, errors, owner) {
  if (!lens) return;
  if (!lens.status || !lens.whyExaminable) errors.push(`${owner} source lens needs status and whyExaminable`);
  ["lecture", "officialExercise", "textbook", "reference"].forEach(group => {
    if (!Array.isArray(lens[group])) errors.push(`${owner} source lens group is not an array: ${group}`);
    (lens[group] || []).forEach(ref => checkSourceRef(ref, sourceTypes, errors, `${owner} source lens ${group}`));
  });
}

if (require.main === module) {
  const result = validateContentState(loadCanonicalState());
  const packages = validatePackageDirectory();
  if (!result.ok || !packages.ok) {
    console.error("CONTENT CONTRACT FAILED");
    result.errors.concat(packages.errors).forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`CONTENT CONTRACT GREEN · ${result.counts.courses} courses · ${result.counts.lessons} lessons · ${result.counts.questions} questions · ${result.counts.assessments} assessments · ${result.counts.labs} labs · ${packages.counts.courses} package(s)`);
  }
}

module.exports = { NUS_FILES, loadLegacyState, loadCanonicalState, validateContentState, validatePackageDirectory };
