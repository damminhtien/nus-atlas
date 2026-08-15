/* Validate normalized nus-lecture.v1 extraction artifacts without opening raw PDFs. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function jsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? jsonFiles(file) : file.endsWith(".json") ? [file] : [];
  });
}

function validateExtraction(document, file) {
  const errors = [];
  if (!document || document.schemaVersion !== "nus-lecture.v1") errors.push("missing schemaVersion nus-lecture.v1");
  if (!document.sourceId || !document.courseCode) errors.push("missing sourceId or courseCode");
  if (!Number.isInteger(document.pageCount) || document.pageCount < 1) errors.push("invalid pageCount");
  if (!Array.isArray(document.pages) || document.pages.length !== document.pageCount) errors.push("page count does not match pages array");
  const pages = new Set();
  const blockIds = new Set();
  const imageIds = new Set((document.images || []).map(image => image.imageId).filter(Boolean));
  for (const page of document.pages || []) {
    if (!Number.isInteger(page.page) || page.page < 1 || page.page > document.pageCount || pages.has(page.page)) errors.push(`invalid or duplicate page: ${page.page}`);
    pages.add(page.page);
    for (const block of page.blocks || []) {
      if (!block.blockId || blockIds.has(block.blockId)) errors.push(`invalid or duplicate blockId: ${block.blockId || "<missing>"}`);
      blockIds.add(block.blockId);
      if (!block.type || block.page !== page.page || block.sourceId !== document.sourceId) errors.push(`block provenance mismatch: ${block.blockId || "<missing>"}`);
      if (!block.bbox || !["left", "top", "right", "bottom"].every(key => Number.isFinite(block.bbox[key]))) errors.push(`missing bbox: ${block.blockId || "<missing>"}`);
      if (block.type === "image" && block.imageId && !imageIds.has(block.imageId)) errors.push(`image block references unknown imageId: ${block.blockId}`);
    }
  }
  const markdown = file.replace(/\.json$/, ".md");
  if (!fs.existsSync(markdown)) errors.push(`missing Markdown reader view: ${path.relative(ROOT, markdown)}`);
  return errors;
}

function validateAll(root = ROOT) {
  const files = jsonFiles(path.join(root, "data", "extracted"));
  const errors = [];
  let blocks = 0;
  for (const file of files) {
    let document;
    try { document = JSON.parse(fs.readFileSync(file, "utf8")); }
    catch (error) { errors.push(`${path.relative(root, file)}: ${error.message}`); continue; }
    const fileErrors = validateExtraction(document, file);
    errors.push(...fileErrors.map(error => `${path.relative(root, file)}: ${error}`));
    blocks += (document.pages || []).reduce((total, page) => total + (page.blocks || []).length, 0);
  }
  return { ok: errors.length === 0, errors, counts: { files: files.length, blocks } };
}

if (require.main === module) {
  const result = validateAll();
  if (!result.ok) {
    console.error("EXTRACTED PROVENANCE FAILED");
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`EXTRACTED PROVENANCE GREEN · ${result.counts.files} JSON source(s) · ${result.counts.blocks} page blocks`);
  }
}

module.exports = { validateExtraction, validateAll };
