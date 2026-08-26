/* Contract for the five-part DSA5101 algorithm note standard. */
const { loadCanonicalState } = require("./validate-content.js");

const DSA5101_ALGORITHM_LESSONS = [
  "dsa5101-frequent-itemsets",
  "dsa5101-minhash-lsh",
  "dsa5101-clustering",
  "dsa5101-recommenders",
  "dsa5101-pagerank",
  "dsa5101-streams",
  "dsa5101-balance"
];
const NOTE_FIELDS = ["problemDefinition", "assumptions", "coreInvariant", "formulaAlgorithm", "failureModes"];
const SOURCE_TYPES = new Set(["lecture", "exercise", "textbook", "ref", "assessment-derived"]);

function validateAlgorithmNotes(state) {
  const errors = [];
  const course = state && state.content && state.content.DSA5101;
  const lessons = course ? course.modules.flatMap(module => module.lessons || []) : [];
  const byId = new Map(lessons.map(lesson => [lesson.id, lesson]));
  let noteCount = 0;
  for (const lessonId of DSA5101_ALGORITHM_LESSONS) {
    const lesson = byId.get(lessonId);
    if (!lesson) {
      errors.push(`missing DSA5101 algorithm lesson: ${lessonId}`);
      continue;
    }
    const notes = lesson.algorithmNotes;
    if (!Array.isArray(notes) || !notes.length) {
      errors.push(`${lessonId}: algorithmNotes must contain at least one note`);
      continue;
    }
    const algorithms = new Set();
    notes.forEach((note, index) => {
      const owner = `${lessonId}/algorithmNotes[${index}]`;
      noteCount += 1;
      if (!note || typeof note !== "object") {
        errors.push(`${owner}: note must be an object`);
        return;
      }
      if (!note.algorithm || algorithms.has(note.algorithm)) errors.push(`${owner}: algorithm title is missing or duplicated`);
      algorithms.add(note.algorithm);
      NOTE_FIELDS.forEach(field => {
        if (typeof note[field] !== "string" || !note[field].trim()) errors.push(`${owner}: missing ${field}`);
      });
      if (!Array.isArray(note.sourceRefs) || !note.sourceRefs.length) errors.push(`${owner}: sourceRefs are required`);
      (note.sourceRefs || []).forEach(ref => {
        if (!ref || !ref.sourceId || !Number.isInteger(ref.page) || ref.page < 1 || !SOURCE_TYPES.has(ref.sourceType)) errors.push(`${owner}: invalid source ref`);
      });
    });
  }
  return { ok: errors.length === 0, errors, counts: { lessons: DSA5101_ALGORITHM_LESSONS.length, notes: noteCount, fields: NOTE_FIELDS.length } };
}

if (require.main === module) {
  const result = validateAlgorithmNotes(loadCanonicalState());
  if (!result.ok) {
    console.error("ALGORITHM NOTES CONTRACT FAILED");
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`ALGORITHM NOTES GREEN · DSA5101 · ${result.counts.notes} notes · ${result.counts.fields}-part contract`);
  }
}

module.exports = { DSA5101_ALGORITHM_LESSONS, NOTE_FIELDS, validateAlgorithmNotes };
