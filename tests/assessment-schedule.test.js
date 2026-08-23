const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { compileCourse, assessmentWeightTotal } = require("../tools/content-compiler");

function read(course, file) {
  return JSON.parse(fs.readFileSync(`content/courses/${course}/${file}`, "utf8"));
}

test("confirmed exam dates stay synchronized with assessment records", () => {
  for (const course of ["DSA5101", "DSA5104", "DSA5105"]) {
    const schedule = read(course, "schedule.json");
    const final = read(course, "assessments.json").find(item => item.kind === "exam" && item.title.toLowerCase().includes("final"));
    assert.ok(final, `${course} needs a final assessment record`);
    assert.equal(schedule.exam.status, "confirmed");
    assert.equal(schedule.exam.date.slice(0, 10), final.officialFacts.timing.date, `${course} schedule and assessment dates must match`);
  }
});

test("every course has a complete assessment weight model", () => {
  for (const course of ["DSA5101", "DSA5104", "DSA5105", "DSA5208"]) {
    const compiled = compileCourse(process.cwd(), course).package;
    assert.equal(assessmentWeightTotal(compiled.assessments), 100, `${course} weights must total 100%`);
    assert.ok(compiled.assessments.every(item => item.schemaVersion === "nus.assessment.v2"));
    assert.ok(compiled.assessments.every(item => item.officialFacts && item.studentGuidance));
  }
});

test("DSA5101 date-only deadlines never invent a 23:59 submission time", () => {
  const assessments = read("DSA5101", "assessments.json");
  for (const item of assessments.filter(assessment => assessment.kind !== "exam")) {
    const timing = item.officialFacts.timing;
    assert.match(timing.date, /^2026-\d{2}-\d{2}$/);
    assert.equal(timing.time, null);
    assert.equal(timing.timeStatus, "pending");
    assert.equal(timing.granularity, "date-only");
    assert.equal(timing.sourceRefs[0].page, 1);
  }
});

test("DSA5104 preserves four project milestones and field-level provenance", () => {
  const assessments = read("DSA5104", "assessments.json");
  assert.deepEqual(assessments.filter(item => item.kind === "project").map(item => item.id), [
    "dsa5104-project-1", "dsa5104-project-2", "dsa5104-project-3", "dsa5104-project-4"
  ]);
  assert.equal(assessments[0].officialFacts.timing.relativeTrigger, "after Chapter 3");
  assert.equal(assessments[1].officialFacts.timing.relativeTrigger, "after Chapter 9");
  assert.equal(assessments[2].officialFacts.timing.relativeTrigger, "assigned by Dr Yang");
  assert.equal(assessments[0].officialFacts.weight.groupTotal, 60);
  assert.equal(assessments[0].officialFacts.timing.sourceRefs[0].page, 1);
  assert.equal(assessments[0].officialFacts.submission.sourceRefs[0].page, 1);
  assert.equal(assessments.find(item => item.kind === "exam").officialFacts.format.sourceRefs[0].page, 1);
});

test("DSA5105 has three separately trackable quizzes and a cautious final scope", () => {
  const schedule = read("DSA5105", "schedule.json");
  const assessments = read("DSA5105", "assessments.json");
  assert.deepEqual(assessments.filter(item => item.kind === "quiz").map(item => item.id), ["dsa5105-quiz-1", "dsa5105-quiz-2", "dsa5105-quiz-3"]);
  assert.deepEqual(assessments.filter(item => item.kind === "quiz").map(item => item.officialFacts.weight.value), [10, 10, 10]);
  const final = assessments.find(item => item.id === "dsa5105-final");
  assert.equal(schedule.exam.scope.status, "pending-confirmation");
  assert.equal(final.officialFacts.scope.status, "pending-confirmation");
  assert.ok(final.studentGuidance.checklist.includes("Review all released official lectures unless explicitly excluded"));
  assert.ok(!final.studentGuidance.checklist.some(item => item.includes("Weeks 6, 8-13")));
});

test("DSA5208 has no exam and keeps project descriptions separate from guidance", () => {
  const schedule = read("DSA5208", "schedule.json");
  const assessments = read("DSA5208", "assessments.json");
  assert.equal(schedule.exam, null);
  assert.equal(schedule.hasFinalExam, false);
  assert.equal(assessments.some(item => item.kind === "exam"), false);
  assert.equal(assessmentWeightTotal(assessments.map(item => ({ ...item, officialFacts: item.officialFacts }))), 100);
  assert.equal(assessments[0].officialFacts.weight.sourceRefs[0].page, 2);
  assert.equal(assessments[0].officialFacts.scope.sourceRefs[0].page, 16);
  assert.equal(assessments[0].officialFacts.groupPolicy.value, "Group project; at most 3 people per group.");
  assert.equal(assessments[2].officialFacts.scope, undefined);
});
