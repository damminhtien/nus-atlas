const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const indexHtml = fs.readFileSync("index.html", "utf8");
const gateSource = fs.readFileSync("src/core/access-gate.js", "utf8");
const appSource = fs.readFileSync("js/app.js", "utf8");
const styles = fs.readFileSync("css/styles.css", "utf8");

test("access gate blocks the shell until the session passcode is accepted", () => {
  assert.match(indexHtml, /class="access-gate"/);
  assert.match(indexHtml, /id="access-passcode"/);
  assert.match(indexHtml, /src\/core\/access-gate\.js\?v=/);
  assert.ok(indexHtml.indexOf('src="src/core/access-gate.js') < indexHtml.indexOf('src="js/app.js'));
  assert.match(gateSource, /SESSION_KEY = "atlas\.access\.v1"/);
  assert.match(gateSource, /PASSCODE = "658215"/);
  assert.match(gateSource, /ATLAS_ACCESS_READY/);
  assert.match(appSource, /ATLAS_ACCESS_READY/);
  assert.match(styles, /html\.atlas-locked \.shell/);
});

test("access gate exposes an iPhone-like numeric keypad and auto-checks six digits", () => {
  assert.equal((indexHtml.match(/data-access-digit=/g) || []).length, 10);
  assert.match(indexHtml, /data-access-delete/);
  assert.match(gateSource, /input\.value\.length !== PASSCODE\.length/);
  assert.match(gateSource, /input\.value === PASSCODE/);
  assert.match(styles, /\.access-keypad \{ display:grid/);
  assert.match(styles, /\.access-code-dots i\.is-filled/);
});
