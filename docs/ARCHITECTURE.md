# Atlas architecture

Atlas is being migrated incrementally from a static IIFE registry to package-based
content. The migration keeps the current browser app working while making the
content boundary explicit.

```text
content/courses/<course>/
  course.json
  modules/*.json
  lessons/*.json
  questions/*.json
  artifacts/*.json
  sources.json
  textbook.json
  labs/
        │
        ▼  scripts/content-build.js --all
data/nus/generated/content-manifest.js
        │
        ├── src/core/content-loader.js → data/nus/generated/<course>.js
        │
        ▼
src/core/content-repository.js
        │
        ├── src/core/study-store.js
        ├── src/core/router.js
        ├── src/features/nus/route-table.js
        ├── src/features/nus/presentation.js
        ├── src/features/nus/sql.js
        ├── src/features/nus/simulations.js
        ├── src/features/nus/planner.js
        ├── src/features/nus/exam.js
        ├── src/ui/labs/registry.js
        └── js/nus.js / js/app.js (legacy-compatible views)
```

## Runtime boundary

Views use `window.NUS_REPOSITORY` for courses, lessons, assessments, labs,
visuals, schedule, textbook indexes, and source types. If a package is not available, the adapter
reads the legacy `window.NUS_*` registries. This makes course migration reversible.

The NUS entrypoint injects repository and study-store helpers into feature
modules. Planner owns assessment checklists and reminders; Exam Mode owns
question selection, timer, scoring, and review. Neither feature reads the
content files directly, which keeps course and textbook changes data-driven.

`src/core/router.js` owns only hash parsing and the route lifecycle hooks. The
app shell supplies route rendering and chrome behavior; feature route tables
resolve their own page handlers.

`src/features/nus/presentation.js` contains the escaped HTML presenters for
source badges, formulas, lesson blocks, visual cues, and study-kit sections.
It receives source/visual accessors as dependencies and does not own course
data or learner state.

`src/features/nus/sql.js` and `src/features/nus/simulations.js` own the
DSA5104/DSA5208 interactive state and event binding. Adding another lab follows
the same injected-feature pattern instead of adding more global state to the
NUS entrypoint.

`src/core/study-store.js` owns the browser-local evidence ledger, mastery,
planner tasks, and attempts. The legacy `js/nus-store.js` file is now only a
bootstrap adapter; existing `nus.v1` data is migrated in memory to
`nus.study.v2` and persisted on the next write.

`data/nus/artifacts.js` now publishes `window.NUS_ARTIFACTS`; it does not mutate
lesson objects. The repository joins study-kit artifacts by lesson ID. Questions,
flashcards, homework, and code exercises therefore remain data concerns rather
than renderer-side mutations.

## Adding a migrated course

1. Add `content/courses/<COURSE>/` with the package contract.
2. Run `node scripts/content-build.js --all`.
3. Run `node scripts/validate-content.js`, `node nus-gate.js`, and the tests.

The generated content manifest is metadata-only and is the only package script
loaded by `index.html`. `content-loader.js` fetches the per-course bundle when a
course, lesson, or scoped exam route needs it. The Pages workflow loads every
bundle for prerendering, so browser and static pages still use the same package
shape. Course bundles are excluded from the service worker's eager asset list and
are cached only after they are requested.

The current manifest is intentionally a compatibility bundle. The next loading
slice will separate course metadata from lesson payloads and add on-demand
loading while preserving this fallback path.

Textbook indexes are package data, not lecture content. A textbook chapter or
section is linked by `sourceId` and page, while lecture scope and assessment
priority remain owned by the lesson and assessment packages.

## Build and deploy

The Pages workflow runs:

```text
content-build → contract/tests → NUS gate → Atlas gate → prerender
```

`prerender.js` uses the same repository as the browser and generates generic and
NUS lesson pages. It also emits `asset-manifest.json`; the service worker consumes
that manifest and receives a content-derived cache name during the build.
