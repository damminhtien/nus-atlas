const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { bumpVersion, versionAssetUrl } = require("../scripts/version.js");

const root = path.resolve(__dirname, "..");

test("version bump follows semantic versioning", () => {
  assert.equal(bumpVersion("1.2.3", "patch"), "1.2.4");
  assert.equal(bumpVersion("1.2.3", "minor"), "1.3.0");
  assert.equal(bumpVersion("1.2.3", "major"), "2.0.0");
});

test("versioned assets replace stale cache keys without touching external URLs", () => {
  assert.equal(versionAssetUrl("css/styles.css?v=old", "2.0.0"), "css/styles.css?v=2.0.0");
  assert.equal(versionAssetUrl("src/app.js#section", "2.0.0"), "src/app.js?v=2.0.0#section");
  assert.equal(versionAssetUrl("https://cdn.example.com/app.js", "2.0.0"), "https://cdn.example.com/app.js");
});

test("repository release metadata is synchronized", () => {
  const version = fs.readFileSync(path.join(root, "VERSION"), "utf8").trim();
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.equal(packageJson.version, version);
  assert.match(index, new RegExp(`meta name="atlas-version" content="${version.replace(/\./g, "\\.")}"`));
});
