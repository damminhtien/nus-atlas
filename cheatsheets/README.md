# Cheatsheets

This directory contains the shared LaTeX template and one workspace for each
course currently represented under `content/courses/`:

- `DSA5101/`
- `DSA5104/`
- `DSA5105/`
- `DSA5208/`

Copy `cheatsheet-template.tex` into a course folder as `cheatsheet.tex`, replace
the sample topics with course material, and compile it to `cheatsheet.pdf`.
The sample content demonstrates the layout; it is not a complete sheet for any
course. Keep each finished course sheet and its PDF in the matching folder.

The template uses four fixed columns on each of two A4 portrait pages, with no
global header or footer. Read down each column, then move left to right; content
stays within one column. Topic headers and local condition, trap, and example
callouts use high-contrast colors. Compile with LuaLaTeX to use Source Sans 3,
STIX Two Math, and JetBrains Mono when installed. The source includes TeX-safe
font fallbacks.
