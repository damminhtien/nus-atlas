/* Exam feature. Question selection, attempt state, timer, scoring, and review
 * stay together so new assessment formats do not expand the NUS shell. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_EXAM_FEATURE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createNusExamFeature(options) {
  const createExamSelection = options.selection || (typeof module === "object" && module.exports ? require("./exam-selection") : globalThis.ATLAS_EXAM_SELECTION);
  const createExamSession = options.session || (typeof module === "object" && module.exports ? require("./exam-session") : globalThis.ATLAS_EXAM_SESSION);
  const createExamGenerators = options.generators || (typeof module === "object" && module.exports ? require("./exam-generators") : globalThis.ATLAS_EXAM_GENERATORS);
  const createExamRenderer = options.renderer || (typeof module === "object" && module.exports ? require("./exam-renderer") : globalThis.ATLAS_EXAM_RENDERER);
  const {
    root,
    getCourses,
    getLessons,
    getAssessmentMap,
    getQuestionTemplates,
    getStore,
    pageHead,
    sourceItem,
    text,
    esc,
    button,
    typeset,
    gradeOpenResponse
  } = options;
  let state = null;
  let timer = null;

  const selection = createExamSelection ? createExamSelection({ getLessons, getStore, getAssessmentMap }) : null;
  const sessionApi = createExamSession ? createExamSession() : null;
  const generators = createExamGenerators ? createExamGenerators({ getTemplates: getQuestionTemplates }) : null;
  const renderer = createExamRenderer ? createExamRenderer({ pageHead, sourceItem, text, esc, button }) : null;

  function defaultCourseCode() {
    const first = (getCourses() || [])[0];
    return first && first.code ? first.code : "";
  }

  function questionsFor(code, scope, focus = "smart", limit = Infinity) {
    return selection ? selection.selectQuestions({ courseCode: code, scope, focus, limit }) : [];
  }

  function persistActivePractice() {
    const store = getStore();
    if (state && state.status !== "finished" && store && typeof store.setActivePractice === "function") store.setActivePractice(sessionApi.snapshot(state));
  }

  function restoreActivePractice(code, scope) {
    const store = getStore();
    if (!store || typeof store.activePractice !== "function") return false;
    const saved = store.activePractice();
    if (!saved || saved.courseCode !== code || (scope && saved.scope !== scope) || saved.status === "finished") return false;
    const questions = saved.mode === "mock"
      ? questionsForPracticePlan(code, practicePlanFor(code, saved.scope))
      : saved.mode === "deep"
        ? deepQuestionsFromSnapshot(saved)
        : questionsFor(code, saved.scope, saved.focus || "smart", Infinity);
    if (!questions.length || questions.length < saved.questionIds.length) return false;
    state = sessionApi.fromSnapshot(saved, questions);
    return state.questionIds.length === saved.questionIds.length;
  }

  function normalizeAnswer(raw) {
    return String(raw || "")
      .toLowerCase()
      .replace(/\\(?:mathrm|operatorname|text)\s*\{([^{}]*)\}/g, "$1")
      .replace(/\\(lambda|mu|psi|ell|phi|dagger|sign)\b/g, "$1")
      .replace(/[λμψϕφ]/g, symbol => ({ "λ": "lambda", "μ": "mu", "ψ": "psi", "ϕ": "phi", "φ": "phi" }[symbol]))
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function termMatches(value, term) {
    return String(term || "").split("|").some(candidate => {
      const normalized = normalizeAnswer(candidate);
      return normalized && value.includes(normalized);
    });
  }

  function rubricPasses(question, raw) {
    const rubric = Array.isArray(question.rubric) ? question.rubric : [];
    if (!rubric.length) return null;
    const value = normalizeAnswer(raw);
    return value.length > 0 && rubric.every(item => (item.required || []).every(term => termMatches(value, term)));
  }

  function gradingMode(question) {
    if (question && question.gradingMode) return question.gradingMode;
    if (question && question.type === "mcq") return "exact";
    if (question && question.grading && question.grading.type === "numeric") return "exact";
    if (question && question.type === "derivation" && Array.isArray(question.rubric) && question.rubric.length) return "rubric";
    return "heuristic";
  }

  function masteryEligible(question) {
    return gradingMode(question) === "exact";
  }

  function practicePlanFor(code, scope) {
    if (scope !== "mixed-exam" || typeof getAssessmentMap !== "function") return null;
    const map = getAssessmentMap(code);
    const plan = map && map.practicePlan;
    return plan && Array.isArray(plan.questionIds) ? plan : null;
  }

  function questionsForPracticePlan(code, plan) {
    if (!plan) return [];
    const byId = new Map(getLessons(code).filter(lesson => lesson.examEligible !== false).flatMap(lesson => (lesson.questions || []).map(question => ({
      ...question,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      lessonSourceRefs: lesson.sourceRefs || []
    }))).map(question => [question.id, question]));
    const questions = plan.questionIds.map(id => byId.get(id)).filter(Boolean);
    return questions.length === plan.questionIds.length ? questions : [];
  }

  function deepPracticeQuestions(code, limit, seed) {
    if (!generators || !selection) return [];
    const skills = selection.eligibleQuestions(code, "").map(question => question.skill).filter(Boolean);
    return generators.generate({
      courseCode: code,
      templates: getQuestionTemplates ? getQuestionTemplates(code) : null,
      seed,
      limit,
      skills,
      ...(code === "DSA5101" ? { allForms: true } : {})
    });
  }

  function deepQuestionsFromSnapshot(snapshot) {
    if (!generators || !snapshot || !Array.isArray(snapshot.questionIds)) return [];
    return snapshot.questionIds.map(questionId => {
      const generationSeed = snapshot.generatedSeeds && snapshot.generatedSeeds[questionId];
      const generatorId = String(questionId).split(":")[1];
      return generationSeed == null ? null : generators.generateOne({ courseCode: snapshot.courseCode, templates: getQuestionTemplates ? getQuestionTemplates(snapshot.courseCode) : null, generatorId, generationSeed });
    }).filter(Boolean);
  }

  function answerKey(question, raw) {
    if (question.type === "mcq") return Number(raw) === question.answer;
    const numeric = question.grading && question.grading.type === "numeric" ? question.grading : null;
    if (numeric) {
      const match = String(raw).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
      const value = match ? Number(match[0]) : NaN;
      return Number.isFinite(value) && Math.abs(value - Number(numeric.expected)) <= Number(numeric.tolerance || 0);
    }
    const rubricResult = rubricPasses(question, raw);
    if (rubricResult !== null) return rubricResult;
    const value = normalizeAnswer(raw);
    return value.length > 0 && (question.accepted || []).some(answer => {
      const normalized = normalizeAnswer(answer);
      return value === normalized || value.includes(normalized);
    });
  }

  function localGrade(question, raw) {
    const mode = gradingMode(question);
    const correct = answerKey(question, raw);
    return {
      correct,
      mode,
      status: mode === "exact" ? "graded" : "self-review",
      gradedBy: mode === "exact" ? "local" : "heuristic",
      score: mode === "exact" ? (correct ? 1 : 0) : null,
      feedback: mode === "exact" ? "" : "Local rubric/phrase feedback; verify the reasoning against the worked answer."
    };
  }

  async function gradeResponse(question, raw) {
    const local = localGrade(question, raw);
    if (local.mode === "exact" || typeof gradeOpenResponse !== "function") return local;
    try {
      const external = await gradeOpenResponse({
        courseCode: state.courseCode,
        questionId: question.id,
        prompt: question.prompt,
        answer: raw,
        referenceAnswer: question.solution || question.explanation || "",
        accepted: question.accepted || [],
        rubric: question.rubric || [],
        sourceRefs: question.sourceRefs || question.lessonSourceRefs || []
      });
      return { correct: !!external.correct, mode: "ai", status: "graded", gradedBy: "ai", score: external.score == null ? null : Number(external.score), feedback: external.feedback || "AI-assisted feedback. This result is not mastery evidence." };
    } catch (_) {
      return { ...local, feedback: "External grader unavailable; local feedback shown. Review the worked answer before retrying." };
    }
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function answerRecords() {
    const byId = new Map((state && state.questions || []).map(question => [question.id, question]));
    return (state && state.answers || []).map(answer => ({ ...answer, q: byId.has(answer.questionId) ? { ...byId.get(answer.questionId), gradingMode: answer.gradingMode, feedback: answer.feedback } : null })).filter(answer => answer.q);
  }

  function finish(timedOut = false) {
    if (!state || state.status === "finished") return;
    state = timedOut ? sessionApi.timeout(state) : sessionApi.finish(state);
    stopTimer();
    const answers = answerRecords();
    const score = answers.filter(answer => answer.correct).length;
    const store = getStore();
    answers.filter(answer => answer.correct && masteryEligible(answer.q)).forEach(answer => {
      if (store && typeof store.recordEvidence === "function") store.recordEvidence({
        eventId: `recall:${state.attemptId}:${answer.q.id}`,
        type: "recall_correct",
        courseCode: state.courseCode,
        lessonId: answer.q.lessonId,
        xp: 5,
        meta: { questionId: answer.q.id, gradingMode: "exact" }
      });
    });
    if (store && typeof store.recordAttempt === "function") store.recordAttempt({
      attemptId: state.attemptId,
      mode: state.mode,
      courseCode: state.courseCode,
      lessonId: state.scope || null,
      score,
      total: state.questions.length,
      meta: {
        timedOut: state.timedOut,
        skipped: state.skippedQuestionIds.length,
        exactAutoGraded: answers.filter(answer => masteryEligible(answer.q)).length,
        openResponse: answers.filter(answer => !masteryEligible(answer.q)).length
      }
    });
    render(null, null, true);
  }

  function renderMistakes(code) {
    const store = getStore();
    const mistakes = store && typeof store.mistakes === "function" ? store.mistakes(code) : [];
    let body = pageHead(`${esc(code || "NUS")} · review`, "Mistakes", "Repair the ideas you missed recently. Each item keeps its source trail and misconception cue visible.");
    if (!mistakes.length) {
      const courseCode = code || defaultCourseCode();
      root.innerHTML = body + `<section class="nus-card nus-empty-state"><h3>No unresolved mistakes</h3><p>Complete a practice run first. Missed questions will appear here with a focused repair path.</p><div class="nus-lesson-actions">${button("Start a smart run", `#/nus/exam/${esc(courseCode)}`, "primary")}${button("Course map", `#/nus/course/${esc(courseCode)}`, "ghost")}${button("Back to dashboard", "#/", "ghost")}</div></section>`;
      return;
    }
      body += `<div class="nus-mistake-clinic">${mistakes.map((mistake, index) => `<article class="nus-card nus-mistake-item reveal"><div class="nus-mistake-head"><span class="pill rust">Missed</span><span class="nus-question-meta">${esc(renderer.questionLabel(mistake))}</span></div><h3>${index + 1}. ${esc(mistake.prompt || mistake.questionId)}</h3><p class="nus-mistake-cue"><b>Misconception cue:</b> ${esc(mistake.misconception || "Review the linked lesson before retrying.")}</p><details><summary>Open worked repair</summary><p>${text(mistake.solution || mistake.explanation || "Review the linked lesson.")}</p><p>${(mistake.sourceRefs || []).slice(0, 2).map(sourceItem).join(" ")}</p></details><div class="nus-card-actions">${mistake.lessonId ? button("Review lesson", `#/nus/lesson/${esc(mistake.courseCode || code || defaultCourseCode())}/${esc(mistake.lessonId)}`, "ghost") : ""}<button class="btn primary" type="button" data-redeem-mistake="${esc(mistake.questionId)}" data-attempt-event="${esc(mistake.attemptEventId || "")}">Mark repaired</button></div></article>`).join("")}</div><div class="nus-lesson-actions">${button("Run weak topics", `#/nus/exam/${esc(code || defaultCourseCode())}`, "primary")}${button("Back to course", `#/nus/course/${esc(code || defaultCourseCode())}`, "ghost")}</div>`;
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
      if (!state || state.status === "finished") return stopTimer();
      const left = Math.max(0, (state.limitMinutes * 60) - sessionApi.elapsedSeconds(state));
      const element = document.getElementById("nus-exam-timer");
      if (element) element.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      if (left <= 0) finish(true);
      else if (left % 10 === 0) persistActivePractice();
    }, 1000);
  }

  function renderResult() {
    const answers = answerRecords();
    const correct = answers.filter(answer => answer.correct).length;
    const total = state.questions.length;
    const skipped = state.skippedQuestionIds.length;
    root.innerHTML = renderer.result({ state, answers, correct, total, skipped, gradingMode, masteryEligible });
    typeset();
    return;
    /*
    // Result markup is owned by exam-renderer.
    body += `<div class="nus-result-score"><b>${Math.round(correct / Math.max(1, total) * 100)}%</b><span>${correct} correct · ${total - correct - skipped} to review · ${skipped} skipped</span></div>${total - correct ? `<div class="nus-callout nus-mistake-callout"><b>${total - correct} review item${total - correct === 1 ? "" : "s"}</b><span>Retry misses from Review; this attempt does not schedule spaced retrieval.</span>${button("Review mistakes", `#/nus/mistakes/${state.courseCode}`, "primary")}</div>` : ""}<div class="nus-review-deck">${answers.map((answer, index) => { const mode = gradingMode(answer.q); const label = mode === "exact" ? (answer.correct ? "Correct" : "Review") : (answer.correct ? "Feedback match" : "Self-review"); return `<article class="nus-review-item ${answer.correct ? "correct" : "missed"}><div><span class="pill ${answer.correct ? "sage" : ""}">${label}</span><b>${index + 1}. ${esc(answer.q.prompt)}</b></div><p><strong>Grading:</strong> ${mode === "exact" ? "deterministic local" : "heuristic feedback; no mastery evidence"}</p><p><strong>Source:</strong> ${(answer.q.sourceRefs || answer.q.lessonSourceRefs || []).slice(0, 2).map(sourceItem).join(" ")}</p><p><strong>Your answer:</strong> ${esc(answer.q.type === "mcq" ? (answer.q.choices[Number(answer.raw)] || "No choice") : answer.raw)}</p><p><strong>Worked answer:</strong> ${text(answer.q.solution || answer.q.explanation || "Review the source lesson.")}</p></article>`; }).join("")}</div><div class="nus-lesson-actions">${button("Retry misses", `#/nus/exam/${state.courseCode}`, "primary")}${button("Continue deep practice", `#/nus/exam/${state.courseCode}/deep-practice`, "ghost")}${button("Back to course", `#/nus/course/${state.courseCode}`, "ghost")}</div>`;
    root.innerHTML = body;
    */
  }

  function render(code, scope, internal) {
    const routed = !internal;
    if (!state || (routed && (state.courseCode !== (code || "all") || state.scope !== (scope || "")))) state = null;
    const selectedCode = code || defaultCourseCode();
    if (!state && routed && restoreActivePractice(selectedCode, scope)) return render(null, null, true);
    if (!state) {
      const selected = selectedCode;
      const practicePlan = practicePlanFor(selected, scope);
      root.innerHTML = renderer.setup({ courses: getCourses(), selectedCode: selected, courseCode: selected, scope, lessons: getLessons(selected), practicePlan });
      typeset();
      const courseSelect = root.querySelector("#nus-exam-course");
      const scopeSelect = root.querySelector("#nus-exam-scope");
      courseSelect.addEventListener("change", () => { location.hash = `#/nus/exam/${courseSelect.value}`; });
      scopeSelect.addEventListener("change", () => { location.hash = `#/nus/exam/${courseSelect.value}/${scopeSelect.value}`; });
      root.querySelector("#nus-start-exam").addEventListener("click", () => {
        const selectedMode = root.querySelector("#nus-exam-mode").value;
        const selectedPlan = selectedMode === "mock" ? practicePlanFor(selected, scope) : null;
        const planQuestions = questionsForPracticePlan(selected, selectedPlan);
        const questionCount = Number(root.querySelector("#nus-exam-count").value);
        const questions = selectedPlan ? planQuestions : selectedMode === "deep" ? deepPracticeQuestions(selected, questionCount, `${selected}:${Date.now()}`) : questionsFor(selected, scope === "deep-practice" ? "" : scope, root.querySelector("#nus-exam-focus").value, questionCount);
        if (!questions.length) return;
        state = sessionApi.create({
          courseCode: selected,
          mode: selectedMode,
          scope: selectedPlan ? "mixed-exam" : selectedMode === "deep" ? "deep-practice" : scope || "",
          focus: selectedPlan ? "canonical mixed" : root.querySelector("#nus-exam-focus").value,
          questions,
          startedAt: new Date().toISOString(),
          limitMinutes: selectedPlan ? Number(selectedPlan.durationMinutes) : Number(root.querySelector("#nus-exam-minutes").value)
        });
        persistActivePractice();
        render(null, null, true);
      });
      return;
    }
    if (state.status === "finished") return renderResult();
    const question = sessionApi.questionAt(state);
    if (!question) return finish();
    const answersSoFar = state.answers.length;
    const savedAnswer = sessionApi.answered(state, question.id);
    const input = question.type === "mcq"
      ? `<div class="nus-choices">${question.choices.map((choice, index) => `<label><input type="radio" name="nus-answer" value="${index}" ${savedAnswer && Number(savedAnswer.raw) === index ? "checked" : ""}><span>${esc(choice)}</span></label>`).join("")}</div>`
      : `<textarea class="nus-answer-input" id="nus-answer" rows="5" placeholder="Write your answer here…">${savedAnswer ? esc(savedAnswer.raw) : ""}</textarea>`;
    const rubricHint = question.type === "derivation" && Array.isArray(question.rubric) && question.rubric.length
      ? `<p class="nus-muted nus-rubric-hint"><b>Self-review rubric:</b> ${question.rubric.map(item => esc(item.label)).join(" · ")}. Matching all components is heuristic feedback, not a deterministic proof of correctness.</p>`
      : "";
    const questionNav = state.questions.map((item, index) => {
      const answer = sessionApi.answered(state, item.id);
      const marker = answer ? (answer.correct ? "✓" : "•") : (state.skippedQuestionIds.includes(item.id) ? "–" : "○");
      return `<button class="nus-question-nav ${index === state.currentIndex ? "is-current" : ""}" type="button" data-exam-go="${index}" aria-label="Question ${index + 1}">${marker} ${index + 1}</button>`;
    }).join("");
    root.innerHTML = renderer.question({ state, item: question, answerInput: input, rubricHint, questionNav, answersSoFar });
    typeset();
    const submit = async () => {
      const raw = question.type === "mcq" ? (root.querySelector("input[name='nus-answer']:checked") || {}).value : root.querySelector("#nus-answer").value;
      if (raw == null || !String(raw).trim()) return;
      const submitButton = root.querySelector("#nus-next-answer");
      if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Checking…"; }
      const grading = await gradeResponse(question, raw);
      state = sessionApi.answer(state, { questionId: question.id, raw, correct: grading.correct, gradingMode: grading.mode, gradingStatus: grading.status, gradedBy: grading.gradedBy, score: grading.score, feedback: grading.feedback });
      const store = getStore();
      if (store && typeof store.recordQuestionAttempt === "function") store.recordQuestionAttempt({ attemptId: state.attemptId, courseCode: state.courseCode, correct: grading.correct, raw, question, gradingMode: grading.mode, gradingStatus: grading.status, gradedBy: grading.gradedBy, score: grading.score, feedback: grading.feedback });
      if (sessionApi.isComplete(state)) finish();
      else { state = sessionApi.advance(state); persistActivePractice(); render(null, null, true); }
    };
    root.querySelector("#nus-next-answer").addEventListener("click", submit);
    root.querySelector("#nus-exam-back").addEventListener("click", () => { state = sessionApi.back(state); persistActivePractice(); render(null, null, true); });
    root.querySelector("#nus-exam-skip").addEventListener("click", () => { state = sessionApi.skip(state); if (sessionApi.isComplete(state)) finish(); else { persistActivePractice(); render(null, null, true); } });
    root.querySelectorAll("[data-exam-go]").forEach(control => control.addEventListener("click", () => { state = sessionApi.goTo(state, Number(control.dataset.examGo)); persistActivePractice(); render(null, null, true); }));
    root.querySelectorAll("input[name='nus-answer']").forEach(control => control.addEventListener("change", () => { if (question.type === "mcq") submit(); }));
    root.querySelector("#nus-answer")?.addEventListener("keydown", event => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submit(); });
    startTimer();
  }

  return Object.freeze({ render, renderMistakes, stopTimer, questionsFor, questionsForPracticePlan, deepPracticeQuestions, practicePlanFor, answerKey, gradingMode, masteryEligible });
});
