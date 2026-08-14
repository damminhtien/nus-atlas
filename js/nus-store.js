(function () {
  "use strict";

  const KEY = "nus.v1";
  const QUESTS = [
    { id: "read", label: "Complete one lesson", hint: "Finish a source-backed lesson", target: 1, types: ["lesson_complete"] },
    { id: "recall", label: "Retrieve twice", hint: "Answer two questions in Exam Mode", target: 2, types: ["recall_correct"] },
    { id: "practice", label: "Make one proof move", hint: "Submit an exam, lab, or mistake redemption", target: 1, types: ["exam_submitted", "simulation_completed", "mistake_redeemed"] }
  ];
  const RECOGNITION = [
    { id: "first-step", icon: "◌", name: "First proof", desc: "Record your first evidence-backed study action.", test: s => s.events.length >= 1, value: s => Math.min(1, s.events.length) },
    { id: "source-aware", icon: "⌘", name: "Source-aware", desc: "Complete a lesson with its source trail in view.", test: s => s.events.some(e => e.type === "lesson_complete"), value: s => s.events.some(e => e.type === "lesson_complete") ? 1 : 0 },
    { id: "retrieval-builder", icon: "↺", name: "Retrieval builder", desc: "Answer 3 recall questions correctly.", test: s => countType(s, "recall_correct") >= 3, value: s => Math.min(1, countType(s, "recall_correct") / 3) },
    { id: "lab-apprentice", icon: "⌁", name: "Lab apprentice", desc: "Complete 2 visual learning labs.", test: s => countType(s, "simulation_completed") >= 2, value: s => Math.min(1, countType(s, "simulation_completed") / 2) },
    { id: "dsa5105-explorer", icon: "∑", name: "DSA5105 explorer", desc: "Create 5 pieces of DSA5105 evidence.", test: s => s.events.filter(e => e.courseCode === "DSA5105").length >= 5, value: s => Math.min(1, s.events.filter(e => e.courseCode === "DSA5105").length / 5) },
    { id: "mastery-builder", icon: "▲", name: "Mastery builder", desc: "Reach 60% evidence mastery on 3 lessons.", test: s => Object.values(s.mastery).filter(m => m.score >= 0.6).length >= 3, value: s => Math.min(1, Object.values(s.mastery).filter(m => m.score >= 0.6).length / 3) },
    { id: "mistake-redeemer", icon: "↗", name: "Mistake redeemer", desc: "Turn one missed idea into a corrected one.", test: s => countType(s, "mistake_redeemed") >= 1, value: s => Math.min(1, countType(s, "mistake_redeemed")) },
    { id: "exam-ready", icon: "◇", name: "Exam ready", desc: "Score at least 80% on a 5-question attempt.", test: s => s.attempts.some(a => a.total >= 5 && a.score / a.total >= 0.8), value: s => s.attempts.some(a => a.total >= 5 && a.score / a.total >= 0.8) ? 1 : 0 },
    { id: "steady-scholar", icon: "✦", name: "Steady scholar", desc: "Build a 3-day study streak.", test: () => window.Store && window.Store.raw.streak >= 3, value: () => Math.min(1, ((window.Store && window.Store.raw.streak) || 0) / 3) }
  ];

  const blank = () => ({ tasks: {}, lessons: {}, attempts: [], lastStudy: null, events: {}, mastery: {}, questHistory: {} });
  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!data || typeof data !== "object") return blank();
      return { ...blank(), ...data, events: data.events && typeof data.events === "object" ? data.events : {}, mastery: data.mastery && typeof data.mastery === "object" ? data.mastery : {}, questHistory: data.questHistory && typeof data.questHistory === "object" ? data.questHistory : {} };
    } catch (_) { return blank(); }
  }
  let state = read();
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function touch() { state.lastStudy = new Date().toISOString(); save(); }
  function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
  function countType(snapshot, type) { return snapshot.events.filter(e => e.type === type).length; }
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
    const day = today(), events = eventList().filter(e => e.at.slice(0, 10) === day);
    const quests = QUESTS.map(q => ({ ...q, progress: Math.min(q.target, events.filter(e => q.types.includes(e.type)).length) }));
    const complete = quests.every(q => q.progress >= q.target);
    if (complete && !state.questHistory[day]) { state.questHistory[day] = { completedAt: new Date().toISOString() }; save(); }
    return { day, quests, complete, completedDays: Object.keys(state.questHistory).length };
  }
  function recognition() {
    const snapshot = { events: eventList(), mastery: state.mastery, attempts: state.attempts };
    return RECOGNITION.map(item => ({ ...item, unlocked: !!item.test(snapshot), progress: Math.round(item.value(snapshot) * 100) }));
  }
  function recordEvidence(input) {
    const item = input || {}, eventId = String(item.eventId || "").trim();
    if (!eventId) throw new Error("NUS evidence requires a stable eventId");
    if (state.events[eventId]) return { ...state.events[eventId], awarded: false, duplicate: true };
    const event = { eventId, type: String(item.type || "study_action"), courseCode: item.courseCode || null, lessonId: item.lessonId || null, xp: Math.max(0, Number(item.xp) || 0), at: new Date().toISOString(), meta: item.meta || {} };
    state.events[eventId] = event;
    updateMastery(event);
    if (window.Store && typeof window.Store.recordNusEvidence === "function") window.Store.recordNusEvidence(event);
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
    const input = result || {}, attemptId = input.attemptId || `attempt-${Date.now()}`;
    if (state.attempts.some(a => a.attemptId === attemptId)) return state.attempts.find(a => a.attemptId === attemptId);
    const attempt = { ...input, attemptId, at: new Date().toISOString() };
    state.attempts = state.attempts.concat([attempt]).slice(-100);
    recordEvidence({ eventId: `exam:${attemptId}`, type: "exam_submitted", courseCode: input.courseCode, lessonId: input.lessonId, xp: Math.min(35, 15 + Number(input.score || 0) * 2), meta: { score: input.score, total: input.total } });
    return attempt;
  }
  window.NUS_STORE = {
    get raw() { return state; },
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
    masteryByCourse(code, lessonList) { return (lessonList || []).map(l => ({ lesson: l, mastery: this.masteryFor(l.id) })).filter(x => x.mastery.attempts > 0); },
    questState,
    recognition,
    courseProgress(code, lessonList) { const all = (lessonList || []).filter(Boolean), done = all.filter(l => this.lessonDone(l.id)).length; return { done, total: all.length, pct: all.length ? Math.round(done / all.length * 100) : 0 }; },
    reset() { state = blank(); save(); }
  };
})();
