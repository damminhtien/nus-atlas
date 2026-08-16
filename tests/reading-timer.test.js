const test = require("node:test");
const assert = require("node:assert/strict");
const createReadingTimer = require("../src/features/nus/reading-timer.js");

test("reading timer renders a compact, persisted reader control", () => {
  const values = new Map([["nus.reading-timer.v1:slide:DSA5105:week1", JSON.stringify({ elapsed: 3661 })]]);
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  const timer = createReadingTimer({ storage, now: () => 0 });

  assert.equal(timer.format(3661), "1:01:01");
  assert.match(timer.render("slide:DSA5105:week1"), /Reading time/);
  assert.match(timer.render("slide:DSA5105:week1"), /1:01:01/);
  assert.match(timer.render("slide:DSA5105:week1"), /data-nus-timer-toggle/);
});
