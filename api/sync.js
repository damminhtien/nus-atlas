const { get, put } = require("@vercel/blob");
const crypto = require("node:crypto");

const MAX_BODY_BYTES = 1500000;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const DEFAULT_ORIGINS = new Set([
  "https://damminhtien.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

function originFor(request) {
  const origin = request.headers && request.headers.origin;
  const configured = String(process.env.ATLAS_SYNC_ORIGIN || "").trim();
  const allowed = configured ? new Set([configured]) : DEFAULT_ORIGINS;
  return allowed.has(origin) ? origin : "";
}

function sendJson(response, status, body, origin) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "access-control-allow-origin": origin || "null",
    "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
    "access-control-allow-headers": "authorization, content-type",
    "vary": "Origin"
  };
  response.writeHead(status, headers);
  response.end(JSON.stringify(body));
}

function readBody(request) {
  if (request.body && typeof request.body === "object") return Promise.resolve(request.body);
  return new Promise((resolve, reject) => {
    let size = 0;
    let value = "";
    request.on("data", chunk => {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request is too large"));
        request.destroy();
        return;
      }
      value += chunk;
    });
    request.on("end", () => {
      try { resolve(JSON.parse(value || "{}")); }
      catch { reject(new Error("Request body must be JSON")); }
    });
    request.on("error", reject);
  });
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function signToken(payload) {
  const body = base64Url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", String(process.env.ATLAS_SYNC_SESSION_SECRET || ""))
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(token) {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature || !process.env.ATLAS_SYNC_SESSION_SECRET) return null;
  const expected = crypto.createHmac("sha256", process.env.ATLAS_SYNC_SESSION_SECRET).update(body).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.sub || !Number.isFinite(payload.exp) || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

function passwordHashParts(value) {
  const parts = String(value || "").split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;
  const [_, N, r, p, salt, hash] = parts;
  if (![N, r, p].every(item => /^\d+$/.test(item)) || !/^[0-9a-f]+$/i.test(salt) || !/^[0-9a-f]+$/i.test(hash)) return null;
  return { N: Number(N), r: Number(r), p: Number(p), salt: Buffer.from(salt, "hex"), hash: Buffer.from(hash, "hex") };
}

function verifyPassword(password) {
  const parts = passwordHashParts(process.env.ATLAS_SYNC_PASSWORD_HASH);
  if (!parts || !String(password || "")) return false;
  try {
    const candidate = crypto.scryptSync(String(password), parts.salt, parts.hash.length, { N: parts.N, r: parts.r, p: parts.p });
    return crypto.timingSafeEqual(candidate, parts.hash);
  } catch (_) {
    return false;
  }
}

function usernameFor(value) {
  return String(value || "").trim().toLowerCase();
}

function configuredUsername() {
  return usernameFor(process.env.ATLAS_SYNC_USERNAME || "damminhtien");
}

function tokenFor(username) {
  const now = Math.floor(Date.now() / 1000);
  return signToken({ sub: username, iat: now, exp: now + TOKEN_TTL_SECONDS });
}

function authUsername(request) {
  const header = request.headers && (request.headers.authorization || request.headers.Authorization);
  const token = String(header || "").replace(/^Bearer\s+/i, "");
  const payload = verifyToken(token);
  return payload && payload.sub === configuredUsername() ? payload.sub : null;
}

function statePath(username) {
  return `atlas-sync/v1/${encodeURIComponent(username)}.json`;
}

async function readRemote(username) {
  const result = await get(statePath(username), { access: "private" });
  if (!result || result.statusCode === 404) return null;
  const text = await new Response(result.stream).text();
  const document = JSON.parse(text);
  return document && typeof document === "object" ? document : null;
}

function validState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (value.schemaVersion !== "atlas.sync.v1") return false;
  return JSON.stringify(value).length <= MAX_BODY_BYTES;
}

async function writeRemote(username, state, revision) {
  const document = {
    schemaVersion: "atlas.sync.v1",
    username,
    revision,
    updatedAt: new Date().toISOString(),
    state
  };
  await put(statePath(username), JSON.stringify(document), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 0
  });
  return document;
}

async function handler(request, response) {
  const origin = originFor(request);
  if (request.method === "OPTIONS") return sendJson(response, 204, {}, origin);
  if (request.headers && request.headers.origin && !origin) return sendJson(response, 403, { error: "Origin not allowed" }, "");
  if (request.method === "GET") return sendJson(response, 200, { ok: true, service: "atlas-study-sync" }, origin);
  if (!['POST', 'PUT'].includes(request.method)) return sendJson(response, 405, { error: "Method not allowed" }, origin);
  if (!process.env.ATLAS_SYNC_SESSION_SECRET || !process.env.ATLAS_SYNC_PASSWORD_HASH) return sendJson(response, 503, { error: "Sync authentication is not configured" }, origin);

  try {
    const input = await readBody(request);
    if (request.method === "POST" && input.action === "login") {
      const username = usernameFor(input.username);
      if (username !== configuredUsername() || !verifyPassword(input.password)) return sendJson(response, 401, { error: "Invalid username or password" }, origin);
      const remote = await readRemote(username);
      return sendJson(response, 200, {
        ok: true,
        token: tokenFor(username),
        username,
        revision: remote ? Number(remote.revision) || 0 : 0,
        updatedAt: remote ? remote.updatedAt || null : null,
        state: remote && validState(remote.state) ? remote.state : null
      }, origin);
    }

    const username = authUsername(request);
    if (!username) return sendJson(response, 401, { error: "Authentication required" }, origin);
    const remote = await readRemote(username);
    if (request.method === "POST") {
      return sendJson(response, 200, {
        ok: true,
        revision: remote ? Number(remote.revision) || 0 : 0,
        updatedAt: remote ? remote.updatedAt || null : null,
        state: remote && validState(remote.state) ? remote.state : null
      }, origin);
    }

    if (!validState(input.state)) return sendJson(response, 400, { error: "Invalid Atlas state" }, origin);
    const currentRevision = remote ? Number(remote.revision) || 0 : 0;
    const baseRevision = Number(input.baseRevision);
    if (!Number.isInteger(baseRevision) || baseRevision !== currentRevision) {
      return sendJson(response, 409, {
        error: "Sync conflict",
        revision: currentRevision,
        updatedAt: remote ? remote.updatedAt || null : null,
        state: remote && validState(remote.state) ? remote.state : null
      }, origin);
    }
    const saved = await writeRemote(username, input.state, currentRevision + 1);
    return sendJson(response, 200, { ok: true, revision: saved.revision, updatedAt: saved.updatedAt }, origin);
  } catch (_) {
    return sendJson(response, 502, { error: "Sync service temporarily unavailable" }, origin);
  }
}

module.exports = handler;
module.exports.passwordHashParts = passwordHashParts;
module.exports.verifyPassword = verifyPassword;
