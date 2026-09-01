/* Guard DSA5208 against repeated slide notes and placeholder quiz cues. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const COURSE_ROOT = path.join(ROOT, "content", "courses", "DSA5208");
const GENERIC_TEXT = [
  /What is the main claim or object on this slide\?/i,
  /Read the authored lecture note in the canonical lesson package\./i,
  /Check the assumption behind your answer\./i,
  /Explain the idea with a small diagram or example\./i,
  /Concept and worked notation\./i,
  /source-backed consistency-model page/i
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function promptKey(prompt) {
  return String(prompt || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function validateSlides(file, expectedCoreCount) {
  const set = readJson(file);
  const errors = [];
  const core = new Set(set.coreSlideNumbers || []);
  const prompts = new Set();
  const whatYouSee = new Set();
  for (const slide of set.slides || []) {
    const label = `${path.basename(file)}#${slide.slideNumber}`;
    if (!slide.title || !slide.title.trim()) errors.push(`${label}: missing title`);
    if (!["core", "support"].includes(slide.lecturePriority)) errors.push(`${label}: missing lecturePriority`);
    if ((slide.lecturePriority === "core") !== core.has(slide.slideNumber)) errors.push(`${label}: lecturePriority disagrees with coreSlideNumbers`);
    const explanation = slide.explanation || {};
    if (slide.title && !String(explanation.whatYouSee || "").includes(slide.title)) errors.push(`${label}: whatYouSee is not tied to the slide title`);
    if (whatYouSee.has(explanation.whatYouSee)) errors.push(`${label}: repeated whatYouSee annotation`);
    whatYouSee.add(explanation.whatYouSee);
    const questions = Array.isArray(slide.socraticQuestions) ? slide.socraticQuestions : [];
    if (questions.length !== 1) errors.push(`${label}: expected one focused Socratic question`);
    for (const question of questions) {
      const key = promptKey(question.prompt);
      if (!key || prompts.has(key)) errors.push(`${label}: duplicate or empty Socratic prompt`);
      prompts.add(key);
      if (GENERIC_TEXT.some(pattern => pattern.test(JSON.stringify(question)))) errors.push(`${label}: generic Socratic content`);
    }
    if (GENERIC_TEXT.some(pattern => pattern.test(JSON.stringify(explanation)))) errors.push(`${label}: generic explanation content`);
  }
  if (core.size !== expectedCoreCount) errors.push(`${path.basename(file)}: expected ${expectedCoreCount} core slides, found ${core.size}`);
  return { errors, counts: { slides: (set.slides || []).length, prompts: prompts.size, core: core.size } };
}

function readQuestions() {
  const directory = path.join(COURSE_ROOT, "questions");
  const questions = [];
  for (const file of fs.readdirSync(directory).filter(name => name.endsWith(".json")).sort()) {
    const data = readJson(path.join(directory, file));
    const entries = Array.isArray(data) ? data : data.questions || [];
    entries.forEach(question => questions.push({ ...question, file }));
  }
  return questions;
}

function validateQuestions() {
  const errors = [];
  const ids = new Set();
  const prompts = new Set();
  const questions = readQuestions();
  for (const question of questions) {
    const label = `${question.file}#${question.id || "<missing>"}`;
    if (!question.id || ids.has(question.id)) errors.push(`${label}: duplicate or missing id`);
    ids.add(question.id);
    const key = promptKey(question.prompt);
    if (!key || prompts.has(key)) errors.push(`${label}: duplicate or empty prompt`);
    prompts.add(key);
    if (!question.misconception || !question.visualHook) errors.push(`${label}: missing misconception or visualHook`);
    if (GENERIC_TEXT.some(pattern => pattern.test(JSON.stringify(question)))) errors.push(`${label}: generic quiz cue`);
  }
  return { errors, counts: { questions: questions.length, prompts: prompts.size } };
}

function validateLessonSources(courseRoot) {
  const errors = [];
  const directory = path.join(courseRoot, "lessons");
  for (const file of fs.readdirSync(directory).filter(name => name.endsWith(".json")).sort()) {
    const lesson = readJson(path.join(directory, file));
    if (Object.prototype.hasOwnProperty.call(lesson, "blocks")) errors.push(`${file}: redundant blocks copy; use structured content`);
  }
  return errors;
}

function validateDsa5208Quality(root = ROOT) {
  const courseRoot = path.join(root, "content", "courses", "DSA5208");
  const slideChecks = [
    ["dsa5208-lec2.json", 15],
    ["dsa5208-lec3.json", 17],
    ["dsa5208-lec4.json", 33]
  ].map(([file, coreCount]) => validateSlides(path.join(courseRoot, "slides", file), coreCount));
  const questionDirectory = path.join(courseRoot, "questions");
  const questionErrors = [];
  const ids = new Set();
  const prompts = new Set();
  let questionCount = 0;
  for (const file of fs.readdirSync(questionDirectory).filter(name => name.endsWith(".json")).sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(questionDirectory, file), "utf8"));
    for (const question of Array.isArray(data) ? data : data.questions || []) {
      questionCount += 1;
      const label = `${file}#${question.id || "<missing>"}`;
      if (!question.id || ids.has(question.id)) questionErrors.push(`${label}: duplicate or missing id`);
      ids.add(question.id);
      const key = promptKey(question.prompt);
      if (!key || prompts.has(key)) questionErrors.push(`${label}: duplicate or empty prompt`);
      prompts.add(key);
      if (!question.misconception || !question.visualHook) questionErrors.push(`${label}: missing misconception or visualHook`);
      if (GENERIC_TEXT.some(pattern => pattern.test(JSON.stringify(question)))) questionErrors.push(`${label}: generic quiz cue`);
    }
  }
  const errors = slideChecks.flatMap(result => result.errors).concat(questionErrors, validateLessonSources(courseRoot));
  return {
    ok: errors.length === 0,
    errors,
    counts: {
      slides: slideChecks.reduce((sum, result) => sum + result.counts.slides, 0),
      slidePrompts: slideChecks.reduce((sum, result) => sum + result.counts.prompts, 0),
      questions: questionCount,
      questionPrompts: prompts.size
    }
  };
}

if (require.main === module) {
  const result = validateDsa5208Quality();
  if (!result.ok) {
    console.error("DSA5208 QUALITY FAILED");
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`DSA5208 QUALITY GREEN · ${result.counts.slides} slides · ${result.counts.questions} questions`);
  }
}

module.exports = { validateDsa5208Quality, validateSlides, validateQuestions, validateLessonSources, promptKey };
