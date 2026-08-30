# DSA5104 study guide

DSA5104 is a normalized, source-backed course package in NUS Atlas and the current dashboard focus course. It applies the same learning architecture as DSA5101 and DSA5105: lecture-first explanations, typed provenance, textbook pointers, official exercise depth, visual labs, contrast drills, homework, and adaptive spaced retrieval.

## Course package

The editable package lives under `content/courses/DSA5104/`. It currently exposes eight learning surfaces across six modules and 17 lessons. The default Exam Mode uses verified, exam-eligible lecture content plus explicitly promoted question-level exceptions; supplementary and source-pending lessons stay visible and remain excluded by default:

- **Orientation:** data management scope, database systems, and the role of a DBMS.
- **Relational model:** schemas, instances, keys, constraints, and relational algebra intuition.
- **SQL:** eight focused Chapter 3 units covering DDL/integrity, query shape, joins, NULL logic, aggregation, nested queries, CTEs, and safe mutations.
- **Database design (supplementary):** ER modeling and mapping to relations, available for project context. Its 31 bank questions are explicitly promoted into Exam Mode; the two authored lesson checks remain outside the default selection.
- **Query processing:** parsing, optimization, indexes, scans, and execution plans.
- **Transactions and architecture:** atomicity, concurrency, recovery, centralized/distributed deployments, and tiered systems.
- **Semi-structured data:** JSON/XML-style flexibility, schema-on-read, and the relational trade-off.
- **Planned / source pending:** exercise-backed previews for Ch4, Ch5, and Ch7. The current 94 bank questions in these previews are explicitly promoted into Exam Mode; future Ch9 and second-half materials remain ledger entries until their official lecture sources are supplied.

The supplied `chapter1.pdf`, `chapter2.pdf`, and `chapter3.pdf` decks define the currently supplied lecture scope. Their page-aware readers are available at:

`#/nus/slides/DSA5104/dsa5104-chapter1/1`

`#/nus/slides/DSA5104/dsa5104-chapter2/1`

`#/nus/slides/DSA5104/dsa5104-chapter3/1`

Each slide keeps page-aware extraction blocks, bounding boxes, image IDs, and textbook pointers. Only high-yield slides carry an Atlas study note with the exam focus and common trap; support, context, and exercise pages remain source-only so the reader does not turn every slide into generated prose. The source layer is collapsed by default.

## Source boundary

`DSA5104/chapter1.pdf`, `DSA5104/chapter2.pdf`, and `DSA5104/chapter3.pdf` define the currently supplied lecture scope. The Codex appendix is supplementary lecture material. All supplied Ch01–Ch07 homework-solution folders are ingested as exercise-depth content: 190 source questions, one per Markdown solution file. The source solutions do not silently upgrade Chapters 4–7 into lecture authority; the textbook index points to `Database System Concepts, 7th edition` for background and derivations.

The normalized source manifest is `content/courses/DSA5104/sources/manifest.json`. Raw PDFs and homework files remain outside the repository under `/Users/macbook/Desktop/NUS/DSA5104`; only normalized extraction, page references, and derived study notes are committed. Homework remains exercise-depth evidence; only the 125 bank questions with an explicit `examEligible: true` flag are admitted to Exam Mode.

The current final-exam map is also partial. The supplied lecture sources cover Chapters 1–3; Chapters 4, 5, 9, and the second-half materials (including XML, MongoDB, MapReduce, Spark SQL, and vector databases) remain explicit ingestion targets. Do not read the current lesson list as complete semester coverage until those official sources are added. `content/courses/DSA5104/assessment-map.json` records this boundary and the provenance of the practice layers.

No real DSA5104 past-year paper was found in the supplied local sources, so the current timed final checkpoint is explicitly synthetic. It is not presented as historical exam material. Use `npm run validate:dsa5104:exam` to check that assessment metadata remains honest.

The verified-lecture revision order is: (1) keys, integrity, and schema state; (2) relational-algebra selection, projection, joins, set semantics, equivalence, and decomposition; (3) SQL DDL and constraints; (4) SELECT-FROM-WHERE, joins, duplicates, NULL, aggregation, and BIG 6; (5) nested queries, SOME/ALL, EXISTS/NOT EXISTS, CTEs, scalar subqueries, and safe mutations. History, application lists, logistics, continuation/result-only pages, and future source-pending chapters are deliberately deprioritized. The exact slide filter is stored in `highYieldSlideNumbers` for each DSA5104 slide set and summarized in `content/courses/DSA5104/assessment-map.json`.

Chapter 2 pages 43–44 now have an explicit bridge lesson section: relational algebra leads to redundancy, bad design, decomposition, and the later Chapter 7 functional-dependency material.

Chapter 3's `chap3_mysql_code_in_slides.sql` and the canonical University database files (`DDL.sql`, `smallRelationsInsertFile.sql`, and `largeRelationsInsertFile.sql`) are cataloged source artifacts. SQL Studio now separates a fast SQLite/WASM Concept Lab from a DSA5104 MySQL Lab. The latter prefers a configured server-side MySQL runner and labels its SQLite compatibility fallback explicitly.

## Project 1

The Plan page includes the teacher-assigned Project 1 brief: 14 read-only SQL queries over the `kaggle_car` database, its `car_sales`, `us_states`, and `vin_info` tables, the exact submission constraints, and the 30-mark breakdown. The Project 1 source brief remains local-only; the 121 MB dataset and personal submission file are not copied into the public bundle. The NUS-atlas study reminder is set for 09:00 on 06 September 2026 (Asia/Singapore) and is explicitly labelled as a user-set reminder, not an official Canvas deadline.

Use `npm run validate:dsa5104:project1` to verify the 14-question structure, marks, schema, provenance, and reminder date.

## A+ study loop

1. Start at `#/nus/course/DSA5104` and choose one current module.
2. Read the high-yield note first. Open support/context pages only when a worked example or source detail is needed.
3. Use the visual lab to manipulate the model: map ER entities, trace a query pipeline, or compare schema and execution choices.
4. Run the 30–60 second contrast drill before looking at the worked explanation.
5. Attempt the homework or SQL exercise; all 190 supplied teacher-solution files from Ch01–Ch07 are ingested as exercise-depth questions. Treat the official solution as exercise depth, not as a replacement for the lecture concept.
6. Use the clearly labeled synthetic checkpoint, Exam Mode, and Mistake Clinic to repair one misconception at a time.
7. When mastery is recorded, answer only one or two retrieval prompts at `+1`, `+3`, `+7`, `+14`, and later intervals. Retrieval does not require rereading the lesson.

## Content contract

All authored formulas in explanations, Atlas layers, questions, flashcards, homework, visual-learning text, and lab derivation steps must be delimited LaTeX. Bare LaTeX is permitted only in dedicated `math.latex` fields. Source extraction remains faithful to the PDF. Before release, run:

```bash
node scripts/validate-latex.js
node scripts/validate-latex-render.js --course DSA5104
node scripts/validate-question-bank.js
node scripts/validate-slides.js
node scripts/validate-dsa5104-sources.js
node scripts/validate-dsa5104-exam.js
node nus-gate.js
```

Rebuild the deployable shards with `npm run content:build`; do not hand-edit `dist/content/`, which is generated and ignored.
