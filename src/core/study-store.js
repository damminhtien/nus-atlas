/* Persistent study state boundary.
 *
 * The store is intentionally framework-free and CommonJS-compatible. The
 * browser bootstrap keeps the existing NUS_STORE API, while tests and future
 * features can inject storage, time, and the legacy Atlas evidence bridge.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.NUS_STUDY_STORE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createStudyStore(options) {
  const config = options || {};
  const storage = config.storage || null;
  const atlasStore = config.atlasStore || null;
  const clock = typeof config.now === "function" ? config.now : () => new Date();
  const KEY = config.key || "nus.v1";
  const SCHEMA_VERSION = "nus.study.v2";

  const QUESTS = [
    { id: "read", label: "Complete one lesson", hint: "Finish a source-backed lesson", target: 1, types: ["lesson_complete"] },
    { id: "recall", label: "Retrieve twice", hint: "Answer two questions in Exam Mode", target: 2, types: ["recall_correct"] },
    { id: "practice", label: "Make one proof move", hint: "Submit an exam, lab, or mistake redemption", target: 1, types: ["exam_submitted", "simulation_completed", "mistake_redeemed"] }
  ];
  const RECOGNITION = [
    { id: "first-step", icon: "◌", name: "First proof", desc: "Record your first evidence-backed study action.", test: state => state.events.length >= 1, value: state => Math.min(1, state.events.length) },
    { id: "source-aware", icon: "⌘", name: "Source-aware", desc: "Complete a lesson with its source trail in view.", test: state => state.events.some(event => event.type === "lesson_complete"), value: state => state.events.some(event => event.type === "lesson_complete") ? 1 : 0 },
    { id: "retrieval-builder", icon: "↺", name: "Retrieval builder", desc: "Answer 3 recall questions correctly.", test: state => countType(state, "recall_correct") >= 3, value: state => Math.min(1, countType(state, "recall_correct") / 3) },
    { id: "lab-apprentice", icon: "⌁", name: "Lab apprentice", desc: "Complete 2 visual learning labs.", test: state => countType(state, "simulation_completed") >= 2, value: state => Math.min(1, countType(state, "simulation_completed") / 2) },
    { id: "dsa5105-explorer", icon: "∑", name: "DSA5105 explorer", desc: "Create 5 pieces of DSA5105 evidence.", test: state => state.events.filter(event => event.courseCode === "DSA5105").length >= 5, value: state => Math.min(1, state.events.filter(event => event.courseCode === "DSA5105").length / 5) },
    { id: "mastery-builder", icon: "▲", name: "Mastery builder", desc: "Reach 60% evidence mastery on 3 lessons.", test: state => Object.values(state.mastery).filter(item => item.score >= 0.6).length >= 3, value: state => Math.min(1, Object.values(state.mastery).filter(item => item.score >= 0.6).length / 3) },
    { id: "mistake-redeemer", icon: "↗", name: "Mistake redeemer", desc: "Turn one missed idea into a corrected one.", test: state => countType(state, "mistake_redeemed") >= 1, value: state => Math.min(1, countType(state, "mistake_redeemed")) },
    { id: "exam-ready", icon: "◇", name: "Exam ready", desc: "Score at least 80% on a 5-question attempt.", test: state => state.attempts.some(attempt => attempt.total >= 5 && attempt.score / attempt.total >= 0.8), value: state => state.attempts.some(attempt => attempt.total >= 5 && attempt.score / attempt.total >= 0.8) ? 1 : 0 },
    { id: "steady-scholar", icon: "✦", name: "Steady scholar", desc: "Build a 3-day study streak.", test: () => atlasStore && atlasStore.raw && atlasStore.raw.streak >= 3, value: () => Math.min(1, ((atlasStore && atlasStore.raw && atlasStore.raw.streak) || 0) / 3) }
  ];

  function blank() {
    return { schemaVersion: SCHEMA_VERSION, version: 2, tasks: {}, lessons: {}, attempts: [], lastStudy: null, events: {}, mastery: {}, questHistory: {} };
  }

  function objectOrEmpty(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }

  function migrate(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return blank();
    return {
      ...blank(),
      ...data,
      schemaVersion: SCHEMA_VERSION,
      version: 2,
      tasks: objectOrEmpty(data.tasks),
      lessons: objectOrEmpty(data.lessons),
      attempts: Array.isArray(data.attempts) ? data.attempts : [],
      events: objectOrEmpty(data.events),
      mastery: objectOrEmpty(data.mastery),
      questHistory: objectOrEmpty(data.questHistory)
    };
  }

  function read() {
    try {
      const raw = storage && typeof storage.getItem === "function" ? storage.getItem(KEY) : null;
      return migrate(raw ? JSON.parse(raw) : null);
    } catch (_) {
      return blank();
    }
  }

  let state = read();

  function save() {
    if (storage && typeof storage.setItem === "function") storage.setItem(KEY, JSON.stringify(state));
  }

  function timestamp() { return clock().toISOString(); }
  function touch() { state.lastStudy = timestamp(); save(); }
  function today() {
    const date = clock();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function countType(snapshot, type) { return snapshot.events.filter(event => event.type === type).length; }
  function eventList() { return Object.values(state.events).sort((a, b) => new Date(a.at) - new Date(b.at)); }

  function updateMastery(event) {
    if (!event.lessonId) return;
    const current = state.mastery[event.lessonId] || { score: 0, attempts: 0, correct: 0, lastAt: null };
    const delta = { lesson_complete: 0.35, recall_correct: 0.12, exam_submitted: 0.15, simulation_completed: 0.18, worked_example: 0.12, mistake_redeemed: 0.18 }[event.type] || 0;
    current.score = Math.min(1, Number((current.score + delta).toFixed(3)));
    current.attempts += 1;
    if (["recall_correct", "exam_submitted", "simulation_completed", "worked_example", "mistake_redeemed"].includes(event.type)) current.correct += 1;
    current.lastAt = event.at;
    state.mastery[event.lessonId] = current;
  }

  function questState() {
    const day = today();
    const events = eventList().filter(event => event.at.slice(0, 10) === day);
    const quests = QUESTS.map(quest => ({ ...quest, progress: Math.min(quest.target, events.filter(event => quest.types.includes(event.type)).length) }));
    const complete = quests.every(quest => quest.progress >= quest.target);
    if (complete && !state.questHistory[day]) { state.questHistory[day] = { completedAt: timestamp() }; save(); }
    return { day, quests, complete, completedDays: Object.keys(state.questHistory).length };
  }

  function recognition() {
    const snapshot = { events: eventList(), mastery: state.mastery, attempts: state.attempts };
    return RECOGNITION.map(item => ({ ...item, unlocked: !!item.test(snapshot), progress: Math.round(item.value(snapshot) * 100) }));
  }

  function recordEvidence(input) {
    const item = input || {};
    const eventId = String(item.eventId || "").trim();
    if (!eventId) throw new Error("NUS evidence requires a stable eventId");
    if (state.events[eventId]) return { ...state.events[eventId], awarded: false, duplicate: true };
    const event = { eventId, type: String(item.type || "study_action"), courseCode: item.courseCode || null, lessonId: item.lessonId || null, xp: Math.max(0, Number(item.xp) || 0), at: timestamp(), meta: item.meta || {} };
    state.events[eventId] = event;
    updateMastery(event);
    if (atlasStore && typeof atlasStore.recordNusEvidence === "function") atlasStore.recordNusEvidence(event);
    touch();
    return { ...event, awarded: true, duplicate: false };
  }

  function markLesson(id, done, meta) {
    const wasDone = !!state.lessons[id];
    state.lessons[id] = !!done;
    if (done && !wasDone) recordEvidence({ eventId: `lesson:${id}`, type: "lesson_complete", courseCode: meta && meta.courseCode, lessonId: id, xp: 40, meta: { sourceRefs: (meta && meta.sourceRefs) || [] } });
    else touch();
    return !wasDone && !!done;
  }

  function recordAttempt(result) {
    const input = result || {};
    const attemptId = input.attemptId || `attempt-${clock().getTime()}`;
    if (state.attempts.some(attempt => attempt.attemptId === attemptId)) return state.attempts.find(attempt => attempt.attemptId === attemptId);
    const attempt = { ...input, attemptId, at: timestamp() };
    state.attempts = state.attempts.concat([attempt]).slice(-100);
    recordEvidence({ eventId: `exam:${attemptId}`, type: "exam_submitted", courseCode: input.courseCode, lessonId: input.lessonId, xp: Math.min(35, 15 + Number(input.score || 0) * 2), meta: { score: input.score, total: input.total } });
    return attempt;
  }

  const api = {
    get raw() { return state; },
    get schemaVersion() { return SCHEMA_VERSION; },
    task(id) { return state.tasks[id] || { status: "todo", checks: [] }; },
    setTask(id, patch) { state.tasks[id] = { ...this.task(id), ...patch }; touch(); },
    toggleCheck(id, index) { const task = this.task(id), checks = Array.isArray(task.checks) ? task.checks.slice() : []; checks[index] = !checks[index]; this.setTask(id, { checks }); },
    markLesson,
    lessonDone(id) { return !!state.lessons[id]; },
    recordEvidence,
    recordSimulation(name, courseCode, lessonId) { return recordEvidence({ eventId: `lab:${name}`, type: "simulation_completed", courseCode, lessonId, xp: 10, meta: { lab: name } }); },
    recordAttempt,
    attempts() { return state.attempts.slice(); },
    events() { return eventList(); },
    masteryFor(id) { return state.mastery[id] || { score: 0, attempts: 0, correct: 0, lastAt: null }; },
    masteryByCourse(code, lessonList) { return (lessonList || []).map(lesson => ({ lesson, mastery: this.masteryFor(lesson.id) })).filter(item => item.mastery.attempts > 0); },
    questState,
    recognition,
    courseProgress(code, lessonList) { const all = (lessonList || []).filter(Boolean), done = all.filter(lesson => this.lessonDone(lesson.id)).length; return { done, total: all.length, pct: all.length ? Math.round(done / all.length * 100) : 0 }; },
    reset() { state = blank(); save(); }
  };

  return Object.freeze(api);
});
