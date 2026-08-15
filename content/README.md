# Normalized course packages

`content/courses/<COURSE>/` is the source package for migrated NUS courses.
Raw lecture PDFs, textbook PDFs, Canvas exports, and personal documents remain
outside the repository.

Each migrated package keeps the content graph explicit:

- `course.json`, `modules/*.json`, and `lessons/*.json` define curriculum structure.
- `questions/*.json` and `artifacts/*.json` are joined by lesson/question IDs during the build.
- `sources.json` preserves source type, page, role, and status.
- `labs/` and `visuals.json` link interactive material without embedding renderer code in lessons.

The browser bundle under `data/nus/generated/` is generated with:

```bash
node scripts/content-build.js DSA5105
```

It is a compatibility artifact. Edit the package JSON, then rebuild; do not edit
the generated file directly. The repository adapter prefers a generated package
and falls back to the legacy IIFE data while a course is being migrated.
