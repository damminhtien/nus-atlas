# NUS Atlas study loop

Gamification in NUS Atlas is a private feedback loop for studying, not a public competition. It should make the next useful action obvious while preserving the distinction between reading, retrieval, practice, and source depth.

## Design principles

- Reward evidence, not page views. Opening a route never awards XP.
- Keep the signal personal. There is no leaderboard, public rank, streak shaming, or score penalty.
- Make rewards idempotent. Every award has a stable `eventId`, so refreshes and repeated clicks cannot duplicate XP.
- Prefer recovery over punishment. A missed question becomes a prompt for another attempt, not a permanent deduction.
- Keep lecture, official exercise, textbook, and reference content visibly separate in every lab source lens.
- Make interactions keyboard reachable and useful with reduced motion enabled.

## Evidence ledger

`js/nus-store.js` stores the NUS-only ledger under `nus.v1` and preserves the existing task, lesson, and attempt fields. An evidence event has this shape:

```js
{
  eventId: "lesson:dsa5105-erm",
  type: "lesson_complete",
  courseCode: "DSA5105",
  lessonId: "dsa5105-erm",
  xp: 40,
  at: "2026-08-14T00:00:00.000Z",
  meta: { sourceRefs: ["DSA5105/Lec1.pdf"] }
}
```

The canonical DSA ledger owns deduplication, XP, streaks, and mastery. The app shell reads its compact gamification snapshot through the study-store boundary, so there is one source of truth for study progress.

| Evidence | Default XP | Mastery signal |
| --- | ---: | --- |
| Complete a lesson | 40 | +35% for that lesson |
| Correct Exam Mode recall | 5 | +12% |
| Submit an exam attempt | 15 + 2 per correct, capped at 35 | +15% on the scoped lesson |
| Complete a visual lab | 10 | +18% on the lab lesson |
| Redeem a mistake | 8 | +18% |

These are feedback weights, not grades. They do not alter course marks or assessment records.

Question-level practice is deliberately separate from rewarded recall. Every submitted answer writes a zero-XP `question_attempt` event with its question ID, correctness, skill, misconception cue, and source refs. Correct answers can also create a small recall reward; a miss enters Mistake Clinic until the learner opens the worked repair and marks it redeemed. If the next attempt is correct, the unresolved queue clears automatically. This makes the loop observable without turning every click into a reward.

The DSA5105 bank lives at `content/courses/DSA5105/questions/bank.json`; DSA5208 has the same contract at `content/courses/DSA5208/questions/bank.json`. These are the editable source of truth for course-specific extension questions; generated per-lesson JSON and browser packages are reader/build outputs. Each item carries difficulty, skill, cognitive level, misconception, visual hook, and typed `sourceRefs`. Lecture refs define the exam boundary; textbook and `ref` entries deepen or contextualize it.

## NUS surface and progressive disclosure

The NUS experience reduces the engine to feedback that helps the learner decide what to do next:

- Home shows a compact streak, weekly study goal, and the current concept's mastery label.
- A completed lesson shows the evidence gained, concepts strengthened, and whether retrieval has been scheduled.
- Detailed progress, level history, and achievements remain available under `Progress & achievements` rather than competing with the study action.
- Review and Practice are the primary destinations for retrieval, mistakes, contrast drills, and exam preparation. Daily review and custom tests are contextual actions, not duplicate top-level products.

The engine still records XP, levels, streaks, and recognition internally. The interface uses progressive disclosure so gamification supports the learning loop without becoming the lesson's subject.

## Reusable visual-learning contract

Every visual lab in `content/courses/<COURSE>/labs/index.json` declares:

- `learningGoal`: one observable reasoning outcome.
- `sourceRefs`: typed lecture, exercise, textbook, or reference pointers.
- `sourceLens`: the A+ explanation of why a concept is examinable, with separate lecture scope and official exercise depth groups.
- `initialState`: the safe default interaction state.
- `check`: a small completion predicate that verifies the reasoning move before reward.
- `type`: a reusable interaction template.
- `explanation`: the short model of what the interaction is showing.
- `reducedMotion`: declares that the template respects the global reduced-motion preference; native controls also provide keyboard support.

`js/nus-components.js` renders the following templates:

| Template | Package examples | Reasoning move |
| --- | --- | --- |
| `compare` | ERM train–validation gap | Compare fit with held-out evidence |
| `geometry` | SVM margin | Adjust a boundary and inspect robustness |
| `math-stepper` | PCA | Trace center → covariance → projection |
| `algorithm-trace` | GMM / EM | Alternate E-step and M-step reasoning |
| `event-timeline` | Bellman backup | Separate reward from continuation value |
| `pipeline-builder` | GNN message passing | Build message → aggregate → update |
| `concept-map` | Kernel/PCA/cluster; RL/GNN | Select the concept that matches the output and information flow |
| `decision-tree` | Generalization protocol; happens-before checks | Choose validation evidence or prove a causal relation |

All 4 DSA5101, 7 DSA5104, 23 DSA5105, and 9 DSA5208 package lessons now resolve to source-backed visual labs. DSA5208 reuses the same study-kit, source-lens, contrast-drill, Exam Mode, and spaced-retrieval contracts while adding clock/order-specific derivation traces and pipeline previews.

## Delivery roadmap

### Phase 1 — shipped package foundation

- Add the event ledger and idempotent rewards.
- Show a compact study-momentum surface with streak, weekly goal, current-concept mastery, and lesson-completion feedback.
- Ship source-backed visual labs and source lenses for all four normalized course packages.
- Log a visual lab only after the learner reaches the final reasoning step or explicitly commits a comparison.

### Phase 2 — deepen practice

- Ship adaptive Exam Mode focus choices: smart mix, weak topics, new concepts, or mixed retrieval, with short 5/10/15-question runs.
- Ship Mistake Clinic, linking a missed question to one corrective explanation, misconception cue, source trail, and retry path.
- Keep the readiness card course-agnostic, combining question coverage, answer accuracy, and unresolved repairs.
- Add weekly review missions without adding public rankings or punitive decay.

### Phase 3 — expand across remaining courses

- Reuse `PipelineBuilder` and `EventTimeline` for future DSA5208 Spark/consistency lectures as they arrive.
- Reuse `ConceptMap` and `DecisionTree` for DSA5101's new modules and future topics.
- Reuse `CompareLab` and `SourceLens` for DSA5104 SQL and relational design.

## Validation checklist

Before release, run `node nus-gate.js`, `node prerender.js`, and `git diff --check`. Verify that a refresh does not duplicate an event, keyboard focus reaches every control, reduced motion removes transitions, and the deployed GitHub Pages route shows the same source labels as the normalized data.
