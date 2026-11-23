# DSA5104 exam cheatsheet

The printable reference is self-contained: it uses task names, decision rules,
defined schemas, reusable queries, local examples and edge cases. Its 26 topics
fit on two A4 portrait pages. It needs no assignment, slide deck or old dataset
beside it.

| File | Purpose |
| --- | --- |
| [English PDF](cheatsheet.pdf) · [LaTeX source](cheatsheet.tex) | English exam reference. |
| [PDF tiếng Việt](cheatsheet-vi.pdf) · [Mã nguồn LaTeX](cheatsheet-vi.tex) | Tra cứu bằng tiếng Việt. Giữ thuật ngữ chuyên ngành, code và công thức của bản tiếng Anh. |
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

| English label | Nhãn tiếng Việt | Purpose |
| --- | --- | --- |
| WHEN | DÙNG KHI | Identify the task. |
| RULE | QUY TẮC | Find the decision rule or algorithm. |
| PATTERN | MẪU | Find the query, template or code fragment. |
| TRAP | LƯU Ý | Check exceptions and common mistakes. |
| EXAMPLE | VÍ DỤ | Trace inputs and results. |
| COND | ĐIỀU KIỆN | Check preconditions. |

Build the English edition with pdfLaTeX from this directory:

    latexmk -pdf -interaction=nonstopmode -halt-on-error -file-line-error \
      -outdir=../../tmp/pdfs/DSA5104 cheatsheet.tex
    cp ../../tmp/pdfs/DSA5104/cheatsheet.pdf cheatsheet.pdf

Build the Vietnamese edition with XeLaTeX. It uses the TeX Live fonts Source
Sans 3, Inconsolata and STIX Two Math. When editing the content, apply substantive
updates to both editions so their examples and rules stay in sync.

    latexmk -xelatex -interaction=nonstopmode -halt-on-error -file-line-error \
      -outdir=../../tmp/pdfs/DSA5104 cheatsheet-vi.tex
    cp ../../tmp/pdfs/DSA5104/cheatsheet-vi.pdf cheatsheet-vi.pdf

Before replacing the compiled copy, check two A4 pages with pdfinfo, render both
with pdftoppm and inspect every column, especially the last lines. Extract text
with pdftotext -layout to check literal operators and the absence of printed
question labels. Recompute changed examples, validate authored math with KaTeX,
then run npm run verify and npm run graphify:content from the repository root.

Raw course PDFs, assignments and datasets remain outside this repository. Their
provenance remains available in the study companions, without taking print space.
