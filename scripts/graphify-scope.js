/* Keep Graphify updates explicit and out of generated trees. */
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const scopes = {
  code: ["src", "js", "tools", "scripts", "tests"],
  content: ["content", "schemas"],
  full: ["src", "js", "tools", "scripts", "tests", "content", "schemas", "docs"]
};
const forbidden = /^(?:dist|graphify-out)(?:\/|$)/;
function run(scope = process.argv[2] || "code") {
  if (!scopes[scope]) throw new Error(`Unknown Graphify scope: ${scope}`);
  if (scopes[scope].some(file => forbidden.test(file))) throw new Error(`Forbidden Graphify input in ${scope}`);
  const bin = process.env.GRAPHIFY_BIN || "graphify";
  const root = process.cwd();
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), `nus-atlas-graphify-${scope}-`));
  try {
    for (const relative of scopes[scope]) {
      const source = path.join(root, relative);
      if (fs.existsSync(source)) fs.cpSync(source, path.join(staging, relative), { recursive: true });
    }
    execFileSync(bin, ["update", staging, "--no-cluster"], { stdio: "inherit" });
    const graph = path.join(staging, "graphify-out", "graph.json");
    if (!fs.existsSync(graph)) throw new Error(`Graphify did not create ${graph}`);
    const output = path.join(root, "graphify-out", `${scope}-graph.json`);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.copyFileSync(graph, output);
    console.log(`GRAPHIFY ${scope.toUpperCase()} GREEN · ${output}`);
    return output;
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}
if (require.main === module) run();
module.exports = { scopes, run };
