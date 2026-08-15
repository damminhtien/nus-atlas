# NUS Atlas study loop

Gamification in NUS Atlas is a private feedback loop for studying, not a public competition. It should make the next useful action obvious while preserving the distinction between reading, retrieval, practice, and source depth.

## Design principles

- Reward evidence, not page views. Opening a route never awards XP.
- Keep the signal personal. There is no leaderboard, public rank, streak shaming, or score penalty.
- Make rewards idempotent. Every award has a stable `eventId`, so refreshes and repeated clicks cannot duplicate XP.
- Prefer recovery over punishment. A missed question becomes a prompt for another attempt, not a permanent deduction.
- Keep lecture, textbook, and reference content visibly separate in every lab source lens.
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

The NUS ledger owns deduplication and mastery. The existing global store receives only the resulting XP and streak signal through `Store.recordNusEvidence`, so the top-bar level and consistency UI remain coherent.

| Evidence | Default XP | Mastery signal |
| --- | ---: | --- |
| Complete a lesson | 40 | +35% for that lesson |
| Correct Exam Mode recall | 5 | +12% |
| Submit an exam attempt | 15 + 2 per correct, capped at 35 | +15% on the scoped lesson |
| Complete a visual lab | 10 | +18% on the lab lesson |
| Redeem a mistake | 8 | +18% |

These are feedback weights, not grades. They do not alter course marks or assessment records.

Question-level practice is deliberately separate from rewarded recall. Every submitted answer writes a zero-XP `question_attempt` event with its question ID, correctness, skill, misconception cue, and source refs. Correct answers can also create a small recall reward; a miss enters Mistake Clinic until the learner opens the worked repair and marks it redeemed. If the next attempt is correct, the unresolved queue clears automatically. This makes the loop observable without turning every click into a reward.

The DSA5105 bank lives at `content/courses/DSA5105/questions/bank.json`. It is the editable source of truth for the 44-question extension; generated per-lesson JSON and the browser package are reader/build outputs. Each item carries `difficulty`, `skill`, `cognitiveLevel`, `estimatedSeconds`, `misconception`, `visualHook`, and typed `sourceRefs`. Lecture refs define the exam boundary; textbook and `ref` entries deepen or contextualize it.

## Daily quests and recognition

The dashboard selects three small daily quests:

1. Complete one lesson.
2. Retrieve twice in Exam Mode.
3. Make one proof move by submitting an exam, completing a lab, or redeeming a mistake.

Recognition cards show progress toward durable study behaviors such as Retrieval builder, Lab apprentice, DSA5105 explorer, Mastery builder, and Exam ready. Recognition is private and descriptive; it never gates course content.

## Reusable visual-learning contract

Every visual lab in `data/nus/visual-labs.js` declares:

- `learningGoal`: one observable reasoning outcome.
- `sourceRefs`: typed lecture, textbook, or reference pointers.
- `initialState`: the safe default interaction state.
- `check`: a small completion predicate that verifies the reasoning move before reward.
- `type`: a reusable interaction template.
- `explanation`: the short model of what the interaction is showing.
- `reducedMotion`: declares that the template respects the global reduced-motion preference; native controls also provide keyboard support.

`js/nus-components.js` renders the following templates:

| Template | DSA5105 pilot | Reasoning move |
| --- | --- | --- |
| `compare` | ERM train–validation gap | Compare fit with held-out evidence |
| `geometry` | SVM margin | Adjust a boundary and inspect robustness |
| `math-stepper` | PCA | Trace center → covariance → projection |
| `algorithm-trace` | GMM / EM | Alternate E-step and M-step reasoning |
| `event-timeline` | Bellman backup | Separate reward from continuation value |
| `pipeline-builder` | GNN message passing | Build message → aggregate → update |

The contract is intentionally small so future templates such as `ConceptMap`, `DecisionTree`, `AlgorithmTrace`, `DistributionExplorer`, `MistakeClinic`, `ExamReadiness`, and `SourceLens` can share the same source and completion rules.

## Delivery roadmap

### Phase 1 — shipped pilot

- Add the event ledger and idempotent rewards.
- Show daily quests, DSA5105 mastery, and recognition on the dashboard.
- Ship six DSA5105 visual labs with source lenses.
- Log a visual lab only after the learner reaches the final reasoning step or explicitly commits a comparison.

### Phase 2 — deepen practice

- Ship adaptive Exam Mode focus choices: smart mix, weak topics, new concepts, or mixed retrieval, with short 5/10/15-question runs.
- Ship Mistake Clinic, linking a missed question to one corrective explanation, misconception cue, source trail, and retry path.
- Ship the DSA5105 readiness card combining question coverage, answer accuracy, and unresolved repairs.
- Add weekly review missions without adding public rankings or punitive decay.

### Phase 3 — expand across courses

- Reuse `PipelineBuilder` and `EventTimeline` for DSA5208.
- Reuse `ConceptMap` and `DecisionTree` for DSA5101.
- Reuse `CompareLab` and `SourceLens` for DSA5104 SQL and relational design.

## Validation checklist

Before release, run `node nus-gate.js`, `node gate.js`, `node prerender.js`, and `git diff --check`. Verify that a refresh does not duplicate an event, keyboard focus reaches every control, reduced motion removes transitions, and the deployed GitHub Pages route shows the same source labels as the normalized data.
