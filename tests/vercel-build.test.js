const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildServiceShell } = require("../scripts/vercel-build");

test("Vercel API build creates the configured static service shell", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "nus-atlas-vercel-build-"));
  try {
    buildServiceShell(directory);
    const shell = fs.readFileSync(path.join(directory, "index.html"), "utf8");
    assert.match(shell, /NUS Atlas sync service/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
