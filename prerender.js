/* NUS Atlas prerenderer.
 *
 * The hash-routed app is backed only by canonical DSA course packages. This
 * build emits crawlable lesson pages and a complete deployment artifact.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { compileCourse } = require("./tools/content-compiler");

const BASE = (process.env.SITE_URL || "https://atlascodex.io").replace(/\/+$/, "");
const OUT = path.join(__dirname, "dist");
const VERSION = fs.readFileSync(path.join(__dirname, "VERSION"), "utf8").trim();
const KATEX = '0.16.21';
const FONTS = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap";

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function describe(html) {
  let text = String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$\n]*?\$/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#3?9;|&#x27;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
  if (text.length <= 155) return text;
  text = text.slice(0, 155);
  return text.slice(0, text.lastIndexOf(" ")).trim() + "…";
}

function nusLessonContent(lesson) {
  const notes = (lesson.sections || []).map(section => "<h3>" + esc(section.title) + "</h3><p>" + esc(section.body) + "</p>").join("");
  const formulas = (lesson.math || []).map(formula => '<div class="formula">$$' + esc(formula.latex) + "$$<p>" + esc(formula.explanation) + "</p></div>").join("");
  const examples = (lesson.examples || []).map(example => "<h3>" + esc(example.title) + "</h3><ol>" + (example.steps || []).map(step => "<li>" + esc(step) + "</li>").join("") + "</ol>").join("");
  return "<p>" + esc(lesson.summary || "") + "</p>" + notes + formulas + examples;
}

function nusLessonPage(course, module, lesson) {
  const url = BASE + "/nus/" + course.code + "/" + lesson.id + "/";
  const content = nusLessonContent(lesson);
  const desc = describe(content);
  const spaUrl = BASE + "/#/nus/lesson/" + course.code + "/" + lesson.id;
  const jsonld = { "@context": "https://schema.org", "@type": "LearningResource", name: lesson.title, description: desc, url, educationalLevel: "graduate", learningResourceType: "lesson", isPartOf: { "@type": "Course", name: course.title }, inLanguage: "en", provider: { "@type": "Organization", name: "NUS Atlas", url: BASE } };
  return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/><title>" + esc(lesson.title) + " — " + esc(course.code) + " · NUS Atlas</title><meta name=\"description\" content=\"" + esc(desc) + "\"/><meta name=\"atlas-version\" content=\"" + esc(VERSION) + "\"/><link rel=\"canonical\" href=\"" + url + "\"/><meta name=\"robots\" content=\"index,follow\"/><meta name=\"theme-color\" content=\"#061a33\"/><link rel=\"icon\" href=\"" + BASE + "/icon.svg\" type=\"image/svg+xml\"/><link rel=\"stylesheet\" href=\"" + FONTS + "\"/><link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/katex@" + KATEX + "/dist/katex.min.css\" crossorigin=\"anonymous\"/><style>" + PAGE_CSS + "</style><script type=\"application/ld+json\">" + JSON.stringify(jsonld) + "</script></head><body><div class=\"wrap\"><a class=\"topbar\" href=\"" + BASE + "/\"><span class=\"g\">N</span><span>NUS Atlas · Study Studio</span></a><div class=\"crumb\">" + esc(course.code) + " → " + esc(module.title) + "</div><h1>" + esc(lesson.title) + "</h1><div class=\"meta\">" + (lesson.minutes ? esc(lesson.minutes) + " min read · " : "") + "Source-backed NUS study lesson</div><article>" + content + "</article><div class=\"cta\"><strong>Open the full study flow.</strong> The interactive page adds retrieval prompts, visual labs, source trails, and planner links.<br/><a class=\"btn\" href=\"" + spaUrl + "\">Open interactive NUS lesson →</a></div><footer>NUS Atlas v" + esc(VERSION) + " — normalized content with lecture, textbook, and reference provenance.</footer></div><script defer src=\"https://cdn.jsdelivr.net/npm/katex@" + KATEX + "/dist/katex.min.js\" crossorigin=\"anonymous\"></script><script defer src=\"https://cdn.jsdelivr.net/npm/katex@" + KATEX + "/dist/contrib/auto-render.min.js\" crossorigin=\"anonymous\"></script><script>document.addEventListener(\"DOMContentLoaded\",function(){if(window.renderMathInElement)renderMathInElement(document.body,{delimiters:[{left:\"$$\",right:\"$$\",display:true},{left:\"$\",right:\"$\",display:false}],throwOnError:false});});</script></body></html>";
}

const PAGE_CSS = [
  "*{box-sizing:border-box}",
  "body{margin:0;background:#141110;color:#ece3d4;font-family:Spectral,Georgia,serif;font-size:18px;line-height:1.7;-webkit-font-smoothing:antialiased}",
  ".wrap{max-width:720px;margin:0 auto;padding:28px 22px 80px}",
  "a{color:#e0a458}.topbar{display:flex;align-items:center;gap:10px;font-family:Fraunces,Georgia,serif;font-weight:600;text-decoration:none;color:#f1e8da;margin-bottom:18px}",
  ".topbar .g{width:30px;height:30px;border-radius:8px;background:#e0a458;color:#2a1c08;display:grid;place-items:center;font-weight:800}",
  ".crumb{font-size:13px;color:#9c9081;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em}",
  "h1{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:34px;line-height:1.15;margin:.1em 0 .3em}",
  "h3{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:22px;margin:1.6em 0 .4em;color:#f4ecdd}",
  ".meta{color:#9c9081;font-size:14px;margin-bottom:1.4em}p{margin:0 0 1.05em}",
  "strong{color:#f6efe2}code{font-family:'JetBrains Mono',monospace;font-size:.9em;background:#211c18;padding:.12em .35em;border-radius:5px}",
  ".formula{margin:1.2em 0;padding:12px 16px;border-left:3px solid #e0a458;background:#1d1813;border-radius:0 10px 10px 0}",
  ".cta{margin:2.4em 0 0;padding:18px 20px;background:#1c1814;border:1px solid #34291e;border-radius:14px}",
  ".cta a.btn{display:inline-block;margin-top:8px;background:#e0a458;color:#2a1c08;text-decoration:none;font-weight:700;padding:9px 18px;border-radius:9px}",
  "footer{margin-top:40px;padding-top:18px;border-top:1px solid #2a241d;color:#7e7365;font-size:13px}.katex{font-size:1.04em}"
].join("");

function copyInto(source, destination) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    fs.readdirSync(source).forEach(name => copyInto(path.join(source, name), path.join(destination, name)));
  } else {
    fs.copyFileSync(source, destination);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
require("./scripts/content-build").buildAll();
["index.html", "sw.js", "manifest.webmanifest", "icon.svg", "css", "src", "assets"].forEach(item => {
  const source = path.join(__dirname, item);
  if (fs.existsSync(source)) copyInto(source, path.join(OUT, item));
});

const courseIds = fs.readdirSync(path.join(__dirname, "content", "courses"), { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
const urls = [{ loc: BASE + "/", pri: "1.0" }];
let pages = 0;
for (const courseId of courseIds) {
  const packageData = compileCourse(__dirname, courseId).package;
  const course = packageData.course;
  const modules = (packageData.content.modules || []).map(module => ({ ...module, lessons: module.lessons || [] }));
  for (const module of modules) {
    for (const lesson of module.lessons) {
      const directory = path.join(OUT, "nus", course.code, lesson.id);
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(path.join(directory, "index.html"), nusLessonPage(course, module, lesson));
      urls.push({ loc: BASE + "/nus/" + course.code + "/" + lesson.id + "/", pri: "0.85" });
      pages += 1;
    }
  }
}

const sitemap = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" + urls.map(url => "  <url><loc>" + url.loc + "</loc><priority>" + url.pri + "</priority></url>").join("\n") + "\n</urlset>\n";
fs.writeFileSync(path.join(OUT, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(OUT, "robots.txt"), "User-agent: *\nAllow: /\n\nSitemap: " + BASE + "/sitemap.xml\n");

function walkFiles(directory, prefix) {
  const base = prefix || "";
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(base, entry.name);
    return entry.isDirectory() ? walkFiles(path.join(directory, entry.name), relative) : [relative.split(path.sep).join("/")];
  });
}
const assets = walkFiles(OUT).filter(file => !file.startsWith("nus/") && !["sw.js", "asset-manifest.json", "sitemap.xml", "robots.txt"].includes(file));
const shellAssets = new Set(["index.html", "manifest.webmanifest", "icon.svg", "css/styles.css"]);
const eager = assets.filter(file => shellAssets.has(file));
const lazy = assets.filter(file => file.startsWith("content/"));
const manifest = { schemaVersion: "atlas.asset-manifest.v2", version: VERSION, eager: eager.map(file => "./" + file), lazy: lazy.map(file => "./" + file) };
fs.writeFileSync(path.join(OUT, "asset-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
const cache = `nus-atlas:atlas-${VERSION}-${crypto.createHash("sha1").update(JSON.stringify(manifest)).digest("hex").slice(0, 12)}`;
fs.writeFileSync(path.join(OUT, "sw.js"), fs.readFileSync(path.join(OUT, "sw.js"), "utf8").replace('"__ATLAS_CACHE__"', JSON.stringify(cache)));

console.log("PRERENDER — " + pages + " lesson pages · " + urls.length + " sitemap urls · " + eager.length + " eager assets · " + lazy.length + " lazy content assets · base " + BASE + " · out dist/");
