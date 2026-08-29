/* NUS Atlas application shell.
 * Course content and study features live behind the canonical repository. */
(function () {
  "use strict";

  const app = document.getElementById("app");
  const SIDEBAR_KEY = "atlas.sidebarCollapsed";
  let router;
  let shortcuts = null;
  let lastXp = null;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }

  function normalizeDoubleEscapedMath(source) {
    return String(source || "").replace(/(?<!\\)\\{2}(?=(?:alpha|beta|begin|mathbf|dagger|delta|ell|end|frac|ge|hat|in|infty|lambda|le|langle|mathbb|mathrm|mu|operatorname|partial|Phi|psi|rho|sim|sqrt|sum|text|theta|tilde|top|widehat)\b)/g, "\\");
  }

  function normalizeMathText(value) {
    if (!value || value.indexOf("$") < 0) return value;
    let output = "";
    let index = 0;
    while (index < value.length) {
      if (value[index] === "\\" && value[index + 1] === "$") {
        output += value.slice(index, index + 2);
        index += 2;
        continue;
      }
      if (value[index] !== "$") {
        output += value[index++];
        continue;
      }
      const delimiter = value[index + 1] === "$" ? "$$" : "$";
      let cursor = index + delimiter.length;
      let closed = -1;
      while (cursor < value.length) {
        if (value[cursor] === "\\") { cursor += 2; continue; }
        if (delimiter === "$$" ? value[cursor] === "$" && value[cursor + 1] === "$" : value[cursor] === "$") { closed = cursor; break; }
        cursor += 1;
      }
      if (closed < 0) { output += value.slice(index); break; }
      output += delimiter + normalizeDoubleEscapedMath(value.slice(index + delimiter.length, closed)) + delimiter;
      index = closed + delimiter.length;
    }
    return output;
  }

  function normalizeMathTextNodes(container) {
    if (!container || typeof document.createTreeWalker !== "function") return;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (parent && parent.closest(".katex, script, style, textarea")) continue;
      if (node.nodeValue && node.nodeValue.indexOf("$") >= 0) nodes.push(node);
    }
    nodes.forEach(textNode => { textNode.nodeValue = normalizeMathText(textNode.nodeValue); });
  }

  function typeset(target = app, retries = 0) {
    if (window.renderMathInElement) {
      try {
        normalizeMathTextNodes(target);
        window.renderMathInElement(target, {
          delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }],
          throwOnError: false
        });
      } catch (_) {}
      return;
    }
    if (retries < 40) setTimeout(() => typeset(target, retries + 1), 120);
  }
  window.typeset = typeset;

  function repository() { return window.ATLAS_REPOSITORY || null; }
  function courses() { return repository() ? repository().listCourses() : []; }
  function lessons(code) { return repository() ? repository().listLessons(code) : []; }
  function currentHash() { return location.hash || "#/"; }

  function reducedMotion() {
    try { return document.documentElement.getAttribute("data-reduce-motion") === "on" || window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch (_) { return false; }
  }

  function modalA11y(scrim, card, label) {
    const opener = document.activeElement;
    card?.setAttribute("role", "dialog");
    card?.setAttribute("aria-modal", "true");
    if (card && label) card.setAttribute("aria-label", label);
    const selector = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const focusables = () => [...(card || scrim).querySelectorAll(selector)].filter(item => item.offsetParent !== null);
    const onKey = event => {
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) { event.preventDefault(); card?.focus(); return; }
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    };
    scrim.addEventListener("keydown", onKey);
    const items = focusables();
    if (items.length) items[0].focus(); else card?.focus();
    return () => { scrim.removeEventListener("keydown", onKey); if (opener && document.contains(opener)) opener.focus(); };
  }

  function showIntro(force) {
    if (!force) {
      try { if (localStorage.getItem("atlas.introSeen")) return; } catch (_) {}
    }
    const list = courses();
    const totalLessons = list.reduce((sum, course) => sum + lessons(course.code).length, 0);
    const first = list[0] && lessons(list[0].code)[0];
    const startHash = first ? `#/nus/lesson/${list[0].code}/${first.id}` : "#/nus/courses";
    const overlay = document.createElement("div");
    overlay.className = "intro-ov";
    overlay.innerHTML = `<div class="intro-card"><div class="intro-eyebrow">Welcome to NUS Atlas</div><h2 class="intro-title">Study, then prove it</h2><p class="intro-sub">A focused workspace for ${list.map(course => esc(course.code)).join(", ") || "your DSA courses"}. Read source-backed lessons, practise retrieval, and plan the next study block.</p><div class="intro-grid"><div class="intro-item"><span>📖</span><b>Learn</b><small>${totalLessons} lessons across ${list.length} DSA courses.</small></div><div class="intro-item"><span>📝</span><b>Practice</b><small>Recall prompts, worked solutions, labs, and timed Exam Mode.</small></div><div class="intro-item"><span>🗓️</span><b>Plan</b><small>Assessment weights, dates, checklists, and study deadlines.</small></div><div class="intro-item"><span>🔎</span><b>Verify</b><small>Every lesson keeps its lecture, exercise, textbook, or reference trail.</small></div></div><p class="intro-tip">Start with one lesson. Progress is saved locally and can be synced across devices.</p><button class="btn primary" id="intro-go">Open the first lesson →</button></div>`;
    document.body.appendChild(overlay);
    let release;
    const close = () => {
      try { localStorage.setItem("atlas.introSeen", "1"); } catch (_) {}
      release?.();
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    };
    const onKey = event => { if (event.key === "Escape") close(); };
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    overlay.querySelector("#intro-go").addEventListener("click", () => { close(); location.hash = startHash; });
    document.addEventListener("keydown", onKey);
    release = modalA11y(overlay, overlay.querySelector(".intro-card"), "Welcome to NUS Atlas");
  }

  function renderChrome() {
    const store = window.ATLAS_STUDY_STORE;
    const signal = store?.gamification?.() || {};
    const level = signal.level || { level: 1, name: "Novice", pct: 0, xp: Number(signal.xp) || 0, toNext: 0, next: null };
    const nav = document.getElementById("nav-courses");
    if (nav) nav.innerHTML = courses().map(course => {
      const progress = store?.courseProgress ? store.courseProgress(course.code, lessons(course.code)) : { pct: 0 };
      return `<a href="#/nus/course/${esc(course.code)}" data-route><span class="dot" style="background:${esc(course.color || "var(--gold)")}"></span>${esc(course.title || course.code)} <span style="margin-left:auto;font-size:11px;color:var(--ink-mute)">${progress.pct}%</span></a>`;
    }).join("");
    const setText = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
    setText("ring-num", level.level);
    setText("lvl-name", level.name || "Novice");
    setText("lvl-sub", `Level ${level.level}`);
    setText("xp-text", level.next ? `${level.xp.toLocaleString()} XP · ${level.toNext.toLocaleString()} to ${level.next.name}` : `${level.xp.toLocaleString()} XP · max level`);
    document.getElementById("ring")?.style.setProperty("--ring", `${level.pct || 0}%`);
    const fill = document.getElementById("xp-fill"); if (fill) fill.style.width = `${level.pct || 0}%`;
    const streak = Number(signal.streak) || 0;
    setText("streak-num", streak);
    const streakLink = document.querySelector("a.streak");
    if (streakLink) streakLink.setAttribute("aria-label", `${streak}-day streak — review your progress`);
    const flame = document.querySelector(".streak .flame");
    if (flame) {
      const tier = streak <= 0 ? "unlit" : streak < 7 ? "lit" : streak < 30 ? "hot" : streak < 100 ? "blazing" : "inferno";
      flame.classList.remove("flame-unlit", "flame-lit", "flame-hot", "flame-blazing", "flame-inferno");
      flame.classList.add(`flame-${tier}`);
      flame.dataset.tier = tier;
    }
    document.querySelectorAll("[data-route]").forEach(link => {
      const active = link.getAttribute("href") === currentHash();
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    });
    if (lastXp != null && level.xp > lastXp) window.dispatchEvent(new CustomEvent("atlas:xp", { detail: level.xp - lastXp }));
    lastXp = level.xp;
  }

  function initTheme() {
    const root = document.documentElement;
    const saved = localStorage.getItem("atlas.theme") || "ink";
    root.setAttribute("data-theme", saved);
    const button = document.getElementById("theme-toggle");
    const update = theme => { if (button) button.innerHTML = theme === "ink" ? "☾ &nbsp;Ink theme" : "☀ &nbsp;Parchment theme"; };
    update(saved);
    button?.addEventListener("click", () => { const next = root.getAttribute("data-theme") === "ink" ? "parchment" : "ink"; root.setAttribute("data-theme", next); localStorage.setItem("atlas.theme", next); update(next); });
  }

  function initAccessibility() {
    const root = document.documentElement;
    const contrast = localStorage.getItem("atlas.contrast") === "high" ? "high" : "normal";
    root.setAttribute("data-contrast", contrast);
    const contrastButton = document.getElementById("contrast-toggle");
    const updateContrast = value => { if (contrastButton) { contrastButton.textContent = value === "high" ? "◉  High contrast: on" : "◐ High contrast"; contrastButton.setAttribute("aria-pressed", value === "high"); } };
    updateContrast(contrast);
    contrastButton?.addEventListener("click", () => { const next = root.getAttribute("data-contrast") === "high" ? "normal" : "high"; root.setAttribute("data-contrast", next); localStorage.setItem("atlas.contrast", next); updateContrast(next); });
    if (localStorage.getItem("atlas.reduceMotion") === "1") root.setAttribute("data-reduce-motion", "on");
  }

  function setSidebarCollapsed(collapsed) {
    if (window.innerWidth <= 900) return;
    document.body.classList.toggle("nus-sidebar-collapsed", collapsed);
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
    const button = document.getElementById("menu-btn");
    if (button) { button.textContent = collapsed ? "→" : "☰"; button.setAttribute("aria-expanded", collapsed ? "false" : "true"); }
  }
  function closeSidebar() {
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("scrim")?.remove();
  }
  function initMobile() {
    const button = document.getElementById("menu-btn");
    const sync = () => { if (window.innerWidth > 900) setSidebarCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1"); else document.body.classList.remove("nus-sidebar-collapsed"); };
    button?.addEventListener("click", () => {
      if (window.innerWidth > 900) setSidebarCollapsed(!document.body.classList.contains("nus-sidebar-collapsed"));
      else {
        document.getElementById("sidebar")?.classList.add("open");
        const scrim = document.createElement("div"); scrim.id = "scrim"; scrim.className = "scrim"; scrim.addEventListener("click", closeSidebar); document.body.appendChild(scrim);
      }
    });
    sync();
    window.addEventListener("resize", sync, { passive: true });
  }

  function searchItems() {
    const items = [
      ["Home", "Study dashboard", "#/"], ["Courses", "DSA course directory", "#/nus/courses"], ["Review", "Retrieval and mistakes", "#/nus/review"],
      ["Plan", "DSA assessment planner", "#/nus/planner"], ["Assessment map", "Assessment evidence map", "#/nus/assessment-map"], ["SQL Studio", "DSA5104 query practice", "#/nus/sql"], ["Systems lab", "DSA5208 simulations", "#/nus/simulations"]
    ].map(([title, sub, hash]) => ({ title, sub, hash }));
    courses().forEach(course => {
      items.push({ title: course.title || course.code, sub: course.code, hash: `#/nus/course/${course.code}` });
      lessons(course.code).forEach(lesson => items.push({ title: lesson.title, sub: `${course.code} · Week ${lesson.week || ""}`, hash: `#/nus/lesson/${course.code}/${lesson.id}` }));
    });
    return items;
  }
  function openPalette() {
    if (document.querySelector(".palette-scrim")) return;
    const overlay = document.createElement("div"); overlay.className = "palette-scrim";
    overlay.innerHTML = `<div class="palette-card" role="dialog" aria-modal="true" aria-label="Search DSA courses"><input id="palette-input" class="palette-input" placeholder="Search DSA courses and lessons…" autocomplete="off"><div id="palette-results" class="palette-results"></div></div>`;
    document.body.appendChild(overlay);
    const input = overlay.querySelector("#palette-input"); const results = overlay.querySelector("#palette-results");
    const render = () => {
      const query = input.value.trim().toLowerCase();
      const matches = searchItems().filter(item => `${item.title} ${item.sub}`.toLowerCase().includes(query)).slice(0, 16);
      results.innerHTML = matches.map(item => `<a href="${esc(item.hash)}" data-palette-route><b>${esc(item.title)}</b><small>${esc(item.sub)}</small></a>`).join("") || `<p class="palette-empty">No DSA match.</p>`;
      results.querySelectorAll("[data-palette-route]").forEach(link => link.addEventListener("click", () => overlay.remove()));
    };
    input.addEventListener("input", render);
    overlay.addEventListener("click", event => { if (event.target === overlay) overlay.remove(); });
    document.addEventListener("keydown", function close(event) { if (event.key === "Escape") { overlay.remove(); document.removeEventListener("keydown", close); } }, { once: true });
    modalA11y(overlay, overlay.querySelector(".palette-card"), "Search DSA courses");
    render();
  }

  function showShortcuts() {
    if (shortcuts) return;
    shortcuts = document.createElement("div"); shortcuts.className = "sc-ov";
    shortcuts.innerHTML = `<div class="sc-card"><div class="intro-eyebrow">Quick reference</div><h2 class="sc-title">⌨ Keyboard shortcuts</h2><div class="sc-group"><h3>Navigation</h3><div class="sc-row"><span class="sc-keys"><kbd>⌘K</kbd> / <kbd>Ctrl K</kbd></span><span class="sc-desc">Search DSA courses and lessons</span></div><div class="sc-row"><span class="sc-keys"><kbd>\</kbd></span><span class="sc-desc">Hide or show the left navigation</span></div><div class="sc-row"><span class="sc-keys"><kbd>?</kbd></span><span class="sc-desc">Show this shortcuts list</span></div></div><div class="sc-group"><h3>Lessons and practice</h3><div class="sc-row"><span class="sc-keys"><kbd>[</kbd> / <kbd>]</kbd></span><span class="sc-desc">Previous or next lesson</span></div><div class="sc-row"><span class="sc-keys"><kbd>1–4</kbd> / <kbd>A–D</kbd></span><span class="sc-desc">Choose a practice answer</span></div><div class="sc-row"><span class="sc-keys"><kbd>Enter</kbd></span><span class="sc-desc">Continue the current study action</span></div></div><button class="btn primary" id="sc-close">Got it</button></div>`;
    document.body.appendChild(shortcuts);
    const close = () => { shortcuts?.remove(); shortcuts = null; };
    shortcuts.addEventListener("click", event => { if (event.target === shortcuts) close(); });
    shortcuts.querySelector("#sc-close").addEventListener("click", close);
    modalA11y(shortcuts, shortcuts.querySelector(".sc-card"), "Keyboard shortcuts");
  }

  function lessonRoute() {
    const parts = router.parseHash(currentHash());
    return parts[0] === "nus" && parts[1] === "lesson" ? parts : null;
  }
  function studyKeys(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || "")) return;
    if (document.querySelector(".palette-scrim, .intro-ov, .sc-ov, .atlas-sync-overlay, .nus-exam-schedule-overlay")) return;
    if (e.key === "\\") { e.preventDefault(); document.getElementById("menu-btn")?.click(); return; }
    if (e.key === "?") { e.preventDefault(); showShortcuts(); return; }
    const route = lessonRoute();
    if ((e.key === "[" || e.key === "]") && route) {
      const list = lessons(route[2]); const index = list.findIndex(item => item.id === route[3]); const target = list[index + (e.key === "[" ? -1 : 1)];
      if (target) { e.preventDefault(); location.hash = `#/nus/lesson/${route[2]}/${target.id}`; }
    }
  }

  function readProgress() {
    const bar = document.getElementById("read-progress");
    if (!bar) return;
    const page = document.scrollingElement || document.documentElement;
    const max = page.scrollHeight - page.clientHeight;
    bar.classList.toggle("on", max > 400);
    const fill = bar.firstElementChild; if (fill) fill.style.width = max > 400 ? `${Math.round(page.scrollTop / max * 100)}%` : "0%";
  }

  function renderRoute(parts, context) {
    const path = parts || [];
    document.body.classList.toggle("nus-route", path[0] === "nus" || path.length === 0);
    app.classList.add("nus-root");
    window.scrollTo?.(0, 0);
    document.title = path[0] === "nus" ? "NUS Atlas · Study Studio" : "NUS Atlas · Study Studio";
    if (!window.ATLAS_NUS_UI) throw new Error("NUS study UI is not loaded");
    return window.ATLAS_NUS_UI.renderRoute(path[0] === "nus" ? path.slice(1) : path, context);
  }

  function bootRouter() {
    router = window.ATLAS_ROUTER({
      beforeRoute(parts) {
        window.ATLAS_NUS_UI?.stopTransient();
        closeSidebar();
        app.innerHTML = "";
        document.body.classList.toggle("nus-root", parts.length === 0 || parts[0] === "nus");
      },
      renderRoute,
      afterRoute(parts, _result, context) {
        if (context.error) { app.innerHTML = `<section class="empty-state"><h1>Study page unavailable</h1><p>${esc(context.error.message || "Try another DSA route.")}</p></section>`; return; }
        renderChrome();
        typeset();
        readProgress();
        const heading = app.querySelector("h1, h2"); if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
      }
    });
    window.addEventListener("hashchange", () => router.navigate());
    window.ATLAS_ROUTER_INSTANCE = router;
    router.navigate();
  }

  async function boot() {
    initTheme();
    initAccessibility();
    initMobile();
    window.addEventListener("keydown", studyKeys);
    window.addEventListener("scroll", readProgress, { passive: true });
    window.addEventListener("resize", readProgress, { passive: true });
    document.getElementById("search-btn")?.addEventListener("click", openPalette);
    document.getElementById("topbar-search")?.addEventListener("click", openPalette);
    document.getElementById("shortcuts-btn")?.addEventListener("click", showShortcuts);
    document.getElementById("guide-btn")?.addEventListener("click", () => showIntro(true));
    document.getElementById("skip-link")?.addEventListener("click", () => { app.focus(); app.scrollIntoView(); });
    const accessCredential = window.ATLAS_ACCESS_GATE?.consumeCredential?.() || null;
    if (window.ATLAS_SYNC_UI && window.ATLAS_SYNC_CLIENT) {
      const syncTask = window.ATLAS_SYNC_UI({ document }).mount(window.ATLAS_SYNC_CLIENT, accessCredential);
      if (accessCredential && syncTask?.then) await syncTask;
    }
    bootRouter();
    renderChrome();
    showIntro(false);
  }

  function startBoot() {
    const accessReady = window.ATLAS_ACCESS_READY?.then ? window.ATLAS_ACCESS_READY : Promise.resolve();
    accessReady.then(async () => {
      const contentReady = window.ATLAS_CONTENT_READY?.then ? window.ATLAS_CONTENT_READY : Promise.resolve();
      await contentReady.catch(error => { app.innerHTML = `<section class="empty-state"><h1>DSA content unavailable</h1><p>${esc(error.message || "Refresh to try again.")}</p></section>`; });
      await boot();
    }).catch(error => { app.innerHTML = `<section class="empty-state"><h1>Atlas could not start</h1><p>${esc(error.message || "Refresh to try again.")}</p></section>`; });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startBoot, { once: true });
  else startBoot();
})();
