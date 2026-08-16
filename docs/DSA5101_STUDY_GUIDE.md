# DSA5101 study guide

DSA5101 is now a first-class normalized course package in NUS Atlas. Its four study tracks are backed by page-level provenance, a textbook index, visual-learning labs, contrast drills, flashcards, homework prompts, and the same exam/retrieval infrastructure used by the deeper DSA5105 package.

## Source boundary

The current lecture and assignment PDFs define the course scope. The MMDS textbook is a separate `textbook` layer for explanation and depth; it is never shown as lecture authority. Every authored item keeps a typed `sourceRefs` record with `sourceId`, page, source type, role, and status.

The raw PDFs remain outside the repository under `/Users/macbook/Desktop/NUS/DSA5101`. The committed package contains normalized notes and provenance only.

## Study map

| Track | What to master | Interactive support |
| --- | --- | --- |
| Orientation | Why scale changes the algorithm, memory, and error trade-offs | Scalable-design decision map |
| Frequent itemsets | Support, confidence, lift, downward closure, and rule interpretation | Association-rule reasoning studio |
| MinHash and LSH | Jaccard similarity, signatures, bands, candidate probability, and verification | MinHash-to-LSH trace |
| Ranking and streams | PageRank intuition, sketch summaries, windows, and exact-versus-approximate choices | Ranking and sketch selection lab |

Each track has a source-backed lab, source lens, retrieval questions, flashcards, homework, and a short set of concept contrasts. The twelve extra bank questions are merged into the normalized package, giving 21 prompts across the four lessons.

## A+ study loop

1. Start on the dashboard with DSA5101 selected as the focus course.
2. Read one lesson section and inspect the source lens when a distinction matters.
3. Complete the visual lab by making a choice or tracing the derivation; passive page views do not count as mastery evidence.
4. Do the lesson retrieval prompts and one contrast drill, especially pairs such as support versus confidence or MinHash versus LSH.
5. Use Exam Mode for mixed practice and Mistake Clinic for unresolved concepts.
6. After a concept is mastered, spaced retrieval schedules one or two questions at increasing intervals. A failed recall shortens the interval; a correct, high-confidence recall lengthens it.

## Provenance and authoring

Use `content/courses/DSA5101` as the editable package source. Rebuild the browser payload with `node scripts/content-build.js DSA5101`. Do not hand-edit generated lesson JSON or `data/nus/generated/dsa5101.js`.

Before committing DSA5101 content, run:

```bash
node scripts/validate-question-bank.js
node scripts/validate-contrast-drills.js
node scripts/validate-latex.js
node scripts/validate-latex-render.js --course DSA5101
node nus-gate.js
```

Any formula in an authored explanation, question, answer, flashcard, homework prompt, visual hook, or lab step must be explicitly delimited for KaTeX. Dedicated `math.latex` fields are the only raw-LaTeX exception.
