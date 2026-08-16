const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const os = require("node:os");
const { buildAll } = require("../scripts/content-build");
const { compileAll, compileCourseSource, loadCourseSource } = require("../tools/content-compiler");
const { check } = require("../scripts/check-architecture");

function hashTree(root) {
  const files = [];
  function walk(dir, prefix = "") {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const relative = path.join(prefix, entry.name);
      if (entry.isDirectory()) walk(path.join(dir, entry.name), relative);
      else files.push([relative.split(path.sep).join("/"), fs.readFileSync(path.join(dir, entry.name))]);
    }
  }
  walk(root);
  const digest = crypto.createHash("sha256");
  for (const [file, contents] of files) digest.update(file).update("\0").update(contents).update("\0");
  return digest.digest("hex");
}

test("content build never mutates canonical authoring content", { concurrency: false }, () => {
  const before = hashTree(path.join(__dirname, "..", "content"));
  buildAll();
  const after = hashTree(path.join(__dirname, "..", "content"));
  assert.equal(after, before);
});

test("content build is deterministic and architecture boundaries stay valid", { concurrency: false }, () => {
  const output = path.join(__dirname, "..", "dist", "content");
  buildAll();
  const first = hashTree(output);
  const lessonAssets = fs.readdirSync(path.join(output, "DSA5105", "lessons"));
  assert.ok(lessonAssets.some(file => /^dsa5105-erm\.[a-f0-9]{12}\.json$/.test(file)), "lesson shards must be content-addressed");
  buildAll();
  const second = hashTree(output);
  assert.equal(second, first);
  assert.equal(check({ strict: true }).ok, true);
});

test("pure compiler is filesystem-free after source loading and two outputs are identical", { concurrency: false }, () => {
  const root = path.join(__dirname, "..");
  const source = loadCourseSource(root, "DSA5105");
  const compiled = compileCourseSource(source, "DSA5105");
  assert.equal(compiled.package.course.code, "DSA5105");
  const firstRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nus-atlas-build-a-"));
  const secondRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nus-atlas-build-b-"));
  try {
    compileAll(root, firstRoot);
    compileAll(root, secondRoot);
    assert.equal(hashTree(firstRoot), hashTree(secondRoot));
  } finally {
    fs.rmSync(firstRoot, { recursive: true, force: true });
    fs.rmSync(secondRoot, { recursive: true, force: true });
  }
});

test("compiler discovers added courses and removes deleted courses without a renderer registry", { concurrency: false }, () => {
  const root = path.join(__dirname, "..");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "nus-atlas-course-discovery-"));
  const output = path.join(fixture, "dist-content");
  try {
    fs.mkdirSync(path.join(fixture, "content", "courses"), { recursive: true });
    fs.copyFileSync(path.join(root, "content", "source-types.json"), path.join(fixture, "content", "source-types.json"));
    fs.cpSync(path.join(root, "content", "courses", "DSA5105"), path.join(fixture, "content", "courses", "DSA5105"), { recursive: true });
    compileAll(fixture, output);
    let manifest = JSON.parse(fs.readFileSync(path.join(output, "manifest.json"), "utf8"));
    assert.deepEqual(manifest.courses.map(course => course.code), ["DSA5105"]);
    fs.rmSync(path.join(fixture, "content", "courses", "DSA5105"), { recursive: true, force: true });
    compileAll(fixture, output);
    manifest = JSON.parse(fs.readFileSync(path.join(output, "manifest.json"), "utf8"));
    assert.deepEqual(manifest.courses, []);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
