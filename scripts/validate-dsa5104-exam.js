const fs = require("fs");
const path = require("path");
const { loadCanonicalState } = require("./validate-content");

const ROOT = path.resolve(__dirname, "..");
const COURSE = "DSA5104";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function validateExamLayer(root = ROOT) {
  const errors = [];
  const courseRoot = path.join(root, "content", "courses", COURSE);
  const examBank = readJson(path.join(courseRoot, "questions", "exam-bank.json"));
  const assessmentMap = readJson(path.join(courseRoot, "assessment-map.json"));
  const state = loadCanonicalState(root);
  const lessons = new Map((state.content[COURSE] && state.content[COURSE].modules || [])
    .flatMap(module => (module.lessons || []).map(lesson => [lesson.id, lesson])));

  if (examBank.schemaVersion !== "nus.question-bank.v1") errors.push("synthetic exam bank has invalid schemaVersion");
  if (examBank.courseId !== COURSE) errors.push("synthetic exam bank has the wrong courseId");
  if (examBank.assessmentLayer !== "synthetic-final") errors.push("synthetic exam bank must use assessmentLayer synthetic-final");
  if (examBank.origin !== "synthetic") errors.push("synthetic exam bank must use origin synthetic");
  if (examBank.status === "past-year" || examBank.status === "official") errors.push("synthetic exam bank is mislabeled as official or past-year");

  const questions = Array.isArray(examBank.questions) ? examBank.questions : [];
  const ids = new Set();
  for (const question of questions) {
    const owner = `synthetic question ${question && question.id || "<missing>"}`;
    if (!question || !question.id) { errors.push(`${owner} is missing an id`); continue; }
    if (ids.has(question.id)) errors.push(`duplicate ${owner}`);
    ids.add(question.id);
    if (!question.id.startsWith("dsa5104-synthetic-final-")) errors.push(`${owner} has an unexpected id prefix`);
    if (question.origin && question.origin !== "synthetic") errors.push(`${owner} is not labeled synthetic`);
    if (question.assessmentLayer && question.assessmentLayer !== "synthetic-final") errors.push(`${owner} has an unexpected assessment layer`);
    if (!question.topic || !question.commonTrap || !Array.isArray(question.mistakeTags) || !question.mistakeTags.length) errors.push(`${owner} needs topic, commonTrap, and mistakeTags metadata`);
    if (!Number.isInteger(question.timedSeconds) || question.timedSeconds < 15) errors.push(`${owner} has invalid timedSeconds`);
    const lesson = lessons.get(question.lessonId);
    if (!lesson) errors.push(`${owner} references unknown lesson ${question.lessonId}`);
    if (lesson && lesson.examEligible === false) errors.push(`${owner} references a lesson excluded from default Exam Mode`);
    if (JSON.stringify(question).toLowerCase().includes("past-year")) errors.push(`${owner} must not claim past-year provenance`);
  }

  const plan = assessmentMap.practicePlan;
  if (!plan || plan.origin !== "synthetic") errors.push("DSA5104 assessment map is missing a synthetic practice plan");
  if (plan) {
    const planIds = plan.questionIds || [];
    if (planIds.length !== questions.length || planIds.some(id => !ids.has(id))) errors.push("synthetic practice plan is not aligned with the synthetic exam bank");
    if (plan.questionCount !== planIds.length) errors.push("synthetic practice plan questionCount is inconsistent");
  }
  return { ok: errors.length === 0, errors, count: questions.length };
}

if (require.main === module) {
  const result = validateExamLayer();
  if (!result.ok) {
    console.error("DSA5104 EXAM LAYER FAILED");
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`DSA5104 EXAM LAYER GREEN · ${result.count} synthetic questions · not past-year`);
  }
}

module.exports = { validateExamLayer };
