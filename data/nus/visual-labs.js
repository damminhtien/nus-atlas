(function () {
  "use strict";
  const lecture = (page, role) => ({ sourceId: "DSA5105/Lec1_annotated.pdf", page, sourceType: "lecture", role, status: "current" });
  const exercise = (page, role) => ({ sourceId: "DSA5105/Lec1_exercises-solutions.pdf", page, sourceType: "exercise", role, status: "current-context" });
  const textbook = (page, role) => ({ sourceId: "DSA5105/Textbook.pdf", page, sourceType: "textbook", role, status: "course-depth" });
  const reference = (sourceId, role) => ({ sourceId, page: 1, sourceType: "ref", role, status: "optional" });
  const lens = (status, whyExaminable, lectureRefs, exerciseRefs, textbookRefs, referenceRefs) => ({ status, whyExaminable, lecture: lectureRefs || [], officialExercise: exerciseRefs || [], textbook: textbookRefs || [], reference: referenceRefs || [] });
  window.NUS_VISUAL_LABS = {
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
