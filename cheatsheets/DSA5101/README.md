# DSA5101 exam cheatsheet

- [PDF](cheatsheet.pdf) — two columns on A4 landscape, with a linked topic index.
- [LaTeX source](cheatsheet.tex) — theory, worked examples, typeset questions
  and step-by-step solutions grouped by topic.

The questions keep their original wording, data and requirements. The layout
uses the same text and math fonts as the rest of the sheet and omits marks
and blank answer spaces. When two sources ask the same question, one copy is
shown under both source IDs. Both versions are kept if the task differs.

To rebuild, run from this directory with a current TeX Live installation
including XeLaTeX, latexmk, TikZ and STIX Two. The source is self-contained.

```sh
build_dir="$(mktemp -d)"
latexmk -xelatex -interaction=nonstopmode -halt-on-error -file-line-error \
  -outdir="$build_dir" cheatsheet.tex
```

Review the rendered output before copying `"$build_dir/cheatsheet.pdf"` to
this folder. For each revision, commit the updated LaTeX and the matching
compiled PDF together in a separate commit.
