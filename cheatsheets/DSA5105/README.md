# DSA5105 final revision cheatsheet

`cheatsheet.tex` is the editable Vietnamese revision sheet; `cheatsheet.pdf` is
the compiled deliverable. It combines the user-supplied midterm content with
the shared `../cheatsheet-template.tex` layout: two A4 portrait pages, four
fixed columns per page, read down each column and then left to right. Print
duplex at 100% / actual size.

## Scope

Use the supplied `DSA5105_midterm_cheatsheet_vi.tex` as the first-half content
base and add only subjects supported by the current local lecture slides.
Do not use past papers to infer the current syllabus or add reference-only
subjects. The supplied original remains outside the repository.

- Page 1: learning/linear models, optimization, kernels/SVM, trees/ensembles,
  neural networks, CNNs, and RNNs.
- Page 2: PCA/whitening/feature-space PCA/autoencoders, K-means/GMM, finite
  discounted MDPs, value/policy iteration, MC/TD/Q-learning, and DQN.
  Topic 15 keeps autoencoder MLP architecture, loss, and training together.
- Power iteration/PageRank is limited to the topic introduced in the Deep RL
  slides; no past-paper graph-kernel, spectral-clustering, GNN, LS-SVM,
  leave-one-out, or shortest-path exercises are included. Kernel PCA and
  SARSA are also omitted because they are not in the available slides.

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
fallbacks, with 7.5 pt body text. The build checks all eight column heights
and fails if a column exceeds the printable page height. Auxiliary files and
previews belong in ignored `tmp/pdfs/`. The course PDF is intentionally
tracked, following the convention of `cheatsheets/DSA5104/`.

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
| 25–26 | `DSA5105/DSA5105_Week11_DeepRL.pdf`, pp. 5, 7 | Use the displayed DQN replay/target-network algorithm and the slide's power-iteration/PageRank remarks. |
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
checking this standalone document remain necessary.
