/* Automatic spaced retrieval for the NUS study layer.
 * It presents only one or two prompts due now; lesson reading stays optional. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_RETRIEVAL_FEATURE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createNusRetrievalFeature(options) {
  const { root, getCourses, getLessons, getStore, pageHead, sourceItem, text, esc, button, typeset, answerKey, gradeShortAnswer } = options;
  const DAY = 86400000;
  let state = null;

  function allLessons(code) {
    return code ? getLessons(code) : getCourses().flatMap(course => getLessons(course.code));
  }

  function dateLabel(value) {
    if (!value) return "not scheduled";
    return new Intl.DateTimeFormat("en-SG", { timeZone: "Asia/Singapore", month: "short", day: "numeric" }).format(new Date(value));
  }

  function dueQuestions(code) {
    const store = getStore();
    const lessons = allLessons(code);
    if (store && typeof store.ensureRetrievalSchedules === "function") store.ensureRetrievalSchedules(lessons);
    const byId = new Map(lessons.map(lesson => [lesson.id, lesson]));
    const items = [];
    (store && typeof store.dueRetrievals === "function" ? store.dueRetrievals(code) : []).forEach(schedule => {
      const lesson = byId.get(schedule.lessonId);
      const questions = lesson && Array.isArray(lesson.questions) ? lesson.questions : [];
      if (!questions.length) return;
      const start = (Number(schedule.reps) * 2) % questions.length;
      const count = Math.min(2, questions.length);
      for (let offset = 0; offset < count && items.length < 2; offset++) {
        const question = questions[(start + offset) % questions.length];
        items.push({ question, lesson, schedule });
      }
    });
    return items;
  }

  function nextDueText(code) {
    const store = getStore();
    const next = store && typeof store.upcomingRetrievals === "function" ? store.upcomingRetrievals(code, 120)[0] : null;
    return next ? `Next retrieval: ${dateLabel(next.dueAt)} · ${esc(next.lessonId)}` : "Mastered concepts will appear here automatically.";
  }

  function renderEmpty(code) {
    const store = getStore();
    const mastered = allLessons(code).filter(lesson => store.masteryFor(lesson.id).score >= 0.8).length;
    const message = mastered ? "Nothing is due right now. Your mastered concepts are scheduled in the background." : "Master a concept first; Atlas will schedule its first retrieval for tomorrow.";
    root.innerHTML = pageHead("NUS · Spaced retrieval", "Keep Week 1 alive", "One or two retrieval questions at the right time. No lesson reread required.") + `<section class="nus-card nus-retrieval-empty reveal"><div class="nus-retrieval-empty-icon">↺</div><h3>${esc(message)}</h3><p class="nus-muted">${nextDueText(code)}</p><div class="nus-card-actions">${button("Back to study desk", "#/", "primary")}${button("Open practice mode", `#/nus/exam${code ? `/${esc(code)}` : ""}`, "ghost")}</div></section>`;
  }

  function renderFinished() {
    const good = state.results.filter(item => item.correct).length;
    const body = state.results.map(item => `<li><span>${item.correct ? "✓" : "↺"}</span><div><b>${esc(item.title)}</b><small>${item.correct ? `Next review in ${item.interval} day${item.interval === 1 ? "" : "s"}` : `Interval reduced to ${item.interval} day${item.interval === 1 ? "" : "s"}`} · ${item.mode === "ai" ? `AI-assisted ${item.score == null ? "" : `${Math.round(item.score * 100)}%`}` : "heuristic fallback"}</small></div></li>`).join("");
    root.innerHTML = pageHead("NUS · Spaced retrieval", "Retrieval saved", `${good}/${state.results.length} prompts recalled correctly. The next interval is now scheduled.`) + `<section class="nus-card nus-retrieval-summary reveal"><ul class="nus-retrieval-result-list">${body}</ul><p class="nus-muted">Confidence changes the schedule only when paired with a correct answer. A miss brings the concept back sooner.</p><div class="nus-card-actions">${button("Back to study desk", "#/", "primary")}${button("Open practice mode", `#/nus/exam${state.code ? `/${esc(state.code)}` : ""}`, "ghost")}</div></section>`;
  }

  function renderQuestion() {
    const item = state.items[state.index];
    const question = item.question;
    const isChoice = question.type === "mcq";
    const input = isChoice
      ? `<div class="nus-choices">${(question.choices || []).map((choice, index) => `<label><input type="radio" name="nus-retrieval-answer" value="${index}"><span>${esc(choice)}</span></label>`).join("")}</div>`
      : `<textarea class="nus-answer-input" id="nus-retrieval-answer" rows="5" placeholder="Answer from memory…"></textarea>`;
    root.innerHTML = pageHead("NUS · Spaced retrieval", `Retrieval ${state.index + 1}/${state.items.length}`, `${esc(item.lesson.courseId || item.lesson.courseCode || "NUS")} · ${esc(item.lesson.title)}`) + `<section class="nus-card nus-retrieval-card reveal"><div class="nus-retrieval-rule"><span>Due now</span><span>Do not reopen the lesson</span></div><div class="nus-question-source">${(question.sourceRefs || []).slice(0, 2).map(sourceItem).join(" ")}</div><h3>${text(question.prompt)}</h3>${input}<div id="nus-retrieval-feedback" aria-live="polite"></div><div class="nus-card-actions"><button class="btn primary" id="nus-retrieval-submit">Check answer</button>${button("Pause", "#/", "ghost")}</div></section>`;
    typeset();
    const submit = root.querySelector("#nus-retrieval-submit");
    submit.addEventListener("click", async () => {
      const raw = isChoice ? (root.querySelector("input[name='nus-retrieval-answer']:checked") || {}).value : root.querySelector("#nus-retrieval-answer").value;
      if (raw == null || !String(raw).trim()) return;
      const fallbackCorrect = typeof answerKey === "function" ? answerKey(question, raw) : (isChoice ? Number(raw) === question.answer : true);
      let grading = { correct: fallbackCorrect, mode: "heuristic", score: null, feedback: "" };
      root.querySelectorAll("input, textarea").forEach(control => { control.disabled = true; });
      submit.disabled = true;
      const feedback = root.querySelector("#nus-retrieval-feedback");
      const canUseAi = !isChoice && typeof gradeShortAnswer === "function";
      if (canUseAi) {
        feedback.innerHTML = `<div class="nus-retrieval-feedback is-pending"><b>AI checking…</b><p>Comparing the central ideas in your answer with the source-backed solution.</p></div>`;
        try {
          const result = await gradeShortAnswer({
            courseCode: item.lesson.courseId || item.lesson.courseCode,
            questionId: question.id,
            prompt: question.prompt,
            answer: raw,
            referenceAnswer: question.solution || question.explanation || "",
            accepted: question.accepted || [],
            rubric: question.rubric || []
          });
          grading = { correct: !!result.correct, mode: "ai", score: result.score, feedback: result.feedback };
        } catch {
          grading.feedback = "AI grader unavailable; heuristic fallback used.";
        }
      }
      const correct = grading.correct;
      const modeLabel = grading.mode === "ai" ? `AI-assisted · ${grading.score == null ? "review" : `${Math.round(grading.score * 100)}%`}` : "Heuristic fallback";
      const explanation = grading.feedback || question.solution || question.explanation || "Keep the distinction explicit and try again at the next interval.";
      feedback.innerHTML = `<div class="nus-retrieval-feedback ${correct ? "is-correct" : "is-wrong"}"><b>${correct ? "Correct ✓" : "Not quite — this returns sooner"}</b><span class="nus-grading-mode">${modeLabel}</span><p>${grading.mode === "ai" ? esc(explanation) : text(explanation)}</p><div class="nus-confidence"><span>How confident were you?</span><div>${[[1, "Low"], [2, "Good"], [3, "High"]].map(([value, label]) => `<button class="btn ghost" data-confidence="${value}" type="button">${label}</button>`).join("")}</div><button class="btn primary" id="nus-retrieval-save" type="button" disabled>Save retrieval</button></div>`;
      feedback.querySelectorAll("[data-confidence]").forEach(control => control.addEventListener("click", () => {
        feedback.querySelectorAll("[data-confidence]").forEach(buttonEl => buttonEl.classList.toggle("is-selected", buttonEl === control));
        feedback.querySelector("#nus-retrieval-save").disabled = false;
        state.confidence = Number(control.dataset.confidence);
      }));
      feedback.querySelector("#nus-retrieval-save").addEventListener("click", () => {
        const result = getStore().recordRetrieval({
          reviewId: `${state.sessionId}:${state.index}`,
          courseCode: item.lesson.courseId || item.lesson.courseCode,
          lessonId: item.lesson.id,
          questionId: question.id,
          correct,
          confidence: state.confidence,
          gradingMode: grading.mode,
          gradeScore: grading.score
        });
        state.results.push({ title: item.lesson.title, correct, interval: result.interval, mode: grading.mode, score: grading.score });
        state.index += 1;
        state.confidence = null;
        if (state.index >= state.items.length) renderFinished();
        else renderQuestion();
      });
      typeset();
    });
  }

  function render(code) {
    const items = dueQuestions(code);
    if (!items.length) return renderEmpty(code);
    state = { code: code || "", items, index: 0, confidence: null, results: [], sessionId: `sr-${Date.now()}` };
    renderQuestion();
  }

  return Object.freeze({ render, dueQuestions });
});
