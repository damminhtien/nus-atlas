# DSA5104 exam cheatsheet

The printable reference is self-contained: it uses task names, decision rules,
defined schemas, reusable queries, local examples and edge cases. Its 26 topics
fit on two A4 portrait pages. It needs no assignment, slide deck or old dataset
beside it.

| File | Purpose |
| --- | --- |
| [cheatsheet.pdf](cheatsheet.pdf) | Print/use in an exam. |
| [cheatsheet.tex](cheatsheet.tex) | Editable source; provenance comments do not print. |
| [COVERAGE.md](COVERAGE.md) | Study/maintenance source map and historical gap-review evidence. |
| [REVIEW.md](REVIEW.md) | Standalone-reference decisions, shared-example contracts and acceptance checks. |

| Page | Column 1 | Column 2 | Column 3 | Column 4 |
| --- | --- | --- | --- | --- |
| 1: Part I | SQL logic, NULL/anti-joins, joins, types | Division, CTEs, aggregation | Ranking, windows, rounding, stored programs | Relational algebra, constraints, PHP/Python |
| 2: Part II | FDs, keys, BCNF, decomposition tests, XML/DTD | XSD, XPath, XQuery | MongoDB schemas, CRUD, aggregation, matching | Array projection, indexes/schema, Spark |

Body text is 5.1 pt with 5.2 pt leading; code is 4.8 pt with 4.9 pt leading.
Topic headers use 6.2 pt. Explicit column breaks preserve the topic order without
stretching text to fill a page. XML/DTD uses the end of page 2 column 1; XSD
continues at the top of column 2.

WHEN identifies the task; RULE gives the decision/algorithm; PATTERN labels
queries, templates or fragments; TRAP marks exceptions; EXAMPLE supplies worked
input/results; COND states a precondition. A topic uses only the roles it needs.

Build with pdfLaTeX from this directory:

    latexmk -pdf -interaction=nonstopmode -halt-on-error -file-line-error \
      -outdir=../../tmp/pdfs/DSA5104 cheatsheet.tex
    cp ../../tmp/pdfs/DSA5104/cheatsheet.pdf cheatsheet.pdf

Before replacing the compiled copy, check two A4 pages with pdfinfo, render both
with pdftoppm and inspect every column, especially the last lines. Extract text
with pdftotext -layout to check literal operators and the absence of printed
question labels. Recompute changed examples, validate authored math with KaTeX,
then run npm run verify and npm run graphify:content from the repository root.

Raw course PDFs, assignments and datasets remain outside this repository. Their
provenance remains available in the study companions, without taking print space.
