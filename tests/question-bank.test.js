const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { readQuestionBank, validateQuestionBank } = require("../scripts/validate-question-bank");
const { loadCanonicalState } = require("../scripts/validate-content");
const { compileCourse } = require("../tools/content-compiler");

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
  assert.equal(result.counts.lessons, 4);
  assert.equal(new Set(bank.questions.map(question => question.id)).size, bank.questions.length);
});

test("DSA5104 question bank covers every lesson with metadata", () => {
  const bank = readQuestionBank("DSA5104");
  const result = validateQuestionBank(bank, loadCanonicalState());
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.counts.questions, 44);
  assert.equal(result.counts.lessons, 7);
});

test("DSA5208 question bank covers every lesson with metadata", () => {
  const bank = readQuestionBank("DSA5208");
  const result = validateQuestionBank(bank, loadCanonicalState());
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.counts.questions, 17);
  assert.equal(result.counts.lessons, 9);
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
