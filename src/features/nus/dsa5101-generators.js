/* Seeded DSA5101 practice generators. The canonical template catalog owns
 * provenance and study-card metadata; this module only supplies arithmetic. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_DSA5101_GENERATORS = factory;
})(typeof globalThis === "object" ? globalThis : this, function createDsa5101Generators(options) {
  const config = options || {};
  const getTemplates = typeof config.getTemplates === "function" ? config.getTemplates : () => config.templates || null;

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
  function catalogFor(input) {
    const value = input || {};
    const catalog = value.templates || getTemplates(value.courseCode);
    return catalog && catalog.courseId === "DSA5101" ? catalog : null;
  }
  function templateFor(catalog, generatorId) {
    return (catalog && catalog.templates || []).find(template => template.generatorId === generatorId) || null;
  }
  function base(template, generatorId, seed, prompt, solution, explanation, extra = {}) {
    return {
      id: `generated:${generatorId}:${seed}`,
      courseId: "DSA5101",
      lessonId: template.lessonId,
      type: template.questionType,
      difficulty: "hard",
      skill: template.skill,
      topic: template.cardId,
      cognitiveLevel: "apply",
      estimatedSeconds: 90,
      timedSeconds: 90,
      prompt,
      solution,
      explanation,
      misconception: template.failureModes[0],
      visualHook: `Trace the ${template.cardId} card with a small worked table before calculating.`,
      sourceRefs: template.sourceRefs.map(ref => ({ ...ref })),
      origin: "generated",
      generatedFrom: template.id,
      generationSeed: seed,
      assessmentLayer: "generated-practice",
      templateId: template.id,
      cardId: template.cardId,
      ...extra
    };
  }
  function numeric(template, generatorId, seed, prompt, solution, explanation, expected) {
    return base(template, generatorId, seed, prompt, solution, explanation, { grading: { type: "numeric", expected, tolerance: 0.01 } });
  }

  function support(seed, template) {
    const next = random(seed), total = integer(next, 12, 30), occurrences = integer(next, 3, total - 3), expected = round(occurrences / total);
    return numeric(template, "dsa5101-support", seed, `In ${total} baskets, itemset I occurs in ${occurrences}. Compute support(I) as a decimal.`, `support(I) = ${occurrences}/${total} = ${expected}.`, "Support divides qualifying baskets by all baskets; it is not conditioned on an antecedent.", expected);
  }
  function jaccard(seed, template) {
    const next = random(seed), left = integer(next, 4, 9), right = integer(next, 4, 9), intersection = integer(next, 1, Math.min(left, right) - 1), union = left + right - intersection, expected = round(intersection / union);
    return numeric(template, "dsa5101-jaccard", seed, `Two documents have ${left} unique shingles and ${right} unique shingles, with ${intersection} shared. Compute set Jaccard similarity.`, `J(A,B) = ${intersection}/${union} = ${expected}.`, "The union subtracts the shared set members once; repeated shingle occurrences do not create extra set members.", expected);
  }
  function minhashCollision(seed, template) {
    const next = random(seed), similarityTenths = integer(next, 2, 9), similarity = similarityTenths / 10;
    return numeric(template, "dsa5101-minhash-collision", seed, `Two shingle sets have Jaccard similarity s=${similarity}. What is the collision probability for one random MinHash row?`, `P(one-row collision) = s = ${similarity}.`, "For one MinHash row, the collision probability equals Jaccard similarity. The band and whole-LSH events use different formulas.", similarity);
  }
  function lshProbability(seed, template) {
    const next = random(seed), similarity = integer(next, 4, 9) / 10, rows = integer(next, 2, 4), bands = integer(next, 2, 6), band = Math.pow(similarity, rows), expected = round(1 - Math.pow(1 - band, bands));
    return numeric(template, "dsa5101-lsh-probability", seed, `For similarity s=${similarity}, ${bands} bands, and ${rows} rows per band, compute the probability that the pair is an LSH candidate.`, `P(candidate) = 1-(1-${similarity}^${rows})^${bands} = ${expected}.`, "All rows must agree inside one band, then at least one band must agree. That is AND inside and OR outside.", expected);
  }
  function linkage(seed, template) {
    const next = random(seed), first = integer(next, 2, 10), second = integer(next, 2, 10), expected = round((first + second) / 2);
    return numeric(template, "dsa5101-linkage", seed, `Average linkage compares clusters through cross-distances ${first} and ${second}. What is the new cluster distance?`, `d_average = (${first}+${second})/2 = ${expected}.`, "Average linkage takes the mean over cross-cluster pairs. Single and complete linkage would take the minimum and maximum instead.", expected);
  }
  function kmeans(seed, template) {
    const next = random(seed), points = Array.from({ length: 3 }, () => integer(next, 1, 12)), expected = round(points.reduce((sum, point) => sum + point, 0) / points.length);
    return numeric(template, "dsa5101-kmeans", seed, `A fixed K-means cluster contains the one-dimensional points ${points.join(", ")}. Recompute its centroid.`, `z = (${points.join("+")})/${points.length} = ${expected}.`, "With assignments fixed, ordinary K-means updates the representative to the arithmetic mean.", expected);
  }
  function centeredCosine(seed, template) {
    const next = random(seed), left = Array.from({ length: 3 }, () => integer(next, 1, 5)), right = Array.from({ length: 3 }, () => integer(next, 1, 5));
    const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
    const aMean = mean(left), bMean = mean(right), a = left.map(value => value - aMean), b = right.map(value => value - bMean);
    if (a.every(value => value === 0) || b.every(value => value === 0)) return centeredCosine(`${seed}:retry`, template);
    const numerator = a.reduce((sum, value, index) => sum + value * b[index], 0);
    const denominator = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0) * b.reduce((sum, value) => sum + value * value, 0));
    const expected = round(numerator / denominator);
    return numeric(template, "dsa5101-centered-cosine", seed, `User A rates shared items ${left.join(", ")} and user B rates them ${right.join(", ")}. After subtracting each user's mean, compute their cosine similarity.`, `A' = (${a.join(",")}), B' = (${b.join(",")}), cosine = ${expected}.`, "Center the two rows on their own means before taking the dot product and norm. This compares deviations from baseline generosity.", expected);
  }
  function neighborPrediction(seed, template) {
    const next = random(seed), targetMean = integer(next, 2, 4), similarityA = integer(next, 2, 8) / 10, similarityB = integer(next, 2, 8) / 10, meanA = integer(next, 2, 4), meanB = integer(next, 2, 4), ratingA = Math.max(1, Math.min(5, meanA + integer(next, -1, 1))), ratingB = Math.max(1, Math.min(5, meanB + integer(next, -1, 1)));
    const expected = round(targetMean + (similarityA * (ratingA - meanA) + similarityB * (ratingB - meanB)) / (similarityA + similarityB));
    return numeric(template, "dsa5101-neighbor-prediction", seed, `The target user's mean is ${targetMean}. Neighbour A has similarity ${similarityA}, mean ${meanA}, and target-item rating ${ratingA}; neighbour B has similarity ${similarityB}, mean ${meanB}, and rating ${ratingB}. Compute the normalized user-based prediction.`, `prediction = ${targetMean} + [${similarityA}(${ratingA}-${meanA}) + ${similarityB}(${ratingB}-${meanB})]/(${similarityA}+${similarityB}) = ${expected}.`, "Center each neighbour rating by its own mean, normalize the weighted deviation by the similarity sum, then add the target user's baseline.", expected);
  }
  function pagerank(seed, template) {
    const next = random(seed), firstRank = integer(next, 2, 8) / 10, secondRank = round(1 - firstRank), firstColumn = integer(next, 2, 8) / 10, secondColumn = integer(next, 2, 8) / 10, expected = round(firstColumn * firstRank + secondColumn * secondRank);
    return numeric(template, "dsa5101-pagerank", seed, `Using a column-stochastic matrix M=[[${firstColumn},${secondColumn}],[${round(1 - firstColumn)},${round(1 - secondColumn)}]] and r=[${firstRank},${secondRank}]^T, compute the next rank of node A.`, `r'_A = ${firstColumn}(${firstRank}) + ${secondColumn}(${secondRank}) = ${expected}.`, "The column-stochastic convention sends source mass down columns, so the rank vector is multiplied on the left by M.", expected);
  }
  function dgim(seed, template) {
    const next = random(seed), oldest = Math.pow(2, integer(next, 3, 5)), fullBuckets = Array.from({ length: integer(next, 3, 5) }, (_, index) => Math.pow(2, Math.min(Math.floor(index / 2), 2))), expected = round(fullBuckets.reduce((sum, size) => sum + size, 0) + oldest / 2);
    return numeric(template, "dsa5101-dgim", seed, `A DGIM query fully covers buckets of sizes ${fullBuckets.join(", ")} and cuts the oldest bucket of size ${oldest} in half. What estimate does the boundary rule return?`, `estimate = ${fullBuckets.join("+")}+${oldest}/2 = ${expected}.`, "Count fully covered buckets exactly and include half of the oldest partial bucket; that oldest bucket is the uncertainty source.", expected);
  }
  function amsF2(seed, template) {
    const next = random(seed), frequencies = Array.from({ length: 3 }, () => integer(next, 1, 7)), expected = frequencies.reduce((sum, value) => sum + value * value, 0);
    return numeric(template, "dsa5101-ams-f2", seed, `A stream has key frequencies ${frequencies.join(", ")}. Compute its second frequency moment F_2.`, `F_2 = ${frequencies.map(value => `${value}^2`).join("+")} = ${expected}.`, "The second moment squares each key frequency; it is not the stream length or the number of distinct keys.", expected);
  }
  function balance(seed, template) {
    const next = random(seed), a = integer(next, 1, 5), b = integer(next, 1, 5), tie = next() < 0.35, budgetA = tie ? b : a, chosen = budgetA >= b ? "A" : "B", remaining = Math.max(budgetA, b) - 1;
    const choices = [`Advertiser ${chosen}; its remaining budget becomes ${remaining}`, `Advertiser ${chosen}; its remaining budget becomes ${remaining + 1}`, `Advertiser ${chosen === "A" ? "B" : "A"}; its remaining budget becomes ${Math.max(budgetA, b)}`, "Reject the query because BALANCE never resolves ties", "Choose by original budget, ignoring current remaining budget", "Choose the advertiser with fewer eligible keywords"];
    const tieNote = tie ? " The budgets tie, so use the stated alphabetical tie rule." : "";
    return base(template, "dsa5101-balance", seed, `Advertiser A has remaining budget ${budgetA} and B has ${b}; both bid on the current query. Which allocation follows BALANCE?${tieNote}`, `BALANCE selects ${chosen} and leaves it with ${remaining}.`, "Compare the current remaining budgets among eligible advertisers, then apply the tie rule before decrementing exactly one budget.", { type: "mcq", choices, answer: 0 });
  }

  const implementations = { "dsa5101-support": support, "dsa5101-jaccard": jaccard, "dsa5101-minhash-collision": minhashCollision, "dsa5101-lsh-probability": lshProbability, "dsa5101-linkage": linkage, "dsa5101-kmeans": kmeans, "dsa5101-centered-cosine": centeredCosine, "dsa5101-neighbor-prediction": neighborPrediction, "dsa5101-pagerank": pagerank, "dsa5101-dgim": dgim, "dsa5101-ams-f2": amsF2, "dsa5101-balance": balance };
  function definitions(catalog) {
    return Object.keys(implementations).map(generatorId => ({ id: generatorId, generatorId, template: templateFor(catalog, generatorId), generate: implementations[generatorId] })).filter(item => item.template);
  }
  function forSkills(input) {
    const request = input || {};
    const all = definitions(catalogFor(request));
    const skills = new Set(request.skills || []);
    const matched = all.filter(item => skills.has(item.template.skill) || skills.has(item.generatorId) || skills.has(item.template.id));
    return matched.length ? matched : all;
  }
  function generateOne(input) {
    const request = input || {};
    const catalog = catalogFor(request);
    const item = definitions(catalog).find(candidate => candidate.generatorId === request.generatorId);
    return item ? item.generate(String(request.generationSeed == null ? 1 : request.generationSeed), item.template) : null;
  }
  function generate(input) {
    const request = input || {};
    const pool = forSkills(request);
    if (!pool.length) return [];
    const limit = Math.max(1, Number(request.limit) || 1);
    const seed = request.seed == null ? 1 : request.seed;
    return Array.from({ length: limit }, (_, index) => {
      const item = pool[index % pool.length];
      return item.generate(`${seed}:${index}`, item.template);
    });
  }
  return Object.freeze({ forSkills, generate, generateOne });
});
