/* Build the DSA5104 chapter1 slide reader from normalized JSON extraction. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EXTRACTION = path.join(ROOT, "data", "extracted", "DSA5104", "chapter1.json");
const OUTPUT = path.join(ROOT, "content", "courses", "DSA5104", "slides", "dsa5104-chapter1.json");
const SOURCE_ID = "DSA5104/chapter1.pdf";
const IMAGE_ROOT = "assets/nus/dsa5104/chapter1";

const SECTION_MAP = [
  { from: 1, to: 11, title: "Course scope and database purpose", lessonIds: ["dsa5104-orientation"], why: "These pages define the DBMS boundary, course scope, and the problems that database systems solve over file collections.", intuition: "A database system is both data and the controlled programs that make shared access safe and useful.", pitfall: "Do not reduce a DBMS to storage; integrity, concurrency, security, and recovery are part of the system." },
  { from: 12, to: 24, title: "Models, semi-structured data, and abstraction", lessonIds: ["dsa5104-orientation", "dsa5104-relational-model", "dsa5104-semi-structured"], why: "These pages introduce relational, ER, XML, JSON, physical/logical/view levels, and schema versus instance.", intuition: "The representation determines which structure is explicit and where interpretation or validation occurs.", pitfall: "Do not confuse a schema with the current instance, or a view with the physical storage layout." },
  { from: 25, to: 32, title: "DDL, DML, and SQL", lessonIds: ["dsa5104-sql-foundations"], why: "These pages connect schema definition, data manipulation, declarative SQL, and application access.", intuition: "SQL declares the desired relation result while the database engine chooses how to obtain it.", pitfall: "Keep schema definition, data updates, and query semantics distinct." },
  { from: 33, to: 38, title: "Design and storage manager", lessonIds: ["dsa5104-database-design", "dsa5104-query-processing"], why: "These pages move from logical and physical design to storage, buffers, files, metadata, and indexes.", intuition: "Good logical structure protects meaning; good physical access reduces the work needed to retrieve it.", pitfall: "An index is an access path, not a replacement for a key or integrity constraint." },
  { from: 39, to: 40, title: "Query processor", lessonIds: ["dsa5104-query-processing"], why: "The query processor turns a declarative statement into an evaluated physical plan.", intuition: "Parsing, optimization, and evaluation have different jobs even when the user sees one SQL statement.", pitfall: "Optimization may change execution strategy but must preserve the logical result." },
  { from: 41, to: 45, title: "Transactions and application architecture", lessonIds: ["dsa5104-transactions-architecture", "dsa5104-database-design"], why: "These pages establish transaction management, concurrency control, and two-tier versus three-tier application boundaries.", intuition: "A transaction protects a logical function; an architecture determines where data, computation, and coordination live.", pitfall: "Do not treat two valid writes as safe when their business invariant requires atomicity." },
  { from: 46, to: 50, title: "Users, history, and big-data systems", lessonIds: ["dsa5104-transactions-architecture", "dsa5104-semi-structured"], why: "The closing lecture pages connect database administration, history, parallel/distributed systems, and SQL beyond one machine.", intuition: "The same relational semantics meet new placement, scale, and coordination costs as systems evolve.", pitfall: "A distributed deployment changes the physical cost model; it does not remove the need for clear semantics." },
  { from: 51, to: 52, title: "Lecture synthesis and homework", lessonIds: ["dsa5104-orientation", "dsa5104-sql-foundations"], why: "The final pages close the chapter and point to MySQL installation and textbook exercises.", intuition: "Use the summary as retrieval: model, schema, query, engine, transaction, and validation.", pitfall: "Do not skip the small manual exercises; they expose whether the terms are operational." }
];

function sectionFor(page) { return SECTION_MAP.find(section => page >= section.from && page <= section.to) || SECTION_MAP[SECTION_MAP.length - 1]; }
function titleFor(page) {
  const lines = page.blocks.flatMap(block => String(block.text || "").split(/\n/)).map(line => line.trim()).filter(Boolean);
  const candidate = lines.find(line => line.length >= 4 && !/^\d+$/.test(line) && !line.startsWith("§")) || `DSA5104 · slide ${page.page}`;
  return candidate.replace(/\s+/g, " ").slice(0, 100);
}
function sourceRef(page) { return { sourceId: SOURCE_ID, sourceType: "lecture", page, role: "Chapter 1 lecture slide", status: "current" }; }
function textbookRefs(section) {
  if (section.title.includes("SQL")) return [{ sourceId: "DSA5104/Database System Concepts, 7th edition", page: 3, sourceType: "textbook", role: "SQL depth" }];
  if (section.title.includes("Models") || section.title.includes("Design")) return [{ sourceId: "DSA5104/Database System Concepts, 7th edition", page: 2, sourceType: "textbook", role: "relational-model depth" }];
  return [{ sourceId: "DSA5104/Database System Concepts, 7th edition", page: 1, sourceType: "textbook", role: "course textbook pointer" }];
}
function questions(section, title) {
  const safeTitle = title.replace(/<\s*2/g, "fewer than two");
  return [
    { type: "distinguish", prompt: `Which boundary or invariant is the key idea on “${safeTitle}”?`, answer: `State the data model, constraint, processing stage, or transaction guarantee before naming an implementation detail.`, hint: "Name the semantic boundary first." },
    { type: "transfer", prompt: `How would the reasoning on “${safeTitle}” change when the database becomes larger or more concurrent?`, answer: section.title.includes("SQL") || section.title.includes("processor") ? "Reconsider the physical plan, indexes, blocks, data movement, and validation while preserving the same logical result." : "State which abstraction, constraint, transaction boundary, or coordination cost becomes important and what evidence would test it.", hint: "Connect meaning to system behavior." }
  ];
}

function build() {
  const extracted = JSON.parse(fs.readFileSync(EXTRACTION, "utf8"));
  if (extracted.sourceId !== SOURCE_ID || extracted.pageCount !== 52) throw new Error(`Unexpected DSA5104 extraction: ${extracted.sourceId} / ${extracted.pageCount} pages`);
  const slides = extracted.pages.map(page => {
    const section = sectionFor(page.page);
    const title = titleFor(page);
    const blocks = page.blocks.map(block => ({ blockId: block.blockId, type: block.type, text: block.text || "", page: block.page, sourceId: block.sourceId, bbox: block.bbox, imageId: block.imageId || null }));
    return {
      slideId: `DSA5104-C1-S${String(page.page).padStart(2, "0")}`,
      slideNumber: page.page,
      pdfPage: page.page,
      title,
      kind: "lecture-source",
      status: page.reviewReasons && page.reviewReasons.length ? "needs-review" : "reviewed",
      assetPath: `${IMAGE_ROOT}/slide-${String(page.page).padStart(2, "0")}.jpg`,
      sourceRef: sourceRef(page.page),
      extraction: { schemaVersion: "nus.lecture-slide-extraction.v1", sourceId: SOURCE_ID, page: page.page, status: page.status, reviewReasons: page.reviewReasons || [], text: blocks.map(block => block.text).filter(Boolean).join("\n"), blocks },
      explanation: {
        whatYouSee: `The rendered page belongs to the “${section.title}” block. Its source layer contains ${blocks.length} page-aware extraction block${blocks.length === 1 ? "" : "s"}; inspect it when exact wording or layout matters.`,
        whyItMatters: section.why,
        intuition: section.intuition,
        technicalDetail: `This page is linked to the Chapter 1 lecture source at PDF page ${page.page}. Atlas preserves the rendered page, extracted text, block type, bounding box, image ID, and parser reference separately.`,
        pitfall: section.pitfall,
        connection: `Use this page with the ${section.lessonIds.map(id => id.replace("dsa5104-", "")).join(" and ")} study track. Answer the Socratic checkpoint before moving on.`
      },
      textbookRefs: textbookRefs(section),
      referenceRefs: [],
      socraticQuestions: questions(section, title),
      lecturePriority: "core",
      sourceNote: page.reviewReasons && page.reviewReasons.length ? "Rendered page requires visual review; extracted text is a supporting layer." : "Extracted text is a reader layer; the rendered slide remains authoritative."
    };
  });
  const output = {
    schemaVersion: "nus.slide-set.v1",
    id: "dsa5104-chapter1",
    courseId: "DSA5104",
    lessonIds: [...new Set(SECTION_MAP.flatMap(section => section.lessonIds))],
    title: "Chapter 1 · Database systems and data management",
    summary: "All 52 slides from the supplied DSA5104 Chapter 1 lecture, with parallel extraction, page-level provenance, textbook pointers, and Socratic checkpoints.",
    source: { sourceId: SOURCE_ID, sourceType: "lecture", fileName: "chapter1.pdf", pageCount: extracted.pageCount, access: "local-only", assetPolicy: "page-renders-only", courseCodePrintedOnSlide: "DSA5104", atlasCourseId: "DSA5104" },
    extraction: { sourceJson: "data/extracted/DSA5104/chapter1.json", parser: extracted.extraction || null, markdownReaderView: "data/extracted/DSA5104/chapter1.md" },
    slides
  };
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`DSA5104 CHAPTER 1 SLIDES GREEN · ${slides.length} slides · ${OUTPUT}`);
  return output;
}

if (require.main === module) build();
module.exports = { build, sectionFor };
