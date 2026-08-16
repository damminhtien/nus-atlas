const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { buildAll } = require("../scripts/content-build");
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

test("content build never mutates canonical authoring content", () => {
  const before = hashTree(path.join(__dirname, "..", "content"));
  buildAll();
  const after = hashTree(path.join(__dirname, "..", "content"));
  assert.equal(after, before);
});

test("content build is deterministic and architecture boundaries stay valid", () => {
  const output = path.join(__dirname, "..", "dist", "content");
  buildAll();
  const first = hashTree(output);
  buildAll();
  const second = hashTree(output);
  assert.equal(second, first);
  assert.equal(check({ strict: true }).ok, true);
});
