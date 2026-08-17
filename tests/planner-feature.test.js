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

  assert.match(root.innerHTML, /Deadlines, checklists, and reminders/);
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
