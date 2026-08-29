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
   transport → async ContentRepository → NUS features and views
```

## Ownership invariants

`architecture/ownership.json` classifies every project area:

- `content/**` and `schemas/**` are canonical, editable truth.
- `src/**`, `tools/**`, `scripts/**`, and `tests/**` are implementation or test source.
- `schemas/**` defines the discriminated runtime payload contract; `scripts/validate-schemas.js`
  checks the compiled representation and namespaced entity keys.
- `dist/**` is a generated deployment artifact and is ignored by Git.
- `data/extracted/**` contains normalized DSA lecture extraction artifacts and remains source data.

The compiler reads canonical JSON and writes only `dist/content/**`. It produces
stable, content-addressed shard names, so a changed lesson invalidates only its
own payload and the manifest references that changed hash. The build never
modifies canonical content.

## Runtime boundary

`src/app/bootstrap.js` is the composition root. It loads the small manifest,
constructs the transport and repository, and exposes the ready promise used by
the app shell. `src/core/content/transport.js` supports `fetch` and the browser
XHR fallback; `src/core/content/repository.js` provides:

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

Feature modules receive repository and study-state accessors from the NUS entry
point. They do not read files directly; they use the repository and composition
boundaries. Interactive labs remain separate from content data.

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
