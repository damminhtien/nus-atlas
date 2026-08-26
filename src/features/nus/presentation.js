/* Pure-ish NUS presentation helpers. Data access is injected so feature views
 * can render without reaching into global course registries directly. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_PRESENTATION = factory;
})(typeof globalThis === "object" ? globalThis : this, function createNusPresentation(config) {
  const options = config || {};
  const getSourceTypes = typeof options.getSourceTypes === "function" ? options.getSourceTypes : () => ({});
  const getVisuals = typeof options.getVisuals === "function" ? options.getVisuals : () => ({});

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>\"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch]));
  }
  function text(value) { return esc(value).replace(/\n/g, "<br>"); }
  function sourceLabel(ref) { return ref ? `${ref.sourceId}${ref.page ? ` · p.${ref.page}` : ""}` : ""; }
  function sourceBadge(ref) {
    const meta = getSourceTypes()[ref && ref.sourceType];
    if (!meta) return `<span class="pill">Source</span>`;
    const status = ref.status && !["current", "course-depth", "current-context"].includes(ref.status) ? ` · ${ref.status}` : "";
    return `<span class="pill ${esc(meta.tone)}">${esc(meta.shortLabel)}${esc(status)}</span>`;
  }
  function sourceItem(ref) { return `${sourceBadge(ref)} <span>${esc(sourceLabel(ref))}</span>${ref && ref.role ? `<small>${esc(ref.role)}</small>` : ""}`; }
  function sourceSummary(refs) {
    const counts = new Map();
    (refs || []).forEach(ref => {
      const meta = getSourceTypes()[ref && ref.sourceType];
      const label = meta ? meta.shortLabel : (ref && ref.sourceType) || "Source";
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    const total = (refs || []).length;
    return [`${total} ref${total === 1 ? "" : "s"}`, ...[...counts].map(([label, count]) => `${count} ${label}`)].join(" · ");
  }
  function sourceDisclosure(refs, title = "Source trail") {
    if (!(refs || []).length) return "";
    return `<details class="nus-source-disclosure"><summary><span>${esc(title)}</span><small>${esc(sourceSummary(refs))}</small></summary><ul class="nus-source-list">${refs.map(ref => `<li>${sourceItem(ref)}</li>`).join("")}</ul><p class="nus-muted">Open to inspect exact page-level provenance.</p></details>`;
  }
  function sourceLens(lens) {
    if (!lens) return "";
    const groups = [["Lecture scope", lens.lecture], ["Official exercise depth", lens.officialExercise], ["Textbook depth", lens.textbook], ["Reference / assessment", lens.reference]]
      .filter(([, refs]) => Array.isArray(refs) && refs.length)
      .map(([label, refs]) => `<div class="nus-source-lens-group"><b>${esc(label)}</b><ul class="nus-source-list">${refs.map(ref => `<li>${sourceItem(ref)}</li>`).join("")}</ul></div>`).join("");
    return `<details class="nus-source-lens"><summary><span>Why is this examinable?</span><span class="pill gold">A+ · ${esc(lens.status || "scope mapped")}</span></summary>${lens.whyExaminable ? `<p class="nus-source-lens-why">${text(lens.whyExaminable)}</p>` : ""}<div class="nus-source-lens-grid">${groups}</div></details>`;
  }
  function sourceGroups(course) {
    if (Array.isArray(course.sourceCatalog) && course.sourceCatalog.length) {
      const groups = [
        ["Lecture core", "lecture"],
        ["Official exercise depth", "exercise"],
        ["Textbook depth", "textbook"],
        ["Reference / optional", "ref"]
      ].map(([label, sourceType]) => ({ label, refs: course.sourceCatalog.filter(ref => ref.sourceType === sourceType) }))
        .filter(group => group.refs.length);
      if (groups.length) return groups;
    }
    if (!course.lectureSources) return [{ label: "Course sources", refs: (course.localSources || []).map(sourceId => ({ sourceId })) }];
    const allLectureSources = course.lectureSources || [];
    return [
      { label: "Lecture core", refs: allLectureSources.filter(ref => !ref.sourceType || ref.sourceType === "lecture") },
      { label: "Official exercise depth", refs: course.exerciseSources || allLectureSources.filter(ref => ref.sourceType === "exercise") },
      { label: "Textbook depth", refs: course.textbookSources || [] },
      { label: "Reference / optional", refs: course.referenceSources || [] }
    ].filter(group => group.refs.length);
  }
  function quickNav(kicker) {
    // Kept as a no-op compatibility hook for feature code compiled before the
    // four-destination navigation. Navigation now belongs to the app chrome;
    // headings must stay focused on the learning task at hand.
    void kicker;
    return "";
  }
  function pageHead(kicker, title, desc, status) { return `<div class="page-head reveal"><div class="eyebrow">${esc(kicker)}</div><h2>${esc(title)}</h2>${status ? `<span class="pill gold nus-content-status">${esc(status)}</span>` : ""}${desc ? `<p>${text(desc)}</p>` : ""}</div>`; }
  function card(title, body, cls) { return `<section class="nus-card ${cls || ""}"><h3>${esc(title)}</h3>${body}</section>`; }
  function button(label, href, cls) { return `<a class="btn ${cls || "ghost"}" href="${esc(href)}" data-route>${esc(label)}</a>`; }
  function statusPill(status) { return `<span class="pill ${status === "done" ? "sage" : status === "in-progress" ? "gold" : ""}">${esc(status === "in-progress" ? "In progress" : status === "done" ? "Done" : "To do")}</span>`; }
  function visualCueKind(kind) {
    const normalized = String(kind || "").toLowerCase();
    if (normalized.includes("table")) return "table";
    if (normalized.includes("chart") || normalized.includes("infographic")) return "chart";
    if (normalized.includes("screenshot")) return "screen";
    return "diagram";
  }
  function visualCard(id, context = {}) {
    const visual = getVisuals()[id]; if (!visual) return "";
    const kind = visualCueKind(visual.kind);
    const lookFor = Array.isArray(visual.lookFor) && visual.lookFor.length ? visual.lookFor : [visual.observation || "Identify the relationship this visual makes easier to inspect."];
    const learningGoal = visual.learningGoal || visual.observation || "Turn the visual into one testable claim.";
    const prompt = visual.prompt || "What should you be able to explain after inspecting this visual?";
    const check = visual.check || "State the relationship, the assumption behind it, and one way it could fail.";
    const labId = visual.labId || context.labId || "";
    const courseCode = context.courseCode || visual.courseCode;
    const sameLessonLab = !!(context.hasLab && context.lessonId && context.lessonId === labId);
    const labHref = labId && courseCode ? (sameLessonLab ? `#nus-lab-${labId}` : `#/nus/lesson/${courseCode}/${labId}`) : "";
    const labLink = labHref ? `<a class="btn ghost nus-visual-lab-link" href="${esc(labHref)}"${sameLessonLab ? ` data-nus-lab-anchor="${esc(labHref.slice(1))}"` : " data-route"}>${sameLessonLab ? "Open interactive lab" : "Open linked lab"} ↗</a>` : "";
    return `<article class="nus-visual nus-visual-${kind}" data-nus-visual-card="${esc(id)}"><div class="nus-visual-cue" aria-hidden="true"><i></i><i></i><i></i></div><div class="nus-visual-copy"><div class="nus-visual-head"><span class="pill violet">Visual study cue</span><b>${esc(visual.title)}</b><span class="nus-visual-status" data-nus-visual-status>Not practiced</span></div><div class="nus-visual-goal"><b>Study target</b><p>${text(learningGoal)}</p></div><div class="nus-visual-look"><b>Look for</b><ol>${lookFor.map(item => `<li>${text(item)}</li>`).join("")}</ol></div><details class="nus-visual-check"><summary><span>Try before revealing the answer</span><small>30–60 sec</small></summary><p><b>Prompt:</b> ${text(prompt)}</p>${visual.nextMove ? `<p><b>Make the move:</b> ${text(visual.nextMove)}</p>` : ""}<div class="nus-visual-answer"><b>Strong answer:</b> ${text(check)}</div></details><div class="nus-visual-actions">${labLink}<button class="btn ghost" type="button" data-nus-visual-practice="${esc(id)}" aria-pressed="false">Mark practiced</button></div><small>Source: ${esc(sourceLabel(visual.source))}${visual.source && visual.source.externalUrl ? ` · <a href="${esc(visual.source.externalUrl)}" target="_blank" rel="noreferrer">external attribution ↗</a>` : ""}</small></div></article>`;
  }
  function paragraphs(value) { return String(value || "").split(/\n\s*\n/).filter(Boolean).map(paragraph => `<p>${text(paragraph)}</p>`).join(""); }
  function mathBlock(math) {
    const symbols = (math.symbols || []).map(item => `<tr><td>$${esc(item.latex)}$</td><td>${text(item.meaning)}</td></tr>`).join("");
    const headers = Array.isArray(math.tableHeaders) && math.tableHeaders.length === 2 ? math.tableHeaders : ["Symbol", "Meaning"];
    const table = symbols ? `<table class="nus-symbol-table"><thead><tr><th>${text(headers[0])}</th><th>${text(headers[1])}</th></tr></thead><tbody>${symbols}</tbody></table>` : "";
    return `<div class="nus-math-block"><div class="nus-math-label"><span>Named formula</span>${math.sourceType ? sourceBadge({ sourceType: math.sourceType, status: math.status }) : ""}</div><h4 class="nus-formula-name">${esc(math.name || "Formula name missing")}</h4><div class="nus-latex-display">$$${esc(math.latex)}$$</div>${math.purpose ? `<p class="nus-formula-purpose"><b>Use it when:</b> ${text(math.purpose)}</p>` : ""}<p><b>How to read it:</b> ${text(math.explanation)}</p>${table}${math.caveat ? `<p class="nus-formula-caveat"><b>Limitation:</b> ${text(math.caveat)}</p>` : ""}</div>`;
  }
  function lessonSection(section, index) {
    const badge = section.sourceType ? sourceBadge({ sourceType: section.sourceType, status: section.status }) : "";
    const teaching = section.teaching || {};
    const teachingFields = [
      ["Core idea", teaching.concept],
      ["Use it when", teaching.useWhen],
      ["Exam move", teaching.examMove],
      ["Common trap", teaching.trap]
    ].filter(([, value]) => value);
    const teachingHtml = teachingFields.length
      ? `<div class="nus-teaching-guide">${teachingFields.map(([label, value]) => `<div class="nus-teaching-guide-item"><b>${esc(label)}</b><p>${text(value)}</p></div>`).join("")}</div>`
      : "";
    const id = Number.isInteger(index) ? ` id="nus-lesson-concept-${index}"` : "";
    return `<section class="nus-teach-card reveal"${id}><div class="nus-teach-head"><h3>${esc(section.title)}</h3>${badge}</div>${paragraphs(section.body)}${teachingHtml}${section.math ? mathBlock(section.math) : ""}${sourceLens(section.sourceLens)}</section>`;
  }
  function algorithmNotes(lesson) {
    const notes = Array.isArray(lesson && lesson.algorithmNotes) ? lesson.algorithmNotes : [];
    if (!notes.length) return "";
    const fields = [
      ["Problem definition", "problemDefinition"],
      ["Assumptions", "assumptions"],
      ["Core invariant", "coreInvariant"],
      ["Formula / algorithm", "formulaAlgorithm"],
      ["Failure modes & common mistakes", "failureModes"]
    ];
    const cards = notes.map(note => `<article class="nus-algorithm-note"><div class="nus-algorithm-note-head"><span class="pill violet">Five-part note</span><h4>${esc(note.algorithm)}</h4></div><ol>${fields.map(([label, key]) => `<li><b>${esc(label)}</b><p>${text(note[key])}</p></li>`).join("")}</ol>${sourceDisclosure(note.sourceRefs, "Note sources")}</article>`).join("");
    return `<section class="nus-card nus-algorithm-notes reveal" id="nus-lesson-algorithms"><div class="nus-teach-head"><div><h3>Algorithm note standard</h3><p class="nus-muted">Every core algorithm starts with the problem, states its invariant, and ends with the mistakes that break a solution.</p></div><span class="pill gold">${notes.length} note${notes.length === 1 ? "" : "s"}</span></div><div class="nus-algorithm-note-list">${cards}</div></section>`;
  }
  function workedExample(example) {
    const steps = (example.steps || []).map((step, index) => `<li><b>${index + 1}.</b><span>${text(step)}</span></li>`).join("");
    return `<section class="nus-example"><div class="nus-teach-head"><h3>${esc(example.title)}</h3>${sourceBadge({ sourceType: example.sourceType || "lecture" })}</div><ol>${steps}</ol><details><summary>Check the result</summary><p>${text(example.answer)}</p></details></section>`;
  }
  function recallItem(question, index) {
    const answer = question.type === "mcq"
      ? `${question.answer != null ? esc(question.choices ? question.choices[question.answer] : question.answer) : "See the explanation."}${question.explanation ? ` — ${text(question.explanation)}` : ""}`
      : text(question.solution || question.explanation || "Compare your answer with the worked solution in Exam Mode.");
    const choices = question.choices ? `<ol class="nus-recall-choices">${question.choices.map(choice => `<li>${esc(choice)}</li>`).join("")}</ol>` : `<p class="nus-muted">Write your answer before opening the check.</p>`;
    return `<details class="nus-recall-item"><summary><span>${index + 1}. ${esc(question.prompt)}</span><small>${esc(question.type || "recall")}</small></summary>${choices}<div class="nus-answer"><b>Check:</b> ${answer}</div></details>`;
  }
  function criticalThinking(lesson) {
    const questions = lesson.criticalQuestions || [];
    if (!questions.length) return "";
    return `<section class="nus-card nus-critical reveal" id="nus-lesson-reason"><div class="nus-teach-head"><h3>Critical thinking</h3><span class="pill violet">Challenge the assumptions</span></div><p class="nus-muted">Do not only repeat the formula. Ask what it assumes, what can make it fail, and what evidence would change your conclusion.</p><div class="nus-critical-list">${questions.map((question, index) => `<details class="nus-critical-item"><summary><span>${index + 1}. ${esc(question.prompt)}</span><small>${esc(question.focus || "critique")}</small></summary><p><b>What to examine:</b> ${text(question.angle)}</p>${question.modelAnswer ? `<details><summary>Compare with a strong answer</summary><p>${text(question.modelAnswer)}</p></details>` : ""}</details>`).join("")}</div></section>`;
  }
  function studyKit(lesson, context = {}) {
    const flashcards = lesson.flashcards || [], homework = lesson.homework || [], codeExercises = lesson.codeExercises || [];
    const promptCount = (lesson.questions || []).length;
    return `<section class="nus-card nus-practice-next reveal" id="nus-lesson-practice"><div class="nus-teach-head"><h3>Ready to test yourself?</h3><span class="pill violet">${promptCount} prompts</span></div><p>Retrieve the core idea before reopening notes. Your next practice run will keep the result in Review.</p>${context.practiceHref ? `<div class="nus-card-actions">${button(`Practice ${promptCount} questions`, context.practiceHref, context.practiceClass || "primary")}</div>` : ""}<details><summary>More practice materials</summary><div class="nus-kit-stats"><span><b>${flashcards.length}</b> flashcards</span><span><b>${homework.length}</b> homework prompts</span><span><b>${codeExercises.length}</b> coding exercises</span></div><details><summary>Homework prompts</summary><ol class="nus-prompt-list">${homework.map(item => `<li><b>${esc(item.prompt)}</b><small>${esc(item.rubric || "Show your reasoning and one validation check.")}</small>${item.solution ? `<details><summary>Reveal a solution outline</summary><p>${text(item.solution)}</p></details>` : ""}</li>`).join("")}</ol></details><details><summary>Flashcards with answers</summary><ul class="nus-prompt-list">${flashcards.map(item => `<li><b>${esc(item.front)}</b><small>${esc(item.back || "Recall the definition, assumptions, and one limitation.")}</small></li>`).join("")}</ul></details>${codeExercises.length ? `<details><summary>Coding exercises</summary>${codeExercises.map(item => `<div class="nus-code-exercise"><b>${esc(item.language)} · ${esc(item.prompt)}</b><pre>${esc(item.starter)}</pre><small>Attempt it first, then use the review notes to check the expected behavior.</small></div>`).join("")}</details>` : ""}</details></section>`;
  }
  function studyCompass(lesson) {
    const steps = [
      ["read", "Read", `${(lesson.sections || []).length} source notes`],
      ["work", "Work", `${(lesson.examples || []).length} worked example${(lesson.examples || []).length === 1 ? "" : "s"}`],
      ["reason", "Reason", `${(lesson.criticalQuestions || []).length} assumption checks`],
      ["recall", "Recall", `${(lesson.questions || []).length} retrieval prompts`]
    ];
    return `<nav class="nus-study-compass reveal" aria-label="Lesson study flow">${steps.map((step, index) => `<button type="button" class="nus-compass-step" data-nus-jump="nus-lesson-${step[0]}"><span>${index + 1}</span><b>${step[1]}</b><small>${step[2]}</small></button>`).join("")}</nav>`;
  }

  return Object.freeze({
    esc, text, sourceLabel, sourceBadge, sourceItem, sourceSummary, sourceDisclosure, sourceLens, sourceGroups, quickNav, pageHead, card,
    button, statusPill, visualCard, mathBlock, lessonSection, algorithmNotes, workedExample,
    recallItem, criticalThinking, studyKit, studyCompass
  });
});
