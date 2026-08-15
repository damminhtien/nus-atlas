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
  labs/
        │
        ▼  scripts/content-build.js --all
data/nus/generated/content-manifest.js
        │
        ▼
src/core/content-repository.js
        │
        ├── src/features/nus/route-table.js
        ├── src/features/nus/planner.js
        ├── src/features/nus/exam.js
        ├── src/ui/labs/registry.js
        └── js/nus.js / js/app.js (legacy-compatible views)
```

## Runtime boundary

Views use `window.NUS_REPOSITORY` for courses, lessons, assessments, labs,
visuals, schedule, and source types. If a package is not available, the adapter
reads the legacy `window.NUS_*` registries. This makes course migration reversible.

The NUS entrypoint injects repository and study-store helpers into feature
modules. Planner owns assessment checklists and reminders; Exam Mode owns
question selection, timer, scoring, and review. Neither feature reads the
content files directly, which keeps course and textbook changes data-driven.

`data/nus/artifacts.js` now publishes `window.NUS_ARTIFACTS`; it does not mutate
lesson objects. The repository joins study-kit artifacts by lesson ID. Questions,
flashcards, homework, and code exercises therefore remain data concerns rather
than renderer-side mutations.

## Adding a migrated course

1. Add `content/courses/<COURSE>/` with the package contract.
2. Run `node scripts/content-build.js --all`.
3. Run `node scripts/validate-content.js`, `node nus-gate.js`, and the tests.

The generated content manifest is the only package script loaded by `index.html`.
The Pages workflow rebuilds it before prerendering, so a migrated course does not
need a new renderer, service-worker entry, or script tag.

The current manifest is intentionally a compatibility bundle. The next loading
slice will separate course metadata from lesson payloads and add on-demand
loading while preserving this fallback path.

## Build and deploy

The Pages workflow runs:

```text
content-build → contract/tests → NUS gate → Atlas gate → prerender
```

`prerender.js` uses the same repository as the browser and generates generic and
NUS lesson pages. It also emits `asset-manifest.json`; the service worker consumes
that manifest and receives a content-derived cache name during the build.
