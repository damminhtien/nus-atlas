#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { normalizeDocument } = require('./latex-utils');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..', 'content', 'courses'));

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(filePath);
    return entry.name.endsWith('.json') ? [filePath] : [];
  });
}

for (const filePath of walk(root)) {
  const before = fs.readFileSync(filePath, 'utf8');
  const after = `${JSON.stringify(normalizeDocument(JSON.parse(before)), null, 2)}\n`;
  if (before !== after) fs.writeFileSync(filePath, after);
}

console.log(`LaTeX normalization complete · ${path.relative(process.cwd(), root)}`);
