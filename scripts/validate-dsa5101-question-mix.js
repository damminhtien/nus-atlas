#!/usr/bin/env node

/** Validate the effective DSA5101 question set and its study-card routing. */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "content", "courses", "DSA5101", "questions");
const BANK_PATH = path.join(ROOT, "bank.json");
const TEMPLATES_PATH = path.join(ROOT, "templates.json");

function readQuestions(documentPath) {
  const document = JSON.parse(fs.readFileSync(documentPath, "utf8"));
  return Array.isArray(document) ? document : (document.questions || []);
}

function readQuestionSources() {
  const bankQuestions = readQuestions(BANK_PATH);
  const lessonFiles = fs.readdirSync(ROOT)
    .filter(name => /^dsa5101-.*\.json$/.test(name))
    .sort();
  const bankIds = new Set(bankQuestions.map(question => question.id));
  const questionsById = new Map(bankQuestions.map(question => [question.id, { ...question, files: ["bank.json"] }]));
  const errors = [];

  for (const file of lessonFiles) {
    for (const question of readQuestions(path.join(ROOT, file))) {
      if (bankIds.has(question.id)) {
        errors.push("bank question appears in lesson question file: " + file + "/" + question.id);
      }
      if (questionsById.has(question.id)) {
        errors.push("duplicate lesson question ID: " + question.id);
        questionsById.get(question.id).files.push(file);
      } else {
        questionsById.set(question.id, { ...question, files: [file] });
      }
    }
  }

  return {
    bankQuestions,
    questions: [...questionsById.values()],
    errors
  };
}

function validateDsa5101QuestionMix() {
  const { bankQuestions, questions, errors } = readQuestionSources();
  const catalog = JSON.parse(fs.readFileSync(TEMPLATES_PATH, "utf8"));
  const templates = new Map((catalog.templates || []).map(template => [template.id, template]));
  const cards = new Map((catalog.cards || []).map(card => [card.id, card]));
  const mcqs = questions.filter(question => question.type === "mcq");
  const calculations = questions.filter(question => question.type === "calculation");
  const derivations = questions.filter(question => question.type === "derivation");
  const bankT3 = bankQuestions.filter(question => templates.get(question.templateId)?.archetype === "T3-tune");

  if (bankQuestions.length !== 60) errors.push("expected 60 bank questions, got " + bankQuestions.length);
  if (questions.length !== 92) errors.push("expected 92 unique effective questions, got " + questions.length);
  if (bankT3.length < 12) errors.push("expected at least 12 bank T3 questions, got " + bankT3.length);
  if (mcqs.length / questions.length < 0.8) errors.push("MCQ ratio fell below 80%: " + mcqs.length + "/" + questions.length);
  if (calculations.length < 8) errors.push("expected at least 8 calculation questions, got " + calculations.length);
  if (questions.some(question => question.type === "short")) {
    errors.push("short questions remain: " + questions.filter(question => question.type === "short").map(question => question.id).join(", "));
  }

  for (const question of questions) {
    const template = templates.get(question.templateId);
    const card = cards.get(question.cardId);
    if (!question.templateId) errors.push(question.id + ": missing templateId");
    if (!question.cardId) errors.push(question.id + ": missing cardId");
    if (question.templateId && !template) errors.push(question.id + ": unknown templateId " + question.templateId);
    if (question.cardId && !card) errors.push(question.id + ": unknown cardId " + question.cardId);
    if (template && template.cardId !== question.cardId) {
      errors.push(question.id + ": cardId does not match template.cardId");
    }
    if (question.type === "mcq") {
      if (!Array.isArray(question.choices) || question.choices.length !== 6) {
        errors.push(question.id + ": MCQ must have exactly six choices");
      } else {
        if (new Set(question.choices).size !== question.choices.length) {
          errors.push(question.id + ": MCQ choices must be distinct");
        }
        if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.choices.length) {
          errors.push(question.id + ": MCQ has invalid answer index");
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    counts: {
      total: questions.length,
      bank: bankQuestions.length,
      bankT3: bankT3.length,
      mcq: mcqs.length,
      calculation: calculations.length,
      derivation: derivations.length,
      sixChoiceMcq: mcqs.filter(question => Array.isArray(question.choices) && question.choices.length === 6).length
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
    const { counts } = result;
    console.log("DSA5101 QUESTION MIX GREEN · " +
      counts.bank + " bank · " +
      counts.total + " runtime · " +
      counts.mcq + " MCQ · " +
      counts.calculation + " calculation · " +
      counts.derivation + " derivation · " +
      counts.bankT3 + " bank T3 · " +
      counts.sixChoiceMcq + "/" + counts.mcq + " MCQ with six choices");
  }
}

module.exports = { validateDsa5101QuestionMix };
