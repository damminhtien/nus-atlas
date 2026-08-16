/* PDF-first textbook reader. It intentionally renders only the source page
 * and navigation context; lecture Atlas annotations belong to the slide view. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_TEXTBOOK_READER_FEATURE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createNusTextbookReaderFeature(options) {
  const {
    root,
    getCourse,
    getTextbook,
    getStore,
    pageHead,
    sourceBadge,
    button,
    text,
    esc,
    notFound,
    readingTimer
  } = options;
  let keyboardHandler = null;

  function resourceId(courseCode, textbook) {
    return `textbook:${courseCode}:${textbook && textbook.source ? textbook.source.sourceId : "Textbook.pdf"}`;
  }
  function savedReading(id) {
    const store = typeof getStore === "function" ? getStore() : null;
    return store && typeof store.readingFor === "function" ? store.readingFor(id) : null;
  }
  function saveReading(progress) {
    const store = typeof getStore === "function" ? getStore() : null;
    return store && typeof store.recordReading === "function" ? store.recordReading(progress) : null;
  }
  function percent(progress) {
    if (!progress || !progress.total) return 0;
    return Math.round(Math.min(1, (Number(progress.furthest || progress.position) || 0) / progress.total) * 100);
  }
  function locationFor(textbook, page) {
    const pageNumber = Number(page);
    if (!textbook || !Array.isArray(textbook.chapters) || !Number.isFinite(pageNumber)) return null;
    const chapter = textbook.chapters.find(item => pageNumber >= Number(item.pageStart) && pageNumber <= Number(item.pageEnd));
    if (!chapter) return null;
    const section = (chapter.sections || []).find(item => pageNumber >= Number(item.pageStart) && pageNumber <= Number(item.pageEnd));
    return { chapter, section: section || null };
  }
  function pageAsset(courseCode, textbook, page) {
    const reader = textbook.reader || {};
    const padding = Math.max(1, Number(reader.pageNumberPadding) || 3);
    const padded = String(page).padStart(padding, "0");
    const pattern = reader.assetPattern || "page-{page}.jpg";
    return (reader.assetRoot || `assets/nus/${String(courseCode).toLowerCase()}/textbook`) + "/" + pattern.replace("{page}", padded);
  }
  function link(courseCode, page) { return `#/nus/textbook/${encodeURIComponent(courseCode)}/${page}`; }
  function outline(courseCode, textbook, page) {
    return (textbook.chapters || []).map(chapter => {
      const active = Number(page) >= Number(chapter.pageStart) && Number(page) <= Number(chapter.pageEnd);
      const pages = chapter.pageStart === chapter.pageEnd ? `p.${chapter.pageStart}` : `pp.${chapter.pageStart}–${chapter.pageEnd}`;
      return `<a class="nus-textbook-chapter ${active ? "active" : ""}" href="${link(courseCode, chapter.pageStart)}" data-route><span>Ch. ${esc(chapter.number)}</span><b>${esc(chapter.title)}</b><small>${pages}</small></a>`;
    }).join("");
  }
  function progressBlock(courseCode, textbook, current) {
    const id = resourceId(courseCode, textbook);
    const progress = savedReading(id);
    if (!progress) return `<section class="nus-reading-progress nus-reading-progress-empty"><span><b>Textbook reading progress</b><small>Start with page ${current}; progress resumes automatically.</small></span><strong>0%</strong></section>`;
    const furthest = Number(progress.furthest || progress.position) || current;
    return `<section class="nus-reading-progress"><span><b>Textbook reading progress</b><small>${progress.completed ? "Complete · revisit any page" : `Resume at p.${Number(progress.position) || current}`}</small></span><strong>${percent(progress)}%</strong><div class="nus-progress"><span style="width:${percent(progress)}%"></span></div><small class="nus-reading-progress-meta">through p.${furthest} of ${progress.total}</small></section>`;
  }
  function pageNavigation(courseCode, textbook, page) {
    const total = Number(textbook.pageCount) || 1;
    const previous = page > 1 ? button("← Previous page", link(courseCode, page - 1), "ghost") : `<span class="nus-muted">First page</span>`;
    const next = page < total ? button("Next page →", link(courseCode, page + 1), "primary") : `<span class="nus-muted">Last page</span>`;
    return `<nav class="nus-textbook-page-nav"><div>${previous}</div><form id="nus-textbook-page-form"><label>Page <input id="nus-textbook-page-input" type="number" min="1" max="${total}" value="${page}" inputmode="numeric"><span>of ${total}</span></label><button class="btn ghost" type="submit">Go</button></form><div>${next}</div></nav>`;
  }
  function removeKeyboard() {
    if (keyboardHandler && typeof document !== "undefined") document.removeEventListener("keydown", keyboardHandler);
    keyboardHandler = null;
  }
  function bindKeyboard(courseCode, textbook, page) {
    removeKeyboard();
    if (typeof document === "undefined") return;
    const total = Number(textbook.pageCount) || 1;
    keyboardHandler = event => {
      if (!String(location.hash || "").startsWith("#/nus/textbook/")) return;
      const tagName = event.target && event.target.tagName;
      if (event.metaKey || event.ctrlKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(tagName || "")) return;
      const key = String(event.key || "").toLowerCase();
      const target = ["arrowleft", "pageup", "k"].includes(key) ? page - 1 : ["arrowright", "pagedown", "j"].includes(key) ? page + 1 : null;
      if (target && target >= 1 && target <= total) {
        event.preventDefault();
        location.hash = link(courseCode, target);
      }
    };
    document.addEventListener("keydown", keyboardHandler);
  }

  function render(courseCode, rawPage) {
    removeKeyboard();
    const course = typeof getCourse === "function" ? getCourse(courseCode) : null;
    const textbook = typeof getTextbook === "function" ? getTextbook(courseCode) : null;
    if (!course || !textbook || !textbook.reader) return notFound();
    const total = Math.max(1, Number(textbook.pageCount) || 1);
    const id = resourceId(courseCode, textbook);
    const previous = savedReading(id);
    const savedPage = previous && !previous.completed ? Number(previous.position) : 0;
    const requested = rawPage == null && savedPage > 0 ? savedPage : Number(rawPage) || 1;
    const page = Math.min(Math.max(requested, 1), total);
    const locationInfo = locationFor(textbook, page);
    saveReading({ resourceId: id, kind: "textbook", courseCode, sourceId: textbook.source && textbook.source.sourceId, title: textbook.source && textbook.source.role, unit: "page", position: page, total });
    const chapterLabel = locationInfo ? `Chapter ${locationInfo.chapter.number} · ${locationInfo.chapter.title}` : "Course textbook";
    let body = `<div class="nus-textbook-reader-page">${pageHead(`${course.code} · Textbook PDF · p.${page}/${total}`, chapterLabel, "Read the supplied textbook as a page-faithful PDF view. Lecture annotations stay in the slide reader.")}`;
    body += `${readingTimer && typeof readingTimer.render === "function" ? readingTimer.render(id) : ""}<div class="nus-lesson-actions">${button("← Course", `#/nus/course/${course.code}`, "ghost")}${courseCode === "DSA5105" ? button("Week 1 slides", "#/nus/slides/DSA5105/dsa5105-week1-annotated/1", "ghost") : ""}<span class="nus-textbook-reader-hint"><kbd>←</kbd><kbd>→</kbd> or <kbd>J</kbd><kbd>K</kbd> change page</span></div>`;
    body += progressBlock(courseCode, textbook, page);
    body += `<div class="nus-textbook-reader-grid"><aside class="nus-textbook-outline" aria-label="Textbook chapters"><div class="nus-textbook-outline-head"><b>Contents</b><span>${textbook.chapters.length} chapters</span></div>${outline(courseCode, textbook, page)}</aside><main class="nus-textbook-page-main"><section class="nus-card nus-textbook-page-card"><div class="nus-textbook-page-head"><div><span>${sourceBadge(textbook.source || { sourceType: "textbook" })}</span><b>PDF page ${page}</b>${locationInfo && locationInfo.section ? `<small>${esc(locationInfo.section.number)} · ${esc(locationInfo.section.title)}</small>` : ""}</div><span class="pill">Source view</span></div><div class="nus-textbook-page-frame"><img class="nus-textbook-page-image" src="${esc(pageAsset(courseCode, textbook, page))}" alt="${esc(textbook.source && textbook.source.sourceId)} — PDF page ${page}" decoding="async"></div><p class="nus-textbook-page-caption">${esc(textbook.source && textbook.source.sourceId)} · page ${page}. This view keeps textbook wording and layout separate from Atlas-authored explanations.</p></section>${pageNavigation(courseCode, textbook, page)}</main></div></div>`;
    root.innerHTML = body;
    if (readingTimer && typeof readingTimer.bind === "function") readingTimer.bind(root);
    root.querySelector("#nus-textbook-page-form")?.addEventListener("submit", event => {
      event.preventDefault();
      const input = root.querySelector("#nus-textbook-page-input");
      const target = Math.min(Math.max(Number(input && input.value) || 1, 1), total);
      location.hash = link(courseCode, target);
    });
    bindKeyboard(courseCode, textbook, page);
  }

  return Object.freeze({ removeKeyboard, render });
});
