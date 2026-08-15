#!/usr/bin/env node

/**
 * Enforce the authored-content math contract.
 *
 * Source extraction is intentionally excluded: it is a faithful PDF layer and
 * must not be rewritten. Authored prose must delimit mathematical fragments
 * with $...$, $$...$$, \\(...\\), or \\[...\\]. Raw LaTeX is allowed only in
 * dedicated `latex` fields.
 */

const fs = require('node:fs');
const path = require('node:path');
const { AUTHORED_TEXT_KEYS, SKIP_KEYS } = require('./latex-utils');

const ROOT = path.resolve(__dirname, '..', 'content', 'courses');

const MATH_DELIMITERS = [
  /\$\$[\s\S]*?\$\$/g,
  /\$(?:\\.|[^$])*?\$/g,
  /\\\((?:\\.|[^)])*?\\\)/g,
  /\\\[[\s\S]*?\\\]/g,
];
const UNICODE_MATH = /[≈≤≥∑∫∂∇±×÷∞→←∈≠]/g;

const RAW_MATH_PATTERNS = [
  { pattern: /\\(?:[a-zA-Z]+|[,;:!])/g, label: 'TeX command' },
  { pattern: /\b(?:[xyzwuvprhqke]|Phi|Sigma|Delta|[RKAHXWVSQPCDL])_[A-Za-z0-9]+\b/g, label: 'subscript' },
  { pattern: /\b(?:[A-Za-z]+)\^\{?[-A-Za-z0-9(†]/g, label: 'superscript' },
  { pattern: /\b(?:f|x|y|z|u|v|w)\s*\*/g, label: 'starred variable' },
  { pattern: /\b(?:O|o)\([A-Za-z0-9_+*^ -]+\)/g, label: 'complexity expression' },
  { pattern: /\b(?:argmax|argmin|exp|log|sin|cos|sigmoid|ReLU|softmax)(?=\s*(?:\(|_|\^|[0-9]))/g, label: 'math function' },
  { pattern: /\b[A-Za-z]\([^)]*\)/g, label: 'function expression' },
  { pattern: /\bd[A-Za-z]+\s*\/\s*d[A-Za-z]+\b/g, label: 'derivative' },
  { pattern: /\b\d+(?:\.\d+)?\s*[+*/-]\s*\d+(?:\.\d+)?\b/g, label: 'numeric expression' },
  { pattern: /[≈≤≥∑∫∂∇±×÷∞→←∈≠]/g, label: 'math symbol' },
  { pattern: /\b(?:lambda|gamma|epsilon|sigma|mu|alpha|beta|theta|phi|Phi|Sigma|Delta)\b\s*(?:=|[0-9_+*/^-])/gi, label: 'named parameter' },
  { pattern: /\b[A-Za-z][A-Za-z0-9]*\s*(?:=|<=|>=|<|>|∈|⊂|≈|≠)\s*[A-Za-z0-9({\[]/g, label: 'equation' },
];

function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(filePath);
    return entry.name.endsWith('.json') ? [filePath] : [];
  });
}

function stripDelimitedMath(value) {
  return MATH_DELIMITERS.reduce((result, delimiter) => result.replace(delimiter, ' '), value);
}

function findRawMath(value) {
  const residual = stripDelimitedMath(value);
  const matches = [];
  for (const { pattern, label } of RAW_MATH_PATTERNS) {
    for (const match of residual.matchAll(pattern)) {
      matches.push({ label, token: match[0], index: match.index });
    }
  }
  return matches.sort((left, right) => left.index - right.index);
}

function findUnicodeMath(value) {
  const matches = [];
  for (const delimiter of MATH_DELIMITERS) {
    for (const span of value.matchAll(delimiter)) {
      for (const symbol of span[0].matchAll(UNICODE_MATH)) {
        matches.push({ label: 'Unicode math symbol', token: symbol[0], index: span.index + symbol.index });
      }
    }
  }
  return matches.sort((left, right) => left.index - right.index);
}

function displayPath(filePath, propertyPath) {
  return `${path.relative(process.cwd(), filePath)}${propertyPath}`;
}

function validateValue(value, filePath, propertyPath, key, skipped, errors) {
  if (typeof value === 'string') {
    if (!skipped && AUTHORED_TEXT_KEYS.has(key)) {
      const matches = [...findRawMath(value), ...findUnicodeMath(value)];
      if (matches.length) errors.push({
        location: displayPath(filePath, propertyPath),
        label: matches.map((match) => match.label).join(', '),
        token: matches.map((match) => match.token).join(', '),
        value,
      });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      validateValue(item, filePath, `${propertyPath}[${index}]`, key, skipped, errors);
    });
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const [childKey, childValue] of Object.entries(value)) {
    validateValue(
      childValue,
      filePath,
      `${propertyPath}.${childKey}`,
      childKey,
      skipped || SKIP_KEYS.has(childKey) || childKey === 'latex',
      errors,
    );
  }
}

function validateAll() {
  const errors = [];
  for (const filePath of walkFiles(ROOT)) {
    let document;
    try {
      document = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      errors.push({ location: filePath, label: 'invalid JSON', token: '', value: error.message });
      continue;
    }
    validateValue(document, filePath, '', '', false, errors);
  }
  return errors;
}

if (require.main === module) {
  const errors = validateAll();
  if (errors.length) {
    console.error(`LaTeX validation failed: ${errors.length} raw math fragment(s).`);
    for (const error of errors) {
      console.error(`- ${error.location} [${error.label}: ${error.token}]`);
      console.error(`  ${error.value}`);
    }
    process.exitCode = 1;
  } else {
    console.log('LaTeX validation passed: authored math is delimited.');
  }
}

module.exports = { findRawMath, findUnicodeMath, validateAll };
