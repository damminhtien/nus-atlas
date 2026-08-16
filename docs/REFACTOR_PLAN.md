# Refactor plan

The content/runtime refactor is implemented as a strangler migration. New
course work is authored in JSON packages and compiled into lazy deployment
shards; the historical IIFE registry remains only as an explicit migration
input.

## Completed slices

1. Canonical ownership is declared in `architecture/ownership.json`.
2. `tools/content-compiler` reads only `content/**`, validates authored math,
   and emits deterministic content-addressed assets under ignored `dist/`.
3. `src/app/bootstrap.js` is the composition root for the async transport and
   repository.
4. The repository exposes a cold catalog/outline plus lazy course, lesson,
   question, study-kit, assessment, slide, textbook, lab, and source APIs.
5. Runtime content globals and tracked generated bundles were removed. Feature
   registries use `ATLAS_*` composition symbols rather than `window.NUS_*`.
6. Canonical validation, source-boundary checks, deterministic-build tests,
   add/remove-course tests, and cold-start tests run in CI.

## Current package contract

```text
content/courses/<COURSE>/
  course.json
  modules/*.json
  lessons/*.json
  questions/*.json
  artifacts/*.json
  assessments.json
  sources.json
  sources/manifest.json
  labs/index.json
  slides/*.json
  textbook.json
```

The compiler joins these records by stable IDs. `manifest.json` contains only
course metadata, outline metadata, counts, and asset URLs. Lesson bodies,
questions, and study kits use separate hash-addressed files and are fetched only
when a route needs them.

## Operating workflow

For a content change:

```bash
npm run check:architecture
npm run content:build
npm run content:validate
npm test
npm run validate
node prerender.js
git diff --check
```

For a fast affected-course check, use `npm run check:affected`. For a release
gate after the change is committed, use `npm run verify`; the source-clean check
is intentionally expected to pass only when the compiler has not mutated
canonical source.

## Remaining follow-up work

- Replace the remaining monolithic `js/nus.js` view orchestration with injected
  dashboard, course, lesson, and practice controllers.
- Add a browser-level production smoke test for the first route, one lazy lesson
  route, and one practice route after Pages deployment.
- Move the final compatibility-only validators into `tools/migrations` once all
  historical content audits are archived.
- Add schema validation for every discriminated lesson-block variant, not just
  the shared authored-content and provenance contracts.

Work remains on `main`. Each push is validated and deployed by the Pages
workflow; `graphify update . --no-cluster` refreshes the local impact index but
its output is never committed.
