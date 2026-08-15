/* Slide-first reader for source-backed lecture study. It keeps the rendered
 * slide, extracted blocks, authored explanation, and Socratic prompts visibly
 * separate so learners can compare rather than conflate them. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.NUS_SLIDE_READER_FEATURE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createNusSlideReaderFeature(options) {
  const {
    root,
    getCourse,
    getSlideSet,
    getTextbook,
    pageHead,
    sourceBadge,
    button,
    text,
    esc,
    typeset,
    notFound
  } = options;
  let keyboardHandler = null;

  function slideLink(slideSet, slide) {
    return `#/nus/slides/${encodeURIComponent(slideSet.courseId)}/${encodeURIComponent(slideSet.id)}/${slide.slideNumber}`;
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

  function textbookMapping(slide, textbook) {
    const refs = Array.isArray(slide.textbookRefs) ? slide.textbookRefs : [];
    if (!refs.length) return `<div class="nus-slide-textbook-empty"><span class="pill">Not mapped</span><p class="nus-muted">No textbook page is linked to this slide yet. The lecture remains the primary study source.</p></div>`;
    const annotation = slide.explanation && (slide.explanation.whyItMatters || slide.explanation.connection || slide.explanation.whatYouSee);
    const cards = refs.map(ref => {
      const location = findTextbookLocation(textbook, ref.page);
      const chapter = location && location.chapter;
      const section = location && location.section;
      return `<article class="nus-slide-textbook-card"><div class="nus-slide-textbook-card-head"><span>${sourceBadge(ref)}</span><b>p.${esc(ref.page)}</b></div>${chapter ? `<p><span class="eyebrow">Chapter ${esc(chapter.number)}</span><strong>${esc(chapter.title)}</strong></p>` : `<p class="nus-muted">Chapter index not available for this page.</p>`}${section ? `<p class="nus-slide-textbook-section"><span>${esc(section.number)}</span>${esc(section.title)}</p>` : ""}${ref.role ? `<small>${esc(ref.role)}</small>` : ""}</article>`;
    }).join("");
    return `<div class="nus-slide-textbook-cards">${cards}</div>${annotation ? `<div class="nus-slide-annotation"><span class="eyebrow">Dynamic Atlas annotation</span><p>${text(annotation)}</p></div>` : ""}`;
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
    if (!blocks.length) return `<p class="nus-muted">No text blocks were extracted from this page. Use the rendered slide and authored note.</p>`;
    return `<div class="nus-extraction-blocks">${blocks.map(block => `<article class="nus-extraction-block"><div><span class="pill">${esc(block.type)}</span><code>${esc(block.blockId)}</code>${block.imageId ? `<code>${esc(block.imageId)}</code>` : ""}</div>${block.text ? `<p>${text(block.text)}</p>` : `<p class="nus-muted">Image/visual block — inspect the slide render.</p>`}</article>`).join("")}</div>`;
  }

  function explanation(slide) {
    const value = slide.explanation || {};
    const fields = [
      ["What you see", value.whatYouSee],
      ["Why it matters", value.whyItMatters],
      ["Intuition", value.intuition],
      ["Technical detail", value.technicalDetail],
      ["Common pitfall", value.pitfall],
      ["Connection", value.connection]
    ];
    return fields.filter(([, body]) => body).map(([title, body]) => `<section class="nus-slide-note"><h4>${esc(title)}</h4><p>${text(body)}</p></section>`).join("");
  }

  function questions(slide) {
    return (slide.socraticQuestions || []).map((question, index) => `<details class="nus-slide-question"><summary><span>${index + 1}. ${esc(question.prompt)}</span><small>${esc(question.type)}</small></summary><p><b>Hint:</b> ${text(question.hint)}</p><details><summary>Reveal a strong answer</summary><p>${text(question.answer)}</p></details></details>`).join("");
  }

  function slideNavigation(slideSet, index) {
    const previous = slideSet.slides[index - 1];
    const next = slideSet.slides[index + 1];
    const current = slideSet.slides[index];
    return `<div class="nus-slide-nav"><div>${previous ? button("← Previous", slideLink(slideSet, previous), "ghost") : `<span class="nus-muted">First slide</span>`}</div><label class="nus-slide-jump">Slide <select id="nus-slide-select" aria-label="Jump to slide">${slideSet.slides.map(item => `<option value="${item.slideNumber}" ${item.slideNumber === current.slideNumber ? "selected" : ""}>${item.slideNumber} · ${esc(item.title)}</option>`).join("")}</select></label><div>${next ? button("Next →", slideLink(slideSet, next), "primary") : `<span class="nus-muted">Last slide</span>`}</div></div>`;
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
    keyboardHandler = event => {
      if (!String(location.hash || "").startsWith("#/nus/slides/")) return;
      const tagName = event.target && event.target.tagName;
      if (event.metaKey || event.ctrlKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(tagName || "")) return;
      const key = String(event.key || "").toLowerCase();
      const target = ["arrowleft", "pageup", "k"].includes(key) ? previous : ["arrowright", "pagedown", "j"].includes(key) ? next : null;
      if (target) {
        event.preventDefault();
        location.hash = slideLink(slideSet, target);
        return;
      }
      if (key === "i") {
        const panel = document.getElementById("nus-slide-source-panel");
        if (panel) {
          event.preventDefault();
          panel.open = !panel.open;
        }
      }
    };
    document.addEventListener("keydown", keyboardHandler);
  }

  function render(courseCode, slideSetId, rawSlideNumber) {
    removeKeyboard();
    const course = getCourse(courseCode);
    const slideSet = getSlideSet(courseCode, slideSetId);
    if (!course || !slideSet) return notFound();
    const number = Math.min(Math.max(Number(rawSlideNumber) || 1, 1), slideSet.slides.length);
    const index = number - 1;
    const slide = slideSet.slides[index];
    const source = slideSet.source || {};
    const textbook = typeof getTextbook === "function" ? getTextbook(courseCode) : null;
    const lessonIds = Array.isArray(slideSet.lessonIds) ? slideSet.lessonIds : [];
    let body = pageHead(`${course.code} · Week 1 · slide ${slide.slideNumber}/${slideSet.slides.length}`, slide.title, slideSet.summary);
    body += `<div class="nus-lesson-actions"><div class="nus-slide-study-actions">${button("← Lesson", `#/nus/lesson/${course.code}/${lessonIds[0] || "dsa5105-erm"}`, "ghost")}${button("Course map", `#/nus/course/${course.code}`, "ghost")}${button("Practice lesson", `#/nus/exam/${course.code}/${lessonIds[0] || "dsa5105-erm"}`, "primary")}<button class="btn ghost" id="nus-toggle-source" type="button" aria-controls="nus-slide-source-panel">Source layer <kbd>I</kbd></button></div><span class="nus-slide-key-hint"><kbd>←</kbd><kbd>→</kbd> or <kbd>J</kbd><kbd>K</kbd> switch slides · <kbd>I</kbd> source</span>${slideNavigation(slideSet, index)}</div>`;
    body += sourcePanel(slide, source);
    body += `<div class="nus-slide-reader-grid"><aside class="nus-slide-strip" aria-label="Week 1 slides"><div class="nus-slide-strip-head"><b>All slides</b><span>${slideSet.slides.length} pages</span></div>${slideSet.slides.map(item => `<a class="nus-slide-thumb ${item.slideNumber === slide.slideNumber ? "active" : ""}" href="${slideLink(slideSet, item)}" data-route aria-label="Slide ${item.slideNumber}: ${esc(item.title)}"><img loading="lazy" src="${esc(item.assetPath)}" alt=""><span><b>${String(item.slideNumber).padStart(2, "0")}</b><small>${esc(item.title)}</small></span></a>`).join("")}</aside><main class="nus-slide-main"><section class="nus-slide-canvas nus-card"><div class="nus-slide-canvas-head"><span>${sourceBadge(slide.sourceRef)}</span><span class="nus-muted">${esc(slide.kind)} · ${esc(slide.status)} · ${slide.slideNumber}/${slideSet.slides.length}</span></div><img src="${esc(slide.assetPath)}" alt="${esc(slide.title)} — slide ${slide.slideNumber}" class="nus-slide-image"><p class="nus-slide-caption">Rendered from <code>${esc(source.sourceId || slide.sourceRef.sourceId)}</code>, page ${slide.pdfPage}. The image is the visual reference; the source layer above can be opened when you need to audit extraction.</p></section></main><aside class="nus-slide-context"><section class="nus-card nus-slide-explanation"><div class="nus-slide-section-head"><div><span class="eyebrow">Atlas layer</span><h3>Explanation</h3></div><span class="pill violet">Derived note</span></div>${explanation(slide)}</section><section class="nus-card nus-slide-socratic"><div class="nus-slide-section-head"><div><span class="eyebrow">Active recall</span><h3>Socratic questions</h3></div><span class="pill gold">${(slide.socraticQuestions || []).length} prompts</span></div><p class="nus-muted">Answer before opening the hint or strong answer.</p>${questions(slide)}</section><section class="nus-card nus-slide-depth" id="nus-slide-textbook-map"><div class="nus-slide-section-head"><div><span class="eyebrow">Parallel reading</span><h3>Textbook bridge</h3></div><span class="pill sage">${(slide.textbookRefs || []).length} mapped</span></div>${textbookMapping(slide, textbook)}${textbookReadingLens(slide, textbook)}<div class="nus-slide-reference-group"><h4>Reference layer</h4>${referenceList(slide.referenceRefs)}</div><p class="nus-muted">Lecture remains the exam-priority source. Textbook and reference material add depth; they do not rewrite the lecture.</p></section></aside></div>`;
    body += `<div class="nus-slide-bottom">${slideNavigation(slideSet, index)}</div>`;
    root.innerHTML = body;
    typeset();
    root.querySelector("#nus-slide-select")?.addEventListener("change", event => {
      location.hash = slideLink(slideSet, slideSet.slides.find(item => String(item.slideNumber) === event.target.value) || slide);
    });
    root.querySelector("#nus-toggle-source")?.addEventListener("click", () => {
      const panel = root.querySelector("#nus-slide-source-panel");
      if (panel) panel.open = !panel.open;
    });
    root.querySelectorAll(".nus-slide-thumb").forEach(item => item.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" })));
    bindKeyboard(slideSet, index);
  }

  return Object.freeze({ render });
});
