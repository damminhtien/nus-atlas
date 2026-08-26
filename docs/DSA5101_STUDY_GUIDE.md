# DSA5101 study guide

DSA5101 is a source-backed revision package. It connects the supplied lectures, Assignment 1/2 exercise signals, worked calculations, visual labs, flashcards, and retrieval questions without treating generated study prose as course authority.

## Source boundary

The current lecture and assignment PDFs define the course scope. Lecture 3, `Lec3_Clustering.pdf`, is now the canonical clustering source; Lecture 2 remains the official source for MinHash/LSH, and Assignment 1/2 remain exercise evidence, not lecture authority. The MMDS textbook is a separate `textbook` layer for explanation and depth; it is never shown as lecture authority. Every authored item keeps a typed `sourceRefs` record with `sourceId`, page, source type, role, and status.

The raw PDFs remain outside the repository under `/Users/macbook/Desktop/NUS/DSA5101`. The committed package contains normalized notes and provenance only.

## Study map

| Track | What to master | Interactive support |
| --- | --- | --- |
| Orientation | Why scale changes the algorithm, memory, and error trade-offs | Scalable-design decision map |
| Frequent itemsets | Support, confidence, lift, downward closure, and rule interpretation | Association-rule reasoning studio |
| MinHash and LSH | Jaccard similarity, signatures, bands, candidate probability, and verification | MinHash-to-LSH trace |
| Clustering | Hierarchical linkage, K-means, BFR, CURE, and honest evaluation | Clustering method and scale trace |
| Ranking and streams | PageRank intuition plus a cross-track comparison of stream summaries | Ranking and sketch selection lab |
| Assignment 2 · Recommenders | Mean-centered user similarity and latent-factor dot products | Recommenders practice lab |
| Assignment 2 · PageRank | Transition matrices, power iteration, damping, and dangling nodes | PageRank practice lab |
| Assignment 2 · Streams | DGIM, Flajolet–Martin, AMS, and error contracts | Streaming sketches practice lab |
| Assignment 2 · BALANCE | Remaining budgets, tie handling, and optimality guarantees | BALANCE practice lab |

Each lesson has a source-backed lab, source lens, retrieval questions, flashcards, and homework. Assignment 2 is split into four named tracks rather than being represented by one mixed lesson. The lecture → assignment → textbook relationships live in `content/courses/DSA5101/assessment-map.json`; the timed set and mistake-clinic protocol live in `content/courses/DSA5101/practice/dsa5101-timed-mixed-exam.json`.

## Exam-priority signals

The following is the highest-confidence study signal currently available. “Verified” means the topic is present in the supplied official lecture or assignment; it does not guarantee that the same wording appears on the final.

| Priority | Verified source signal | Drill until you can do this cold |
| --- | --- | --- |
| A+ focus · Assignment 1 | Itemsets p.1; MinHash/LSH p.3–4; hierarchical clustering p.6 | Count/prune, separate support-confidence-lift, compute collision probabilities, and execute linkage updates |
| A+ focus · Assignment 2 Q1 | Recommenders p.2–3 | Mean-center ratings, compute cosine, then keep latent-factor dot products separate |
| A+ focus · Assignment 2 Q2 | PageRank p.4 | Choose row/column orientation, run power iterations, and account for damping/dangling mass |
| A+ focus · Assignment 2 Q3–Q4 | DGIM p.5; Flajolet–Martin/AMS p.6 | Identify the target moment, maintain the sketch invariant, and state the approximation/error source |
| A+ focus · Assignment 2 Q5 | BALANCE p.7 | Update remaining budgets, branch ties, and compare every relevant path with OPT |

The final is officially open-book, hardcopies only, 150 minutes, and worth 50%; these facts describe the assessment format, not a detailed topic guarantee. Use the A+ filter in the assessment map to start with the rows above.

## Algorithm consolidation priority

The assessment map ranks the algorithms by verified lecture and assignment signal. Master the following in order, using the lesson calculation, the animation, and then a timed retrieval prompt:

1. A-Priori/downward closure: count, prune, and keep support, confidence, and lift distinct.
2. MinHash/LSH: compute similarity and candidate probability, then verify candidates exactly.
3. Hierarchical linkage/K-means: name the geometry, perform the update, and state the local-optimum caveat.
4. BFR/CURE: classify DS/CS/RS and explain why dispersed representatives preserve shape.
5. Recommenders: separate mean-centered neighborhood prediction from latent-factor dot products.
6. PageRank: fix matrix orientation, run power iteration, and handle damping/dangling mass.
7. DGIM/Flajolet–Martin/AMS: identify the target statistic, maintain the invariant, and state the error source.
8. BALANCE: trace budgets, resolve ties, and distinguish a successful sequence from a guarantee.

Each priority lab now includes a short child-friendly story animation with Play, Next, and Reset controls. These analogies are explicitly marked `intuition-only`; the source-backed equations, assignment pages, and worked answers remain authoritative.

Every core algorithm note follows the same five-part exam template: **Problem definition**, **Assumptions**, **Core invariant**, **Formula/algorithm**, and **Failure modes and common mistakes**. The template keeps the target quantity, validity conditions, update rule, and boundary cases visible together instead of leaving them implicit across separate sections.

## Final-exam coverage status

The package has explicit source-backed lessons for Lecture 3 clustering and all four Assignment 2 tracks. This improves study readiness, but it is not proof of A+ performance: the official Canvas project brief/rubric is still pending retrieval, and the final exam’s detailed topic scope is not stated in the local course-information PDF. Treat the map as an evidence-linked study priority, not an official exam specification.

## A+ study loop

1. Start on the dashboard with DSA5101 selected as the focus course.
2. Read one lesson section and inspect the source lens when a distinction matters.
3. Complete the visual lab by making a choice or tracing the derivation; passive page views do not count as mastery evidence.
4. Do the lesson retrieval prompts and one contrast drill, especially pairs such as support versus confidence or MinHash versus LSH.
5. Use Exam Mode for mixed practice and Mistake Clinic for unresolved concepts.
6. After a concept is mastered, spaced retrieval schedules one or two questions at increasing intervals. A failed recall shortens the interval; a correct, high-confidence recall lengthens it.

## Provenance and authoring

Use `content/courses/DSA5101` as the editable package source. Rebuild the deployable shards with `npm run content:build`. Do not hand-edit `dist/content/`; it is generated and ignored.

Before committing DSA5101 content, run:

```bash
node scripts/validate-question-bank.js
node scripts/validate-contrast-drills.js
node scripts/validate-algorithm-notes.js
node scripts/validate-dsa5101-formulas.js
node scripts/validate-latex.js
node scripts/validate-latex-render.js --course DSA5101
node scripts/validate-extracted.js
node scripts/validate-slides.js --course DSA5101
node scripts/validate-content.js
node scripts/validate-schemas.js
node nus-gate.js
```

Any formula in an authored explanation, question, answer, flashcard, homework prompt, visual hook, or lab step must be explicitly delimited for KaTeX. Dedicated `math.latex` fields are the only raw-LaTeX exception.
