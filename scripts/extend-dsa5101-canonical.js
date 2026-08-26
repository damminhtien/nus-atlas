#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COURSE_ROOT = path.join(ROOT, 'content/courses/DSA5101');
const lecture1 = 'DSA5101/Lec1 - Assoc Rules, Frequent itemsets.pdf';
const lecture2 = 'DSA5101/Lec 2 - Finding Similar items, LSH.pdf';
const lecture3 = 'DSA5101/Lec3 - Clustering.pdf';
const assignment1 = 'DSA5101/Assignments/DSA5101_Assignment_1.pdf';
const assignment2 = 'DSA5101/Assignments/DSA5101_Assignment_2.pdf';
const textbook = 'DSA5101/Reference textbook MMDS 3rd Edition.pdf';

const ref = (sourceId, page, sourceType, role, status) => ({
  sourceId,
  page,
  sourceType,
  role,
  status: status || (sourceType === 'textbook' ? 'course-depth' : sourceType === 'exercise' ? 'current-context' : 'current')
});

const sourceLens = (whyExaminable, lecture = [], officialExercise = [], textbookRefs = []) => ({
  status: 'core DSA5101 study boundary',
  whyExaminable,
  lecture,
  officialExercise,
  textbook: textbookRefs,
  reference: []
});

const kidAnimation = (title, analogy, frames) => ({
  title,
  audience: 'kid-friendly intuition',
  status: 'intuition-only',
  analogy,
  frames,
  frameDurationMs: 1400
});

const writeJson = (relative, value) => {
  const file = path.join(COURSE_ROOT, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};

const existingContrastDrills = (lessonId) => {
  const file = path.join(COURSE_ROOT, `lessons/${lessonId}.json`);
  if (!fs.existsSync(file)) return [];
  const lesson = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Array.isArray(lesson.contrastDrills) ? lesson.contrastDrills : [];
};

const existingAlgorithmNotes = (lessonId) => {
  const file = path.join(COURSE_ROOT, `lessons/${lessonId}.json`);
  if (!fs.existsSync(file)) return [];
  const lesson = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Array.isArray(lesson.algorithmNotes) ? lesson.algorithmNotes : [];
};

const commonQuestion = (id, lessonId, type, difficulty, skill, cognitiveLevel, estimatedSeconds, prompt, explanation, sourceRefs, extra = {}) => ({
  id,
  type,
  prompt,
  explanation,
  sourceRefs,
  difficulty,
  skill,
  cognitiveLevel,
  estimatedSeconds,
  misconception: extra.misconception || 'Check the representation, objective, and scale assumption before committing to an answer.',
  visualHook: extra.visualHook || 'Draw the state transition or data summary before calculating.',
  courseId: 'DSA5101',
  lessonId,
  schemaVersion: 'nus.question.v1',
  ...extra
});

const lecture3Refs = [
  ref(lecture3, 15, 'lecture', 'clustering methods'),
  ref(lecture3, 21, 'lecture', 'hierarchical linkage'),
  ref(lecture3, 37, 'lecture', 'K-means objective'),
  ref(lecture3, 59, 'lecture', 'BFR overview'),
  ref(lecture3, 78, 'lecture', 'CURE representatives'),
  ref(lecture3, 86, 'lecture', 'cluster evaluation')
];

const clusteringQuestions = [
  commonQuestion('dsa5101-cluster-q1', 'dsa5101-clustering', 'mcq', 'medium', 'distinguish-linkages', 'analyze', 90,
    'A chaining-shaped dataset contains two dense groups joined by a few nearby points. Which hierarchical linkage is most vulnerable to merging the groups through that bridge?',
    'Single-link uses the closest pair across two clusters, so a short bridge can cause an early merge. Complete-link is more sensitive to the farthest pair.',
    [ref(assignment1, 6, 'exercise', 'hierarchical clustering practice'), ref(lecture3, 21, 'lecture', 'linkage comparison')],
    { choices: ['Single-link', 'Complete-link', 'Average-link', 'A fixed K-means centroid update'], answer: 0 }),
  commonQuestion('dsa5101-cluster-q2', 'dsa5101-clustering', 'calculation', 'medium', 'calculate-distortion', 'apply', 120,
    'For one-dimensional points 1, 3, and 5 assigned to one K-means cluster, what is the minimum squared-error loss and its representative?',
    'The representative is the mean 3. The loss is $(1-3)^2+(3-3)^2+(5-3)^2=8$.',
    [ref(lecture3, 37, 'lecture', 'K-means loss'), ref(lecture3, 44, 'lecture', 'representative update')],
    { accepted: ['8; representative 3', '8 and mean 3', 'loss 8, centroid 3'], solution: 'The representative is $3$. The loss is $4+0+4=8$.', hint: 'For squared error, minimize at the arithmetic mean.' }),
  commonQuestion('dsa5101-cluster-q3', 'dsa5101-clustering', 'derivation', 'hard', 'reason-about-local-optima', 'analyze', 150,
    'Explain why an assignment step followed by a mean-update step cannot increase the K-means squared-error objective, yet still may return a suboptimal clustering.',
    'With representatives fixed, assigning each point to its closest representative minimizes its contribution. With assignments fixed, each cluster mean minimizes squared error. The alternating process can stop at a local optimum because different initial representatives can lead to different partitions.',
    [ref(lecture3, 37, 'lecture', 'K-means objective'), ref(lecture3, 49, 'lecture', 'convergence'), ref(lecture3, 53, 'lecture', 'initialization')],
    { accepted: ['assignment minimizes; mean minimizes; initialization can trap local optimum', 'each step decreases loss but initialization determines local optimum'], rubric: [{ label: 'Monotonic update', required: ['closest assignment', 'mean minimizes squared error'] }, { label: 'Caveat', required: ['local optimum', 'initialization'] }] }),
  commonQuestion('dsa5101-cluster-q4', 'dsa5101-clustering', 'short', 'medium', 'classify-bfr-state', 'understand', 120,
    'In BFR, what should happen to a point that is not confidently assigned to a discard-set cluster but appears close to other uncertain points?',
    'Keep it in a compression set with a compact summary of the uncertain subcluster; retain isolated outliers in the retained set until later evidence arrives.',
    [ref(lecture3, 62, 'lecture', 'BFR DS/CS/RS states'), ref(lecture3, 71, 'lecture', 'BFR summary statistics')],
    { accepted: ['compression set', 'CS', 'keep it in CS until merge evidence'], solution: 'Put it in CS when it belongs to an uncertain but compressible group; use RS for isolated retained points.' }),
  commonQuestion('dsa5101-cluster-q5', 'dsa5101-clustering', 'short', 'medium', 'compare-cluster-representations', 'analyze', 120,
    'Why does CURE keep several dispersed representative points and shrink them toward the mean?',
    'Several representatives preserve non-spherical cluster shape; shrinking reduces noise and makes the representation more stable for scalable assignment.',
    [ref(lecture3, 78, 'lecture', 'CURE representative points'), ref(lecture3, 83, 'lecture', 'CURE shrinkage')],
    { accepted: ['preserve shape and reduce noise', 'multiple representatives preserve non-spherical shape; shrinkage reduces noise'], solution: 'CURE trades one centroid for a few shrunk representatives so shape is retained without retaining every point.' }),
  commonQuestion('dsa5101-cluster-q6', 'dsa5101-clustering', 'short', 'hard', 'evaluate-clusters', 'evaluate', 120,
    'Why is purity alone unsafe as a clustering-quality claim?',
    'Purity uses external labels and can increase by creating many small clusters. It does not measure whether the similarity geometry or downstream decision is useful, so cluster count and the evaluation purpose must be stated.',
    [ref(lecture3, 86, 'lecture', 'purity and evaluation'), ref(lecture3, 90, 'lecture', 'clustering summary')],
    { accepted: ['purity rewards many small clusters and needs labels', 'external labels; many tiny clusters; does not prove utility'], solution: 'Report purity with cluster-count and label context, and pair it with intrinsic or task-specific evidence.' })
];

const trackDefinitions = {
  recommenders: {
    id: 'dsa5101-recommenders',
    moduleId: 'dsa5101-application-tracks',
    title: 'Assignment 2 · Recommenders',
    week: 5,
    minutes: 45,
    visualId: 'dsa5101-recommender-matrix',
    summary: 'Solve the two missing ratings with user-based collaborative filtering and a latent-factor model, keeping normalization and dot-product prediction separate.',
    objectives: ['Mean-center known ratings before cosine similarity', 'Use neighbourhood similarity to estimate a missing rating', 'Complete latent factors and compute a dot-product prediction'],
    sourceRefs: [ref(lecture3, 3, 'lecture', 'high-dimensional and recommender motivation'), ref(assignment2, 2, 'exercise', 'user-based collaborative filtering'), ref(assignment2, 3, 'exercise', 'latent-factor method'), ref(textbook, 84, 'textbook', 'collaborative filtering as a similar-sets problem')],
    lens: sourceLens('Assignment 2 supplies the exact matrix and latent-factor tasks; Lecture 3 motivates the representation and MMDS labels collaborative filtering depth.', [ref(lecture3, 3, 'lecture', 'recommender motivation')], [ref(assignment2, 2, 'exercise', 'user-based collaborative filtering'), ref(assignment2, 3, 'exercise', 'latent-factor method')], [ref(textbook, 84, 'textbook', 'collaborative filtering depth')]),
    sections: [
      { title: 'User-based collaborative filtering', body: 'Subtract each user’s row mean from known ratings before calculating cosine similarity. The centering step makes the comparison focus on rating pattern rather than absolute generosity.', sourceType: 'exercise', sourceRefs: [ref(assignment2, 2, 'exercise', 'mean-centered cosine similarity')] },
      { title: 'Latent-factor prediction', body: 'The latent-factor task uses a reconstructed rating $\\hat r_{xi}=q_x\\cdot p_i$ and chooses missing entries in $Q$ and $P^T$ so known ratings have zero reconstruction error. Do not reuse the neighbourhood estimates as latent factors.', sourceType: 'exercise', sourceRefs: [ref(assignment2, 3, 'exercise', 'latent-factor objective')] }
    ],
    math: [{ name: 'Latent-factor rating', purpose: 'Predict a user–item rating from the learned user and item vectors.', latex: '\\hat r_{xi}=q_x\\cdot p_i', explanation: 'The dot product $\\hat r_{xi}=q_x\\cdot p_i$ is a model prediction; it is different from a neighbourhood-weighted average.', symbols: [{ latex: 'q_x', meaning: 'latent vector for user x' }, { latex: 'p_i', meaning: 'latent vector for item i' }], sourceType: 'exercise', sourceRefs: [ref(assignment2, 3, 'exercise', 'latent-factor prediction')] }],
    questions: [
      commonQuestion('dsa5101-recommender-q1', 'dsa5101-recommenders', 'mcq', 'medium', 'normalize-ratings', 'apply', 90, 'Why subtract each user’s row mean before cosine similarity in the user-based method?', 'Centering removes each user’s rating baseline so cosine similarity compares deviations and preference pattern.', [ref(assignment2, 2, 'exercise', 'mean-centered cosine similarity')], { choices: ['To compare deviations rather than generosity', 'To create more movies', 'To make every rating positive', 'To replace the latent-factor model'], answer: 0 }),
      commonQuestion('dsa5101-recommender-q2', 'dsa5101-recommenders', 'calculation', 'medium', 'compute-dot-product', 'apply', 90, 'If a user vector is $q=(2,-1)$ and an item vector is $p=(3,4)$, what rating does the dot-product predictor return?', 'Compute $2\\cdot3+(-1)\\cdot4=2$.', [ref(assignment2, 3, 'exercise', 'latent-factor prediction')], { accepted: ['2', '2.0'], solution: '$\\hat r=q\\cdot p=6-4=2$.', hint: 'Multiply matching coordinates and add them.' }),
      commonQuestion('dsa5101-recommender-q3', 'dsa5101-recommenders', 'short', 'hard', 'separate-models', 'analyze', 120, 'State one conceptual difference between user-based collaborative filtering and the latent-factor method in Assignment 2.', 'User-based filtering derives a prediction from similar users and their centered ratings; latent factors learn low-dimensional user and item vectors whose dot product reconstructs known ratings.', [ref(assignment2, 2, 'exercise', 'user-based method'), ref(assignment2, 3, 'exercise', 'latent factors')], { accepted: ['similar users versus learned vectors', 'neighbourhood weighted ratings versus dot product of learned factors'], solution: 'They use different representations and prediction mechanisms even when both estimate the same missing entry.' }),
      commonQuestion('dsa5101-recommender-q4', 'dsa5101-recommenders', 'short', 'hard', 'diagnose-cold-start', 'evaluate', 120, 'A new user has no known ratings. Which part of the user-based workflow becomes undefined, and why?', 'There is no row mean or similarity evidence for the new user, so a neighbourhood prediction needs a fallback such as a prior, onboarding signal, or item popularity.', [ref(assignment2, 2, 'exercise', 'utility matrix'), ref(textbook, 84, 'textbook', 'collaborative filtering depth')], { accepted: ['row mean and similarity are unavailable', 'cold start has no ratings for centering or neighbours'], solution: 'The missing evidence is the user profile itself, not merely one missing matrix cell.' })
    ]
  },
  pagerank: {
    id: 'dsa5101-pagerank',
    moduleId: 'dsa5101-application-tracks',
    title: 'Assignment 2 · PageRank',
    week: 5,
    minutes: 45,
    visualId: 'dsa5101-pagerank-iteration',
    summary: 'Construct the transition matrix, run power iterations, and reason about teleportation using the exact Assignment 2 network task.',
    objectives: ['Build a row or column transition matrix consistently', 'Compute one and two power iterations', 'Explain damping and a non-uniform teleport set'],
    sourceRefs: [ref(assignment2, 4, 'exercise', 'transition matrix and power iteration'), ref(textbook, 175, 'textbook', 'PageRank definition')],
    lens: sourceLens('Assignment 2 is the authoritative practice boundary for matrix construction and iterations; MMDS supplies the formal PageRank and efficient-computation depth.', [], [ref(assignment2, 4, 'exercise', 'transition matrix and iterations')], [ref(textbook, 175, 'textbook', 'PageRank definition')]),
    sections: [
      { title: 'Transition matrix first', body: 'Fix the orientation before multiplying: decide whether each row distributes a node’s mass to out-neighbours or each column does. Then handle dangling nodes and retain the same convention through every iteration.', sourceType: 'exercise', sourceRefs: [ref(assignment2, 4, 'exercise', 'transition matrix')] },
      { title: 'Power iteration and teleportation', body: 'Power iteration repeatedly applies the transition operator. With a teleport set, the injected mass is not necessarily uniform over all nodes, so compare the resulting increase against the initial vector rather than relying on indegree alone.', sourceType: 'exercise', sourceRefs: [ref(assignment2, 4, 'exercise', 'power iteration and teleport set')] }
    ],
    math: [{ name: 'PageRank update', purpose: 'Combine link-following mass with teleportation.', latex: '\\operatorname{PR}(i)=\\frac{1-\\beta}{|T|}\\mathbf{1}_{i\\in T}+\\beta\\sum_{j\\to i}\\frac{\\operatorname{PR}(j)}{\\operatorname{outdeg}(j)}', explanation: 'The update adds teleport mass to the selected set $T$ and transfers the remaining mass through incoming links. The assignment’s $\\beta=1$ case removes teleportation for the requested iterations.', symbols: [{ latex: '\\beta', meaning: 'link-following probability' }, { latex: 'T', meaning: 'teleport set' }, { latex: '\\operatorname{PR}(i)', meaning: 'rank of node i' }], sourceType: 'exercise', sourceRefs: [ref(assignment2, 4, 'exercise', 'PageRank iteration')] }],
    questions: [
      commonQuestion('dsa5101-pagerank-q1', 'dsa5101-pagerank', 'mcq', 'easy', 'interpret-damping', 'understand', 60, 'What does the damping factor control in PageRank?', 'It controls how much rank follows links versus how much mass is injected through teleportation.', [ref(assignment2, 4, 'exercise', 'PageRank iteration'), ref(textbook, 175, 'textbook', 'PageRank definition')], { choices: ['The link-following versus teleportation mixture', 'The number of stream buckets', 'The number of latent factors', 'The K-means cluster count'], answer: 0 }),
      commonQuestion('dsa5101-pagerank-q2', 'dsa5101-pagerank', 'calculation', 'hard', 'run-power-iteration', 'apply', 150, 'For nodes A, B, C with edges $A\\to B$ and $A\\to C$, $B\\to C$, $C\\to A$, start with $[1/3,1/3,1/3]^T$, no teleportation, and distribute A’s mass equally. What is the vector after one iteration in A,B,C order?', 'A receives $1/3$ from C, B receives $1/6$ from A, and C receives $1/6$ from A plus $1/3$ from B. The result is $[1/3,1/6,1/2]^T$.', [ref(assignment2, 4, 'exercise', 'power iteration')], { accepted: ['[1/3, 1/6, 1/2]', '0.3333, 0.1667, 0.5'], solution: '$[1/3,1/6,1/2]^T$.', hint: 'Split A’s outgoing mass into two equal parts.' }),
      commonQuestion('dsa5101-pagerank-q3', 'dsa5101-pagerank', 'short', 'medium', 'handle-dangling-node', 'analyze', 90, 'Why must a dangling node receive an explicit transition convention before PageRank iteration?', 'A node with no outgoing links has no probability distribution to multiply into the next vector; redistributing its mass, commonly uniformly or through the teleport distribution, preserves a valid stochastic process.', [ref(assignment2, 4, 'exercise', 'transition matrix'), ref(textbook, 189, 'textbook', 'efficient PageRank computation')], { accepted: ['no outgoing distribution; redistribute its mass', 'dangling mass must be redistributed to preserve stochasticity'], solution: 'Without a convention, the transition matrix loses probability mass or is undefined.' }),
      commonQuestion('dsa5101-pagerank-q4', 'dsa5101-pagerank', 'short', 'medium', 'contrast-ranking', 'evaluate', 90, 'Why can two nodes with the same indegree have different PageRank?', 'PageRank weights an incoming edge by the source node’s rank and outdegree, and damping may inject different teleport mass. Indegree counts links without either effect.', [ref(assignment2, 4, 'exercise', 'PageRank interpretation'), ref(textbook, 175, 'textbook', 'PageRank definition')], { accepted: ['source rank and outdegree matter', 'PageRank weights incoming rank, not just edge count'], solution: 'A link from a high-ranked node with few outgoing links transfers more mass than a link from a low-ranked node with many outgoing links.' })
    ]
  },
  streams: {
    id: 'dsa5101-streams',
    moduleId: 'dsa5101-application-tracks',
    title: 'Assignment 2 · Streaming sketches',
    week: 5,
    minutes: 50,
    visualId: 'dsa5101-stream-sketches',
    summary: 'Work the DGIM, Flajolet–Martin, and AMS questions as distinct stream queries with explicit memory and error contracts.',
    objectives: ['Maintain DGIM bucket-size invariants', 'Compute the Flajolet–Martin estimate from a hash observation', 'Derive and average AMS second-moment estimates'],
    sourceRefs: [ref(assignment2, 5, 'exercise', 'DGIM window and error'), ref(assignment2, 6, 'exercise', 'Flajolet–Martin and AMS'), ref(textbook, 154, 'textbook', 'stream query model'), ref(textbook, 155, 'textbook', 'Flajolet–Martin')],
    lens: sourceLens('Assignment 2 supplies the exact window, repeated-value stream, and estimator calculations; MMDS supplies the stream-query and sketch invariants as labeled depth.', [], [ref(assignment2, 5, 'exercise', 'DGIM'), ref(assignment2, 6, 'exercise', 'Flajolet–Martin and AMS')], [ref(textbook, 154, 'textbook', 'stream queries'), ref(textbook, 155, 'textbook', 'Flajolet–Martin')]),
    sections: [
      { title: 'DGIM is a recent-window count', body: 'DGIM stores timestamped buckets of 1s with at most two buckets of each size. When a query cuts through the oldest bucket, count it fractionally to expose the approximation error instead of pretending the boundary is exact.', sourceType: 'exercise', sourceRefs: [ref(assignment2, 5, 'exercise', 'DGIM bucket invariant')] },
      { title: 'Different sketch, different target', body: 'Flajolet–Martin estimates distinct elements from the longest zero-prefix in hashed values. AMS estimates a frequency moment such as $F_2=\\sum_i f_i^2$ from position samples. They are not interchangeable just because both use bounded memory.', sourceType: 'exercise', sourceRefs: [ref(assignment2, 6, 'exercise', 'FM and AMS moments')] }
    ],
    math: [{ name: 'Second frequency moment', purpose: 'State the target estimated by AMS.', latex: 'F_2=\\sum_i f_i^2', explanation: 'The second moment $F_2=\\sum_i f_i^2$ weights repeated values quadratically, so a stream with one 1, two 2s, and three 3s already has a different target from its distinct count.', symbols: [{ latex: 'F_2', meaning: 'second frequency moment' }, { latex: 'f_i', meaning: 'frequency of value i' }], sourceType: 'exercise', sourceRefs: [ref(assignment2, 6, 'exercise', 'second moment')] }],
    questions: [
      commonQuestion('dsa5101-stream-q1', 'dsa5101-streams', 'mcq', 'medium', 'select-sketch', 'apply', 60, 'Which sketch is designed to estimate the number of 1s in a recent sliding window?', 'DGIM stores compressed timestamped buckets for a recent-window count; Flajolet–Martin targets distinct elements.', [ref(assignment2, 5, 'exercise', 'DGIM window count')], { choices: ['DGIM', 'Flajolet–Martin', 'AMS only', 'PageRank'], answer: 0 }),
      commonQuestion('dsa5101-stream-q2', 'dsa5101-streams', 'short', 'medium', 'explain-dgim-error', 'analyze', 120, 'Why does DGIM count the oldest partially covered bucket as a source of approximation error?', 'The algorithm knows the bucket size but not the exact locations of its 1s relative to the query boundary, so it can include at most half of that oldest bucket as a controlled approximation.', [ref(assignment2, 5, 'exercise', 'DGIM error bound'), ref(textbook, 167, 'textbook', 'DGIM query answering')], { accepted: ['unknown positions at boundary', 'oldest bucket is only partially in the window'], solution: 'The bucket summary loses the internal timestamps, so the boundary bucket cannot be counted exactly.' }),
      commonQuestion('dsa5101-stream-q3', 'dsa5101-streams', 'calculation', 'medium', 'compute-fm-estimate', 'apply', 90, 'In the one-register Flajolet–Martin teaching approximation, the maximum zero-prefix length is $R=5$. What estimate does the register produce?', 'The one-register estimate is $2^R=2^5=32$.', [ref(assignment2, 6, 'exercise', 'Flajolet–Martin estimate'), ref(textbook, 155, 'textbook', 'Flajolet–Martin')], { accepted: ['32', '2^5=32'], solution: '$\\widehat n\\approx2^5=32$.', hint: 'Raise two to the observed maximum zero-prefix length.' }),
      commonQuestion('dsa5101-stream-q4', 'dsa5101-streams', 'calculation', 'hard', 'compute-second-moment', 'apply', 120, 'A stream contains one 1, two 2s, three 3s, and so on up to ten 10s. What is its second frequency moment?', 'The frequency of value i is i, so $F_2=1^2+2^2+\\cdots+10^2=385$.', [ref(assignment2, 6, 'exercise', 'AMS second moment')], { accepted: ['385', '1^2+...+10^2=385'], solution: '$F_2=\\sum_{i=1}^{10}i^2=385$.', hint: 'Square each frequency, not each distinct value only.' }),
      commonQuestion('dsa5101-stream-q5', 'dsa5101-streams', 'derivation', 'hard', 'explain-ams-averaging', 'analyze', 150, 'Why does AMS average estimates from variables sampled at different stream positions?', 'Each position-based variable is an unbiased but noisy estimator of the same moment. Averaging independent or suitably varied estimates reduces variance while retaining bounded memory.', [ref(assignment2, 6, 'exercise', 'AMS averaging'), ref(textbook, 161, 'textbook', 'frequency moments')], { accepted: ['each estimate is noisy and averaging reduces variance', 'unbiased samples plus averaging lower variance'], solution: 'The estimator family shares the same target but different random positions, so aggregation stabilizes the result.' })
    ]
  },
  balance: {
    id: 'dsa5101-balance',
    moduleId: 'dsa5101-application-tracks',
    title: 'Assignment 2 · BALANCE',
    week: 5,
    minutes: 35,
    visualId: 'dsa5101-balance-allocation',
    summary: 'Simulate the two-advertiser BALANCE algorithm and separate a sequence that is optimal from one that is not guaranteed optimal.',
    objectives: ['Track remaining budgets after each query', 'Resolve eligible-advertiser choices consistently', 'Explain why an adversarial sequence breaks a guarantee'],
    sourceRefs: [ref(assignment2, 7, 'exercise', 'BALANCE sequences')],
    lens: sourceLens('Assignment 2 is the authoritative source for the bid graph, budgets, sequences, and optimality guarantee. No separate project or lecture rubric is inferred from this exercise.', [], [ref(assignment2, 7, 'exercise', 'BALANCE optimality')], []),
    math: [{ name: 'BALANCE budget update', purpose: 'Track the remaining budget after serving a query.', latex: 'B_t(a)=B_{t-1}(a)-1', explanation: 'When advertiser $a$ receives a query at time $t$, its remaining budget changes from $B_{t-1}(a)$ to $B_t(a)=B_{t-1}(a)-1$.', symbols: [{ latex: 'B_t(a)', meaning: 'remaining budget of advertiser a after step t' }, { latex: 'a', meaning: 'eligible advertiser' }], sourceType: 'exercise', sourceRefs: [ref(assignment2, 7, 'exercise', 'BALANCE budget trace')] }],
    sections: [
      { title: 'State before intuition', body: 'For every query, list the advertisers who bid and their remaining budgets. BALANCE assigns the query to the eligible advertiser with the larger remaining budget; a tie must be treated consistently when testing whether a guarantee holds.', sourceType: 'exercise', sourceRefs: [ref(assignment2, 7, 'exercise', 'BALANCE rule')] },
      { title: 'Guarantee versus one favourable run', body: 'A sequence is guaranteed optimal only when every allowed tie resolution and the resulting allocation match the offline optimum. A single tie-sensitive run is evidence of a possible outcome, not a guarantee.', sourceType: 'exercise', sourceRefs: [ref(assignment2, 7, 'exercise', 'BALANCE guarantee') ] }
    ],
    questions: [
      commonQuestion('dsa5101-balance-q1', 'dsa5101-balance', 'mcq', 'easy', 'recall-balance-rule', 'understand', 60, 'When both advertisers bid on a query, what does BALANCE compare?', 'BALANCE compares the remaining budgets of eligible advertisers and assigns to the one with more remaining budget, subject to the tie rule.', [ref(assignment2, 7, 'exercise', 'BALANCE rule')], { choices: ['Remaining budget', 'Number of previous queries only', 'PageRank', 'Cosine similarity'], answer: 0 }),
      commonQuestion('dsa5101-balance-q2', 'dsa5101-balance', 'short', 'medium', 'simulate-balance', 'apply', 120, 'Under the Assignment 2 bids and budgets, is $xyxz$ guaranteed optimal for BALANCE? Explain in one sentence.', 'Yes. Whichever advertiser receives the first tied x, the later y and z eligibility keeps both budgets available for the remaining x and serves all four queries.', [ref(assignment2, 7, 'exercise', 'sequence xyxz')], { accepted: ['yes', 'yes, all four can be served', 'yes because either first x tie leaves an optimal allocation'], solution: 'Yes; both tie outcomes serve all four queries, which is the offline optimum.' }),
      commonQuestion('dsa5101-balance-q3', 'dsa5101-balance', 'calculation', 'hard', 'find-counterexample', 'evaluate', 120, 'Why is $xyyy$ not guaranteed optimal when A bids on x,y, B bids on x,z, and both budgets start at 2?', 'The first x is a tie. If BALANCE gives it to A, A then receives the first y and exhausts its budget after one more y, while B cannot serve y; an offline allocation could give x to B and two y queries to A, serving three.', [ref(assignment2, 7, 'exercise', 'sequence xyyy')], { accepted: ['not guaranteed; tie can give x to A and waste A budget on x', 'no', 'no because the first tie can hurt y-only demand'], solution: 'No. A bad tie resolution makes BALANCE serve only two queries while OPT serves three.', hint: 'Check both outcomes of the first x tie.' }),
      commonQuestion('dsa5101-balance-q4', 'dsa5101-balance', 'short', 'hard', 'reason-about-guarantees', 'evaluate', 120, 'What is the difference between “BALANCE serves all queries in this simulation” and “BALANCE is guaranteed optimal for this sequence”?', 'The first claim describes one tie resolution or one execution. The guarantee quantifies over the allowed choices and must equal the offline optimum for the sequence.', [ref(assignment2, 7, 'exercise', 'BALANCE guarantee')], { accepted: ['one run versus every tie resolution and offline optimum', 'simulation outcome is weaker than guarantee'], solution: 'Guarantee requires checking the worst allowed tie path, not merely displaying a successful path.' })
    ]
  }
};

const clusteringLesson = {
  id: 'dsa5101-clustering',
  courseId: 'DSA5101',
  moduleId: 'dsa5101-clustering',
  title: 'Clustering at scale: hierarchy, K-means, BFR, and CURE',
  week: 3,
  contentStatus: 'CURRENT LECTURE',
  minutes: 90,
  summary: 'Use Lecture 3 as the canonical clustering source: choose a cluster geometry, calculate K-means updates, then scale the representation with BFR or CURE and evaluate it honestly.',
  objectives: ['Compare hierarchical linkage assumptions', 'Derive and calculate the K-means objective and updates', 'Explain BFR DS/CS/RS summaries and CURE representatives', 'Match evaluation metrics to labels and decisions'],
  sourceRefs: lecture3Refs.concat([ref(assignment1, 6, 'exercise', 'hierarchical clustering practice')]),
  sourceLens: sourceLens('Lecture 3 defines the official clustering scope; Assignment 1 supplies the required hierarchical-clustering calculation. The provided MMDS package has no dedicated clustering chapter, so that textbook gap remains explicit.', lecture3Refs, [ref(assignment1, 6, 'exercise', 'hierarchical clustering practice')], []),
  visualIds: ['dsa5101-clustering-pipeline'],
  slideSetIds: ['dsa5101-lecture3'],
  schemaVersion: 'nus.lesson.v1',
  sections: [
    { title: 'Choose geometry before algorithm', body: 'Clustering is a partitioning decision over a representation and a similarity rule. Hierarchical methods make merge and stopping choices explicit; the result depends on whether closeness means a nearest pair, farthest pair, average distance, or a representative.', sourceType: 'lecture', sourceRefs: [ref(lecture3, 15, 'lecture', 'clustering methods'), ref(lecture3, 21, 'lecture', 'hierarchical linkage')] },
    { title: 'K-means is an alternating objective', body: 'K-means assigns each point to a representative and recomputes the representative. The two updates reduce the within-cluster squared-error objective, but initialization, the choice of $K$, and the metric can leave a locally optimal answer that is not the useful answer.', sourceType: 'lecture', sourceRefs: [ref(lecture3, 37, 'lecture', 'K-means loss'), ref(lecture3, 53, 'lecture', 'initialization and choosing K')] },
    { title: 'Scale the summary, not the raw data', body: 'BFR keeps sufficient statistics for confident discard-set clusters, compression-set summaries for uncertain groups, and a retained set for outliers. CURE keeps a few dispersed representatives and shrinks them toward the mean so a scalable summary preserves more shape than one centroid.', sourceType: 'lecture', sourceRefs: [ref(lecture3, 62, 'lecture', 'BFR state'), ref(lecture3, 78, 'lecture', 'CURE representatives')] },
    { title: 'Evaluate the decision you actually need', body: 'Without labels, inspect cohesion, separation, and stability relative to the chosen geometry. With labels, purity is an external signal, not proof of utility; report its cluster-count sensitivity and connect the metric to the downstream decision.', sourceType: 'lecture', sourceRefs: [ref(lecture3, 86, 'lecture', 'cluster evaluation')] }
  ],
  math: [
    { name: 'K-means distortion', purpose: 'Measure the within-cluster squared-error objective.', latex: 'J(R,Z)=\\sum_i\\lVert x_i-z_{r(i)}\\rVert^2', explanation: 'The distortion $J(R,Z)$ adds the squared distance from each point $x_i$ to the representative $z_{r(i)}$ of its assigned cluster.', symbols: [{ latex: 'J(R,Z)', meaning: 'within-cluster squared-error loss' }, { latex: 'x_i', meaning: 'data point i' }, { latex: 'z_{r(i)}', meaning: 'representative assigned to point i' }], sourceType: 'lecture', sourceRefs: [ref(lecture3, 37, 'lecture', 'K-means loss')] },
    { name: 'BFR sufficient statistics', purpose: 'Summarize a cluster for later assignment without retaining every point.', latex: 'N,\\;SUM=\\sum_i x_i,\\;SUMSQ=\\sum_i x_i^2', explanation: 'BFR stores a count $N$, coordinate sums $SUM$, and coordinate-wise squared sums $SUMSQ$ so means and variances can be recovered for a compact cluster summary.', symbols: [{ latex: 'N', meaning: 'number of points in the summary' }, { latex: 'SUM', meaning: 'coordinate-wise sum' }, { latex: 'SUMSQ', meaning: 'coordinate-wise squared sum' }], sourceType: 'lecture', sourceRefs: [ref(lecture3, 71, 'lecture', 'BFR summary statistics')] }
  ],
  examples: [{ title: 'K-means arithmetic checkpoint', steps: [['Assign', '$x_i\\to\\operatorname*{argmin}_k\\lVert x_i-z_k\\rVert^2$', 'Choose the closest representative for every point.'], ['Update', '$z_k=\\frac{1}{|C_k|}\\sum_{x_i\\in C_k}x_i$', 'Replace each representative with the mean of its assigned points.'], ['Audit', '$J(R,Z)$', 'Recompute the objective and record whether the loss decreased.']], sourceRefs: [ref(lecture3, 44, 'lecture', 'K-means steps')] }],
  algorithmNotes: existingAlgorithmNotes('dsa5101-clustering'),
  contrastDrills: existingContrastDrills('dsa5101-clustering'),
  criticalQuestions: [
    { prompt: 'When would you prefer CURE or BFR over plain K-means?', angle: 'Compare shape preservation and memory constraints, then state the cost of the richer summary.', modelAnswer: 'Use CURE when dispersed or non-spherical shape matters, BFR when the data is too large for memory and compact sufficient statistics are available, and K-means when the centroid geometry and objective are appropriate.', focus: 'method selection', sourceRefs: [ref(lecture3, 59, 'lecture', 'BFR overview'), ref(lecture3, 78, 'lecture', 'CURE representatives')] },
    { prompt: 'What evidence would make a high-purity clustering result unconvincing?', angle: 'Test the metric against cluster count, geometry, and the downstream decision.', modelAnswer: 'Many tiny clusters, a mismatch between the similarity metric and the task, or no stability and downstream usefulness would weaken the purity claim.', focus: 'evaluation boundary', sourceRefs: [ref(lecture3, 86, 'lecture', 'cluster evaluation')] }
  ],
  questionIds: clusteringQuestions.map((question) => question.id)
};

const baseTrackLesson = (track) => ({
  id: track.id,
  courseId: 'DSA5101',
  moduleId: track.moduleId,
  title: track.title,
  week: track.week,
  contentStatus: 'OFFICIAL EXERCISE TRACK',
  minutes: track.minutes,
  summary: track.summary,
  objectives: track.objectives,
  sourceRefs: track.sourceRefs,
  sourceLens: track.lens,
  visualIds: [track.visualId],
  slideSetIds: [],
  schemaVersion: 'nus.lesson.v1',
  sections: track.sections,
  math: track.math,
  algorithmNotes: existingAlgorithmNotes(track.id),
  contrastDrills: existingContrastDrills(track.id),
  criticalQuestions: [
    { prompt: `What assumption would falsify the ${track.title} answer?`, angle: 'Name the representation or boundary condition that the calculation relies on.', modelAnswer: 'A changed input representation, violated invariant, or unhandled boundary case can invalidate a result even when the arithmetic is correct.', focus: 'assumption audit', sourceRefs: track.sourceRefs },
    { prompt: `How would you explain the ${track.title} result to an examiner in one minute?`, angle: 'State the target quantity, the update rule, and the limitation.', modelAnswer: 'Define the target, show one update, and close with the exactness, approximation, or guarantee condition.', focus: 'exam communication', sourceRefs: track.sourceRefs }
  ],
  questionIds: track.questions.map((question) => question.id)
});

const kitFor = (lessonId, topic, sourceRef) => ({
  lessonId,
  schemaVersion: 'nus.study-kit.v1',
  flashcards: [
    { front: `Define the ${topic} object.`, back: 'State the input representation, target quantity, update rule, and the main assumption.' },
    { front: `What is the ${topic} failure mode?`, back: 'Name the assumption or boundary case that can break a superficial solution.' },
    { front: `How do you audit a ${topic} calculation?`, back: 'Write the state, apply one update at a time, and check the output against the invariant.' }
  ],
  homework: [
    { prompt: `Write a worked ${topic} example with one adversarial edge case.`, rubric: 'Correct setup, explicit intermediate state, final answer, and one limitation.', source: sourceRef },
    { prompt: `Explain when ${topic} is the wrong abstraction for a production decision.`, rubric: 'Names a mismatch between representation, objective, scale, or error contract.', source: sourceRef }
  ],
  codeExercises: []
});

const visual = (id, title, kind, source, observation) => ({
  courseCode: 'DSA5101',
  title,
  kind,
  source: { sourceId: source.sourceId, page: source.page, access: 'local source; not copied to public bundle' },
  observation
});

const lab = (lessonId, title, type, refs, learningGoal, exercises) => ({
  courseCode: 'DSA5101',
  lessonId,
  type,
  title,
  learningGoal,
  sourceRefs: refs,
  sourceLens: sourceLens('The lab is derived from the same canonical lecture or official-exercise refs as its lesson and exposes the calculation state needed for exam practice.', refs.filter((item) => item.sourceType === 'lecture'), refs.filter((item) => item.sourceType === 'exercise'), refs.filter((item) => item.sourceType === 'textbook')),
  exercises,
  ...(type === 'decision-tree' ? {
    mode: 'generic',
    splits: [
      { id: 'target', label: 'Target quantity', detail: 'Name exactly what the algorithm is estimating or allocating.', scope: 'representation and objective' },
      { id: 'boundary', label: 'Boundary case', detail: 'Trace a tie, missing value, dangling mass, or sketch boundary before claiming success.', scope: 'invariant and guarantee' }
    ]
  } : { steps: exercises.flatMap((exercise) => exercise.steps || []) }),
  reducedMotion: true
});

const newLabs = {
  'dsa5101-clustering': lab('dsa5101-clustering', 'Clustering method and scale trace', 'derivation-trace', clusteringLesson.sourceRefs, 'Choose a geometry, update a compact cluster state, and audit the evaluation claim.', [
    { id: 'geometry', label: 'Geometry', prompt: 'Which cluster shape and merge rule does the method assume?', takeaway: 'State the representation and distance before comparing algorithms.', steps: [['Represent', 'points + distance', 'Name the feature space and similarity.'], ['Choose', 'linkage or centroid', 'Tie the method to its geometry.'], ['Evaluate', 'cohesion + purpose', 'Avoid treating one score as universal.']] },
    { id: 'scale', label: 'Scale', prompt: 'What can be summarized safely when data no longer fits in memory?', takeaway: 'Use DS/CS/RS or dispersed representatives according to the uncertainty and shape you must preserve.', steps: [['Confident', 'DS', 'Store sufficient statistics.'], ['Uncertain', 'CS or RS', 'Delay irreversible assignment.'], ['Shape', 'CURE representatives', 'Retain dispersed boundary evidence.']] }
  ])
};

for (const track of Object.values(trackDefinitions)) {
  const lesson = baseTrackLesson(track);
  writeJson(`lessons/${track.id}.json`, lesson);
  writeJson(`questions/${track.id}.json`, track.questions);
  writeJson(`artifacts/${track.id}.json`, kitFor(track.id, track.id.replace('dsa5101-', ''), track.sourceRefs.find((item) => item.sourceType === 'exercise')));
  const kind = track.id === 'dsa5101-recommenders' || track.id === 'dsa5101-balance' ? 'decision-tree' : 'derivation-trace';
  newLabs[track.id] = lab(track.id, `${track.title} practice lab`, kind, track.sourceRefs, `Trace the ${track.id.replace('dsa5101-', '')} state without mixing it with the other Assignment 2 tracks.`, [
    { id: 'setup', label: 'Setup', prompt: `What is the input and target for ${track.title}?`, takeaway: 'Write the representation, objective, and boundary before calculating.', steps: [['Input', 'canonical source', 'Copy only the variables the assignment gives.'], ['State', 'invariant', 'Record budgets, probabilities, ratings, or counters.'], ['Update', 'one step', 'Apply the algorithm once and audit the result.']] },
    { id: 'edge', label: 'Edge case', prompt: `What edge case can make a superficial ${track.title} answer wrong?`, takeaway: 'Use a boundary case to test the guarantee, not just the happy path.', steps: [['Find', 'tie or boundary', 'Identify the decision point.'], ['Trace', 'alternative', 'Run the other allowed outcome.'], ['Explain', 'claim strength', 'Say whether the result is exact, approximate, or merely possible.']] }
  ]);
}

writeJson('lessons/dsa5101-clustering.json', clusteringLesson);
writeJson('questions/dsa5101-clustering.json', clusteringQuestions);
writeJson('artifacts/dsa5101-clustering.json', {
  lessonId: 'dsa5101-clustering',
  schemaVersion: 'nus.study-kit.v1',
  flashcards: [
    { front: 'Which K-means update minimizes squared error with assignments fixed?', back: 'The arithmetic mean of the points assigned to the cluster.' },
    { front: 'What do BFR DS, CS, and RS represent?', back: 'Confident discard-set summaries, uncertain compression-set summaries, and retained outliers.' },
    { front: 'Why does CURE keep multiple representatives?', back: 'To preserve dispersed or non-spherical shape while keeping a compact representation.' }
  ],
  homework: [
    { prompt: 'Calculate one K-means assignment/update cycle and report the objective before and after.', rubric: 'Correct distance comparisons, means, loss audit, and local-optimum caveat.', source: ref(lecture3, 44, 'lecture', 'K-means steps') },
    { prompt: 'Compare BFR and CURE on a data set with outliers and elongated clusters.', rubric: 'Names the compact state, uncertainty path, shape assumption, and evaluation limitation.', source: ref(lecture3, 78, 'lecture', 'CURE representatives') }
  ],
  codeExercises: []
});

const visualsPath = path.join(COURSE_ROOT, 'visuals.json');
const visuals = JSON.parse(fs.readFileSync(visualsPath, 'utf8'));
Object.assign(visuals, {
  'dsa5101-clustering-pipeline': visual('dsa5101-clustering-pipeline', 'Clustering geometry to scalable summary', 'flow+comparison', ref(lecture3, 15, 'lecture', 'clustering methods'), 'Trace representation, geometry, update rule, compact summary, and evaluation; each choice changes the claim.'),
  'dsa5101-recommender-matrix': visual('dsa5101-recommender-matrix', 'Utility matrix to missing-rating estimate', 'matrix+flow', ref(assignment2, 2, 'exercise', 'user-based collaborative filtering'), 'Keep mean-centering, similarity weighting, and latent-factor dot products as separate prediction paths.'),
  'dsa5101-pagerank-iteration': visual('dsa5101-pagerank-iteration', 'PageRank transition and power iteration', 'graph+flow', ref(assignment2, 4, 'exercise', 'PageRank iteration'), 'Draw outgoing mass, multiply with one orientation, and identify where teleportation enters.'),
  'dsa5101-stream-sketches': visual('dsa5101-stream-sketches', 'Three stream targets, three sketches', 'flow+comparison', ref(assignment2, 5, 'exercise', 'DGIM window count'), 'Separate recent-window count, distinct cardinality, and frequency moments before choosing a sketch.'),
  'dsa5101-balance-allocation': visual('dsa5101-balance-allocation', 'BALANCE budget trace', 'timeline+state', ref(assignment2, 7, 'exercise', 'BALANCE sequences'), 'Record the remaining budgets after each query and test both sides of every eligible tie.')
});
fs.writeFileSync(visualsPath, `${JSON.stringify(visuals, null, 2)}\n`);

const labsPath = path.join(COURSE_ROOT, 'labs/index.json');
const labs = JSON.parse(fs.readFileSync(labsPath, 'utf8'));
Object.assign(labs, newLabs);
const kidAnimations = {
  'dsa5101-frequent-itemsets': kidAnimation('The basket detective', 'Imagine checking lunch baskets to find snacks that often travel together.', [
    { label: '1 · Look', scene: 'Mark every basket that contains both snacks.', takeaway: 'Support is a count of baskets, not a feeling about popularity.' },
    { label: '2 · Prune', scene: 'If a smaller snack pair is already rare, cross out every larger basket pattern that contains it.', takeaway: 'Downward closure saves work before the big search.' },
    { label: '3 · Ask', scene: 'Now ask whether the second snack appears more often after the first snack.', takeaway: 'Confidence is conditional; lift compares with the background rate.' }
  ]),
  'dsa5101-minhash-lsh': kidAnimation('The sticker-album shortcut', 'Two sticker albums can be compared quickly without laying every sticker on the floor.', [
    { label: '1 · Albums', scene: 'Treat each document as an album of stickers called shingles.', takeaway: 'Jaccard similarity asks how much the albums overlap.' },
    { label: '2 · Tiny signature', scene: 'Shuffle the sticker rows and keep the first sticker seen for each shuffle.', takeaway: 'Matching MinHash entries estimate the overlap.' },
    { label: '3 · Candidate bell', scene: 'Put signature rows into bands; a matching band rings a bell for a possible neighbor.', takeaway: 'LSH proposes candidates; exact verification still checks the real sets.' }
  ]),
  'dsa5101-clustering': kidAnimation('The toy-box organizer', 'Put similar toys together, then check whether the boxes still tell the truth when the toy room grows huge.', [
    { label: '1 · Nearby toys', scene: 'Give each toy to the closest box or join boxes using a chosen linkage rule.', takeaway: 'The distance and geometry decide what “similar” means.' },
    { label: '2 · Move the label', scene: 'For K-means, move each box label to the mean position of its toys and repeat.', takeaway: 'Each update improves the local squared-error objective, but initialization can still matter.' },
    { label: '3 · Tiny summary', scene: 'Keep confident toys in DS, uncertain groups in CS, and lonely outliers in RS; CURE keeps several boundary representatives.', takeaway: 'BFR and CURE trade exact detail for a compact, auditable summary.' },
    { label: '4 · Check', scene: 'Count how many toys land in the right labelled box, but also ask whether the boxes are useful and not just tiny.', takeaway: 'Purity alone is not a complete quality claim.' }
  ]),
  'dsa5101-recommenders': kidAnimation('The movie-buddy club', 'Find friends with similar taste, but also learn a compact taste profile so the two methods do not get mixed up.', [
    { label: '1 · Center', scene: 'Subtract each friend’s usual star level so “generous rater” does not look like “same taste.”', takeaway: 'Mean-centering compares patterns of likes and dislikes.' },
    { label: '2 · Borrow', scene: 'Let nearby taste-buddies vote on the missing movie rating.', takeaway: 'User-based filtering is a neighborhood calculation.' },
    { label: '3 · Learn', scene: 'Give each friend and movie a tiny hidden taste vector, then combine matching coordinates.', takeaway: 'Latent factors predict with a dot product, a different model path.' }
  ]),
  'dsa5101-pagerank': kidAnimation('The bouncing web ball', 'A ball visits web pages, shares its weight along links, and sometimes jumps to a chosen page.', [
    { label: '1 · Share', scene: 'A page with two outgoing links splits its ball weight between the two destinations.', takeaway: 'Fix row-versus-column orientation before multiplying.' },
    { label: '2 · Jump', scene: 'A small teleport jump prevents the ball from getting trapped in a corner of the web.', takeaway: 'Damping mixes link-following with teleportation.' },
    { label: '3 · Repeat', scene: 'Repeat the sharing until the page weights settle into a stable pattern.', takeaway: 'Power iteration is a repeated state update; dangling pages need a convention.' }
  ]),
  'dsa5101-streams': kidAnimation('The tiny notebook', 'A stream is a never-ending parade, so the notebook keeps only a clever summary instead of every visitor.', [
    { label: '1 · Recent window', scene: 'DGIM groups recent 1s into timestamped buckets and keeps at most two buckets of each size.', takeaway: 'The oldest partly covered bucket explains the count error.' },
    { label: '2 · New names', scene: 'Flajolet–Martin watches the longest run of zeroes in hashed names.', takeaway: 'It estimates distinct items, not a recent-window count.' },
    { label: '3 · Repeated visits', scene: 'AMS samples positions to estimate how strongly repeated values dominate the parade.', takeaway: 'The second moment squares frequencies, so it is a different target.' }
  ]),
  'dsa5101-balance': kidAnimation('The two toy shops', 'Two shops have limited coins; each new toy request must be sent to an eligible shop.', [
    { label: '1 · Check', scene: 'Write down which shops bid for this toy and how many coins each shop has left.', takeaway: 'The state is the remaining budget, not just the current request.' },
    { label: '2 · Choose', scene: 'Give the toy to the eligible shop with more coins left; make the tie rule explicit.', takeaway: 'BALANCE is a local choice that must be traced step by step.' },
    { label: '3 · Challenge', scene: 'Try a different request order and see whether a lucky run still proves a guarantee.', takeaway: 'One successful sequence is not a proof of optimality.' }
  ])
};
for (const [lessonId, animation] of Object.entries(kidAnimations)) {
  if (labs[lessonId]) labs[lessonId].animation = animation;
}
fs.writeFileSync(labsPath, `${JSON.stringify(labs, null, 2)}\n`);

const assessmentMap = {
  schemaVersion: 'nus.assessment-map.v1',
  courseCode: 'DSA5101',
  title: 'DSA5101 lecture → assignment → textbook exam map',
  summary: 'A source-labeled revision map. Lecture and assignment files define the current course boundary; MMDS is attached as textbook depth and never silently upgraded to lecture scope.',
  disclaimer: 'This is a study-priority map, not an official exam specification. Canvas project brief and rubric remain pending direct retrieval and are not inferred.',
  studyOrder: [
    { id: 'core-patterns', label: 'Patterns and similarity', topicIds: ['frequent-itemsets', 'similarity'] },
    { id: 'clustering', label: 'Clustering and scalable summaries', topicIds: ['clustering'] },
    { id: 'assignment2-tracks', label: 'Assignment 2 four tracks', topicIds: ['recommenders', 'pagerank', 'streams', 'balance'] },
    { id: 'mixed-exam', label: 'Timed mixed exam and mistake clinic', topicIds: ['frequent-itemsets', 'similarity', 'clustering', 'recommenders', 'pagerank', 'streams', 'balance'] }
  ],
  evidence: [
    { id: 'dsa5101-lectures', label: 'Local Lectures 1–3', kind: 'lecture', evidenceLevel: 'official-lecture', description: 'The local lecture PDFs define the current study scope for frequent itemsets, MinHash/LSH, and clustering.', sourceRefs: [ref('DSA5101/Lec1 - Assoc Rules, Frequent itemsets.pdf', 24, 'lecture', 'frequent itemsets'), ref('DSA5101/Lec 2 - Finding Similar items, LSH.pdf', 37, 'lecture', 'MinHash'), ref(lecture3, 37, 'lecture', 'K-means')] },
    { id: 'dsa5101-assignment-1', label: 'Official Assignment 1', kind: 'assignment', evidenceLevel: 'official-exercise', description: 'Assignment 1 provides the itemset, MinHash/LSH, and hierarchical-clustering practice calculations.', sourceRefs: [ref(assignment1, 1, 'exercise', 'itemsets'), ref(assignment1, 4, 'exercise', 'LSH'), ref(assignment1, 6, 'exercise', 'hierarchical clustering')] },
    { id: 'dsa5101-assignment-2', label: 'Official Assignment 2', kind: 'assignment', evidenceLevel: 'official-exercise', description: 'Assignment 2 provides the recommender, PageRank, DGIM, Flajolet–Martin/AMS, and BALANCE calculations.', sourceRefs: [ref(assignment2, 2, 'exercise', 'recommenders'), ref(assignment2, 4, 'exercise', 'PageRank'), ref(assignment2, 6, 'exercise', 'stream moments'), ref(assignment2, 7, 'exercise', 'BALANCE')] }
  ],
  topics: [
    { id: 'frequent-itemsets', title: 'Frequent itemsets', signal: 'Lecture + Assignment 1', priority: 'Core', practice: 'Count, prune, and interpret the denominator.', lectureScope: 'Lecture 1 support, confidence, lift, and downward closure.', examMove: 'Count baskets, prune by monotonicity, then distinguish confidence from lift.', lectureRefs: [ref('DSA5101/Lec1 - Assoc Rules, Frequent itemsets.pdf', 24, 'lecture', 'support definition'), ref('DSA5101/Lec1 - Assoc Rules, Frequent itemsets.pdf', 36, 'lecture', 'downward closure')], assignmentRefs: [ref(assignment1, 1, 'exercise', 'itemset calculation')], textbookRefs: [ref(textbook, 214, 'textbook', 'market-basket model'), ref(textbook, 225, 'textbook', 'A-Priori')], evidenceIds: ['dsa5101-lectures', 'dsa5101-assignment-1'], lessonIds: ['dsa5101-frequent-itemsets'] },
    { id: 'similarity', title: 'MinHash and LSH', signal: 'Lecture + Assignment 1', priority: 'Core', practice: 'Compute the probability, then verify the candidate.', lectureScope: 'Lecture 2 set similarity, signatures, banding, and candidate verification.', examMove: 'Compute Jaccard/MinHash/LSH probabilities and state the false-positive verification boundary.', lectureRefs: [ref('DSA5101/Lec 2 - Finding Similar items, LSH.pdf', 37, 'lecture', 'MinHash collision'), ref('DSA5101/Lec 2 - Finding Similar items, LSH.pdf', 62, 'lecture', 'LSH banding')], assignmentRefs: [ref(assignment1, 3, 'exercise', 'MinHash'), ref(assignment1, 4, 'exercise', 'LSH banding')], textbookRefs: [ref(textbook, 95, 'textbook', 'MinHash'), ref(textbook, 100, 'textbook', 'LSH')], evidenceIds: ['dsa5101-lectures', 'dsa5101-assignment-1'], lessonIds: ['dsa5101-minhash-lsh'] },
    { id: 'clustering', title: 'Clustering at scale', signal: 'Lecture 3 + Assignment 1', priority: 'Core', practice: 'Name the geometry, update the state, and critique the metric.', lectureScope: 'Lecture 3 hierarchical clustering, K-means, BFR, CURE, and evaluation.', examMove: 'Name the geometry, perform the update, state the memory summary, and critique the metric.', lectureRefs: lecture3Refs, assignmentRefs: [ref(assignment1, 6, 'exercise', 'hierarchical clustering')], textbookRefs: [], evidenceIds: ['dsa5101-lectures', 'dsa5101-assignment-1'], lessonIds: ['dsa5101-clustering'], gap: 'The local MMDS index has no dedicated clustering chapter; this is an explicit textbook-depth gap, not missing lecture evidence.' },
    { id: 'recommenders', title: 'Recommender track', signal: 'Assignment 2 · Q1', priority: 'Targeted', practice: 'Center ratings and keep latent factors separate.', lectureScope: 'Lecture 3 application motivation only; detailed calculations are in Assignment 2.', examMove: 'Mean-center for user-based cosine, then keep latent-factor dot products separate.', lectureRefs: [ref(lecture3, 3, 'lecture', 'recommender motivation')], assignmentRefs: [ref(assignment2, 2, 'exercise', 'user-based filtering'), ref(assignment2, 3, 'exercise', 'latent factors')], textbookRefs: [ref(textbook, 84, 'textbook', 'collaborative filtering')], evidenceIds: ['dsa5101-lectures', 'dsa5101-assignment-2'], lessonIds: ['dsa5101-recommenders'] },
    { id: 'pagerank', title: 'PageRank track', signal: 'Assignment 2 · Q2', priority: 'Targeted', practice: 'Fix matrix orientation before multiplying.', lectureScope: 'No dedicated PageRank lecture slide set has been verified in DSA5101; treat the assignment as the current exercise source.', examMove: 'Fix matrix orientation, run two power iterations, and handle damping and dangling nodes explicitly.', lectureRefs: [], assignmentRefs: [ref(assignment2, 4, 'exercise', 'transition matrix and power iteration')], textbookRefs: [ref(textbook, 175, 'textbook', 'PageRank definition'), ref(textbook, 191, 'textbook', 'MapReduce iteration')], evidenceIds: ['dsa5101-assignment-2'], lessonIds: ['dsa5101-pagerank'] },
    { id: 'streams', title: 'Streaming sketches track', signal: 'Assignment 2 · Q3–Q4', priority: 'Targeted', practice: 'Identify the target statistic before choosing a sketch.', lectureScope: 'No dedicated DGIM/FM/AMS lecture slide set has been verified in DSA5101; Assignment 2 is the exercise boundary.', examMove: 'Identify the target statistic, maintain the sketch invariant, and state the approximation/error source.', lectureRefs: [], assignmentRefs: [ref(assignment2, 5, 'exercise', 'DGIM'), ref(assignment2, 6, 'exercise', 'Flajolet-Martin and AMS')], textbookRefs: [ref(textbook, 154, 'textbook', 'stream queries'), ref(textbook, 155, 'textbook', 'Flajolet-Martin'), ref(textbook, 167, 'textbook', 'DGIM')], evidenceIds: ['dsa5101-assignment-2'], lessonIds: ['dsa5101-streams'] },
    { id: 'balance', title: 'BALANCE track', signal: 'Assignment 2 · Q5', priority: 'Targeted', practice: 'Trace every tie before claiming a guarantee.', lectureScope: 'No dedicated BALANCE lecture slide set has been verified; Assignment 2 is the authoritative sequence and guarantee task.', examMove: 'Trace remaining budgets, test ties, and distinguish one successful run from a guarantee.', lectureRefs: [], assignmentRefs: [ref(assignment2, 7, 'exercise', 'BALANCE sequences')], textbookRefs: [], evidenceIds: ['dsa5101-assignment-2'], lessonIds: ['dsa5101-balance'] }
  ],
  algorithmFocus: [
    { rank: 1, id: 'apriori-downward-closure', title: 'A-Priori and downward closure', tier: 'Must master', assessmentSignal: 'Lecture 1 + Assignment 1', lessonId: 'dsa5101-frequent-itemsets', visualLabId: 'dsa5101-frequent-itemsets', why: 'Direct lecture and Assignment 1 counting/pruning signal; it is a foundation for every basket question.', examMove: 'Count baskets, prune supersets, then keep confidence and lift denominators separate.', kidAnalogy: 'A basket detective crosses out impossible snack combinations before checking every shelf.', sourceRefs: [ref(lecture1, 24, 'lecture', 'support definition'), ref(assignment1, 1, 'exercise', 'itemset calculation')] },
    { rank: 2, id: 'minhash-lsh', title: 'MinHash and LSH', tier: 'Must master', assessmentSignal: 'Lecture 2 + Assignment 1', lessonId: 'dsa5101-minhash-lsh', visualLabId: 'dsa5101-minhash-lsh', why: 'The assignment explicitly tests signatures, bands, candidate probability, and verification boundaries.', examMove: 'Compute Jaccard/MinHash/LSH probabilities and say why a candidate is not yet a verified neighbor.', kidAnalogy: 'Compare two sticker albums with a tiny signature before opening every page.', sourceRefs: [ref(lecture2, 37, 'lecture', 'MinHash collision'), ref(assignment1, 4, 'exercise', 'LSH banding')] },
    { rank: 3, id: 'hierarchical-kmeans', title: 'Hierarchical linkage and K-means', tier: 'Must master', assessmentSignal: 'Lecture 3 + Assignment 1', lessonId: 'dsa5101-clustering', visualLabId: 'dsa5101-clustering', why: 'Lecture 3 gives the core geometry, objective, update, convergence, and evaluation reasoning; Assignment 1 supplies a calculation task.', examMove: 'Name the geometry, perform one update, state the local-optimum caveat, and critique the metric.', kidAnalogy: 'Organize toys into boxes, move the box labels, then ask whether the boxes still make sense.', sourceRefs: [ref(lecture3, 21, 'lecture', 'linkage comparison'), ref(lecture3, 37, 'lecture', 'K-means objective'), ref(assignment1, 6, 'exercise', 'hierarchical clustering')] },
    { rank: 4, id: 'bfr-cure', title: 'BFR and CURE summaries', tier: 'Must master conceptually', assessmentSignal: 'Lecture 3', lessonId: 'dsa5101-clustering', visualLabId: 'dsa5101-clustering', why: 'These are the scalable-summary choices that turn clustering into a memory and representation question.', examMove: 'Classify DS/CS/RS and explain why dispersed CURE representatives preserve shape.', kidAnalogy: 'Keep confident toys in a short list, uncertain groups in a box, and boundary toys as reminders of the shape.', sourceRefs: [ref(lecture3, 59, 'lecture', 'BFR overview'), ref(lecture3, 78, 'lecture', 'CURE representatives')] },
    { rank: 5, id: 'recommender-models', title: 'Recommender models', tier: 'Must master', assessmentSignal: 'Assignment 2 · Q1', lessonId: 'dsa5101-recommenders', visualLabId: 'dsa5101-recommenders', why: 'Assignment 2 directly separates mean-centered neighborhood prediction from latent-factor prediction.', examMove: 'Center ratings, compute similarity-weighted evidence, and keep the latent dot product as a separate model.', kidAnalogy: 'Ask taste-buddies for a vote, then compare that with a tiny hidden taste profile.', sourceRefs: [ref(assignment2, 2, 'exercise', 'user-based filtering'), ref(assignment2, 3, 'exercise', 'latent factors')] },
    { rank: 6, id: 'pagerank-power-iteration', title: 'PageRank and power iteration', tier: 'Must master', assessmentSignal: 'Assignment 2 · Q2', lessonId: 'dsa5101-pagerank', visualLabId: 'dsa5101-pagerank', why: 'Assignment 2 explicitly tests matrix orientation, iterations, damping, and dangling-node handling.', examMove: 'Fix orientation, move probability mass, handle dangling mass, and repeat the update.', kidAnalogy: 'A ball bounces through web pages and sometimes teleports to a chosen page.', sourceRefs: [ref(assignment2, 4, 'exercise', 'power iteration')] },
    { rank: 7, id: 'streaming-sketches', title: 'DGIM, Flajolet–Martin, and AMS', tier: 'Must master', assessmentSignal: 'Assignment 2 · Q3–Q4', lessonId: 'dsa5101-streams', visualLabId: 'dsa5101-streams', why: 'Assignment 2 tests three bounded-memory sketches with different target statistics and error contracts.', examMove: 'Name the target quantity first, maintain the invariant, and state the approximation source.', kidAnalogy: 'A tiny notebook summarizes a never-ending parade without writing down every visitor.', sourceRefs: [ref(assignment2, 5, 'exercise', 'DGIM'), ref(assignment2, 6, 'exercise', 'Flajolet-Martin and AMS')] },
    { rank: 8, id: 'balance-budget-trace', title: 'BALANCE budget allocation', tier: 'Must master', assessmentSignal: 'Assignment 2 · Q5', lessonId: 'dsa5101-balance', visualLabId: 'dsa5101-balance', why: 'Assignment 2 directly tests state tracing, ties, adversarial order, and guarantee strength.', examMove: 'Track remaining budgets after every query and distinguish a local success from a global guarantee.', kidAnalogy: 'Two toy shops spend limited coins; the next request can expose whether a greedy choice is safe.', sourceRefs: [ref(assignment2, 7, 'exercise', 'BALANCE sequences')] }
  ],
  projectStatus: { status: 'pending-canvas', evidence: 'The project brief and rubric were not encoded in local canonical content and the authenticated Canvas Assignments page did not return a stable DOM during this audit.', nextAction: 'Provide a direct Canvas project assignment link or export so the official brief, rubric, deliverables, and grading constraints can be transcribed with page-level provenance.' }
};
const practicePlan = {
  schemaVersion: 'nus.practice-plan.v1',
  courseCode: 'DSA5101',
  title: 'DSA5101 timed mixed exam and mistake clinic',
  durationMinutes: 90,
  questionCount: 12,
  selectionPolicy: 'One deterministic mixed set: two core lecture questions, two clustering questions, two recommender/PageRank questions, four stream/BALANCE questions, and two cross-track critiques.',
  questionIds: ['dsa5101-bank-002', 'dsa5101-mh-q2', 'dsa5101-cluster-q2', 'dsa5101-cluster-q4', 'dsa5101-recommender-q2', 'dsa5101-pagerank-q2', 'dsa5101-stream-q3', 'dsa5101-stream-q4', 'dsa5101-balance-q2', 'dsa5101-balance-q3', 'dsa5101-bank-010', 'dsa5101-bank-012'],
  timing: ['0–10 min: recall and representation checks', '10–45 min: calculations and updates', '45–75 min: derivations and guarantees', '75–90 min: audit assumptions and sources'],
  mistakeClinic: [
    { step: 1, action: 'Tag the miss', tags: ['representation', 'formula', 'arithmetic', 'invariant', 'guarantee', 'source boundary'] },
    { step: 2, action: 'Repair from the nearest canonical source', rule: 'Write the correct state transition and cite the lecture or assignment page before looking at textbook depth.' },
    { step: 3, action: 'Redrill with a perturbed instance', rule: 'Change one number, edge, budget, or tie and recompute without copying the old answer.' },
    { step: 4, action: 'Redeem the mistake', rule: 'Record the corrected explanation and the condition under which it would fail.' }
  ],
  sourceRefs: [ref(lecture3, 37, 'lecture', 'K-means objective'), ref(assignment1, 4, 'exercise', 'LSH banding'), ref(assignment2, 4, 'exercise', 'PageRank'), ref(assignment2, 6, 'exercise', 'AMS'), ref(assignment2, 7, 'exercise', 'BALANCE')]
};
assessmentMap.practicePlan = practicePlan;
writeJson('assessment-map.json', assessmentMap);
writeJson('practice/dsa5101-timed-mixed-exam.json', practicePlan);

console.log('Extended DSA5101 canonical lessons, questions, study kits, labs, visuals, assessment map, and practice plan.');
