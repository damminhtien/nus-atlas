/* One-way legacy importer.
 *
 * This command is intentionally separate from the compiler. It is safe by
 * default: an existing canonical course directory requires --overwrite.
 */
const fs = require("fs");
const path = require("path");
const { loadLegacyState } = require("../../../scripts/validate-content");
const { normalizeLesson } = require("../../content-compiler");

const ROOT = path.resolve(__dirname, "../../..");

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function importCourse(courseId, { overwrite = false } = {}) {
  const state = loadLegacyState(ROOT);
  const course = state.courses.find(item => item.code === courseId);
  const catalog = state.content[courseId];
  if (!course || !catalog) throw new Error(`Legacy course not found: ${courseId}`);
  const target = path.join(ROOT, "content", "courses", courseId);
  if (fs.existsSync(target) && fs.readdirSync(target).length && !overwrite) {
    throw new Error(`${target} already exists; pass --overwrite only when intentionally replacing canonical content`);
  }
  fs.mkdirSync(target, { recursive: true });
  writeJson(path.join(target, "course.json"), { ...course, schemaVersion: "nus.course.v1" });
  for (const module of catalog.modules || []) {
    writeJson(path.join(target, "modules", `${module.id}.json`), { id: module.id, title: module.title, schemaVersion: "nus.module.v1", lessonIds: (module.lessons || []).map(lesson => lesson.id) });
    for (const rawLesson of module.lessons || []) {
      const normalized = normalizeLesson(courseId, module, rawLesson, rawLesson.questions || [], state.artifacts[rawLesson.id] || rawLesson);
      writeJson(path.join(target, "lessons", `${rawLesson.id}.json`), normalized.lesson);
      writeJson(path.join(target, "questions", `${rawLesson.id}.json`), normalized.questions);
      writeJson(path.join(target, "artifacts", `${rawLesson.id}.json`), normalized.artifacts);
    }
  }
  writeJson(path.join(target, "assessments.json"), state.assessments.filter(item => item.courseCode === courseId));
  writeJson(path.join(target, "labs", "index.json"), Object.fromEntries(Object.entries(state.labs).filter(([, lab]) => lab.courseCode === courseId)));
  writeJson(path.join(target, "visuals.json"), Object.fromEntries(Object.entries(state.visuals).filter(([, visual]) => visual.courseCode === courseId)));
  console.log(`LEGACY MIGRATION GREEN · ${courseId} · wrote ${target}`);
}

if (require.main === module) {
  const courseId = process.argv[2];
  if (!courseId || courseId.startsWith("-")) throw new Error("Usage: npm run content:migrate:legacy -- COURSE [--overwrite]");
  importCourse(courseId, { overwrite: process.argv.includes("--overwrite") });
}

module.exports = { importCourse };
