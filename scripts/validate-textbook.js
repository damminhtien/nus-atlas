/* Validate normalized textbook indexes without reading or committing raw PDFs. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function validateTextbookIndex(index, courseId, sourceFile) {
  const errors = [];
  if (!index || index.schemaVersion !== "nus.textbook-index.v1") errors.push(`${sourceFile}: invalid schemaVersion`);
  if (!index || index.courseId !== courseId) errors.push(`${sourceFile}: courseId mismatch`);
  if (!index || !Number.isInteger(index.pageCount) || index.pageCount < 1) errors.push(`${sourceFile}: invalid pageCount`);
  const source = index && index.source;
  if (!source || source.sourceType !== "textbook" || !source.sourceId || source.page !== 1 || !source.role || !source.status) errors.push(`${sourceFile}: incomplete textbook source`);
  const chapterIds = new Set();
  for (const chapter of (index && index.chapters) || []) {
    if (!chapter.id || chapterIds.has(chapter.id)) errors.push(`${sourceFile}: duplicate/missing chapter id`);
    chapterIds.add(chapter.id);
    if (!Number.isInteger(chapter.pageStart) || !Number.isInteger(chapter.pageEnd) || chapter.pageStart < 1 || chapter.pageEnd < chapter.pageStart || chapter.pageEnd > index.pageCount) errors.push(`${sourceFile}: invalid chapter pages ${chapter.id}`);
    const sectionIds = new Set();
    for (const section of chapter.sections || []) {
      if (!section.id || sectionIds.has(section.id)) errors.push(`${sourceFile}: duplicate/missing section id ${chapter.id}`);
      sectionIds.add(section.id);
      if (!Number.isInteger(section.pageStart) || !Number.isInteger(section.pageEnd) || section.pageStart < chapter.pageStart || section.pageEnd > chapter.pageEnd || section.pageEnd < section.pageStart) errors.push(`${sourceFile}: invalid section pages ${section.id}`);
      if (!section.sourceRef || section.sourceRef.sourceId !== source.sourceId || section.sourceRef.sourceType !== "textbook" || section.sourceRef.page !== section.pageStart) errors.push(`${sourceFile}: invalid section source ref ${section.id}`);
      if (Object.prototype.hasOwnProperty.call(section, "text") || Object.prototype.hasOwnProperty.call(section, "body")) errors.push(`${sourceFile}: raw textbook text is not allowed`);
    }
  }
  if (!index || !Array.isArray(index.chapters) || !index.chapters.length) errors.push(`${sourceFile}: no chapters`);
  return errors;
}

function validateTextbookDirectory(root = ROOT) {
  const courseRoot = path.join(root, "content", "courses");
  const errors = [];
  let indexes = 0;
  if (!fs.existsSync(courseRoot)) return { ok: true, errors, indexes };
  for (const entry of fs.readdirSync(courseRoot, { withFileTypes: true }).filter(item => item.isDirectory())) {
    const file = path.join(courseRoot, entry.name, "textbook.json");
    if (!fs.existsSync(file)) continue;
    indexes += 1;
    try {
      errors.push(...validateTextbookIndex(JSON.parse(fs.readFileSync(file, "utf8")), entry.name, path.relative(root, file)));
    } catch (error) {
      errors.push(`${path.relative(root, file)}: ${error.message}`);
    }
  }
  return { ok: errors.length === 0, errors, indexes };
}

if (require.main === module) {
  const result = validateTextbookDirectory();
  if (!result.ok) {
    console.error("TEXTBOOK INDEX FAILED");
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else console.log(`TEXTBOOK INDEX GREEN · ${result.indexes} index(es)`);
}

module.exports = { validateTextbookIndex, validateTextbookDirectory };
