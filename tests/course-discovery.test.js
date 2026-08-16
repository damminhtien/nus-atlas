const test = require("node:test");
const assert = require("node:assert/strict");
const createRepository = require("../src/core/content/repository.js");

function entry(code) {
  return {
    code,
    course: { code, title: `${code} fixture`, schemaVersion: "nus.course.v1" },
    modules: [{ id: `${code.toLowerCase()}-module`, title: "Fixture module", lessons: [{
      id: `${code.toLowerCase()}-lesson`,
      title: "Fixture lesson",
      week: 1,
      minutes: 10,
      questionIds: [],
      schemaVersion: "nus.lesson-outline.v1"
    }] }],
    assessments: [],
    labs: []
  };
}

function repository(courses) {
  return createRepository({
    catalog: { courses },
    transport: {
      loadCourse: async code => courses.some(course => course.code === code) ? {
        course: { ...entry(code).course },
        outline: { schemaVersion: "nus.course-outline.v1", courseId: code, course: entry(code).course, modules: entry(code).modules },
        content: { modules: entry(code).modules },
        assessments: []
      } : null,
      loadLesson: async () => null
    }
  });
}

test("course discovery has no renderer allowlist and tolerates removal", async () => {
  const added = repository([entry("DSA9999")]);
  assert.deepEqual(added.listCourses().map(course => course.code), ["DSA9999"]);
  assert.equal(added.listLessons("DSA9999").length, 1);
  assert.ok(await added.loadCourse("DSA9999"));

  const removed = repository([]);
  assert.deepEqual(removed.listCourses(), []);
  assert.equal(removed.getCourse("DSA9999"), null);
  assert.equal(await removed.loadCourse("DSA9999"), null);
});
