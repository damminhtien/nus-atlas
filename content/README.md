# Normalized course packages

`content/courses/<COURSE>/` is the source package for migrated NUS courses.
Raw lecture PDFs, textbook PDFs, Canvas exports, and personal documents remain
outside the repository.

Each migrated package keeps the content graph explicit:

- `course.json`, `modules/*.json`, and `lessons/*.json` define curriculum structure.
- `questions/*.json` and `artifacts/*.json` are joined by lesson/question IDs during the build.
- `questions/bank.json` is an extension bank, not a second copy of per-lesson questions. Bank IDs must be globally distinct from question IDs already attached to lessons; `scripts/validate-question-bank.js` rejects duplicate ownership before build/deploy.
- `sources.json` preserves source type, page, role, and status.
- `textbook.json` stores a copyright-safe chapter/section index with textbook page refs;
  it is kept separate from lecture lessons and never includes raw textbook prose.
- `labs/` and `visuals.json` link interactive material without embedding renderer code in lessons.

The deployment artifact under `dist/content/` is generated with:

```bash
npm run content:build
```

The compiler reads only the JSON under `content/` and never writes back into it.
Edit canonical package JSON, then rebuild; never edit `dist/` directly. Legacy
IIFE data under `data/nus/` is migration input only and is not part of the
canonical content pipeline. Run `npm run content:migrate:legacy -- COURSE` only
when intentionally importing an unmigrated course.
