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

// Keep a deliberate 20% open-response slice for skills that are best learned
// by writing the SQL, drawing the design, or showing the derivation.
const OPEN_RESPONSE_IDS = new Set([
  "dsa5104-homework-ch01-1-9", "dsa5104-homework-ch01-1-12",
  "dsa5104-homework-ch02-2-6", "dsa5104-homework-ch02-2-8", "dsa5104-homework-ch02-2-18",
  "dsa5104-homework-ch03-3-1", "dsa5104-homework-ch03-3-3", "dsa5104-homework-ch03-3-13",
  "dsa5104-homework-ch03-3-18", "dsa5104-homework-ch03-3-28",
  "dsa5104-homework-ch04-4-6", "dsa5104-homework-ch04-4-7", "dsa5104-homework-ch04-4-16",
  "dsa5104-homework-ch04-4-20",
  "dsa5104-homework-ch05-5-7", "dsa5104-homework-ch05-5-8", "dsa5104-homework-ch05-5-12", "dsa5104-homework-ch05-5-21",
  "dsa5104-homework-ch06-6-1", "dsa5104-homework-ch06-6-2", "dsa5104-homework-ch06-6-3",
  "dsa5104-homework-ch06-6-6", "dsa5104-homework-ch06-6-13", "dsa5104-homework-ch06-6-15",
  "dsa5104-homework-ch06-6-16", "dsa5104-homework-ch06-6-21", "dsa5104-homework-ch06-6-22",
  "dsa5104-homework-ch06-6-23", "dsa5104-homework-ch06-6-24", "dsa5104-homework-ch06-6-26",
  "dsa5104-homework-ch07-7-6", "dsa5104-homework-ch07-7-7", "dsa5104-homework-ch07-7-21",
  "dsa5104-homework-ch07-7-22", "dsa5104-homework-ch07-7-30", "dsa5104-homework-ch07-7-32",
  "dsa5104-homework-ch07-7-42", "dsa5104-homework-ch07-7-44"
]);
const TARGET_MCQ_PERCENT = 80;

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

function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableShuffle(values, seed) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = stableHash(String(seed) + ":" + index) % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function truncateChoice(value, limit = 300) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  const boundary = text.lastIndexOf(" ", limit - 1);
  return text.slice(0, boundary > 80 ? boundary : limit - 1) + "…";
}

function choiceText(value) {
  const backtick = String.fromCharCode(96);
  return String(value || "")
    .replace(/\[See source figure[^\]]*\]/gi, "")
    .replace(new RegExp(backtick + "{1,3}", "g"), "")
    .replace(/\$+/g, "")
    .replace(/\\(?:mathrm|operatorname|text)\s*\{([^{}]*)\}/g, "$1")
    .replace(/\\(rightarrow|to)\b/g, " maps to ")
    .replace(/\\(bowtie)\b/g, "join")
    .replace(/\\(div)\b/g, "division")
    .replace(/\\([A-Za-z]+)/g, "$1")
    .replace(/<>/g, " not equal ")
    .replace(/>=/g, " at least ")
    .replace(/<=/g, " at most ")
    .replace(/(?<![<>!])=(?!=)/g, " equals ")
    .replace(/</g, " less than ")
    .replace(/>/g, " greater than ")
    .replace(/_/g, " ")
    .replace(/\b([A-Za-z])\(([^)]*)\)/g, "$1 of $2")
    .replace(/[∈]/g, " belongs to ")
    .replace(/[≈≤≥≠]/g, " ")
    .replace(/-{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function solutionSummary(question) {
  const backtick = String.fromCharCode(96);
  const codeFence = backtick.repeat(3);
  const codeBlocks = [...question.solution.matchAll(new RegExp(codeFence + "[^\\n]*\\n([\\s\\S]*?)" + codeFence, "g"))]
    .map(match => choiceText(match[1]))
    .filter(Boolean);
  if (codeBlocks.length) {
    return truncateChoice("Uses the requested statements: " + codeBlocks.join(" | "));
  }

  const prose = choiceText(question.solution)
    .replace(/\b(?:a|b|c|d)\.\s*/gi, "")
    .replace(/\s*\|\s*/g, "; ");
  return truncateChoice(prose || "Follow the source solution and satisfy every stated constraint.");
}

function chapterKey(question) {
  const match = question.id.match(/(ch\d+)-/);
  return match ? match[1] : "";
}

function makeChoices(question, pool) {
  const correct = solutionSummary(question);
  const candidates = pool
    .filter(candidate => candidate.id !== question.id && chapterKey(candidate) === chapterKey(question))
    .sort((left, right) => stableHash(question.id + ":" + left.id) - stableHash(question.id + ":" + right.id))
    .map(solutionSummary)
    .filter(candidate => candidate && candidate !== correct);
  const distractors = [...new Set(candidates)].slice(0, 3);
  const fallbacks = [
    "The solution ignores the stated schema and returns all records without applying the requested condition.",
    "The solution changes the database design instead of answering the requested exercise.",
    "The solution applies an unrelated database concept and does not satisfy the stated constraints."
  ];
  for (const fallback of fallbacks) {
    if (distractors.length >= 3) break;
    if (!distractors.includes(fallback) && fallback !== correct) distractors.push(fallback);
  }
  const choices = stableShuffle([correct, ...distractors], question.id);
  return { choices, answer: choices.indexOf(correct) };
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
    originalType: questionType(prompt),
    origin: "teacher-assigned",
    assessmentMode: OPEN_RESPONSE_IDS.has(questionId(chapter, exercise)) ? "open-response" : "mcq-summary",
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

function convertQuestion(question, pool) {
  if (OPEN_RESPONSE_IDS.has(question.id)) return question;
  const originalType = question.originalType || question.type;
  const { choices, answer } = makeChoices(question, pool);
  return {
    ...question,
    type: "mcq",
    prompt: "Choose the option that best summarizes the teacher's solution to this exercise.\n\n" + question.prompt,
    choices,
    answer,
    estimatedSeconds: Math.max(45, Math.min(75, Math.round(question.estimatedSeconds / 3))),
    explanation: "MCQ adaptation of the teacher-assigned exercise (original response type: " + originalType + "). The correct option is a concise solution summary; open the worked solution below to study the exact SQL, design, or derivation."
  };
}

function ingest(sourceRoot) {
  const bankPath = path.join(ROOT, "content", "courses", "DSA5104", "questions", "bank.json");
  const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
  const files = collectFiles(sourceRoot);
  const retained = bank.questions.filter(question => !/^dsa5104-homework-ch\d+-/.test(question.id));
  const drafts = files.map(buildQuestion);
  const homework = drafts.map(question => convertQuestion(question, drafts));
  const convertedToMcq = homework.filter(question => question.type === "mcq").length;
  const openResponseRetained = homework.length - convertedToMcq;
  if (convertedToMcq * 100 !== homework.length * TARGET_MCQ_PERCENT) {
    throw new Error("MCQ conversion policy failed: " + convertedToMcq + "/" + homework.length + " is not exactly " + TARGET_MCQ_PERCENT + "%");
  }
  const sourceDirectories = CHAPTERS.map(([chapter]) => `DSA5104/Homework Solutions/${chapter}`);
  const nextBank = {
    ...bank,
    purpose: "Source-backed retrieval, exam prompts, and the complete teacher-assigned DSA5104 homework set.",
    homeworkCoverage: {
      sourceRoot: "DSA5104/Homework Solutions",
      sourceDirectories,
      questionCount: homework.length,
      convertedToMcq,
      openResponseRetained,
      targetMcqPercent: TARGET_MCQ_PERCENT,
      policy: "Exactly 80% of teacher-assigned homework questions use MCQ solution summaries; 20% remain open response for SQL, design, and derivation practice."
    },
    questions: [...retained, ...homework]
  };
  fs.writeFileSync(bankPath, `${JSON.stringify(nextBank, null, 2)}\n`);
  return {
    total: homework.length,
    convertedToMcq,
    openResponseRetained,
    byChapter: Object.fromEntries(CHAPTERS.map(([chapter]) => [chapter, files.filter(item => item.chapter === chapter).length]))
  };
}

if (require.main === module) {
  const { sourceRoot } = parseArgs(process.argv.slice(2));
  const result = ingest(sourceRoot);
  console.log("DSA5104 homework ingest complete · " + result.total + " questions · " + result.convertedToMcq + " MCQ · " + result.openResponseRetained + " open response");
  Object.entries(result.byChapter).forEach(([chapter, count]) => console.log(`  ${chapter}: ${count}`));
}

module.exports = {
  OPEN_RESPONSE_IDS,
  cleanMarkdown,
  splitExercise,
  collectFiles,
  buildQuestion,
  convertQuestion,
  makeChoices,
  ingest
};
