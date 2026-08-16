# NUS Atlas

**Production:** [https://damminhtien.github.io/nus-atlas/](https://damminhtien.github.io/nus-atlas/)

NUS Atlas is a focused study workspace for AY2026/27 Semester 1. It turns normalized course material into lessons, retrieval practice, exam runs, SQL exercises, distributed-systems simulations, assessment planning, and production-deployed study pages.

## Current curriculum

| Course | Focus | Lessons |
| --- | --- | ---: |
| DSA5101 | Big data foundations, frequent patterns, search, streams | 4 |
| DSA5104 | Data management, relational design, SQL, retrieval | 4 |
| DSA5105 | Machine learning foundations, OLS, SVM/KKT, trees, neural nets, PCA, clustering, RL, DP, graph methods | 22 |
| DSA5208 | Distributed systems, ordering, consistency, Spark | 4 |

The study layer currently contains 34 normalized lessons. Assessment dates remain explicitly pending when they have not been confirmed.

## Study tools

- NUS dashboard with today’s focus, progress, exam countdowns, and practice signal.
- Planner with assessment weights, checklists, statuses, and 7/3/1-day reminders.
- Timed Exam Mode with mixed MCQ, short-answer, derivation, calculation, trace, and SQL prompts.
- DSA5104 browser-local SQLite/WASM SQL Studio.
- DSA5208 Lamport/vector-clock, delivery-order, consistency, and Spark-shuffle simulations.
- Lesson study kits with flashcards, homework prompts, and coding exercises.
- LaTeX-rendered formulas with symbol tables, detailed reading notes, and limitation/caveat labels.
- Critical-thinking prompts that challenge assumptions and include strong-answer comparisons.
- Reading-first lesson pages with editorial typography, a four-step Read/Work/Reason/Recall compass, and Focus Reading mode.
- Derived visual study cues that explain what a referenced diagram, table, chart, or screenshot is meant to teach without publishing raw course slides.
- Evidence-based daily quests, a private DSA5105 mastery map, and recognition for retrieval and reasoning habits. Page views never award XP.
- Automatic spaced retrieval that schedules mastered concepts for `+1`, `+3`, `+7`, `+14`, and later intervals; each review asks only 1–2 questions and adapts to correctness and confidence.
- Reusable visual-learning labs for ERM comparison, SVM geometry, derivation traces, PCA, GMM/EM, Bellman backups, DP tables, graph kernels, spectral clustering, and GNN message passing.
- General Atlas remains available at `#/atlas`.

Useful routes:

```text
#/                         NUS dashboard
#/nus/planner              assessment planner
#/nus/exam                 timed practice
#/nus/review               automatic spaced retrieval queue
#/nus/course/DSA5105       course map
#/nus/lesson/DSA5105/...   lesson study page
#/nus/sql                  DSA5104 SQL Studio
#/nus/simulations          DSA5208 simulations
```

See [the gamification and visual-learning plan](docs/NUS_GAMIFICATION.md) for the event ledger, reward safeguards, component contract, and DSA5105 pilot roadmap.
See the [DSA5105 assessment map](docs/DSA5105_ASSESSMENT_MAP.md) for the exam/homework-to-lesson coverage index.

On a lesson route, use **Focus reading** to remove the sidebar, top bar, and source rail temporarily. The study compass jumps to the lecture notes, worked examples, assumption checks, or recall prompts without losing your reading position.

## DSA5105 source policy

DSA5105 deliberately separates four source classes:

- `lecture`: current syllabus and local lecture material; this is the exam-priority scope.
- `exercise`: official exercise sheets and worked solutions; this is derivation depth, not automatically lecture scope.
- `textbook`: derivations and background from `Textbook.pdf`; useful for depth, but not automatically examinable.
- `ref`: optional, historical, or assessment-derived support. Draft, old, and `assessment-derived` references are marked explicitly and must not redefine current lecture scope or dates.

Every DSA5105 lesson and question uses typed `sourceRefs` with `sourceId`, page, `sourceType`, role, and status. Concept cards and visual derivations can also expose an **A+ source lens** that explains why a topic is examinable and separates lecture scope from official exercise depth. See [the DSA5105 study guide](docs/NUS_STUDY_GUIDE.md), [the source metadata](data/nus/provenance.js), and [the normalized data policy](data/nus/README.md).

## Data and privacy

Raw PDFs, textbooks, Canvas exports, screenshots, and personal documents stay outside this repository. The local ingestion folder is `/Users/macbook/Desktop/NUS`; only normalized notes, practice metadata, source/page references, and derived observations belong here.

`graphify-out/` is local-only and ignored by Git. It can be regenerated for code navigation but must not be staged or committed.

## Production workflow

Work directly on `main`:

```bash
git switch main
git pull --ff-only origin main
# edit, commit, and push
git push origin main
```

Every push runs the Pages prerender build. GitHub Pages accepts production deployments from `main`, so a push to `main` runs both build and deploy; other event types only validate the build. Check the [GitHub Actions runs](https://github.com/damminhtien/nus-atlas/actions) and then the production URL above.

See [docs/PRODUCTION_WORKFLOW.md](docs/PRODUCTION_WORKFLOW.md) for the complete release and troubleshooting flow.

### Version and release notes

`VERSION` is the canonical semantic version. Keep it synchronized with `package.json`; the release helper checks this
along with the current `CHANGELOG.md` entry and every first-party JavaScript/CSS cache-busting query in `index.html`.

```bash
npm run version:check
npm run version:bump -- patch -m "Describe the change"
# or: npm run version:bump -- minor -m "Describe the feature"
```

The bump command updates `VERSION`, `package.json`, `CHANGELOG.md`, the app version metadata, and local asset query
strings. The Pages workflow then rebuilds the service-worker cache and deploys `main` automatically.

## Validation

The same checks used by CI can be run locally when needed:

```bash
node scripts/content-build.js --all
node scripts/validate-content.js
node scripts/validate-latex.js
node --test tests/*.test.js
node nus-gate.js
node gate.js
node prerender.js
git diff --check
```

`nus-gate.js` verifies that all 34 NUS lessons have a LaTeX formula model, formula explanations, source labels, and at least two critical-thinking questions. `data/nus/formula-depth.js` contains the shared formula and critique layer; lecture, textbook, and reference content remains visibly separated.

### Strict authored-math rule

Every formula in authored Atlas text must use an explicit math delimiter: `$...$`, `$$...$$`, `\\(...\\)`, or `\\[...\\]`. This applies to slide explanations (including `whatYouSee`), Atlas-layer notes, Socratic questions and answers, question-bank prompts and solutions, flashcards, homework, visual hooks, lesson explanations, and lab derivation steps. Dedicated `math.latex` fields remain raw LaTeX source and are wrapped by the renderer. PDF extraction text, bounding boxes, image IDs, and other source-layer fields are preserved verbatim and are intentionally exempt. Run `node scripts/validate-latex.js`; CI blocks the Pages deployment when an authored raw fragment is found.

The Pages workflow runs `node prerender.js` in CI, creates the static `dist/` artifact, and publishes it through GitHub Pages. `dist/` is generated and ignored.

## Repository map

- `index.html` — app shell and navigation.
- `src/core/content-repository.js` — typed-compatible content boundary and legacy fallback.
- `src/core/content-loader.js` — on-demand loader for generated course payloads.
- `src/core/study-store.js` — versioned local study state, evidence, mastery, and migration.
- `src/core/router.js` — framework-free hash route lifecycle used by the app shell.
- `src/features/nus/route-table.js` — NUS route contract.
- `src/features/nus/presentation.js` — reusable NUS lesson/source/visual presenters.
- `src/features/nus/sql.js` / `src/features/nus/simulations.js` — isolated interactive labs.
- `src/features/nus/planner.js` / `src/features/nus/exam.js` — isolated planner and Exam Mode features.
- `src/features/nus/retrieval.js` — adaptive 1–2 question spaced-retrieval session.
- `src/ui/labs/registry.js` — visual-learning lab plugin registry.
- `js/nus.js` — NUS views using the repository boundary.
- `js/nus-store.js` — local study progress and attempts.
- `js/nus-components.js` — reusable visual-learning lab templates.
- `content/courses/` — normalized course packages; DSA5105 is the pilot.
- `data/nus/` — legacy registries, provenance, and generated content manifest.
- `scripts/content-build.js` — joins package IDs into the browser compatibility bundle.
- `scripts/validate-latex.js` — blocks raw math fragments in authored study content.
- `scripts/latex-utils.js` — shared authored-content normalization and field rules.
- `scripts/normalize-latex.js` — one-time migration helper for JSON content packages.
- `nus-gate.js` — NUS data, privacy, and provenance gate.
- `prerender.js` — CI static-page and sitemap build.
- `VERSION` / `CHANGELOG.md` — canonical release version and dated release history.
- `scripts/version.js` — version check, semantic bump, changelog entry, and cache-busting helper.
- `.github/workflows/pages.yml` — production Pages workflow.
- `docs/` — study and production documentation.

The staged refactor roadmap is in [docs/REFACTOR_PLAN.md](docs/REFACTOR_PLAN.md).

For content changes, start with [data/nus/README.md](data/nus/README.md). For agent tooling and token-efficient source inspection, see [AGENTS.md](AGENTS.md).
