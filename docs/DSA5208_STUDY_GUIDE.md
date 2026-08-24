# DSA5208 study guide

DSA5208 is the current NUS Atlas focus course. The package contains twelve source-backed lessons across foundations, event ordering, logical clocks, broadcast, synchronizers, and consistency models, organized into three numbered lecture weeks. Lecture 0 is a short orientation preface attached to Week 1; it does not create a fourth week.

Assessment note: the course is 100% project-based with weights 30%, 35%, and 35%; it has no midterm or final exam. The Planner tracks the three projects, while Exam Mode remains practice-only for retrieval.

## Source boundary

The local source folder currently supplies:

- `DSA5208/Lec0.pdf` — 16 slides covering assessment/project context, distributed-system motivation, challenges, and the first six lecture themes.
- `DSA5208/Lec1.pdf` — 36 slides covering event histories, happens-before, delivery ordering, physical clocks, Lamport clocks, vector clocks, and differential timestamp storage.
- `DSA5208/Lec2.pdf` — 58 slides covering broadcast, the shortest-path problem, synchronizers, and the Lecture 2 summary.
- `DSA5208/Lec3.pdf` — 61 slides covering linearizability, sequential consistency, causal consistency, eventual consistency, client-centric consistency guarantees, and database-system examples from MongoDB and ScyllaDB.

The Atlas preserves each slide's `sourceId`, page, block type, bounding box, image ID, and parser reference in `data/extracted/DSA5208/`. The normalized JSON is the source of truth; the derived Markdown is only a reading view. Raw PDFs remain outside the repository.

Consistency is now backed by `DSA5208/Lec3.pdf`. The Lec0 roadmap still mentions Spark, MLlib, GPU, and cloud computing as later topics; those remain explicitly labeled context/frontier notes until their official lecture or exercise sources are supplied. The textbook and Lamport paper entries are pointers for depth, not substitutes for missing official slides.

## Weekly scope

The course timeline follows lecture provenance rather than topic-module boundaries:

- Week 1 — `Lec1.pdf`: distributed models, event histories, happens-before, delivery ordering, physical clocks, Lamport clocks, vector clocks, and compressed timestamps. The Lec0 orientation is shown at the start of this week as course context.
- Week 2 — `Lec2.pdf`: broadcast guarantees, distributed shortest paths, and synchronizers.
- Week 3 — `Lec3.pdf`: data-centric consistency, client-centric guarantees, database concerns, and repair mechanisms.

Topic modules remain useful as secondary navigation, but they do not create additional weeks.

## Learning package

Each lesson has lecture-first notes, a source lens, worked reasoning, Socratic questions, contrast drills, flashcards, homework prompts, and a visual lab. The high-value distinctions include:

- computation vs communication and multiprocessor vs multicomputer;
- event order vs wall-clock order and causal precedence vs concurrency;
- non-FIFO vs FIFO vs causal ordering;
- physical vs logical clocks;
- Lamport scalar vs vector time;
- comparable vs incomparable vectors;
- full vs compressed timestamps and quadratic vs linear metadata storage;
- linearizability vs sequential consistency;
- causal consistency vs eventual consistency;
- read-your-writes vs monotonic reads;
- partition-local work vs shuffle, and roadmap context vs supplied derivation.

Use **Focus reading** for the lesson, the four slide-reader routes for parallel source inspection, **Exam Mode** for 5–15 question runs, **Concept contrasts** for 30–60 second distinction drills, and **Spaced retrieval** for one or two due prompts without reopening the lesson.

## Recommended order

1. Read the short Lec0 orientation, then start the Week 1 Lec1 material with the distributed model and event histories.
2. Prove happens-before edges before using any timestamp.
3. Compare non-FIFO, FIFO, and causal delivery guarantees.
4. Work the NTP calculation, then explain why physical synchronization is not causal proof.
5. Trace Lamport scalar updates and state the one-way guarantee.
6. Trace vector updates and compare vectors componentwise, never lexicographically.
7. Finish Week 1 with compressed timestamps and their storage/correctness trade-off.
8. Study the Week 2 Lec2 broadcast, shortest-path, and synchronizer lessons.
9. Compare linearizability, sequential consistency, causal consistency, and eventual consistency from the Week 3 Lec3 material before moving to client-centric guarantees.
10. Use the MongoDB and ScyllaDB pages to separate concern levels, session guarantees, and repair mechanisms.
11. Keep Spark, MLlib, GPU, and cloud as roadmap checkpoints until their official sources arrive.

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
