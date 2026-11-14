# DSA5101 exam cheatsheet

- [PDF](cheatsheet.pdf) — two columns on A4 landscape, with a linked topic index.
- [LaTeX source](cheatsheet.tex) — theory, worked examples and verbatim questions
  grouped by topic.

When the exam and an assignment ask the same question, one verbatim copy
is shown under both source IDs. Both versions are kept if the task differs.

The LaTeX source uses vector excerpts of the original questions. Keep these
inputs in the local DSA5101 course folder:

- `DSA5101 Exam Practice Questions.pdf`
- `2425Sem1-DSA5101.pdf`
- `2526Sem1-DSA5101.pdf`
- `Assignments/DSA5101_Assignment_2.pdf`

To rebuild, run from that course folder with a current TeX Live installation
including XeLaTeX, latexmk, TikZ, STIX Two and Source Code Pro. Set
`repo_dir` to the absolute path of your nus-atlas checkout:

```sh
build_dir="$(mktemp -d)"
latexmk -xelatex -interaction=nonstopmode -halt-on-error -file-line-error \
  -outdir="$build_dir" "$repo_dir/cheatsheets/DSA5101/cheatsheet.tex"
```

Review the rendered output before copying `"$build_dir/cheatsheet.pdf"` to
this folder. For each revision, commit the updated LaTeX and the matching
compiled PDF together in a separate commit.
