const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("Pages workflow uses Node 24-compatible GitHub Actions", () => {
  const workflow = fs.readFileSync(".github/workflows/pages.yml", "utf8");

  assert.match(workflow, /actions\/checkout@v7/);
  assert.match(workflow, /actions\/setup-node@v7/);
  assert.match(workflow, /actions\/configure-pages@v6/);
  assert.match(workflow, /actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
  assert.equal((workflow.match(/node-version: 24/g) || []).length, 2);
  assert.doesNotMatch(workflow, /actions\/(checkout|setup-node|configure-pages|upload-pages-artifact|deploy-pages)@v[1-4]\b/);
  assert.match(workflow, /GIT_CONFIG_KEY_0: advice\.defaultBranchName/);
  assert.match(workflow, /NODE_OPTIONS: --no-deprecation/);
});
