/* Compile canonical content into the ignored, deployable dist/content artifact. */
const path = require("path");
const {
  compileAll,
  compileCourse,
  validateCanonical,
  writeCourseArtifacts
} = require("../tools/content-compiler");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "dist", "content");
const DEFAULT_COURSE = "DSA5105";

function build(courseId = DEFAULT_COURSE) {
  validateCanonical(ROOT, courseId);
  const compiled = compileCourse(ROOT, courseId);
  const manifest = writeCourseArtifacts(OUTPUT, compiled);
  console.log(`CONTENT BUILD GREEN · ${courseId} · ${compiled.package.counts.modules} modules · ${compiled.package.counts.lessons} lessons · ${compiled.package.counts.questions} questions · output dist/content/${courseId}`);
  return { ...compiled.package, manifest };
}

function buildAll() {
  const result = compileAll(ROOT, OUTPUT);
  result.courses.forEach(course => console.log(`CONTENT BUILD GREEN · ${course.courseId} · ${course.counts.modules} modules · ${course.counts.lessons} lessons · ${course.counts.questions} questions · output dist/content/${course.courseId}`));
  console.log(`CONTENT MANIFEST GREEN · ${result.courses.length} package(s) · output dist/content/manifest.json`);
  return result;
}

if (require.main === module) {
  if (process.argv[2] === "--all" || !process.argv[2]) buildAll();
  else build(process.argv[2]);
}

module.exports = { build, buildAll };
