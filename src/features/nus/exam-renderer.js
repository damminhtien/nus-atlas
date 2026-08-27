/* Pure Exam Mode markup. Selection, lifecycle, and persistence stay outside
 * this module so the UI can evolve without changing practice semantics. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_EXAM_RENDERER = factory;
})(typeof globalThis === "object" ? globalThis : this, function createExamRenderer(options) {
  const { pageHead, sourceItem, text, esc, button } = options;

  function questionLabel(question) {
    const layer = question.assessmentLayer || (question.origin === "synthetic" ? "synthetic" : "");
    const layerLabel = layer === "generated-practice" ? "Generated practice" : layer;
    return `${layerLabel ? `${layerLabel} · ` : ""}${question.difficulty || "medium"} · ${question.skill || "explain"} · ${question.estimatedSeconds || 90}s`;
  }

  function setup(input) {
    const { courses, selectedCode, scope, lessons, practicePlan } = input;
    const mockRoute = scope === "mixed-exam" && !!practicePlan;
    const deepRoute = scope === "deep-practice";
    const optionsHtml = courses.map(course => `<option value="${esc(course.code)}" ${course.code === selectedCode ? "selected" : ""}>${esc(course.code)} · ${esc(course.title)}</option>`).join("");
    const scopeOptions = `${practicePlan ? `<option value="mixed-exam" ${mockRoute ? "selected" : ""}>Canonical timed mixed exam · ${esc(practicePlan.durationMinutes)} min</option>` : ""}<option value="deep-practice" ${deepRoute ? "selected" : ""}>Deep practice · generated variations</option><option value="" ${!scope ? "selected" : ""}>All core lessons</option>${lessons.map(lesson => `<option value="${esc(lesson.id)}" ${scope === lesson.id ? "selected" : ""}>${esc(lesson.title)}${lesson.examEligible === false ? " · supplementary" : ""}</option>`).join("")}`;
    const countOptions = `<option value="5">5 questions</option><option value="8">8 questions</option><option value="10" ${!practicePlan && !deepRoute ? "selected" : ""}>10 questions</option><option value="12" ${practicePlan || deepRoute ? "selected" : ""}>12 questions</option><option value="20">20 questions · deep</option>`;
    const timeOptions = `<option value="15">15 minutes</option><option value="30" ${practicePlan || deepRoute ? "" : "selected"}>30 minutes</option><option value="45" ${deepRoute ? "selected" : ""}>45 minutes</option><option value="90" ${practicePlan ? "selected" : ""}>90 minutes · canonical mock</option>`;
    const planCopy = mockRoute ? `<div class="nus-callout nus-practice-plan"><b>Mock exam</b><span>${esc(practicePlan.questionCount || practicePlan.questionIds.length)} questions · ${esc(practicePlan.durationMinutes)} minutes. Answers and explanations stay hidden until submission.</span></div>` : deepRoute ? `<div class="nus-callout"><b>Deep practice</b><span>Fresh deterministic variations are generated on demand for weighted OLS, SVM, PCA, GMM/EM, backpropagation, and MDP value iteration. Generated items are practice only.</span></div>` : `<div class="nus-callout"><b>Adaptive practice</b><span>Atlas prioritizes due retrievals, unresolved mistakes, weak skills, unseen concepts, assessment signals, and current-week lessons. Every choice is explainable.</span></div>`;
    const modeOptions = `<option value="adaptive" ${mockRoute || deepRoute ? "" : "selected"}>Adaptive practice</option><option value="deep" ${deepRoute ? "selected" : ""}>Deep practice</option><option value="mock" ${mockRoute ? "selected" : ""}>Mock exam</option>`;
    return pageHead("NUS practice", "Practice", "Adaptive practice is the default. Use Mock exam for a timed exam-style simulation. MCQs are exact; open responses are clearly labeled feedback until verified.") + `<section class="nus-card nus-exam-setup reveal"><div class="nus-exam-setup-grid"><label>Course<select id="nus-exam-course">${optionsHtml}</select></label><label>Scope<select id="nus-exam-scope">${scopeOptions}</select></label><label>Mode<select id="nus-exam-mode">${modeOptions}</select></label><label>Focus<select id="nus-exam-focus"><option value="smart">Smart mix</option><option value="weakness">Weak topics</option><option value="new">New concepts</option><option value="mixed">Mixed retrieval</option></select></label><label>Questions<select id="nus-exam-count">${countOptions}</select></label><label>Time<select id="nus-exam-minutes">${timeOptions}</select></label></div>${planCopy}<div class="nus-card-actions"><button class="btn primary" id="nus-start-exam">Start practice</button>${button("Course map", `#/nus/course/${esc(selectedCode)}`, "ghost")}${button("Mistakes", `#/nus/mistakes/${esc(selectedCode)}`, "ghost")}</div></section>`;
  }

  function question(input) {
    const { state, item, answerInput, rubricHint, questionNav, answersSoFar } = input;
    return pageHead(`${esc(state.courseCode)} · Question ${state.currentIndex + 1}/${state.questionIds.length}`, state.mode === "mock" ? "Mock exam" : "Practice", item.lessonTitle) + `<div class="nus-exam-bar"><span>Time left <b id="nus-exam-timer">--:--</b></span><span>${answersSoFar} answered</span><span>${esc(state.focus || "smart")} · ${state.questionIds.length} questions</span></div><section class="nus-card nus-exam-question reveal"><div class="nus-question-source">${(item.sourceRefs || item.lessonSourceRefs || []).slice(0, 2).map(sourceItem).join(" ")}</div><div class="nus-question-meta"><span>${esc(questionLabel(item))}</span><span>${esc(item.cognitiveLevel || "understand")}</span></div><h3>${esc(item.prompt)}</h3>${item.selectionReasons && item.selectionReasons.length ? `<p class="nus-callout nus-question-why"><b>Why this question?</b><span>${esc(item.selectionReasons.join(" · "))}.</span></p>` : ""}${rubricHint}${answerInput}<div class="nus-exam-footer"><span class="nus-muted">Answer reveal is locked until the attempt ends.</span><div class="nus-exam-footer-actions"><button class="btn ghost" id="nus-exam-back" type="button" ${state.currentIndex === 0 ? "disabled" : ""}>Back</button><button class="btn ghost" id="nus-exam-skip" type="button">Skip</button>${item.lessonId ? button("Review lesson", `#/nus/lesson/${esc(state.courseCode)}/${esc(item.lessonId)}`, "ghost") : ""}<button class="btn primary" id="nus-next-answer">${state.currentIndex + 1 === state.questionIds.length ? "Save & finish" : "Save & next"}</button></div></div><nav class="nus-question-navigator" aria-label="Question navigator">${questionNav}</nav></section>`;
  }

  function result(input) {
    const { state, answers, correct, total, skipped, gradingMode, masteryEligible } = input;
    const exactAnswers = answers.filter(answer => masteryEligible(answer.q));
    const exactCorrect = exactAnswers.filter(answer => answer.correct).length;
    const aiAssisted = answers.filter(answer => answer.gradedBy === "ai").length;
    const selfReview = answers.filter(answer => answer.gradedBy !== "local" && answer.gradedBy !== "ai").length;
    const gradingSummary = `${exactCorrect}/${exactAnswers.length} exact · ${aiAssisted} AI-assisted · ${selfReview} self-review`;
    let body = pageHead(`${esc(state.courseCode)} · review`, "Practice complete", `${gradingSummary}. Only deterministic local grades contribute mastery evidence.`);
    const breakdown = { skill: new Map(), topic: new Map(), cognitiveLevel: new Map() };
    answers.forEach(answer => ["skill", "topic", "cognitiveLevel"].forEach(dimension => {
      const key = answer.q[dimension] || "general";
      const current = breakdown[dimension].get(key) || { total: 0, correct: 0 };
      current.total += 1;
      if (answer.correct) current.correct += 1;
      breakdown[dimension].set(key, current);
    }));
    const weakest = dimension => [...breakdown[dimension]].sort((left, right) => left[1].correct / left[1].total - right[1].correct / right[1].total || right[1].total - left[1].total);
    const breakdownGroup = (label, dimension) => `<div><b>${label}</b><div class="nus-result-breakdown-grid">${weakest(dimension).slice(0, 4).map(([key, item]) => `<div><b>${esc(key)}</b><span>${item.correct}/${item.total} correct · ${Math.round(item.correct / item.total * 100)}%</span></div>`).join("") || "<p class=\"nus-muted\">No scored answers yet.</p>"}</div></div>`;
    const weakConcepts = weakest("skill").slice(0, 3).map(([key]) => key);
    body += `<section class="nus-card nus-result-breakdown"><div class="nus-teach-head"><h3>What to review next</h3><span class="pill">${esc(state.mode === "deep" ? "Generated practice" : state.mode === "mock" ? "Mock exam" : "Adaptive practice")}</span></div>${breakdownGroup("By skill", "skill")}${breakdownGroup("By topic", "topic")}${breakdownGroup("By cognitive level", "cognitiveLevel")}${weakConcepts.length ? `<p class="nus-muted"><strong>Top weak concepts:</strong> ${weakConcepts.map(key => esc(key)).join(" · ")}</p>` : ""}</section>`;
    body += `<div class="nus-result-score"><b>${Math.round(correct / Math.max(1, total) * 100)}%</b><span>${correct} correct · ${total - correct - skipped} to review · ${skipped} skipped</span></div>${total - correct ? `<div class="nus-callout nus-mistake-callout"><b>${total - correct} review item${total - correct === 1 ? "" : "s"}</b><span>Retry misses from Review; this attempt does not schedule spaced retrieval.</span>${button("Review mistakes", `#/nus/mistakes/${state.courseCode}`, "primary")}</div>` : ""}<div class="nus-review-deck">${answers.map((answer, index) => { const mode = gradingMode(answer.q); const label = mode === "exact" ? (answer.correct ? "Correct" : "Review") : (answer.correct ? "Feedback match" : "Self-review"); return `<article class="nus-review-item ${answer.correct ? "correct" : "missed"}"><div><span class="pill ${answer.correct ? "sage" : ""}">${label}</span><b>${index + 1}. ${esc(answer.q.prompt)}</b></div><p><strong>Grading:</strong> ${mode === "exact" ? "deterministic local" : "heuristic feedback; no mastery evidence"}</p><p><strong>Source:</strong> ${(answer.q.sourceRefs || answer.q.lessonSourceRefs || []).slice(0, 2).map(sourceItem).join(" ")}</p><p><strong>Your answer:</strong> ${esc(answer.q.type === "mcq" ? (answer.q.choices[Number(answer.raw)] || "No choice") : answer.raw)}</p><p><strong>Worked answer:</strong> ${text(answer.q.solution || answer.q.explanation || "Review the source lesson.")}</p></article>`; }).join("")}</div><div class="nus-lesson-actions">${button("Retry misses", `#/nus/exam/${state.courseCode}`, "primary")}${button("Continue deep practice", `#/nus/exam/${state.courseCode}/deep-practice`, "ghost")}${button("Back to course", `#/nus/course/${state.courseCode}`, "ghost")}</div>`;
    return body;
  }

  return Object.freeze({ questionLabel, setup, question, result });
});
