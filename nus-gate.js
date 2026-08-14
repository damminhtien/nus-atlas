/* NUS content gate — run: node nus-gate.js */
const fs = require("fs");
global.window = {};
function load(file) { new Function("window", fs.readFileSync(file, "utf8")).call(global.window, global.window); }
[
  "data/nus/provenance.js", "data/nus/courses.js", "data/nus/schedule.js", "data/nus/assessments.js", "data/nus/visuals.js",
  "data/nus/dsa5101.js", "data/nus/dsa5104.js", "data/nus/dsa5105.js", "data/nus/dsa5208.js", "data/nus/artifacts.js"
].forEach(load);

const errors = [], allowed = new Set(["DSA5101", "DSA5104", "DSA5105", "DSA5208"]);
const courses = global.window.NUS_COURSES || [], content = global.window.NUS_CONTENT || {};
const assessments = global.window.NUS_ASSESSMENTS || [], schedule = global.window.NUS_SCHEDULE || {}, visuals = global.window.NUS_VISUALS || {};
const sourceTypes = new Set(Object.keys(global.window.NUS_SOURCE_TYPES || {}));
if (courses.length !== 4 || new Set(courses.map(c => c.code)).size !== 4) errors.push("must define exactly four unique NUS courses");
courses.forEach(c => {
  if (!allowed.has(c.code)) errors.push("course outside allowlist: " + c.code);
  if (!c.title || !c.semester || !Array.isArray(c.prerequisites) || !c.nusmods || !c.nusmods.apiModule) errors.push("missing course metadata: " + c.code);
  if (c.prerequisites.some(code => !allowed.has(code))) errors.push("bad prerequisite on course: " + c.code);
  const lessons = (content[c.code] && content[c.code].modules || []).flatMap(m => m.lessons || []);
  if (!lessons.length) errors.push("course has no lessons: " + c.code);
  if (c.code === "DSA5105") {
    ["lectureSources", "textbookSources", "referenceSources"].forEach(key => {
      if (!Array.isArray(c[key]) || !c[key].length) errors.push("missing DSA5105 source class: " + key);
      (c[key] || []).forEach(r => {
        if (!r.sourceId || !sourceTypes.has(r.sourceType) || !r.role || !r.status) errors.push("incomplete DSA5105 catalog source: " + (r.sourceId || key));
      });
    });
  }
  const ids = new Set();
  lessons.forEach(l => {
    if (!l.id || ids.has(l.id)) errors.push("duplicate/missing lesson id: " + c.code);
    ids.add(l.id);
    (l.sourceRefs || []).forEach(r => {
      if (!r.sourceId || !Number.isInteger(r.page) || r.page < 1) errors.push("bad lesson source ref: " + l.id);
      if (c.code === "DSA5105" && (!sourceTypes.has(r.sourceType) || !r.role || !r.status)) errors.push("untyped DSA5105 lesson source ref: " + l.id);
    });
    (l.visualIds || []).forEach(id => { if (!visuals[id]) errors.push("unknown visual ref: " + id); });
    (l.questions || []).forEach(q => {
      if (!q.id || !q.type || !q.prompt || !q.explanation && !q.solution) errors.push("incomplete question: " + (q.id || l.id));
      if (q.type === "mcq" && (!Array.isArray(q.choices) || typeof q.answer !== "number" || q.answer < 0 || q.answer >= q.choices.length)) errors.push("bad MCQ: " + q.id);
      if (q.type !== "mcq" && (!Array.isArray(q.accepted) || !q.accepted.length)) errors.push("missing accepted answer: " + q.id);
      (q.sourceRefs || []).forEach(r => { if (c.code === "DSA5105" && (!sourceTypes.has(r.sourceType) || !r.role || !r.status)) errors.push("untyped DSA5105 question source ref: " + q.id); });
    });
    if (!Array.isArray(l.flashcards) || l.flashcards.length < 3) errors.push("missing flashcards: " + l.id);
    if (!Array.isArray(l.homework) || l.homework.length < 2) errors.push("missing homework: " + l.id);
    (l.codeExercises || []).forEach(ex => { if (!ex.id || !ex.language || !ex.prompt || typeof ex.expected !== "string" || !ex.solution) errors.push("incomplete code exercise: " + (ex.id || l.id)); });
  });
});
assessments.forEach(a => {
  if (!allowed.has(a.courseCode)) errors.push("assessment outside allowlist: " + a.id);
  if (a.dateStatus === "pending" && a.date !== null) errors.push("pending assessment has a guessed date: " + a.id);
  if (a.date && Number.isNaN(new Date(a.date).getTime())) errors.push("invalid assessment date: " + a.id);
  if (!Array.isArray(a.checklist) || !a.checklist.length) errors.push("missing checklist: " + a.id);
});
allowed.forEach(code => {
  const total = assessments.filter(a => a.courseCode === code).reduce((sum, a) => sum + Number(a.weight || 0), 0);
  if (total !== 100) errors.push(`${code} assessment weights sum to ${total}, expected 100`);
  if (!schedule.courses || !schedule.courses[code]) errors.push("missing schedule: " + code);
});
Object.entries(visuals).forEach(([id, v]) => {
  if (!allowed.has(v.courseCode) || !v.title || !v.kind || !v.source || !v.source.sourceId || !Number.isInteger(v.source.page) || !v.observation) errors.push("incomplete visual ref: " + id);
  if (v.source.externalUrl && !/^https:\/\//.test(v.source.externalUrl)) errors.push("external visual source must use HTTPS: " + id);
});
const publicFiles = fs.readdirSync("data/nus").filter(f => f.endsWith(".js")).map(f => "data/nus/" + f).concat(["js/nus.js", "js/nus-store.js"]);
const publicText = publicFiles.map(file => fs.readFileSync(file, "utf8"));
if (publicText.some(t => /\/Users\/|Desktop\/NUS|(?:passport|medical|identity)[^\n]{0,80}\.(?:pdf|docx?|png|jpe?g)/i.test(t))) errors.push("public NUS layer contains a private/raw source marker");
if (errors.length) { console.error("NUS GATE FAILED"); errors.forEach(e => console.error("- " + e)); process.exit(1); }
console.log(`NUS GATE GREEN · ${courses.length} courses · ${courses.reduce((n, c) => n + (content[c.code].modules || []).reduce((m, x) => m + (x.lessons || []).length, 0), 0)} lessons · ${assessments.length} assessment milestones · ${Object.keys(visuals).length} visual refs`);
