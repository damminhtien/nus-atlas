/* Contract for fast, distinction-first question cards. */
const { loadLegacyState } = require("./validate-content.js");

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

function validateContrastDrills(state) {
  const errors = [];
  const drills = [];
  const courses = state && state.content && state.content.DSA5105;
  const lessons = courses ? courses.modules.flatMap(module => module.lessons || []) : [];
  lessons.forEach(lesson => (lesson.contrastDrills || []).forEach(drill => drills.push({ drill, lesson })));
  const ids = new Set();
  const pairs = new Set();
  for (const { drill, lesson } of drills) {
    const owner = `${lesson.id}/${drill.id || "missing-id"}`;
    if (!drill.id) errors.push(`${owner}: missing id`);
    if (ids.has(drill.id)) errors.push(`${owner}: duplicate id`);
    ids.add(drill.id);
    if (!drill.pair) errors.push(`${owner}: missing pair`);
    if (pairs.has(drill.pair)) errors.push(`${owner}: duplicate pair`);
    pairs.add(drill.pair);
    if (drill.type !== "contrast" || drill.kind !== "concept-contrast") errors.push(`${owner}: invalid contrast type/kind`);
    if (!drill.prompt || !drill.explanation) errors.push(`${owner}: prompt and explanation are required`);
    if (!Array.isArray(drill.choices) || drill.choices.length < 2) errors.push(`${owner}: at least two choices are required`);
    if (!Number.isInteger(drill.answer) || drill.answer < 0 || drill.answer >= (drill.choices || []).length) errors.push(`${owner}: answer must point to one choice`);
    if (!Number.isInteger(drill.estimatedSeconds) || drill.estimatedSeconds < 30 || drill.estimatedSeconds > 60) errors.push(`${owner}: estimatedSeconds must be between 30 and 60`);
    if (!Array.isArray(drill.sourceRefs) || !drill.sourceRefs.length) errors.push(`${owner}: sourceRefs are required`);
    (drill.sourceRefs || []).forEach(ref => {
      if (!ref.sourceId || !Number.isInteger(ref.page) || ref.page < 1) errors.push(`${owner}: invalid source ref`);
      if (!ref.sourceType || !["lecture", "textbook", "ref"].includes(ref.sourceType)) errors.push(`${owner}: source ref must identify lecture, textbook, or ref`);
    });
  }
  REQUIRED_PAIRS.forEach(pair => { if (!pairs.has(pair)) errors.push(`missing required pair: ${pair}`); });
  return { ok: errors.length === 0, errors, counts: { drills: drills.length, pairs: pairs.size } };
}

if (require.main === module) {
  const result = validateContrastDrills(loadLegacyState());
  if (!result.ok) {
    console.error("CONTRAST DRILLS CONTRACT FAILED");
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`CONTRAST DRILLS GREEN · ${result.counts.drills} drills · ${result.counts.pairs} unique distinctions · 30–60 seconds each`);
  }
}

module.exports = { REQUIRED_PAIRS, validateContrastDrills };
