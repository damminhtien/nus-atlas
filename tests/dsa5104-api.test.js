const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/dsa5104-sql.js");

test("DSA5104 MySQL API accepts read-only queries and rejects mutations", () => {
  assert.equal(handler.queryFor("SELECT ID FROM instructor"), "SELECT ID FROM instructor");
  assert.equal(handler.queryFor("WITH x AS (SELECT 1 AS n) SELECT n FROM x"), "WITH x AS (SELECT 1 AS n) SELECT n FROM x");
  assert.throws(() => handler.queryFor("UPDATE instructor SET salary = salary + 1"), /read-only|administrative/);
  assert.throws(() => handler.queryFor("SELECT 1; DROP TABLE instructor"), /one read-only/);
  assert.throws(() => handler.queryFor("SELECT 1;"), /one read-only/);
});

test("DSA5104 MySQL API exposes configuration health without leaking credentials", async () => {
  const response = {
    status: null,
    body: null,
    headers: null,
    writeHead(status, headers) { this.status = status; this.headers = headers; },
    end(body) { this.body = JSON.parse(body); }
  };
  await handler({ method: "GET", headers: { origin: "http://localhost:5173" } }, response);
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.service, "dsa5104-mysql-lab");
  assert.equal(response.body.configured, handler.configured());
  assert.equal(JSON.stringify(response.body).includes("PASSWORD"), false);
});
