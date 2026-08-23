/* Planner feature. It owns assessment rendering and study-store bindings,
 * while the NUS entrypoint supplies data and shared presentation helpers. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_PLANNER_FEATURE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createNusPlannerFeature(options) {
  const {
    root,
    getAssessments,
    getStore,
    pageHead,
    button,
    dayCount,
    fmtDate,
    formatAssessmentDate,
    formatAssessmentWeight,
    statusPill,
    sourceLabel,
    esc
  } = options;

  function pendingTiming(assessment) {
    const timing = assessment && assessment.timing;
    if (timing && timing.granularity === "week" && Number.isInteger(timing.week)) {
      return {
        label: `Week ${timing.week} confirmed`,
        detail: "Exact session/time pending"
      };
    }
    if (timing && timing.status === "confirmed" && timing.description) {
      return {
        label: "Timing partially confirmed",
        detail: timing.description
      };
    }
    return {
      label: "Date pending",
      detail: "Do not guess"
    };
  }

  function render() {
    const store = getStore();
    let body = pageHead(
      "Plan",
      "What is coming next?",
      "Confirmed assessments appear here with the next useful preparation step. Dates stay pending until an official source confirms them."
    );
    body += `<div class="nus-callout"><b>Plan with confidence</b><span>Confirmed dates surface at 7, 3, and 1 day. Partially confirmed timing stays visible without inventing a date or time.</span></div>`;
    body += `<div class="nus-planner-list">${getAssessments().map(assessment => {
      const task = store.task(assessment.id);
      const checks = Array.isArray(task.checks) ? task.checks : [];
      const done = checks.filter(Boolean).length;
      const days = dayCount(assessment.date);
      const urgency = days != null && days <= 7 && days >= 0 ? "urgent" : "";
      const routeButton = typeof button === "function" ? button : (label, href, cls) => `<a class="btn ${cls || "ghost"}" href="${esc(href)}" data-route>${esc(label)}</a>`;
      const pending = pendingTiming(assessment);
      const dateLabel = typeof formatAssessmentDate === "function" ? formatAssessmentDate(assessment) : fmtDate(assessment.date);
      const weightLabel = typeof formatAssessmentWeight === "function" ? formatAssessmentWeight(assessment) : (assessment.weight != null ? `${assessment.weight}%` : "Weight pending");
      return `<article class="nus-assessment ${urgency}"><div class="nus-assessment-head"><div><span class="nus-code">${esc(assessment.courseCode)}</span><h3>${esc(assessment.title)}</h3></div><div class="nus-assessment-meta">${assessment.date ? `<b>${esc(dateLabel)}</b><span>${days < 0 ? "overdue" : `${days} days left`}</span>` : `<b>${esc(pending.label)}</b><span>${esc(pending.detail)}</span>`}</div></div><div class="nus-assessment-line"><span>${esc(assessment.kind)} · ${esc(weightLabel)}</span><span>${statusPill(task.status)} · ${done}/${assessment.checklist.length} checklist items</span></div><div class="nus-assessment-controls"><label>Status <select data-nus-status="${esc(assessment.id)}"><option value="todo" ${task.status === "todo" ? "selected" : ""}>To do</option><option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In progress</option><option value="done" ${task.status === "done" ? "selected" : ""}>Done</option></select></label>${assessment.source ? `<span class="nus-source">Source: ${esc(sourceLabel(assessment.source))}</span>` : ""}</div><div class="nus-assessment-links">${routeButton("Study course", `#/nus/course/${assessment.courseCode}`, "ghost")}${routeButton("Practice", `#/nus/exam/${assessment.courseCode}`, "ghost")}</div><div class="nus-checklist">${assessment.checklist.map((item, index) => `<label><input type="checkbox" data-nus-check="${esc(assessment.id)}" data-index="${index}" ${checks[index] ? "checked" : ""}><span>${esc(item)}</span></label>`).join("")}</div></article>`;
    }).join("")}</div>`;
    root.innerHTML = body;
    root.querySelectorAll("[data-nus-status]").forEach(element => element.addEventListener("change", () => {
      store.setTask(element.dataset.nusStatus, { status: element.value });
      render();
    }));
    root.querySelectorAll("[data-nus-check]").forEach(element => element.addEventListener("change", () => {
      store.toggleCheck(element.dataset.nusCheck, Number(element.dataset.index));
      render();
    }));
  }

  return Object.freeze({ render, pendingTiming });
});
