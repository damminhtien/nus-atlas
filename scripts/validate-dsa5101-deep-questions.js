#!/usr/bin/env node

/** Keep the DSA5101 deep-dive extension bank complete and exam-ready. */
const fs = require("node:fs");
const path = require("node:path");

const BANK_PATH = path.resolve(__dirname, "..", "content", "courses", "DSA5101", "questions", "bank.json");
const PREFIX = "dsa5101-deep-";
const LESSONS = new Set([
  "dsa5101-frequent-itemsets",
  "dsa5101-minhash-lsh",
  "dsa5101-clustering",
  "dsa5101-recommenders",
  "dsa5101-pagerank",
  "dsa5101-streams",
  "dsa5101-balance"
]);

function validateDsa5101DeepQuestions() {
  const bank = JSON.parse(fs.readFileSync(BANK_PATH, "utf8"));
  const questions = (bank.questions || []).filter(question => question.id && question.id.startsWith(PREFIX));
  const errors = [];
  const ids = new Set();

  if (questions.length !== 30) errors.push("expected 30 deep-dive questions, got " + questions.length);
  for (const question of questions) {
    if (ids.has(question.id)) errors.push("duplicate deep-dive question id: " + question.id);
    ids.add(question.id);
    if (!LESSONS.has(question.lessonId)) errors.push(question.id + ": unknown exam-prone lesson");
    if (question.type !== "mcq") errors.push(question.id + ": deep-dive question must be MCQ");
    if (question.difficulty !== "hard") errors.push(question.id + ": deep-dive question must be hard");
    if (!Array.isArray(question.choices) || question.choices.length !== 6) errors.push(question.id + ": must have exactly six choices");
    if (Array.isArray(question.choices) && new Set(question.choices).size !== question.choices.length) errors.push(question.id + ": choices must be distinct");
    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= (question.choices || []).length) errors.push(question.id + ": invalid answer index");
    if (!question.prompt || !question.explanation) errors.push(question.id + ": needs prompt and explanation");
    if (!Array.isArray(question.sourceRefs) || !question.sourceRefs.length) errors.push(question.id + ": needs source refs");
  }

  for (let index = 1; index <= 30; index += 1) {
    const id = PREFIX + String(index).padStart(3, "0");
    if (!ids.has(id)) errors.push("missing deep-dive question id: " + id);
  }

  return {
    ok: errors.length === 0,
    errors,
    counts: {
      total: questions.length,
      mcq: questions.filter(question => question.type === "mcq").length,
      sixChoice: questions.filter(question => Array.isArray(question.choices) && question.choices.length === 6).length,
      lessons: new Set(questions.map(question => question.lessonId)).size
    }
  };
}

if (require.main === module) {
  const result = validateDsa5101DeepQuestions();
  if (!result.ok) {
    console.error("DSA5101 DEEP QUESTIONS CONTRACT FAILED · " + result.errors.length + " issue(s)");
    result.errors.forEach(error => console.error("- " + error));
    process.exitCode = 1;
  } else {
    console.log("DSA5101 DEEP QUESTIONS GREEN · " + result.counts.total + " hard MCQs · " + result.counts.sixChoice + " with six choices · " + result.counts.lessons + " lessons");
  }
}

module.exports = { validateDsa5101DeepQuestions };
