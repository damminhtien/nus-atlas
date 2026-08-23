const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { passwordHashParts, verifyPassword } = require("../api/sync");

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
