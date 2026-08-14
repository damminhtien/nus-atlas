#!/usr/bin/env python3
"""Extract lecture PDFs into a JSON-first, page-aware study source.

The pipeline deliberately keeps parser-specific output in a local work directory.
Only the normalized JSON and its derived Markdown reader view are written to the
tracked output directory.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


def run(command: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=check, text=True, capture_output=True)


def resolve_binary(env_name: str, names: list[str], fallbacks: Iterable[str] = ()) -> str:
    configured = os.environ.get(env_name)
    if configured:
        return configured
    for name in names:
        resolved = shutil.which(name)
        if resolved:
            return resolved
    for fallback in fallbacks:
        if Path(fallback).exists():
            return fallback
    raise FileNotFoundError(
        f"Could not find {env_name}. Set {env_name} or install one of: {', '.join(names)}"
    )


def pdf_pages(pdfinfo: str, pdf_path: Path) -> int:
    result = run([pdfinfo, str(pdf_path)])
    match = re.search(r"^Pages:\s+(\d+)", result.stdout, re.MULTILINE)
    if not match:
        raise RuntimeError(f"pdfinfo did not report a page count for {pdf_path}")
    return int(match.group(1))


def triage_pages(pdftotext: str, pdf_path: Path, page_count: int) -> list[dict[str, Any]]:
    result = run([pdftotext, "-layout", str(pdf_path), "-"])
    raw_pages = result.stdout.split("\f")[:page_count]
    raw_pages += [""] * (page_count - len(raw_pages))
    pages: list[dict[str, Any]] = []
    for index, text in enumerate(raw_pages, start=1):
        compact = re.sub(r"\s+", "", text)
        control_count = sum(ord(char) < 32 and char not in "\n\t\r" for char in text)
        reasons: list[str] = []
        if len(compact) < 24:
            reasons.append("sparse-text")
        if "\ufffd" in text or "\x00" in text:
            reasons.append("replacement-or-null-character")
        if text and control_count / max(len(text), 1) > 0.01:
            reasons.append("control-character-density")
        pages.append(
            {
                "page": index,
                "charCount": len(text),
                "triageText": text,
                "reviewReasons": reasons,
            }
        )
    return pages


def write_pymupdf_driver(path: Path) -> None:
    path.write_text(
        r'''from pathlib import Path
import json
import sys
import pymupdf

source = Path(sys.argv[1])
json_path = Path(sys.argv[2])
image_dir = json_path.parent / "images"
image_dir.mkdir(parents=True, exist_ok=True)
pages = []
images = []

with pymupdf.open(source) as document:
    for page_number, page in enumerate(document, start=1):
        page_data = {
            "page": page_number,
            "width": page.rect.width,
            "height": page.rect.height,
            "blocks": [],
        }
        for index, raw in enumerate(page.get_text("dict", sort=True).get("blocks", [])):
            bbox = list(raw.get("bbox", []))
            if len(bbox) != 4:
                continue
            if raw.get("type") == 0:
                lines = []
                for line in raw.get("lines", []):
                    line_text = "".join(span.get("text", "") for span in line.get("spans", []))
                    if line_text.strip():
                        lines.append(line_text.rstrip())
                text = "\n".join(lines).strip()
                if not text:
                    continue
                page_data["blocks"].append({
                    "type": "paragraph",
                    "text": text,
                    "bbox": bbox,
                    "rawRef": f"page:{page_number}:block:{index}",
                })
            elif raw.get("type") == 1:
                image_id = f"pymupdf:{page_number}:{index}"
                image_path = None
                image_bytes = raw.get("image")
                if isinstance(image_bytes, (bytes, bytearray)):
                    extension = raw.get("ext", "bin")
                    target = image_dir / f"page-{page_number:04d}-{index:03d}.{extension}"
                    target.write_bytes(bytes(image_bytes))
                    image_path = str(target)
                page_data["blocks"].append({
                    "type": "image",
                    "text": "",
                    "bbox": bbox,
                    "imageId": image_id,
                    "rawRef": f"page:{page_number}:block:{index}",
                })
                images.append({"imageId": image_id, "tool": "pymupdf", "path": image_path, "page": page_number})
        pages.append(page_data)

json_path.write_text(
    json.dumps({"tool": "pymupdf", "version": pymupdf.__version__, "pages": pages, "images": images}, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
''',
        encoding="utf-8",
    )


def run_pymupdf(pymupdf_python: str, pdf_path: Path, work_dir: Path) -> tuple[Path, str]:
    work_dir.mkdir(parents=True, exist_ok=True)
    raw_json = work_dir / "pymupdf.json"
    driver = work_dir / "run_pymupdf.py"
    write_pymupdf_driver(driver)
    try:
        run([pymupdf_python, str(driver), str(pdf_path), str(raw_json)])
    except subprocess.CalledProcessError as error:
        raise RuntimeError(f"PyMuPDF failed:\n{error.stderr[-4000:]}") from error
    version = run(
        [pymupdf_python, "-c", "import pymupdf; print(pymupdf.__version__)"],
    ).stdout.strip()
    if not raw_json.exists():
        raise RuntimeError(f"PyMuPDF completed without writing {raw_json}")
    return raw_json, version


def bbox_from_pymupdf(raw_bbox: list[Any] | None) -> dict[str, Any] | None:
    if not isinstance(raw_bbox, list) or len(raw_bbox) != 4:
        return None
    return {
        "left": raw_bbox[0],
        "top": raw_bbox[1],
        "right": raw_bbox[2],
        "bottom": raw_bbox[3],
        "coordinateOrigin": "TOPLEFT",
        "coordinateSpace": "pdf-points",
    }


def normalize_pymupdf(raw: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    pages: list[dict[str, Any]] = []
    for raw_page in raw.get("pages", []) or []:
        page_number = int(raw_page["page"])
        blocks = []
        for index, item in enumerate(raw_page.get("blocks", []) or []):
            blocks.append(
                {
                    "blockId": f"pymupdf:page:{page_number}:block:{index}",
                    "type": item.get("type", "paragraph"),
                    "text": str(item.get("text", "")).strip(),
                    "page": page_number,
                    "bbox": bbox_from_pymupdf(item.get("bbox")),
                    "imageId": item.get("imageId"),
                    "source": {"tool": "pymupdf", "rawRef": item.get("rawRef")},
                }
            )
        pages.append({"page": page_number, "blocks": sorted(blocks, key=block_sort_key)})
    return pages, raw.get("images", []) or []


def write_docling_driver(path: Path) -> None:
    path.write_text(
        """from pathlib import Path
import json
import sys
from docling.document_converter import DocumentConverter

source = Path(sys.argv[1])
json_path = Path(sys.argv[2])
markdown_path = Path(sys.argv[3])
document = DocumentConverter().convert(source).document
json_path.write_text(json.dumps(document.export_to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")
markdown_path.write_text(document.export_to_markdown(), encoding="utf-8")
""",
        encoding="utf-8",
    )


def run_docling(docling_python: str, pdf_path: Path, work_dir: Path) -> tuple[Path, Path, str]:
    work_dir.mkdir(parents=True, exist_ok=True)
    raw_json = work_dir / "docling.json"
    raw_markdown = work_dir / "docling.md"
    driver = work_dir / "run_docling.py"
    write_docling_driver(driver)
    try:
        result = run([docling_python, str(driver), str(pdf_path), str(raw_json), str(raw_markdown)])
    except subprocess.CalledProcessError as error:
        raise RuntimeError(f"Docling failed:\n{error.stderr[-4000:]}") from error
    version = run([docling_python, "-c", "import docling; print(getattr(docling, '__version__', 'unknown'))"]).stdout.strip()
    if not raw_json.exists():
        raise RuntimeError(f"Docling completed without writing {raw_json}: {result.stderr}")
    return raw_json, raw_markdown, version


def bbox_from_docling(provenance: dict[str, Any] | None) -> dict[str, Any] | None:
    if not provenance:
        return None
    bbox = provenance.get("bbox") or {}
    if not all(key in bbox for key in ("l", "t", "r", "b")):
        return None
    return {
        "left": bbox["l"],
        "top": bbox["t"],
        "right": bbox["r"],
        "bottom": bbox["b"],
        "coordinateOrigin": bbox.get("coord_origin", "TOPLEFT"),
        "coordinateSpace": "pdf-points",
    }


def item_text(item: dict[str, Any]) -> str:
    for key in ("text", "orig", "content"):
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    data = item.get("data")
    if isinstance(data, str):
        return data.strip()
    return ""


def normalize_docling_type(item: dict[str, Any], collection: str) -> str:
    label = str(item.get("label", "")).lower()
    if collection == "pictures" or label in {"picture", "chart", "image"}:
        return "image"
    if collection == "tables" or label == "table":
        return "table"
    if "formula" in label or "equation" in label:
        return "equation"
    if label in {"title", "section_header", "heading"}:
        return "heading"
    if label in {"list_item", "list"}:
        return "list_item"
    return "paragraph"


def normalize_docling(raw: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    pages: dict[int, list[dict[str, Any]]] = {}
    images: list[dict[str, Any]] = []
    for collection in ("texts", "tables", "pictures", "key_value_items", "form_items"):
        for item in raw.get(collection, []) or []:
            if not isinstance(item, dict):
                continue
            block_type = normalize_docling_type(item, collection)
            image_id = item.get("self_ref") if block_type == "image" else None
            if image_id:
                images.append({"imageId": image_id, "tool": "docling", "path": None})
            provenances = item.get("prov") or [{}]
            for provenance in provenances:
                page = provenance.get("page_no")
                if page is None:
                    continue
                block_id = f"docling:{item.get('self_ref', collection)}:{page}"
                block = {
                    "blockId": block_id,
                    "type": block_type,
                    "text": item_text(item),
                    "page": int(page),
                    "bbox": bbox_from_docling(provenance),
                    "imageId": image_id,
                    "source": {"tool": "docling", "rawRef": item.get("self_ref")},
                }
                if item.get("level") is not None:
                    block["headingLevel"] = item["level"]
                pages.setdefault(int(page), []).append(block)
    return [
        {"page": page, "blocks": sorted(blocks, key=block_sort_key)}
        for page, blocks in sorted(pages.items())
    ], images


def block_sort_key(block: dict[str, Any]) -> tuple[float, float, str]:
    bbox = block.get("bbox") or {}
    return (float(bbox.get("top", 0)), float(bbox.get("left", 0)), block.get("blockId", ""))


def parse_page_ranges(value: str) -> set[int]:
    pages: set[int] = set()
    for part in value.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start, end = (int(piece) for piece in part.split("-", 1))
            pages.update(range(start, end + 1))
        else:
            pages.add(int(part))
    return pages


def mineru_files(root: Path) -> list[Path]:
    v2 = sorted(root.rglob("*_content_list_v2.json"))
    if v2:
        return v2
    return sorted(root.rglob("*_content_list.json"))


def normalize_mineru_item(item: dict[str, Any], page: int, root: Path, index: int) -> tuple[dict[str, Any], dict[str, Any] | None]:
    block_type = str(item.get("type", "text"))
    content = item.get("text")
    if not isinstance(content, str):
        content = item.get("content", "")
    if isinstance(content, dict):
        content = content.get("text") or content.get("content") or ""
    image_path = item.get("img_path") or item.get("image_path")
    image_id = None
    image_record = None
    if image_path:
        image_path = str(image_path)
        image_id = f"mineru:{image_path}"
        image_record = {"imageId": image_id, "tool": "mineru", "path": image_path, "page": page}
    raw_bbox = item.get("bbox")
    bbox = None
    if isinstance(raw_bbox, list) and len(raw_bbox) == 4:
        bbox = {
            "left": raw_bbox[0] / 1000,
            "top": raw_bbox[1] / 1000,
            "right": raw_bbox[2] / 1000,
            "bottom": raw_bbox[3] / 1000,
            "coordinateOrigin": "TOPLEFT",
            "coordinateSpace": "page-normalized",
        }
    block = {
        "blockId": f"mineru:{root.name}:{page}:{index}",
        "type": "equation" if block_type in {"equation", "inline_equation", "interline_equation"} else block_type,
        "text": str(content).strip(),
        "page": page,
        "bbox": bbox,
        "imageId": image_id,
        "source": {"tool": "mineru", "rawType": block_type},
    }
    return block, image_record


def normalize_mineru(root: Path, fallback_pages: set[int]) -> tuple[dict[int, list[dict[str, Any]]], list[dict[str, Any]]]:
    files = mineru_files(root)
    if not files:
        return {}, []
    blocks_by_page: dict[int, list[dict[str, Any]]] = {}
    images: list[dict[str, Any]] = []
    for path in files:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(payload, dict):
            payload = payload.get("content_list") or payload.get("pages") or []
        if isinstance(payload, dict):
            payload = [payload]
        for index, item in enumerate(payload):
            if not isinstance(item, dict):
                continue
            page = int(item.get("page_idx", 0)) + 1
            if page not in fallback_pages:
                continue
            block, image = normalize_mineru_item(item, page, path.parent, index)
            blocks_by_page.setdefault(page, []).append(block)
            if image:
                images.append(image)
    for page in blocks_by_page:
        blocks_by_page[page].sort(key=block_sort_key)
    return blocks_by_page, images


def run_mineru(mineru: str, pdf_path: Path, work_dir: Path, pages: set[int]) -> str:
    if not pages:
        return "not-run"
    work_dir.mkdir(parents=True, exist_ok=True)
    help_result = run([mineru, "--help"], check=False)
    supports_dump = "--dump-content-list" in f"{help_result.stdout}\n{help_result.stderr}"
    version_result = run([mineru, "--version"], check=False)
    version = (version_result.stdout or version_result.stderr).strip()
    for page in sorted(pages):
        page_dir = work_dir / f"page-{page:04d}"
        command = [
            mineru,
            "-p",
            str(pdf_path),
            "-o",
            str(page_dir),
            "--backend",
            "pipeline",
            "--method",
            "auto",
            "--lang",
            "en",
            "--device",
            "cpu",
            "--start",
            str(page - 1),
            "--end",
            str(page - 1),
        ]
        if supports_dump:
            command.append("--dump-content-list")
        result = run(command, check=False)
        if result.returncode != 0:
            raise RuntimeError(f"MinerU failed on page {page}: {result.stderr[-2000:]}")
    return version


def validate_document(document: dict[str, Any]) -> None:
    required_root = ("schemaVersion", "sourceId", "pageCount", "pages")
    missing_root = [key for key in required_root if key not in document]
    if missing_root:
        raise ValueError(f"Missing document fields: {', '.join(missing_root)}")
    page_count = int(document["pageCount"])
    pages = document["pages"]
    if len(pages) != page_count:
        raise ValueError(f"Expected {page_count} pages, found {len(pages)}")
    expected_pages = list(range(1, page_count + 1))
    actual_pages = [int(page.get("page", 0)) for page in pages]
    if actual_pages != expected_pages:
        raise ValueError("Pages must be present exactly once and remain 1-based")
    for page in pages:
        for block in page.get("blocks", []):
            required_block = ("blockId", "sourceId", "type", "page", "bbox", "imageId", "source")
            missing_block = [key for key in required_block if key not in block]
            if missing_block:
                raise ValueError(f"Block {block.get('blockId')} is missing: {missing_block}")
            if block["page"] != page["page"]:
                raise ValueError(f"Block {block['blockId']} points to page {block['page']}")
            bbox = block["bbox"]
            if bbox is not None and not all(key in bbox for key in ("left", "top", "right", "bottom")):
                raise ValueError(f"Block {block['blockId']} has an incomplete bbox")


def render_markdown(document: dict[str, Any]) -> str:
    lines = [
        f"# {document.get('title', document['sourceId'])}",
        "",
        f"- sourceId: `{document['sourceId']}`",
        f"- pages: {document['pageCount']}",
        "- generated from `lecture.json`; do not edit this file as source truth.",
        "",
    ]
    for page in document["pages"]:
        lines.extend([f"## Page {page['page']}", ""])
        for block in page.get("blocks", []):
            text = block.get("text", "").strip()
            block_type = block.get("type")
            if block_type == "heading":
                lines.extend([f"### {text}" if text else "###", ""])
            elif block_type == "equation":
                lines.extend(["$$", text, "$$", ""])
            elif block_type == "image":
                image_id = block.get("imageId") or "image"
                lines.extend([f"![{image_id}]({image_id})", ""])
            elif text:
                lines.extend([text, ""])
    return "\n".join(lines).rstrip() + "\n"


def process_pdf(args: argparse.Namespace, pdf_path: Path) -> Path:
    pdfinfo = resolve_binary("PDFINFO_BIN", ["pdfinfo"])
    pdftotext = resolve_binary("PDFTOTEXT_BIN", ["pdftotext"])
    page_count = pdf_pages(pdfinfo, pdf_path)
    triage = triage_pages(pdftotext, pdf_path, page_count)
    auto_review_pages = {page["page"] for page in triage if page["reviewReasons"]}
    explicit_pages = parse_page_ranges(args.mineru_pages) if args.mineru_pages else set()
    fallback_pages = auto_review_pages | explicit_pages

    slug = pdf_path.stem.lower().replace(" ", "-")
    work_dir = Path(args.work_dir) / slug
    output_dir = Path(args.output_dir) / args.course
    output_dir.mkdir(parents=True, exist_ok=True)
    if args.primary == "pymupdf":
        raw_primary, primary_version = run_pymupdf(args.pymupdf_python, pdf_path, work_dir / "pymupdf")
        primary_pages, primary_images = normalize_pymupdf(json.loads(raw_primary.read_text(encoding="utf-8")))
        primary_tool = "pymupdf"
    else:
        raw_docling, _, primary_version = run_docling(args.docling_python, pdf_path, work_dir / "docling")
        primary_pages, primary_images = normalize_docling(json.loads(raw_docling.read_text(encoding="utf-8")))
        primary_tool = "docling"

    mineru_version = "not-installed-or-not-run"
    mineru_blocks: dict[int, list[dict[str, Any]]] = {}
    mineru_images: list[dict[str, Any]] = []
    if fallback_pages and args.use_mineru and not args.no_mineru:
        mineru = resolve_binary(
            "MINERU_BIN",
            ["mineru"],
            ["/Users/macbook/.venvs/nus-atlas-mineru/bin/mineru"],
        )
        mineru_version = run_mineru(mineru, pdf_path, work_dir / "mineru", fallback_pages)
        mineru_blocks, mineru_images = normalize_mineru(work_dir / "mineru", fallback_pages)

    normalized_pages: list[dict[str, Any]] = []
    primary_by_page = {page["page"]: page.get("blocks", []) for page in primary_pages}
    triage_by_page = {page["page"]: page for page in triage}
    for page_number in range(1, page_count + 1):
        blocks = mineru_blocks.get(page_number) or primary_by_page.get(page_number, [])
        source_tool = "mineru" if page_number in mineru_blocks else primary_tool
        triage_page = triage_by_page[page_number]
        normalized_pages.append(
            {
                "page": page_number,
                "status": "fallback" if source_tool == "mineru" else ("review" if triage_page["reviewReasons"] else "primary"),
                "reviewReasons": triage_page["reviewReasons"],
                "blocks": blocks,
            }
        )

    source_id = args.source_id or f"{args.course}/{pdf_path.name}"
    for page in normalized_pages:
        for block in page["blocks"]:
            block["sourceId"] = source_id
    document = {
        "schemaVersion": "nus-lecture.v1",
        "sourceId": source_id,
        "sourceFileName": pdf_path.name,
        "courseCode": args.course,
        "title": pdf_path.stem,
        "pageCount": page_count,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "extraction": {
            "triage": {"tool": "pdftotext", "pageCount": page_count},
            "primary": {"tool": primary_tool, "version": primary_version},
            "fallback": {"tool": "mineru", "version": mineru_version, "pages": sorted(mineru_blocks)},
        },
        "images": primary_images + mineru_images,
        "pages": normalized_pages,
    }
    validate_document(document)
    output_json = output_dir / f"{slug}.json"
    output_markdown = output_dir / f"{slug}.md"
    output_json.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    output_markdown.write_text(render_markdown(document), encoding="utf-8")
    print(json.dumps({"json": str(output_json), "markdown": str(output_markdown), "fallbackPages": sorted(mineru_blocks), "reviewPages": sorted(auto_review_pages)}))
    return output_json


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="PDF file or directory of PDFs")
    parser.add_argument("--course", required=True, help="Course code used in sourceId and output path")
    parser.add_argument("--output-dir", default="data/extracted", help="Tracked normalized output root")
    parser.add_argument("--work-dir", default="tmp/pdf-extraction", help="Ignored parser work root")
    parser.add_argument("--source-id", help="Stable sourceId; defaults to COURSE/filename.pdf")
    parser.add_argument("--primary", choices=("pymupdf", "docling"), default=os.environ.get("PDF_PRIMARY", "pymupdf"))
    parser.add_argument("--pymupdf-python", default=os.environ.get("PYMUPDF_PYTHON", "/Users/macbook/.venvs/nus-atlas-pdf/bin/python"))
    parser.add_argument("--docling-python", default=os.environ.get("DOCLING_PYTHON", "/Users/macbook/.venvs/nus-atlas-docling/bin/python"))
    parser.add_argument("--mineru-pages", help="1-based page list/ranges to force through MinerU, e.g. 3,7-9")
    parser.add_argument("--use-mineru", action="store_true", help="Opt into the torch-based MinerU fallback")
    parser.add_argument("--no-mineru", action="store_true", help="Do not run MinerU even when pages need review")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_path = Path(args.input).expanduser().resolve()
    pdfs = [input_path] if input_path.is_file() else sorted(input_path.rglob("*.pdf"))
    if not pdfs:
        raise SystemExit(f"No PDF files found under {input_path}")
    for pdf_path in pdfs:
        process_pdf(args, pdf_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
