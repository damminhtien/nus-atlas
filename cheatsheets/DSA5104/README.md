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
| 1: Part I | SQL logic, NULL/anti-joins, joins, types, scalar subqueries | Division, CTEs, aggregation, ranking | Aggregate ranking, windows, stored programs, relational algebra, SQL keyword table | Constraints, PHP/Python, MongoDB indexes |
| 2: Part II | FDs, keys, BCNF, decomposition tests, XML/DTD | DTD attribute types, XML processing, XSD, XPath, XQuery | XQuery examples, MongoDB schemas, CRUD, aggregation, matching | Array matching and projection, document design, scaling, Spark |

MongoDB index commands and explain statistics are together in column 4 of
page 1. Topic 25 on page 2 points to that column.

| Page | Body text | Code |
| --- | --- | --- |
| 1 | 5.55 pt | 5.05 pt |
| 2 | 5.8 pt | 5.15 pt |

Topic headings use 6.45 pt. Both editions use the fonts' natural proportions
and fit on two A4 portrait pages with column widths matched to the content.

| English label | Nhãn tiếng Việt | Purpose |
| --- | --- | --- |
| WHEN | DÙNG KHI | Identify the task. |
| RULE | QUY TẮC | Find the decision rule or algorithm. |
| PATTERN | MẪU | Find the query, template or code fragment. |
| TRAP | LƯU Ý | Check exceptions and common mistakes. |
| EXAMPLE | VÍ DỤ | Trace inputs and results. |
| COND | ĐIỀU KIỆN | Check preconditions. |

Build both editions with XeLaTeX and the TeX Live fonts Source Sans 3,
Inconsolata and STIX Two Math. Run from this directory:

    latexmk -xelatex -interaction=nonstopmode -halt-on-error -file-line-error \
      -outdir=../../tmp/pdfs/DSA5104 cheatsheet.tex cheatsheet-vi.tex
    cp ../../tmp/pdfs/DSA5104/cheatsheet.pdf cheatsheet.pdf
    cp ../../tmp/pdfs/DSA5104/cheatsheet-vi.pdf cheatsheet-vi.pdf

Apply substantive content edits to both editions so their examples and rules
stay in sync.

Before replacing the compiled copy, check two A4 pages with pdfinfo, render both
with pdftoppm and inspect every column, especially the last lines. Extract text
with pdftotext -layout to check literal operators and the absence of printed
question labels. Recompute changed examples, validate authored math with KaTeX,
then run npm run verify and npm run graphify:content from the repository root.

Raw course PDFs, assignments and datasets remain outside this repository. Their
provenance remains available in the study companions, without taking print space.
