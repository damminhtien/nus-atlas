/* Validate the compiled runtime against the JSON-schema contract.
 * This is intentionally dependency-free: CI must be able to run it before
 * optional tooling is installed. JSON Schema files remain the documentation
 * and runtime contract; these checks cover the discriminators used by Atlas.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const errors = [];
const required = (value, fields, location) => fields.forEach(field => {
  if (value == null || value[field] === undefined) errors.push(`${location} missing ${field}`);
});
const namespaced = (value, location) => {
  if (typeof value !== "string" || !/^[^:]+:[^/]+\/.+/.test(value)) errors.push(`${location} must be namespaced`);
};
const json = file => JSON.parse(fs.readFileSync(file, "utf8"));

function validateCourse(courseRoot, entry) {
  const courseFile = path.join(courseRoot, entry.courseAsset);
  const course = json(courseFile);
  required(course, ["course", "assessments", "sources", "lessonAssets", "questionAssets", "studyKitAssets", "labAssets", "visualAssets", "slideAssets", "schemaVersion"], `${entry.code}/course`);
  if (course.schemaVersion !== "nus.course-payload.v1") errors.push(`${entry.code}/course has invalid schemaVersion`);
  if (entry.code === "DSA5101") {
    required(course, ["questionTemplates"], `${entry.code}/course`);
    if (course.questionTemplates && course.questionTemplates.schemaVersion !== "nus.question-templates.v1") errors.push(`${entry.code}/questionTemplates has invalid schemaVersion`);
    if (course.questionTemplates && course.questionTemplates.courseId !== entry.code) errors.push(`${entry.code}/questionTemplates has invalid courseId`);
  }
  namespaced(course.course && course.course.entityKey, `${entry.code}/course.entityKey`);
  for (const [lessonId, asset] of Object.entries(entry.lessonAssets || {})) {
    const payload = json(path.join(courseRoot, asset));
    required(payload.lesson, ["id", "entityKey", "blocks", "sourceRefs", "questionIds", "labIds", "visualIds", "slideSetIds", "schemaVersion"], `${entry.code}/${lessonId}`);
    namespaced(payload.lesson && payload.lesson.entityKey, `${entry.code}/${lessonId}.entityKey`);
    if (payload.lesson && payload.lesson.schemaVersion !== "nus.lesson.v1") errors.push(`${entry.code}/${lessonId} has invalid lesson schemaVersion`);
    const questions = json(path.join(courseRoot, entry.questionAssets[lessonId])).questions || [];
    questions.forEach((question, index) => {
      required(question, ["id", "entityKey", "courseId", "lessonId", "type", "prompt", "explanation", "sourceRefs", "schemaVersion"], `${entry.code}/${lessonId}/question[${index}]`);
      namespaced(question.entityKey, `${entry.code}/${lessonId}/question[${index}].entityKey`);
      if (question.schemaVersion !== "nus.question.v1") errors.push(`${entry.code}/${lessonId}/question[${index}] has invalid schemaVersion`);
    });
  }
}

function validate(root = ROOT) {
  const schemaRoot = path.join(root, "schemas");
  for (const file of fs.readdirSync(schemaRoot).filter(file => file.endsWith(".json")).sort()) {
    try { json(path.join(schemaRoot, file)); }
    catch (error) { errors.push(`invalid JSON schema ${file}: ${error.message}`); }
  }
  const manifestFile = path.join(root, "dist", "content", "manifest.json");
  if (!fs.existsSync(manifestFile)) errors.push("dist/content/manifest.json is missing; run content:build first");
  else {
    const manifest = json(manifestFile);
    if (manifest.schemaVersion !== "nus.content-manifest.v3") errors.push("manifest has invalid schemaVersion");
    for (const entry of manifest.courses || []) validateCourse(path.join(root, "dist", "content"), entry);
  }
  return { ok: errors.length === 0, errors: errors.slice() };
}

if (require.main === module) {
  const result = validate();
  if (!result.ok) { console.error(`SCHEMA CONTRACT FAILED\n- ${result.errors.join("\n- ")}`); process.exitCode = 1; }
  else console.log("SCHEMA CONTRACT GREEN");
}

module.exports = { validate };
