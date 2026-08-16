const test = require("node:test");
const assert = require("node:assert/strict");
const createTransport = require("../src/core/content/transport.js");

test("content transport deduplicates manifest requests and resolves a course asset", async () => {
  let calls = 0;
  const manifest = { schemaVersion: "nus.content-manifest.v3", courses: [{ code: "NEW5100", course: { code: "NEW5100", title: "New package" }, outline: "NEW5100/outline.json", courseAsset: "NEW5100/course.json" }] };
  const transport = createTransport({
    roots: ["content/"],
    fetcher: async url => {
      calls += 1;
      if (url.endsWith("manifest.json")) return { ok: true, status: 200, json: async () => manifest };
      if (url.endsWith("outline.json")) return { ok: true, status: 200, json: async () => ({ modules: [] }) };
      return { ok: true, status: 200, json: async () => ({ course: { code: "NEW5100" }, assessments: [] }) };
    }
  });
  const first = transport.loadManifest();
  const second = transport.loadManifest();
  assert.strictEqual(await first, await second);
  const course = await transport.loadCourse("NEW5100");
  assert.equal(course.course.code, "NEW5100");
  assert.equal(calls, 3);
});
