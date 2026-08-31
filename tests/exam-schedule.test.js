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

test("assessment calendar surfaces dated assignments and study reminders before finals", () => {
  const feature = makeFeature({
    getAssessments: () => [
      { courseCode: "DSA5101", kind: "assignment", title: "Assignment 1", id: "a1", date: "2026-09-13", weightLabel: "15%" },
      { courseCode: "DSA5104", kind: "project", title: "Project 1", id: "p1", studentPlan: { deadline: "2026-09-06T09:00:00+08:00" } },
      { courseCode: "DSA5105", kind: "exam", title: "Midterm", id: "midterm", date: "2026-09-29", timing: { time: "14:00–17:00" } },
      { courseCode: "DSA5105", kind: "exam", title: "Final exam", id: "final", officialFacts: { timing: { date: "2026-11-27" } } },
      { courseCode: "DSA5101", kind: "exam", title: "Final open-book exam", id: "final-1", officialFacts: { timing: { date: "2026-11-28" } } }
    ],
    formatAssessmentDate: item => item.studentPlan ? "Sep 6, 2026 · study reminder" : item.title
  });

  const items = feature.upcomingAssessments(Date.parse("2026-08-31T00:00:00+08:00"));
  assert.deepEqual(items.slice(0, 3).map(item => item.title), ["Project 1", "Assignment 1", "Midterm"]);
  assert.equal(items[0].isStudyReminder, true);
  assert.equal(items[1].weight, "15%");
});
