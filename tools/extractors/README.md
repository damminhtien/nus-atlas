# Generic lecture extraction

`lecture-slides.js` is the only slide-package extractor. It consumes the
normalized page/block JSON produced by the PDF pipeline and writes a canonical
slide-set JSON file. Course-specific study notes, textbook links, and Socratic
prompts are authored in `content/courses/<COURSE>/slides/*.json` after the
mechanical extraction step.

Example:

```bash
node tools/extractors/lecture-slides.js \
  --input data/extracted/DSA5105/lec1_annotated.json \
  --output content/courses/DSA5105/slides/dsa5105-week1-annotated.json \
  --course DSA5105 \
  --source-id DSA5105/Lec1_annotated.pdf \
  --slide-set-id dsa5105-week1-annotated
```
