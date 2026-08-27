const test = require("node:test");
const assert = require("node:assert/strict");
const catalog = require("../content/courses/DSA5101/questions/templates.json");
const createExamGenerators = require("../src/features/nus/exam-generators.js");

const generatorTemplates = catalog.templates.filter(template => template.generatorId);
const requiredGeneratorIds = [
  "dsa5101-support", "dsa5101-jaccard", "dsa5101-minhash-collision", "dsa5101-lsh-probability",
  "dsa5101-linkage", "dsa5101-kmeans", "dsa5101-centered-cosine", "dsa5101-neighbor-prediction",
  "dsa5101-pagerank", "dsa5101-dgim", "dsa5101-ams-f2", "dsa5101-balance",
  "dsa5101-pcy", "dsa5101-minhash-signature", "dsa5101-lsh-reverse", "dsa5101-kmeans-convergence",
  "dsa5101-latent-factor", "dsa5101-pagerank-two", "dsa5101-fm", "dsa5101-ams-estimator",
  "dsa5101-svd-sigma", "dsa5101-svd-error", "dsa5101-conductance", "dsa5101-ppr-sweep",
  "dsa5101-entropy", "dsa5101-information-gain", "dsa5101-submodular", "dsa5101-bandit-mean",
  "dsa5101-epsilon-greedy", "dsa5101-ucb"
].sort();

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
    if (question.type === "mcq") {
      assert.equal(question.choices.length, 6);
      assert.equal(new Set(question.choices).size, 6);
      assert.equal(question.answer, 0);
    }
  });
  const balance = questions.find(question => question.generatedFrom === "balance-trace");
  assert.equal(balance.type, "mcq");
  assert.equal(balance.choices.length, 6);
});

test("DSA5101 has an implementation for every catalogued generated form", () => {
  const generators = generatorApi();
  const selected = generators.generate({ courseCode: "DSA5101", templates: catalog, seed: "implementation-audit", limit: generatorTemplates.length });
  assert.deepEqual(selected.map(question => question.generatedFrom).sort(), generatorTemplates.map(template => template.id).sort());
  assert.deepEqual(generatorTemplates.map(template => template.generatorId).sort(), requiredGeneratorIds);
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
