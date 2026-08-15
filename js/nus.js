(function () {
  "use strict";
  const root = document.getElementById("app");
  const esc = value => String(value == null ? "" : value).replace(/[&<>\"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch]));
  const text = value => esc(value).replace(/\n/g, "<br>");
  const repository = () => window.NUS_REPOSITORY || null;
  const courses = () => repository() ? repository().listCourses() : (window.NUS_COURSES || []);
  const assessments = () => repository() ? repository().listAssessments() : (window.NUS_ASSESSMENTS || []);
  const visuals = () => repository() ? repository().listVisuals() : (window.NUS_VISUALS || {});
  const schedule = () => repository() ? repository().getSchedule() : (window.NUS_SCHEDULE || { courses: {} });
  const sourceTypes = () => repository() ? repository().getSourceTypes() : (window.NUS_SOURCE_TYPES || {});
  let examState = null, examTimer = null, focusTimer = null;
  let sqlState = { index: 0, result: null, error: null, ran: false, reveal: false }, sqlPromise = null;
  let clockState = { p1: 0, p2: 0, vector1: [0, 0], vector2: [0, 0], events: [] };
  let deliveryState = { mode: "FIFO", log: [] };

  function course(code) { return repository() ? repository().getCourse(code) : courses().find(c => c.code === code) || null; }
  function content(code) { return repository() ? repository().getCatalog(code) : (window.NUS_CONTENT || {})[code] || { modules: [] }; }
  function lessons(code) { return repository() ? repository().listLessons(code) : content(code).modules.flatMap(m => m.lessons || []); }
  function lesson(code, id) { return repository() ? repository().getLesson(code, id) : lessons(code).find(l => l.id === id) || null; }
  function courseName(code) { const c = course(code); return c ? c.title : code; }
  function fmtDate(value, pendingLabel) {
    if (!value) return pendingLabel || "Date pending";
    return new Intl.DateTimeFormat("en-SG", { timeZone: "Asia/Singapore", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }
  function dayCount(value) {
    if (!value) return null;
    return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
  }
  function progress(code) { return window.NUS_STORE.courseProgress(code, lessons(code)); }
  function learningSignals() {
    const quests = window.NUS_STORE.questState(), recognition = window.NUS_STORE.recognition();
    const questBody = quests.quests.map(q => `<div class="nus-quest"><div><b>${esc(q.label)}</b><span>${esc(q.hint)}</span></div><strong>${q.progress}/${q.target}</strong><div class="nus-quest-progress"><i style="width:${Math.round(q.progress / q.target * 100)}%"></i></div></div>`).join("");
    const labItems = (repository() ? repository().listLabs("DSA5105") : Object.entries(window.NUS_VISUAL_LABS || {}).map(([id, lab]) => ({ id, ...lab }))).map(l => { const m = window.NUS_STORE.masteryFor(l.lessonId), pct = Math.round(m.score * 100); return `<a class="nus-mastery-row" href="#/nus/lesson/DSA5105/${esc(l.lessonId)}" data-route><span><b>${esc(l.title)}</b><small>${m.attempts ? `${m.attempts} evidence moves` : "Not started"}</small></span><span class="nus-mini-progress"><i style="width:${pct}%"></i></span><strong>${pct}%</strong></a>`; }).join("");
    const badgeItems = recognition.slice(0, 6).map(item => `<div class="nus-badge ${item.unlocked ? "unlocked" : "locked"}"><span>${esc(item.icon)}</span><div><b>${esc(item.name)}</b><small>${esc(item.desc)}</small></div><strong>${item.unlocked ? "✓" : `${item.progress}%`}</strong></div>`).join("");
    return `<div class="nus-two-col nus-learning-signals"><div>${card("Today’s quests", `<div class="nus-quest-summary"><b>${quests.complete ? "Daily loop complete" : "Evidence over streaks"}</b><span>${quests.quests.filter(q => q.progress >= q.target).length}/${quests.quests.length} quests · ${quests.completedDays} completed days</span></div><div class="nus-quest-list">${questBody}</div><p class="nus-muted">Opening a page never awards XP. Only a completed study move enters the ledger.</p>`, "reveal")}</div><div>${card("DSA5105 mastery map", `<div class="nus-mastery-list">${labItems}</div><p class="nus-muted">Mastery rises through lesson completion, retrieval, and lab reasoning—not page views.</p>`, "reveal")}</div></div><div>${card("Recognition", `<div class="nus-badge-list">${badgeItems}</div>`, "reveal")}</div>`;
  }
  function sourceLabel(ref) { return ref ? `${ref.sourceId}${ref.page ? ` · p.${ref.page}` : ""}` : ""; }
  function sourceBadge(ref) {
    const meta = sourceTypes()[ref && ref.sourceType];
    if (!meta) return `<span class="pill">Source</span>`;
    const status = ref.status && !["current", "course-depth"].includes(ref.status) ? ` · ${ref.status}` : "";
    return `<span class="pill ${esc(meta.tone)}">${esc(meta.shortLabel)}${esc(status)}</span>`;
  }
  function sourceItem(ref) { return `${sourceBadge(ref)} <span>${esc(sourceLabel(ref))}</span>${ref && ref.role ? `<small>${esc(ref.role)}</small>` : ""}`; }
  function sourceGroups(c) {
    if (!c.lectureSources) return [{ label: "Course sources", refs: (c.localSources || []).map(sourceId => ({ sourceId })) }];
    return [{ label: "Lecture core", refs: c.lectureSources }, { label: "Textbook depth", refs: c.textbookSources || [] }, { label: "Reference / optional", refs: c.referenceSources || [] }].filter(g => g.refs.length);
  }
  function pageHead(kicker, title, desc) { return `<div class="page-head reveal"><div class="eyebrow">${esc(kicker)}</div><h2>${esc(title)}</h2>${desc ? `<p>${text(desc)}</p>` : ""}</div>`; }
  function card(title, body, cls) { return `<section class="nus-card ${cls || ""}"><h3>${esc(title)}</h3>${body}</section>`; }
  function button(label, href, cls) { return `<a class="btn ${cls || "ghost"}" href="${esc(href)}" data-route>${esc(label)}</a>`; }
  function statusPill(status) { return `<span class="pill ${status === "done" ? "sage" : status === "in-progress" ? "gold" : ""}">${esc(status === "in-progress" ? "In progress" : status === "done" ? "Done" : "To do")}</span>`; }
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
  function allUpcoming() { return assessments().filter(a => a.date).sort((a, b) => new Date(a.date) - new Date(b.date)); }
  function firstOpenLesson() { for (const c of courses()) { const l = lessons(c.code).find(x => !window.NUS_STORE.lessonDone(x.id)); if (l) return { course: c, lesson: l }; } return null; }
  function examCountdownCards() { return courses().map(c => ({ code: c.code, exam: (schedule().courses[c.code] || {}).exam })).map(x => `<div class="nus-exam-count"><b>${esc(x.code)}</b><span>${x.exam && x.exam.date ? esc(fmtDate(x.exam.date)) : "Date pending"}</span><small>${x.exam && x.exam.date ? `${Math.max(0, dayCount(x.exam.date))} days left` : "Check course announcement"}</small></div>`).join(""); }
  function bindDashboard() {
    root.querySelectorAll("[data-nus-focus]").forEach(b => b.addEventListener("click", () => startFocus(Number(b.dataset.nusFocus))));
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
    const open = firstOpenLesson(), latest = window.NUS_STORE.attempts().slice(-1)[0];
    let body = pageHead("NUS · AY2026/27 Semester 1", "Your NUS study desk", "A source-backed study space for DSA5101, DSA5104, DSA5105, and DSA5208. Dates marked pending are deliberately not guessed.");
    body += `<section class="nus-hero nus-study-hero reveal"><div><div class="eyebrow">Start here · today’s lesson</div><h3>${open ? esc(open.lesson.title) : "Your seeded lessons are complete"}</h3><p>${open ? `${esc(open.course.code)} · ${esc(open.lesson.summary)}` : "Use Exam Mode for maintenance or revisit a weak topic."}</p>${nearest ? `<small class="nus-hero-deadline">Next deadline: ${esc(nearest.title)} · ${nearestDays < 0 ? "overdue" : `${nearestDays} days left`}</small>` : ""}</div><div class="nus-hero-actions">${open ? button("Read lesson", `#/nus/lesson/${open.course.code}/${open.lesson.id}`, "primary") : button("Open planner", "#/nus/planner", "primary")}${button("Start exam mode", "#/nus/exam", "ghost")}</div></section>`;
    body += `<div class="nus-grid nus-grid-4">${courses().map(c => `<article class="nus-course-card reveal" style="--course:${esc(c.color)}"><div class="nus-course-top"><span class="nus-code">${esc(c.code)}</span><span class="pill">${progress(c.code).pct}%</span></div><h3>${esc(c.title)}</h3><p>${text(c.description)}</p>${courseProgressBar(c.code)}<div class="nus-card-actions">${button("Study course", `#/nus/course/${c.code}`, "ghost")}${button("Practice", `#/nus/exam/${c.code}`, "ghost")}</div></article>`).join("")}</div>`;
    body += learningSignals();
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

  function renderPlanner() {
    let body = pageHead("NUS planner", "Deadlines, checklists, and reminders", "Use status and checklist items to turn each assessment into a reverse study plan. Dates come from local course sources or the NUSMods snapshot.");
    body += `<div class="nus-callout"><b>Reminder policy</b><span>Confirmed dates surface at 7, 3, and 1 day. “Date pending” stays visible until you confirm it yourself.</span></div>`;
    body += `<div class="nus-planner-list">${assessments().map(a => {
      const task = window.NUS_STORE.task(a.id), checks = Array.isArray(task.checks) ? task.checks : [], done = checks.filter(Boolean).length;
      const days = dayCount(a.date), urgency = days != null && days <= 7 && days >= 0 ? "urgent" : "";
      return `<article class="nus-assessment ${urgency}"><div class="nus-assessment-head"><div><span class="nus-code">${esc(a.courseCode)}</span><h3>${esc(a.title)}</h3></div><div class="nus-assessment-meta">${a.date ? `<b>${esc(fmtDate(a.date))}</b><span>${days < 0 ? "overdue" : `${days} days left`}</span>` : `<b>Date pending</b><span>Do not guess</span>`}</div></div><div class="nus-assessment-line"><span>${esc(a.kind)} · ${a.weight}%</span><span>${statusPill(task.status)} · ${done}/${a.checklist.length} checklist items</span></div><div class="nus-assessment-controls"><label>Status <select data-nus-status="${esc(a.id)}"><option value="todo" ${task.status === "todo" ? "selected" : ""}>To do</option><option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In progress</option><option value="done" ${task.status === "done" ? "selected" : ""}>Done</option></select></label>${a.source ? `<span class="nus-source">Source: ${esc(sourceLabel(a.source))}</span>` : ""}</div><div class="nus-checklist">${a.checklist.map((item, i) => `<label><input type="checkbox" data-nus-check="${esc(a.id)}" data-index="${i}" ${checks[i] ? "checked" : ""}><span>${esc(item)}</span></label>`).join("")}</div></article>`;
    }).join("")}</div>`;
    root.innerHTML = body;
    root.querySelectorAll("[data-nus-status]").forEach(el => el.addEventListener("change", () => { window.NUS_STORE.setTask(el.dataset.nusStatus, { status: el.value }); renderPlanner(); }));
    root.querySelectorAll("[data-nus-check]").forEach(el => el.addEventListener("change", () => { window.NUS_STORE.toggleCheck(el.dataset.nusCheck, Number(el.dataset.index)); renderPlanner(); }));
  }

  function renderCourse(code) {
    const c = course(code);
    if (!c) return renderNotFound();
    let body = pageHead(c.code, c.title, c.description);
    body += `<div class="nus-course-meta"><span>${esc(c.department)} · ${esc(c.faculty)}</span><span>Workload ${esc(c.workload.join(" / "))}</span>${button("Exam mode", `#/nus/exam/${c.code}`, "primary")}</div>`;
    body += `<div class="nus-course-layout"><div><div class="nus-course-progress"><b>Course progress</b>${courseProgressBar(c.code)}</div>${content(c.code).modules.map(m => `<section class="nus-module reveal"><div class="eyebrow">${esc(m.title)}</div>${(m.lessons || []).map(l => `<a class="nus-lesson-row" href="#/nus/lesson/${esc(c.code)}/${esc(l.id)}" data-route><span class="nus-lesson-dot ${window.NUS_STORE.lessonDone(l.id) ? "done" : ""}">${window.NUS_STORE.lessonDone(l.id) ? "✓" : ""}</span><div><b>${esc(l.title)}</b><span>Week ${esc(l.week)} · ${esc(l.minutes)} min · ${(l.questions || []).length} practice prompts${(repository() ? repository().getLab(l.id) : window.NUS_VISUAL_LABS && window.NUS_VISUAL_LABS[l.id]) ? " · visual lab" : ""}</span></div><span>→</span></a>`).join("")}</section>`).join("")}</div><aside>${card("Assessment weight", assessments().filter(a => a.courseCode === c.code).map(a => `<div class="nus-weight"><span>${esc(a.title)}</span><b>${a.weight}%</b></div>`).join(""), "reveal")}${card("Sources", sourceGroups(c).map(g => `<div class="nus-source-group"><b>${esc(g.label)}</b><ul class="nus-source-list">${g.refs.map(r => `<li>${sourceItem(r)}</li>`).join("")}</ul></div>`).join("")+`<a class="nus-external" href="${esc(c.nusmods.url)}" target="_blank" rel="noreferrer">NUSMods course page ↗</a>`, "reveal")}</aside></div>`;
    root.innerHTML = body;
  }

  function visualCueKind(kind) {
    const normalized = String(kind || "").toLowerCase();
    if (normalized.includes("table")) return "table";
    if (normalized.includes("chart") || normalized.includes("infographic")) return "chart";
    if (normalized.includes("screenshot")) return "screen";
    return "diagram";
  }
  function visualCard(id) {
    const v = visuals()[id]; if (!v) return "";
    const kind = visualCueKind(v.kind);
    return `<article class="nus-visual nus-visual-${kind}"><div class="nus-visual-cue" aria-hidden="true"><i></i><i></i><i></i></div><div class="nus-visual-copy"><div class="nus-visual-head"><span class="pill violet">${esc(v.kind)}</span><b>${esc(v.title)}</b></div><p><strong>Use it to see:</strong> ${text(v.observation)}</p><small>Source: ${esc(sourceLabel(v.source))}${v.source.externalUrl ? ` · <a href="${esc(v.source.externalUrl)}" target="_blank" rel="noreferrer">external attribution ↗</a>` : ""}</small></div></article>`;
  }
  function paragraphs(value) { return String(value || "").split(/\n\s*\n/).filter(Boolean).map(p => `<p>${text(p)}</p>`).join(""); }
  function mathBlock(m) {
    const symbols = (m.symbols || []).map(item => `<tr><td>$${esc(item.latex)}$</td><td>${text(item.meaning)}</td></tr>`).join("");
    return `<div class="nus-math-block"><div class="nus-math-label"><span>LaTeX formula</span>${m.sourceType ? sourceBadge({ sourceType: m.sourceType, status: m.status }) : ""}</div><div class="nus-latex-display">$$${esc(m.latex)}$$</div><p><b>How to read it:</b> ${text(m.explanation)}</p>${symbols ? `<table class="nus-symbol-table"><thead><tr><th>Symbol</th><th>Meaning</th></tr></thead><tbody>${symbols}</tbody></table>` : ""}${m.caveat ? `<p class="nus-formula-caveat"><b>Limitation:</b> ${text(m.caveat)}</p>` : ""}</div>`;
  }
  function lessonSection(s) {
    const badge = s.sourceType ? sourceBadge({ sourceType: s.sourceType, status: s.status }) : "";
    return `<section class="nus-teach-card reveal"><div class="nus-teach-head"><h3>${esc(s.title)}</h3>${badge}</div>${paragraphs(s.body)}${s.math ? mathBlock(s.math) : ""}</section>`;
  }
  function workedExample(example) {
    const steps = (example.steps || []).map((step, i) => `<li><b>${i + 1}.</b><span>${text(step)}</span></li>`).join("");
    return `<section class="nus-example"><div class="nus-teach-head"><h3>${esc(example.title)}</h3>${sourceBadge({ sourceType: example.sourceType || "lecture" })}</div><ol>${steps}</ol><details><summary>Check the result</summary><p>${text(example.answer)}</p></details></section>`;
  }
  function recallItem(q, index) {
    const answer = q.type === "mcq" ? `${q.choices && q.choices[q.answer] ? esc(q.choices[q.answer]) : "See the explanation."}${q.explanation ? ` — ${text(q.explanation)}` : ""}` : text(q.solution || q.explanation || "Compare your answer with the worked solution in Exam Mode.");
    const choices = q.choices ? `<ol class="nus-recall-choices">${q.choices.map(choice => `<li>${esc(choice)}</li>`).join("")}</ol>` : `<p class="nus-muted">Write your answer before opening the check.</p>`;
    return `<details class="nus-recall-item"><summary><span>${index + 1}. ${esc(q.prompt)}</span><small>${esc(q.type || "recall")}</small></summary>${choices}<div class="nus-answer"><b>Check:</b> ${answer}</div></details>`;
  }
  function criticalThinking(l) {
    const questions = l.criticalQuestions || [];
    if (!questions.length) return "";
    return `<section class="nus-card nus-critical reveal" id="nus-lesson-reason"><div class="nus-teach-head"><h3>Critical thinking</h3><span class="pill violet">Challenge the assumptions</span></div><p class="nus-muted">Do not only repeat the formula. Ask what it assumes, what can make it fail, and what evidence would change your conclusion.</p><div class="nus-critical-list">${questions.map((q, i) => `<details class="nus-critical-item"><summary><span>${i + 1}. ${esc(q.prompt)}</span><small>${esc(q.focus || "critique")}</small></summary><p><b>What to examine:</b> ${text(q.angle)}</p>${q.modelAnswer ? `<details><summary>Compare with a strong answer</summary><p>${text(q.modelAnswer)}</p></details>` : ""}</details>`).join("")}</div></section>`;
  }
  function typesetNus() { if (window.typeset) window.typeset(root); }
  function studyCompass(l) {
    const steps = [
      ["read", "Read", `${(l.sections || []).length} source notes`],
      ["work", "Work", `${(l.examples || []).length} worked example${(l.examples || []).length === 1 ? "" : "s"}`],
      ["reason", "Reason", `${(l.criticalQuestions || []).length} assumption checks`],
      ["recall", "Recall", `${(l.questions || []).length} retrieval prompts`]
    ];
    return `<nav class="nus-study-compass reveal" aria-label="Lesson study flow">${steps.map((step, index) => `<button type="button" class="nus-compass-step" data-nus-jump="nus-lesson-${step[0]}"><span>${index + 1}</span><b>${step[1]}</b><small>${step[2]}</small></button>`).join("")}</nav>`;
  }
  function bindLessonInteractions(code, id) {
    root.querySelector("#nus-reader-toggle")?.addEventListener("click", () => {
      setReaderMode(!readerModeOn());
      renderLesson(code, id);
    });
    root.querySelectorAll("[data-nus-jump]").forEach(buttonEl => buttonEl.addEventListener("click", () => {
      document.getElementById(buttonEl.dataset.nusJump)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  }
  function studyKit(l) {
    const flashcards = l.flashcards || [], homework = l.homework || [], codeExercises = l.codeExercises || [];
    return `<section class="nus-card reveal"><h3>Study kit</h3><div class="nus-kit-stats"><span><b>${flashcards.length}</b> flashcards</span><span><b>${homework.length}</b> homework prompts</span><span><b>${codeExercises.length}</b> coding exercises</span></div><details><summary>Homework prompts</summary><ol class="nus-prompt-list">${homework.map(h => `<li><b>${esc(h.prompt)}</b><small>${esc(h.rubric || "Show your reasoning and one validation check.")}</small>${h.solution ? `<details><summary>Reveal a solution outline</summary><p>${text(h.solution)}</p></details>` : ""}</li>`).join("")}</ol></details><details><summary>Flashcards with answers</summary><ul class="nus-prompt-list">${flashcards.map(f => `<li><b>${esc(f.front)}</b><small>${esc(f.back || "Recall the definition, assumptions, and one limitation.")}</small></li>`).join("")}</ul></details>${codeExercises.length ? `<details><summary>Coding exercises</summary>${codeExercises.map(x => `<div class="nus-code-exercise"><b>${esc(x.language)} · ${esc(x.prompt)}</b><pre>${esc(x.starter)}</pre><small>Attempt it first, then use the review notes to check the expected behavior.</small></div>`).join("")}</details>` : ""}</section>`;
  }

  function renderLesson(code, id) {
    const c = course(code), l = lesson(code, id);
    if (!c || !l) return renderNotFound();
    const done = window.NUS_STORE.lessonDone(l.id);
    const courseLessons = lessons(code), index = courseLessons.findIndex(x => x.id === l.id);
    const previous = courseLessons[index - 1], next = courseLessons[index + 1];
    setReaderMode(readerModeOn());
    let body = pageHead(`${c.code} · Week ${l.week}`, l.title, l.summary);
    body += `<div class="nus-lesson-actions">${button("← Course", `#/nus/course/${c.code}`, "ghost")}<button class="btn ${done ? "ghost" : "primary"}" id="nus-mark-lesson">${done ? "✓ Completed" : "Mark complete"}</button>${button("Exam mode", `#/nus/exam/${c.code}/${l.id}`, "ghost")}${readerButton()}</div>`;
    body += studyCompass(l);
    const lab = repository() ? repository().getLab(l.id) : window.NUS_VISUAL_LABS && window.NUS_VISUAL_LABS[l.id];
    body += `<div class="nus-lesson-grid"><main><section class="nus-card nus-objectives reveal"><div class="nus-teach-head"><h3>What you should be able to do</h3><span class="pill gold">${esc(l.minutes)} min</span></div><ul>${(l.objectives || []).map(objective => `<li>${esc(objective)}</li>`).join("")}</ul></section>${lab && window.NUS_COMPONENTS ? window.NUS_COMPONENTS.renderLab(l, lab) : ""}<div id="nus-lesson-read">${(l.sections || []).map(lessonSection).join("")}${(l.math || []).map(mathBlock).join("")}</div><div id="nus-lesson-work">${(l.examples || []).map(workedExample).join("")}</div>${criticalThinking(l)}<section class="nus-card nus-recall reveal" id="nus-lesson-recall"><div class="nus-teach-head"><h3>Recall before you test</h3><span class="pill">${l.questions.length} prompts</span></div><p class="nus-muted">Answer on paper first. Open each prompt only after you commit to an answer.</p><div class="nus-question-list">${l.questions.map(recallItem).join("")}</div>${button("Start this lesson in Exam Mode", `#/nus/exam/${c.code}/${l.id}`, "primary")}</section>${studyKit(l)}<div class="nus-lesson-nav">${previous ? button(`← ${previous.title}`, `#/nus/lesson/${c.code}/${previous.id}`, "ghost") : `<span></span>`}${next ? button(`Next: ${next.title} →`, `#/nus/lesson/${c.code}/${next.id}`, "primary") : button("Back to course", `#/nus/course/${c.code}`, "primary")}</div></main><aside>${l.visualIds && l.visualIds.length ? card("Visual study cues", l.visualIds.map(visualCard).join(""), "reveal") : ""}${card("Source trail", `<ul class="nus-source-list">${l.sourceRefs.map(r => `<li>${sourceItem(r)}</li>`).join("")}</ul><p class="nus-muted">Visual cues are derived study prompts, not copies of course slides. Lecture remains the exam-priority core; textbook and reference material are labeled for depth and optional support.</p>`, "reveal")}</aside></div>`;
    root.innerHTML = body;
    typesetNus();
    if (window.NUS_COMPONENTS) window.NUS_COMPONENTS.bind(root);
    root.querySelector("#nus-mark-lesson").addEventListener("click", () => { window.NUS_STORE.markLesson(l.id, !done, { courseCode: code, sourceRefs: l.sourceRefs }); renderLesson(code, id); });
    bindLessonInteractions(code, id);
  }

  function examQuestions(code, scope) {
    let qs = lessons(code).flatMap(l => (l.questions || []).map(q => ({ ...q, lessonId: l.id, lessonTitle: l.title, lessonSourceRefs: l.sourceRefs || [] })));
    if (scope) qs = qs.filter(q => q.lessonId === scope);
    return qs;
  }
  function answerKey(q, raw) {
    if (q.type === "mcq") return Number(raw) === q.answer;
    const value = String(raw || "").toLowerCase().trim().replace(/[.$,()]/g, "").replace(/\s+/g, " ");
    return value.length > 0 && (q.accepted || []).some(a => value === String(a).toLowerCase().trim().replace(/[.$,()]/g, "").replace(/\s+/g, " ") || value.includes(String(a).toLowerCase().trim()));
  }
  function stopExamTimer() { if (examTimer) { clearInterval(examTimer); examTimer = null; } }
  function startExamTimer() {
    stopExamTimer();
    examTimer = setInterval(() => {
      if (!examState || examState.finished) return stopExamTimer();
      const left = Math.max(0, (examState.limitMinutes * 60) - Math.floor((Date.now() - examState.startedAt) / 1000));
      const el = document.getElementById("nus-exam-timer"); if (el) el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      if (left <= 0) finishExam();
    }, 1000);
  }
  function finishExam() {
    if (!examState) return;
    examState.finished = true; stopExamTimer();
    const score = examState.answers.filter(a => a.correct).length;
    examState.answers.filter(a => a.correct).forEach(a => window.NUS_STORE.recordEvidence({ eventId: `recall:${examState.attemptId}:${a.q.id}`, type: "recall_correct", courseCode: examState.code, lessonId: a.q.lessonId, xp: 5, meta: { questionId: a.q.id } }));
    window.NUS_STORE.recordAttempt({ attemptId: examState.attemptId, mode: "exam", courseCode: examState.code, lessonId: examState.scope || null, score, total: examState.questions.length });
    renderExam(null, null, true);
  }
  function renderExam(code, scope, internal) {
    const routed = !internal;
    if (!examState || (routed && (examState.code !== (code || "all") || examState.scope !== (scope || "")))) examState = null;
    if (!examState) {
      const options = courses().map(c => `<option value="${esc(c.code)}" ${code === c.code ? "selected" : ""}>${esc(c.code)} · ${esc(c.title)}</option>`).join("");
      const selected = code || "DSA5101";
      root.innerHTML = pageHead("NUS practice", "Exam mode", "Choose one course and an optional lesson. The timer is local, answers stay hidden until the attempt ends, and the final screen becomes a review deck.") + `<section class="nus-card nus-exam-setup reveal"><label>Course<select id="nus-exam-course">${options}</select></label><label>Scope<select id="nus-exam-scope"><option value="">All seeded lessons</option>${lessons(selected).map(l => `<option value="${esc(l.id)}" ${scope === l.id ? "selected" : ""}>${esc(l.title)}</option>`).join("")}</select></label><label>Time<select id="nus-exam-minutes"><option value="15">15 minutes</option><option value="30" selected>30 minutes</option><option value="45">45 minutes</option></select></label><div class="nus-callout"><b>Exam rules</b><span>Mixed MCQ, short answer, calculation, derivation, trace, and SQL prompts. Solutions are revealed only after submission.</span></div><button class="btn primary" id="nus-start-exam">Start attempt</button></section>`;
      typesetNus();
      const courseSelect = root.querySelector("#nus-exam-course"), scopeSelect = root.querySelector("#nus-exam-scope");
      courseSelect.addEventListener("change", () => { location.hash = `#/nus/exam/${courseSelect.value}`; });
      scopeSelect.addEventListener("change", () => { location.hash = `#/nus/exam/${courseSelect.value}/${scopeSelect.value}`; });
      root.querySelector("#nus-start-exam").addEventListener("click", () => { examState = { attemptId: `nus-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, code: selected, scope: scope || "", questions: examQuestions(selected, scope), index: 0, answers: [], startedAt: Date.now(), limitMinutes: Number(root.querySelector("#nus-exam-minutes").value), finished: false }; renderExam(null, null, true); });
      return;
    }
    if (examState.finished) return renderExamResult();
    const q = examState.questions[examState.index];
    if (!q) return finishExam();
    const answersSoFar = examState.answers.length;
    let input = q.type === "mcq" ? `<div class="nus-choices">${q.choices.map((choice, i) => `<label><input type="radio" name="nus-answer" value="${i}"><span>${esc(choice)}</span></label>`).join("")}</div>` : `<textarea id="nus-answer" rows="5" placeholder="Write your answer here…"></textarea>`;
    root.innerHTML = pageHead(`${esc(examState.code)} · Question ${examState.index + 1}/${examState.questions.length}`, q.type.toUpperCase(), q.lessonTitle) + `<div class="nus-exam-bar"><span>Time left <b id="nus-exam-timer">--:--</b></span><span>${answersSoFar} submitted</span></div><section class="nus-card nus-exam-question reveal"><div class="nus-question-source">${(q.sourceRefs || q.lessonSourceRefs || []).slice(0, 2).map(sourceItem).join(" ")}</div><h3>${esc(q.prompt)}</h3>${input}<div class="nus-exam-footer"><span class="nus-muted">Answer reveal is locked until the attempt ends.</span><button class="btn primary" id="nus-next-answer">${examState.index + 1 === examState.questions.length ? "Submit attempt" : "Next question"}</button></div></section>`;
    typesetNus();
    root.querySelector("#nus-next-answer").addEventListener("click", () => {
      let raw = q.type === "mcq" ? (root.querySelector("input[name='nus-answer']:checked") || {}).value : root.querySelector("#nus-answer").value;
      if (raw == null || !String(raw).trim()) return;
      examState.answers.push({ q, raw, correct: answerKey(q, raw) }); examState.index++;
      if (examState.index >= examState.questions.length) finishExam(); else renderExam(null, null, true);
    });
    startExamTimer();
  }
  function renderExamResult() {
    const correct = examState.answers.filter(a => a.correct).length, total = examState.questions.length;
    let body = pageHead(`${esc(examState.code)} · review`, "Attempt complete", `${correct}/${total} correct. Use the deck below to turn misses into the next study session.`);
    body += `<div class="nus-result-score"><b>${Math.round(correct / Math.max(1, total) * 100)}%</b><span>${correct} correct · ${total - correct} to review</span></div><div class="nus-review-deck">${examState.answers.map((a, i) => `<article class="nus-review-item ${a.correct ? "correct" : "missed"}"><div><span class="pill ${a.correct ? "sage" : ""}">${a.correct ? "Correct" : "Review"}</span><b>${i + 1}. ${esc(a.q.prompt)}</b></div><p><strong>Source:</strong> ${(a.q.sourceRefs || a.q.lessonSourceRefs || []).slice(0, 2).map(sourceItem).join(" ")}</p><p><strong>Your answer:</strong> ${esc(a.q.type === "mcq" ? (a.q.choices[Number(a.raw)] || "No choice") : a.raw)}</p><p><strong>Worked answer:</strong> ${text(a.q.solution || a.q.explanation || "Review the source lesson.")}</p></article>`).join("")}</div><div class="nus-card"><h3>Cheat sheet</h3>${lessons(examState.code).map(l => `<details><summary>${esc(l.title)}</summary>${l.sections.map(s => `<p>${text(s.body)}</p>`).join("")}</details>`).join("")}</div><div class="nus-lesson-actions">${button("Try again", `#/nus/exam/${examState.code}${examState.scope ? `/${examState.scope}` : ""}`, "primary")}${button("Back to course", `#/nus/course/${examState.code}`, "ghost")}</div>`;
    root.innerHTML = body;
    typesetNus();
  }

  function renderSql() {
    const spec = content("DSA5104").sqlPractice, ex = spec.exercises[sqlState.index];
    let body = pageHead("DSA5104 · practice", "SQL studio", "A small SQLite database runs in your browser. Use it to practice schema reading, joins, grouping, aggregation, and ER constraints without sending queries to a server. Compatibility note: this is SQLite/WASM for the MVP; MySQL-specific functions and DDL may differ.");
    body += `<div class="nus-sql-layout"><aside>${card("Schema", spec.schema.map(t => `<div class="nus-schema-table"><b>${esc(t.name)}</b>${t.columns.map(c => `<code>${esc(c)}</code>`).join("")}</div>`).join(""), "reveal")}${card("Exercises", spec.exercises.map((x, i) => `<button class="nus-exercise-link ${i === sqlState.index ? "active" : ""}" data-sql-index="${i}"><span>${i + 1}</span><div><b>${esc(x.level)}</b><small>${esc(x.prompt)}</small></div></button>`).join(""), "reveal")}</aside><main><section class="nus-card nus-sql-editor reveal"><div class="nus-assessment-line"><span>${esc(ex.level)} · Exercise ${sqlState.index + 1}/${spec.exercises.length}</span><span>${sqlState.ran ? "Query executed" : "Not run"}</span></div><h3>${esc(ex.prompt)}</h3><textarea id="nus-sql-input" rows="9">${esc(ex.starter)}</textarea><div class="nus-lesson-actions"><button class="btn primary" id="nus-run-sql">Run query</button><button class="btn ghost" id="nus-reveal-sql" ${sqlState.ran ? "" : "disabled"}>Reveal solution</button></div>${sqlState.error ? `<div class="nus-output error">${text(sqlState.error)}</div>` : ""}${sqlState.result ? `<div class="nus-output ${sqlState.result.pass ? "success" : "error"}"><b>${sqlState.result.pass ? "Looks right" : "Check the result"}</b><pre>${esc(sqlState.result.text)}</pre><p>${text(ex.explanation)}</p>${sqlState.reveal ? `<details open><summary>Solution</summary><pre>${esc(ex.solution || ex.starter)}</pre></details>` : ""}</div>` : ""}</section></main></div>`;
    root.innerHTML = body;
    root.querySelectorAll("[data-sql-index]").forEach(b => b.addEventListener("click", () => { sqlState = { index: Number(b.dataset.sqlIndex), result: null, error: null, ran: false, reveal: false }; renderSql(); }));
    root.querySelector("#nus-run-sql").addEventListener("click", () => executeSql(ex));
    root.querySelector("#nus-reveal-sql").addEventListener("click", () => { sqlState.reveal = true; renderSql(); });
  }
  function loadSqlJs() {
    if (window.initSqlJs) return Promise.resolve(window.initSqlJs);
    if (sqlPromise) return sqlPromise;
    sqlPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.js"; s.onload = () => resolve(window.initSqlJs); s.onerror = () => reject(new Error("Could not load the browser SQL engine. Check your connection and try again.")); document.head.appendChild(s);
    });
    return sqlPromise;
  }
  async function executeSql(ex) {
    const input = root.querySelector("#nus-sql-input").value.trim(); sqlState = { ...sqlState, error: null, result: null, ran: true };
    if (ex.id === "sql-4") { const normalized = input.toLowerCase().replace(/\s+/g, " "); sqlState.result = { pass: (ex.expected || []).some(x => normalized.includes(x)), text: input || "No answer" }; renderSql(); return; }
    try {
      const init = await loadSqlJs(), SQL = await init({ locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${file}` }), db = new SQL.Database();
      db.run("CREATE TABLE Department (id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE Student (id INTEGER PRIMARY KEY, name TEXT NOT NULL, department_id INTEGER); CREATE TABLE Enrollment (student_id INTEGER, course_code TEXT, grade REAL, PRIMARY KEY (student_id, course_code));");
      const spec = content("DSA5104").sqlPractice.seed;
      Object.entries(spec).forEach(([table, rows]) => rows.forEach(row => { const marks = row.map(() => "?").join(","); db.run(`INSERT INTO ${table} VALUES (${marks})`, row); }));
      const rows = db.exec(input)[0], values = rows ? rows.values.map(row => row.join("|")) : [];
      sqlState.result = { pass: values.join("\n") === ex.expected.join("\n"), text: rows ? [rows.columns.join(" | "), ...values].join("\n") : "Query returned no rows" };
      db.close();
    } catch (e) { sqlState.error = e.message || "SQL error"; }
    renderSql();
  }

  function renderSimulations() {
    const s = clockState;
    let body = pageHead("DSA5208 · interactive", "Distributed systems simulations", "Step through ordering, logical clocks, consistency choices, and a Spark-style pipeline. The state is local to this page and intentionally small enough to reason about by hand.");
    body += `<div class="nus-sim-grid"><section class="nus-card nus-sim reveal"><div class="nus-assessment-line"><span>Lamport scalar clock</span><button class="btn ghost" id="nus-clock-reset">Reset</button></div><p>Advance local events or send a message from P1 to P2. Receive uses max(local, received)+1.</p><div class="nus-processes"><div><b>P1</b><strong>${s.p1}</strong><button class="btn ghost" id="nus-p1-event">Local event</button><button class="btn ghost" id="nus-send">Send → P2</button></div><div><b>P2</b><strong>${s.p2}</strong><button class="btn ghost" id="nus-p2-event">Local event</button><button class="btn ghost" id="nus-receive">Receive</button></div></div><div class="nus-event-log">${s.events.slice(-5).map(e => `<span>${esc(e)}</span>`).join("")}</div></section>`;
    body += `<section class="nus-card nus-sim reveal"><div class="nus-assessment-line"><span>Vector clock</span><button class="btn ghost" id="nus-vector-reset">Reset</button></div><p>Compare vectors componentwise. If neither dominates, the events are concurrent.</p><div class="nus-vector-row"><span>P1 <b>(${s.vector1.join(", ")})</b></span><button class="btn ghost" id="nus-vector-p1">P1 event</button><span>P2 <b>(${s.vector2.join(", ")})</b></span><button class="btn ghost" id="nus-vector-p2">P2 event</button></div><p class="nus-callout" id="nus-vector-note">${vectorRelation(s.vector1, s.vector2)}</p></section>`;
    body += `<section class="nus-card nus-sim reveal"><div class="nus-assessment-line"><span>Consistency model prompt</span><span class="pill violet">reasoning</span></div><label>Scenario<select id="nus-consistency"><option>Bank balance read-after-write</option><option>Social feed replica</option><option>Analytics dashboard</option></select></label><div id="nus-consistency-answer" class="nus-output success">Choose a scenario to see the minimum useful guarantee.</div></section>`;
    body += `<section class="nus-card nus-sim reveal"><div class="nus-assessment-line"><span>FIFO / non-FIFO / causal delivery</span><span class="pill gold">message order</span></div><label>Delivery model<select id="nus-delivery-mode"><option>FIFO</option><option>Non-FIFO</option><option>Causal</option></select></label><button class="btn ghost" id="nus-play-delivery">Play delivery trace</button><div class="nus-delivery-trace">${deliveryState.log.map(e => `<span>${esc(e)}</span>`).join("")}</div></section>`;
    body += `<section class="nus-card nus-sim reveal"><div class="nus-assessment-line"><span>Spark pipeline map</span><span class="pill sage">partition reasoning</span></div><div class="nus-pipeline"><span>read</span><i>→</i><span>map/filter<br><small>partition-local</small></span><i>→</i><span id="nus-shuffle-node">groupByKey<br><small>shuffle</small></span><i>→</i><span>aggregate<br><small>reduce</small></span></div><p class="nus-muted">Click the shuffle stage to explain why network movement appears.</p><button class="btn ghost" id="nus-explain-shuffle">Explain shuffle</button><div id="nus-shuffle-note"></div></section></div>`;
    root.innerHTML = body;
    bindSimulationEvents();
  }
  function vectorRelation(a, b) {
    const le = (x, y) => x.every((v, i) => v <= y[i]), lt = (x, y) => le(x, y) && x.some((v, i) => v < y[i]);
    return lt(a, b) ? "P1's current event happens-before P2's." : lt(b, a) ? "P2's current event happens-before P1's." : "The vectors are incomparable: treat the events as concurrent.";
  }
  function bindSimulationEvents() {
    const evidence = (name, lessonId) => window.NUS_STORE.recordSimulation(name, "DSA5208", lessonId);
    const add = (key, label) => { clockState[key]++; clockState.events.push(label); renderSimulations(); };
    root.querySelector("#nus-p1-event").addEventListener("click", () => add("p1", "P1 local event"));
    root.querySelector("#nus-p2-event").addEventListener("click", () => add("p2", "P2 local event"));
    root.querySelector("#nus-send").addEventListener("click", () => { clockState.p1++; clockState.events.push(`P1 sends timestamp ${clockState.p1}`); renderSimulations(); });
    root.querySelector("#nus-receive").addEventListener("click", () => { clockState.p2 = Math.max(clockState.p2, clockState.p1) + 1; clockState.events.push(`P2 receives → ${clockState.p2}`); evidence("lamport-receive"); renderSimulations(); });
    root.querySelector("#nus-clock-reset").addEventListener("click", () => { clockState.p1 = 0; clockState.p2 = 0; clockState.events = []; renderSimulations(); });
    root.querySelector("#nus-vector-reset").addEventListener("click", () => { clockState.vector1 = [0, 0]; clockState.vector2 = [0, 0]; renderSimulations(); });
    root.querySelector("#nus-vector-p1").addEventListener("click", () => { clockState.vector1[0]++; renderSimulations(); });
    root.querySelector("#nus-vector-p2").addEventListener("click", () => { clockState.vector2[1]++; if (clockState.vector1.some(Boolean) && clockState.vector2.some(Boolean)) evidence("vector-clock"); renderSimulations(); });
    root.querySelector("#nus-consistency").addEventListener("change", e => { const answers = { "Bank balance read-after-write": "Use a strong/session guarantee for the writer's own read; stale replicas can show an incorrect balance.", "Social feed replica": "Eventual consistency is often acceptable if the UI tolerates a short delay and updates converge.", "Analytics dashboard": "A bounded-staleness or eventual model may be enough; state freshness and error tolerance explicitly." }; root.querySelector("#nus-consistency-answer").textContent = answers[e.target.value]; evidence(`consistency-${e.target.value}`); });
    root.querySelector("#nus-delivery-mode").addEventListener("change", e => { deliveryState.mode = e.target.value; });
    root.querySelector("#nus-play-delivery").addEventListener("click", () => { const traces = { FIFO: ["P1 sends m1", "P1 sends m2", "P2 delivers m1", "P2 delivers m2"], "Non-FIFO": ["P1 sends m1", "P1 sends m2", "P2 delivers m2", "P2 delivers m1"], Causal: ["P1 sends m1", "P2 receives m1", "P2 sends m2", "P3 delivers m1 before m2"] }; deliveryState.log = traces[deliveryState.mode]; evidence(`delivery-${deliveryState.mode}`); renderSimulations(); });
    root.querySelector("#nus-explain-shuffle").addEventListener("click", () => { root.querySelector("#nus-shuffle-note").innerHTML = `<p class="nus-muted">Keys must meet on the same partition before aggregation. That exchange adds serialization, network traffic, skew risk, and a synchronization barrier.</p>`; evidence("spark-shuffle"); });
  }

  function renderNotFound() { root.innerHTML = pageHead("NUS", "Not found", "That study page does not exist.") + button("Back to NUS dashboard", "#/", "primary"); }
  function renderRoute(parts) {
    stopExamTimer();
    const p = parts || [];
    if (p[0] !== "lesson") setReaderMode(false);
    let result;
    if (!p.length || p[0] === "dashboard") result = renderDashboard();
    else if (p[0] === "planner") result = renderPlanner();
    else if (p[0] === "course") result = renderCourse(p[1]);
    else if (p[0] === "lesson") result = renderLesson(p[1], p[2]);
    else if (p[0] === "exam") result = renderExam(p[1], p[2]);
    else if (p[0] === "sql") result = renderSql();
    else if (p[0] === "simulations") result = renderSimulations();
    else result = renderNotFound();
    typesetNus();
    return result;
  }
  window.NUS_UI = { renderRoute, courseName };
})();
