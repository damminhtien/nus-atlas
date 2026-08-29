# NUS study guide

NUS Atlas is the study layer for AY2026/27 Semester 1. It currently covers DSA5101, DSA5104, DSA5105, and DSA5208. All four are normalized package-backed courses; the dashboard defaults to DSA5208 as the focus course. The app is designed for short study loops: choose a lesson, recall the idea, attempt a prompt, then use the planner or review deck to schedule the next session.

For the DSA5101-specific source boundary and A+ study loop, see [the DSA5101 study guide](DSA5101_STUDY_GUIDE.md).
For the DSA5104-specific source boundary and database-learning loop, see [the DSA5104 study guide](DSA5104_STUDY_GUIDE.md).
For the DSA5208-specific source boundary and distributed-systems learning loop, see [the DSA5208 study guide](DSA5208_STUDY_GUIDE.md).

## Reader experience

Lesson routes are designed as long-form study readers rather than dense dashboards. Source notes use a serif reading face and a constrained line length; controls, metadata, and source labels use a sans-serif face so they remain scannable. The NUS workspace stays in the primary sidebar, while the wider Atlas library is collapsed into an optional reference shelf.

Each lesson begins with a **Read / Work / Reason / Recall** compass. It is a set of in-page landmarks: Read opens lecture notes and formula explanations, Work moves to worked examples, Reason moves to assumption checks, and Recall moves to retrieval prompts. Use **Focus reading** to hide navigation and the source rail; the preference stays local to the browser until you exit it or leave the lesson.

Visual study cues are deliberately abstract mini-diagrams, tables, charts, or screen frames. They identify what a source visual is useful for and retain its source pointer. They do not reproduce raw course slides, screenshots, textbook figures, or other private material.

## Source hierarchy

The source label is part of the data model, not just a UI decoration. A source reference has a `sourceId`, page, `sourceType`, role, and status.

| Type | Meaning | Study priority |
| --- | --- | --- |
| `lecture` | Current syllabus and lecture slides | Primary scope and exam priority |
| `exercise` | Official exercise sheets and worked solutions | Derivation depth; use the A+ source lens to distinguish it from lecture scope |
| `textbook` | Course-textbook derivations and background | Depth; confirm examinability against lecture |
| `ref` | Optional, advanced, draft, or historical support | Useful context, not current lecture authority |

Assessment-derived material remains `ref` with `status: "assessment-derived"`. It records what past papers or public assignment previews test; it does not upgrade a textbook or third-party upload into lecture scope.

For DSA5105, the local IDs are intentionally kept as references only:

- `DSA5105/Ref/week1_DSA5105_lecture1_with_note.pdf` is the annotated Week 1 lecture copy used for the current deep-dive lessons. `DSA5105/Lec1.pdf` remains a local lecture source, but its cover has a DSA5102 label; the data records that anomaly instead of silently presenting it as an official title.
- `DSA5105/Lec1_exercises.pdf` and `DSA5105/Lec1_exercises-solutions.pdf` are `exercise` sources, not lecture sources. The official exercise layer records what must be derived for A+ preparation without expanding the lecture boundary.
- `DSA5105/Textbook.pdf` supplies textbook depth: PAC/risk definitions, SVM margins, PCA, mixture models, and Bellman/RL derivations.
- `DSA5105/Ref/...` supplies optional learning theory, high-dimensional PCA, RL, and GNN reading. The Mathematics of Data Science source is marked `draft`; old or optional material must not define current assessments.

The raw `/Users/macbook/Desktop/NUS` folder is never copied into the repository. The public bundle contains normalized explanations, prompts, source/page metadata, and derived observations only.

## DSA5105 depth tracks

The DSA5105 course page separates the following tracks:

- **Foundations:** Week 1 learning setup, data representation, ERM, OLS, Huber loss, basis models, regularization, softmax, and cross-entropy; then Week 2 generalization and PAC intuition.
- **Exam core:** weighted OLS and uniqueness, SVM dual/KKT/support vectors, LS-SVM and LOO, decision trees, bagging/AdaBoost, neural-network backpropagation, numerical PCA, GMM responsibilities/EM, value iteration, TD(0), replay, and dynamic programming.
- **Unsupervised learning:** kernels, PCA variance/reconstruction/whitening, K-means, GMM, and EM.
- **RL and graphs:** Bellman reasoning, MDP value functions, value iteration, graph kernels, PageRank, spectral clustering, GNN message passing, permutation invariance, and oversmoothing.

Textbook-backed prompts are marked in the lesson source trail and in Exam Mode review. Reference-backed prompts remain visibly optional, so a difficult reference question does not masquerade as a lecture requirement.

### A+ source lens

When a concept has both lecture and exercise evidence, open **Why is this examinable?**. The lens shows four separate groups: lecture scope, official exercise depth, textbook depth, and reference/assessment context. A concept can be lecture-core while its closed-form derivation or eigen analysis is exercise depth; the UI must never collapse those into one citation list.

The data contract is `sourceLens: { status, whyExaminable, lecture, officialExercise, textbook, reference }`. `sourceRefs` answers “where is this stated?”; `sourceLens` answers “what level should I prepare, and why?”.

### Automatic spaced retrieval

Once a lesson reaches 80% evidence mastery, the study store creates a private retrieval schedule. The first prompt is due one day later, then successful high-confidence recalls move through `+3`, `+7`, `+14`, `+30`, and longer intervals. A review session shows at most two questions and does not require reopening the lesson.

The schedule is deliberately conservative: a miss halves the current interval, down to one day; a correct answer with low confidence keeps the current interval; a correct answer with good or high confidence advances it. This keeps Week 1 active through the midterm without turning review into rereading.

## DSA5105 assessment alignment

The local AY2024/25 and AY2025/26 exam PDFs are used as primary assessment evidence for topic coverage. They cover, among other items, K-means/PCA, SVM dual and KKT, neural backpropagation, AdaBoost, MDP/value iteration, spectral clustering, GMM, dynamic programming, PageRank, graph kernels, and LS-SVM. Public previews of Fall 2025 Homework 1/2, 2023 Homework 2/3, and the 2024 midterm are stored only as `assessment-derived` topic signals; their solutions are not copied into the public bundle.

The revision rule is: lecture notes define the required explanation, textbook sections deepen the derivation, and assessment-derived references determine which prompts deserve practice. A topic is marked ready only when the Atlas contains a short explanation, a worked calculation or derivation, a limitation/assumption check, and retrieval questions.

Keep these boundaries explicit: exam scope is not the same as past-exam topics, textbook topics, or the course description. Only an official syllabus, instructor statement, or current lecture source can confirm scope; past papers and assignment previews raise practice priority without upgrading coverage authority.

See [DSA5105_ASSESSMENT_MAP.md](DSA5105_ASSESSMENT_MAP.md) for the detailed evidence-to-lesson matrix and recommended revision order.

## Assessment data contract

Assessment records use `nus.assessment.v2`. The canonical record separates:

- `officialFacts`: weight, timing, format, submission rules, scope, and group policy; each fact owns its `sourceRefs`.
- `studentGuidance`: checklists and planning notes; these are useful study actions, not official requirements.

The compiler projects compatibility fields such as `weight`, `date`, and `checklist` for the runtime. Those fields are generated views; edit the nested canonical facts instead. Timing preserves whether a value is an exact date, date-only, week, course-half, relative trigger, or explicitly pending. Project groups use `groupId`/`groupTotal` rather than inventing an individual weight.

This prevents four common errors: invented submission times, collapsed project/quiz milestones, one citation being reused for unrelated facts, and generic study advice being presented as a rubric. A missing deadline remains pending; a course with no exam uses `schedule.exam: null` and `hasFinalExam: false`.

## Formula and reasoning standard

Every NUS lesson must expose at least one structured formula model. Store the expression as raw LaTeX with an explanation for how to read it, a meaning for each important symbol, and a source class. The renderer sends both block formulas and inline formulas through KaTeX; do not introduce Unicode equations such as `γ`, `Σ`, or `→` into lesson-facing formula text.

The authored-math contract is strict: formulas embedded in any reader-facing text—including slide explanations (`whatYouSee` included), Atlas layers, Socratic prompts/answers, question-bank fields, flashcards, homework, visual hooks, lab derivation steps, and textbook-depth notes—must be delimited with `$...$`, `$$...$$`, `\\(...\\)`, or `\\[...\\]`. Keep bare LaTeX only in dedicated `math.latex` fields. Source extraction blocks remain faithful to the PDF and are not rewritten. `node scripts/validate-latex.js` is a required gate and must pass before a package is deployed.

Each lesson also has at least two critical-thinking prompts. A good prompt asks what the formula assumes, how it can fail, what evidence would change the conclusion, or where a textbook/reference analogy stops. The answer remains short and normalized, while the source/page pointer preserves the distinction between lecture, textbook, and reference depth. Week 1's ungraded practice sheet is kept as optional reference material; it does not silently expand the lecture exam boundary.

## Recommended study loop

1. Open the dashboard and select the current focus lesson.
2. Read the lecture-core section first.
3. Close the page and answer the quick-recall prompt from memory.
4. Use the textbook-depth section for a derivation or worked calculation.
5. Attempt the lesson’s homework prompt before opening the review solution.
6. Run a 5–15 question Exam Mode attempt. Choose **Weak topics** when repairing gaps or **New concepts** when expanding coverage.
7. Send misses to Mistake Clinic, read the misconception cue and source-backed repair, then mark the idea redeemed or retry the weak topic.
8. Use the DSA5105 readiness card to balance coverage with accuracy; a high score on a tiny sample is not exam readiness.
9. Open **Spaced retrieval** for the one or two concepts due today; answer from memory and record confidence.
10. Record confirmed assessment dates in Planner; leave unknown dates pending rather than guessing.

## Adding or editing content

Use a typed source helper in the course data:

```js
source("DSA5105/Textbook.pdf", 31, "textbook", "linear SVM geometry", "course-depth")
```

When adding a DSA5105 question, prefer `content/courses/DSA5105/questions/bank.json` and include metadata plus `sourceRefs`. Do not copy long textbook passages or paste solution sets into the public bundle; write a short normalized explanation and keep the source/page pointer. Run `node scripts/validate-question-bank.js` before rebuilding.

After editing NUS data, run:

```bash
node nus-gate.js
git diff --check
```

The NUS gate checks course allowlisting, lesson/question shape, typed package provenance, assessment invariants, visual references, and raw/private-source markers.
It also checks LaTeX coverage, symbol explanations, source labels, the absence of Unicode formulas, and critical-thinking coverage across all 43 course lessons.
