# Content compiler

The compiler reads `content/courses/**` and writes only the deployment artifact.
It never imports `data/nus/**` and never writes to `content/**`.

The output is deterministic, content-addressed JSON under `dist/content/`:

- `manifest.json` is the small catalog loaded at boot.
- `COURSE/outline.json` is metadata-only course navigation.
- `COURSE/lessons/*.hash.json` contains a lesson payload.
- `COURSE/questions/*.hash.json` and `COURSE/study-kits/*.hash.json` are lazy assets.

Legacy import is a separate operation under `tools/migrations/legacy-nus/`.
