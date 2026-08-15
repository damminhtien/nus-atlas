/* Planner feature. It owns assessment rendering and study-store bindings,
 * while the NUS entrypoint supplies data and shared presentation helpers. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.NUS_PLANNER_FEATURE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createNusPlannerFeature(options) {
  const {
    root,
    getAssessments,
    getStore,
    pageHead,
    dayCount,
    fmtDate,
    statusPill,
    sourceLabel,
    esc
  } = options;

  function render() {
    const store = getStore();
    let body = pageHead(
      "NUS planner",
      "Deadlines, checklists, and reminders",
      "Use status and checklist items to turn each assessment into a reverse study plan. Dates come from local course sources or the NUSMods snapshot."
    );
    body += `<div class="nus-callout"><b>Reminder policy</b><span>Confirmed dates surface at 7, 3, and 1 day. “Date pending” stays visible until you confirm it yourself.</span></div>`;
    body += `<div class="nus-planner-list">${getAssessments().map(assessment => {
      const task = store.task(assessment.id);
      const checks = Array.isArray(task.checks) ? task.checks : [];
      const done = checks.filter(Boolean).length;
      const days = dayCount(assessment.date);
      const urgency = days != null && days <= 7 && days >= 0 ? "urgent" : "";
      return `<article class="nus-assessment ${urgency}"><div class="nus-assessment-head"><div><span class="nus-code">${esc(assessment.courseCode)}</span><h3>${esc(assessment.title)}</h3></div><div class="nus-assessment-meta">${assessment.date ? `<b>${esc(fmtDate(assessment.date))}</b><span>${days < 0 ? "overdue" : `${days} days left`}</span>` : `<b>Date pending</b><span>Do not guess</span>`}</div></div><div class="nus-assessment-line"><span>${esc(assessment.kind)} · ${assessment.weight}%</span><span>${statusPill(task.status)} · ${done}/${assessment.checklist.length} checklist items</span></div><div class="nus-assessment-controls"><label>Status <select data-nus-status="${esc(assessment.id)}"><option value="todo" ${task.status === "todo" ? "selected" : ""}>To do</option><option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In progress</option><option value="done" ${task.status === "done" ? "selected" : ""}>Done</option></select></label>${assessment.source ? `<span class="nus-source">Source: ${esc(sourceLabel(assessment.source))}</span>` : ""}</div><div class="nus-checklist">${assessment.checklist.map((item, index) => `<label><input type="checkbox" data-nus-check="${esc(assessment.id)}" data-index="${index}" ${checks[index] ? "checked" : ""}><span>${esc(item)}</span></label>`).join("")}</div></article>`;
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

  return Object.freeze({ render });
});
