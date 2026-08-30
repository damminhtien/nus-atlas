/* Deterministic architecture guardrails for source ownership and dependency boundaries. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OWNERSHIP_FILE = path.join(ROOT, "architecture", "ownership.json");
const GLOBAL_BRIDGE_ALLOWLIST = new Set();
const OWNED_RUNTIME_PATH = /^(?:content|schemas|src|tools|scripts|tests|data\/extracted|dist|api|assets|css|js)\//;
const OWNED_RUNTIME_ROOT_FILES = new Set(["index.html", "manifest.webmanifest", "sw.js", "prerender.js", "nus-gate.js", "icon.svg"]);

function readOwnership() {
  return JSON.parse(fs.readFileSync(OWNERSHIP_FILE, "utf8"));
}

function globToRegExp(pattern) {
  const escaped = pattern.split("**").map(part => part.split("*").map(value => value.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*")).join(".*");
  return new RegExp(`^${escaped}$`);
}

function ownershipFor(file, rules) {
  return rules.find(rule => globToRegExp(rule.pattern).test(file)) || null;
}

function trackedFiles() {
  try {
    return execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  } catch (_) {
    return [];
  }
}

function changedFiles() {
  try {
    return execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  } catch (_) {
    return [];
  }
}

function assertSourceBoundaries(files) {
  const errors = [];
  const globalPattern = /(?:window|root)\.NUS_[A-Z0-9_]+/;
  for (const file of files) {
    if (!(/^(?:src\/(core|features|ui)|js)\//.test(file))) continue;
    if (GLOBAL_BRIDGE_ALLOWLIST.has(file)) continue;
    const absolute = path.join(ROOT, file);
    if (fs.existsSync(absolute) && globalPattern.test(fs.readFileSync(absolute, "utf8"))) {
      errors.push(`${file} reads a window.NUS_* global outside the compatibility bridge`);
    }
  }
  return errors;
}

function check(options = {}) {
  const ownership = readOwnership();
  const errors = [];
  const files = trackedFiles();
  for (const file of files) {
    const rule = ownershipFor(file, ownership.rules);
    if (!rule && (OWNED_RUNTIME_PATH.test(file) || OWNED_RUNTIME_ROOT_FILES.has(file))) {
      errors.push(`${file} has no ownership rule`);
    }
    if (rule && rule.role === "generated" && changedFiles().includes(file)) {
      errors.push(`${file} is generated and must not be edited; trace it to canonical source`);
    }
  }
  errors.push(...assertSourceBoundaries(files));
  if (options.strict && errors.length) {
    const message = ["ARCHITECTURE CHECK FAILED", ...errors.map(error => `- ${error}`)].join("\n");
    throw new Error(message);
  }
  return { ok: errors.length === 0, errors, rules: ownership.rules.length, files: files.length };
}

if (require.main === module) {
  const result = check({ strict: process.argv.includes("--strict") });
  if (result.ok) console.log(`ARCHITECTURE GREEN · ${result.rules} ownership rules · ${result.files} tracked files`);
  else {
    console.warn("ARCHITECTURE WARNINGS");
    result.errors.forEach(error => console.warn(`- ${error}`));
    if (process.argv.includes("--strict")) process.exitCode = 1;
  }
}

module.exports = { check, ownershipFor, readOwnership };
