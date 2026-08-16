(function () {
  "use strict";
  const local = (sourceId, page) => ({ sourceId, page, access: "local source; not copied to public bundle" });
  window.NUS_VISUALS = {
    "dsa5101-big-data-cost": { courseCode: "DSA5101", title: "Scalability cost map", kind: "diagram+flow", source: local("DSA5101/DSA5101 Course Information.pdf", 1), observation: "Use the map to name the input size, passes, memory pressure, and coordination cost before comparing two big-data designs." },
    "dsa5101-support-baskets": { courseCode: "DSA5101", title: "Frequent itemsets: basket view", kind: "diagram+table", source: local("DSA5101/Lec1 - Assoc Rules, Frequent itemsets.pdf", 24), observation: "The basket table makes support a count over transactions; use it to practice monotonicity and rule confidence." },
    "dsa5101-association-network": { courseCode: "DSA5101", title: "Many-to-many association sketch", kind: "diagram", source: local("DSA5101/Lec1 - Assoc Rules, Frequent itemsets.pdf", 20), observation: "A network-like background is treated as a prompt for separating an itemset from a graph visualization; the lesson uses the formal basket definition." },
    "dsa5101-minhash-bands": { courseCode: "DSA5101", title: "MinHash signature bands", kind: "matrix+flow", source: local("DSA5101/Assignments/DSA5101_Assignment_1.pdf", 4), observation: "Read rows as signature evidence and bands as a candidate filter; a collision is not yet a verified neighbor." },
    "dsa5101-pagerank-stream": { courseCode: "DSA5101", title: "Ranking and stream summaries", kind: "flow+comparison", source: local("DSA5101/Assignments/DSA5101_Assignment_2.pdf", 2), observation: "Keep PageRank's probability mass flow separate from DGIM and Flajolet–Martin's bounded stream summaries." },
    "dsa5104-data-abstraction": { courseCode: "DSA5104", title: "View of data and abstraction layers", kind: "diagram", source: local("DSA5104/chapter1.pdf", 12), observation: "Use the view-of-data diagram to recall physical, logical, and view levels before writing SQL." },
    "dsa5104-relational-model": { courseCode: "DSA5104", title: "Relational model: rows, columns, schema", kind: "diagram+table", source: local("DSA5104/chapter1.pdf", 14), observation: "The table/attribute arrows are useful for ER-to-relational translation and key identification." },
    "dsa5104-clean-automobile": { courseCode: "DSA5104", title: "Automobile data quality report", kind: "chart-deck", source: local("DSA5104/chapter1_appendix_codex_data_analytics/reports/codex_data_analysis.pptx", 1), observation: "The deck is an audit trail from raw CSV to analysis-ready evidence; practice asking what was changed, why, and how it was validated." },
    "dsa5105-ordinal-nominal": { courseCode: "DSA5105", title: "Ordinal vs nominal data", kind: "illustration+diagram", source: local("DSA5105/Lec1.pdf", 14), observation: "Star ratings and language levels illustrate order; graph nodes and CIFAR labels illustrate nominal categories. Classify feature types before choosing a model. The slide deck cover has a DSA5102 title anomaly; keep the source mapped to DSA5105 only because the local syllabus/folder context supports it." },
    "dsa5105-weighted-ols": { courseCode: "DSA5105", title: "Weighted design-matrix derivation", kind: "equation+matrix", source: local("DSA5105/Ref/week1_DSA5105_lecture1_with_note.pdf", 46), observation: "Use the matrix view to distinguish the normal equation, the full-rank uniqueness assumption, and the row-scaling interpretation of positive example weights." },
    "dsa5105-svm-dual-kkt": { courseCode: "DSA5105", title: "SVM KKT and support-vector map", kind: "equation+diagram", source: local("DSA5105/Textbook.pdf", 34), observation: "Read non-zero alpha values as active margin constraints; the visual is a derivation cue, not a replacement for checking dual feasibility." },
    "dsa5105-trees-ensembles": { courseCode: "DSA5105", title: "Tree split and ensemble comparison", kind: "tree+comparison", source: local("DSA5105/Textbook.pdf", 41), observation: "The split view separates local impurity reduction from the ensemble view: bagging averages variance, while boosting changes example weights sequentially." },
    "dsa5105-neural-backprop": { courseCode: "DSA5105", title: "Forward/backward computation graph", kind: "computation-graph", source: local("DSA5105/Textbook.pdf", 52), observation: "Trace intermediate values forward, then multiply local derivatives backward; backprop computes gradients but does not certify a global optimum." },
    "dsa5105-pca-numerical": { courseCode: "DSA5105", title: "PCA covariance and reconstruction map", kind: "matrix+geometry", source: local("DSA5105/Textbook.pdf", 86), observation: "Connect the covariance eigenvalue to projected variance and the discarded eigenvalues to reconstruction error; keep whitening as a later scaling step." },
    "dsa5105-gmm-em-numerical": { courseCode: "DSA5105", title: "GMM responsibility flow", kind: "probability+table", source: local("DSA5105/Textbook.pdf", 100), observation: "A responsibility is a normalized prior-weighted likelihood. Use the table to keep the E-step probability calculation separate from the M-step weighted mean." },
    "dsa5105-mdp-value-iteration": { courseCode: "DSA5105", title: "Value-iteration backup table", kind: "table+timeline", source: local("DSA5105/Textbook.pdf", 115), observation: "Each sweep propagates one-step lookahead values; write candidate actions before taking the maximum and extract the greedy policy only after the value estimate is ready." },
    "dsa5105-dynamic-programming": { courseCode: "DSA5105", title: "Dynamic-programming dependency table", kind: "table+recurrence", source: local("DSA5105/Textbook.pdf", 107), observation: "The table is a proof aid: state meaning, base cases, allowed final moves, and complexity should all be visible." },
    "dsa5105-graph-kernel-pagerank": { courseCode: "DSA5105", title: "Graph-kernel Gram block and PageRank flow", kind: "matrix+flow", source: local("DSA5105/Ref/Mathematics_of_Data_Science.pdf", 47), observation: "Use the Gram eigenvalues to derive the q range, then switch mental models to a normalized stochastic power iteration for PageRank." },
    "dsa5105-spectral-clustering": { courseCode: "DSA5105", title: "Graph Laplacian smoothness", kind: "graph+matrix", source: local("DSA5105/Ref/Mathematics_of_Data_Science.pdf", 53), observation: "The Laplacian quadratic form turns edge disagreement into energy; selected low-energy eigenvectors become the embedding before K-means." },
    "dsa5105-ls-svm-loo": { courseCode: "DSA5105", title: "Regularized linear-algebra bridge", kind: "matrix+equation", source: local("DSA5105/Textbook.pdf", 29), observation: "Compare the ridge normal system, LS-SVM KKT block, and hat-matrix LOO correction as three views of regularized fitting." },
    "dsa5208-data-never-sleeps": { courseCode: "DSA5208", title: "Data never sleeps: AI Edition 2025", kind: "infographic", source: { ...local("DSA5208/Lec0.pdf", 4), externalUrl: "https://www.domo.com/learn/infographic/data-never-sleeps-ai-edition-2025" }, observation: "Use as a scale/throughput prompt only; the public app stores the attribution and derived question, not the infographic." },
    "dsa5208-big-data-applications": { courseCode: "DSA5208", title: "Product recommendation and trend signals", kind: "screenshots", source: local("DSA5208/Lec0.pdf", 5), observation: "The screenshots motivate why distributed collection, retrieval, and ranking need fault-tolerant systems." },
    "dsa5208-spark-pipeline": { courseCode: "DSA5208", title: "Spark and scalable ML topic map", kind: "diagram+links", source: local("DSA5208/Lec0.pdf", 8), observation: "Use the lecture map to connect Spark introduction, distributed algorithms, and MLlib/cloud work." }
  };
})();

/* Structured study cues: the thumbnail is only the entry point; these fields
 * turn each visual into a short predict-observe-explain retrieval task. */
(function () {
  "use strict";
  const cues = {
    "dsa5105-ordinal-nominal": {
      learningGoal: "Classify a feature by whether its categories have meaningful order, without inventing numeric distance.",
      lookFor: ["Ordinal levels preserve order, but adjacent levels need not be equally spaced.", "Nominal categories have no natural ranking; permuting their labels does not change meaning.", "One-hot encoding preserves category identity without treating labels as scalar targets."],
      prompt: String.raw`A rating changes from $2$ to $3$, while a class label changes from cat to dog. Which comparison is meaningful, and what encoding would you choose?`,
      nextMove: "Write one ordinal feature and one nominal feature from a real dataset, then state the representation for each.",
      check: String.raw`$2<3$ is meaningful for ordinal data, but cat and dog have no order. Use an order-aware representation only when order is real; use one-hot indicators for nominal categories.`,
      labId: "dsa5105-erm"
    },
    "dsa5105-weighted-ols": {
      learningGoal: String.raw`Move from weighted residuals to the normal equations, then check the rank assumption that makes the solution unique.`,
      lookFor: [String.raw`The diagonal weight matrix $A$ changes how strongly each row contributes to the objective.`, String.raw`The normal system is $\Phi^\top A\Phi\hat w=\Phi^\top Ay$.`, String.raw`Positive weights change emphasis but do not repair a rank-deficient design by themselves.`],
      prompt: String.raw`If one example's weight doubles, which row changes in the objective? Does that alone make $\Phi^\top A\Phi$ invertible?`,
      nextMove: String.raw`Name the matrix whose null-space you must inspect, then state the full-column-rank condition before using an inverse.`,
      check: String.raw`The row's residual receives more emphasis. Uniqueness still requires the weighted design to have full column rank; positive diagonal weights preserve the relevant null-space test but do not create missing information.`,
      labId: "dsa5105-weighted-ols"
    },
    "dsa5105-svm-dual-kkt": {
      learningGoal: String.raw`Use KKT activity to connect dual coefficients, margin position, and the points that determine the SVM boundary.`,
      lookFor: [String.raw`$α_i=0$ means the point is inactive in the dual representation.`, String.raw`$0<\alpha_i<C$ identifies a point on the soft-margin boundary under the usual convention.`, String.raw`$α_i=C$ signals a margin violation or a point inside the margin, subject to the exact constraints.`],
      prompt: String.raw`A point has $0<\alpha_i<C$. What geometric condition should you check before calling it a support vector?`,
      nextMove: String.raw`Write the complementary-slackness case beside the point's signed margin, rather than inferring geometry from $α_i$ alone.`,
      check: String.raw`It is an active support vector and typically lies exactly on a margin boundary, so its complementary-slackness case should be consistent with $y_i(w^\top x_i+b)=1$ in the normalized hard-margin-style convention.`,
      labId: "dsa5105-svm-dual-kkt"
    },
    "dsa5105-trees-ensembles": {
      learningGoal: "Separate a local tree split from the statistical reason bagging and boosting can improve a weak learner.",
      lookFor: ["A split creates purer child groups according to the chosen impurity measure.", "Bagging fits varied bootstrap samples and averages their predictions to reduce variance.", "Boosting changes example weights or residual focus so later learners target earlier mistakes."],
      prompt: "A hard example receives more weight after a weak learner. Which ensemble mechanism does that describe, and what changes next?",
      nextMove: "Predict whether the next learner should focus more or less on the misclassified example, then name the ensemble invariant.",
      check: "That is boosting: later learners focus more on mistakes through updated weights or residuals. Bagging does not sequentially reweight examples from one learner to the next.",
      labId: "dsa5105-trees-ensembles"
    },
    "dsa5105-neural-backprop": {
      learningGoal: "Trace a neural computation forward and a gradient backward, keeping local derivatives separate from the optimization update.",
      lookFor: ["Forward pass values are cached before the backward pass starts.", "Backprop multiplies local derivatives along each path by the chain rule.", "A correct gradient is not a certificate of a global optimum; the optimizer still chooses the update."],
      prompt: "If one intermediate derivative is zero, which downstream parameter gradients can disappear, and why?",
      nextMove: "Circle the path from the loss to one weight and write the product of local derivatives along that path.",
      check: "Every gradient path containing the zero local derivative contributes zero through the chain rule. Other independent paths may still contribute, so inspect the graph rather than declaring every gradient zero.",
      labId: "dsa5105-neural-backprop"
    },
    "dsa5105-pca-numerical": {
      learningGoal: String.raw`Connect centering, covariance eigenvectors, explained variance, and reconstruction error in one pipeline.`,
      lookFor: [String.raw`Center the data before forming the covariance matrix.`, String.raw`The eigenvector with the largest eigenvalue captures the largest projected variance.`, String.raw`Discarded eigenvalues quantify variance omitted by the lower-dimensional reconstruction.`],
      prompt: String.raw`With two centered features and $k=1$, what evidence tells you which direction to keep and what information is discarded?`,
      nextMove: String.raw`Read the ordered eigenvalues first; only then compute the retained variance ratio and discuss reconstruction.`,
      check: String.raw`Keep the eigenvector with the largest eigenvalue. The retained variance ratio is the kept eigenvalue divided by the sum of eigenvalues; the remaining eigenvalue represents discarded variance, not automatically predictive error.`,
      labId: "dsa5105-pca-numerical"
    },
    "dsa5105-gmm-em-numerical": {
      learningGoal: String.raw`Keep the E-step's soft responsibilities separate from the M-step's weighted parameter update.`,
      lookFor: [String.raw`For a fixed point, responsibilities across components sum to $1$.`, "The E-step assigns probabilities using prior weights and likelihoods.", "The M-step treats responsibilities as weights when updating means, covariances, and mixture weights."],
      prompt: String.raw`A point has responsibilities $0.8$ and $0.2$. What do those numbers weight in the next update, and what must they sum to?`,
      nextMove: "Write the numerator and denominator of one weighted mean before substituting any numbers.",
      check: String.raw`They weight the point's contribution to each component's M-step statistics, and the responsibilities for that point must sum to $1$. They are soft memberships, not two independent binary labels.`,
      labId: "dsa5105-gmm-em-numerical"
    },
    "dsa5105-mdp-value-iteration": {
      learningGoal: String.raw`Read a value-iteration sweep as a one-step lookahead backup before extracting a greedy policy.`,
      lookFor: ["Each candidate action combines immediate reward with discounted successor value.", String.raw`The maximum is taken only after all action candidates have been computed.`, "The policy is read from the maximizing action after the value estimate is updated."],
      prompt: String.raw`What changes in the backup when $γ=0$, and what does the resulting policy optimize?`,
      nextMove: "List the action values in a row, circle the maximum, then copy its action label into the policy.",
      check: String.raw`With $γ=0$, future values vanish, so the backup chooses the action with the largest immediate expected reward. The policy is myopic because no continuation value is counted.`,
      labId: "dsa5105-mdp-value-iteration"
    },
    "dsa5105-dynamic-programming": {
      learningGoal: "Turn a recurrence into an auditable table by naming the state, base cases, final move, and complexity.",
      lookFor: ["The state stores exactly the subproblem needed by later decisions.", "Base cases anchor the recurrence before any table entry is filled.", "The recurrence enumerates the allowed final moves instead of guessing a formula from the table."],
      prompt: "If a recurrence is correct but its base case is missing, which part of the algorithm can you no longer verify?",
      nextMove: "Point from one table cell to every predecessor it depends on, then state the evaluation order and memory cost.",
      check: "Without a base case, the table has no grounded starting values, so the recurrence cannot produce a well-defined solution. A complete answer must also state evaluation order and complexity.",
      labId: "dsa5105-dynamic-programming"
    },
    "dsa5105-graph-kernel-pagerank": {
      learningGoal: String.raw`Separate a graph-kernel PSD eigenvalue argument from PageRank's stochastic power iteration.`,
      lookFor: [String.raw`For a Gram block with eigenvalues $1+q$ and $1-q$, both must be non-negative.`, "PageRank requires a normalized transition convention and a treatment for dangling nodes.", String.raw`A PageRank iteration preserves a probability interpretation when the rank vector remains non-negative and sums to $1$.`],
      prompt: String.raw`Before running a PageRank power iteration, what matrix and normalization checks should you make?`,
      nextMove: "Label whether your transition matrix is row- or column-stochastic, then place the transpose consistently in the update.",
      check: String.raw`Check the stochastic orientation, repair dangling nodes, apply damping, and verify non-negativity plus unit sum after an iteration. The $q$ eigenvalue bound belongs to the separate PSD Gram argument.`,
      labId: "dsa5105-graph-kernel-pagerank"
    },
    "dsa5105-spectral-clustering": {
      learningGoal: String.raw`Use the Laplacian quadratic form to explain smooth graph signals and the steps that follow the spectral embedding.`,
      lookFor: [String.raw`The energy $f^\top Lf$ grows when adjacent nodes receive very different values.`, "Low non-trivial Laplacian eigenvectors provide a smooth embedding of graph nodes.", "K-means is a separate final step applied to rows of the embedding; eigenvectors do not assign cluster names by themselves."],
      prompt: String.raw`If two strongly connected nodes receive very different values, what happens to the Laplacian energy and why?`,
      nextMove: String.raw`Trace the pipeline: build $L$, select eigenvectors, embed nodes, then cluster the embedded rows.`,
      check: String.raw`The edge contributes a larger squared difference to $f^\top Lf$, so the energy rises. Spectral clustering prefers embeddings that keep strongly connected nodes close before the separate K-means approximation.`,
      labId: "dsa5105-spectral-clustering"
    },
    "dsa5105-ls-svm-loo": {
      learningGoal: "Compare three regularized fitting views without confusing ridge normal equations, LS-SVM equality constraints, and LOO correction.",
      lookFor: [String.raw`Ridge adds $λ I$ to a normal system and stabilizes inversion.`, "LS-SVM uses equality constraints with squared errors, producing a block KKT system.", String.raw`The LOO correction depends on the hat-matrix diagonal $H_{ii}$, which measures leverage.`],
      prompt: String.raw`Which quantity warns that an observation's LOO residual may become large: the ridge penalty, the KKT equality, or $H_{ii}$?`,
      nextMove: String.raw`Write the three objects in separate columns: normal matrix, KKT block, and smoothing matrix.`,
      check: String.raw`$H_{ii}$ is the leverage signal; as it approaches $1$, the denominator in $e_i^{\mathrm{LOO}}=e_i/(1-H_{ii})$ can amplify the residual. The other two objects describe different parts of the fitting system.`,
      labId: "dsa5105-ls-svm-loo"
    }
  };
  Object.entries(cues).forEach(([id, cue]) => {
    if (window.NUS_VISUALS[id]) Object.assign(window.NUS_VISUALS[id], cue);
  });
})();

(function () {
  "use strict";
  const local = (sourceId, page) => ({ sourceId, page, access: "local source; not copied to public bundle" });
  window.NUS_VISUALS = window.NUS_VISUALS || {};
  window.NUS_VISUALS["dsa5208-event-history"] = { courseCode: "DSA5208", title: "Process event histories", kind: "diagram+graph", source: local("DSA5208/Lec1.pdf", 4), observation: "Use the process diagram to separate local order, message edges, and the global event set before proving causality." };
  window.NUS_VISUALS["dsa5208-causal-graph"] = { courseCode: "DSA5208", title: "Happens-before graph", kind: "graph+relation", source: local("DSA5208/Lec1.pdf", 5), observation: "Treat each arrow as a justified local, message, or transitive edge; incomparability is a conclusion that needs both directions checked." };
  window.NUS_VISUALS["dsa5208-ordering-ladder"] = { courseCode: "DSA5208", title: "Delivery guarantees", kind: "comparison+flow", source: local("DSA5208/Lec1.pdf", 9), observation: "Compare arbitrary delivery, FIFO channel order, and causal delivery by the invariant each guarantee preserves." };
  window.NUS_VISUALS["dsa5208-physical-time"] = { courseCode: "DSA5208", title: "Physical time and NTP", kind: "timeline+equation", source: local("DSA5208/Lec1.pdf", 14), observation: "Keep delay estimation and clock synchronization separate from logical causality." };
  window.NUS_VISUALS["dsa5208-lamport-trace"] = { courseCode: "DSA5208", title: "Lamport scalar update trace", kind: "event-timeline", source: local("DSA5208/Lec1.pdf", 17), observation: "Trace increment, piggyback, max, increment, and deliver in order; the receive update is the common failure point." };
  window.NUS_VISUALS["dsa5208-vector-trace"] = { courseCode: "DSA5208", title: "Vector-clock comparison", kind: "matrix+comparison", source: local("DSA5208/Lec1.pdf", 22), observation: "Compare every component and identify incomparability rather than sorting vectors lexicographically." };
  window.NUS_VISUALS["dsa5208-compression-trace"] = { courseCode: "DSA5208", title: "Compressed timestamp metadata", kind: "state+comparison", source: local("DSA5208/Lec1.pdf", 29), observation: "Compare repeated full vectors with receiver-specific deltas and the Last Sent/Last Update differential state." };
})();

(function () {
  "use strict";
  const local = (sourceId, page) => ({ sourceId, page, access: "local source; not copied to public bundle" });
  window.NUS_VISUALS = window.NUS_VISUALS || {};
  window.NUS_VISUALS["dsa5104-sql-flow"] = { courseCode: "DSA5104", title: "SQL row-to-group flow", kind: "flow+table", source: local("DSA5104/chapter1.pdf", 30), observation: "Trace rows through a key-based join, WHERE filtering, GROUP BY, and HAVING. Use the flow to explain why aggregate predicates cannot move into WHERE." };
  window.NUS_VISUALS["dsa5104-query-pipeline"] = { courseCode: "DSA5104", title: "Query processor pipeline", kind: "flow+diagram", source: local("DSA5104/chapter1.pdf", 40), observation: "Keep parsing, optimization, and evaluation distinct. A physical plan can change while the logical relation result stays fixed." };
  window.NUS_VISUALS["dsa5104-semi-structured"] = { courseCode: "DSA5104", title: "Relational versus nested data", kind: "diagram+comparison", source: local("DSA5104/chapter1.pdf", 16), observation: "Compare tabular identity and constraints with XML/JSON nesting and deferred validation before choosing a representation." };
})();
