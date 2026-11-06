# DSA5105 final revision cheatsheet

`cheatsheet.tex` is the editable Vietnamese revision sheet; `cheatsheet.pdf` is
the compiled deliverable. It combines the user-supplied midterm content with
the shared `../cheatsheet-template.tex` visual style: two A4 portrait pages,
four columns per page. Fill each column top to bottom before moving right;
unused space stays at the end. Paragraph and section spacing do not stretch.
Print duplex at 100% / actual size.

## Scope

Use the supplied `DSA5105_midterm_cheatsheet_vi.tex` as the first-half content
base and add only subjects supported by the current local lecture slides.
Do not use past papers to infer the current syllabus or add reference-only
subjects. The supplied original remains outside the repository.

- Topics 01–12: learning/linear models, optimization, kernels/SVM, trees/ensembles,
  neural networks, CNNs, and RNNs.
- Topics 13–26: PCA/whitening/feature-space PCA/autoencoders, K-means/GMM, finite
  discounted MDPs, value/policy iteration, MC/TD/Q-learning, and GNN permutation symmetry.
  Topic 15 keeps autoencoder MLP architecture, loss, and training together.
- Topics 25–26 replace the previous DQN and Power Method/PageRank blocks at
  the user's request. They use the current Week 12 GNN slides, focusing on
  permutation invariance/equivariance, shared message passing, and graph readout.
  No past-paper graph-kernel, spectral-clustering, LS-SVM, leave-one-out, or
  shortest-path exercises are included. Kernel PCA and SARSA remain omitted.

The syllabus explicitly excludes the Tuesday Group 2 Week 8 special lecture
from the final and quizzes. The LLM-as-optimizer special topic is omitted.
This is a revision aid; confirm final scope and permitted helpsheet format
with the instructors. File numbering and slide-cover week labels are not
used to override the syllabus.

## Build

Run from the repository root with LuaLaTeX/TeX Live installed:

```sh
mkdir -p tmp/pdfs/dsa5105/build
latexmk -lualatex -interaction=nonstopmode -halt-on-error -file-line-error \
  -outdir=tmp/pdfs/dsa5105/build cheatsheets/DSA5105/cheatsheet.tex
cp tmp/pdfs/dsa5105/build/cheatsheet.pdf cheatsheets/DSA5105/cheatsheet.pdf
```

The source uses the template's Source Sans 3 / STIX Two Math font choices and
fallbacks, with 6.4 pt body text and 7.3 pt line spacing. All formulas use
inline math, including compact matrices; former aligned displays are split
into inline expressions. Fixed paragraph spacing is 0.7 pt and topic spacing
is 3 pt. The `multicols*` environment with `raggedcolumns` fills columns
sequentially without balancing or stretching the last page. Topics can
continue into the next column; the complete autoencoder block stays together.
Require no overfull boxes or missing glyphs in the build log. Auxiliary files
and previews belong in ignored `tmp/pdfs/`. The course PDF is intentionally
tracked, following the convention of `cheatsheets/DSA5104/`.

## Hand-calculation coverage

Every numbered topic has a `CHẠY` procedure and an `EX` example. The sheet
contains 35 procedure blocks and 42 example boxes; procedures that share the
same operations can cover related methods together. New numerical examples
are authored arithmetic illustrations, not past-paper questions. Keep their
intermediate calculations, update order, and loss normalization when editing.

| Topic | Sequential procedure and example coverage |
| --- | --- |
| 01 | Compare empirical objectives; select hyperparameters with fold losses and refit. |
| 02 | Solve OLS/ridge; solve a clipped Huber equation; check lasso signs/zero coordinates; forward probabilities and update logistic/softmax parameters. |
| 03 | Full-batch GD iterations and sample/minibatch SGD gradients. |
| 04 | Kernel validity checks and an explicit negative quadratic form. |
| 05 | Gram construction, KRR solve and prediction; feature distance and polynomial-map expansion. |
| 06 | Active-constraint/KKT calculation for a small hard SVM; a hinge subgradient update. |
| 07 | Enumerate split thresholds, compare classification Gini and regression SSE, then recurse. |
| 08 | Bootstrap, grow trees with RF feature selection, average or vote. |
| 09 | One complete AdaBoost error/weight/normalization round and a weighted final vote. |
| 10 | Forward pass, loss, reverse-layer gradients, simultaneous parameter update. |
| 11 | Sliding cross-correlation, pooling, and summed gradients for shared weights. |
| 12 | Unrolled RNN forward/backward passes and shared-parameter updates. |
| 13 | Center raw observations, form covariance, solve/order eigenpairs, score and reconstruct. |
| 14 | Scale PCA scores, verify unit covariance, invert whitening and restore the mean. |
| 15 | Map then center features and run PCA; jointly train one combined encoder/decoder block. |
| 16 | Coordinate-wise squared distances, hard assignments, coordinate means, direct/shortcut SSE, mean distortion, and stopping; a full 2D distance table before and after the update. |
| 17 | Gaussian MLE and density substitution; prior-weighted mixture density and Bayes normalization. |
| 18 | Complete GMM E-step and M-step from explicit old means, variances, and priors. |
| 19 | Compute returns backward and average action values under a stochastic policy. |
| 20 | Solve exact policy-evaluation equations; compute action candidates before policy average or max. |
| 21 | Synchronous value-iteration sweeps, error-based stopping, and final greedy policy. |
| 22 | Evaluate a policy, compare actions, improve, and repeat until stable. |
| 23 | First-visit versus every-visit MC with repeated states; TD updates with and without terminal continuation. |
| 24 | Epsilon-greedy sampling probabilities; nonterminal and terminal Q-learning updates. |
| 25 | Relabel features and adjacency consistently; prove equivariance/invariance or disprove them with numerical counterexamples. |
| 26 | Synchronous message passing on a four-node chain, two layers, relabelled outputs, and invariant sum readouts. |

For gradient examples, calculate every gradient using the same old weights
before applying the update. EM explicitly uses the new weighted mean in the
covariance update. Synchronous value iteration uses the old value table for
the entire sweep. True terminal transitions have zero continuation value.

## Source map

Source IDs resolve relative to the local NUS archive; raw PDFs are not copied
into this repository. Page numbers are 1-based PDF pages.

| Sheet topics | Source ID / pages | Derived observation |
| --- | --- | --- |
| 01–12 | User-supplied `DSA5105_midterm_cheatsheet_vi.tex`, sections L1–L5 | Condense lecture concepts, formulas, and derivation cues; remove past-paper-specific questions, answer claims, and examples. |
| 01–02 | `DSA5105/Lec1_SL_LinearModels.pdf`, pp. 18–55 | Keep empirical/population risk, basis models, robust losses, regularization, and classification losses. |
| 04–06 | `DSA5105/Lec2_SL_KernelMethods.pdf`, pp. 4–23, 24–46 | Use representer/KRR and the slide's no-intercept SVM convention; do not add an intercept-induced dual equality. |
| 07–09 | `DSA5105/Lec3_SL_DecisionTree.pdf`, pp. 3–34 | Greedy tree splits, bagging/random forests, bias–variance, and sequential boosting. |
| 03, 10 | `DSA5105/Lec4_SL_NN_GD.pdf`, pp. 3–25, 27–52 | Separate approximation, optimization, and efficient chain-rule differentiation. |
| 11–12 | `DSA5105/Lec5_SL_CNN_RNN.pdf`, pp. 13–32, 35–40 | Distinguish weight sharing/locality and equivariance/invariance; sum recurrent gradient contributions. |
| 13–15 | `DSA5105/Lec6_UL_PCA.pdf`, pp. 15–31, 34–60 | Center before PCA; separate scores/reconstruction; use the explicitly taught feature matrix, whitening, autoencoder loss, shallow MLP dimensions, and joint minibatch SGD. |
| 16–18 | `DSA5105/Lec9_UL_K-means_GMM.pdf`, pp. 4–22, 23–39 | Contrast hard assignments with Gaussian posterior responsibilities and weighted parameter updates. |
| 19–20 | `DSA5105/Lec10_RL_MDP_DP.pdf`, pp. 13–44 | Separate policy expectation from optimality maximization under discounted-MDP assumptions. |
| 21–24 | `DSA5105/Lec11_RL.pdf`, pp. 8–20, 25–39 | Distinguish exact model-based backups, sampled returns, TD evaluation, and Q-learning. |
| 25–26 | `DSA5105/DSA5105_Week12_GNN.pptx`, slides 5–18, 22, 32–33 | Relabel both feature rows and adjacency rows/columns; distinguish node equivariance from graph invariance; derive shared-layer symmetry and use the two-layer chain example with sum readout. |
| Scope | `DSA5105/syllabus.pdf`, p. 1 | Preserve the special-lecture exclusion; do not infer a second-half-only final. |

Ridge primarily uses mean half-squared loss, matching the supplied notes and
kernel slides; the source states how the unaveraged convention changes the
normal equations. SVM primarily has no intercept, matching Lecture 2.
Small arithmetic examples illustrate these taught methods rather than
reproducing past-paper questions.

PCA topics 13–15 use raw column samples $x_i$, centered samples
$\tilde x_i=x_i-\bar x$, and a matrix $X$ of centered rows throughout.
Covariance and mean reconstruction error both use the divisor $n$.
$Z$ denotes PCA scores, $\hat X$ centered reconstructions, and $W$ whitened
scores. Feature-space quantities use $\Phi$, $S_\phi$, $U_m^\phi$,
$\Lambda_m^\phi$, and $Z^\phi$ to distinguish them from input-space PCA.
Autoencoders use encoder $E_\theta$ and decoder $D_\psi$; the decoder's
parameter name avoids overloading the feature map $\phi$. The MLP matrices
$W_e$ and $V_d$ distinguish encoder/decoder weights from whitened scores $W$.

Before accepting a rebuilt PDF, require no missing glyphs or overfull boxes,
verify exactly two A4 pages, and inspect both rendered pages. Repository
LaTeX validators cover the app's JSON content; compiling and visually
checking this standalone document remain necessary. Also render every inline
expression with the document's macros, check that all 26 topics retain a
procedure and example, and independently recompute changed numerical examples.
