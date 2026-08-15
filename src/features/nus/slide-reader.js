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
    pageHead,
    sourceBadge,
    sourceItem,
    button,
    text,
    esc,
    typeset,
    notFound
  } = options;

  function sourceRefLabel(ref) {
    return `${ref.sourceId} · p.${ref.page}`;
  }

  function referenceList(refs) {
    if (!Array.isArray(refs) || !refs.length) return `<span class="nus-muted">No parallel depth reference mapped for this slide.</span>`;
    return `<ul class="nus-slide-refs">${refs.map(ref => `<li>${sourceBadge(ref)} <span>${esc(sourceRefLabel(ref))}</span>${ref.role ? `<small>${esc(ref.role)}</small>` : ""}</li>`).join("")}</ul>`;
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
    return fields.map(([title, body]) => `<section class="nus-slide-note"><h4>${esc(title)}</h4><p>${text(body)}</p></section>`).join("");
  }

  function questions(slide) {
    return (slide.socraticQuestions || []).map((question, index) => `<details class="nus-slide-question"><summary><span>${index + 1}. ${esc(question.prompt)}</span><small>${esc(question.type)}</small></summary><p><b>Hint:</b> ${text(question.hint)}</p><details><summary>Reveal a strong answer</summary><p>${text(question.answer)}</p></details></details>`).join("");
  }

  function slideNavigation(slideSet, index) {
    const previous = slideSet.slides[index - 1];
    const next = slideSet.slides[index + 1];
    const current = slideSet.slides[index];
    const link = slide => `#/nus/slides/${encodeURIComponent(slideSet.courseId)}/${encodeURIComponent(slideSet.id)}/${slide.slideNumber}`;
    return `<div class="nus-slide-nav"><div>${previous ? button("← Previous", link(previous), "ghost") : `<span class="nus-muted">First slide</span>`}</div><label class="nus-slide-jump">Slide <select id="nus-slide-select" aria-label="Jump to slide">${slideSet.slides.map(item => `<option value="${item.slideNumber}" ${item.slideNumber === current.slideNumber ? "selected" : ""}>${item.slideNumber} · ${esc(item.title)}</option>`).join("")}</select></label><div>${next ? button("Next →", link(next), "primary") : `<span class="nus-muted">Last slide</span>`}</div></div>`;
  }

  function render(courseCode, slideSetId, rawSlideNumber) {
    const course = getCourse(courseCode);
    const slideSet = getSlideSet(courseCode, slideSetId);
    if (!course || !slideSet) return notFound();
    const number = Math.min(Math.max(Number(rawSlideNumber) || 1, 1), slideSet.slides.length);
    const index = number - 1;
    const slide = slideSet.slides[index];
    const source = slideSet.source || {};
    let body = pageHead(`${course.code} · Week 1 · slide ${slide.slideNumber}/${slideSet.slides.length}`, slide.title, slideSet.summary);
    body += `<div class="nus-lesson-actions">${button("← Lesson", `#/nus/lesson/${course.code}/${slideSet.lessonIds[0] || "dsa5105-erm"}`, "ghost")}${button("Course map", `#/nus/course/${course.code}`, "ghost")}${button("Practice lesson", `#/nus/exam/${course.code}/${slideSet.lessonIds[0] || "dsa5105-erm"}`, "primary")}${slideNavigation(slideSet, index)}</div>`;
    body += `<section class="nus-slide-source-bar"><div><span class="eyebrow">Lecture core</span><b>${esc(source.fileName || source.sourceId)}</b><span>${sourceBadge({ sourceType: "lecture", status: "current" })} · PDF page ${slide.pdfPage} · rendered slide ${slide.slideNumber}</span></div><p>${esc(source.access === "local-only" ? "Original PDF stays local; this production-safe reader shows the exact page render and provenance." : "Original PDF is available under the configured access policy.")}</p></section>`;
    body += `<div class="nus-slide-reader-grid"><aside class="nus-slide-strip" aria-label="Week 1 slides"><div class="nus-slide-strip-head"><b>All slides</b><span>${slideSet.slides.length} pages</span></div>${slideSet.slides.map(item => `<a class="nus-slide-thumb ${item.slideNumber === slide.slideNumber ? "active" : ""}" href="#/nus/slides/${encodeURIComponent(course.code)}/${encodeURIComponent(slideSet.id)}/${item.slideNumber}" data-route aria-label="Slide ${item.slideNumber}: ${esc(item.title)}"><img loading="lazy" src="${esc(item.assetPath)}" alt=""><span><b>${String(item.slideNumber).padStart(2, "0")}</b><small>${esc(item.title)}</small></span></a>`).join("")}</aside><main class="nus-slide-main"><section class="nus-slide-canvas nus-card"><div class="nus-slide-canvas-head"><span>${sourceBadge(slide.sourceRef)}</span><span class="nus-muted">${esc(slide.kind)} · ${esc(slide.status)}</span></div><img src="${esc(slide.assetPath)}" alt="${esc(slide.title)} — slide ${slide.slideNumber}" class="nus-slide-image"><p class="nus-slide-caption">Rendered from <code>${esc(source.sourceId || slide.sourceRef.sourceId)}</code>, page ${slide.pdfPage}. The image is the visual reference; the text layer below is extracted separately.</p></section><section class="nus-card nus-slide-extracted"><div class="nus-slide-section-head"><div><span class="eyebrow">Source layer</span><h3>Extracted text and blocks</h3></div><span class="pill">JSON provenance</span></div><p class="nus-muted">Every block retains sourceId, page, block type, bounding box, and image ID when present.</p>${extractedBlocks(slide)}</section></main><aside class="nus-slide-context"><section class="nus-card nus-slide-explanation"><div class="nus-slide-section-head"><div><span class="eyebrow">Atlas layer</span><h3>Explanation</h3></div><span class="pill violet">Derived note</span></div>${explanation(slide)}</section><section class="nus-card nus-slide-socratic"><div class="nus-slide-section-head"><div><span class="eyebrow">Active recall</span><h3>Socratic questions</h3></div><span class="pill gold">${slide.socraticQuestions.length} prompts</span></div><p class="nus-muted">Answer before opening the hint or strong answer.</p>${questions(slide)}</section><section class="nus-card nus-slide-depth"><div class="nus-slide-section-head"><div><span class="eyebrow">Parallel reading</span><h3>Textbook / reference</h3></div><span class="pill sage">Depth</span></div>${referenceList(slide.textbookRefs)}${referenceList(slide.referenceRefs)}<p class="nus-muted">Lecture remains the exam-priority source. These links add depth; they do not rewrite the lecture.</p></section></aside></div>`;
    body += `<div class="nus-slide-bottom">${slideNavigation(slideSet, index)}</div>`;
    root.innerHTML = body;
    typeset();
    root.querySelector("#nus-slide-select")?.addEventListener("change", event => {
      location.hash = `#/nus/slides/${encodeURIComponent(course.code)}/${encodeURIComponent(slideSet.id)}/${event.target.value}`;
    });
    root.querySelectorAll(".nus-slide-thumb").forEach(item => item.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" })));
  }

  return Object.freeze({ render });
});
