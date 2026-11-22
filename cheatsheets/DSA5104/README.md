# DSA5104 cheatsheet

[`cheatsheet.tex`](cheatsheet.tex) is the editable source;
[`cheatsheet.pdf`](cheatsheet.pdf) is the compiled copy. The two A4 portrait pages
cover all 41 change groups from the supplied gap review in 26 numbered topics.

| Page | Column 1 | Column 2 | Column 3 | Column 4 |
| --- | --- | --- | --- | --- |
| 1: Part I | SQL logic, NULL, joins, types | Division, CTEs, aggregation | Ranking, windows, stored programs | Relational algebra, constraints, PHP/Python |
| 2: Part II | FDs, keys, BCNF, decomposition tests | XML, DTD/XSD, XPath, XQuery | MongoDB CRUD, aggregation, array matching | Array projection, indexes/schema, Spark |

Body text remains 5.1 pt with 5.2 pt leading; code blocks remain 4.8 pt with
4.9 pt leading. Topic headers use 6.2 pt. Explicit column breaks keep the areas
above together without stretching text to fill the page. Remaining space at the
bottom of the columns is available for later additions.

[`COVERAGE.md`](COVERAGE.md) maps each requested change to its topic and source,
and records the scope of the content and rendering checks.

Build with pdfLaTeX to reproduce the checked layout. From this directory:

```sh
latexmk -pdf -interaction=nonstopmode -halt-on-error -file-line-error \
  -outdir=../../tmp/pdfs/DSA5104 cheatsheet.tex
cp ../../tmp/pdfs/DSA5104/cheatsheet.pdf cheatsheet.pdf
```

After changing content, check the page count with `pdfinfo`, render both pages
with `pdftoppm`, and inspect the columns before replacing the compiled copy.
Raw course PDFs and datasets remain outside this repository.
