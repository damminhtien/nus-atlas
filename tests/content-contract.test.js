const test = require("node:test");
const assert = require("node:assert/strict");
const { loadLegacyState, validateContentState } = require("../scripts/validate-content");

test("legacy NUS data satisfies the content contract", () => {
  const result = validateContentState(loadLegacyState());
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.ok(result.counts.lessons > 0);
  assert.ok(result.counts.questions > 0);
});

test("content contract reports duplicate lesson IDs", () => {
  const state = {
    courses: [{ code: "DSA0000", title: "Fixture" }],
    content: { DSA0000: { modules: [{ id: "m1", lessons: [
      { id: "same", title: "One", sourceRefs: [{ sourceId: "x.pdf", page: 1 }] },
      { id: "same", title: "Two", sourceRefs: [{ sourceId: "x.pdf", page: 2 }] }
    ] }] } },
    assessments: [], labs: {}, sourceTypes: {}
  };
  const result = validateContentState(state);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes("duplicate lesson id: same")));
});

test("content contract catches broken assessment and lab references", () => {
  const result = validateContentState({
    courses: [{ code: "DSA0000", title: "Fixture" }],
    content: { DSA0000: { modules: [{ id: "m1", lessons: [{ id: "l1", title: "One", sourceRefs: [{ sourceId: "x.pdf", page: 1 }] }] }] } },
    assessments: [{ id: "a1", courseCode: "MISSING", title: "Bad", kind: "exam", checklist: ["x"] }],
    labs: { bad: { courseCode: "MISSING", lessonId: "l1", sourceRefs: [{ sourceId: "x.pdf", page: 1 }] } },
    sourceTypes: {}
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes("assessment references unknown course")));
  assert.ok(result.errors.some(error => error.includes("lab references unknown course")));
});
