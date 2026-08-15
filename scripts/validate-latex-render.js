#!/usr/bin/env node

/**
 * Render every authored formula with KaTeX and fail on unsupported or malformed TeX.
 * Source extraction is intentionally excluded: it is a faithful PDF layer.
 */

const fs = require("node:fs");
const path = require("node:path");
const katex = require("katex");
const { AUTHORED_TEXT_KEYS } = require("./latex-utils");

const ROOT = path.resolve(__dirname, "..", "content", "courses");
const DELIMITED_MATH = /(\$\$[\s\S]*?\$\$|\$(?:\\.|[^$])*?\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(filePath);
    return entry.name.endsWith(".json") ? [filePath] : [];
  });
}

function formulaBody(raw) {
  if (raw.startsWith("$$")) return { body: raw.slice(2, -2), display: true };
  if (raw.startsWith("$")) return { body: raw.slice(1, -1), display: false };
  if (raw.startsWith("\\(")) return { body: raw.slice(2, -2), display: false };
  return { body: raw.slice(2, -2), display: true };
}

function collectFormulas(value, filePath, propertyPath = [], key = "", formulas = []) {
  if (typeof value === "string") {
    if (key === "latex") formulas.push({ filePath, propertyPath, body: value, display: true });
    if (AUTHORED_TEXT_KEYS.has(key)) {
      for (const match of value.matchAll(DELIMITED_MATH)) {
        const parsed = formulaBody(match[1]);
        formulas.push({ filePath, propertyPath, ...parsed });
      }
    }
    return formulas;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectFormulas(item, filePath, propertyPath.concat(index), key, formulas));
    return formulas;
  }
  if (!value || typeof value !== "object") return formulas;
  Object.entries(value).forEach(([childKey, childValue]) => {
    collectFormulas(childValue, filePath, propertyPath.concat(childKey), childKey, formulas);
  });
  return formulas;
}

function courseIds() {
  const requested = process.argv.slice(2);
  const index = requested.indexOf("--course");
  if (index === -1) return fs.readdirSync(ROOT, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name);
  const courseId = requested[index + 1];
  if (!courseId) throw new Error("--course requires a course id");
  return [courseId];
}

function validateCourse(courseId) {
  const courseRoot = path.join(ROOT, courseId);
  if (!fs.existsSync(courseRoot)) throw new Error(`Unknown course: ${courseId}`);
  const formulas = walk(courseRoot).flatMap(filePath => collectFormulas(
    JSON.parse(fs.readFileSync(filePath, "utf8")),
    path.relative(process.cwd(), filePath),
  ));
  const errors = [];
  formulas.forEach(formula => {
    try {
      renderFormula(formula.body, formula.display);
    } catch (error) {
      errors.push({ ...formula, error: error.message });
    }
  });
  return { courseId, formulas, errors };
}

function renderFormula(body, display = false) {
  return katex.renderToString(body, { displayMode: display, throwOnError: true, strict: "error" });
}

if (require.main === module) {
  try {
    const results = courseIds().map(validateCourse);
    const formulas = results.reduce((total, result) => total + result.formulas.length, 0);
    const errors = results.flatMap(result => result.errors);
    if (errors.length) {
      console.error(`LaTeX render validation failed: ${errors.length} formula(s).`);
      errors.forEach(error => console.error(`- ${error.filePath}${JSON.stringify(error.propertyPath)}: ${error.error}\n  ${error.body}`));
      process.exitCode = 1;
    } else {
      console.log(`LaTeX render validation passed: ${formulas} formula(s) rendered by KaTeX.`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { collectFormulas, formulaBody, renderFormula, validateCourse };
