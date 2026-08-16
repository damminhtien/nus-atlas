/* Generic lecture-slide extractor.
 * It consumes normalized page-aware extraction JSON and emits a canonical
 * slide-set package. Course-specific explanations belong in content/**, not
 * in a course-specific builder script.
 */
const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    result[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
  }
  return result;
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function normalizePages(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input.pages)) return input.pages;
  if (Array.isArray(input.document && input.document.pages)) return input.document.pages;
  throw new Error("Extraction JSON must contain pages[]");
}
function pageText(page) {
  return (page.blocks || []).map(block => block.text || block.content || "").filter(Boolean).join("\n").trim();
}
function extractSlides({ input, courseId, sourceId, slideSetId, imageRoot }) {
  const pages = normalizePages(readJson(input));
  const slides = pages.map((page, index) => {
    const number = Number(page.page || page.number || index + 1);
    const blocks = (page.blocks || []).map((block, blockIndex) => ({
      blockId: block.blockId || `${slideSetId}-p${number}-b${blockIndex + 1}`,
      type: block.type || "text",
      page: number,
      sourceId,
      bbox: block.bbox || null,
      imageId: block.imageId || null,
      text: block.text || block.content || ""
    }));
    return {
      slideId: `${slideSetId}-${number}`,
      slideNumber: number,
      pdfPage: number,
      sourceRef: { sourceId, sourceType: "lecture", page: number },
      ...(imageRoot ? { assetPath: `${imageRoot}/page-${String(number).padStart(3, "0")}.png` } : {}),
      extraction: { sourceId, page: number, blocks },
      text: pageText(page),
      explanation: { whatYouSee: pageText(page), whyItMatters: "Read the authored lecture note in the canonical lesson package.", intuition: "", technicalDetail: "", pitfall: "", connection: "" },
      textbookRefs: [],
      referenceRefs: [],
      socraticQuestions: [{ type: "recall", prompt: "What is the main claim or object on this slide?", answer: "State the slide's main claim and name its symbols.", hint: "Name the object before explaining its consequence." }]
    };
  });
  return { schemaVersion: "nus.slide-set.v1", id: slideSetId, courseId, lessonIds: [], coreSlideNumbers: [], source: { sourceId, sourceType: "lecture", pageCount: slides.length }, slides };
}
function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  for (const key of ["input", "output", "course", "source-id", "slide-set-id"]) if (!args[key]) throw new Error(`Missing --${key}`);
  const value = extractSlides({ input: args.input, courseId: args.course, sourceId: args["source-id"], slideSetId: args["slide-set-id"], imageRoot: args["image-root"] });
  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, `${JSON.stringify(value, null, 2)}\n`);
  console.log(`LECTURE EXTRACTION GREEN · ${value.courseId}/${value.id} · ${value.slides.length} pages`);
  return value;
}
if (require.main === module) main();
module.exports = { extractSlides, normalizePages, parseArgs };
