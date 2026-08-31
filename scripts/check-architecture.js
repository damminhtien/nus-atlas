/* Deterministic architecture guardrails for source ownership and dependency boundaries. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OWNERSHIP_FILE = path.join(ROOT, "architecture", "ownership.json");
const GLOBAL_BRIDGE_ALLOWLIST = new Set();
const OWNED_RUNTIME_PATH = /^(?:content|schemas|src|tools|scripts|tests|data\/(?:extracted|nus)|dist|api|assets|css|js)\//;
const OWNED_RUNTIME_ROOT_FILES = new Set(["index.html", "manifest.webmanifest", "sw.js", "prerender.js", "nus-gate.js", "icon.svg"]);
const BOOTSTRAP = "src/app/bootstrap.js";
const RUNTIME_MODULES = ["src/ui/nus-components.js", "src/app/nus-ui.js", "src/app/app-shell.js", BOOTSTRAP];
const LEGACY_ENTRYPOINTS = ["js/app.js", "js/nus.js", "js/nus-store.js", "js/nus-components.js"];

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

function scriptSources(html) {
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map(match => match[1].split("?")[0]);
}

function assertRuntimeComposition() {
  const errors = [];
  const indexPath = path.join(ROOT, "index.html");
  const indexHtml = fs.readFileSync(indexPath, "utf8");
  const scripts = scriptSources(indexHtml);
  const bootstrapCount = scripts.filter(file => file === BOOTSTRAP).length;
  if (bootstrapCount !== 1) errors.push(`${BOOTSTRAP} must be the only composition-root script (found ${bootstrapCount})`);
  if (scripts[scripts.length - 1] !== BOOTSTRAP) errors.push(`${BOOTSTRAP} must be the last external application script`);
  for (const file of RUNTIME_MODULES) if (!scripts.includes(file)) errors.push(`${file} must be loaded before ${BOOTSTRAP}`);
  for (const file of LEGACY_ENTRYPOINTS) if (scripts.includes(file)) errors.push(`${file} is a deleted legacy browser entrypoint`);

  const bootstrap = fs.readFileSync(path.join(ROOT, BOOTSTRAP), "utf8");
  for (const factory of [
    "ATLAS_CONTENT_TRANSPORT",
    "ATLAS_CONTENT_REPOSITORY",
    "ATLAS_STUDY_STORE_FACTORY",
    "ATLAS_SYNC_CLIENT_FACTORY",
    "ATLAS_COMPONENTS_FACTORY",
    "ATLAS_NUS_UI_FACTORY",
    "ATLAS_APP_SHELL_FACTORY"
  ]) {
    if (!bootstrap.includes(`required("${factory}")`)) errors.push(`${BOOTSTRAP} must resolve ${factory} explicitly`);
  }
  for (const [pattern, label] of [
    [/appShellFactory\(\{/, "app-shell construction"],
    [/\brepository,/, "repository injection"],
    [/\bstore,/, "study-store injection"],
    [/router:\s*root\.ATLAS_ROUTER/, "router injection"],
    [/\bfeatures\b/, "feature registry injection"],
    [/studyStore:\s*store/, "sync study-store injection"]
  ]) if (!pattern.test(bootstrap)) errors.push(`${BOOTSTRAP} is missing ${label}`);
  if (/root\.ATLAS_(?:REPOSITORY|STUDY_STORE|SYNC_CLIENT)\s*=/.test(bootstrap)) errors.push(`${BOOTSTRAP} must not publish runtime instances as globals`);

  for (const file of ["src/app/app-shell.js", "src/app/nus-ui.js"]) {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    if (/(?:window|globalThis)\.ATLAS_/.test(source)) errors.push(`${file} must receive ATLAS dependencies through the composition root`);
  }
  for (const file of ["index.html", BOOTSTRAP, "src/app/app-shell.js", "src/app/nus-ui.js", "src/ui/nus-components.js", "prerender.js", "sw.js"]) {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    if (/js\/(?:app|nus|nus-store|nus-components)\.js|data\/(?:algorithms\.js|nus\/)/.test(source)) {
      errors.push(`${file} contains a legacy browser/data runtime reference`);
    }
  }
  return errors;
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
  errors.push(...assertRuntimeComposition());
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

module.exports = { assertRuntimeComposition, check, ownershipFor, readOwnership };
