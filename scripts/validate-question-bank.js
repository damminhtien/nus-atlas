const fs = require("fs");
const path = require("path");
const { loadCanonicalState } = require("./validate-content");

const ROOT = path.resolve(__dirname, "..");
const TYPES = new Set(["mcq", "short", "derivation", "calculation"]);
const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const SOURCE_TYPES = new Set(["lecture", "exercise", "textbook", "ref", "assessment-derived"]);

function readQuestionBank(courseId = "DSA5105", root = ROOT) {
  const file = path.join(root, "content", "courses", courseId, "questions", "bank.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function validateQuestionBank(bank, state = loadCanonicalState(ROOT)) {
  const errors = [];
  if (!bank || bank.schemaVersion !== "nus.question-bank.v1") errors.push("invalid question bank schemaVersion");
  const courseId = bank && bank.courseId;
  const lessons = new Set((state.content[courseId] && state.content[courseId].modules || []).flatMap(module => (module.lessons || []).map(lesson => lesson.id)));
  const existingIds = new Set((state.content[courseId] && state.content[courseId].modules || []).flatMap(module => (module.lessons || []).flatMap(lesson => (lesson.questions || []).map(question => question.id))));
  const ids = new Set();
  const questions = Array.isArray(bank && bank.questions) ? bank.questions : [];
  if (!questions.length) errors.push("question bank is empty");
  for (const question of questions) {
    const owner = `question ${question && question.id || "<missing>"}`;
    if (!question || !question.id) { errors.push("question is missing id"); continue; }
    if (ids.has(question.id)) errors.push(`duplicate bank question id: ${question.id}`);
    if (existingIds.has(question.id)) errors.push(`bank question duplicates existing id: ${question.id}`);
    ids.add(question.id);
    if (!lessons.has(question.lessonId)) errors.push(`${owner} references unknown lesson: ${question.lessonId}`);
    if (!TYPES.has(question.type)) errors.push(`${owner} has invalid type`);
    if (!DIFFICULTIES.has(question.difficulty)) errors.push(`${owner} has invalid difficulty`);
    if (!question.skill || !question.cognitiveLevel) errors.push(`${owner} is missing skill metadata`);
    if (!Number.isInteger(question.estimatedSeconds) || question.estimatedSeconds < 15) errors.push(`${owner} has invalid estimatedSeconds`);
    if (!question.prompt || !question.explanation) errors.push(`${owner} needs prompt and explanation`);
    if (question.type === "mcq" && (!Array.isArray(question.choices) || !Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.choices.length)) errors.push(`${owner} has invalid MCQ answer`);
    if (question.type !== "mcq" && (!Array.isArray(question.accepted) || !question.accepted.length) && !question.solution) errors.push(`${owner} needs accepted answers or solution`);
    if (!Array.isArray(question.sourceRefs) || !question.sourceRefs.length) errors.push(`${owner} has no source refs`);
    for (const ref of question.sourceRefs || []) {
      if (!ref.sourceId || !Number.isInteger(ref.page) || ref.page < 1 || !SOURCE_TYPES.has(ref.sourceType)) errors.push(`${owner} has invalid source ref`);
      if (JSON.stringify(ref).match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/)) errors.push(`${owner} source ref contains a control character`);
    }
  }
  return { ok: errors.length === 0, errors, counts: { questions: questions.length, lessons: new Set(questions.map(question => question.lessonId)).size } };
}

if (require.main === module) {
  const files = fs.readdirSync(path.join(ROOT, "content", "courses"), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .map(courseId => ({ courseId, file: path.join(ROOT, "content", "courses", courseId, "questions", "bank.json") }))
    .filter(item => fs.existsSync(item.file));
  const results = files.map(({ courseId }) => ({ courseId, result: validateQuestionBank(readQuestionBank(courseId)) }));
  const failed = results.filter(item => !item.result.ok);
  if (failed.length) {
    console.error("QUESTION BANK CONTRACT FAILED");
    failed.forEach(({ courseId, result }) => result.errors.forEach(error => console.error(`- ${courseId}: ${error}`)));
    process.exitCode = 1;
  } else {
    const questions = results.reduce((sum, item) => sum + item.result.counts.questions, 0);
    console.log(`QUESTION BANK GREEN · ${results.length} course banks · ${questions} questions`);
  }
}

module.exports = { readQuestionBank, validateQuestionBank };
