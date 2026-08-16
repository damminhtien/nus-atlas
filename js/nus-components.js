(function () {
  "use strict";
  const repository = () => window.ATLAS_REPOSITORY || null;
  const sourceTypes = () => repository() && repository().getSourceTypes ? repository().getSourceTypes() : {};
  const studyStore = () => window.ATLAS_STUDY_STORE || null;
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch]));
  function mathSource(value) {
    const source = String(value == null ? "" : value).trim();
    if (source.startsWith("$$") && source.endsWith("$$")) return source.slice(2, -2).trim();
    if (source.startsWith("$") && source.endsWith("$")) return source.slice(1, -1).trim();
    if (source.startsWith("\\[") && source.endsWith("\\]")) return source.slice(2, -2).trim();
    if (source.startsWith("\\(") && source.endsWith("\\)")) return source.slice(2, -2).trim();
    return source;
  }
  const mathMarkup = value => `$${esc(mathSource(value))}$`;
  const sourceLabel = ref => `${ref.sourceId}${ref.page ? ` · p.${ref.page}` : ""}`;
  const routeLink = (label, href, cls = "ghost") => `<a class="btn ${cls}" href="${esc(href)}" data-route>${esc(label)}</a>`;
  const sourceRefs = lab => (lab.sourceRefs || []).map(ref => `<span class="nus-lab-source-ref"><b>${esc((sourceTypes()[ref.sourceType] || {}).shortLabel || ref.sourceType)}</b> ${esc(sourceLabel(ref))}</span>`).join("");
  const sourceSummary = lab => {
    const refs = lab.sourceRefs || [];
    const counts = refs.reduce((out, ref) => {
      const label = (sourceTypes()[ref.sourceType] || {}).shortLabel || ref.sourceType || "Source";
      out[label] = (out[label] || 0) + 1;
      return out;
    }, {});
    return [`${refs.length} ref${refs.length === 1 ? "" : "s"}`, ...Object.entries(counts).map(([label, count]) => `${count} ${label}`)].join(" · ");
  };
  function sourceLensMarkup(lens) {
    if (!lens) return "";
    const groups = [["Lecture scope", lens.lecture], ["Official exercise depth", lens.officialExercise], ["Textbook depth", lens.textbook], ["Reference / assessment", lens.reference]]
      .filter(([, refs]) => Array.isArray(refs) && refs.length)
      .map(([label, refs]) => `<div class="nus-source-lens-group"><b>${esc(label)}</b><ul class="nus-source-list">${refs.map(ref => `<li><span class="pill">${esc((sourceTypes()[ref.sourceType] || {}).shortLabel || ref.sourceType)}</span> <span>${esc(sourceLabel(ref))}</span><small>${esc(ref.role || "")}</small></li>`).join("")}</ul></div>`).join("");
    return `<details class="nus-source-lens"><summary><span>Why is this examinable?</span><span class="pill gold">A+ · ${esc(lens.status || "scope mapped")}</span></summary>${lens.whyExaminable ? `<p class="nus-source-lens-why">${esc(lens.whyExaminable)}</p>` : ""}<div class="nus-source-lens-grid">${groups}</div></details>`;
  }
  const shell = (lab, body) => `<section id="nus-lab-${esc(lab.lessonId)}" class="nus-lab nus-lab-${esc(lab.type)} reveal" data-nus-lab="${esc(lab.lessonId)}" data-reduced-motion="${lab.reducedMotion ? "true" : "false"}" aria-labelledby="nus-lab-title-${esc(lab.lessonId)}"><header class="nus-lab-head"><div><span class="pill violet">Visual learning lab</span><h3 id="nus-lab-title-${esc(lab.lessonId)}">${esc(lab.title)}</h3></div><span class="nus-lab-status" data-lab-status aria-live="polite">Not attempted</span></header><p class="nus-lab-goal"><b>Learning goal</b> ${esc(lab.learningGoal)}</p><div class="nus-lab-links">${routeLink("Course map", `#/nus/course/${lab.courseCode}`)}${routeLink("Practice this lesson", `#/nus/exam/${lab.courseCode}/${lab.lessonId}`, "primary")}</div>${body}${sourceLensMarkup(lab.sourceLens)}<footer class="nus-lab-foot"><details class="nus-lab-source-details"><summary><span>Sources</span><small>${esc(sourceSummary(lab))}</small></summary><p class="nus-lab-source-note">Lecture is the core; textbook and reference material are optional depth.</p><div class="nus-lab-sources">${sourceRefs(lab)}</div></details><details class="nus-lab-why"><summary>Why this interaction?</summary><p>${esc(lab.explanation || "Use the controls to make one explicit reasoning move, then explain the evidence.")}</p></details></footer></section>`;
  function complete(lab, root) {
    const input = root.querySelector("input[type=range]"), steps = [...root.querySelectorAll("[data-step]")];
    const selected = root.querySelector("[data-lab-choice].is-selected");
    const state = { complexity: input && input.id.includes("complexity") ? Number(input.value) : null, margin: input && input.id.includes("margin") ? Number(input.value) : null, choice: selected ? selected.dataset.labChoice : null, step: Math.max(0, steps.findIndex(step => step.classList.contains("active"))) };
    if (typeof lab.check === "function" && !lab.check(state)) {
      const status = root.querySelector("[data-lab-status]");
      if (status) status.textContent = "Complete the reasoning step first";
      return;
    }
    const result = studyStore() && studyStore().recordSimulation(`${lab.courseCode || "nus"}:${lab.lessonId}`, lab.courseCode, lab.lessonId);
    const status = root.querySelector("[data-lab-status]");
    if (status) status.textContent = result && result.duplicate ? "Already logged · repeat to reason" : "Evidence logged · +10 XP";
    root.classList.add("is-complete");
  }
  function compare(lab) {
    const id = `nus-lab-${lab.lessonId}`;
    return shell(lab, `<div class="nus-lab-controls"><label class="nus-lab-control" for="${id}-complexity">Model complexity <output id="${id}-complexity-value">42</output><input id="${id}-complexity" type="range" min="0" max="100" value="42" aria-describedby="${id}-summary"></label><button class="btn primary" type="button" data-lab-complete>Commit comparison</button></div><div class="nus-lab-stage nus-lab-bars" id="${id}-stage"><div class="nus-lab-bar-row"><span>Training risk</span><div class="nus-lab-track"><i data-train-bar></i></div><b data-train-value>29</b></div><div class="nus-lab-bar-row"><span>Validation risk</span><div class="nus-lab-track"><i data-valid-bar></i></div><b data-valid-value>28</b></div><p id="${id}-summary" class="nus-lab-status-text" aria-live="polite">Moderate complexity: compare both risks before choosing.</p></div>`);
  }
  function geometry(lab) {
    const id = `nus-lab-${lab.lessonId}`;
    return shell(lab, `<div class="nus-lab-controls"><label class="nus-lab-control" for="${id}-margin">Margin width <output id="${id}-margin-value">2.0</output><input id="${id}-margin" type="range" min="1" max="4" step="0.1" value="2" aria-describedby="${id}-geometry-summary"></label><button class="btn primary" type="button" data-lab-complete>Commit boundary</button></div><div class="nus-lab-stage nus-geometry-stage"><svg viewBox="0 0 360 170" role="img" aria-label="Two classes separated by a tunable margin"><line x1="180" y1="22" x2="180" y2="148" stroke="currentColor" stroke-width="2" data-margin-line></line><line x1="${180 - 28}" y1="22" x2="${180 - 28}" y2="148" stroke="currentColor" stroke-dasharray="4 4" opacity=".45"></line><line x1="${180 + 28}" y1="22" x2="${180 + 28}" y2="148" stroke="currentColor" stroke-dasharray="4 4" opacity=".45"></line><circle cx="85" cy="54" r="7" class="class-a"></circle><circle cx="110" cy="105" r="7" class="class-a"></circle><circle cx="270" cy="62" r="7" class="class-b"></circle><circle cx="245" cy="116" r="7" class="class-b"></circle><text x="18" y="160">class A</text><text x="286" y="160">class B</text></svg><p id="${id}-geometry-summary" class="nus-lab-status-text" aria-live="polite">The solid line is the decision boundary; dashed lines show the margin edges.</p></div>`);
  }
  function mathStepper(lab) {
    const id = `nus-lab-${lab.lessonId}`;
    const steps = [
      ["1 · Center", String.raw`x_c=x-\mu`, "Subtract the feature mean so the origin represents the data center."],
      ["2 · Find directions", String.raw`C=\frac{1}{n}X_c^\top X_c`, "The covariance structure identifies directions with large projected variance."],
      ["3 · Project", String.raw`z=W_k^\top x_c`, "Keep the selected principal directions and represent each centered point there."]
    ];
    return shell(lab, `<div class="nus-lab-controls"><span class="nus-lab-step-count" data-step-count>Step 1 of ${steps.length}</span><button class="btn primary" type="button" data-lab-next>Next derivation step</button></div><div class="nus-lab-stage nus-stepper-stage" id="${id}-stage">${steps.map((step, i) => `<article class="nus-lab-step ${i === 0 ? "active" : ""}" data-step="${i}" aria-hidden="${i === 0 ? "false" : "true"}"><span class="eyebrow">${step[0]}</span><div class="nus-lab-formula">${mathMarkup(step[1])}</div><p>${step[2]}</p></article>`).join("")}<p class="nus-lab-status-text" data-step-summary aria-live="polite">Start by separating the mean from the directions.</p></div>`);
  }
  function algorithmTrace(lab) {
    const steps = [
      ["Initialise", "Choose initial mixture weights, means, and covariances."],
      ["E-step", "Compute a soft responsibility for each component and observation."],
      ["M-step", "Re-estimate parameters using the current responsibilities."],
      ["Check", "Stop when the likelihood change is small; otherwise alternate again."]
    ];
    return shell(lab, `<div class="nus-lab-controls"><span class="nus-lab-step-count" data-step-count>Trace 1 of ${steps.length}</span><button class="btn primary" type="button" data-lab-next>Advance EM trace</button></div><ol class="nus-lab-stage nus-trace" data-trace>${steps.map((step, i) => `<li class="nus-lab-step ${i === 0 ? "active" : ""}" data-step="${i}" aria-current="${i === 0 ? "step" : "false"}"><b>${step[0]}</b><span>${step[1]}</span></li>`).join("")}</ol><p class="nus-lab-status-text" data-step-summary aria-live="polite">The trace begins with an initial guess, not a final cluster assignment.</p>`);
  }
  function derivationTrace(lab) {
    const steps = lab.steps || [];
    return shell(lab, `<div class="nus-lab-controls"><span class="nus-lab-step-count" data-step-count>Step 1 of ${steps.length}</span><button class="btn primary" type="button" data-lab-next>Reveal next step</button></div><ol class="nus-lab-stage nus-trace nus-derivation-trace">${steps.map((step, i) => `<li class="nus-lab-step ${i === 0 ? "active" : ""}" data-step="${i}" aria-current="${i === 0 ? "step" : "false"}"><b>${esc(step[0])}</b><div class="nus-lab-formula">${mathMarkup(step[1])}</div><span>${esc(step[2])}</span></li>`).join("")}</ol><p class="nus-lab-status-text" data-step-summary aria-live="polite">Reveal each transformation, then explain what assumption makes it valid.</p>`);
  }
  function eventTimeline(lab) {
    const steps = [
      ["State s", "Choose the current state and action."],
      ["Reward r", "Observe the immediate reward from the transition."],
      ["Next state s′", "Estimate the discounted continuation value."],
      ["Backup", "Combine immediate reward with discounted future value."]
    ];
    return shell(lab, `<div class="nus-lab-controls"><span class="nus-lab-step-count" data-step-count>Event 1 of ${steps.length}</span><button class="btn primary" type="button" data-lab-next>Advance Bellman step</button></div><div class="nus-lab-stage nus-timeline" data-timeline>${steps.map((step, i) => `<article class="nus-lab-step ${i === 0 ? "active" : ""}" data-step="${i}"><span>${i + 1}</span><div><b>${step[0]}</b><p>${step[1]}</p></div></article>`).join("")}</div><p class="nus-lab-status-text" data-step-summary aria-live="polite">A Bellman backup is easier to audit when each event is named.</p>`);
  }
  function pipeline(lab) {
    const steps = [
      ["Message", "Transform each neighbor representation into a message."],
      ["Aggregate", "Combine the neighbor set with a permutation-invariant operation."],
      ["Update", "Mix the aggregate with the node’s own state and apply σ."]
    ];
    return shell(lab, `<div class="nus-lab-controls"><span class="nus-lab-step-count" data-step-count>Stage 1 of ${steps.length}</span><button class="btn primary" type="button" data-lab-next>Build next stage</button></div><div class="nus-lab-stage nus-pipeline-builder">${steps.map((step, i) => `<article class="nus-lab-node ${i === 0 ? "active" : ""}" data-step="${i}"><span>${i + 1}</span><b>${step[0]}</b><p>${step[1]}</p></article>`).join("")}</div><p class="nus-lab-status-text" data-step-summary aria-live="polite">One layer should preserve the fact that neighbors form a set.</p>`);
  }
  function conceptMap(lab) {
    const nodes = lab.nodes || [], edges = lab.edges || [];
    return shell(lab, `<div class="nus-lab-controls"><span class="nus-lab-step-count">Select one node and explain its role</span><button class="btn primary" type="button" data-lab-complete>Commit concept</button></div><div class="nus-concept-map" role="list" aria-label="Concept map">${nodes.map(node => `<button class="nus-concept-node" type="button" role="listitem" data-lab-choice="${esc(node.id)}" aria-pressed="false"><b>${esc(node.label)}</b><span>${esc(node.detail)}</span></button>`).join("")}</div><div class="nus-concept-edges" aria-label="Concept relationships">${edges.map(edge => `<span>${esc(edge[0])} <i>→</i> ${esc(edge[1])}</span>`).join("")}</div><p class="nus-lab-status-text" data-concept-summary aria-live="polite">Select a node to inspect its role in the learning pipeline.</p>`);
  }
  function decisionTree(lab) {
    const splits = lab.splits || [];
    return shell(lab, `<div class="nus-lab-controls"><span class="nus-lab-step-count">Choose the evidence-respecting branch</span><button class="btn primary" type="button" data-lab-complete>Commit branch</button></div><div class="nus-decision-tree" role="list" aria-label="Evaluation decision branches">${splits.map(split => `<button class="nus-decision-branch" type="button" role="listitem" data-lab-choice="${esc(split.id)}" aria-pressed="false"><span><b>${esc(split.label)}</b><small>${esc(split.detail)}</small></span><i><b style="width:${Math.max(0, Math.min(100, split.impurity))}%"></b></i><em>risk ${esc(split.impurity)}</em></button>`).join("")}</div><p class="nus-lab-status-text" data-decision-summary aria-live="polite">Lower impurity is useful only when the split respects the train/validation/test protocol.</p>`);
  }
  function deepDive(lab) {
    const exercises = lab.exercises || [], id = "nus-lab-" + lab.lessonId;
    const tabs = exercises.map((exercise, index) => "<button class=\"nus-deep-tab " + (index === 0 ? "is-selected" : "") + "\" type=\"button\" role=\"tab\" data-deep-tab=\"" + esc(exercise.id) + "\" aria-selected=\"" + (index === 0 ? "true" : "false") + "\">" + esc(exercise.label) + "</button>").join("");
    const panels = exercises.map((exercise, index) => "<article class=\"nus-deep-panel " + (index === 0 ? "is-selected" : "") + "\" id=\"" + id + "-" + esc(exercise.id) + "\" data-deep-panel=\"" + esc(exercise.id) + "\" role=\"tabpanel\" aria-hidden=\"" + (index === 0 ? "false" : "true") + "\"><div class=\"nus-deep-panel-head\"><span class=\"eyebrow\">" + esc(exercise.label) + "</span><p>" + esc(exercise.prompt) + "</p></div>" + sourceLensMarkup(exercise.sourceLens) + "<ol class=\"nus-deep-steps\">" + (exercise.steps || []).map((step, stepIndex) => "<li class=\"nus-deep-step " + (stepIndex === 0 ? "active" : "") + "\" data-deep-step=\"" + stepIndex + "\" aria-current=\"" + (stepIndex === 0 ? "step" : "false") + "\"><b>" + esc(step[0]) + "</b><div class=\"nus-lab-formula\">" + mathMarkup(step[1]) + "</div><span>" + esc(step[2]) + "</span></li>").join("") + "</ol><p class=\"nus-deep-takeaway\"><b>Interpretation</b> " + esc(exercise.takeaway || "") + "</p></article>").join("");
    return shell(lab, "<div class=\"nus-lab-deep-tabs\" role=\"tablist\" aria-label=\"Week 1 derivation exercises\">" + tabs + "</div><div class=\"nus-lab-stage nus-deep-dive-stage\">" + panels + "</div><div class=\"nus-lab-controls\"><span class=\"nus-lab-step-count\" data-deep-count>Risk gap · step 1</span><button class=\"btn primary\" type=\"button\" data-deep-next>Reveal next step</button><button class=\"btn ghost\" type=\"button\" data-deep-complete>Commit current proof</button></div><p class=\"nus-lab-status-text\" data-deep-status aria-live=\"polite\">Reveal each transformation, then explain the assumption behind it.</p>");
  }
  function selectDeepDive(root, exerciseId) {
    const panels = [...root.querySelectorAll("[data-deep-panel]")], tabs = [...root.querySelectorAll("[data-deep-tab]")];
    const panel = panels.find(item => item.dataset.deepPanel === exerciseId) || panels[0];
    if (!panel) return;
    panels.forEach(item => { const selected = item === panel; item.classList.toggle("is-selected", selected); item.setAttribute("aria-hidden", selected ? "false" : "true"); });
    tabs.forEach(tab => { const selected = tab.dataset.deepTab === panel.dataset.deepPanel; tab.classList.toggle("is-selected", selected); tab.setAttribute("aria-selected", selected ? "true" : "false"); });
    const activeStep = [...panel.querySelectorAll("[data-deep-step]")].findIndex(step => step.classList.contains("active"));
    const count = root.querySelector("[data-deep-count]");
    if (count) count.textContent = (panel.querySelector(".eyebrow")?.textContent || "Exercise") + " · step " + (activeStep + 1);
    const next = root.querySelector("[data-deep-next]");
    if (next) next.textContent = activeStep >= panel.querySelectorAll("[data-deep-step]").length - 1 ? "Proof revealed" : "Reveal next step";
  }
  function advanceDeepDive(root) {
    const panel = root.querySelector("[data-deep-panel].is-selected"), steps = panel ? [...panel.querySelectorAll("[data-deep-step]")] : [];
    if (!panel || !steps.length) return;
    const current = steps.findIndex(step => step.classList.contains("active")), next = Math.min(steps.length - 1, current + 1);
    steps.forEach((step, index) => { step.classList.toggle("active", index === next); step.setAttribute("aria-current", index === next ? "step" : "false"); });
    selectDeepDive(root, panel.dataset.deepPanel);
    const status = root.querySelector("[data-deep-status]");
    if (status) status.textContent = next === steps.length - 1 ? "Final step revealed. State the interpretation before committing the proof." : "Good. Explain this move before revealing the next one.";
  }
  function completeDeepDive(lab, root) {
    const panel = root.querySelector("[data-deep-panel].is-selected"), steps = panel ? [...panel.querySelectorAll("[data-deep-step]")] : [];
    const current = steps.findIndex(step => step.classList.contains("active"));
    const status = root.querySelector("[data-lab-status]");
    if (!panel || current < steps.length - 1) {
      if (status) status.textContent = "Reveal the final step before committing the proof";
      return;
    }
    const result = studyStore() && studyStore().recordSimulation((lab.courseCode || "nus") + ":" + lab.lessonId + ":" + panel.dataset.deepPanel, lab.courseCode, lab.lessonId);
    if (status) status.textContent = result && result.duplicate ? "Already logged · repeat to reason" : "Proof logged · +10 XP";
    root.classList.add("is-complete");
  }
  function updateCompare(lab, root) {
    const value = Number(root.querySelector("input[type=range]").value);
    const train = Math.round(12 + Math.abs(value - 76) * 0.22), valid = Math.round(18 + Math.abs(value - 55) * 0.2 + Math.max(0, value - 70) * 0.25);
    root.querySelector("output").textContent = value;
    root.querySelector("[data-train-bar]").style.width = `${Math.min(100, train * 2)}%`;
    root.querySelector("[data-valid-bar]").style.width = `${Math.min(100, valid * 2)}%`;
    root.querySelector("[data-train-value]").textContent = train;
    root.querySelector("[data-valid-value]").textContent = valid;
    root.querySelector("[data-lab-status-text]")?.remove();
    const summary = root.querySelector(".nus-lab-status-text");
    summary.textContent = valid < train + 4 ? "Balanced choice: validation risk is competitive with training risk." : "Gap warning: the model is fitting the training signal more than the held-out signal.";
  }
  function updateGeometry(root) {
    const value = Number(root.querySelector("input[type=range]").value), line = root.querySelector("[data-margin-line]");
    line.setAttribute("x1", String(180 - value * 9)); line.setAttribute("x2", String(180 + value * 9));
    root.querySelector("output").textContent = value.toFixed(1);
    root.querySelector(".nus-lab-status-text").textContent = value >= 2.7 ? "Wide margin: ask whether the classes still remain correctly separated." : "Narrower margin: inspect which points become support vectors.";
  }
  function advance(root, lab) {
    const steps = [...root.querySelectorAll("[data-step]")], current = steps.findIndex(step => step.classList.contains("active")), next = Math.min(steps.length - 1, current + 1);
    steps.forEach((step, i) => { step.classList.toggle("active", i === next); step.setAttribute("aria-hidden", i === next ? "false" : "true"); step.setAttribute("aria-current", i === next ? "step" : "false"); });
    const count = root.querySelector("[data-step-count]"); if (count) count.textContent = `${lab.type === "algorithm-trace" ? "Trace" : lab.type === "event-timeline" ? "Event" : lab.type === "pipeline-builder" ? "Stage" : "Step"} ${next + 1} of ${steps.length}`;
    const nextButton = root.querySelector("[data-lab-next]"); if (nextButton) nextButton.textContent = next === steps.length - 1 ? "Complete reasoning move" : nextButton.textContent;
    if (next === steps.length - 1) complete(lab, root);
  }
  const registry = window.ATLAS_LAB_REGISTRY ? window.ATLAS_LAB_REGISTRY() : { register() { return this; }, get() { return null; }, types() { return []; } };
  registry.register("compare", compare)
    .register("geometry", geometry)
    .register("math-stepper", mathStepper)
    .register("algorithm-trace", algorithmTrace)
    .register("derivation-trace", derivationTrace)
    .register("event-timeline", eventTimeline)
    .register("pipeline-builder", pipeline)
    .register("concept-map", conceptMap)
    .register("decision-tree", decisionTree)
    .register("deep-dive", deepDive);
  function renderLab(lesson, lab) {
    if (!lab || !lesson) return "";
    const renderer = registry.get(lab.type);
    return renderer ? renderer(lab) : `<div class="nus-callout"><b>Lab unavailable</b><span>No renderer is registered for ${lab.type || "this lab type"}.</span></div>`;
  }
  function bind(root) {
    root.querySelectorAll("[data-nus-lab]").forEach(labRoot => {
      const lab = repository() && repository().getLab(labRoot.dataset.nusLab);
      if (!lab) return;
      if (lab.type === "deep-dive") {
        labRoot.querySelectorAll("[data-deep-tab]").forEach(tab => tab.addEventListener("click", () => selectDeepDive(labRoot, tab.dataset.deepTab)));
        labRoot.querySelector("[data-deep-next]")?.addEventListener("click", () => advanceDeepDive(labRoot));
        labRoot.querySelector("[data-deep-complete]")?.addEventListener("click", () => completeDeepDive(lab, labRoot));
        selectDeepDive(labRoot, (lab.exercises && lab.exercises[0] || {}).id);
        return;
      }
      const range = labRoot.querySelector("input[type=range]");
      if (lab.type === "compare" && range) { range.addEventListener("input", () => updateCompare(lab, labRoot)); updateCompare(lab, labRoot); }
      if (lab.type === "geometry" && range) { range.addEventListener("input", () => updateGeometry(labRoot)); updateGeometry(labRoot); }
      labRoot.querySelector("[data-lab-complete]")?.addEventListener("click", () => complete(lab, labRoot));
      labRoot.querySelector("[data-lab-next]")?.addEventListener("click", () => advance(labRoot, lab));
      labRoot.querySelectorAll("[data-lab-choice]").forEach(choice => choice.addEventListener("click", () => {
        labRoot.querySelectorAll("[data-lab-choice]").forEach(item => { item.classList.remove("is-selected"); item.setAttribute("aria-pressed", "false"); });
        choice.classList.add("is-selected"); choice.setAttribute("aria-pressed", "true");
        const summary = labRoot.querySelector("[data-concept-summary], [data-decision-summary]");
        if (summary) summary.textContent = choice.querySelector("b")?.textContent ? `Selected: ${choice.querySelector("b").textContent}. Commit when you can explain why.` : "Selected. Commit when you can explain why.";
      }));
    });
  }
  window.ATLAS_COMPONENTS = { renderLab, bind, labRegistry: registry };
})();
