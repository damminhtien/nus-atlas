# DSA5208 study guide

DSA5208 is the current NUS Atlas focus course. The package contains nine source-backed lessons across foundations, event ordering, logical clocks, and compressed timestamps, plus two page-aware readers for the supplied Lecture 0 overview and Lecture 1 times lecture.

## Source boundary

The local source folder currently supplies only:

- `DSA5208/Lec0.pdf` — 16 slides covering assessment/project context, distributed-system motivation, challenges, and the first six lecture themes.
- `DSA5208/Lec1.pdf` — 36 slides covering event histories, happens-before, delivery ordering, physical clocks, Lamport clocks, vector clocks, and differential timestamp storage.

The Atlas preserves each slide's `sourceId`, page, block type, bounding box, image ID, and parser reference in `data/extracted/DSA5208/`. The normalized JSON is the source of truth; the derived Markdown is only a reading view. Raw PDFs remain outside the repository.

The Lec0 roadmap mentions consistency, Spark, MLlib, GPU, and cloud computing. Those topics are represented as explicitly labeled context/frontier notes, not as invented lecture derivations. Add the corresponding official lecture or exercise source before promoting them to core coverage. The textbook and Lamport paper entries are pointers for depth, not substitutes for missing official slides.

## Learning package

Each lesson has lecture-first notes, a source lens, worked reasoning, Socratic questions, contrast drills, flashcards, homework prompts, and a visual lab. The high-value distinctions include:

- computation vs communication and multiprocessor vs multicomputer;
- event order vs wall-clock order and causal precedence vs concurrency;
- non-FIFO vs FIFO vs causal ordering;
- physical vs logical clocks;
- Lamport scalar vs vector time;
- comparable vs incomparable vectors;
- full vs compressed timestamps and quadratic vs linear metadata storage;
- partition-local work vs shuffle, and roadmap context vs supplied derivation.

Use **Focus reading** for the lesson, the two slide-reader routes for parallel source inspection, **Exam Mode** for 5–15 question runs, **Concept contrasts** for 30–60 second distinction drills, and **Spaced retrieval** for one or two due prompts without reopening the lesson.

## Recommended order

1. Read the distributed model and event-history lessons.
2. Prove happens-before edges before using any timestamp.
3. Compare non-FIFO, FIFO, and causal delivery guarantees.
4. Work the NTP calculation, then explain why physical synchronization is not causal proof.
5. Trace Lamport scalar updates and state the one-way guarantee.
6. Trace vector updates and compare vectors componentwise, never lexicographically.
7. Finish with compressed timestamps and their storage/correctness trade-off.
8. Keep the Lec0 roadmap lesson as a scope checkpoint for later official sources.

## Validation

Content authors must preserve typed `sourceRefs` and wrap every authored formula in `$...$`, `$$...$$`, `\\(...\\)`, or `\\[...\\]`. Bare LaTeX is allowed only in dedicated `math.latex` fields; extracted PDF text is preserved as source-layer text. Run:

```bash
node scripts/content-build.js --all
node scripts/validate-latex.js
node scripts/validate-latex-render.js --course DSA5208
node scripts/validate-slides.js
node scripts/validate-contrast-drills.js
node nus-gate.js
node gate.js
```
