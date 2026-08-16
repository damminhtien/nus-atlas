/* Build the DSA5104 chapter1 slide reader from normalized JSON extraction. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EXTRACTION = path.join(ROOT, "data", "extracted", "DSA5104", "chapter1.json");
const OUTPUT = path.join(ROOT, "content", "courses", "DSA5104", "slides", "dsa5104-chapter1.json");
const SOURCE_ID = "DSA5104/chapter1.pdf";
const IMAGE_ROOT = "assets/nus/dsa5104/chapter1";

const SECTION_MAP = [
  { from: 1, to: 11, title: "Course scope and database purpose", lessonIds: ["dsa5104-orientation"], claim: "A DBMS is the controlled layer that stores shared data and protects meaningful access through models, constraints, transactions, and recovery.", why: "The opening is the vocabulary boundary for every later database design and query question.", intuition: "A database is not merely a file cabinet: it is data plus guarantees about who may read, change, and recover it.", mechanism: "When evaluating a database feature, name the data being protected, the invariant it enforces, and the failure or concurrent access it handles.", useWhen: "Use this section to classify whether a requirement is about data modeling, integrity, query access, concurrency, security, or recovery.", pitfall: "Do not reduce a DBMS to storage; integrity, concurrency, security, and recovery are part of the system.", questions: [
    { type: "scope", prompt: "A spreadsheet can store rows. What additional guarantee makes a DBMS necessary for shared applications?", answer: "A DBMS provides a formal model plus integrity, concurrent-access, authorization, recovery, and query-processing guarantees that remain meaningful across users and failures.", hint: "Storage is only one responsibility." },
    { type: "diagnose", prompt: "A system returns the right rows but loses an update after a crash. Which DBMS responsibility has failed?", answer: "Recovery or transaction durability has failed; query correctness alone does not guarantee that committed state survives a crash.", hint: "Separate logical result from failure behavior." }
  ] },
  { from: 12, to: 24, title: "Models, semi-structured data, and abstraction", lessonIds: ["dsa5104-orientation", "dsa5104-relational-model", "dsa5104-semi-structured"], claim: "A data model determines which structure and constraints are explicit; schema, instance, view, and storage level answer different questions about the same data.", why: "Many exam errors come from confusing the allowed design with the current rows or with the way those rows are stored.", intuition: "Schema is the rulebook, instance is the current state, view is a chosen presentation, and physical level is the implementation.", mechanism: "For any diagram or record, label its level first, then state what information or constraint is preserved when moving to the next level.", useWhen: "Use this section to translate between relational, ER, XML/JSON, logical, view, and physical descriptions without treating them as interchangeable.", pitfall: "Do not confuse a schema with the current instance, or a view with the physical storage layout.", questions: [
    { type: "distinguish", prompt: "A table has the right columns but contains an invalid foreign-key value. Is the schema wrong, the instance wrong, or both?", answer: "The declared schema may be correct, but the current instance violates its integrity constraint; the DBMS should reject or prevent that state.", hint: "Separate allowed structure from current contents." },
    { type: "transfer", prompt: "Why can changing the physical storage layout leave a user's view unchanged?", answer: "The view and logical schema define the promised meaning, while the physical layer can change access paths or record placement as long as the same logical result is preserved.", hint: "This is the purpose of abstraction." }
  ] },
  { from: 25, to: 32, title: "DDL, DML, and SQL", lessonIds: ["dsa5104-sql-foundations"], claim: "DDL defines the allowed database structure, DML changes or reads instances, and declarative SQL states a result without prescribing the physical algorithm.", why: "The distinction explains why a query can be optimized internally without changing its promised relation result.", intuition: "SQL is a contract for a result; the engine chooses scans, indexes, joins, and grouping strategies underneath.", mechanism: "Classify each statement by whether it changes schema, changes rows, or asks for a result; then reason about filtering, grouping, and aggregate timing.", useWhen: "Use this section to place predicates in WHERE versus HAVING and to separate logical query semantics from execution plans.", pitfall: "Keep schema definition, data updates, and query semantics distinct.", questions: [
    { type: "derive", prompt: "Why cannot a predicate on COUNT appear in WHERE for a grouped query?", answer: "WHERE filters individual rows before groups and aggregates exist; an aggregate predicate belongs after grouping, where HAVING can inspect the group result.", hint: "Follow the logical query stages." },
    { type: "counterexample", prompt: "Give a case where two SQL queries return different answers even though they mention the same tables and predicate.", answer: "Moving a row predicate across an outer join or changing whether it is applied before grouping can remove rows or alter group counts, so textual similarity does not preserve semantics.", hint: "Use join or aggregate timing." }
  ] },
  { from: 33, to: 38, title: "Design and storage manager", lessonIds: ["dsa5104-database-design", "dsa5104-query-processing"], claim: "Logical design protects meaning through keys and relationships; the storage manager turns that design into pages, records, buffers, metadata, and access paths.", why: "The lecture connects schema decisions to the cost of finding and updating records without confusing an index with an integrity constraint.", intuition: "Keys answer ‘which row is this?’; indexes answer ‘how can I find it quickly?’; they can cooperate but are not the same.", mechanism: "For a relationship, identify entity keys and cardinality first; for a performance choice, estimate pages touched and selectivity before choosing an index or scan.", useWhen: "Use this section to design a many-to-many relation, place foreign keys, or justify an access path.", pitfall: "An index is an access path, not a replacement for a key or integrity constraint.", questions: [
    { type: "design", prompt: "Why does a many-to-many relationship need a separate relation instead of a repeated column?", answer: "The junction relation stores one pair of endpoint keys per relationship and can enforce uniqueness and both foreign-key constraints without violating first normal form.", hint: "Represent each association as a tuple." },
    { type: "compare", prompt: "When can a full table scan beat an index lookup?", answer: "If many rows qualify, index traversal plus scattered base-row fetches can touch more pages than a sequential scan, so selectivity and locality matter.", hint: "Compare pages, not SQL length." }
  ] },
  { from: 39, to: 40, title: "Query processor", lessonIds: ["dsa5104-query-processing"], claim: "The query processor translates a declarative query into an optimized physical plan and evaluates it while preserving the same logical result.", why: "This is the bridge between relational semantics and the engineering choices that determine runtime.", intuition: "Optimization may change the route, but never the destination promised by the query.", mechanism: "Separate parse/translate, logical rewrite, physical-plan selection, and evaluation; test an optimization by comparing results, not only runtime.", useWhen: "Use this section to explain why an optimizer may reorder joins or choose an index without changing query meaning.", pitfall: "Optimization may change execution strategy but must preserve the logical result.", questions: [
    { type: "invariant", prompt: "What must remain unchanged when an optimizer replaces a table scan with an index plan?", answer: "The resulting relation under the database's semantics must remain the same; only the physical access path and cost may change.", hint: "State the semantic invariant." },
    { type: "evidence", prompt: "What evidence is needed before calling an optimized plan better?", answer: "Verify equal results and measure cost under representative data, selectivity, statistics, and workload conditions; one benchmark is not a universal guarantee.", hint: "Correctness precedes performance." }
  ] },
  { from: 41, to: 45, title: "Transactions and application architecture", lessonIds: ["dsa5104-transactions-architecture", "dsa5104-database-design"], claim: "A transaction groups the reads and writes needed for one business invariant, while application architecture decides where clients, logic, and data services communicate.", why: "The key reasoning move is to identify the logical unit that must be atomic and isolated, not merely count SQL statements.", intuition: "Two individually valid writes can be jointly invalid if a failure or concurrent reader observes only half of the business operation.", mechanism: "Write the invariant, mark its dependent operations, then ask what atomicity, isolation, and recovery must guarantee at commit or abort.", useWhen: "Use this section for transfer, enrollment, reservation, or any workflow spanning multiple database operations.", pitfall: "Do not treat two valid writes as safe when their business invariant requires atomicity.", questions: [
    { type: "trace", prompt: "Why must a bank transfer debit and credit belong to one transaction?", answer: "The invariant is conservation of value between accounts. If only one write commits, the database exposes a state that cannot represent a completed transfer.", hint: "Find the failure point between the writes." },
    { type: "compare", prompt: "How is isolation different from atomicity in that transfer?", answer: "Atomicity prevents a partial transfer from committing; isolation controls what concurrent transactions can observe or interfere with before the transfer commits.", hint: "All-or-nothing is not the same as visibility." }
  ] },
  { from: 46, to: 50, title: "Users, history, and big-data systems", lessonIds: ["dsa5104-transactions-architecture", "dsa5104-semi-structured"], claim: "As database systems scale from one machine to parallel and distributed deployments, relational meaning remains while placement, movement, coordination, and failure costs change.", why: "The closing pages connect classical DBMS semantics to the data-management systems used in modern data science.", intuition: "Scale changes the physical path to a result, not the need to define what a correct result means.", mechanism: "Measure partitioning, data movement, coordination, skew, and recovery separately while preserving schema and transaction semantics.", useWhen: "Use this section to reason about why a short query can trigger an expensive distributed job.", pitfall: "A distributed deployment changes the physical cost model; it does not remove the need for clear semantics.", questions: [
    { type: "diagnose", prompt: "Why can a short GROUP BY query be expensive on a cluster?", answer: "Matching keys may be spread across partitions, so the engine must shuffle records, serialize data, coordinate stages, and wait for stragglers before producing groups.", hint: "Trace the physical work hidden by declarative syntax." },
    { type: "transfer", prompt: "What must be preserved when a single-machine table operation is distributed?", answer: "The logical relation result and declared constraints must remain correct, while the implementation makes partitioning, movement, ordering, and failure recovery explicit.", hint: "Semantics stay; physical costs change." }
  ] },
  { from: 51, to: 52, title: "Lecture synthesis and homework", lessonIds: ["dsa5104-orientation", "dsa5104-sql-foundations"], claim: "The chapter's reasoning chain is model and constraints, schema and instance, declarative query, physical plan, transaction boundary, and evidence of correctness.", why: "The summary is useful only if it lets you solve a new database scenario, not if it merely lists chapter headings.", intuition: "Start from the invariant and user question, choose the representation, then select the query and physical mechanism that preserves meaning.", mechanism: "For a new problem, write the schema constraint, expected relation result, transaction boundary, and one measurement or validation query.", useWhen: "Use this section to retrieve the whole chapter before attempting homework or designing a small schema.", pitfall: "Do not skip the small manual exercises; they expose whether the terms are operational.", questions: [
    { type: "synthesis", prompt: "Given a new data-management task, what order should you use to reason about it?", answer: "State the entities and constraints, distinguish schema from instance, define the desired result, identify the transaction boundary if updates interact, then choose and measure a physical plan.", hint: "Move from meaning to mechanism." },
    { type: "critique", prompt: "What would make a database solution correct but still unsuitable for production?", answer: "It may preserve the logical result while violating latency, concurrency, recovery, security, or scale requirements; correctness and operational suitability must both be tested.", hint: "Correctness is necessary, not sufficient." }
  ] }
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
function questions(section) {
  return section.questions;
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
