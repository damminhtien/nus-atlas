/* Run the smallest safe validation set for the files changed in this checkout. */
const { execFileSync } = require("child_process");

function changedFiles() {
  const explicitBase = process.env.ATLAS_BASE_SHA || process.env.GITHUB_BASE_SHA;
  const args = explicitBase ? ["diff", "--name-only", `${explicitBase}...HEAD`] : ["diff", "--name-only", "HEAD~1", "HEAD"];
  let files = [];
  try { files = execFileSync("git", args, { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean); } catch (_) { files = []; }
  const working = execFileSync("git", ["diff", "--name-only"], { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  return [...new Set([...files, ...working])];
}
function run(command, args) { execFileSync(command, args, { stdio: "inherit" }); }
function main() {
  const files = changedFiles();
  const courses = [...new Set(files.map(file => file.match(/^content\/courses\/([^/]+)/)?.[1]).filter(Boolean))].sort();
  const globalChange = files.length === 0 || files.some(file => /^(src|js|tools|scripts|schemas|tests|package\.json|tsconfig\.json|\.github)\//.test(file) || /^(package\.json|tsconfig\.json)$/.test(file));
  console.log(`AFFECTED CHECK · ${courses.length ? courses.join(", ") : "runtime/config"} · ${globalChange ? "shared surface" : "course content"}`);
  run("npm", ["run", "check:architecture"]);
  run("npm", ["run", "content:build"]);
  run("node", ["scripts/validate-schemas.js"]);
  run("npm", ["test"]);
  return { files, courses, globalChange };
}
if (require.main === module) main();
module.exports = { changedFiles };
