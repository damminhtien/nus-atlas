/* NUS formula and critique layer.
   Formula strings are raw LaTeX; the NUS renderer wraps them in display math and KaTeX renders them. */
(function () {
  "use strict";
  const sym = (latex, meaning) => ({ latex, meaning });
  const eq = (latex, explanation, symbols, sourceType, caveat) => ({ latex, explanation, symbols: symbols || [], sourceType: sourceType || "lecture", ...(caveat ? { caveat } : {}) });
  const crit = (prompt, angle, modelAnswer, focus) => ({ prompt, angle, modelAnswer, focus: focus || "assumption" });
  const lessonById = id => Object.values(window.NUS_CONTENT || {}).flatMap(c => (c.modules || []).flatMap(m => m.lessons || [])).find(l => l.id === id);
  const add = (id, math, criticalQuestions) => {
    const l = lessonById(id);
    if (!l) return;
    l.math = [...(l.math || []), ...math];
    l.criticalQuestions = criticalQuestions;
  };

  add("dsa5101-orientation", [
    eq(String.raw`T_{\mathrm{total}} \approx p\,T_{\mathrm{scan}} + T_{\mathrm{shuffle}} + T_{\mathrm{sync}}`, "Use this as a study model, not a universal theorem. A scalable algorithm tries to keep the number of full scans $p$ small and makes network movement and synchronization visible instead of hiding them inside a single runtime number.", [sym(String.raw`p`, "number of passes over the data"), sym(String.raw`T_{\mathrm{shuffle}}`, "time spent moving data between workers"), sym(String.raw`T_{\mathrm{sync}}`, "time spent waiting for coordination")], "lecture", "The decomposition is a diagnostic lens; real runtimes also depend on skew, caching, serialization, and hardware."),
  ], [
    crit("If two implementations have the same Big-O time, which one would you choose for a dataset larger than main memory?", "Compare passes, peak memory, network movement, skew, and recovery behavior rather than stopping at asymptotic notation.", "A one-pass or streaming design may win because it avoids repeated reads and keeps the working set bounded, even when both methods have the same formal order.", "systems trade-off"),
    crit("What evidence would falsify the claim that an algorithm is scalable?", "Design a measurement that changes the input size, worker count, and partition distribution separately.", "A flattening throughput curve, rapidly increasing shuffle time, or a single hot partition would contradict a simple scale-out claim.", "evidence")
  ]);

  add("dsa5101-frequent-itemsets", [
    eq(String.raw`\operatorname{supp}(I) = \frac{|\{t \in \mathcal{T}: I \subseteq t\}|}{|\mathcal{T}|}`, "Support asks how often every item in $I$ appears together. The numerator counts qualifying baskets; the denominator is the full transaction count. Keep the count and normalized fraction distinct when reporting an answer.", [sym(String.raw`I`, "candidate itemset"), sym(String.raw`\mathcal{T}`, "set of baskets"), sym(String.raw`I \subseteq t`, "basket $t$ contains every item in $I$")], "lecture"),
    eq(String.raw`\operatorname{conf}(A \to B) = \frac{\operatorname{supp}(A \cup B)}{\operatorname{supp}(A)}`, String.raw`Confidence conditions on baskets that already contain $A$. That is why the denominator is $\operatorname{supp}(A)$ rather than the total number of baskets. A high confidence can still be uninteresting when $B$ is common everywhere.`, [sym(String.raw`A \to B`, "association rule"), sym(String.raw`A \cup B`, "baskets containing both sides")], "lecture"),
    eq(String.raw`\operatorname{lift}(A \to B) = \frac{\operatorname{conf}(A \to B)}{\operatorname{supp}(B)}`, "Lift compares the rule's conditional rate with the base rate of $B$. A value above $1$ means $B$ is more common when $A$ is present than it is overall; it does not prove causation.", [sym(String.raw`\operatorname{supp}(B)`, "base rate of the consequent"), sym(String.raw`\operatorname{lift}>1`, "positive association under this measure")], "lecture", "Lift is sensitive to rare consequents and should be read with support counts."),
  ], [
    crit("Can a rule have high confidence and still be useless? Construct a counterexample.", "Make $B$ very common and compare the confidence with the base rate of $B$.", "Yes. If $B$ appears in almost every basket, then $A\to B$ can have high confidence without $A$ adding much information; lift exposes that issue.", "counterexample"),
    crit("Why does downward closure justify pruning, and what does it not justify?", "Separate a guaranteed support property from a heuristic about predictive usefulness.", "If a set is infrequent, every superset is also infrequent, so pruning is safe for frequent-itemset discovery. It says nothing about confidence, lift, or causal value.", "scope")
  ]);

  add("dsa5101-minhash-lsh", [
    eq(String.raw`\Pr\bigl[h_{\pi}(A)=h_{\pi}(B)\bigr] = J(A,B) = \frac{|A\cap B|}{|A\cup B|}`, "Under a random permutation, the probability that the minimum hashed element agrees is exactly the Jaccard similarity. Repeating permutations gives an estimator whose collision frequency approaches $J(A,B)$.", [sym(String.raw`h_{\pi}`, "minimum-hash value under permutation $\pi$"), sym(String.raw`J(A,B)`, "Jaccard similarity"), sym(String.raw`A\cap B`, "shared elements")], "lecture"),
    eq(String.raw`P_{\mathrm{candidate}} = 1 - \bigl(1-s^r\bigr)^b`, "A band matches when all $r$ rows in that band match. The pair becomes a candidate if at least one of the $b$ bands matches, so compute one-minus-the-probability that every band fails.", [sym(String.raw`s`, "similarity estimate"), sym(String.raw`r`, "rows per band"), sym(String.raw`b`, "number of bands")], "lecture", "LSH trades false positives and false negatives by changing $b$ and $r$; it is not an exact similarity test."),
  ], [
    crit("Why can LSH return a false positive even when the exact Jaccard similarity is low?", "Inspect the event 'at least one band matches' rather than treating a candidate as a confirmed neighbor.", "A random collision in one band is enough to pass the candidate filter. Exact similarity must be computed afterward if the application needs precision.", "false positive"),
    crit("What happens when you increase the number of rows per band while keeping the number of bands fixed?", "Examine the exponent $s^r$ and discuss the competing effect on similar and dissimilar pairs.", "The threshold becomes sharper: high-similarity pairs are more likely to match a full band, while moderate-similarity pairs are less likely to pass.", "parameter sensitivity")
  ]);

  add("dsa5101-ranking-streams", [
    eq(String.raw`\operatorname{PR}(i) = \frac{1-d}{N} + d\sum_{j\to i}\frac{\operatorname{PR}(j)}{\operatorname{outdeg}(j)}`, "PageRank combines a uniform teleportation term with rank flowing through incoming links. The damping factor $d$ prevents the walk from getting trapped forever in a sink or closed component.", [sym(String.raw`d`, "damping probability"), sym(String.raw`N`, "number of pages or nodes"), sym(String.raw`\operatorname{outdeg}(j)`, "number of outgoing links from $j$")], "lecture", "Dangling nodes need an explicit convention, such as redistributing their mass uniformly."),
    eq(String.raw`\widehat{n}_{\mathrm{distinct}} \approx 2^R`, "Flajolet–Martin-style reasoning uses the longest observed zero-prefix $R$ in hashed stream values. A long zero-prefix is rare for one item, so it suggests that many distinct items were sampled; practical estimators use bias correction and multiple registers.", [sym(String.raw`R`, "maximum zero-prefix length"), sym(String.raw`\widehat{n}_{\mathrm{distinct}}`, "approximate number of distinct items")], "lecture", "The one-register expression is a teaching approximation and has high variance."),
  ], [
    crit("Why is PageRank not the same as counting incoming links?", "Compare a link from an important page with many links to a link from a low-ranked page.", "PageRank weights incoming mass by the source's rank and out-degree, then adds teleportation; raw indegree treats every link equally.", "model comparison"),
    crit("What kind of error is acceptable for a stream sketch, and who decides?", "Tie the error tolerance to the downstream decision rather than treating approximation as automatically good.", "A dashboard may accept a bounded approximate count, while billing or compliance may require an exact count. Memory savings are useful only relative to that decision risk.", "requirements")
  ]);

  add("dsa5104-orientation", [
    eq(String.raw`r \subseteq D_1 \times D_2 \times \cdots \times D_n`, "A relation is a set of tuples drawn from attribute domains. The schema describes the domains and constraints; the instance is the finite set of tuples currently stored.", [sym(String.raw`r`, "relation instance"), sym(String.raw`D_i`, "domain of attribute $i$"), sym(String.raw`\times`, "Cartesian product of possible values")], "lecture"),
  ], [
    crit("Why is a database schema more than a list of column names?", "Look for domains, keys, nullability, and integrity constraints that rule out invalid states.", "A schema defines the allowed structure and constraints. Without them, the system can store ambiguous or contradictory instances even if the columns look correct.", "data integrity"),
    crit("What evidence would make a data-cleaning decision reproducible?", "Ask what changed, why it changed, and how another person can verify the result.", "Record the input rule, transformation, rejected or imputed rows, and a validation query or summary statistic.", "auditability")
  ]);

  add("dsa5104-relational-model", [
    eq(String.raw`\forall t_1,t_2\in r:\ t_1[K]=t_2[K]\Rightarrow t_1=t_2`, "A candidate key $K$ uniquely identifies a tuple: if two rows agree on all key attributes, they must be the same row. A primary key chooses one candidate key to enforce as the main identity.", [sym(String.raw`K`, "candidate key attributes"), sym(String.raw`t[K]`, "projection of tuple $t$ onto $K$"), sym(String.raw`\Rightarrow`, "logical implication")], "lecture"),
    eq(String.raw`\mathrm{Student.department\_id}\ ` + "\\xrightarrow" + String.raw`{\mathrm{FK}}\ \mathrm{Department.id}`, "For a one-to-many relationship, place the referenced key on the many side. Many students can carry the same department identifier, while each identifier must point to an existing department unless nullability is explicitly allowed.", [sym(String.raw`\mathrm{FK}`, "foreign-key constraint"), sym(String.raw`\mathrm{PK}`, "primary-key identity")], "lecture"),
  ], [
    crit("What goes wrong if the foreign key is placed on the one side of a one-to-many relationship?", "Try representing one department with many students without repeating or nesting values.", "A single department row cannot hold an unbounded set of student identities in a first-normal-form relation; placing the key on Student preserves one value per row and avoids repeating department data.", "schema design"),
    crit("Can a primary key be technically unique but still be a bad business identifier?", "Separate database uniqueness from stable, meaningful identity.", "Yes. A generated row number may be unique but not stable across systems or meaningful to users; the choice depends on lifecycle, integration, and update requirements.", "identity")
  ]);

  add("dsa5104-sql-foundations", [
    eq(String.raw`\gamma_{\mathrm{department\_id};\ \operatorname{COUNT}(*)\to n}(\mathrm{Student})`, "The grouping operator partitions rows by department and computes one count per group. Conceptually, `WHERE` reduces rows before grouping, while `HAVING` filters the grouped result after the aggregate exists.", [sym(String.raw`\gamma`, "grouping and aggregation"), sym(String.raw`n`, "count produced for each group")], "lecture"),
    eq(String.raw`\mathrm{WHERE}\ \prec\ \mathrm{GROUP\ BY}\ \prec\ \mathrm{HAVING}`, "This is a reasoning order, not a claim about the textual order of every SQL implementation. First decide which rows participate, then form groups, then filter aggregate groups.", [sym(String.raw`\prec`, "conceptually happens before")], "lecture", "SQL optimizers may rewrite execution plans while preserving relational semantics."),
  ], [
    crit("Why can moving an aggregate predicate from `HAVING` to `WHERE` change the answer?", "Ask whether the predicate refers to an individual row or to a group summary.", "`WHERE` cannot use the final group count because it runs before grouping. Moving the predicate changes which rows enter the groups rather than filtering completed groups.", "query semantics"),
    crit("When could an optimizer move a filter earlier without changing the result?", "Look for predicates that reference only row-local attributes and preserve NULL/join semantics.", "A safe pushdown is possible when the predicate is independent of aggregates and does not alter outer-join behavior; correctness comes before speed.", "optimization")
  ]);

  add("dsa5104-semi-structured", [
    eq(String.raw`T_{\mathrm{total}} \approx T_{\mathrm{parse}} + T_{\mathrm{shuffle}} + T_{\mathrm{compute}} + T_{\mathrm{write}}`, "Semi-structured and distributed workflows add costs beyond the logical query. Parsing nested records, moving rows across partitions, computing the transformation, and writing the result are separate places to measure.", [sym(String.raw`T_{\mathrm{parse}}`, "schema-on-read parsing cost"), sym(String.raw`T_{\mathrm{shuffle}}`, "network data movement"), sym(String.raw`T_{\mathrm{write}}`, "materialization cost")], "lecture", "This is an engineering decomposition, not an exact runtime law."),
  ], [
    crit("When is schema-on-read the wrong choice even if ingestion flexibility is attractive?", "Consider repeated consumers, strict governance, latency, and the cost of discovering errors late.", "If many consumers need the same stable semantics or correctness must be enforced at ingestion, a validated schema-on-write boundary may reduce duplicated downstream work.", "architecture"),
    crit("Why can a short SQL query still trigger an expensive distributed job?", "Trace partitioning, joins, shuffles, serialization, and synchronization rather than counting SQL tokens.", "The logical query hides physical movement. A group-by or join can require a wide exchange even when the query text is only a few lines.", "physical plan")
  ]);

  add("dsa5104-database-design", [
    eq(String.raw`R_1(K_1, A),\quad R_2(K_2, B),\quad R_{AB}(K_1,K_2)`, "A many-to-many relationship is represented by a relationship relation containing the keys of both participating entities. Add relationship attributes to the same relation and enforce both foreign-key links.", [sym(String.raw`K_1,K_2`, "referenced entity keys"), sym(String.raw`R_{AB}`, "relationship relation")], "exercise"),
  ], [
    crit("Why is a composite key useful in the relationship relation?", "Ask which duplicate relationship instance should be rejected.", "The pair $(K_1,K_2)$ identifies one relationship occurrence, so the same two entities cannot be linked twice unless the model includes another distinguishing attribute.", "integrity"),
    crit("When should a relationship attribute live in the relationship relation rather than an entity relation?", "Place the attribute where one value describes the association itself, not either endpoint alone.", "An attribute such as enrollment date belongs with $R_{AB}$ because it describes the pair of participating entities; placing it on one entity would lose the possibility of different values for different relationships.", "attribute ownership")
  ]);

  add("dsa5104-query-processing", [
    eq(String.raw`Q ` + "\\xrightarrow{\\mathrm{parse/translate}} Q' " + "\\xrightarrow{\\mathrm{optimize}} P " + "\\xrightarrow{\\mathrm{evaluate}} r", "The query processor turns a declarative query into an internal form, selects a physical plan, and evaluates that plan to produce a relation. The stages can be optimized internally while preserving the same logical result.", [sym(String.raw`Q`, "declared SQL query"), sym(String.raw`P`, "chosen physical evaluation plan"), sym(String.raw`r`, "result relation")], "lecture"),
  ], [
    crit("What must remain invariant when the optimizer changes the plan?", "Separate the access path and operator order from the relation the query promises.", "The logical result relation must remain the same; only the physical route, such as an index lookup versus a scan, changes.", "semantic preservation"),
    crit("Why is an index not automatically faster than a full table scan?", "Compare the number of qualifying rows, index locality, and the cost of fetching the base tuples.", "For a highly selective predicate an index can avoid most pages, but when many rows qualify the random lookups and index traversal can cost more than a sequential scan.", "access-path trade-off")
  ]);

  add("dsa5104-transactions-architecture", [
    eq(String.raw`\mathrm{transfer}(A,B,a):\quad A\leftarrow A-a,\quad B\leftarrow B+a`, "A transfer is one logical function even though it contains multiple reads and writes. Atomic transaction semantics prevent a failure between the updates from exposing only one side of the transfer.", [sym(String.raw`A,B`, "account states"), sym(String.raw`a`, "transfer amount")], "lecture"),
  ], [
    crit("Why does transaction scope follow the business function rather than one SQL statement?", "Find the failure point between two individually valid updates.", "The business invariant links both updates. A transaction groups them so the database cannot commit only one half after a crash or abort.", "atomicity"),
    crit("How is isolation different from atomicity in the transfer example?", "Separate an all-or-nothing outcome from the visibility of concurrent intermediate states.", "Atomicity prevents a partial transfer from committing; isolation controls whether another transaction can observe or interfere with intermediate work before the transfer commits.", "concurrency")
  ]);

  add("dsa5208-orientation", [
    eq(String.raw`T_{\mathrm{job}} = T_{\mathrm{compute}} + T_{\mathrm{network}} + T_{\mathrm{coordination}}`, "A distributed experiment should report more than compute time. Network transfer and coordination barriers can dominate as the worker count grows, so record them separately whenever the system exposes them.", [sym(String.raw`T_{\mathrm{network}}`, "communication time"), sym(String.raw`T_{\mathrm{coordination}}`, "barrier, scheduling, and coordination time")], "lecture"),
  ], [
    crit("Why might adding workers make a job slower?", "Look for fixed work, partition overhead, synchronization, network traffic, and skew.", "When coordination and communication grow faster than useful parallel work, the added workers increase overhead instead of throughput.", "scalability"),
    crit("What measurement separates a network bottleneck from a compute bottleneck?", "Compare stage-level compute time, bytes transferred, and time waiting at barriers as worker count changes.", "A rising transfer or coordination share with stable per-worker compute points to communication or synchronization overhead rather than a purely computational limit.", "measurement")
  ]);

  add("dsa5208-happens-before", [
    eq(String.raw`e \to f \iff (e\text{ precedes }f\text{ locally})\ \lor\ (e=\mathrm{send}(m),\ f=\mathrm{receive}(m))\ \lor\ (\exists g:\ e\to g\land g\to f)`, "The happens-before relation is generated by local program order and send-before-receive, then closed transitively. Two events are concurrent when neither direction can be derived.", [sym(String.raw`\to`, "happens-before relation"), sym(String.raw`m`, "message connecting a send to a receive")], "lecture"),
  ], [
    crit("Can a total order of events prove causality?", "Compare a consistent tie-breaker with evidence that one event could have influenced another.", "No. A total order can serialize concurrent events for implementation convenience, but it may invent an order that is not causal.", "causality"),
    crit("How would you build a counterexample to the converse of happens-before?", "Find two events with ordered scalar timestamps but no local or message path between them.", "Choose concurrent events on separate processes and assign them a legal total tie-breaker. The scalar order exists, but no causal path proves influence.", "counterexample")
  ]);

  add("dsa5208-lamport-vector", [
    eq(String.raw`L_{\mathrm{recv}} \leftarrow \max\bigl(L_{\mathrm{local}},L_{\mathrm{msg}}\bigr)+1`, "A Lamport clock advances on every local event and on receipt of a timestamped message. The receive rule guarantees that if $e\to f$, then $L(e)<L(f)$, but the converse is not guaranteed.", [sym(String.raw`L_{\mathrm{local}}`, "receiver's clock before delivery"), sym(String.raw`L_{\mathrm{msg}}`, "timestamp carried by the message")], "lecture", "Lamport clocks preserve causality but cannot identify every pair of concurrent events."),
    eq(String.raw`x \prec y \iff \bigl(\forall i,\ x_i\le y_i\bigr)\land\bigl(\exists j,\ x_j<y_j\bigr)`, "Vector $x$ precedes vector $y$ when every component is no larger and at least one is strictly smaller. If neither vector dominates the other, the events are concurrent under the tracked processes.", [sym(String.raw`x_i`, "event count known for process $i$"), sym(String.raw`\prec`, "causal precedence")], "lecture"),
  ], [
    crit("What information is lost when a vector clock is compressed into one Lamport number?", "Find two incomparable vectors that receive a valid scalar order.", "The scalar preserves the implication from causality to increasing timestamps but loses the ability to distinguish concurrency from one possible causal order.", "information loss"),
    crit("What happens if one process is omitted from the vector?", "Consider an event that depends on the omitted process and ask whether the remaining components can prove it.", "The truncated vector can miss a causal dependency, so the comparison is only valid for the processes and events represented in the vector.", "model boundary")
  ]);

  add("dsa5208-consistency-spark", [
    eq(String.raw`T_{\mathrm{pipeline}} \approx T_{\mathrm{local}} + T_{\mathrm{shuffle}} + T_{\mathrm{barrier}}`, "Map-like operations can often stay partition-local, while joins, group-bys, and global sorts may require a shuffle. The equation forces the experiment to name the data movement and synchronization costs instead of treating the pipeline as one opaque step.", [sym(String.raw`T_{\mathrm{local}}`, "work within existing partitions"), sym(String.raw`T_{\mathrm{barrier}}`, "waiting for stage coordination")], "lecture"),
  ], [
    crit("Why is consistency a user-visible guarantee, not just a storage setting?", "Describe what a user can observe after a write, failover, or concurrent update.", "Consistency defines which reads and orderings an application may rely on; the same storage system can be acceptable or unsafe depending on the product guarantee required.", "semantics"),
    crit("What workload would expose shuffle skew that average runtime hides?", "Construct one hot key and compare partition-level times rather than only the mean.", "A hot key can send disproportionate data to one partition, creating a straggler while other workers wait at the barrier.", "diagnostics")
  ]);

  add("dsa5105-kernel-pca-cluster", [
    eq(String.raw`k(x,z)=\langle\phi(x),\phi(z)\rangle`, "A valid kernel gives the inner product that would be obtained after mapping inputs through $\phi$, without requiring us to build the transformed coordinates explicitly. The kernel changes the geometry available to a method such as a kernel SVM or kernel PCA.", [sym(String.raw`k(x,z)`, "kernel similarity between inputs"), sym(String.raw`\phi`, "implicit feature map"), sym(String.raw`\langle\cdot,\cdot\rangle`, "inner product")], "lecture", "A kernel is not automatically a probability or a distance; its role depends on the algorithm using it."),
    eq(String.raw`\operatorname{Var}(v^\top X)=v^\top\Sigma v`, "PCA evaluates how much centered data varies after projection onto a unit direction $v$. The covariance matrix stores pairwise feature variation; the quadratic form selects the variance visible along $v$.", [sym(String.raw`v`, "unit projection direction"), sym(String.raw`\Sigma`, "covariance matrix"), sym(String.raw`v^\top X`, "projected data")], "lecture"),
  ], [
    crit("Why does a high-variance direction not necessarily give the best predictive feature?", "Separate unsupervised reconstruction from supervised target information.", "PCA optimizes variance in $X$ without looking at $Y$. A low-variance direction can contain the signal that predicts the target, while a high-variance direction can be nuisance variation.", "objective mismatch"),
    crit("What must be true for a kernel matrix to represent a valid inner-product geometry?", "Think about symmetry and non-negative quadratic forms.", "The Gram matrix should be symmetric positive semidefinite; otherwise the implicit inner-product interpretation breaks.", "validity")
  ]);

  add("dsa5105-erm", [], [
    crit("If training risk falls but validation risk rises, what hypothesis about the model class becomes plausible?", "Connect the two curves to capacity, noise, and the choice of regularization.", "The model may be fitting sample-specific noise. Check leakage and split quality first, then compare a simpler class or stronger regularization.", "diagnosis"),
    crit("When would a validation split be misleading even if it is large?", "Inspect dependence, time ordering, duplicates, and mismatch with the deployment population.", "A large but non-representative or leaked validation set can produce a precise answer to the wrong question.", "evaluation"),
    crit("What is the difference between observing a label and knowing the oracle?", "Separate one realized training target from the unknown function or conditional distribution that generates targets.", "The dataset contains one observed y_i for each x_i. The oracle f* or p* describes the underlying relationship; a random oracle means repeated labels for the same input can differ.", "data-generating process")
  ]);

  add("dsa5105-linear-week1", [], [
    crit("What does the OLS closed form assume about the design matrix?", "Inspect the denominator in 1D and the rank of the normal matrix in the basis-function form.", "The relevant feature directions must be identifiable. A zero denominator or singular normal matrix means the inverse formula is unavailable; use a pseudoinverse or regularization and state the choice.", "identifiability"),
    crit("When is Huber loss a modeling decision rather than a data-cleaning shortcut?", "Compare the loss functions and ask what objective the optimizer is actually minimizing.", "Huber changes the penalty on residuals but keeps the observations in the objective. It can reduce outlier leverage, but validation must show that the altered target matches the task.", "robustness"),
    crit("Why can a nonlinear basis model still be called linear?", "Separate linearity in the input from linearity in the trainable weights.", "The basis functions may be nonlinear in x, but the prediction is a linear combination of fixed features with weights w. The optimization remains linear in those parameters.", "representation")
  ]);

  add("dsa5105-learning-theory", [], [
    crit("Does a smaller empirical risk guarantee a smaller population risk?", "State the missing assumptions rather than answering from the training score alone.", "No. The guarantee requires conditions relating the sample, hypothesis class, and distribution; flexible models can have low empirical risk and poor generalization.", "guarantee"),
    crit("What changes when train and test data are not identically distributed?", "Ask which probability distribution appears in empirical risk and which appears in deployment risk.", "The basic IID PAC interpretation no longer applies directly; the evaluation must model distribution shift or use a target-domain sample.", "distribution shift")
  ]);

  add("dsa5105-linear-regularization", [], [
    crit("Why can standardization change which feature lasso selects?", "Compare the penalty's scale across coordinates before and after normalization.", "The L1 penalty acts on coefficient magnitude. Without comparable feature scales, a feature measured in large units can be penalized differently even when its predictive role is similar.", "preprocessing"),
    crit("Can stronger regularization ever improve test error while worsening training error?", "Use the bias–variance trade-off and distinguish optimization error from generalization error.", "Yes. The extra bias can reduce variance and prevent fitting noise, so unseen-data error may fall even as training error rises.", "trade-off")
  ]);

  add("dsa5105-svm-margin", [], [
    crit("Why is the SVM scale convention necessary?", "Show what happens if $(w,b)$ is multiplied by a positive constant.", "The boundary is unchanged but the raw scores change. Fixing the closest scores at one removes this arbitrary scale and makes the geometric margin comparable.", "invariance"),
    crit("When is a hard-margin SVM the wrong model even if a separator exists?", "Consider noise, outliers, measurement error, and the cost of treating every point as perfectly separable.", "A separator can be created by an outlier or an overly flexible feature map. Soft margins and validation can produce a more robust boundary.", "robustness")
  ]);

  add("dsa5105-pca-deep-dive", [], [
    crit("Why can failing to center data rotate the first principal component?", "Compare the covariance around the origin with covariance around the sample mean.", "The uncentered second moment includes the mean offset, so PCA may spend its first direction representing location instead of variation around the data cloud.", "preprocessing"),
    crit("When can whitening hurt?", "Look at a very small eigenvalue and ask what happens when its inverse square root is applied.", "Whitening can amplify measurement noise in low-variance directions; regularization or dropping unstable components may be safer.", "stability")
  ]);

  add("dsa5105-cluster-gmm", [], [
    crit("Why does a lower K-means objective not prove that the clustering is semantically better?", "Separate geometric fit under squared distance from the meaning of the labels.", "K-means optimizes within-cluster squared distance. A lower value can reflect scale, outliers, or a chosen $K$ without matching the downstream concept of a useful group.", "objective mismatch"),
    crit("Why should EM be run from multiple initializations?", "Connect non-convex likelihood surfaces to local optima.", "Different starts can converge to different local solutions. Comparing likelihood, stability, and downstream usefulness is stronger than trusting one run.", "reproducibility")
  ]);

  add("dsa5105-rl-gnn", [], [
    crit("What is the common structure between a Bellman backup and a GNN layer, and where does the analogy stop?", "Identify local information propagation without claiming identical objectives.", "Both propagate information from a local neighborhood: next states for RL, graph neighbors for GNNs. RL optimizes expected return; a GNN optimizes a task loss over representations.", "analogy"),
    crit("What evidence would show that the analogy is misleading for a design decision?", "Compare the data source, optimization target, and update semantics instead of matching equations by shape.", "If the task needs a policy over actions and delayed rewards, a GNN layer alone is not an RL solution. Similar local aggregation does not supply the reward objective or control loop.", "boundary")
  ]);

  add("dsa5105-rl-bellman", [], [
    crit(String.raw`What changes in behavior as $\gamma$ approaches zero?`, String.raw`Compare the immediate-reward term with the discounted continuation terms.`, String.raw`The agent becomes nearly myopic: immediate reward dominates and delayed consequences contribute little.`, "parameter meaning"),
    crit("Why does the Markov property matter for tractable value functions?", "Ask whether the same state can imply different futures because of hidden history.", "If the state summarizes all decision-relevant history, one value function can condition on the state. If not, the process appears non-Markov and the value estimate can mix incompatible situations.", "state representation")
  ]);

  add("dsa5105-gnn", [], [
    crit("Why is permutation invariance necessary but not sufficient for a useful GNN?", "A valid set function can still discard information or oversmooth nodes.", "Invariance prevents arbitrary ordering effects, but the aggregator and update still need enough expressive power, depth, and regularization for the task.", "expressivity"),
    crit("What evidence would show that another message-passing layer is harmful?", "Measure validation performance and node-embedding separation as depth increases.", "A validation drop accompanied by increasingly similar node embeddings is evidence of oversmoothing or over-mixing.", "diagnosis")
  ]);
})();
