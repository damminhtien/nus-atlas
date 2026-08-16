/* Atlas SEO prerenderer — run:  node prerender.js   (CI runs it on every push)

   The site is a hash-routed SPA, so search engines see only the homepage and none of the
   148 lessons. This script reads the same data layer the app does and emits a static,
   crawlable HTML page per lesson at a REAL url (/l/<topic>/<lesson>/), each carrying the
   lesson's actual content, a unique <title>/description, canonical + OpenGraph/Twitter
   tags, and JSON-LD — plus sitemap.xml and robots.txt. It also copies the static site so
   the output dir (dist/) is a complete, deployable bundle.

   Nothing here is committed: dist/ is gitignored and rebuilt fresh in CI, so the pages can
   never go stale relative to the content — every content push regenerates them. Local dev
   stays zero-build; you still just open index.html. */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { compileCourse } = require("./tools/content-compiler");

// Where the site will live. Canonical/OG/sitemap urls point here; override in CI if needed.
const BASE = (process.env.SITE_URL || "https://atlascodex.io").replace(/\/+$/, "");
const OUT = path.join(__dirname, "dist");
const GC = "vspinftu"; // GoatCounter site code — each prerendered page reports its own visits
const VERSION = fs.readFileSync(path.join(__dirname, "VERSION"), "utf8").trim();

// ---- load the data layer exactly like gate.js (no DOM, just collect window.COURSES) ----
global.window = {};
global.document = { documentElement: {}, createElement: () => ({ getContext: () => ({ scale() {} }), style: {}, addEventListener() {} }), addEventListener() {} };
global.getComputedStyle = () => ({ getPropertyValue: () => "" });
function load(f) { new Function("window", "document", "getComputedStyle", fs.readFileSync(path.join(__dirname, f), "utf8")).call(global.window, global.window, global.document, global.getComputedStyle); }
["linear-algebra", "calculus", "algorithms", "deep-learning", "reinforcement-learning", "llm", "probability-statistics"]
  .forEach(t => load("data/" + t + ".js"));
const COURSES = global.window.COURSES || [];
const courseIds = fs.readdirSync(path.join(__dirname, "content", "courses"), { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
const NUS_PACKAGES = courseIds.map(courseId => compileCourse(__dirname, courseId).package);

// ---- helpers ----
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

// Turn a lesson's content HTML into a clean ~155-char meta description: drop tags, math,
// viz/code placeholders, decode the few entities we use, collapse whitespace, cut on a word.
function describe(html) {
  let t = String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")     // display math
    .replace(/\$[^$\n]*?\$/g, " ")          // inline math
    .replace(/<[^>]+>/g, " ")               // tags
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#3?9;|&#x27;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
  if (t.length <= 155) return t;
  t = t.slice(0, 155);
  return t.slice(0, t.lastIndexOf(" ")).trim() + "…";
}

// Soften interactive placeholders so the static page reads cleanly and never shows an empty box.
function staticizeContent(html) {
  return String(html)
    .replace(/<div\s+data-viz=["'][^"']*["'][^>]*>\s*<\/div>/gi, '<p class="app-note">▶ <em>Interactive visualization — open this lesson in the app to explore it.</em></p>')
    .replace(/<div\s+data-code=["'][^>]*>[\s\S]*?<\/div>/gi, '<p class="app-note">💻 <em>Runnable code exercise — open this lesson in the app to try it.</em></p>');
}

function nusLessonContent(lesson) {
  const notes = (lesson.sections || []).map(section => `<h3>${esc(section.title)}</h3><p>${esc(section.body)}</p>`).join("");
  const formulas = (lesson.math || []).map(formula => `<div class="formula">$$${esc(formula.latex)}$$<p>${esc(formula.explanation)}</p></div>`).join("");
  const examples = (lesson.examples || []).map(example => `<h3>${esc(example.title)}</h3><ol>${(example.steps || []).map(step => `<li>${esc(step)}</li>`).join("")}</ol>`).join("");
  return `<p>${esc(lesson.summary || "")}</p>${notes}${formulas}${examples}`;
}

function nusLessonPage(course, module, lesson) {
  const url = `${BASE}/nus/${course.code}/${lesson.id}/`;
  const content = nusLessonContent(lesson);
  const desc = describe(content);
  const spaUrl = `${BASE}/#/nus/lesson/${course.code}/${lesson.id}`;
  const jsonld = { "@context": "https://schema.org", "@type": "LearningResource", name: lesson.title, description: desc, url, educationalLevel: "graduate", learningResourceType: "lesson", isPartOf: { "@type": "Course", name: course.title }, inLanguage: "en", provider: { "@type": "Organization", name: "NUS Atlas", url: BASE } };
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(lesson.title)} — ${esc(course.code)} · NUS Atlas</title><meta name="description" content="${esc(desc)}"/><meta name="atlas-version" content="${esc(VERSION)}"/><link rel="canonical" href="${url}"/><meta name="robots" content="index,follow"/><meta name="theme-color" content="#061a33"/><link rel="icon" href="${BASE}/icon.svg" type="image/svg+xml"/><link rel="stylesheet" href="${FONTS}"/><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${KATEX}/dist/katex.min.css" crossorigin="anonymous"/><style>${PAGE_CSS}</style><script type="application/ld+json">${JSON.stringify(jsonld)}</script></head><body><div class="wrap"><a class="topbar" href="${BASE}/"><span class="g">N</span><span>NUS Atlas · Study Studio</span></a><div class="crumb">${esc(course.code)} → ${esc(module.title)} · Lecture core / textbook depth are labeled in the app</div><h1>${esc(lesson.title)}</h1><div class="meta">${lesson.minutes ? `${esc(lesson.minutes)} min read · ` : ""}Source-backed NUS study lesson</div><article>${staticizeContent(content)}</article><div class="cta"><strong>Open the full study flow.</strong> The interactive page adds retrieval prompts, visual labs, source trails, and planner links.<br/><a class="btn" href="${spaUrl}">Open interactive NUS lesson →</a></div><footer>NUS Atlas v${esc(VERSION)} — normalized content with lecture, textbook, and reference provenance.</footer></div><script defer src="https://cdn.jsdelivr.net/npm/katex@${KATEX}/dist/katex.min.js" crossorigin="anonymous"></script><script defer src="https://cdn.jsdelivr.net/npm/katex@${KATEX}/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script><script>document.addEventListener("DOMContentLoaded",function(){if(window.renderMathInElement)renderMathInElement(document.body,{delimiters:[{left:"$$",right:"$$",display:true},{left:"$",right:"$",display:false}],throwOnError:false});});</script></body></html>`;
}

// ---- per-lesson page template ----
const FONTS = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap';
const KATEX = '0.16.11';

const PAGE_CSS = `
*{box-sizing:border-box}
body{margin:0;background:#141110;color:#ece3d4;font-family:Spectral,Georgia,serif;font-size:18px;line-height:1.7;-webkit-font-smoothing:antialiased}
.wrap{max-width:720px;margin:0 auto;padding:28px 22px 80px}
a{color:#e0a458}
.topbar{display:flex;align-items:center;gap:10px;font-family:Fraunces,Georgia,serif;font-weight:600;text-decoration:none;color:#f1e8da;margin-bottom:18px}
.topbar .g{width:30px;height:30px;border-radius:8px;background:#e0a458;color:#2a1c08;display:grid;place-items:center;font-weight:800}
.crumb{font-size:13px;color:#9c9081;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em}
h1{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:34px;line-height:1.15;margin:.1em 0 .3em}
h3{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:22px;margin:1.6em 0 .4em;color:#f4ecdd}
.meta{color:#9c9081;font-size:14px;margin-bottom:1.4em}
p{margin:0 0 1.05em}
strong{color:#f6efe2}
code{font-family:'JetBrains Mono',monospace;font-size:.9em;background:#211c18;padding:.12em .35em;border-radius:5px}
pre{background:#1b1714;border:1px solid #2e2720;border-radius:10px;padding:14px;overflow:auto}
pre code{background:none;padding:0}
.callout{border-left:3px solid #6f8f6a;background:#191c18;border-radius:0 10px 10px 0;padding:12px 16px;margin:1.3em 0}
.callout.gold{border-color:#e0a458;background:#1d1813}.callout.rust{border-color:#c1633b;background:#1e1714}.callout.blue,.callout.sky{border-color:#5a87a8;background:#161a1d}
.c-tag{font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:#b9a98f;font-weight:700;margin-bottom:.3em}
.app-note{color:#b9a98f;background:#1a1613;border:1px dashed #3a3128;border-radius:10px;padding:10px 14px}
table{border-collapse:collapse;width:100%;margin:1.2em 0}th,td{border:1px solid #2e2720;padding:7px 10px;text-align:left}
.cta{margin:2.4em 0 0;padding:18px 20px;background:#1c1814;border:1px solid #34291e;border-radius:14px}
.cta a.btn{display:inline-block;margin-top:8px;background:#e0a458;color:#2a1c08;text-decoration:none;font-weight:700;padding:9px 18px;border-radius:9px}
footer{margin-top:40px;padding-top:18px;border-top:1px solid #2a241d;color:#7e7365;font-size:13px}
.katex{font-size:1.04em}
`;

function lessonPage(course, mod, lesson) {
  const url = `${BASE}/l/${course.id}/${lesson.id}/`;
  const title = `${lesson.title} — ${course.title} · Atlas`;
  const desc = describe(lesson.content || "");
  const spaUrl = `${BASE}/#/lesson/${course.id}/${lesson.id}`;
  const jsonld = {
    "@context": "https://schema.org", "@type": "LearningResource",
    name: lesson.title, description: desc, url,
    educationalLevel: "intermediate", learningResourceType: "lesson",
    isPartOf: { "@type": "Course", name: course.title }, inLanguage: "en",
    provider: { "@type": "Organization", name: "Atlas", url: BASE }
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}"/>
<link rel="canonical" href="${url}"/>
<meta name="robots" content="index,follow"/>
<meta name="theme-color" content="#141110"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="Atlas"/>
<meta property="og:title" content="${esc(lesson.title)} — ${esc(course.title)}"/>
<meta property="og:description" content="${esc(desc)}"/>
<meta property="og:url" content="${url}"/>
<meta name="twitter:card" content="summary"/>
<meta name="twitter:title" content="${esc(lesson.title)} — ${esc(course.title)}"/>
<meta name="twitter:description" content="${esc(desc)}"/>
<link rel="icon" href="${BASE}/icon.svg" type="image/svg+xml"/>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="stylesheet" href="${FONTS}"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${KATEX}/dist/katex.min.css" crossorigin="anonymous"/>
<script defer src="https://cdn.jsdelivr.net/npm/katex@${KATEX}/dist/katex.min.js" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@${KATEX}/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
<style>${PAGE_CSS}</style>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
<div class="wrap">
<a class="topbar" href="${BASE}/"><span class="g">A</span><span>Atlas · Learning Codex</span></a>
<div class="crumb">${esc(course.title)} → ${esc(mod.title)}</div>
<h1>${esc(lesson.title)}</h1>
<div class="meta">${lesson.minutes ? esc(lesson.minutes) + " min read · " : ""}Part of the free, interactive Atlas codex</div>
<article>
${staticizeContent(lesson.content || "")}
</article>
<div class="cta">
<strong>This is a readable snapshot.</strong> The full lesson adds rendered visualizations, quizzes, flashcards, and a runnable code playground — all free, no signup.
<br/><a class="btn" href="${spaUrl}">Open the interactive lesson →</a>
</div>
<footer>Atlas — a free, gamified codex for linear algebra, calculus, algorithms, deep learning, reinforcement learning, LLMs &amp; statistics. <a href="${BASE}/">Explore all topics →</a></footer>
</div>
<script>document.addEventListener("DOMContentLoaded",function(){if(window.renderMathInElement)renderMathInElement(document.body,{delimiters:[{left:"$$",right:"$$",display:true},{left:"$",right:"$",display:false}],throwOnError:false});});</script>
<script data-goatcounter="https://${GC}.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>`;
}

// ---- recursive copy of the static site into dist/ (so the artifact is complete) ----
function copyInto(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      // Historical NUS IIFE registries are migration input, not public runtime assets.
      if (src === path.join(__dirname, "data") && name === "nus") continue;
      copyInto(path.join(src, name), path.join(dst, name));
    }
  } else {
    fs.copyFileSync(src, dst);
  }
}

// ---- build ----
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
require("./scripts/content-build").buildAll();
for (const item of ["index.html", "sw.js", "manifest.webmanifest", "icon.svg", "css", "js", "src", "data", "assets"]) {
  const p = path.join(__dirname, item);
  if (fs.existsSync(p)) copyInto(p, path.join(OUT, item));
}

const urls = [{ loc: BASE + "/", pri: "1.0" }];
let pages = 0;
for (const course of COURSES) {
  for (const mod of course.modules || []) {
    for (const lesson of mod.lessons || []) {
      const dir = path.join(OUT, "l", course.id, lesson.id);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "index.html"), lessonPage(course, mod, lesson));
      urls.push({ loc: `${BASE}/l/${course.id}/${lesson.id}/`, pri: "0.8" });
      pages++;
    }
  }
}
for (const packageData of NUS_PACKAGES) {
  const course = packageData.course;
  const modules = (packageData.content.modules || []).map(module => ({ ...module, lessons: module.lessons || [] }));
  for (const module of modules) {
    for (const lesson of module.lessons) {
      const dir = path.join(OUT, "nus", course.code, lesson.id);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "index.html"), nusLessonPage(course, module, lesson));
      urls.push({ loc: `${BASE}/nus/${course.code}/${lesson.id}/`, pri: "0.85" });
      pages++;
    }
  }
}

// sitemap.xml + robots.txt at the site root
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><priority>${u.pri}</priority></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(OUT, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);

function walkFiles(dir, prefix = "") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) return walkFiles(path.join(dir, entry.name), relative);
    return [relative.split(path.sep).join("/")];
  });
}
const assets = walkFiles(OUT).filter(file => !file.startsWith("l/") && !file.startsWith("nus/") && !["sw.js", "asset-manifest.json", "sitemap.xml", "robots.txt"].includes(file));
const manifest = { schemaVersion: "atlas.asset-manifest.v1", version: VERSION, assets: assets.map(file => `./${file}`) };
fs.writeFileSync(path.join(OUT, "asset-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
const cache = `atlas-${VERSION}-${crypto.createHash("sha1").update(JSON.stringify(manifest)).digest("hex").slice(0, 12)}`;
const serviceWorker = fs.readFileSync(path.join(OUT, "sw.js"), "utf8").replace('"__ATLAS_CACHE__"', JSON.stringify(cache));
fs.writeFileSync(path.join(OUT, "sw.js"), serviceWorker);

console.log(`PRERENDER — ${pages} lesson pages · ${urls.length} sitemap urls · ${manifest.assets.length} manifest assets · base ${BASE} · out ${path.relative(__dirname, OUT)}/`);
