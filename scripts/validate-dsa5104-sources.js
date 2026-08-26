const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const COURSE_ROOT = path.join(ROOT, "content", "courses", "DSA5104");

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function topIds(items) { return new Set((items || []).filter(item => item && !item.page).map(item => item.sourceId)); }
function check() {
  const course = readJson(path.join(COURSE_ROOT, "course.json"));
  const manifest = readJson(path.join(COURSE_ROOT, "sources", "manifest.json"));
  const legacyView = readJson(path.join(COURSE_ROOT, "sources.json"));
  const expected = topIds(manifest.sources);
  const errors = [];
  const manifestById = new Map(manifest.sources.map(source => [source.sourceId, source]));
  const viewEntries = [
    ["course.lectureSources", course.lectureSources],
    ["course.exerciseSources", course.exerciseSources],
    ["course.textbookSources", course.textbookSources],
    ["course.referenceSources", course.referenceSources],
    ["course.sourceCatalog", course.sourceCatalog],
    ["sources.json", legacyView]
  ];
  const views = new Set(viewEntries.flatMap(([, items]) => [...topIds(items)]));
  for (const sourceId of expected) if (!views.has(sourceId)) errors.push(`manifest source missing from a course view: ${sourceId}`);
  const comparableFields = ["sourceType", "role", "status", "assetPath", "externalUrl", "sha256", "slideSetId"];
  for (const [viewName, items] of viewEntries) {
    for (const source of (items || []).filter(item => item && !item.page)) {
      const canonical = manifestById.get(source.sourceId);
      if (!canonical) {
        errors.push(`${viewName} contains source absent from manifest: ${source.sourceId}`);
        continue;
      }
      for (const field of comparableFields) {
        if ((source[field] ?? null) !== (canonical[field] ?? null)) {
          errors.push(`${viewName} metadata differs from manifest for ${source.sourceId}: ${field}`);
        }
      }
    }
  }
  for (const source of manifest.sources) {
    if (!source.assetPath) continue;
    const asset = path.join(ROOT, source.assetPath);
    if (!fs.existsSync(asset)) { errors.push(`missing source asset: ${source.assetPath}`); continue; }
    if (source.sha256) {
      const digest = crypto.createHash("sha256").update(fs.readFileSync(asset)).digest("hex");
      if (digest !== source.sha256) errors.push(`source asset checksum mismatch: ${source.sourceId}`);
    }
  }
  return { ok: errors.length === 0, errors, count: expected.size };
}

if (require.main === module) {
  const result = check();
  if (!result.ok) {
    console.error("DSA5104 SOURCE REGISTRY FAILED");
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else console.log(`DSA5104 SOURCE REGISTRY GREEN · ${result.count} manifest sources aligned`);
}

module.exports = { check };
