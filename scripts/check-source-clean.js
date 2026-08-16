const { execFileSync } = require("child_process");
const tracked = execFileSync("git", ["ls-files", "dist", "data/nus/generated"], { encoding: "utf8" }).trim();
if (tracked) {
  console.error(`Generated runtime artifacts are tracked:\n${tracked}`);
  process.exitCode = 1;
} else {
  console.log("SOURCE CLEAN GREEN · generated runtime artifacts are untracked");
}
