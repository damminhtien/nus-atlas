const test = require("node:test");
const assert = require("node:assert/strict");
const createAtlasRouter = require("../src/core/router.js");

test("router parses hash routes without owning rendering", () => {
  const calls = [];
  const router = createAtlasRouter({
    location: { hash: "#/nus/lesson/DSA5105/dsa5105-erm" },
    beforeRoute: parts => calls.push(["before", parts]),
    renderRoute: parts => { calls.push(["render", parts]); return "view"; },
    afterRoute: (parts, result) => calls.push(["after", parts, result])
  });

  assert.deepEqual(router.parseHash("#/course/linear-algebra"), ["course", "linear-algebra"]);
  assert.equal(router.navigate(), "view");
  assert.deepEqual(calls, [
    ["before", ["nus", "lesson", "DSA5105", "dsa5105-erm"]],
    ["render", ["nus", "lesson", "DSA5105", "dsa5105-erm"]],
    ["after", ["nus", "lesson", "DSA5105", "dsa5105-erm"], "view"]
  ]);
});

test("router still runs after-route cleanup when rendering fails", () => {
  const calls = [];
  const router = createAtlasRouter({
    location: { hash: "#/broken" },
    renderRoute: () => { throw new Error("render failed"); },
    afterRoute: parts => calls.push(parts)
  });
  assert.throws(() => router.navigate(), /render failed/);
  assert.deepEqual(calls, [["broken"]]);
});
