/* Assessment map feature. It turns source-backed exam and homework signals into
 * a compact revision index without presenting third-party previews as lecture truth. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_ASSESSMENT_MAP_FEATURE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createNusAssessmentMapFeature(options) {
  const { root, getAssessmentMap, getLessons, pageHead, sourceItem, text, esc, button, notFound } = options;

  function evidenceFor(map, topic, filter) {
    const evidence = (topic.evidenceIds || [])
      .map(id => (map.evidence || []).find(item => item.id === id))
      .filter(Boolean);
    if (filter === "all") return evidence;
    if (filter === "a-plus") return topic.priority === "A+ focus" ? evidence : [];
    return evidence.filter(item => item.kind === filter);
  }

  function evidenceBadge(item) {
    const tone = item.evidenceLevel === "local-exam" ? "sage" : item.evidenceLevel === "format-only" ? "" : "gold";
    return '<span class="pill ' + tone + '">' + esc(item.label) + "</span>";
  }

  function evidenceDetails(items) {
    return '<details class="nus-assessment-evidence"><summary><span>Assessment evidence</span><small>' +
      items.length + ' signal' + (items.length === 1 ? "" : "s") +
      '</small></summary><div class="nus-assessment-evidence-list">' +
      items.map(item => '<article><div class="nus-assessment-evidence-head"><b>' + esc(item.label) +
        "</b>" + evidenceBadge(item) + '</div><p>' + text(item.description) + "</p>" +
        (item.sourceRefs && item.sourceRefs.length ? '<p class="nus-assessment-source"><b>Internal source:</b> ' + item.sourceRefs.map(sourceItem).join(" ") + "</p>" : "") +
        (item.url ? '<a class="nus-external" href="' + esc(item.url) + '" target="_blank" rel="noreferrer">Open public preview ↗</a>' : "") +
        "</article>").join("") +
      "</div></details>";
  }

  function topicCard(topic, map, lessonById, filter) {
    const evidence = evidenceFor(map, topic, filter);
    if (!evidence.length) return "";
    const lessons = (topic.lessonIds || []).map(id => lessonById.get(id)).filter(Boolean);
    const lessonLinks = lessons.map(lesson => button("Study " + lesson.title, "#/nus/lesson/" + map.courseCode + "/" + lesson.id, "ghost")).join("");
    const practiceLink = lessons[0] ? button("Practice this cluster", "#/nus/exam/" + map.courseCode + "/" + lessons[0].id, "primary") : "";
    const tone = topic.priority === "A+ focus" ? "aplus" : topic.priority === "High" ? "high" : "targeted";
    return '<article class="nus-assessment-topic nus-assessment-topic-' + tone + '"><header class="nus-assessment-topic-head"><div><span class="eyebrow">' +
      esc(topic.signal) + '</span><h3>' + esc(topic.title) + '</h3></div><span class="pill gold">' + esc(topic.priority) +
      '</span></header><p class="nus-assessment-topic-scope"><b>Lecture scope:</b> ' + text(topic.lectureScope) +
      '</p><div class="nus-assessment-topic-grid"><section><b>Exam move</b><p>' + text(topic.examMove) +
      '</p></section><section><b>Practice now</b><p>' + text(topic.practice) +
      '</p></section></div><div class="nus-assessment-topic-links">' + practiceLink + lessonLinks +
      '</div>' + evidenceDetails(evidence) + "</article>";
  }

  function renderTopics(map, lessons, filter) {
    const lessonById = new Map(lessons.map(lesson => [lesson.id, lesson]));
    return (map.topics || []).map(topic => topicCard(topic, map, lessonById, filter)).join("") ||
      '<section class="nus-card nus-empty-state"><h3>No matching evidence</h3><p>Choose another evidence filter to reopen the mapped topics.</p></section>';
  }

  function renderAlgorithmFocus(map) {
    const focus = Array.isArray(map.algorithmFocus) ? map.algorithmFocus : [];
    if (!focus.length) return "";
    return '<section class="nus-card nus-algorithm-focus"><div class="nus-teach-head"><div><span class="eyebrow">Priority consolidation</span><h3>Algorithms to master first</h3></div><span class="pill gold">Assessment-linked</span></div><p class="nus-muted">The order below follows verified lecture and assignment signals. It is a study priority, not an invented final-exam syllabus.</p><div class="nus-algorithm-focus-list">' + focus.map(item => '<article class="nus-algorithm-focus-item"><div class="nus-algorithm-focus-rank"><b>' + esc(item.rank) + '</b><span>' + esc(item.tier) + '</span></div><div><h4>' + esc(item.title) + '</h4><p><b>Signal:</b> ' + esc(item.assessmentSignal) + '</p><p><b>Exam move:</b> ' + esc(item.examMove) + '</p><p class="nus-kid-analogy"><b>Kid analogy:</b> ' + esc(item.kidAnalogy) + '</p><div class="nus-card-actions">' + button("Study lesson", '#/nus/lesson/' + map.courseCode + '/' + item.lessonId, "ghost") + button("Practice", '#/nus/exam/' + map.courseCode + '/' + item.lessonId, "primary") + '</div></div></article>').join('') + '</div></section>';
  }

  function render(code) {
    const map = getAssessmentMap(code);
    if (!map) return notFound();
    const lessons = getLessons(code);
    const practicePlan = map.practicePlan && Array.isArray(map.practicePlan.questionIds) ? map.practicePlan : null;
    const localExamCount = (map.evidence || []).filter(item => item.evidenceLevel === "local-exam").length;
    const homeworkCount = (map.evidence || []).filter(item => item.kind === "homework").length;
    const topicCount = (map.topics || []).length;
    const studyHeading = localExamCount ? "Study what has actually been tested" : "Study what has verified assessment evidence";
    const body = pageHead(esc(code) + " · assessment map", map.title, map.summary);
    root.innerHTML = body +
      '<section class="nus-card nus-assessment-map-intro"><div class="nus-assessment-map-intro-head"><div><span class="eyebrow">Revision control panel</span><h3>' + studyHeading + '</h3></div><span class="pill violet">Lecture ≠ assessment evidence</span></div><p>' +
      text(map.disclaimer) + '</p><div class="nus-assessment-map-rule"><b>Use the map in this order:</b><span>read the lecture core → do the mapped derivation or numerical move → practise the evidence-backed format → log the mistake.</span></div></section>' +
      (practicePlan ? '<section class="nus-card nus-assessment-practice"><div><span class="eyebrow">Ready-to-run checkpoint</span><h3>' + esc(practicePlan.title || "Timed mixed exam") + '</h3><p>' + esc(practicePlan.questionCount || practicePlan.questionIds.length) + ' questions · ' + esc(practicePlan.durationMinutes) + ' minutes · ' + esc((practicePlan.mistakeClinic || []).length) + '-step Mistake Clinic.</p></div><div class="nus-card-actions">' + button("Start timed mixed exam", "#/nus/exam/" + map.courseCode + "/mixed-exam", "primary") + '</div></section>' : '') +
      renderAlgorithmFocus(map) +
      '<div class="nus-assessment-map-stats"><div class="nus-card"><b>' + topicCount + '</b><span>mapped topic clusters</span></div><div class="nus-card"><b>' +
      localExamCount + '</b><span>local exam signals</span></div><div class="nus-card"><b>' + homeworkCount +
      '</b><span>homework signals</span></div><div class="nus-card"><b>' + (map.evidence || []).length +
      '</b><span>evidence records</span></div></div>' +
      '<section class="nus-card nus-assessment-map-controls"><label><span>Filter evidence</span><select id="nus-assessment-map-filter"><option value="all">All mapped evidence</option><option value="past-exam">Past exams only</option><option value="homework">Homework only</option><option value="midterm">Midterm preview only</option><option value="a-plus">A+ focus clusters</option></select></label><p class="nus-muted">Local exams are stronger signals; official assignments and source-backed practice are still study evidence, not a final-exam guarantee.</p></section>' +
      '<div id="nus-assessment-map-topics" class="nus-assessment-map-topics">' + renderTopics(map, lessons, "all") + '</div>' +
      '<section class="nus-card nus-assessment-map-order"><div class="nus-teach-head"><h3>Recommended revision order</h3><span class="pill gold">From derivation to transfer</span></div><div class="nus-assessment-map-order-grid">' +
      (map.studyOrder || []).map((lane, index) => '<article><span>' + (index + 1) + '</span><div><h4>' + esc(lane.label) + '</h4><p>' + text(lane.description) +
        '</p><small>' + lane.topicIds.length + ' topic cluster' + (lane.topicIds.length === 1 ? "" : "s") + '</small></div></article>').join("") +
      "</div></section>";
    const filter = root.querySelector("#nus-assessment-map-filter");
    filter.addEventListener("change", () => {
      root.querySelector("#nus-assessment-map-topics").innerHTML = renderTopics(map, lessons, filter.value);
    });
  }

  return Object.freeze({ render });
});
