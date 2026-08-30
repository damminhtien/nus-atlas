const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { readOwnership, ownershipFor } = require("../scripts/check-architecture");

test("canonical, source, and generated ownership is explicit", () => {
  const ownership = readOwnership();
  assert.equal(ownership.authorityOrder[0], "canonical");
  assert.equal(ownershipFor("content/courses/DSA5105/course.json", ownership.rules).role, "canonical");
  assert.equal(ownershipFor("data/extracted/DSA5102/lecturenotes_dsa5102_2021.json", ownership.rules).role, "source");
  assert.equal(ownershipFor("dist/content/manifest.json", ownership.rules).role, "generated");
  for (const file of ["api/sync.js", "assets/nus/dsa5104/university/DDL.sql", "css/styles.css", "js/legacy-runtime.js", "index.html", "prerender.js"]) {
    assert.equal(ownershipFor(file, ownership.rules).role, "source", `${file} needs an explicit production ownership rule`);
  }
});

test("generated deployment bundles are not tracked", () => {
  const tracked = execFileSync("git", ["ls-files", "dist"], { encoding: "utf8" });
  assert.equal(tracked.trim(), "");
});
