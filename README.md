# NUS Atlas

**Production:** [https://damminhtien.github.io/nus-atlas/](https://damminhtien.github.io/nus-atlas/)

NUS Atlas is a focused study workspace for AY2026/27 Semester 1. It turns normalized course material into lessons, retrieval practice, exam runs, SQL exercises, distributed-systems simulations, assessment planning, and production-deployed study pages.

## Current curriculum

| Course | Focus | Lessons |
| --- | --- | ---: |
| DSA5101 | Big data foundations, frequent patterns, search, streams | 4 |
| DSA5104 | Data management, relational design, SQL, retrieval | 7 |
| DSA5105 | Machine learning foundations, OLS, SVM/KKT, trees, neural nets, PCA, clustering, RL, DP, graph methods | 23 |
| DSA5208 | Distributed systems, ordering, consistency, Spark | 9 |

The normalized packages currently contain 43 lessons across four courses. The dashboard chooses a recommended course from the learner's last activity, unfinished current-week work, retrieval due items, and assessment urgency; it does not hardcode a focus course. Assessment dates remain explicitly pending when they have not been confirmed.

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
- A quiet study-momentum surface on NUS Home: streak, weekly goal, current-concept mastery, and concise lesson-completion feedback. Page views never award XP.
- Automatic spaced retrieval that schedules mastered concepts for `+1`, `+3`, `+7`, `+14`, and later intervals; each review asks only 1–2 questions and adapts to correctness and confidence.
- Reusable visual-learning labs for ERM comparison, SVM geometry, derivation traces, PCA, GMM/EM, Bellman backups, DP tables, graph kernels, spectral clustering, and GNN message passing.

Useful routes:

```text
#/                         NUS dashboard
#/nus/planner              assessment planner
#/nus/exam                 timed practice
#/nus/review               automatic spaced retrieval queue
#/nus/course/DSA5101       DSA5101 course map
#/nus/lesson/DSA5101/...   DSA5101 lesson study page
#/nus/course/DSA5104       DSA5104 course map
#/nus/lesson/DSA5104/...   DSA5104 lesson study page
#/nus/slides/DSA5104/dsa5104-chapter1/1  DSA5104 Chapter 1 reader
#/nus/course/DSA5105       DSA5105 course map
#/nus/lesson/DSA5105/...   DSA5105 lesson study page
#/nus/course/DSA5208       DSA5208 course map
#/nus/lesson/DSA5208/...   DSA5208 lesson study page
#/nus/slides/DSA5208/dsa5208-lec0/1  DSA5208 Lecture 0 reader
#/nus/slides/DSA5208/dsa5208-lec1/1  DSA5208 Lecture 1 reader
#/nus/sql                  DSA5104 SQL Studio
#/nus/simulations          DSA5208 simulations
```

See [the DSA5101 study guide](docs/DSA5101_STUDY_GUIDE.md), [the DSA5104 study guide](docs/DSA5104_STUDY_GUIDE.md), and [the DSA5208 study guide](docs/DSA5208_STUDY_GUIDE.md) for course-specific source boundaries and A+ study loops. See [the gamification and visual-learning plan](docs/NUS_GAMIFICATION.md) for the event ledger, reward safeguards, component contract, and reusable course templates.
See the [DSA5105 assessment map](docs/DSA5105_ASSESSMENT_MAP.md) for the exam/homework-to-lesson coverage index.
See [cross-device account sync](docs/ACCOUNT_SYNC.md) for the private Vercel storage model, supported Atlas state, and deployment secrets.

On a lesson route, use **Focus reading** to remove the sidebar, top bar, and source rail temporarily. The study compass jumps to the lecture notes, worked examples, assumption checks, or recall prompts without losing your reading position.

## Source policy: lecture, exercise, textbook

DSA5101, DSA5104, DSA5105, and DSA5208 deliberately separate four source classes:

- `lecture`: current syllabus and local lecture material; this is the exam-priority scope.
- `exercise`: official exercise sheets and worked solutions; this is derivation depth, not automatically lecture scope.
- `textbook`: derivations and background from `Textbook.pdf`; useful for depth, but not automatically examinable.
- `ref`: optional, historical, or assessment-derived support. Draft, old, and `assessment-derived` references are marked explicitly and must not redefine current lecture scope or dates.

Every normalized lesson and question uses typed `sourceRefs` with `sourceId`, page, `sourceType`, role, and status. Concept cards and visual derivations can also expose an **A+ source lens** that explains why a topic is examinable and separates lecture scope from official exercise depth. See [the DSA5105 study guide](docs/NUS_STUDY_GUIDE.md), [the DSA5101 study guide](docs/DSA5101_STUDY_GUIDE.md), [the DSA5104 study guide](docs/DSA5104_STUDY_GUIDE.md), [the DSA5208 study guide](docs/DSA5208_STUDY_GUIDE.md), [the source metadata](content/source-types.json), and [the canonical data policy](content/README.md).

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
node prerender.js
git diff --check
```

For local development, do not open `index.html` directly. The canonical content
runtime needs HTTP fetches for the generated manifest and lazy shards:

```bash
npm run dev       # build content shards, then start Vite
npm run build     # generate the deployable Pages artifact in dist/
```

Direct `file://` opening is intentionally not a supported runtime contract.

`nus-gate.js` verifies that all 43 canonical DSA lessons have a LaTeX formula model, formula explanations, source labels, and at least two critical-thinking questions. Canonical course packages keep lecture, textbook, exercise, and reference content visibly separated.

### Strict authored-math rule

Every formula in authored Atlas text must use an explicit math delimiter: `$...$`, `$$...$$`, `\\(...\\)`, or `\\[...\\]`. This applies to slide explanations (including `whatYouSee`), Atlas-layer notes, Socratic questions and answers, question-bank prompts and solutions, flashcards, homework, visual hooks, lesson explanations, and lab derivation steps. Dedicated `math.latex` fields remain raw LaTeX source and are wrapped by the renderer. PDF extraction text, bounding boxes, image IDs, and other source-layer fields are preserved verbatim and are intentionally exempt. Run `node scripts/validate-latex.js`; CI blocks the Pages deployment when an authored raw fragment is found.

The Pages workflow runs `node prerender.js` in CI, creates the static `dist/` artifact, and publishes it through GitHub Pages. `dist/` is generated and ignored.

## Repository map

- `index.html` — app shell and navigation.
- `src/core/content/repository.js` — async catalog, outline, course, and lesson repository.
- `src/core/content/transport.js` — manifest and content-addressed JSON transport.
- `src/app/bootstrap.js` — composition root that loads the catalog before views start.
- `src/app/app-shell.js` — browser shell, navigation lifecycle, and global chrome.
- `src/app/nus-ui.js` — NUS route/view coordinator, constructed by the composition root.
- `src/core/study-store.js` — versioned local DSA study state, evidence, mastery, and migration.
- `src/core/router.js` — framework-free hash route lifecycle used by the app shell.
- `src/features/nus/route-table.js` — NUS route contract.
- `src/features/nus/presentation.js` — reusable NUS lesson/source/visual presenters.
- `src/features/nus/sql.js` / `src/features/nus/simulations.js` — isolated interactive labs.
- `src/features/nus/planner.js` / `src/features/nus/exam.js` — isolated planner and Exam Mode features.
- `src/features/nus/retrieval.js` — adaptive 1–2 question spaced-retrieval session.
- `src/features/nus/retrieval-grader.js` / `api/grade.js` — optional external Gemini grader for textbox answers; the API key stays server-side.
- `src/core/sync-client.js` / `api/sync.js` — authenticated cross-device sync for Atlas-owned study state; browser-profile data is out of scope.
- `src/ui/labs/registry.js` — visual-learning lab plugin registry.
- `src/ui/nus-components.js` — reusable visual-learning lab templates.
- `api/` — server-only API handlers; credentials stay in deployment environment variables.
- `assets/` / `css/` — static source assets and presentation styles.
- `js/` — reserved for migration-only compatibility code; current production runtime is under `src/`.
- `content/courses/` — normalized course packages for DSA5101, DSA5104, DSA5105, and DSA5208.
- `content/` — canonical course packages and source metadata.
- `data/extracted/` — normalized DSA lecture extraction artifacts and reader views.
- `scripts/content-build.js` — thin adapter that compiles canonical packages into ignored `dist/content/` shards.
- `scripts/validate-latex.js` — blocks raw math fragments in authored study content.
- `scripts/latex-utils.js` — shared authored-content normalization and field rules.
- `nus-gate.js` — NUS data, privacy, and provenance gate.

### External textbox grader

The optional `api/grade.js` endpoint is designed for a Vercel deployment. Set `GEMINI_API_KEY` (or `GOOGLE_KEY_API`) only in the service's production environment; never put the key in this repository or the GitHub Pages bundle. The frontend falls back to the existing heuristic check if the external service is unavailable.
- `prerender.js` — CI static-page and sitemap build.
- `VERSION` / `CHANGELOG.md` — canonical release version and dated release history.
- `scripts/version.js` — version check, semantic bump, changelog entry, and cache-busting helper.
- `.github/workflows/pages.yml` — production Pages workflow.
- `docs/` — study and production documentation.

For content changes, start with [content/README.md](content/README.md). For agent tooling and token-efficient source inspection, see [AGENTS.md](AGENTS.md).
