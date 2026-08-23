/* ============================================================
   ATLAS — SPA router + views + interactive engines
   ============================================================ */
(function () {
  "use strict";
  const C = () => window.COURSES;
  const nusRepository = () => window.ATLAS_REPOSITORY || null;
  const nusCourses = () => nusRepository() ? nusRepository().listCourses() : [];
  const nusContent = code => nusRepository() ? nusRepository().getCatalog(code) : { modules: [] };
  const app = document.getElementById("app");
  const esc = s => String(s == null ? "" : s);

  // ---------- math-safe content normalization ----------
  // KaTeX delimiters ($...$ / $$...$$) are injected into the DOM via innerHTML BEFORE typeset().
  // Two delimiter hazards, both fixed here by a single delimiter-aware pass at boot:
  //  (1) A literal "<" followed by a letter inside math (e.g. x_{<t}) is parsed by the HTML
  //      tokenizer as a tag-open, truncating the text node and breaking the $...$ pair. Fix:
  //      escape "<" → &lt; *inside math spans only*; the parser restores a literal "<" in the
  //      text node, which KaTeX renders correctly.
  //  (2) A bare escaped money dollar "\$" in prose (e.g. "wins \$2") leaves a stray "$" that
  //      KaTeX auto-render mis-pairs with the next real $...$, rendering the intervening prose
  //      as garbled math. Fix: outside math, rewrite "\$" → "$\$$" — a self-contained math span
  //      that KaTeX renders as a literal "$", so it can never mis-pair. (Inside math, "\$" is a
  //      valid literal dollar and is left untouched.)
  // Idempotent; leaves HTML tags, matrix "&", and >, alone. Runs once over all data at boot.
  function escapeMathLt(s) {
    if (!s || typeof s !== "string" || s.indexOf("$") < 0) return s;
    let out = "", i = 0; const n = s.length;
    while (i < n) {
      const ch = s[i];
      if (ch === "\\") {
        if (s[i + 1] === "$") { out += "$\\$$"; i += 2; continue; } // outside-math money "\$" → "$\$$"
        out += ch + (s[i + 1] || ""); i += 2; continue;             // copy other escaped pairs (\\, \{, …)
      }
      if (ch === "$") {
        const disp = s[i + 1] === "$";
        const delim = disp ? "$$" : "$";
        let j = i + delim.length, math = "", closed = -1;
        while (j < n) {
          if (s[j] === "\\") { math += s[j] + (s[j + 1] || ""); j += 2; continue; }
          if (disp ? (s[j] === "$" && s[j + 1] === "$") : s[j] === "$") { closed = j; break; }
          math += s[j]; j++;
        }
        if (closed < 0) { out += s.slice(i); break; } // unbalanced — leave the remainder as-is
        out += delim + math.replace(/</g, "&lt;") + delim;
        i = closed + delim.length;
      } else {
        // copy a whole run of plain chars (up to the next $ or \) in one slice — same output, far fewer concats
        let k = i + 1; while (k < n && s[k] !== "$" && s[k] !== "\\") k++;
        out += s.slice(i, k); i = k;
      }
    }
    return out;
  }
  // A JSON authoring mistake can turn one TeX command ("\\psi") into two runtime
  // backslashes ("\\\\psi"). Validate sources in CI, but normalize this exact
  // failure at the last safe boundary too, before KaTeX sees the text.
  const DOUBLE_ESCAPED_TEX_COMMAND = /(?<!\\)\\{2}(?=(?:alpha|beta|begin|mathbf|dagger|delta|ell|end|frac|ge|hat|in|infty|lambda|le|langle|mathbb|mathrm|mu|operatorname|partial|Phi|psi|rho|sim|sqrt|sum|text|theta|tilde|top|widehat)\b)/g;
  function normalizeDoubleEscapedMath(source) {
    return source.replace(DOUBLE_ESCAPED_TEX_COMMAND, "\\");
  }
  function normalizeMathText(value) {
    if (!value || value.indexOf("$") < 0) return value;
    let output = "", index = 0;
    while (index < value.length) {
      if (value[index] === "\\" && value[index + 1] === "$") {
        output += value.slice(index, index + 2); index += 2; continue;
      }
      if (value[index] !== "$") { output += value[index]; index += 1; continue; }
      const delimiter = value[index + 1] === "$" ? "$$" : "$";
      let cursor = index + delimiter.length, closed = -1;
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
  let _mathNormalized = false;
  function normalizeMath() {
    if (_mathNormalized) return; _mathNormalized = true;
    const E = escapeMathLt;
    (window.COURSES || []).forEach(c => (c.modules || []).forEach(m => (m.lessons || []).forEach(l => {
      if (l.content) l.content = E(l.content);
      (l.mcq || []).forEach(q => { q.q = E(q.q); q.explain = E(q.explain); if (Array.isArray(q.choices)) q.choices = q.choices.map(E); });
      (l.examples || []).forEach(ex => { for (const k in ex) if (typeof ex[k] === "string") ex[k] = E(ex[k]); });
      (l.homework || []).forEach(hw => { for (const k in hw) if (typeof hw[k] === "string") hw[k] = E(hw[k]); });
      (l.flashcards || []).forEach(fc => { for (const k in fc) if (typeof fc[k] === "string") fc[k] = E(fc[k]); });
    })));
    (window.GLOSSARY || []).forEach(g => { for (const k in g) if (typeof g[k] === "string") g[k] = E(g[k]); });
  }

  // ---------- math typeset ----------
  function typeset(retries) {
    if (window.renderMathInElement) {
      try {
        normalizeMathTextNodes(app);
        window.renderMathInElement(app, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      } catch (e) {}
    } else if ((retries || 0) < 40) {
      // KaTeX CDN script may not have attached yet — retry briefly.
      setTimeout(() => typeset((retries || 0) + 1), 120);
    }
  }
  // Scoped re-typeset for widgets (js/viz.js) whose notes update with $…$ after interaction —
  // the whole-app pass above only runs on view renders, so dynamic note updates need this.
  window.typeset = function (el) {
    if (window.renderMathInElement) {
      try {
        normalizeMathTextNodes(el || app);
        window.renderMathInElement(el || app, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      } catch (e) {}
    }
  };

  // ---------- lookups ----------
  function findCourse(id) { return C().find(c => c.id === id); }
  function findLesson(cid, lid) {
    const c = findCourse(cid); if (!c) return null;
    for (const m of c.modules) { const l = m.lessons.find(x => x.id === lid); if (l) return { course: c, module: m, lesson: l }; }
    return null;
  }
  function flatLessons(c) { const out = []; c.modules.forEach(m => m.lessons.forEach(l => out.push(l))); return out; }

  // ---------- lesson index + prerequisites / learning path ----------
  let _index = null;
  function index() {
    if (_index) return _index;
    _index = {}; let ord = 0;
    C().forEach(c => c.modules.forEach((m, mi) => m.lessons.forEach(l => {
      _index[l.id] = { course: c, module: m, lesson: l, order: ord++, moduleIdx: mi };
    })));
    return _index;
  }
  // explicit prerequisites = lesson.prereqs (in data) ∪ window.PREREQS[id] (cross-topic graph)
  function explicitPrereqs(id) {
    const node = index()[id]; if (!node) return [];
    const a = node.lesson.prereqs || [], b = (window.PREREQS && window.PREREQS[id]) || [];
    return a.concat(b).filter((v, i, arr) => arr.indexOf(v) === i);
  }
  // All lessons that should be learned before `lid`: explicit prereqs closure
  // PLUS the lessons preceding it within its own course (natural ordering).
  function learningPath(lid) {
    const idx = index(), seen = {}, out = [];
    function visit(id) {
      if (seen[id]) return; seen[id] = true;
      const node = idx[id]; if (!node) return;
      // explicit prerequisites first (incl. cross-topic)
      explicitPrereqs(id).forEach(visit);
      // in-course preceding lessons (implicit prerequisites)
      flatLessons(node.course).forEach(l => { if (idx[l.id].order < node.order) visit(l.id); });
      out.push(id);
    }
    visit(lid);
    // stable order by global index, target last
    return out.map(id => idx[id]).filter(Boolean).sort((a, b) => a.order - b.order);
  }

  // ---------- question bank ----------
  function allQuestions() {
    const out = [];
    C().forEach(c => c.modules.forEach(m => m.lessons.forEach(l => {
      (l.mcq || []).forEach((q, i) => out.push({ q, courseId: c.id, color: c.color, lessonId: l.id, lessonTitle: l.title, courseTitle: c.title, qIdx: i }));
    })));
    if (Array.isArray(window.QUESTION_BANK)) window.QUESTION_BANK.forEach(b => out.push(b));
    return out;
  }
  // questions the learner has answered wrong and not yet redeemed (resolved back to live question objects)
  function missedItems() {
    const want = {}; Store.missedKeys().forEach(k => want[k] = 1);
    if (!Object.keys(want).length) return [];
    const out = [];
    C().forEach(c => c.modules.forEach(m => m.lessons.forEach(l => {
      (l.mcq || []).forEach((q, i) => { if (want[l.id + "#" + i]) out.push({ q, courseId: c.id, color: c.color, lessonId: l.id, lessonTitle: l.title, courseTitle: c.title, qIdx: i }); });
    })));
    return out;
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---------- deterministic daily concept ----------
  function dayNumber() { const d = new Date(); return Math.floor(Date.parse(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + "T00:00:00") / 86400000); }
  function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function isReady(id) { return !Store.isLessonDone(id) && learningPath(id).every(p => p.lesson.id === id || Store.isLessonDone(p.lesson.id)); }
  function readySet() { const s = new Set(); C().forEach(c => c.modules.forEach(m => m.lessons.forEach(l => { if (isReady(l.id)) s.add(l.id); }))); return s; }
  function dailyConcept() {
    const all = []; C().forEach(c => c.modules.forEach(m => m.lessons.forEach(l => all.push(l.id))));
    if (!all.length) return null;
    const rng = mulberry(dayNumber() + 7);
    const undone = all.filter(id => !Store.isLessonDone(id));
    const ready = undone.filter(isReady);
    const stretch = undone.filter(id => ready.indexOf(id) < 0); // not-yet-reachable concepts
    let id, advanced = false;
    if (stretch.length && rng() < 0.25) { id = stretch[Math.floor(rng() * stretch.length)]; advanced = true; } // occasional peek ahead
    else if (ready.length) { id = ready[Math.floor(rng() * ready.length)]; }                                    // prefer an actionable concept
    else { const pool = undone.length ? undone : all; id = pool[Math.floor(rng() * pool.length)]; advanced = !!undone.length; }
    return { node: index()[id], advanced, ready: ready.indexOf(id) >= 0 };
  }
  // Deeper dive of the day — surfaces one of the hundreds of deep-dives, rotating daily, deep-linked to open straight to it.
  function dailyDeepDive() {
    const all = [];
    C().forEach(c => c.modules.forEach(m => m.lessons.forEach(l => {
      (String(l.content || "").match(/<summary>[\s\S]*?<\/summary>/g) || []).forEach((s, i) => all.push({ lid: l.id, k: i + 1, summary: s }));
    })));
    if (!all.length) return null;
    const rng = mulberry(dayNumber() + 101);   // offset apart from dailyConcept so the two daily picks don't correlate
    const pick = all[Math.floor(rng() * all.length)];
    const raw = pick.summary.replace(/<\/?summary>/g, "").replace(/<[^>]+>/g, "").replace(/\$[^$]*\$/g, "").replace(/^Deeper dive:\s*/i, "").replace(/\s+/g, " ").trim();
    const title = raw.charAt(0).toUpperCase() + raw.slice(1);   // deep-dive summaries are lowercase continuations ("why X…"); as a card heading, capitalize the first letter
    const node = index()[pick.lid];
    return node ? { node, k: pick.k, title } : null;
  }
  // a rotating interactive to surface the visualization catalog (most widgets live inside lessons)
  function dailyViz() {
    const cat = window.VIZ_CATALOG || [];
    if (!cat.length) return null;
    const rng = mulberry(dayNumber() + 211);   // offset apart from concept(+7) and dive(+101)
    const v = cat[Math.floor(rng() * cat.length)];
    let ctx = null;
    C().forEach(c => c.modules.forEach(m => m.lessons.forEach(l => { const s = String(l.content || ""); if (!ctx && (s.indexOf('data-viz="' + v.id + '"') >= 0 || s.indexOf("data-viz='" + v.id + "'") >= 0)) ctx = { course: c, lesson: l }; })));
    return { v, ctx };
  }

  // ---------- toast ----------
  let toastWrap;
  function toast(icon, title, desc) {
    if (!toastWrap) { toastWrap = document.createElement("div"); toastWrap.className = "toast-wrap"; toastWrap.setAttribute("role", "status"); toastWrap.setAttribute("aria-live", "polite"); document.body.appendChild(toastWrap); }
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<div class="t-ico">${icon}</div><div><div class="t-t">${esc(title)}</div><div class="t-d">${esc(desc)}</div></div>`;
    toastWrap.appendChild(el);
    setTimeout(() => { el.style.transition = "opacity .4s, transform .4s"; el.style.opacity = "0"; el.style.transform = "translateX(40px)"; setTimeout(() => el.remove(), 420); }, 3200);
  }
  function flushAchievements() {
    Store.drainUnlocked().forEach(a => toast(a.icon, "Achievement unlocked", a.name));
    const lus = Store.drainLevelUps ? Store.drainLevelUps() : [];
    if (lus.length) levelUpCelebrate(lus[lus.length - 1]); // celebrate the highest reached
    if (Store.goalJustReached && Store.goalJustReached()) {  // crossed today's daily XP goal — celebrate the moment it happens
      confetti();
      toast("🎯", "Daily goal reached!", "You hit your " + (Store.raw.goalXp || 50) + " XP target for today — keep the streak alive.");
    }
    if (Store.bestDayJustSet) { const bd = Store.bestDayJustSet(); if (bd) toast("⚡", "Best study day yet!", bd + " XP today — a new single-day record. You're on a tear."); }
  }

  // ---------- juice: XP-gain float + ring pulse + stat count-up ----------
  function reducedMotion() { return document.documentElement.getAttribute("data-reduce-motion") === "on" || !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function floatXP(n) {
    if (!(n > 0) || reducedMotion()) return;
    const ring = document.getElementById("ring"); if (!ring) return;
    const r = ring.getBoundingClientRect();
    const f = document.createElement("div");
    f.className = "xp-float"; f.textContent = "+" + n + " XP";
    f.style.left = (r.left + r.width / 2) + "px"; f.style.top = (r.top + 2) + "px";
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1300);
    ring.classList.remove("xp-pop"); void ring.offsetWidth; ring.classList.add("xp-pop");
  }
  // animate progress/mastery bars filling from 0 → their value on view load (the "watch your progress fill in" flourish)
  function sweepBars(root) {
    if (reducedMotion()) return;
    (root || app).querySelectorAll(".mastery-fill, .a-prog-fill, .ach-progress-fill").forEach(el => {
      const target = el.style.width; if (!target || target === "0%") return;
      el.style.width = "0%";
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.width = target; }));
    });
  }
  function flareStreak() {   // one-time celebratory flare when the streak ticks up on a new day
    const f = document.querySelector(".streak .flame"); if (!f || reducedMotion()) return;
    f.classList.remove("flame-flare"); void f.offsetWidth; f.classList.add("flame-flare");
    setTimeout(() => f.classList.remove("flame-flare"), 1300);
  }
  function sweepForecast() {
    if (reducedMotion()) return;
    document.querySelectorAll(".fcst-bar").forEach(el => {
      const target = el.style.height; if (!target || target === "0%") return;
      el.style.height = "0%";
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.height = target; }));
    });
  }
  function sweepStrip() {   // staggered pop-in of the 14-day consistency cells — a left-to-right "your history builds up" wave
    if (reducedMotion()) return;
    document.querySelectorAll(".cs-row .cs-cell").forEach((el, i) => {
      el.style.animationDelay = Math.min(i * 38, 540) + "ms";   // the CSS @keyframes ends at scale(1) (fill-mode both), so cells can't get stuck hidden
      el.classList.add("cs-pop");
    });
  }
  function sweepGoalRing(pct) {
    const gr = document.querySelector(".goal-ring"); if (!gr) return;
    const target = Math.max(0, Math.min(100, pct || 0));
    if (reducedMotion()) { gr.style.setProperty("--p", target); return; }
    // start at 0 (inline), then flip to target on the next frames so the --p transition fires
    requestAnimationFrame(() => requestAnimationFrame(() => gr.style.setProperty("--p", target)));
  }
  // celebrate a result screen: count the big score up + a spring "pop" entrance (reduced-motion safe)
  function animateBig() {
    const el = document.querySelector(".quiz-result .big") || document.querySelector(".recall-done .big");
    if (!el) return;
    countUp(el);   // counts the leading number (no-op under reduced-motion or for "✓ …")
    if (reducedMotion()) return;
    el.classList.remove("big-pop"); void el.offsetWidth; el.classList.add("big-pop");
  }
  function countUp(el, delay) {
    const m = String(el.textContent).trim().match(/^(\d[\d,]*)(.*)$/s);
    if (!m) return;
    const target = parseInt(m[1].replace(/,/g, ""), 10), rest = m[2];
    if (!(target > 0) || reducedMotion()) return;     // reduced-motion / zero keeps the real value untouched
    const dur = 700, finalText = target.toLocaleString() + rest;
    const run = () => {
      el.textContent = "0" + rest;                     // zero-state only when the animation actually starts (a deferred-but-never-run el keeps its real value, no 0-flash)
      const t0 = performance.now();
      (function tick(t) {
        const k = Math.max(0, Math.min(1, (t - t0) / dur)), e = 1 - Math.pow(1 - k, 3);  // clamp k≥0 (rAF/now clock skew can't drive it negative)
        el.textContent = Math.round(target * e).toLocaleString() + rest;
        if (k < 1) requestAnimationFrame(tick); else el.textContent = finalText;
      })(performance.now());
    };
    delay > 0 ? setTimeout(run, delay) : run();        // optional delay → cascade across a group of numbers
    // safety net: if rAF is throttled/stalled (background tab, slow device, navigation) the number must never be
    // left stuck at 0 — after the animation window, force the real value if it hasn't landed (fixes streak/stats showing 0).
    setTimeout(() => { if (el.textContent !== finalText) el.textContent = finalText; }, (delay > 0 ? delay : 0) + dur + 260);
  }

  // ---------- inline glossary tooltips (understandability) ----------
  // Wrap the first occurrence of each glossary term in lecture prose with a hover/tap
  // definition. Runs BEFORE typeset() and skips any text node containing "$" so KaTeX
  // delimiters are never split; the tooltip's own math is rendered by the following typeset().
  let _glossTerms = null;
  function glossTerms() {
    if (_glossTerms) return _glossTerms;
    const g = (window.GLOSSARY || []).filter(t => t.term && t.term.length >= 4);
    const seen = {}, list = [];
    g.forEach(t => { const k = t.term.toLowerCase(); if (!seen[k]) { seen[k] = 1; list.push(t); } });
    list.sort((a, b) => b.term.length - a.term.length);                       // longer terms win (multi-word first)
    const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    _glossTerms = { defByLc: list.reduce((o, t) => (o[t.term.toLowerCase()] = t.def, o), {}),
      re: list.length ? new RegExp("\\b(" + list.map(t => escRe(t.term)).join("|") + ")\\b", "i") : null };
    return _glossTerms;
  }
  function linkGlossary(root) {
    if (!root) return;
    const G = glossTerms(); if (!G.re) return;
    const SKIP = /^(A|CODE|PRE|BUTTON|H1|H2|H3|H4|SCRIPT|STYLE)$/;
    const blocked = node => {
      let p = node.parentNode;
      while (p && p !== root) {
        if (p.nodeType === 1) {
          if (SKIP.test(p.tagName)) return true;
          if (p.classList && (p.classList.contains("gloss") || p.classList.contains("katex"))) return true;
          if (p.hasAttribute && (p.hasAttribute("data-viz") || p.hasAttribute("data-code"))) return true;
        }
        p = p.parentNode;
      }
      return false;
    };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.nodeValue && /\S/.test(n.nodeValue) && n.nodeValue.indexOf("$") === -1 && !blocked(n))
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const nodes = []; let t; while ((t = walker.nextNode())) nodes.push(t);
    const used = new Set(); let count = 0; const MAX = 14;
    const escHtml = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    for (const node of nodes) {
      if (count >= MAX) break;
      const text = node.nodeValue; G.re.lastIndex = 0;
      const m = G.re.exec(text); if (!m) continue;
      const lc = m[0].toLowerCase(); if (used.has(lc)) continue;
      const def = G.defByLc[lc]; if (!def) continue;
      used.add(lc); count++;
      const span = document.createElement("span");
      span.className = "gloss"; span.tabIndex = 0; span.setAttribute("role", "button");
      span.setAttribute("aria-label", m[0] + " — show definition");
      span.innerHTML = escHtml(m[0]) + `<span class="gloss-pop" role="tooltip">${def}</span>`;
      const frag = document.createDocumentFragment();
      const before = text.slice(0, m.index), after = text.slice(m.index + m[0].length);
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(span);
      if (after) frag.appendChild(document.createTextNode(after));
      node.parentNode.replaceChild(frag, node);
    }
  }

  // Keep inline glossary tooltips inside the viewport. Each .gloss-pop is position:absolute, left:0, ~270px
  // wide; a term in the right half pushes its popup past the right edge — and because the popup is laid out
  // even while hidden (visibility:hidden), it adds horizontal page scroll on mobile. Shift any overflowing
  // popup left just enough to fit (never past the left edge), so it stays fully visible and the page doesn't
  // scroll sideways. Recompute after layout settles and on resize.
  function placeGlossPops(root) {
    const vw = document.documentElement.clientWidth, pad = 10;
    (root || app).querySelectorAll(".gloss").forEach(g => {
      const pop = g.querySelector(".gloss-pop"); if (!pop) return;
      pop.style.left = "0px";                                  // reset to default anchor before measuring
      const gl = g.getBoundingClientRect().left, w = pop.offsetWidth;
      let shift = 0;
      if (gl + w > vw - pad) shift = (vw - pad) - (gl + w);    // overflowing right → move left
      if (gl + shift < pad) shift = pad - gl;                  // but never push the popup off the left edge
      if (shift < 0) pop.style.left = Math.round(shift) + "px";
    });
  }
  let _glossTO = 0;
  window.addEventListener("resize", () => {
    clearTimeout(_glossTO);
    _glossTO = setTimeout(() => { if ((location.hash || "").indexOf("#/lesson/") === 0) placeGlossPops(app); }, 200);
  });

  // ---------- onboarding / welcome tour ----------
  // ---------- accessible modal helper: dialog semantics + focus trap + focus restore ----------
  // Marks the card as role=dialog/aria-modal, moves focus inside, traps Tab within the modal,
  // and on release() returns focus to whatever was focused when the modal opened.
  function modalA11y(scrim, card, label) {
    const opener = document.activeElement;
    if (card) {
      card.setAttribute("role", "dialog");
      card.setAttribute("aria-modal", "true");
      if (label && !card.getAttribute("aria-label")) card.setAttribute("aria-label", label);
      if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "-1");
    }
    const SEL = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const focusables = () => Array.prototype.filter.call((card || scrim).querySelectorAll(SEL), el => el.offsetParent !== null);
    function onKey(e) {
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) { e.preventDefault(); if (card) card.focus(); return; }
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    scrim.addEventListener("keydown", onKey);
    const f = focusables();
    if (f.length) f[0].focus(); else if (card) card.focus();
    return function release() {
      scrim.removeEventListener("keydown", onKey);
      if (opener && typeof opener.focus === "function" && document.contains(opener)) opener.focus();
    };
  }

  function showIntro(force) {
    if (!force) { try { if (localStorage.getItem("atlas.introSeen")) return; } catch (e) {} }
    // counts are computed live so the tour never goes stale as content grows
    const courses = window.COURSES || [];
    const nLessons = courses.reduce((s, c) => s + c.modules.reduce((a, m) => a + m.lessons.length, 0), 0);
    const nTopics = courses.length;
    const nViz = (window.VIZ_CATALOG || []).length;
    const nusCourseList = nusCourses();
    const nusLessons = nusCourseList.reduce((sum, c) => sum + (nusContent(c.code).modules || []).reduce((n, m) => n + (m.lessons || []).length, 0), 0);
    const isNus = nusCourseList.length > 0;
    const firstNus = nusCourseList[0] && (nusContent(nusCourseList[0].code).modules || [])[0];
    const firstNusLesson = firstNus && firstNus.lessons && firstNus.lessons[0];
    const startHash = firstNusLesson ? `#/nus/lesson/${nusCourseList[0].code}/${firstNusLesson.id}` : "#/";
    const ov = document.createElement("div"); ov.className = "intro-ov";
    ov.innerHTML = `<div class="intro-card">
      <div class="intro-eyebrow">${isNus ? "Welcome to NUS Atlas" : "Welcome to your codex"}</div>
      <h2 class="intro-title">${isNus ? "Study, then prove it" : "Atlas"}</h2>
      <p class="intro-sub">${isNus ? `A focused study space for ${nusCourseList.map(c => c.code).join(", ")}. Read the lesson, work a small example, recall the idea without notes, and finish with a timed practice run.` : "A personal home for the math and ideas behind modern AI — linear algebra, calculus, probability &amp; statistics, algorithms, machine learning, deep learning, reinforcement learning, LLMs &amp; information theory — built to make hard ideas <em>click</em> and <em>stick</em>."}</p>
      <div class="intro-grid">
        <div class="intro-item"><span>📖</span><b>Learn</b><small>${isNus ? `${nusLessons} NUS lessons across ${nusCourseList.length} courses — lecture core, textbook depth, and optional references are labeled.` : `${nLessons} lessons across ${nTopics} subjects — rendered math, worked examples${nViz ? ` & ${nViz} interactive visualizations` : ""}.`}</small></div>
        <div class="intro-item"><span>📝</span><b>Practice</b><small>${isNus ? "Recall prompts, worked solutions, flashcards, homework, and timed Exam Mode." : "Spawn tests in <b>Mastery mode</b>, then <b>redeem every wrong answer</b> until it sticks."}</small></div>
        <div class="intro-item"><span>🗓️</span><b>Plan</b><small>${isNus ? "See assessment weights, pending dates, checklists, and reminder windows in one planner." : "A Knowledge Constellation maps every concept; flashcards & a daily review keep it fresh."}</small></div>
        <div class="intro-item"><span>🔎</span><b>Verify</b><small>${isNus ? "Every lesson shows its source trail so you know what is lecture, textbook, or optional reference." : "Run real Python & JS in the Code Playground, right in the browser."}</small></div>
      </div>
      <p class="intro-tip">${isNus ? "Start with one lesson. The dashboard is for choosing the next block; the lesson page is where learning happens." : "Tip: press <kbd>⌘K</kbd> (or <kbd>Ctrl K</kbd>) to search anything — even inside lessons. Progress saves on this device."}</p>
      <button class="btn primary" id="intro-go">${isNus ? "Open the first lesson →" : "Start learning →"}</button>
    </div>`;
    document.body.appendChild(ov);
    let release = null;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    const close = () => { try { localStorage.setItem("atlas.introSeen", "1"); } catch (e) {} if (release) release(); ov.remove(); document.removeEventListener("keydown", onKey); };
    ov.addEventListener("click", e => { if (e.target === ov) close(); });
    ov.querySelector("#intro-go").addEventListener("click", () => { close(); if (isNus) location.hash = startHash; });
    document.addEventListener("keydown", onKey);
    release = modalA11y(ov, ov.querySelector(".intro-card"), "Welcome to Atlas");
  }

  // ---------- juice: confetti + level-up celebration (respects reduced-motion) ----------
  function reducedMotion() { try { return document.documentElement.getAttribute("data-reduce-motion") === "on" || window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function confetti() {
    if (reducedMotion()) return;
    const cv = document.createElement("canvas"), W = cv.width = window.innerWidth, H = cv.height = window.innerHeight;
    cv.style.cssText = "position:fixed;inset:0;z-index:250;pointer-events:none";
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d"), cols = ["#e0a458", "#88a37a", "#9a8bc4", "#d2715a", "#f1e8da"];
    const ps = Array.from({ length: 130 }, () => ({ x: Math.random() * W, y: -20 - Math.random() * H * 0.3, vx: (Math.random() - 0.5) * 3.4, vy: 2 + Math.random() * 4.5, s: 4 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3 }));
    let t = 0, raf;
    function frame() {
      t++; ctx.clearRect(0, 0, W, H);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - t / 170); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); ctx.restore(); });
      if (t < 170) raf = requestAnimationFrame(frame); else cv.remove();
    }
    raf = requestAnimationFrame(frame);
  }
  // a quick, joyful "you did it" beat for the core action — marking a lesson complete (reduced-motion safe)
  function celebrateLessonDone(btn) {
    if (btn) { btn.classList.remove("lesson-done-pop"); void btn.offsetWidth; btn.classList.add("lesson-done-pop"); }
    if (reducedMotion()) return;
    const s = document.createElement("div"); s.className = "lesson-stamp"; s.textContent = "✓"; s.setAttribute("aria-hidden", "true");
    document.body.appendChild(s); setTimeout(() => s.remove(), 950);
  }
  function levelUpCelebrate(info) {
    confetti();
    const ov = document.createElement("div"); ov.className = "levelup-ov";
    ov.innerHTML = `<div class="levelup-card"><div class="lu-glyph">⬆</div><div class="lu-eyebrow">Level Up</div><div class="lu-lvl">Level ${info.level}</div><div class="lu-name">${esc(info.name)}</div><button class="btn primary" id="lu-close">Keep going →</button></div>`;
    document.body.appendChild(ov);
    let release = null;
    const close = () => { if (release) release(); ov.remove(); };
    ov.addEventListener("click", e => { if (e.target === ov) close(); });
    ov.querySelector("#lu-close").addEventListener("click", close);
    document.addEventListener("keydown", function esc2(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc2); } });
    release = modalA11y(ov, ov.querySelector(".levelup-card"), "Level up");
  }

  // ---------- chrome (sidebar + topbar) ----------
  let lastXP = null, lastLevel = null;
  function renderChrome() {
    const lv = Store.levelInfo();
    document.getElementById("nav-courses").innerHTML = C().map(c => {
      const p = Store.courseProgress(c.id);
      return `<a href="#/course/${c.id}" data-route><span class="dot" style="background:${c.color}"></span>${esc(c.title)} <span style="margin-left:auto;font-size:11px;color:var(--ink-mute)">${p.pct}%</span></a>`;
    }).join("");

    const ring = document.getElementById("ring");
    if (lastLevel != null && lv.level !== lastLevel) {           // level changed: jump the fill, don't animate backward through the wrap
      ring.style.transition = "none"; ring.style.setProperty("--ring", lv.pct + "%"); void ring.offsetWidth; ring.style.transition = "";
    } else {
      ring.style.setProperty("--ring", lv.pct + "%");
    }
    document.getElementById("ring-num").textContent = lv.level;
    document.getElementById("lvl-name").textContent = lv.name;
    document.getElementById("lvl-sub").textContent = "Level " + lv.level;
    document.getElementById("xp-fill").style.width = lv.pct + "%";
    document.getElementById("xp-text").textContent = lv.next
      ? `${lv.xp.toLocaleString()} XP · ${lv.toNext.toLocaleString()} to ${lv.next.name}`
      : `${lv.xp.toLocaleString()} XP · max level`;
    const st = Store.stats();
    document.getElementById("streak-num").textContent = st.streak;
    const streakLink = document.querySelector("a.streak"); if (streakLink) streakLink.setAttribute("aria-label", st.streak + "-day streak — view your progress");
    const flameEl = document.querySelector(".streak .flame");   // flame intensity tiers — the longer the streak, the hotter it glows
    if (flameEl) {
      const tier = st.streak <= 0 ? "unlit" : st.streak < 7 ? "lit" : st.streak < 30 ? "hot" : st.streak < 100 ? "blazing" : "inferno";
      if (flameEl.dataset.tier !== tier) { flameEl.classList.remove("flame-unlit", "flame-lit", "flame-hot", "flame-blazing", "flame-inferno"); flameEl.classList.add("flame-" + tier); flameEl.dataset.tier = tier; }
    }
    // highlight active nav
    const hash = location.hash || "#/";
    document.querySelectorAll("[data-route]").forEach(a => {
      const active = a.getAttribute("href") === hash || (a.getAttribute("href") === "#/" && hash === "#/");
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (lastXP != null && lv.xp > lastXP) floatXP(lv.xp - lastXP);   // celebrate the gain since last render
    lastXP = lv.xp; lastLevel = lv.level;
  }

  // ============================================================
  //  VIEWS
  // ============================================================
  // compact estimated-time formatter ("≈ 4h 20m") from a minute count
  function fmtTime(mins) {
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h === 0) return "≈ " + m + "m";
    if (m === 0) return "≈ " + h + "h";
    return "≈ " + h + "h " + m + "m";
  }
  function viewDashboard() {
    const st = Store.stats();
    const lv = Store.levelInfo();
    const goal = Store.raw.goalXp || 50, today = Store.todayXP(), goalPct = Math.min(100, Math.round(today / goal * 100));
    const weak = Store.weakSpots();
    // 14-day consistency strip — reinforces the streak habit right at the daily landing
    const consHtml = (() => {
      const act = Store.raw.activity || {}, active = Store.raw.activeDays || {}, pad = n => String(n).padStart(2, "0");
      const now = new Date(); now.setHours(0, 0, 0, 0);
      const key = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
      let studied = 0, thisWeek = 0, lastWeek = 0; const cells = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        const k = key(d), xp = Number(act[k]) || 0, on = xp > 0 || !!active[k];   // lit on any active day (kept the streak), not only XP days
        if (on) studied++;
        if (i <= 6) thisWeek += xp; else lastWeek += xp;                          // last 7 days vs the 7 before — weekly momentum
        cells.push(`<span class="cs-cell${on ? " on" : ""}${i === 0 ? " today" : ""}" title="${k}${xp > 0 ? " · " + xp + " XP" : on ? " · active" : ""}"></span>`);
      }
      const studiedToday = (Number(act[key(now)]) || 0) > 0 || !!active[key(now)];
      // weekly momentum: a medium-term horizon between the daily streak and lifetime XP — "was this a good week?"
      const comma = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      let weekHtml = "";
      if (thisWeek > 0 || lastWeek > 0) {
        let trend;
        if (lastWeek <= 0) trend = `<span style="color:var(--sage)">▲ building momentum</span>`;
        else { const pct = Math.round((thisWeek - lastWeek) / lastWeek * 100);
          trend = pct > 0 ? `<span style="color:var(--sage)">▲ ${pct}% vs last week</span>`
                : pct < 0 ? `<span style="color:var(--rust)">▼ ${Math.abs(pct)}% vs last week</span>`
                : `<span style="color:var(--ink-mute)">even with last week</span>`; }
        weekHtml = `<div class="cs-week">📈 <b>${comma(thisWeek)}</b> XP this week · ${trend}</div>`;
      }
      return `<div class="consistency reveal"><div class="cs-row">${cells.join("")}</div>
        <div class="cs-label">🔥 <b>${st.streak}-day streak</b> · studied <b>${studied}</b> of the last 14 days · ${studiedToday ? `<span style="color:var(--sage)">today ✓</span>` : `<span style="color:var(--gold)">study today to keep it alive</span>`}</div>${weekHtml}</div>`;
    })();
    // 7-day review forecast — the future companion to the consistency strip: when scheduled cards come due,
    // so the spaced-repetition rhythm is visible and you can plan the week. Only shown once you have cards in flight.
    const fcHtml = (() => {
      const fc = Store.reviewForecast(7);
      if (fc.dueNow + fc.upcoming + fc.beyond <= 0) return "";
      const DAYNAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const today0 = new Date(); today0.setHours(0, 0, 0, 0);
      const max = Math.max(1, ...fc.days);
      const cols = fc.days.map((n, i) => {
        const d = new Date(today0); d.setDate(today0.getDate() + i);
        const h = n ? Math.max(12, Math.round(n / max * 100)) : 0;
        const lbl = i === 0 ? "Today" : DAYNAMES[d.getDay()];
        return `<div class="fcst-col${i === 0 ? " today" : ""}${n ? " has" : ""}" title="${DAYNAMES[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()} · ${n} card${n === 1 ? "" : "s"} due">
          <span class="fcst-num">${n || ""}</span>
          <span class="fcst-track"><span class="fcst-bar" style="height:${h}%"></span></span>
          <span class="fcst-lbl">${lbl}</span>
        </div>`;
      }).join("");
      const summary = fc.dueNow
        ? `<span style="color:var(--rust)"><b>${fc.dueNow}</b> due now</span> · ${fc.upcoming} more this week${fc.beyond ? ` · ${fc.beyond} later` : ""}`
        : (fc.upcoming
          ? `All caught up — <b>${fc.upcoming}</b> card${fc.upcoming === 1 ? "" : "s"} return${fc.upcoming === 1 ? "s" : ""} this week${fc.beyond ? ` · ${fc.beyond} later` : ""}`
          : `All caught up — nothing returns in the next 7 days${fc.beyond ? ` · ${fc.beyond} scheduled later` : ""}`);
      return `<div class="forecast reveal" role="img" aria-label="Review forecast: ${fc.dueNow} card${fc.dueNow === 1 ? "" : "s"} due now, ${fc.upcoming} returning over the next 7 days">
        <div class="fcst-head">📅 <b>Review forecast</b> · <span>${summary}</span></div>
        <div class="fcst-row" aria-hidden="true">${cols}</div></div>`;
    })();
    // "continue where you left off"
    let contHtml = "";
    const last = Store.raw.lastLesson;
    if (last) { const [lc, ll] = last.split("/"); const node = findLesson(lc, ll);
      if (node) { const done = Store.isLessonDone(ll);
        contHtml = `<div class="cotd reveal" style="--c:${node.course.color}" data-go="#/lesson/${lc}/${ll}">
          <div class="cotd-side"><div class="cotd-ico" style="color:${node.course.color};border-color:${node.course.color}">↩</div><div class="cotd-tag">Continue</div></div>
          <div class="cotd-body"><div class="cotd-course">${esc(node.course.title)} · ${esc(node.module.title)}</div><h3>${esc(node.lesson.title)}</h3>
          <p>${done ? "Revisit this lesson, or jump to its quiz, flashcards & examples." : "Pick up right where you left off."}</p>
          <span class="btn primary" style="pointer-events:none">Resume →</span></div></div>`; } }
    const cd = dailyConcept();
    const cdHtml = cd ? `
      <div class="cotd reveal" style="--c:${cd.node.course.color}" data-go="#/lesson/${cd.node.course.id}/${cd.node.lesson.id}">
        <div class="cotd-side">
          <div class="cotd-ico" style="color:${cd.node.course.color};border-color:${cd.node.course.color}">${esc(cd.node.course.icon)}</div>
          <div class="cotd-tag">Concept of the Day${cd.advanced ? ` · <span style="color:var(--gold)">a stretch ↗</span>` : cd.ready ? ` · <span style="color:var(--sage)">ready ✓</span>` : ""}</div>
        </div>
        <div class="cotd-body">
          <div class="cotd-course">${esc(cd.node.course.title)} · ${esc(cd.node.module.title)}</div>
          <h3>${esc(cd.node.lesson.title)}</h3>
          <p>${cd.advanced ? "A peek ahead — something you haven't reached yet. Curiosity is rewarded." : cd.ready ? "All its prerequisites are done — you're ready for this one." : "Today's pick to keep your mind moving. A few minutes is enough."}</p>
          <span class="btn primary" style="pointer-events:none">Study now →</span>
        </div>
      </div>` : "";
    const ddd = dailyDeepDive();
    const dddHtml = ddd ? `
      <div class="cotd reveal" style="--c:${ddd.node.course.color}" data-go="#/lesson/${ddd.node.course.id}/${ddd.node.lesson.id}/dd${ddd.k}">
        <div class="cotd-side">
          <div class="cotd-ico" style="color:${ddd.node.course.color};border-color:${ddd.node.course.color}">🧩</div>
          <div class="cotd-tag">Deeper dive of the day</div>
        </div>
        <div class="cotd-body">
          <div class="cotd-course">${esc(ddd.node.course.title)} · ${esc(ddd.node.lesson.title)}</div>
          <h3>${esc(ddd.title)}</h3>
          <p>A bite-size deeper look to stretch your understanding — opens straight to the dive.</p>
          <span class="btn primary" style="pointer-events:none">Read the dive →</span>
        </div>
      </div>` : "";
    const dv = dailyViz();
    const dvCol = dv && dv.ctx ? dv.ctx.course.color : "var(--violet)";
    const dvHtml = dv ? `
      <div class="cotd reveal" style="--c:${dvCol}" data-go="#/lab/${dv.v.id}">
        <div class="cotd-side">
          <div class="cotd-ico" style="color:${dvCol};border-color:${dvCol}">🎛️</div>
          <div class="cotd-tag">Visualization of the day</div>
        </div>
        <div class="cotd-body">
          <div class="cotd-course">${dv.ctx ? esc(dv.ctx.course.title + " · " + dv.ctx.lesson.title) : "Interactive Lab"}</div>
          <h3>${esc(dv.v.title)}</h3>
          <p>${esc(String(dv.v.blurb || "").replace(/\s+/g, " ").slice(0, 150))}${(dv.v.blurb || "").length > 150 ? "…" : ""}</p>
          <span class="btn primary" style="pointer-events:none">Explore it ↗</span>
        </div>
      </div>` : "";
    const courseCard = (c) => {
      const p = Store.courseProgress(c.id);
      const fl = flatLessons(c), lc = fl.length;
      const totalMin = fl.reduce((a, l) => a + (l.minutes || 10), 0);
      const tm = Store.topicMastery(c.id), lvl = Store.masteryLevel(tm);   // avg retained mastery (decays), distinct from completion
      return `
      <div class="course-card reveal" style="--c:${c.color}" data-go="#/course/${c.id}">
        <div class="cc-icon">${esc(c.icon)}</div>
        <h3>${esc(c.title)}</h3>
        <div class="blurb">${esc(c.blurb)}</div>
        <div class="cc-time" title="Estimated total reading time for this topic">⏱ ${fmtTime(totalMin)} · ${lc} lessons</div>
        <div class="cc-stats">
          <div class="cc-foot" title="Lessons completed">
            <div class="mini-bar"><div class="mini-fill" style="width:${p.pct}%;background:${c.color}"></div></div>
            <span>${p.done}/${lc} done</span>
          </div>
          <div class="cc-mastery" title="Average mastery across this topic — reflects what you've retained, and decays over time">
            <span class="cc-mdot" style="background:${lvl.color}"></span>${tm > 0 ? Math.round(tm * 100) + "% mastered" : "not started"}
          </div>
        </div>
      </div>`;
    };
    // curriculum tiers (holistic reorder, iter 1217) — surfaces at topic level the order the
    // lesson-level PREREQS graph already encodes; unknown/future topic ids fall into the last tier
    const TIERS = [
      ["Foundations", "The math and CS bedrock everything else builds on — start here.",
        ["linear-algebra", "calculus", "probability-statistics", "algorithms", "information-theory"]],
      ["Core machine learning", "The learning problem, classical models, and deep networks.",
        ["machine-learning", "deep-learning"]],
      ["Frontier & applications", "Agents, language models, and applied domains.",
        ["reinforcement-learning", "llm", "time-series", "game-theory"]],
    ];
    const tieredIds = new Set(TIERS.flatMap(t => t[2]));
    C().forEach(c => { if (!tieredIds.has(c.id)) TIERS[TIERS.length - 1][2].push(c.id); });
    const byId = {}; C().forEach(c => { byId[c.id] = c; });
    const tiersHtml = TIERS.map(([label, sub, ids], i) => {
      const tcards = ids.map(id => byId[id]).filter(Boolean).map(courseCard).join("");
      return tcards ? `
      <div class="reveal" style="margin:${i === 0 ? "0" : "26px"} 0 12px">
        <h3 style="font-size:17px;letter-spacing:.02em">${i + 1} · ${label}</h3>
        <p style="margin:3px 0 0;font-size:13px;color:var(--ink-mute)">${sub}</p>
      </div>
      <div class="grid">${tcards}</div>` : "";
    }).join("");

    // bookmarked lessons (saved for later) — only shown if any exist
    const idxBm = index();
    const bm = Store.bookmarkIds().map(id => idxBm[id]).filter(Boolean);
    const bmHtml = bm.length ? `
      <div class="page-head reveal" style="margin-bottom:14px"><h2 style="font-size:26px">★ Bookmarks</h2></div>
      <div class="conn-chips reveal" style="margin-bottom:34px">
        ${bm.map(n => `<a class="conn-chip" href="#/lesson/${n.course.id}/${n.lesson.id}" data-route style="--c:${n.course.color}"><span class="cc-dot" style="background:${n.course.color}"></span>${esc(n.lesson.title)}</a>`).join("")}
      </div>` : "";
    // "closest achievement" nudge — gentle motivation toward the next unlock
    // "Keep it fresh" — concepts once learned well that are now decaying (spacing-effect nudge).
    const fading = Store.fadingConcepts();
    const fadeHtml = fading.length ? `
      <div class="fade-strip reveal">
        <div class="fade-head">
          <span class="fade-ico">♻️</span>
          <div class="fade-headtext">
            <b>Keep it fresh — ${fading.length} concept${fading.length === 1 ? "" : "s"} fading</b>
            <span class="fade-sub">You learned ${fading.length === 1 ? "this" : "these"} well; memory decays with time. A quick revisit re-locks it — that's the spacing effect.</span>
          </div>
        </div>
        <div class="fade-chips">
          ${fading.slice(0, 6).map(f => `<a class="fade-chip" href="#/lesson/${f.courseId}/${f.lessonId}" data-route><span class="fade-dot" style="background:${Store.masteryLevel(f.eff).color}"></span><span class="fade-title">${esc(f.title)}</span><span class="fade-pct">${Math.round(f.eff * 100)}%</span></a>`).join("")}
        </div>
        <a class="fade-cta" href="#/refresh" data-route>↻ Quick refresh ${fading.length === 1 ? "this" : "all " + fading.length} →</a>
      </div>` : "";

    const near = nearestAchievement();
    const nearHtml = near ? `
      <a class="ach-nudge reveal" href="#/achievements" data-route>
        <span class="ach-nudge-ico">${near.a.icon}</span>
        <span class="ach-nudge-body">
          <span class="ach-nudge-top"><b>Almost there — ${esc(near.a.name)}</b><span class="ach-nudge-num">${near.cur} / ${near.target}</span></span>
          <span class="ach-nudge-desc">${esc(near.a.desc)}</span>
          <span class="ach-nudge-bar"><span class="ach-nudge-fill" style="width:${Math.round(near.frac * 100)}%"></span></span>
        </span>
      </a>` : "";

    app.innerHTML = `
    <div class="view">
      <div class="page-head reveal">
        <div class="eyebrow">Your learning codex</div>
        <h2>Welcome back, <em>${lv.name}</em>.</h2>
        <p>Pick up where you left off, drill due flashcards, or open a new topic. Every lesson, quiz, and review earns XP toward your next rank.</p>
      </div>

      <div class="stat-strip">
        <div class="stat reveal" style="--c:var(--gold)"><div class="v">${st.lessonsDone}/${st.totalLessons}</div><div class="k">Lessons done</div></div>
        <div class="stat reveal" style="--c:var(--sage)"><div class="v"${st.accuracyKnown ? "" : " data-nocount"}>${st.accuracyKnown ? st.accuracy + "%" : "—"}</div><div class="k">Quiz accuracy</div></div>
        <div class="stat reveal" style="--c:var(--rust)"><div class="v">${st.reviewDue}</div><div class="k">Cards due</div></div>
        <div class="stat reveal" style="--c:var(--violet)"><div class="v" data-nocount>${st.streak}</div><div class="k">Day streak</div></div>
      </div>

      <div class="today-strip reveal">
        <div class="goal-ring" style="--p:0"><span>${goalPct}%</span></div>
        <div class="today-text">
          <div class="t-main">Today's goal: <b>${today} / ${goal} XP</b> ${goalPct >= 100 ? "<span style='color:var(--sage)'>· hit! 🎉</span>" : ""}</div>
          <div class="t-sub">${weak.length ? `<span style="color:var(--rust)">⚠ ${weak.length} concept${weak.length === 1 ? "" : "s"} need review</span>` : "🔥 streak " + st.streak + " day" + (st.streak === 1 ? "" : "s") + " · no weak spots right now"}${Store.raw.freezes ? ` · ❄️ ${Store.raw.freezes} freeze${Store.raw.freezes === 1 ? "" : "s"}` : ""}</div>
        </div>
        ${weak.length ? `<a class="btn" href="#/test" data-route style="margin-left:auto">Drill weak spots →</a>` : ""}
      </div>

      ${consHtml}
      ${fcHtml}
      ${contHtml}
      ${cdHtml}
      ${dddHtml}
      ${dvHtml}

      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:34px" class="reveal">
        <a class="btn primary" href="#/session" data-route>🎯 Start Daily Mix</a>
        <a class="btn" href="#/review" data-route>${st.reviewDue ? `⚡ Review ${st.reviewDue} due card${st.reviewDue === 1 ? "" : "s"}` : "⚡ Review flashcards"}</a>
        <a class="btn" href="#/test" data-route>📝 Spawn a test</a>
        ${Store.missedCount() ? `<a class="btn" href="#/mistakes" data-route style="border-color:var(--rust);color:var(--rust)">🎯 Redeem ${Store.missedCount()} mistake${Store.missedCount() === 1 ? "" : "s"}</a>` : ""}
        <a class="btn ghost" href="#/map" data-route>🗺️ Knowledge Map</a>
        <a class="btn ghost" href="#/lab" data-route>🎛️ Visualization Lab</a>
        <a class="btn ghost" href="#/glossary" data-route>📔 Glossary</a>
        ${Object.keys(Store.raw.notes || {}).length ? `<a class="btn ghost" href="#/notes" data-route>📓 My Notes</a>` : ""}
        <a class="btn ghost" href="#/library" data-route>📚 References</a>
      </div>

      ${fadeHtml}
      ${nearHtml}
      ${bmHtml}
      <div class="page-head reveal" style="margin-bottom:8px"><h2 style="font-size:26px">Topics</h2>
        <p style="margin:6px 0 0;font-size:13.5px;color:var(--ink-mute)">A recommended path — the prerequisites flow foundations → core ML → frontier. Every topic is open; the numbers are the suggested order.</p></div>
      ${tiersHtml}
    </div>`;
    bindGo();
    document.querySelectorAll(".stat-strip .v:not([data-nocount])").forEach(el => countUp(el));   // count-up the hero stats on landing (the streak is a status, not a score — it shows its true value at once, matching the header, instead of flashing 0)
    sweepGoalRing(goalPct);                                          // animate the daily-goal ring fill 0 → goalPct
    sweepForecast();                                                 // sweep the review-forecast bars up 0 → height
    sweepStrip();                                                    // pop the 14-day consistency cells in left-to-right
    typeset();
  }

  function viewCourse(id) {
    const c = findCourse(id);
    if (!c) return view404();
    const p = Store.courseProgress(id);
    // per-course mastery distribution + a "continue / start next" target
    const flatC = flatLessons(c);
    const dist = { mastered: 0, proficient: 0, learning: 0, seen: 0, unseen: 0 };
    flatC.forEach(l => { dist[Store.masteryLevel(Store.effectiveMastery(l.id)).key]++; });
    const segDefs = [["mastered", "Mastered", "var(--sage)"], ["proficient", "Proficient", "var(--gold)"], ["learning", "Learning", "var(--violet)"], ["seen", "Seen", "var(--ink-mute)"], ["unseen", "New", "var(--line)"]];
    const distSegs = segDefs.filter(s => dist[s[0]] > 0);
    const masteryBar = `
      <div class="course-overview reveal">
        <div class="co-bar" role="img" aria-label="Mastery distribution: ${segDefs.filter(s => dist[s[0]] > 0).map(s => dist[s[0]] + " " + s[1]).join(", ")}">
          ${distSegs.map(s => `<span class="co-seg" style="flex:${dist[s[0]]};background:${s[2]}"></span>`).join("") || `<span class="co-seg" style="flex:1;background:var(--line)"></span>`}
        </div>
        <div class="co-legend">${distSegs.map(s => `<span><i style="background:${s[2]}"></i>${dist[s[0]]} ${s[1]}</span>`).join("")}</div>
      </div>`;
    let nextL = flatC.find(l => isReady(l.id)) || flatC.find(l => !Store.isLessonDone(l.id));
    let nextVerb = p.done > 0 ? "Continue" : "Start";
    if (!nextL) { nextL = flatC.slice().sort((a, b) => Store.effectiveMastery(a.id) - Store.effectiveMastery(b.id))[0]; nextVerb = "Review weakest"; }
    const remMin = flatC.filter(l => !Store.isLessonDone(l.id)).reduce((a, l) => a + (l.minutes || 10), 0);
    const nextCta = nextL ? `<a class="btn primary" href="#/lesson/${c.id}/${nextL.id}" data-route>▶ ${nextVerb}: ${esc(nextL.title)}</a>` : "";
    const modules = c.modules.map((m, mi) => {
      const rows = m.lessons.map(l => {
        const done = Store.isLessonDone(l.id);
        const eff = Store.effectiveMastery(l.id), lvl = Store.masteryLevel(eff), ready = isReady(l.id);
        const nMcq = (l.mcq || []).length, nCards = (l.flashcards || []).length, nHw = (l.homework || []).length;
        const ct = l.content || "", ex = [];
        if (ct.indexOf("data-viz") >= 0) ex.push(["🎛️", "interactive visualization"]);
        if (ct.indexOf('class="deep-dive"') >= 0) ex.push(["🧩", "deeper dive"]);
        if (ct.indexOf("data-code") >= 0) ex.push(["💻", "code exercise"]);
        const exHtml = ex.length ? ` · <span class="l-extras" aria-label="Includes ${ex.map(e => e[1]).join(", ")}" title="Includes: ${ex.map(e => e[1]).join(", ")}">${ex.map(e => `<span aria-hidden="true">${e[0]}</span>`).join(" ")}</span>` : "";
        return `
        <div class="lesson-row ${done ? "done" : ""} ${ready ? "ready" : ""}" data-go="#/lesson/${c.id}/${l.id}">
          <div class="lesson-check">✓</div>
          <div style="flex:1">
            <div class="l-title">${esc(l.title)}${ready ? ` <span class="pill ready-pill">▶ start here</span>` : ""}</div>
            <div class="l-meta">${l.minutes || 10} min read · <span style="color:${lvl.color}">${lvl.label}</span>${exHtml}</div>
            <div class="mastery-bar"><div class="mastery-fill" style="width:${Math.round(eff * 100)}%;background:${lvl.color}"></div></div>
          </div>
          <div class="l-right">
            ${nMcq ? `<span class="pill gold">${nMcq} MCQ</span>` : ""}
            ${nCards ? `<span class="pill violet">${nCards} cards</span>` : ""}
            ${nHw ? `<span class="pill sage">${nHw} HW</span>` : ""}
          </div>
        </div>`;
      }).join("");
      const mDone = m.lessons.filter(l => Store.isLessonDone(l.id)).length, mTot = m.lessons.length, mPct = Math.round(mDone / mTot * 100), mDoneAll = mDone === mTot;
      return `
      <div class="module reveal">
        <div class="module-head">
          <span class="mnum">MODULE ${mi + 1}</span>
          <h3>${esc(m.title)}</h3>
          <span class="mcount">${mDoneAll ? `<span style="color:var(--sage)">✓ complete</span>` : mDone + "/" + mTot + " done"}</span>
        </div>
        <div style="height:4px;background:var(--line);border-radius:3px;margin:0 0 10px;overflow:hidden"><div class="mastery-fill" style="width:${mPct}%;background:${mDoneAll ? "var(--sage)" : "var(--gold)"}"></div></div>
        ${rows}
      </div>`;
    }).join("");

    app.innerHTML = `
    <div class="view">
      <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; ${esc(c.title)}</div>
      <div class="page-head reveal" style="display:flex;align-items:center;gap:20px">
        <div class="cc-icon" style="--c:${c.color};width:64px;height:64px;font-size:32px;color:${c.color};border-color:${c.color};background:color-mix(in srgb, ${c.color} 12%, transparent)">${esc(c.icon)}</div>
        <div>
          <div class="eyebrow" style="color:${c.color}">${p.done} of ${p.total} lessons · ${p.pct}% complete · ${fmtTime(flatC.reduce((a, l) => a + (l.minutes || 10), 0))}</div>
          <h2 style="font-size:38px">${esc(c.title)}</h2>
        </div>
      </div>
      <p style="color:var(--ink-soft);max-width:640px;margin:-14px 0 28px" class="reveal">${esc(c.blurb)}</p>
      <div class="mini-bar reveal" style="height:8px;margin-bottom:14px;max-width:none"><div class="mini-fill" style="width:${p.pct}%;background:${c.color}"></div></div>
      ${masteryBar}
      <div class="reveal" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:30px;align-items:center">
        ${nextCta}
        <a class="btn ghost" href="#/cheatsheet/${c.id}" data-route>📄 Cheatsheet</a>
        <a class="btn ghost" href="#/placement/${c.id}" data-route>🎚️ Placement test</a>
        <a class="btn ghost" href="#/test" data-route>📝 Quiz me</a>
        ${remMin > 0 ? `<span class="viz-note" style="margin-left:auto">~${remMin} min of reading left</span>` : `<span class="viz-note" style="margin-left:auto;color:var(--sage)">✓ all lessons complete</span>`}
      </div>
      ${modules}
      ${refsBlock(c.id, "References for " + c.title)}
    </div>`;
    bindGo();
    sweepBars(app);                                            // animate the module + lesson mastery bars filling in
    typeset();
  }

  // references block (shared by course page + library)
  const KIND = { video: "🎬", course: "🎓", book: "📕", paper: "📄", article: "📝", interactive: "🕹️", reference: "🔖" };
  function refsBlock(topicId, heading) {
    const refs = (window.REFERENCES || {})[topicId];
    if (!refs || !refs.length) return "";
    return `
      <div class="module reveal" style="margin-top:34px">
        <div class="module-head"><span class="mnum">📚</span><h3>${esc(heading)}</h3></div>
        ${refs.map(r => `
          <a class="ref-item" href="${esc(r.url)}" target="_blank" rel="noopener">
            <span class="ref-kind">${KIND[r.kind] || "🔗"}</span>
            <span class="ref-main"><span class="ref-title">${esc(r.title)}</span><span class="ref-by">${esc(r.by)}</span>${r.note ? `<span class="ref-note">${esc(r.note)}</span>` : ""}</span>
            <span class="ref-tag">${esc(r.kind)} ↗</span>
          </a>`).join("")}
      </div>`;
  }

  // ---------- lesson (tabbed) ----------
  function viewLesson(cid, lid, initialTab) {
    const found = findLesson(cid, lid);
    if (!found) return view404();
    const { course, lesson } = found;
    const ddTarget = (/^dd(\d+)$/.exec(initialTab || "") || [])[1];   // search deep-link "#/lesson/c/l/dd<k>" → open the k-th dive (falls back to the lecture tab)
    Store.setLastLesson(cid + "/" + lid);
    const all = flatLessons(course);
    const idx = all.findIndex(l => l.id === lid);
    const prev = all[idx - 1], next = all[idx + 1];
    // locate the module this lesson lives in (for orientation + a jump-anywhere dot navigator)
    let mod = null, posInMod = 0;
    course.modules.forEach(m => { const j = m.lessons.findIndex(l => l.id === lid); if (j >= 0) { mod = m; posInMod = j + 1; } });
    const modNav = mod ? `
      <nav class="mod-nav reveal" aria-label="Lessons in ${esc(mod.title)}">
        <span class="mod-nav-label">${esc(mod.title)} · <b>${posInMod}/${mod.lessons.length}</b></span>
        <span class="mod-nav-dots">${mod.lessons.map((l, j) => {
          const cur = l.id === lid, dn = Store.isLessonDone(l.id);
          return `<a class="mod-dot${cur ? " cur" : ""}${dn ? " done" : ""}" href="#/lesson/${course.id}/${l.id}" data-route title="${j + 1}. ${esc(l.title)}${dn ? " ✓" : ""}" aria-label="Lesson ${j + 1}: ${esc(l.title)}${dn ? ", completed" : ""}${cur ? ", current" : ""}"${cur ? ' aria-current="true"' : ""}></a>`;
        }).join("")}</span>
      </nav>` : "";

    const nMcq = (lesson.mcq || []).length, nCards = (lesson.flashcards || []).length, nHw = (lesson.homework || []).length, nEx = (lesson.examples || []).length;
    const tabs = [
      { id: "lecture", label: "Lecture", icon: "📖" },
      nEx ? { id: "examples", label: "Examples", icon: "🔍", badge: nEx } : null,
      nMcq ? { id: "quiz", label: "Quiz", icon: "✎", badge: nMcq } : null,
      nCards ? { id: "cards", label: "Flashcards", icon: "🃏", badge: nCards } : null,
      nHw ? { id: "homework", label: "Homework", icon: "✦", badge: nHw } : null,
      nCards ? { id: "recall", label: "Recall", icon: "🧠" } : null
    ].filter(Boolean);

    // prerequisite path: lessons that come before this one and aren't done yet
    const pending = learningPath(lid).filter(n => n.lesson.id !== lid && !Store.isLessonDone(n.lesson.id));
    const firstPre = pending[0];   // earliest unmet prerequisite = the recommended starting point
    const pathBanner = pending.length ? `
      <div class="path-banner reveal">
        <div class="pb-head"><span>🧭</span> <b>${pending.length} prerequisite${pending.length === 1 ? "" : "s"}</b> build up to this concept.</div>
        <div class="pb-next">Best place to start: <a href="#/lesson/${firstPre.course.id}/${firstPre.lesson.id}" data-route>${esc(firstPre.lesson.title)}</a><span class="pb-sub"> · ${esc(firstPre.course.title)}</span></div>
        <a class="btn" href="#/path/${course.id}/${lid}" data-route>See the full learning path →</a>
      </div>` : "";

    app.innerHTML = `
    <div class="view">
      <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; <a href="#/course/${course.id}" data-route>${esc(course.title)}</a>${mod ? ` &nbsp;›&nbsp; <span class="crumb-mod">${esc(mod.title)}</span>` : ""} &nbsp;›&nbsp; ${esc(lesson.title)}</div>
      <div class="page-head" style="margin-bottom:14px">
        <div class="eyebrow" style="color:${course.color}">${esc(course.title)} · ${lesson.minutes || 10} min${(() => { const eff = Store.effectiveMastery(lid), L = Store.masteryLevel(eff); return ` · <span style="color:${L.color}">${L.label}${eff > 0 ? " · " + Math.round(eff * 100) + "%" : ""}</span>`; })()}</div>
        <h2>${esc(lesson.title)}</h2>
        ${(() => { const eff = Store.effectiveMastery(lid), L = Store.masteryLevel(eff); return eff > 0 ? `<div class="mastery-bar" style="margin-top:10px;max-width:220px"><div class="mastery-fill" style="width:${Math.round(eff * 100)}%;background:${L.color}"></div></div>` : ""; })()}
      </div>
      ${modNav}
      ${pathBanner}
      <div class="tabs" role="tablist" aria-label="Lesson sections">${tabs.map((t, i) => `<button class="tab ${i === 0 ? "active" : ""}" role="tab" id="tab-${t.id}" data-tab="${t.id}" aria-controls="tab-body" aria-selected="${i === 0 ? "true" : "false"}" tabindex="${i === 0 ? "0" : "-1"}">${t.icon} ${t.label}${t.badge ? `<span class="badge">${t.badge}</span>` : ""}</button>`).join("")}</div>
      <div id="tab-body" role="tabpanel" tabindex="0" aria-labelledby="tab-lecture"></div>
    </div>`;

    const body = document.getElementById("tab-body");
    const tabEls = Array.from(document.querySelectorAll(".tab"));
    function setTab(name, focusTab) {
      tabEls.forEach(t => { const on = t.dataset.tab === name; t.classList.toggle("active", on); t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1; if (on && focusTab) t.focus(); });
      body.setAttribute("aria-labelledby", "tab-" + name);
      if (name === "lecture") renderLecture(body, course, lesson, prev, next);
      else if (name === "examples") renderExamples(body, lesson);
      else if (name === "quiz") renderQuiz(body, lesson, course, next);
      else if (name === "cards") renderCards(body, lesson);
      else if (name === "homework") renderHomework(body, lesson);
      else if (name === "recall") renderRecall(body, course, lesson);
    }
    tabEls.forEach((t, i) => {
      t.addEventListener("click", () => setTab(t.dataset.tab));
      t.addEventListener("keydown", e => {
        let j = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % tabEls.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + tabEls.length) % tabEls.length;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = tabEls.length - 1;
        else return;
        e.preventDefault(); setTab(tabEls[j].dataset.tab, true);
      });
    });
    setTab(tabs.some(t => t.id === initialTab) ? initialTab : "lecture");   // deep-link a tab via #/lesson/c/l/<tab> (e.g. search → Examples)
    if (ddTarget) {                                   // deep-link from a deep-dive search result: open & scroll to the k-th dive
      const dds = body.querySelectorAll("details.deep-dive"), tgt = dds[parseInt(ddTarget, 10) - 1];
      if (tgt) { tgt.open = true; tgt.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" }); }
    }
  }

  // "Builds on" (direct prereqs) + "Leads to" (lessons depending on this one)
  // Includes the immediate in-course neighbours (the curriculum is ordered, so each lesson builds on the
  // previous and leads to the next) merged with the explicit/cross-topic prereq graph — so every lesson shows
  // a connections trail, not just the ~third that carry an explicit edge. Cross-topic edges list first.
  function lessonConnections(lid) {
    const idx = index();
    const node = idx[lid]; if (!node) return "";
    const flat = []; node.course.modules.forEach(m => m.lessons.forEach(l => flat.push(l.id)));
    const pos = flat.indexOf(lid);
    const prevId = pos > 0 ? flat[pos - 1] : null;
    const nextId = (pos >= 0 && pos < flat.length - 1) ? flat[pos + 1] : null;
    const buildIds = [...new Set([...directPrereqs(lid), ...(prevId ? [prevId] : [])])];
    const builds = buildIds.map(id => idx[id]).filter(Boolean);
    const leadSet = [];
    C().forEach(c => c.modules.forEach(m => m.lessons.forEach(l => { if (l.id !== lid && directPrereqs(l.id).indexOf(lid) >= 0 && leadSet.indexOf(l.id) < 0) leadSet.push(l.id); })));
    if (nextId && leadSet.indexOf(nextId) < 0) leadSet.push(nextId);
    const leads = leadSet.map(id => idx[id]).filter(Boolean);
    if (!builds.length && !leads.length) return "";
    const chip = n => `<a class="conn-chip" href="#/lesson/${n.course.id}/${n.lesson.id}" data-route style="--c:${n.course.color}"><span class="cc-dot" style="background:${n.course.color}"></span>${esc(n.lesson.title)}</a>`;
    return `<div class="connections reveal">
      ${builds.length ? `<div class="conn-row"><span class="conn-label">Builds on</span><div class="conn-chips">${builds.map(chip).join("")}</div></div>` : ""}
      ${leads.length ? `<div class="conn-row"><span class="conn-label">Leads to</span><div class="conn-chips">${leads.slice(0, 6).map(chip).join("")}</div></div>` : ""}
    </div>`;
  }

  // auto "On this page" table of contents for a lesson's sections (jumps within the long Lecture body)
  let _tocIO = null;   // scroll-spy observer (disconnected & rebuilt per lesson render)
  function buildLessonTOC(body) {
    if (_tocIO) { _tocIO.disconnect(); _tocIO = null; }
    const prose = body.querySelector(".prose"); if (!prose) return;
    const heads = Array.prototype.slice.call(prose.querySelectorAll("h3")).filter(h => !h.closest("details"));
    if (heads.length < 3) return;   // short lessons don't need one
    const items = heads.map((h, i) => { h.id = "sec-" + i; h.classList.add("toc-anchor"); return `<li><button class="toc-link" type="button" data-sec="${i}">${esc(h.textContent.trim())}</button></li>`; }).join("");
    const toc = document.createElement("details");
    toc.className = "lesson-toc reveal"; toc.open = true;
    toc.innerHTML = `<summary>📑 On this page · ${heads.length} sections</summary><ol class="toc-list">${items}</ol>`;
    prose.parentNode.insertBefore(toc, prose);
    const links = Array.prototype.slice.call(toc.querySelectorAll(".toc-link"));
    links.forEach(b => b.addEventListener("click", () => {
      const h = heads[parseInt(b.dataset.sec, 10)];
      if (h) h.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    }));
    // scroll-spy: highlight the section currently nearest the top of the viewport
    if ("IntersectionObserver" in window) {
      const setActive = () => {
        let idx = 0;
        for (let i = 0; i < heads.length; i++) { if (heads[i].getBoundingClientRect().top <= 130) idx = i; else break; }
        links.forEach((l, i) => l.classList.toggle("active", i === idx));
      };
      _tocIO = new IntersectionObserver(setActive, { rootMargin: "-120px 0px -70% 0px", threshold: 0 });
      heads.forEach(h => _tocIO.observe(h));
      setActive();
    }
  }
  // "In this lesson" strip — advertises (and jumps to) the inline extras a learner would otherwise only find by scrolling.
  function lessonExtras(lesson) {
    const ct = lesson.content || "", items = [];
    if (/data-viz/.test(ct)) items.push(["🎛️", "interactive", "[data-viz]"]);
    const ddCount = (ct.match(/class="deep-dive"/g) || []).length;   // lessons now carry 2–3 dives — advertise how many, and open them all on click
    if (ddCount) items.push(["🧩", ddCount + " deeper dive" + (ddCount === 1 ? "" : "s"), "details.deep-dive"]);
    if (/data-code/.test(ct)) items.push(["💻", "code exercise", "[data-code]"]);
    if (!items.length) return "";
    return `<div class="lesson-extras reveal"><span class="lx-label">In this lesson</span>${items.map(([ic, t, sel]) => `<button class="lx-badge" data-sel='${sel}'><span aria-hidden="true">${ic}</span> ${t}</button>`).join("")}</div>`;
  }
  function renderLecture(body, course, lesson, prev, next) {
    const done = Store.isLessonDone(lesson.id);
    body.innerHTML = `
      ${lessonExtras(lesson)}
      <div class="prose reveal">${lesson.content || "<p>Content coming soon.</p>"}</div>
      <section id="quick-check" class="reveal" aria-label="Quick check"></section>
      <div class="notes-box reveal">
        <div class="notes-head">📝 My notes <span id="notes-saved"></span><a href="#/notes" data-route class="notes-all">all notes →</a></div>
        <textarea id="notes-area" placeholder="Jot your own notes, questions, or 'aha' moments — saved automatically on this device.">${esc(Store.getNote(lesson.id))}</textarea>
      </div>
      <div class="lesson-actions">
        <button class="btn ${done ? "ghost" : "primary"}" id="complete-btn">${done ? "✓ Completed" : "Mark complete (+50 XP)"}</button>
        ${prev ? `<a class="btn ghost" href="#/lesson/${course.id}/${prev.id}" data-route>← ${esc(prev.title)}</a>` : ""}
        ${next ? `<a class="btn ${done ? "primary" : ""}" id="next-btn" href="#/lesson/${course.id}/${next.id}" data-route>${esc(next.title)} →</a>` : `<a class="btn ${done ? "primary" : ""}" id="next-btn" href="#/course/${course.id}" data-route>Back to course →</a>`}
        <button class="btn ghost" id="bookmark-btn" aria-pressed="${Store.isBookmarked(lesson.id)}" style="margin-left:auto">${Store.isBookmarked(lesson.id) ? "★ Bookmarked" : "☆ Bookmark"}</button>
        <button class="btn ghost" id="print-lesson">🖨️ Print</button>
      </div>
      ${lessonConnections(lesson.id)}`;
    const pl = document.getElementById("print-lesson"); if (pl) pl.addEventListener("click", () => window.print());
    body.querySelectorAll(".lx-badge").forEach(b => b.addEventListener("click", () => {
      if (b.dataset.sel === "details.deep-dive") {   // open ALL deep-dives at once (each toggle fires → Deep Thinker), then jump to the first
        const dds = body.querySelectorAll("details.deep-dive");
        dds.forEach(d => { d.open = true; });
        if (dds[0]) dds[0].scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
        return;
      }
      const el = body.querySelector(b.dataset.sel); if (!el) return;
      if (el.tagName === "DETAILS") el.open = true;   // open the deep-dive (also fires its toggle → Deep Thinker)
      el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
    }));
    const bm = document.getElementById("bookmark-btn");
    if (bm) bm.addEventListener("click", () => {
      const on = Store.toggleBookmark(lesson.id);
      bm.textContent = on ? "★ Bookmarked" : "☆ Bookmark";
      bm.setAttribute("aria-pressed", on);
      toast(on ? "★" : "☆", on ? "Bookmarked" : "Bookmark removed", lesson.title);
      flushAchievements();   // surface the Curator unlock
    });
    const area = document.getElementById("notes-area");
    let nt; area.addEventListener("input", () => { clearTimeout(nt); nt = setTimeout(() => { Store.setNote(lesson.id, area.value); const s = document.getElementById("notes-saved"); s.textContent = "saved ✓"; setTimeout(() => s.textContent = "", 1500); flushAchievements(); }, 500); });
    const btn = document.getElementById("complete-btn");
    btn.addEventListener("click", () => {
      const was = Store.isLessonDone(lesson.id);
      const before = was ? null : readySet();
      Store.completeLesson(lesson.id);
      btn.textContent = "✓ Completed";
      if (!was) {
        btn.classList.remove("primary"); btn.classList.add("ghost");   // done → de-emphasize; hand the primary CTA to "Next lesson"
        const nb = document.getElementById("next-btn"); if (nb) nb.classList.add("primary");
        celebrateLessonDone(btn);   // the "you did it" stamp — the core learning action deserves a beat
        toast("✨", "+50 XP", "Lesson complete: " + lesson.title);
        const newly = before ? [...readySet()].filter(id => !before.has(id)).map(id => index()[id]).filter(Boolean) : [];
        if (newly.length) toast("🔓", "Unlocked " + newly.length + " concept" + (newly.length > 1 ? "s" : ""), newly[0].lesson.title + (newly.length > 1 ? " · +" + (newly.length - 1) + " more" : ""));
        // completion celebrations: whole topic > module (the bigger beat wins when both land at once)
        const mod = course.modules.find(m => m.lessons.some(l => l.id === lesson.id));
        const topicDone = course.modules.every(m => m.lessons.every(l => Store.isLessonDone(l.id)));
        if (topicDone && Store.celebrateTopicOnce(course.id)) {
          confetti();
          const n = course.modules.reduce((s, m) => s + m.lessons.length, 0);
          toast("🎓", course.title + " complete!", "All " + n + " lessons done — you've finished the whole subject. Outstanding.");
        } else if (mod && mod.lessons.length > 1 && mod.lessons.every(l => Store.isLessonDone(l.id))) {
          confetti();
          toast("📗", "Module complete!", mod.title);
        }
      }
      flushAchievements();
      renderChrome();
    });
    bindGo();
    buildLessonTOC(body);
    mountQuickCheck(document.getElementById("quick-check"), lesson);
    hydrateViz(body);
    hydrateCode(body);
    // reward expanding a "Deeper dive" intuition (Deep Thinker)
    body.querySelectorAll("details.deep-dive").forEach((d, di) => d.addEventListener("toggle", () => { if (d.open) { Store.recordDeepDive(lesson.id + "#" + di); flushAchievements(); } }));
    linkGlossary(body.querySelector(".prose"));   // inline term tooltips (before typeset, so tooltip math renders)
    typeset();
    offerResume(lesson.id);                        // if you left this lesson part-read, offer a one-tap jump back
    requestAnimationFrame(() => placeGlossPops(body));         // keep glossary tooltips inside the viewport (no sideways scroll)
    setTimeout(() => placeGlossPops(body), 450);               // ...and again once KaTeX has settled term positions
  }

  // ---------- inline "Quick Check": low-stakes retrieval at the end of the lecture ----------
  // Brings the testing effect into the reading flow without leaving the page. Reuses the lesson's
  // own MCQs; deliberately NO XP / mastery / miss-tracking — the graded Quiz tab owns scoring.
  function mountQuickCheck(host, lesson) {
    if (!host) return;
    const all = lesson.mcq || [];
    if (all.length < 3) { host.remove(); return; }   // not worth it for a tiny bank
    const N = 3;
    let picks = [], idx = 0, right = 0, started = false;

    function reset() { picks = shuffle(all).slice(0, N); idx = 0; right = 0; }

    function frame(inner) {
      host.innerHTML = `<div class="qc-head"><span class="qc-ico">🧠</span> Quick check
        <span class="qc-sub">${started ? `question ${Math.min(idx + 1, N)} of ${N}` : "before you move on"}</span></div>
        <div class="qc-body">${inner}</div>`;
    }

    function intro() {
      started = false;
      frame(`<p class="qc-lead">Reading it is not the same as remembering it. Try ${N} quick questions from this
        lesson — <strong>no grade, no XP</strong>, just to see if it stuck.</p>
        <button class="btn primary" id="qc-start">Start quick check →</button>`);
      host.querySelector("#qc-start").addEventListener("click", () => { reset(); started = true; drawQ(); });
    }

    function drawQ() {
      if (idx >= picks.length) return done();
      const q = picks[idx];
      frame(`<div class="q-stem qc-stem">${q.q}</div>
        <div class="choices">${q.choices.map((ch, ci) => `<button class="choice" data-ci="${ci}"><span class="key">${String.fromCharCode(65 + ci)}</span><span>${ch}</span></button>`).join("")}</div>
        <div class="qc-explain-slot" aria-live="polite"></div>
        <div class="qc-next-slot"></div>`);
      let locked = false;
      host.querySelectorAll(".choice").forEach(btn => btn.addEventListener("click", () => {
        if (locked) return; locked = true;
        const ci = parseInt(btn.dataset.ci, 10), ans = q.answer;
        host.querySelectorAll(".choice").forEach((b, bi) => { b.classList.add("locked"); if (bi === ans) { b.classList.add("correct"); b.insertAdjacentHTML("beforeend", '<span class="sr-only"> (correct answer)</span>'); } else if (bi === ci) { b.classList.add("wrong"); b.insertAdjacentHTML("beforeend", '<span class="sr-only"> (your answer, incorrect)</span>'); } });
        if (ci === ans) right++;
        host.querySelector(".qc-explain-slot").innerHTML = `<div class="explain"><div class="et">${ci === ans ? "Correct ✓" : "Not quite"}</div>${q.explain || ""}</div>`;
        const nb = document.createElement("button");
        nb.className = "btn primary"; nb.textContent = idx === picks.length - 1 ? "See how you did →" : "Next →";
        nb.addEventListener("click", () => { idx++; drawQ(); });
        host.querySelector(".qc-next-slot").appendChild(nb);
        typeset();
      }));
      typeset();
    }

    function done() {
      started = false;
      Store.recordQuickCheck(right, N); flushAchievements();   // reward the retrieval behavior (no XP/mastery — stays low-stakes)
      const msg = right === N ? "All three — it stuck. 🎯" : right >= 2 ? "Nicely done — mostly there." : "Worth another read of the tricky parts.";
      frame(`<div class="qc-score"><b>${right}/${N}</b> recalled</div>
        <p class="qc-lead">${msg}</p>
        <div class="qc-actions">
          <button class="btn primary" id="qc-quiz">Take the full quiz (${all.length} Q) →</button>
          <button class="btn ghost" id="qc-again">↻ Another ${N}</button>
        </div>`);
      host.querySelector("#qc-again").addEventListener("click", () => { reset(); started = true; drawQ(); });
      host.querySelector("#qc-quiz").addEventListener("click", () => { const t = document.getElementById("tab-quiz"); if (t) t.click(); });
    }

    intro();
  }

  // ---------- quiz engine ----------
  function renderQuiz(body, lesson, course, next) {
    const qs = lesson.mcq || [];
    let i = 0, correct = 0, locked = false;
    const missedIdx = [];                                     // indices answered wrong this run — for the redrill CTA
    function draw() {
      if (i >= qs.length) { finish(); return; }
      const q = qs[i];
      body.innerHTML = `
      <div class="quiz reveal">
        <div class="q-progress">Question ${i + 1} of ${qs.length} · ${correct} correct so far · <kbd>1</kbd>–<kbd>4</kbd> to answer</div>
        <div class="q-stem">${q.q}</div>
        <div class="choices">
          ${q.choices.map((ch, ci) => `<button class="choice" data-ci="${ci}"><span class="key">${String.fromCharCode(65 + ci)}</span><span>${ch}</span></button>`).join("")}
        </div>
        <div id="explain-slot" aria-live="polite"></div>
        <div id="next-slot" style="margin-top:22px"></div>
      </div>`;
      locked = false;
      body.querySelectorAll(".choice").forEach(btn => btn.addEventListener("click", () => pick(parseInt(btn.dataset.ci, 10), q)));
      typeset();
    }
    function pick(ci, q) {
      if (locked) return;
      locked = true;
      const right = q.answer;
      body.querySelectorAll(".choice").forEach((btn, bi) => {
        btn.classList.add("locked");
        if (bi === right) { btn.classList.add("correct"); btn.insertAdjacentHTML("beforeend", '<span class="sr-only"> (correct answer)</span>'); }
        else if (bi === ci) { btn.classList.add("wrong"); btn.insertAdjacentHTML("beforeend", '<span class="sr-only"> (your answer, incorrect)</span>'); }
      });
      if (ci === right) { correct++; Store.clearMiss(lesson.id, i); }
      else { Store.recordMiss(lesson.id, i); if (!missedIdx.includes(i)) missedIdx.push(i); }
      document.getElementById("explain-slot").innerHTML =
        `<div class="explain"><div class="et">${ci === right ? "Correct ✓" : "Not quite"}</div>${q.explain || ""}</div>`;
      const nextBtn = document.createElement("button");
      nextBtn.className = "btn primary";
      nextBtn.textContent = i === qs.length - 1 ? "See results →" : "Next question →";
      nextBtn.addEventListener("click", () => { i++; draw(); });
      document.getElementById("next-slot").appendChild(nextBtn);
      typeset();
    }
    function finish() {
      const pct = Math.round((correct / qs.length) * 100);
      Store.recordQuiz(correct, qs.length, lesson.id);
      const nMissed = missedIdx.length;
      const msg = pct === 100 ? "Flawless! 🎯" : pct >= 70 ? "Solid work." : "Review the lecture and try again.";
      // forward momentum: send the learner to the next lesson (or back to the course when this is the last)
      const nextCta = (course && next)
        ? `<a class="btn ${pct >= 70 ? "primary" : "ghost"}" href="#/lesson/${course.id}/${next.id}" data-route>Next: ${esc(next.title)} →</a>`
        : (course ? `<a class="btn ${pct >= 70 ? "primary" : "ghost"}" href="#/course/${course.id}" data-route>Back to ${esc(course.title)} →</a>` : "");
      body.innerHTML = `
      <div class="quiz quiz-result reveal">
        <div class="big">${pct}%</div>
        <p style="color:var(--ink-soft);font-size:18px">${correct} of ${qs.length} correct · ${msg}</p>
        <p style="color:var(--ink-mute);margin:6px 0 22px">+${correct * 10}${pct === 100 ? " +30 perfect bonus" : ""} XP</p>
        <div class="result-actions" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          ${nMissed ? `<button class="btn primary" id="redrill">↻ Redrill the ${nMissed} you missed</button>` : ""}
          <button class="btn ${nMissed ? "ghost" : "primary"}" id="retry">↻ Retry quiz</button>
          ${nextCta}
        </div>
      </div>`;
      document.getElementById("retry").addEventListener("click", () => { i = 0; correct = 0; missedIdx.length = 0; draw(); });
      const rd = document.getElementById("redrill");
      if (rd) rd.addEventListener("click", () => {
        // mastery-mode redrill of exactly the missed questions — re-queues each wrong one until it's right
        const items = missedIdx.map(qi => ({ q: qs[qi], lessonId: lesson.id, lessonTitle: lesson.title, courseId: course ? course.id : "", qIdx: qi }));
        runMasteryDrill(items, lesson.title + " — your missed questions", { continueLabel: "← Back to the lesson", onDone: router });
      });
      bindGo();
      if (pct === 100) confetti();
      animateBig();
      flushAchievements();
      renderChrome();
    }
    draw();
  }

  // ---------- flashcards ----------
  function renderCards(body, lesson) {
    const cards = (lesson.flashcards || []).map((c, i) => ({ c, id: lesson.id + ":" + i }));
    runFlashcards(body, cards, "Lesson flashcards");
  }

  function runFlashcards(body, cards, label, opts) {
    opts = opts || {};
    if (!cards.length) { body.innerHTML = emptyState("🃏", "No flashcards here yet."); return; }
    let i = 0, flipped = false, reviewed = 0;
    function draw() {
      if (i >= cards.length) { done(); return; }
      const { c } = cards[i];
      body.innerHTML = `
      <div class="flash-wrap reveal">
        <div class="flash-counter">${label} · ${i + 1} / ${cards.length}</div>
        <div class="card3d" id="card3d" role="button" tabindex="0" aria-label="Flashcard — activate to reveal the answer">
          <div class="card3d-inner" aria-live="polite">
            <div class="card-face" id="card-front"><span class="ftag">Prompt</span><div class="fcontent">${c.front}</div></div>
            <div class="card-face card-back" id="card-back" aria-hidden="true"><span class="ftag">Answer</span><div class="fcontent">${c.back}</div></div>
          </div>
        </div>
        <div id="flash-controls"></div>
      </div>`;
      flipped = false;
      const card = document.getElementById("card3d");
      card.addEventListener("click", flip);
      drawControls();
      typeset();
    }
    function flip() {
      flipped = !flipped;
      const card = document.getElementById("card3d");
      card.classList.toggle("flipped", flipped);
      // a11y: keep the hidden face out of the accessibility tree so the answer isn't read before the flip,
      // and update the label; the polite live region announces the revealed answer.
      const front = document.getElementById("card-front"), back = document.getElementById("card-back");
      if (front) front.setAttribute("aria-hidden", flipped ? "true" : "false");
      if (back) back.setAttribute("aria-hidden", flipped ? "false" : "true");
      card.setAttribute("aria-label", flipped ? "Answer revealed — grade how well you recalled it" : "Flashcard — activate to reveal the answer");
      drawControls();
    }
    function drawControls() {
      const slot = document.getElementById("flash-controls");
      if (!flipped) {
        slot.innerHTML = `<div class="flash-hint">Tap the card — or press <kbd>Space</kbd> — to reveal the answer</div>`;
      } else {
        const iv = g => { const d = Store.projectInterval(cards[i].id, g); return d <= 0 ? "soon" : d === 1 ? "1d" : d + "d"; };
        slot.innerHTML = `
          <div class="flash-grade">
            <button class="grade-btn again" data-g="0">Again<small>${iv(0)}</small></button>
            <button class="grade-btn hard"  data-g="1">Hard<small>${iv(1)}</small></button>
            <button class="grade-btn good"  data-g="2">Good<small>${iv(2)}</small></button>
            <button class="grade-btn easy"  data-g="3">Easy<small>${iv(3)}</small></button>
          </div>
          <div class="flash-hint">How well did you recall it? <kbd>1</kbd>–<kbd>4</kbd> grade · the time under each shows when you'll see it again.</div>`;
        slot.querySelectorAll(".grade-btn").forEach(b => b.addEventListener("click", () => {
          const g = parseInt(b.dataset.g, 10), card = document.getElementById("card3d");
          let advanced = false;
          const advance = () => { if (advanced) return; advanced = true; Store.gradeCard(cards[i].id, g); reviewed++; i++; draw(); renderChrome(); flushAchievements(); };
          if (reducedMotion() || !card) return advance();   // instant for reduced-motion
          slot.querySelectorAll(".grade-btn").forEach(x => x.disabled = true);  // lock during the fly-out
          card.classList.add("card-graded", "g" + g);
          card.addEventListener("animationend", advance, { once: true });
          setTimeout(advance, 480);                          // fallback if animationend doesn't fire
        }));
      }
    }
    function done() {
      body.innerHTML = `
      <div class="flash-wrap reveal" style="text-align:center;padding:40px 0">
        <div style="font-size:56px">🌟</div>
        <h3 style="font-family:var(--font-disp);font-size:28px;margin:12px 0">Deck cleared</h3>
        <p style="color:var(--ink-soft)">Reviewed ${reviewed} card${reviewed === 1 ? "" : "s"} · +${reviewed * 4} XP</p>
        <p style="color:var(--ink-mute);margin-top:6px">Spaced-repetition will resurface them when it's time.</p>
        ${opts.onDone
          ? `<button class="btn primary" id="deck-continue" style="margin-top:18px">${esc(opts.continueLabel || "Continue →")}</button>`
          : `<button class="btn primary" id="again-deck" style="margin-top:18px">↻ Run deck again</button>`}
      </div>`;
      if (opts.onDone) document.getElementById("deck-continue").addEventListener("click", opts.onDone);
      else document.getElementById("again-deck").addEventListener("click", () => { i = 0; reviewed = 0; draw(); });
      flushAchievements();
    }
    draw();
  }

  // ---------- homework ----------
  function renderHomework(body, lesson) {
    const hw = lesson.homework || [];
    if (!hw.length) { body.innerHTML = emptyState("✦", "No homework for this lesson."); return; }
    body.innerHTML = `<div class="hw reveal">` + hw.map((h, i) => `
      <div class="hw-item">
        <div class="hw-num">PROBLEM ${i + 1}</div>
        <div class="hw-prompt">${h.prompt || h.q || ""}</div>
        <div class="hw-reveal">
          ${h.hint ? `<button class="btn ghost" data-hint="${i}">💡 Hint</button>` : ""}
          <button class="btn" data-sol="${i}">Show solution</button>
        </div>
        <div id="hint-${i}"></div>
        <div id="sol-${i}"></div>
      </div>`).join("") + `</div>`;

    hw.forEach((h, i) => {
      const hintBtn = body.querySelector(`[data-hint="${i}"]`);
      if (hintBtn) hintBtn.addEventListener("click", () => {
        document.getElementById("hint-" + i).innerHTML = `<div class="hw-sol" style="border-color:var(--gold-deep)"><div class="sl" style="color:var(--gold)">Hint</div>${h.hint}</div>`;
        typeset();
      });
      body.querySelector(`[data-sol="${i}"]`).addEventListener("click", () => {
        Store.revealHomework(lesson.id + ":hw" + i);
        document.getElementById("sol-" + i).innerHTML = `<div class="hw-sol"><div class="sl">Solution</div>${h.solution}</div>`;
        typeset(); renderChrome(); flushAchievements();   // surface the Homework-Hero unlock + any daily-goal celebration
      });
    });
    typeset();
  }

  // ---------- recall ("explain it back" — free recall) ----------
  function renderRecall(body, course, lesson) {
    const cards = lesson.flashcards || [];
    if (!cards.length) { body.innerHTML = emptyState("🧠", "Add flashcards to a lesson to unlock free-recall practice."); return; }
    body.innerHTML = `
      <div class="recall reveal">
        <div class="recall-intro">
          <h3>🧠 Explain it back</h3>
          <p>Look away from the lecture and write everything you can about <b>${esc(lesson.title)}</b> from memory — the definition, the intuition, the key formulas, and when you'd reach for it. Recalling from a <em>blank page</em> is the single strongest way to find what you don't actually know yet — far better than re-reading.</p>
        </div>
        <textarea id="recall-area" class="recall-area" placeholder="Start typing your explanation from memory… (saved to your lesson notes on this device)">${esc(Store.getNote(lesson.id))}</textarea>
        <div class="recall-bar">
          <span id="recall-saved" class="recall-saved"></span>
          <button class="btn primary" id="recall-check">Check myself against ${cards.length} key point${cards.length === 1 ? "" : "s"} →</button>
        </div>
        <div id="recall-rubric"></div>
      </div>`;

    const area = body.querySelector("#recall-area");
    let nt;
    area.addEventListener("input", () => {
      clearTimeout(nt);
      nt = setTimeout(() => { Store.setNote(lesson.id, area.value); const s = body.querySelector("#recall-saved"); if (s) { s.textContent = "saved ✓"; setTimeout(() => s.textContent = "", 1500); } }, 500);
    });
    body.querySelector("#recall-check").addEventListener("click", revealRubric);
    typeset();

    function revealRubric() {
      const rub = body.querySelector("#recall-rubric");
      rub.innerHTML = `
        <div class="recall-rubric reveal">
          <p class="rubric-hint">Tick every point you genuinely covered <em>before</em> peeking — honest gaps are exactly what to restudy. Reveal any answer to compare your wording.</p>
          ${cards.map((c, i) => `
            <div class="rubric-item">
              <label class="rubric-pt"><input type="checkbox" data-rp="${i}"><span>${c.front}</span></label>
              <button class="btn ghost rubric-reveal" data-rb="${i}">show answer</button>
              <div class="rubric-ans" id="rub-ans-${i}"></div>
            </div>`).join("")}
          <div class="recall-score-bar">
            <button class="btn primary" id="recall-score">Score my recall (<span id="rp-count">0</span>/${cards.length})</button>
          </div>
          <div id="recall-result"></div>
        </div>`;
      rub.querySelectorAll(".rubric-reveal").forEach(b => b.addEventListener("click", () => {
        const i = b.dataset.rb;
        document.getElementById("rub-ans-" + i).innerHTML = `<div class="hw-sol"><div class="sl">Answer</div>${cards[i].back}</div>`;
        b.style.display = "none"; typeset();
      }));
      const upd = () => { const n = rub.querySelectorAll("input[data-rp]:checked").length; const c = document.getElementById("rp-count"); if (c) c.textContent = n; };
      rub.querySelectorAll("input[data-rp]").forEach(cb => cb.addEventListener("change", upd));
      rub.querySelector("#recall-score").addEventListener("click", scoreRecall);
      body.querySelector("#recall-check").disabled = true;
      typeset();
    }

    function scoreRecall() {
      const total = cards.length;
      const covered = body.querySelectorAll("input[data-rp]:checked").length;
      Store.touchStreak();
      for (let k = 0; k < covered; k++) Store.bumpMastery(lesson.id, { correct: true });   // reward demonstrated recall; missed points simply aren't credited
      const xp = covered * 6 + (covered === total ? 20 : 0);
      Store.addXP(xp);
      const pct = Math.round((covered / total) * 100);
      const msg = pct === 100 ? "Total recall — you can teach this. 🎓" : pct >= 60 ? "Strong. Re-read the points you left unticked, then recall again." : "Now you know exactly what to restudy. Re-read the lecture, then come back and recall.";
      document.getElementById("recall-result").innerHTML = `
        <div class="recall-done reveal">
          <div class="big">${covered}/${total}</div>
          <p style="color:var(--ink-soft)">${msg}</p>
          <p class="recall-xp">+${xp} XP</p>
          <button class="btn" id="recall-again">↻ Recall again</button>
        </div>`;
      const sb = body.querySelector("#recall-score"); if (sb) sb.disabled = true;
      document.getElementById("recall-again").addEventListener("click", () => renderRecall(body, course, lesson));
      Store.unlock("recaller");
      if (pct === 100) { Store.unlock("total-recall"); confetti(); }
      animateBig();
      flushAchievements();
      renderChrome();
    }
  }

  // ---------- global review (due reviews + a capped trickle of new cards) ----------
  const NEW_CARDS_PER_SESSION = 30;   // cap the intake of brand-new cards so a fresh user isn't handed the whole deck
  function viewReview() {
    const dueReviews = [], newCards = [], cards = Store.raw.cards || {}, now = Date.now(), DAY = 86400000;
    let soon = 0, week = 0, seen = 0;
    C().forEach(c => c.modules.forEach(m => m.lessons.forEach(l => {
      (l.flashcards || []).forEach((card, i) => {
        const id = l.id + ":" + i, s = Store.cardState(id);
        if (s === "due") dueReviews.push({ c: card, id });
        else if (s === "new") newCards.push({ c: card, id });
        const rec = cards[id];
        if (rec) { seen++; const d = rec.due || 0; if (d > now && d <= now + DAY) soon++; if (d > now && d <= now + 7 * DAY) week++; }
      });
    })));
    const newBatch = shuffle(newCards).slice(0, Store.raw.newPerSession || NEW_CARDS_PER_SESSION);
    const session = shuffle(dueReviews.concat(newBatch));   // due reviews first-class, plus a capped trickle of new cards
    const forecast = `<div class="today-strip reveal" style="gap:0">
      <div class="fc-cell"><div class="fc-n" style="color:var(--rust)">${dueReviews.length}</div><div class="fc-k">due to review</div></div>
      <div class="fc-cell"><div class="fc-n" style="color:var(--gold)">${newBatch.length}</div><div class="fc-k">new this session</div></div>
      <div class="fc-cell"><div class="fc-n" style="color:var(--sage)">${week}</div><div class="fc-k">due in 7 days</div></div>
      <div class="fc-cell"><div class="fc-n" style="color:var(--violet)">${seen}</div><div class="fc-k">cards in rotation</div></div>
    </div>`;
    const intro = session.length
      ? (dueReviews.length
          ? `${dueReviews.length} card${dueReviews.length === 1 ? "" : "s"} due for review${newBatch.length ? `, plus ${newBatch.length} new card${newBatch.length === 1 ? "" : "s"} to learn` : ""}. Grade honestly — the schedule adapts.`
          : `No reviews due yet — here ${newBatch.length === 1 ? "is" : "are"} ${newBatch.length} new card${newBatch.length === 1 ? "" : "s"} to start learning (more arrive each session as you go).`)
      : "Nothing due right now, and you've started every card. Come back tomorrow, or study a lesson's deck directly.";
    app.innerHTML = `
    <div class="view">
      <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Daily review</div>
      <div class="page-head reveal"><div class="eyebrow">Spaced repetition</div><h2>Daily <em>Review</em></h2>
      <p>${intro}</p></div>
      ${forecast}
      <div id="review-body"></div>
    </div>`;
    bindGo();
    if (session.length) runFlashcards(document.getElementById("review-body"), session, "Daily review");
    else document.getElementById("review-body").innerHTML = emptyState("✅", "Inbox zero. Your memory is up to date.");
  }

  // ---------- Daily Mix: a one-click guided session (review → quiz → next lesson) ----------
  function viewSession() {
    // phase 1: due flashcards (capped)
    const due = [];
    C().forEach(c => c.modules.forEach(m => m.lessons.forEach(l => (l.flashcards || []).forEach((card, i) => {
      const id = l.id + ":" + i; if (Store.cardDue(id)) due.push({ c: card, id });
    }))));
    const cardMix = shuffle(due).slice(0, 8);
    // phase 2: quiz — prefer weak spots, else recently-completed material
    const weak = {}; Store.weakSpots().forEach(w => weak[w.lessonId] = 1);
    let qpool = allQuestions().filter(q => weak[q.lessonId]); let qLabel = "weak spots";
    if (qpool.length < 4) {
      const done = {}; C().forEach(c => c.modules.forEach(m => m.lessons.forEach(l => { if (Store.isLessonDone(l.id)) done[l.id] = 1; })));
      const dp = allQuestions().filter(q => done[q.lessonId]);
      if (dp.length >= 4) { qpool = dp; qLabel = "recent material"; }
    }
    const quizMix = shuffle(qpool).slice(0, 6);
    // phase 3: redeem a few of the questions you've gotten wrong (the mistakes deck)
    const missMix = shuffle(missedItems()).slice(0, 5);
    // phase 4: a concrete next lesson to learn
    const cd = dailyConcept(); const nextLesson = cd && cd.node ? cd.node : null;

    const seq = [];
    if (cardMix.length) seq.push("cards");
    if (quizMix.length >= 3) seq.push("quiz");
    if (missMix.length >= 3) seq.push("mistakes");
    seq.push("finish");
    let step = 0;
    const names = { cards: "🃏 Review", quiz: "✎ Quiz", mistakes: "🎯 Redeem", finish: "🎉 Done" };
    const stepsBar = active => `<div class="sess-steps reveal">${seq.map(k => `<span class="sess-step ${k === active ? "active" : seq.indexOf(k) < seq.indexOf(active) ? "done" : ""}">${names[k]}</span>`).join("")}</div>`;
    const crumb = `<div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Daily Mix</div>`;

    function adv() { step++; go(); }
    function go() {
      const key = seq[step];
      if (key === "cards") {
        app.innerHTML = `<div class="view">${crumb}<div class="page-head reveal"><div class="eyebrow">Daily Mix</div><h2>Warm up: <em>due flashcards</em></h2><p>${cardMix.length} card${cardMix.length === 1 ? "" : "s"} due. Grade honestly, then we'll move to a quick quiz.</p></div>${stepsBar("cards")}<div id="sess-body"></div></div>`;
        bindGo();
        runFlashcards(document.getElementById("sess-body"), cardMix, "Daily Mix · review", { onDone: adv, continueLabel: seq[step + 1] === "quiz" ? "Continue to quiz →" : "Finish →" });
      } else if (key === "quiz") {
        runTest(quizMix, "Daily Mix · " + qLabel, { onDone: adv });
      } else if (key === "mistakes") {
        runMasteryDrill(missMix, "Daily Mix · redeem your mistakes", { onDone: adv, continueLabel: "Finish →" });
      } else {
        const lc = nextLesson ? nextLesson.course.id : null, ll = nextLesson ? nextLesson.lesson.id : null;
        const didMistakes = missMix.length >= 3;
        const didWork = cardMix.length || quizMix.length >= 3 || didMistakes;
        const didParts = [cardMix.length ? `cleared ${cardMix.length} due card${cardMix.length === 1 ? "" : "s"}` : "", quizMix.length >= 3 ? `took a ${quizMix.length}-question quiz` : "", didMistakes ? `redeemed ${missMix.length} mistake${missMix.length === 1 ? "" : "s"}` : ""].filter(Boolean);
        const didStr = didParts.length > 1 ? didParts.slice(0, -1).join(", ") + " and " + didParts[didParts.length - 1] : didParts[0] || "";
        app.innerHTML = `<div class="view">${crumb}
          <div class="page-head reveal"><div class="eyebrow">Daily Mix complete</div><h2>${didWork ? "Nice work today 🎉" : "Ready to learn"}</h2></div>
          ${stepsBar("finish")}
          <div class="sess-done reveal">
            <div class="sess-done-ico">${didWork ? "🎯" : "📖"}</div>
            <p>${didWork
              ? `You ${didStr}. Keep the streak alive.`
              : "Nothing was due to review yet — the best move is to learn something new."}</p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:16px">
              ${nextLesson ? `<a class="btn primary" href="#/lesson/${lc}/${ll}" data-route>▶ Learn next: ${esc(nextLesson.lesson.title)}</a>` : ""}
              <a class="btn ghost" href="#/" data-route>Back to dashboard</a>
            </div>
          </div></div>`;
        bindGo();
        if (didWork) { Store.unlock("daily-ritual"); flushAchievements(); }   // celebrate finishing the daily ritual
      }
    }
    go();
  }

  // ---------- examples tab ----------
  function renderExamples(body, lesson) {
    const ex = lesson.examples || [];
    if (!ex.length) { body.innerHTML = emptyState("🔍", "No standalone examples — the lecture has worked examples inline."); return; }
    body.innerHTML = `<div class="hw reveal">` + ex.map((e, i) => `
      <div class="hw-item">
        <div class="hw-num">EXAMPLE ${i + 1}${e.title ? " · " + esc(e.title) : ""}</div>
        <div class="prose" style="max-width:none">${e.body || e.scenario || e.prompt || ""}</div>
        ${e.solution ? `<div class="hw-reveal"><button class="btn" data-ex="${i}">Show working</button></div><div id="ex-${i}"></div>` : ""}
      </div>`).join("") + `</div>`;
    ex.forEach((e, i) => {
      const b = body.querySelector(`[data-ex="${i}"]`);
      if (b) b.addEventListener("click", () => { document.getElementById("ex-" + i).innerHTML = `<div class="hw-sol"><div class="sl">Working</div>${e.solution}</div>`; typeset(); });
    });
    hydrateViz(body); typeset();
  }

  // ---------- interactive viz hydration ----------
  function hydrateViz(root) {
    if (!window.VIZ) return;
    const meta = id => (window.VIZ_CATALOG || []).find(v => v.id === id);
    (root || app).querySelectorAll("[data-viz]").forEach(node => {
      const id = node.getAttribute("data-viz");
      if (node.dataset.vizDone) return;
      node.dataset.vizDone = "1"; node.classList.add("viz");
      if (window.VIZ[id]) {
        try {
          window.VIZ[id](node); Store.recordVizOpen(id); flushAchievements();
          // accessibility: name the visualization for screen readers (canvas content is otherwise invisible)
          const m = meta(id);
          if (m) {
            node.setAttribute("role", "group");
            // canvas-less widgets have no canvas to carry the blurb detail — put it on the container
            node.setAttribute("aria-label", "Interactive visualization: " + m.title + (m.blurb && !node.querySelector("canvas") ? ". " + m.blurb : ""));
            const cv = node.querySelector("canvas");
            if (cv) { cv.setAttribute("role", "img"); cv.setAttribute("aria-label", m.title + " — " + m.blurb); }
          }
        } catch (e) { node.innerHTML = '<div class="viz-note">Visualization failed to load.</div>'; }
      }
      else node.innerHTML = `<div class="viz-note">Unknown visualization: ${esc(id)}</div>`;
    });
  }

  // ---------- custom test / exam spawner ----------
  // Adaptive selection: mastery-weighted sampling without replacement. Weak or fading
  // lessons (low effectiveMastery) are drawn up to 5x more often; fully mastered material
  // keeps a floor weight of 0.2 so nothing is ever retired from rotation.
  function weightedTestPick(pool, len) {
    const items = pool.map(q => ({ q, w: 1 - 0.8 * Store.effectiveMastery(q.lessonId) }));
    const out = [];
    while (out.length < len && items.length) {
      let tot = 0; for (const it of items) tot += it.w;
      let r = Math.random() * tot, idx = 0;
      for (; idx < items.length - 1; idx++) { r -= items[idx].w; if (r <= 0) break; }
      out.push(items[idx].q); items.splice(idx, 1);
    }
    return out;
  }

  function viewTest() {
    const courses = C();
    const completed = courses.flatMap(c => c.modules.flatMap(m => m.lessons)).filter(l => Store.isLessonDone(l.id));
    app.innerHTML = `
    <div class="view">
      <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Test</div>
      <div class="page-head reveal"><div class="eyebrow">Question bank · ${allQuestions().length} questions</div><h2>Spawn a <em>Test</em></h2>
      <p>Build a fresh test on demand. Choose the scope and length — by default it draws <strong>only from what you've already learned</strong>, so you're never tested on what you haven't seen — and it leans toward lessons your mastery says are weak or fading, while mastered material still rotates through.</p></div>
      ${(() => { const n = Store.missedCount(); return n ? `<div class="miss-cta reveal" data-go="#/mistakes">
        <div class="miss-ico">🎯</div>
        <div class="miss-body"><h3>Redeem your mistakes</h3><p><b>${n}</b> question${n === 1 ? "" : "s"} you've gotten wrong ${n === 1 ? "is" : "are"} waiting. Drill them in mastery mode until every one sticks.</p></div>
        <span class="btn primary" style="pointer-events:none;white-space:nowrap">Review ${n} →</span>
      </div>` : ""; })()}
      <div class="test-config reveal">
        <div class="tc-row">
          <label class="viz-slab" for="t-scope">Scope</label>
          <select id="t-scope">
            <option value="mastered" ${completed.length ? "selected" : ""}>✓ Only lessons I've completed (${completed.length})</option>
            <option value="weak">⚠ Focus my weak spots (${Store.weakSpots().length})</option>
            <option value="all" ${completed.length ? "" : "selected"}>Everything (all topics)</option>
            ${courses.map(c => `<option value="course:${c.id}">${esc(c.title)} only</option>`).join("")}
          </select>
        </div>
        <div class="tc-row">
          <label class="viz-slab" for="t-len">Length</label>
          <select id="t-len"><option value="5">5 questions</option><option value="10" selected>10 questions</option><option value="20">20 questions</option><option value="40">40 questions</option></select>
        </div>
        <div id="t-avail" class="tc-avail" aria-live="polite"></div>
        <label class="tc-check"><input type="checkbox" id="t-mastery" checked> <span><b>Mastery mode</b> — wrong answers come back until you get them right (no casual remembering).</span></label>
        <button class="btn primary" id="t-start">Start →</button>
        <div id="t-warn" class="viz-note"></div>
      </div>
      ${Store.raw.tests.length ? `<div class="module reveal" style="margin-top:34px"><div class="module-head"><span class="mnum">🗂️</span><h3>Recent tests</h3></div>
        ${Store.raw.tests.slice(0, 8).map(t => `<div class="lesson-row" style="cursor:default"><div class="l-title" style="font-size:15px">${esc(t.label)}</div><div class="l-right"><span class="pill ${t.correct === t.total ? "sage" : "gold"}">${t.correct}/${t.total} · ${Math.round(t.correct / t.total * 100)}%</span></div></div>`).join("")}</div>` : ""}
    </div>`;
    bindGo();
    // resolve a scope value to its actual question pool + label (shared by the live readout and Start)
    function scopedPool(scope) {
      const all = allQuestions();
      if (scope === "mastered") { const done = {}; completed.forEach(l => done[l.id] = 1); return { pool: all.filter(q => done[q.lessonId]), label: "Mastered material" }; }
      if (scope === "weak") { const weak = {}; Store.weakSpots().forEach(w => weak[w.lessonId] = 1); return { pool: all.filter(q => weak[q.lessonId]), label: "Weak spots" }; }
      if (scope.startsWith("course:")) { const cid = scope.slice(7); return { pool: all.filter(q => q.courseId === cid), label: (findCourse(cid) || {}).title || "Topic" }; }
      return { pool: all, label: "All topics" };
    }
    const scopeSel = document.getElementById("t-scope"), lenSel = document.getElementById("t-len");
    const avail = document.getElementById("t-avail"), startBtn = document.getElementById("t-start"), warn = document.getElementById("t-warn");
    function updateAvail() {
      const n = scopedPool(scopeSel.value).pool.length;
      const len = parseInt(lenSel.value, 10);
      warn.textContent = "";
      if (n < 3) {
        avail.innerHTML = `<span class="tc-thin">⚠ Only ${n} question${n === 1 ? "" : "s"} in this scope — pick a wider scope or complete a few more lessons.</span>`;
        startBtn.disabled = true; startBtn.classList.add("disabled");
      } else {
        avail.innerHTML = `<b>${n}</b> question${n === 1 ? "" : "s"} available${len > n ? ` · your test will use all <b>${n}</b>` : ""}`;
        startBtn.disabled = false; startBtn.classList.remove("disabled");
      }
    }
    scopeSel.addEventListener("change", updateAvail);
    lenSel.addEventListener("change", updateAvail);
    updateAvail();
    startBtn.addEventListener("click", () => {
      const { pool, label } = scopedPool(scopeSel.value), len = parseInt(lenSel.value, 10);
      if (pool.length < 3) { warn.textContent = "Not enough questions in that scope yet — complete a few more lessons, or widen the scope."; return; }
      const picked = shuffle(weightedTestPick(pool, Math.min(len, pool.length)));
      if (document.getElementById("t-mastery").checked) runMasteryDrill(picked, label);
      else runTest(picked, label);
    });
  }

  // ---------- redeem-your-mistakes drill ----------
  function viewMistakes() {
    const items = missedItems();
    if (!items.length) {
      app.innerHTML = `<div class="view">
        <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Mistakes</div>
        <div class="page-head reveal"><div class="eyebrow">Redeem</div><h2>No mistakes to redeem <em>🎉</em></h2>
        <p>Every question you answer incorrectly — in a lesson quiz or a test — collects here so you can drill it in mastery mode until it sticks. Nothing's waiting right now. Keep it that way.</p></div>
        <div style="display:flex;gap:12px;flex-wrap:wrap" class="reveal"><a class="btn primary" href="#/test" data-route>📝 Spawn a test</a><a class="btn ghost" href="#/" data-route>← Dashboard</a></div>
      </div>`;
      bindGo(); return;
    }
    runMasteryDrill(items, "Your mistakes");
  }

  // ---------- "Keep it fresh": drill the fading-mastery concepts back up ----------
  // Pulls a few MCQs from each fading lesson (Store.fadingConcepts) and runs them as a
  // mastery drill. Answering correctly calls bumpMastery, which resets the decay clock and
  // raises effectiveMastery — so refreshed concepts leave the fading band. Closes the loop
  // the dashboard "Keep it fresh" surface (iter 191) opened.
  function viewRefresh() {
    const fading = Store.fadingConcepts();
    if (!fading.length) {
      app.innerHTML = `<div class="view">
        <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Refresh</div>
        <div class="page-head reveal"><div class="eyebrow">Keep it fresh</div><h2>Nothing fading right now <em>✨</em></h2>
        <p>Concepts you've mastered slip gradually out of memory; when any start to fade, they collect here for a quick refresher — the spacing effect. Right now everything you've learned is holding strong. Come back after a while away.</p></div>
        <div style="display:flex;gap:12px;flex-wrap:wrap" class="reveal"><a class="btn primary" href="#/session" data-route>🎯 Daily Mix</a><a class="btn ghost" href="#/" data-route>← Dashboard</a></div>
      </div>`;
      bindGo(); return;
    }
    const want = {}; fading.forEach(f => want[f.lessonId] = 1);
    const byLesson = {};
    allQuestions().forEach(it => { if (want[it.lessonId]) (byLesson[it.lessonId] = byLesson[it.lessonId] || []).push(it); });
    const PER_LESSON = 3, CAP = 12;
    const items = [];
    fading.forEach(f => { items.push(...shuffle(byLesson[f.lessonId] || []).slice(0, PER_LESSON)); });
    const drill = shuffle(items).slice(0, CAP);
    if (!drill.length) {   // fading lessons exist but carry no MCQs — send to the lessons instead
      app.innerHTML = `<div class="view">
        <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Refresh</div>
        <div class="page-head reveal"><div class="eyebrow">Keep it fresh</div><h2>Time for a refresher</h2>
        <p>These concepts are fading. Revisit them to lock them back in:</p></div>
        <div class="fade-chips reveal" style="max-width:680px">${fading.map(f => `<a class="fade-chip" href="#/lesson/${f.courseId}/${f.lessonId}" data-route><span class="fade-dot" style="background:${Store.masteryLevel(f.eff).color}"></span><span class="fade-title">${esc(f.title)}</span><span class="fade-pct">${Math.round(f.eff * 100)}%</span></a>`).join("")}</div>` ;
      bindGo(); return;
    }
    runMasteryDrill(drill, "Refresh · fading concepts");
  }

  // ---------- mastery drill: re-queue wrong answers until ALL are passed ----------
  function runMasteryDrill(items, label, opts) {
    opts = opts || {};
    const total = items.length;
    let queue = items.map((it, k) => ({ it, key: k })); // each unique question
    queue = shuffle(queue);
    const remaining = new Set(queue.map(q => q.key));
    let firstTryRight = 0, attempts = 0, seenKeys = new Set();
    function draw() {
      if (!queue.length) return finish();
      const { it, key } = queue[0], q = it.q;
      const masteredN = total - remaining.size;
      app.innerHTML = `
      <div class="view"><div class="quiz reveal">
        <div class="q-progress">${esc(label)} · Mastery mode — <b style="color:var(--sage)">${masteredN}/${total} mastered</b>${queue.length > 1 ? ` · ${queue.length} in queue` : ""} · <kbd>1</kbd>–<kbd>4</kbd> answer</div>
        <div class="mastery-track"><div class="mastery-track-fill" style="width:${Math.round(masteredN / total * 100)}%"></div></div>
        <div class="q-stem">${q.q}</div>
        <div class="choices">${q.choices.map((ch, ci) => `<button class="choice" data-ci="${ci}"><span class="key">${String.fromCharCode(65 + ci)}</span><span>${ch}</span></button>`).join("")}</div>
        <div id="md-explain" aria-live="polite"></div><div id="md-next" style="margin-top:20px"></div>
      </div></div>`;
      let locked = false;
      app.querySelectorAll(".choice").forEach(b => b.addEventListener("click", () => {
        if (locked) return; locked = true;
        const ci = parseInt(b.dataset.ci, 10), right = q.answer, ok = ci === right;
        attempts++;
        if (!seenKeys.has(key)) { seenKeys.add(key); if (ok) firstTryRight++; }
        Store.bumpMastery(it.lessonId, { correct: ok });
        if (it.qIdx != null) { if (ok) Store.clearMiss(it.lessonId, it.qIdx); else Store.recordMiss(it.lessonId, it.qIdx); }
        app.querySelectorAll(".choice").forEach((bb, bi) => { bb.classList.add("locked"); if (bi === right) { bb.classList.add("correct"); bb.insertAdjacentHTML("beforeend", '<span class="sr-only"> (correct answer)</span>'); } else if (bi === ci) { bb.classList.add("wrong"); bb.insertAdjacentHTML("beforeend", '<span class="sr-only"> (your answer, incorrect)</span>'); } });
        if (ok) { remaining.delete(key); queue.shift(); }
        else { const item = queue.shift(); queue.push(item); } // back of the line
        document.getElementById("md-explain").innerHTML = `<div class="explain"><div class="et">${ok ? "Correct ✓ — mastered" : "Not yet — you'll see this again"}</div>${q.explain || ""}${!ok ? `<div style="margin-top:6px;color:var(--ink-mute)">${esc(it.lessonTitle)} · <a href="#/lesson/${it.courseId}/${it.lessonId}" data-route style="color:var(--gold)">review the lesson →</a></div>` : ""}</div>`;
        const nb = document.createElement("button"); nb.className = "btn primary";
        nb.textContent = remaining.size ? "Continue →" : "Finish ✓";
        nb.addEventListener("click", draw); document.getElementById("md-next").appendChild(nb);
        bindGo(); typeset();
      }));
      typeset();
    }
    function finish() {
      const pct = Math.round(firstTryRight / total * 100);
      Store.recordTest(total, total, `${label} · mastery (${total}Q)`); // all eventually correct
      app.innerHTML = `
      <div class="view"><div class="quiz quiz-result reveal">
        <div class="big">✓ ${total}/${total}</div>
        <p style="color:var(--ink-soft);font-size:18px">All ${total} mastered · ${esc(label)}</p>
        <p style="color:var(--ink-mute);margin:6px 0 20px">${firstTryRight} right on the first try (${pct}%) · ${attempts} total attempts</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">${opts.onDone
          ? `<button class="btn primary" id="md-continue">${esc(opts.continueLabel || "Continue →")}</button>`
          : `<button class="btn primary" id="md-again">↻ New drill</button><a class="btn ghost" href="#/" data-route>Done</a>`}</div>
      </div></div>`;
      bindGo();
      if (opts.onDone) document.getElementById("md-continue").addEventListener("click", opts.onDone);
      else document.getElementById("md-again").addEventListener("click", () => { location.hash = "#/test"; });
      confetti(); animateBig(); flushAchievements(); renderChrome();
    }
    draw();
  }

  function runTest(items, label, opts) {
    opts = opts || {};
    let i = 0; const answers = new Array(items.length).fill(null);
    function draw() {
      const q = items[i].q;
      app.innerHTML = `
      <div class="view"><div class="quiz reveal">
        <div class="q-progress">${esc(label)} · Question ${i + 1} of ${items.length} · <kbd>1</kbd>–<kbd>4</kbd> answer · <kbd>↵</kbd> next</div>
        <div class="q-stem">${q.q}</div>
        <div class="choices">${q.choices.map((ch, ci) => `<button class="choice ${answers[i] === ci ? "sel" : ""}" data-ci="${ci}"><span class="key">${String.fromCharCode(65 + ci)}</span><span>${ch}</span></button>`).join("")}</div>
        <div style="display:flex;gap:12px;margin-top:26px;flex-wrap:wrap">
          ${i > 0 ? `<button class="btn ghost" id="t-prev">← Back</button>` : ""}
          <button class="btn primary" id="t-next" ${answers[i] == null ? "disabled" : ""}>${i === items.length - 1 ? "Submit test ✓" : "Next →"}</button>
          <span class="viz-note" style="margin:auto 0">${answers.filter(a => a != null).length} / ${items.length} answered</span>
        </div>
      </div></div>`;
      app.querySelectorAll(".choice").forEach(b => b.addEventListener("click", () => { answers[i] = parseInt(b.dataset.ci, 10); draw(); }));
      const nx = document.getElementById("t-next"); if (nx) nx.addEventListener("click", () => { if (i === items.length - 1) finish(); else { i++; draw(); } });
      const pv = document.getElementById("t-prev"); if (pv) pv.addEventListener("click", () => { i--; draw(); });
      typeset();
    }
    function finish() {
      if (opts.placement) return finishPlacement();
      let correct = 0; items.forEach((it, k) => { const ok = answers[k] === it.q.answer; if (ok) correct++; Store.bumpMastery(it.lessonId, { correct: ok }); if (it.qIdx != null) { if (ok) Store.clearMiss(it.lessonId, it.qIdx); else Store.recordMiss(it.lessonId, it.qIdx); } });
      const pct = Math.round(correct / items.length * 100);
      const priorTests = (Store.raw.tests || []).filter(t => t.total >= 5);   // best-score-so-far BEFORE recording this one
      const priorBest = priorTests.length ? Math.max.apply(null, priorTests.map(t => Math.round(t.correct / t.total * 100))) : -1;
      Store.recordTest(correct, items.length, `${label} · ${items.length}Q`);
      if (items.length >= 5 && priorBest >= 0 && pct > priorBest) setTimeout(() => toast("🎯", "New best test score!", "Your highest yet — " + pct + "% (beat " + priorBest + "%)."), 400);
      const missed = items.filter((it, k) => answers[k] !== it.q.answer);   // redrill exactly these, right now
      app.innerHTML = `
      <div class="view"><div class="quiz quiz-result reveal">
        <div class="big">${pct}%</div>
        <p style="color:var(--ink-soft);font-size:18px">${correct} of ${items.length} correct · ${esc(label)}</p>
        <p style="color:var(--ink-mute);margin:6px 0 20px">+${correct * 8}${items.length >= 10 && correct === items.length ? " +50 perfect bonus" : ""} XP</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">${opts.onDone ? `<button class="btn primary" id="t-continue">Continue →</button>` : `${missed.length ? `<button class="btn primary" id="t-redrill">↻ Redrill the ${missed.length} you missed</button>` : ""}<button class="btn ${missed.length ? "ghost" : "primary"}" id="t-again">↻ New test</button><a class="btn ghost" href="#/" data-route>Done</a>`}</div>
      </div>
      <div class="hw reveal" style="margin-top:30px"><div class="module-head"><span class="mnum">📋</span><h3>Review</h3></div>
        ${items.map((it, k) => { const ok = answers[k] === it.q.answer; return `<div class="hw-item" style="border-color:${ok ? "var(--sage-deep)" : "var(--rust)"}">
          <div class="hw-num" style="color:${ok ? "var(--sage)" : "var(--rust)"}">${ok ? "✓ Correct" : "✗ Incorrect"} · ${esc(it.lessonTitle)}</div>
          <div class="hw-prompt">${it.q.q}</div>
          <div class="viz-note">Correct answer: <b>${String.fromCharCode(65 + it.q.answer)}.</b> ${it.q.choices[it.q.answer]}${answers[k] != null && !ok ? ` · you chose ${String.fromCharCode(65 + answers[k])}` : answers[k] == null ? " · you skipped this" : ""}</div>
          ${it.q.explain ? `<div class="hw-sol"><div class="sl">Why</div>${it.q.explain}</div>` : ""}
        </div>`; }).join("")}
      </div></div>`;
      bindGo();
      if (opts.onDone) document.getElementById("t-continue").addEventListener("click", opts.onDone);
      else {
        document.getElementById("t-again").addEventListener("click", () => { location.hash = "#/test"; });
        const rd = document.getElementById("t-redrill");
        if (rd) rd.addEventListener("click", () => runMasteryDrill(shuffle(missed.slice()), label + " · redo misses"));
      }
      if (pct === 100 && items.length >= 10) confetti();
      animateBig(); flushAchievements(); renderChrome(); typeset();
    }
    function finishPlacement() {
      const course = opts.course;
      let correct = 0;
      items.forEach((it, k) => { const ok = answers[k] === it.q.answer; if (ok) { correct++; Store.markKnown(it.lessonId); } else Store.bumpMastery(it.lessonId, { correct: false }); });
      Store.unlock("calibrated"); flushAchievements();   // finishing a placement diagnostic is worth celebrating (nudges the skip-what-you-know flow)
      // recommended starting point = first lesson in order that isn't "known"
      const known = {}; items.forEach((it, k) => { if (answers[k] === it.q.answer) known[it.lessonId] = 1; });
      const flat = flatLessons(course);
      const start = flat.find(l => !known[l.id]) || flat[flat.length - 1];
      app.innerHTML = `
      <div class="view"><div class="quiz quiz-result reveal">
        <div class="big">${correct}/${items.length}</div>
        <p style="color:var(--ink-soft);font-size:18px">Placement complete · ${esc(course.title)}</p>
        <p style="color:var(--ink-mute);margin:6px 0 20px">${correct} concept${correct === 1 ? "" : "s"} marked as known — they'll show as Proficient and the map will skip ahead.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <a class="btn primary" href="#/lesson/${course.id}/${start.id}" data-route>▶ Start at: ${esc(start.title)}</a>
          <a class="btn ghost" href="#/map" data-route>See the map</a>
        </div>
      </div>
      <div class="hw reveal" style="margin-top:30px"><div class="module-head"><span class="mnum">🎚️</span><h3>Your results</h3></div>
        ${items.map((it, k) => { const ok = answers[k] === it.q.answer; return `<div class="lesson-row" style="cursor:default"><div class="lesson-check ${ok ? "done2" : ""}" style="${ok ? "background:var(--sage);border-color:var(--sage);color:var(--bg)" : "color:var(--rust);border-color:var(--rust)"}">${ok ? "✓" : "?"}</div><div style="flex:1"><div class="l-title" style="font-size:15px">${esc(it.lessonTitle)}</div><div class="l-meta">${ok ? "known — marked Proficient" : "to learn"}</div></div></div>`; }).join("")}
      </div></div>`;
      bindGo(); animateBig(); renderChrome();
    }
    draw();
  }

  // ---------- learning path (knowledge dependency) ----------
  function viewPath(cid, lid) {
    const found = findLesson(cid, lid); if (!found) return view404();
    const target = found.lesson;
    const path = learningPath(lid);
    const firstUndone = path.find(n => !Store.isLessonDone(n.lesson.id));
    Store.unlock("pathfinder"); flushAchievements();
    app.innerHTML = `
    <div class="view">
      <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; <a href="#/lesson/${cid}/${lid}" data-route>${esc(target.title)}</a> &nbsp;›&nbsp; Path</div>
      <div class="page-head reveal"><div class="eyebrow">Knowledge dependency · ${path.length} steps</div><h2>Path to <em>${esc(target.title)}</em></h2>
      <p>Master these in order and you'll have every prerequisite this concept rests on. Completed steps are checked; start at the first open one.</p></div>
      ${firstUndone ? `<a class="btn primary reveal" href="#/lesson/${firstUndone.course.id}/${firstUndone.lesson.id}" data-route style="margin-bottom:24px">▶ Start at: ${esc(firstUndone.lesson.title)}</a>` : `<div class="callout sage reveal" style="margin-bottom:24px"><div class="c-tag">Ready</div>You've completed every prerequisite — dive into ${esc(target.title)}.</div>`}
      <div class="path-list reveal">
        ${path.map((n, k) => { const done = Store.isLessonDone(n.lesson.id), isTarget = n.lesson.id === lid;
          return `<a class="path-step ${done ? "done" : ""} ${isTarget ? "target" : ""}" href="#/lesson/${n.course.id}/${n.lesson.id}" data-route>
            <span class="ps-num" style="--c:${n.course.color}">${done ? "✓" : k + 1}</span>
            <span class="ps-main"><span class="ps-title">${esc(n.lesson.title)}${isTarget ? " 🎯" : ""}</span><span class="ps-course" style="color:${n.course.color}">${esc(n.course.title)}</span></span>
            <span class="ps-min">${n.lesson.minutes || 10}m</span>
          </a>`; }).join("")}
      </div>
    </div>`;
    bindGo();
  }

  // ---------- visualization lab ----------
  // first lesson that embeds a given widget
  function vizLesson(vizId) {
    let found = null;
    C().forEach(c => c.modules.forEach(m => m.lessons.forEach(l => { const s = (l.content || ""); if (!found && (s.indexOf('data-viz="' + vizId + '"') >= 0 || s.indexOf("data-viz='" + vizId + "'") >= 0)) found = { course: c, lesson: l }; })));
    return found;
  }
  function viewLab() {
    const cat = window.VIZ_CATALOG || [];
    const seen = Store.raw.vizSeen || {};
    const total = cat.length;
    const seenCount = cat.filter(v => seen[v.id]).length;
    const pct = total ? Math.round(seenCount / total * 100) : 0;
    const byTopic = {};
    cat.forEach(v => { (byTopic[v.topic] = byTopic[v.topic] || []).push(v); });
    const groups = C().map(c => {
      const items = byTopic[c.id] || []; if (!items.length) return "";
      return `<div class="module reveal lab-group"><div class="module-head"><span class="mnum" style="color:${c.color}">${esc(c.icon)}</span><h3>${esc(c.title)}</h3></div>
        <div class="lab-grid">${items.map(v => { const vl = vizLesson(v.id); const xp = !!seen[v.id];
          const s = (v.title + " " + v.blurb + " " + (vl ? vl.lesson.title : "") + " " + c.title).toLowerCase().replace(/["<>]/g, "");
          return `<a class="lab-card${xp ? " explored" : ""}" href="#/lab/${v.id}" data-route data-s="${s}" data-x="${xp ? 1 : 0}" data-topic="${c.id}" style="--c:${c.color}"><h4>${esc(v.title)}</h4><p>${esc(v.blurb)}</p>${vl ? `<span class="lab-in">↳ ${esc(vl.lesson.title)}</span>` : ""}<div class="lab-foot"><span class="lab-go">Open ↗</span>${xp ? `<span class="lab-seen">✓ explored</span>` : ""}</div></a>`; }).join("")}</div></div>`;
    }).join("");
    const unseen = total - seenCount;
    app.innerHTML = `
    <div class="view">
      <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Lab</div>
      <div class="page-head reveal"><div class="eyebrow">${total} interactive widgets</div><h2>Visualization <em>Lab</em></h2>
      <p>Play with the ideas directly — drag, slide, and animate. Manipulating a concept builds intuition faster than reading about it.</p></div>
      <div class="lab-controls reveal">
        <div class="lab-prog">
          <div class="lab-prog-top"><span>${seenCount} of ${total} explored</span><span class="lab-prog-pct">${pct}%</span></div>
          <div class="lab-prog-bar" role="img" aria-label="${seenCount} of ${total} visualizations explored"><span class="lab-prog-fill" style="width:${pct}%"></span></div>
        </div>
        <div class="lab-tools">
          <input id="lab-search" type="search" class="lab-search" placeholder="Search ${total} visualizations…" aria-label="Search visualizations">
          <div class="lab-filter" role="group" aria-label="Filter visualizations">
            <button class="lab-fbtn active" data-f="all" aria-pressed="true">All</button>
            <button class="lab-fbtn" data-f="unseen" aria-pressed="false">Unexplored${unseen ? " (" + unseen + ")" : ""}</button>
          </div>
        </div>
        <div class="lab-topics" role="group" aria-label="Filter by topic">
          <button class="lab-tbtn active" data-t="all" aria-pressed="true">All topics</button>
          ${C().map(c => `<button class="lab-tbtn" data-t="${c.id}" aria-pressed="false">${esc(c.icon)} ${esc(c.title)}</button>`).join("")}
        </div>
      </div>
      <div id="lab-noresults" class="lab-noresults" hidden>No visualizations match — try another search.</div>
      ${groups || emptyState("🎛️", "No visualizations loaded.")}
    </div>`;
    bindGo();
    // client-side filter: free-text search + All / Unexplored toggle (no re-render)
    const search = document.getElementById("lab-search");
    const fbtns = Array.prototype.slice.call(document.querySelectorAll(".lab-fbtn"));
    const tbtns = Array.prototype.slice.call(document.querySelectorAll(".lab-tbtn"));
    const cards = Array.prototype.slice.call(document.querySelectorAll(".lab-card"));
    const groupEls = Array.prototype.slice.call(document.querySelectorAll(".lab-group"));
    const noRes = document.getElementById("lab-noresults");
    let mode = "all", topicF = "all";
    function apply() {
      const q = (search && search.value || "").trim().toLowerCase();
      let shown = 0;
      cards.forEach(card => {
        const okText = !q || card.dataset.s.indexOf(q) >= 0;
        const okMode = mode === "all" || card.dataset.x === "0";
        const okTopic = topicF === "all" || card.dataset.topic === topicF;
        const show = okText && okMode && okTopic;
        card.classList.toggle("lab-hidden", !show);
        if (show) shown++;
      });
      groupEls.forEach(g => g.classList.toggle("lab-hidden", g.querySelectorAll(".lab-card:not(.lab-hidden)").length === 0));
      if (noRes) noRes.hidden = shown > 0;
    }
    if (search) search.addEventListener("input", apply);
    fbtns.forEach(b => b.addEventListener("click", () => {
      mode = b.dataset.f;
      fbtns.forEach(x => { const on = x === b; x.classList.toggle("active", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      apply();
    }));
    tbtns.forEach(b => b.addEventListener("click", () => {
      topicF = b.dataset.t;
      tbtns.forEach(x => { const on = x === b; x.classList.toggle("active", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      apply();
    }));
  }
  function viewLabItem(id) {
    const meta = (window.VIZ_CATALOG || []).find(v => v.id === id);
    if (!meta) return view404();
    const course = findCourse(meta.topic);
    app.innerHTML = `
    <div class="view">
      <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; <a href="#/lab" data-route>Lab</a> &nbsp;›&nbsp; ${esc(meta.title)}</div>
      <div class="page-head reveal"><div class="eyebrow" style="color:${course ? course.color : "var(--gold)"}">${course ? esc(course.title) : "Visualization"}</div><h2>${esc(meta.title)}</h2><p>${esc(meta.blurb)}</p></div>
      <div class="viz reveal" data-viz="${esc(id)}"></div>
      <div class="lesson-actions">
        ${(() => { const vl = vizLesson(id); return vl ? `<a class="btn primary" href="#/lesson/${vl.course.id}/${vl.lesson.id}" data-route>📖 Read the lesson: ${esc(vl.lesson.title)} →</a>` : ""; })()}
        ${course ? `<a class="btn ghost" href="#/course/${course.id}" data-route>All of ${esc(course.title)} →</a>` : ""}
      </div>
    </div>`;
    bindGo(); hydrateViz(app);
  }

  // ---------- glossary ----------
  function viewGlossary(preTerm) {
    const g = window.GLOSSARY || [];
    const topicName = id => id === "general" ? "General" : (findCourse(id) || {}).title || id;
    const topicColor = id => id === "general" ? "var(--gold)" : (findCourse(id) || {}).color || "var(--gold)";
    // make each term clickable: jump to the lesson that teaches it (title match preferred, else content), else its course page
    function targetFor(e) {
      const course = findCourse(e.topic); if (!course) return null;   // "general" terms have no course → not clickable
      const tl = e.term.toLowerCase(); let byTitle = null, byContent = null;
      course.modules.forEach(m => m.lessons.forEach(l => {
        if (!byTitle && (l.title || "").toLowerCase().includes(tl)) byTitle = l.id;
        if (!byContent && (l.content || "").toLowerCase().includes(tl)) byContent = l.id;
      }));
      const lid = byTitle || byContent;
      return lid ? { href: "#/lesson/" + e.topic + "/" + lid, label: "Open the lesson →" }
                 : { href: "#/course/" + e.topic, label: "Explore " + topicName(e.topic) + " →" };
    }
    // if a TITLE-matched lesson for this term embeds a visualization, offer a direct "see it animated" link
    // (title match keeps it high-precision — the viz is genuinely about the term, not just a content mention)
    function vizFor(e) {
      const course = findCourse(e.topic); if (!course) return null;
      const tl = e.term.toLowerCase(); let vid = null;
      course.modules.forEach(m => m.lessons.forEach(l => {
        if (!vid && (l.title || "").toLowerCase().includes(tl)) { const mm = (l.content || "").match(/data-viz=["']([^"']+)["']/); if (mm) vid = mm[1]; }
      }));
      return vid;
    }
    const present = new Set(g.map(e => e.topic));
    const chipTopics = C().map(c => c.id).filter(id => present.has(id)).concat(present.has("general") ? ["general"] : []);
    let topicF = "all";
    function render(q) {
      q = (q || "").trim().toLowerCase();
      const items = g.filter(e => (topicF === "all" || e.topic === topicF) && (!q || e.term.toLowerCase().includes(q) || e.def.toLowerCase().includes(q) || topicName(e.topic).toLowerCase().includes(q)))
        .slice().sort((a, b) => a.term.localeCompare(b.term));
      document.getElementById("gloss-list").innerHTML = items.length ? items.map(e => {
        const t = targetFor(e), vz = vizFor(e);
        const vizChip = vz ? ` <span class="gloss-viz" data-viz-go="#/lab/${vz}" role="button" tabindex="0" aria-label="See ${esc(e.term)} visualized">🎛️ Visualize</span>` : "";
        const inner = `<div class="gloss-term">${esc(e.term)} <span class="gloss-topic" style="color:${topicColor(e.topic)};border-color:${topicColor(e.topic)}">${esc(topicName(e.topic))}</span></div>
          <div class="gloss-def">${e.def}</div>` + (t ? `<div class="gloss-go">${esc(t.label)}${vizChip}</div>` : (vizChip ? `<div class="gloss-go">${vizChip}</div>` : ""));
        return t ? `<a class="gloss-item gloss-link" href="${t.href}">${inner}</a>` : `<div class="gloss-item">${inner}</div>`;
      }).join("") : emptyState("🔍", "No terms match “" + esc(q) + "”.");
      typeset();
    }
    app.innerHTML = `
    <div class="view">
      <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Glossary</div>
      <div class="page-head reveal"><div class="eyebrow">${g.length} key terms</div><h2>The <em>Glossary</em></h2>
      <p>Fast, plain-language definitions of the core concepts across every subject. Search, filter by topic, or skim to refresh — and <b>click any term to open the lesson that teaches it</b>.</p></div>
      <input class="gloss-search" id="gloss-search" placeholder="Search terms…" aria-label="Search glossary">
      <div class="lab-topics" role="group" aria-label="Filter glossary by topic">
        <button class="lab-tbtn active" data-t="all" aria-pressed="true">All topics</button>
        ${chipTopics.map(id => `<button class="lab-tbtn" data-t="${id}" aria-pressed="false">${esc(topicName(id))}</button>`).join("")}
      </div>
      <div id="gloss-list" class="gloss-grid reveal"></div>
    </div>`;
    bindGo();
    // delegated handler: the "🎛️ Visualize" chip lives inside the card's lesson-link, so intercept its
    // clicks (and keyboard) on the stable container, cancel the link nav, and jump to the Lab instead.
    // Delegation survives render()'s innerHTML rebuilds on search/filter.
    const glist = document.getElementById("gloss-list");
    function vizJump(ev) { const v = ev.target.closest("[data-viz-go]"); if (!v) return; ev.preventDefault(); ev.stopPropagation(); location.hash = v.dataset.vizGo; }
    glist.addEventListener("click", vizJump);
    glist.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") vizJump(e); });
    const gs = document.getElementById("gloss-search");
    gs.addEventListener("input", e => render(e.target.value));
    Array.prototype.slice.call(document.querySelectorAll(".lab-tbtn")).forEach(b => b.addEventListener("click", () => {
      topicF = b.dataset.t;
      document.querySelectorAll(".lab-tbtn").forEach(x => { const on = x === b; x.classList.toggle("active", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      render(gs.value);
    }));
    if (preTerm) gs.value = preTerm;        // ⌘K → a glossary term lands pre-filtered to its definition
    render(preTerm || "");
  }

  // ---------- library (all references) ----------
  function viewLibrary() {
    const refs = window.REFERENCES || {};
    const order = C().map(c => c.id).concat(["general"]);
    const titleFor = id => id === "general" ? "General & Foundations" : (findCourse(id) || {}).title || id;
    const colorFor = id => id === "general" ? "var(--gold)" : (findCourse(id) || {}).color || "var(--gold)";
    const present = order.filter(id => refs[id] && refs[id].length);
    const total = present.reduce((n, id) => n + refs[id].length, 0);
    let topicF = "all";
    function render(q) {
      q = (q || "").trim().toLowerCase();
      const shown = present.filter(id => topicF === "all" || id === topicF);
      const html = shown.map(id => {
        const items = refs[id].filter(r => !q || (r.title + " " + r.by + " " + (r.note || "") + " " + r.kind + " " + titleFor(id)).toLowerCase().includes(q));
        if (!items.length) return "";
        return `<div class="module reveal"><div class="module-head"><span class="mnum" style="color:${colorFor(id)}">📚</span><h3>${esc(titleFor(id))}</h3></div>
          ${items.map(r => `<a class="ref-item" href="${esc(r.url)}" target="_blank" rel="noopener">
            <span class="ref-kind">${KIND[r.kind] || "🔗"}</span>
            <span class="ref-main"><span class="ref-title">${esc(r.title)}</span><span class="ref-by">${esc(r.by)}</span>${r.note ? `<span class="ref-note">${esc(r.note)}</span>` : ""}</span>
            <span class="ref-tag">${esc(r.kind)} ↗</span></a>`).join("")}
        </div>`;
      }).join("");
      document.getElementById("lib-list").innerHTML = html || emptyState("🔍", "No resources match “" + esc(q) + "”.");
    }
    app.innerHTML = `
    <div class="view">
      <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Library</div>
      <div class="page-head reveal"><div class="eyebrow">${total} curated resources</div><h2>The <em>Library</em></h2>
      <p>The best book, video, course, and paper for each topic — when you want to go deeper than the lessons. Search by title, author, or kind (e.g. “video”), or filter by topic.</p></div>
      <input class="gloss-search" id="lib-search" placeholder="Search resources…" aria-label="Search the library">
      <div class="lab-topics" role="group" aria-label="Filter library by topic">
        <button class="lab-tbtn active" data-t="all" aria-pressed="true">All topics</button>
        ${present.map(id => `<button class="lab-tbtn" data-t="${id}" aria-pressed="false">${esc(titleFor(id))}</button>`).join("")}
      </div>
      <div id="lib-list"></div>
    </div>`;
    render("");
    const ls = document.getElementById("lib-search");
    ls.addEventListener("input", e => render(e.target.value));
    Array.prototype.slice.call(document.querySelectorAll(".lab-tbtn")).forEach(b => b.addEventListener("click", () => {
      topicF = b.dataset.t;
      document.querySelectorAll(".lab-tbtn").forEach(x => { const on = x === b; x.classList.toggle("active", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      render(ls.value);
    }));
    bindGo();
  }

  function viewNotebook() {
    const idx = index();
    const notes = Object.keys(Store.raw.notes || {})
      .map(id => ({ node: idx[id], text: Store.raw.notes[id] }))
      .filter(n => n.node && n.text && String(n.text).trim())
      .sort((a, b) => a.node.order - b.node.order);
    const list = notes.length ? notes.map(n => `
      <div class="note-card reveal" style="--c:${n.node.course.color}">
        <div class="note-card-head">
          <a href="#/lesson/${n.node.course.id}/${n.node.lesson.id}" data-route class="note-card-title">${esc(n.node.lesson.title)}</a>
          <span class="note-card-course"><span class="cc-dot" style="background:${n.node.course.color}"></span>${esc(n.node.course.title)}</span>
        </div>
        <div class="note-card-body">${esc(n.text)}</div>
      </div>`).join("")
      : emptyState("📓", "No notes yet. Open any lesson and jot your thoughts in the “My notes” box — they'll gather here so your own words become your revision deck.");
    app.innerHTML = `
    <div class="view">
      <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Notebook</div>
      <div class="page-head reveal"><div class="eyebrow">Your notebook</div><h2>My <em>Notes</em></h2>
      <p>Every lesson you've annotated, gathered in one place — your own words are the best revision notes.${notes.length ? ` <strong>${notes.length}</strong> note${notes.length === 1 ? "" : "s"} across ${new Set(notes.map(n => n.node.course.id)).size} subject${new Set(notes.map(n => n.node.course.id)).size === 1 ? "" : "s"}.` : ""}</p>
      ${notes.length ? `<button class="btn ghost" id="notes-export" style="margin-top:4px">⬇ Export all as Markdown</button>` : ""}</div>
      ${list}
    </div>`;
    bindGo();
    const expBtn = document.getElementById("notes-export");
    if (expBtn) expBtn.addEventListener("click", () => {
      // group notes by course (notes are already in curriculum order) → a clean, portable Markdown revision deck
      const byCourse = [];
      notes.forEach(n => { let g = byCourse.find(x => x.id === n.node.course.id); if (!g) { g = { id: n.node.course.id, title: n.node.course.title, items: [] }; byCourse.push(g); } g.items.push(n); });
      const d = new Date(), pad = x => String(x).padStart(2, "0"), stamp = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
      let md = "# Atlas — My Notes\n\n*" + notes.length + " note" + (notes.length === 1 ? "" : "s") + " across " + byCourse.length + " subject" + (byCourse.length === 1 ? "" : "s") + " · exported " + stamp + "*\n";
      byCourse.forEach(g => { md += "\n## " + g.title + "\n"; g.items.forEach(n => { md += "\n### " + n.node.lesson.title + "\n\n" + String(n.text).trim() + "\n"; }); });
      const blob = new Blob([md], { type: "text/markdown" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "atlas-notes-" + stamp + ".md"; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast("⬇", "Notes exported", notes.length + " note" + (notes.length === 1 ? "" : "s") + " saved as Markdown.");
    });
    typeset();
  }

  // ---------- cheatsheet (printable) ----------
  function viewCheatsheet(cid) {
    const c = findCourse(cid); if (!c) return view404();
    const sections = c.modules.map(m => {
      const cards = []; m.lessons.forEach(l => (l.flashcards || []).forEach(f => cards.push(f)));
      if (!cards.length) return "";
      return `<div class="cs-section"><h3>${esc(m.title)}</h3><div class="cs-grid">${cards.map(f => `<div class="cs-card"><div class="cs-front">${f.front}</div><div class="cs-back">${f.back}</div></div>`).join("")}</div></div>`;
    }).join("");
    app.innerHTML = `
    <div class="view cheatsheet">
      <div class="crumbs no-print"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; <a href="#/course/${cid}" data-route>${esc(c.title)}</a> &nbsp;›&nbsp; Cheatsheet</div>
      <div class="cs-head">
        <div><div class="eyebrow" style="color:${c.color}">${esc(c.icon)} Quick reference</div><h2 style="font-family:var(--font-disp);font-size:34px">${esc(c.title)} — Cheatsheet</h2></div>
        <button class="btn no-print" id="print-btn">🖨️ Print / Save PDF</button>
      </div>
      ${sections || emptyState("🗂️", "No flashcards to summarize yet — add some content first.")}
    </div>`;
    bindGo(); typeset();
    const pb = document.getElementById("print-btn"); if (pb) pb.addEventListener("click", () => window.print());
  }

  // ---------- placement diagnostic ----------
  function viewPlacement(cid) {
    if (!cid) {
      app.innerHTML = `
      <div class="view">
        <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Placement</div>
        <div class="page-head reveal"><div class="eyebrow">Skip what you already know</div><h2>Placement <em>Test</em></h2>
        <p>A quick diagnostic per topic — one question per concept. Concepts you answer correctly get marked as known, so the dashboard and map can point you straight to what's actually new.</p></div>
        <div class="lab-grid reveal">${C().map(c => `<a class="lab-card" href="#/placement/${c.id}" data-route style="--c:${c.color}"><h4>${esc(c.icon)} ${esc(c.title)}</h4><p>Diagnose your level across this topic.</p><span class="lab-go">Start →</span></a>`).join("")}</div>
      </div>`;
      bindGo(); return;
    }
    const c = findCourse(cid); if (!c) return view404();
    const items = [];
    c.modules.forEach(m => m.lessons.forEach(l => { if ((l.mcq || []).length) { const q = l.mcq[Math.floor(Math.random() * l.mcq.length)]; items.push({ q, lessonId: l.id, lessonTitle: l.title, courseId: c.id, color: c.color }); } }));
    if (items.length < 3) { app.innerHTML = `<div class="view"><div class="crumbs"><a href="#/" data-route>Codex</a></div>${emptyState("🎚️", "Not enough questions in this topic for a placement test yet.")}</div>`; bindGo(); return; }
    runTest(shuffle(items), c.title + " placement", { placement: true, course: c });
  }

  // ---------- code playground ----------
  function viewPlayground() {
    app.innerHTML = `
    <div class="view">
      <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Playground</div>
      <div class="page-head reveal"><div class="eyebrow">Run code in your browser</div><h2>Code <em>Playground</em></h2>
      <p>Implement the ideas for real. Python runs via Pyodide (the first run downloads it — needs internet); JavaScript runs instantly. Pick an example or write your own.</p></div>
      <div class="reveal" id="pg-host"></div>
    </div>`;
    bindGo();
    if (window.Playground) { window.Playground.mount(document.getElementById("pg-host"), { lang: "python" }); Store.unlock("coder"); flushAchievements(); }
    else document.getElementById("pg-host").innerHTML = emptyState("💻", "Playground failed to load.");
  }
  function codeKey(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return "c" + (h >>> 0).toString(36); }
  function hydrateCode(root) {
    if (!window.Playground) return;
    (root || app).querySelectorAll("[data-code]").forEach(node => {
      if (node.dataset.codeDone) return; node.dataset.codeDone = "1";
      const lang = node.getAttribute("data-code") || "python", expected = node.getAttribute("data-expected"), code = node.textContent.trim();
      const host = document.createElement("div"); node.textContent = ""; node.appendChild(host);
      const key = expected != null ? codeKey(lang + "|" + expected + "|" + code) : null;   // stable per-exercise id (solved-once)
      const onSolve = key ? () => { const r = Store.recordCodeSolved(key); if (r.first) { toast("🧪", "+15 XP", "Exercise solved — output matches!"); flushAchievements(); renderChrome(); } } : null;
      window.Playground.mount(host, { lang, code, expected: expected, onSolve: onSolve });
    });
  }

  // ---------- knowledge map (dependency graph, colored by mastery) ----------
  function directPrereqs(lid) {
    const idx = index(), node = idx[lid]; if (!node) return [];
    const res = new Set(explicitPrereqs(lid));
    const flat = flatLessons(node.course), pos = flat.findIndex(l => l.id === lid);
    if (pos > 0) res.add(flat[pos - 1].id);
    return [...res].filter(id => idx[id]);
  }
  function viewMap() {
    const courses = C();
    const N = courses.length || 1;
    const topicLessons = courses.map(c => { const ls = []; c.modules.forEach(m => m.lessons.forEach(l => ls.push(l))); return ls; });
    const maxN = Math.max(1, ...topicLessons.map(a => a.length));
    const R0 = 92, DR = 27, RAD = Math.PI / 180;
    const Rmax = R0 + (maxN - 1) * DR + 40;
    const size = 2 * (Rmax + 84), cx = size / 2, cy = size / 2;
    const baseAng = ti => (-90 + ti * (360 / N)) * RAD;     // start at top, clockwise
    const sectorHalf = (360 / N / 2 - 1.5) * RAD;
    const pos = {}, nodes = [];
    courses.forEach((c, ti) => {
      topicLessons[ti].forEach((l, j) => {
        const r = R0 + j * DR, ang = baseAng(ti) + Math.sin(j * 0.5) * 8 * RAD;
        const x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang);
        pos[l.id] = { x, y }; nodes.push({ id: l.id, c, l, x, y });
      });
    });
    // faint colored sector wedges
    let sectors = "";
    courses.forEach((c, ti) => {
      const a1 = baseAng(ti) - sectorHalf, a2 = baseAng(ti) + sectorHalf, R = Rmax + 30;
      const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1), x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
      sectors += `<path class="map-sector" d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${c.color}"></path>`;
    });
    // concentric guide rings
    let rings = "";
    for (let k = 1; k <= maxN; k += 4) rings += `<circle class="map-ring" cx="${cx}" cy="${cy}" r="${R0 + k * DR}"></circle>`;
    // edges (curve control pulled toward centre → spokes stay straight, cross-links arc through the hub)
    let edges = "";
    nodes.forEach(n => directPrereqs(n.id).forEach(pid => {
      const a = pos[pid], b = pos[n.id]; if (!a || !b) return;
      const mx = (a.x + b.x) / 2 + (cx - (a.x + b.x) / 2) * 0.3, my = (a.y + b.y) / 2 + (cy - (a.y + b.y) / 2) * 0.3;
      edges += `<path class="map-edge" data-to="${n.id}" data-from="${pid}" d="M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}"></path>`;
    }));
    // nodes (dots only; hover shows the caption)
    let circles = "", readyCount = 0;
    nodes.forEach((n, i) => {
      const eff = Store.effectiveMastery(n.id), lvl = Store.masteryLevel(eff), done = Store.isLessonDone(n.id);
      // "ready to learn" = not done, but every prerequisite (in-course + cross-topic) is complete
      const ready = !done && learningPath(n.id).every(p => p.lesson.id === n.id || Store.isLessonDone(p.lesson.id));
      if (ready) readyCount++;
      const aria = `${esc(n.l.title)}, ${esc(n.c.title)}, ${lvl.label}${done ? ", completed" : ready ? ", ready to learn" : ""}`;
      circles += `<g class="map-node ${ready ? "ready" : ""}" data-id="${n.id}" data-go="#/lesson/${n.c.id}/${n.l.id}" role="link" tabindex="${i === 0 ? 0 : -1}" aria-label="${aria}" transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})">
        ${ready ? `<circle class="map-ready-ring" r="12" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="3 3"></circle>` : ""}
        <circle r="7" fill="${lvl.color}" stroke="${done ? "var(--ink)" : "var(--bg)"}" stroke-width="${done ? 2 : 1.5}"></circle>
        <title>${esc(n.l.title)} — ${esc(n.c.title)}${ready ? " (ready to learn)" : ""}</title>
      </g>`;
    });
    // rim labels per topic
    let labels = "";
    courses.forEach((c, ti) => {
      const r = Rmax + 50, a = baseAng(ti), lx = cx + r * Math.cos(a), ly = cy + r * Math.sin(a);
      const anchor = Math.abs(Math.cos(a)) < 0.35 ? "middle" : (Math.cos(a) > 0 ? "start" : "end");
      labels += `<text class="map-rim" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="${c.color}" text-anchor="${anchor}">${esc(c.icon)} ${esc(c.title)}</text>`;
    });
    // centre hub
    const hub = `<g><circle class="map-hub-bg" cx="${cx}" cy="${cy}" r="46"></circle>
      <text class="map-hub-t" x="${cx}" y="${cy - 2}" text-anchor="middle">ATLAS</text>
      <text class="map-hub-s" x="${cx}" y="${cy + 15}" text-anchor="middle">${nodes.length} concepts</text></g>`;
    const legend = [["Mastered", "var(--sage)"], ["Proficient", "var(--gold)"], ["Learning", "var(--violet)"], ["Seen", "var(--ink-mute)"], ["New", "var(--line)"]]
      .map(([t, c]) => `<span class="map-leg"><span class="map-dot" style="background:${c}"></span>${t}</span>`).join("")
      + `<span class="map-leg"><span class="map-dot map-dot-ready"></span>Ready to learn${readyCount ? " (" + readyCount + ")" : ""}</span>`;
    app.innerHTML = `
    <div class="view" style="max-width:none">
      <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Knowledge Map</div>
      <div class="page-head reveal"><div class="eyebrow">${nodes.length} concepts · ${C().length} paths radiating outward</div><h2>Knowledge <em>Constellation</em></h2>
      <p>Each subject branches out from the core — foundations near the centre, mastery toward the rim. Hover (or focus) a star to trace what it depends on; click or press Enter to open it. <span class="map-kbd-hint">Keyboard: Tab into the map, then arrow keys to move between concepts.</span></p></div>
      <div class="map-legend reveal">${legend}<span class="map-caption" id="map-caption">Hover or focus a concept…</span></div>
      <div class="map-scroll reveal" id="map-scroll"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="map-svg" role="application" aria-label="Knowledge constellation of ${nodes.length} concepts. Tab to enter, then use arrow keys to move between concepts and Enter to open one.">${sectors}${rings}${edges}${hub}${circles}${labels}</svg></div>
    </div>`;
    bindGo();
    const sc = document.getElementById("map-scroll");
    setTimeout(() => { sc.scrollLeft = (size - sc.clientWidth) / 2; sc.scrollTop = (size - sc.clientHeight) / 2; }, 0);
    const svg = app.querySelector(".map-svg"), cap = document.getElementById("map-caption");
    // one-time constellation reveal (staged via CSS); class added before paint (no flash), removed after so hover/dim resume
    if (svg && !reducedMotion()) { svg.classList.add("drawing"); setTimeout(() => svg.classList.remove("drawing"), 1000); }
    const mapNodes = [...svg.querySelectorAll(".map-node")];
    function highlight(g) {
      const id = g.dataset.id, node = index()[id]; svg.classList.add("dim");
      if (node) { const eff = Store.effectiveMastery(id), lv = Store.masteryLevel(eff); cap.innerHTML = `<b style="color:${node.course.color}">${esc(node.course.title)}</b> · ${esc(node.lesson.title)} · <span style="color:${lv.color}">${lv.label}</span>`; }
      const lit = new Set([id]); let frontier = [id];
      while (frontier.length) { const cur = frontier.pop(); directPrereqs(cur).forEach(p => { if (!lit.has(p)) { lit.add(p); frontier.push(p); } }); }
      svg.querySelectorAll(".map-node").forEach(n => n.classList.toggle("lit", lit.has(n.dataset.id)));
      svg.querySelectorAll(".map-edge").forEach(e => e.classList.toggle("lit", lit.has(e.dataset.to) && lit.has(e.dataset.from)));
    }
    function clearHL() { svg.classList.remove("dim"); cap.textContent = "Hover or focus a concept…"; svg.querySelectorAll(".lit").forEach(x => x.classList.remove("lit")); }
    // roving tabindex: Tab enters the map once; arrow keys move; Enter/Space opens
    let rov = 0;
    function rove(to) {
      to = Math.max(0, Math.min(mapNodes.length - 1, to));
      if (mapNodes[rov]) mapNodes[rov].setAttribute("tabindex", "-1");
      rov = to; const g = mapNodes[to];
      g.setAttribute("tabindex", "0"); g.focus();
      try { g.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (e) {}
    }
    mapNodes.forEach((g, i) => {
      g.addEventListener("mouseenter", () => highlight(g));
      g.addEventListener("mouseleave", clearHL);
      g.addEventListener("focus", () => { rov = i; g.classList.add("kbfocus"); highlight(g); });
      g.addEventListener("blur", () => { g.classList.remove("kbfocus"); clearHL(); });
      g.addEventListener("keydown", e => {
        const k = e.key;
        if (k === "Enter" || k === " ") { e.preventDefault(); location.hash = g.dataset.go; }
        else if (k === "ArrowRight" || k === "ArrowDown") { e.preventDefault(); rove(i + 1); }
        else if (k === "ArrowLeft" || k === "ArrowUp") { e.preventDefault(); rove(i - 1); }
        else if (k === "Home") { e.preventDefault(); rove(0); }
        else if (k === "End") { e.preventDefault(); rove(mapNodes.length - 1); }
      });
    });
  }

  // ---------- achievements ----------
  // live (current, target) progress toward each threshold-based achievement — shared by the
  // achievements page and the dashboard "closest achievement" nudge.
  function achProgressMap() {
    const R = Store.raw;
    let mastered = 0; C().forEach(c => c.modules.forEach(m => m.lessons.forEach(l => { if (Store.effectiveMastery(l.id) >= 0.8) mastered++; })));
    const lessonsDone = Object.keys(R.lessons || {}).length, hw = Object.keys(R.hwRevealed || {}).length;
    return {
      "streak3": [R.streak, 3], "streak7": [R.streak, 7], "streak30": [R.streak, 30], "streak100": [R.streak, 100],
      "cards25": [R.cardsReviewed, 25], "century": [R.cardsReviewed, 100], "cards-500": [R.cardsReviewed, 500],
      "mcq-100": [R.mcq.correct, 100], "mcq-500": [R.mcq.correct, 500], "crack-shot": [R.mcq.correct, 1000], "marksman": [R.mcq.correct, 2000], "mcq-5000": [R.mcq.correct, 5000],
      "ten-lessons": [lessonsDone, 10], "half-century": [lessonsDone, 50], "lessons-100": [lessonsDone, 100],
      "streak-365": [R.streak, 365], "summit": [mastered, 100], "luminary": [R.xp, 100000],
      "erudite": [R.xp, 5000], "homework-hero": [hw, 25], "test-veteran": [(R.tests || []).length, 10],
      "curator": [Object.keys(R.bookmarks || {}).length, 5], "annotator": [Object.keys(R.notes || {}).length, 5],
      "flawless-five": [R.perfectQuizzes || 0, 5], "redeemer": [R.missedFixed || 0, 25],
      "deep-diver": [mastered, 10], "loremaster": [mastered, 25], "savant": [mastered, 50],
      "habit": [Object.keys(R.activity || {}).length, 14], "sage": [R.xp, 25000],
      "viz-voyager": [Object.keys(R.vizSeen || {}).length, 15],
      "viz-complete": [Object.keys(R.vizSeen || {}).length, (window.VIZ_CATALOG || []).length || 89],
      "code-adept": [Object.keys(R.solvedCode || {}).length, 10],
      "deep-work": [R.focusSessions || 0, 5],
      "deep-reader": [Object.keys(R.deepDivesSeen || {}).length, 25],
      "deep-voyager": [Object.keys(R.deepDivesSeen || {}).length, 75]
    };
  }
  // the locked, in-progress achievement closest to unlocking (for the dashboard nudge)
  function nearestAchievement() {
    const have = Store.raw.achievements, PROG = achProgressMap();
    let best = null;
    Store.ACHIEVEMENTS.forEach(a => {
      if (have[a.id]) return; const p = PROG[a.id]; if (!p || p[1] <= 0) return;
      const cur = Math.max(0, Math.min(p[0], p[1])), frac = cur / p[1];
      if (cur <= 0 || frac >= 1) return;       // not started yet, or already met (about to unlock)
      if (!best || frac > best.frac) best = { a: a, cur: cur, target: p[1], frac: frac };
    });
    return best;
  }
  // achievements grouped into themed categories (keeps the 40+ Hall scannable)
  const ACH_CATEGORIES = [
    { label: "Lessons & Courses", ids: ["first-step", "ten-lessons", "half-century", "lessons-100", "topic-clear", "module-master", "all-topics", "atlas-complete"] },
    { label: "Quizzes & Tests", ids: ["perfect", "flawless-five", "mcq-100", "mcq-500", "crack-shot", "marksman", "mcq-5000", "exam-ace", "exam-master", "test-taker", "test-veteran", "redeemer", "self-examiner", "quick-ace"] },
    { label: "Consistency & Streaks", ids: ["streak3", "streak7", "streak30", "streak100", "streak-365", "daily-ritual", "habit"] },
    { label: "Flashcards & Recall", ids: ["cards25", "century", "cards-500", "recaller", "total-recall"] },
    { label: "Mastery", ids: ["mastered-one", "deep-diver", "loremaster", "savant", "summit", "well-rounded"] },
    { label: "Levels & XP", ids: ["scholar", "polymath", "erudite", "sage", "luminary"] },
    { label: "Exploration & Practice", ids: ["curious", "visualizer", "viz-voyager", "viz-50", "viz-complete", "pathfinder", "calibrated", "coder", "code-solver", "code-adept", "code-master", "curator", "annotator", "deep-thinker", "deep-reader", "deep-voyager", "deep-work", "homework-hero"] }
  ];
  function viewAchievements() {
    const have = Store.raw.achievements;
    const PROG = achProgressMap();
    const byId = {}; Store.ACHIEVEMENTS.forEach(a => byId[a.id] = a);
    function card(a) {
      const unlocked = !!have[a.id], p = unlocked ? null : PROG[a.id];
      let bar = "", near = "";
      if (p && p[1] > 0) {
        const cur = Math.max(0, Math.min(p[0], p[1])), frac = cur / p[1];
        if (cur > 0) near = frac >= 0.8 ? " near" : "";
        bar = `<div class="a-prog"><div class="a-prog-bar"><div class="a-prog-fill" style="width:${Math.round(frac * 100)}%"></div></div><span class="a-prog-txt">${cur} / ${p[1]}</span></div>`;
      }
      return `<div class="ach ${unlocked ? "unlocked" : ""}${near}">
        <div class="a-ico">${a.icon}</div>
        <div class="a-body"><div class="a-t">${a.name}</div><div class="a-d">${a.desc}</div>${bar}</div>
      </div>`;
    }
    const placed = new Set();
    function section(label, items) {
      if (!items.length) return "";
      items.forEach(a => placed.add(a.id));
      const gc = items.filter(a => have[a.id]).length;
      return `<div class="ach-cat reveal"><div class="ach-cat-head"><h3>${label}</h3><span class="ach-cat-count">${gc} / ${items.length}</span></div><div class="ach-grid">${items.map(card).join("")}</div></div>`;
    }
    let sections = ACH_CATEGORIES.map(c => section(c.label, c.ids.map(id => byId[id]).filter(Boolean))).join("");
    const orphans = Store.ACHIEVEMENTS.filter(a => !placed.has(a.id));   // any uncategorized achievement still shows
    if (orphans.length) sections += section("More", orphans);
    const total = Store.ACHIEVEMENTS.length;
    const got = Store.ACHIEVEMENTS.filter(a => have[a.id]).length;
    const pct = Math.round(got / total * 100);
    app.innerHTML = `
    <div class="view">
      <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Achievements</div>
      <div class="page-head reveal"><div class="eyebrow">${got} of ${total} unlocked · ${pct}%</div><h2>Hall of <em>Achievements</em></h2></div>
      <div class="ach-progress reveal"><div class="ach-progress-fill" style="width:${pct}%"></div></div>
      ${sections}
    </div>`;
    bindGo();
    sweepBars(app);   // sweep the collection bar + each achievement's progress bar from empty on landing
  }

  // ---------- stats ----------
  function viewStats() {
    const st = Store.stats();
    const lv = Store.levelInfo();
    const segDefs = [["mastered", "Mastered", "var(--sage)"], ["proficient", "Proficient", "var(--gold)"], ["learning", "Learning", "var(--violet)"], ["seen", "Seen", "var(--ink-mute)"], ["unseen", "New", "var(--line)"]];
    const perCourse = C().map(c => {
      const p = Store.courseProgress(c.id), mm = Math.round(Store.topicMastery(c.id) * 100);
      const d = { mastered: 0, proficient: 0, learning: 0, seen: 0, unseen: 0 };
      flatLessons(c).forEach(l => d[Store.masteryLevel(Store.effectiveMastery(l.id)).key]++);
      const segs = segDefs.filter(s => d[s[0]] > 0).map(s => `<span class="co-seg" style="flex:${d[s[0]]};background:${s[2]}" title="${d[s[0]]} ${s[1]}"></span>`).join("") || `<span class="co-seg" style="flex:1;background:var(--line)"></span>`;
      return `<div style="margin-bottom:18px">
        <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px"><span style="font-family:var(--font-disp)">${esc(c.icon)} ${esc(c.title)}</span><span style="color:var(--ink-mute)">${p.done}/${p.total} done · ${mm}% mastery</span></div>
        <div class="co-bar" role="img" aria-label="${esc(c.title)} mastery: ${segDefs.filter(s => d[s[0]] > 0).map(s => d[s[0]] + " " + s[1]).join(", ")}">${segs}</div>
      </div>`;
    }).join("");
    // mastery distribution
    const dist = { mastered: 0, proficient: 0, learning: 0, seen: 0, unseen: 0 };
    C().forEach(c => c.modules.forEach(m => m.lessons.forEach(l => { dist[Store.masteryLevel(Store.effectiveMastery(l.id)).key]++; })));
    const distRow = [["mastered", "var(--sage)"], ["proficient", "var(--gold)"], ["learning", "var(--violet)"], ["seen", "var(--ink-mute)"], ["unseen", "var(--line)"]]
      .map(([k, col]) => `<div class="dist-cell"><div class="dist-num" style="color:${col}">${dist[k]}</div><div class="dist-lbl">${k}</div></div>`).join("");
    // lifetime activity — surfaces the engagement state the loop tracks (mistakes deck, perfect quizzes, notes, etc.)
    const R = Store.raw;
    const achGot = Store.ACHIEVEMENTS.filter(a => R.achievements[a.id]).length, achTot = Store.ACHIEVEMENTS.length;
    const tile = (label, val, color, go, nocount) => `<div class="act-tile${go ? " act-link" : ""}"${go ? ` data-go="${go}"` : ""}><div class="act-num"${nocount ? " data-nocount" : ""} style="color:${color}">${val}</div><div class="act-lbl">${label}</div></div>`;
    const actGrid = [
      tile("Questions answered", R.mcq.total, "var(--gold)"),
      tile("Correct answers", R.mcq.correct, "var(--sage)"),
      tile("Perfect quizzes", R.perfectQuizzes || 0, "var(--gold)"),
      tile("Mistakes redeemed", R.missedFixed || 0, "var(--sage)"),
      tile("Still to redeem", Store.missedCount(), "var(--rust)", Store.missedCount() ? "#/mistakes" : ""),
      tile("Flashcards reviewed", R.cardsReviewed, "var(--violet)"),
      tile("Homework solved", Object.keys(R.hwRevealed || {}).length, "var(--gold)"),
      tile("Tests taken", (R.tests || []).length, "var(--violet)"),
      tile("Notes written", Object.keys(R.notes || {}).length, "var(--sage)", Object.keys(R.notes || {}).length ? "#/notes" : ""),
      tile("Bookmarks", Store.bookmarkIds().length, "var(--gold)"),
      tile("Deeper dives explored", Object.keys(R.deepDivesSeen || {}).length, "var(--violet)"),
      tile("Achievements", achGot + "/" + achTot, "var(--gold)", "#/achievements"),
      tile("Day streak", R.streak, "var(--rust)", "", true)   // streak shows its true value at once (no 0-flash count-up) — it's a status, not a score
    ].join("");

    // recent test performance — the tests array stores scores; surface them as a trend (improvement = motivation)
    const tests = R.tests || [];
    const tpcts = tests.map(t => t.total ? Math.round(t.correct / t.total * 100) : 0);
    const avgPct = tpcts.length ? Math.round(tpcts.reduce((a, b) => a + b, 0) / tpcts.length) : 0;
    const bestPct = tpcts.length ? Math.max.apply(null, tpcts) : 0;
    const testHist = tests.length ? `
      <div class="page-head reveal" style="margin:24px 0 14px"><h2 style="font-size:24px">Recent tests</h2></div>
      <div class="reveal" style="max-width:700px">
        <div style="display:flex;gap:18px;margin-bottom:14px;color:var(--ink-mute);font-size:14px">
          <span>Average <b style="color:var(--ink)">${avgPct}%</b></span>
          <span>Best <b style="color:var(--sage)">${bestPct}%</b></span>
          <span>${tests.length}${tests.length === 25 ? " (last 25)" : ""} recorded</span>
        </div>
        ${tests.slice(0, 10).map(t => { const pct = t.total ? Math.round(t.correct / t.total * 100) : 0; const col = pct >= 90 ? "var(--sage)" : pct >= 70 ? "var(--gold)" : "var(--rust)";
          return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:9px">
            <div style="flex:1;min-width:0"><div style="font-size:13px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.label || "Test")}</div>
              <div class="mastery-bar" style="margin-top:5px"><div class="mastery-fill" style="width:${pct}%;background:${col}"></div></div></div>
            <div style="font-family:var(--font-mono);font-size:13px;color:${col};min-width:84px;text-align:right">${t.correct}/${t.total} · ${pct}%</div>
          </div>`; }).join("")}
      </div>` : "";

    app.innerHTML = `
    <div class="view">
      <div class="crumbs"><a href="#/" data-route>Codex</a> &nbsp;›&nbsp; Progress</div>
      <div class="page-head reveal"><div class="eyebrow">${lv.name} · Level ${lv.level}</div><h2>Your <em>Progress</em></h2></div>
      <div class="stat-strip reveal">
        <div class="stat" style="--c:var(--gold)"><div class="v">${lv.xp.toLocaleString()}</div><div class="k">Total XP</div></div>
        <div class="stat" style="--c:var(--sage)"><div class="v">${st.lessonsDone}/${st.totalLessons}</div><div class="k">Lessons</div></div>
        <div class="stat" style="--c:var(--rust)"><div class="v">${st.cardsReviewed}</div><div class="k">Cards reviewed</div></div>
        <div class="stat" style="--c:var(--violet)"><div class="v"${st.accuracyKnown ? "" : " data-nocount"}>${st.accuracyKnown ? st.accuracy + "%" : "—"}</div><div class="k">Quiz accuracy</div></div>
      </div>

      <div class="page-head reveal" style="margin:24px 0 14px"><h2 style="font-size:24px">Personal bests</h2></div>
      <div class="bests reveal">${(() => { const pb = Store.personalBests(); const atPeak = pb.longestStreak > 0 && pb.longestStreak === st.streak;
        return [
          ["🔥", pb.longestStreak, "Longest streak" + (atPeak ? " · at your peak!" : "")],
          ["⚡", pb.bestDayXp, "Best day (XP)"],
          ["🎯", pb.testsRecorded ? pb.bestTestPct + "%" : "—", "Best test score"],
          ["📅", pb.daysStudied, "Days studied"]
        ].map(([ico, num, lbl]) => `<div class="best"><span class="best-ico">${ico}</span><div class="best-num">${num}</div><div class="best-lbl">${lbl}</div></div>`).join("");
      })()}</div>

      <div class="page-head reveal" style="margin:24px 0 14px"><h2 style="font-size:24px">Activity</h2></div>
      <div class="act-grid reveal">${actGrid}</div>
      ${testHist}

      <div class="page-head reveal" style="margin:24px 0 14px"><h2 style="font-size:24px">Concept mastery</h2></div>
      <div class="dist-strip reveal">${distRow}</div>

      <div class="page-head reveal" style="margin:24px 0 14px"><h2 style="font-size:24px">Study activity</h2></div>
      <div class="reveal" id="heatmap"></div>

      <div class="page-head reveal" style="margin:24px 0 16px"><h2 style="font-size:24px">By topic</h2></div>
      <div class="reveal" style="max-width:700px">${perCourse}</div>

      <div class="page-head reveal" style="margin:24px 0 14px"><h2 style="font-size:24px">Ranks</h2></div>
      <div class="ranks reveal">${Store.LEVELS.map((L, i) => {
        const reached = lv.level >= i + 1, current = lv.level === i + 1;
        return `<div class="rank-row ${reached ? "reached" : ""} ${current ? "current" : ""}">
          <div class="rank-num">${i + 1}</div>
          <div class="rank-main"><span class="rank-name">${esc(L.name)}</span><span class="rank-xp">${L.t.toLocaleString()} XP</span></div>
          <div class="rank-state">${current ? "★ you are here" : reached ? "✓" : "🔒"}</div>
        </div>`;
      }).join("")}</div>

      <div class="page-head reveal" style="margin:24px 0 14px"><h2 style="font-size:24px">Settings</h2></div>
      <div class="settings-box reveal">
        <label class="viz-slider" style="gap:10px">Daily XP goal
          <input id="goal-input" type="number" min="10" step="10" value="${Store.raw.goalXp}" style="width:90px">
          <button class="btn" id="goal-save">Save</button>
        </label>
        <label class="viz-slider" style="gap:10px;margin-top:14px">New flashcards / review session
          <input id="newcap-input" type="number" min="5" max="100" step="5" value="${Store.raw.newPerSession || 30}" style="width:90px">
          <button class="btn" id="newcap-save">Save</button>
        </label>
        <div class="viz-slider" style="gap:10px;margin-top:14px"><span class="viz-slab">Reading text size</span>
          <button class="btn ghost rs-btn" data-rs="0.9">A−</button>
          <button class="btn ghost rs-btn" data-rs="1">A</button>
          <button class="btn ghost rs-btn" data-rs="1.15">A+</button>
        </div>
        <div class="viz-slider" style="gap:10px;margin-top:14px"><span class="viz-slab">Motion</span>
          <button class="btn ghost" id="rm-btn" aria-pressed="${reduceMotionOn()}">${reduceMotionOn() ? "🌿 Reduced motion: on" : "✦ Reduce motion"}</button>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
          <button class="btn ghost" id="export-btn">⬇ Export progress</button>
          <button class="btn ghost" id="import-btn">⬆ Import progress</button>
          <button class="btn ghost" id="reset-btn" style="border-color:var(--rust);color:var(--rust)">Reset all</button>
        </div>
        <input type="file" id="import-file" accept="application/json" style="display:none">
      </div>
    </div>`;
    bindGo();
    app.querySelectorAll(".rs-btn").forEach(b => b.addEventListener("click", () => { localStorage.setItem("atlas.textScale", b.dataset.rs); applyTextScale(); toast("🔠", "Text size set", "Reading text scaled to " + Math.round(b.dataset.rs * 100) + "%"); }));
    const rmBtn = document.getElementById("rm-btn");
    if (rmBtn) rmBtn.addEventListener("click", () => { const on = toggleReduceMotion(); rmBtn.setAttribute("aria-pressed", on); rmBtn.innerHTML = on ? "🌿 Reduced motion: on" : "✦ Reduce motion"; toast(on ? "🌿" : "✦", "Reduced motion " + (on ? "on" : "off"), on ? "Animations and transitions are now minimized." : "Animations restored."); });
    document.getElementById("heatmap").appendChild(buildHeatmap());
    // "look how far I've come" — cascade-count the progress numbers on load (earned moment; no-op under reduced-motion)
    app.querySelectorAll(".stat-strip .v:not([data-nocount]), .act-num:not([data-nocount]), .dist-num").forEach((el, i) => countUp(el, Math.min(i * 32, 430)));   // the streak tile is data-nocount: a status shows at once, never flashing 0
    sweepBars(app);                                            // animate the recent-test score bars filling in
    document.getElementById("goal-save").addEventListener("click", () => { Store.setGoal(parseInt(document.getElementById("goal-input").value, 10)); toast("🎯", "Goal updated", "Daily target set to " + Store.raw.goalXp + " XP"); });
    document.getElementById("newcap-save").addEventListener("click", () => { Store.setNewPerSession(parseInt(document.getElementById("newcap-input").value, 10)); document.getElementById("newcap-input").value = Store.raw.newPerSession; toast("🃏", "Review pace updated", "Up to " + Store.raw.newPerSession + " new cards per session"); });
    document.getElementById("export-btn").addEventListener("click", () => {
      const blob = new Blob([Store.exportData()], { type: "application/json" }); const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "atlas-progress.json"; a.click();
    });
    document.getElementById("import-btn").addEventListener("click", () => document.getElementById("import-file").click());
    document.getElementById("import-file").addEventListener("change", e => {
      const f = e.target.files[0]; if (!f) return; const r = new FileReader();
      r.onload = () => { if (Store.importData(r.result)) { toast("✅", "Imported", "Progress restored."); renderChrome(); router(); } else alert("That file isn't a valid Atlas export."); };
      r.readAsText(f);
    });
    document.getElementById("reset-btn").addEventListener("click", () => {
      if (confirm("Reset ALL progress, XP, streaks and flashcard schedules? This cannot be undone.")) { Store.resetAll(); renderChrome(); router(); }
    });
  }

  // GitHub-style activity heatmap (last ~17 weeks)
  function buildHeatmap() {
    const wrap = document.createElement("div"); wrap.className = "heatmap";
    const days = 119, today = new Date(); today.setHours(0, 0, 0, 0);
    const act = Store.raw.activity || {};
    let max = 1; Object.values(act).forEach(v => { if (v > max) max = v; });
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      const v = act[key] || 0, lvl = v === 0 ? 0 : v < max * 0.25 ? 1 : v < max * 0.5 ? 2 : v < max * 0.8 ? 3 : 4;
      const cell = document.createElement("div"); cell.className = "hm-cell hm-" + lvl; cell.title = key + ": " + v + " XP";
      wrap.appendChild(cell);
    }
    return wrap;
  }

  function view404() {
    app.innerHTML = `<div class="view"><div class="empty"><div class="e-ico">🧭</div><h2 style="font-family:var(--font-disp)">Lost in the stacks</h2><p>That page doesn't exist. <a href="#/" data-route style="color:var(--gold)">Return to your codex</a>.</p></div></div>`;
    bindGo();
  }

  function emptyState(icon, msg) { return `<div class="empty"><div class="e-ico">${icon}</div><p>${esc(msg)}</p></div>`; }

  // ---------- navigation helpers ----------
  function bindGo() {
    app.querySelectorAll("[data-go]").forEach(el => {
      const nav = () => { location.hash = el.dataset.go; };
      el.addEventListener("click", nav);
      // keyboard + screen-reader access for clickable cards (divs) that aren't native links/buttons
      const tag = el.tagName.toLowerCase();
      if (tag !== "a" && tag !== "button" && !el.closest("svg")) {
        if (!el.hasAttribute("role")) el.setAttribute("role", "link");
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
        el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nav(); } });
      }
    });
  }

  // ---------- focus timer: optional time-boxed study sessions (for studying alongside a full-time job) ----------
  let _ft = null, _ftTitleTO = 0;
  function ftAudioCtx() {   // created on the start gesture so the completion chime is allowed to play later
    try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; const c = new AC(); if (c.state === "suspended") c.resume(); return c; } catch (e) { return null; }
  }
  function ftChime(ctx) {
    if (!ctx) return;
    try {
      [880, 1175, 1568].forEach((f, i) => {   // a gentle three-note rise
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = f;
        const t0 = ctx.currentTime + i * 0.18; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.16, t0 + 0.03); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
        o.start(t0); o.stop(t0 + 0.42);
      });
    } catch (e) {}
  }
  function ftFmt(s) { const m = Math.floor(s / 60); return m + ":" + String(s % 60).padStart(2, "0"); }
  function ftFlashTitle(msg) { const orig = document.title; document.title = msg; clearTimeout(_ftTitleTO); _ftTitleTO = setTimeout(() => { if (document.title === msg) document.title = orig; }, 6000); }
  function stopFocusTimer(done) {
    if (!_ft) return;
    clearInterval(_ft.id); if (_ft.pill) _ft.pill.remove();
    const ctx = _ft.audio, mins = _ft.mins; _ft = null;
    if (done) { ftChime(ctx); toast("⏳", "Focus session complete!", mins + " minutes of focused study — nice block. Take a breather, then keep going."); ftFlashTitle("✓ Focus complete"); Store.addFocusSession(); flushAchievements(); }
    if (ctx) setTimeout(() => { try { ctx.close(); } catch (e) {} }, done ? 1200 : 0);
  }
  function startFocusTimer(minutes) {
    if (_ft) stopFocusTimer(false);                       // only one timer at a time
    const pill = document.createElement("div"); pill.className = "focus-pill"; pill.setAttribute("role", "timer"); pill.setAttribute("aria-label", "Focus timer");
    pill.innerHTML = `<span class="ft-ico" aria-hidden="true">⏳</span><span class="ft-time">${ftFmt(minutes * 60)}</span>`
      + `<button class="ft-btn" data-ft="pause" aria-label="Pause or resume the focus timer">⏸</button>`
      + `<button class="ft-btn" data-ft="stop" aria-label="Stop the focus timer">✕</button>`;
    document.body.appendChild(pill);
    _ft = { remaining: minutes * 60, mins: minutes, paused: false, id: 0, pill, audio: ftAudioCtx() };
    const timeEl = pill.querySelector(".ft-time"), pauseBtn = pill.querySelector('[data-ft="pause"]');
    pauseBtn.addEventListener("click", () => { _ft.paused = !_ft.paused; pauseBtn.textContent = _ft.paused ? "▶" : "⏸"; pill.classList.toggle("paused", _ft.paused); });
    pill.querySelector('[data-ft="stop"]').addEventListener("click", () => stopFocusTimer(false));
    _ft.id = setInterval(() => {
      if (!_ft || _ft.paused) return;
      _ft.remaining--;
      if (_ft.remaining <= 0) { stopFocusTimer(true); return; }
      timeEl.textContent = ftFmt(_ft.remaining);
    }, 1000);
    toast("⏳", "Focus timer started", minutes + " minutes of focused study — I'll chime when you're done. Pause or stop it anytime in the corner.");
  }

  // ---------- command palette (⌘K) ----------
  let _searchIdx = null;   // built once and cached — the index is pure over static course/viz/glossary/reference data, but the ⌘K palette used to rebuild it (incl. a regex over all 377 deep-dives' content) on every open
  function searchIndex() {
    if (_searchIdx) return _searchIdx;
    const out = [];
    C().forEach(c => {
      out.push({ t: c.title, sub: "Topic", hash: "#/course/" + c.id, icon: c.icon });
      c.modules.forEach(m => m.lessons.forEach(l => {
        out.push({ t: l.title, sub: c.title, hash: "#/lesson/" + c.id + "/" + l.id, icon: "📖" });
        (l.examples || []).forEach(e => out.push({ t: e.title, sub: "Example · " + l.title, hash: "#/lesson/" + c.id + "/" + l.id + "/examples", icon: "📐" }));
        // make the deep-dives searchable too — their summary lines are a large body of content otherwise reachable only by scrolling.
        // the k-th summary (content order) == the k-th details.deep-dive in the DOM, so encode the ordinal so a result auto-opens that dive.
        (String(l.content || "").match(/<summary>[\s\S]*?<\/summary>/g) || []).forEach((s, di) => {
          const t = s.replace(/<\/?summary>/g, "").replace(/<[^>]+>/g, "").replace(/\$[^$]*\$/g, "").replace(/^Deeper dive:\s*/i, "").replace(/\s+/g, " ").trim();
          if (t) out.push({ t, sub: "Deeper dive · " + l.title, hash: "#/lesson/" + c.id + "/" + l.id + "/dd" + (di + 1), icon: "🧩" });
        });
      }));
    });
    (window.VIZ_CATALOG || []).forEach(v => out.push({ t: v.title, sub: "Visualization", hash: "#/lab/" + v.id, icon: "🎛️" }));
    [["Dashboard", "#/", "⌂"], ["Daily Mix", "#/session", "🎯"], ["Daily Review", "#/review", "⚡"], ["Spawn a Test", "#/test", "📝"], ["Knowledge Map", "#/map", "🗺️"], ["Code Playground", "#/playground", "💻"], ["Glossary", "#/glossary", "📔"], ["Library", "#/library", "📚"], ["My Notes", "#/notes", "📓"], ["Progress", "#/stats", "📊"], ["Achievements", "#/achievements", "🏆"]].forEach(([t, h, i]) => out.push({ t, sub: "Page", hash: h, icon: i }));
    (window.GLOSSARY || []).forEach(e => out.push({ t: e.term, sub: "Glossary", hash: "#/glossary/" + encodeURIComponent(e.term), icon: "📔" }));
    Object.keys(window.REFERENCES || {}).forEach(k => (window.REFERENCES[k] || []).forEach(r => out.push({ t: r.title, sub: "Reference · " + r.by, hash: r.url, ext: true, icon: "🔖" })));
    return (_searchIdx = out);
  }
  // action commands (verbs that DO something rather than navigate) — make ⌘K a true command palette
  function commandActions() {
    return [
      { t: "Toggle theme (Ink / Parchment)", sub: "Command", icon: "🎨", action: () => { const t = toggleTheme(); toast("🎨", "Theme switched", t === "ink" ? "Ink (dark)" : "Parchment (light)"); } },
      { t: "Cycle reading text size", sub: "Command", icon: "🔠", action: () => { const p = cycleTextScale(); toast("🔠", "Text size", "Reading text scaled to " + p + "%"); } },
      { t: "Toggle high-contrast mode", sub: "Command", icon: "◐", action: () => { const c = toggleContrast(); toast(c === "high" ? "◉" : "◐", "High contrast " + (c === "high" ? "on" : "off"), c === "high" ? "Boosted text & borders for legibility." : "Back to the standard palette."); } },
      { t: "Restart the welcome tour", sub: "Command", icon: "👋", action: () => showIntro(true) },
      { t: "Start a 25-minute focus timer", sub: "Command · time-boxed study", icon: "⏳", action: () => startFocusTimer(25) },
      { t: "Start a 50-minute focus timer", sub: "Command · time-boxed study", icon: "⏳", action: () => startFocusTimer(50) }
    ];
  }
  // curated items shown when the palette opens with an empty query (resume + the things you most often want)
  function paletteDefaults() {
    const out = [];
    const last = Store.raw.lastLesson;
    if (last) { const n = index()[last.split("/")[1]]; if (n) out.push({ t: "Resume: " + n.lesson.title, sub: "Continue where you left off", hash: "#/lesson/" + last, icon: "▶" }); }
    let due = 0; try { due = Store.stats().reviewDue || 0; } catch (e) {}
    out.push({ t: "Start Daily Mix", sub: "Guided 15-minute session", hash: "#/session", icon: "🎯" });
    out.push({ t: "Daily Review" + (due ? " · " + due + " due" : ""), sub: "Spaced-repetition flashcards", hash: "#/review", icon: "⚡" });
    out.push({ t: "Spawn a Test", sub: "Custom exam from the question bank", hash: "#/test", icon: "📝" });
    return out.concat(commandActions());
  }
  // full-text index of lesson bodies (built once, cached) — powers "search inside lessons"
  let _lessonText = null;
  function lessonTextIndex() {
    if (_lessonText) return _lessonText;
    _lessonText = [];
    C().forEach(c => c.modules.forEach(m => m.lessons.forEach(l => {
      const raw = String(l.content || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&apos;/g, "'").replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ").trim();
      _lessonText.push({ title: l.title, courseTitle: c.title, hash: "#/lesson/" + c.id + "/" + l.id, raw: raw, low: raw.toLowerCase() });
    })));
    return _lessonText;
  }
  function snippetHtml(raw, low, tok) {
    let at = low.indexOf(tok); if (at < 0) at = 0;
    const start = Math.max(0, at - 32), end = Math.min(raw.length, at + tok.length + 52);
    const pre = (start > 0 ? "…" : "") + raw.slice(start, at);
    const mid = raw.slice(at, at + tok.length);
    const post = raw.slice(at + tok.length, end) + (end < raw.length ? "…" : "");
    return esc(pre) + "<mark>" + esc(mid) + "</mark>" + esc(post);
  }
  let paletteEl = null;
  function openPalette() {
    if (paletteEl) return;
    const idx = searchIndex().concat(commandActions());   // commands are searchable too
    paletteEl = document.createElement("div"); paletteEl.className = "palette-scrim";
    paletteEl.innerHTML = `<div class="palette"><input class="palette-in" placeholder="Search lessons, concepts, visualizations · or run a command…"><div class="palette-list"></div><div class="palette-foot">🔎 searches inside lessons · weak/fading topics rank first · ⚡ run commands (theme, text size…) · ↑↓ navigate · ↵ open · esc close</div></div>`;
    document.body.appendChild(paletteEl);
    const inp = paletteEl.querySelector(".palette-in"), list = paletteEl.querySelector(".palette-list");
    let sel = 0, results = [];
    // typo-tolerant subsequence match: are q's chars in order within t? returns a quality score (lower=better) or -1
    function subseq(q, t) {
      let ti = 0, gaps = 0, first = -1, prev = -1;
      for (let qi = 0; qi < q.length; qi++) {
        const f = t.indexOf(q[qi], ti); if (f < 0) return -1;
        if (first < 0) first = f;
        if (prev >= 0 && f > prev + 1) gaps += f - prev - 1;
        prev = f; ti = f + 1;
      }
      return first + gaps * 0.5;
    }
    function render() {
      const q = inp.value.trim().toLowerCase();
      if (q) {
        const score = x => {
          const t = x.t.toLowerCase();
          if (t === q) return 0;
          if (t.startsWith(q)) return 1;
          if (t.indexOf(q) >= 0) return 2;
          if ((x.sub || "").toLowerCase().indexOf(q) >= 0) return 3;
          if (q.length >= 2) { const f = subseq(q, t); if (f >= 0) return 4 + Math.min(f, 40) / 100; } // fuzzy/typo tolerance
          return 9;
        };
        // within a textual tier, weak/fading lessons rank first: add up to +0.4 for mastered
        // material (a tier gap is 1.0, so relevance always wins across tiers)
        const masteryBias = x => (x.hash && x.hash.indexOf("#/lesson/") === 0) ? 0.4 * Store.effectiveMastery(x.hash.split("/").pop()) : 0;
        results = idx.map((x, i) => { const s0 = score(x); return { x, s: s0 < 9 ? s0 + masteryBias(x) : 9, i }; }).filter(o => o.s < 9).sort((a, b) => a.s - b.s || a.i - b.i).map(o => o.x).slice(0, 50);
        // full-text: surface lessons whose BODY contains every query word (skip ones already matched by title)
        if (q.length >= 3) {
          const toks = q.split(/\s+/).filter(Boolean);
          const shown = new Set(results.filter(r => r.hash && r.hash.indexOf("#/lesson/") === 0).map(r => r.hash));
          const body = [];
          lessonTextIndex().forEach(le => {
            if (shown.has(le.hash)) return;
            if (!toks.every(tk => le.low.indexOf(tk) >= 0)) return;
            body.push({ t: le.title, subHtml: esc(le.courseTitle) + " · " + snippetHtml(le.raw, le.low, toks[0]), hash: le.hash, icon: "🔎", _at: le.low.indexOf(toks[0]) });
          });
          body.sort((a, b) => a._at - b._at);
          results = results.concat(body).slice(0, 50);
        }
      } else results = paletteDefaults();
      if (sel >= results.length) sel = Math.max(0, results.length - 1);
      list.innerHTML = results.length ? results.map((r, i) => `<div class="palette-item ${i === sel ? "sel" : ""}" data-i="${i}"><span class="pi-ico">${r.icon}</span><span class="pi-main"><span class="pi-t">${esc(r.t)}</span><span class="pi-sub">${r.subHtml ? r.subHtml : esc(r.sub)}</span></span>${r.ext ? '<span class="pi-ext">↗</span>' : ""}</div>`).join("") : '<div class="palette-empty">No matches</div>';
      list.querySelectorAll(".palette-item").forEach(e => e.addEventListener("click", () => go(parseInt(e.dataset.i, 10))));
    }
    function go(i) { const r = results[i]; if (!r) return; closePalette(); if (typeof r.action === "function") r.action(); else if (r.ext) window.open(r.hash, "_blank", "noopener"); else location.hash = r.hash; }
    function scrollSel() { const e = list.querySelector(".sel"); if (e) e.scrollIntoView({ block: "nearest" }); }
    inp.addEventListener("input", () => { sel = 0; render(); });
    inp.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, results.length - 1); render(); scrollSel(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); scrollSel(); }
      else if (e.key === "Enter") { e.preventDefault(); go(sel); }
      else if (e.key === "Escape") { closePalette(); }
    });
    paletteEl.addEventListener("click", e => { if (e.target === paletteEl) closePalette(); });
    render();
    paletteEl._release = modalA11y(paletteEl, paletteEl.querySelector(".palette"), "Command palette");
  }
  function closePalette() { if (paletteEl) { if (paletteEl._release) paletteEl._release(); paletteEl.remove(); paletteEl = null; } }

  // ---------- router ----------
  // a meaningful browser-tab / history / screen-reader title per route (SPAs otherwise stay stuck on one title)
  function docTitleFor(parts) {
    const BASE = "NUS Atlas";
    if (!parts.length) return "NUS Dashboard · " + BASE;
    const p = parts[0];
    if (p === "nus") {
      if (parts[1] === "course") { const c = nusRepository() ? nusRepository().getCourse(parts[2]) : nusCourses().find(x => x.code === parts[2]); return (c ? c.code + " · " + c.title : "NUS Course") + " · " + BASE; }
      if (parts[1] === "lesson") { const repo = nusRepository(); const l = repo ? (repo.peekLesson ? repo.peekLesson(parts[2], parts[3]) : null) : (nusContent(parts[2]).modules || []).flatMap(m => m.lessons || []).find(x => x.id === parts[3]); return (l ? l.title : "NUS Lesson") + " · " + BASE; }
      const np = { courses: "NUS Courses", planner: "NUS Plan", exam: "NUS Practice", review: "NUS Review", contrast: "Concept contrast", sql: "SQL Studio", simulations: "Distributed Simulations" };
      return (np[parts[1]] || "NUS Dashboard") + " · " + BASE;
    }
    if (p === "atlas") return "General Atlas · " + BASE;
    const PAGES = { review: "Daily Review", session: "Daily Mix", test: "Spawn a Test", mistakes: "Redeem Mistakes", map: "Knowledge Map", playground: "Code Playground", library: "References", notes: "My Notes", glossary: "Glossary", achievements: "Achievements", stats: "Progress" };
    if (p === "lesson") { const f = findLesson(parts[1], parts[2]); return (f ? f.lesson.title : "Lesson") + " · " + BASE; }
    if (p === "course") { const c = findCourse(parts[1]); return (c ? c.title : "Course") + " · " + BASE; }
    if (p === "lab" && parts[1]) { const v = (window.VIZ_CATALOG || []).find(x => x.id === parts[1]); return (v ? v.title : "Visualization") + " · " + BASE; }
    if (p === "lab") return "Visualization Lab · " + BASE;
    if (p === "path") { const f = findLesson(parts[1], parts[2]); return "Learning path" + (f ? ": " + f.lesson.title : "") + " · " + BASE; }
    if (p === "cheatsheet") { const c = findCourse(parts[1]); return "Cheatsheet" + (c ? ": " + c.title : "") + " · " + BASE; }
    if (p === "placement") { const c = parts[1] && findCourse(parts[1]); return "Placement" + (c ? ": " + c.title : "") + " · " + BASE; }
    if (PAGES[p]) return PAGES[p] + " · " + BASE;
    return BASE + " · Study Studio";
  }
  function renderRoute(parts, context) {
    if (parts.length === 0) window.ATLAS_NUS_UI ? window.ATLAS_NUS_UI.renderRoute([], context) : viewDashboard();
    else if (parts[0] === "nus") window.ATLAS_NUS_UI ? window.ATLAS_NUS_UI.renderRoute(parts.slice(1), context) : viewDashboard();
    else if (parts[0] === "atlas") viewDashboard();
    else if (parts[0] === "course") viewCourse(parts[1]);
    else if (parts[0] === "lesson") viewLesson(parts[1], parts[2], parts[3]);
    else if (parts[0] === "review") viewReview();
    else if (parts[0] === "session") viewSession();
    else if (parts[0] === "test") viewTest();
    else if (parts[0] === "mistakes") viewMistakes();
    else if (parts[0] === "refresh") viewRefresh();
    else if (parts[0] === "lab") parts[1] ? viewLabItem(parts[1]) : viewLab();
    else if (parts[0] === "map") viewMap();
    else if (parts[0] === "playground") viewPlayground();
    else if (parts[0] === "library") viewLibrary();
    else if (parts[0] === "notes") viewNotebook();
    else if (parts[0] === "glossary") viewGlossary(parts[1] ? decodeURIComponent(parts[1]) : null);
    else if (parts[0] === "cheatsheet") viewCheatsheet(parts[1]);
    else if (parts[0] === "placement") viewPlacement(parts[1]);
    else if (parts[0] === "path") viewPath(parts[1], parts[2]);
    else if (parts[0] === "achievements") viewAchievements();
    else if (parts[0] === "stats") viewStats();
    else view404();
  }
  const atlasRouter = window.ATLAS_ROUTER ? window.ATLAS_ROUTER({
    location: window.location,
    beforeRoute(parts) {
      if (window.VIZUtil) window.VIZUtil.stopAll(); // kill any running animation loops
      if (window.ATLAS_NUS_UI && typeof window.ATLAS_NUS_UI.stopTransient === "function") window.ATLAS_NUS_UI.stopTransient();
      const isNusRoute = parts.length === 0 || parts[0] === "nus";
      app.classList.toggle("nus-root", isNusRoute);
      document.body.classList.toggle("atlas-nus-surface", isNusRoute);
      if (!isNusRoute || parts[1] !== "lesson") document.body.classList.remove("nus-reading-mode");
      if (!isNusRoute || parts[1] !== "slides") document.body.classList.remove("nus-slide-focus-mode");
      try { document.title = docTitleFor(parts); } catch (e) { document.title = "NUS Atlas · Study Studio"; }
      clearResumePill();
      window.scrollTo(0, 0);
    },
    renderRoute,
    afterRoute() {
      renderChrome();
      closeSidebar();
      // SPA focus management (a11y): move keyboard/screen-reader focus to the new view's heading so navigation is
      // announced and the focus point isn't stranded on the removed element. Skip while a modal owns focus.
      if (!document.querySelector(".intro-ov, .palette-scrim, .levelup-ov, .sc-ov, .nus-exam-schedule-overlay")) {
        const fh = app.querySelector(".page-head h2") || app.querySelector("h2") || app;
        if (fh !== app) fh.setAttribute("tabindex", "-1");
        try { fh.focus({ preventScroll: true }); } catch (e) { try { fh.focus(); } catch (e2) {} }
      }
      updateReadProgress(); updateToTop();
      setTimeout(updateReadProgress, 200);
    }
  }) : null;
  function router() {
    if (atlasRouter) return atlasRouter.navigate();
    return renderRoute((location.hash || "#/").slice(1).split("/").filter(Boolean));
  }

  // ---------- theme ----------
  function initTheme() {
    const saved = localStorage.getItem("atlas.theme") || "ink";
    document.documentElement.setAttribute("data-theme", saved);
    updateThemeLabel(saved);
    document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    const nx = cur === "ink" ? "parchment" : "ink";
    document.documentElement.setAttribute("data-theme", nx);
    localStorage.setItem("atlas.theme", nx);
    updateThemeLabel(nx);
    renderChrome();
    return nx;
  }
  function cycleTextScale() {
    const steps = ["0.9", "1", "1.15"];
    let cur = localStorage.getItem("atlas.textScale") || "1";
    let idx = steps.indexOf(cur); if (idx < 0) idx = 1;
    const nx = steps[(idx + 1) % steps.length];
    localStorage.setItem("atlas.textScale", nx); applyTextScale();
    return Math.round(parseFloat(nx) * 100);
  }
  function updateThemeLabel(t) {
    document.getElementById("theme-toggle").innerHTML = t === "ink" ? "☾ &nbsp;Ink theme" : "☀ &nbsp;Parchment theme";
  }
  // ---------- in-app "reduce motion" (overrides OS pref; gates JS animations via reducedMotion() + CSS via [data-reduce-motion]) ----------
  function initReduceMotion() {
    if (localStorage.getItem("atlas.reduceMotion") === "1") document.documentElement.setAttribute("data-reduce-motion", "on");
  }
  function reduceMotionOn() { return document.documentElement.getAttribute("data-reduce-motion") === "on"; }
  function toggleReduceMotion() {
    const on = !reduceMotionOn();
    if (on) { document.documentElement.setAttribute("data-reduce-motion", "on"); localStorage.setItem("atlas.reduceMotion", "1"); }
    else { document.documentElement.removeAttribute("data-reduce-motion"); localStorage.removeItem("atlas.reduceMotion"); }
    return on;
  }

  // ---------- high-contrast accessibility mode (layers on either theme) ----------
  function initContrast() {
    const saved = localStorage.getItem("atlas.contrast") === "high" ? "high" : "normal";
    document.documentElement.setAttribute("data-contrast", saved);
    updateContrastLabel(saved);
    const btn = document.getElementById("contrast-toggle");
    if (btn) btn.addEventListener("click", () => { const c = toggleContrast(); toast(c === "high" ? "◉" : "◐", "High contrast " + (c === "high" ? "on" : "off"), c === "high" ? "Boosted text & borders for legibility." : "Back to the standard palette."); });
  }
  function toggleContrast() {
    const nx = document.documentElement.getAttribute("data-contrast") === "high" ? "normal" : "high";
    document.documentElement.setAttribute("data-contrast", nx);
    localStorage.setItem("atlas.contrast", nx);
    updateContrastLabel(nx);
    return nx;
  }
  function updateContrastLabel(c) {
    const btn = document.getElementById("contrast-toggle"); if (!btn) return;
    btn.innerHTML = c === "high" ? "◉ &nbsp;High contrast: on" : "◐ &nbsp;High contrast";
    btn.setAttribute("aria-pressed", c === "high" ? "true" : "false");
  }

  // ---------- responsive sidebar ----------
  const SIDEBAR_COLLAPSED_KEY = "atlas.sidebarCollapsed";
  function isDesktopSidebar() { return window.innerWidth > 900; }
  function updateSidebarToggle() {
    const button = document.getElementById("menu-btn"); if (!button) return;
    const collapsed = document.body.classList.contains("nus-sidebar-collapsed");
    button.textContent = collapsed ? "→" : "☰";
    button.setAttribute("aria-label", collapsed ? "Show left navigation" : "Hide left navigation");
    button.title = collapsed ? "Show left navigation" : "Hide left navigation";
    button.setAttribute("aria-expanded", collapsed ? "false" : "true");
  }
  function setSidebarCollapsed(collapsed) {
    if (!isDesktopSidebar()) return;
    document.body.classList.toggle("nus-sidebar-collapsed", collapsed);
    try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0"); } catch (e) {}
    updateSidebarToggle();
  }
  function openSidebar() {
    const sb = document.getElementById("sidebar"); if (!sb || sb.classList.contains("open")) return;
    sb.classList.add("open");
    const sc = document.createElement("div"); sc.className = "scrim"; sc.id = "scrim";
    sc.addEventListener("click", closeSidebar);
    document.body.appendChild(sc);
  }
  function toggleSidebar() {
    if (isDesktopSidebar()) return setSidebarCollapsed(!document.body.classList.contains("nus-sidebar-collapsed"));
    openSidebar();
  }
  function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    const s = document.getElementById("scrim"); if (s) s.remove();
    updateSidebarToggle();
  }
  function initMobile() {
    const button = document.getElementById("menu-btn"); if (!button) return;
    button.addEventListener("click", toggleSidebar);
    const sync = () => {
      if (isDesktopSidebar()) {
        try { if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") document.body.classList.add("nus-sidebar-collapsed"); } catch (e) {}
      } else document.body.classList.remove("nus-sidebar-collapsed");
      updateSidebarToggle();
    };
    sync();
    window.addEventListener("resize", sync, { passive: true });
  }

  // ---------- keyboard shortcuts for the study loop ----------
  function studyKeys(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if (document.querySelector(".palette-scrim, .levelup-ov, .intro-ov, .sc-ov, .nus-exam-schedule-overlay")) return; // a modal owns the keys
    if (e.key === "\\") { e.preventDefault(); toggleSidebar(); return; }
    // flashcards: Space/Enter flips; once flipped, 1-4 grades
    const card = document.getElementById("card3d");
    if (card) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); card.click(); return; }
      if (card.classList.contains("flipped")) { const i = "1234".indexOf(e.key); if (i >= 0) { const gb = document.querySelectorAll(".grade-btn")[i]; if (gb) { e.preventDefault(); gb.click(); } } }
      return;
    }
    // MCQ choices (quiz / test / mastery drill): 1-4 or a-d to pick
    const choices = document.querySelectorAll(".choice:not(.locked)");
    if (choices.length) { let i = "1234".indexOf(e.key); if (i < 0) i = "abcd".indexOf(e.key.toLowerCase()); if (i >= 0 && i < choices.length) { e.preventDefault(); choices[i].click(); return; } }
    // lesson flow: [ previous · ] next — sequential reading without reaching for the footer (not mid-quiz; stays in-course)
    if ((e.key === "[" || e.key === "]") && !choices.length && (location.hash || "").indexOf("#/lesson/") === 0) {
      const parts = location.hash.slice(2).split("/"); const course = findCourse(parts[1]);
      if (course) { const flat = flatLessons(course), idx = flat.findIndex(l => l.id === parts[2]), tgt = e.key === "[" ? flat[idx - 1] : flat[idx + 1];
        if (tgt) { e.preventDefault(); location.hash = "#/lesson/" + course.id + "/" + tgt.id; } }
      return;
    }
    // Enter advances (next / submit / continue)
    if (e.key === "Enter") { const nb = document.getElementById("t-next") || document.querySelector("#md-next .btn, #next-slot .btn"); if (nb) { e.preventDefault(); nb.click(); } }
  }

  // ---------- keyboard-shortcuts help (press ?) ----------
  let shortcutsEl = null;
  function closeShortcuts() { if (shortcutsEl) { document.removeEventListener("keydown", shortcutsEl._onKey); if (shortcutsEl._release) shortcutsEl._release(); shortcutsEl.remove(); shortcutsEl = null; } }
  function showShortcuts() {
    if (shortcutsEl) return;
    const groups = [
      ["Global", [["⌘K / Ctrl K", "Search anything — concepts, pages, and inside lessons"], ["\\", "Hide/show the left navigation"], ["?", "Show this shortcuts list"], ["Esc", "Close a dialog or overlay"]]],
      ["Lessons", [["[ / ]", "Previous · next lesson in this unit"]]],
      ["Quizzes & tests", [["1–4 / A–D", "Pick an answer"], ["Enter", "Next question · submit · continue"]]],
      ["Flashcards", [["Space / Enter", "Flip the card"], ["1–4", "Grade: Again · Hard · Good · Easy"]]],
      ["Knowledge Map", [["Tab", "Enter the constellation"], ["← ↑ → ↓", "Move between concepts"], ["Enter", "Open the focused concept"]]],
      ["Interactive visualizations", [["Tab", "Focus a draggable widget (gold ring)"], ["← ↑ → ↓", "Move the first vector / point"], ["Shift + arrows", "Move the second vector"]]]
    ];
    shortcutsEl = document.createElement("div"); shortcutsEl.className = "sc-ov";
    shortcutsEl.innerHTML = `<div class="sc-card" role="dialog" aria-label="Keyboard shortcuts">
      <div class="intro-eyebrow">Quick reference</div><h2 class="sc-title">⌨ Keyboard shortcuts</h2>
      ${groups.map(([t, rows]) => `<div class="sc-group"><h3>${esc(t)}</h3>${rows.map(([k, d]) => `<div class="sc-row"><span class="sc-keys">${k.split(" / ").map(x => `<kbd>${esc(x)}</kbd>`).join(" ")}</span><span class="sc-desc">${esc(d)}</span></div>`).join("")}</div>`).join("")}
      <button class="btn primary" id="sc-close" style="margin-top:6px">Got it</button></div>`;
    document.body.appendChild(shortcutsEl);
    const onKey = (e) => { if (e.key === "Escape") closeShortcuts(); };
    shortcutsEl._onKey = onKey;
    document.addEventListener("keydown", onKey);
    shortcutsEl.addEventListener("click", e => { if (e.target === shortcutsEl) closeShortcuts(); });
    shortcutsEl.querySelector("#sc-close").addEventListener("click", closeShortcuts);
    shortcutsEl._release = modalA11y(shortcutsEl, shortcutsEl.querySelector(".sc-card"), "Keyboard shortcuts");
  }

  function applyTextScale() { try { document.documentElement.style.setProperty("--read-scale", localStorage.getItem("atlas.textScale") || "1"); } catch (e) {} }

  // ---------- resume reading position (per lesson) ----------
  // Long lessons are easy to leave half-read; remember how far you scrolled and offer a one-tap jump back.
  // Stored in its own localStorage key (UI state, like textScale) — no main-save shape change. We DON'T
  // auto-scroll (jarring, and KaTeX/viz layout settles late); instead show a dismissible pill the user opts into.
  const READPOS_KEY = "atlas.readPos";
  function readPosMap() { try { return JSON.parse(localStorage.getItem(READPOS_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function currentLessonId() { const h = location.hash || ""; if (h.indexOf("#/lesson/") !== 0) return null; return h.slice(2).split("/")[2] || null; }
  function saveReadPos(lid, y) {
    const m = readPosMap(); m[lid] = Math.round(y);
    const keys = Object.keys(m); if (keys.length > 40) delete m[keys[0]];   // bound growth (drop oldest-inserted)
    try { localStorage.setItem(READPOS_KEY, JSON.stringify(m)); } catch (e) {}
  }
  let _resumePill = null;
  function clearResumePill() { if (_resumePill) { _resumePill.remove(); _resumePill = null; } }
  function offerResume(lid) {
    clearResumePill();
    const y = readPosMap()[lid];
    if (!y || y < 400) return;                                  // nothing meaningful to resume to
    setTimeout(() => {                                          // let KaTeX/viz settle so the page is tall + target is valid
      if (currentLessonId() !== lid) return;                   // navigated away during the wait
      const el = document.scrollingElement || document.documentElement;
      if (el.scrollHeight - el.clientHeight < y + 120) return;  // page shorter than the saved spot (layout differs) — skip
      if (el.scrollTop > 300) return;                           // user already scrolled in themselves
      const pill = document.createElement("button");
      pill.className = "resume-pill"; pill.type = "button"; pill.innerHTML = "⤓ Resume where you left off";
      pill.addEventListener("click", () => { el.scrollTo({ top: y, behavior: reducedMotion() ? "auto" : "smooth" }); clearResumePill(); });
      document.body.appendChild(pill);   // CSS @keyframes handles the entrance (no JS class toggle to depend on)
      _resumePill = pill;
      setTimeout(() => { if (_resumePill === pill) clearResumePill(); }, 9000);   // auto-dismiss if ignored
    }, 550);
  }

  // ---------- reading-progress bar (long-form lessons & pages) ----------
  let _rpRaf = 0, _toTop = null;
  function updateToTop() {                     // show the back-to-top button once you've scrolled down a screen
    if (!_toTop) return;
    const el = document.scrollingElement || document.documentElement;
    _toTop.classList.toggle("on", el.scrollTop > 600);
  }
  function updateReadProgress() {
    const bar = document.getElementById("read-progress");
    if (!bar) return;
    const fill = bar.firstElementChild;
    const el = document.scrollingElement || document.documentElement;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 400) { bar.classList.remove("on"); if (fill) fill.style.width = "0%"; return; }  // short page → hide
    bar.classList.add("on");
    const p = Math.max(0, Math.min(1, el.scrollTop / max));
    if (fill) fill.style.width = (p * 100).toFixed(1) + "%";
  }
  function scheduleReadProgress() {           // rAF-throttle the high-frequency scroll/resize events
    if (_rpRaf) return;
    _rpRaf = requestAnimationFrame(() => {
      _rpRaf = 0; updateReadProgress(); updateToTop();
      const lid = currentLessonId();                          // remember scroll depth while reading a lesson
      if (lid) { const el = document.scrollingElement || document.documentElement; if (el.scrollTop > 200) saveReadPos(lid, el.scrollTop); }
    });
  }
  function initReadProgress() {
    window.addEventListener("scroll", scheduleReadProgress, { passive: true });
    window.addEventListener("resize", scheduleReadProgress, { passive: true });
    _toTop = document.createElement("button");
    _toTop.className = "to-top"; _toTop.type = "button"; _toTop.innerHTML = "↑";
    _toTop.setAttribute("aria-label", "Scroll back to top");
    _toTop.addEventListener("click", () => (document.scrollingElement || document.documentElement).scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" }));
    document.body.appendChild(_toTop);
  }

  // ---------- boot ----------
  function boot() {
    normalizeMath();               // escape "<" inside math so KaTeX delimiters survive innerHTML
    Store.touchStreak();           // count today toward streak on open
    applyTextScale();
    initTheme();
    initContrast();
    initReduceMotion();
    initMobile();
    window.addEventListener("hashchange", router);
    window.addEventListener("keydown", e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); } });
    window.addEventListener("keydown", e => {   // "?" opens the shortcuts help (unless typing or a modal is open)
      if (e.key !== "?" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target && e.target.tagName) || ""; if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if (document.querySelector(".palette-scrim, .levelup-ov, .intro-ov, .sc-ov, .nus-exam-schedule-overlay")) return;
      e.preventDefault(); showShortcuts();
    });
    window.addEventListener("keydown", studyKeys);
    const sb = document.getElementById("search-btn"); if (sb) sb.addEventListener("click", openPalette);
    const tsb = document.getElementById("topbar-search"); if (tsb) tsb.addEventListener("click", openPalette);   // one-tap search in the mobile topbar
    const scb = document.getElementById("shortcuts-btn"); if (scb) scb.addEventListener("click", showShortcuts);
    const skip = document.getElementById("skip-link"); if (skip) skip.addEventListener("click", () => { app.focus(); app.scrollIntoView(); });
    const guide = document.getElementById("guide-btn"); if (guide) guide.addEventListener("click", () => showIntro(true));
    initReadProgress();
    router();
    flushAchievements();
    if (Store.freezeJustUsed()) toast("❄️", "Streak saved!", "A freeze covered the day you missed.");
    if (Store.streakJustUp()) flareStreak();   // welcome-back flare when today extended the streak
    if (Store.streakRecord()) toast("🏆", "New record streak!", "Your longest ever — " + Store.raw.streak + " days. Keep it going.");
    if (Store.freezeEarned()) toast("❄️", "Streak freeze earned!", "Hit a 7-day milestone — this freeze will cover one missed day (you have " + Store.raw.freezes + ").");
    showIntro(false);
  }
  function startBoot() {
    const ready = window.ATLAS_CONTENT_READY && typeof window.ATLAS_CONTENT_READY.then === "function" ? window.ATLAS_CONTENT_READY : Promise.resolve();
    ready.catch(() => null).then(() => boot());
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startBoot);
  else startBoot();
})();
