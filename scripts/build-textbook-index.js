/* Build a copyright-safe textbook index from the table of contents only.
 * Raw PDFs remain outside the repository; output contains titles, page ranges,
 * and source references, never extracted chapter prose. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

function args(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith("--")) continue;
    result[argv[index].slice(2)] = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
  }
  return result;
}

function pdfPageCount(input) {
  const info = execFileSync("pdfinfo", [input], { encoding: "utf8" });
  const match = info.match(/^Pages:\s+(\d+)$/m);
  if (!match) throw new Error(`pdfinfo did not report pages: ${input}`);
  return Number(match[1]);
}

function cleanTitle(value) {
  return value.replace(/(?:\.\s*){2,}/g, " ").replace(/[·…]{2,}/g, " ").replace(/\uFFFD/g, "").replace(/\s+/g, " ").trim();
}

function parseContents(text) {
  const entries = [];
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim();
    const match = line.match(/^((?:\d+\.)*\d+)\s+(.+?)\s+(\d+)$/);
    if (!match) continue;
    const number = match[1];
    const title = cleanTitle(match[2]);
    const page = Number(match[3]);
    if (!title || !page || number.split(".").length > 4) continue;
    entries.push({ number, title, page });
  }
  return entries;
}

function buildIndex({ input, course, sourceId, output }) {
  if (!input || !course) throw new Error("Usage: --input <textbook.pdf> --course <COURSE> [--source-id <id>] [--output <file>]");
  const pageCount = pdfPageCount(input);
  const toc = execFileSync("pdftotext", ["-layout", "-f", "1", "-l", "12", input, "-"], { encoding: "utf8" });
  const entries = parseContents(toc);
  const candidates = entries.filter(entry => /^\d+$/.test(entry.number));
  const firstChapter = candidates.findIndex(entry => entry.number === "1");
  const chapters = firstChapter < 0 ? [] : candidates.slice(firstChapter).filter((entry, index, list) => Number(entry.number) === index + 1);
  if (!chapters.length) throw new Error(`No chapter headings found in textbook contents: ${input}`);
  const source = { sourceId: sourceId || `${course}/Textbook.pdf`, sourceType: "textbook", page: 1, role: "course textbook chapter index", status: "course-depth" };
  const chapterData = chapters.map((chapter, index) => {
    const nextChapter = chapters[index + 1];
    const pageEnd = nextChapter ? nextChapter.page - 1 : pageCount;
    const sections = entries.filter(entry => entry.number.startsWith(`${chapter.number}.`)).map((entry, sectionIndex) => {
      const next = entries.find(candidate => candidate.page > entry.page && candidate.number.startsWith(`${chapter.number}.`));
      return {
        id: `${course.toLowerCase()}-${chapter.number}-${sectionIndex + 1}`,
        number: entry.number,
        title: entry.title,
        pageStart: entry.page,
        pageEnd: Math.min(pageEnd, next ? next.page - 1 : pageEnd),
        sourceRef: { ...source, page: entry.page }
      };
    });
    return {
      id: `${course.toLowerCase()}-textbook-chapter-${chapter.number}`,
      number: chapter.number,
      title: chapter.title,
      pageStart: chapter.page,
      pageEnd,
      sections
    };
  });
  const result = {
    schemaVersion: "nus.textbook-index.v1",
    courseId: course,
    source,
    pageCount,
    chapters: chapterData,
    distinction: {
      lecture: "Lecture material defines current course scope and exam priority.",
      textbook: "This index points to textbook depth; it does not upgrade a topic into lecture scope.",
      reference: "Reference and assessment-derived material remain separately labeled."
    }
  };
  const target = output || path.join(ROOT, "content", "courses", course, "textbook.json");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`TEXTBOOK INDEX GREEN · ${course} · ${chapterData.length} chapters · ${entries.length} headings · ${pageCount} pages · output ${path.relative(ROOT, target)}`);
  return result;
}

if (require.main === module) buildIndex(args(process.argv.slice(2)));

module.exports = { cleanTitle, parseContents, buildIndex };
