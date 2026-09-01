/* Slide-first reader for source-backed lecture study. It keeps the rendered
 * slide, extracted blocks, authored explanation, and Socratic prompts visibly
 * separate so learners can compare rather than conflate them. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_SLIDE_READER_FEATURE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createNusSlideReaderFeature(options) {
  const {
    root,
    getCourse,
    getSlideSet,
    getTextbook,
    getQuestionTemplates,
    getStore,
    pageHead,
    sourceBadge,
    button,
    text,
    esc,
    typeset,
    notFound,
    readingTimer
  } = options;
  let keyboardHandler = null;
  let checkpointOverlay = null;
  let checkpointKeydown = null;
  let activeCourseCode = "";
  const FOCUS_MODE_KEY = "nus.slide-focus-mode";

  function focusModeOn() {
    try {
      return typeof localStorage !== "undefined" && localStorage.getItem(FOCUS_MODE_KEY) === "on";
    } catch (error) {
      return false;
    }
  }

  function updateFocusButton() {
    const toggle = root && typeof root.querySelector === "function" ? root.querySelector("#nus-toggle-focus") : null;
    if (!toggle) return;
    const enabled = focusModeOn();
    if (typeof toggle.setAttribute === "function") {
      toggle.setAttribute("aria-pressed", String(enabled));
      toggle.setAttribute("aria-label", enabled ? "Exit focus reading" : "Enter focus reading");
    }
    toggle.innerHTML = `${enabled ? "Exit focus reading" : "Focus reading"} <kbd>F</kbd>`;
  }

  function setFocusMode(enabled) {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(FOCUS_MODE_KEY, enabled ? "on" : "off");
    } catch (error) {
      // Private browsing or a locked-down browser may reject persistence.
    }
    if (typeof document !== "undefined" && document.body) document.body.classList.toggle("nus-slide-focus-mode", enabled);
    if (enabled && root && typeof root.querySelector === "function") {
      const sourcePanel = root.querySelector("#nus-slide-source-panel");
      if (sourcePanel) sourcePanel.open = false;
    }
    updateFocusButton();
  }

  function clearFocusMode() {
    if (typeof document !== "undefined" && document.body) document.body.classList.remove("nus-slide-focus-mode");
  }

  function slideLink(slideSet, slide) {
    return `#/nus/slides/${encodeURIComponent(slideSet.courseId)}/${encodeURIComponent(slideSet.id)}/${slide.slideNumber}`;
  }

  function slideResourceId(courseCode, slideSet) {
    return `slide:${courseCode}:${slideSet.id}`;
  }

  function slideSetUnitLabel(slideSet) {
    const title = String(slideSet && (slideSet.title || slideSet.summary) || "");
    const match = title.match(/(chapter|week|lecture)\s+\d+/i);
    return match ? match[0].replace(/\s+/g, " ") : "Lecture";
  }

  function textbookResourceId(courseCode, sourceId) {
    return `textbook:${courseCode}:${sourceId}`;
  }

  function slideStudyPriority(slide) {
    return slide && slide.studyPriority || (slide && slide.lecturePriority === "exercise" ? "exercise" : slide && slide.lecturePriority === "context" ? "context" : "support");
  }

  function isHighYieldSlide(slide) {
    return slideStudyPriority(slide) === "high-yield";
  }

  function slidePriorityBadge(slide) {
    if (!slide.studyPriority && (slide.lecturePriority === "core" || slide.priority === "core")) return `<span class="pill gold">Core slide</span>`;
    const priority = slideStudyPriority(slide);
    const labels = { "high-yield": "High-yield", support: "Support", context: "Context only", exercise: "Exercise" };
    const tones = { "high-yield": "gold", support: "sage", context: "", exercise: "" };
    return `<span class="pill ${tones[priority] || ""} nus-slide-priority-${esc(priority)}">${labels[priority] || "Source"}</span>`;
  }

  function isCoreSlide(slideSet, slide) {
    const coreSlideNumbers = Array.isArray(slideSet && slideSet.coreSlideNumbers) ? slideSet.coreSlideNumbers : [];
    if (coreSlideNumbers.length) return coreSlideNumbers.includes(Number(slide.slideNumber));
    return ["high-yield", "support"].includes(slideStudyPriority(slide)) || slide.priority === "core";
  }

  function studyStore() {
    return typeof getStore === "function" ? getStore() : null;
  }

  function savedReading(resourceId) {
    const store = studyStore();
    return store && typeof store.readingFor === "function" ? store.readingFor(resourceId) : null;
  }

  function saveReading(progress) {
    const store = studyStore();
    return store && typeof store.recordReading === "function" ? store.recordReading(progress) : null;
  }

  function percent(progress) {
    if (!progress || !progress.total) return 0;
    return Math.round(Math.min(1, (Number(progress.furthest || progress.position) || 0) / progress.total) * 100);
  }

  function sourceRefLabel(ref) {
    return `${ref.sourceId} · p.${ref.page}`;
  }

  function referenceList(refs) {
    if (!Array.isArray(refs) || !refs.length) return `<span class="nus-muted">No parallel depth reference mapped for this slide.</span>`;
    return `<ul class="nus-slide-refs">${refs.map(ref => `<li>${sourceBadge(ref)} <span>${esc(sourceRefLabel(ref))}</span>${ref.role ? `<small>${esc(ref.role)}</small>` : ""}</li>`).join("")}</ul>`;
  }

  function findTextbookLocation(textbook, page) {
    if (!textbook || !Array.isArray(textbook.chapters)) return null;
    const pageNumber = Number(page);
    if (!Number.isFinite(pageNumber)) return null;
    const chapters = textbook.chapters.filter(chapter => pageNumber >= Number(chapter.pageStart) && pageNumber <= Number(chapter.pageEnd));
    if (!chapters.length) return null;
    const chapter = chapters.sort((a, b) => (Number(a.pageEnd) - Number(a.pageStart)) - (Number(b.pageEnd) - Number(b.pageStart)))[0];
    const sections = Array.isArray(chapter.sections) ? chapter.sections.filter(section => pageNumber >= Number(section.pageStart) && pageNumber <= Number(section.pageEnd)) : [];
    const section = sections.sort((a, b) => (Number(a.pageEnd) - Number(a.pageStart)) - (Number(b.pageEnd) - Number(b.pageStart)))[0] || null;
    return { chapter, section };
  }

  function textbookProgress(courseCode, textbook, sourceId) {
    const progress = savedReading(textbookResourceId(courseCode, sourceId));
    if (!progress) return `<div class="nus-reading-progress nus-reading-progress-empty"><span><b>Textbook progress</b><small>Nothing marked read yet</small></span><strong>0%</strong></div>`;
    const current = Number(progress.position) || 0;
    const furthest = Number(progress.furthest || current) || 0;
    return `<div class="nus-reading-progress"><span><b>Textbook progress</b><small>${progress.completed ? "Complete · revisit any mapped page" : `Resume at p.${current}`}</small></span><strong>${percent(progress)}%</strong><div class="nus-progress"><span style="width:${percent(progress)}%"></span></div><small class="nus-reading-progress-meta">through p.${furthest} of ${progress.total}</small></div>`;
  }

  function textbookPageAction(courseCode, textbook, ref) {
    const resourceId = textbookResourceId(courseCode, ref.sourceId);
    const progress = savedReading(resourceId);
    const read = progress && Number(progress.furthest || progress.position) >= Number(ref.page);
    if (!studyStore()) return "";
    return `<button class="btn ghost nus-textbook-read-button" type="button" data-nus-textbook-page="${esc(ref.page)}" data-nus-textbook-source="${esc(ref.sourceId)}">${read ? "✓ Read" : "Mark p." + esc(ref.page) + " read"}</button>`;
  }

  function textbookMapping(courseCode, slide, textbook) {
    const refs = Array.isArray(slide.textbookRefs) ? slide.textbookRefs : [];
    if (!refs.length) return `<div class="nus-slide-textbook-empty"><span class="pill">Not mapped</span><p class="nus-muted">No textbook page is linked to this slide yet. The lecture remains the primary study source.</p></div>`;
    const annotation = slide.studyNote && slide.studyNote.focus || slide.explanation && (slide.explanation.whyItMatters || slide.explanation.connection || slide.explanation.whatYouSee);
    const uniqueSourceIds = [...new Set(refs.map(ref => ref.sourceId))];
    const cards = refs.map(ref => {
      const location = findTextbookLocation(textbook, ref.page);
      const chapter = location && location.chapter;
      const section = location && location.section;
      return `<article class="nus-slide-textbook-card"><div class="nus-slide-textbook-card-head"><span>${sourceBadge(ref)}</span><b>p.${esc(ref.page)}</b></div>${chapter ? `<p><span class="eyebrow">Chapter ${esc(chapter.number)}</span><strong>${esc(chapter.title)}</strong></p>` : `<p class="nus-muted">Chapter index not available for this page.</p>`}${section ? `<p class="nus-slide-textbook-section"><span>${esc(section.number)}</span>${esc(section.title)}</p>` : ""}${ref.role ? `<small>${esc(ref.role)}</small>` : ""}${textbookPageAction(courseCode, textbook, ref)}</article>`;
    }).join("");
    const progress = uniqueSourceIds.map(sourceId => textbookProgress(courseCode, textbook, sourceId)).join("");
    return `${progress ? `<div class="nus-slide-textbook-progress">${progress}</div>` : ""}<div class="nus-slide-textbook-cards">${cards}</div>${annotation ? `<div class="nus-slide-annotation"><span class="eyebrow">Dynamic Atlas annotation</span><p>${text(annotation)}</p></div>` : ""}`;
  }

  function textbookReadingLens(slide, textbook) {
    const refs = Array.isArray(slide.textbookRefs) ? slide.textbookRefs : [];
    if (!textbook || !refs.length) return "";
    const locations = refs.map(ref => ({ ref, location: findTextbookLocation(textbook, ref.page) })).filter(item => item.location);
    const groups = new Map();
    locations.forEach(({ ref, location }) => {
      const key = location.chapter.id || location.chapter.number;
      if (!groups.has(key)) groups.set(key, { chapter: location.chapter, refs: [] });
      groups.get(key).refs.push({ ref, section: location.section });
    });
    return `<div class="nus-slide-textbook-lens"><div class="nus-slide-textbook-lens-head"><div><span class="eyebrow">Textbook reading lens</span><b>Live context for slide ${slide.slideNumber}</b></div><span class="pill sage">synced</span></div><p class="nus-muted">The highlighted section follows this slide's textbook references. Nearby sections keep the reading context visible.</p>${[...groups.values()].map(({ chapter, refs: chapterRefs }) => {
      const sections = Array.isArray(chapter.sections) ? chapter.sections : [];
      const activeIndexes = chapterRefs.map(item => sections.findIndex(section => item.section && section.number === item.section.number)).filter(index => index >= 0);
      const visibleIndexes = new Set(activeIndexes.flatMap(index => [index - 1, index, index + 1]).filter(index => index >= 0 && index < sections.length));
      return `<div class="nus-slide-textbook-outline"><div class="nus-slide-textbook-outline-head"><span>Chapter ${esc(chapter.number)}</span><b>${esc(chapter.title)}</b></div><ol>${[...visibleIndexes].sort((a, b) => a - b).map(index => { const section = sections[index]; const active = activeIndexes.includes(index); const pages = section.pageStart === section.pageEnd ? `p.${section.pageStart}` : `pp.${section.pageStart}–${section.pageEnd}`; return `<li class="${active ? "active" : ""}"><span>${esc(section.number)}</span><b>${esc(section.title)}</b><small>${pages}${active ? ` · slide ${slide.slideNumber}` : ""}</small></li>`; }).join("")}</ol></div>`;
    }).join("")}</div>`;
  }

  function extractedBlocks(slide) {
    const blocks = slide.extraction && Array.isArray(slide.extraction.blocks) ? slide.extraction.blocks : [];
    if (!blocks.length) return `<p class="nus-muted">No text blocks were extracted from this page. Use the rendered slide.</p>`;
    return `<div class="nus-extraction-blocks">${blocks.map(block => `<article class="nus-extraction-block"><div><span class="pill">${esc(block.type)}</span><code>${esc(block.blockId)}</code>${block.imageId ? `<code>${esc(block.imageId)}</code>` : ""}</div>${block.text ? `<p>${text(block.text)}</p>` : `<p class="nus-muted">Image/visual block — inspect the slide render.</p>`}</article>`).join("")}</div>`;
  }

  function studyCardsForSlide(courseCode, slide) {
    const catalog = typeof getQuestionTemplates === "function" ? getQuestionTemplates(courseCode) : null;
    const sourceId = slide && slide.sourceRef && slide.sourceRef.sourceId;
    const page = Number(slide && slide.pdfPage);
    return (catalog && catalog.cards || []).filter(cardItem => (cardItem.lectureRefs || []).some(ref => ref.sourceId === sourceId && Number(ref.page) === page));
  }

  function studyCardLinks(courseCode, slide) {
    const cards = studyCardsForSlide(courseCode, slide);
    if (!cards.length) return "";
    return `<section class="nus-slide-study-cards"><div class="eyebrow">Exact card from this lecture page</div><div>${cards.map(cardItem => button(`Study ${cardItem.title}`, `#/nus/lesson/${courseCode}/${cardItem.lessonId}/${cardItem.id}`, "ghost")).join("")}</div></section>`;
  }

  function explanation(slide, courseCode) {
    courseCode = courseCode || activeCourseCode;
    const formula = slide.keyFormula;
    const formulaHtml = formula && formula.name && formula.latex
      ? `<section class="nus-slide-key-formula"><div class="nus-slide-key-formula-label">Key formula</div><h4>${esc(formula.name)}</h4><div class="nus-slide-key-formula-math">$$${esc(formula.latex)}$$</div>${formula.purpose ? `<p><b>Use it for:</b> ${text(formula.purpose)}</p>` : ""}</section>`
      : "";
    if (slide.studyNote) {
      return `${formulaHtml}${studyCardLinks(courseCode, slide)}<p>${text(slide.studyNote.focus)}</p>${slide.studyNote.trap ? `<p class="nus-slide-trap"><b>Trap:</b> ${text(slide.studyNote.trap)}</p>` : ""}`;
    }
    const value = slide.explanation || {};
    const fields = [
      ["What you need to learn", value.whyItMatters],
      ["Mechanism / derivation", value.technicalDetail],
      ["Mental model", value.intuition],
      ["Use it to reason", value.connection],
      ["Common failure mode", value.pitfall],
      ["Source observation", value.whatYouSee]
    ];
    const notes = fields.filter(([, body]) => body).map(([title, body]) => `<section class="nus-slide-note"><h4>${esc(title)}</h4><p>${text(body)}</p></section>`).join("");
    return formulaHtml + studyCardLinks(courseCode, slide) + (notes || `<section class="nus-slide-note"><p class="nus-muted">Source slide only. No additional Atlas note is attached to this page.</p></section>`);
  }

  function slideQuestions(slide) {
    const checkpoint = slide.studyNote && slide.studyNote.checkpoint;
    return checkpoint ? [checkpoint] : (slide.socraticQuestions || []);
  }

  function questions(slide) {
    return slideQuestions(slide).map((question, index) => `<details class="nus-slide-question"><summary><span>${index + 1}. ${esc(question.prompt)}</span><small>${esc(question.type)}</small></summary><p><b>Hint:</b> ${text(question.hint)}</p><details><summary>Reveal a strong answer</summary><p>${text(question.answer)}</p></details></details>`).join("");
  }

  function closeSocraticCheckpoint() {
    if (checkpointKeydown && typeof document !== "undefined") document.removeEventListener("keydown", checkpointKeydown);
    checkpointKeydown = null;
    if (checkpointOverlay && typeof checkpointOverlay.remove === "function") checkpointOverlay.remove();
    checkpointOverlay = null;
  }

  function showSocraticCheckpoint(slideSet, current, target) {
    const prompts = slideQuestions(current);
    if (!prompts.length || typeof document === "undefined" || !document.body) {
      location.hash = slideLink(slideSet, target);
      return;
    }
    const select = root && typeof root.querySelector === "function" ? root.querySelector("#nus-slide-select") : null;
    if (select) select.value = String(current.slideNumber);
    closeSocraticCheckpoint();
    const overlay = document.createElement("div");
    overlay.className = "nus-socratic-modal";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "nus-socratic-modal-title");
    overlay.innerHTML = `<div class="nus-socratic-modal-card"><div class="nus-socratic-modal-head"><div><span class="eyebrow">Before slide ${target.slideNumber}</span><h2 id="nus-socratic-modal-title">Socratic checkpoint</h2></div><span class="pill gold">${prompts.length} prompt${prompts.length === 1 ? "" : "s"}</span></div><p class="nus-muted">Answer aloud or on paper while the current visual is fresh, then continue.</p><div class="nus-socratic-modal-questions">${questions(current)}</div><div class="nus-socratic-modal-actions"><button type="button" class="btn ghost" data-socratic-cancel>Stay on slide</button><button type="button" class="btn primary" data-socratic-continue>Continue to slide ${target.slideNumber} →</button></div></div>`;
    document.body.appendChild(overlay);
    if (typeof typeset === "function") typeset(overlay);
    checkpointOverlay = overlay;
    const continueButton = overlay.querySelector("[data-socratic-continue]");
    const continueToSlide = () => {
      closeSocraticCheckpoint();
      location.hash = slideLink(slideSet, target);
    };
    overlay.querySelector("[data-socratic-cancel]")?.addEventListener("click", closeSocraticCheckpoint);
    continueButton?.addEventListener("click", continueToSlide);
    overlay.addEventListener("click", event => { if (event.target === overlay) closeSocraticCheckpoint(); });
    checkpointKeydown = event => {
      if (event.key === "Escape") { event.preventDefault(); closeSocraticCheckpoint(); }
    };
    document.addEventListener("keydown", checkpointKeydown);
    continueButton?.focus();
  }

  function navigateToSlide(slideSet, current, target) {
    if (!target) return;
    if (target.slideNumber > current.slideNumber && slideQuestions(current).length) {
      showSocraticCheckpoint(slideSet, current, target);
      return;
    }
    closeSocraticCheckpoint();
    location.hash = slideLink(slideSet, target);
  }

  function slideNavLink(slideSet, slide, label, tone, direction) {
    return `<a class="btn ${tone}" href="${slideLink(slideSet, slide)}" data-route data-slide-nav="${direction}" data-slide-number="${slide.slideNumber}">${label}</a>`;
  }

  function slideNavigation(slideSet, index) {
    const previous = slideSet.slides[index - 1];
    const next = slideSet.slides[index + 1];
    const current = slideSet.slides[index];
    return `<div class="nus-slide-nav"><div>${previous ? slideNavLink(slideSet, previous, "← Previous", "ghost", "previous") : `<span class="nus-muted">First slide</span>`}</div><label class="nus-slide-jump">Slide <select id="nus-slide-select" aria-label="Jump to slide">${slideSet.slides.map(item => `<option value="${item.slideNumber}" ${item.slideNumber === current.slideNumber ? "selected" : ""}>${item.slideNumber} · ${esc(item.title)}</option>`).join("")}</select></label><div>${next ? slideNavLink(slideSet, next, "Next →", "primary", "next") : `<span class="nus-muted">Last slide</span>`}</div></div>`;
  }

  function progressBand(value) {
    const percentage = Number(value) || 0;
    if (percentage >= 100) return { key: "complete", label: "100% · Complete" };
    if (percentage >= 75) return { key: "nearly", label: "75–99% · Nearly complete" };
    if (percentage >= 50) return { key: "halfway", label: "50–74% · Halfway" };
    if (percentage >= 25) return { key: "building", label: "25–49% · Building" };
    return { key: "starting", label: "0–24% · Starting" };
  }

  function progressLegend() {
    return `<div class="nus-reading-progress-legend" aria-label="Lecture reading progress colour key"><span class="nus-progress-key-starting"><i aria-hidden="true"></i>0–24% · Starting</span><span class="nus-progress-key-building"><i aria-hidden="true"></i>25–49% · Building</span><span class="nus-progress-key-halfway"><i aria-hidden="true"></i>50–74% · Halfway</span><span class="nus-progress-key-nearly"><i aria-hidden="true"></i>75–99% · Nearly complete</span><span class="nus-progress-key-complete"><i aria-hidden="true"></i>100% · Complete</span></div>`;
  }

  function slideProgress(courseCode, slideSet, source, slide, resumeSlide) {
    const progress = savedReading(slideResourceId(courseCode, slideSet));
    if (!progress) return "";
    const percentage = percent(progress);
    const band = progressBand(percentage);
    const through = Number(progress.furthest || progress.position) || slide.slideNumber;
    const resume = resumeSlide && resumeSlide.slideNumber !== slide.slideNumber
      ? button(`Continue from slide ${resumeSlide.slideNumber}`, slideLink(slideSet, resumeSlide), "primary")
      : "";
    return `<section class="nus-reading-progress nus-slide-reading-progress"><span><b>Lecture reading progress</b><small>${progress.completed ? "Complete · revisit any slide" : `Resume at slide ${Number(progress.position) || slide.slideNumber}`}</small></span><strong>${percentage}%</strong><div class="nus-progress nus-progress-${band.key}" role="progressbar" aria-label="Lecture reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentage}"><span style="width:${percentage}%"></span></div><div class="nus-reading-progress-status"><b class="nus-progress-status-${band.key}">${band.label}</b><small>Based on slides read so far</small></div>${progressLegend()}<small class="nus-reading-progress-meta">through slide ${through} of ${progress.total} · ${esc(source.fileName || source.sourceId)}</small>${resume ? `<div class="nus-card-actions">${resume}</div>` : ""}</section>`;
  }

  function sourcePanel(slide, source) {
    return `<details class="nus-slide-source-panel" id="nus-slide-source-panel"><summary class="nus-slide-source-summary"><span><span class="eyebrow">Source layer</span><b>${esc(source.fileName || source.sourceId)}</b></span><span class="nus-slide-source-meta">${sourceBadge({ sourceType: "lecture", status: "current" })} · PDF p.${slide.pdfPage} · slide ${slide.slideNumber}</span><span class="nus-slide-source-action">Open provenance · <kbd>I</kbd></span></summary><div class="nus-slide-source-panel-body"><section class="nus-slide-source-bar"><div><span class="eyebrow">Lecture core</span><b>${esc(source.fileName || source.sourceId)}</b><span>${sourceBadge({ sourceType: "lecture", status: "current" })} · PDF page ${slide.pdfPage} · rendered slide ${slide.slideNumber}</span></div><p>${esc(source.access === "local-only" ? "Original PDF stays local; this production-safe reader shows the exact page render and provenance." : "Original PDF is available under the configured access policy.")}</p></section><section class="nus-card nus-slide-extracted"><div class="nus-slide-section-head"><div><span class="eyebrow">Source layer</span><h3>Extracted text and blocks</h3></div><span class="pill">JSON provenance</span></div><p class="nus-muted">Every block retains sourceId, page, block type, bounding box, and image ID when present.</p>${extractedBlocks(slide)}</section></div></details>`;
  }

  function removeKeyboard() {
    if (keyboardHandler && typeof document !== "undefined") document.removeEventListener("keydown", keyboardHandler);
    keyboardHandler = null;
  }

  function bindKeyboard(slideSet, index) {
    removeKeyboard();
    if (typeof document === "undefined") return;
    const previous = slideSet.slides[index - 1];
    const next = slideSet.slides[index + 1];
    const current = slideSet.slides[index];
    keyboardHandler = event => {
      if (!String(location.hash || "").startsWith("#/nus/slides/")) return;
      if (checkpointOverlay) return;
      const tagName = event.target && event.target.tagName;
      if (event.metaKey || event.ctrlKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(tagName || "")) return;
      const key = String(event.key || "").toLowerCase();
      const target = ["arrowleft", "pageup", "k"].includes(key) ? previous : ["arrowright", "pagedown", "j"].includes(key) ? next : null;
      if (target) {
        event.preventDefault();
        navigateToSlide(slideSet, current, target);
        return;
      }
      if (key === "i") {
        const panel = document.getElementById("nus-slide-source-panel");
        if (panel) {
          event.preventDefault();
          panel.open = !panel.open;
        }
        return;
      }
      if (key === "f") {
        event.preventDefault();
        setFocusMode(!focusModeOn());
      }
    };
    document.addEventListener("keydown", keyboardHandler);
  }

  function render(courseCode, slideSetId, rawSlideNumber) {
    activeCourseCode = courseCode || "";
    removeKeyboard();
    closeSocraticCheckpoint();
    setFocusMode(focusModeOn());
    const course = getCourse(courseCode);
    const slideSet = getSlideSet(courseCode, slideSetId);
    if (!course || !slideSet) return notFound();
    const resourceId = slideResourceId(courseCode, slideSet);
    const previousReading = savedReading(resourceId);
    const savedNumber = previousReading && !previousReading.completed ? Number(previousReading.position) : 0;
    const requestedNumber = rawSlideNumber == null && savedNumber > 0 ? savedNumber : Number(rawSlideNumber) || 1;
    const number = Math.min(Math.max(requestedNumber, 1), slideSet.slides.length);
    const index = number - 1;
    const slide = slideSet.slides[index];
    const source = slideSet.source || {};
    const unitLabel = slideSetUnitLabel(slideSet);
    const core = isCoreSlide(slideSet, slide);
    const highYield = isHighYieldSlide(slide);
    const hasStudyNote = Boolean(slide.studyNote);
    const coreCount = slideSet.slides.filter(item => isCoreSlide(slideSet, item)).length;
    const highYieldCount = slideSet.slides.filter(isHighYieldSlide).length;
    const resumeSlide = rawSlideNumber != null && previousReading && !previousReading.completed && Number(previousReading.position) > number
      ? slideSet.slides[Math.min(slideSet.slides.length, Number(previousReading.position)) - 1]
      : null;
    saveReading({ resourceId, kind: "slide", courseCode, sourceId: source.sourceId || slide.sourceRef.sourceId, title: slideSet.title || slideSet.summary, unit: "slide", position: slide.slideNumber, total: slideSet.slides.length });
    const textbook = typeof getTextbook === "function" ? getTextbook(courseCode) : null;
    const lessonIds = Array.isArray(slideSet.lessonIds) ? slideSet.lessonIds : [];
    let body = `<div class="nus-slide-reader-page">${pageHead(`${course.code} · ${unitLabel} · slide ${slide.slideNumber}/${slideSet.slides.length}`, slide.title, slideSet.summary)}`;
    body += `${readingTimer && typeof readingTimer.render === "function" ? readingTimer.render(resourceId) : ""}<div class="nus-lesson-actions"><div class="nus-slide-study-actions">${button("← Lesson", `#/nus/lesson/${course.code}/${lessonIds[0] || "dsa5105-erm"}`, "ghost")}${button("Course map", `#/nus/course/${course.code}`, "ghost")}${textbook && textbook.reader ? button("Textbook PDF", `#/nus/textbook/${course.code}/${slide.textbookRefs && slide.textbookRefs[0] ? slide.textbookRefs[0].page : 1}`, "ghost") : ""}${button("Practice lesson", `#/nus/exam/${course.code}/${lessonIds[0] || "dsa5105-erm"}`, "primary")}<button class="btn ghost" id="nus-toggle-focus" type="button" aria-pressed="${focusModeOn()}" aria-label="${focusModeOn() ? "Exit focus reading" : "Enter focus reading"}">${focusModeOn() ? "Exit focus reading" : "Focus reading"} <kbd>F</kbd></button><button class="btn ghost" id="nus-toggle-source" type="button" aria-controls="nus-slide-source-panel">Source layer <kbd>I</kbd></button></div><span class="nus-slide-key-hint"><kbd>←</kbd><kbd>→</kbd> or <kbd>J</kbd><kbd>K</kbd> switch slides · <kbd>F</kbd> focus · <kbd>I</kbd> source</span>${slideNavigation(slideSet, index)}</div>`;
    body += slideProgress(courseCode, slideSet, source, slide, resumeSlide);
    body += sourcePanel(slide, source);
    body += `<div class="nus-slide-focus-bar" aria-live="polite"><span class="eyebrow">Focus reading</span><strong>${esc(slide.title)}</strong>${slidePriorityBadge(slide)}${!slide.studyPriority && core ? `<span class="pill gold">Core slide</span>` : ""}${highYield ? `<span class="pill gold">Put on A4 / drill</span>` : ""}<span>Slide ${slide.slideNumber}/${slideSet.slides.length}</span></div>`;
    body += `<div class="nus-slide-reader-grid">
      <aside class="nus-slide-strip" aria-label="${esc(unitLabel)} slides"><div class="nus-slide-strip-head"><b>All slides</b><span>${highYieldCount ? `${highYieldCount} high-yield · ` : ""}${coreCount ? `${coreCount} core · ` : ""}${slideSet.slides.length} pages</span></div>${slideSet.slides.map(item => { const itemCore = isCoreSlide(slideSet, item); const itemHighYield = isHighYieldSlide(item); return `<a class="nus-slide-thumb ${item.slideNumber === slide.slideNumber ? "active" : ""} ${itemCore ? "core" : ""} ${itemHighYield ? "high-yield" : ""}" href="${slideLink(slideSet, item)}" data-route data-slide-number="${item.slideNumber}" aria-label="Slide ${item.slideNumber}: ${esc(item.title)} · ${esc(slideStudyPriority(item))}"><img loading="lazy" src="${esc(item.assetPath)}" alt=""><span><b>${String(item.slideNumber).padStart(2, "0")}</b>${itemHighYield ? `<em>High-yield</em>` : itemCore ? `<em>Support</em>` : ""}<small>${esc(item.title)}</small></span></a>`; }).join("")}</aside>
      <main class="nus-slide-main"><section class="nus-slide-canvas nus-card"><div class="nus-slide-canvas-head"><span>${sourceBadge(slide.sourceRef)} ${slidePriorityBadge(slide)}${!slide.studyPriority && core ? ` <span class="pill gold">Core slide</span>` : ""}${highYield ? ` <span class="pill gold">Put on A4 / drill</span>` : ""}</span><span class="nus-muted">${esc(slide.kind)} · ${esc(slide.status)} · ${slide.slideNumber}/${slideSet.slides.length}</span></div><img src="${esc(slide.assetPath)}" alt="${esc(slide.title)} — slide ${slide.slideNumber}" class="nus-slide-image"><p class="nus-slide-caption">Rendered from <code>${esc(source.sourceId || slide.sourceRef.sourceId)}</code>, page ${slide.pdfPage}. The image is the visual reference; the source layer above can be opened when you need to audit extraction.</p></section></main>
      <aside class="nus-slide-context"><section class="nus-card nus-slide-explanation"><div class="nus-slide-section-head"><div><span class="eyebrow">${hasStudyNote ? "Study filter" : "Source layer"}</span><h3>${hasStudyNote ? "Exam focus" : "Source-only page"}</h3></div>${hasStudyNote ? slidePriorityBadge(slide) : `<span class="pill">No generated note</span>`}</div>${explanation(slide)}</section><section class="nus-card nus-slide-depth" id="nus-slide-textbook-map"><div class="nus-slide-section-head"><div><span class="eyebrow">Parallel reading</span><h3>Textbook bridge</h3></div><span class="pill sage">${(slide.textbookRefs || []).length} mapped</span></div>${textbookMapping(courseCode, slide, textbook)}${textbookReadingLens(slide, textbook)}<div class="nus-slide-reference-group"><h4>Reference layer</h4>${referenceList(slide.referenceRefs)}</div><p class="nus-muted">Lecture remains the exam-priority source. Textbook and reference material add depth; they do not rewrite the lecture.</p></section></aside>
    </div>`;
    body += `<div class="nus-slide-bottom">${slideNavigation(slideSet, index)}</div></div>`;
    root.innerHTML = body;
    typeset();
    if (readingTimer && typeof readingTimer.bind === "function") readingTimer.bind(root);
    root.querySelector("#nus-slide-select")?.addEventListener("change", event => {
      navigateToSlide(slideSet, slide, slideSet.slides.find(item => String(item.slideNumber) === event.target.value) || slide);
    });
    root.querySelector("#nus-toggle-source")?.addEventListener("click", () => {
      const panel = root.querySelector("#nus-slide-source-panel");
      if (panel) panel.open = !panel.open;
    });
    root.querySelector("#nus-toggle-focus")?.addEventListener("click", () => setFocusMode(!focusModeOn()));
    root.querySelectorAll("[data-slide-nav]").forEach(item => item.addEventListener("click", event => {
      event.preventDefault();
      const target = slideSet.slides.find(candidate => String(candidate.slideNumber) === item.dataset.slideNumber);
      navigateToSlide(slideSet, slide, target);
    }));
    root.querySelectorAll(".nus-slide-thumb").forEach(item => item.addEventListener("click", event => {
      event.preventDefault();
      const target = slideSet.slides.find(candidate => String(candidate.slideNumber) === item.dataset.slideNumber);
      navigateToSlide(slideSet, slide, target);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
    root.querySelectorAll("[data-nus-textbook-page]").forEach(item => item.addEventListener("click", () => {
      const sourceId = item.dataset.nusTextbookSource;
      const page = Number(item.dataset.nusTextbookPage);
      if (!sourceId || !Number.isFinite(page)) return;
      saveReading({ resourceId: textbookResourceId(courseCode, sourceId), kind: "textbook", courseCode, sourceId, title: textbook && textbook.source ? textbook.source.role : sourceId, unit: "page", position: page, total: textbook && textbook.pageCount ? textbook.pageCount : page });
      render(courseCode, slideSetId, slide.slideNumber);
    }));
    bindKeyboard(slideSet, index);
  }

  return Object.freeze({ clearFocusMode, render });
});
