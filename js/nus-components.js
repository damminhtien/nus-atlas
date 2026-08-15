(function () {
  "use strict";
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch]));
  const sourceLabel = ref => `${ref.sourceId}${ref.page ? ` · p.${ref.page}` : ""}`;
  const sourceRefs = lab => (lab.sourceRefs || []).map(ref => `<span class="nus-lab-source-ref"><b>${esc((window.NUS_SOURCE_TYPES && window.NUS_SOURCE_TYPES[ref.sourceType] || {}).shortLabel || ref.sourceType)}</b> ${esc(sourceLabel(ref))}</span>`).join("");
  const shell = (lab, body) => `<section class="nus-lab nus-lab-${esc(lab.type)} reveal" data-nus-lab="${esc(lab.lessonId)}" data-reduced-motion="${lab.reducedMotion ? "true" : "false"}" aria-labelledby="nus-lab-title-${esc(lab.lessonId)}"><header class="nus-lab-head"><div><span class="pill violet">Visual learning lab</span><h3 id="nus-lab-title-${esc(lab.lessonId)}">${esc(lab.title)}</h3></div><span class="nus-lab-status" data-lab-status aria-live="polite">Not attempted</span></header><p class="nus-lab-goal"><b>Learning goal</b> ${esc(lab.learningGoal)}</p>${body}<footer class="nus-lab-foot"><div><b>Source lens</b><span class="nus-lab-source-note">Lecture remains the exam-priority core. Textbook and reference steps are labeled for depth.</span></div><div class="nus-lab-sources">${sourceRefs(lab)}</div><details><summary>Why this interaction?</summary><p>${esc(lab.explanation || "Use the controls to make one explicit reasoning move, then explain the evidence.")}</p></details></footer></section>`;
  function complete(lab, root) {
    const input = root.querySelector("input[type=range]"), steps = [...root.querySelectorAll("[data-step]")];
    const selected = root.querySelector("[data-lab-choice].is-selected");
    const state = { complexity: input && input.id.includes("complexity") ? Number(input.value) : null, margin: input && input.id.includes("margin") ? Number(input.value) : null, choice: selected ? selected.dataset.labChoice : null, step: Math.max(0, steps.findIndex(step => step.classList.contains("active"))) };
    if (typeof lab.check === "function" && !lab.check(state)) {
      const status = root.querySelector("[data-lab-status]");
      if (status) status.textContent = "Complete the reasoning step first";
      return;
    }
    const result = window.NUS_STORE && window.NUS_STORE.recordSimulation(`dsa5105:${lab.lessonId}`, lab.courseCode, lab.lessonId);
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
    return shell(lab, `<div class="nus-lab-controls"><span class="nus-lab-step-count" data-step-count>Step 1 of ${steps.length}</span><button class="btn primary" type="button" data-lab-next>Next derivation step</button></div><div class="nus-lab-stage nus-stepper-stage" id="${id}-stage">${steps.map((step, i) => `<article class="nus-lab-step ${i === 0 ? "active" : ""}" data-step="${i}" aria-hidden="${i === 0 ? "false" : "true"}"><span class="eyebrow">${step[0]}</span><div class="nus-lab-formula">$${step[1]}$</div><p>${step[2]}</p></article>`).join("")}<p class="nus-lab-status-text" data-step-summary aria-live="polite">Start by separating the mean from the directions.</p></div>`);
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
    return shell(lab, `<div class="nus-lab-controls"><span class="nus-lab-step-count" data-step-count>Step 1 of ${steps.length}</span><button class="btn primary" type="button" data-lab-next>Reveal next step</button></div><ol class="nus-lab-stage nus-trace nus-derivation-trace">${steps.map((step, i) => `<li class="nus-lab-step ${i === 0 ? "active" : ""}" data-step="${i}" aria-current="${i === 0 ? "step" : "false"}"><b>${esc(step[0])}</b><div class="nus-lab-formula">$${step[1]}$</div><span>${esc(step[2])}</span></li>`).join("")}</ol><p class="nus-lab-status-text" data-step-summary aria-live="polite">Reveal each transformation, then explain what assumption makes it valid.</p>`);
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
  const registry = window.NUS_LAB_REGISTRY ? window.NUS_LAB_REGISTRY() : { register() { return this; }, get() { return null; }, types() { return []; } };
  registry.register("compare", compare)
    .register("geometry", geometry)
    .register("math-stepper", mathStepper)
    .register("algorithm-trace", algorithmTrace)
    .register("derivation-trace", derivationTrace)
    .register("event-timeline", eventTimeline)
    .register("pipeline-builder", pipeline)
    .register("concept-map", conceptMap)
    .register("decision-tree", decisionTree);
  function renderLab(lesson, lab) {
    if (!lab || !lesson) return "";
    const renderer = registry.get(lab.type);
    return renderer ? renderer(lab) : `<div class="nus-callout"><b>Lab unavailable</b><span>No renderer is registered for ${lab.type || "this lab type"}.</span></div>`;
  }
  function bind(root) {
    root.querySelectorAll("[data-nus-lab]").forEach(labRoot => {
      const lab = window.NUS_VISUAL_LABS && window.NUS_VISUAL_LABS[labRoot.dataset.nusLab];
      if (!lab) return;
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
  window.NUS_COMPONENTS = { renderLab, bind, labRegistry: registry };
})();
