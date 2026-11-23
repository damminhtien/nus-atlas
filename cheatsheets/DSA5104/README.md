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
| 2: Part II | FDs, keys, BCNF, decomposition tests, XML/DTD | XML processing, XSD, XPath, XQuery | MongoDB schemas, CRUD, aggregation, matching | Array projection, indexes/schema, Spark |

Body text is 5.61 pt with 5.2 pt leading. Code is 5.28 pt with 4.84 pt leading.
Topic headings use 6.82 pt. Narrower glyphs, shorter code blocks and column
widths matched to the content keep both editions at two A4 portrait pages.

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
