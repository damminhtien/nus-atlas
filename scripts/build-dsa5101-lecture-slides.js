/* Build the DSA5101 Lecture 1 reader from normalized page extraction.
 * The rendered page stays the visual source; authored guidance is deliberately
 * labeled as a study layer and never replaces extracted text or provenance. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EXTRACTION = path.join(ROOT, "data", "extracted", "DSA5101", "lec1---assoc-rules,-frequent-itemsets.json");
const OUTPUT = path.join(ROOT, "content", "courses", "DSA5101", "slides", "dsa5101-lecture1.json");
const SOURCE_ID = "DSA5101/Lec1 - Assoc Rules, Frequent itemsets.pdf";
const IMAGE_ROOT = "assets/nus/dsa5101/lecture1";

const SECTION_MAP = [
  { from: 1, to: 3, title: "Course orientation", lessonIds: ["dsa5101-orientation"], why: "This opening establishes the course scope, assessment boundary, and the reason scalable data-mining methods are needed.", intuition: "Scale changes what can fit in memory, how often data can be scanned, and which errors are acceptable.", pitfall: "Do not treat the textbook title or a broad industry example as a promise that every technique is equally examinable." },
  { from: 4, to: 16, title: "Why big data needs scalable methods", lessonIds: ["dsa5101-orientation"], why: "These pages motivate data mining through scale, false discoveries, data types, and computation models.", intuition: "The algorithm is part of the model: storage, passes, communication, and approximation determine whether a method is usable.", pitfall: "A pattern found after searching many combinations is not automatically meaningful; account for the search space and validation evidence." },
  { from: 17, to: 31, title: "Frequent itemsets and association rules", lessonIds: ["dsa5101-frequent-itemsets"], why: "This is the lecture core for basket modeling, support, confidence, interest, and the association-rule mining objective.", intuition: "First identify itemsets that occur often enough, then derive directional rules and compare them with the consequent base rate.", pitfall: "High confidence alone can be misleading when the consequent is common; keep support, confidence, and interest distinct." },
  { from: 32, to: 50, title: "Apriori and memory-aware counting", lessonIds: ["dsa5101-frequent-itemsets"], why: "These pages turn the frequent-itemset definition into a scalable multi-pass algorithm and use downward closure to prune candidates.", intuition: "If a subset is not frequent, no superset can be frequent, so memory and counting effort can be spent only on plausible candidates.", pitfall: "Candidate pruning reduces work but does not remove the need to verify counts against the full dataset." },
  { from: 51, to: 75, title: "Hashing and PCY refinements", lessonIds: ["dsa5101-frequent-itemsets"], why: "Hash buckets and bitmaps reduce candidate-pair memory pressure while preserving a verifiable second pass.", intuition: "A frequent pair must land in a frequent bucket, so bucket evidence can safely filter candidates even though it cannot certify each pair individually.", pitfall: "A frequent bucket may contain many infrequent pairs; hashing creates false positives for candidates, not false negatives when counts are correct." },
  { from: 76, to: 88, title: "Fewer-pass algorithms", lessonIds: ["dsa5101-frequent-itemsets"], why: "Sampling, SON, and Toivonen show how to trade passes and memory against candidate verification and false-negative risk.", intuition: "Approximation is useful only when the second pass restores the guarantee that matters for the task.", pitfall: "Do not claim that a sample-only result has no false negatives; inspect the verification and negative-border logic." },
  { from: 89, to: 90, title: "Lecture synthesis", lessonIds: ["dsa5101-frequent-itemsets"], why: "The summary consolidates the vocabulary and algorithms that should be retrievable before working the assignment.", intuition: "A strong answer links the business question to the data model, metric, pruning rule, memory plan, and correctness check.", pitfall: "Memorizing algorithm names without stating the invariant will not transfer to a new basket-counting problem." }
];

function sectionFor(page) {
  return SECTION_MAP.find(section => page >= section.from && page <= section.to) || SECTION_MAP[SECTION_MAP.length - 1];
}

function titleFor(page) {
  const lines = page.blocks.flatMap(block => String(block.text || "").split(/\n/)).map(line => line.trim()).filter(Boolean);
  const candidate = lines.find(line => line.length >= 4 && !/^\d+$/.test(line) && !line.startsWith("•")) || `Lecture 1 · slide ${page.page}`;
  return candidate.replace(/\s+/g, " ").slice(0, 100);
}

function sourceRef(page, role = "Lecture 1 slide") {
  return { sourceId: SOURCE_ID, sourceType: "lecture", page, role, status: "current" };
}

function textbookRefs(section) {
  if (section.title.includes("Frequent") || section.title.includes("Apriori") || section.title.includes("Hashing") || section.title.includes("Fewer")) {
    return [{ sourceId: "DSA5101/Reference textbook MMDS 3rd Edition.pdf", page: 214, sourceType: "textbook", role: "optional frequent-itemset depth", status: "course-depth" }];
  }
  return [];
}

function questions(section, title) {
  const safeTitle = title.replace(/<\s*2/g, "fewer than two");
  const primary = section.title.includes("Frequent") || section.title.includes("Apriori") || section.title.includes("Hashing") || section.title.includes("Fewer")
    ? {
      type: "distinguish",
      prompt: `What invariant or metric makes the idea on “${safeTitle}” safe to use at scale?`,
      answer: "State the counting or pruning condition, then explain what must still be verified on the full dataset.",
      hint: "Name the guarantee before naming the optimization."
    }
    : {
      type: "critique",
      prompt: `What evidence would you need before trusting the claim on “${safeTitle}” for a new dataset?`,
      answer: "Check the data scale, representation, computation model, evaluation criterion, and the assumptions behind the proposed method.",
      hint: "Separate an illustrative example from a general guarantee."
    };
  return [
    primary,
    {
      type: "transfer",
      prompt: `How would the reasoning on “${safeTitle}” change if the dataset no longer fit in memory?`,
      answer: section.title.includes("Frequent") || section.title.includes("Apriori") || section.title.includes("Hashing") || section.title.includes("Fewer")
        ? "Reconsider the number of passes, communication cost, candidate representation, and whether a bitmap, sample, or verification pass is needed."
        : "Choose a representation and computation model that controls storage and passes, then state the approximation or validation trade-off.",
      hint: "Think about memory, passes, and verification together."
    }
  ];
}

function build() {
  const extracted = JSON.parse(fs.readFileSync(EXTRACTION, "utf8"));
  if (extracted.sourceId !== SOURCE_ID || extracted.pageCount !== 90) throw new Error(`Unexpected DSA5101 extraction: ${extracted.sourceId} / ${extracted.pageCount} pages`);
  const slides = extracted.pages.map(page => {
    const section = sectionFor(page.page);
    const title = titleFor(page);
    const blocks = page.blocks.map(block => ({
      blockId: block.blockId,
      type: block.type,
      text: block.text || "",
      page: block.page,
      sourceId: block.sourceId,
      bbox: block.bbox,
      imageId: block.imageId || null
    }));
    return {
      slideId: `DSA5101-L1-S${String(page.page).padStart(2, "0")}`,
      slideNumber: page.page,
      pdfPage: page.page,
      title,
      kind: "lecture-source",
      status: page.reviewReasons && page.reviewReasons.length ? "needs-review" : "reviewed",
      assetPath: `${IMAGE_ROOT}/slide-${String(page.page).padStart(2, "0")}.jpg`,
      sourceRef: sourceRef(page.page),
      extraction: {
        schemaVersion: "nus.lecture-slide-extraction.v1",
        sourceId: SOURCE_ID,
        page: page.page,
        status: page.status,
        reviewReasons: page.reviewReasons || [],
        text: blocks.map(block => block.text).filter(Boolean).join("\n"),
        blocks
      },
      explanation: {
        whatYouSee: `The rendered page belongs to the “${section.title}” block. Its source layer contains ${blocks.length} page-aware extraction block${blocks.length === 1 ? "" : "s"}; inspect that layer when exact wording or layout matters.`,
        whyItMatters: section.why,
        intuition: section.intuition,
        technicalDetail: `This page is linked to Lecture 1 page ${page.page}. The reader preserves the original page image, block type, bounding box, image ID, and parser reference instead of rewriting the source as prose.`,
        pitfall: section.pitfall,
        connection: `Use this page with the ${section.lessonIds.map(id => id.replace("dsa5101-", "")).join(" and ")} lesson track. After reading, answer the Socratic checkpoint before moving on.`
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
    id: "dsa5101-lecture1",
    courseId: "DSA5101",
    lessonIds: ["dsa5101-orientation", "dsa5101-frequent-itemsets"],
    title: "Lecture 1 · Big Data and frequent itemsets",
    summary: "All 90 slides from the supplied DSA5101 Lecture 1, with parallel extraction, page-level provenance, source-layer inspection, textbook pointers, and Socratic checkpoints.",
    source: { sourceId: SOURCE_ID, sourceType: "lecture", fileName: "Lec1 - Assoc Rules, Frequent itemsets.pdf", pageCount: extracted.pageCount, access: "local-only", assetPolicy: "page-renders-only", courseCodePrintedOnSlide: "DSA5101", atlasCourseId: "DSA5101" },
    extraction: { sourceJson: "data/extracted/DSA5101/lec1---assoc-rules,-frequent-itemsets.json", parser: extracted.extraction || null, markdownReaderView: "data/extracted/DSA5101/lec1---assoc-rules,-frequent-itemsets.md" },
    slides
  };
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`DSA5101 LECTURE SLIDES GREEN · ${slides.length} slides · ${OUTPUT}`);
  return output;
}

if (require.main === module) build();

module.exports = { build, sectionFor };
