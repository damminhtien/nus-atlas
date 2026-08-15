# Refactor plan

Atlas is moving from a large browser-side IIFE registry to a package-oriented
study application. The goal is to add courses, textbook depth, assessments, and
labs by adding data and feature modules—not by editing the app shell.

## What is already in place

- JSON schemas and referential-integrity checks for courses, lessons, sources,
  assessments, questions, artifacts, and labs.
- `ContentRepository` as the runtime boundary, with a legacy adapter for safe
  rollback during migration.
- DSA5105 as the first normalized package. Lesson content, questions, study kits,
  visuals, and labs are joined by IDs; artifacts do not mutate lessons.
- A route table and lab registry with focused tests.
- Planner and Exam Mode extracted from `js/nus.js` into independently testable
  feature modules.
- One generated content manifest shared by browser runtime, prerender, and the
  Pages build. Extracted PDF JSON retains source, page, block, bbox, and image
  provenance.

## Next refactor slices

### 1. Finish the app boundary

Extract the remaining NUS views into `dashboard`, `course`, `lesson`, `sql`, and
`simulations` feature modules. Keep `js/nus.js` responsible only for dependency
injection and route registration. Move the generic Atlas routes in `js/app.js`
behind an `app-shell` and `legacy-atlas` boundary.

### 2. Make study state a core service

`src/core/study-store.js` now provides the contract for lesson completion,
attempts, evidence, mastery, tasks, and migration. Keep localStorage details in
one implementation and pass the service into features. Migration tests protect
learner progress when the state schema changes.

### 3. Add course packages without shell edits

Treat `content/courses/<COURSE>/` as the authoring boundary:

```text
course.json
modules/*.json
lessons/*.json
questions/*.json
artifacts/*.json
assessments.json
sources.json
labs/
```

Adding or removing a course must require only package files plus validation. The
renderer, `index.html`, service worker, and gates should discover package IDs
from generated metadata rather than maintaining course allowlists.

### 4. Separate package metadata from payload

The next build step should emit a small manifest containing course metadata and
asset URLs, then load lesson/question payloads on demand when a course or lesson
opens. Prerender must use the same loader contract. Keep a legacy fallback until
all four current courses are migrated.

### 5. Expand ingestion safely

Use the established PDF flow:

```text
PDF → triage → PyMuPDF JSON → selected Docling/MinerU fallback
    → nus-lecture.v1 → normalized lesson package → gates
```

Textbook material remains `textbook` provenance and is used for depth, not as an
automatic change to lecture scope. Assessment-derived material can prioritize
practice but cannot invent an official date or redefine current lecture truth.
Raw PDFs, textbooks, and personal exports stay outside Git.

## Commit sequence

Keep commits small and independently deployable:

1. `refactor: split remaining NUS views`
2. `refactor: introduce study store contract`
3. `perf: load course payloads on demand`
4. `feat: add textbook chapter index`
5. `test: add package migration and production smoke checks`

Work stays on `main`. Each commit that changes production runs content build,
contract tests, extraction provenance, NUS gate, Atlas gate, prerender, and
`git diff --check`; push to `main` then triggers GitHub Pages deployment.

## Definition of done

- A new course can be added without changing an existing renderer or shell file.
- A textbook chapter can be indexed with source/page/block provenance without
  copying the textbook into the public bundle.
- Removing a course does not crash startup or unrelated routes.
- Planner, exam, labs, and study state are independently testable.
- Browser runtime and prerender resolve content through the same repository API.
- CI validates the package graph before Pages deployment.
