# NUS study guide

NUS Atlas is the study layer for AY2026/27 Semester 1. It currently covers DSA5101, DSA5104, DSA5105, and DSA5208. The app is designed for short study loops: choose a lesson, recall the idea, attempt a prompt, then use the planner or review deck to schedule the next session.

## Reader experience

Lesson routes are designed as long-form study readers rather than dense dashboards. Source notes use a serif reading face and a constrained line length; controls, metadata, and source labels use a sans-serif face so they remain scannable. The NUS workspace stays in the primary sidebar, while the wider Atlas library is collapsed into an optional reference shelf.

Each lesson begins with a **Read / Work / Reason / Recall** compass. It is a set of in-page landmarks: Read opens lecture notes and formula explanations, Work moves to worked examples, Reason moves to assumption checks, and Recall moves to retrieval prompts. Use **Focus reading** to hide navigation and the source rail; the preference stays local to the browser until you exit it or leave the lesson.

Visual study cues are deliberately abstract mini-diagrams, tables, charts, or screen frames. They identify what a source visual is useful for and retain its source pointer. They do not reproduce raw course slides, screenshots, textbook figures, or other private material.

## Source hierarchy

The source label is part of the data model, not just a UI decoration. A source reference has a `sourceId`, page, `sourceType`, role, and status.

| Type | Meaning | Study priority |
| --- | --- | --- |
| `lecture` | Current syllabus, lecture slides, or lecture exercises | Primary scope and exam priority |
| `textbook` | Course-textbook derivations and background | Depth; confirm examinability against lecture |
| `ref` | Optional, advanced, draft, or historical support | Useful context, not current lecture authority |

For DSA5105, the local IDs are intentionally kept as references only:

- `DSA5105/Lec1.pdf` and `DSA5105/syllabus.pdf` are lecture/syllabus sources. The local `Lec1.pdf` cover has a DSA5102 label, so the data records that anomaly instead of silently presenting it as an official title.
- `DSA5105/Textbook.pdf` supplies textbook depth: PAC/risk definitions, SVM margins, PCA, mixture models, and Bellman/RL derivations.
- `DSA5105/Ref/...` supplies optional learning theory, high-dimensional PCA, RL, and GNN reading. The Mathematics of Data Science source is marked `draft`; old or optional material must not define current assessments.

The raw `/Users/macbook/Desktop/NUS` folder is never copied into the repository. The public bundle contains normalized explanations, prompts, source/page metadata, and derived observations only.

## DSA5105 depth tracks

The DSA5105 course page separates the following tracks:

- **Foundations:** ERM, loss, generalization, and PAC intuition.
- **Linear and kernel methods:** OLS/ridge/lasso plus textbook SVM margin and support-vector derivations.
- **Unsupervised learning:** kernels, PCA variance/reconstruction, K-means, GMM, and EM.
- **RL and graphs:** Bellman reasoning, MDP value functions, GNN message passing, permutation invariance, and oversmoothing.

Textbook-backed prompts are marked in the lesson source trail and in Exam Mode review. Reference-backed prompts remain visibly optional, so a difficult reference question does not masquerade as a lecture requirement.

## Formula and reasoning standard

Every NUS lesson must expose at least one structured formula model. Store the expression as raw LaTeX with an explanation for how to read it, a meaning for each important symbol, and a source class. The renderer sends both block formulas and inline formulas through KaTeX; do not introduce Unicode equations such as `γ`, `Σ`, or `→` into lesson-facing formula text.

Each lesson also has at least two critical-thinking prompts. A good prompt asks what the formula assumes, how it can fail, what evidence would change the conclusion, or where a textbook/reference analogy stops. The answer remains short and normalized, while the source/page pointer preserves the distinction between lecture, textbook, and reference depth.

## Recommended study loop

1. Open the dashboard and select the current focus lesson.
2. Read the lecture-core section first.
3. Close the page and answer the quick-recall prompt from memory.
4. Use the textbook-depth section for a derivation or worked calculation.
5. Attempt the lesson’s homework prompt before opening the review solution.
6. Run a scoped Exam Mode attempt and use the review deck to schedule the next session.
7. Record confirmed assessment dates in Planner; leave unknown dates pending rather than guessing.

## Adding or editing content

Use a typed source helper in the course data:

```js
source("DSA5105/Textbook.pdf", 31, "textbook", "linear SVM geometry", "course-depth")
```

When adding a DSA5105 question, attach `sourceRefs` if the question comes from a specific source. Do not copy long textbook passages or paste solution sets into the public bundle; write a short normalized explanation and keep the source/page pointer.

After editing NUS data, run:

```bash
node nus-gate.js
node gate.js
git diff --check
```

The NUS gate checks course allowlisting, lesson/question shape, typed DSA5105 provenance, assessment invariants, visual references, and raw/private-source markers.
It also checks LaTeX coverage, symbol explanations, source labels, the absence of Unicode formulas, and critical-thinking coverage across all 22 lessons.
