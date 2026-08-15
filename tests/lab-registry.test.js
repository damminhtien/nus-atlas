const test = require("node:test");
const assert = require("node:assert/strict");
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
