const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { readQuestionBank, validateQuestionBank } = require("../scripts/validate-question-bank");
const { OPEN_RESPONSE_IDS } = require("../scripts/ingest-dsa5104-homework");
const { loadCanonicalState } = require("../scripts/validate-content");
const { compileCourse, mergeQuestions } = require("../tools/content-compiler");

test("DSA5105 question bank covers every lesson with metadata", () => {
  const bank = readQuestionBank();
  const result = validateQuestionBank(bank, loadCanonicalState());
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.counts.questions, 67);
  assert.equal(result.counts.lessons, 23);
  assert.equal(new Set(bank.questions.map(question => question.id)).size, bank.questions.length);
});

test("DSA5101 question bank covers every lesson with metadata", () => {
  const bank = readQuestionBank("DSA5101");
  const result = validateQuestionBank(bank, loadCanonicalState());
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.ok(result.counts.questions >= 12);
  assert.equal(result.counts.lessons, 9);
  assert.equal(new Set(bank.questions.map(question => question.id)).size, bank.questions.length);
  const stanfordExtensions = bank.questions.filter(question => /^dsa5101-stanford-\d+$/.test(question.id));
  assert.equal(stanfordExtensions.length, 7);
  assert.ok(stanfordExtensions.every(question =>
    question.type === "mcq" &&
    question.choices.length === 6 &&
    new Set(question.choices).size === 6 &&
    question.sourceRefs.some(ref => ref.sourceType === "ref" && /stanford\.edu/.test(ref.url || ""))
  ));
});

test("DSA5104 question bank covers every lesson with metadata", () => {
  const bank = readQuestionBank("DSA5104");
  const result = validateQuestionBank(bank, loadCanonicalState());
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.counts.questions, 300);
  assert.equal(result.counts.lessons, 17);
  assert.equal(bank.homeworkCoverage.questionCount, 190);
  assert.equal(bank.homeworkCoverage.convertedToMcq, 152);
  assert.equal(bank.homeworkCoverage.openResponseRetained, 38);
  assert.equal(bank.homeworkCoverage.targetMcqPercent, 80);
  assert.deepEqual(bank.assessmentLayers.map(layer => [layer.id, layer.origin, layer.status]), [
    ["synthetic-final", "synthetic", "not-past-year"],
    ["deep-dive-traps", "synthetic", "not-past-year"]
  ]);
  const deepDiveQuestions = bank.questions.filter(question => /^dsa5104-deep-dive-\d+$/.test(question.id));
  assert.equal(deepDiveQuestions.length, 50);
  assert.equal(new Set(deepDiveQuestions.map(question => question.id)).size, 50);
  assert.ok(deepDiveQuestions.every(question =>
    question.type === "mcq" &&
    question.assessmentLayer === "deep-dive-traps" &&
    question.origin === "synthetic" &&
    question.choices.length === 4 &&
    question.commonTrap &&
    Array.isArray(question.mistakeTags) &&
    question.mistakeTags.length > 0
  ));
  assert.ok(deepDiveQuestions.some(question => question.lessonId === "dsa5104-sql-null"));
  assert.ok(deepDiveQuestions.some(question => question.lessonId === "dsa5104-sql-nested"));
  const homeworkQuestions = bank.questions.filter(question => /^dsa5104-homework-ch\d+-/.test(question.id));
  assert.equal(homeworkQuestions.length, 190);
  const converted = homeworkQuestions.filter(question => question.type === "mcq");
  const openResponse = homeworkQuestions.filter(question => question.type !== "mcq");
  assert.equal(converted.length, 152);
  assert.equal(openResponse.length, 38);
  assert.deepEqual(
    openResponse.map(question => question.id).sort(),
    [...OPEN_RESPONSE_IDS].sort()
  );
  assert.ok(converted.every(question =>
    question.assessmentMode === "mcq-summary" &&
    question.originalType &&
    question.choices.length === 4 &&
    new Set(question.choices).size === 4 &&
    Number.isInteger(question.answer) &&
    question.answer >= 0 &&
    question.answer < question.choices.length
  ));
  assert.ok(openResponse.every(question =>
    question.assessmentMode === "open-response" &&
    question.originalType &&
    question.type !== "mcq"
  ));
  const homeworkSourceIds = new Set(homeworkQuestions.flatMap(question => (question.sourceRefs || [])
    .filter(ref => ref.sourceType === "exercise" && /Homework Solutions\//.test(ref.sourceId))
    .map(ref => ref.sourceId)));
  assert.equal(homeworkSourceIds.size, 190);
  assert.deepEqual(
    Object.fromEntries([...new Set(homeworkQuestions.map(question => question.id.match(/ch(\d+)/)[1]))]
      .sort()
      .map(chapter => [chapter, homeworkQuestions.filter(question => question.id.includes(`-ch${chapter}-`)).length])),
    { "01": 15, "02": 18, "03": 35, "04": 26, "05": 24, "06": 28, "07": 44 }
  );
  const exerciseSources = new Set(
    bank.questions.flatMap(question => (question.sourceRefs || [])
      .filter(ref => ref.sourceType === "exercise")
      .map(ref => ref.sourceId))
  );
  [
    "Ch01_Introduction/1.3.md",
    "Ch01_Introduction/1.7.md",
    "Ch01_Introduction/1.10.md",
    "Ch01_Introduction/1.15.md",
    "Ch02_Introduction_to_the_Relational_Model/2.2.md",
    "Ch02_Introduction_to_the_Relational_Model/2.6.md",
    "Ch02_Introduction_to_the_Relational_Model/2.12.md",
    "Ch02_Introduction_to_the_Relational_Model/2.13.md",
    "Ch02_Introduction_to_the_Relational_Model/2.15.md",
    "Ch03_Introduction_to_SQL/3.1.md",
    "Ch03_Introduction_to_SQL/3.3.md",
    "Ch03_Introduction_to_SQL/3.6.md",
    "Ch03_Introduction_to_SQL/3.11.md",
    "Ch03_Introduction_to_SQL/3.27.md",
    "Ch03_Introduction_to_SQL/3.28.md"
  ].forEach(relativeSource => {
    assert.equal(
      exerciseSources.has(`DSA5104/Homework Solutions/${relativeSource}`),
      true,
      `missing teacher-designated homework ${relativeSource}`
    );
  });
});

test("DSA5208 question bank covers every lesson with metadata", () => {
  const bank = readQuestionBank("DSA5208");
  const result = validateQuestionBank(bank, loadCanonicalState());
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.counts.questions, 12);
  assert.equal(result.counts.lessons, 8);
});

test("question merging keeps the first owner of a repeated prompt", () => {
  const primary = [{ id: "lesson-q", prompt: "What is FIFO?" }];
  const extras = [{ id: "bank-q", prompt: "  what is   fifo? " }];
  assert.deepEqual(mergeQuestions(primary, extras), primary);
  assert.deepEqual(mergeQuestions([{ id: "same", prompt: "old" }], [{ id: "same", prompt: "new" }], { preferExtras: true }), [{ id: "same", prompt: "new" }]);
});

test("compiled DSA5208 lessons expose unique quiz prompts", () => {
  const packageData = compileCourse(process.cwd(), "DSA5208").package;
  const questions = packageData.content.modules.flatMap(module => module.lessons).flatMap(lesson => lesson.questions);
  const normalize = prompt => prompt.replace(/\s+/g, " ").trim().toLowerCase();
  assert.equal(new Set(questions.map(question => normalize(question.prompt))).size, questions.length);
});

test("DSA5208 keeps extension questions only in the question bank", () => {
  const questionDir = path.join(process.cwd(), "content", "courses", "DSA5208", "questions");
  const bankIds = new Set(readQuestionBank("DSA5208").questions.map(question => question.id));
  const duplicateIds = fs.readdirSync(questionDir)
    .filter(file => /^dsa5208-.*\.json$/.test(file))
    .flatMap(file => JSON.parse(fs.readFileSync(path.join(questionDir, file), "utf8")))
    .map(question => question.id)
    .filter(id => bankIds.has(id));

  assert.deepEqual(duplicateIds, []);
});

test("content build exposes question bank metadata and merged questions", () => {
  const packageData = compileCourse(process.cwd(), "DSA5105").package;
  assert.equal(packageData.questionBank.extensionCount, 67);
  assert.equal(packageData.counts.questions, 165);
  const lesson = packageData.content.modules.flatMap(module => module.lessons).find(item => item.id === "dsa5105-gnn");
  assert.ok(lesson.questions.some(question => question.id === "dsa5105-bank-044"));
  assert.equal(lesson.questions.at(-1).schemaVersion, "nus.question.v1");
  const deepDive = packageData.content.modules.flatMap(module => module.lessons).find(item => item.id === "dsa5105-week1-derivations");
  assert.equal(deepDive.questions.length, 7);
});
