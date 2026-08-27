const fs = require("node:fs");
const path = require("node:path");
const { loadCanonicalState } = require("./validate-content");
const { INCOMPLETE_SOURCE_IDS } = require("./ingest-dsa5104-homework");

const ROOT = path.resolve(__dirname, "..");
const COURSE_ID = "DSA5104";
const QUESTION_DIR = path.join(ROOT, "content", "courses", COURSE_ID, "questions");
const HOMEWORK_ID = /^dsa5104-homework-ch\d+-/;
const SOURCE_TYPES = new Set(["lecture", "exercise", "textbook", "ref", "assessment-derived"]);

function readDsa5104Questions(root = ROOT) {
  const questionDir = path.join(root, "content", "courses", COURSE_ID, "questions");
  const files = fs.readdirSync(questionDir)
    .filter(file => file.endsWith(".json"))
    .sort();
  const questions = [];
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(questionDir, file), "utf8"));
    const entries = Array.isArray(data) ? data : data.questions || [];
    entries.forEach(question => questions.push({ ...question, __file: file }));
  }
  const unique = [...new Map(questions.map(question => [question.id, question])).values()];
  return { all: questions, unique, files };
}

function questionText(question) {
  return [question.prompt, question.solution, question.explanation, question.misconception]
    .filter(value => typeof value === "string")
    .join("\n");
}

function validateDsa5104QuestionQuality(root = ROOT) {
  const { unique } = readDsa5104Questions(root);
  const state = loadCanonicalState(root);
  const lessons = new Set((state.content[COURSE_ID]?.modules || [])
    .flatMap(module => (module.lessons || []).map(lesson => lesson.id)));
  const errors = [];
  const homework = unique.filter(question => HOMEWORK_ID.test(question.id));
  const homeworkMcq = homework.filter(question => question.type === "mcq");
  const homeworkOpen = homework.filter(question => question.type !== "mcq");
  const reviewItems = homework.filter(question => question.reviewStatus === "source-solution-incomplete");

  const add = (question, message) => errors.push(`${question.id} (${question.__file}): ${message}`);
  const knownTypo = /\b(?:Mertis|moren|appearn|stuent|commerical|managmenent|imples|decompsition|Descrie|deltions|constriant|constriants|instuctors|stoared|inital|definiton|cardinalties|partion_id|tiems|conccurent|dependecy|folowing|follwing|initalize|maxium|unintersting)\b/i;
  const sourceArtifact = /above picture|created using\s+(?:Figma|Arctype)|Bonus:\s*To check|can be rewritten as:\s*or/i;
  const formulaArtifact = /\b(?:quad|twoheadrightarrow|betagamma|gammabeta|alphagamma|subseteq|fdcount)\b/i;

  for (const question of unique) {
    const text = questionText(question);
    if (!question.id) add(question, "missing id");
    if (!question.prompt || !question.prompt.trim()) add(question, "empty prompt");
    if (!lessons.has(question.lessonId)) add(question, `unknown lesson ${question.lessonId}`);
    if (!Array.isArray(question.sourceRefs) || !question.sourceRefs.length) add(question, "missing sourceRefs");
    for (const ref of question.sourceRefs || []) {
      if (!ref.sourceId || !Number.isInteger(ref.page) || ref.page < 1 || !SOURCE_TYPES.has(ref.sourceType)) {
        add(question, "invalid source reference");
      }
    }
    if (/…|\.\.\./.test(text)) add(question, "raw ellipsis or placeholder remains");
    if (/[\uFB00-\uFB04]/.test(text)) add(question, "Unicode ligature remains");
    if (knownTypo.test(text)) add(question, "known source typo remains");
    if (sourceArtifact.test(text)) add(question, "source-production note is visible to learners");
    if (/\b_[A-Za-z][A-Za-z0-9_]*_/.test(question.prompt || "")) add(question, "identifier is still wrapped in Markdown emphasis");

    if (question.type === "mcq") {
      if (!Array.isArray(question.choices) || question.choices.length < 2) add(question, "MCQ has fewer than two choices");
      if (new Set(question.choices || []).size !== (question.choices || []).length) add(question, "duplicate MCQ choices");
      if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= (question.choices || []).length) add(question, "invalid MCQ answer index");
      if ((question.choices || []).some(choice => formulaArtifact.test(choice))) add(question, "formula extraction artifact appears in an MCQ choice");
      if ((question.choices || []).some(choice => /\\/.test(choice))) add(question, "raw LaTeX command appears in an MCQ choice");
    }

    if (HOMEWORK_ID.test(question.id)) {
      if (!question.reviewStatus) add(question, "homework question is missing reviewStatus");
      if (INCOMPLETE_SOURCE_IDS.has(question.id)) {
        if (question.type === "mcq" || question.assessmentMode !== "open-response") add(question, "incomplete source answer must remain open response");
        if (question.reviewStatus !== "source-solution-incomplete") add(question, "incomplete source answer is not marked for review");
        if (!/Source note:/.test(question.solution || "")) add(question, "incomplete source answer lacks a source note");
        if (/\bTODO\b/i.test(question.solution || "")) add(question, "TODO remains in incomplete source answer");
      } else if (question.reviewStatus !== "ready") {
        add(question, "ready homework question has unexpected reviewStatus");
      }
    }
  }

  for (const question of homeworkMcq) {
    if (question.assessmentMode !== "mcq-summary") add(question, "homework MCQ has wrong assessmentMode");
    if (question.choices.length !== 4) add(question, "homework MCQ must have four choices");
    if (question.choices.some(choice => choice.length < 30 || choice.length > 220)) add(question, "homework MCQ choice is outside the 30-220 character readability range");
    if (question.choices.some(choice => /Uses SELECT with the required|Applies the requested operation|not reasonable to expect/i.test(choice))) add(question, "generic or meta answer appears as an MCQ choice");
    if (question.prompt.startsWith("Choose the option that best summarizes")) add(question, "obsolete MCQ wrapper remains");
  }

  if (unique.length !== 314) errors.push(`expected 314 unique questions, found ${unique.length}`);
  if (homework.length !== 190) errors.push(`expected 190 homework questions, found ${homework.length}`);
  if (homeworkMcq.length !== 152 || homeworkOpen.length !== 38) errors.push(`expected 152 homework MCQs and 38 open responses, found ${homeworkMcq.length}/${homeworkOpen.length}`);
  if (reviewItems.length !== INCOMPLETE_SOURCE_IDS.size) errors.push(`expected ${INCOMPLETE_SOURCE_IDS.size} source-review items, found ${reviewItems.length}`);

  return {
    ok: errors.length === 0,
    errors,
    counts: {
      unique: unique.length,
      homework: homework.length,
      homeworkMcq: homeworkMcq.length,
      homeworkOpen: homeworkOpen.length,
      sourceReview: reviewItems.length
    }
  };
}

if (require.main === module) {
  const result = validateDsa5104QuestionQuality();
  if (!result.ok) {
    console.error("DSA5104 QUESTION QUALITY FAILED");
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`DSA5104 QUESTION QUALITY GREEN · ${result.counts.unique} unique questions · ${result.counts.homework} homework · ${result.counts.sourceReview} source-review items`);
  }
}

module.exports = { readDsa5104Questions, validateDsa5104QuestionQuality };
