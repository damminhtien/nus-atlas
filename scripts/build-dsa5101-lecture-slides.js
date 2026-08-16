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
  { from: 1, to: 3, title: "Course orientation", lessonIds: ["dsa5101-orientation"], claim: "Data mining turns large collections into patterns or decisions, but scale changes which representations, passes, and error controls are feasible.", why: "The opening defines the systems-and-evidence boundary for every later mining algorithm.", intuition: "A useful pattern is not just statistically visible; it must be discoverable, verifiable, and actionable under the available computation budget.", mechanism: "For a mining claim, record the data representation, search space, number of scans, memory plan, and validation criterion.", useWhen: "Use this section to turn an application request into a measurable data-mining problem.", pitfall: "Do not treat the textbook title or a broad industry example as a promise that every technique is equally examinable.", questions: [
    { type: "scope", prompt: "What makes a discovered pattern useful rather than merely present in the data?", answer: "It must be defined under a clear representation and metric, survive the relevant validation or support threshold, and matter to the downstream decision.", hint: "Presence is not usefulness." },
    { type: "evidence", prompt: "What should you measure before claiming a mining method scales?", answer: "Measure memory, number of full scans, candidate growth, runtime as data grows, and any approximation or false-discovery trade-off.", hint: "Look beyond one runtime." }
  ] },
  { from: 4, to: 16, title: "Why big data needs scalable methods", lessonIds: ["dsa5101-orientation"], claim: "Data volume, variety, and search multiplicity make representation and computation choices part of the mining problem itself.", why: "These pages explain why an exact-looking method can become unusable or statistically misleading when the search space grows.", intuition: "Scale creates both a systems problem and a multiple-search problem: more candidates mean more work and more opportunities for spurious findings.", mechanism: "Separate storage limits, scan cost, candidate count, and validation error; changing one may improve runtime while worsening reliability.", useWhen: "Use this section to compare a streaming, sampling, or distributed method with an exact in-memory baseline.", pitfall: "A pattern found after searching many combinations is not automatically meaningful; account for the search space and validation evidence.", questions: [
    { type: "diagnose", prompt: "A mining pipeline is fast but produces many unstable patterns. Which part of the design needs inspection?", answer: "Inspect the search space, support or significance threshold, repeated validation, and whether the speedup removed evidence needed to control false discoveries.", hint: "Runtime and reliability are separate axes." },
    { type: "tradeoff", prompt: "Why can reducing the number of data scans change the statistical interpretation of the result?", answer: "A fewer-pass or sampled method may see less evidence or rely on candidates formed from a subset, so its approximation and false-negative guarantees must be stated.", hint: "Fewer scans can mean less information." }
  ] },
  { from: 17, to: 31, title: "Frequent itemsets and association rules", lessonIds: ["dsa5101-frequent-itemsets"], claim: "Association mining first measures joint occurrence of an itemset, then evaluates a directional rule against its antecedent and consequent base rates.", why: "Support, confidence, and lift answer different questions; confusing them is a direct correctness error.", intuition: "Support asks ‘does this combination recur?’; confidence asks ‘given the left side, how often is the right side present?’; lift asks whether that is more than the base rate.", mechanism: "Count the joint and marginal occurrences before computing each metric, then test whether a high confidence is merely inherited from a common consequent.", useWhen: "Use this section to interpret a basket rule or construct a counterexample to a misleading metric.", pitfall: "High confidence alone can be misleading when the consequent is common; keep support, confidence, and interest distinct.", questions: [
    { type: "counterexample", prompt: "How can a rule have high confidence but low practical interest?", answer: "If the consequent appears in almost every basket, the rule can be confident even when the antecedent adds little information; compare confidence with the consequent's base rate.", hint: "Make the right-hand item common." },
    { type: "derive", prompt: "Which counts must be known to compute confidence and lift for a rule?", answer: "You need the antecedent count, the joint antecedent-and-consequent count, and the consequent count or its support; each denominator answers a different conditioning question.", hint: "Track the denominator of each metric." }
  ] },
  { from: 32, to: 50, title: "Apriori and memory-aware counting", lessonIds: ["dsa5101-frequent-itemsets"], claim: "Apriori makes candidate generation scalable by using downward closure: an infrequent itemset cannot have a frequent superset.", why: "The pruning rule is a correctness invariant, not merely a heuristic speedup.", intuition: "Before counting a larger combination, check whether all of its smaller faces could still be frequent.", mechanism: "Generate candidates from frequent subsets, prune candidates with an infrequent subset, then rescan the data to verify the surviving counts.", useWhen: "Use this section to prove whether a pruning step is safe and to estimate its pass and memory cost.", pitfall: "Candidate pruning reduces work but does not remove the need to verify counts against the full dataset.", questions: [
    { type: "prove", prompt: "Why is it safe to discard a candidate when one of its subsets is infrequent?", answer: "Every transaction containing the candidate also contains that subset, so the candidate cannot occur more often than the infrequent subset.", hint: "Use set containment of baskets." },
    { type: "scope", prompt: "What does downward closure not tell you about confidence or causal value?", answer: "It only constrains support of itemsets and their supersets; it does not guarantee that a rule is predictive, interesting, or causal.", hint: "Do not extend the invariant beyond its metric." }
  ] },
  { from: 51, to: 75, title: "Hashing and PCY refinements", lessonIds: ["dsa5101-frequent-itemsets"], claim: "PCY uses bucket counts as a safe memory filter: an infrequent bucket cannot contain a frequent pair, but a frequent bucket may contain many false candidate pairs.", why: "The distinction between candidate filtering and final certification is the conceptual core of hashing refinements.", intuition: "A bucket is a coarse summary; it can rule out pairs but cannot prove an individual pair frequent.", mechanism: "Hash pairs into buckets during an early pass, mark frequent buckets, intersect that bitmap with pair candidates, and count surviving pairs exactly later.", useWhen: "Use this section to reason about bitmap memory, false positives, and why the second pass remains necessary.", pitfall: "A frequent bucket may contain many infrequent pairs; hashing creates false positives for candidates, not false negatives when counts are correct.", questions: [
    { type: "counterexample", prompt: "Why does a frequent hash bucket not prove that a particular pair is frequent?", answer: "Several pairs collide into the same bucket, so the bucket count combines their occurrences; the individual pair still needs its own count.", hint: "A hash bucket loses pair identity." },
    { type: "invariant", prompt: "What must be true for PCY pruning not to discard a truly frequent pair?", answer: "Every occurrence of a frequent pair contributes to its bucket, so that bucket must meet the bucket threshold whenever the pair could meet the pair threshold.", hint: "Relate pair count to bucket count." }
  ] },
  { from: 76, to: 88, title: "Fewer-pass algorithms", lessonIds: ["dsa5101-frequent-itemsets"], claim: "Sampling, SON, and Toivonen trade full scans and memory against candidate coverage, verification, and false-negative control.", why: "These algorithms are useful only when the guarantee lost by approximation is named and the verification step is understood.", intuition: "A sample proposes what to count; a full-data check decides what to trust.", mechanism: "For each method, identify how candidates are proposed, whether local thresholds are combined, what a negative border does, and how a second pass restores confidence.", useWhen: "Use this section to choose an approximate mining method under a memory or pass budget.", pitfall: "Do not claim that a sample-only result has no false negatives; inspect the verification and negative-border logic.", questions: [
    { type: "compare", prompt: "Why can a sample discover a candidate that is not globally frequent?", answer: "Sampling variation can make a locally common itemset appear above the sample threshold even when its full-data support is lower; global verification removes that false positive.", hint: "Local frequency is evidence, not certification." },
    { type: "failure", prompt: "What is the purpose of Toivonen's negative border?", answer: "It records minimally infrequent itemsets whose unexpected appearance in the full pass can reveal that the sample missed a globally frequent candidate.", hint: "It detects a dangerous false negative." }
  ] },
  { from: 89, to: 90, title: "Lecture synthesis", lessonIds: ["dsa5101-frequent-itemsets"], claim: "The lecture's reusable pipeline is business question, basket representation, support metric, candidate-pruning invariant, memory/pass plan, and final verification.", why: "A summary is valuable only if it lets you design or critique a new mining pipeline.", intuition: "Start from what counts as a meaningful co-occurrence, then choose the cheapest algorithm that preserves that evidence.", mechanism: "For a new task, write the transaction model, target metric, pruning proof, resource budget, approximation risk, and validation step before naming Apriori or PCY.", useWhen: "Use this section as a retrieval checklist before assignments or when comparing association-mining algorithms.", pitfall: "Memorizing algorithm names without stating the invariant will not transfer to a new basket-counting problem.", questions: [
    { type: "synthesis", prompt: "What five items should appear in a strong answer comparing two frequent-itemset algorithms?", answer: "State the candidate representation, pruning or correctness invariant, number of passes, memory and communication cost, and how final counts or approximation errors are verified.", hint: "Compare guarantees and resources together." },
    { type: "design", prompt: "When would you prefer an approximate fewer-pass method over exact Apriori?", answer: "When the dataset or pass budget makes exact scans too expensive and the task can tolerate a stated approximation risk that is checked by verification or validation.", hint: "The choice depends on the decision tolerance." }
  ] }
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

function questions(section) {
  return section.questions;
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
        whatYouSee: section.claim,
        whyItMatters: section.why,
        intuition: section.intuition,
        technicalDetail: section.mechanism,
        pitfall: section.pitfall,
        connection: section.useWhen
      },
      textbookRefs: textbookRefs(section),
      referenceRefs: [],
      socraticQuestions: questions(section),
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
