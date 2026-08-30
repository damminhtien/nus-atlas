const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const COURSE_ROOT = path.join(ROOT, "content", "courses", "DSA5104");
const PROJECT_SOURCE = "DSA5104/Project 1/proj1_questions.sql";
const PROJECT_DEADLINE = "2026-09-06T09:00:00+08:00";

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }

function check() {
  const assessments = readJson(path.join(COURSE_ROOT, "assessments.json"));
  const manifest = readJson(path.join(COURSE_ROOT, "sources", "manifest.json"));
  const assessment = assessments.find(item => item && item.id === "dsa5104-project-1");
  const errors = [];
  const brief = assessment && assessment.projectBrief;
  const questions = brief && Array.isArray(brief.questions) ? brief.questions : [];

  if (!assessment) errors.push("dsa5104-project-1 assessment is missing");
  if (!brief || brief.schemaVersion !== "nus.dsa5104-project.v1") errors.push("Project 1 brief has an invalid schema version");
  if (!assessment || !assessment.studentPlan || assessment.studentPlan.deadline !== PROJECT_DEADLINE) errors.push(`Project 1 study deadline must be ${PROJECT_DEADLINE}`);
  if (!assessment || !assessment.studentPlan || assessment.studentPlan.origin !== "user-set") errors.push("Project 1 study deadline must remain labelled user-set");
  if (!brief || !brief.sourceRefs || !brief.sourceRefs.some(ref => ref.sourceId === PROJECT_SOURCE)) errors.push("Project 1 brief is missing its canonical source reference");
  if (!manifest.sources.some(source => source.sourceId === PROJECT_SOURCE)) errors.push("Project 1 brief is missing from the source manifest");

  const numbers = questions.map(question => question.number);
  if (questions.length !== 14 || numbers.some((number, index) => number !== index + 1)) errors.push("Project 1 must contain exactly Q1 through Q14");
  const marks = questions.reduce((total, question) => total + (Number(question.marks) || 0), 0);
  if (marks !== 30) errors.push(`Project 1 marks sum to ${marks}, expected 30`);
  const tableNames = new Set((brief && brief.database && brief.database.tables || []).map(table => table.name));
  for (const table of ["car_sales", "us_states", "vin_info"]) if (!tableNames.has(table)) errors.push(`Project 1 schema is missing ${table}`);
  if (!brief || !Array.isArray(brief.requirements) || !brief.requirements.some(item => /exactly 14/i.test(item))) errors.push("Project 1 requirements must state the 14-statement constraint");
  questions.forEach(question => {
    if (!question.id || !question.title || !question.prompt) errors.push(`Project 1 Q${question.number || "?"} is incomplete`);
    if (!Array.isArray(question.expectedColumns) || !question.expectedColumns.length) errors.push(`Project 1 Q${question.number || "?"} is missing expected columns`);
    if (!Array.isArray(question.topics) || !question.topics.length) errors.push(`Project 1 Q${question.number || "?"} is missing topic mapping`);
  });

  return { ok: errors.length === 0, errors, questionCount: questions.length, marks };
}

if (require.main === module) {
  const result = check();
  if (!result.ok) {
    console.error("DSA5104 PROJECT 1 VALIDATION FAILED");
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else console.log(`DSA5104 PROJECT 1 GREEN · ${result.questionCount} questions · ${result.marks} marks · deadline 2026-09-06 09:00 +08:00`);
}

module.exports = { check };
