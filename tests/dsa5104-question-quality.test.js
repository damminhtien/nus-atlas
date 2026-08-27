const test = require("node:test");
const assert = require("node:assert/strict");
const {
  readDsa5104Questions,
  validateDsa5104QuestionQuality
} = require("../scripts/validate-dsa5104-question-quality");
const { INCOMPLETE_SOURCE_IDS } = require("../scripts/ingest-dsa5104-homework");

test("DSA5104 questions pass the presentation and readability audit", () => {
  const result = validateDsa5104QuestionQuality();
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.deepEqual(result.counts, {
    unique: 314,
    homework: 190,
    homeworkMcq: 152,
    homeworkOpen: 38,
    sourceReview: 9
  });
});

test("DSA5104 homework MCQs contain readable choices and mark incomplete sources", () => {
  const { unique } = readDsa5104Questions();
  const homework = unique.filter(question => /^dsa5104-homework-ch\d+-/.test(question.id));
  const mcq = homework.filter(question => question.type === "mcq");
  assert.ok(mcq.every(question => question.choices.length === 4));
  assert.ok(mcq.every(question => question.choices.every(choice => choice.length >= 30 && choice.length <= 220)));
  assert.ok(mcq.every(question => question.choices.every(choice => !/[\\…]|\.\.\./.test(choice))));
  assert.ok(mcq.every(question => question.choices.every(choice => !/Uses SELECT with the required|Applies the requested operation|not reasonable to expect/i.test(choice))));

  const incomplete = homework.filter(question => INCOMPLETE_SOURCE_IDS.has(question.id));
  assert.equal(incomplete.length, INCOMPLETE_SOURCE_IDS.size);
  assert.ok(incomplete.every(question =>
    question.type !== "mcq" &&
    question.assessmentMode === "open-response" &&
    question.reviewStatus === "source-solution-incomplete" &&
    /Source note:/.test(question.solution)
  ));
});
