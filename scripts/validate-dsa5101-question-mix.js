#!/usr/bin/env node

/** Keep DSA5101 near the requested 80% MCQ study mix. */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "content", "courses", "DSA5101", "questions");
const CONVERTED_IDS = new Set([
  "dsa5101-bank-001",
  "dsa5101-bank-007",
  "dsa5101-bank-008",
  "dsa5101-bank-011",
  "dsa5101-balance-q2",
  "dsa5101-balance-q3",
  "dsa5101-balance-q4",
  "dsa5101-cluster-q2",
  "dsa5101-cluster-q4",
  "dsa5101-cluster-q5",
  "dsa5101-cluster-q6",
  "dsa5101-mh-q2",
  "dsa5101-o-q2",
  "dsa5101-pagerank-q2",
  "dsa5101-pagerank-q3",
  "dsa5101-pagerank-q4",
  "dsa5101-recommender-q2",
  "dsa5101-recommender-q3",
  "dsa5101-recommender-q4",
  "dsa5101-rs-q2",
  "dsa5101-stream-q2",
  "dsa5101-stream-q3",
  "dsa5101-stream-q4"
]);

function readQuestions() {
  const byId = new Map();
  for (const file of fs.readdirSync(ROOT)
    .filter(name => name.endsWith(".json") && !["bank.json", "exam-bank.json"].includes(name))
    .sort()) {
    const document = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
    const questions = Array.isArray(document) ? document : (document.questions || []);
    for (const question of questions) {
      if (!byId.has(question.id)) byId.set(question.id, { ...question, files: [file] });
      else byId.get(question.id).files.push(file);
    }
  }
  return [...byId.values()];
}

function validateDsa5101QuestionMix() {
  const questions = readQuestions();
  const errors = [];
  const mcqs = questions.filter(question => question.type === "mcq");
  const short = questions.filter(question => question.type === "short");

  if (questions.length !== 44) errors.push("expected 44 unique DSA5101 questions, got " + questions.length);
  if (mcqs.length !== 35) errors.push("expected 35 MCQs for the 80% study mix, got " + mcqs.length);
  if (mcqs.length / questions.length < 0.79) errors.push("MCQ ratio fell below 79%: " + mcqs.length + "/" + questions.length);
  if (short.length) errors.push("short questions remain: " + short.map(question => question.id).join(", "));

  for (const question of questions) {
    if (CONVERTED_IDS.has(question.id)) {
      if (question.type !== "mcq") errors.push(question.id + ": converted question is not MCQ");
      if (!Array.isArray(question.choices) || question.choices.length !== 6) errors.push(question.id + ": converted MCQ must have exactly six choices");
      if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= (question.choices || []).length) errors.push(question.id + ": converted MCQ has invalid answer index");
    }
  }

  const missing = [...CONVERTED_IDS].filter(id => !questions.some(question => question.id === id));
  if (missing.length) errors.push("converted question IDs missing: " + missing.join(", "));

  return {
    ok: errors.length === 0,
    errors,
    counts: {
      total: questions.length,
      mcq: mcqs.length,
      sixChoiceConverted: questions.filter(question => CONVERTED_IDS.has(question.id) && question.type === "mcq" && question.choices.length === 6).length
    }
  };
}

if (require.main === module) {
  const result = validateDsa5101QuestionMix();
  if (!result.ok) {
    console.error("DSA5101 QUESTION MIX CONTRACT FAILED · " + result.errors.length + " issue(s)");
    result.errors.forEach(error => console.error("- " + error));
    process.exitCode = 1;
  } else {
    console.log("DSA5101 QUESTION MIX GREEN · " + result.counts.mcq + "/" + result.counts.total + " MCQ · " + result.counts.sixChoiceConverted + " converted with six choices");
  }
}

module.exports = { validateDsa5101QuestionMix };
