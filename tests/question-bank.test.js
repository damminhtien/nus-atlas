const test = require("node:test");
const assert = require("node:assert/strict");
const { readQuestionBank, validateQuestionBank } = require("../scripts/validate-question-bank");
const { loadLegacyState } = require("../scripts/validate-content");
const { build } = require("../scripts/content-build");

test("DSA5105 question bank covers every lesson with metadata", () => {
  const bank = readQuestionBank();
  const result = validateQuestionBank(bank, loadLegacyState());
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.counts.questions, 44);
  assert.equal(result.counts.lessons, 22);
  assert.equal(new Set(bank.questions.map(question => question.id)).size, bank.questions.length);
});

test("content build exposes question bank metadata and merged questions", () => {
  const packageData = build("DSA5105");
  assert.equal(packageData.questionBank.extensionCount, 44);
  assert.equal(packageData.counts.questions, 130);
  const lesson = packageData.content.modules.flatMap(module => module.lessons).find(item => item.id === "dsa5105-gnn");
  assert.ok(lesson.questions.some(question => question.id === "dsa5105-bank-044"));
  assert.equal(lesson.questions.at(-1).schemaVersion, "nus.question.v1");
  const deepDive = packageData.content.modules.flatMap(module => module.lessons).find(item => item.id === "dsa5105-week1-derivations");
  assert.equal(deepDive.questions.length, 6);
});
