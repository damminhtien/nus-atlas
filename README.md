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
- Reusable visual-learning labs for ERM comparison, SVM geometry, derivation traces, PCA, GMM/EM, Bellman backups, DP tables, graph kernels, spectral clustering, and GNN message passing.
- General Atlas remains available at `#/atlas`.

Useful routes:

```text
#/                         NUS dashboard
#/nus/planner              assessment planner
#/nus/exam                 timed practice
#/nus/course/DSA5105       course map
#/nus/lesson/DSA5105/...   lesson study page
#/nus/sql                  DSA5104 SQL Studio
#/nus/simulations          DSA5208 simulations
```

See [the gamification and visual-learning plan](docs/NUS_GAMIFICATION.md) for the event ledger, reward safeguards, component contract, and DSA5105 pilot roadmap.
See the [DSA5105 assessment map](docs/DSA5105_ASSESSMENT_MAP.md) for the exam/homework-to-lesson coverage index.

On a lesson route, use **Focus reading** to remove the sidebar, top bar, and source rail temporarily. The study compass jumps to the lecture notes, worked examples, assumption checks, or recall prompts without losing your reading position.

## DSA5105 source policy

DSA5105 deliberately separates three source classes:

- `lecture`: current syllabus and local lecture material; this is the exam-priority scope.
- `textbook`: derivations and background from `Textbook.pdf`; useful for depth, but not automatically examinable.
- `ref`: optional, historical, or assessment-derived support. Draft, old, and `assessment-derived` references are marked explicitly and must not redefine current lecture scope or dates.

Every DSA5105 lesson and question uses typed `sourceRefs` with `sourceId`, page, `sourceType`, role, and status. See [the DSA5105 study guide](docs/NUS_STUDY_GUIDE.md), [the source metadata](data/nus/provenance.js), and [the normalized data policy](data/nus/README.md).

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

## Validation

The same checks used by CI can be run locally when needed:

```bash
node scripts/content-build.js --all
node scripts/validate-content.js
node --test tests/*.test.js
node nus-gate.js
node gate.js
node prerender.js
git diff --check
```

`nus-gate.js` verifies that all 34 NUS lessons have a LaTeX formula model, formula explanations, source labels, and at least two critical-thinking questions. `data/nus/formula-depth.js` contains the shared formula and critique layer; lecture, textbook, and reference content remains visibly separated.

The Pages workflow runs `node prerender.js` in CI, creates the static `dist/` artifact, and publishes it through GitHub Pages. `dist/` is generated and ignored.

## Repository map

- `index.html` — app shell and navigation.
- `src/core/content-repository.js` — typed-compatible content boundary and legacy fallback.
- `src/features/nus/route-table.js` — NUS route contract.
- `src/ui/labs/registry.js` — visual-learning lab plugin registry.
- `js/nus.js` — NUS views using the repository boundary.
- `js/nus-store.js` — local study progress and attempts.
- `js/nus-components.js` — reusable visual-learning lab templates.
- `content/courses/` — normalized course packages; DSA5105 is the pilot.
- `data/nus/` — legacy registries, provenance, and generated content manifest.
- `scripts/content-build.js` — joins package IDs into the browser compatibility bundle.
- `nus-gate.js` — NUS data, privacy, and provenance gate.
- `prerender.js` — CI static-page and sitemap build.
- `.github/workflows/pages.yml` — production Pages workflow.
- `docs/` — study and production documentation.

For content changes, start with [data/nus/README.md](data/nus/README.md). For agent tooling and token-efficient source inspection, see [AGENTS.md](AGENTS.md).
