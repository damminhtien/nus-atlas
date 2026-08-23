const test = require("node:test");
const assert = require("node:assert/strict");
const createExamScheduleFeature = require("../src/features/nus/exam-schedule");

function makeFeature(overrides = {}) {
  return createExamScheduleFeature({
    getCourses: () => [
      { code: "DSA5208", title: "Distributed Systems" },
      { code: "DSA5105", title: "Machine Learning" },
      { code: "DSA5101", title: "Big Data" }
    ],
    getSchedule: () => ({
      courses: {
        DSA5208: { exam: null },
        DSA5105: { exam: { date: "2026-11-27T14:30:00+08:00", durationMinutes: 150, status: "confirmed" } },
        DSA5101: { exam: { date: "2026-11-28T13:00:00+08:00", durationMinutes: 150, status: "confirmed" } }
      }
    }),
    getAssessments: () => [
      { courseCode: "DSA5105", kind: "exam", title: "Final exam", officialFacts: { weight: { value: 50 }, timing: { date: "2026-11-27" } } },
      { courseCode: "DSA5101", kind: "exam", title: "Final open-book exam", officialFacts: { weight: { value: 50 }, timing: { date: "2026-11-28" } } }
    ],
    formatDate: value => value,
    esc: value => String(value),
    ...overrides
  });
}

test("exam schedule keeps only confirmed exams with synchronized assessment dates", () => {
  const exams = makeFeature().confirmedExams();
  assert.deepEqual(exams.map(item => item.code), ["DSA5105", "DSA5101"]);
  assert.equal(exams[0].durationMinutes, 150);
  assert.equal(exams[0].weight, "50%");
});

test("exam schedule excludes a stale or mismatched record", () => {
  const feature = makeFeature({
    getSchedule: () => ({ courses: { DSA5105: { exam: { date: "2026-11-29T14:30:00+08:00", status: "confirmed" } } } })
  });
  assert.deepEqual(feature.confirmedExams(), []);
});

test("countdown uses live seconds and never goes negative", () => {
  const date = "2026-11-27T14:30:00+08:00";
  const now = Date.parse("2026-11-27T14:29:00+08:00");
  assert.deepEqual(makeFeature().remaining(date, now), { totalSeconds: 60, days: 0, hours: 0, minutes: 1, seconds: 0 });
  assert.equal(makeFeature().countdownLabel(date, Date.parse("2026-11-27T14:30:00+08:00")), "Exam time");
  assert.equal(makeFeature().countdownLabel(date, Date.parse("2026-11-27T14:30:01+08:00")), "Exam passed");
  assert.equal(makeFeature().daysLabel(date, Date.parse("2026-11-27T14:30:01+08:00")), "Exam passed");
});
