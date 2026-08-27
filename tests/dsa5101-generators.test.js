const test = require("node:test");
const assert = require("node:assert/strict");
const catalog = require("../content/courses/DSA5101/questions/templates.json");
const createExamGenerators = require("../src/features/nus/exam-generators.js");

const generatorTemplates = catalog.templates.filter(template => template.generatorId);

function generatorApi() {
  return createExamGenerators({ getTemplates: () => catalog });
}

test("DSA5101 seeded generators cover every numeric question family", () => {
  const generators = generatorApi();
  const questions = generators.generate({ courseCode: "DSA5101", templates: catalog, seed: "exam-seed", limit: generatorTemplates.length });
  assert.equal(questions.length, generatorTemplates.length);
  assert.deepEqual(questions, generators.generate({ courseCode: "DSA5101", templates: catalog, seed: "exam-seed", limit: generatorTemplates.length }));
  assert.equal(new Set(questions.map(question => question.generatedFrom)).size, generatorTemplates.length);
  questions.forEach(question => {
    const template = catalog.templates.find(item => item.id === question.generatedFrom);
    assert.ok(template);
    assert.equal(question.courseId, "DSA5101");
    assert.equal(question.cardId, template.cardId);
    assert.equal(question.lessonId, template.lessonId);
    assert.equal(question.assessmentLayer, "generated-practice");
    assert.equal(question.origin, "generated");
    assert.ok(question.sourceRefs.some(ref => ref.sourceType === "ref" && ref.url.includes("stanford.edu")));
    if (question.type === "calculation") assert.equal(question.grading.type, "numeric");
  });
  const balance = questions.find(question => question.generatedFrom === "balance-trace");
  assert.equal(balance.type, "mcq");
  assert.equal(balance.choices.length, 6);
});

test("DSA5101 numeric generators vary parameters instead of freezing one example", () => {
  const generators = generatorApi();
  generatorTemplates.forEach(template => {
    const values = new Set(Array.from({ length: 20 }, (_, index) => {
      const question = generators.generateOne({ courseCode: "DSA5101", templates: catalog, generatorId: template.generatorId, generationSeed: `variation-${index}` });
      return JSON.stringify({ prompt: question.prompt, solution: question.solution, choices: question.choices });
    }));
    assert.ok(values.size > 1, `${template.generatorId} should produce varied instances`);
  });
});

test("DSA5101 generator lookup accepts exact study-card skills", () => {
  const generators = generatorApi();
  const selected = generators.forSkills({ courseCode: "DSA5101", templates: catalog, skills: ["centered-cosine"] });
  assert.deepEqual(selected.map(item => item.id), ["dsa5101-centered-cosine"]);
  assert.equal(selected[0].template.cardId, "recommender-centering");
});
