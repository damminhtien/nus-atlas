/* Build the DSA5208 slide readers from page-aware PDF extraction. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const COURSE = "DSA5208";
const TEXTBOOK = "DSA5208/Distributed Systems textbook pointer";
const REFERENCE = "L. Lamport, Time, Clocks, and the Ordering of Events in a Distributed System";

const CONFIGS = [
  {
    id: "dsa5208-lec0",
    sourceId: "DSA5208/Lec0.pdf",
    title: "Lecture 0 · Overview",
    summary: "The supplied overview lecture with parallel extraction, page-level provenance, course-scope notes, and Socratic checkpoints.",
    extraction: "data/extracted/DSA5208/lec0.json",
    markdown: "data/extracted/DSA5208/lec0.md",
    assetRoot: "assets/nus/dsa5208/lec0",
    lessonIds: ["dsa5208-orientation", "dsa5208-consistency-spark"],
    sections: [
      { from: 1, to: 2, title: "Course scope and assessment", priority: "context", lessonIds: ["dsa5208-orientation"], claim: "The course frames distributed computing as a systems problem: scale, communication, coordination, and failure must be reasoned about together.", why: "These pages define the boundary of what a later algorithm claim must explain and how project evidence should be collected.", intuition: "A distributed result is never only an algorithm; it is an algorithm under a system model and measurement protocol.", mechanism: "Read every performance claim as a tuple: workload, partitioning, worker count, communication behavior, coordination behavior, and failure assumptions.", useWhen: "Use this page to turn a vague claim such as ‘scales well’ into a testable experiment.", pitfall: "Do not invent dates or later lecture details that are not present in the supplied overview.", questions: [
        { type: "scope", prompt: "What three pieces must accompany a claim that a distributed design is faster?", answer: "State the workload and partitioning, the system conditions such as worker count and network, and the metric or experiment that supports the comparison.", hint: "A runtime number without conditions is not a reproducible claim." },
        { type: "counterexample", prompt: "Give one situation in which a locally faster algorithm loses after deployment across workers.", answer: "A design with lower local compute can still lose if it causes more shuffle, serialization, synchronization, or recovery traffic.", hint: "Separate local work from system work." }
      ] },
      { from: 3, to: 9, title: "Scale, applications, hardware, and failure", priority: "context", lessonIds: ["dsa5208-orientation"], claim: "Distributed computation is motivated by data and workload demands that exceed the capacity, throughput, or reliability of one machine.", why: "The motivation explains why scale-out introduces new bottlenecks instead of simply multiplying single-machine speed.", intuition: "Adding machines buys capacity and parallelism, but it also adds links, boundaries, and more places to fail.", mechanism: "Trace the critical path: partition input, execute local work, move data when dependencies cross partitions, synchronize stages, and recover when a worker fails.", useWhen: "Use this page when deciding whether a workload should be partitioned, replicated, streamed, or kept local.", pitfall: "Do not report one runtime without partition, network, coordination, and failure context.", questions: [
        { type: "diagnose", prompt: "Throughput stops improving after adding workers. Which measurements distinguish communication saturation from data skew?", answer: "Inspect bytes transferred and network wait for communication saturation; inspect partition sizes, task durations, and the slowest worker for skew.", hint: "Measure the distribution across workers, not only the average." },
        { type: "transfer", prompt: "Why can replication improve availability while increasing the cost of an update?", answer: "Replicas provide another copy after a failure, but an update may need additional messages, ordering, or coordination to keep copies consistent.", hint: "Availability and update coordination pull in different directions." }
      ] },
      { from: 10, to: 11, title: "Distributed-algorithm challenges", priority: "context", lessonIds: ["dsa5208-orientation"], claim: "The lecture's challenge list is a dependency map: synchronization, consistency, storage, faults, and scalability constrain one another.", why: "Later clock and ordering algorithms solve only a selected part of this larger systems problem.", intuition: "Improving one axis can make another axis more expensive: stronger ordering usually needs more metadata or waiting.", mechanism: "For each proposed mechanism, name the guarantee it adds, the state it stores, the messages it sends, and the failure case it covers.", useWhen: "Use this page to compare two designs without collapsing all trade-offs into ‘faster’ or ‘more consistent’.", pitfall: "A faster local computation can still lose to communication or coordination overhead.", questions: [
        { type: "compare", prompt: "What must you name before claiming that one consistency mechanism is stronger than another?", answer: "State the observable ordering or visibility guarantee, the execution model, and the additional metadata, waiting, or messages required.", hint: "Strength is relative to a guarantee." },
        { type: "failure", prompt: "Which question exposes whether a proposed mechanism handles failures or only normal execution?", answer: "Ask what happens when a message is delayed, duplicated, lost, or a process stops between two protocol steps.", hint: "Insert one failure into the protocol trace." }
      ] },
      { from: 12, to: 15, title: "First six lecture themes", priority: "context", lessonIds: ["dsa5208-orientation", "dsa5208-consistency-spark"], claim: "The roadmap links physical time, logical time, delivery order, consistency, Spark, distributed algorithms, MLlib, and cloud work into one course sequence.", why: "The roadmap is examinable as scope and dependency information, but it is not evidence for derivations whose detailed lectures are not supplied.", intuition: "A roadmap tells you what concept should follow; it does not give enough information to solve its later exercises.", mechanism: "Separate three statuses while studying: current source derivation, textbook depth, and roadmap pointer awaiting its own lecture source.", useWhen: "Use this page to plan retrieval and avoid learning a roadmap label as if it were a completed algorithm.", pitfall: "Keep roadmap context separate from fully taught lecture derivations.", questions: [
        { type: "provenance", prompt: "What would be missing if the overview names Spark but no Spark lecture or exercise is supplied?", answer: "The topic has scope evidence but lacks the definitions, assumptions, derivations, examples, and source pages needed for full lecture coverage.", hint: "A topic label is not a study package." },
        { type: "planning", prompt: "How should you schedule a roadmap topic whose detailed source is still pending?", answer: "Keep a short context note and mark detailed coverage pending; do not fill the gap with unlabeled material that looks official.", hint: "Preserve source boundaries." }
      ] },
      { from: 16, to: 16, title: "Project themes", priority: "context", lessonIds: ["dsa5208-orientation", "dsa5208-consistency-spark"], claim: "A project becomes a learning experiment when its system setting, claim, workload, and measurements are explicit.", why: "The project themes connect lecture vocabulary to evidence that can be inspected rather than to a demo alone.", intuition: "A good project is a controlled argument: change one system factor, observe a consequence, and state the boundary of the result.", mechanism: "Record input size, partitioning, worker count, shuffle or coordination cost, failure behavior, and the metric used to accept or reject the claim.", useWhen: "Use this page when turning a project idea into an experiment plan or interpreting a benchmark plot.", pitfall: "Do not mark later project topics as source-complete until their materials are added.", questions: [
        { type: "design", prompt: "What evidence would turn ‘consistency affects performance’ into a testable project question?", answer: "Choose a consistency mechanism and workload, vary the relevant system condition, measure latency or throughput plus coordination cost, and state the observed guarantee.", hint: "Define the intervention and the measurement." },
        { type: "critique", prompt: "Why is a single successful demo weak evidence for a distributed-system claim?", answer: "It does not reveal how the result changes with scale, partitioning, contention, failures, or a different workload.", hint: "Ask what happens outside the demo path." }
      ] }
    ]
  },
  {
    id: "dsa5208-lec1",
    sourceId: "DSA5208/Lec1.pdf",
    title: "Lecture 1 · Physical and Logical Times",
    summary: "The supplied Lecture 1 reader with parallel extraction, exact page/block provenance, textbook pointers, and Socratic checkpoints.",
    extraction: "data/extracted/DSA5208/lec1.json",
    markdown: "data/extracted/DSA5208/lec1.md",
    assetRoot: "assets/nus/dsa5208/lec1",
    lessonIds: ["dsa5208-distributed-models", "dsa5208-happens-before", "dsa5208-communication-ordering", "dsa5208-physical-clocks", "dsa5208-lamport-scalar", "dsa5208-vector-clocks", "dsa5208-compressed-timestamps"],
    sections: [
      { from: 1, to: 4, title: "Distributed-system models", priority: "core", lessonIds: ["dsa5208-distributed-models"], claim: "A distributed system is modeled as independent processes with private state that interact through messages; a global event history is assembled from local histories.", why: "Every later ordering claim depends on this boundary: processes cannot observe another process's state without communication.", intuition: "The diagram's lines are local timelines; only a message edge carries knowledge between timelines.", mechanism: "Write the local history of each process first, then add send-to-receive edges. Do not add an edge merely because two events are drawn at the same height.", useWhen: "Use this model before tracing causality, clock updates, or delivery guarantees.", pitfall: "Do not assume shared memory or a global clock when the lecture explicitly removes both.", questions: [
        { type: "derive", prompt: "A diagram aligns two events vertically on different processes but shows no message. Can you infer an order?", answer: "No. Visual alignment is not a causal rule; without a message path, local-order path, or transitive chain, the events may be concurrent.", hint: "List the allowed generators of the relation." },
        { type: "transfer", prompt: "What information must a process send if another process is expected to reason about its past?", answer: "It must send a message carrying enough state or metadata for the receiver to infer the relevant causal history.", hint: "Private memory makes knowledge transfer explicit." }
      ] },
      { from: 5, to: 6, title: "Happens-before and concurrency", priority: "core", lessonIds: ["dsa5208-happens-before"], claim: "Happens-before is a partial order generated by local order, send-before-receive, and transitive closure; concurrency means neither direction is derivable.", why: "This relation is the semantic target that logical clocks approximate or represent.", intuition: "Causality is a path question: can influence travel from one event to the other through permitted edges?", mechanism: "To prove order, exhibit a path. To prove concurrency, rule out both directed paths; failing to find one path is not enough.", useWhen: "Use it to grade an event trace, justify a delivery order, or test whether a timestamp comparison is too strong.", pitfall: "Not proving one direction is not enough; concurrency requires neither direction.", questions: [
        { type: "prove", prompt: "What is the shortest proof that one event happens-before another?", answer: "Give one valid local, message, or transitive path from the first event to the second.", hint: "A proof needs a path, not a visual impression." },
        { type: "counterexample", prompt: "Construct two events that are concurrent even though a total order could place one before the other.", answer: "Choose one event on each process with no message path in either direction. A tie-breaker may serialize them, but it does not create causality.", hint: "Separate implementation order from semantic order." }
      ] },
      { from: 7, to: 10, title: "Communication ordering", priority: "core", lessonIds: ["dsa5208-communication-ordering"], claim: "Non-FIFO, FIFO, and causal ordering provide progressively stronger delivery guarantees; FIFO constrains one channel, while causal order can cross channels.", why: "Exam questions often ask which guarantee is sufficient for a dependency and what metadata or waiting it costs.", intuition: "A receiver may see messages in an order different from the order in which their causes were created unless the protocol delays delivery.", mechanism: "For every guarantee, state its scope, the dependency it preserves, and the state needed to decide whether a message is safe to release.", useWhen: "Use it to choose a delivery contract or explain why one channel-local rule fails for a cross-process dependency.", pitfall: "FIFO is channel-local; it does not automatically preserve cross-process causal order.", questions: [
        { type: "counterexample", prompt: "Why can FIFO deliver a causally newer message before an older cause?", answer: "The two messages may travel on different channels, so FIFO constrains each channel separately and says nothing about their cross-channel causal dependency.", hint: "Draw two senders and one receiver." },
        { type: "design", prompt: "What must a causal-delivery protocol decide before releasing a message?", answer: "It must check whether all messages that causally precede the candidate have been delivered, or buffer the candidate until that condition holds.", hint: "The guarantee becomes a release condition." }
      ] },
      { from: 11, to: 14, title: "Physical clocks and NTP", priority: "core", lessonIds: ["dsa5208-physical-clocks"], claim: "Physical-clock synchronization estimates wall time from exchanged timestamps, but drift and asymmetric delay leave uncertainty and do not prove causality.", why: "The distinction between physical time and logical time is a central conceptual boundary in the lecture.", intuition: "Two clocks can agree closely and still observe events without a causal path; time closeness is not influence.", mechanism: "Compute round-trip delay from the four timestamps, state the symmetric-delay assumption, and keep the resulting uncertainty visible.", useWhen: "Use it for wall-clock coordination or delay estimation, not as a replacement for causal ordering.", pitfall: "Do not use a physical timestamp comparison as a causal proof.", questions: [
        { type: "calculate", prompt: "If the measured round trip becomes much larger, what part of the clock estimate becomes less trustworthy?", answer: "The delay split becomes more uncertain, especially if the two directions are not symmetric or queues change during the exchange.", hint: "Arithmetic can be correct while the model is weak." },
        { type: "compare", prompt: "Give one event-order question NTP cannot answer but a logical clock can address.", answer: "NTP cannot prove whether one event could have influenced another; a logical relation can preserve that causal-precedence implication.", hint: "Ask about influence rather than wall time." }
      ] },
      { from: 15, to: 19, title: "Logical clocks and Lamport scalar time", priority: "core", lessonIds: ["dsa5208-lamport-scalar"], claim: "Lamport scalar clocks update on local events and message receipt so causal precedence implies increasing timestamps, but the converse fails for concurrent events.", why: "The one-way guarantee is the exact distinction between a causal-preserving clock and a complete representation of concurrency.", intuition: "A scalar clock remembers ‘how late’ an event is in one number, not which process histories produced that number.", mechanism: "On receipt, take the maximum of local and received time, then increment. For any timestamp comparison, test whether it is a necessary implication or an invalid converse.", useWhen: "Use it to construct a causal-consistent total order or explain why scalar timestamps cannot detect every concurrent pair.", pitfall: "The converse of the Lamport implication is not generally true.", questions: [
        { type: "trace", prompt: "Why is incrementing after taking the maximum necessary at a receive event?", answer: "Without the increment, the receive could tie with the greatest known time; the strict increase is needed to place the receive after both local history and the received event.", hint: "Check the strict inequality required by causality." },
        { type: "counterexample", prompt: "Can two concurrent events receive different scalar timestamps? If so, what does that show?", answer: "Yes. Independent local progress can produce different numbers even without a causal path, so scalar order alone cannot prove causality.", hint: "The converse is the trap." }
      ] },
      { from: 20, to: 23, title: "Vector time", priority: "core", lessonIds: ["dsa5208-vector-clocks"], claim: "Vector clocks keep one causal-progress component per process, so componentwise dominance represents order and incomparability exposes concurrency.", why: "Vector time supplies the information that scalar time discards, at a metadata cost that grows with the number of processes.", intuition: "Each component answers ‘how much of process k's history is known?’; conflicting components mean independent progress.", mechanism: "Update the local component for local/send events, merge componentwise maxima on receipt, then compare every component before declaring order.", useWhen: "Use it to distinguish causal order from concurrency and to quantify the metadata cost of that distinction.", pitfall: "Vector order is componentwise, not lexicographic.", questions: [
        { type: "compare", prompt: "What does it mean when one vector is larger in one component and smaller in another?", answer: "Neither vector dominates the other, so the corresponding events are concurrent under the tracked process set.", hint: "Check all components, not the first difference." },
        { type: "tradeoff", prompt: "What grows when the number of processes grows, even if the application payload stays fixed?", answer: "The vector dimension and therefore the timestamp metadata carried or stored with events grow with the process count.", hint: "Count one component per process." }
      ] },
      { from: 24, to: 32, title: "Compressed timestamps", priority: "core", lessonIds: ["dsa5208-compressed-timestamps"], claim: "Differential timestamping removes repeated vector entries while retaining the receiver-specific causal knowledge needed for correct reconstruction.", why: "This is the implementation bridge from a semantically useful vector clock to a system that cannot afford to resend the full vector repeatedly.", intuition: "Compression removes repetition, not evidence: the receiver must still know which causal progress it has already observed.", mechanism: "Track Last Sent and Last Update state per receiver, send only changed components, and preserve the reconstruction invariant after every delivery.", useWhen: "Use it to reason about metadata cost without accidentally weakening the causal guarantee.", pitfall: "Do not confuse lower metadata cost with lower causal fidelity.", questions: [
        { type: "invariant", prompt: "What would be a correctness failure in differential timestamping?", answer: "The receiver reconstructs a timestamp that omits a dependency it has not actually observed, allowing an event to be delivered too early.", hint: "Compression must preserve knowledge, not just values." },
        { type: "design", prompt: "Why must the sender remember state separately for different receivers?", answer: "Receivers may have observed different portions of the sender's history, so the changed entries are destination-specific.", hint: "Knowledge is not globally identical across receivers." }
      ] },
      { from: 33, to: 36, title: "Lecture synthesis", priority: "core", lessonIds: ["dsa5208-lamport-scalar", "dsa5208-vector-clocks", "dsa5208-compressed-timestamps"], claim: "The lecture chain is model, causal relation, physical-time limitation, logical representation, and metadata trade-off.", why: "A synthesis page should let you choose the right abstraction for a new system scenario rather than repeat isolated definitions.", intuition: "Ask first what must be guaranteed, then choose the smallest time representation that preserves that guarantee.", mechanism: "Wall time estimates physical alignment; scalar time preserves causal order one-way; vector time exposes concurrency; compression reduces repetition while preserving causal knowledge.", useWhen: "Use it as a retrieval checkpoint: explain the guarantee, counterexample, cost, and failure mode for each representation.", pitfall: "A summary page is a retrieval checkpoint, not a substitute for tracing the rules.", questions: [
        { type: "select", prompt: "A system needs to detect concurrent updates, not only produce a deterministic display order. Which representation is the better starting point?", answer: "Vector time, because componentwise incomparability can represent concurrency; a scalar clock would impose an order without revealing whether it is causal.", hint: "Match the representation to the guarantee." },
        { type: "synthesis", prompt: "State the trade-off that appears when moving from scalar to vector time and then to differential compression.", answer: "Vector time adds causal information at linear metadata cost per process; differential compression reduces repeated transmission or storage while preserving the causal information the receiver needs.", hint: "Track information and cost separately." }
      ] }
    ]
  }
];

function sectionFor(config, page) { return config.sections.find(section => page >= section.from && page <= section.to) || config.sections[config.sections.length - 1]; }
function titleFor(page, fallback) {
  const lines = page.blocks.flatMap(block => String(block.text || "").split(/\n/)).map(line => line.trim()).filter(Boolean);
  const candidate = lines.find(line => line.length >= 4 && !/^\d+$/.test(line) && !line.startsWith("§")) || fallback;
  return candidate.replace(/\s+/g, " ").slice(0, 100);
}
function textbookRefs(section) {
  const page = section.title.includes("model") ? 8 : section.title.includes("Happens") ? 18 : section.title.includes("Vector") ? 62 : section.title.includes("Lamport") ? 55 : 1;
  return [{ sourceId: TEXTBOOK, page, sourceType: "textbook", role: `textbook pointer · ${section.title}` }];
}
function questions(section) {
  return section.questions || [
    { type: "distinguish", prompt: "What exact guarantee is being tested by this page?", answer: "Name the semantic boundary before naming an implementation detail.", hint: "Start with the guarantee, not the label." },
    { type: "transfer", prompt: "What assumption would you test before applying this idea to a larger system?", answer: "State the relevant communication, failure, timing, or state-size assumption and the evidence needed to check it.", hint: "Connect the rule to a measurable consequence." }
  ];
}
function buildSet(config) {
  const extracted = JSON.parse(fs.readFileSync(path.join(ROOT, config.extraction), "utf8"));
  const slides = extracted.pages.map(page => {
    const section = sectionFor(config, page.page);
    const title = titleFor(page, `${config.title} · slide ${page.page}`);
    const blocks = page.blocks.map(block => ({ blockId: block.blockId, type: block.type, text: block.text || "", page: block.page, sourceId: block.sourceId, bbox: block.bbox, imageId: block.imageId || null }));
    return {
      slideId: `DSA5208-${config.id.replace("dsa5208-", "").toUpperCase()}-S${String(page.page).padStart(2, "0")}`,
      slideNumber: page.page,
      pdfPage: page.page,
      title,
      kind: "lecture-source",
      status: page.reviewReasons && page.reviewReasons.length ? "needs-review" : "reviewed",
      assetPath: `${config.assetRoot}/slide-${String(page.page).padStart(2, "0")}.jpg`,
      sourceRef: { sourceId: config.sourceId, sourceType: "lecture", page: page.page, role: `${config.title} source slide`, status: "current" },
      extraction: { schemaVersion: "nus.lecture-slide-extraction.v1", sourceId: config.sourceId, page: page.page, status: page.status, reviewReasons: page.reviewReasons || [], text: blocks.map(block => block.text).filter(Boolean).join("\n"), blocks },
      explanation: {
        whatYouSee: section.claim,
        whyItMatters: section.why,
        intuition: section.intuition,
        technicalDetail: section.mechanism,
        pitfall: section.pitfall,
        connection: section.useWhen
      },
      textbookRefs: textbookRefs(section),
      referenceRefs: section.title.includes("Happens") || section.title.includes("Lamport") || section.title.includes("Vector") ? [{ sourceId: REFERENCE, page: 1, sourceType: "ref", role: "optional seminal paper" }] : [],
      socraticQuestions: questions(section),
      lecturePriority: section.priority || "core",
      sourceNote: page.reviewReasons && page.reviewReasons.length ? "Rendered page requires visual review; extracted text is a supporting layer." : "Extracted text is a reader layer; the rendered slide remains authoritative."
    };
  });
  const output = { schemaVersion: "nus.slide-set.v1", id: config.id, courseId: COURSE, lessonIds: config.lessonIds, title: config.title, summary: config.summary, source: { sourceId: config.sourceId, sourceType: "lecture", fileName: path.basename(config.sourceId), pageCount: extracted.pageCount, access: "local-only", assetPolicy: "page-renders-only", courseCodePrintedOnSlide: "DSA5208", atlasCourseId: COURSE }, extraction: { sourceJson: config.extraction, parser: extracted.extraction || null, markdownReaderView: config.markdown }, slides };
  const outputPath = path.join(ROOT, "content", "courses", COURSE, "slides", `${config.id}.json`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`DSA5208 SLIDES GREEN · ${config.id} · ${slides.length} slides`);
  return output;
}

function build() { return CONFIGS.map(buildSet); }
if (require.main === module) build();
module.exports = { build, sectionFor };
