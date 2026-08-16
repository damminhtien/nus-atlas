# DSA5105 assessment map

This map turns past-paper evidence into a revision index. It is not an official NUS assessment specification. Local exam PDFs are the strongest assessment evidence in the study folder; public student-upload previews are marked `assessment-derived` and are used only to prioritize practice topics.

## Interactive map

Open the production study map at [DSA5105 Exam & Homework Map](#/nus/assessment-map/DSA5105). The structured source is [assessment-map.json](../content/courses/DSA5105/assessment-map.json); the UI exposes the same evidence graph with filters for past exams, homework, midterm previews, and A+ focus clusters.

The map deliberately keeps four layers separate:

- lecture scope: what the learner must understand;
- local exam evidence: stronger signals from the supplied exam PDFs;
- public previews: assessment-derived signals, not official course scope;
- revision move: the exact derivation, numerical calculation, or explanation to practise.

## Coverage map

| Evidence | Topics visible in the source | Atlas lessons to revise |
| --- | --- | --- |
| AY2024/25 exam PDF | K-means/PCA/whitening, SVM dual, tree depth, neural boundaries and backprop, AdaBoost, MDP policy, Laplacian/spectral clustering, dual ridge/LOO, LS-SVM KKT | `dsa5105-pca-numerical`, `dsa5105-gmm-em-numerical`, `dsa5105-svm-dual-kkt`, `dsa5105-trees-ensembles`, `dsa5105-neural-backprop`, `dsa5105-mdp-value-iteration`, `dsa5105-spectral-clustering`, `dsa5105-ls-svm-loo` |
| AY2025/26 exam PDF | Decision trees, dimensionality reduction, AdaBoost, PCA eigenvectors, nonlinear neural composition, DQN replay, policy value, TD(0), value iteration, Bellman equations, graph kernels, numerical backprop, PCA/SVM formulation, GMM responsibility, dynamic programming, PageRank | `dsa5105-trees-ensembles`, `dsa5105-pca-numerical`, `dsa5105-neural-backprop`, `dsa5105-mdp-value-iteration`, `dsa5105-graph-kernel-pagerank`, `dsa5105-gmm-em-numerical`, `dsa5105-dynamic-programming` |
| Fall 2025 Homework 1 preview | Linear basis, OLS uniqueness, SVM alpha balance/support vectors, validation versus test, weighted empirical risk | `dsa5105-weighted-ols`, `dsa5105-svm-dual-kkt` |
| Fall 2025 Homework 2 preview | Tree depth, AdaBoost coefficient, backprop, bagging/boosting bias–variance, gradient descent, SVM KKT/dual | `dsa5105-trees-ensembles`, `dsa5105-neural-backprop`, `dsa5105-svm-dual-kkt` |
| 2023 Homework 2 preview | Numerical PCA, GMM/EM, shallow neural network, K-means coding | `dsa5105-pca-numerical`, `dsa5105-gmm-em-numerical`, `dsa5105-neural-backprop`, `dsa5105-cluster-gmm` |
| 2023 Homework 3 preview | Computation graph/backprop and MDP value iteration | `dsa5105-neural-backprop`, `dsa5105-mdp-value-iteration` |
| 05/10/2024 midterm preview | Format signal: 5 MCQ + 4 written; decision-tree item is the only public content treated as verified | `dsa5105-trees-ensembles`; use the full local exams for broader topic coverage |

### Public preview links

- [Fall 2025 Homework 1](https://www.studocu.com/sg/document/national-university-of-singapore/scalable-distributed-computing-for-data-science/dsa5105-homework-1-written-assignment-fall-2025-solutions/145862443)
- [Fall 2025 Homework 2](https://www.studocu.com/sg/document/national-university-of-singapore/scalable-distributed-computing-for-data-science/dsa5105-homework-2-written-assignment-solutions-fall-2025/145862450)
- [2023 Homework 2](https://www.coursesidekick.com/computer-science/27344375)
- [2023 Homework 3](https://www.cliffsnotes.com/study-notes/22388019)
- [05/10/2024 midterm preview](https://www.coursehero.com/file/243887732/DSA5105/)

## Source boundary

- Lecture source is the required conceptual core and controls what should be learned first.
- `Textbook.pdf` supplies derivations for margin geometry, KKT, trees, neural networks, PCA, GMM, and Bellman methods.
- Past exams and assignment previews tell us what to practise, not what to present as current lecture truth.
- The third-party Homework 1/2, Homework 2/3, and midterm pages were not copied into the repository. Their previews are summarized, linked in the research record, and represented in Atlas as short normalized prompts.

## Revision order

1. **Derivation foundations:** weighted OLS and uniqueness → SVM primal/dual/KKT → ridge/LS-SVM/LOO.
2. **Model-building algorithms:** tree impurity/depth → bagging/AdaBoost → forward/backward neural differentiation.
3. **Unsupervised numerics:** center/covariance/eigenvectors → reconstruction/whitening → K-means/GMM responsibilities and EM.
4. **Sequential and graph methods:** value-iteration sweeps → TD(0)/replay → DP tables → graph kernels/PageRank → Laplacian/spectral clustering.

For each topic, complete the lesson explanation, reveal the derivation-trace lab, solve the worked example without looking, and then answer the retrieval questions in Exam Mode. A topic is not considered mastered from recognition alone: write the assumption, the recurrence or KKT condition, one numerical check, and one failure mode.
