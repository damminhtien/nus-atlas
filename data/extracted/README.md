# Normalized lecture extractions

Each `<slug>.json` file is the source of truth for a lecture PDF. The matching
`<slug>.md` file is generated for reading and can be regenerated at any time.

The JSON schema is `nus-lecture.v1` and keeps:

- stable `sourceId` and 1-based `page` numbers;
- normalized `type` values such as `heading`, `paragraph`, `equation`, `table`, and `image`;
- parser coordinates in `bbox` with an explicit coordinate space;
- stable `imageId` values and parser `source.rawRef` metadata;
- per-page status and review reasons showing whether PyMuPDF, Docling, or MinerU supplied the blocks.

PyMuPDF is the default Intel-safe primary parser because it keeps text/image bounding
boxes without importing Transformer or PyTorch. Docling and MinerU are explicit,
optional fallbacks for a compatible runtime; flagged formula and diagram pages still
require visual QA.

Run `python3 scripts/pdf_pipeline.py --help` for the extraction command. Raw PDFs
remain in `/Users/macbook/Desktop/NUS` and are not copied into this repository.
