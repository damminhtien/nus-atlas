#!/usr/bin/env node

/** Keep DSA5101 study prose specific and its verified exam signals visible. */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "content", "courses", "DSA5101");
const GENERIC_METADATA = /^(?:Check the assumption behind your answer\.|Check the representation, objective, and scale assumption before committing to an answer\.|Explain the idea with a small diagram or example\.|Draw the state transition or data summary before calculating\.)$/;
const GENERIC_SLIDE_TEXT = /^(?:This is official lecture-core evidence for DSA5101 Lecture 2\.|Read the page as one claim:|Use the exact notation and assumptions shown on this page|Do not infer a stronger guarantee than the page states|Connect this page to the next step in the lecture pipeline)/;

function read(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function questionFiles() {
  return fs.readdirSync(path.join(ROOT, "questions"))
    .filter(file => file.startsWith("dsa5101-") && file.endsWith(".json"))
    .map(file => ({ file, questions: read(path.join("questions", file)) }))
    .filter(({ questions }) => Array.isArray(questions));
}

function validateQuestions(errors) {
  const seen = new Map();
  for (const { file, questions } of questionFiles()) {
    for (const question of questions) {
      for (const field of ["misconception", "visualHook"]) {
        const value = question[field];
        if (!value) {
          errors.push(`${file}/${question.id}: missing ${field}`);
          continue;
        }
        if (GENERIC_METADATA.test(value)) errors.push(`${file}/${question.id}: generic ${field}`);
        const key = `${field}\t${value}`;
        seen.set(key, [...(seen.get(key) || []), `${file}/${question.id}`]);
      }
    }
  }
  for (const [key, locations] of seen) {
    if (locations.length > 1) errors.push(`duplicate question metadata ${key.split("\t")[0]}: ${locations.join(", ")}`);
  }
}

function validateFormulaNames(errors) {
  const lesson = read("lessons/dsa5101-frequent-itemsets.json");
  const formulas = Array.isArray(lesson.math) ? lesson.math : [];
  const names = new Map();
  for (const formula of formulas) names.set(formula.name, [...(names.get(formula.name) || []), formula.latex]);
  for (const [name, formulasForName] of names) {
    if (formulasForName.length > 1) errors.push(`duplicate frequent-itemsets formula name: ${name}`);
  }
  const expected = ["Itemset support", "Rule confidence", "Rule lift"];
  for (const name of expected) if (!names.has(name)) errors.push(`missing frequent-itemsets formula name: ${name}`);
}

function validateAssessmentMap(errors) {
  const map = read("assessment-map.json");
  const topics = Array.isArray(map.topics) ? map.topics : [];
  if (topics.length !== 7) errors.push(`expected 7 DSA5101 assessment topics, got ${topics.length}`);
  for (const topic of topics) {
    if (topic.priority !== "A+ focus") errors.push(`${topic.id}: not marked A+ focus`);
    if (topic.priorityBasis !== "official-assignment" && topic.priorityBasis !== "official-lecture-and-assignment") errors.push(`${topic.id}: missing official priority basis`);
    if (!Array.isArray(topic.assignmentRefs) || topic.assignmentRefs.length === 0) errors.push(`${topic.id}: missing assignment evidence`);
  }
  if (!/not a promise about final-exam questions/i.test(map.disclaimer || "")) errors.push("assessment map must state that A+ focus is not a final-exam promise");
}

function validateCoreSlides(errors) {
  const slideSet = read("slides/dsa5101-lecture2.json");
  const coreNumbers = Array.isArray(slideSet.coreSlideNumbers) ? slideSet.coreSlideNumbers : [];
  const coreSlides = (slideSet.slides || []).filter(slide => coreNumbers.includes(slide.slideNumber));
  if (coreSlides.length !== coreNumbers.length) errors.push("Lecture 2 core slide list contains a missing slide");
  for (const slide of coreSlides) {
    if (slide.priority !== "core") errors.push(`Lecture 2 slide ${slide.slideNumber}: missing core priority`);
    const explanation = slide.explanation || {};
    for (const field of ["whyItMatters", "intuition", "technicalDetail", "pitfall", "connection"]) {
      if (!explanation[field]) errors.push(`Lecture 2 slide ${slide.slideNumber}: missing explanation.${field}`);
      if (GENERIC_SLIDE_TEXT.test(explanation[field] || "")) errors.push(`Lecture 2 slide ${slide.slideNumber}: generic explanation.${field}`);
    }
    const prompt = slide.socraticQuestions?.[0]?.prompt;
    if (!prompt || prompt === "What is the main claim or object on this slide?") errors.push(`Lecture 2 slide ${slide.slideNumber}: generic Socratic prompt`);
  }
}

function validateDsa5101ContentQuality() {
  const errors = [];
  validateQuestions(errors);
  validateFormulaNames(errors);
  validateAssessmentMap(errors);
  validateCoreSlides(errors);
  return { ok: errors.length === 0, errors };
}

if (require.main === module) {
  const result = validateDsa5101ContentQuality();
  if (!result.ok) {
    console.error(`DSA5101 CONTENT QUALITY FAILED · ${result.errors.length} issue(s)`);
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log("DSA5101 CONTENT QUALITY GREEN · specific question metadata · verified A+ map · core-slide guard");
  }
}

module.exports = { validateDsa5101ContentQuality };
