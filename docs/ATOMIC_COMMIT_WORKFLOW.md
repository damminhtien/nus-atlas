# Atomic commit workflow

NUS Atlas is maintained directly on `main`. Keep commits small enough to review, revert, and deploy independently.

## Before editing

```bash
git switch main
git pull --ff-only origin main
git status --short
```

Existing changes belong to the user. Do not reset, clean, revert, or stage them unless they are part of the current task.

## One slice, one commit

1. Define one narrow outcome.
2. Change only the required files.
3. Run focused tests and validation.
4. Inspect the staged patch.
5. Commit with a clear Conventional Commit subject.

```bash
git add -- src/features/nus/example.js tests/example.test.js
git diff --cached --stat
git diff --cached --check
git diff --cached
git commit -m "fix(nus): preserve lesson context"
```

Use separate commits for implementation, tests, documentation, and release metadata when they are independently useful. For a versioned app release, use `npm run version:bump -- patch -m "..."` and commit the generated metadata separately.

## Finish the request

After all slices for the prompt pass validation:

```bash
git status --short
git log --oneline -n 3
git push origin main
```

Then verify the relevant GitHub Actions run and production surface. Never use `git add .` to hide unrelated work, and never force-push shared `main`.
