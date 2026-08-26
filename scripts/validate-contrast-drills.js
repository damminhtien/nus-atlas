/* Contract for fast, distinction-first question cards. */
const { loadCanonicalState } = require("./validate-content.js");

const REQUIRED_PAIRS = [
  "Train vs validation vs test",
  "Empirical vs population risk",
  "Approximation vs estimation vs optimization",
  "Deterministic vs random oracle",
  "Underfitting vs overfitting",
  String.raw`$L_2$ vs $L_1$`,
  "OLS vs ridge",
  String.raw`Invertible vs singular $\Phi^\top\Phi$`,
  "0–1 loss vs cross-entropy",
  "Logits vs probabilities"
];
const DSA5101_REQUIRED_PAIRS = [
  "Batch vs streaming",
  "Exact vs approximate computation",
  "Support vs confidence",
  "Confidence vs lift",
  "Subset vs superset pruning",
  "Jaccard vs cosine similarity",
  "MinHash vs LSH",
  "False positive vs false negative",
  "PageRank vs indegree",
  "Exact storage vs sketch summary",
  "Subset vs superset in Apriori",
  "Shingle set vs multiset",
  "Row vs band vs whole LSH collision",
  "More LSH bands vs precision",
  "Single vs complete vs average linkage",
  "Row-stochastic vs column-stochastic",
  "Raw vs mean-centered ratings",
  "Newest vs oldest DGIM bucket",
  "Zeroth moment vs total count",
  "Tie-aware vs tie-blind BALANCE"
];
const DSA5101_TRAP_PAIRS = DSA5101_REQUIRED_PAIRS.slice(-10);
const DSA5104_REQUIRED_PAIRS = [
  "Schema vs instance",
  "Physical vs logical vs view level",
  "Primary key vs foreign key",
  "Relational model vs ER model",
  "Logical vs physical design",
  "Two-tier vs three-tier architecture",
  "DDL vs DML",
  "WHERE vs HAVING",
  "COUNT(*) vs COUNT(column)",
  "= NULL vs IS NULL",
  "!= NULL vs IS NOT NULL",
  "IS vs = for strings",
  "== vs =",
  "Identifier quoting vs string literal quoting",
  "= vs LIKE",
  "Case-insensitive vs case-sensitive collation",
  "AND/OR precedence vs explicit parentheses",
  "UNION vs UNION ALL",
  "NOT IN vs NOT EXISTS with NULL",
  "DELETE vs DROP",
  "Parsing vs optimization vs evaluation",
  "Index lookup vs full scan",
  "Atomicity vs concurrency control",
  "Centralized vs distributed database",
  "Relational vs semi-structured",
  "Schema-on-write vs schema-on-read"
];
const DSA5208_REQUIRED_PAIRS = [
  "Computation vs communication",
  "Multiprocessor vs multicomputer",
  "Event order vs wall-clock order",
  "Causal precedence vs concurrency",
  "Non-FIFO vs FIFO",
  "FIFO vs causal ordering",
  "Physical vs logical clocks",
  "Lamport scalar vs vector time",
  "Weak ordering vs strong consistency",
  "Comparable vs incomparable vectors",
  "Full vector vs compressed timestamp",
  "O(n²) vs O(n) timestamp storage",
  "Partition-local vs shuffle",
  "Lecture roadmap vs lecture derivation"
];

function validateContrastDrills(state) {
  const errors = [];
  const drills = [];
  const ids = new Set();
  const pairs = new Set();
  const byCourse = {};
  const requiredPairsByCourse = { DSA5101: DSA5101_REQUIRED_PAIRS, DSA5104: DSA5104_REQUIRED_PAIRS, DSA5105: REQUIRED_PAIRS, DSA5208: DSA5208_REQUIRED_PAIRS };
  for (const [courseId, requiredPairs] of Object.entries(requiredPairsByCourse)) {
    const course = state && state.content && state.content[courseId];
    const lessons = course ? course.modules.flatMap(module => module.lessons || []) : [];
    lessons.forEach(lesson => (lesson.contrastDrills || []).forEach(drill => drills.push({ drill, lesson, courseId })));
    const coursePairs = new Set();
    for (const { drill, lesson } of drills.filter(item => item.courseId === courseId)) {
      const owner = `${courseId}/${lesson.id}/${drill.id || "missing-id"}`;
      if (!drill.id) errors.push(`${owner}: missing id`);
      if (ids.has(drill.id)) errors.push(`${owner}: duplicate id`);
      ids.add(drill.id);
      if (!drill.pair) errors.push(`${owner}: missing pair`);
      if (coursePairs.has(drill.pair)) errors.push(`${owner}: duplicate pair`);
      coursePairs.add(drill.pair);
      pairs.add(drill.pair);
      if (drill.type !== "contrast" || drill.kind !== "concept-contrast") errors.push(`${owner}: invalid contrast type/kind`);
      if (!drill.prompt || !drill.explanation) errors.push(`${owner}: prompt and explanation are required`);
      if (!Array.isArray(drill.choices) || drill.choices.length < 2) errors.push(`${owner}: at least two choices are required`);
      if (!Number.isInteger(drill.answer) || drill.answer < 0 || drill.answer >= (drill.choices || []).length) errors.push(`${owner}: answer must point to one choice`);
      if (!Number.isInteger(drill.estimatedSeconds) || drill.estimatedSeconds < 30 || drill.estimatedSeconds > 60) errors.push(`${owner}: estimatedSeconds must be between 30 and 60`);
      if (!Array.isArray(drill.sourceRefs) || !drill.sourceRefs.length) errors.push(`${owner}: sourceRefs are required`);
      (drill.sourceRefs || []).forEach(ref => {
        if (!ref.sourceId || !Number.isInteger(ref.page) || ref.page < 1) errors.push(`${owner}: invalid source ref`);
        if (!ref.sourceType || !["lecture", "exercise", "textbook", "ref"].includes(ref.sourceType)) errors.push(`${owner}: source ref must identify lecture, exercise, textbook, or ref`);
      });
    }
    requiredPairs.forEach(pair => { if (!coursePairs.has(pair)) errors.push(`missing required pair for ${courseId}: ${pair}`); });
    byCourse[courseId] = { drills: drills.filter(item => item.courseId === courseId).length, pairs: coursePairs.size };
  }
  return {
    ok: errors.length === 0,
    errors,
    counts: {
      drills: byCourse.DSA5105 ? byCourse.DSA5105.drills : drills.length,
      pairs: byCourse.DSA5105 ? byCourse.DSA5105.pairs : pairs.size,
      totalDrills: drills.length,
      totalPairs: pairs.size,
      byCourse
    }
  };
}

if (require.main === module) {
  const result = validateContrastDrills(loadCanonicalState());
  if (!result.ok) {
    console.error("CONTRAST DRILLS CONTRACT FAILED");
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`CONTRAST DRILLS GREEN · ${result.counts.totalDrills} drills · ${result.counts.totalPairs} unique distinctions · 30–60 seconds each`);
  }
}

module.exports = { REQUIRED_PAIRS, DSA5101_REQUIRED_PAIRS, DSA5101_TRAP_PAIRS, DSA5104_REQUIRED_PAIRS, DSA5208_REQUIRED_PAIRS, validateContrastDrills };
