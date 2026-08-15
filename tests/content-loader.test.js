const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

test("content loader fetches a course bundle once and resolves its package", async () => {
  let appended = 0;
  const context = {
    console,
    NUS_CONTENT_PACKAGES: { NEW5100: { code: "NEW5100", asset: "data/nus/generated/new5100.js", version: "abc" } },
    document: {
      createElement() { return {}; },
      head: {
        appendChild(script) {
          appended += 1;
          assert.equal(script.src, "data/nus/generated/new5100.js?v=abc");
          context.NUS_CONTENT_PACKAGES.NEW5100 = { course: { code: "NEW5100" }, content: { modules: [] } };
          script.onload();
        }
      }
    }
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src/core/content-loader.js"), "utf8"), context);

  const first = context.NUS_CONTENT_PACKAGE_LOADER.load("NEW5100");
  const second = context.NUS_CONTENT_PACKAGE_LOADER.load("NEW5100");
  assert.equal((await first).course.code, "NEW5100");
  assert.equal((await second).course.code, "NEW5100");
  assert.equal(appended, 1);
});
