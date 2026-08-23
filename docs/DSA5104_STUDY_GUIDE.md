# DSA5104 study guide

DSA5104 is a normalized, source-backed course package in NUS Atlas and the current dashboard focus course. It applies the same learning architecture as DSA5101 and DSA5105: lecture-first explanations, typed provenance, textbook pointers, official exercise depth, visual labs, contrast drills, homework, and adaptive spaced retrieval.

## Course package

The editable package lives under `content/courses/DSA5104/`. It currently contains seven tracks:

- **Orientation:** data management scope, database systems, and the role of a DBMS.
- **Relational model:** schemas, instances, keys, constraints, and relational algebra intuition.
- **Database design:** ER modeling, mapping to relations, normalization boundaries, and design trade-offs.
- **SQL foundations:** DDL, DML, filtering, grouping, joins, subqueries, and NULL semantics.
- **Query processing:** parsing, optimization, indexes, scans, and execution plans.
- **Transactions and architecture:** atomicity, concurrency, recovery, centralized/distributed deployments, and tiered systems.
- **Semi-structured data:** JSON/XML-style flexibility, schema-on-read, and the relational trade-off.

The supplied Chapter 1 deck is available as a 52-page reader:

`#/nus/slides/DSA5104/dsa5104-chapter1/1`

Each slide keeps page-aware extraction blocks, bounding boxes, image IDs, a compact explanation, textbook pointers, and Socratic prompts. The source layer is collapsed by default so the reader remains useful for learning rather than becoming a citation wall.

## Source boundary

`DSA5104/chapter1.pdf` defines the current lecture scope. The Codex appendix is supplementary lecture material. The Ch02, Ch03, and Ch06 homework-solution folders provide exercise depth for relational modeling, SQL, and ER design. The textbook index points to `Database System Concepts, 7th edition` for background and derivations; it does not silently expand the lecture boundary.

The normalized source manifest is `content/courses/DSA5104/sources/manifest.json`. Raw PDFs and homework files remain outside the repository under `/Users/macbook/Desktop/NUS/DSA5104`; only normalized extraction, page references, and derived study notes are committed.

The current final-exam map is also partial. The supplied lecture sources cover Chapters 1–3; Chapters 4, 5, 9, and the second-half materials (including XML, MongoDB, MapReduce, Spark SQL, and vector databases) remain explicit ingestion targets. Do not read the current lesson list as complete semester coverage until those official sources are added.

Chapter 3's `chap3_mysql_code_in_slides.sql` is cataloged as an official source artifact. SQL Studio can download it for page-faithful MySQL comparison; the interactive runner remains a separate SQLite/WASM practice environment.

## A+ study loop

1. Start at `#/nus/course/DSA5104` and choose one track.
2. Read the lecture-core explanation, then open the source lens to see why the distinction is examinable.
3. Use the visual lab to manipulate the model: map ER entities, trace a query pipeline, or compare schema and execution choices.
4. Run the 30–60 second contrast drill before looking at the worked explanation.
5. Attempt the homework or SQL exercise; treat the official solution as exercise depth, not as a replacement for the lecture concept.
6. Use Exam Mode and Mistake Clinic to repair one misconception at a time.
7. When mastery is recorded, answer only one or two retrieval prompts at `+1`, `+3`, `+7`, `+14`, and later intervals. Retrieval does not require rereading the lesson.

## Content contract

All authored formulas in explanations, Atlas layers, questions, flashcards, homework, visual-learning text, and lab derivation steps must be delimited LaTeX. Bare LaTeX is permitted only in dedicated `math.latex` fields. Source extraction remains faithful to the PDF. Before release, run:

```bash
node scripts/validate-latex.js
node scripts/validate-latex-render.js --course DSA5104
node scripts/validate-question-bank.js
node scripts/validate-slides.js
node nus-gate.js
node gate.js
```

Rebuild the deployable shards with `npm run content:build`; do not hand-edit `dist/content/`, which is generated and ignored.
