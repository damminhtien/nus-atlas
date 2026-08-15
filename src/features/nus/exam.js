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

  function questionStats(question) {
    const store = getStore();
    return store && typeof store.questionStats === "function"
      ? store.questionStats(question.id)
      : { attempts: 0, correct: 0, misses: 0, accuracy: 0 };
  }

  function questionsFor(code, scope, focus = "smart", limit = Infinity) {
    let questions = getLessons(code).flatMap(lesson => (lesson.questions || []).map(question => ({
      ...question,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      lessonSourceRefs: lesson.sourceRefs || []
    })));
    if (scope) questions = questions.filter(question => question.lessonId === scope);
    const ranked = questions.map((question, index) => {
      const stats = questionStats(question);
      const weakness = stats.misses * 100 + (stats.attempts && stats.accuracy < 0.8 ? 40 : 0);
      const novelty = stats.attempts ? 0 : 30;
      const difficulty = question.difficulty === "hard" ? 8 : question.difficulty === "medium" ? 4 : 0;
      const focusScore = focus === "weakness" ? weakness + difficulty : focus === "new" ? novelty + difficulty : focus === "mixed" ? novelty + weakness / 3 + difficulty : weakness + novelty + difficulty;
      return { question, index, focusScore };
    }).sort((a, b) => b.focusScore - a.focusScore || a.index - b.index);
    const selected = [];
    const skills = new Set();
    for (const item of ranked) {
      if (selected.length >= limit) break;
      if (!skills.has(item.question.skill) || selected.length >= Math.min(3, limit)) {
        selected.push(item.question);
        skills.add(item.question.skill);
      }
    }
    for (const item of ranked) {
      if (selected.length >= limit) break;
      if (!selected.includes(item.question)) selected.push(item.question);
    }
    return selected;
  }

  function questionLabel(question) {
    return `${question.difficulty || "medium"} · ${question.skill || "explain"} · ${question.estimatedSeconds || 90}s`;
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

  function renderMistakes(code) {
    const store = getStore();
    const mistakes = store && typeof store.mistakes === "function" ? store.mistakes(code) : [];
    let body = pageHead(`${esc(code || "NUS")} · mistake clinic`, "Mistake Clinic", "Repair the ideas you missed recently. Each item keeps its source trail and misconception cue visible.");
    if (!mistakes.length) {
      root.innerHTML = body + `<section class="nus-card nus-empty-state"><h3>No unresolved mistakes</h3><p>Complete a practice run first. Missed questions will appear here with a focused repair path.</p><div class="nus-lesson-actions">${button("Start a smart run", `#/nus/exam/${esc(code || "DSA5105")}`, "primary")}${button("Course map", `#/nus/course/${esc(code || "DSA5105")}`, "ghost")}${button("Back to dashboard", "#/", "ghost")}</div></section>`;
      return;
    }
    body += `<div class="nus-mistake-clinic">${mistakes.map((mistake, index) => `<article class="nus-card nus-mistake-item reveal"><div class="nus-mistake-head"><span class="pill rust">Missed</span><span class="nus-question-meta">${esc(questionLabel(mistake))}</span></div><h3>${index + 1}. ${esc(mistake.prompt || mistake.questionId)}</h3><p class="nus-mistake-cue"><b>Misconception cue:</b> ${esc(mistake.misconception || "Rebuild the assumption before retrying.")}</p><details><summary>Open worked repair</summary><p>${text(mistake.solution || mistake.explanation || "Review the linked lesson.")}</p><p>${(mistake.sourceRefs || []).slice(0, 2).map(sourceItem).join(" ")}</p></details><div class="nus-card-actions">${mistake.lessonId ? button("Review lesson", `#/nus/lesson/${esc(mistake.courseCode || code || "DSA5105")}/${esc(mistake.lessonId)}`, "ghost") : ""}<button class="btn primary" type="button" data-redeem-mistake="${esc(mistake.questionId)}" data-attempt-event="${esc(mistake.attemptEventId || "")}">Mark repaired</button></div></article>`).join("")}</div><div class="nus-lesson-actions">${button("Run weak topics", `#/nus/exam/${esc(code || "DSA5105")}`, "primary")}${button("Back to course", `#/nus/course/${esc(code || "DSA5105")}`, "ghost")}</div>`;
    root.innerHTML = body;
    root.querySelectorAll("[data-redeem-mistake]").forEach(element => element.addEventListener("click", () => {
      if (store && typeof store.redeemMistake === "function") store.redeemMistake(element.dataset.redeemMistake, element.dataset.attemptEvent || "latest");
      renderMistakes(code);
    }));
    typeset();
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
    body += `<div class="nus-result-score"><b>${Math.round(correct / Math.max(1, total) * 100)}%</b><span>${correct} correct · ${total - correct} to review</span></div>${total - correct ? `<div class="nus-callout nus-mistake-callout"><b>${total - correct} repair${total - correct === 1 ? "" : "s"} queued</b><span>Open Mistake Clinic to turn each miss into a corrected idea.</span>${button("Open Mistake Clinic", `#/nus/mistakes/${state.code}`, "primary")}</div>` : ""}<div class="nus-review-deck">${state.answers.map((answer, index) => `<article class="nus-review-item ${answer.correct ? "correct" : "missed"}"><div><span class="pill ${answer.correct ? "sage" : ""}">${answer.correct ? "Correct" : "Review"}</span><b>${index + 1}. ${esc(answer.q.prompt)}</b></div><p><strong>Source:</strong> ${(answer.q.sourceRefs || answer.q.lessonSourceRefs || []).slice(0, 2).map(sourceItem).join(" ")}</p><p><strong>Your answer:</strong> ${esc(answer.q.type === "mcq" ? (answer.q.choices[Number(answer.raw)] || "No choice") : answer.raw)}</p><p><strong>Worked answer:</strong> ${text(answer.q.solution || answer.q.explanation || "Review the source lesson.")}</p></article>`).join("")}</div><div class="nus-card"><h3>Cheat sheet</h3>${getLessons(state.code).map(lesson => `<details><summary>${esc(lesson.title)}</summary>${lesson.sections.map(section => `<p>${text(section.body)}</p>`).join("")}</details>`).join("")}</div><div class="nus-lesson-actions">${button("Try again", `#/nus/exam/${state.code}${state.scope ? `/${state.scope}` : ""}`, "primary")}${button("Back to course", `#/nus/course/${state.code}`, "ghost")}${button("Study desk", "#/", "ghost")}</div>`;
    root.innerHTML = body;
    typeset();
  }

  function render(code, scope, internal) {
    const routed = !internal;
    if (!state || (routed && (state.code !== (code || "all") || state.scope !== (scope || "")))) state = null;
    if (!state) {
      const optionsHtml = getCourses().map(course => `<option value="${esc(course.code)}" ${code === course.code ? "selected" : ""}>${esc(course.code)} · ${esc(course.title)}</option>`).join("");
      const selected = code || "DSA5101";
      root.innerHTML = pageHead("NUS practice", "Exam mode", "Choose a course, a focus, and a short attempt. Every answer is logged as a question-level learning signal; solutions remain locked until submission.") + `<section class="nus-card nus-exam-setup reveal"><div class="nus-exam-setup-grid"><label>Course<select id="nus-exam-course">${optionsHtml}</select></label><label>Scope<select id="nus-exam-scope"><option value="">All seeded lessons</option>${getLessons(selected).map(lesson => `<option value="${esc(lesson.id)}" ${scope === lesson.id ? "selected" : ""}>${esc(lesson.title)}</option>`).join("")}</select></label><label>Focus<select id="nus-exam-focus"><option value="smart">Smart mix</option><option value="weakness">Weak topics</option><option value="new">New concepts</option><option value="mixed">Mixed retrieval</option></select></label><label>Questions<select id="nus-exam-count"><option value="5">5 questions</option><option value="10" selected>10 questions</option><option value="15">15 questions</option></select></label><label>Time<select id="nus-exam-minutes"><option value="15">15 minutes</option><option value="30" selected>30 minutes</option><option value="45">45 minutes</option></select></label></div><div class="nus-callout"><b>Practice loop</b><span>Answer first, review the explanation, then repair misses in Mistake Clinic. Lecture refs are primary; textbook/ref refs are labeled as support.</span></div><div class="nus-card-actions"><button class="btn primary" id="nus-start-exam">Start attempt</button>${button("Course map", `#/nus/course/${esc(selected)}`, "ghost")}${button("Mistake Clinic", `#/nus/mistakes/${esc(selected)}`, "ghost")}</div></section>`;
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
          focus: root.querySelector("#nus-exam-focus").value,
          limit: Number(root.querySelector("#nus-exam-count").value),
          questions: questionsFor(selected, scope, root.querySelector("#nus-exam-focus").value, Number(root.querySelector("#nus-exam-count").value)),
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
    root.innerHTML = pageHead(`${esc(state.code)} · Question ${state.index + 1}/${state.questions.length}`, question.type.toUpperCase(), question.lessonTitle) + `<div class="nus-exam-bar"><span>Time left <b id="nus-exam-timer">--:--</b></span><span>${answersSoFar} submitted</span><span>${esc(state.focus || "smart")} · ${state.questions.length} questions</span></div><section class="nus-card nus-exam-question reveal"><div class="nus-question-source">${(question.sourceRefs || question.lessonSourceRefs || []).slice(0, 2).map(sourceItem).join(" ")}</div><div class="nus-question-meta"><span>${esc(questionLabel(question))}</span><span>${esc(question.cognitiveLevel || "understand")}</span></div><h3>${esc(question.prompt)}</h3>${input}<div class="nus-exam-footer"><span class="nus-muted">Answer reveal is locked until the attempt ends.</span><div class="nus-exam-footer-actions">${question.lessonId ? button("Review lesson", `#/nus/lesson/${esc(state.code)}/${esc(question.lessonId)}`, "ghost") : ""}${button("Mistakes", `#/nus/mistakes/${esc(state.code)}`, "ghost")}<button class="btn primary" id="nus-next-answer">${state.index + 1 === state.questions.length ? "Submit attempt" : "Next question"}</button></div></div></section>`;
    typeset();
    root.querySelector("#nus-next-answer").addEventListener("click", () => {
      const raw = question.type === "mcq" ? (root.querySelector("input[name='nus-answer']:checked") || {}).value : root.querySelector("#nus-answer").value;
      if (raw == null || !String(raw).trim()) return;
      const correct = answerKey(question, raw);
      state.answers.push({ q: question, raw, correct });
      const store = getStore();
      if (store && typeof store.recordQuestionAttempt === "function") store.recordQuestionAttempt({ attemptId: state.attemptId, courseCode: state.code, correct, raw, question });
      state.index++;
      if (state.index >= state.questions.length) finish();
      else render(null, null, true);
    });
    startTimer();
  }

  return Object.freeze({ render, renderMistakes, stopTimer, questionsFor });
});
