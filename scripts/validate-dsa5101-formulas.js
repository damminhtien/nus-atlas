#!/usr/bin/env node

/** Keep DSA5101 formula payloads mathematical and renderable. */
const fs = require("node:fs");
const path = require("node:path");
const { collectFormulas } = require("./validate-latex-render.js");
const { loadCanonicalState } = require("./validate-content.js");

const ROOT = path.resolve(__dirname, "..", "content", "courses", "DSA5101");
const TEXT_COMMAND = /\\text(?:bf|it|rm)?\s*\{/;
const BARE_PROSE = /\b(?:support|supp|count|baskets|infrequent|subset|union|candidate|exact|similarity)\b/i;
const RAW_ARROW = /(?<!\\)(?:=>|->)/;
const TRAILING_FORMULA = /\$(?:\\.|[^$])*?\$\s*\/\s*\d/;
const FORMULA_DELIMITERS = /^(?:\$\$[\s\S]*\$\$|\$(?:\\.|[^$])*\$|\\\([\s\S]*\\\)|\\\[[\s\S]*\\\])$/;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(filePath);
    return entry.name.endsWith(".json") ? [filePath] : [];
  });
}

function stripTexCommands(value) {
  return value
    .replace(/\\[A-Za-z]+\*?(?:\s*\{[^{}]*\})?/g, " ")
    .replace(/[{}()[\]|_^=+\-*/.,:;<>]/g, " ");
}

function formulaProblems(body) {
  const problems = [];
  if (TEXT_COMMAND.test(body)) problems.push("text command inside math");
  if (RAW_ARROW.test(body)) problems.push("raw ASCII arrow inside math");
  if (BARE_PROSE.test(stripTexCommands(body))) problems.push("bare prose inside math");
  return problems;
}

function walkStrings(value, propertyPath = [], results = []) {
  if (typeof value === "string") {
    results.push({ value, propertyPath });
    return results;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, propertyPath.concat(index), results));
    return results;
  }
  if (!value || typeof value !== "object") return results;
  Object.entries(value).forEach(([key, child]) => walkStrings(child, propertyPath.concat(key), results));
  return results;
}

function validateDsa5101Formulas() {
  const errors = [];
  const formulas = walk(ROOT).flatMap(filePath => collectFormulas(
    JSON.parse(fs.readFileSync(filePath, "utf8")),
    path.relative(process.cwd(), filePath),
  ));
  formulas.forEach(formula => {
    formulaProblems(formula.body).forEach(problem => errors.push(`${formula.filePath}${JSON.stringify(formula.propertyPath)}: ${problem}: ${formula.body}`));
  });

  for (const filePath of walk(ROOT)) {
    const document = JSON.parse(fs.readFileSync(filePath, "utf8"));
    walkStrings(document).forEach(({ value, propertyPath }) => {
      if (TRAILING_FORMULA.test(value)) errors.push(`${path.relative(process.cwd(), filePath)}${JSON.stringify(propertyPath)}: formula continues outside math: ${value}`);
    });
  }

  const state = loadCanonicalState();
  const labs = state.labs || {};
  ["dsa5101-minhash-lsh", "dsa5101-clustering", "dsa5101-pagerank", "dsa5101-streams"].forEach(labId => {
    const lab = labs[labId];
    if (!lab || lab.stepValueMode !== "mixed") errors.push(`${labId}: derivation-trace must declare stepValueMode=mixed`);
  });
  const deepDive = labs["dsa5101-frequent-itemsets"];
  (deepDive && deepDive.exercises || []).forEach(exercise => (exercise.steps || []).forEach((step, index) => {
    if (!FORMULA_DELIMITERS.test(String(step[1] || "").trim())) errors.push(`dsa5101-frequent-itemsets/exercises/${exercise.id}/steps[${index}]: value must be an explicit formula`);
  }));
  return { ok: errors.length === 0, errors, counts: { formulas: formulas.length, labs: Object.values(labs).filter(lab => lab && lab.courseCode === "DSA5101").length } };
}

if (require.main === module) {
  const result = validateDsa5101Formulas();
  if (!result.ok) {
    console.error(`DSA5101 FORMULA CONTRACT FAILED · ${result.errors.length} issue(s)`);
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`DSA5101 FORMULAS GREEN · ${result.counts.formulas} formulas · ${result.counts.labs} labs · text-safe math`);
  }
}

module.exports = { formulaProblems, validateDsa5101Formulas };
