const test = require("node:test");
const assert = require("node:assert/strict");
const createPlannerFeature = require("../src/features/nus/planner.js");

test("planner renders assessment state without owning the data source", () => {
  const root = { innerHTML: "", querySelectorAll: () => [] };
  const store = { task: () => ({ status: "in-progress", checks: [true, false] }) };
  const feature = createPlannerFeature({
    root,
    getAssessments: () => [{
      id: "a1",
      courseCode: "DSA5105",
      title: "Homework 1",
      kind: "Homework",
      weight: 10,
      date: "2026-09-01T09:00:00+08:00",
      checklist: ["Read", "Attempt"],
      source: { sourceId: "lecture.pdf", page: 3 }
    }],
    getStore: () => store,
    pageHead: (_kicker, title) => `<h1>${title}</h1>`,
    dayCount: () => 4,
    fmtDate: () => "Sep 1, 2026",
    statusPill: status => `<b>${status}</b>`,
    sourceLabel: ref => `${ref.sourceId} · p.${ref.page}`,
    esc: value => String(value)
  });

  feature.render();

  assert.match(root.innerHTML, /What is coming next\?/);
  assert.match(root.innerHTML, /DSA5105/);
  assert.match(root.innerHTML, /1\/2 checklist items/);
  assert.match(root.innerHTML, /lecture\.pdf · p\.3/);
  assert.match(root.innerHTML, /href="#\/nus\/course\/DSA5105"/);
  assert.match(root.innerHTML, /href="#\/nus\/exam\/DSA5105"/);
});

test("planner renders confirmed week timing without inventing an exact date", () => {
  const root = { innerHTML: "", querySelectorAll: () => [] };
  const feature = createPlannerFeature({
    root,
    getAssessments: () => [{
      id: "midterm",
      courseCode: "DSA5105",
      title: "Midterm",
      kind: "exam",
      weight: 20,
      date: null,
      dateStatus: "week-confirmed",
      timing: { granularity: "week", week: 7, status: "confirmed" },
      checklist: ["Confirm exact session"],
      source: { sourceId: "DSA5105/syllabus.pdf", page: 1 }
    }],
    getStore: () => ({ task: () => ({ status: "todo", checks: [] }) }),
    pageHead: (_kicker, title) => `<h1>${title}</h1>`,
    dayCount: () => null,
    fmtDate: value => value,
    statusPill: status => `<b>${status}</b>`,
    sourceLabel: ref => `${ref.sourceId} · p.${ref.page}`,
    esc: value => String(value)
  });

  feature.render();

  assert.match(root.innerHTML, /Week 7 confirmed/);
  assert.match(root.innerHTML, /Exact session\/time pending/);
  assert.doesNotMatch(root.innerHTML, /2026-/);
});

test("planner renders the confirmed assessment time from timing metadata", () => {
  const root = { innerHTML: "", querySelectorAll: () => [] };
  const feature = createPlannerFeature({
    root,
    getAssessments: () => [{
      id: "midterm",
      courseCode: "DSA5105",
      title: "Midterm",
      kind: "exam",
      weight: 20,
      date: "2026-09-29",
      timing: { date: "2026-09-29", time: "14:00–17:00", timeStatus: "confirmed", granularity: "exact" },
      checklist: ["Review"]
    }],
    getStore: () => ({ task: () => ({ status: "todo", checks: [] }) }),
    pageHead: (_kicker, title) => `<h1>${title}</h1>`,
    dayCount: () => 37,
    fmtDate: value => value,
    formatAssessmentDate: assessment => `${assessment.date} · ${assessment.timing.time}`,
    statusPill: status => `<b>${status}</b>`,
    sourceLabel: () => "",
    esc: value => String(value)
  });

  feature.render();

  assert.match(root.innerHTML, /2026-09-29 · 14:00–17:00/);
});

test("planner uses a date-only formatter for deadlines without a supplied time", () => {
  const root = { innerHTML: "", querySelectorAll: () => [] };
  const feature = createPlannerFeature({
    root,
    getAssessments: () => [{
      id: "date-only",
      courseCode: "DSA5101",
      title: "Assignment 1",
      kind: "assignment",
      weight: 15,
      date: "2026-09-13",
      timeStatus: "pending",
      checklist: ["Submit"]
    }],
    getStore: () => ({ task: () => ({ status: "todo", checks: [] }) }),
    pageHead: (_kicker, title) => `<h1>${title}</h1>`,
    dayCount: () => 10,
    fmtDate: () => "Sep 13, 2026, 8:00 AM",
    formatAssessmentDate: () => "Sep 13, 2026",
    statusPill: status => `<b>${status}</b>`,
    sourceLabel: () => "",
    esc: value => String(value)
  });

  feature.render();

  assert.match(root.innerHTML, /Sep 13, 2026/);
  assert.doesNotMatch(root.innerHTML, /8:00 AM/);
});

test("planner renders grouped assessment weights without inventing an individual percentage", () => {
  const root = { innerHTML: "", querySelectorAll: () => [] };
  const feature = createPlannerFeature({
    root,
    getAssessments: () => [{
      id: "project-1",
      courseCode: "DSA5104",
      title: "Project 1",
      kind: "project",
      weight: null,
      weightLabel: "part of 60%",
      date: null,
      checklist: ["Confirm brief"]
    }],
    getStore: () => ({ task: () => ({ status: "todo", checks: [] }) }),
    pageHead: (_kicker, title) => `<h1>${title}</h1>`,
    dayCount: () => null,
    fmtDate: () => "Date pending",
    formatAssessmentWeight: assessment => assessment.weightLabel,
    statusPill: status => `<b>${status}</b>`,
    sourceLabel: () => "",
    esc: value => String(value)
  });

  feature.render();

  assert.match(root.innerHTML, /part of 60%/);
  assert.doesNotMatch(root.innerHTML, /null%/);
});

test("planner renders the Project 1 study deadline and brief roadmap", () => {
  const root = { innerHTML: "", querySelectorAll: () => [] };
  const feature = createPlannerFeature({
    root,
    getAssessments: () => [{
      id: "project-1",
      courseCode: "DSA5104",
      title: "Project 1",
      kind: "project",
      weightLabel: "part of 60%",
      date: null,
      studentPlan: { deadline: "2026-09-06T09:00:00+08:00", label: "Complete Project 1", timeZone: "Asia/Singapore", origin: "user-set" },
      projectBrief: {
        summary: "Fourteen read-only SQL queries.",
        database: { name: "kaggle_car", rowCount: 558797, tables: [{ name: "car_sales", columns: ["vin"], primaryKey: "vin" }] },
        requirements: ["Exactly 14 statements."],
        grading: { totalMarks: 30 },
        questions: [{ number: 1, marks: 2, title: "February sales", prompt: "Count sales.", topics: ["aggregation"], expectedColumns: ["number_of_sales"] }],
        sourceRefs: [{ sourceId: "Project 1 brief", page: 1 }]
      },
      checklist: ["Submit"]
    }],
    getStore: () => ({ task: () => ({ status: "todo", checks: [] }) }),
    pageHead: (_kicker, title) => `<h1>${title}</h1>`,
    dayCount: () => 7,
    fmtDate: () => "Sep 6, 2026, 9:00 AM",
    formatAssessmentDate: () => "Sep 6, 2026, 9:00 AM · study reminder",
    formatAssessmentWeight: assessment => assessment.weightLabel,
    statusPill: status => `<b>${status}</b>`,
    sourceLabel: ref => `${ref.sourceId} · p.${ref.page}`,
    esc: value => String(value)
  });

  feature.render();

  assert.match(root.innerHTML, /Sep 6, 2026, 9:00 AM · study reminder/);
  assert.match(root.innerHTML, /Open Project 1 brief/);
  assert.match(root.innerHTML, /Fourteen read-only SQL queries/);
  assert.match(root.innerHTML, /Q1 · February sales/);
  assert.match(root.innerHTML, /Study course/);
});
