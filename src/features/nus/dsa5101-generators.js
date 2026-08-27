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
  function distinctChoices(correct, alternatives) {
    const values = [correct].concat(alternatives).map(value => String(value));
    const choices = [];
    values.forEach(value => {
      if (!choices.includes(value)) choices.push(value);
    });
    while (choices.length < 6) choices.push("Option " + (choices.length + 1));
    return choices.slice(0, 6);
  }
  function mcq(template, generatorId, seed, prompt, solution, explanation, correct, alternatives) {
    return base(template, generatorId, seed, prompt, solution, explanation, {
      type: "mcq",
      choices: distinctChoices(correct, alternatives),
      answer: 0
    });
  }
  function shuffled(next, values) {
    const result = values.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swap = integer(next, 0, index);
      [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
  }
  function pcy(seed, template) {
    const next = random(seed);
    const threshold = integer(next, 3, 5);
    const counts = [
      threshold + integer(next, 0, 3),
      threshold + integer(next, 0, 3),
      threshold + integer(next, 0, 3),
      integer(next, 1, threshold - 1)
    ];
    const items = ["A", "B", "C", "D"];
    const pairs = ["AB", "AC", "AD", "BC", "BD", "CD"];
    const frequentPairs = ["AB", "AC", "BC"];
    const selected = frequentPairs[integer(next, 0, frequentPairs.length - 1)];
    const buckets = pairs.map(pair => pair === selected ? threshold + integer(next, 0, 3) : integer(next, 1, threshold - 1));
    const correct = selected + " (bucket count " + buckets[pairs.indexOf(selected)] + ")";
    const alternatives = pairs.filter(pair => pair !== selected).slice(0, 5).map(pair => pair + " (bucket count " + buckets[pairs.indexOf(pair)] + ")");
    return mcq(template, "dsa5101-pcy", seed,
      "PCY uses minimum support " + threshold + ". Singleton counts are A=" + counts[0] + ", B=" + counts[1] + ", C=" + counts[2] + ", D=" + counts[3] + ". Which pair remains a candidate after both frequent-item and frequent-bucket tests?",
      "The surviving pair is " + correct + ": both items are frequent and its hashed bucket reaches the threshold.",
      "PCY prunes a pair when either item is infrequent or its bucket is infrequent; passing only one test is insufficient.",
      correct,
      alternatives);
  }
  function minhashSignature(seed, template) {
    const next = random(seed);
    const matrix = Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => next() < 0.5 ? 1 : 0));
    for (let column = 0; column < 3; column += 1) {
      if (matrix.every(row => row[column] === 0)) matrix[integer(next, 0, 3)][column] = 1;
    }
    const order = shuffled(next, [0, 1, 2, 3]);
    const signature = Array.from({ length: 3 }, (_, column) => {
      const row = order.find(index => matrix[index][column] === 1);
      return row + 1;
    });
    const correct = "(" + signature.join(", ") + ")";
    const original = Array.from({ length: 3 }, (_, column) => {
      const row = matrix.findIndex(candidate => candidate[column] === 1);
      return row + 1;
    });
    const alternatives = [
      "(" + original.join(", ") + ")",
      "(" + signature.slice().reverse().join(", ") + ")",
      "(" + signature.map((value, index) => index === 0 ? value + 1 : value).join(", ") + ")",
      "(" + signature.map((value, index) => index === 1 ? Math.max(1, value - 1) : value).join(", ") + ")",
      "The number of 1s in each column"
    ];
    return mcq(template, "dsa5101-minhash-signature", seed,
      "For the binary characteristic matrix " + JSON.stringify(matrix) + ", MinHash scans rows in permutation order " + (order.map(index => index + 1).join(" -> ")) + ". What signature is produced?",
      "The first 1 in each column under that row order gives signature " + correct + ".",
      "A MinHash signature records the first permuted row containing a 1 for each column; it is not a column sum.",
      correct,
      alternatives);
  }
  function lshReverse(seed, template) {
    const next = random(seed);
    const rowsTotal = next() < 0.5 ? 20 : 24;
    const high = next() < 0.5 ? 0.8 : 0.85;
    const low = next() < 0.5 ? 0.25 : 0.3;
    const bands = rowsTotal === 20 ? 5 : 6;
    const rows = 4;
    const highProbability = round(1 - Math.pow(1 - Math.pow(high, rows), bands));
    const lowProbability = round(1 - Math.pow(1 - Math.pow(low, rows), bands));
    const correct = "(b=" + bands + ", r=" + rows + ")";
    const alternatives = [
      "(b=1, r=" + rowsTotal + ")",
      "(b=2, r=" + (rowsTotal / 2) + ")",
      "(b=" + (rowsTotal / 4) + ", r=4)",
      "(b=" + (rowsTotal / 5) + ", r=5)",
      "No factorization of " + rowsTotal + " can satisfy both targets"
    ];
    return mcq(template, "dsa5101-lsh-reverse", seed,
      "Choose b bands and r rows per band with br=" + rowsTotal + " so that similarity " + high + " has candidate probability 0.90-0.99 while similarity " + low + " has probability 0.01-0.05. Which pair is the best design?",
      "Use " + correct + ". It gives P(high) approximately " + highProbability + " and P(low) approximately " + lowProbability + ".",
      "The candidate probability is 1-(1-s^r)^b. Increasing r sharpens the threshold; b and r must still multiply to the total signature rows.",
      correct,
      alternatives);
  }
  function kmeansConvergence(seed, template) {
    const next = random(seed);
    let point = integer(next, 1, 4);
    const points = [point];
    while (points.length < 6) {
      point += integer(next, 1, 4);
      points.push(point);
    }
    const initialCentroids = [points[1], points[4]];
    let centroids = initialCentroids.slice();
    let assignments = [];
    for (let iteration = 0; iteration < 10; iteration += 1) {
      const nextAssignments = points.map(value => Math.abs(value - centroids[0]) <= Math.abs(value - centroids[1]) ? 0 : 1);
      const nextCentroids = [0, 1].map(cluster => {
        const members = points.filter((_, index) => nextAssignments[index] === cluster);
        return members.reduce((sum, value) => sum + value, 0) / members.length;
      });
      const stable = assignments.length > 0 && nextAssignments.every((value, index) => value === assignments[index]);
      assignments = nextAssignments;
      centroids = nextCentroids;
      if (stable) break;
    }
    const groups = [0, 1].map(cluster => points.filter((_, index) => assignments[index] === cluster).join(", "));
    const correct = "Cluster 1={" + groups[0] + "}; Cluster 2={" + groups[1] + "}";
    const alternatives = [
      "Cluster 1={" + points.slice(0, 3).join(", ") + "}; Cluster 2={" + points.slice(3).join(", ") + "}",
      "Cluster 1={" + points.filter((_, index) => assignments[index] === 1).join(", ") + "}; Cluster 2={" + points.filter((_, index) => assignments[index] === 0).join(", ") + "}",
      "Keep the initial centroids without reassigning points",
      "Assign every point to the nearest global mean",
      "Split the sorted points into alternating odd and even positions"
    ];
    return mcq(template, "dsa5101-kmeans-convergence", seed,
      "Run one-dimensional Lloyd K-means on points [" + points.join(", ") + "] with initial centroids [" + initialCentroids.join(", ") + "] until assignments stop changing. Which final partition is correct? Ties go to Cluster 1.",
      "The stable nearest-centroid assignment is " + correct + ".",
      "K-means alternates assignment and mean recomputation; convergence means the assignments no longer change, not that the initial centroids are retained.",
      correct,
      alternatives);
  }
  function latentFactor(seed, template) {
    const next = random(seed);
    const user = [integer(next, -2, 4), integer(next, -2, 4)];
    const item = [integer(next, -2, 4), integer(next, -2, 4)];
    const expected = round(user[0] * item[0] + user[1] * item[1]);
    return numeric(template, "dsa5101-latent-factor", seed,
      "A latent-factor model uses user vector [" + user.join(", ") + "] and item vector [" + item.join(", ") + "]. Compute the dot-product score.",
      "score = " + user[0] + "·" + item[0] + " + " + user[1] + "·" + item[1] + " = " + expected + ".",
      "The latent prediction core is the inner product of the user and item factors; a bias term would be added separately only if specified.",
      expected);
  }
  function pagerankTwo(seed, template) {
    const next = random(seed);
    const a = integer(next, 2, 8) / 10;
    const b = integer(next, 2, 8) / 10;
    const first = integer(next, 2, 8) / 10;
    const r1 = round(a * first + b * (1 - first));
    const expected = round(a * r1 + b * (1 - r1));
    const matrix = "[[" + a + ", " + b + "], [" + round(1 - a) + ", " + round(1 - b) + "]]";
    return numeric(template, "dsa5101-pagerank-two", seed,
      "With column-stochastic M=" + matrix + " and r^(0)=[" + first + ", " + round(1 - first) + "]^T, compute node A after two power iterations.",
      "r_A^(1)=" + r1 + " and r_A^(2)=" + a + "·" + r1 + " + " + b + "·" + round(1 - r1) + " = " + expected + ".",
      "Use the same transition convention at every iteration: r^(t+1)=M r^(t). Do not transpose M halfway through.",
      expected);
  }
  function fm(seed, template) {
    const next = random(seed);
    const zeros = integer(next, 2, 7);
    const expected = Math.pow(2, zeros);
    return numeric(template, "dsa5101-fm", seed,
      "An FM sketch observes a maximum trailing-zero run R=" + zeros + " in its hash-pattern samples. What distinct-count estimate follows from the basic 2^R rule?",
      "Estimate = 2^" + zeros + " = " + expected + ".",
      "The basic FM estimator converts the maximum trailing-zero position into a power-of-two scale; it is not the number of observed stream items.",
      expected);
  }
  function amsEstimator(seed, template) {
    const next = random(seed);
    const n = integer(next, 20, 80);
    const frequency = integer(next, 2, 8);
    const expected = n * (2 * frequency - 1);
    return numeric(template, "dsa5101-ams-estimator", seed,
      "An AMS F2 sample uses stream length n=" + n + " and sampled item frequency X=" + frequency + ". Compute the single-sample estimator n(2X-1).",
      "n(2X-1) = " + n + "(2·" + frequency + "-1) = " + expected + ".",
      "AMS estimates the second moment from a signed sample; do not replace the estimator with nX or X^2.",
      expected);
  }
  function svdSigma(seed, template) {
    const next = random(seed);
    const sigma = integer(next, 2, 9);
    const squared = sigma * sigma;
    return numeric(template, "dsa5101-svd-sigma", seed,
      "An eigenvalue of A^T A is λ=" + squared + ". Assuming singular values are nonnegative, compute the corresponding singular value σ.",
      "σ = sqrt(" + squared + ") = " + sigma + ".",
      "Singular values are the nonnegative square roots of the eigenvalues of A^T A; do not report λ itself.",
      sigma);
  }
  function svdError(seed, template) {
    const next = random(seed);
    const first = integer(next, 5, 10);
    const second = integer(next, 3, first - 1);
    const third = integer(next, 2, second - 1);
    const fourth = integer(next, 1, third - 1);
    const singularValues = [first, second, third, fourth];
    const rank = integer(next, 1, 2);
    const expected = singularValues.slice(rank).reduce((sum, value) => sum + value * value, 0);
    return numeric(template, "dsa5101-svd-error", seed,
      "A matrix has singular values [" + singularValues.join(", ") + "]. Compute the squared Frobenius error of its best rank-" + rank + " approximation.",
      "Error^2 = " + singularValues.slice(rank).map(value => value + "^2").join(" + ") + " = " + expected + ".",
      "The Eckart-Young tail keeps the singular values after the retained rank and sums their squares.",
      expected);
  }
  function conductance(seed, template) {
    const next = random(seed);
    const cut = integer(next, 1, 4);
    const volumeLeft = integer(next, 5, 15);
    const volumeRight = integer(next, 5, 15);
    const expected = round(cut / Math.min(volumeLeft, volumeRight));
    return numeric(template, "dsa5101-conductance", seed,
      "A cut has " + cut + " crossing edges, volume(S)=" + volumeLeft + ", and volume(complement)=" + volumeRight + ". Compute conductance cut/min(volumes).",
      "φ(S) = " + cut + "/min(" + volumeLeft + ", " + volumeRight + ") = " + expected + ".",
      "Conductance normalizes the cut by the smaller side volume; using the larger volume changes the objective.",
      expected);
  }
  function pprSweep(seed, template) {
    const next = random(seed);
    const nodes = ["A", "B", "C", "D"];
    const scores = nodes.map(() => integer(next, 1, 9));
    const degrees = nodes.map(() => integer(next, 1, 5));
    const ratios = nodes.map((node, index) => ({ node, ratio: scores[index] / degrees[index] }));
    ratios.sort((left, right) => right.ratio - left.ratio || left.node.localeCompare(right.node));
    const correct = ratios.map(entry => entry.node).join(" > ");
    const alternatives = [
      nodes.slice().sort((left, right) => scores[nodes.indexOf(right)] - scores[nodes.indexOf(left)]).join(" > "),
      nodes.slice().sort((left, right) => degrees[nodes.indexOf(left)] - degrees[nodes.indexOf(right)]).join(" > "),
      correct.split(" > ").reverse().join(" > "),
      nodes.join(" > "),
      nodes.slice().reverse().join(" > ")
    ];
    return mcq(template, "dsa5101-ppr-sweep", seed,
      "A personalized PageRank sweep ranks nodes by p(v)/d(v). Scores are A=" + scores[0] + ", B=" + scores[1] + ", C=" + scores[2] + ", D=" + scores[3] + "; degrees are A=" + degrees[0] + ", B=" + degrees[1] + ", C=" + degrees[2] + ", D=" + degrees[3] + ". Which descending order is used?",
      "Compute each score-to-degree ratio and sort descending: " + correct + ".",
      "The sweep ordering uses personalized score normalized by degree, not raw score alone; the prefix sets define the conductance curve.",
      correct,
      alternatives);
  }
  function binaryEntropy(positive, negative) {
    const total = positive + negative;
    const terms = [positive / total, negative / total].filter(value => value > 0);
    return -terms.reduce((sum, probability) => sum + probability * Math.log2(probability), 0);
  }
  function entropy(seed, template) {
    const next = random(seed);
    const positive = integer(next, 1, 12);
    const negative = integer(next, 1, 12);
    const expected = round(binaryEntropy(positive, negative));
    return numeric(template, "dsa5101-entropy", seed,
      "A decision-tree node contains " + positive + " positive and " + negative + " negative examples. Compute its binary entropy in bits.",
      "H = -p+log2(p+) - p-log2(p-) = " + expected + ".",
      "Entropy measures label uncertainty. It is zero only for a pure node and is maximized near a 50/50 split.",
      expected);
  }
  function informationGain(seed, template) {
    const next = random(seed);
    const leftPositive = integer(next, 1, 8);
    const leftNegative = integer(next, 1, 8);
    const rightPositive = integer(next, 1, 8);
    const rightNegative = integer(next, 1, 8);
    const parentPositive = leftPositive + rightPositive;
    const parentNegative = leftNegative + rightNegative;
    const leftTotal = leftPositive + leftNegative;
    const rightTotal = rightPositive + rightNegative;
    const total = leftTotal + rightTotal;
    const expected = round(binaryEntropy(parentPositive, parentNegative) -
      (leftTotal / total) * binaryEntropy(leftPositive, leftNegative) -
      (rightTotal / total) * binaryEntropy(rightPositive, rightNegative));
    return numeric(template, "dsa5101-information-gain", seed,
      "A split creates left [" + leftPositive + " positive, " + leftNegative + " negative] and right [" + rightPositive + " positive, " + rightNegative + " negative]. Compute information gain in bits.",
      "IG = H(parent) - (" + leftTotal + "/" + total + ")H(left) - (" + rightTotal + "/" + total + ")H(right) = " + expected + ".",
      "Information gain is the parent entropy minus the child entropies weighted by child size; do not subtract unweighted entropies.",
      expected);
  }
  function submodular(seed, template) {
    const next = random(seed);
    const smallSetGain = integer(next, 4, 10);
    const largeSetGain = integer(next, 1, smallSetGain - 1);
    const correct = "Δ(x|A)=" + smallSetGain + " ≥ Δ(x|B)=" + largeSetGain + " when A⊆B";
    const alternatives = [
      "Δ(x|A)=" + largeSetGain + " ≥ Δ(x|B)=" + smallSetGain + " when A⊆B",
      "The marginal gain must stay constant for all sets",
      "The larger set always has the larger marginal gain",
      "Greedy is optimal for every non-submodular objective",
      "Diminishing returns compares total values, not marginal gains"
    ];
    return mcq(template, "dsa5101-submodular", seed,
      "For a coverage objective, adding x to smaller set A gives gain " + smallSetGain + " while adding x to larger set B gives gain " + largeSetGain + ", with A⊆B. Which statement captures submodularity?",
      "Diminishing returns requires " + correct + ".",
      "Submodularity compares the marginal contribution of the same item as the context set grows; it does not say the total objective decreases.",
      correct,
      alternatives);
  }
  function banditMean(seed, template) {
    const next = random(seed);
    const rewards = Array.from({ length: integer(next, 3, 5) }, () => integer(next, 0, 10));
    const expected = round(rewards.reduce((sum, value) => sum + value, 0) / rewards.length);
    return numeric(template, "dsa5101-bandit-mean", seed,
      "An arm produced rewards [" + rewards.join(", ") + "]. Compute its empirical mean reward.",
      "mean = (" + rewards.join(" + ") + ")/" + rewards.length + " = " + expected + ".",
      "The empirical mean is cumulative reward divided by pulls; it is not the maximum observed reward.",
      expected);
  }
  function epsilonGreedy(seed, template) {
    const next = random(seed);
    const arms = integer(next, 3, 5);
    const epsilon = [0.1, 0.2, 0.3, 0.4][integer(next, 0, 3)];
    const expected = round(1 - epsilon + epsilon / arms);
    return numeric(template, "dsa5101-epsilon-greedy", seed,
      "Epsilon-greedy has " + arms + " arms, exploration rate ε=" + epsilon + ", and a unique best arm. What is the probability of selecting the best arm on the next round?",
      "P(best) = 1-ε + ε/" + arms + " = " + expected + ".",
      "Exploit the best arm with probability 1-ε; during exploration, each arm receives ε/K under uniform exploration.",
      expected);
  }
  function ucb(seed, template) {
    const next = random(seed);
    const mean = integer(next, 2, 8) / 10;
    const time = integer(next, 10, 50);
    const pulls = integer(next, 1, 8);
    const bonus = Math.sqrt(Math.log(time) / pulls);
    const expected = round(mean + bonus);
    return numeric(template, "dsa5101-ucb", seed,
      "For UCB with empirical mean μ̂=" + mean + ", t=" + time + ", and N=" + pulls + ", compute μ̂ + sqrt(ln(t)/N).",
      "UCB = " + mean + " + sqrt(ln(" + time + ")/" + pulls + ") = " + expected + ".",
      "The confidence bonus grows with time and shrinks with arm pulls; use natural logarithm as specified by UCB1.",
      expected);
  }
  function linkageGenerated(seed, template) {
    const next = random(seed);
    const mode = ["single", "complete", "average"][integer(next, 0, 2)];
    const distances = Array.from({ length: 4 }, () => integer(next, 2, 10));
    const expected = mode === "single" ? Math.min(...distances) : mode === "complete" ? Math.max(...distances) : round(distances.reduce((sum, value) => sum + value, 0) / distances.length);
    return numeric(template, "dsa5101-linkage", seed,
      "Two clusters have cross-distances [" + distances.join(", ") + "]. Using " + mode + " linkage, compute their inter-cluster distance.",
      mode + " linkage gives " + expected + ".",
      "Single takes the minimum cross-distance, complete takes the maximum, and average takes the mean. Select the linkage rule before aggregating.",
      expected);
  }
  function balance(seed, template) {
    const next = random(seed), a = integer(next, 1, 5), b = integer(next, 1, 5), tie = next() < 0.35, budgetA = tie ? b : a, chosen = budgetA >= b ? "A" : "B", remaining = Math.max(budgetA, b) - 1;
    const choices = [`Advertiser ${chosen}; its remaining budget becomes ${remaining}`, `Advertiser ${chosen}; its remaining budget becomes ${remaining + 1}`, `Advertiser ${chosen === "A" ? "B" : "A"}; its remaining budget becomes ${Math.max(budgetA, b)}`, "Reject the query because BALANCE never resolves ties", "Choose by original budget, ignoring current remaining budget", "Choose the advertiser with fewer eligible keywords"];
    const tieNote = tie ? " The budgets tie, so use the stated alphabetical tie rule." : "";
    return base(template, "dsa5101-balance", seed, `Advertiser A has remaining budget ${budgetA} and B has ${b}; both bid on the current query. Which allocation follows BALANCE?${tieNote}`, `BALANCE selects ${chosen} and leaves it with ${remaining}.`, "Compare the current remaining budgets among eligible advertisers, then apply the tie rule before decrementing exactly one budget.", { type: "mcq", choices, answer: 0 });
  }

  const implementations = {
    "dsa5101-support": support,
    "dsa5101-jaccard": jaccard,
    "dsa5101-minhash-collision": minhashCollision,
    "dsa5101-lsh-probability": lshProbability,
    "dsa5101-linkage": linkageGenerated,
    "dsa5101-kmeans": kmeans,
    "dsa5101-centered-cosine": centeredCosine,
    "dsa5101-neighbor-prediction": neighborPrediction,
    "dsa5101-pagerank": pagerank,
    "dsa5101-dgim": dgim,
    "dsa5101-ams-f2": amsF2,
    "dsa5101-balance": balance,
    "dsa5101-pcy": pcy,
    "dsa5101-minhash-signature": minhashSignature,
    "dsa5101-lsh-reverse": lshReverse,
    "dsa5101-kmeans-convergence": kmeansConvergence,
    "dsa5101-latent-factor": latentFactor,
    "dsa5101-pagerank-two": pagerankTwo,
    "dsa5101-fm": fm,
    "dsa5101-ams-estimator": amsEstimator,
    "dsa5101-svd-sigma": svdSigma,
    "dsa5101-svd-error": svdError,
    "dsa5101-conductance": conductance,
    "dsa5101-ppr-sweep": pprSweep,
    "dsa5101-entropy": entropy,
    "dsa5101-information-gain": informationGain,
    "dsa5101-submodular": submodular,
    "dsa5101-bandit-mean": banditMean,
    "dsa5101-epsilon-greedy": epsilonGreedy,
    "dsa5101-ucb": ucb
  };
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
  function seededPermutation(items, seed) {
    const next = random(seed);
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(next() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }
  function generateOne(input) {
    const request = input || {};
    const catalog = catalogFor(request);
    const item = definitions(catalog).find(candidate => candidate.generatorId === request.generatorId);
    return item ? item.generate(String(request.generationSeed == null ? 1 : request.generationSeed), item.template) : null;
  }
  function generate(input) {
    const request = input || {};
    const seed = request.seed == null ? 1 : request.seed;
    const all = definitions(catalogFor(request));
    const pool = request.allForms ? seededPermutation(all, `${seed}:forms`) : forSkills(request);
    if (!pool.length) return [];
    const limit = Math.max(1, Number(request.limit) || 1);
    return Array.from({ length: limit }, (_, index) => {
      const item = pool[index % pool.length];
      return item.generate(`${seed}:${index}`, item.template);
    });
  }
  return Object.freeze({ forSkills, generate, generateOne });
});
