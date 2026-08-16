const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { readOwnership, ownershipFor } = require("../scripts/check-architecture");

test("canonical, source, legacy, and generated ownership is explicit", () => {
  const ownership = readOwnership();
  assert.equal(ownership.authorityOrder[0], "canonical");
  assert.equal(ownershipFor("content/courses/DSA5105/course.json", ownership.rules).role, "canonical");
  assert.equal(ownershipFor("data/nus/generated/dsa5105.js", ownership.rules).role, "generated");
  assert.equal(ownershipFor("dist/content/manifest.json", ownership.rules).role, "generated");
});

test("legacy generated bundles are not tracked", () => {
  const tracked = execFileSync("git", ["ls-files", "data/nus/generated"], { encoding: "utf8" });
  assert.equal(tracked.trim(), "");
});
