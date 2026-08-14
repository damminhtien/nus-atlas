(function () {
  "use strict";
  const source = (sourceId, page, sourceType, role, status) => ({
    sourceId,
    page,
    sourceType,
    ...(role ? { role } : {}),
    ...(status ? { status } : {})
  });
  const lecture = (sourceId, page, role) => source(sourceId, page, "lecture", role || "lecture core", "current");
  const textbook = (page, role) => source("DSA5105/Textbook.pdf", page, "textbook", role || "textbook depth", "course-depth");
  const reference = (sourceId, page, role, status) => source(sourceId, page, "ref", role || "optional reading", status || "optional");
  const note = (title, body, sourceType, formula) => ({ title, body, sourceType, ...(formula ? { formula } : {}) });
  const worked = (title, steps, answer, sourceType) => ({ title, steps, answer, sourceType });

  window.NUS_CONTENT.DSA5105 = {
    modules: [
      { id: "dsa5105-foundations", title: "Foundations", lessons: [
        {
          id: "dsa5105-erm", title: "ERM, loss, and generalization", week: 1, minutes: 50,
          summary: "Frame supervised learning as empirical risk minimization and ask what controls the train–test gap.",
          objectives: ["Write the ERM objective", "Distinguish underfitting from overfitting", "Choose a validation strategy"],
          sourceRefs: [lecture("DSA5105/syllabus.pdf", 1, "current assessment and scope"), lecture("DSA5105/Lec1.pdf", 10, "supervised-learning framing")],
          visualIds: ["dsa5105-ordinal-nominal"],
          sections: [
            note("Lecture core · What is being learned?", "A supervised-learning problem gives us examples (xᵢ, yᵢ), a hypothesis class H, and a loss ℓ(h(x), y). Training chooses one hypothesis from H. Before fitting, write down what the input is, what the target means, and which mistakes the loss penalizes.", "lecture", "ĥ = arg minₕ∈H R̂(h)"),
            note("Lecture core · Empirical risk", "Empirical risk is the average loss on the examples we actually observed. It is a training measurement, not a guarantee about future data. A regularizer can be added when we want to prefer simpler or smoother hypotheses.", "lecture", "R̂(h) = (1/n) Σᵢ ℓ(h(xᵢ), yᵢ)"),
            note("Lecture core · Train, validation, test", "Use the training split to fit parameters, the validation split to choose settings such as λ or model size, and the test split once for an honest final estimate. Reusing the test set for decisions quietly turns it into another validation set. Feature type matters too: ordinal values have meaningful order; nominal labels do not.", "lecture"),
            note("Textbook depth · Why the gap appears", "A flexible hypothesis class can memorize sample-specific noise. That makes empirical risk small while population risk stays large. Generalization is the discipline of asking whether the pattern survives outside the observed sample; the lecture core is the vocabulary, while the textbook supplies the formal risk view.", "textbook")
          ],
          examples: [worked("Worked example: choose the right measurement", ["Suppose a classifier makes 2 errors on a training sample of 10 points. Its empirical 0–1 risk is 2/10 = 0.2.", "A second model makes 0 training errors but has enough flexibility to memorize IDs. Training risk prefers the second model, but validation risk may prefer the first.", "The decision is not 'lowest training error wins'; it is 'choose using validation evidence, then report test performance once.'"], "The train–validation–test split separates fitting, model selection, and final evaluation.", "lecture")],
          questions: [
            { id: "dsa5105-e-q1", type: "mcq", prompt: "Which term is explicitly part of the current syllabus assessment?", choices: ["Three after-class quizzes", "Weekly lab attendance", "A final project only", "An oral defense"], answer: 0, explanation: "The current syllabus lists three after-class quizzes worth 10% each.", sourceRefs: [lecture("DSA5105/syllabus.pdf", 1, "assessment")] },
            { id: "dsa5105-e-q2", type: "derivation", prompt: "Write the empirical risk minimization objective in words.", accepted: ["minimize average loss over training examples", "minimize empirical risk", "minimize the average training loss"], solution: "Choose a hypothesis that minimizes the average loss over the training examples, optionally with a regularizer.", explanation: "The essential phrase is average loss on the observed sample.", sourceRefs: [lecture("DSA5105/Lec1.pdf", 10, "ERM framing")] }
          ]
        },
        {
          id: "dsa5105-learning-theory", title: "Generalization and PAC intuition", week: 2, minutes: 55,
          summary: "Use population risk, empirical risk, and PAC language to explain why a low training error is not enough.",
          objectives: ["Separate empirical and population risk", "Explain the generalization gap", "Read PAC as an accuracy-confidence statement"],
          sourceRefs: [lecture("DSA5105/Lec1.pdf", 10, "lecture core"), textbook(70, "PAC setup and risk definitions"), reference("DSA5105/Ref/Understanding_Machine_Learning_From_Theory_to_Algorithms.pdf", 45, "agnostic PAC depth")],
          sections: [
            note("Lecture core · Generalization gap", "The lecture distinction is simple but essential: empirical risk measures observed examples, while population risk measures the distribution of future examples. A low training error is evidence about the sample; it becomes evidence about the population only under assumptions about sampling, model capacity, and stability.", "lecture", "generalization gap = population risk − empirical risk"),
            note("Textbook depth · PAC language", "A PAC-style statement says that, with high probability over the training sample, the learned hypothesis has population error at most ε. ε controls the allowed error and δ controls the probability that the guarantee fails. Therefore the confidence level is 1 − δ; never swap the roles of ε and δ.", "textbook", "P[R(ĥ) ≤ ε] ≥ 1 − δ"),
            note("Lecture core · What breaks the estimate?", "The basic train–test story assumes the examples are independent and identically distributed. Duplicates, leakage, time drift, and distribution shift can make a validation score look precise while answering the wrong question. Always state the evaluation population before trusting a number.", "lecture"),
            note("Reference boundary · Optional theory", "The learning-theory reference develops agnostic PAC and sample-complexity results beyond the current short lesson. Use it to understand why capacity and sample size affect confidence, but keep the current lecture syllabus as the exam boundary.", "ref")
          ],
          examples: [worked("Worked example: read a PAC statement", ["Suppose a statement uses ε = 0.05 and δ = 0.10. The allowed population error is 5%.", "The failure probability is 10%, so the confidence is 1 − δ = 0.90, or 90%.", "The statement does not say that 90% of future predictions are correct on every run; it describes the probability of the guarantee over sampled training sets."], "Translate ε as accuracy/error tolerance and δ as the probability the guarantee fails.", "textbook")],
          questions: [
            { id: "dsa5105-lt-q1", type: "mcq", prompt: "Why can ERM achieve low training error but still generalize poorly?", choices: ["The optimizer always increases bias", "The hypothesis class can fit sample-specific noise", "Population risk is always zero", "Validation data is part of the training loss"], answer: 1, explanation: "A flexible hypothesis class can memorize the sample, making empirical risk look good while population risk remains high.", sourceRefs: [lecture("DSA5105/Lec1.pdf", 10, "generalization gap")] },
            { id: "dsa5105-lt-q2", type: "short", prompt: "In a PAC statement, what do ε and δ control?", accepted: ["epsilon controls error and delta controls failure probability", "epsilon accuracy delta confidence", "allowed risk and probability of failure"], solution: "ε bounds the allowed population error; δ is the probability that the guarantee fails, so confidence is 1 − δ.", explanation: "Do not swap the roles of accuracy and confidence.", sourceRefs: [textbook(70, "PAC definition")] },
            { id: "dsa5105-lt-q3", type: "short", prompt: "What extra assumption makes a train–test estimate meaningful in the basic setup?", accepted: ["iid samples from the same distribution", "independent identically distributed", "training and test drawn from the same distribution"], solution: "The basic setup assumes independent, identically distributed examples from the same underlying distribution.", explanation: "Distribution shift breaks the simplest interpretation of the generalization gap.", sourceRefs: [reference("DSA5105/Ref/Understanding_Machine_Learning_From_Theory_to_Algorithms.pdf", 45, "agnostic PAC context")] }
          ]
        }
      ]},
      { id: "dsa5105-linear", title: "Linear and kernel methods", lessons: [
        {
          id: "dsa5105-linear-regularization", title: "OLS, ridge, and lasso", week: 3, minutes: 55,
          summary: "Compare least squares with L2 and L1 penalties and understand how regularization changes the solution.",
          objectives: ["State the OLS objective", "Explain ridge shrinkage", "Explain lasso sparsity"],
          sourceRefs: [lecture("DSA5105/Lec1.pdf", 24, "linear models"), lecture("DSA5105/Exe1_with_solutions.pdf", 2, "worked regularization exercise")],
          visualIds: [],
          sections: [
            note("Lecture core · OLS baseline", "Ordinary least squares chooses weights that minimize squared residuals. It is a useful baseline because the objective is explicit, but correlated features can make the fitted weights unstable and high-dimensional models can fit noise.", "lecture", "ŵ = arg min_w ||Xw − y||²"),
            note("Lecture core · Ridge and lasso", "Ridge adds an L2 penalty, shrinking weights toward zero while usually keeping correlated predictors together. Lasso adds an L1 penalty, whose corners make exact zeros possible. Both trade a little bias for lower variance when the unregularized fit is too sensitive.", "lecture", "ridge: ||Xw − y||² + λ||w||₂²   ·   lasso: ||Xw − y||² + λ||w||₁"),
            note("Textbook depth · Choose λ with validation", "λ is not chosen by looking at the test score repeatedly. Fit a grid of λ values on the training data, select the value with the best validation behavior, refit if appropriate, and use the test set only for the final report. Standardize features when penalty scale should be comparable.", "textbook")
          ],
          examples: [worked("Worked example: why lasso can remove a feature", ["Start with two standardized features whose residual correlations are similar.", "The L1 constraint has corners on the coordinate axes. The optimum can land on a corner, which means one coefficient is exactly zero.", "The L2 constraint is rounder, so it usually shrinks both coefficients without selecting one exactly."], "Lasso supports sparse feature selection; ridge supports stable shrinkage without the same exact-zero behavior.", "lecture")],
          questions: [
            { id: "dsa5105-lr-q1", type: "mcq", prompt: "Which penalty most directly encourages exact zero coefficients?", choices: ["L2 / ridge", "L1 / lasso", "No penalty", "A larger batch size"], answer: 1, explanation: "The L1 geometry creates corners that make sparse solutions possible.", sourceRefs: [lecture("DSA5105/Lec1.pdf", 24, "regularization")] },
            { id: "dsa5105-lr-q2", type: "short", prompt: "What is the key bias–variance effect of increasing regularization?", accepted: ["higher bias lower variance", "bias increases variance decreases", "it increases bias and reduces variance"], solution: "Stronger regularization usually increases bias while reducing variance and sensitivity to noise.", explanation: "The useful answer states both directions and notes the tradeoff.", sourceRefs: [lecture("DSA5105/Exe1_with_solutions.pdf", 2, "regularization tradeoff")] }
          ]
        },
        {
          id: "dsa5105-svm-margin", title: "SVM margins and support vectors", week: 5, minutes: 60,
          summary: "Derive the geometric margin, connect it to the hard-margin objective, and explain support vectors and hinge loss.",
          objectives: ["Compute a separating-hyperplane margin", "State the hard-margin primal", "Explain soft-margin support vectors"],
          sourceRefs: [textbook(31, "linear SVM geometry"), textbook(35, "dual and support vectors"), textbook(36, "soft margin and hinge loss")],
          visualIds: [],
          sections: [
            note("Textbook depth · Geometry first", "For f(x) = wᵀx + b, the distance from x to the separating hyperplane is |wᵀx + b| / ||w||. Scaling w and b changes the score but not the boundary, so the optimization needs a scale convention before 'largest margin' has a precise meaning.", "textbook", "signed margin = y(wᵀx + b) / ||w||"),
            note("Textbook depth · Hard margin", "With labels in {−1, +1}, require yᵢ(wᵀxᵢ + b) ≥ 1. The closest feasible points then have geometric margin 1/||w||, so maximizing margin is equivalent to minimizing ||w||²/2 under the constraints.", "textbook", "minimize ½||w||² subject to yᵢ(wᵀxᵢ + b) ≥ 1"),
            note("Textbook depth · Support vectors and slack", "Support vectors are the observations with active constraints or non-zero dual multipliers; they determine the boundary in the dual representation. When perfect separation is unrealistic, slack variables and hinge loss allow violations while still penalizing them.", "textbook"),
            note("Scope boundary", "This page is textbook depth. Treat the derivation as a worked mathematical extension and verify the current lecture sequence before calling every SVM detail examinable.", "ref")
          ],
          examples: [worked("Worked example: compute one geometric margin", ["A point has y(wᵀx + b) = 2 and ||w|| = 4.", "Divide the label-scaled score by the normal-vector length: 2 / 4.", "The signed geometric margin is 0.5. A larger norm with the same score would reduce the geometric distance."], "The margin is 0.5; keep the label inside the numerator when using the signed form.", "textbook")],
          questions: [
            { id: "dsa5105-svm-q1", type: "calculation", prompt: "For a point x with y(wᵀx+b)=2 and ||w||=4, what is its signed geometric margin?", accepted: ["0.5", "1/2"], solution: "The margin is y(wᵀx+b)/||w|| = 2/4 = 0.5.", explanation: "Use the label-scaled score for a signed margin.", sourceRefs: [textbook(31, "margin formula")] },
            { id: "dsa5105-svm-q2", type: "derivation", prompt: "Why does the hard-margin SVM use yᵢ(wᵀxᵢ+b)≥1 while minimizing ||w||²/2?", accepted: ["fix the scale and maximize margin", "normalizes the closest points and minimizes norm", "maximize 1 over norm"], solution: "The classifier scale is otherwise arbitrary. Fixing the closest correctly classified points at score 1 makes the geometric margin 1/||w||, so maximizing it is equivalent to minimizing ||w||²/2 under the constraints.", explanation: "Mention both scale fixing and the inverse relationship between norm and margin.", sourceRefs: [textbook(31, "hard-margin primal")] },
            { id: "dsa5105-svm-q3", type: "short", prompt: "What makes a training example a support vector?", accepted: ["it has an active margin constraint", "nonzero lagrange multiplier", "lies on or inside the margin"], solution: "It is a point with an active constraint in the optimum, equivalently a point with a non-zero dual multiplier; in a soft-margin model it can lie on or inside the margin.", explanation: "Support vectors, not all observations, determine the fitted boundary in the dual representation.", sourceRefs: [textbook(35, "support vectors")] }
          ]
        }
      ]},
      { id: "dsa5105-unsupervised", title: "Unsupervised learning", lessons: [
        {
          id: "dsa5105-kernel-pca-cluster", title: "Kernels, PCA, K-means, and GMM", week: 7, minutes: 60,
          summary: "Connect geometry, dimensionality reduction, and mixture modeling instead of memorizing them as separate algorithms.",
          objectives: ["Interpret a kernel as an inner product in a feature space", "State what PCA maximizes", "Contrast K-means with GMM"],
          sourceRefs: [lecture("DSA5105/Lec1.pdf", 31, "kernel methods"), lecture("DSA5105/Lec1.pdf", 39, "unsupervised overview")],
          visualIds: [],
          sections: [
            note("Lecture core · Three different questions", "PCA asks for a low-dimensional linear view that preserves variance. K-means asks which centroid is closest under squared Euclidean distance. GMM asks which latent component plausibly generated the point and returns a probability, not just a label.", "lecture"),
            note("Lecture core · Kernel idea", "A kernel lets us compute inner products after an implicit feature map without explicitly constructing every transformed coordinate. The useful mental model is geometry in a richer space; the kernel choice controls which notion of similarity is available.", "lecture", "k(x, z) = ⟨φ(x), φ(z)⟩"),
            note("Textbook depth · Do not conflate objectives", "PCA is not a clustering algorithm, and a high-variance direction is not automatically a predictive direction. Compare each method by its objective, output, and failure mode before choosing it for a dataset.", "textbook")
          ],
          examples: [worked("Worked example: choose a method", ["If the task is compressing ten correlated measurements into two coordinates, start with PCA.", "If the task is assigning every point to exactly one of K groups, K-means matches that hard-assignment goal.", "If points overlap and you need uncertainty such as P(cluster 1 | x), use a probabilistic mixture such as a GMM."], "Method choice follows the question: compression, hard grouping, or probabilistic membership.", "lecture")],
          questions: [
            { id: "dsa5105-u-q1", type: "mcq", prompt: "PCA's first component is the direction that maximizes what?", choices: ["Training accuracy", "Projected variance", "Number of clusters", "Margin slack"], answer: 1, explanation: "The first principal direction maximizes variance of the projected centered data.", sourceRefs: [lecture("DSA5105/Lec1.pdf", 39, "PCA overview")] },
            { id: "dsa5105-u-q2", type: "mcq", prompt: "What is the most direct distinction between K-means and GMM?", choices: ["K-means is supervised", "GMM gives soft probabilistic assignments", "GMM cannot use Euclidean distance", "K-means always finds the global optimum"], answer: 1, explanation: "A GMM assigns posterior membership probabilities; K-means assigns each point to one centroid.", sourceRefs: [lecture("DSA5105/Lec1.pdf", 39, "clustering overview")] }
          ]
        },
        {
          id: "dsa5105-pca-deep-dive", title: "PCA as variance and reconstruction", week: 8, minutes: 60,
          summary: "Move from the PCA slogan to centering, covariance eigenvectors, reconstruction error, and whitening.",
          objectives: ["Center a data matrix before PCA", "Relate covariance eigenvectors to variance", "Explain reconstruction error and whitening"],
          sourceRefs: [lecture("DSA5105/Lec1.pdf", 39, "lecture overview"), textbook(82, "PCA formulations"), textbook(88, "eigenvalue solution"), reference("DSA5105/Ref/Mathematics_of_Data_Science.pdf", 31, "PCA and dimension reduction", "draft")],
          visualIds: [],
          sections: [
            note("Lecture core · Center before projecting", "Compute the feature-wise mean and subtract it from every row. Without centering, the first direction can mostly describe the offset of the cloud from the origin instead of the variation around its mean.", "lecture", "Z = X − 1μᵀ"),
            note("Textbook depth · Variance and eigenvectors", "For centered data, the unit direction that maximizes projected variance is the top eigenvector of the sample covariance matrix. The next direction is orthogonal to the first and captures the largest remaining variance.", "textbook", "v₁ = arg max_{||v||=1} vᵀΣv"),
            note("Textbook depth · Reconstruction", "The top k principal directions span the k-dimensional linear subspace that minimizes total squared projection error. This is why PCA can be described both as variance maximization and as lossy reconstruction with the best rank-k linear subspace.", "textbook"),
            note("Reference boundary · Whitening", "Whitening rotates into principal coordinates and rescales each non-zero component by the inverse square root of its eigenvalue. It can help when feature scales are very uneven, but tiny eigenvalues can amplify noise; the supporting mathematics reference is marked draft.", "ref")
          ],
          examples: [worked("Worked example: PCA on two centered points", ["After centering, suppose the data lie mostly along the direction (1, 1). The covariance has a larger eigenvalue in that direction than in the perpendicular direction (1, −1).", "Normalize the leading eigenvector to unit length; its sign is arbitrary, so (1, 1)/√2 and its negative describe the same axis.", "Project each centered row onto that axis to get a one-dimensional representation, then reconstruct by multiplying the score back by the axis."], "PCA keeps the direction with the largest eigenvalue and discards orthogonal variation according to the chosen k.", "textbook")],
          questions: [
            { id: "dsa5105-pca-q1", type: "derivation", prompt: "What matrix and eigenvector identify the first PCA direction for centered data?", accepted: ["top eigenvector of covariance matrix", "leading eigenvector of the covariance", "largest eigenvalue eigenvector"], solution: "Form the sample covariance matrix of centered observations and take its unit eigenvector associated with the largest eigenvalue.", explanation: "Centering and the largest-eigenvalue eigenvector are both essential.", sourceRefs: [textbook(82, "variance formulation")] },
            { id: "dsa5105-pca-q2", type: "short", prompt: "Why can PCA be described as minimizing reconstruction error?", accepted: ["projection onto top k subspace minimizes squared error", "best rank k linear subspace", "top eigenvectors minimize squared projection error"], solution: "Among k-dimensional linear subspaces, the span of the top k principal directions minimizes total squared distance from the data to its projection.", explanation: "This is the reconstruction formulation of PCA.", sourceRefs: [textbook(88, "reconstruction formulation")] },
            { id: "dsa5105-pca-q3", type: "short", prompt: "What does whitening change after rotating into principal coordinates?", accepted: ["it scales by inverse square root eigenvalues", "decorrelates and unit variance", "scales principal components to unit variance"], solution: "Whitening keeps the principal-coordinate rotation and rescales each component by the inverse square root of its variance/eigenvalue, when non-zero.", explanation: "Whitening is a scaling step after the PCA basis is found.", sourceRefs: [reference("DSA5105/Ref/Mathematics_of_Data_Science.pdf", 37, "PCA in high dimensions", "draft")] }
          ]
        },
        {
          id: "dsa5105-cluster-gmm", title: "K-means, GMM, and EM", week: 9, minutes: 60,
          summary: "Compare hard centroid assignment with probabilistic mixture modeling and use EM as an alternating optimization pattern.",
          objectives: ["State the K-means objective", "Explain GMM responsibilities", "Describe the E and M steps"],
          sourceRefs: [lecture("DSA5105/Lec1.pdf", 39, "unsupervised overview"), textbook(92, "K-means"), textbook(98, "Gaussian mixture models"), textbook(102, "EM update pattern"), reference("DSA5105/Ref/Mathematics_of_Data_Science.pdf", 51, "clustering context", "draft")],
          visualIds: [],
          sections: [
            note("Lecture core · K-means loop", "K-means alternates between assigning each point to its nearest centroid and recomputing each centroid from its assigned points. Its objective is a sum of within-cluster squared distances, so scale and outliers matter.", "lecture", "min_{c₁,…,cₖ} Σᵢ ||xᵢ − c_{zᵢ}||²"),
            note("Textbook depth · GMM responsibilities", "A Gaussian mixture assigns each point a responsibility for every component. Responsibilities are soft: overlapping clusters can both receive meaningful probability, and covariance matrices can represent elongated uncertainty that K-means cannot.", "textbook", "γᵢₖ = P(zᵢ = k | xᵢ, θ)"),
            note("Textbook depth · Expectation–maximization", "The E-step computes responsibilities using the current parameters. The M-step updates weights, means, and covariances using those responsibilities. The observed-data likelihood is improved in the idealized update, but the non-convex objective can still finish at a local optimum.", "textbook"),
            note("Reference boundary", "The draft mathematics reference adds a wider clustering and spectral context. Use it to connect ideas after the K-means and EM loop is clear; it is not a replacement for current lecture scope.", "ref")
          ],
          examples: [worked("Worked example: one responsibility update", ["Suppose a point is equally likely under two components before looking at its location, so both priors are 0.5.", "If the component likelihoods at x are 0.8 and 0.2, multiply by the priors to get unnormalized weights 0.4 and 0.1.", "Normalize: the responsibilities are 0.4/(0.5) = 0.8 and 0.1/(0.5) = 0.2."], "The E-step normalizes weighted likelihoods; it does not turn the current highest component into permanent ground-truth labeling.", "textbook")],
          questions: [
            { id: "dsa5105-cg-q1", type: "mcq", prompt: "What does the E-step of GMM training compute?", choices: ["New labels treated as ground truth", "Posterior responsibilities for latent components", "A single global centroid", "The final test accuracy"], answer: 1, explanation: "The E-step estimates the latent component membership probabilities under current parameters.", sourceRefs: [textbook(102, "EM E-step")] },
            { id: "dsa5105-cg-q2", type: "short", prompt: "Why can K-means be viewed as a restricted mixture model?", accepted: ["hard assignments and spherical equal variance", "zero variance limit of a spherical GMM", "hard responsibilities with centroids"], solution: "K-means uses hard assignments and squared Euclidean distance, corresponding to a restricted spherical/equal-variance mixture interpretation in a limiting view.", explanation: "State the hard-assignment and restricted-geometry conditions.", sourceRefs: [textbook(98, "GMM and K-means connection")] },
            { id: "dsa5105-cg-q3", type: "short", prompt: "Name one reason EM or K-means can return different solutions on repeated runs.", accepted: ["random initialization", "local optimum", "initialization changes the local optimum"], solution: "Both methods optimize a non-convex objective in common formulations, so initialization can lead to different local optima.", explanation: "A good answer links randomness to non-convex optimization.", sourceRefs: [reference("DSA5105/Ref/Mathematics_of_Data_Science.pdf", 51, "clustering context", "draft")] }
          ]
        }
      ]},
      { id: "dsa5105-advanced", title: "RL and graphs", lessons: [
        {
          id: "dsa5105-rl-gnn", title: "Bellman reasoning and graph learning", week: 10, minutes: 60,
          summary: "Use Bellman recursion to make sequential decisions and message passing to exploit graph structure.",
          objectives: ["Write a one-step Bellman backup", "Distinguish model-based and model-free RL", "Explain neighborhood aggregation in a GNN"],
          sourceRefs: [lecture("DSA5105/syllabus.pdf", 1, "current scope"), reference("DSA5105/Ref/Chapter3_Graph_Neural_Networks.pdf", 1, "optional GNN reading")],
          visualIds: [],
          sections: [
            note("Lecture core · Bellman backup", "A one-step backup combines the reward received now with a discounted estimate of what can be achieved from the next state. The optimality version chooses the best next action; the policy version averages according to the current policy.", "lecture", "Q*(s,a) = r + γ maxₐ′ Q*(s′,a′)"),
            note("Reference depth · Message passing", "A GNN updates a node by transforming neighboring representations, aggregating them with a permutation-invariant operation, and combining that summary with the node’s own state. The graph edge structure is the source of locality.", "ref", "hᵥ′ = UPDATE(hᵥ, AGGREGATE({MESSAGE(hᵥ, hᵤ): u ∈ N(v)}))"),
            note("Bridge, not equivalence", "RL propagates values over possible state transitions; a GNN propagates representations over observed graph edges. The shared pattern is local information flow, not a claim that the two algorithms solve the same objective.", "lecture")
          ],
          examples: [worked("Worked example: one-step Q backup", ["A transition gives reward r = 2, discount γ = 0.9, and the next-state action values are 4 and 1.", "Choose the larger next value: max(4, 1) = 4.", "The target is 2 + 0.9 × 4 = 5.6. A Q-learning update moves the current estimate toward this target."], "The backup is immediate reward plus discounted best continuation value.", "lecture")],
          questions: [
            { id: "dsa5105-rg-q1", type: "derivation", prompt: "Write the one-step discounted Bellman optimality backup.", accepted: ["r + gamma max a' q(s',a')", "r + γ max q(s',a')", "r + gamma max over a prime q(s prime a prime)"], solution: "Q*(s,a) = r + γ max_{a'} Q*(s',a') for a deterministic one-step transition.", explanation: "Include immediate reward, discount, next state, and the maximizing next action.", sourceRefs: [lecture("DSA5105/syllabus.pdf", 1, "current scope")] },
            { id: "dsa5105-rg-q2", type: "short", prompt: "What does a message-passing GNN aggregate at a node?", accepted: ["neighbor representations", "representations from neighbors", "neighbor features"], solution: "It aggregates transformed representations/features from neighboring nodes, then combines them with the node's own state.", explanation: "Mention the neighborhood and the update of the node representation.", sourceRefs: [reference("DSA5105/Ref/Chapter3_Graph_Neural_Networks.pdf", 1, "message passing", "optional")] }
          ]
        },
        {
          id: "dsa5105-rl-bellman", title: "MDPs, value functions, and Bellman equations", week: 11, minutes: 65,
          summary: "Build the RL vocabulary from Markov decision processes to state/action values and optimality backups.",
          objectives: ["Define an MDP and return", "Write a policy Bellman equation", "Contrast model-based and model-free learning"],
          sourceRefs: [lecture("DSA5105/syllabus.pdf", 1, "current scope"), textbook(103, "RL and MDP components"), textbook(108, "value functions"), textbook(110, "policy improvement"), reference("DSA5105/Ref/Reinforcement_Learning_an_Introduction.pdf", 1, "optional RL reading")],
          visualIds: [],
          sections: [
            note("Lecture core · MDP vocabulary", "An MDP describes states, actions, transition and reward dynamics, and a policy. The Markov property says the current state contains the information needed for predicting the next step; the full history need not be carried forward.", "lecture", "G = Rₜ₊₁ + γRₜ₊₂ + γ²Rₜ₊₃ + …"),
            note("Textbook depth · Value functions", "A state value is the expected return from a state under a policy. An action value conditions on both the state and the first action. The Bellman equation turns a long-horizon return into a local reward plus a discounted continuation value.", "textbook", "Vπ(s) = Eπ[Rₜ₊₁ + γVπ(Sₜ₊₁) | Sₜ = s]"),
            note("Textbook depth · Policy versus optimality", "The policy Bellman equation averages over actions using π(a|s). The optimality equation replaces that average with a maximum. This is the conceptual jump behind value iteration and Q-learning.", "textbook"),
            note("Reference boundary", "The RL reference is optional background for algorithm comparisons. Secure the MDP, return, value, and Bellman core before adding algorithm names to your revision notes.", "ref")
          ],
          examples: [worked("Worked example: discount a delayed reward", ["A trajectory gives reward 1 now and reward 10 two steps later.", "With γ = 0.5, the return contribution is 1 + 0.5² × 10 = 3.5.", "With γ = 0.9, it is 1 + 0.9² × 10 = 9.1. The larger discount makes delayed reward matter much more."], "Changing γ changes the objective: it is not merely a learning-rate setting.", "textbook")],
          questions: [
            { id: "dsa5105-rl-q1", type: "derivation", prompt: "Write the policy Bellman equation for a state value Vπ(s).", accepted: ["expected reward plus gamma expected next value", "v pi s equals expectation r plus gamma v pi s prime", "sum over actions and next states"], solution: "Vπ(s) = Σa π(a|s) Σs',r p(s',r|s,a)[r + γVπ(s')].", explanation: "Include policy weighting, transition/reward dynamics, immediate reward, and discounted continuation value.", sourceRefs: [textbook(108, "policy Bellman equation")] },
            { id: "dsa5105-rl-q2", type: "mcq", prompt: "Which approach learns a transition/reward model explicitly before planning?", choices: ["Model-based RL", "Purely model-free RL", "Nearest-neighbor classification", "PCA"], answer: 0, explanation: "Model-based methods estimate or use dynamics and rewards to plan; model-free methods learn values or policies without an explicit model.", sourceRefs: [lecture("DSA5105/syllabus.pdf", 1, "RL scope")] },
            { id: "dsa5105-rl-q3", type: "short", prompt: "What happens to the weight of far-future rewards as γ becomes smaller?", accepted: ["they are discounted more", "far future rewards matter less", "future rewards receive lower weight"], solution: "Far-future rewards receive less weight, so the agent becomes more short-term oriented.", explanation: "The immediate reward is unaffected by the discount exponent 0.", sourceRefs: [reference("DSA5105/Ref/Reinforcement_Learning_an_Introduction.pdf", 1, "discounted return", "optional")] }
          ]
        },
        {
          id: "dsa5105-gnn", title: "GNN message passing and invariance", week: 12, minutes: 55,
          summary: "Explain how graph neural networks update node representations while respecting neighborhood structure and node ordering.",
          objectives: ["Write a neighborhood aggregation pattern", "Explain permutation-invariant aggregation", "Identify oversmoothing as a depth risk"],
          sourceRefs: [lecture("DSA5105/syllabus.pdf", 1, "current scope"), reference("DSA5105/Ref/Chapter3_Graph_Neural_Networks.pdf", 1, "optional GNN reading")],
          visualIds: [],
          sections: [
            note("Reference depth · Message passing", "A typical layer builds a message from each neighbor, aggregates the messages with sum, mean, or max, and combines the result with the node’s own state. Because the neighborhood is a set, reordering its nodes should not change the output.", "ref", "hᵥ′ = σ(W₀hᵥ + AGGᵤ∈N(v) W₁hᵤ)"),
            note("Reference depth · Receptive field", "One layer sees one-hop neighbors. Stacking layers expands the receptive field, but it also mixes information repeatedly and can make embeddings too similar. Check held-out performance and representation separation rather than assuming deeper is better.", "ref"),
            note("Scope boundary", "This is reference-supported graph depth. Use it to understand the GNN idea and its invariance requirement; do not silently treat every architecture detail as current lecture exam scope.", "lecture")
          ],
          examples: [worked("Worked example: permutation invariance", ["A node has neighbor features [1, 3] and [3, 1] under two different input orders.", "A sum aggregator returns 4 in both cases; a mean aggregator returns 2 in both cases.", "A sequence-sensitive operation could return different values, which would make the result depend on an arbitrary neighbor ordering."], "Set aggregation preserves graph semantics because neighbor order has no meaning.", "ref")],
          questions: [
            { id: "dsa5105-gnn-q1", type: "short", prompt: "Why should neighbor aggregation be permutation invariant?", accepted: ["node order has no meaning in a graph", "reordering neighbors should not change output", "graphs are not ordered sequences"], solution: "Neighbor order is arbitrary, so reordering the same neighborhood should produce the same updated node representation.", explanation: "The property makes the layer compatible with graph sets rather than sequence positions.", sourceRefs: [reference("DSA5105/Ref/Chapter3_Graph_Neural_Networks.pdf", 1, "permutation invariance", "optional")] },
            { id: "dsa5105-gnn-q2", type: "mcq", prompt: "What is a common risk of stacking many message-passing layers?", choices: ["Oversmoothing", "Guaranteed perfect separation", "Removal of all graph edges", "No trainable parameters"], answer: 0, explanation: "Repeated local mixing can make node embeddings indistinguishable, a phenomenon commonly called oversmoothing.", sourceRefs: [reference("DSA5105/Ref/Chapter3_Graph_Neural_Networks.pdf", 1, "depth risk", "optional")] }
          ]
        }
      ]}
    ]
  };
})();
