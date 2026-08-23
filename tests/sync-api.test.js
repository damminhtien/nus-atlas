const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { originFor, passwordHashParts, verifyPassword } = require("../api/sync");

test("sync CORS keeps the deployed origin and permits loopback development", () => {
  const previous = process.env.ATLAS_SYNC_ORIGIN;
  process.env.ATLAS_SYNC_ORIGIN = "https://damminhtien.github.io";
  try {
    const requestFor = origin => ({ headers: { origin } });
    assert.equal(originFor(requestFor("https://damminhtien.github.io")), "https://damminhtien.github.io");
    assert.equal(originFor(requestFor("http://localhost:3000")), "http://localhost:3000");
    assert.equal(originFor(requestFor("http://127.0.0.1:5173")), "http://127.0.0.1:5173");
    assert.equal(originFor(requestFor("https://example.com")), "");
  } finally {
    if (previous === undefined) delete process.env.ATLAS_SYNC_ORIGIN;
    else process.env.ATLAS_SYNC_ORIGIN = previous;
  }
});

test("sync password verifier accepts the configured scrypt format", () => {
  const previous = process.env.ATLAS_SYNC_PASSWORD_HASH;
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync("test-password", salt, 32, { N: 16384, r: 8, p: 1 });
  process.env.ATLAS_SYNC_PASSWORD_HASH = `scrypt$16384$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
  try {
    assert.ok(passwordHashParts(process.env.ATLAS_SYNC_PASSWORD_HASH));
    assert.equal(verifyPassword("test-password"), true);
    assert.equal(verifyPassword("wrong-password"), false);
  } finally {
    if (previous === undefined) delete process.env.ATLAS_SYNC_PASSWORD_HASH;
    else process.env.ATLAS_SYNC_PASSWORD_HASH = previous;
  }
});

test("sync password verifier rejects malformed hashes", () => {
  const previous = process.env.ATLAS_SYNC_PASSWORD_HASH;
  process.env.ATLAS_SYNC_PASSWORD_HASH = "not-a-scrypt-hash";
  try {
    assert.equal(passwordHashParts(process.env.ATLAS_SYNC_PASSWORD_HASH), null);
    assert.equal(verifyPassword("anything"), false);
  } finally {
    if (previous === undefined) delete process.env.ATLAS_SYNC_PASSWORD_HASH;
    else process.env.ATLAS_SYNC_PASSWORD_HASH = previous;
  }
});

test("sync password verifier supports separate users in one server configuration", () => {
  const previousUsers = process.env.ATLAS_SYNC_USERS_JSON;
  const previousHash = process.env.ATLAS_SYNC_PASSWORD_HASH;
  const makeHash = password => {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
    return `scrypt$16384$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
  };
  process.env.ATLAS_SYNC_USERS_JSON = JSON.stringify({ damminhtien: makeHash("default-password"), secondUser: makeHash("second-password") });
  delete process.env.ATLAS_SYNC_PASSWORD_HASH;
  try {
    assert.equal(verifyPassword("damminhtien", "default-password"), true);
    assert.equal(verifyPassword("seconduser", "second-password"), true);
    assert.equal(verifyPassword("seconduser", "default-password"), false);
    assert.equal(verifyPassword("missing", "second-password"), false);
  } finally {
    if (previousUsers === undefined) delete process.env.ATLAS_SYNC_USERS_JSON;
    else process.env.ATLAS_SYNC_USERS_JSON = previousUsers;
    if (previousHash === undefined) delete process.env.ATLAS_SYNC_PASSWORD_HASH;
    else process.env.ATLAS_SYNC_PASSWORD_HASH = previousHash;
  }
});
