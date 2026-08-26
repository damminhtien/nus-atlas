const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const createSqlFeature = require("../src/features/nus/sql.js");

test("SQL Studio renders from the canonical course practice spec", () => {
  const spec = JSON.parse(fs.readFileSync("content/courses/DSA5104/sql-practice.json", "utf8"));
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
  assert.match(root.innerHTML, /SQL Concept Lab/);
  assert.doesNotMatch(root.innerHTML, /not found/);
});

test("SQL Studio exposes a course-faithful University database mode", () => {
  const spec = JSON.parse(fs.readFileSync("content/courses/DSA5104/sql-practice.json", "utf8"));
  assert.deepEqual(Object.keys(spec.modes), ["concept", "mysql"]);
  assert.deepEqual(spec.modes.mysql.schema.map(table => table.name), ["classroom", "department", "course", "instructor", "section", "teaches", "student", "takes", "advisor", "time_slot", "prereq"]);
  assert.equal(spec.modes.mysql.bootstrap.ddlAsset, "assets/nus/dsa5104/university/DDL.sql");
  assert.equal(spec.modes.mysql.execution.preferred, "mysql-api");
  assert.equal(spec.modes.mysql.officialArtifacts.length, 4);
});

test("SQL Studio ignores a result when the user changes exercise while it loads", async () => {
  let route = "#/nus/sql";
  let script;
  let resolveSql;
  const selectionButtons = [
    { dataset: { sqlIndex: "0" }, addEventListener(_event, handler) { this.select = handler; } },
    { dataset: { sqlIndex: "1" }, addEventListener(_event, handler) { this.select = handler; } }
  ];
  const spec = {
    schema: [{ name: "items", columns: ["id INTEGER"] }],
    seed: { items: [[1]] },
    exercises: [
      { id: "one", level: "easy", prompt: "One", starter: "SELECT id FROM items", expected: ["1"], explanation: "one" },
      { id: "two", level: "easy", prompt: "Two", starter: "SELECT id FROM items", expected: ["1"], explanation: "two" }
    ]
  };
  const view = {};
  const documentRef = {
    defaultView: view,
    createElement() {
      script = {};
      return script;
    },
    head: { appendChild() {} }
  };
  const root = {
    innerHTML: "",
    ownerDocument: documentRef,
    querySelectorAll(selector) { return selector === "[data-sql-index]" ? selectionButtons : []; },
    querySelector(selector) {
      if (selector === "#nus-sql-input") return { value: "SELECT id FROM items" };
      return { addEventListener() {} };
    }
  };
  const feature = createSqlFeature({
    root,
    getPractice: () => spec,
    getRoute: () => route,
    pageHead: (_kicker, title) => `<h1>${title}</h1>`,
    card: (title, body) => `<section><h2>${title}</h2>${body}</section>`,
    esc: value => String(value),
    text: value => String(value),
    notFound: () => "<p>not found</p>"
  });

  feature.render();
  const pending = feature.execute(spec.exercises[0]);
  view.initSqlJs = () => new Promise(resolve => { resolveSql = resolve; });
  script.onload();
  await Promise.resolve();
  selectionButtons[1].select();
  resolveSql({ Database: class {
    run() {}
    exec() { return [{ columns: ["id"], values: [["1"]] }]; }
    close() {}
  } });
  await pending;

  assert.doesNotMatch(root.innerHTML, /Looks right/);
  assert.match(root.innerHTML, /Not run/);
});
