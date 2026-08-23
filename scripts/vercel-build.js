"use strict";

const fs = require("node:fs");
const path = require("node:path");

// The Vercel project hosts only the server-side API. GitHub Pages owns the
// static Atlas build, so do not run the heavyweight Pages prerender here. Vercel
// still requires its configured output directory to contain a static artifact.
function buildServiceShell(outputDirectory = process.env.ATLAS_VERCEL_STATIC_DIR || path.join(__dirname, "..", "dist")) {
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, "index.html"), [
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">',
    "<title>NUS Atlas sync service</title></head>",
    "<body>NUS Atlas sync service.</body></html>"
  ].join(""));
  console.log("NUS Atlas API build: server functions plus static service shell");
}

if (require.main === module) buildServiceShell();

module.exports = { buildServiceShell };
