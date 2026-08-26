const MAX_BODY_BYTES = 20000;
const MAX_QUERY_LENGTH = 16000;
const ALLOWED_ORIGINS = new Set([
  "https://damminhtien.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

let pool;

function originFor(request) {
  const origin = String(request.headers && request.headers.origin || "");
  return ALLOWED_ORIGINS.has(origin) ? origin : "";
}

function sendJson(response, status, body, origin) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  };
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "GET, POST, OPTIONS";
    headers["access-control-allow-headers"] = "content-type";
    headers.vary = "Origin";
  }
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

function queryFor(value) {
  const query = String(value || "").trim();
  if (!query || query.length > MAX_QUERY_LENGTH) throw new Error("A non-empty SQL query is required");
  if (query.includes(";")) throw new Error("Submit one read-only SQL statement at a time");
  if (!/^(select|with|show|describe|desc|explain)\b/i.test(query)) throw new Error("The hosted lab accepts read-only SELECT, CTE, SHOW, DESCRIBE, and EXPLAIN statements");
  if (/\b(insert|update|delete|drop|alter|create|replace|truncate|grant|revoke|call|set|lock|unlock)\b/i.test(query)) throw new Error("Mutating and administrative statements are disabled in the hosted lab");
  return query;
}

function configured() {
  return !!(process.env.DSA5104_MYSQL_URL || (process.env.DSA5104_MYSQL_HOST && process.env.DSA5104_MYSQL_USER && process.env.DSA5104_MYSQL_DATABASE));
}

function getPool() {
  if (pool) return pool;
  if (!configured()) throw new Error("DSA5104 MySQL runner is not configured");
  const mysql = require("mysql2/promise");
  const uri = process.env.DSA5104_MYSQL_URL;
  pool = mysql.createPool(uri || {
    host: process.env.DSA5104_MYSQL_HOST,
    port: Number(process.env.DSA5104_MYSQL_PORT || 3306),
    user: process.env.DSA5104_MYSQL_USER,
    password: process.env.DSA5104_MYSQL_PASSWORD,
    database: process.env.DSA5104_MYSQL_DATABASE,
    connectionLimit: 2,
    waitForConnections: true,
    enableKeepAlive: true,
    connectTimeout: 5000,
    multipleStatements: false
  });
  return pool;
}

function serialise(value) {
  if (value == null) return null;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  return value;
}

async function runQuery(query) {
  const [rows, fields] = await getPool().execute(query);
  const values = Array.isArray(rows) ? rows.map(row => fields.map(field => serialise(row[field.name]))) : [];
  return { columns: fields.map(field => field.name), rows: values, text: [fields.map(field => field.name).join(" | "), ...values.map(row => row.map(value => value == null ? "" : String(value)).join(" | "))].join("\n") };
}

async function handler(request, response) {
  const origin = originFor(request);
  if (request.method === "OPTIONS") return sendJson(response, 204, {}, origin);
  if (request.headers && request.headers.origin && !origin) return sendJson(response, 403, { error: "Origin not allowed" });
  if (request.method === "GET") return sendJson(response, 200, { ok: true, service: "dsa5104-mysql-lab", configured: configured() }, origin);
  if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed" }, origin);
  try {
    const input = await readBody(request);
    const query = queryFor(input.query);
    const result = await runQuery(query);
    return sendJson(response, 200, { ...result, mode: "mysql" }, origin);
  } catch (error) {
    const message = String(error && error.message || "");
    const status = /required|read-only|statement|SQL query/i.test(message) ? 400 : /not configured/i.test(message) ? 503 : 502;
    return sendJson(response, status, { error: status === 400 || status === 503 ? message : "MySQL runner temporarily unavailable" }, origin);
  }
}

module.exports = handler;
module.exports.queryFor = queryFor;
module.exports.configured = configured;
