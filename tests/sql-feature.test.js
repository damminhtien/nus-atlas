const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const createSqlFeature = require("../src/features/nus/sql.js");

test("SQL Studio renders from the canonical course practice spec", () => {
  const spec = JSON.parse(fs.readFileSync("content/courses/DSA5104/course.json", "utf8")).sqlPractice;
  const root = {
    innerHTML: "",
    ownerDocument: null,
    querySelectorAll: () => [],
    querySelector: () => ({ addEventListener() {} })
  };
  const feature = createSqlFeature({
    root,
    getPractice: () => spec,
    pageHead: (_kicker, title) => `<h1>${title}</h1>`,
    card: (title, body) => `<section><h2>${title}</h2>${body}</section>`,
    esc: value => String(value),
    text: value => String(value),
    notFound: () => "<p>not found</p>"
  });

  feature.render();

  assert.match(root.innerHTML, /SQL studio/);
  assert.match(root.innerHTML, /Department/);
  assert.match(root.innerHTML, /List every student name/);
  assert.doesNotMatch(root.innerHTML, /not found/);
});
