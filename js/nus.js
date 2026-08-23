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
  function fmtDateOnly(value) {
    return new Intl.DateTimeFormat("en-SG", { timeZone: "Asia/Singapore", dateStyle: "medium" }).format(new Date(`${String(value).slice(0, 10)}T12:00:00+08:00`));
  }
  function fmtAssessmentDate(assessment) {
    if (!assessment || !assessment.date) return "Date pending";
    const timing = assessment.timing || {};
    if (timing.timeStatus === "confirmed" && timing.time) return `${fmtDateOnly(assessment.date)} · ${timing.time}`;
    return fmtDate(assessment.date);
  }
  function assessmentWeightLabel(assessment) {
    return assessment && assessment.weightLabel ? assessment.weightLabel : (assessment && assessment.weight != null ? `${assessment.weight}%` : "Weight pending");
  }
  function dayCount(value) {
    if (!value) return null;
    const raw = String(value);
    const timestamp = raw.length === 10 ? Date.parse(`${raw}T23:59:59+08:00`) : Date.parse(raw);
    return Number.isFinite(timestamp) ? Math.ceil((timestamp - Date.now()) / 86400000) : null;
  }
  const examScheduleFeature = window.ATLAS_EXAM_SCHEDULE_FEATURE ? window.ATLAS_EXAM_SCHEDULE_FEATURE({
    getCourses: courses,
    getSchedule: schedule,
    getAssessments: assessments,
    esc,
    button,
    formatDate: fmtDate,
    isDashboard: () => !location.hash || location.hash === "#/"
  }) : null;
  function progress(code) { return window.ATLAS_STUDY_STORE.courseProgress(code, lessons(code)); }
  function slideResume(code, slideSet) {
    if (!slideSet || !window.ATLAS_STUDY_STORE || typeof window.ATLAS_STUDY_STORE.readingFor !== "function") return { number: 1, label: "Open lecture slides" };
    const saved = window.ATLAS_STUDY_STORE.readingFor(`slide:${code}:${slideSet.id}`);
    if (saved && !saved.completed && Number(saved.position) > 1) return { number: Number(saved.position), label: `Continue slides · ${saved.position}` };
    return { number: 1, label: "Open lecture slides" };
  }
  function focusCourseCode() {
    const resume = window.ATLAS_STUDY_STORE && typeof window.ATLAS_STUDY_STORE.lastLesson === "function" ? window.ATLAS_STUDY_STORE.lastLesson() : null;
    if (resume && courses().some(item => item.code === resume.courseCode)) return resume.courseCode;
    const recommended = recommendedNext();
    return recommended ? recommended.course.code : (courses()[0] || {}).code;
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
  function courseTimeline(code) {
    const catalog = content(code), modules = catalog.modules || [], all = modules.flatMap((module, moduleIndex) => (module.lessons || []).map((lesson, lessonIndex) => ({ ...lesson, moduleTitle: module.title, moduleIndex, lessonIndex })));
    const byId = new Map(all.map(lesson => [lesson.id, lesson]));
    const ids = Array.isArray(catalog.timelineLessonIds) && catalog.timelineLessonIds.length
      ? catalog.timelineLessonIds
      : all.slice().sort((a, b) => {
        const sequence = (Number(a.sequence) || Number.MAX_SAFE_INTEGER) - (Number(b.sequence) || Number.MAX_SAFE_INTEGER);
        if (sequence) return sequence;
        const week = (Number(a.week) || Number.MAX_SAFE_INTEGER) - (Number(b.week) || Number.MAX_SAFE_INTEGER);
        if (week) return week;
        const orderInWeek = (Number(a.orderInWeek) || Number.MAX_SAFE_INTEGER) - (Number(b.orderInWeek) || Number.MAX_SAFE_INTEGER);
        return orderInWeek || a.moduleIndex - b.moduleIndex || a.lessonIndex - b.lessonIndex;
      }).map(lesson => lesson.id);
    return [...ids.map(id => byId.get(id)).filter(Boolean), ...all.filter(lesson => !ids.includes(lesson.id))];
  }
  function lessonRow(code, lesson, metaLabel) {
    const done = window.ATLAS_STUDY_STORE.lessonDone(lesson.id);
    const meta = metaLabel || `Week ${lesson.week} · ${lesson.minutes} min · ${(lesson.questionIds || []).length} practice prompts${lesson.hasVisualLab ? " · visual lab" : ""}`;
    return `<a class="nus-lesson-row" href="#/nus/lesson/${esc(code)}/${esc(lesson.id)}" data-route><span class="nus-lesson-dot ${done ? "done" : ""}">${done ? "✓" : ""}</span><div><b>${esc(lesson.title)}</b><span>${esc(meta)}</span></div><span>→</span></a>`;
  }
  function timelineSections(code) {
    const groups = [];
    courseTimeline(code).forEach(lesson => {
      const week = Number(lesson.week) || 0;
      let group = groups[groups.length - 1];
      if (!group || group.week !== week) { group = { week, lessons: [] }; groups.push(group); }
      group.lessons.push(lesson);
    });
    let reachedCurrent = false;
    return groups.map(group => {
      const complete = group.lessons.every(item => window.ATLAS_STUDY_STORE.lessonDone(item.id));
      const state = complete ? "complete" : (reachedCurrent ? "upcoming" : "current");
      if (!complete) reachedCurrent = true;
      const marker = state === "complete" ? "✓ Completed" : state === "current" ? "● Current" : "○ Upcoming";
      return `<section class="nus-module nus-timeline-week is-${state} reveal"><div class="nus-timeline-week-head"><div class="eyebrow">Week ${esc(group.week)}</div><span>${marker}</span></div>${group.lessons.map(lesson => lessonRow(code, lesson, `${lesson.minutes} min · ${(lesson.questionIds || []).length} practice prompts`)).join("")}</section>`;
    }).join("");
  }
  function topicSections(code) {
    const catalog = content(code);
    return (catalog.modules || []).map(module => `<section class="nus-module nus-topic-section reveal"><div class="eyebrow">Topic</div><h3>${esc(module.title)}</h3>${module.description ? `<p class="nus-muted">${text(module.description)}</p>` : ""}${(module.lessons || []).map(item => lessonRow(code, item, `Week ${item.week} · ${item.minutes} min`)).join("")}</section>`).join("");
  }
  async function renderCollection(code, collectionId, context) {
    const loading = ensureCourseLoaded(code, context);
    if (loading) {
      if (!await loading || (context && !context.isCurrent())) return;
      return renderCollection(code, collectionId, context);
    }
    const c = course(code), catalog = content(code), collection = (catalog.collections || []).find(item => item.id === collectionId);
    if (!c || !collection) return renderNotFound();
    const byId = new Map(courseTimeline(code).map(lesson => [lesson.id, lesson]));
    const rows = (collection.lessonIds || []).map(id => byId.get(id)).filter(Boolean).map(lesson => lessonRow(code, lesson, `Week ${lesson.week} · ${lesson.moduleTitle || "course topic"}`)).join("");
    let body = pageHead(`${c.code} · Study collection`, collection.title, collection.description || "A revision view over the lecture timeline.");
    body += `<div class="nus-course-meta">${button("← Course timeline", `#/nus/course/${c.code}`, "ghost")}<span>Collection view · ${collection.lessonIds.length} lessons</span></div><div class="nus-course-layout"><main><section class="nus-card reveal"><div class="eyebrow">Revision collection</div><p class="nus-muted">This collection is a study lens. It does not reorder or replace the chronological lecture timeline.</p>${rows}</section></main><aside>${card("How to use this", "Attempt each derivation from memory, then return to the lecture-week link when a prerequisite is weak.", "reveal")}</aside></div>`;
    root.innerHTML = body;
  }
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
  function singaporeDateKey(value = Date.now()) {
    const parts = new Intl.DateTimeFormat("en-SG", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
    const fields = Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, part.value]));
    return `${fields.year}-${fields.month}-${fields.day}`;
  }
  function assessmentState(assessment, now = Date.now()) {
    if (!assessment || !assessment.date) return "pending";
    const date = String(assessment.date);
    const dateKey = date.slice(0, 10);
    if (dateKey === singaporeDateKey(now)) return "today";
    const timestamp = date.length === 10 ? Date.parse(`${date}T23:59:59+08:00`) : Date.parse(date);
    return Number.isFinite(timestamp) && timestamp < now ? "past" : "future";
  }
  function allUpcoming() {
    return assessments().filter(a => ["today", "future"].includes(assessmentState(a))).sort((a, b) => {
      const aDate = String(a.date).length === 10 ? `${a.date}T23:59:59+08:00` : a.date;
      const bDate = String(b.date).length === 10 ? `${b.date}T23:59:59+08:00` : b.date;
      return Date.parse(aDate) - Date.parse(bDate);
    });
  }
  function firstOpenLessonInCourse(code) {
    const c = course(code);
    if (!c) return null;
    const l = courseTimeline(c.code).find(item => !window.ATLAS_STUDY_STORE.lessonDone(item.id));
    return l ? { course: c, lesson: l } : null;
  }
  function firstOpenLesson(preferredCode) {
    const orderedCourses = preferredCode
      ? [...courses().filter(item => item.code === preferredCode), ...courses().filter(item => item.code !== preferredCode)]
      : courses();
    for (const c of orderedCourses) {
      const open = firstOpenLessonInCourse(c.code);
      if (open) return open;
    }
    return null;
  }
  function recommendedNext() {
    const store = window.ATLAS_STUDY_STORE;
    const resume = store && typeof store.lastLesson === "function" ? store.lastLesson() : null;
    if (resume && courses().some(item => item.code === resume.courseCode)) {
      const c = course(resume.courseCode), ordered = courseTimeline(resume.courseCode), index = ordered.findIndex(item => item.id === resume.lessonId);
      if (c && index >= 0) {
        const candidate = ordered.slice(index).find(item => !store.lessonDone(item.id));
        if (candidate) return { course: c, lesson: candidate, reason: candidate.id === resume.lessonId ? "Continue where you left off" : "Continue this course in chronological order" };
      }
    }
    const nearestCourse = allUpcoming().map(item => item.courseCode).find(code => firstOpenLessonInCourse(code));
    const open = nearestCourse ? firstOpenLessonInCourse(nearestCourse) : firstOpenLesson();
    return open ? { ...open, reason: nearestCourse ? "This course has the nearest confirmed assessment" : "Next unfinished lesson" } : null;
  }
  function lessonTiming(code) {
    const next = courseTimeline(code).find(item => !window.ATLAS_STUDY_STORE.lessonDone(item.id));
    return next ? { week: next.week, state: "Current" } : { week: null, state: "Complete" };
  }
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
  function examCountdownCards() { return examScheduleFeature ? examScheduleFeature.renderCards() : ""; }
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

  function stopFocusBlock() {
    if (!focusTimer) return;
    clearInterval(focusTimer);
    focusTimer = null;
  }

  function greeting() {
    const hour = Number(new Intl.DateTimeFormat("en-SG", { timeZone: "Asia/Singapore", hour: "numeric", hourCycle: "h23" }).format(new Date()));
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  }
  function courseDirectoryRows() {
    return courses().map(c => {
      const p = progress(c.code), timing = lessonTiming(c.code);
      return `<a class="nus-course-directory-row" href="#/nus/course/${esc(c.code)}" data-route style="--course:${esc(c.color)}"><span class="nus-course-directory-mark"></span><div><b>${esc(c.code)}</b><span>${esc(c.title)} · ${timing.week ? `Week ${timing.week}` : timing.state}</span></div><div><strong>${p.pct}% complete</strong><i><em style="width:${p.pct}%"></em></i></div><span aria-hidden="true">→</span></a>`;
    }).join("");
  }
  function renderDashboard(showExamPopup = false) {
    syncRetrievalSchedules();
    const upcoming = allUpcoming().slice(0, 3), nearest = upcoming[0], nearestDays = nearest && dayCount(nearest.date);
    const recommended = recommendedNext();
    const store = window.ATLAS_STUDY_STORE;
    const due = store && typeof store.dueRetrievals === "function" ? store.dueRetrievals().length : 0;
    const today = [
      recommended ? `<a href="#/nus/lesson/${esc(recommended.course.code)}/${esc(recommended.lesson.id)}" data-route>Continue <b>${esc(recommended.course.code)} · Week ${esc(recommended.lesson.week)}</b><span>${esc(recommended.lesson.title)}</span></a>` : "",
      due ? `<a href="#/nus/review/retrieval" data-route>Review <b>${due} due concept${due === 1 ? "" : "s"}</b><span>Retrieval keeps mastered material available.</span></a>` : "",
      nearest ? `<a href="#/nus/planner" data-route>Plan <b>${esc(nearest.title)}</b><span>${nearestDays === 0 ? "Today" : `${nearestDays} days left`} · ${esc(nearest.courseCode)}</span></a>` : ""
    ].filter(Boolean);
    let body = pageHead("NUS Atlas · AY2026/27 Semester 1", `${greeting()}.`, "One clear study loop: learn the next idea, practise it, then review what needs attention.");
    body += `<section class="nus-hero nus-home-continue reveal"><div><div class="eyebrow">Continue</div><h3>${recommended ? esc(recommended.lesson.title) : "Your seeded lessons are complete"}</h3><p>${recommended ? `${esc(recommended.course.code)} · Week ${esc(recommended.lesson.week)} · ${esc(recommended.lesson.summary)}` : "Use Review to keep previously learned material active."}</p>${recommended ? `<small class="nus-home-why">Why this? ${esc(recommended.reason)} · about ${esc(recommended.lesson.minutes)} min.</small>` : ""}</div><div class="nus-hero-actions">${recommended ? button("Continue learning →", `#/nus/lesson/${recommended.course.code}/${recommended.lesson.id}`, "primary") : button("Open Review", "#/nus/review", "primary")}</div></section>`;
    body += `<section class="nus-home-section reveal"><div class="nus-section-heading"><div><div class="eyebrow">Today</div><h3>Make the next useful move</h3></div></div><div class="nus-today-list">${today.length ? today.join("") : `<p class="nus-muted">No confirmed deadline or due review right now. Choose a course to continue.</p>`}</div></section>`;
    body += `<section class="nus-home-section reveal"><div class="nus-section-heading"><div><div class="eyebrow">Your courses</div><h3>Follow the semester, week by week</h3></div>${button("View all courses", "#/nus/courses", "ghost")}</div><div class="nus-course-directory">${courseDirectoryRows()}</div></section>`;
    body += `<section class="nus-home-section reveal"><div class="nus-section-heading"><div><div class="eyebrow">Upcoming</div><h3>What is coming next?</h3></div>${button("Open Plan", "#/nus/planner", "ghost")}</div>${upcoming.length ? `<div class="nus-list">${upcoming.map(assessmentRow).join("")}</div>` : `<p class="nus-muted">No confirmed dates yet. Atlas will not invent a deadline.</p>`}</section>`;
    root.innerHTML = body;
    if (showExamPopup && examScheduleFeature) window.setTimeout(() => examScheduleFeature.showPopup(), 0);
  }

  function renderCourses() {
    const recommended = recommendedNext();
    let body = pageHead("Courses", "Your semester, in order", "Open a course to follow its lecture timeline. Topic and revision views stay available when you need them.");
    if (recommended) body += `<section class="nus-course-continue reveal"><span>Continue</span><b>${esc(recommended.course.code)} · Week ${esc(recommended.lesson.week)}</b><a href="#/nus/lesson/${esc(recommended.course.code)}/${esc(recommended.lesson.id)}" data-route>${esc(recommended.lesson.title)} →</a></section>`;
    body += `<section class="nus-home-section reveal"><div class="nus-course-directory">${courseDirectoryRows()}</div></section>`;
    root.innerHTML = body;
  }

  function weakLessonRows() {
    const store = window.ATLAS_STUDY_STORE;
    const counts = new Map();
    courses().flatMap(c => store.mistakes(c.code)).forEach(item => {
      const key = `${item.courseCode}:${item.lessonId || ""}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([key, count]) => {
      const [code, id] = key.split(":"), item = lesson(code, id);
      return `<a class="nus-list-row" href="#/nus/lesson/${esc(code)}/${esc(id)}" data-route><div><b>${esc(item ? item.title : id || code)}</b><span>${esc(code)} · ${count} unresolved mistake${count === 1 ? "" : "s"}</span></div><span>→</span></a>`;
    }).join("");
  }
  function renderReviewHub() {
    syncRetrievalSchedules();
    const store = window.ATLAS_STUDY_STORE, code = focusCourseCode(), due = store.dueRetrievals().length;
    const mistakes = courses().reduce((sum, c) => sum + store.mistakes(c.code).length, 0);
    const readiness = readinessFor(code), weak = weakLessonRows();
    let body = pageHead("Review", "Keep the important ideas available", "Atlas chooses the type of review. You only need to make the next short, focused move.");
    body += `<div class="nus-review-hub"><section class="nus-review-priority reveal"><div><div class="eyebrow">Recommended</div><h3>${due ? `${due} concept${due === 1 ? "" : "s"} due for retrieval` : "No retrieval due right now"}</h3><p>${due ? "Answer one or two questions without rereading the lesson." : "Practice or revisit a mistake to create your next review signal."}</p></div>${button(due ? "Start review →" : "Practice a course →", due ? "#/nus/review/retrieval" : `#/nus/exam/${code}`, "primary")}</section><div class="nus-review-grid"><section class="nus-card reveal"><div class="eyebrow">Mistakes</div><h3>${mistakes ? `${mistakes} unresolved` : "Nothing unresolved"}</h3><p>${mistakes ? "Repair the misconception, then mark the idea as fixed." : "Missed questions will appear here after practice."}</p>${button("Review mistakes", "#/nus/review/mistakes", "ghost")}</section><section class="nus-card reveal"><div class="eyebrow">Exam preparation</div><h3>${esc(code)} · ${readiness.coverage}% covered</h3><p>${readiness.unresolved ? `${readiness.unresolved} unresolved idea${readiness.unresolved === 1 ? "" : "s"}.` : "No unresolved mistakes in this course."}</p>${button("Practice this course", `#/nus/exam/${code}`, "ghost")}</section></div><section class="nus-card reveal"><div class="eyebrow">Weak concepts</div><h3>Clarify before the next practice run</h3>${weak ? `<div class="nus-list">${weak}</div>` : `<p class="nus-muted">Atlas will surface concepts here after it sees an incorrect answer.</p>`}</section></div>`;
    root.innerHTML = body;
  }

  function assessmentRow(a) {
    const state = assessmentState(a), days = dayCount(a.date), reminder = state === "future" && days != null && [7, 3, 1].includes(days) ? ` · reminder ${days}d` : "";
    const status = state === "today" ? "today" : `${days}d left`;
    return `<a class="nus-list-row" href="#/nus/planner" data-route><div><b>${esc(a.title)}</b><span>${esc(courseName(a.courseCode))} · ${esc(a.kind)} · ${esc(assessmentWeightLabel(a))}</span></div><div class="nus-date">${esc(fmtAssessmentDate(a))}<small>${esc(status)}${reminder}</small></div></a>`;
  }

  const plannerFeature = window.ATLAS_PLANNER_FEATURE ? window.ATLAS_PLANNER_FEATURE({
    root,
    getAssessments: assessments,
    getStore: () => window.ATLAS_STUDY_STORE,
    pageHead,
    button,
    dayCount,
    fmtDate,
    formatAssessmentDate: fmtAssessmentDate,
    formatAssessmentWeight: assessmentWeightLabel,
    statusPill,
    sourceLabel,
    esc
  }) : null;
  function renderPlanner() { return plannerFeature ? plannerFeature.render() : renderNotFound(); }

  function routeIsCurrent(context, route) {
    return (!context || typeof context.isCurrent !== "function" || context.isCurrent()) && location.hash === route;
  }

  function ensureCourseLoaded(code, context) {
    const repo = repository();
    if (!repo || typeof repo.needsLoad !== "function" || !repo.needsLoad(code)) return null;
    const route = location.hash;
    root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Loading course package</div><h2>${esc(code)}</h2><p>Fetching the normalized lessons, questions, and study kit…</p></section>`;
    return repo.loadCourse(code).then(packageData => {
      if (!routeIsCurrent(context, route)) return false;
      if (packageData) return true;
      root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Course unavailable</div><h2>${esc(code)}</h2><p>The course package could not be loaded. The legacy adapter remains available for other courses.</p></section>`;
      return false;
    }).catch(error => {
      if (routeIsCurrent(context, route)) root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Course unavailable</div><h2>${esc(code)}</h2><p>${esc(error.message || "The course package could not be loaded.")}</p></section>`;
      return false;
    });
  }

  function ensureLessonLoaded(code, id, context) {
    const repo = repository();
    if (!repo || typeof repo.loadLesson !== "function" || (typeof repo.isLessonLoaded === "function" && repo.isLessonLoaded(code, id))) return null;
    const route = location.hash;
    root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Loading lesson payload</div><h2>${esc(id)}</h2><p>Fetching this lesson, its questions, and study kit…</p></section>`;
    return repo.loadLesson(code, id).then(payload => {
      if (!routeIsCurrent(context, route)) return false;
      if (payload) return true;
      renderNotFound();
      return false;
    }).catch(error => {
      if (routeIsCurrent(context, route)) root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Lesson unavailable</div><h2>${esc(id)}</h2><p>${esc(error.message || "The lesson payload could not be loaded.")}</p></section>`;
      return false;
    });
  }

  function ensureSlidesLoaded(code, context) {
    const repo = repository();
    if (!repo || typeof repo.loadSlides !== "function" || (repo.getSlideSets(code) || []).length) return null;
    const route = location.hash;
    root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Loading lecture slides</div><h2>${esc(code)}</h2><p>Fetching the slide shard for this lecture…</p></section>`;
    return repo.loadSlides(code).then(slides => {
      if (!routeIsCurrent(context, route)) return false;
      if (slides && slides.length) return true;
      root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Slides unavailable</div><h2>${esc(code)}</h2><p>No lecture slide set is available for this course.</p></section>`;
      return false;
    }).catch(error => {
      if (routeIsCurrent(context, route)) root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Slides unavailable</div><h2>${esc(code)}</h2><p>${esc(error.message || "The slide payload could not be loaded.")}</p></section>`;
      return false;
    });
  }

  function ensureTextbookLoaded(code, context) {
    const repo = repository();
    if (!repo || typeof repo.loadTextbook !== "function" || (repo.getTextbook && repo.getTextbook(code))) return null;
    const route = location.hash;
    root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Loading textbook reader</div><h2>${esc(code)}</h2><p>Fetching the textbook PDF reader metadata…</p></section>`;
    return repo.loadTextbook(code).then(textbook => {
      if (!routeIsCurrent(context, route)) return false;
      if (textbook) return true;
      root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Textbook unavailable</div><h2>${esc(code)}</h2><p>The textbook reader metadata is not available for this course.</p></section>`;
      return false;
    }).catch(error => {
      if (routeIsCurrent(context, route)) root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Textbook unavailable</div><h2>${esc(code)}</h2><p>${esc(error.message || "The textbook payload could not be loaded.")}</p></section>`;
      return false;
    });
  }

  function ensurePracticeLoaded(code, context) {
    const repo = repository();
    if (!repo || typeof repo.loadCourse !== "function") return null;
    const codes = code ? [code] : courses().map(item => item.code);
    const pending = codes.flatMap(courseCode => lessons(courseCode)
      .filter(item => !(typeof repo.isLessonLoaded === "function" && repo.isLessonLoaded(courseCode, item.id)))
      .map(item => ({ courseCode, lessonId: item.id })));
    const needsCourse = codes.some(courseCode => typeof repo.needsLoad === "function" && repo.needsLoad(courseCode));
    if (!pending.length && !needsCourse) return null;
    const route = location.hash;
    root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Preparing practice surface</div><h2>${esc(code || "NUS courses")}</h2><p>Loading question and study-kit shards only for this practice run…</p></section>`;
    return Promise.all(codes.map(courseCode => repo.loadCourse(courseCode)))
      .then(() => Promise.all(pending.map(item => repo.loadLesson(item.courseCode, item.lessonId))))
      .then(() => {
      if (!routeIsCurrent(context, route)) return false;
      return true;
    }).catch(error => {
      if (routeIsCurrent(context, route)) root.innerHTML = `<section class="nus-card reveal"><div class="eyebrow">Practice unavailable</div><h2>${esc(code || "NUS courses")}</h2><p>${esc(error.message || "The practice payload could not be loaded.")}</p></section>`;
      return false;
    });
  }

  async function renderCourse(code, context, view) {
    const loading = ensureCourseLoaded(code, context);
    if (loading) {
      if (!await loading || (context && !context.isCurrent())) return;
      return renderCourse(code, context, view);
    }
    const c = course(code);
    if (!c) return renderNotFound();
    const selectedView = view === "topics" ? "topics" : "timeline";
    let body = pageHead(c.code, c.title, c.description);
    const catalog = content(c.code), collections = catalog.collections || [], next = firstOpenLessonInCourse(c.code);
    body += `<div class="nus-course-meta"><span>${esc(c.department)} · ${esc(c.faculty)}</span><span>Workload ${esc(c.workload.join(" / "))}</span></div>`;
    body += `<nav class="nus-course-tabs" aria-label="${esc(c.code)} views"><a class="${selectedView === "timeline" ? "is-active" : ""}" href="#/nus/course/${esc(c.code)}" data-route>Timeline</a><a class="${selectedView === "topics" ? "is-active" : ""}" href="#/nus/course/${esc(c.code)}/topics" data-route>Topics</a></nav>`;
    body += `<div class="nus-course-layout"><main><section class="nus-course-progress reveal"><div><div class="eyebrow">${selectedView === "timeline" ? "Lecture timeline" : "Topic view"}</div><b>${selectedView === "timeline" ? "Follow the semester in chronological order" : "Revisit ideas without changing the course sequence"}</b><span class="nus-muted">${selectedView === "timeline" ? "Weeks remain the primary learning path; topics and collections are secondary lenses." : "Every topic item keeps its original lecture week."}</span></div>${courseProgressBar(c.code)}${next && selectedView === "timeline" ? button(`Continue Week ${next.lesson.week} →`, `#/nus/lesson/${c.code}/${next.lesson.id}`, "primary") : ""}</section>${selectedView === "timeline" ? timelineSections(c.code) : topicSections(c.code)}</main><aside>${card("Assessments", assessments().filter(a => a.courseCode === c.code).map(a => `<div class="nus-weight"><span>${esc(a.title)}</span><b>${esc(assessmentWeightLabel(a))}</b></div>`).join("") || `<p class="nus-muted">Assessment details are pending.</p>`, "reveal")}${collections.length ? card("Study collections", collections.map(collection => `<a class="nus-list-row" href="#/nus/collection/${c.code}/${collection.id}" data-route><div><b>${esc(collection.title)}</b><span>${collection.lessonIds.length} lessons · revision lens</span></div><span>→</span></a>`).join(""), "reveal") : ""}<details class="nus-course-resources"><summary>Resources and sources</summary>${repository() && repository().hasTextbook && repository().hasTextbook(c.code) ? `<p>${button("Open textbook PDF", `#/nus/textbook/${c.code}/1`, "ghost")}</p>` : ""}${c.code === "DSA5105" ? `<p>${button("Assessment map", `#/nus/assessment-map/${c.code}`, "ghost")}</p>` : ""}<div class="nus-source-groups">${sourceGroups(c).map(g => `<div class="nus-source-group"><b>${esc(g.label)}</b><ul class="nus-source-list">${g.refs.map(r => `<li>${sourceItem(r)}</li>`).join("")}</ul></div>`).join("")}</div><a class="nus-external" href="${esc(c.nusmods.url)}" target="_blank" rel="noreferrer">NUSMods course page ↗</a></details></aside></div>`;
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
  async function renderLesson(code, id, context) {
    const courseLoading = ensureCourseLoaded(code, context);
    if (courseLoading) {
      if (!await courseLoading || (context && !context.isCurrent())) return;
      return renderLesson(code, id, context);
    }
    const lessonLoading = ensureLessonLoaded(code, id, context);
    if (lessonLoading) {
      if (!await lessonLoading || (context && !context.isCurrent())) return;
      return renderLesson(code, id, context);
    }
    const c = course(code), l = lesson(code, id);
    if (!c || !l) return renderNotFound();
    const done = window.ATLAS_STUDY_STORE.lessonDone(l.id);
    const courseLessons = courseTimeline(code), index = courseLessons.findIndex(x => x.id === l.id);
    const previous = courseLessons[index - 1], next = courseLessons[index + 1];
    const courseTextbook = repository() && repository().getTextbook ? repository().getTextbook(c.code) : null;
    setReaderMode(readerModeOn());
    let body = pageHead(`${c.code} · Week ${l.week}`, l.title, l.summary);
    const slideSet = slideSets(code).find(item => (item.lessonIds || []).includes(l.id)) || ((l.slideSetIds || [])[0] ? { id: l.slideSetIds[0] } : null);
    const slideResumeState = slideResume(code, slideSet);
    const primaryHref = slideSet ? `#/nus/slides/${c.code}/${slideSet.id}/${slideResumeState.number}` : `#/nus/exam/${c.code}/${l.id}`;
    const primaryLabel = slideSet ? slideResumeState.label : `Practice ${l.questions.length} questions`;
    const resources = `<details class="nus-lesson-more"><summary>More</summary><div class="nus-lesson-more-actions"><button class="btn ghost" id="nus-mark-lesson" type="button">${done ? "✓ Completed" : "Mark complete"}</button>${(courseTextbook && courseTextbook.reader) || (repository() && repository().hasTextbook && repository().hasTextbook(c.code)) ? button("Open textbook PDF", `#/nus/textbook/${c.code}/1`, "ghost") : ""}${l.contrastDrills && l.contrastDrills.length ? button("Clarify similar concepts", `#/nus/contrast/${c.code}/${l.id}`, "ghost") : ""}${button("Review mistakes", `#/nus/review/mistakes`, "ghost")}${readerButton()}</div></details>`;
    body += `<div class="nus-lesson-actions nus-lesson-primary-actions">${button(`← Week ${l.week}`, `#/nus/course/${c.code}`, "ghost")}${button(primaryLabel, primaryHref, "primary")}${resources}</div>`;
    body += studyCompass(l);
    const lab = repository() ? repository().getLab(l.id) : null;
    const visualCueIds = Array.isArray(l.visualIds) ? l.visualIds : [];
    const visualCueBody = visualCueIds.length ? `<p class="nus-visual-cue-intro">Use each cue as a short loop: <b>look → predict → explain</b>. <span data-nus-visual-progress>0/${visualCueIds.length} practiced</span></p>${visualCueIds.map(visualId => visualCard(visualId, { courseCode: c.code, lessonId: l.id, labId: lab && (lab.lessonId || l.id), hasLab: !!lab })).join("")}` : "";
    const miniMap = `<nav class="nus-lesson-mini-map" aria-label="Lesson outline"><div class="eyebrow">In this lesson</div><a href="#nus-lesson-read" data-nus-jump="nus-lesson-read">Introduction</a>${(l.sections || []).map((section, sectionIndex) => `<a href="#nus-lesson-concept-${sectionIndex}" data-nus-jump="nus-lesson-concept-${sectionIndex}">${esc(section.title)}</a>`).join("")}<a href="#nus-lesson-recall" data-nus-jump="nus-lesson-recall">Check yourself</a><a href="#nus-lesson-practice" data-nus-jump="nus-lesson-practice">Practice</a></nav>`;
    body += `<div class="nus-lesson-grid"><main><section class="nus-card nus-objectives reveal"><div class="nus-teach-head"><h3>What you will learn</h3><span class="pill gold">${esc(l.minutes)} min</span></div><ul>${(l.objectives || []).map(objective => `<li>${esc(objective)}</li>`).join("")}</ul></section>${lab && window.ATLAS_COMPONENTS ? window.ATLAS_COMPONENTS.renderLab(l, lab) : ""}<div id="nus-lesson-read">${(l.sections || []).map((section, sectionIndex) => lessonSection(section, sectionIndex)).join("")}${(l.math || []).map(mathBlock).join("")}</div><div id="nus-lesson-work">${(l.examples || []).map(workedExample).join("")}</div>${criticalThinking(l)}<section class="nus-card nus-recall reveal" id="nus-lesson-recall"><div class="nus-teach-head"><h3>Check yourself</h3><span class="pill">${l.questions.length} prompts</span></div><p class="nus-muted">Answer on paper first. Open each prompt only after you commit to an answer.</p><div class="nus-question-list">${l.questions.map(recallItem).join("")}</div></section>${studyKit(l, { practiceHref: `#/nus/exam/${c.code}/${l.id}`, practiceClass: "ghost" })}<div class="nus-lesson-nav">${previous ? button(`← ${previous.title}`, `#/nus/lesson/${c.code}/${previous.id}`, "ghost") : `<span></span>`}${next ? button(`Next: ${next.title} →`, `#/nus/lesson/${c.code}/${next.id}`, "ghost") : button("Back to course", `#/nus/course/${c.code}`, "ghost")}</div></main><aside>${miniMap}${visualCueIds.length ? card("Visual study cues", visualCueBody, "reveal") : ""}<details class="nus-lesson-sources"><summary>ⓘ Sources</summary>${sourceDisclosure(l.sourceRefs, "Verified source pages")}</details></aside></div>`;
    root.innerHTML = body;
    typesetNus();
    if (window.ATLAS_COMPONENTS) window.ATLAS_COMPONENTS.bind(root);
    if (typeof window.ATLAS_STUDY_STORE.setLastLesson === "function") window.ATLAS_STUDY_STORE.setLastLesson({ courseCode: code, lessonId: l.id });
    root.querySelector("#nus-mark-lesson")?.addEventListener("click", () => { window.ATLAS_STUDY_STORE.markLesson(l.id, !done, { courseCode: code, sourceRefs: l.sourceRefs }); renderLesson(code, id); });
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
  async function renderExam(code, scope, internal, context) {
    const selectedCode = code || focusCourseCode();
    const loading = !internal && ensurePracticeLoaded(selectedCode, context);
    if (loading) {
      if (!await loading || (context && !context.isCurrent())) return;
      return renderExam(selectedCode, scope, false, context);
    }
    return examFeature ? examFeature.render(selectedCode, scope, internal) : renderNotFound();
  }
  async function renderMistakes(code, context) {
    const loading = ensurePracticeLoaded(code, context);
    if (loading) {
      if (!await loading || (context && !context.isCurrent())) return;
      return renderMistakes(code, context);
    }
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
  async function renderAssessmentMap(code, context) {
    const loading = ensureCourseLoaded(code, context);
    if (loading) {
      if (!await loading || (context && !context.isCurrent())) return;
      return renderAssessmentMap(code, context);
    }
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
  async function renderRetrieval(code, context) {
    const loading = ensurePracticeLoaded(code, context);
    if (loading) {
      if (!await loading || (context && !context.isCurrent())) return;
      return renderRetrieval(code, context);
    }
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
  async function renderContrast(code, scope, context) {
    const loading = ensurePracticeLoaded(code, context);
    if (loading) {
      if (!await loading || (context && !context.isCurrent())) return;
      return renderContrast(code, scope, context);
    }
    return contrastFeature ? contrastFeature.render(code || focusCourseCode(), scope) : renderNotFound();
  }

  const sqlFeature = window.ATLAS_SQL_FEATURE ? window.ATLAS_SQL_FEATURE({ root, getContent: content, getPractice: () => { const item = course("DSA5104"); return item && item.sqlPractice; }, pageHead, card, esc, text, notFound: renderNotFound }) : null;
  const simulationsFeature = window.ATLAS_SIMULATIONS_FEATURE ? window.ATLAS_SIMULATIONS_FEATURE({ root, pageHead, esc, getStore: () => window.ATLAS_STUDY_STORE }) : null;
  async function renderSql(context) {
    const loading = ensureCourseLoaded("DSA5104", context);
    if (loading) {
      if (!await loading || (context && !context.isCurrent())) return;
      return renderSql(context);
    }
    return sqlFeature ? sqlFeature.render() : renderNotFound();
  }
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
  async function renderSlides(code, setId, slideNumber, context) {
    const courseLoading = ensureCourseLoaded(code, context);
    if (courseLoading) {
      if (!await courseLoading || (context && !context.isCurrent())) return;
      return renderSlides(code, setId, slideNumber, context);
    }
    const slideLoading = ensureSlidesLoaded(code, context);
    if (slideLoading) {
      if (!await slideLoading || (context && !context.isCurrent())) return;
      return renderSlides(code, setId, slideNumber, context);
    }
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
  async function renderTextbook(code, page, context) {
    const courseLoading = ensureCourseLoaded(code, context);
    if (courseLoading) {
      if (!await courseLoading || (context && !context.isCurrent())) return;
      return renderTextbook(code, page, context);
    }
    const textbookLoading = ensureTextbookLoaded(code, context);
    if (textbookLoading) {
      if (!await textbookLoading || (context && !context.isCurrent())) return;
      return renderTextbook(code, page, context);
    }
    return textbookReaderFeature ? textbookReaderFeature.render(code, page) : renderNotFound();
  }

  const routeTable = window.ATLAS_ROUTE_TABLE ? window.ATLAS_ROUTE_TABLE({
    dashboard: () => renderDashboard(true),
    courses: () => renderCourses(),
    planner: () => renderPlanner(),
    course: (parts, context) => renderCourse(parts[1], context, parts[2]),
    collection: (parts, context) => renderCollection(parts[1], parts[2], context),
    lesson: (parts, context) => renderLesson(parts[1], parts[2], context),
    exam: (parts, context) => renderExam(parts[1], parts[2], false, context),
    "assessment-map": (parts, context) => renderAssessmentMap(parts[1] || "DSA5105", context),
    review: (parts, context) => {
      if (parts[1] === "retrieval") return renderRetrieval(parts[2], context);
      if (parts[1] === "mistakes") return renderMistakes(parts[2] || focusCourseCode(), context);
      return parts[1] ? renderRetrieval(parts[1], context) : renderReviewHub();
    },
    mistakes: (parts, context) => renderMistakes(parts[1] || focusCourseCode(), context),
    contrast: (parts, context) => renderContrast(parts[1] || focusCourseCode(), parts[2], context),
    slides: (parts, context) => renderSlides(parts[1], parts[2], parts[3], context),
    textbook: (parts, context) => renderTextbook(parts[1], parts[2], context),
    sql: (_parts, context) => renderSql(context),
    simulations: () => renderSimulations()
  }) : null;
  function renderNotFound() { root.innerHTML = pageHead("NUS", "Not found", "That study page does not exist.") + button("Back to NUS dashboard", "#/", "primary"); }
  function stopTransient() {
    if (examScheduleFeature) examScheduleFeature.close();
    stopExamTimer();
    if (readingTimerFeature && typeof readingTimerFeature.stop === "function") readingTimerFeature.stop();
    stopFocusBlock();
  }
  async function renderRoute(parts, context) {
    stopTransient();
    const p = parts || [];
    if (p[0] !== "lesson") setReaderMode(false);
    if (p[0] !== "slides") document.body.classList.remove("nus-slide-focus-mode");
    const handler = routeTable && routeTable.resolve(p);
    const result = handler ? handler(p, context) : renderNotFound();
    const rendered = result && typeof result.then === "function" ? await result : result;
    if (context && !context.isCurrent()) return rendered;
    typesetNus();
    return rendered;
  }
  window.ATLAS_NUS_UI = { renderRoute, courseName, stopTransient };
})();
