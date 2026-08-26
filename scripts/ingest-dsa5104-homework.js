const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_SOURCE_ROOT = "/Users/macbook/Desktop/NUS/DSA5104/Homework Solutions";
const CHAPTERS = [
  ["Ch01_Introduction", "dsa5104-orientation", "database systems"],
  ["Ch02_Introduction_to_the_Relational_Model", "dsa5104-relational-model", "relational model"],
  ["Ch03_Introduction_to_SQL", "dsa5104-sql-aggregation", "SQL"],
  ["Ch04_Intermediate_SQL", "dsa5104-ch4-preview", "intermediate SQL"],
  ["Ch05_Advanced_SQL", "dsa5104-ch5-preview", "advanced SQL"],
  ["Ch06_Database_Design_Using_the_ER_Model", "dsa5104-database-design", "ER design"],
  ["Ch07_Relational_Database_Design", "dsa5104-ch7-preview", "relational database design"]
];

const SQL3_LESSONS = {
  "3.1": "dsa5104-sql-query-shape", "3.2": "dsa5104-sql-aggregation", "3.3": "dsa5104-sql-mutations", "3.4": "dsa5104-sql-mutations",
  "3.5": "dsa5104-sql-aggregation", "3.6": "dsa5104-sql-query-shape", "3.7": "dsa5104-sql-joins", "3.8": "dsa5104-sql-joins",
  "3.9": "dsa5104-sql-query-shape", "3.10": "dsa5104-sql-mutations", "3.11": "dsa5104-sql-joins", "3.12": "dsa5104-sql-mutations",
  "3.13": "dsa5104-sql-ddl", "3.14": "dsa5104-sql-query-shape", "3.15": "dsa5104-sql-aggregation", "3.16": "dsa5104-sql-query-shape",
  "3.17": "dsa5104-sql-mutations", "3.18": "dsa5104-sql-ddl", "3.19": "dsa5104-sql-null", "3.20": "dsa5104-sql-null",
  "3.21": "dsa5104-sql-aggregation", "3.22": "dsa5104-sql-nested", "3.23": "dsa5104-sql-cte", "3.24": "dsa5104-sql-query-shape",
  "3.25": "dsa5104-sql-query-shape", "3.26": "dsa5104-sql-aggregation", "3.27": "dsa5104-sql-cte", "3.28": "dsa5104-sql-nested",
  "3.29": "dsa5104-sql-query-shape", "3.30": "dsa5104-sql-null", "3.31": "dsa5104-sql-null", "3.32": "dsa5104-sql-null",
  "3.33": "dsa5104-sql-query-shape", "3.34": "dsa5104-sql-aggregation", "3.35": "dsa5104-sql-cte"
};

function lessonFor(chapter, exercise) {
  if (chapter === "Ch03_Introduction_to_SQL") return SQL3_LESSONS[exercise] || "dsa5104-sql-query-shape";
  return CHAPTERS.find(entry => entry[0] === chapter)[1];
}

function parseArgs(argv) {
  const sourceIndex = argv.indexOf("--source-root");
  return {
    sourceRoot: sourceIndex >= 0 && argv[sourceIndex + 1]
      ? path.resolve(argv[sourceIndex + 1])
      : path.resolve(process.env.DSA5104_HOMEWORK_ROOT || DEFAULT_SOURCE_ROOT)
  };
}

function normalizeMath(value) {
  return value
    .replace(/\$(?=\d)(?![^\n]*\$)/g, "USD ")
    .replace(/grade\s+_?F_?\s+if\s+_?score_?\s+\$\s+if\s+40\s+\$\\leq\$\s+_?score_?\s+\$\s+if\s+80\s+\$\\leq\$\s+_?score_?/i,
      "grade F if $score < 40$, grade C if $40 \\leq score < 60$, grade B if $60 \\leq score < 80$, and grade A otherwise")
    .replace(/\$\$([\s\S]*?)\$\$/g, (_match, body) => "$$" + body.replace(/(?<!\\)\$/g, "") + "$$")
    .replace(/\\text\{if \\alpha \\rightarrow \\beta and \\alpha \\rightarrow \\gamma then \\alpha \\rightarrow \\beta \\gamma \}/g,
      String.raw`\text{if } \alpha \rightarrow \beta \text{ and } \alpha \rightarrow \gamma \text{ then } \alpha \rightarrow \beta \gamma`)
    .replace(/\\text\{if \\alpha \\rightarrow \\beta and \\gamma\\beta \\rightarrow \\delta then \\alpha\\gamma \\rightarrow \\delta \}/g,
      String.raw`\text{if } \alpha \rightarrow \beta \text{ and } \gamma\beta \rightarrow \delta \text{ then } \alpha\gamma \rightarrow \delta`);
}

function cleanMarkdown(value) {
  return normalizeMath(value
    .replace(/\r\n?/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi, "\n[See source figure: $1]\n")
    .replace(/<img\b[^>]*>/gi, "\n[See source figure]\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<\/?(?:u|i|em|strong|b|small|sub|sup)>/gi, "")
    .replace(/^>\s?/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*-{5,}\s*$/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim());
}

function splitExercise(markdown) {
  const normalized = markdown.replace(/\r\n?/g, "\n");
  const separator = normalized.search(/^\s*-{5,}\s*$/m);
  if (separator >= 0) {
    const separatorEnd = normalized.indexOf("\n", separator);
    return {
      prompt: cleanMarkdown(normalized.slice(0, separator)),
      solution: cleanMarkdown(normalized.slice(separatorEnd < 0 ? normalized.length : separatorEnd))
    };
  }
  const lines = normalized.split("\n");
  const solutionLine = lines.findIndex(line => line.trim() && !/^\s*>/.test(line));
  if (solutionLine < 0) throw new Error("homework file has no solution body");
  return {
    prompt: cleanMarkdown(lines.slice(0, solutionLine).join("\n")),
    solution: cleanMarkdown(lines.slice(solutionLine).join("\n"))
  };
}

function questionType(prompt) {
  if (/\b(prove|show that|compute|calculate|closure|normalize|decomposition|candidate keys?)\b/i.test(prompt)) return "derivation";
  if (/\b(write|construct|design|define|express|give an? (SQL|example|E-R|ER))\b/i.test(prompt)) return "calculation";
  return "short";
}

function difficulty(prompt, solution) {
  if (/\b(prove|BCNF|4NF|lossless|dependency-preserving|JDBC|ODBC|trigger|recursive|normalize)\b/i.test(prompt)) return "hard";
  if (prompt.length + solution.length > 700) return "medium";
  return "easy";
}

function cognitiveLevel(prompt) {
  if (/\b(prove|show that|explain why|discuss|compare|distinction|difference)\b/i.test(prompt)) return "analyze";
  if (/\b(write|construct|design|compute|calculate|normalize|give|list)\b/i.test(prompt)) return "apply";
  return "understand";
}

function questionId(chapter, exercise) {
  const chapterNumber = chapter.match(/^Ch(\d+)/)[1];
  return `dsa5104-homework-ch${chapterNumber}-${exercise.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`;
}

function collectFiles(sourceRoot) {
  return CHAPTERS.flatMap(([chapter]) => {
    const directory = path.join(sourceRoot, chapter);
    if (!fs.existsSync(directory)) throw new Error(`missing homework directory: ${directory}`);
    return fs.readdirSync(directory)
      .filter(file => file.endsWith(".md"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map(file => ({ chapter, file, absolutePath: path.join(directory, file) }));
  });
}

function buildQuestion(item) {
  const [chapter, _defaultLessonId, topic] = CHAPTERS.find(entry => entry[0] === item.chapter);
  const lessonId = lessonFor(item.chapter, path.basename(item.file, ".md"));
  const exercise = path.basename(item.file, ".md");
  const { prompt, solution } = splitExercise(fs.readFileSync(item.absolutePath, "utf8"));
  return {
    id: questionId(chapter, exercise),
    lessonId,
    courseId: "DSA5104",
    type: questionType(prompt),
    prompt,
    solution,
    explanation: `Teacher-assigned homework exercise from the ${topic} practice set. Use the source solution to check the reasoning after attempting the question.`,
    difficulty: difficulty(prompt, solution),
    skill: topic,
    cognitiveLevel: cognitiveLevel(prompt),
    estimatedSeconds: Math.max(90, Math.min(360, 60 + Math.ceil((prompt.length + solution.length) / 180))),
    misconception: "Do not copy the final answer without checking the assumptions, intermediate steps, and required constraints.",
    visualHook: "Write the entities, operators, clauses, or dependency steps on a small scratch diagram before checking the solution.",
    sourceRefs: [{
      sourceId: `DSA5104/Homework Solutions/${chapter}/${item.file}`,
      page: 1,
      sourceType: "exercise",
      role: "teacher-assigned homework solution",
      status: "current-context"
    }],
    schemaVersion: "nus.question.v1"
  };
}

function ingest(sourceRoot) {
  const bankPath = path.join(ROOT, "content", "courses", "DSA5104", "questions", "bank.json");
  const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
  const files = collectFiles(sourceRoot);
  const retained = bank.questions.filter(question => !/^dsa5104-homework-ch\d+-/.test(question.id));
  const homework = files.map(buildQuestion);
  const sourceDirectories = CHAPTERS.map(([chapter]) => `DSA5104/Homework Solutions/${chapter}`);
  const nextBank = {
    ...bank,
    purpose: "Source-backed retrieval, exam prompts, and the complete teacher-assigned DSA5104 homework set.",
    homeworkCoverage: {
      sourceRoot: "DSA5104/Homework Solutions",
      sourceDirectories,
      questionCount: homework.length,
      policy: "One canonical practice question is ingested per supplied homework solution file."
    },
    questions: [...retained, ...homework]
  };
  fs.writeFileSync(bankPath, `${JSON.stringify(nextBank, null, 2)}\n`);
  return { total: homework.length, byChapter: Object.fromEntries(CHAPTERS.map(([chapter]) => [chapter, files.filter(item => item.chapter === chapter).length])) };
}

if (require.main === module) {
  const { sourceRoot } = parseArgs(process.argv.slice(2));
  const result = ingest(sourceRoot);
  console.log(`DSA5104 homework ingest complete · ${result.total} questions`);
  Object.entries(result.byChapter).forEach(([chapter, count]) => console.log(`  ${chapter}: ${count}`));
}

module.exports = { cleanMarkdown, splitExercise, collectFiles, ingest };
