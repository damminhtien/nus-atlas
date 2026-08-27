#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { applyStudyLayer } = require('./dsa5104-study-layer.js');

const ROOT = path.join(__dirname, '..');
const SETS = [
  ['chapter1', 'dsa5104-chapter1.json', 'Source slide reader for Chapter 1. High-yield notes cover DBMS purpose, abstraction, schema state, design layers, query processing, and transactions.'],
  ['chapter2', 'dsa5104-chapter2.json', 'Source slide reader for Chapter 2. High-yield notes cover keys, relational-algebra operators, joins, set semantics, equivalence, and decomposition.'],
  ['chapter3', 'dsa5104-chapter3.json', 'Source slide reader for Chapter 3. High-yield notes cover DDL, query shape, joins, NULL, aggregation, subqueries, CTEs, and safe mutations.']
];

for (const [chapter, fileName, summary] of SETS) {
  const file = path.join(ROOT, 'content', 'courses', 'DSA5104', 'slides', fileName);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.summary = summary;
  applyStudyLayer(data, chapter);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  const counts = data.slides.reduce((result, slide) => {
    result[slide.studyPriority] = (result[slide.studyPriority] || 0) + 1;
    return result;
  }, {});
  console.log(`${chapter}: ${data.highYieldSlideNumbers.length} high-yield · ${JSON.stringify(counts)}`);
}
