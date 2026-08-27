# Exam Mode 2.0

Atlas calls the default route `Practice`. The legacy route `#/nus/exam/...` is
kept for existing links, but it now opens an adaptive practice session unless
the learner explicitly chooses another mode.

## Modes

- **Adaptive practice** ranks eligible questions using due retrievals, unresolved
  mistakes, weak accuracy, novelty, assessment-map priority, current week, and
  difficulty. It avoids repeats and selects a diverse set of skills and topics.
- **Mock exam** uses a declared timed practice plan. It keeps answers and worked
  explanations hidden until submission and does not claim that the plan is an
  official exam paper.
- **Deep practice** generates finite on-demand variations from the local
  deterministic registry. The learner can start another run when more practice
  is needed; Atlas never preloads an infinite question bank.

## Question eligibility and provenance

The selector only includes lessons with `examEligible !== false`. Textbook,
reference, supplementary, and source-pending lessons therefore cannot silently
become exam-scope questions. A generated question carries:

```json
{
  "origin": "generated",
  "generatedFrom": "ridge-spectral-filter",
  "generationSeed": "stable-seed:0",
  "assessmentLayer": "generated-practice",
  "sourceRefs": [{ "sourceType": "lecture", "sourceId": "...", "page": 48 }]
}
```

Generated source references explain the concept lineage; they are not evidence
that the generated wording appeared in an official assessment.

## Grading boundary

MCQs and numeric generator questions are graded locally and deterministically.
Rubric and free-text answers may use the external grader asynchronously, but a
service failure falls back to local feedback and marks the answer as
`self-review`. Only deterministic local grades create mastery evidence.

Results show exact, AI-assisted, and self-review counts, followed by breakdowns
by skill, topic, and cognitive level. Misses can be retried or sent to Review;
completing Practice does not independently schedule spaced retrieval.

## Resume and sync

The study store keeps one compact `activePractice` snapshot containing the
attempt ID, mode, scope, question IDs, generated seeds, answers, current index,
elapsed time, limit, status, and `updatedAt`. It is saved after answer, skip,
navigation, and timer checkpoints. A reload restores the session without
storing question payloads in the sync record.

When two devices contain the same attempt, the sync client merges answer rows
by `questionId` and `answeredAt`, unions question IDs and generated seeds, and
uses the newer attempt metadata. A different attempt ID is selected by
`updatedAt`. Completed history is retained; finishing an attempt only clears
that matching active snapshot.

## Extension point

Add a generator in `src/features/nus/exam-generators.js` only when it has a
stable seed, deterministic answer or explicit rubric, and source references.
Add selection behavior to `src/features/nus/exam-selection.js`; keep lifecycle
changes in `src/features/nus/exam-session.js`. Do not put generated questions
into canonical course JSON or label them as official exam evidence.
