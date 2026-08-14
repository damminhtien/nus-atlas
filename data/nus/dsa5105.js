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

  window.NUS_CONTENT.DSA5105 = {
    modules: [
      { id: "dsa5105-foundations", title: "Foundations", lessons: [
        {
          id: "dsa5105-erm", title: "ERM, loss, and generalization", week: 1, minutes: 50,
          summary: "Frame supervised learning as empirical risk minimization and ask what controls the train–test gap.",
          objectives: ["Write the ERM objective", "Distinguish underfitting from overfitting", "Choose a validation strategy"],
          sourceRefs: [lecture("DSA5105/syllabus.pdf", 1, "current assessment and scope"), lecture("DSA5105/Lec1.pdf", 10, "supervised-learning framing")],
          visualIds: ["dsa5105-ordinal-nominal"],
          sections: [{ title: "Modeling checkpoint", body: "Before fitting, identify the sample, hypothesis class, loss, regularization, and evaluation split. Feature type is part of the modeling decision: ordinal data carries order; nominal data does not." }],
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
            { title: "Lecture core", body: "The lecture frames generalization as the gap between performance on observed examples and performance on unseen examples. Treat this as the exam-priority vocabulary: data split, hypothesis class, loss, and sources of error." },
            { title: "Textbook depth", body: "The textbook formalizes empirical risk as an average over the sample and population risk as an expectation under the data distribution. PAC language adds two knobs: ε controls allowed error and δ controls failure probability, so a useful statement has probability at least 1 − δ of risk at most ε." },
            { title: "Reference boundary", body: "The UML reference develops agnostic PAC and sample-complexity theory in more detail. Use it to strengthen intuition, not to silently expand the current lecture examinable scope." }
          ],
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
          sections: [{ title: "Regularization", body: "Ridge adds λ||w||₂² and tends to shrink correlated weights together. Lasso adds λ||w||₁ and can set some coordinates exactly to zero." }],
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
            { title: "Textbook depth", body: "For a classifier f(x)=wᵀx+b, the distance from x to the decision hyperplane is |wᵀx+b|/||w||. With labels scaled to ±1, fixing yᵢ(wᵀxᵢ+b)≥1 turns maximum margin into minimizing ||w||²/2." },
            { title: "Support vectors", body: "Only training points with active constraints determine the boundary in the dual view. These support vectors receive non-zero multipliers; soft-margin violations are represented by slack and hinge loss." },
            { title: "Scope note", body: "This lesson is textbook depth. Keep it separate from lecture-core claims until the relevant SVM material is confirmed in the current lecture sequence." }
          ],
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
          sections: [{ title: "Comparison", body: "PCA finds high-variance directions; K-means uses hard assignments around centroids; GMM uses soft assignments and a probabilistic density model." }],
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
            { title: "Center first", body: "Subtract the feature-wise sample mean before computing covariance. The first principal direction is the unit vector maximizing projected variance; for centered data this is the top eigenvector of the covariance matrix." },
            { title: "Reconstruction view", body: "The top k eigenvectors span the rank-k linear subspace that minimizes squared projection/reconstruction error. Whitening goes one step further by scaling principal coordinates by inverse square roots of their eigenvalues." },
            { title: "Reference boundary", body: "The Mathematics of Data Science PDF is marked draft and extends PCA to high-dimensional geometry. Use it for intuition about noisy eigen-directions, not as current lecture authority." }
          ],
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
            { title: "Hard versus soft assignment", body: "K-means alternates between assigning each point to its nearest centroid and recomputing centroids. A GMM assigns responsibilities, or posterior probabilities, and can represent covariance and cluster uncertainty." },
            { title: "EM pattern", body: "The E-step computes expected latent assignments under the current parameters. The M-step updates mixture weights, means, and covariances using those responsibilities. Each iteration targets the observed-data likelihood but can stop at a local optimum." },
            { title: "Reference boundary", body: "The draft mathematics reference gives a broader clustering and spectral context. It is supporting material, not a replacement for the current lecture sequence." }
          ],
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
          sections: [{ title: "Bridge", body: "Both RL and GNNs reuse local structure: Bellman backups propagate value over state transitions; GNN layers propagate representations over graph edges." }],
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
            { title: "MDP vocabulary", body: "An MDP specifies states, available actions, transition/reward dynamics, and a policy. The return sums discounted future rewards; the discount factor controls how strongly later rewards matter." },
            { title: "Bellman recursion", body: "A state value is the expected immediate reward plus discounted next-state value under the policy. The optimality equation replaces policy averaging with a maximizing action, which is the bridge to dynamic programming and Q-learning." },
            { title: "Scope note", body: "The textbook gives the formal derivation. The RL reference is optional background; use it to compare algorithms only after the MDP and Bellman core is secure." }
          ],
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
            { title: "Message passing", body: "A typical layer computes messages from neighboring node states, aggregates them with a permutation-invariant operator such as sum/mean/max, and combines the result with the node's own state." },
            { title: "Depth tradeoff", body: "More layers expand the receptive field, but repeated aggregation can make node representations too similar. Treat oversmoothing as a diagnostic when depth improves neither validation performance nor useful separation." },
            { title: "Reference boundary", body: "This lesson is reference-supported graph depth. It should not be read as evidence that every architecture detail is part of the lecture exam." }
          ],
          questions: [
            { id: "dsa5105-gnn-q1", type: "short", prompt: "Why should neighbor aggregation be permutation invariant?", accepted: ["node order has no meaning in a graph", "reordering neighbors should not change output", "graphs are not ordered sequences"], solution: "Neighbor order is arbitrary, so reordering the same neighborhood should produce the same updated node representation.", explanation: "The property makes the layer compatible with graph sets rather than sequence positions.", sourceRefs: [reference("DSA5105/Ref/Chapter3_Graph_Neural_Networks.pdf", 1, "permutation invariance", "optional")] },
            { id: "dsa5105-gnn-q2", type: "mcq", prompt: "What is a common risk of stacking many message-passing layers?", choices: ["Oversmoothing", "Guaranteed perfect separation", "Removal of all graph edges", "No trainable parameters"], answer: 0, explanation: "Repeated local mixing can make node embeddings indistinguishable, a phenomenon commonly called oversmoothing.", sourceRefs: [reference("DSA5105/Ref/Chapter3_Graph_Neural_Networks.pdf", 1, "depth risk", "optional")] }
          ]
        }
      ]}
    ]
  };
})();
