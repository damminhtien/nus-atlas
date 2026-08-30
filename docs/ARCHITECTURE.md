# Atlas architecture

Atlas has one authoring boundary and one runtime content boundary:

```text
content/courses/<COURSE>/ + schemas/
                │
                ▼  tools/content-compiler
      dist/content/manifest.json
      dist/content/<COURSE>/outline.json
      dist/content/<COURSE>/{course,lessons,questions,study-kits,slides,labs,visuals}/*.<hash>.json
      dist/content/<COURSE>/{textbook,source-manifest}.<hash>.json
                │
                ▼  src/app/bootstrap.js
   transport → async ContentRepository
              + StudyStore + feature factories
                ▼
     startApp({ repository, store, router, features })
                ▼
       app-shell → NUS UI → route features
```

## Ownership invariants

`architecture/ownership.json` classifies every content, build, and runtime area:

- `content/**` and `schemas/**` are canonical, editable truth.
- `src/**`, `tools/**`, `scripts/**`, and `tests/**` are implementation or test source.
- `api/**`, `assets/**`, `css/**`, and the root runtime/build files are explicit source boundaries;
  `js/**` is retained only as a migration/legacy boundary and is not a browser entrypoint.
- `schemas/**` defines the discriminated runtime payload contract; `scripts/validate-schemas.js`
  checks the compiled representation and namespaced entity keys.
- `dist/**` is a generated deployment artifact and is ignored by Git.
- `data/extracted/**` contains normalized DSA lecture extraction artifacts and remains source data.

The compiler reads canonical JSON and writes only `dist/content/**`. It produces
stable, content-addressed shard names, so a changed lesson invalidates only its
own payload and the manifest references that changed hash. The build never
modifies canonical content.

## Runtime boundary

`src/app/bootstrap.js` is the sole browser composition root. It is loaded last
by `index.html`, resolves the registered factories, creates the transport,
repository, study store, and lab components, then calls
`startApp({ repository, store, router, features })`. The app shell and NUS UI
never discover runtime instances from `window.ATLAS_*`; they receive their
dependencies through that call. `src/core/content/transport.js` supports
`fetch` and the browser XHR fallback; `src/core/content/repository.js` provides:

- synchronous catalog and outline metadata for a cold dashboard;
- asynchronous course, lesson, question, study-kit, slide, and textbook loading;
- cached payloads with in-flight request deduplication;
- course-scoped assessments, schedules, slides, textbook indexes, labs, and source metadata.

The dashboard can therefore render course cards and lesson counts without
loading every lesson, slide, textbook, lab, or visual payload. A lesson route
loads one course package and one lesson payload; slide and textbook routes add
their own shard only when opened. Practice routes deliberately load the lesson
shards they need. The service worker installs only eager shell assets and
caches content shards on demand.

`src/app/app-shell.js` owns DOM chrome, access/sync lifecycle, and router
navigation. `src/app/nus-ui.js` owns NUS route/view composition, while
`src/ui/nus-components.js` owns reusable lab rendering. Feature modules receive
repository and study-state accessors from these explicit boundaries. They do not
read files directly or consume runtime globals; interactive labs remain separate
from content data.

## Adding or removing a course

Add a directory under `content/courses/<COURSE>/`, then run:

```bash
npm run content:build
npm run content:validate
npm run check:architecture
npm test
```

No course allowlist in `index.html`, the repository, or the service worker is
required. Removing a course from the canonical directory removes its manifest
entry on the next build; the repository returns `null` for stale deep links and
the remaining catalog still boots.

## Build and deploy

The Pages workflow runs version checks, architecture checks, canonical build and
validation, tests, the DSA provenance gate, and prerendering. `prerender.js`
uses the same canonical compiler and writes the same `dist/content` shards that
the browser loads. The final `dist/` directory is uploaded to GitHub Pages; no
generated content is committed.

Graphify is used for scoped impact analysis and refreshed after source changes,
but schema validation, deterministic build tests, and runtime contract tests
remain the correctness gates.
