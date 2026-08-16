(function () {
  "use strict";
  const lecture = (page, role) => ({ sourceId: "DSA5105/Lec1_annotated.pdf", page, sourceType: "lecture", role, status: "current" });
  const exercise = (page, role) => ({ sourceId: "DSA5105/Lec1_exercises-solutions.pdf", page, sourceType: "exercise", role, status: "current-context" });
  const textbook = (page, role) => ({ sourceId: "DSA5105/Textbook.pdf", page, sourceType: "textbook", role, status: "course-depth" });
  const reference = (sourceId, role) => ({ sourceId, page: 1, sourceType: "ref", role, status: "optional" });
  const bigDataLecture = (sourceId, page, role) => ({ sourceId, page, sourceType: "lecture", role, status: "current" });
  const bigDataExercise = (sourceId, page, role) => ({ sourceId, page, sourceType: "exercise", role, status: "current-context" });
  const bigDataTextbook = (page, role) => ({ sourceId: "DSA5101/Reference textbook MMDS 3rd Edition.pdf", page, sourceType: "textbook", role, status: "course-depth" });
  const bigDataLens = (why, lectureRefs, exerciseRefs, textbookRefs) => ({ status: "core DSA5101", whyExaminable: why, lecture: lectureRefs || [], officialExercise: exerciseRefs || [], textbook: textbookRefs || [], reference: [] });
  const lens = (status, whyExaminable, lectureRefs, exerciseRefs, textbookRefs, referenceRefs) => ({ status, whyExaminable, lecture: lectureRefs || [], officialExercise: exerciseRefs || [], textbook: textbookRefs || [], reference: referenceRefs || [] });
  window.NUS_VISUAL_LABS = {
    "dsa5101-orientation": {
      courseCode: "DSA5101", lessonId: "dsa5101-orientation", type: "concept-map", title: "Scalable-design decision map",
      learningGoal: "Choose the first evidence to inspect when a data workflow must scale beyond one machine.",
      sourceRefs: [bigDataLecture("DSA5101/DSA5101 Course Information.pdf", 1, "course framing"), bigDataTextbook(3, "scalable algorithm framing")],
      sourceLens: bigDataLens("The course information establishes the scope; the textbook supplies a compact systems vocabulary for reasoning about scale.", [bigDataLecture("DSA5101/DSA5101 Course Information.pdf", 1, "course framing")], [], [bigDataTextbook(3, "scalable algorithm framing")]),
      nodes: [{ id: "passes", label: "Data passes", detail: "How many full reads are required?" }, { id: "memory", label: "Working memory", detail: "Can the state fit on one worker?" }, { id: "shuffle", label: "Data movement", detail: "What must cross the network?" }, { id: "error", label: "Error contract", detail: "What approximation is acceptable?" }],
      edges: [["passes", "memory"], ["memory", "shuffle"], ["shuffle", "error"]], requiredChoice: "memory", initialState: { choice: null }, check: state => state.choice === "memory", reducedMotion: true, explanation: "The map turns a vague scalability claim into four inspectable questions before implementation details distract you."
    },
    "dsa5101-frequent-itemsets": {
      courseCode: "DSA5101", lessonId: "dsa5101-frequent-itemsets", type: "deep-dive", title: "Association-rule reasoning studio",
      learningGoal: "Separate counting baskets, pruning candidates, and interpreting a rule's conditional strength.",
      sourceRefs: [bigDataLecture("DSA5101/Lec1 - Assoc Rules, Frequent itemsets.pdf", 24, "support definition"), bigDataExercise("DSA5101/Assignments/DSA5101_Assignment_1.pdf", 1, "assignment practice"), bigDataTextbook(214, "frequent-itemset depth")],
      sourceLens: bigDataLens("The lecture and assignment establish the calculation workflow; MMDS provides the full frequent-itemset chapter as labeled depth.", [bigDataLecture("DSA5101/Lec1 - Assoc Rules, Frequent itemsets.pdf", 24, "support definition")], [bigDataExercise("DSA5101/Assignments/DSA5101_Assignment_1.pdf", 1, "assignment practice")], [bigDataTextbook(214, "frequent-itemset depth")]),
      exercises: [
        { id: "support", label: "Support", prompt: "How does a basket table become a support value?", takeaway: "Count qualifying transactions first; normalize only after the numerator is explicit.", steps: [["Count", "support(I)=count(I in baskets)", "Identify the baskets containing every item in the candidate."], ["Normalize", "supp(I)=count(I)/|T|", "Divide by the total number of transactions."], ["Prune", "infrequent(I) => infrequent(J) for I subset J", "Use downward closure to remove every superset safely."], ["Check", "support -> candidate -> rule", "Only after frequent sets are known should rule confidence be interpreted."]] },
        { id: "confidence", label: "Confidence", prompt: "Why is the antecedent the denominator?", takeaway: "Confidence is conditional: among baskets with A, how often does B also occur?", steps: [["Condition", "A -> B", "Start with the baskets that already contain the antecedent."], ["Overlap", "supp(A union B)", "Count baskets containing both sides."], ["Divide", "conf(A -> B)=supp(A union B)/supp(A)", "The denominator is the antecedent support, not all baskets."], ["Interpret", "conf != lift", "A high conditional rate can still add little information when B is common."]] },
        { id: "interest", label: "Interest", prompt: "What does a base-rate comparison add?", takeaway: "Lift or interest asks whether the consequent is more likely than its background frequency.", steps: [["Baseline", "supp(B)", "Measure how common the consequent is without conditioning."], ["Conditional", "conf(A -> B)", "Measure how common B is among A baskets."], ["Compare", "lift=conf(A -> B)/supp(B)", "A value above one indicates positive association under this measure."], ["Boundary", "association != causation", "A rule can be predictive without proving that A causes B."]] }
      ], initialState: { exercise: "support", step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "Each tab isolates a different denominator or interpretation so support, confidence, and lift do not blur together."
    },
    "dsa5101-minhash-lsh": {
      courseCode: "DSA5101", lessonId: "dsa5101-minhash-lsh", type: "derivation-trace", title: "MinHash-to-LSH trace",
      learningGoal: "Follow the chain from set similarity to compact signatures and then to candidate generation.",
      sourceRefs: [bigDataExercise("DSA5101/Assignments/DSA5101_Assignment_1.pdf", 3, "MinHash"), bigDataExercise("DSA5101/Assignments/DSA5101_Assignment_1.pdf", 4, "LSH banding"), bigDataTextbook(95, "MinHash and LSH depth")],
      sourceLens: bigDataLens("The assignment requires the probability calculation; MMDS supplies the derivation and parameter trade-off as textbook depth.", [], [bigDataExercise("DSA5101/Assignments/DSA5101_Assignment_1.pdf", 3, "MinHash"), bigDataExercise("DSA5101/Assignments/DSA5101_Assignment_1.pdf", 4, "LSH banding")], [bigDataTextbook(95, "MinHash and LSH depth")]),
      steps: [["Set geometry", String.raw`J(A,B)=\frac{|A\cap B|}{|A\cup B|}`, "Define similarity before choosing a sketch."], ["One permutation", String.raw`\Pr[h(A)=h(B)]=J(A,B)`, "A collision is an unbiased similarity signal under a random permutation."], ["Banding", String.raw`P_{\mathrm{candidate}}=1-(1-s^r)^b`, "At least one matching band is enough to pass the candidate filter."], ["Verify", String.raw`\text{candidate}\to\text{exact similarity}`, "LSH generates candidates; it does not certify every candidate as a true neighbor."]],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "The trace keeps exact similarity, compact estimation, and approximate candidate retrieval as three different operations."
    },
    "dsa5101-ranking-streams": {
      courseCode: "DSA5101", lessonId: "dsa5101-ranking-streams", type: "decision-tree", title: "Ranking and sketch selection lab",
      learningGoal: "Match a data question to PageRank, DGIM, or Flajolet–Martin without treating every stream method as interchangeable.",
      sourceRefs: [bigDataExercise("DSA5101/Assignments/DSA5101_Assignment_2.pdf", 2, "PageRank"), bigDataExercise("DSA5101/Assignments/DSA5101_Assignment_2.pdf", 4, "streaming sketches"), bigDataTextbook(155, "streaming depth")],
      sourceLens: bigDataLens("Assignment prompts define the current practice boundary; MMDS links the algorithms to their distinct outputs and error models.", [], [bigDataExercise("DSA5101/Assignments/DSA5101_Assignment_2.pdf", 2, "PageRank"), bigDataExercise("DSA5101/Assignments/DSA5101_Assignment_2.pdf", 4, "streaming sketches")], [bigDataTextbook(155, "streaming depth")]),
      splits: [{ id: "pagerank", label: "Rank nodes by link structure", impurity: 18, detail: "Use stationary probability mass and damping." }, { id: "window", label: "Count recent 1s in a window", impurity: 26, detail: "Use timestamped buckets and bounded memory." }, { id: "distinct", label: "Estimate distinct stream items", impurity: 22, detail: "Use hash zero-prefix evidence and accept approximation." }], requiredChoice: "window", initialState: { choice: null }, check: state => state.choice === "window", reducedMotion: true, explanation: "The right method follows the target quantity: node importance, a recent-window count, or distinct-cardinality estimation."
    },
    "dsa5105-erm": {
      courseCode: "DSA5105", lessonId: "dsa5105-erm", type: "compare", title: "Train–validation gap lab",
      learningGoal: "Use a held-out validation signal to choose a model complexity instead of celebrating training fit alone.",
      sourceRefs: [lecture(23, "empirical risk"), lecture(24, "population risk and generalization gap"), textbook(33, "model selection depth")],
      initialState: { complexity: 42 }, check: state => state.complexity >= 35 && state.complexity <= 80, reducedMotion: true, explanation: "The useful choice is near the lowest validation risk, not necessarily the lowest training risk."
    },
    "dsa5105-week1-derivations": {
      courseCode: "DSA5105", lessonId: "dsa5105-week1-derivations", type: "deep-dive", title: "Week 1 derivation studio",
      learningGoal: "Choose one proof path, reveal each algebraic move, and explain the assumption behind the result.",
      sourceRefs: [lecture(23, "empirical risk"), lecture(24, "population risk"), lecture(25, "three sources of error"), lecture(35, "Huber definition"), lecture(47, "singular OLS"), lecture(48, "regularization"), lecture(49, "regularization and generalization"), lecture(50, "one-hot classification"), lecture(51, "multiclass setup"), lecture(52, "least-squares classification"), lecture(53, "classification error and surrogate"), lecture(54, "softmax and cross-entropy"), exercise(1, "Huber derivative"), exercise(2, "ridge spectral filter"), exercise(3, "logistic convexity")],
      sourceLens: lens("core Week-1 derivation", "Lecture supplies the scope; official exercises supply the derivation depth. The distinction is intentional: being in the lecture does not mean every algebraic extension is lecture-level.", [lecture(23, "empirical risk"), lecture(24, "population risk"), lecture(25, "three sources of error"), lecture(35, "Huber definition"), lecture(47, "singular OLS"), lecture(48, "regularization"), lecture(54, "softmax and cross-entropy")], [exercise(1, "Huber derivative"), exercise(2, "ridge closed form + eigen analysis"), exercise(3, "logistic convexity")]),
      exercises: [
        { id: "risk", label: "Risk gap", prompt: "Why can we minimize a sample average but care about an expectation?", takeaway: "ERM is observable; population risk is the target. iid sampling is the bridge, not a guarantee.", steps: [["Empirical", "\\widehat R(h)=\\frac{1}{N}\\sum_i\\ell(h(x_i),y_i)", "Compute the average loss on the examples we actually observed."], ["Population", "R_{\\mathrm{pop}}(h)=\\mathbb E_{x\\sim\\mu}[\\ell(h(x),f^*(x))]", "The target quantity averages over future draws from the population."], ["Assumption", "x_i\\overset{\\mathrm{iid}}{\\sim}\\mu", "Independent, same-distribution draws make the sample representative in the intended sense."], ["Diagnosis", "\\widehat R\\text{ small}\\not\\Rightarrow R_{\\mathrm{pop}}\\text{ small}", "A flexible class, leakage, shift, or a broken split can leave a large generalization gap."]] },
        { id: "huber", label: "Huber ψ-function", prompt: "Why does Huber reduce the pull of an extreme residual?", takeaway: "The loss grows linearly outside delta, so its derivative—and therefore the score contribution—is bounded.", steps: [["Loss", "\\rho_\\delta(r)=\\begin{cases}\\frac12r^2&|r|\\le\\delta\\\\\\delta|r|-\\frac12\\delta^2&|r|>\\delta\\end{cases}", "Keep the quadratic region near a good fit and switch to a linear tail."], ["Derivative", "\\psi_\\delta(r)=\\rho_\\delta'(r)", "The derivative is the signal that enters the first-order condition."], ["Piecewise", "\\psi_\\delta(r)=r\\;\\text{or}\\;\\delta\\operatorname{sign}(r)", "Outside the threshold, the derivative stops growing with the residual magnitude."], ["Optimality", "\\sum_i\\psi_\\delta(\\hat m-y_i)=0", "An outlier can contribute only plus or minus delta to the location equation."]] },
        { id: "nullspace", label: "Singular OLS", prompt: "What changes when the design matrix cannot identify every parameter direction?", takeaway: "The pseudoinverse selects one solution; the null-space family shows why training predictions alone do not identify the parameters.", steps: [["Normal equation", "\\Phi^\\top\\Phi w=\\Phi^\\top y", "Stationarity gives the equation, but rank deficiency prevents a unique inverse formula."], ["Particular", "w_0=\\Phi^\\dagger y", "The pseudoinverse returns a canonical minimum-norm solution."], ["Null space", "w(u)=\\Phi^\\dagger y+(I-\\Phi^\\dagger\\Phi)u", "The added component is invisible to the observed rows of Phi."], ["Risk", "\\Phi w(u)=\\Phi\\Phi^\\dagger y", "Training predictions can match while coefficient size and off-sample behavior differ."]] },
        { id: "ridge", label: "Ridge spectrum", prompt: "Which eigen-directions does ridge suppress, and why?", takeaway: "The filter mu/(mu+lambda) preserves data-confident directions and suppresses weakly identified directions.", steps: [["Objective", "\\min_w\\frac{1}{2N}\\|\\Phi w-y\\|^2+\\frac\\lambda2\\|w\\|^2", "Combine fit with a cost for large coefficients."], ["Stationarity", "(A+\\lambda I)\\hat w_\\lambda=b", "Differentiate with A=Phi^T Phi/N and b=Phi^T y/N."], ["Eigenbasis", "Av_j=\\mu_jv_j", "In an eigen-direction, the normal matrix acts like scalar curvature mu_j."], ["Filter", "\\frac{\\langle\\hat w_\\lambda,v_j\\rangle}{\\langle\\hat w_0,v_j\\rangle}=\\frac{\\mu_j}{\\mu_j+\\lambda}", "Small mu_j receives strong shrinkage; large mu_j survives when it dominates lambda."], ["Interpret", "\\mu_j\\ll\\lambda\\Rightarrow0;\\quad\\mu_j\\gg\\lambda\\Rightarrow1", "Ridge is a spectral filter, not merely a penalty slogan."]] },
        { id: "surrogate", label: "Surrogate loss", prompt: "Why not optimize classification error directly?", takeaway: "0–1 loss matches the metric but has poor optimization geometry; a smooth surrogate supplies useful gradients.", steps: [["Target metric", "\\mathbf 1\\{\\hat y\\ne y\\}", "This is what we ultimately report for classification correctness."], ["Problem", "\\text{0--1 loss is discontinuous}", "Small score changes usually do nothing until the decision boundary is crossed."], ["Surrogate", "\\text{smooth loss}\\;\\approx\\;\\text{optimization signal}", "Use a differentiable objective while keeping the final metric distinct."], ["Softmax", "p_k=\\frac{e^{z_k}}{\\sum_j e^{z_j}}", "Cross-entropy turns class scores into a probability-aware training objective."]] },
        { id: "logistic", label: "Logistic convexity and tie case", prompt: "How does binary softmax become a convex logistic objective?", takeaway: "The score difference gives the decision rule; the non-negative second derivative gives convexity in that score.", steps: [["Score", "s=z_1-z_2", "Two-class softmax depends only on the relative logit difference."], ["Decision", "\\hat y=\\begin{cases}+1,&s>0\\\\-1,&s<0\\end{cases}", "Use an explicit tie rule when s=0; the sign shorthand hides that convention."], ["Loss", "\\ell(s,y)=\\log(1+e^{-ys})", "Use y in {-1,+1} to write binary cross-entropy compactly."], ["Curvature", "\\frac{\\partial^2\\ell}{\\partial s^2}=\\frac{e^{ys}}{(1+e^{ys})^2}\\ge0", "Positive curvature everywhere means the score-level loss is convex."]] },
        { id: "synthesis", label: "Synthesis map", prompt: "Can you connect data, fitting, diagnosis, and stabilization?", takeaway: "The equations are one pipeline: sample → objective → fitted model → generalization diagnosis → rank-aware regularization.", steps: [["Data", "\\mathcal D=\\{(x_i,y_i)\\}_{i=1}^{N}", "Name the observed sample and the oracle it approximates."], ["Fit", "(\\mathcal H,\\ell)\\to\\widehat R\\to\\hat f", "Choose a hypothesis class and loss before optimizing."], ["Diagnose", "\\text{approximation}+\\text{estimation}+\\text{optimization}", "Separate in-class approximation, finite-sample estimation, and algorithmic optimization."], ["Stabilize", "\\text{rank deficiency}\\to\\text{regularization}\\to\\text{spectral filtering}", "Ridge suppresses weak directions instead of pretending they are well identified."]] }
      ],
      initialState: { exercise: "risk", step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "Each tab is one proof pattern from the Week 1 exercise set. Reveal the algebra, then say what the formula means for data, optimization, or generalization."
    },
    "dsa5105-svm-margin": {
      courseCode: "DSA5105", lessonId: "dsa5105-svm-margin", type: "geometry", title: "Margin and support-vector lab",
      learningGoal: "See how a wider margin can improve geometric robustness while still respecting classification errors.",
      sourceRefs: [lecture(1, "current scope"), textbook(129, "large-margin depth")],
      initialState: { margin: 2 }, check: state => state.margin >= 1.5, reducedMotion: true, explanation: "Support vectors anchor the boundary; changing the margin changes the trade-off between fit and robustness."
    },
    "dsa5105-pca-deep-dive": {
      courseCode: "DSA5105", lessonId: "dsa5105-pca-deep-dive", type: "math-stepper", title: "PCA projection stepper",
      learningGoal: "Trace centering, covariance structure, and projection as three separate reasoning steps.",
      sourceRefs: [lecture(1, "current scope"), textbook(558, "PCA derivation depth")],
      initialState: { step: 0 }, check: state => state.step >= 2, reducedMotion: true, explanation: "PCA is a sequence: remove the mean, find high-variance directions, then represent data in that basis."
    },
    "dsa5105-cluster-gmm": {
      courseCode: "DSA5105", lessonId: "dsa5105-cluster-gmm", type: "algorithm-trace", title: "GMM / EM trace",
      learningGoal: "Follow how soft assignments and parameter updates alternate until the likelihood stabilizes.",
      sourceRefs: [lecture(1, "current scope"), textbook(435, "mixture model depth")],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "EM alternates an expectation step with a maximization step; each update is conditional on the other."
    },
    "dsa5105-rl-bellman": {
      courseCode: "DSA5105", lessonId: "dsa5105-rl-bellman", type: "event-timeline", title: "Bellman backup timeline",
      learningGoal: "Separate immediate reward from discounted continuation value in one decision step.",
      sourceRefs: [lecture(1, "current scope"), textbook(103, "return and MDP depth"), reference("DSA5105/Ref/Reinforcement_Learning_an_Introduction.pdf", "optional RL reading")],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "A Bellman backup turns a long return into local evidence plus a discounted estimate of what follows."
    },
    "dsa5105-gnn": {
      courseCode: "DSA5105", lessonId: "dsa5105-gnn", type: "pipeline-builder", title: "GNN message-passing builder",
      learningGoal: "Build one permutation-invariant graph layer from neighbor messages, aggregation, and node update.",
      sourceRefs: [lecture(1, "current scope"), reference("DSA5105/Ref/Chapter3_Graph_Neural_Networks.pdf", "optional GNN reading")],
      initialState: { step: 0 }, check: state => state.step >= 2, reducedMotion: true, explanation: "The graph layer is a pipeline: transform neighbors, aggregate the set, then combine with the node state."
    },
    "dsa5105-weighted-ols": {
      courseCode: "DSA5105", lessonId: "dsa5105-weighted-ols", type: "derivation-trace", title: "Weighted OLS derivation trace",
      learningGoal: "Make the rank assumption and row-weighting transformation explicit before using a closed form.",
      sourceRefs: [textbook(18, "basis and OLS"), textbook(24, "weighted risk"), reference("DSA5105/Ref/document.pdf", "past-exam alignment")],
      steps: [["Model", "f_w(x)=w^T phi(x)", "A nonlinear basis can still be linear in the unknown weights."], ["Normal equation", "Phi^T Phi w=Phi^T y", "Stationarity gives the equation; uniqueness needs full column rank."], ["Weights", "J(w)=1/2(Phi w-y)^T A(Phi w-y)", "Positive example weights change the geometry of the residual."], ["Solution", "w_A=(Phi^T A Phi)^-1 Phi^T A y", "The inverse is valid only when the weighted normal matrix is nonsingular."]],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "The same derivation makes it harder to confuse a formula with the assumptions that justify it."
    },
    "dsa5105-svm-dual-kkt": {
      courseCode: "DSA5105", lessonId: "dsa5105-svm-dual-kkt", type: "derivation-trace", title: "SVM KKT-to-dual trace",
      learningGoal: "Follow the path from the margin constraints to alpha balance and support vectors.",
      sourceRefs: [textbook(30, "SVM margin"), textbook(32, "KKT"), textbook(34, "dual"), reference("DSA5105/Ref/document.pdf", "assessment alignment")],
      steps: [["Primal", "min 1/2 ||w||^2 s.t. y_i(w^T x_i+b)>=1", "Normalize the separator so the closest feasible points define the margin."], ["Stationarity", "w=sum_i alpha_i y_i x_i", "The weight vector becomes a combination of training examples."], ["Bias balance", "sum_i alpha_i y_i=0", "Positive and negative multiplier mass must balance."], ["KKT", "alpha_i[y_i f(x_i)-1]=0", "Non-zero multipliers identify active margin constraints: the support vectors."]],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "Each step has a different role: geometry, stationarity, feasibility, and active constraints."
    },
    "dsa5105-trees-ensembles": {
      courseCode: "DSA5105", lessonId: "dsa5105-trees-ensembles", type: "derivation-trace", title: "Tree and ensemble reasoning trace",
      learningGoal: "Separate a local tree split from the statistical reason an ensemble can generalize better.",
      sourceRefs: [textbook(36, "trees"), textbook(41, "bagging"), textbook(43, "AdaBoost")],
      steps: [["Split", "Delta I=I(parent)-sum_c (n_c/n)I(c)", "Compare weighted child impurity with the parent."], ["Capacity", "depth up => variance up", "Depth controls the number of regions and can overfit."], ["Bagging", "f_bag(x)=1/B sum_b f_b(x)", "Averaging partially uncorrelated errors mainly reduces variance."], ["Boosting", "alpha_t=1/2 log((1-epsilon_t)/epsilon_t)", "AdaBoost gives more influence to a weak learner that is better than random and reweights its mistakes."]],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "The visual sequence keeps impurity, capacity, variance, and sequential reweighting distinct."
    },
    "dsa5105-neural-backprop": {
      courseCode: "DSA5105", lessonId: "dsa5105-neural-backprop", type: "derivation-trace", title: "Backpropagation computation graph",
      learningGoal: "Walk a scalar computation graph in reverse and see where each local derivative enters.",
      sourceRefs: [textbook(48, "gradient descent"), textbook(52, "backprop"), reference("DSA5105/Ref/document.pdf", "numerical alignment")],
      steps: [["Forward", "u=wx; h=ReLU(u); p=sigma(h)", "Store the intermediate values before differentiating."], ["Loss", "L=1/2(p-t)^2", "The loss contributes dL/dp=p-t."], ["Activation", "dL/dh=(dL/dp)sigma'(h)", "Multiply the upstream signal by the sigmoid local derivative."], ["Parameter", "dL/dw=(dL/dh)ReLU'(u)x", "The final local factors give the parameter gradient; this is efficient, not a global-optimum proof."]],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "Backprop is a reusable chain-rule procedure over a graph, not a promise about where non-convex optimization ends."
    },
    "dsa5105-pca-numerical": {
      courseCode: "DSA5105", lessonId: "dsa5105-pca-numerical", type: "derivation-trace", title: "PCA numerical pipeline",
      learningGoal: "Keep centering, eigenvectors, reconstruction, and whitening as separate operations.",
      sourceRefs: [textbook(82, "covariance"), textbook(86, "variance"), textbook(88, "reconstruction"), textbook(90, "whitening")],
      steps: [["Center", "Z=X-1 mu^T", "Remove the feature-wise mean before measuring variation."], ["Covariance", "C=1/N Z^T Z", "The symmetric covariance matrix contains the directional variance."], ["Direction", "v_1=argmax_{||v||=1} v^T C v", "The top eigenvector maximizes projected variance."], ["Scale", "X_white=Z V Lambda^{-1/2}", "Whitening rescales principal coordinates and can amplify tiny-eigenvalue noise."]],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "A correct PCA answer names the data transform, the optimization target, and the reconstruction convention."
    },
    "dsa5105-gmm-em-numerical": {
      courseCode: "DSA5105", lessonId: "dsa5105-gmm-em-numerical", type: "derivation-trace", title: "GMM responsibility and EM trace",
      learningGoal: "See the prior-weighted likelihood become a soft assignment and then a parameter update.",
      sourceRefs: [textbook(98, "GMM"), textbook(100, "responsibility"), textbook(102, "EM"), reference("DSA5105/Ref/document.pdf", "assessment alignment")],
      steps: [["Prior", "pi_k p(x|theta_k)", "Combine how common the component is with how likely it makes the point."], ["Normalize", "gamma_ik = numerator / sum_j numerator_j", "Responsibilities form a probability distribution over components."], ["Mean", "mu_k=sum_i gamma_ik x_i / sum_i gamma_ik", "Use responsibilities as soft weights in the M-step."], ["Repeat", "E-step <-> M-step", "Alternate until the likelihood change is small; initialization can affect the local optimum."]],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "The trace makes the difference between hard distance assignment and soft probabilistic responsibility visible."
    },
    "dsa5105-mdp-value-iteration": {
      courseCode: "DSA5105", lessonId: "dsa5105-mdp-value-iteration", type: "derivation-trace", title: "Value-iteration sweep trace",
      learningGoal: "Show how a future state's value propagates backward through successive Bellman backups.",
      sourceRefs: [textbook(108, "Bellman"), textbook(115, "value iteration"), textbook(117, "convergence"), reference("DSA5105/Ref/document.pdf", "assessment alignment")],
      steps: [["Initialize", "V_0(s)=0", "State the starting estimate so every sweep is auditable."], ["Candidates", "Q_t(s,a)=sum p(r+gamma V_t(s'))", "Compute one action's expected immediate plus continuation value."], ["Max", "V_{t+1}(s)=max_a Q_t(s,a)", "Choose the best action after comparing candidates."], ["Extract", "pi(s)=argmax_a Q^*(s,a)", "After convergence, convert the value fixed point into a greedy policy."]],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "The sequence separates initialization, action evaluation, maximization, and policy extraction."
    },
    "dsa5105-dynamic-programming": {
      courseCode: "DSA5105", lessonId: "dsa5105-dynamic-programming", type: "derivation-trace", title: "Dynamic-programming table trace",
      learningGoal: "Derive a recurrence from the final move and make its evaluation order and complexity explicit.",
      sourceRefs: [textbook(107, "DP recurrence"), reference("DSA5105/Ref/document.pdf", "assessment alignment")],
      steps: [["State", "dp[i]=best cost to reach i", "Define what one table entry means before writing algebra."], ["Boundary", "dp[0]=0; state initial cases", "The recurrence cannot be evaluated without base cases."], ["Recurrence", "dp[i]=cost[i]+min(dp[i-1],dp[i-2])", "Enumerate every allowed final jump."], ["Complexity", "time O(n), space O(n) or O(1)", "Each state is computed once; rolling storage is possible when only two predecessors are needed."]],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "Dynamic programming is a proof pattern: state meaning, boundary, final-choice decomposition, and complexity."
    },
    "dsa5105-graph-kernel-pagerank": {
      courseCode: "DSA5105", lessonId: "dsa5105-graph-kernel-pagerank", type: "derivation-trace", title: "Graph-kernel and PageRank trace",
      learningGoal: "Connect PSD reasoning by Gram matrices with fixed-point reasoning by power iteration.",
      sourceRefs: [textbook(25, "PSD kernels"), reference("DSA5105/Ref/Mathematics_of_Data_Science.pdf", "PageRank and graph context"), reference("DSA5105/Ref/document.pdf", "assessment alignment")],
      steps: [["Feature map", "K(G,G')=<Psi(G),Psi(G')>", "An inner product representation gives a PSD Gram matrix."], ["Parameter", "eig([[1,q],[q,1]])=1 +/- q", "Both eigenvalues non-negative gives -1 <= q <= 1."], ["Transition", "P is stochastic; repair dangling nodes", "PageRank needs a probability-preserving transition operator."], ["Power", "r_next=alpha P^T r +(1-alpha)1/n", "Damping and repeated multiplication approach the stationary ranking."]],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "The lab makes two exam proof patterns concrete: non-negative Gram quadratic forms and normalized fixed-point iteration."
    },
    "dsa5105-spectral-clustering": {
      courseCode: "DSA5105", lessonId: "dsa5105-spectral-clustering", type: "derivation-trace", title: "Spectral-clustering pipeline",
      learningGoal: "Follow adjacency, degree, Laplacian energy, eigenvectors, and final K-means assignment.",
      sourceRefs: [reference("DSA5105/Ref/Mathematics_of_Data_Science.pdf", "spectral clustering"), reference("DSA5105/Ref/document.pdf", "assessment alignment")],
      steps: [["Graph", "A -> D=diag(d_i)", "Convert edge weights into node degrees."], ["Laplacian", "L=D-A", "The matrix penalizes disagreement across connected nodes."], ["Eigenvector", "f^T L f=1/2 sum A_ij(f_i-f_j)^2", "Low-energy non-constant eigenvectors describe smooth graph partitions."], ["Cluster", "rows of U -> K-means", "Use the spectral embedding for a final assignment step."]],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "Spectral clustering is a pipeline, not a single magic eigenvector: graph, operator, embedding, assignment."
    },
    "dsa5105-ls-svm-loo": {
      courseCode: "DSA5105", lessonId: "dsa5105-ls-svm-loo", type: "derivation-trace", title: "LS-SVM and LOO trace",
      learningGoal: "Compare ridge, LS-SVM KKT blocks, and leverage-corrected leave-one-out residuals.",
      sourceRefs: [textbook(29, "kernel ridge"), reference("DSA5105/Ref/document.pdf", "LS-SVM and LOO alignment")],
      steps: [["Ridge", "(Phi^T Phi+lambda I)w=Phi^T y", "Regularization shifts the normal-matrix spectrum."], ["KKT", "[0 y^T; y K+gamma^-1 I][b;alpha]=[0;1]", "LS-SVM equality constraints produce a block linear system."], ["Hat matrix", "y_hat=Hy", "The diagonal H_ii measures self-influence or leverage."], ["LOO", "e_i^LOO=(y_i-y_hat_i)/(1-H_ii)", "Correct the in-sample residual without refitting N separate models."]],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "The same regularized-linear-algebra theme appears in three exam formats: normal equations, KKT blocks, and LOO shortcuts."
    },
    "dsa5105-linear-week1": {
      courseCode: "DSA5105", lessonId: "dsa5105-linear-week1", type: "derivation-trace", title: "Linear-model reasoning trace",
      learningGoal: "Move from a hypothesis space to an objective, a closed-form fit, and a regularized extension.",
      sourceRefs: [lecture(39, "basis model indexing"), lecture(41, "basis function examples"), lecture(46, "general OLS"), lecture(48, "regularization"), lecture(50, "one-hot classification"), lecture(51, "multiclass setup"), lecture(52, "least-squares classification"), lecture(53, "classification error and surrogate"), lecture(54, "softmax and cross-entropy"), textbook(18, "linear basis depth"), textbook(29, "regularization depth")],
      steps: [["Hypothesis", "f(x)=w_0+w_1x", "Start by naming the function class and its parameters."], ["Loss", "R_hat(w)=1/N sum_i l(f_w(x_i),y_i)", "ERM averages the observed losses; it does not directly reveal population risk."], ["OLS", "w_hat=(X^T X)^-1 X^T y", "Full column rank is the assumption behind uniqueness."], ["Ridge", "w_hat=(X^T X+lambda I)^-1 X^T y", "The penalty stabilizes directions that OLS cannot identify well."]],
      initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true, explanation: "A formula is easier to remember when the model, loss, assumption, and extension are kept as separate moves."
    },
    "dsa5105-learning-theory": {
      courseCode: "DSA5105", lessonId: "dsa5105-learning-theory", type: "decision-tree", title: "Generalization decision tree",
      learningGoal: "Choose the next evaluation move when training fit and held-out evidence disagree.",
      sourceRefs: [lecture(1, "current scope"), textbook(70, "PAC and risk"), reference("DSA5105/Ref/Understanding_Machine_Learning_From_Theory_to_Algorithms.pdf", "optional theory")],
      splits: [{ id: "memorize", label: "Training error is lowest", impurity: 92, detail: "Do not stop: this can be sample-specific fit." }, { id: "balanced", label: "Validation risk is lowest", impurity: 24, detail: "Use validation for model selection, then reserve test for the final estimate." }, { id: "ignore", label: "Test score is convenient", impurity: 86, detail: "Repeated test inspection leaks information into selection." }],
      requiredChoice: "balanced", initialState: { choice: null }, check: state => state.choice === "balanced", reducedMotion: true, explanation: "The right branch is defined by the evaluation protocol, not by whichever score is easiest to optimize."
    },
    "dsa5105-linear-regularization": {
      courseCode: "DSA5105", lessonId: "dsa5105-linear-regularization", type: "compare", title: "Regularization trade-off explorer",
      learningGoal: "Compare fit and complexity as a penalty changes the model's bias–variance trade-off.",
      sourceRefs: [lecture(1, "current scope"), textbook(29, "ridge and lasso depth")],
      initialState: { complexity: 42 }, check: state => state.complexity >= 35 && state.complexity <= 80, reducedMotion: true, explanation: "A useful penalty is selected by held-out evidence: stronger regularization can reduce variance while increasing bias."
    },
    "dsa5105-kernel-pca-cluster": {
      courseCode: "DSA5105", lessonId: "dsa5105-kernel-pca-cluster", type: "concept-map", title: "Unsupervised-method concept map",
      learningGoal: "Choose among kernel geometry, PCA compression, K-means grouping, and GMM uncertainty by the question being asked.",
      sourceRefs: [lecture(1, "current scope"), textbook(82, "PCA depth"), textbook(98, "GMM depth")],
      nodes: [{ id: "kernel", label: "Kernel", detail: "Compare implicit feature-space geometry." }, { id: "pca", label: "PCA", detail: "Compress while preserving variance." }, { id: "kmeans", label: "K-means", detail: "Assign each point to one nearest centroid." }, { id: "gmm", label: "GMM", detail: "Return soft posterior responsibilities." }],
      edges: [["kernel", "pca"], ["pca", "kmeans"], ["kmeans", "gmm"]], requiredChoice: "gmm", initialState: { choice: null }, check: state => state.choice === "gmm", reducedMotion: true, explanation: "The map is a method-selection exercise: output and objective matter more than memorizing algorithm names."
    },
    "dsa5105-rl-gnn": {
      courseCode: "DSA5105", lessonId: "dsa5105-rl-gnn", type: "concept-map", title: "RL and GNN information-flow map",
      learningGoal: "Distinguish value propagation over transitions from representation propagation over graph neighbors.",
      sourceRefs: [lecture(1, "current scope"), reference("DSA5105/Ref/Chapter3_Graph_Neural_Networks.pdf", "optional GNN reading")],
      nodes: [{ id: "state", label: "State", detail: "The current decision context." }, { id: "bellman", label: "Bellman", detail: "Back up reward plus discounted continuation value." }, { id: "message", label: "Message", detail: "Transform a neighbor representation." }, { id: "aggregate", label: "Aggregate", detail: "Combine the neighbor set invariantly." }, { id: "update", label: "Update", detail: "Mix the aggregate with the node state." }],
      edges: [["state", "bellman"], ["message", "aggregate"], ["aggregate", "update"]], requiredChoice: "aggregate", initialState: { choice: null }, check: state => state.choice === "aggregate", reducedMotion: true, explanation: "Both systems move information locally, but RL follows possible transitions while a GNN follows observed edges."
    }
  };

  const week1Derivations = window.NUS_VISUAL_LABS["dsa5105-week1-derivations"];
  const derivationById = new Map((week1Derivations.exercises || []).map(item => [item.id, item]));
  derivationById.get("huber").sourceLens = lens("core Week-1 derivation", "Lecture gives the robust-loss definition and motivation; Exercise 1 tests derivative, stationarity, and bounded score contribution.", [lecture(35, "loss definition and motivation"), lecture(36, "Huber comparison")], [exercise(1, "Exercise 1 · derivative + stationarity")]);
  derivationById.get("ridge").sourceLens = lens("core Week-1 derivation", "Lecture p48 introduces regularization; Exercise 2 requires the closed form and eigen analysis. The spectral factor is exercise depth attached to a lecture-core concept.", [lecture(48, "regularization"), lecture(49, "generalization trade-off")], [exercise(2, "Exercise 2 · closed form + eigen analysis")], [textbook(29, "regularization depth")]);
  derivationById.get("logistic").sourceLens = lens("core Week-1 derivation", "Lecture introduces softmax and cross-entropy; the official solutions complete the binary reduction and convexity proof.", [lecture(54, "softmax and cross-entropy")], [exercise(2, "Exercise 2 · binary setup"), exercise(3, "Exercise 2 · second derivative")]);
})();

(function () {
  "use strict";
  const lecture = (sourceId, page, role) => ({ sourceId, page, sourceType: "lecture", role, status: "current" });
  const textbook = (page, role) => ({ sourceId: "DSA5208/Distributed Systems textbook pointer", page, sourceType: "textbook", role, status: "course-depth" });
  const reference = role => ({ sourceId: "L. Lamport, Time, Clocks, and the Ordering of Events in a Distributed System", page: 1, sourceType: "ref", role, status: "optional" });
  const lens = (why, lectureRefs, textbookRefs = [], referenceRefs = []) => ({ status: "core DSA5208", whyExaminable: why, lecture: lectureRefs, officialExercise: [], textbook: textbookRefs, reference: referenceRefs });
  const add = (id, lab) => { window.NUS_VISUAL_LABS[id] = lab; };

  add("dsa5208-orientation", {
    courseCode: "DSA5208", lessonId: "dsa5208-orientation", type: "concept-map", title: "Distributed experiment evidence map",
    learningGoal: "Connect a distributed claim to its system conditions and measurements.",
    sourceRefs: [lecture("DSA5208/Lec0.pdf", 9, "distributed-system challenges"), lecture("DSA5208/Lec0.pdf", 16, "project themes")],
    sourceLens: lens("The overview turns scale, failure, communication, and coordination into the evidence vocabulary for later project work.", [lecture("DSA5208/Lec0.pdf", 9, "distributed-system challenges"), lecture("DSA5208/Lec0.pdf", 16, "project themes")], [textbook(1, "distributed-system overview")]),
    nodes: [{ id: "claim", label: "Claim", detail: "What the system is supposed to achieve." }, { id: "setting", label: "System setting", detail: "Workers, partitions, network, and failures." }, { id: "metric", label: "Metric", detail: "Latency, throughput, shuffle, or recovery." }, { id: "evidence", label: "Evidence", detail: "Observed result and reproducible conditions." }],
    edges: [["claim", "setting"], ["setting", "metric"], ["metric", "evidence"]], requiredChoice: "evidence", initialState: { choice: null }, check: state => state.choice === "evidence", reducedMotion: true,
    explanation: "A distributed experiment is a chain from claim to setting to metric to evidence; the final result is not meaningful without the earlier context."
  });
  add("dsa5208-distributed-models", {
    courseCode: "DSA5208", lessonId: "dsa5208-distributed-models", type: "concept-map", title: "Process and event-history map",
    learningGoal: "Separate processes, local histories, messages, and the global event set.",
    sourceRefs: [lecture("DSA5208/Lec1.pdf", 3, "distributed-system definition"), lecture("DSA5208/Lec1.pdf", 4, "event notation")],
    sourceLens: lens("The process/event model is the assumption boundary for every causal-ordering derivation.", [lecture("DSA5208/Lec1.pdf", 3, "distributed-system definition"), lecture("DSA5208/Lec1.pdf", 4, "event notation")], [textbook(8, "system models")]),
    nodes: [{ id: "process", label: "Process", detail: "An independent entity with local state." }, { id: "history", label: "Local history", detail: "Events produced by one process." }, { id: "message", label: "Message edge", detail: "Information crossing process boundaries." }, { id: "events", label: "Global event set", detail: "The union of all local histories." }],
    edges: [["process", "history"], ["history", "events"], ["message", "events"]], requiredChoice: "events", initialState: { choice: null }, check: state => state.choice === "events", reducedMotion: true,
    explanation: "The map keeps local state and cross-process communication distinct before causal edges are derived."
  });
  add("dsa5208-happens-before", {
    courseCode: "DSA5208", lessonId: "dsa5208-happens-before", type: "decision-tree", title: "Causal-edge checker",
    learningGoal: "Choose the rule that justifies a proposed happens-before edge.",
    sourceRefs: [lecture("DSA5208/Lec1.pdf", 5, "causal precedence"), lecture("DSA5208/Lec1.pdf", 6, "concurrency")],
    sourceLens: lens("Happens-before is the formal bridge from a message-passing diagram to clocks and delivery guarantees.", [lecture("DSA5208/Lec1.pdf", 5, "causal precedence"), lecture("DSA5208/Lec1.pdf", 6, "concurrency")], [textbook(18, "causal order")], [reference("happens-before relation")]),
    splits: [{ id: "local", label: "Same process", impurity: 12, detail: "Use local event order." }, { id: "message", label: "Send to receive", impurity: 18, detail: "Use message send-before-receive." }, { id: "chain", label: "Causal chain", impurity: 22, detail: "Use transitive closure." }, { id: "none", label: "No edge", impurity: 70, detail: "Check the reverse direction before calling events concurrent." }],
    requiredChoice: "chain", initialState: { choice: null }, check: state => state.choice === "chain", reducedMotion: true,
    explanation: "The checker forces the learner to justify an edge with a model rule rather than visual intuition."
  });
  add("dsa5208-communication-ordering", {
    courseCode: "DSA5208", lessonId: "dsa5208-communication-ordering", type: "compare", title: "Delivery-guarantee explorer",
    learningGoal: "Choose the weakest delivery guarantee that preserves an application invariant.",
    sourceRefs: [lecture("DSA5208/Lec1.pdf", 7, "non-FIFO model"), lecture("DSA5208/Lec1.pdf", 8, "FIFO model"), lecture("DSA5208/Lec1.pdf", 9, "causal ordering")],
    sourceLens: lens("Delivery guarantees are a compact distinction between channel-local order and system-wide causal order.", [lecture("DSA5208/Lec1.pdf", 7, "non-FIFO model"), lecture("DSA5208/Lec1.pdf", 8, "FIFO model"), lecture("DSA5208/Lec1.pdf", 9, "causal ordering")], [textbook(32, "message delivery guarantees")]),
    initialState: { value: 55 }, check: state => state.value >= 35 && state.value <= 80, reducedMotion: true,
    explanation: "Move toward stronger guarantees only when the application invariant needs more than arbitrary or per-channel delivery order."
  });
  add("dsa5208-physical-clocks", {
    courseCode: "DSA5208", lessonId: "dsa5208-physical-clocks", type: "derivation-trace", title: "NTP delay trace",
    learningGoal: "Trace the four timestamps into a delay estimate and state its assumptions.",
    sourceRefs: [lecture("DSA5208/Lec1.pdf", 13, "physical clocks"), lecture("DSA5208/Lec1.pdf", 14, "NTP")],
    sourceLens: lens("NTP is a concrete calculation checkpoint and a clean contrast with causal logical time.", [lecture("DSA5208/Lec1.pdf", 13, "physical clocks"), lecture("DSA5208/Lec1.pdf", 14, "NTP")], [textbook(48, "clock synchronization")]),
    steps: [["Inputs", "T1, T2, T3, T4", "Identify client and server send/receive timestamps."], ["Elapsed intervals", "Client minus server", "Compare the two observed durations."], ["Delay", "Round-trip estimate", "Compute the network-delay estimate."], ["Interpret", "Uncertainty", "State drift and delay-symmetry assumptions."]],
    initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true,
    explanation: "The trace separates arithmetic from the assumptions needed to interpret an NTP estimate."
  });
  add("dsa5208-lamport-scalar", {
    courseCode: "DSA5208", lessonId: "dsa5208-lamport-scalar", type: "derivation-trace", title: "Lamport scalar trace",
    learningGoal: "Apply local, send, and receive updates in the correct order.",
    sourceRefs: [lecture("DSA5208/Lec1.pdf", 17, "Lamport scalar rules"), lecture("DSA5208/Lec1.pdf", 19, "scalar properties")],
    sourceLens: lens("Scalar clocks are a core derivation because every later ordering claim depends on the receive max-and-increment rule.", [lecture("DSA5208/Lec1.pdf", 17, "Lamport scalar rules"), lecture("DSA5208/Lec1.pdf", 19, "scalar properties")], [textbook(55, "Lamport clocks")], [reference("scalar logical clocks")]),
    steps: [["Local event", "Increment", "Advance before a send or internal event."], ["Message", "Piggyback", "Attach the updated scalar value."], ["Receive", "Take maximum", "Merge local and message history."], ["Deliver", "Increment then deliver", "Place the receive event strictly after both histories."]],
    initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true,
    explanation: "The trace makes the one-way causal guarantee and the receive-event ordering visible."
  });
  add("dsa5208-vector-clocks", {
    courseCode: "DSA5208", lessonId: "dsa5208-vector-clocks", type: "derivation-trace", title: "Vector comparison trace",
    learningGoal: "Compare every component and identify causal order versus concurrency.",
    sourceRefs: [lecture("DSA5208/Lec1.pdf", 20, "vector-clock rules"), lecture("DSA5208/Lec1.pdf", 22, "vector comparison"), lecture("DSA5208/Lec1.pdf", 23, "vector properties")],
    sourceLens: lens("Vector clocks extend scalar time with enough process-specific state to recover concurrency.", [lecture("DSA5208/Lec1.pdf", 20, "vector-clock rules"), lecture("DSA5208/Lec1.pdf", 22, "vector comparison"), lecture("DSA5208/Lec1.pdf", 23, "vector properties")], [textbook(62, "vector clocks")], [reference("vector-clock causality")]),
    steps: [["Own event", "Increment one component", "Advance the local process component."], ["Receive", "Componentwise maximum", "Merge every known process history."], ["Compare", "All components", "Check no component is larger and one is strictly smaller."], ["Classify", "Ordered or concurrent", "Incomparability means concurrency."]],
    initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true,
    explanation: "The learner must use componentwise comparison rather than a scalar or lexicographic shortcut."
  });
  add("dsa5208-compressed-timestamps", {
    courseCode: "DSA5208", lessonId: "dsa5208-compressed-timestamps", type: "compare", title: "Timestamp-storage explorer",
    learningGoal: "Compare full vectors, receiver-specific deltas, and differential metadata state.",
    sourceRefs: [lecture("DSA5208/Lec1.pdf", 24, "compressed timestamp idea"), lecture("DSA5208/Lec1.pdf", 27, "storage overhead"), lecture("DSA5208/Lec1.pdf", 29, "differential technique")],
    sourceLens: lens("This lab turns a complexity statement into a design trade-off: preserve causal knowledge while reducing repeated metadata.", [lecture("DSA5208/Lec1.pdf", 24, "compressed timestamp idea"), lecture("DSA5208/Lec1.pdf", 27, "storage overhead"), lecture("DSA5208/Lec1.pdf", 29, "differential technique")], [textbook(70, "metadata compression")]),
    initialState: { value: 55 }, check: state => state.value >= 35 && state.value <= 80, reducedMotion: true,
    explanation: "More compression can reduce communication and storage, but it requires carefully maintained receiver-specific state."
  });
  add("dsa5208-consistency-spark", {
    courseCode: "DSA5208", lessonId: "dsa5208-consistency-spark", type: "pipeline-builder", title: "Roadmap-to-measurement builder",
    learningGoal: "Connect a later-course topic to a concrete distributed measurement without overstating source coverage.",
    sourceRefs: [lecture("DSA5208/Lec0.pdf", 12, "course topic map"), lecture("DSA5208/Lec0.pdf", 14, "Spark and distributed algorithms")],
    sourceLens: lens("The supplied overview gives a roadmap; the lab turns that roadmap into a request for evidence while keeping later lecture depth marked pending.", [lecture("DSA5208/Lec0.pdf", 12, "course topic map"), lecture("DSA5208/Lec0.pdf", 14, "Spark and distributed algorithms")], [textbook(90, "distributed data processing")]),
    steps: [["Topic", "Consistency or Spark", "Choose the later-course question."], ["Operation", "Join or group", "Name the logical operation that may move data."], ["Metric", "Shuffle or stale-read evidence", "Choose a measurable signal."], ["Boundary", "Pending source", "Keep the claim provisional until the detailed lecture is supplied."]],
    initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true,
    explanation: "The builder makes source fidelity part of the learning experience: a roadmap is useful, but it is not a fabricated derivation."
  });
})();

(function () {
  "use strict";
  const lecture = (page, role) => ({ sourceId: "DSA5104/chapter1.pdf", page, sourceType: "lecture", role, status: "current" });
  const exercise = (sourceId, role) => ({ sourceId, page: 1, sourceType: "exercise", role, status: "current-context" });
  const textbook = (page, role) => ({ sourceId: "DSA5104/Database System Concepts, 7th edition", page, sourceType: "textbook", role, status: "course-depth" });
  const lens = (why, lectureRefs, exerciseRefs = [], textbookRefs = []) => ({ status: "core DSA5104", whyExaminable: why, lecture: lectureRefs, officialExercise: exerciseRefs, textbook: textbookRefs, reference: [] });
  window.NUS_VISUAL_LABS = window.NUS_VISUAL_LABS || {};
  window.NUS_VISUAL_LABS["dsa5104-orientation"] = {
    courseCode: "DSA5104", lessonId: "dsa5104-orientation", type: "concept-map", title: "Data-abstraction map",
    learningGoal: "Choose the correct abstraction level before explaining a database result.",
    sourceRefs: [lecture(18, "abstraction levels"), lecture(22, "schema and instance")],
    sourceLens: lens("The lecture uses abstraction and schema/instance distinctions as the foundation for every later database decision.", [lecture(18, "abstraction levels"), lecture(22, "schema and instance")], [], [textbook(12, "data abstraction")]),
    nodes: [{ id: "physical", label: "Physical", detail: "How bytes and blocks are stored." }, { id: "logical", label: "Logical", detail: "What data and relationships exist." }, { id: "view", label: "View", detail: "What one application is allowed to see." }, { id: "instance", label: "Instance", detail: "The current contents at one moment." }],
    edges: [["physical", "logical"], ["logical", "view"], ["logical", "instance"]], requiredChoice: "view", initialState: { choice: null }, check: state => state.choice === "view", reducedMotion: true,
    explanation: "The map separates levels of abstraction from the schema/instance distinction so the terms do not collapse into one vague idea."
  };
  window.NUS_VISUAL_LABS["dsa5104-relational-model"] = {
    courseCode: "DSA5104", lessonId: "dsa5104-relational-model", type: "concept-map", title: "Keys and integrity map",
    learningGoal: "Trace identity from a primary key to a referenced foreign key.",
    sourceRefs: [lecture(14, "relational model"), lecture(25, "integrity constraints"), exercise("DSA5104/Homework Solutions/Ch06_Database_Design_Using_the_ER_Model/6.10.md", "foreign-key constraints")],
    sourceLens: lens("Key and constraint questions recur in relational, ER, SQL DDL, and normalization exercises.", [lecture(14, "relational model"), lecture(25, "integrity constraints")], [exercise("DSA5104/Homework Solutions/Ch06_Database_Design_Using_the_ER_Model/6.10.md", "foreign-key constraints")], [textbook(70, "Integrity constraints")]),
    nodes: [{ id: "candidate", label: "Candidate key", detail: "A minimal unique identity." }, { id: "primary", label: "Primary key", detail: "The chosen identity constraint." }, { id: "foreign", label: "Foreign key", detail: "A reference to another relation's key." }, { id: "integrity", label: "Integrity", detail: "Reject impossible references." }],
    edges: [["candidate", "primary"], ["primary", "foreign"], ["foreign", "integrity"]], requiredChoice: "foreign", initialState: { choice: null }, check: state => state.choice === "foreign", reducedMotion: true,
    explanation: "Follow the identity boundary: the primary key identifies locally, and the foreign key carries that identity across a relationship."
  };
  window.NUS_VISUAL_LABS["dsa5104-database-design"] = {
    courseCode: "DSA5104", lessonId: "dsa5104-database-design", type: "decision-tree", title: "ER-to-relational design studio",
    learningGoal: "Choose the relation structure that preserves multiplicity and constraints.",
    sourceRefs: [lecture(33, "database design"), exercise("DSA5104/Homework Solutions/Ch06_Database_Design_Using_the_ER_Model/6.23.md", "ER design exercise")],
    sourceLens: lens("The lecture supplies the logical/physical distinction; ER homework checks whether the design preserves identity and relationship multiplicity.", [lecture(33, "database design")], [exercise("DSA5104/Homework Solutions/Ch06_Database_Design_Using_the_ER_Model/6.23.md", "ER design exercise")], [textbook(350, "Database design")]),
    splits: [{ id: "one-many", label: "One-to-many", impurity: 15, detail: "Put the referenced key on the many-side relation." }, { id: "many-many", label: "Many-to-many", impurity: 22, detail: "Create a relationship relation with both keys." }, { id: "physical", label: "Storage choice", impurity: 70, detail: "Do not choose indexes before the logical meaning is clear." }],
    requiredChoice: "many-many", initialState: { choice: null }, check: state => state.choice === "many-many", reducedMotion: true,
    explanation: "The first design move is determined by cardinality and identity; storage optimization comes after the logical schema."
  };
  window.NUS_VISUAL_LABS["dsa5104-sql-foundations"] = {
    courseCode: "DSA5104", lessonId: "dsa5104-sql-foundations", type: "derivation-trace", title: "SQL semantics trace",
    learningGoal: "Follow rows from source tables through joins, grouping, and aggregate filtering.",
    sourceRefs: [lecture(28, "DML"), lecture(30, "SQL query language"), exercise("DSA5104/Homework Solutions/Ch03_Introduction_to_SQL/3.2.md", "SQL query practice")],
    sourceLens: lens("WHERE/HAVING and key-based joins are compact distinctions that transfer directly to SQL homework and closed-book exam answers.", [lecture(28, "DML"), lecture(30, "SQL query language")], [exercise("DSA5104/Homework Solutions/Ch03_Introduction_to_SQL/3.2.md", "SQL query practice")], [textbook(95, "SQL")]),
    steps: [["Rows", "FROM and JOIN", "Build the input relation through key-based joins."], ["Filter", "WHERE", "Remove rows before grouping."], ["Groups", "GROUP BY", "Partition the remaining rows by the requested identity."], ["Aggregate filter", "HAVING", "Keep groups whose aggregate satisfies the condition."]],
    initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true,
    explanation: "The trace makes the semantic boundary visible: WHERE sees rows, while HAVING sees completed groups."
  };
  window.NUS_VISUAL_LABS["dsa5104-query-processing"] = {
    courseCode: "DSA5104", lessonId: "dsa5104-query-processing", type: "derivation-trace", title: "Query processor pipeline",
    learningGoal: "Separate declarative semantics from physical execution strategy.",
    sourceRefs: [lecture(39, "query processor"), lecture(40, "query processing"), lecture(38, "indexes")],
    sourceLens: lens("The pipeline is the bridge from SQL syntax to cost reasoning: parse the request, choose the plan, then evaluate it.", [lecture(39, "query processor"), lecture(40, "query processing")], [], [textbook(220, "Query processing")]),
    steps: [["Input", "SQL query", "The user declares the desired relation."], ["Translate", "Internal representation", "The processor parses and translates the statement."], ["Optimize", "Candidate plans", "Use statistics and access paths to choose a low-cost plan."], ["Evaluate", "Result relation", "Execute the chosen plan without changing logical semantics."]],
    initialState: { step: 0 }, check: state => state.step >= 3, reducedMotion: true,
    explanation: "A plan can change while the logical answer stays fixed; that is the key distinction between semantics and performance."
  };
  window.NUS_VISUAL_LABS["dsa5104-transactions-architecture"] = {
    courseCode: "DSA5104", lessonId: "dsa5104-transactions-architecture", type: "concept-map", title: "Transaction safety map",
    learningGoal: "Match a database failure mode to the manager or guarantee that addresses it.",
    sourceRefs: [lecture(41, "transaction management"), lecture(42, "database architecture")],
    sourceLens: lens("Transaction and architecture questions test which system boundary protects consistency, failure recovery, and scale.", [lecture(41, "transaction management"), lecture(42, "database architecture")], [], [textbook(370, "Transactions")]),
    nodes: [{ id: "atomicity", label: "Atomicity", detail: "All-or-nothing logical function." }, { id: "concurrency", label: "Concurrency", detail: "Coordinate simultaneous transactions." }, { id: "placement", label: "Placement", detail: "Where data and computation live." }, { id: "network", label: "Network", detail: "Communication cost in distributed systems." }],
    edges: [["atomicity", "concurrency"], ["placement", "network"]], requiredChoice: "atomicity", initialState: { choice: null }, check: state => state.choice === "atomicity", reducedMotion: true,
    explanation: "The map keeps transaction semantics separate from deployment architecture while showing how both affect system behavior."
  };
  window.NUS_VISUAL_LABS["dsa5104-semi-structured"] = {
    courseCode: "DSA5104", lessonId: "dsa5104-semi-structured", type: "compare", title: "Schema flexibility explorer",
    learningGoal: "Choose a representation by weighing nesting, validation timing, and execution cost.",
    sourceRefs: [lecture(13, "data-model categories"), lecture(16, "XML and JSON"), lecture(50, "big-data analysis beyond SQL")],
    sourceLens: lens("The lecture introduces a representation trade-off; the lab makes the downstream validation and movement costs explicit.", [lecture(13, "data-model categories"), lecture(16, "XML and JSON")], [], [textbook(1020, "Semi-structured data")]),
    initialState: { flexibility: 55 }, check: state => state.flexibility >= 35 && state.flexibility <= 80, reducedMotion: true,
    explanation: "More ingestion flexibility can be useful for nested data, but it shifts agreement and validation work toward query time."
  };
})();
