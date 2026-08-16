/* Validate slide packages and their source/asset provenance. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const GENERIC_SOCRATIC_PATTERNS = [
  /rendered page belongs/i,
  /Which invariant or guarantee is being tested/i,
  /What would change if the system became larger or less reliable/i,
  /What invariant or metric makes the idea on/i,
  /How would the reasoning on .*change if the dataset no longer fit in memory/i,
  /Which boundary or invariant is the key idea on/i,
  /How would the reasoning on .*change when the database becomes larger or more concurrent/i
];

function isGenericSocraticPrompt(prompt) {
  return GENERIC_SOCRATIC_PATTERNS.some(pattern => pattern.test(prompt || ""));
}

function jsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? jsonFiles(file) : file.endsWith(".json") ? [file] : [];
  });
}

function validBbox(value) {
  return value && ["left", "top", "right", "bottom"].every(key => Number.isFinite(value[key]));
}

function validateSlideSet(set, file, root = ROOT) {
  const errors = [];
  if (!set || set.schemaVersion !== "nus.slide-set.v1") errors.push("missing schemaVersion nus.slide-set.v1");
  if (!set.id || !set.courseId || !set.source || !set.source.sourceId) errors.push("missing slide-set identity/source");
  if (!Array.isArray(set.slides) || !set.slides.length) errors.push("slide set has no slides");
  const manifestFile = path.join(root, "content", "courses", set.courseId, "sources", "manifest.json");
  const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : null;
  const sourceIds = new Set((manifest && manifest.sources || []).map(source => source.sourceId));
  if (!sourceIds.has(set.source.sourceId)) errors.push(`slide-set source is absent from manifest: ${set.source.sourceId}`);
  const ids = new Set();
  const numbers = new Set();
  for (const slide of set.slides || []) {
    const label = slide && slide.slideId || "<missing slideId>";
    if (!slide || !slide.slideId || ids.has(slide.slideId)) errors.push(`invalid or duplicate slideId: ${label}`);
    ids.add(slide && slide.slideId);
    if (!Number.isInteger(slide && slide.slideNumber) || slide.slideNumber < 1 || numbers.has(slide.slideNumber)) errors.push(`invalid or duplicate slideNumber: ${label}`);
    numbers.add(slide && slide.slideNumber);
    if (!slide || slide.pdfPage !== slide.slideNumber) errors.push(`slide/page mismatch: ${label}`);
    const ref = slide && slide.sourceRef;
    if (!ref || ref.sourceId !== set.source.sourceId || ref.page !== slide.pdfPage || ref.sourceType !== "lecture") errors.push(`sourceRef mismatch: ${label}`);
    const extraction = slide && slide.extraction;
    if (!extraction || extraction.sourceId !== set.source.sourceId || extraction.page !== slide.pdfPage || !Array.isArray(extraction.blocks)) errors.push(`extraction provenance missing: ${label}`);
    for (const block of extraction && extraction.blocks || []) {
      if (!block.blockId || !block.type || block.page !== slide.pdfPage || block.sourceId !== set.source.sourceId || !validBbox(block.bbox)) errors.push(`invalid block provenance: ${label}/${block.blockId || "<missing>"}`);
    }
    const explanation = slide && slide.explanation;
    for (const field of ["whatYouSee", "whyItMatters", "intuition", "technicalDetail", "pitfall", "connection"]) {
      if (!explanation || typeof explanation[field] !== "string" || !explanation[field].trim()) errors.push(`missing explanation ${field}: ${label}`);
    }
    if (!Array.isArray(slide && slide.socraticQuestions) || !slide.socraticQuestions.length) errors.push(`slide has no Socratic questions: ${label}`);
    for (const question of slide && slide.socraticQuestions || []) {
      if (!question.type || !question.prompt || !question.answer || !question.hint) errors.push(`incomplete Socratic question: ${label}`);
      if (isGenericSocraticPrompt(question.prompt)) errors.push(`generic Socratic prompt: ${label}`);
    }
    if (!slide.assetPath || !fs.existsSync(path.join(root, slide.assetPath))) errors.push(`missing slide asset: ${label} -> ${slide.assetPath || "<none>"}`);
  }
  const sorted = [...numbers].sort((a, b) => a - b);
  if (sorted.some((number, index) => number !== index + 1)) errors.push("slide numbers are not contiguous from 1");
  return errors.map(error => `${path.relative(root, file)}: ${error}`);
}

function validateAll(root = ROOT) {
  const files = jsonFiles(path.join(root, "content", "courses")).filter(file => file.includes(`${path.sep}slides${path.sep}`));
  const errors = [];
  let slides = 0;
  for (const file of files) {
    let set;
    try { set = JSON.parse(fs.readFileSync(file, "utf8")); }
    catch (error) { errors.push(`${path.relative(root, file)}: ${error.message}`); continue; }
    errors.push(...validateSlideSet(set, file, root));
    slides += (set.slides || []).length;
  }
  return { ok: errors.length === 0, errors, counts: { slideSets: files.length, slides } };
}

if (require.main === module) {
  const result = validateAll();
  if (!result.ok) {
    console.error("SLIDE PROVENANCE FAILED");
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`SLIDE PROVENANCE GREEN · ${result.counts.slideSets} set(s) · ${result.counts.slides} slides`);
  }
}

module.exports = { validateSlideSet, validateAll, isGenericSocraticPrompt };
