/* Framework-free practice session lifecycle. Question content stays in memory;
 * the serializable snapshot is intentionally small enough for cross-device sync. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_EXAM_SESSION = factory;
})(typeof globalThis === "object" ? globalThis : this, function createExamSession(options) {
  const config = options || {};
  const now = typeof config.now === "function" ? config.now : () => Date.now();
  const makeId = typeof config.makeId === "function" ? config.makeId : () => `nus-${now()}-${Math.random().toString(36).slice(2, 8)}`;

  function iso(value) {
    const date = value instanceof Date ? value : new Date(value == null ? now() : value);
    return date.toISOString();
  }

  function questionIds(questions) { return (questions || []).map(question => question && question.id).filter(Boolean); }
  function copy(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function clampIndex(state, value) { return Math.max(0, Math.min(Math.max(0, state.questionIds.length - 1), Number(value) || 0)); }
  function answered(state, questionId) { return (state.answers || []).find(answer => answer.questionId === questionId); }
  function nextOpenIndex(state, start) {
    const ids = state.questionIds || [];
    for (let offset = 0; offset < ids.length; offset += 1) {
      const index = (start + offset) % ids.length;
      const answer = answered(state, ids[index]);
      if (!answer || answer.status === "skipped") return index;
    }
    return clampIndex(state, start);
  }

  function create(input) {
    const item = input || {};
    const questions = item.questions || [];
    const startedAt = item.startedAt || iso();
    return {
      attemptId: item.attemptId || makeId(),
      courseCode: String(item.courseCode || ""),
      mode: ["mock", "deep"].includes(item.mode) ? item.mode : "adaptive",
      scope: String(item.scope || ""),
      focus: String(item.focus || "smart"),
      questionIds: questionIds(questions),
      generatedSeeds: Object.fromEntries(questions.filter(question => question && question.generationSeed != null).map(question => [question.id, question.generationSeed])),
      questions: questions.slice(),
      answers: [],
      skippedQuestionIds: [],
      currentIndex: 0,
      startedAt,
      elapsedSeconds: Math.max(0, Number(item.elapsedSeconds) || 0),
      limitMinutes: Math.max(0, Number(item.limitMinutes) || 0),
      updatedAt: item.updatedAt || startedAt,
      status: "active",
      timedOut: false
    };
  }

  function fromSnapshot(snapshot, questions) {
    const item = snapshot || {};
    const available = new Map((questions || []).map(question => [question.id, question]));
    const ids = Array.isArray(item.questionIds) ? item.questionIds.filter(id => available.has(id)) : [];
    return {
      ...create({ ...item, questions: ids.map(id => available.get(id)), attemptId: item.attemptId }),
      ...copy(item),
      questions: ids.map(id => available.get(id)),
      questionIds: ids,
      answers: Array.isArray(item.answers) ? copy(item.answers) : [],
      skippedQuestionIds: Array.isArray(item.skippedQuestionIds) ? item.skippedQuestionIds.slice() : [],
      currentIndex: ids.length ? clampIndex({ questionIds: ids }, item.currentIndex) : 0,
      status: item.status === "finished" ? "finished" : "active",
      timedOut: !!item.timedOut
    };
  }

  function touch(state, patch) { return { ...state, ...patch, updatedAt: iso() }; }

  function answer(state, input) {
    const item = input || {};
    const questionId = String(item.questionId || (state.questionIds || [])[state.currentIndex] || "");
    if (!questionId || !(state.questionIds || []).includes(questionId)) return state;
    const record = {
      questionId,
      raw: item.raw == null ? "" : String(item.raw),
      correct: !!item.correct,
      gradingMode: item.gradingMode || "heuristic",
      gradingStatus: item.gradingStatus || (item.gradingMode === "exact" ? "graded" : "self-review"),
      gradedBy: item.gradedBy || (item.gradingMode === "exact" ? "local" : "heuristic"),
      score: item.score == null ? null : Number(item.score),
      feedback: String(item.feedback || ""),
      answeredAt: iso()
    };
    const answers = (state.answers || []).filter(answerItem => answerItem.questionId !== questionId).concat(record);
    return touch(state, { answers, skippedQuestionIds: (state.skippedQuestionIds || []).filter(id => id !== questionId) });
  }

  function advance(state) {
    if (!state.questionIds.length) return touch(state, { status: "finished" });
    const next = state.currentIndex + 1;
    if (next >= state.questionIds.length) return touch(state, { currentIndex: state.questionIds.length - 1 });
    return touch(state, { currentIndex: nextOpenIndex(state, next) });
  }

  function back(state) { return touch(state, { currentIndex: Math.max(0, state.currentIndex - 1) }); }
  function goTo(state, index) { return touch(state, { currentIndex: clampIndex(state, index) }); }

  function skip(state) {
    const questionId = state.questionIds[state.currentIndex];
    if (!questionId) return state;
    const skipped = [...new Set([...(state.skippedQuestionIds || []), questionId])];
    const next = state.currentIndex + 1 < state.questionIds.length ? nextOpenIndex({ ...state, skippedQuestionIds: skipped }, state.currentIndex + 1) : state.currentIndex;
    return touch(state, { skippedQuestionIds: skipped, currentIndex: next });
  }

  function elapsedSeconds(state, at) {
    if (!state || !state.startedAt) return 0;
    const current = at == null ? now() : new Date(at).getTime();
    return Math.max(Number(state.elapsedSeconds) || 0, Math.floor((current - new Date(state.startedAt).getTime()) / 1000));
  }

  function timeout(state) { return touch(state, { elapsedSeconds: elapsedSeconds(state), status: "finished", timedOut: true }); }
  function finish(state) { return touch(state, { elapsedSeconds: elapsedSeconds(state), status: "finished" }); }
  function isComplete(state) { return state.status === "finished" || (state.answers || []).length + (state.skippedQuestionIds || []).length >= (state.questionIds || []).length; }

  function snapshot(state) {
    const { questions, ...serializable } = state;
    return copy({ ...serializable, elapsedSeconds: elapsedSeconds(state), updatedAt: state.updatedAt || iso() });
  }

  return Object.freeze({ create, fromSnapshot, answer, advance, back, goTo, skip, elapsedSeconds, timeout, finish, isComplete, snapshot, questionAt: (state, index = state.currentIndex) => state.questions[clampIndex(state, index)] || null, answered });
});
