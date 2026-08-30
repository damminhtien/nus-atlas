/* On-demand deterministic deep-practice question generators. Generated items
 * are deliberately separate from canonical question banks and exam evidence. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_EXAM_GENERATORS = factory;
})(typeof globalThis === "object" ? globalThis : this, function createExamGenerators(options) {
  const config = options || {};
  const createDsa5101Generators = config.dsa5101Generators || (typeof module === "object" && module.exports
    ? require("./dsa5101-generators")
    : null);
  const dsa5101 = createDsa5101Generators ? createDsa5101Generators({ getTemplates: config.getTemplates }) : null;
  const source = {
    ols: [{ sourceId: "DSA5105/Lec4_annotated.pdf", page: 17, sourceType: "lecture", role: "weighted objective", status: "current" }, { sourceId: "DSA5105/Textbook.pdf", page: 100, sourceType: "textbook", role: "weighted least squares", status: "supporting" }],
    ridge: [{ sourceId: "DSA5105/Lec1_annotated.pdf", page: 48, sourceType: "lecture", role: "regularization", status: "current" }, { sourceId: "DSA5105/Lec1_exercises-solutions.pdf", page: 2, sourceType: "exercise", role: "ridge spectral filter", status: "current-context" }],
    svm: [{ sourceId: "DSA5105/Lec4_annotated.pdf", page: 23, sourceType: "lecture", role: "SVM dual", status: "current" }, { sourceId: "DSA5105/Lec4_annotated.pdf", page: 25, sourceType: "lecture", role: "KKT cases", status: "current" }],
    pca: [{ sourceId: "DSA5105/Lec3_annotated.pdf", page: 48, sourceType: "lecture", role: "PCA reconstruction", status: "current" }, { sourceId: "DSA5105/Textbook.pdf", page: 88, sourceType: "textbook", role: "eigenvalue solution", status: "course-depth" }],
    gmm: [{ sourceId: "DSA5105/Textbook.pdf", page: 98, sourceType: "textbook", role: "Gaussian mixture models", status: "course-depth" }, { sourceId: "DSA5105/Ref/document.pdf", page: 5, sourceType: "ref", role: "past-exam GMM responsibility alignment", status: "assessment-derived" }],
    backprop: [{ sourceId: "DSA5105/Lec5_annotated.pdf", page: 46, sourceType: "lecture", role: "backprop chain rule", status: "current" }, { sourceId: "DSA5105/Textbook.pdf", page: 52, sourceType: "textbook", role: "backpropagation", status: "course-depth" }],
    mdp: [{ sourceId: "DSA5105/Lec6_annotated.pdf", page: 17, sourceType: "lecture", role: "value iteration", status: "current" }, { sourceId: "DSA5105/Textbook.pdf", page: 115, sourceType: "textbook", role: "value iteration", status: "course-depth" }]
  };

  function hash(value) {
    let result = 2166136261;
    for (const character of String(value)) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
    return result >>> 0;
  }

  function random(seed) {
    let value = hash(seed) || 1;
    return () => {
      value = Math.imul(value ^ value >>> 15, 1 | value);
      value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function integer(next, min, max) { return min + Math.floor(next() * (max - min + 1)); }
  function round(value) { return Number(value.toFixed(6)); }
  function base(id, generatedFrom, generationSeed, skill, topic, prompt, solution, explanation, sourceRefs, extra = {}) {
    return {
      id: `generated:${id}:${generationSeed}`,
      type: "calculation",
      difficulty: "medium",
      skill,
      topic,
      cognitiveLevel: "apply",
      estimatedSeconds: 90,
      timedSeconds: 90,
      prompt,
      solution,
      explanation,
      misconception: "Do not skip the objective, assumptions, or normalization step.",
      visualHook: "Write the quantities on paper, then check the invariant before substituting numbers.",
      sourceRefs: sourceRefs.map(ref => ({ ...ref })),
      origin: "generated",
      generatedFrom,
      generationSeed,
      assessmentLayer: "generated-practice",
      ...extra
    };
  }

  function weightedOls(seed) {
    const next = random(seed), a1 = integer(next, 1, 5), a2 = integer(next, 1, 5), y1 = integer(next, 1, 9), y2 = integer(next, 1, 9);
    const expected = round((a1 * y1 + a2 * y2) / (a1 + a2));
    return base("weighted-ols", "weighted-ols-normal-equation", seed, "weighted-ols", "weighted least squares", `For the constant model, minimize ${a1}(w-${y1})^2 + ${a2}(w-${y2})^2. What is the weighted least-squares estimate w?`, `w = (${a1}·${y1} + ${a2}·${y2})/(${a1}+${a2}) = ${expected}.`, "Different positive weights change the relative contribution of each residual, so differentiate the weighted objective and divide by the total weight.", source.ols, { grading: { type: "numeric", expected, tolerance: 0.01 } });
  }

  function ridge(seed) {
    const next = random(seed), mu = integer(next, 1, 9), lambda = integer(next, 1, 6), expected = round(mu / (mu + lambda));
    return base("ridge-spectrum", "ridge-spectral-filter", seed, "ridge-spectrum", "ridge spectral shrinkage", `An eigenvalue of A is ${mu} and the ridge parameter is ${lambda}. Compute the spectral shrinkage factor ${String.raw`\(\mu/(\mu+\lambda)\)`}.`, `The factor is ${mu}/(${mu}+${lambda}) = ${expected}.`, "Ridge keeps every eigen-direction but shrinks it by μ/(μ+λ); small-eigenvalue directions shrink more.", source.ridge, { grading: { type: "numeric", expected, tolerance: 0.01 } });
  }

  function svm(seed) {
    const next = random(seed), margin = integer(next, 1, 3);
    return base("svm-kkt", "svm-margin-kkt", seed, "svm-kkt", "SVM KKT", `For a hard-margin SVM with signed margin y_i(w^T x_i+b) = ${margin}, which statement is correct?`, "If the margin is exactly 1, the point can be a support vector; a margin strictly greater than 1 has zero dual multiplier.", "Support vectors are the active constraints in the KKT system, not every training point.", source.svm, { type: "mcq", choices: ["Only points with margin greater than 1 are support vectors.", "A point at the active margin can have a nonzero dual multiplier.", "KKT complementary slackness is irrelevant to support vectors.", "Every point must have the same dual multiplier."], answer: 1, skill: "svm-kkt" });
  }

  function pca(seed) {
    const next = random(seed), first = integer(next, 2, 8), second = integer(next, 1, first), expected = round(first / (first + second));
    return base("pca-variance", "pca-explained-variance", seed, "pca-variance", "PCA explained variance", `Two principal directions have eigenvalues ${first} and ${second}. What fraction of the two-dimensional variance is explained by the first direction?`, `The explained-variance ratio is ${first}/(${first}+${second}) = ${expected}.`, "PCA variance ratios normalize an eigenvalue by the sum of the retained eigenvalues.", source.pca, { grading: { type: "numeric", expected, tolerance: 0.01 } });
  }

  function gmm(seed) {
    const next = random(seed), prior = integer(next, 1, 4), otherPrior = integer(next, 1, 4), likelihood = integer(next, 1, 5), otherLikelihood = integer(next, 1, 5), numerator = prior * likelihood, denominator = numerator + otherPrior * otherLikelihood, expected = round(numerator / denominator);
    return base("gmm-responsibility", "gmm-em-responsibility", seed, "em-responsibility", "GMM E-step", `For one observation, π_1=${prior}, q_1=${likelihood}, π_2=${otherPrior}, and q_2=${otherLikelihood} are proportional prior and likelihood terms. Compute responsibility r_1 = π_1q_1/(π_1q_1+π_2q_2).`, `r_1 = ${numerator}/${denominator} = ${expected}.`, "The E-step normalizes each component's prior-times-likelihood contribution across components.", source.gmm, { grading: { type: "numeric", expected, tolerance: 0.01 } });
  }

  function backprop(seed) {
    const next = random(seed), weight = integer(next, 1, 5), input = integer(next, 1, 5), target = integer(next, 1, 9), output = weight * input, expected = 2 * (output - target) * input;
    return base("backprop-scalar", "backprop-squared-error", seed, "backpropagation", "backpropagation", `Let y = wx with w=${weight}, x=${input}, target t=${target}, and loss L=(y-t)^2. Compute ∂L/∂w.`, `∂L/∂w = 2(wx-t)x = 2(${output}-${target})(${input}) = ${expected}.`, "Backpropagation applies the chain rule: differentiate the loss with respect to the output, then multiply by the local derivative ∂y/∂w=x.", source.backprop, { grading: { type: "numeric", expected, tolerance: 0.01 } });
  }

  function mdp(seed) {
    const next = random(seed), reward = integer(next, 1, 8), gamma = integer(next, 1, 8) / 10, best = integer(next, 1, 8), expected = round(reward + gamma * best);
    return base("mdp-backup", "mdp-value-backup", seed, "value-iteration", "MDP value iteration", `A value-iteration backup has reward r=${reward}, discount γ=${gamma}, and best next-state value ${best}. Compute the backed-up value r + γ max_a V(s').`, `V_new = ${reward} + ${gamma}(${best}) = ${expected}.`, "Value iteration applies the Bellman optimality backup: immediate reward plus discounted best continuation value.", source.mdp, { grading: { type: "numeric", expected, tolerance: 0.01 } });
  }

  const generators = [
    { id: "weighted-ols", skills: ["weighted-ols", "ols-uniqueness", "regularized-ols", "ridge-spectrum"], generate: weightedOls },
    { id: "svm", skills: ["svm-margin", "geometric-margin", "svm-dual", "svm-kkt", "kkt"], generate: svm },
    { id: "pca", skills: ["pca-eigenvectors", "pca-reconstruction", "pca-variance"], generate: pca },
    { id: "gmm-em", skills: ["gmm-em", "em-responsibility", "em-m-step"], generate: gmm },
    { id: "backprop", skills: ["backpropagation", "gradient-descent"], generate: backprop },
    { id: "mdp", skills: ["value-iteration", "bellman-backup", "bellman-optimality", "mdp-policy"], generate: mdp }
  ];

  function isDsa5101Request(input) {
    const request = input || {};
    return request.courseCode === "DSA5101" || (request.templates && request.templates.courseId === "DSA5101");
  }

  function forSkills(skills, input) {
    const request = Array.isArray(skills) ? { ...(input || {}), skills } : (skills || {});
    if (isDsa5101Request(request) && dsa5101) return dsa5101.forSkills(request);
    const available = new Set(request.skills || []);
    return generators.filter(generator => generator.skills.some(skill => available.has(skill)));
  }

  function generate(input) {
    const request = input || {};
    if (isDsa5101Request(request) && dsa5101) return dsa5101.generate(request);
    const limit = Math.max(1, Number(request.limit) || 1);
    const available = forSkills(request.skills, request);
    const pool = available.length ? available : generators;
    const seed = request.seed == null ? 1 : request.seed;
    return Array.from({ length: limit }, (_, index) => {
      const generator = pool[index % pool.length];
      const generationSeed = `${seed}:${index}`;
      return generator.generate(generationSeed);
    });
  }

  function generateOne(input) {
    const request = input || {};
    if (isDsa5101Request(request) && dsa5101) return dsa5101.generateOne(request);
    const generator = generators.find(item => item.id === request.generatorId);
    return generator ? generator.generate(String(request.generationSeed == null ? 1 : request.generationSeed)) : null;
  }

  return Object.freeze({ list: () => generators.map(generator => ({ id: generator.id, skills: generator.skills.slice() })), forSkills, generate, generateOne, hash });
});
