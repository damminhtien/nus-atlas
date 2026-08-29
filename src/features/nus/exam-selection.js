/* Deterministic practice selection. The renderer owns UI state; this module
 * only ranks eligible questions and chooses a diverse, explainable set. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_EXAM_SELECTION = factory;
})(typeof globalThis === "object" ? globalThis : this, function createExamSelection(options) {
  const config = options || {};
  const getLessons = typeof config.getLessons === "function" ? config.getLessons : () => [];
  const getStore = typeof config.getStore === "function" ? config.getStore : () => null;
  const getAssessmentMap = typeof config.getAssessmentMap === "function" ? config.getAssessmentMap : () => null;
  const getCurrentWeek = typeof config.getCurrentWeek === "function" ? config.getCurrentWeek : null;

  const PRIORITY_SCORES = {
    "A+ focus": 60,
    "High-yield": 52,
    "High-yield bridge": 48,
    Targeted: 40,
    Core: 30
  };

  function number(value, fallback = 0) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function questionStats(question) {
    const store = getStore();
    return store && typeof store.questionStats === "function"
      ? store.questionStats(question.id)
      : { attempts: 0, correct: 0, misses: 0, accuracy: 0 };
  }

  function lessonOrder(lesson) {
    return [number(lesson.sequence, Number.MAX_SAFE_INTEGER), number(lesson.week, Number.MAX_SAFE_INTEGER), number(lesson.orderInWeek, Number.MAX_SAFE_INTEGER), String(lesson.id || "")];
  }

  function compareLessonOrder(left, right) {
    const a = lessonOrder(left), b = lessonOrder(right);
    for (let index = 0; index < a.length - 1; index += 1) if (a[index] !== b[index]) return a[index] - b[index];
    return a.at(-1).localeCompare(b.at(-1));
  }

  function assessmentPriority(code) {
    const map = getAssessmentMap(code) || {};
    const result = new Map();
    (map.topics || []).forEach(topic => (topic.lessonIds || []).forEach(lessonId => {
      const score = PRIORITY_SCORES[topic.priority] || 20;
      result.set(lessonId, Math.max(result.get(lessonId) || 0, score));
    }));
    return result;
  }

  function retrievalSignals(code) {
    const store = getStore();
    const due = store && typeof store.dueRetrievals === "function" ? store.dueRetrievals(code) : [];
    return new Map(due.map(item => [item.lessonId, item]));
  }

  function mistakeIds(code) {
    const store = getStore();
    return new Set(store && typeof store.mistakes === "function" ? store.mistakes(code).map(item => item.questionId).filter(Boolean) : []);
  }

  function isQuestionExamEligible(lesson, question) {
    return question && question.examEligible !== undefined
      ? question.examEligible === true
      : !!lesson && lesson.examEligible !== false;
  }

  function eligibleQuestions(code, scope) {
    return getLessons(code)
      .filter(lesson => lesson)
      .filter(lesson => !scope || scope === "mixed-exam" || lesson.id === scope)
      .sort(compareLessonOrder)
      .flatMap(lesson => (lesson.questions || [])
        .filter(question => isQuestionExamEligible(lesson, question))
        .map((question, index) => ({
          ...question,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonSourceRefs: lesson.sourceRefs || [],
          lessonWeek: lesson.week,
          lessonSequence: lesson.sequence,
          questionOrder: index
        })));
  }

  function rankedQuestions(input) {
    const request = input || {};
    const code = request.courseCode || request.code;
    const scope = request.scope || "";
    const focus = request.focus || "smart";
    const excluded = new Set(request.excludeQuestionIds || []);
    const questions = eligibleQuestions(code, scope).filter(question => !excluded.has(question.id));
    const priorities = assessmentPriority(code);
    const retrieval = retrievalSignals(code);
    const mistakes = mistakeIds(code);
    const currentWeek = request.currentWeek != null
      ? number(request.currentWeek, null)
      : (getCurrentWeek ? number(getCurrentWeek(code), null) : null);
    const hasLearnerSignal = questions.some(question => questionStats(question).attempts > 0) || retrieval.size > 0 || mistakes.size > 0;

    return questions.map((question, index) => {
      const stats = questionStats(question);
      const dueRetrieval = retrieval.get(question.lessonId);
      const due = dueRetrieval ? 200 + (dueRetrieval.lastQuestionId === question.id ? 20 : 0) : 0;
      const unresolvedMistake = mistakes.has(question.id) ? 140 : 0;
      const lowAccuracy = stats.attempts && stats.accuracy < 0.8 ? 55 + stats.misses * 15 : 0;
      const novelty = stats.attempts ? 0 : 35;
      const priority = priorities.get(question.lessonId) || 0;
      const week = currentWeek && number(question.lessonWeek, 0) === currentWeek ? 18 : 0;
      const difficulty = question.difficulty === "hard" ? 8 : question.difficulty === "medium" ? 4 : 0;
      const focusScore = focus === "weakness"
        ? unresolvedMistake + lowAccuracy + due + difficulty
        : focus === "new"
          ? novelty + priority / 3 + week
          : focus === "mixed"
            ? due + unresolvedMistake + lowAccuracy / 2 + novelty / 2 + priority / 2 + week
            : due + unresolvedMistake + lowAccuracy + novelty + priority + week + difficulty;
      const reasons = [];
      if (due) reasons.push("retrieval is due");
      if (unresolvedMistake) reasons.push("you missed this recently");
      if (lowAccuracy) reasons.push("accuracy is developing");
      if (novelty) reasons.push("new concept");
      if (priority) reasons.push("assessment priority");
      if (week) reasons.push("current week");
      return {
        question,
        stats,
        score: focusScore,
        reasons,
        hasSignal: !!(due || unresolvedMistake || lowAccuracy || priority || week),
        index,
        chronologicalIndex: index
      };
    }).sort((left, right) => right.score - left.score || left.chronologicalIndex - right.chronologicalIndex);
  }

  function selectQuestions(input) {
    const request = input || {};
    const limit = Math.max(1, number(request.limit, Infinity));
    const ranked = rankedQuestions(request);
    if (!ranked.length) return [];
    const noSignals = ranked.every(item => !item.hasSignal);
    if (noSignals && (request.focus || "smart") === "smart") return ranked.slice().sort((a, b) => a.chronologicalIndex - b.chronologicalIndex).slice(0, limit).map(item => decorate(item, ["chronological course order"]));

    const selected = [];
    const seen = new Set();
    const seenSkills = new Set();
    const seenTopics = new Set();
    const targetDiversity = Math.min(limit, new Set(ranked.map(item => item.question.skill || item.question.topic || "general")).size);
    for (const item of ranked) {
      if (selected.length >= limit) break;
      const skill = item.question.skill || "general";
      const topic = item.question.topic || "general";
      if (seen.has(item.question.id)) continue;
      if (selected.length < targetDiversity && (seenSkills.has(skill) || seenTopics.has(topic))) continue;
      selected.push(decorate(item));
      seen.add(item.question.id);
      seenSkills.add(skill);
      seenTopics.add(topic);
    }
    for (const item of ranked) {
      if (selected.length >= limit) break;
      if (!seen.has(item.question.id)) {
        selected.push(decorate(item));
        seen.add(item.question.id);
      }
    }
    return selected;
  }

  function decorate(item, extraReasons) {
    return {
      ...item.question,
      selectionScore: item.score,
      selectionReasons: [...(extraReasons || item.reasons), ...(item.reasons.length ? [] : ["course practice"])],
      selectionStats: item.stats
    };
  }

  return Object.freeze({ eligibleQuestions, rankedQuestions, selectQuestions, compareLessonOrder, isQuestionExamEligible });
});
