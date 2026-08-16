/* Fast, distinction-first retrieval for paired concepts. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.NUS_CONTRAST_DRILLS_FEATURE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createContrastDrills(config) {
  const options = config || {};
  const root = options.root;
  const getCourses = typeof options.getCourses === "function" ? options.getCourses : () => [];
  const getLessons = typeof options.getLessons === "function" ? options.getLessons : () => [];
  const getStore = typeof options.getStore === "function" ? options.getStore : () => null;
  const pageHead = options.pageHead || (() => "");
  const sourceItem = options.sourceItem || (() => "");
  const text = options.text || (value => String(value == null ? "" : value));
  const esc = options.esc || text;
  const button = options.button || ((label, href) => `<a href="${href}">${label}</a>`);
  const typeset = options.typeset || (() => {});
  let state = null;

  function drillsFor(code, scope) {
    return getLessons(code).flatMap(lesson => (lesson.contrastDrills || [])
      .filter(drill => !scope || lesson.id === scope || drill.id === scope)
      .map(drill => ({ ...drill, lessonId: lesson.id, lessonTitle: lesson.title, lessonSourceRefs: lesson.sourceRefs || [] })));
  }

  function courseTitle(code) {
    const item = getCourses().find(course => course.code === code);
    return item ? item.title : code;
  }

  function sourceTrail(drill) {
    const refs = (drill.sourceRefs || drill.lessonSourceRefs || []).slice(0, 2);
    return refs.length ? `<div class="nus-question-source">${refs.map(sourceItem).join(" ")}</div>` : "";
  }

  function choiceClass(index, drill, answer) {
    if (!answer) return "";
    if (index === drill.answer) return "is-correct";
    return index === answer.selected ? "is-wrong" : "";
  }

  function renderEmpty(code, scope) {
    const scopeLabel = scope ? "for this lesson" : "for this course";
    root.innerHTML = pageHead(`${esc(code)} · concept contrasts`, "No contrast drills yet", `There are no concept contrasts ${scopeLabel}.`) + `<section class="nus-card nus-empty-state"><p>These short, no-calculation drills are authored from the course source layer.</p><div class="nus-lesson-actions">${button("Back to course", `#/nus/course/${esc(code)}`, "primary")}${button("Study desk", "#/", "ghost")}</div></section>`;
  }

  function renderIntro(code, scope, drills) {
    const scopeText = scope ? "a lesson-sized set" : "the full Week 1 distinction set";
    return pageHead(`${esc(code)} · concept contrasts`, "Concept Contrast Drills", `Fast retrieval for ${scopeText}. Each prompt takes about 30–60 seconds and requires no calculation.`) + `<section class="nus-card nus-contrast-intro reveal"><div class="nus-contrast-intro-copy"><span class="pill gold">Distinguish</span><h3>Spot the boundary before you solve</h3><p>${esc(courseTitle(code))} · ${drills.length} paired-concept drills</p></div><div class="nus-contrast-pairs">${drills.map(drill => `<span>${esc(drill.pair)}</span>`).join("")}</div><p class="nus-muted">Choose one answer. The explanation appears immediately, then continue to the next contrast.</p></section>`;
  }

  function renderQuestion() {
    const drill = state.drills[state.index];
    const answer = state.answers[state.index];
    const progress = `${state.index + 1}/${state.drills.length}`;
    const choices = drill.choices.map((choice, index) => `<button class="nus-contrast-choice ${choiceClass(index, drill, answer)}" type="button" data-contrast-choice="${index}" ${answer ? "disabled" : ""}><span class="nus-contrast-choice-key">${String.fromCharCode(65 + index)}</span><span>${text(choice)}</span></button>`).join("");
    const feedback = answer ? `<div class="nus-contrast-feedback ${answer.correct ? "is-correct" : "is-wrong"}" role="status"><strong>${answer.correct ? "Correct distinction" : "Not quite"}</strong><p>${text(drill.explanation)}</p>${!answer.correct ? `<p class="nus-muted">Correct answer: <b>${text(drill.choices[drill.answer])}</b></p>` : ""}</div>` : "";
    const nextLabel = state.index + 1 === state.drills.length ? "See summary" : "Next contrast";
    return `<div class="nus-contrast-progress"><span>Drill ${progress}</span><span>30–60 sec · No calculation</span></div><section class="nus-card nus-contrast-question reveal">${sourceTrail(drill)}<div class="nus-contrast-question-head"><span class="pill violet">${esc(drill.pair)}</span><span class="nus-question-meta">${esc(drill.cognitiveLevel || "distinguish")}</span></div><h3>${text(drill.prompt)}</h3><div class="nus-contrast-choices" role="group" aria-label="Answer choices">${choices}</div>${feedback}<div class="nus-contrast-footer">${answer ? `<button class="btn primary" type="button" id="nus-contrast-next">${nextLabel}</button>` : `<span class="nus-muted">Commit to a distinction, then reveal the explanation.</span>`}</div></section>`;
  }

  function renderResult() {
    const correct = state.answers.filter(answer => answer && answer.correct).length;
    const total = state.drills.length;
    const review = state.drills.map((drill, index) => {
      const answer = state.answers[index];
      return `<article class="nus-contrast-review ${answer && answer.correct ? "is-correct" : "is-wrong"}><div><span class="pill ${answer && answer.correct ? "sage" : "rust"}">${answer && answer.correct ? "Clear" : "Review"}</span><b>${esc(drill.pair)}</b></div><p>${text(drill.explanation)}</p></article>`;
    }).join("");
    root.innerHTML = pageHead(`${esc(state.code)} · contrast review`, "Contrast set complete", `${correct}/${total} distinctions correct. Keep the misses visible and retry until the boundary is automatic.`) + `<div class="nus-result-score"><b>${Math.round(correct / Math.max(1, total) * 100)}%</b><span>${correct} clear · ${total - correct} to review</span></div><div class="nus-contrast-review-list">${review}</div><div class="nus-lesson-actions">${button("Retry contrasts", `#/nus/contrast/${esc(state.code)}${state.scope ? `/${esc(state.scope)}` : ""}`, "primary")}${button("Practice mode", `#/nus/exam/${esc(state.code)}`, "ghost")}${button("Back to course", `#/nus/course/${esc(state.code)}`, "ghost")}</div>`;
    typeset();
  }

  function recordAnswer(drill, selected) {
    const correct = Number(selected) === Number(drill.answer);
    const answer = { selected: Number(selected), correct };
    state.answers[state.index] = answer;
    const store = getStore();
    if (store && typeof store.recordQuestionAttempt === "function") store.recordQuestionAttempt({
      attemptId: state.attemptId,
      courseCode: state.code,
      correct,
      raw: String(selected),
      question: { ...drill, type: "contrast" }
    });
    if (correct && store && typeof store.recordEvidence === "function") store.recordEvidence({
      eventId: `contrast:${state.attemptId}:${drill.id}`,
      type: "recall_correct",
      courseCode: state.code,
      lessonId: drill.lessonId,
      xp: 4,
      meta: { questionId: drill.id, pair: drill.pair }
    });
  }

  function bind() {
    root.querySelectorAll("[data-contrast-choice]").forEach(choice => choice.addEventListener("click", () => {
      if (state.answers[state.index]) return;
      recordAnswer(state.drills[state.index], choice.dataset.contrastChoice);
      root.innerHTML = renderIntro(state.code, state.scope, state.drills) + renderQuestion();
      typeset();
      bind();
    }));
    root.querySelector("#nus-contrast-next")?.addEventListener("click", () => {
      state.index += 1;
      if (state.index >= state.drills.length) return renderResult();
      root.innerHTML = renderIntro(state.code, state.scope, state.drills) + renderQuestion();
      typeset();
      bind();
    });
  }

  function render(code, scope) {
    const selectedCode = code || "DSA5104";
    const drills = drillsFor(selectedCode, scope);
    if (!drills.length) return renderEmpty(selectedCode, scope);
    state = { attemptId: `contrast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, code: selectedCode, scope: scope || "", drills, index: 0, answers: [] };
    root.innerHTML = renderIntro(selectedCode, state.scope, drills) + renderQuestion();
    typeset();
    bind();
  }

  return Object.freeze({ render, drillsFor });
});
