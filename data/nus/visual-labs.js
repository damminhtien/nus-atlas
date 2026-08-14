(function () {
  "use strict";
  const lecture = (page, role) => ({ sourceId: "DSA5105/syllabus.pdf", page, sourceType: "lecture", role, status: "current" });
  const textbook = (page, role) => ({ sourceId: "DSA5105/Textbook.pdf", page, sourceType: "textbook", role, status: "course-depth" });
  const reference = (sourceId, role) => ({ sourceId, page: 1, sourceType: "ref", role, status: "optional" });
  window.NUS_VISUAL_LABS = {
    "dsa5105-erm": {
      courseCode: "DSA5105", lessonId: "dsa5105-erm", type: "compare", title: "Train–validation gap lab",
      learningGoal: "Use a held-out validation signal to choose a model complexity instead of celebrating training fit alone.",
      sourceRefs: [lecture(1, "current scope"), textbook(33, "model selection depth")],
      initialState: { complexity: 42 }, check: state => state.complexity >= 35 && state.complexity <= 80, reducedMotion: true, explanation: "The useful choice is near the lowest validation risk, not necessarily the lowest training risk."
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
    }
  };
})();
