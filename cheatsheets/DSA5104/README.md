# DSA5104 cheatsheet

`cheatsheet.tex` is the editable source; `cheatsheet.pdf` is the compiled copy.
The two-page A4 layout fits all 20 reference topics in the first three columns
of page 1. The fourth column and page 2 are available for new topics.

Body text is 5.1 pt with 5.2 pt leading; SQL/PHP blocks use 4.8 pt with 4.9 pt
leading. Topic headers use 6.2 pt. Columns flow from top to bottom, left to right.

Build with pdfLaTeX to reproduce the checked layout. From this directory:

```sh
latexmk -pdf -interaction=nonstopmode -halt-on-error -file-line-error \
  -outdir=../../tmp/pdfs/DSA5104 cheatsheet.tex
cp ../../tmp/pdfs/DSA5104/cheatsheet.pdf cheatsheet.pdf
```

Append topics inside the existing `multicols*` environment to use the remaining
column on page 1. Replace the final `\null` with another four-column
`multicols*` environment to add content on page 2.
