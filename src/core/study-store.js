/* Persistent study state boundary.
 *
 * The store is intentionally framework-free and CommonJS-compatible. The
 * browser composition root injects storage and the optional sync scheduler.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_STUDY_STORE_FACTORY = factory;
})(typeof globalThis === "object" ? globalThis : this, function createStudyStore(options) {
  const config = options || {};
  const storage = config.storage || null;
  const clock = typeof config.now === "function" ? config.now : () => new Date();
  let syncScheduler = typeof config.syncScheduler === "function" ? config.syncScheduler : null;
  const KEY = config.key || "nus.v1";
  const SCHEMA_VERSION = "nus.study.v5";
  const STUDY_TIME_ZONE = String(config.timeZone || "Asia/Singapore");
  const calendarDayFormatter = new Intl.DateTimeFormat("en-SG", {
    timeZone: STUDY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const RETRIEVAL_INTERVALS = [1, 3, 7, 14, 30, 60, 120];

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
    { id: "dsa5105-explorer", icon: "∑", name: "DSA5105 explorer", desc: "Create 5 rewarded pieces of DSA5105 evidence.", test: state => state.events.filter(event => event.courseCode === "DSA5105" && event.xp > 0).length >= 5, value: state => Math.min(1, state.events.filter(event => event.courseCode === "DSA5105" && event.xp > 0).length / 5) },
    { id: "mastery-builder", icon: "▲", name: "Mastery builder", desc: "Reach 60% evidence mastery on 3 lessons.", test: state => Object.values(state.mastery).filter(item => item.score >= 0.6).length >= 3, value: state => Math.min(1, Object.values(state.mastery).filter(item => item.score >= 0.6).length / 3) },
    { id: "mistake-redeemer", icon: "↗", name: "Mistake redeemer", desc: "Turn one missed idea into a corrected one.", test: state => countType(state, "mistake_redeemed") >= 1, value: state => Math.min(1, countType(state, "mistake_redeemed")) },
    { id: "exam-ready", icon: "◇", name: "Exam ready", desc: "Score at least 80% on a 5-question attempt.", test: state => state.attempts.some(attempt => attempt.total >= 5 && attempt.score / attempt.total >= 0.8), value: state => state.attempts.some(attempt => attempt.total >= 5 && attempt.score / attempt.total >= 0.8) ? 1 : 0 },
    { id: "steady-scholar", icon: "✦", name: "Steady scholar", desc: "Build a 3-day study streak.", test: state => streakFor(activeDayMap(state.events), today()) >= 3, value: state => Math.min(1, streakFor(activeDayMap(state.events), today()) / 3) }
  ];

  function blank() {
    return { schemaVersion: SCHEMA_VERSION, version: 5, tasks: {}, lessons: {}, attempts: [], activePractice: null, lastStudy: null, lastLesson: null, events: {}, mastery: {}, retrieval: {}, reading: {}, questHistory: {} };
  }

  function objectOrEmpty(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }

  function activePracticeSnapshot(value) {
    if (!value || typeof value !== "object" || Array.isArray(value) || !value.attemptId) return null;
    const fields = ["attemptId", "courseCode", "mode", "scope", "focus", "questionIds", "generatedSeeds", "currentIndex", "startedAt", "elapsedSeconds", "limitMinutes", "updatedAt", "status", "timedOut", "skippedQuestionIds"];
    const snapshot = Object.fromEntries(fields.filter(field => value[field] !== undefined).map(field => [field, value[field]]));
    snapshot.attemptId = String(snapshot.attemptId);
    snapshot.questionIds = Array.isArray(snapshot.questionIds) ? snapshot.questionIds.map(String).filter(Boolean) : [];
    snapshot.skippedQuestionIds = Array.isArray(snapshot.skippedQuestionIds) ? snapshot.skippedQuestionIds.map(String).filter(Boolean) : [];
    snapshot.generatedSeeds = objectOrEmpty(snapshot.generatedSeeds);
    snapshot.answers = (Array.isArray(value.answers) ? value.answers : []).filter(answer => answer && answer.questionId).map(answer => ({
      questionId: String(answer.questionId),
      raw: String(answer.raw || "").slice(0, 12000),
      correct: !!answer.correct,
      gradingMode: String(answer.gradingMode || "heuristic"),
      gradingStatus: String(answer.gradingStatus || "self-review"),
      gradedBy: String(answer.gradedBy || "heuristic"),
      score: answer.score == null ? null : Number(answer.score),
      feedback: String(answer.feedback || "").slice(0, 4000),
      answeredAt: answer.answeredAt || null
    }));
    return snapshot;
  }

  function migrate(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return blank();
    return {
      ...blank(),
      ...data,
      schemaVersion: SCHEMA_VERSION,
      version: 5,
      tasks: objectOrEmpty(data.tasks),
      lessons: objectOrEmpty(data.lessons),
      attempts: Array.isArray(data.attempts) ? data.attempts : [],
      activePractice: activePracticeSnapshot(data.activePractice),
      lastLesson: data.lastLesson && typeof data.lastLesson === "object" ? {
        courseCode: String(data.lastLesson.courseCode || ""),
        lessonId: String(data.lastLesson.lessonId || ""),
        at: data.lastLesson.at || null
      } : null,
      events: objectOrEmpty(data.events),
      mastery: objectOrEmpty(data.mastery),
      retrieval: objectOrEmpty(data.retrieval),
      reading: objectOrEmpty(data.reading),
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
    if (syncScheduler) syncScheduler();
  }

  function timestamp() { return clock().toISOString(); }
  function touch() { state.lastStudy = timestamp(); save(); }
  function calendarDay(value) {
    if (value == null || String(value).trim() === "") return "";
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    const fields = Object.fromEntries(calendarDayFormatter.formatToParts(date)
      .filter(part => part.type !== "literal")
      .map(part => [part.type, part.value]));
    return `${fields.year}-${fields.month}-${fields.day}`;
  }
  function today() { return calendarDay(clock()); }
  function countType(snapshot, type) { return snapshot.events.filter(event => event.type === type).length; }
  function eventList() { return Object.values(state.events).sort((a, b) => new Date(a.at) - new Date(b.at)); }
  function dayOffset(day, amount) {
    const date = new Date(`${day}T12:00:00Z`);
    if (!Number.isFinite(date.getTime())) return "";
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  }
  function activeDayMap(events) {
    return Object.fromEntries((events || []).filter(event => event && event.at).map(event => [calendarDay(event.at), 1]));
  }
  function streakFor(activeDays, endDay) {
    let day = endDay;
    // Keep yesterday's streak visible until the learner has had a full day
    // to study. This prevents a new calendar day from looking like a loss.
    if (!activeDays[day]) day = dayOffset(day, -1);
    let streak = 0;
    while (activeDays[day]) {
      streak += 1;
      day = dayOffset(day, -1);
    }
    return streak;
  }
  function levelFor(xp) {
    const levels = [[0, "Novice"], [150, "Apprentice"], [400, "Student"], [800, "Scholar"], [1400, "Adept"], [2200, "Savant"], [3200, "Sage"], [4500, "Master"], [6200, "Luminary"], [8500, "Polymath"], [12000, "Grandmaster"], [18000, "Oracle"], [26000, "Laureate"], [32000, "Magnum"]];
    let index = 0;
    levels.forEach((item, position) => { if (xp >= item[0]) index = position; });
    const current = levels[index], next = levels[index + 1] || null;
    const span = next ? next[0] - current[0] : 1;
    return { level: index + 1, name: current[1], xp, pct: next ? Math.min(100, Math.round((xp - current[0]) / span * 100)) : 100, toNext: next ? next[0] - xp : 0, next: next ? { level: index + 2, name: next[1], xp: next[0] } : null };
  }

  function updateMastery(event) {
    if (!event.lessonId) return;
    const current = state.mastery[event.lessonId] || { score: 0, attempts: 0, correct: 0, lastAt: null };
    // Submitting an attempt is a behavioural/quest event, not evidence of
    // knowing the lesson. Mastery must come from the scored evidence events.
    const delta = { lesson_complete: 0.35, recall_correct: 0.12, retrieval_failed: -0.08, simulation_completed: 0.18, worked_example: 0.12, mistake_redeemed: 0.18 }[event.type] || 0;
    if (!delta) return;
    current.score = Math.max(0, Math.min(1, Number((current.score + delta).toFixed(3))));
    current.attempts += 1;
    if (["recall_correct", "simulation_completed", "worked_example", "mistake_redeemed"].includes(event.type)) current.correct += 1;
    current.lastAt = event.at;
    state.mastery[event.lessonId] = current;
    if (current.score >= 0.8) ensureRetrievalSchedule(event.lessonId, event.courseCode);
  }

  function questState() {
    const day = today();
    const events = eventList().filter(event => calendarDay(event.at) === day);
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

  function setLastLesson(input) {
    const item = input || {};
    const courseCode = String(item.courseCode || "").trim();
    const lessonId = String(item.lessonId || "").trim();
    if (!courseCode || !lessonId) return null;
    state.lastLesson = { courseCode, lessonId, at: timestamp() };
    touch();
    return { ...state.lastLesson };
  }

  function recordAttempt(result) {
    const input = result || {};
    const attemptId = input.attemptId || `attempt-${clock().getTime()}`;
    if (state.attempts.some(attempt => attempt.attemptId === attemptId)) return state.attempts.find(attempt => attempt.attemptId === attemptId);
    const attempt = { ...input, attemptId, at: timestamp() };
    state.attempts = state.attempts.concat([attempt]).slice(-100);
    if (state.activePractice && state.activePractice.attemptId === attemptId) state.activePractice = null;
    recordEvidence({ eventId: `exam:${attemptId}`, type: "exam_submitted", courseCode: input.courseCode, lessonId: input.lessonId, xp: Math.min(35, 15 + Number(input.score || 0) * 2), meta: { score: input.score, total: input.total } });
    return attempt;
  }

  function questionStats(questionId) {
    const attempts = eventList().filter(event => event.type === "question_attempt" && event.meta && event.meta.questionId === questionId);
    const correct = attempts.filter(event => event.meta.correct).length;
    const redeemed = eventList().filter(event => event.type === "mistake_redeemed" && event.meta && event.meta.questionId === questionId).length;
    return {
      questionId,
      attempts: attempts.length,
      correct,
      misses: attempts.length - correct,
      accuracy: attempts.length ? Number((correct / attempts.length).toFixed(3)) : 0,
      redeemed,
      lastAt: attempts.at(-1) ? attempts.at(-1).at : null,
      lastCorrectAt: [...attempts].reverse().find(event => event.meta.correct)?.at || null
    };
  }

  function allQuestionStats() {
    const ids = new Set(eventList().filter(event => event.type === "question_attempt" && event.meta && event.meta.questionId).map(event => event.meta.questionId));
    return [...ids].map(questionId => questionStats(questionId));
  }

  function mistakes(courseCode) {
    const redeemed = new Set(eventList().filter(event => event.type === "mistake_redeemed").map(event => `${event.meta.questionId}:${event.meta.attemptEventId}`));
    const latest = new Map();
    eventList().filter(event => event.type === "question_attempt" && event.meta && (!courseCode || event.courseCode === courseCode)).forEach(event => latest.set(event.meta.questionId, event));
    return [...latest.values()].reverse().filter(event => !event.meta.correct && !redeemed.has(`${event.meta.questionId}:${event.eventId}`)).map(event => ({ ...event.meta, questionId: event.meta.questionId, attemptEventId: event.eventId, attemptAt: event.at, lessonId: event.lessonId, courseCode: event.courseCode }));
  }

  function recordQuestionAttempt(input) {
    const item = input || {};
    const question = item.question || {};
    if (!question.id) throw new Error("Question attempts require a question id");
    return recordEvidence({
      eventId: `question:${item.attemptId || "attempt"}:${question.id}`,
      type: "question_attempt",
      courseCode: item.courseCode,
      lessonId: question.lessonId,
      xp: 0,
      meta: {
        questionId: question.id,
        correct: !!item.correct,
        raw: item.raw,
        type: question.type,
        prompt: question.prompt,
        choices: question.choices || [],
        answer: question.answer,
        solution: question.solution,
        explanation: question.explanation,
        misconception: question.misconception,
        sourceRefs: question.sourceRefs || [],
        difficulty: question.difficulty,
        skill: question.skill,
        cognitiveLevel: question.cognitiveLevel,
        gradingMode: item.gradingMode || null,
        gradingStatus: item.gradingStatus || null,
        gradedBy: item.gradedBy || null,
        gradeScore: item.score == null ? null : Number(item.score),
        feedback: item.feedback || ""
      }
    });
  }

  function retrievalBase(lessonId, courseCode) {
    return { lessonId, courseCode: courseCode || null, interval: RETRIEVAL_INTERVALS[0], dueAt: new Date(clock().getTime() + RETRIEVAL_INTERVALS[0] * 86400000).toISOString(), reps: 0, lastAt: null, lastResult: null, lastConfidence: null, lastQuestionId: null };
  }

  function ensureRetrievalSchedule(lessonId, courseCode) {
    if (!lessonId) return null;
    const current = state.retrieval[lessonId];
    if (current) {
      if (!current.courseCode && courseCode) current.courseCode = courseCode;
      return current;
    }
    const schedule = retrievalBase(lessonId, courseCode);
    state.retrieval[lessonId] = schedule;
    return schedule;
  }

  function ensureRetrievalSchedules(lessonList) {
    let changed = false;
    (lessonList || []).forEach(lesson => {
      if (!lesson || !lesson.id) return;
      const mastery = state.mastery[lesson.id];
      if (!mastery || Number(mastery.score) < 0.8 || state.retrieval[lesson.id]) return;
      ensureRetrievalSchedule(lesson.id, lesson.courseId || lesson.courseCode);
      changed = true;
    });
    if (changed) save();
    return Object.values(state.retrieval).map(item => ({ ...item }));
  }

  function retrievalFor(lessonId) {
    const item = state.retrieval[lessonId];
    return item ? { ...item } : null;
  }

  function retrievalList(courseCode, predicate) {
    return Object.values(state.retrieval)
      .filter(item => !courseCode || item.courseCode === courseCode)
      .filter(item => !predicate || predicate(item))
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
      .map(item => ({ ...item }));
  }

  function dueRetrievals(courseCode) {
    const now = clock().getTime();
    return retrievalList(courseCode, item => item.dueAt && new Date(item.dueAt).getTime() <= now);
  }

  function upcomingRetrievals(courseCode, days) {
    const end = clock().getTime() + Math.max(1, Number(days) || 14) * 86400000;
    return retrievalList(courseCode, item => item.dueAt && new Date(item.dueAt).getTime() > clock().getTime() && new Date(item.dueAt).getTime() <= end);
  }

  function normalizeConfidence(value) {
    if (typeof value === "string") {
      const key = value.toLowerCase();
      if (key === "low") return 1;
      if (key === "high" || key === "good") return 3;
      return 2;
    }
    return Math.max(1, Math.min(3, Number(value) || 1));
  }

  function recordRetrieval(input) {
    const item = input || {};
    if (!item.lessonId || !item.questionId) throw new Error("Spaced retrieval requires lessonId and questionId");
    const reviewId = String(item.reviewId || `${item.lessonId}:${item.questionId}:${clock().getTime()}`);
    const eventId = `retrieval:${reviewId}`;
    if (state.events[eventId]) return { ...retrievalFor(item.lessonId), duplicate: true };
    const correct = !!item.correct;
    const confidence = normalizeConfidence(item.confidence);
    const previous = ensureRetrievalSchedule(item.lessonId, item.courseCode);
    const before = Number(previous.interval) || RETRIEVAL_INTERVALS[0];
    let nextInterval;
    if (!correct) {
      previous.reps = Math.max(0, Number(previous.reps) - 1);
      nextInterval = Math.max(1, Math.floor(before / 2));
    } else if (confidence >= 2) {
      previous.reps = Number(previous.reps) + 1;
      nextInterval = RETRIEVAL_INTERVALS[Math.min(previous.reps, RETRIEVAL_INTERVALS.length - 1)];
    } else {
      nextInterval = before;
    }
    previous.interval = nextInterval;
    previous.dueAt = new Date(clock().getTime() + nextInterval * 86400000).toISOString();
    previous.lastAt = timestamp();
    previous.lastResult = correct ? "correct" : "failed";
    previous.lastConfidence = confidence;
    previous.lastQuestionId = item.questionId;
    const event = recordEvidence({
      eventId,
      type: correct ? "recall_correct" : "retrieval_failed",
      courseCode: item.courseCode || previous.courseCode,
      lessonId: item.lessonId,
      xp: correct ? 5 : 0,
      meta: { questionId: item.questionId, correct, confidence, gradingMode: item.gradingMode || "heuristic", gradeScore: item.gradeScore == null ? null : Number(item.gradeScore), intervalBefore: before, intervalAfter: nextInterval, reps: previous.reps }
    });
    save();
    return { ...previous, event, duplicate: false };
  }

  function redeemMistake(questionId, attemptEventId) {
    const original = eventList().find(event => event.eventId === attemptEventId && event.type === "question_attempt");
    return recordEvidence({
      eventId: `mistake:${questionId}:${attemptEventId}`,
      type: "mistake_redeemed",
      courseCode: original && original.courseCode,
      lessonId: original && original.lessonId,
      xp: 8,
      meta: { questionId, attemptEventId }
    });
  }

  function readingFor(resourceId) {
    const item = state.reading[String(resourceId || "")];
    return item ? { ...item } : null;
  }

  function recordReading(input) {
    const item = input || {};
    const resourceId = String(item.resourceId || "").trim();
    if (!resourceId) throw new Error("Reading progress requires a stable resourceId");
    const total = Math.max(1, Number(item.total) || 1);
    const position = Math.max(1, Math.min(total, Number(item.position) || 1));
    const previous = state.reading[resourceId] || {};
    const progress = {
      ...previous,
      resourceId,
      kind: String(item.kind || previous.kind || "reading"),
      courseCode: item.courseCode || previous.courseCode || null,
      sourceId: item.sourceId || previous.sourceId || null,
      title: item.title || previous.title || null,
      unit: item.unit || previous.unit || "page",
      position,
      furthest: Math.max(Number(previous.furthest) || 0, position),
      total,
      completed: !!previous.completed || position >= total || item.completed === true,
      lastAt: timestamp()
    };
    state.reading[resourceId] = progress;
    const progressed = previous.position !== undefined && (
      position !== Number(previous.position) || progress.completed !== !!previous.completed
    );
    if (progressed) {
      recordEvidence({
        eventId: `reading:${resourceId}:${today()}`,
        type: "reading_progress",
        courseCode: progress.courseCode,
        xp: 0,
        meta: { resourceId, kind: progress.kind, position, total }
      });
    }
    touch();
    return { ...progress };
  }

  function readingList(courseCode, kind) {
    return Object.values(state.reading)
      .filter(item => !courseCode || item.courseCode === courseCode)
      .filter(item => !kind || item.kind === kind)
      .sort((a, b) => new Date(b.lastAt || 0) - new Date(a.lastAt || 0))
      .map(item => ({ ...item }));
  }

  function gamification() {
    const events = eventList();
    const activeDays = activeDayMap(events);
    const xp = events.reduce((sum, event) => sum + (Number(event.xp) || 0), 0);
    const todayKey = today();
    return {
      xp,
      streak: streakFor(activeDays, todayKey),
      todayXp: events.filter(event => calendarDay(event.at) === todayKey).reduce((sum, event) => sum + (Number(event.xp) || 0), 0),
      goalXp: 50,
      activeDays,
      level: levelFor(xp)
    };
  }

  const api = {
    get raw() { return state; },
    get schemaVersion() { return SCHEMA_VERSION; },
    task(id) { return state.tasks[id] || { status: "todo", checks: [] }; },
    setTask(id, patch) { state.tasks[id] = { ...this.task(id), ...patch }; touch(); },
    toggleCheck(id, index) { const task = this.task(id), checks = Array.isArray(task.checks) ? task.checks.slice() : []; checks[index] = !checks[index]; this.setTask(id, { checks }); },
    markLesson,
    setLastLesson,
    lastLesson() { return state.lastLesson ? { ...state.lastLesson } : null; },
    lessonDone(id) { return !!state.lessons[id]; },
    recordEvidence,
    recordSimulation(name, courseCode, lessonId) { return recordEvidence({ eventId: `lab:${name}`, type: "simulation_completed", courseCode, lessonId, xp: 10, meta: { lab: name } }); },
    recordAttempt,
    recordQuestionAttempt,
    questionStats,
    allQuestionStats,
    mistakes,
    redeemMistake,
    attempts() { return state.attempts.slice(); },
    activePractice() { return state.activePractice ? JSON.parse(JSON.stringify(state.activePractice)) : null; },
    setActivePractice(value) {
      state.activePractice = activePracticeSnapshot(value);
      save();
      return this.activePractice();
    },
    clearActivePractice(attemptId) {
      if (!attemptId || !state.activePractice || state.activePractice.attemptId === attemptId) {
        state.activePractice = null;
        save();
      }
      return null;
    },
    events() { return eventList(); },
    masteryFor(id) { return state.mastery[id] || { score: 0, attempts: 0, correct: 0, lastAt: null }; },
    masteryByCourse(code, lessonList) { return (lessonList || []).map(lesson => ({ lesson, mastery: this.masteryFor(lesson.id) })).filter(item => item.mastery.attempts > 0); },
    questState,
    recognition,
    courseProgress(code, lessonList) { const all = (lessonList || []).filter(Boolean), done = all.filter(lesson => this.lessonDone(lesson.id)).length; return { done, total: all.length, pct: all.length ? Math.round(done / all.length * 100) : 0 }; },
    retrievalFor,
    ensureRetrievalSchedules,
    dueRetrievals,
    upcomingRetrievals,
    recordRetrieval,
    readingFor,
    recordReading,
    readingList,
    gamification,
    setSyncScheduler(scheduler) { syncScheduler = typeof scheduler === "function" ? scheduler : null; },
    importData(value) {
      try {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
        state = migrate(parsed);
        save();
        return true;
      } catch (_) {
        return false;
      }
    },
    reset() { state = blank(); save(); }
  };

  return Object.freeze(api);
});
