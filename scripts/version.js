#!/usr/bin/env node

/* Canonical release metadata and cache-busting workflow for NUS Atlas. */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const VERSION_FILE = path.join(ROOT, "VERSION");
const PACKAGE_FILE = path.join(ROOT, "package.json");
const INDEX_FILE = path.join(ROOT, "index.html");
const CHANGELOG_FILE = path.join(ROOT, "CHANGELOG.md");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function parseVersion(value, source = "version") {
  const match = String(value).trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error(`${source} must use MAJOR.MINOR.PATCH, received: ${value}`);
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function formatVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

function bumpVersion(current, level) {
  const version = parseVersion(current);
  if (!['major', 'minor', 'patch'].includes(level)) {
    throw new Error(`bump level must be major, minor, or patch, received: ${level}`);
  }
  if (level === 'major') return formatVersion({ major: version.major + 1, minor: 0, patch: 0 });
  if (level === 'minor') return formatVersion({ major: version.major, minor: version.minor + 1, patch: 0 });
  return formatVersion({ major: version.major, minor: version.minor, patch: version.patch + 1 });
}

function isLocalAsset(url) {
  return url && !/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url);
}

function versionAssetUrl(url, version) {
  if (!isLocalAsset(url)) return url;
  const match = url.match(/^([^?#]+)(\?[^#]*)?(#.*)?$/);
  if (!match || !/\.(?:css|js)$/i.test(match[1])) return url;
  return `${match[1]}?v=${version}${match[3] || ""}`;
}

function updateIndex(html, version) {
  let output = html.replace(
    /(meta name=["']atlas-version["'] content=["'])[^"']+(["'])/i,
    `$1${version}$2`
  );
  output = output.replace(/((?:src|href)=["'])([^"']+)(["'])/gi, (full, prefix, url, suffix) => {
    return `${prefix}${versionAssetUrl(url, version)}${suffix}`;
  });
  return output;
}

function localAssetUrls(html) {
  return [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)]
    .map(match => match[1])
    .filter(url => isLocalAsset(url) && /\.(?:css|js)$/i.test(url.split(/[?#]/)[0]));
}

function readCanonicalVersion() {
  return read(VERSION_FILE).trim();
}

function check() {
  const version = readCanonicalVersion();
  parseVersion(version, "VERSION");
  const packageJson = JSON.parse(read(PACKAGE_FILE));
  if (packageJson.version !== version) throw new Error(`package.json (${packageJson.version}) does not match VERSION (${version})`);

  const index = read(INDEX_FILE);
  const meta = index.match(/meta name=["']atlas-version["'] content=["']([^"']+)["']/i);
  if (!meta || meta[1] !== version) throw new Error(`index.html atlas-version does not match VERSION (${version})`);
  const staleAssets = localAssetUrls(index).filter(url => new URL(url, "https://atlas.invalid/").searchParams.get("v") !== version);
  if (staleAssets.length) throw new Error(`index.html has stale or unversioned local assets: ${staleAssets.join(", ")}`);
  if (!new RegExp(`^## \\[${version.replace(/\./g, "\\.")}\\]`, "m").test(read(CHANGELOG_FILE))) {
    throw new Error(`CHANGELOG.md has no release entry for ${version}`);
  }

  console.log(`VERSION GREEN · ${version} · ${localAssetUrls(index).length} cache-busted local assets`);
}

function parseMessage(args) {
  const marker = args.findIndex(arg => arg === "-m" || arg === "--message");
  if (marker === -1 || !args[marker + 1]) return "Release metadata and cache refresh.";
  return args[marker + 1].trim();
}

function parseTarget(args, current) {
  const setMarker = args.findIndex(arg => arg === "--set");
  if (setMarker !== -1) {
    if (!args[setMarker + 1]) throw new Error("--set requires a semantic version");
    parseVersion(args[setMarker + 1], "--set");
    return args[setMarker + 1];
  }
  const level = args.find(arg => ['major', 'minor', 'patch'].includes(arg)) || "patch";
  return bumpVersion(current, level);
}

function updateChangelog(changelog, version, message) {
  if (new RegExp(`^## \\[${version.replace(/\./g, "\\.")}\\]`, "m").test(changelog)) {
    throw new Error(`CHANGELOG.md already contains ${version}`);
  }
  const entry = `## [${version}] - ${new Date().toISOString().slice(0, 10)}\n\n- ${message}\n\n`;
  const marker = "## [Unreleased]";
  if (!changelog.includes(marker)) throw new Error("CHANGELOG.md must contain an [Unreleased] section");
  return changelog.replace(marker, `${marker}\n\n${entry.trimEnd()}`);
}

function bump(args) {
  const current = readCanonicalVersion();
  const next = parseTarget(args, current);
  const message = parseMessage(args);
  const packageJson = JSON.parse(read(PACKAGE_FILE));
  packageJson.version = next;

  fs.writeFileSync(VERSION_FILE, `${next}\n`);
  fs.writeFileSync(PACKAGE_FILE, `${JSON.stringify(packageJson, null, 2)}\n`);
  fs.writeFileSync(INDEX_FILE, updateIndex(read(INDEX_FILE), next));
  fs.writeFileSync(CHANGELOG_FILE, updateChangelog(read(CHANGELOG_FILE), next, message));

  check();
  console.log(`Bumped NUS Atlas ${current} → ${next}`);
}

function main() {
  const [command = "check", ...args] = process.argv.slice(2);
  if (command === "check") return check();
  if (command === "bump") return bump(args);
  throw new Error(`Unknown command: ${command}. Use: node scripts/version.js check|bump [major|minor|patch] [-m "message"]`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`VERSION ERROR · ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { bumpVersion, formatVersion, parseVersion, updateIndex, versionAssetUrl };
