# DSA5105 final revision cheatsheet

`cheatsheet.tex` is the editable Vietnamese revision sheet; `cheatsheet.pdf` is
the compiled deliverable. It combines the user-supplied midterm content with
the shared `../cheatsheet-template.tex` visual style: two A4 portrait pages,
four columns per page. Fill each column top to bottom before moving right;
unused space stays at the end. Paragraph and section spacing do not stretch.
Print duplex at 100% / actual size.

## Scope

Use the supplied `DSA5105_midterm_cheatsheet_vi.tex` as the first-half content
base and add current local lecture topics or explicit user-supplied additions.
Do not use past papers to infer the current syllabus or add reference-only
subjects. The supplied original remains outside the repository.

- Topics 01–12: learning/linear models, optimization, kernels/SVM, trees/ensembles,
  neural networks, CNNs, residual blocks, and RNNs. The L1–L5 audit adds proof
  examples, feature-scaling arithmetic, entropy splits, and three-step BPTT.
- Topics 13–26: PCA/whitening/feature-space PCA/autoencoders, K-means/GMM, finite
  discounted MDPs, value/policy iteration, MC/TD/Q-learning/DQN, and GNN permutation symmetry.
  Topic 15 keeps autoencoder MLP architecture, loss, and training together.
- Topic 24 merges the user-supplied DQN core into Q-learning: a shared terminal-aware
  target, replay and target networks, ordered training steps, and a gradient example.
- Topics 19–24 share RL notation and all four Bellman equations, separating
  fixed-policy action averages from optimal action choices and environment expectations.
- Topics 25–26 use the current Week 12 GNN slides, focusing on
  permutation invariance/equivariance, shared message passing, graph readout,
  degree-normalized GCN, and dot-product graph attention.
  No past-paper graph-kernel, spectral-clustering, LS-SVM, leave-one-out, or
  shortest-path exercises are included. Kernel PCA and SARSA remain omitted.
- Topics 27–30: Transformers, prioritizing attention arithmetic, Q/K/V dependency,
  additive and causal masks, multi-head calculations, sinusoidal position encoding,
  and permutation equivariance with its conditions.
  Short notes on block roles and GPT training/generation are merged into topics
  27 and 29.
  Topics 27–30 share row-vector notation, token counts, and attention tensors.

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
fallbacks, with 5.7 pt body text and 6.1 pt line spacing. All formulas use
inline math, including compact matrices; former aligned displays are split
into inline expressions. Fixed paragraph spacing is 0.05 pt, topic spacing
is 0.8 pt, and space below topic headers is 0.3 pt. Header padding is 0.5 pt;
note-box padding is 0.15 pt. Topic headings use 6.5 pt text on a 7.1 pt baseline.
`ragged2e` allows normal hyphenation in body text
and notes, using line width without stretching spaces between words.
`microtype` improves line fitting with font expansion and protrusion. Inline
math uses compact thin/medium/thick glue (2/3/4 mu); the fallback gap between
tall body lines is 0.25 pt. These reductions were explicitly requested to
retain the existing examples, add the missing weekly calculation types,
and leave room for further notes.
Wide formula separators use `\;` rather than `\quad` or `\qquad`.
The `multicols*` environment with `raggedcolumns` fills columns sequentially
without balancing or stretching the last page. Topics can continue into the
next column; the complete autoencoder block stays together.
Require no overfull boxes or missing glyphs in the build log. Auxiliary files
and previews belong in ignored `tmp/pdfs/`. The course PDF is intentionally
tracked, following the convention of `cheatsheets/DSA5104/`.

### Transformers / Lecture 13

Four slide-backed Transformer topics include full multi-head arithmetic and
sinusoidal position encoding. Compact notes in topics 27 and 29 cover
block roles, the GPT pipeline, next-token loss, teacher forcing, and generation.
Existing formulas, procedures, and examples are retained. The sheet has two A4
pages, 30 topics, 50 procedures, 64 examples, and 1295 inline formulas. Keep the
5.7 pt body font, 6.1 pt baseline, margins, gutters, and sequential column flow.
Keep slide/page references in the source map below; omit them from printed
headings and examples.

## Hand-calculation coverage

Every numbered topic has a `CHẠY` procedure and an `EX` example. The sheet
contains 50 procedure blocks and 64 example boxes; procedures that share the
same operations can cover related methods together. Numerical examples combine
lecture examples with authored arithmetic illustrations, as recorded in the
source map; no past-paper questions are used. Keep intermediate calculations,
update order, and loss normalization when editing.

The L1–L5 audit retains all 55 preceding examples, extends the SVM, bagging,
and CNN examples, and adds nine examples and four procedures:

| Lecture | Existing coverage retained | Addition after audit |
| --- | --- | --- |
| L1 | ERM/CV calculations and logistic/softmax probabilities and gradients (01–02). | An explicit distribution and observed sample where ERM train loss falls but population risk rises; contrasting linearity in parameters and inputs (01–02). |
| L2 | Ridge/KRR solves, polynomial features, invalid-kernel counterexample, SVM margins/KKT and hinge update (02, 04–06). | Derive the effective ridge penalty after scaling and calculate the compensating lambda; prove a valid polynomial kernel; remove an orthogonal component in a representer example; derive and solve the existing SVM example's dual. |
| L3 | Gini/regression split selection, bagging/RF, one full AdaBoost round (07–09). | Compute entropy and information gain for both candidate splits; derive bagging variance by counting diagonal/off-diagonal covariance terms and extend its numerical example. |
| L4 | GD/SGD and two-layer forward/backward/update calculations (03, 10). | A dead-ReLU example has zero gradient at a positive-loss initialization even though the same model can fit the target; distinguish representability from optimization success. |
| L5 | Tied-weight convolution matrix, shared-weight gradients and RNN/BPTT (11–12). | Instantiate the convolution matrix numerically; add residual forward/branch-gradient arithmetic; unroll three RNN steps, sum shared gradients and update the old parameters. |

The W6–W13 audit retained all 50 existing examples and added five missing
worked examples, with four additional ordered procedures:

| Week | Existing numerical coverage retained | Addition after audit |
| --- | --- | --- |
| W6 | Covariance, eigenpairs, maximum retained variance/minimum error, scores, reconstruction, whitening (13–14). | No duplicate example. |
| W9 | One full 2D K-means round, Gaussian MLE, mixture posteriors, full GMM E/M round, hard/soft assignments (16–18). | No duplicate example. |
| W10 | Returns, policy evaluation, expectation/max Bellman backups (19–20). | One graph with stochastic-policy value, both action values, and optimal value side by side (20). |
| W11 | VI, PI, first/every-visit MC, TD(0), Q-learning, DQN (21–24). | Explicit model-based/model-free and bootstrap classification (23). |
| W12 | Two-layer message passing, relabelled embeddings, invariant readouts and symmetry proofs (25–26). | Two-layer normalized GCN and dot-product graph attention, each with a procedure and numerical example; normalization/attention permutation identities (26). |
| W13 | Attention matrix and dimensions, Q/K/V perturbations, scaling, causal mask, shifted targets and generation (27–30). | Two heads through concatenation/output projection (27); sinusoidal positions and a fixed-position permutation counterexample (30). |

| Topic | Sequential procedure and example coverage |
| --- | --- |
| 01 | Compare empirical objectives; construct a train/population-risk counterexample on a fixed two-point distribution; select hyperparameters with fold losses and refit. |
| 02 | Distinguish input/parameter linearity; solve OLS/ridge; calculate the effective penalty and compensating lambda under feature scaling; solve a clipped Huber equation; check lasso signs/zero coordinates; forward probabilities and update logistic/softmax parameters. |
| 03 | Full-batch GD iterations and sample/minibatch SGD gradients. |
| 04 | Kernel validity checks, an explicit negative quadratic form, a positive polynomial-kernel proof for every dataset, and a numerical representer decomposition. |
| 05 | Gram construction, KRR solve and prediction; feature distance and polynomial-map expansion. |
| 06 | Active-constraint/KKT calculation for a small hard SVM; eliminate primal weights to derive its dual and check matching optimal objectives; a hinge subgradient update. |
| 07 | Enumerate split thresholds, compare Gini, entropy/information gain and regression SSE, then recurse. |
| 08 | Derive and numerically verify the bagging variance from covariance counts; bootstrap, grow trees with RF feature selection, average or vote. |
| 09 | One complete AdaBoost error/weight/normalization round and a weighted final vote. |
| 10 | Forward pass, loss, reverse-layer gradients, simultaneous parameter update; a zero-gradient counterexample to guaranteed optimization success. |
| 11 | Sliding cross-correlation, its numerical sparse matrix, pooling, and summed gradients for shared weights; residual forward pass, skip/branch input gradients and weight update. |
| 12 | Two-step and three-step RNN forward/backward passes and shared-parameter updates. |
| 13 | Center raw observations, form covariance, solve/order eigenpairs, score and reconstruct. |
| 14 | Scale PCA scores, verify unit covariance, invert whitening and restore the mean. |
| 15 | Map then center features and run PCA; jointly train one combined encoder/decoder block. |
| 16 | Coordinate-wise squared distances, hard assignments, coordinate means, direct/shortcut SSE, mean distortion, and stopping; a full 2D distance table before and after the update. |
| 17 | Gaussian MLE and density substitution; prior-weighted mixture density and Bayes normalization. |
| 18 | Complete GMM E-step and M-step from explicit old means, variances, and priors. |
| 19 | Distinguish joint next-state/reward probabilities, marginal transitions, expected rewards, and observed transitions; compute returns backward and average action values under a stochastic policy. |
| 20 | Expand all four Bellman equations using the joint environment law; keep the current action fixed for action values and average or maximize over actions for state values. Solve exact policy-evaluation equations; compute action candidates before policy average or max. On one small graph, compare stochastic-policy values/action values with the optimal values. |
| 21 | Synchronous value-iteration sweeps, error-based stopping, and final greedy policy. |
| 22 | Evaluate a policy, compare actions, improve, and repeat until stable. |
| 23 | First-visit versus every-visit MC with repeated states; TD updates with and without terminal continuation; classify model access and bootstrap use. |
| 24 | Epsilon-greedy sampling probabilities; nonterminal and terminal Q-learning updates. Run DQN replay sampling, a frozen-target gradient step, and periodic target copying; reuse the numerical target to calculate MSE, its gradient, and the new parameter. |
| 25 | Relabel features and adjacency consistently using the grouped permutation inverse/orthogonality identities; prove equivariance/invariance or disprove them with numerical counterexamples. |
| 26 | Synchronous message passing on a four-node chain, two layers, relabelled outputs, and invariant sum readouts. Compute self-loop degrees and symmetric GCN normalization for two layers; compute allowed-edge dot-product scores, neighbor softmax, weighted aggregation, and a second attention layer. |
| 27 | Compute projections, scaled logits, row softmax, and weighted values; check self/cross-attention Q/K/V, score, and output shapes, including equal key/value counts. Work the lecture's three-key example and compare scaled/unscaled weights. Project two separate heads, form both attention matrices, concatenate outputs, and apply an explicit output matrix. Identify the roles of attention, shared FFN, residual updates, and tokenwise LayerNorm. |
| 28 | Trace changes to Q, K, V, or an input token; check orthogonal key perturbations and row-constant softmax shifts, restricting masked conditions to allowed keys. Recompute a value perturbation, key perturbation, and zero query from the same starting data. |
| 29 | Apply additive masks and calculate a three-token causal example; shift language-model targets, calculate sequence probability and summed/mean NLL, then greedily append tokens until eos. |
| 30 | Recompute attention after a token swap, verify output equivariance, and use a fixed causal mask as a numerical counterexample. Calculate sinusoidal positions in radians, add token embeddings, and compare fixed versus jointly permuted positions. |

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
| 01–02 (proof examples) | `DSA5105/Lec1_SL_LinearModels.pdf`, pp. 23–24, 33, 39–42 | The two-point ERM/generalization counterexample and parameter-versus-input linearity examples are authored illustrations of the risk and fixed-feature definitions. |
| 04–06 | `DSA5105/Lec2_SL_KernelMethods.pdf`, pp. 4–23, 24–46 | Use representer/KRR and the slide's no-intercept SVM convention; do not add an intercept-induced dual equality. |
| 02, 04, 06 (derivations) | `DSA5105/Lec2_SL_KernelMethods.pdf`, pp. 13–17, 43–44 | Derive the scaling rule by changing coordinates in the ridge objective, assuming all coefficients are penalized. The valid-kernel and representer examples are authored. Expand the SVM Lagrangian after stationarity, then solve the existing one-dimensional example's dual without an intercept equality constraint. |
| 07–09 | `DSA5105/Lec3_SL_DecisionTree.pdf`, pp. 3–34 | Greedy tree splits, bagging/random forests, bias–variance, and sequential boosting. |
| 07–08 (entropy / variance) | `DSA5105/Lec3_SL_DecisionTree.pdf`, p. 19, pp. 25–30; retained bagging covariance assumptions | Compute entropy using the sheet's base-2 convention; derive the retained equal-variance/common-correlation formula by expanding variance as a double covariance sum. The arithmetic examples are authored. |
| 03, 10 | `DSA5105/Lec4_SL_NN_GD.pdf`, pp. 3–25, 27–52 | Separate approximation, optimization, and efficient chain-rule differentiation. |
| 10 (optimization example) | `DSA5105/Lec4_SL_NN_GD.pdf`, pp. 8–9, 25, 37, 45–52 | The dead-ReLU example is an authored existence-versus-optimization counterexample; it does not assert universal approximation for a fixed single-unit network. |
| 11–12 | `DSA5105/Lec5_SL_CNN_RNN.pdf`, pp. 13–32, 35–40 | Distinguish weight sharing/locality and equivariance/invariance; sum recurrent gradient contributions. |
| 11–12 (matrix / BPTT) | `DSA5105/Lec5_SL_CNN_RNN.pdf`, pp. 26, 37–39 | Instantiate the tied-weight matrix using the existing convolution data. The three-step recurrent example is authored, uses final-only loss, and computes all shared gradients from the same old parameters. |
| 11 (residual block) | User-requested ResNet/residual-connections topic; chain-rule calculation | Define an additive identity-skip block and derive the sum of skip and branch gradients. The linear residual block, its gradients and update are authored examples; this row records the user-requested addition separately from the lecture slide coverage. |
| 13–15 | `DSA5105/Lec6_UL_PCA.pdf`, pp. 15–31, 34–60 | Center before PCA; separate scores/reconstruction; use the explicitly taught feature matrix, whitening, autoencoder loss, shallow MLP dimensions, and joint minibatch SGD. |
| 16–18 | `DSA5105/Lec9_UL_K-means_GMM.pdf`, pp. 4–22, 23–39 | Contrast hard assignments with Gaussian posterior responsibilities and weighted parameter updates. |
| 19–20 | `DSA5105/Lec10_RL_MDP_DP.pdf`, pp. 13–44 | Separate policy expectation from optimality maximization under discounted-MDP assumptions. The joined stochastic-policy/optimal-value example is authored arithmetic on the same two-state graph used in VI/PI. |
| 19–24 (RL notation / Bellman expansion) | User-supplied four Bellman equations and interpretation | Merge the joint-law expansions into topic 20 instead of adding another section. Use uppercase value functions, marginal transition probabilities and expected rewards consistently in exact evaluation, VI and PI. Distinguish random variables from observed transitions, deterministic policies from stochastic policies, and true values from estimates; keep terminal-aware sampled targets in TD/Q-learning/DQN. |
| 21–24 | `DSA5105/Lec11_RL.pdf`, pp. 8–20, 25–39 | Distinguish exact model-based backups, sampled returns, TD evaluation, and Q-learning. |
| 24 (DQN) | User-supplied DQN Core formulas and mechanism summary | Use a neural Q-function, frozen target network, random replay minibatches, and periodic hard copying. The done flag extends the supplied nonterminal target to true terminal transitions; the one-transition identity-output gradient example is authored arithmetic. |
| 25–26 | `DSA5105/Lec12_GNN.pptx`, slides 5–18, 22, 32–33 | Group the permutation inverse/orthogonality identities with feature/adjacency relabeling; distinguish node equivariance from graph invariance; derive shared-layer symmetry and use the two-layer chain example with sum readout. |
| 26 (GCN / attention) | `DSA5105/Lec12_GNN.pptx`, slides 24–25, 34 | Translate the nodewise symmetric self-loop GCN and query/key dot-product neighbor attention into row-embedding notation. The three-node, two-layer calculations and permutation identities are authored derivations. Attention uses only listed neighbors; its example omits self-loops and chooses the shared update as ReLU of the aggregate. |
| 27 | `DSA5105/Lec13_Transformers.pdf`, pp. 8–16; user-requested Q/K/V notation | Use row softmax, projection dimensions, and scaling by the key dimension; reproduce the three-key attention example and the scaled-logit comparison. Derive the self/cross-attention token counts and token-to-token versus Q/K feature-to-feature product shapes from matrix dimensions. The transposed-query product requires equal query/key token counts; multiplying attention weights by values requires equal key/value counts. |
| 27 (multi-head) | `DSA5105/Lec13_Transformers.pdf`, pp. 18–19 | Use separate projections per head, feature concatenation, and a learned output projection. The two-head identity-input example explicitly computes both attention matrices, head outputs, concatenation, and output multiplication. |
| 27 (block roles) | `DSA5105/Lec13_Transformers.pdf`, pp. 22–23 | Distinguish token mixing, shared feature transforms, residual updates, and per-token feature normalization; retain the slide's post-norm convention. |
| 28 | `DSA5105/Lec13_Transformers.pdf`, pp. 9–11, 16–17 | Derive separate Q/K/V dependencies from the computation graph; distinguish a tensor perturbation from an input change and calculate explicit perturbations. The user-supplied unchanged-score and softmax-shift conditions follow algebraically; the row-shift equivalence assumes finite logits and applies only on allowed keys with a fixed mask. |
| 29 | `DSA5105/Lec13_Transformers.pdf`, pp. 4, 17, 29–32 | Reproduce the masked-key calculation; derive a three-token causal calculation with shifted targets, diagonal access, and zero future weights. |
| 29 (GPT) | `DSA5105/Lec13_Transformers.pdf`, pp. 28–34 | Condense the decoder pipeline, self-supervised next-token NLL, teacher forcing, and greedy generation. The short probability/loss and generation examples are authored arithmetic illustrations of these procedures. |
| 30 | `DSA5105/Lec13_Transformers.pdf`, pp. 22–25, 32 | Start from permuted token rows and derive the attention-weight transformation, distinguishing it from input adjacency relabeling in GNNs. Calculate a token-swap example and fixed-causal-mask counterexample. Joint permutation of a general mask is a derived extension of the lecture proof. |
| 30 (positions) | `DSA5105/Lec13_Transformers.pdf`, p. 25 | Keep the sinusoidal even/odd feature convention. The two-position numerical example is authored, uses zero-based positions and radians, and shows why holding position vectors fixed breaks arbitrary permutation equivariance of the encoding map. |
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

RL topics 19–24 use $V^\pi,Q^\pi$ for fixed-policy values and $V^*,Q^*$
for optimal values. Plain $V,Q$ are estimates; $V_k,Q_k$ belong to sweep $k$.
$p(s',r\mid s,a)$ is the joint next-state/reward law, $P(s'\mid s,a)$ its
next-state marginal, and $\bar r(s,a)$ the expected one-step reward.
$S_t,A_t,R_{t+1}$ (or one-step $S',R$) are random variables;
$(s,a,r,s',d)$ denotes an observed transition, with $d=1$ for a true terminal.
$\pi(a\mid s)$ is stochastic; $\mu(s)$ selects a deterministic action and
$\mu^+$ is its policy-improvement update. The current action is fixed in
both action-value equations: only future actions follow $\pi$ or optimize.
State values average over actions for $\pi$ and maximize for optimality.
MC/TD estimate $V^\pi$; Q-learning/DQN aim at $Q^*$, with $\bar Q$ denoting
the bootstrap function ($Q$ for tabular learning, $Q_{\theta^-}$ for DQN).
TD uses the same terminal flag convention, and DQN's target is frozen during
the gradient step. All existing worked examples retain their numerical data.

Attention topics 27–30 use token rows throughout: $N_q$, $N_k$, and $N_v$
count query, key, and value tokens; $D$ is the input/output embedding width;
$d_k$ and $d_v$ are per-head query/key and value widths.
Standard attention requires $N_k=N_v$; self-attention additionally sets
$N_q=N_k=N_v=N$, while cross-attention can have different query/key counts.
Query rows use index $i$ and key/value rows index $j$.
$S$ is the scaled score matrix, $M$ the additive mask, $L=S+M$ the masked
logits, $A$ the row-softmax weights, and $Y=AV$ the single-head output.
Head $r$ uses $Q_r,K_r,V_r,A_r,H_r$ and separate projection weights;
the concatenated output is $Y_{\rm MH}$ with $N_q$ rows. Key perturbations
therefore use the row-vector product $q_i\Delta k_j^\top$.
Position vectors are also rows, with $X_{\rm pos}=X+E_{\rm pos}$;
GPT sequence length uses $N$.

Before accepting a rebuilt PDF, require no missing glyphs or overfull boxes,
verify exactly two A4 pages, and inspect both rendered pages. Repository
LaTeX validators cover the app's JSON content; compiling and visually
checking this standalone document remain necessary. Also render every inline
expression with the document's macros, check that all 30 topics retain a
procedure and example, and independently recompute changed numerical examples.
