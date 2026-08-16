# Content compiler

The compiler reads `content/courses/**` and writes only the deployment artifact.
It never imports `data/nus/**` and never writes to `content/**`.

The output is deterministic, content-addressed JSON under `dist/content/`:

- `manifest.json` is the small catalog loaded at boot.
- `COURSE/outline.json` is metadata-only course navigation.
- `COURSE/lessons/*.hash.json` contains a lesson payload.
- `COURSE/questions/*.hash.json` and `COURSE/study-kits/*.hash.json` are lazy assets.
- `COURSE/slides/*.hash.json`, `COURSE/labs/*.hash.json`, and `COURSE/visuals/*.hash.json` are lazy study assets.
- `COURSE/textbook.*.json` and `COURSE/source-manifest.*.json` are loaded only by their readers/source views.

The domain compiler is `compileCourseSource(source)`. Filesystem access is kept
in `loadCourseSource` and the thin `compileCourse` adapter, so a source object
can be compiled and tested without disk or browser globals.

Legacy import is a separate operation under `tools/migrations/legacy-nus/`.
