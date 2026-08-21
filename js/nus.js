(function () {
  "use strict";
  const root = document.getElementById("app");
  const repository = () => window.ATLAS_REPOSITORY || null;
  const courses = () => repository() ? repository().listCourses() : [];
  const assessments = () => repository() ? (repository().listAssessments ? repository().listAssessments() : []) : [];
  const visuals = () => repository() ? repository().listVisuals() : {};
  const schedule = () => repository() ? repository().getSchedule() : { courses: {} };
  const sourceTypes = () => repository() ? repository().getSourceTypes() : {};
  if (!window.ATLAS_PRESENTATION) throw new Error("Atlas presentation helpers are required before js/nus.js");
  const presentation = window.ATLAS_PRESENTATION({ getSourceTypes: sourceTypes, getVisuals: visuals });
  const { esc, text, sourceLabel, sourceBadge, sourceItem, sourceGroups, pageHead, card, button, statusPill,
    visualCard, mathBlock, sourceDisclosure, lessonSection, workedExample, recallItem, criticalThinking, studyKit, studyCompass } = presentation;
  const DEFAULT_FOCUS_COURSE = "DSA5208";
  const VISUAL_CUE_KEY = "nus.visual-cues.v1";
  let focusTimer = null;

  function course(code) { return repository() ? (repository().peekCourse ? repository().peekCourse(code) : repository().getCourse(code)) : null; }
  function content(code) { return repository() ? repository().getCatalog(code) : { modules: [] }; }
  function lessons(code) { return repository() ? repository().listLessons(code) : []; }
  function lesson(code, id) { return repository() ? (repository().peekLesson ? repository().peekLesson(code, id) : repository().getLesson(code, id)) : null; }
  function slideSets(code) { return repository() && typeof repository().getSlideSets === "function" ? repository().getSlideSets(code) : []; }
  function courseName(code) { const c = course(code); return c ? c.title : code; }
  function fmtDate(value, pendingLabel) {
    if (!value) return pendingLabel || "Date pending";
    return new Intl.DateTimeFormat("en-SG", { timeZone: "Asia/Singapore", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }
  function dayCount(value) {
    if (!value) return null;
    return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
  }
  function progress(code) { return window.ATLAS_STUDY_STORE.courseProgress(code, lessons(code)); }
  function slideResume(code, slideSet) {
    if (!slideSet || !window.ATLAS_STUDY_STORE || typeof window.ATLAS_STUDY_STORE.readingFor !== "function") return { number: 1, label: "Open lecture slides" };
    const saved = window.ATLAS_STUDY_STORE.readingFor(`slide:${code}:${slideSet.id}`);
    if (saved && !saved.completed && Number(saved.position) > 1) return { number: Number(saved.position), label: `Continue slides · ${saved.position}` };
    return { number: 1, label: "Open lecture slides" };
  }
  function focusCourseCode() {
    let saved = "";
    try { saved = localStorage.getItem("nus.focus-course") || ""; } catch (_) { saved = ""; }
    return courses().some(item => item.code === saved) ? saved : (courses().some(item => item.code === DEFAULT_FOCUS_COURSE) ? DEFAULT_FOCUS_COURSE : (courses()[0] || {}).code);
  }
  function focusCourseSelector(code) {
    return `<label class="nus-focus-course"><span>Focus course</span><select id="nus-focus-course">${courses().map(item => `<option value="${esc(item.code)}" ${item.code === code ? "selected" : ""}>${esc(item.code)}</option>`).join("")}</select></label>`;
  }
  function readinessFor(code) {
    const questionIds = lessons(code).flatMap(item => Array.isArray(item.questionIds) ? item.questionIds : (item.questions || []).map(question => question.id));
    const stats = questionIds.filter(Boolean).map(questionId => window.ATLAS_STUDY_STORE.questionStats(questionId));
    const attempted = stats.filter(item => item.attempts > 0).length;
    const correct = stats.reduce((sum, item) => sum + item.correct, 0);
    const attempts = stats.reduce((sum, item) => sum + item.attempts, 0);
    return { coverage: questionIds.length ? Math.round(attempted / questionIds.length * 100) : 0, accuracy: attempts ? Math.round(correct / attempts * 100) : 0, unresolved: window.ATLAS_STUDY_STORE.mistakes(code).length, total: questionIds.length };
  }
  function learningSignals(code) {
    const focusCode = code || focusCourseCode();
    const quests = window.ATLAS_STUDY_STORE.questState(), recognition = window.ATLAS_STUDY_STORE.recognition();
    const readiness = readinessFor(focusCode);
    const questBody = quests.quests.map(q => `<div class="nus-quest"><div><b>${esc(q.label)}</b><span>${esc(q.hint)}</span></div><strong>${q.progress}/${q.target}</strong><div class="nus-quest-progress"><i style="width:${Math.round(q.progress / q.target * 100)}%"></i></div></div>`).join("");
    const labItems = (repository() ? repository().listLabs(focusCode) : []).map(l => { const m = window.ATLAS_STUDY_STORE.masteryFor(l.lessonId), pct = Math.round(m.score * 100); return `<a class="nus-mastery-row" href="#/nus/lesson/${esc(focusCode)}/${esc(l.lessonId)}" data-route><span><b>${esc(l.title || l.lessonId)}</b><small>${m.attempts ? `${m.attempts} evidence moves` : "Not started"}</small></span><span class="nus-mini-progress"><i style="width:${pct}%"></i></span><strong>${pct}%</strong></a>`; }).join("");
    const badgeItems = recognition.slice(0, 6).map(item => `<div class="nus-badge ${item.unlocked ? "unlocked" : "locked"}"><span>${esc(item.icon)}</span><div><b>${esc(item.name)}</b><small>${esc(item.desc)}</small></div><strong>${item.unlocked ? "✓" : `${item.progress}%`}</strong></div>`).join("");
    const readinessBody = `<div class="nus-readiness"><div class="nus-readiness-row"><span>Question coverage</span><strong>${readiness.coverage}%</strong><i><b style="width:${readiness.coverage}%"></b></i></div><div class="nus-readiness-row"><span>Answer accuracy</span><strong>${readiness.accuracy}%</strong><i><b style="width:${readiness.accuracy}%"></b></i></div><p class="nus-muted">${readiness.unresolved ? `${readiness.unresolved} unresolved mistake${readiness.unresolved === 1 ? "" : "s"}.` : "No unresolved mistakes yet."} ${readiness.total} question prompts are available.</p><div class="nus-card-actions">${button("Practice smart mix", `#/nus/exam/${focusCode}`, "primary")}${button("Open Mistake Clinic", `#/nus/mistakes/${focusCode}`, "ghost")}</div></div>`;
    return `<div class="nus-two-col nus-learning-signals"><div>${card("Today’s quests", `<div class="nus-quest-summary"><b>${quests.complete ? "Daily loop complete" : "Evidence over streaks"}</b><span>${quests.quests.filter(q => q.progress >= q.target).length}/${quests.quests.length} quests · ${quests.completedDays} completed days</span></div><div class="nus-quest-list">${questBody}</div><p class="nus-muted">Opening a page never awards XP. Only a completed study move enters the ledger.</p>`, "reveal")}</div><div>${card(`${esc(focusCode)} mastery map`, `${focusCourseSelector(focusCode)}<div class="nus-mastery-list">${labItems || `<p class="nus-muted">Visual labs are being prepared for this course.</p>`}</div><p class="nus-muted">Mastery rises through lesson completion, retrieval, and lab reasoning—not page views.</p>`, "reveal")}</div></div><div class="nus-two-col"><div>${card(`${esc(focusCode)} readiness`, readinessBody, "reveal")}</div><div>${card("Recognition", `<div class="nus-badge-list">${badgeItems}</div>`, "reveal")}</div></div>`;
  }
  function courseProgressBar(code) { const p = progress(code); return `<div class="nus-progress"><span style="width:${p.pct}%;background:${esc(course(code).color)}"></span></div><div class="nus-muted">${p.done}/${p.total} lessons complete · ${p.pct}%</div>`; }
  function readerModeOn() { return localStorage.getItem("nus.reader-mode") === "on"; }
  function setReaderMode(enabled) {
    document.body.classList.toggle("nus-reading-mode", enabled);
    localStorage.setItem("nus.reader-mode", enabled ? "on" : "off");
  }
  function readerButton() {
    const enabled = readerModeOn();
    return `<button class="btn ghost nus-reader-toggle" id="nus-reader-toggle" type="button" aria-pressed="${enabled}">${enabled ? "Exit focus reading" : "Focus reading"}</button>`;
  }
  function readVisualCueState() {
    try {
      const value = JSON.parse(localStorage.getItem(VISUAL_CUE_KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch (_) { return {}; }
  }
  function writeVisualCueState(state) {
    try { localStorage.setItem(VISUAL_CUE_KEY, JSON.stringify(state)); } catch (_) { /* progress is optional */ }
  }
  function syncVisualCueProgress() {
    const state = readVisualCueState();
    const buttons = [...root.querySelectorAll("[data-nus-visual-practice]")];
    const practiced = buttons.filter(button => !!state[button.dataset.nusVisualPractice]);
    buttons.forEach(button => {
      const done = !!state[button.dataset.nusVisualPractice];
      button.setAttribute("aria-pressed", done ? "true" : "false");
      button.textContent = done ? "Practiced ✓" : "Mark practiced";
      button.closest("[data-nus-visual-card]")?.classList.toggle("is-practiced", done);
      const status = button.closest("[data-nus-visual-card]")?.querySelector("[data-nus-visual-status]");
      if (status) status.textContent = done ? "Practiced" : "Not practiced";
    });
    const progress = root.querySelector("[data-nus-visual-progress]");
    if (progress) progress.textContent = `${practiced.length}/${buttons.length} practiced`;
  }
  function bindVisualCueProgress() {
    root.querySelectorAll("[data-nus-visual-practice]").forEach(button => button.addEventListener("click", () => {
      const state = readVisualCueState(), id = button.dataset.nusVisualPractice;
      if (state[id]) delete state[id]; else state[id] = true;
      writeVisualCueState(state);
      syncVisualCueProgress();
    }));
    syncVisualCueProgress();
  }
  function allUpcoming() { return assessments().filter(a => a.date).sort((a, b) => new Date(a.date) - new Date(b.date)); }
  function firstOpenLesson() { for (const c of courses()) { const l = lessons(c.code).find(x => !window.ATLAS_STUDY_STORE.lessonDone(x.id)); if (l) return { course: c, lesson: l }; } return null; }
  function syncRetrievalSchedules() {
    if (!window.ATLAS_STUDY_STORE || typeof window.ATLAS_STUDY_STORE.ensureRetrievalSchedules !== "function") return;
    courses().forEach(c => window.ATLAS_STUDY_STORE.ensureRetrievalSchedules(lessons(c.code)));
  }
  function retrievalCard() {
    syncRetrievalSchedules();
    const store = window.ATLAS_STUDY_STORE;
    const due = store && typeof store.dueRetrievals === "function" ? store.dueRetrievals().length : 0;
    const next = store && typeof store.upcomingRetrievals === "function" ? store.upcomingRetrievals(null, 120)[0] : null;
    const status = due ? `${due} concept${due === 1 ? "" : "s"} due now` : next ? `Next: ${fmtDate(next.dueAt)}` : "Mastered concepts will be scheduled automatically.";
    return card("Spaced retrieval", `<p>Keep mastered ideas active with <b>1–2 questions</b>. No lesson reread is required.</p><p class="nus-muted">${esc(status)}</p>${button(due ? "Start retrieval" : "Open retrieval queue", "#/nus/review", due ? "primary" : "ghost")}`, "reveal");
  }
  function examCountdownCards() { return courses().map(c => ({ code: c.code, exam: (schedule().courses[c.code] || {}).exam })).map(x => `<div class="nus-exam-count"><b>${esc(x.code)}</b><span>${x.exam && x.exam.date ? esc(fmtDate(x.exam.date)) : "Date pending"}</span><small>${x.exam && x.exam.date ? `${Math.max(0, dayCount(x.exam.date))} days left` : "Check course announcement"}</small></div>`).join(""); }
  function bindDashboard() {
    root.querySelectorAll("[data-nus-focus]").forEach(b => b.addEventListener("click", () => startFocus(Number(b.dataset.nusFocus))));
    root.querySelector("#nus-focus-course")?.addEventListener("change", event => {
      try { localStorage.setItem("nus.focus-course", event.target.value); } catch (_) { /* private preference is optional */ }
      renderDashboard();
    });
  }
  function startFocus(minutes) {
    if (focusTimer) clearInterval(focusTimer);
    let left = minutes * 60;
    const label = root.querySelector("#nus-focus-time"), state = root.querySelector("#nus-focus-state");
    if (!label || !state) return;
    state.textContent = `${minutes}-minute focus started`;
    const tick = () => { label.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; if (left-- <= 0) { clearInterval(focusTimer); focusTimer = null; state.textContent = "Focus block complete — take a short break."; } };
    tick(); focusTimer = setInterval(tick, 1000);
  }

  function renderDashboard() {
    const upcoming = allUpcoming().slice(0, 5);
    const pending = assessments().filter(a => !a.date).length;
    const nearest = upcoming[0], nearestDays = nearest && dayCount(nearest.date);
    const open = firstOpenLesson(), latest = window.ATLAS_STUDY_STORE.attempts().slice(-1)[0];
    let body = pageHead("NUS · AY2026/27 Semester 1", "Your NUS study desk", "A source-backed study space for DSA5101, DSA5104, DSA5105, and DSA5208. Dates marked pending are deliberately not guessed.");
    body += `<section class="nus-hero nus-study-hero reveal"><div><div class="eyebrow">Start here · today’s lesson</div><h3>${open ? esc(open.lesson.title) : "Your seeded lessons are complete"}</h3><p>${open ? `${esc(open.course.code)} · ${esc(open.lesson.summary)}` : "Use Exam Mode for maintenance or revisit a weak topic."}</p>${nearest ? `<small class="nus-hero-deadline">Next deadline: ${esc(nearest.title)} · ${nearestDays < 0 ? "overdue" : `${nearestDays} days left`}</small>` : ""}</div><div class="nus-hero-actions">${open ? button("Read lesson", `#/nus/lesson/${open.course.code}/${open.lesson.id}`, "primary") : button("Open planner", "#/nus/planner", "primary")}${button("Start exam mode", "#/nus/exam", "ghost")}</div></section>`;
    body += `<div class="nus-grid nus-grid-4">${courses().map(c => `<article class="nus-course-card reveal" style="--course:${esc(c.color)}"><div class="nus-course-top"><span class="nus-code">${esc(c.code)}</span><span class="pill">${progress(c.code).pct}%</span></div><h3>${esc(c.title)}</h3><p>${text(c.description)}</p>${courseProgressBar(c.code)}<div class="nus-card-actions">${button("Study course", `#/nus/course/${c.code}`, "ghost")}${button("Practice", `#/nus/exam/${c.code}`, "ghost")}</div></article>`).join("")}</div>`;
    body += learningSignals(focusCourseCode());
    body += retrievalCard();
    body += `<div class="nus-two-col"><div>${card("Today’s focus", `<p>${open ? `Continue <b>${esc(open.lesson.title)}</b> in ${esc(open.course.code)}.` : "All seeded lessons are complete — use Exam Mode for maintenance."}</p><div class="nus-focus-clock"><b id="nus-focus-time">25:00</b><span id="nus-focus-state">Choose a focus block</span></div><div class="nus-tool-grid"><button class="btn ghost" data-nus-focus="25">25 min</button><button class="btn ghost" data-nus-focus="50">50 min</button>${open ? button("Open lesson", `#/nus/lesson/${open.course.code}/${open.lesson.id}`, "ghost") : ""}</div>`, "reveal")}</div><div>${card("Exam countdown", `<div class="nus-exam-counts">${examCountdownCards()}</div><p class="nus-muted">DSA5208 remains date pending until an official date is available.</p>`, "reveal")}</div></div>`;
    body += card("Practice history", latest ? `<p>Latest ${esc(latest.courseCode)} attempt: <b>${latest.score}/${latest.total}</b>. Use the review deck after each attempt to target misses.</p>${button("Practice again", `#/nus/exam/${latest.courseCode}`, "ghost")}` : `<p class="nus-muted">No NUS attempt yet. Start a short scoped run to create a personal weak-topic signal.</p>${button("Start a practice run", "#/nus/exam", "ghost")}`, "reveal");
    body += `<div class="nus-two-col"><div>${card("Upcoming work", upcoming.length ? `<div class="nus-list">${upcoming.map(a => assessmentRow(a)).join("")}</div>` : `<div class="nus-empty">No confirmed dates.</div>`, "reveal")}</div><div>${card("What needs confirmation", `<p class="nus-muted">${pending} assessment milestone${pending === 1 ? "" : "s"} still has a date pending.</p><p class="nus-muted">Reminders are shown at 7, 3, and 1 day before a confirmed date. The app never invents a deadline.</p>${button("Review planner", "#/nus/planner", "ghost")}`, "reveal")}</div></div>`;
    body += card("Study spaces", `<div class="nus-tool-grid">${button("SQL practice · DSA5104", "#/nus/sql", "ghost")}${button("Distributed simulations · DSA5208", "#/nus/simulations", "ghost")}${button("Mixed practice · DSA5101/5105", "#/nus/exam", "ghost")}${button("Reference library", "#/atlas", "ghost")}</div>`, "reveal");
    root.innerHTML = body;
    bindDashboard();
  }

  function assessmentRow(a) {
    const days = dayCount(a.date), reminder = days != null && [7, 3, 1].includes(days) ? ` · reminder ${days}d` : "";
    return `<a class="nus-list-row" href="#/nus/planner" data-route><div><b>${esc(a.title)}</b><span>${esc(courseName(a.courseCode))} · ${esc(a.kind)} · ${a.weight}%</span></div><div class="nus-date">${esc(fmtDate(a.date))}<small>${days < 0 ? "overdue" : `${Math.max(0, days)}d left`}${reminder}</small></div></a>`;
  }

  const plannerFeature = window.ATLAS_PLANNER_FEATURE ? window.ATLAS_PLANNER_FEATURE({
    root,
    getAssessments: assessments,
    getStore: () => window.ATLAS_STUDY_STORE,
    pageHead,
    button,
    dayCount,
    fmtDate,
    statusPill,
    sourceLabel,
    esc
  }) : null;
  function renderPlanner() { return plannerFeature ? plannerFeature.render() : renderNotFound(); }

  function ensureCourseLoaded(code, onReady) {
    const repo = repository();
    if (!repo || typeof repo.needsLoad !== "function" || !repo.needsLoad(code)) return false;
    const route = location.hash;
    root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Loading course package</div><h2>${esc(code)}</h2><p>Fetching the normalized lessons, questions, and study kit…</p></section>`;
    repo.loadCourse(code).then(packageData => {
      if (location.hash !== route) return;
      if (packageData) onReady();
      else root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Course unavailable</div><h2>${esc(code)}</h2><p>The course package could not be loaded. The legacy adapter remains available for other courses.</p></section>`;
    }).catch(error => {
      if (location.hash !== route) return;
      root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Course unavailable</div><h2>${esc(code)}</h2><p>${esc(error.message || "The course package could not be loaded.")}</p></section>`;
    });
    return true;
  }

  function ensureLessonLoaded(code, id, onReady) {
    const repo = repository();
    if (!repo || typeof repo.loadLesson !== "function" || (typeof repo.isLessonLoaded === "function" && repo.isLessonLoaded(code, id))) return false;
    const route = location.hash;
    root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Loading lesson payload</div><h2>${esc(id)}</h2><p>Fetching this lesson, its questions, and study kit…</p></section>`;
    repo.loadLesson(code, id).then(payload => {
      if (location.hash !== route) return;
      if (payload) onReady();
      else renderNotFound();
    }).catch(error => {
      if (location.hash !== route) return;
      root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Lesson unavailable</div><h2>${esc(id)}</h2><p>${esc(error.message || "The lesson payload could not be loaded.")}</p></section>`;
    });
    return true;
  }

  function ensureSlidesLoaded(code, onReady) {
    const repo = repository();
    if (!repo || typeof repo.loadSlides !== "function" || (repo.getSlideSets(code) || []).length) return false;
    const route = location.hash;
    root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Loading lecture slides</div><h2>${esc(code)}</h2><p>Fetching the slide shard for this lecture…</p></section>`;
    repo.loadSlides(code).then(() => { if (location.hash === route) onReady(); }).catch(error => {
      if (location.hash === route) root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Slides unavailable</div><h2>${esc(code)}</h2><p>${esc(error.message || "The slide payload could not be loaded.")}</p></section>`;
    });
    return true;
  }

  function ensureTextbookLoaded(code, onReady) {
    const repo = repository();
    if (!repo || typeof repo.loadTextbook !== "function" || (repo.getTextbook && repo.getTextbook(code))) return false;
    const route = location.hash;
    root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Loading textbook reader</div><h2>${esc(code)}</h2><p>Fetching the textbook PDF reader metadata…</p></section>`;
    repo.loadTextbook(code).then(textbook => { if (location.hash === route && textbook) onReady(); }).catch(error => {
      if (location.hash === route) root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Textbook unavailable</div><h2>${esc(code)}</h2><p>${esc(error.message || "The textbook payload could not be loaded.")}</p></section>`;
    });
    return true;
  }

  function ensurePracticeLoaded(code, onReady) {
    const repo = repository();
    if (!repo || typeof repo.loadCourse !== "function") return false;
    const codes = code ? [code] : courses().map(item => item.code);
    const pending = codes.flatMap(courseCode => lessons(courseCode)
      .filter(item => !(typeof repo.isLessonLoaded === "function" && repo.isLessonLoaded(courseCode, item.id)))
      .map(item => ({ courseCode, lessonId: item.id })));
    const needsCourse = codes.some(courseCode => typeof repo.needsLoad === "function" && repo.needsLoad(courseCode));
    if (!pending.length && !needsCourse) return false;
    const route = location.hash;
    root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Preparing practice surface</div><h2>${esc(code || "NUS courses")}</h2><p>Loading question and study-kit shards only for this practice run…</p></section>`;
    Promise.all(codes.map(courseCode => repo.loadCourse(courseCode)))
      .then(() => Promise.all(pending.map(item => repo.loadLesson(item.courseCode, item.lessonId))))
      .then(() => {
      if (location.hash === route) onReady();
    }).catch(error => {
      if (location.hash === route) root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Practice unavailable</div><h2>${esc(code)}</h2><p>${esc(error.message || "The practice payload could not be loaded.")}</p></section>`;
    });
    return true;
  }

  function renderCourse(code) {
    if (ensureCourseLoaded(code, () => renderCourse(code))) return;
    const c = course(code);
    if (!c) return renderNotFound();
    let body = pageHead(c.code, c.title, c.description);
    const hasContrasts = lessons(c.code).some(item => Array.isArray(item.contrastDrills) && item.contrastDrills.length);
    body += `<div class="nus-course-meta"><span>${esc(c.department)} · ${esc(c.faculty)}</span><span>Workload ${esc(c.workload.join(" / "))}</span>${c.code === "DSA5105" ? button("Exam & homework map", `#/nus/assessment-map/${c.code}`, "ghost") : ""}${hasContrasts ? button("Concept contrasts", `#/nus/contrast/${c.code}`, "ghost") : ""}${repository() && repository().hasTextbook && repository().hasTextbook(c.code) ? button("Textbook PDF", `#/nus/textbook/${c.code}/1`, "ghost") : ""}${button("Exam mode", `#/nus/exam/${c.code}`, "primary")}</div>`;
    const lessonsByWeek = list => (list || []).slice().sort((a, b) => (Number(a.week) || 0) - (Number(b.week) || 0) || String(a.id).localeCompare(String(b.id)));
    body += `<div class="nus-course-layout"><div><div class="nus-course-progress"><b>Course progress</b>${courseProgressBar(c.code)}</div>${content(c.code).modules.map(m => `<section class="nus-module reveal"><div class="eyebrow">${esc(m.title)}</div>${lessonsByWeek(m.lessons).map(l => `<a class="nus-lesson-row" href="#/nus/lesson/${esc(c.code)}/${esc(l.id)}" data-route><span class="nus-lesson-dot ${window.ATLAS_STUDY_STORE.lessonDone(l.id) ? "done" : ""}">${window.ATLAS_STUDY_STORE.lessonDone(l.id) ? "✓" : ""}</span><div><b>${esc(l.title)}</b><span>Week ${esc(l.week)} · ${esc(l.minutes)} min · ${(l.questionIds || []).length} practice prompts${l.hasVisualLab ? " · visual lab" : ""}</span></div><span>→</span></a>`).join("")}</section>`).join("")}</div><aside>${card("Assessment weight", assessments().filter(a => a.courseCode === c.code).map(a => `<div class="nus-weight"><span>${esc(a.title)}</span><b>${a.weight}%</b></div>`).join(""), "reveal")}${card("Sources", sourceGroups(c).map(g => `<div class="nus-source-group"><b>${esc(g.label)}</b><ul class="nus-source-list">${g.refs.map(r => `<li>${sourceItem(r)}</li>`).join("")}</ul></div>`).join("")+`<a class="nus-external" href="${esc(c.nusmods.url)}" target="_blank" rel="noreferrer">NUSMods course page ↗</a>`, "reveal")}</aside></div>`;
    root.innerHTML = body;
  }

  function typesetNus(target = root) { if (window.typeset) window.typeset(target); }
  function bindLessonInteractions(code, id) {
    root.querySelector("#nus-reader-toggle")?.addEventListener("click", () => {
      setReaderMode(!readerModeOn());
      renderLesson(code, id);
    });
    root.querySelectorAll("[data-nus-lab-anchor]").forEach(link => link.addEventListener("click", event => {
      event.preventDefault();
      const target = document.getElementById(link.dataset.nusLabAnchor);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      const heading = target.querySelector("h3");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        try { heading.focus({ preventScroll: true }); } catch (_) { heading.focus(); }
      }
    }));
    root.querySelectorAll("[data-nus-jump]").forEach(buttonEl => buttonEl.addEventListener("click", () => {
      document.getElementById(buttonEl.dataset.nusJump)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    bindVisualCueProgress();
  }
  function renderLesson(code, id) {
    if (ensureCourseLoaded(code, () => renderLesson(code, id))) return;
    if (ensureLessonLoaded(code, id, () => renderLesson(code, id))) return;
    const c = course(code), l = lesson(code, id);
    if (!c || !l) return renderNotFound();
    const done = window.ATLAS_STUDY_STORE.lessonDone(l.id);
    const courseLessons = lessons(code), index = courseLessons.findIndex(x => x.id === l.id);
    const previous = courseLessons[index - 1], next = courseLessons[index + 1];
    const courseTextbook = repository() && repository().getTextbook ? repository().getTextbook(c.code) : null;
    setReaderMode(readerModeOn());
    let body = pageHead(`${c.code} · Week ${l.week}`, l.title, l.summary);
    const slideSet = slideSets(code).find(item => (item.lessonIds || []).includes(l.id)) || ((l.slideSetIds || [])[0] ? { id: l.slideSetIds[0] } : null);
    const slideResumeState = slideResume(code, slideSet);
    body += `<div class="nus-lesson-actions">${button("← Course", `#/nus/course/${c.code}`, "ghost")}<button class="btn ${done ? "ghost" : "primary"}" id="nus-mark-lesson">${done ? "✓ Completed" : "Mark complete"}</button>${slideSet ? button(slideResumeState.label, `#/nus/slides/${c.code}/${slideSet.id}/${slideResumeState.number}`, "primary") : ""}${(courseTextbook && courseTextbook.reader) || (repository() && repository().hasTextbook && repository().hasTextbook(c.code)) ? button("Textbook PDF", `#/nus/textbook/${c.code}/1`, "ghost") : ""}${l.contrastDrills && l.contrastDrills.length ? button("Concept contrasts", `#/nus/contrast/${c.code}/${l.id}`, "ghost") : ""}${button("Exam mode", `#/nus/exam/${c.code}/${l.id}`, "ghost")}${button("Mistake Clinic", `#/nus/mistakes/${c.code}`, "ghost")}${readerButton()}</div>`;
    body += studyCompass(l);
    const lab = repository() ? repository().getLab(l.id) : null;
    const visualCueIds = Array.isArray(l.visualIds) ? l.visualIds : [];
    const visualCueBody = visualCueIds.length ? `<p class="nus-visual-cue-intro">Use each cue as a short loop: <b>look → predict → explain</b>. <span data-nus-visual-progress>0/${visualCueIds.length} practiced</span></p>${visualCueIds.map(visualId => visualCard(visualId, { courseCode: c.code, lessonId: l.id, labId: lab && (lab.lessonId || l.id), hasLab: !!lab })).join("")}` : "";
    body += `<div class="nus-lesson-grid"><main><section class="nus-card nus-objectives reveal"><div class="nus-teach-head"><h3>What you should be able to do</h3><span class="pill gold">${esc(l.minutes)} min</span></div><ul>${(l.objectives || []).map(objective => `<li>${esc(objective)}</li>`).join("")}</ul></section>${lab && window.ATLAS_COMPONENTS ? window.ATLAS_COMPONENTS.renderLab(l, lab) : ""}<div id="nus-lesson-read">${(l.sections || []).map(lessonSection).join("")}${(l.math || []).map(mathBlock).join("")}</div><div id="nus-lesson-work">${(l.examples || []).map(workedExample).join("")}</div>${criticalThinking(l)}<section class="nus-card nus-recall reveal" id="nus-lesson-recall"><div class="nus-teach-head"><h3>Recall before you test</h3><span class="pill">${l.questions.length} prompts</span></div><p class="nus-muted">Answer on paper first. Open each prompt only after you commit to an answer.</p><div class="nus-question-list">${l.questions.map(recallItem).join("")}</div>${button("Start this lesson in Exam Mode", `#/nus/exam/${c.code}/${l.id}`, "primary")}</section>${studyKit(l)}<div class="nus-lesson-nav">${previous ? button(`← ${previous.title}`, `#/nus/lesson/${c.code}/${previous.id}`, "ghost") : `<span></span>`}${next ? button(`Next: ${next.title} →`, `#/nus/lesson/${c.code}/${next.id}`, "primary") : button("Back to course", `#/nus/course/${c.code}`, "primary")}</div></main><aside>${visualCueIds.length ? card("Visual study cues", visualCueBody, "reveal") : ""}${card("Provenance", sourceDisclosure(l.sourceRefs, "Open source pages"), "reveal")}</aside></div>`;
    root.innerHTML = body;
    typesetNus();
    if (window.ATLAS_COMPONENTS) window.ATLAS_COMPONENTS.bind(root);
    root.querySelector("#nus-mark-lesson").addEventListener("click", () => { window.ATLAS_STUDY_STORE.markLesson(l.id, !done, { courseCode: code, sourceRefs: l.sourceRefs }); renderLesson(code, id); });
    bindLessonInteractions(code, id);
  }

  const examFeature = window.ATLAS_EXAM_FEATURE ? window.ATLAS_EXAM_FEATURE({
    root,
    getCourses: courses,
    getLessons: lessons,
    getStore: () => window.ATLAS_STUDY_STORE,
    pageHead,
    sourceItem,
    text,
    esc,
    button,
    typeset: typesetNus
  }) : null;
  function stopExamTimer() { if (examFeature) examFeature.stopTimer(); }
  function renderExam(code, scope, internal) {
    const selectedCode = code || focusCourseCode();
    if (!internal && ensurePracticeLoaded(selectedCode, () => renderExam(selectedCode, scope, false))) return;
    return examFeature ? examFeature.render(selectedCode, scope, internal) : renderNotFound();
  }
  function renderMistakes(code) {
    if (ensurePracticeLoaded(code, () => renderMistakes(code))) return;
    return examFeature ? examFeature.renderMistakes(code) : renderNotFound();
  }

  const assessmentMapFeature = window.ATLAS_ASSESSMENT_MAP_FEATURE ? window.ATLAS_ASSESSMENT_MAP_FEATURE({
    root,
    getAssessmentMap: code => repository() && repository().getAssessmentMap ? repository().getAssessmentMap(code) : null,
    getLessons: lessons,
    pageHead,
    sourceItem,
    text,
    esc,
    button,
    notFound: renderNotFound
  }) : null;
  function renderAssessmentMap(code) {
    if (ensureCourseLoaded(code, () => renderAssessmentMap(code))) return;
    return assessmentMapFeature ? assessmentMapFeature.render(code || "DSA5105") : renderNotFound();
  }

  const retrievalFeature = window.ATLAS_RETRIEVAL_FEATURE ? window.ATLAS_RETRIEVAL_FEATURE({
    root,
    getCourses: courses,
    getLessons: lessons,
    getStore: () => window.ATLAS_STUDY_STORE,
    pageHead,
    sourceItem,
    text,
    esc,
    button,
    typeset: typesetNus,
    answerKey: examFeature && examFeature.answerKey
  }) : null;
  function renderRetrieval(code) {
    if (ensurePracticeLoaded(code, () => renderRetrieval(code))) return;
    return retrievalFeature ? retrievalFeature.render(code) : renderNotFound();
  }

  const contrastFeature = window.ATLAS_CONTRAST_DRILLS_FEATURE ? window.ATLAS_CONTRAST_DRILLS_FEATURE({
    root,
    getCourses: courses,
    getLessons: lessons,
    getStore: () => window.ATLAS_STUDY_STORE,
    pageHead,
    sourceItem,
    text,
    esc,
    button,
    typeset: typesetNus
  }) : null;
  function renderContrast(code, scope) {
    if (ensurePracticeLoaded(code, () => renderContrast(code, scope))) return;
    return contrastFeature ? contrastFeature.render(code || focusCourseCode(), scope) : renderNotFound();
  }

  const sqlFeature = window.ATLAS_SQL_FEATURE ? window.ATLAS_SQL_FEATURE({ root, getContent: content, pageHead, card, esc, text, notFound: renderNotFound }) : null;
  const simulationsFeature = window.ATLAS_SIMULATIONS_FEATURE ? window.ATLAS_SIMULATIONS_FEATURE({ root, pageHead, esc, getStore: () => window.ATLAS_STUDY_STORE }) : null;
  function renderSql() { return sqlFeature ? sqlFeature.render() : renderNotFound(); }
  function renderSimulations() { return simulationsFeature ? simulationsFeature.render() : renderNotFound(); }
  const readingTimerFeature = window.ATLAS_READING_TIMER ? window.ATLAS_READING_TIMER() : null;
  const slideReaderFeature = window.ATLAS_SLIDE_READER_FEATURE ? window.ATLAS_SLIDE_READER_FEATURE({
    root,
    getCourse: course,
    getSlideSet: (code, setId) => repository() && repository().getSlideSet ? repository().getSlideSet(code, setId) : null,
    getTextbook: code => repository() && repository().getTextbook ? repository().getTextbook(code) : null,
    getStore: () => window.ATLAS_STUDY_STORE,
    pageHead,
    sourceBadge,
    sourceItem,
    button,
    text,
    esc,
    typeset: typesetNus,
    notFound: renderNotFound,
    readingTimer: readingTimerFeature
  }) : null;
  function renderSlides(code, setId, slideNumber) {
    if (ensureCourseLoaded(code, () => renderSlides(code, setId, slideNumber))) return;
    if (ensureSlidesLoaded(code, () => renderSlides(code, setId, slideNumber))) return;
    return slideReaderFeature ? slideReaderFeature.render(code, setId, slideNumber) : renderNotFound();
  }
  const textbookReaderFeature = window.ATLAS_TEXTBOOK_READER_FEATURE ? window.ATLAS_TEXTBOOK_READER_FEATURE({
    root,
    getCourse: course,
    getTextbook: code => repository() && repository().getTextbook ? repository().getTextbook(code) : null,
    getStore: () => window.ATLAS_STUDY_STORE,
    pageHead,
    sourceBadge,
    button,
    text,
    esc,
    notFound: renderNotFound,
    readingTimer: readingTimerFeature
  }) : null;
  function renderTextbook(code, page) {
    if (ensureCourseLoaded(code, () => renderTextbook(code, page))) return;
    if (ensureTextbookLoaded(code, () => renderTextbook(code, page))) return;
    return textbookReaderFeature ? textbookReaderFeature.render(code, page) : renderNotFound();
  }

  const routeTable = window.ATLAS_ROUTE_TABLE ? window.ATLAS_ROUTE_TABLE({
    dashboard: () => renderDashboard(),
    planner: () => renderPlanner(),
    course: parts => renderCourse(parts[1]),
    lesson: parts => renderLesson(parts[1], parts[2]),
    exam: parts => renderExam(parts[1], parts[2]),
    "assessment-map": parts => renderAssessmentMap(parts[1] || "DSA5105"),
    review: parts => renderRetrieval(parts[1]),
    mistakes: parts => renderMistakes(parts[1] || focusCourseCode()),
    contrast: parts => renderContrast(parts[1] || focusCourseCode(), parts[2]),
    slides: parts => renderSlides(parts[1], parts[2], parts[3]),
    textbook: parts => renderTextbook(parts[1], parts[2]),
    sql: () => renderSql(),
    simulations: () => renderSimulations()
  }) : null;
  function renderNotFound() { root.innerHTML = pageHead("NUS", "Not found", "That study page does not exist.") + button("Back to NUS dashboard", "#/", "primary"); }
  function renderRoute(parts) {
    stopExamTimer();
    if (readingTimerFeature && typeof readingTimerFeature.stop === "function") readingTimerFeature.stop();
    const p = parts || [];
    if (p[0] !== "lesson") setReaderMode(false);
    if (p[0] !== "slides") document.body.classList.remove("nus-slide-focus-mode");
    const handler = routeTable && routeTable.resolve(p);
    const result = handler ? handler(p) : renderNotFound();
    typesetNus();
    return result;
  }
  window.ATLAS_NUS_UI = { renderRoute, courseName };
})();
