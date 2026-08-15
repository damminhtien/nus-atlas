/* Exam feature. Question selection, attempt state, timer, scoring, and review
 * stay together so new assessment formats do not expand the NUS shell. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.NUS_EXAM_FEATURE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createNusExamFeature(options) {
  const {
    root,
    getCourses,
    getLessons,
    getStore,
    pageHead,
    sourceItem,
    text,
    esc,
    button,
    typeset
  } = options;
  let state = null;
  let timer = null;

  function questionsFor(code, scope) {
    let questions = getLessons(code).flatMap(lesson => (lesson.questions || []).map(question => ({
      ...question,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      lessonSourceRefs: lesson.sourceRefs || []
    })));
    if (scope) questions = questions.filter(question => question.lessonId === scope);
    return questions;
  }

  function answerKey(question, raw) {
    if (question.type === "mcq") return Number(raw) === question.answer;
    const value = String(raw || "").toLowerCase().trim().replace(/[.$,()]/g, "").replace(/\s+/g, " ");
    return value.length > 0 && (question.accepted || []).some(answer => {
      const normalized = String(answer).toLowerCase().trim().replace(/[.$,()]/g, "").replace(/\s+/g, " ");
      return value === normalized || value.includes(normalized);
    });
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function finish() {
    if (!state) return;
    state.finished = true;
    stopTimer();
    const score = state.answers.filter(answer => answer.correct).length;
    const store = getStore();
    state.answers.filter(answer => answer.correct).forEach(answer => store.recordEvidence({
      eventId: `recall:${state.attemptId}:${answer.q.id}`,
      type: "recall_correct",
      courseCode: state.code,
      lessonId: answer.q.lessonId,
      xp: 5,
      meta: { questionId: answer.q.id }
    }));
    store.recordAttempt({
      attemptId: state.attemptId,
      mode: "exam",
      courseCode: state.code,
      lessonId: state.scope || null,
      score,
      total: state.questions.length
    });
    render(null, null, true);
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(() => {
      if (!state || state.finished) return stopTimer();
      const left = Math.max(0, (state.limitMinutes * 60) - Math.floor((Date.now() - state.startedAt) / 1000));
      const element = document.getElementById("nus-exam-timer");
      if (element) element.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      if (left <= 0) finish();
    }, 1000);
  }

  function renderResult() {
    const correct = state.answers.filter(answer => answer.correct).length;
    const total = state.questions.length;
    let body = pageHead(`${esc(state.code)} · review`, "Attempt complete", `${correct}/${total} correct. Use the deck below to turn misses into the next study session.`);
    body += `<div class="nus-result-score"><b>${Math.round(correct / Math.max(1, total) * 100)}%</b><span>${correct} correct · ${total - correct} to review</span></div><div class="nus-review-deck">${state.answers.map((answer, index) => `<article class="nus-review-item ${answer.correct ? "correct" : "missed"}"><div><span class="pill ${answer.correct ? "sage" : ""}">${answer.correct ? "Correct" : "Review"}</span><b>${index + 1}. ${esc(answer.q.prompt)}</b></div><p><strong>Source:</strong> ${(answer.q.sourceRefs || answer.q.lessonSourceRefs || []).slice(0, 2).map(sourceItem).join(" ")}</p><p><strong>Your answer:</strong> ${esc(answer.q.type === "mcq" ? (answer.q.choices[Number(answer.raw)] || "No choice") : answer.raw)}</p><p><strong>Worked answer:</strong> ${text(answer.q.solution || answer.q.explanation || "Review the source lesson.")}</p></article>`).join("")}</div><div class="nus-card"><h3>Cheat sheet</h3>${getLessons(state.code).map(lesson => `<details><summary>${esc(lesson.title)}</summary>${lesson.sections.map(section => `<p>${text(section.body)}</p>`).join("")}</details>`).join("")}</div><div class="nus-lesson-actions">${button("Try again", `#/nus/exam/${state.code}${state.scope ? `/${state.scope}` : ""}`, "primary")}${button("Back to course", `#/nus/course/${state.code}`, "ghost")}</div>`;
    root.innerHTML = body;
    typeset();
  }

  function render(code, scope, internal) {
    const routed = !internal;
    if (!state || (routed && (state.code !== (code || "all") || state.scope !== (scope || "")))) state = null;
    if (!state) {
      const optionsHtml = getCourses().map(course => `<option value="${esc(course.code)}" ${code === course.code ? "selected" : ""}>${esc(course.code)} · ${esc(course.title)}</option>`).join("");
      const selected = code || "DSA5101";
      root.innerHTML = pageHead("NUS practice", "Exam mode", "Choose one course and an optional lesson. The timer is local, answers stay hidden until the attempt ends, and the final screen becomes a review deck.") + `<section class="nus-card nus-exam-setup reveal"><label>Course<select id="nus-exam-course">${optionsHtml}</select></label><label>Scope<select id="nus-exam-scope"><option value="">All seeded lessons</option>${getLessons(selected).map(lesson => `<option value="${esc(lesson.id)}" ${scope === lesson.id ? "selected" : ""}>${esc(lesson.title)}</option>`).join("")}</select></label><label>Time<select id="nus-exam-minutes"><option value="15">15 minutes</option><option value="30" selected>30 minutes</option><option value="45">45 minutes</option></select></label><div class="nus-callout"><b>Exam rules</b><span>Mixed MCQ, short answer, calculation, derivation, trace, and SQL prompts. Solutions are revealed only after submission.</span></div><button class="btn primary" id="nus-start-exam">Start attempt</button></section>`;
      typeset();
      const courseSelect = root.querySelector("#nus-exam-course");
      const scopeSelect = root.querySelector("#nus-exam-scope");
      courseSelect.addEventListener("change", () => { location.hash = `#/nus/exam/${courseSelect.value}`; });
      scopeSelect.addEventListener("change", () => { location.hash = `#/nus/exam/${courseSelect.value}/${scopeSelect.value}`; });
      root.querySelector("#nus-start-exam").addEventListener("click", () => {
        state = {
          attemptId: `nus-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          code: selected,
          scope: scope || "",
          questions: questionsFor(selected, scope),
          index: 0,
          answers: [],
          startedAt: Date.now(),
          limitMinutes: Number(root.querySelector("#nus-exam-minutes").value),
          finished: false
        };
        render(null, null, true);
      });
      return;
    }
    if (state.finished) return renderResult();
    const question = state.questions[state.index];
    if (!question) return finish();
    const answersSoFar = state.answers.length;
    const input = question.type === "mcq"
      ? `<div class="nus-choices">${question.choices.map((choice, index) => `<label><input type="radio" name="nus-answer" value="${index}"><span>${esc(choice)}</span></label>`).join("")}</div>`
      : `<textarea id="nus-answer" rows="5" placeholder="Write your answer here…"></textarea>`;
    root.innerHTML = pageHead(`${esc(state.code)} · Question ${state.index + 1}/${state.questions.length}`, question.type.toUpperCase(), question.lessonTitle) + `<div class="nus-exam-bar"><span>Time left <b id="nus-exam-timer">--:--</b></span><span>${answersSoFar} submitted</span></div><section class="nus-card nus-exam-question reveal"><div class="nus-question-source">${(question.sourceRefs || question.lessonSourceRefs || []).slice(0, 2).map(sourceItem).join(" ")}</div><h3>${esc(question.prompt)}</h3>${input}<div class="nus-exam-footer"><span class="nus-muted">Answer reveal is locked until the attempt ends.</span><button class="btn primary" id="nus-next-answer">${state.index + 1 === state.questions.length ? "Submit attempt" : "Next question"}</button></div></section>`;
    typeset();
    root.querySelector("#nus-next-answer").addEventListener("click", () => {
      const raw = question.type === "mcq" ? (root.querySelector("input[name='nus-answer']:checked") || {}).value : root.querySelector("#nus-answer").value;
      if (raw == null || !String(raw).trim()) return;
      state.answers.push({ q: question, raw, correct: answerKey(question, raw) });
      state.index++;
      if (state.index >= state.questions.length) finish();
      else render(null, null, true);
    });
    startTimer();
  }

  return Object.freeze({ render, stopTimer });
});
