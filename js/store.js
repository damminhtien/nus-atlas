/* ============================================================
   ATLAS — persistent state (localStorage), XP, SRS, achievements
   Pure global (no modules) so it works on file:// and Pages.
   ============================================================ */
(function () {
  "use strict";
  const KEY = "atlas.v1";

  // ---- XP awards -------------------------------------------------------
  const XP = { lesson: 50, mcqCorrect: 10, mcqPerfect: 30, cardReview: 4, hwReveal: 6 };

  // Level thresholds: total XP needed to *reach* a level (index = level-1).
  // Quadratic-ish curve, named after scholarly ranks.
  // NOTE: the index.html pre-hydrate script mirrors this curve (and the flame tiers) to paint the level
  // badge before the deferred scripts boot — keep the two arrays in sync if you add/rename a rank.
  const LEVELS = [
    { t: 0,    name: "Novice" },
    { t: 150,  name: "Apprentice" },
    { t: 400,  name: "Student" },
    { t: 800,  name: "Scholar" },
    { t: 1400, name: "Adept" },
    { t: 2200, name: "Savant" },
    { t: 3200, name: "Sage" },
    { t: 4500, name: "Master" },
    { t: 6200, name: "Luminary" },
    { t: 8500, name: "Polymath" },
    { t: 12000, name: "Grandmaster" },
    { t: 18000, name: "Oracle" },
    { t: 26000, name: "Laureate" },
    { t: 32000, name: "Magnum" }
  ];

  const ACHIEVEMENTS = [
    { id: "first-step",  icon: "🌱", name: "First Step",      desc: "Complete your first lesson." },
    { id: "perfect",     icon: "🎯", name: "Bullseye",        desc: "Ace a quiz with 100%." },
    { id: "streak3",     icon: "🔥", name: "Kindling",        desc: "Reach a 3-day streak." },
    { id: "streak7",     icon: "⚡", name: "On Fire",         desc: "Reach a 7-day streak." },
    { id: "cards25",     icon: "🃏", name: "Card Sharp",      desc: "Review 25 flashcards." },
    { id: "scholar",     icon: "📜", name: "Scholar",         desc: "Reach Scholar level." },
    { id: "ten-lessons", icon: "📚", name: "Bookworm",        desc: "Complete 10 lessons." },
    { id: "topic-clear", icon: "🏛️", name: "Pillar of Knowledge", desc: "Finish every lesson in a course." },
    { id: "test-taker",  icon: "📝", name: "Examined",         desc: "Complete a custom test." },
    { id: "exam-ace",    icon: "🥇", name: "Exam Ace",         desc: "Score 100% on a 10+ question test." },
    { id: "curious",     icon: "🔭", name: "Curious Mind",     desc: "Study a Concept of the Day." },
    { id: "visualizer",  icon: "🎛️", name: "Visualizer",       desc: "Open an interactive visualization." },
    { id: "pathfinder",  icon: "🧭", name: "Pathfinder",       desc: "Open a guided learning path." },
    { id: "calibrated",  icon: "🎯", name: "Calibrated",       desc: "Complete a placement test." },
    { id: "coder",       icon: "💻", name: "Hello, World",     desc: "Run code in the playground." },
    { id: "mastered-one",icon: "🏔️", name: "Mastery",          desc: "Reach 80% mastery on a concept." },
    { id: "module-master",icon:"📗", name: "Module Master",    desc: "Complete every lesson in a module." },
    { id: "all-topics",  icon: "🌍", name: "Renaissance",      desc: "Study a lesson in every subject." },
    { id: "century",     icon: "💯", name: "Centurion",        desc: "Review 100 flashcards." },
    { id: "streak30",    icon: "🗓️", name: "Devoted",          desc: "Reach a 30-day streak." },
    { id: "polymath",    icon: "👑", name: "Polymath",        desc: "Reach the Polymath rank." },
    { id: "recaller",    icon: "🧠", name: "Explain It Back",  desc: "Self-score your first free recall." },
    { id: "total-recall",icon: "🎓", name: "Total Recall",     desc: "Recall every key point of a lesson." },
    { id: "deep-diver",  icon: "🧗", name: "Deep Diver",       desc: "Reach 80% mastery on 10 concepts." },
    { id: "well-rounded",icon: "⚖️", name: "Well-Rounded",     desc: "Reach Proficient mastery in every subject." },
    { id: "half-century",icon: "🏅", name: "Half-Century",     desc: "Complete 50 lessons." },
    { id: "streak100",   icon: "🛡️", name: "Iron Will",        desc: "Reach a 100-day streak." },
    { id: "mcq-100",     icon: "🏹", name: "Sharpshooter",     desc: "Answer 100 quiz questions correctly." },
    { id: "mcq-500",     icon: "🦅", name: "Deadeye",          desc: "Answer 500 quiz questions correctly." },
    { id: "cards-500",   icon: "🏰", name: "Memory Palace",    desc: "Review 500 flashcards." },
    { id: "homework-hero",icon:"✍️", name: "Homework Hero",    desc: "Work through 25 homework solutions." },
    { id: "test-veteran",icon: "🗂️", name: "Test Veteran",     desc: "Complete 10 custom tests." },
    { id: "loremaster",  icon: "🦉", name: "Loremaster",       desc: "Reach 80% mastery on 25 concepts." },
    { id: "erudite",     icon: "✨", name: "Erudite",          desc: "Earn 5,000 total XP." },
    { id: "atlas-complete",icon:"🌐",name: "Atlas Complete",   desc: "Complete every lesson in every subject." },
    { id: "redeemer",     icon: "♻️", name: "Redeemer",         desc: "Turn 25 missed questions into correct ones." },
    { id: "curator",     icon: "📌", name: "Curator",          desc: "Bookmark 5 lessons to revisit." },
    { id: "annotator",   icon: "🖊️", name: "Annotator",        desc: "Write your own notes on 5 lessons." },
    { id: "flawless-five",icon:"💎", name: "Flawless Five",     desc: "Ace 5 quizzes with a perfect score." },
    { id: "crack-shot",  icon: "🎖️", name: "Crack Shot",        desc: "Answer 1,000 quiz questions correctly." },
    { id: "deep-thinker",icon: "🧩", name: "Deep Thinker",      desc: "Expand a “Deeper dive” intuition." },
    { id: "deep-reader", icon: "📖", name: "Deep Reader",       desc: "Open 25 different “Deeper dive” sections." },
    { id: "deep-voyager",icon: "🔭", name: "Deep Voyager",      desc: "Open 75 different “Deeper dive” sections." },
    { id: "deep-work",   icon: "🧘", name: "Deep Work",         desc: "Complete 5 focus-timer sessions." },
    { id: "daily-ritual",icon: "🌅", name: "Daily Ritual",      desc: "Finish a Daily Mix session." },
    { id: "habit",       icon: "📆", name: "Creature of Habit", desc: "Study on 14 different days." },
    { id: "sage",        icon: "🧙", name: "Sage",              desc: "Earn 25,000 total XP." },
    { id: "self-examiner",icon:"🔎", name: "Self-Examiner",     desc: "Try a lecture's Quick Check." },
    { id: "quick-ace",   icon: "🌟", name: "Quick Ace",         desc: "Ace a Quick Check — all answers right." },
    { id: "viz-voyager", icon: "🛰️", name: "Viz Voyager",       desc: "Open 15 different visualizations." },
    { id: "lessons-100", icon: "📕", name: "Centenarian",       desc: "Complete 100 lessons." },
    { id: "marksman",    icon: "🏆", name: "Marksman",          desc: "Answer 2,000 quiz questions correctly." },
    { id: "savant",      icon: "🗿", name: "Savant",            desc: "Reach 80% mastery on 50 concepts." },
    { id: "viz-complete",icon: "🔬", name: "Full Spectrum",     desc: "Open every visualization in the Lab." },
    { id: "code-solver", icon: "🧪", name: "It Runs!",          desc: "Solve a lesson code exercise — output matches." },
    { id: "code-adept",  icon: "⌨️", name: "Code Adept",        desc: "Solve 10 lesson code exercises." },
    { id: "code-master", icon: "🛠️", name: "Code Virtuoso",     desc: "Solve 30 lesson code exercises." },
    { id: "viz-50",      icon: "🗺️", name: "Cartographer",      desc: "Open 50 different visualizations." },
    // ── endgame capstones (matched to the complete 9-topic site: 164 lessons, 117 code exercises, 98 visualizations, all topics) ──
    { id: "summit",      icon: "🗻", name: "Summit",            desc: "Reach 80% mastery on 100 concepts." },
    { id: "streak-365",  icon: "🎇", name: "Year of Fire",      desc: "Reach a 365-day streak." },
    { id: "mcq-5000",    icon: "🌠", name: "Living Legend",     desc: "Answer 5,000 quiz questions correctly." },
    { id: "luminary",    icon: "💫", name: "Luminary",          desc: "Earn 100,000 total XP." },
    { id: "exam-master", icon: "🏵️", name: "Grand Examiner",    desc: "Score 100% on a 40-question test." }
  ];

  function blank() {
    return {
      xp: 0,
      lessons: {},          // lessonId -> true
      mcq: { correct: 0, total: 0 },
      cardsReviewed: 0,
      cards: {},            // cardId -> { ease, interval, due, reps }
      streak: 0,
      maxStreak: 0,         // longest streak ever reached (a personal best)
      lastActive: null,     // YYYY-MM-DD
      achievements: {},     // id -> true
      hwRevealed: {},       // hwId -> true (so XP awarded once)
      tests: [],            // [{label, correct, total}] custom-test history
      mastery: {},          // lessonId -> { s:0..1 score, ts:lastPracticeMs, n:attempts }
      notes: {},            // lessonId -> free text note
      goalXp: 50,           // daily XP goal
      newPerSession: 30,    // cap on brand-new flashcards introduced per Daily Review session
      goalCelebrated: null, // "YYYY-MM-DD" the daily-goal celebration last fired (so it fires once/day)
      activity: {},         // "YYYY-MM-DD" -> xp earned that day (study heatmap)
      activeDays: {},       // "YYYY-MM-DD" -> 1 for every day the app counted toward the streak (lights the consistency strip even on a no-XP visit)
      topicDoneCelebrated: {}, // courseId -> timestamp the "whole subject complete" celebration fired (once per topic)
      freezes: 1,           // streak-freeze tokens
      lastLesson: null,     // "courseId/lessonId" — resume point
      bookmarks: {},        // lessonId -> true (saved/favorited lessons)
      missed: {},           // "lessonId#qIdx" -> 1 (questions answered wrong, waiting to be redeemed)
      missedFixed: 0,       // lifetime count of missed questions later answered correctly
      perfectQuizzes: 0,    // lifetime count of 100% lesson quizzes (for the Flawless Five achievement)
      focusSessions: 0,     // lifetime count of completed focus-timer sessions (for the Deep Work achievement)
      quickChecks: 0,       // lifetime count of inline Quick Checks completed (low-stakes retrieval)
      vizSeen: {},          // vizId -> true (distinct visualizations opened, for Viz Voyager)
      solvedCode: {},       // codeKey -> true (distinct code-exercises solved, output matched)
      deepDivesSeen: {}     // "lessonId#k" -> true (distinct deeper-dives opened, for Deep Reader/Voyager)
    };
  }

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function dayDiff(a, b) {
    if (!a || !b) return Infinity;
    const da = new Date(a + "T00:00:00"), db = new Date(b + "T00:00:00");
    return Math.round((db - da) / 86400000);
  }

  let state = load();

  function load() {
    let s;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
    const base = blank();
    if (s && typeof s === "object") {
      // NaN-safe migration: merge known fields, coerce numbers.
      base.xp = num(s.xp);
      base.lessons = s.lessons || {};
      base.mcq = { correct: num(s.mcq && s.mcq.correct), total: num(s.mcq && s.mcq.total) };
      base.cardsReviewed = num(s.cardsReviewed);
      base.cards = s.cards || {};
      base.streak = num(s.streak);
      base.maxStreak = Math.max(num(s.maxStreak), num(s.streak));   // never below the current streak (back-fills old saves)
      base.lastActive = s.lastActive || null;
      base.achievements = s.achievements || {};
      base.hwRevealed = s.hwRevealed || {};
      base.tests = Array.isArray(s.tests) ? s.tests : [];
      base.mastery = s.mastery || {};
      base.notes = s.notes || {};
      base.goalXp = num(s.goalXp) || 50;
      base.newPerSession = Number.isFinite(s.newPerSession) ? Math.max(5, Math.min(100, s.newPerSession)) : 30;
      base.goalCelebrated = typeof s.goalCelebrated === "string" ? s.goalCelebrated : null;
      base.activity = s.activity || {};
      base.activeDays = (s.activeDays && typeof s.activeDays === "object") ? s.activeDays : {};
      base.topicDoneCelebrated = (s.topicDoneCelebrated && typeof s.topicDoneCelebrated === "object") ? s.topicDoneCelebrated : {};
      base.freezes = Number.isFinite(s.freezes) ? s.freezes : 1;
      base.lastLesson = s.lastLesson || null;
      base.bookmarks = s.bookmarks || {};
      base.missed = (s.missed && typeof s.missed === "object") ? s.missed : {};
      base.missedFixed = num(s.missedFixed);
      base.perfectQuizzes = num(s.perfectQuizzes);
      base.focusSessions = Number.isFinite(s.focusSessions) ? s.focusSessions : 0;
      base.quickChecks = num(s.quickChecks);
      base.vizSeen = (s.vizSeen && typeof s.vizSeen === "object") ? s.vizSeen : {};
      base.solvedCode = (s.solvedCode && typeof s.solvedCode === "object") ? s.solvedCode : {};
      base.deepDivesSeen = (s.deepDivesSeen && typeof s.deepDivesSeen === "object") ? s.deepDivesSeen : {};
    }
    // Backfill activeDays from the streak: a streak of N means the N consecutive days ending at lastActive were
    // active. Reconstruct them so the consistency strip immediately matches the streak the header shows — otherwise a
    // user who kept a streak by opening the app (but earned no XP some days) saw all-empty squares. One-time, idempotent.
    if (base.lastActive && base.streak > 0) {
      const p = base.lastActive.split("-").map(Number);
      const end = new Date(p[0], p[1] - 1, p[2]), pad = n => String(n).padStart(2, "0");
      for (let k = 0, cap = Math.min(base.streak, 400); k < cap; k++) {
        const d = new Date(end); d.setDate(end.getDate() - k);
        const key = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
        if (!base.activeDays[key]) base.activeDays[key] = 1;
      }
    }
    return base;
  }
  function num(v) { v = Number(v); return Number.isFinite(v) ? v : 0; }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    if (typeof window === "object" && window.ATLAS_SYNC_CLIENT && typeof window.ATLAS_SYNC_CLIENT.schedule === "function") window.ATLAS_SYNC_CLIENT.schedule();
  }

  // ---- streak ----------------------------------------------------------
  let _freezeJustUsed = false, _streakJustUp = false, _streakRecord = false, _freezeEarned = false;
  // NOTE: the index.html pre-hydrate script mirrors this day-diff logic to paint the correct streak/flame
  // before the deferred scripts boot — keep the two in sync if you change the streak rules here.
  function touchStreak() {
    const t = todayStr();
    if (!state.activeDays || typeof state.activeDays !== "object") state.activeDays = {};
    state.activeDays[t] = 1;            // mark today active on every open, so the consistency strip lights up even without XP
    if (state.lastActive === t) { save(); return; }
    const diff = dayDiff(state.lastActive, t);
    if (diff === 1) { state.streak += 1; _streakJustUp = true; }
    else if (diff <= 0) { /* same day or clock weirdness */ }
    else if (diff === 2 && state.freezes > 0) { state.freezes -= 1; state.streak += 1; _freezeJustUsed = true; _streakJustUp = true; } // missed 1 day, freeze saves it
    else state.streak = 1;          // missed >1 day (or no freeze) -> reset
    if (state.streak < 1) state.streak = 1;
    if (state.streak > num(state.maxStreak)) { state.maxStreak = state.streak; if (state.streak >= 3) _streakRecord = true; }   // new personal-best streak (past the trivial 1-2)
    state.lastActive = t;
    // earn a freeze at each 7-day milestone (cap 3) — signal it so the UI can celebrate the reward
    if (diff === 1 && state.streak % 7 === 0 && num(state.freezes) < 3) { state.freezes = num(state.freezes) + 1; _freezeEarned = true; }
    if (state.streak >= 3) unlock("streak3");
    if (state.streak >= 7) unlock("streak7");
    if (state.streak >= 30) unlock("streak30");
    if (state.streak >= 100) unlock("streak100");
    if (state.streak >= 365) unlock("streak-365");
    save();
  }
  function freezeJustUsed() { const v = _freezeJustUsed; _freezeJustUsed = false; return v; }
  function streakJustUp() { const v = _streakJustUp; _streakJustUp = false; return v; }
  function streakRecord() { const v = _streakRecord; _streakRecord = false; return v; }   // current streak just set a new all-time high
  function freezeEarned() { const v = _freezeEarned; _freezeEarned = false; return v; }   // just earned a streak-freeze at a 7-day milestone
  // lifetime personal bests, computed from existing history (+ the tracked maxStreak)
  function personalBests() {
    const act = state.activity || {};
    const dayXps = Object.values(act).map(num);
    const tests = (state.tests || []).filter(t => num(t.total) > 0);
    const testPct = tests.map(t => Math.round(num(t.correct) / num(t.total) * 100));
    return {
      longestStreak: Math.max(num(state.maxStreak), num(state.streak)),
      bestDayXp: dayXps.length ? Math.max.apply(null, dayXps) : 0,
      daysStudied: Object.keys(act).length,
      bestTestPct: testPct.length ? Math.max.apply(null, testPct) : 0,
      testsRecorded: tests.length
    };
  }
  function markKnown(lessonId) { if (!lessonId) return; state.mastery[lessonId] = { s: 0.65, ts: Date.now(), n: 1 }; save(); }
  function setLastLesson(key) { if (state.lastLesson !== key) { state.lastLesson = key; save(); } }
  // ---- bookmarks (saved lessons) --------------------------------------
  function toggleBookmark(id) { if (!id) return false; if (state.bookmarks[id]) delete state.bookmarks[id]; else { state.bookmarks[id] = true; if (Object.keys(state.bookmarks).length >= 5) unlock("curator"); } save(); return !!state.bookmarks[id]; }
  function isBookmarked(id) { return !!state.bookmarks[id]; }
  function bookmarkIds() { return Object.keys(state.bookmarks || {}); }
  // ---- missed-question deck (questions answered wrong → drill until redeemed) ----
  function missKey(lessonId, qIdx) { return lessonId + "#" + qIdx; }
  function recordMiss(lessonId, qIdx) { if (lessonId == null || qIdx == null) return; state.missed[missKey(lessonId, qIdx)] = 1; save(); }
  function clearMiss(lessonId, qIdx) {
    if (lessonId == null || qIdx == null) return false;
    const k = missKey(lessonId, qIdx);
    if (!state.missed[k]) return false;
    delete state.missed[k];
    state.missedFixed = num(state.missedFixed) + 1;
    if (state.missedFixed >= 25) unlock("redeemer");
    save(); return true;
  }
  function missedKeys() { return Object.keys(state.missed || {}); }
  function missedCount() { return Object.keys(state.missed || {}).length; }
  // ---- inline Quick Check (no-stakes retrieval) — rewards the BEHAVIOR, not the score ----
  function recordQuickCheck(correct, total) {
    state.quickChecks = num(state.quickChecks) + 1;
    unlock("self-examiner");
    if (num(total) > 0 && num(correct) >= num(total)) unlock("quick-ace");
    save();
  }
  // ---- visualization exploration (distinct widgets opened) ----
  function recordVizOpen(id) {
    if (id) { if (!state.vizSeen || typeof state.vizSeen !== "object") state.vizSeen = {}; state.vizSeen[id] = true; }
    unlock("visualizer");
    if (Object.keys(state.vizSeen || {}).length >= 15) unlock("viz-voyager");
    if (Object.keys(state.vizSeen || {}).length >= 50) unlock("viz-50");
    const vizTotal = (window.VIZ_CATALOG || []).length;   // "Full Spectrum": opened every widget in the Lab
    if (vizTotal && Object.keys(state.vizSeen || {}).length >= vizTotal) unlock("viz-complete");
    save();
  }

  // ---- deeper-dive exploration (distinct dives opened) ----
  function recordDeepDive(key) {
    if (key) { if (!state.deepDivesSeen || typeof state.deepDivesSeen !== "object") state.deepDivesSeen = {}; state.deepDivesSeen[key] = true; }
    unlock("deep-thinker");
    const n = Object.keys(state.deepDivesSeen || {}).length;
    if (n >= 25) unlock("deep-reader");
    if (n >= 75) unlock("deep-voyager");
    save();
  }

  // ---- code exercises (output matched the expected) ----
  function recordCodeSolved(key) {
    if (!state.solvedCode || typeof state.solvedCode !== "object") state.solvedCode = {};
    const first = !!key && !state.solvedCode[key];
    if (first) { state.solvedCode[key] = true; addXP(15); }      // reward only the first solve of each exercise
    const count = Object.keys(state.solvedCode).length;
    unlock("code-solver");
    if (count >= 10) unlock("code-adept");
    if (count >= 30) unlock("code-master");
    save();
    return { first: first, count: count };
  }

  // ---- XP / level ------------------------------------------------------
  const levelUps = [];
  let _goalJustReached = false;   // transient: set when today's XP first crosses the daily goal (drained by the UI)
  let _bestDaySet = 0;            // transient: today's total the moment it first beats your all-time best day (drained by the UI)
  function levelNumFor(xp) { let lvl = 1; for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].t) lvl = i + 1; return lvl; }
  function drainLevelUps() { return levelUps.splice(0, levelUps.length); }
  function goalJustReached() { const v = _goalJustReached; _goalJustReached = false; return v; }
  function bestDayJustSet() { const v = _bestDaySet; _bestDaySet = 0; return v; }   // new single-day XP record (0 = none)
  function addXP(amount) {
    amount = num(amount);
    const before = levelNumFor(state.xp);
    state.xp += amount;
    const after = levelNumFor(state.xp);
    if (amount > 0) {
      const t = todayStr(), prev = num(state.activity[t]);
      state.activity[t] = prev + amount;
      // fire the daily-goal celebration the moment today's XP crosses the goal (once per day)
      if (prev < state.goalXp && state.activity[t] >= state.goalXp && state.goalCelebrated !== t) {
        _goalJustReached = true; state.goalCelebrated = t;
      }
      // new best day: did THIS gain push today past your previous best-ever day? (fires once, on the crossing)
      let prevBest = 0; for (const d in state.activity) { if (d !== t) { const v = num(state.activity[d]); if (v > prevBest) prevBest = v; } }
      if (prevBest > 0 && prev <= prevBest && state.activity[t] > prevBest) _bestDaySet = state.activity[t];
    }
    if (after > before) for (let lv = before + 1; lv <= after; lv++) levelUps.push({ level: lv, name: (LEVELS[lv - 1] || {}).name || "" });
    const lv = levelInfo();
    if (lv.level >= 4) unlock("scholar");
    if (state.xp >= 8500) unlock("polymath");
    if (state.xp >= 5000) unlock("erudite");
    if (state.xp >= 25000) unlock("sage");
    if (state.xp >= 100000) unlock("luminary");
    if (Object.keys(state.activity || {}).length >= 14) unlock("habit");
    save();
    return state.xp;
  }
  // NUS evidence uses its own idempotent ledger, but shares the global streak and XP UI.
  function recordNusEvidence(evidence) {
    const amount = num(evidence && evidence.xp);
    touchStreak();
    if (amount > 0) addXP(amount);
    return { xp: amount, streak: state.streak, level: levelInfo().level };
  }
  function levelInfo() {
    let level = 1, idx = 0;
    for (let i = 0; i < LEVELS.length; i++) {
      if (state.xp >= LEVELS[i].t) { level = i + 1; idx = i; }
    }
    const cur = LEVELS[idx];
    const next = LEVELS[idx + 1] || null;
    const into = state.xp - cur.t;
    const span = next ? next.t - cur.t : 1;
    return {
      level, name: cur.name,
      xp: state.xp,
      pct: next ? Math.min(100, Math.round((into / span) * 100)) : 100,
      into, span, next, toNext: next ? next.t - state.xp : 0
    };
  }

  // ---- achievements ----------------------------------------------------
  const newlyUnlocked = [];
  function unlock(id) {
    if (state.achievements[id]) return false;
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return false;
    state.achievements[id] = true;
    newlyUnlocked.push(def);
    save();
    return true;
  }
  function drainUnlocked() { return newlyUnlocked.splice(0, newlyUnlocked.length); }
  // Fire the "whole subject complete" celebration at most once per topic. Returns true the first time.
  // Record a completed focus-timer session and unlock Deep Work at 5.
  function addFocusSession() {
    state.focusSessions = (Number.isFinite(state.focusSessions) ? state.focusSessions : 0) + 1;
    if (state.focusSessions >= 5) unlock("deep-work");
    save();
    return state.focusSessions;
  }
  function celebrateTopicOnce(cid) {
    if (!cid || (state.topicDoneCelebrated && state.topicDoneCelebrated[cid])) return false;
    if (!state.topicDoneCelebrated || typeof state.topicDoneCelebrated !== "object") state.topicDoneCelebrated = {};
    state.topicDoneCelebrated[cid] = Date.now();
    save();
    return true;
  }

  // ---- lesson / mcq / homework ----------------------------------------
  function completeLesson(lessonId) {
    touchStreak();
    if (!state.lessons[lessonId]) {
      state.lessons[lessonId] = true;
      addXP(XP.lesson);
      bumpMastery(lessonId, "lecture");
      unlock("first-step");
      if (Object.keys(state.lessons).length >= 10) unlock("ten-lessons");
      if (Object.keys(state.lessons).length >= 50) unlock("half-century");
      if (Object.keys(state.lessons).length >= 100) unlock("lessons-100");
      checkCourseCompletion();
      if (window.COURSES) {
        for (const c of window.COURSES) for (const m of c.modules) if (m.lessons.length && m.lessons.every(l => state.lessons[l.id])) unlock("module-master");
        if (window.COURSES.every(c => c.modules.some(m => m.lessons.some(l => state.lessons[l.id])))) unlock("all-topics");
        if (window.COURSES.every(c => c.modules.every(m => m.lessons.every(l => state.lessons[l.id])))) unlock("atlas-complete");
      }
    }
    save();
  }
  function isLessonDone(id) { return !!state.lessons[id]; }

  function checkCourseCompletion() {
    if (!window.COURSES) return;
    for (const c of window.COURSES) {
      const ids = [];
      c.modules.forEach(m => m.lessons.forEach(l => ids.push(l.id)));
      if (ids.length && ids.every(id => state.lessons[id])) { unlock("topic-clear"); return; }
    }
  }

  function recordQuiz(correct, total, lessonId) {
    touchStreak();
    correct = num(correct); total = num(total);
    state.mcq.correct += correct;
    state.mcq.total += total;
    addXP(correct * XP.mcqCorrect);
    if (total > 0 && correct === total) { addXP(XP.mcqPerfect); unlock("perfect"); state.perfectQuizzes = num(state.perfectQuizzes) + 1; if (state.perfectQuizzes >= 5) unlock("flawless-five"); }
    if (state.mcq.correct >= 100) unlock("mcq-100");
    if (state.mcq.correct >= 500) unlock("mcq-500");
    if (state.mcq.correct >= 1000) unlock("crack-shot");
    if (state.mcq.correct >= 2000) unlock("marksman");
    if (state.mcq.correct >= 5000) unlock("mcq-5000");
    if (lessonId) { for (let k = 0; k < correct; k++) bumpMastery(lessonId, { correct: true }); for (let k = 0; k < total - correct; k++) bumpMastery(lessonId, { correct: false }); }
    save();
  }

  function recordTest(correct, total, label) {
    touchStreak();
    correct = num(correct); total = num(total);
    state.mcq.correct += correct; state.mcq.total += total;
    addXP(correct * 8);
    unlock("test-taker");
    if (total >= 10 && correct === total) { addXP(50); unlock("exam-ace"); }
    if (total >= 40 && correct === total) { addXP(100); unlock("exam-master"); }
    if (state.mcq.correct >= 100) unlock("mcq-100");
    if (state.mcq.correct >= 500) unlock("mcq-500");
    if (state.mcq.correct >= 1000) unlock("crack-shot");
    if (state.mcq.correct >= 2000) unlock("marksman");
    if (state.mcq.correct >= 5000) unlock("mcq-5000");
    state.tests.unshift({ label: String(label || "Test"), correct, total });
    state.tests = state.tests.slice(0, 25);
    if (state.tests.length >= 10) unlock("test-veteran");
    save();
  }

  function revealHomework(hwId) {
    if (state.hwRevealed[hwId]) return;
    state.hwRevealed[hwId] = true;
    addXP(XP.hwReveal);
    if (Object.keys(state.hwRevealed).length >= 25) unlock("homework-hero");
    save();
  }

  // ---- mastery model (decaying per-concept knowledge) ----
  const MASTERY_HALFLIFE = 45;   // days for decay to halve
  function bumpMastery(lessonId, ev) {
    if (!lessonId) return;
    let m = state.mastery[lessonId] || { s: 0, ts: Date.now(), n: 0 };
    let s = m.s;
    if (ev === "lecture") { s = Math.max(s, 0.25); }
    else if (ev && typeof ev.correct === "boolean") { s = ev.correct ? Math.min(1, s + 0.13 * (1 - s) + 0.03) : Math.max(0, s - 0.12); m.n++; }
    else if (ev && typeof ev.grade === "number") { s = Math.max(0, Math.min(1, s + [-0.10, 0.04, 0.08, 0.12][ev.grade])); m.n++; }
    m.s = s; m.ts = Date.now();
    state.mastery[lessonId] = m;
    if (effectiveMastery(lessonId) >= 0.8) unlock("mastered-one");
    if (window.COURSES) {
      let nMastered = 0;
      for (const c of window.COURSES) for (const mm of c.modules) for (const l of mm.lessons) if (effectiveMastery(l.id) >= 0.8) nMastered++;
      if (nMastered >= 10) unlock("deep-diver");
      if (nMastered >= 25) unlock("loremaster");
      if (nMastered >= 50) unlock("savant");
      if (nMastered >= 100) unlock("summit");
      if (window.COURSES.length >= 3 && window.COURSES.every(c => topicMastery(c.id) >= 0.55)) unlock("well-rounded");  // every subject ≥ Proficient (floor of 3 just guards the degenerate empty/loading case — not tied to the topic count)
    }
    save();
  }
  function effectiveMastery(lessonId) {
    const m = state.mastery[lessonId]; if (!m) return 0;
    const days = (Date.now() - num(m.ts)) / 86400000;
    return Math.max(0, Math.min(1, num(m.s) * Math.pow(2, -days / MASTERY_HALFLIFE)));
  }
  const M_LEVELS = [
    { min: 0.8, key: "mastered",   label: "Mastered",   color: "var(--sage)" },
    { min: 0.55, key: "proficient", label: "Proficient", color: "var(--gold)" },
    { min: 0.3, key: "learning",   label: "Learning",   color: "var(--violet)" },
    { min: 0.01, key: "seen",       label: "Seen",       color: "var(--ink-mute)" },
    { min: -1, key: "unseen",     label: "New",        color: "var(--line)" }
  ];
  function masteryLevel(eff) { return M_LEVELS.find(l => eff >= l.min); }
  function weakSpots() {
    const out = [];
    if (window.COURSES) window.COURSES.forEach(c => c.modules.forEach(mm => mm.lessons.forEach(l => {
      const m = state.mastery[l.id]; if (!m) return;            // only attempted concepts
      const eff = effectiveMastery(l.id);
      if (eff < 0.55) out.push({ lessonId: l.id, courseId: c.id, title: l.title, eff });
    })));
    return out.sort((a, b) => a.eff - b.eff);
  }
  // Concepts you once knew well that are now decaying — the spacing-effect "refresh before
  // you forget" surface. DISTINCT from weakSpots() (eff < 0.55 = struggling/reactive):
  // fading = reached real strength (stored s >= 0.7) but effective mastery has slipped into
  // the [0.55, 0.8) band as time passed. A quick revisit re-locks it. Most-faded first.
  function fadingConcepts() {
    const out = [];
    if (window.COURSES) window.COURSES.forEach(c => c.modules.forEach(mm => mm.lessons.forEach(l => {
      const m = state.mastery[l.id]; if (!m || num(m.s) < 0.7) return;   // must have reached real strength
      const eff = effectiveMastery(l.id);
      if (eff >= 0.55 && eff < 0.8) out.push({ lessonId: l.id, courseId: c.id, title: l.title, eff, peak: num(m.s) });
    })));
    return out.sort((a, b) => a.eff - b.eff);
  }
  function topicMastery(courseId) {
    const c = window.COURSES && window.COURSES.find(x => x.id === courseId); if (!c) return 0;
    let sum = 0, n = 0;
    c.modules.forEach(m => m.lessons.forEach(l => { sum += effectiveMastery(l.id); n++; }));
    return n ? sum / n : 0;
  }

  // ---- notes, daily goal, streak-freeze, export/import ----
  function getNote(lessonId) { return state.notes[lessonId] || ""; }
  function setNote(lessonId, text) { if (text && text.trim()) { state.notes[lessonId] = text; if (Object.keys(state.notes).length >= 5) unlock("annotator"); } else delete state.notes[lessonId]; save(); }
  function setGoal(xp) { state.goalXp = Math.max(10, num(xp)); save(); }
  function setNewPerSession(n) { state.newPerSession = Math.max(5, Math.min(100, num(n) || 30)); save(); }
  function todayXP() { return num(state.activity[todayStr()]); }
  function exportData() { return JSON.stringify(state); }
  function importData(json) {
    try { const obj = JSON.parse(json); if (!obj || typeof obj !== "object") return false; localStorage.setItem(KEY, JSON.stringify(obj)); state = load(); return true; }
    catch (e) { return false; }
  }

  // ---- spaced repetition (SM-2 lite) ----------------------------------
  // grade: 0=again, 1=hard, 2=good, 3=easy
  function gradeCard(cardId, grade) {
    touchStreak();
    let c = state.cards[cardId] || { ease: 2.5, interval: 0, due: 0, reps: 0 };
    if (grade === 0) {
      c.reps = 0; c.interval = 0; c.ease = Math.max(1.3, c.ease - 0.2);
    } else {
      c.reps += 1;
      if (c.reps === 1) c.interval = grade === 3 ? 2 : 1;
      else if (c.reps === 2) c.interval = grade === 3 ? 5 : 3;
      else c.interval = Math.round(c.interval * (grade === 1 ? 1.2 : grade === 3 ? c.ease * 1.3 : c.ease));   // hard grows slowly, good at ease, easy gets a bonus
      c.ease = Math.min(3.0, Math.max(1.3, c.ease + (grade === 3 ? 0.15 : grade === 1 ? -0.15 : 0)));
    }
    c.due = Date.now() + c.interval * 86400000;
    state.cards[cardId] = c;
    state.cardsReviewed += 1;
    addXP(XP.cardReview);
    bumpMastery(String(cardId).split(":")[0], { grade: grade });
    if (state.cardsReviewed >= 25) unlock("cards25");
    if (state.cardsReviewed >= 100) unlock("century");
    if (state.cardsReviewed >= 500) unlock("cards-500");
    save();
  }
  // projected next-review interval (days) for each grade, WITHOUT mutating — mirrors gradeCard()
  function projectInterval(cardId, grade) {
    const c = state.cards[cardId] || { ease: 2.5, interval: 0, due: 0, reps: 0 };
    if (grade === 0) return 0;
    const reps = num(c.reps) + 1;
    if (reps === 1) return grade === 3 ? 2 : 1;
    if (reps === 2) return grade === 3 ? 5 : 3;
    const e = num(c.ease || 2.5);
    return Math.max(1, Math.round(num(c.interval) * (grade === 1 ? 1.2 : grade === 3 ? e * 1.3 : e)));   // mirrors gradeCard: hard 1.2x, good ease, easy ease*1.3
  }
  function cardDue(cardId) {
    const c = state.cards[cardId];
    if (!c) return true;            // never seen = due (so the review queue can surface new cards)
    return Date.now() >= c.due;
  }
  // distinguish a brand-new card from one you've started and that is now due for review.
  // "new"   = never graded (no record);  "due" = started and due<=now;  "later" = started, scheduled ahead.
  function cardState(cardId) {
    const c = state.cards[cardId];
    if (!c) return "new";
    return Date.now() >= c.due ? "due" : "later";
  }
  // upcoming spaced-repetition load: how many started cards come due over the next `days`.
  // Pure (no mutation); buckets[0] = today, [1] = tomorrow, … Cards already due land in `dueNow`;
  // cards scheduled beyond the window are counted in `beyond` but not bucketed.
  function reviewForecast(days) {
    days = Math.max(1, num(days) || 7);
    const now = Date.now(), DAY = 86400000;
    const t0 = new Date(); t0.setHours(0, 0, 0, 0); const start = t0.getTime();
    const buckets = new Array(days).fill(0);
    let dueNow = 0, beyond = 0, scheduled = 0;
    const cards = state.cards || {};
    Object.keys(cards).forEach(id => {
      const c = cards[id];
      if (!c || !Number.isFinite(num(c.due)) || c.due <= 0) return;  // never properly scheduled
      scheduled++;
      if (c.due <= now) { dueNow++; return; }
      const off = Math.floor((c.due - start) / DAY);
      if (off < 0) dueNow++;                 // safety: past midnight-boundary rounding
      else if (off < days) buckets[off]++;
      else beyond++;
    });
    return { dueNow, beyond, scheduled, days: buckets, upcoming: buckets.reduce((a, b) => a + b, 0) };
  }

  // ---- aggregate stats -------------------------------------------------
  function stats() {
    let totalLessons = 0, totalCards = 0;
    if (window.COURSES) window.COURSES.forEach(c => c.modules.forEach(m => m.lessons.forEach(l => {
      totalLessons++; totalCards += (l.flashcards || []).length;
    })));
    let dueCount = 0, reviewDue = 0, newCount = 0;
    if (window.COURSES) window.COURSES.forEach(c => c.modules.forEach(m => m.lessons.forEach(l => {
      (l.flashcards || []).forEach((_, i) => {
        const s = cardState(l.id + ":" + i);
        if (s !== "later") dueCount++;          // new + due (everything the review queue would surface)
        if (s === "due") reviewDue++;            // started-and-now-due — the honest "review backlog"
        else if (s === "new") newCount++;
      });
    })));
    const acc = state.mcq.total ? Math.round((state.mcq.correct / state.mcq.total) * 100) : 0;
    return {
      lessonsDone: Object.keys(state.lessons).length,
      totalLessons,
      cardsReviewed: state.cardsReviewed,
      totalCards,
      dueCount,        // new + due (legacy meaning)
      reviewDue,       // cards you've started that are now due — the "what needs attention" number
      newCount,        // never-seen cards
      accuracy: acc,
      accuracyKnown: state.mcq.total > 0,   // distinguish "no quizzes yet" (show —) from a real 0%
      streak: state.streak
    };
  }

  function courseProgress(courseId) {
    const c = window.COURSES.find(x => x.id === courseId);
    if (!c) return { done: 0, total: 0, pct: 0 };
    let done = 0, total = 0;
    c.modules.forEach(m => m.lessons.forEach(l => { total++; if (state.lessons[l.id]) done++; }));
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function resetAll() { state = blank(); save(); }

  window.Store = {
    XP, LEVELS, ACHIEVEMENTS,
    get raw() { return state; },
    save, addXP, recordNusEvidence, levelInfo,
    completeLesson, isLessonDone, recordQuiz, recordTest, revealHomework,
    gradeCard, cardDue, cardState, projectInterval, reviewForecast,
    bumpMastery, effectiveMastery, masteryLevel, weakSpots, fadingConcepts, topicMastery, markKnown,
    getNote, setNote, setGoal, setNewPerSession, todayXP, goalJustReached, bestDayJustSet, exportData, importData, freezeJustUsed, streakJustUp, streakRecord, freezeEarned, personalBests, setLastLesson, celebrateTopicOnce,
    toggleBookmark, isBookmarked, bookmarkIds,
    recordMiss, clearMiss, missedKeys, missedCount,
    recordQuickCheck, recordVizOpen, recordCodeSolved, recordDeepDive,
    unlock, drainUnlocked, drainLevelUps, addFocusSession,
    stats, courseProgress, resetAll, touchStreak
  };
})();
