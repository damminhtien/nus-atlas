const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const createLabRegistry = require("../src/ui/labs/registry.js");

test("lab registry registers, resolves, and lists renderer plugins", () => {
  const registry = createLabRegistry();
  const renderer = () => "ok";
  registry.register("demo", renderer);
  assert.equal(registry.get("demo"), renderer);
  assert.equal(registry.has("demo"), true);
  assert.deepEqual(registry.types(), ["demo"]);
});

test("lab registry rejects accidental duplicate renderer registration", () => {
  const registry = createLabRegistry();
  registry.register("demo", () => "first");
  assert.throws(() => registry.register("demo", () => "second"), /already registered/);
});

test("every DSA5105 lesson has a source-backed visual lab", () => {
  const window = { NUS_CONTENT: {} };
  new Function("window", fs.readFileSync("data/nus/dsa5105.js", "utf8"))(window);
  new Function("window", fs.readFileSync("data/nus/visual-labs.js", "utf8"))(window);
  const lessons = window.NUS_CONTENT.DSA5105.modules.flatMap(module => module.lessons);
  const labs = new Map(Object.values(window.NUS_VISUAL_LABS).map(lab => [lab.lessonId, lab]));
  assert.equal(lessons.length, 22);
  assert.equal(lessons.filter(lesson => labs.has(lesson.id)).length, 22);
  assert.ok(["concept-map", "decision-tree"].every(type => Object.values(window.NUS_VISUAL_LABS).some(lab => lab.type === type)));
});
