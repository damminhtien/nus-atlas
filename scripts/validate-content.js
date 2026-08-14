/* Content contract and referential-integrity checks.
 *
 * The validator accepts the current legacy globals as input so migration can be
 * incremental. New JSON packages can call validateContentState directly with the
 * same normalized shape and receive the same checks.
 */
const fs = require("fs");
const path = require("path");

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
    labs: window.NUS_VISUAL_LABS || {},
    visuals: window.NUS_VISUALS || {},
    sourceTypes: window.NUS_SOURCE_TYPES || {}
  };
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
    if (!modules.length) errors.push(`course has no modules: ${course.code}`);
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
    if (!Array.isArray(assessment.checklist) || !assessment.checklist.length) errors.push(`assessment missing checklist: ${assessment.id}`);
    if (assessment.source) checkSourceRef(assessment.source, sourceTypes, errors, `assessment ${assessment.id}`);
  }

  for (const [labId, lab] of Object.entries(labs)) {
    if (!lab || !lab.courseCode || !courseIds.has(lab.courseCode)) errors.push(`lab references unknown course: ${labId}`);
    if (!lab || !lab.lessonId) errors.push(`lab missing lessonId: ${labId}`);
    if (lab && lab.lessonId && !lessonIds.has(lab.lessonId)) errors.push(`lab references unknown lesson: ${labId}`);
    for (const ref of (lab && lab.sourceRefs) || []) checkSourceRef(ref, sourceTypes, errors, `lab ${labId}`);
  }
  return { ok: errors.length === 0, errors, counts: { courses: courseIds.size, lessons: lessonIds.size, questions: questionIds.size, assessments: assessmentIds.size, labs: Object.keys(labs).length } };
}

function checkSourceRef(ref, sourceTypes, errors, owner) {
  if (!ref || !ref.sourceId || !Number.isInteger(ref.page) || ref.page < 1) errors.push(`${owner} has invalid source ref`);
  if (ref && ref.sourceType && !sourceTypes[ref.sourceType]) errors.push(`${owner} has unknown source type: ${ref.sourceType}`);
}

if (require.main === module) {
  const result = validateContentState(loadLegacyState());
  if (!result.ok) {
    console.error("CONTENT CONTRACT FAILED");
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`CONTENT CONTRACT GREEN · ${result.counts.courses} courses · ${result.counts.lessons} lessons · ${result.counts.questions} questions · ${result.counts.assessments} assessments · ${result.counts.labs} labs`);
  }
}

module.exports = { NUS_FILES, loadLegacyState, validateContentState };
