# NUS study data

This directory contains the normalized study layer for AY2026/27 Semester 1. It currently covers 35 lessons across DSA5101, DSA5104, DSA5105, and DSA5208; the normalized DSA5101 and DSA5105 packages contain 4 and 23 lessons respectively.

- `provenance.js` defines the source classes used by the study layer: `lecture`, `exercise`, `textbook`, and `ref`.
- `courses.js`, `schedule.js`, and `assessments.js` hold metadata and a dated NUSMods snapshot.
- `dsa510*.js` holds legacy-compatible lesson notes, practice prompts, and the DSA5104 browser-local SQL lab. DSA5101 and DSA5105 package data adds typed source lenses, labs, question banks, and textbook depth without confusing it with current lecture scope.
- `visuals.js` stores derived observations and `sourceId + page` references for representative slide/diagram/image evidence.

Source classes:

- `lecture`: current local lecture/syllabus material and exam-priority scope.
- `exercise`: official exercise sheets and solutions; derivation depth that must remain distinct from lecture scope.
- `textbook`: course-textbook derivations and background; confirm examinability against lecture.
- `ref`: optional supporting, historical, or assessment-derived reading. Mark draft/old material explicitly and never use it to invent current dates or assessment scope. `assessment-derived` is a status, not a fourth authority class.

The raw `/Users/macbook/Desktop/NUS` folder is an ingestion source, not a repository input. Do not copy raw PDFs, textbooks, Canvas exports, screenshots, or personal/admissions documents into this project. Keep unknown assessment dates as `date: null` and `dateStatus: "pending"`.

Run `node nus-gate.js` after changing these files.

For the study workflow, see [../../docs/NUS_STUDY_GUIDE.md](../../docs/NUS_STUDY_GUIDE.md) and [../../docs/DSA5101_STUDY_GUIDE.md](../../docs/DSA5101_STUDY_GUIDE.md). For production-only verification and the main-only push flow, see [../../docs/PRODUCTION_WORKFLOW.md](../../docs/PRODUCTION_WORKFLOW.md).
