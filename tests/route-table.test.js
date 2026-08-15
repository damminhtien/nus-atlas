const test = require("node:test");
const assert = require("node:assert/strict");
const createNusRouteTable = require("../src/features/nus/route-table.js");

test("NUS route table resolves the feature routes and dashboard default", () => {
  const calls = [];
  const routes = createNusRouteTable({
    dashboard: () => calls.push("dashboard"),
    lesson: parts => calls.push(`lesson:${parts[1]}`)
  });
  routes.resolve([])([]);
  routes.resolve(["lesson", "DSA5105", "dsa5105-erm"])(["lesson", "DSA5105", "dsa5105-erm"]);
  assert.deepEqual(calls, ["dashboard", "lesson:DSA5105"]);
  assert.deepEqual(routes.names(), ["dashboard", "lesson"]);
});

test("unknown NUS route does not resolve to an arbitrary handler", () => {
  const routes = createNusRouteTable({ dashboard: () => {} });
  assert.equal(routes.resolve(["unknown"]), null);
});
