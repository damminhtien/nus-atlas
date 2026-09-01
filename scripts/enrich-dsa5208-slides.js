/* Enrich DSA5208 lecture pages from their extracted source text. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SLIDE_DIR = path.join(ROOT, "content", "courses", "DSA5208", "slides");

const TOPICS = [
  {
    match: /roadmap/i,
    label: "lecture roadmap",
    see: "a navigation map separating the lecture's major sections",
    why: "the roadmap keeps overview pages from being mistaken for algorithm definitions",
    intuition: "use the map to locate the source section, then study the detailed page that follows",
    technical: "The page is an index of topics; it does not add a new ordering or consistency guarantee.",
    pitfall: "Do not cite a roadmap entry as if it were the detailed proof or implementation page.",
    connection: "Follow each entry to its source-backed definition and worked trace.",
    question: title => `What role does "${title}" play in the lecture structure?`,
    answer: "It locates the major source sections; the detailed claims are established on the pages those entries point to.",
    hint: "Treat navigation as scope, not derivation."
  },
  {
    match: /source overview/i,
    label: "lecture source boundary",
    see: "the lecture identity and source boundary for the pages that follow",
    why: "the opening page tells the reader which lecture source is being studied",
    intuition: "anchor later claims to the named lecture instead of importing an unverified syllabus or summary",
    technical: "This page is provenance context; algorithmic details must be taken from the subsequent source pages.",
    pitfall: "Do not infer a complete algorithm or assessment rule from a title page.",
    connection: "Use the next content page to begin the source-backed derivation.",
    question: title => `What does "${title}" establish before the technical pages begin?`,
    answer: "It establishes the lecture source and topic boundary, not a technical algorithmic guarantee.",
    hint: "Separate provenance from the later definition."
  },
  {
    match: /broadcast protocols/i,
    label: "broadcast fan-out",
    see: "one sender copying the same message to every process",
    why: "the fan-out operation is separate from the order in which receivers deliver messages",
    intuition: "separate the sender's one send from the many receiver-side delivery decisions",
    technical: "The sender emits one message to all processes; the ordering guarantee is defined over later delivery events.",
    pitfall: "Do not infer a delivery order merely because the sends occur in one source process.",
    connection: "The next pages turn this distinction into FIFO, causal, and total-order guarantees.",
    question: title => `For "${title}", what is broadcast responsible for and what is left to the delivery guarantee?`,
    answer: "Broadcast defines the fan-out from one sender; the delivery protocol decides which receive-side order is allowed.",
    hint: "Separate send, receive, and deliver events."
  },
  {
    match: /receiving versus delivering/i,
    label: "receive versus deliver",
    see: "a message moving from the network into a buffer before the application delivers it",
    why: "buffering is the mechanism that lets a receiver wait for an ordering condition",
    intuition: "receiving is transport progress; delivery is an application-visible commitment",
    technical: "A receiver can hold a received message until FIFO or causal predecessors make delivery safe.",
    pitfall: "Do not treat arrival at a process as proof that the application should deliver immediately.",
    connection: "This buffer boundary explains why causal broadcast may delay a message.",
    question: title => `In "${title}", why can a receiver accept a message before it delivers it?`,
    answer: "The receiver may need to wait for an ordering condition, so it stores the message while transport and application delivery remain separate.",
    hint: "Look for the buffer between receive and deliver."
  },
  {
    match: /broadcast models/i,
    label: "broadcast model trace",
    see: "a small multi-process trace used to compare possible delivery orders",
    why: "the trace makes the difference between sender-local and cross-sender constraints observable",
    intuition: "keep one row per process and mark each send, receive, and delivery event",
    technical: "A legal execution is determined by the model's allowed order, not by the visual position of events alone.",
    pitfall: "Do not call every visually different trace a violation; first identify which guarantee is being tested.",
    connection: "The trace becomes concrete evidence for the FIFO and causal definitions that follow.",
    question: title => `When reading the "${title}" trace, which delivery orders are ruled out by the stated model?`,
    answer: "Only orders that contradict the model's explicit sender, channel, or causal constraints are ruled out.",
    hint: "Write the guarantee next to the trace before judging it."
  },
  {
    match: /FIFO broadcast/i,
    label: "FIFO broadcast",
    see: "messages from one sender constrained to the sender's broadcast order",
    why: "FIFO is the weakest useful guarantee when a single producer's sequence must be preserved",
    intuition: "one sender's messages form a queue, while different senders can still interleave",
    technical: "If a process broadcasts m1 before m2, every process must deliver m1 before m2; cross-sender order is unconstrained.",
    pitfall: "Do not upgrade FIFO into causal order for messages emitted by different processes.",
    connection: "The causal broadcast pages add cross-process dependency tracking.",
    question: title => `What ordering does "${title}" guarantee, and what ordering does it deliberately leave open?`,
    answer: "It preserves the order of broadcasts from each sender but does not constrain messages from different senders.",
    hint: "Compare same-sender and cross-sender pairs."
  },
  {
    match: /causal broadcast/i,
    label: "causal broadcast",
    see: "a delivery rule that follows the happens-before relation between broadcasts",
    why: "causal delivery prevents an effect from appearing before the update that informed it",
    intuition: "a receiver waits until its known causal predecessors have been delivered",
    technical: "If broadcast(m1) happens before broadcast(m2), every process delivers m1 before m2; concurrent broadcasts may be reordered.",
    pitfall: "Do not require one global order for concurrent messages when the guarantee only preserves causality.",
    connection: "Vector or dependency metadata can provide the knowledge needed by the receiver buffer.",
    question: title => `For "${title}", which pair must be ordered and which pair may remain concurrent?`,
    answer: "A causally related pair must be delivered in causal order; concurrent broadcasts may be delivered in either order.",
    hint: "Find the message path before comparing delivery."
  },
  {
    match: /FIFO-total order/i,
    label: "FIFO-total order",
    see: "a global delivery sequence with the sender-local FIFO rule retained",
    why: "the combined guarantee gives deterministic replica state without losing per-sender order",
    intuition: "first choose one common sequence, then check each sender's messages still appear in order",
    technical: "All processes deliver the same sequence, and messages from a single process follow FIFO order; this implies causal delivery for the stated model.",
    pitfall: "Do not confuse a common total order with a proof that every ordered pair was causally related.",
    connection: "The implementation uses scalar timestamps and a coordination algorithm to agree on the sequence.",
    question: title => `What two constraints must a process verify on the "${title}" page?`,
    answer: "It must use the same total delivery sequence as every process and preserve each sender's FIFO order inside that sequence.",
    hint: "Look for one global rule and one per-sender rule."
  },
  {
    match: /total order broadcast/i,
    label: "total-order broadcast",
    see: "all processes agreeing on one order for delivered messages",
    why: "replicas that apply the same operations in the same order can converge on the same state",
    intuition: "the protocol removes receiver-specific choices by committing one shared sequence",
    technical: "Total order requires every process to deliver messages in the same order, even when the messages were concurrent.",
    pitfall: "Do not claim that total order alone preserves causal order unless the protocol adds that property.",
    connection: "FIFO-total order strengthens this rule with sender-local order.",
    question: title => `Why does "${title}" help replicas converge even for concurrent broadcasts?`,
    answer: "Every process applies concurrent messages in the same agreed sequence, so their state transitions remain aligned.",
    hint: "Compare two receivers' delivery logs."
  },
  {
    match: /broadcast on a tree/i,
    label: "tree broadcast",
    see: "a sender forwarding one message along a spanning tree",
    why: "the tree removes redundant fan-out links while retaining reachability to every process",
    intuition: "each process forwards once to its children after learning the message from its parent",
    technical: "A rooted tree gives each non-root process one upstream path and a bounded set of downstream forwarding edges.",
    pitfall: "Do not count every graph edge as a forwarding edge when the algorithm uses only the tree.",
    connection: "The next section changes the question from reachability to minimum-latency paths.",
    question: title => `In "${title}", why does a spanning tree avoid duplicate forwarding?`,
    answer: "Each process has one parent in the tree, so it receives the broadcast through one upstream path and forwards it only to its children.",
    hint: "Count parent and child edges, not all network edges."
  },
  {
    match: /single source shortest path/i,
    label: "single-source shortest path",
    see: "a weighted network with one sender acting as the source",
    why: "the distance estimate determines the fastest known route from the source to every process",
    intuition: "start with only the source known, then improve a neighbor's estimate through a shorter predecessor route",
    technical: "Each candidate distance is a predecessor estimate plus the edge latency; the minimum candidate becomes the new estimate.",
    pitfall: "Do not confuse a broadcast tree with a shortest-path tree when edge weights differ.",
    connection: "Bellman-Ford supplies synchronous and asynchronous update rules for these estimates.",
    question: title => `What is the optimization target on the "${title}" page?`,
    answer: "For each process, find the minimum total edge latency of any path from the source sender.",
    hint: "The edge weights are network latencies."
  },
  {
    match: /synchronous and asynchronous systems/i,
    label: "system timing models",
    see: "the timing assumptions that separate round-based from event-driven execution",
    why: "the timing model determines when an algorithm may use a neighbor's estimate and when termination can be detected",
    intuition: "synchronous rounds provide a shared pace; asynchronous processes react to messages at different times",
    technical: "A synchronous model bounds computation and communication delays; an asynchronous model cannot rely on a common round boundary.",
    pitfall: "Do not use a synchronous round argument to justify an asynchronous update schedule.",
    connection: "The two Bellman-Ford variants apply the same relaxation idea under different timing contracts.",
    question: title => `Which assumption on "${title}" permits a process to reason in rounds?`,
    answer: "Known bounds on computation and communication let processes use a shared round structure; asynchronous execution lacks that common boundary.",
    hint: "Separate delay bounds from algorithmic logic."
  },
  {
    match: /\bsynchronous bellman-ford/i,
    label: "synchronous Bellman-Ford",
    see: "round-by-round distance relaxation from predecessor estimates",
    why: "the round barrier makes every process use a consistent snapshot of the previous round",
    intuition: "each process asks all predecessors for candidates, keeps the smallest, and waits for the next round",
    technical: "The update is d_i <- min_j(d_j + w_{j,i}) using values from the prior round; after enough rounds, shortest paths are settled.",
    pitfall: "Do not feed a same-round update into the recurrence when the analysis assumes previous-round values.",
    connection: "The asynchronous variant removes the barrier and reacts immediately to improved estimates.",
    question: title => `What does the round boundary protect in "${title}"?`,
    answer: "It ensures that each update uses a consistent prior-round set of predecessor estimates rather than an arbitrary mix of fresh values.",
    hint: "Label the round in which each estimate was produced."
  },
  {
    match: /\basynchronous bellman-ford/i,
    label: "asynchronous Bellman-Ford",
    see: "distance messages arriving in an interleaved, event-driven order",
    why: "an improved estimate can propagate without waiting for every process to finish a global round",
    intuition: "a better number wakes up only the neighbors that can benefit from it",
    technical: "When a process receives a lower candidate, it updates its local estimate and sends the improvement to relevant neighbors.",
    pitfall: "Do not assume message arrival order is a topological or shortest-path order.",
    connection: "Synchronizers later emulate round progress when a synchronous algorithm is needed over an asynchronous system.",
    question: title => `Why is the execution in "${title}" event-driven rather than round-driven?`,
    answer: "Processes act when messages arrive and an estimate improves; there is no global wait for a complete round.",
    hint: "Follow the first lower estimate that triggers another send."
  },
  {
    match: /synchronous and asynchronous algorithms/i,
    label: "Bellman-Ford comparison",
    see: "the termination and communication trade-off between two relaxation schedules",
    why: "the choice affects latency, message timing, and the proof of convergence",
    intuition: "synchronous execution pays for barriers; asynchronous execution pays for more careful event reasoning",
    technical: "Synchronous Bellman-Ford terminates after a bounded number of rounds under its model, while asynchronous execution terminates after no further improvement is possible.",
    pitfall: "Do not compare only arithmetic work while ignoring barriers and network messages.",
    connection: "Synchronizers make the cost of imposing rounds explicit.",
    question: title => `What trade-off is summarized on "${title}"?`,
    answer: "Synchronous execution simplifies reasoning with round barriers, while asynchronous execution can react sooner but needs event-driven convergence reasoning.",
    hint: "Compare progress trigger and termination condition."
  },
  {
    match: /simple synchronizer/i,
    label: "simple synchronizer",
    see: "one payload or dummy message per neighbor per simulated round",
    why: "the fixed message count lets a process know when every neighbor has crossed the current round boundary",
    intuition: "a dummy message says 'no payload, but I have completed this round'",
    technical: "The simple synchronizer assumes each process sends exactly one message to each neighbor in every round.",
    pitfall: "Do not omit the dummy message when a process has no application payload.",
    connection: "The alpha synchronizer removes the fixed-message-count assumption.",
    question: title => `What assumption makes "${title}" implementable with one marker per neighbor?`,
    answer: "Every process sends exactly one payload or dummy message to each neighbor in the current round.",
    hint: "Count messages per neighbor, including empty payloads."
  },
  {
    match: /(?:alpha|α) synchronizer/i,
    label: "alpha synchronizer",
    see: "acknowledgements and safe-to-proceed notifications replacing a fixed payload count",
    why: "the protocol still simulates rounds when a process may send an arbitrary number of messages",
    intuition: "a process advances only after it has evidence that local work and neighbor dependencies are safe",
    technical: "The alpha synchronizer tracks messages and acknowledgements so a process can establish a safe frontier without assuming one message per edge.",
    pitfall: "Do not advance after receiving one neighbor message when other dependencies remain unacknowledged.",
    connection: "This is the coordination cost of running a synchronous algorithm over asynchronous links.",
    question: title => `What evidence must be present before advancing on "${title}"?`,
    answer: "The process needs completion evidence for its local round and the relevant neighbor traffic, not merely one received message.",
    hint: "Look for acknowledgements and the safe marker."
  },
  {
    match: /synchronizer/i,
    label: "synchronizer contract",
    see: "an asynchronous system exposing a safe simulated round boundary",
    why: "the abstraction lets a round-based algorithm run without pretending the network is synchronous",
    intuition: "the synchronizer is a proof-producing barrier built from messages",
    technical: "A process advances only when the protocol establishes that the current simulated round cannot receive a missing predecessor message.",
    pitfall: "Do not equate local idleness with global safety to advance.",
    connection: "The simple and alpha variants differ in the assumptions used to establish safety.",
    question: title => `What safety decision does "${title}" let a process make?`,
    answer: "It lets the process decide when it is safe to begin the next simulated round.",
    hint: "Ask what late message would make an early advance incorrect."
  },
  {
    match: /summary/i,
    label: "Lecture 2 summary",
    see: "the lecture's chain from broadcast semantics to paths and synchronizers",
    why: "the summary connects the guarantees, algorithms, and timing assumptions into one revision map",
    intuition: "start with the system contract, select the algorithm, then check the coordination cost",
    technical: "Broadcast ordering, Bellman-Ford relaxation, and synchronizers each preserve a different invariant under a stated model.",
    pitfall: "Do not memorize the algorithm name without its timing and delivery assumptions.",
    connection: "These model-first distinctions prepare the consistency guarantees in Lecture 3.",
    question: title => `How does "${title}" connect the three algorithm families?`,
    answer: "It moves from delivery semantics, to shortest-path computation, to the mechanisms that coordinate rounds in an asynchronous system.",
    hint: "Name the invariant and model for each family."
  },
  {
    match: /^distributed database$/i,
    label: "distributed database",
    see: "one logical database whose data is placed at multiple physical sites",
    why: "replication and partitioning make a consistency rule necessary for a shared logical state",
    intuition: "the sites hold pieces or copies, while clients expect one coherent data service",
    technical: "The physical placement is distributed even though operations are expressed against a logical database abstraction.",
    pitfall: "Do not assume physical separation disappears just because the API looks centralized.",
    connection: "Consistency models specify how those sites may expose updates and reads.",
    question: title => `What tension does "${title}" introduce for a logical database?`,
    answer: "The system must coordinate physically separate copies or partitions so clients receive behavior consistent with the chosen model.",
    hint: "Contrast logical view and physical placement."
  },
  {
    match: /distributed shared memory/i,
    label: "distributed shared memory",
    see: "separate memories presented through one address-space abstraction",
    why: "the abstraction makes remote coordination visible whenever processes read or write shared data",
    intuition: "one address space does not make the underlying memories local or instantaneous",
    technical: "The model separates the programmer-facing shared address space from the physically distributed storage.",
    pitfall: "Do not import single-machine memory ordering without checking the distributed consistency contract.",
    connection: "The following consistency models formalize what a read is allowed to observe.",
    question: title => `What does "${title}" abstract away, and what does it not remove?`,
    answer: "It abstracts separate memories as one address space, but it does not remove communication delay or replica-ordering choices.",
    hint: "Keep the logical address space separate from physical storage."
  },
  {
    match: /invocations and responses/i,
    label: "operation histories",
    see: "non-overlapping invocation and response pairs on each process",
    why: "the history representation provides the events that a consistency model must order",
    intuition: "each operation has a start and finish; overlap across processes creates the interesting cases",
    technical: "Per-process operations are sequential locally, while a global history must account for inter-process overlap and visibility.",
    pitfall: "Do not turn local non-overlap into a global real-time order without evidence.",
    connection: "Linearizability and sequential consistency differ in how they constrain the global sequence.",
    question: title => `What structure does "${title}" give a consistency-model definition?`,
    answer: "It supplies operation intervals and per-process order that a legal global history must respect.",
    hint: "Mark invocation, response, and overlap separately."
  },
  {
    match: /^consistency model$/i,
    label: "consistency-model contract",
    see: "rules describing what shared data may look like to processes",
    why: "without an explicit contract, a read result cannot be judged as legal or stale",
    intuition: "a consistency model is a set of allowed histories, not a promise that every read is instantaneous",
    technical: "The model constrains read/write visibility and the ordering of operations across processes.",
    pitfall: "Do not use 'consistent' as a synonym for one specific guarantee.",
    connection: "Lecture 3 compares strict, sequential, causal, eventual, and client-centric contracts.",
    question: title => `What does "${title}" define before an implementation is chosen?`,
    answer: "It defines which shared-data observations and operation histories are legal for processes.",
    hint: "Start with allowed histories, then discuss mechanisms."
  },
  {
    match: /strict consistency \(linearizability\)|linearizability/i,
    label: "linearizability",
    see: "read and write operations placed in one legal sequence that respects real-time order",
    why: "real-time order gives clients the strongest intuitive view of one current object",
    intuition: "each operation appears to take effect at one point between invocation and response",
    technical: "A legal sequential history must preserve each process's order and the real-time order of non-overlapping operations.",
    pitfall: "Do not weaken linearizability to mere agreement on one sequence; real-time order is part of the contract.",
    connection: "FIFO-total order broadcast is one implementation idea, but its coordination cost motivates weaker models.",
    question: title => `Which extra ordering condition distinguishes "${title}" from sequential consistency?`,
    answer: "Linearizability also preserves real-time order between non-overlapping operations.",
    hint: "Find the condition involving invocation and response intervals."
  },
  {
    match: /sequential consistency/i,
    label: "sequential consistency",
    see: "one global sequence that preserves each process's program order",
    why: "it gives a coherent order without requiring every real-time relation between clients",
    intuition: "merge the local histories into one legal sequence, but do not add unsupported wall-clock constraints",
    technical: "All operations can be arranged in one sequence consistent with each process's local order; non-overlapping cross-process operations need not retain real-time order.",
    pitfall: "Do not call a sequence sequentially consistent if it reverses one process's own operations.",
    connection: "The weaker real-time requirement can reduce implementation cost compared with linearizability.",
    question: title => `What must the global sequence preserve on "${title}"?`,
    answer: "It must preserve each process's program order, while it need not preserve real-time order across different processes.",
    hint: "Check local order first."
  },
  {
    match: /causal consistency/i,
    label: "causal consistency",
    see: "causally related writes constrained to one common order while concurrent writes may differ",
    why: "the model preserves dependencies without paying for a total order over unrelated operations",
    intuition: "if one write could have influenced another, every process must see that dependency in the same direction",
    technical: "All processes observe causally related writes in the same order; concurrent writes do not require one global order.",
    pitfall: "Do not impose a total order on concurrent writes when the model only requires causal order.",
    connection: "Causal broadcast supplies the ordering primitive used by a common implementation sketch.",
    question: title => `What relation does "${title}" preserve and what relation may remain unordered?`,
    answer: "It preserves the happens-before relation between writes; concurrent writes may be observed in different orders.",
    hint: "Draw the causal edge before comparing replicas."
  },
  {
    match: /weaker consistency models|hierarchy of consistency models/i,
    label: "consistency hierarchy",
    see: "a comparison showing how weaker models drop specific ordering obligations",
    why: "the hierarchy makes the availability, latency, and coordination trade-off explicit",
    intuition: "move downward by removing a promise, not by declaring the remaining behavior arbitrary",
    technical: "Each model has a precise visibility condition; a weaker model permits more histories but still preserves its own invariant.",
    pitfall: "Do not treat weaker as incorrect or assume two named models are comparable without checking definitions.",
    connection: "Eventual and client-centric models specialize the weaker side of the contract.",
    question: title => `What promise is relaxed on "${title}" compared with a stronger model?`,
    answer: "A weaker model permits additional histories by dropping a specific ordering or freshness condition while retaining its stated invariant.",
    hint: "Name the removed promise, not just the model name."
  },
  {
    match: /eventual consistency/i,
    label: "eventual consistency",
    see: "replicas that may answer locally now but converge when updates stop",
    why: "the model trades immediate agreement for availability and lower coordination overhead",
    intuition: "temporary divergence is allowed; quiescence creates the opportunity to catch replicas up",
    technical: "If no new updates are made, all replicas eventually converge to the same value under the stated assumptions.",
    pitfall: "Do not promise a bound on staleness or read-your-writes unless another guarantee supplies it.",
    connection: "The implementation sketch uses local reads and ordered update propagation.",
    question: title => `What convergence condition is central to "${title}"?`,
    answer: "If updates stop, replicas eventually converge to the same value; the model does not promise immediate convergence.",
    hint: "Look for the condition about no new updates."
  },
  {
    match: /Google Cloud Spanner|CockroachDB/i,
    label: "database consistency examples",
    see: "named distributed databases positioned against the lecture's consistency vocabulary",
    why: "real systems show that a model name must be tied to a concrete implementation and scope",
    intuition: "read the vendor example as evidence for a documented behavior, not as a universal synonym",
    technical: "The page compares system-level mechanisms or documented guarantees with the abstract consistency definitions.",
    pitfall: "Do not infer an undocumented guarantee from a product name or a URL alone.",
    connection: "Later pages perform the same mapping for MongoDB and ScyllaDB.",
    question: title => `How should the system examples on "${title}" be used when studying consistency?`,
    answer: "Use them as implementation examples that must be checked against their documented guarantees, not as replacements for the abstract definitions.",
    hint: "Separate product evidence from model definition."
  },
  {
    match: /client-centric consistency models/i,
    label: "client-centric consistency",
    see: "rules focused on what one client's successive reads and writes may observe",
    why: "a client can need a personal session guarantee even when the whole replica set is not strongly ordered",
    intuition: "track one client's history rather than requiring every client to see one global sequence",
    technical: "Client-centric guarantees constrain observations across a client's operations, such as read-your-writes or monotonic reads.",
    pitfall: "Do not substitute a data-centric guarantee for a session-specific obligation.",
    connection: "The four named client guarantees refine the required invariant.",
    question: title => `What viewpoint changes on "${title}" compared with data-centric models?`,
    answer: "The contract follows one client's read/write history rather than requiring a single global order for all processes.",
    hint: "Trace one client across successive operations."
  },
  {
    match: /read-your-writes/i,
    label: "read-your-writes",
    see: "a client reading a value that includes the effect of its earlier write",
    why: "users normally expect their own completed update not to disappear on the next read",
    intuition: "the client's write leaves a marker that later reads must not fall behind",
    technical: "After a process writes x, a later read of x by that process must reflect that write or a newer value under the guarantee.",
    pitfall: "Do not infer read-your-writes from majority acknowledgement alone without session visibility state.",
    connection: "MongoDB's Lamport-clock mechanism provides an implementation detail for this client guarantee.",
    question: title => `What client invariant is checked on "${title}"?`,
    answer: "A client's later read must not return a version older than the effect of its own earlier completed write.",
    hint: "Compare the client's write marker with the read version."
  },
  {
    match: /writes-follow-reads/i,
    label: "writes-follow-reads",
    see: "a later client write carrying forward the version information from an earlier read",
    why: "a write based on observed data must not be applied before the version that informed it",
    intuition: "reading creates a dependency that the client's next write must respect",
    technical: "A write following a read must be ordered after the version observed by that read.",
    pitfall: "Do not confuse this with read-your-writes, which constrains a later read after a write.",
    connection: "Both are client-centric but protect opposite directions of a session history.",
    question: title => `Which session dependency is visible on "${title}"?`,
    answer: "The later write must follow the version or update observed by the earlier read that informed it.",
    hint: "Read first, then write."
  },
  {
    match: /monotonic-reads/i,
    label: "monotonic reads",
    see: "successive reads from one client never moving backward to an older version",
    why: "a user should not observe a newer value and then regress to stale state",
    intuition: "carry the highest version already observed into the next read request",
    technical: "If a client reads a version of x, every later read by that client must return that version or a newer one.",
    pitfall: "Do not require all clients to share one read frontier; the guarantee is per client.",
    connection: "Read-your-writes is one specific client history; monotonic reads covers any observed version.",
    question: title => `What must never decrease in "${title}"?`,
    answer: "The version or freshness of values observed by one client's successive reads must not decrease.",
    hint: "Track the client's observed version number."
  },
  {
    match: /monotonic-writes/i,
    label: "monotonic writes",
    see: "a client's writes applied in the order they were issued",
    why: "later updates may depend on earlier updates and must not overtake them at replicas",
    intuition: "the session's write stream is a queue that replicas cannot reorder",
    technical: "If one process completes write w1 before issuing w2, every replica applies w1 before w2 for that process.",
    pitfall: "Do not extend the guarantee to an order between unrelated clients without evidence.",
    connection: "The four client-centric guarantees constrain different edges in the session history.",
    question: title => `Which order does "${title}" preserve?`,
    answer: "It preserves the issuing client's order among its own writes at the replicas.",
    hint: "Use one client's write sequence, not all system writes."
  },
  {
    match: /MongoDB|read and write concerns|majority-committed snapshots|Lamport clocks/i,
    label: "MongoDB session guarantees",
    see: "replica snapshots, read/write concerns, and Lamport-clock state linked to one client",
    why: "the example shows why acknowledgement level and session visibility are separate mechanisms",
    intuition: "a majority can confirm durability while a particular reader still needs a causal frontier",
    technical: "Majority read/write concerns describe replica visibility; session or Lamport-clock state can force a read to catch up to the client's prior write.",
    pitfall: "Do not equate majority commitment with an automatic read-your-writes guarantee on every serving node.",
    connection: "This is a concrete implementation of the client-centric distinction introduced earlier.",
    question: title => `What two layers must be separated on "${title}"?`,
    answer: "Replica-set commitment and the individual client's session frontier are separate; the latter may require Lamport-clock enforcement.",
    hint: "Ask what the majority confirms and what the client still needs."
  },
  {
    match: /tunable consistency|Cassandra|ScyllaDB|digest reads|read repair/i,
    label: "tunable replica consistency",
    see: "a coordinator choosing replica reads, write acknowledgements, or digest repair work",
    why: "tunable levels expose the trade-off between latency, quorum coverage, and freshness",
    intuition: "the coordinator samples enough replicas for the selected invariant, then repairs disagreement when needed",
    technical: "A digest mismatch triggers a fuller read or repair path before the coordinator selects the response value.",
    pitfall: "Do not treat a named consistency level as a universal guarantee independent of the read/write path.",
    connection: "The examples connect abstract client guarantees to concrete coordinator behavior.",
    question: title => `What decision point is illustrated on "${title}"?`,
    answer: "The coordinator must choose how many replicas to contact and what repair or visibility work is needed before returning a value.",
    hint: "Follow the coordinator from request to response."
  },
  {
    match: /summary/i,
    label: "Lecture 3 summary",
    see: "the progression from data-centric models to client sessions and database mechanisms",
    why: "the summary is a revision map for matching an application invariant to the weakest sufficient guarantee",
    intuition: "state the invariant first, then choose the model and implementation evidence that preserve it",
    technical: "Linearizability, sequential, causal, eventual, and client-centric guarantees differ in the histories they permit.",
    pitfall: "Do not rank models by name alone; compare the exact invariant each one preserves.",
    connection: "This model-first comparison feeds the delivery-guarantee practice lab.",
    question: title => `What selection rule does "${title}" suggest for practice?`,
    answer: "Choose the weakest guarantee whose formal invariant still preserves the application's required behavior.",
    hint: "Write the application invariant before naming a model."
  }
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalizedLines(sourceText) {
  return String(sourceText || "").split(/\r?\n/)
    .map(line => line.replace(/^[\s\u2022▶-]+/, "").replace(/\s+/g, " ").trim())
    .filter(line => line && !/^\d+[.)]?$/.test(line) && !/^lecture\s+\d+\s*:/i.test(line))
    .filter(line => !/^dsa\d+\s*:/i.test(line) && !/^zhenning cai$/i.test(line))
    .filter(line => !/^department of mathematics/i.test(line) && !/^ay\d{4}/i.test(line))
    .filter(line => !/^https?:\/\//i.test(line) && line !== "null");
}

function titleFor(slide, lecture, counts) {
  const rawLines = String(slide.sourceText || "").split(/\r?\n/).map(line => line.replace(/\s+/g, " ").trim());
  const lines = normalizedLines(slide.sourceText);
  const section = lines[0] || "Lecture source";
  const candidates = lines.filter(line => line.toLowerCase() !== section.toLowerCase());
  const navigationHeadings = rawLines.slice(0, 10).filter(line => /^(Broadcast|Shortest-path problem|Synchronizers|Summary|Motivation|Data-centric consistency models|Client-centric consistency models)$/i.test(line));
  const navigation = rawLines.slice(0, 10).filter(line => /^[1-4]$/.test(line)).length >= 2 && navigationHeadings.length >= 2;
  let base = navigation ? `${section} roadmap` : candidates.find(line => !/^assume$/i.test(line) && !/^algorithm$/i.test(line)) || section;
  if (slide.slideNumber === 1) base = `Lecture ${lecture} source overview`;
  if (/^summary:?$/i.test(section)) base = `Lecture ${lecture} summary`;
  if (/^summary$/i.test(base)) base = `Lecture ${lecture} summary`;
  const key = base.toLowerCase();
  const seen = counts.get(key) || 0;
  counts.set(key, seen + 1);
  return seen ? `${base} · source page ${slide.slideNumber}` : base;
}

function topicFor(slide) {
  const title = String(slide.title || "");
  const source = `${title}\n${slide.sourceText}`;
  const lecture = /Lec3/i.test(String(slide.sourceRef && slide.sourceRef.sourceId)) ? 3 : 2;
  if (/summary/i.test(title)) return TOPICS.find(topic => topic.label === `Lecture ${lecture} summary`);
  const titleTopic = TOPICS.find(topic => topic.match.test(title));
  if (titleTopic) return titleTopic;
  const preferredLabels = [
    "FIFO-total order",
    "causal broadcast",
    "FIFO broadcast",
    "total-order broadcast",
    "synchronous Bellman-Ford",
    "asynchronous Bellman-Ford",
    "Bellman-Ford comparison",
    "MongoDB session guarantees",
    "read-your-writes",
    "writes-follow-reads",
    "monotonic reads",
    "monotonic writes",
    "tunable replica consistency",
    "database consistency examples"
  ];
  for (const label of preferredLabels) {
    const topic = TOPICS.find(candidate => candidate.label === label);
    if (topic && topic.match.test(source)) return topic;
  }
  return TOPICS.find(topic => !topic.label.startsWith("Lecture ") && topic.match.test(source)) || {
    label: "source claim",
    see: `the source terms associated with ${slide.title}`,
    why: "the page contributes a concrete claim to the lecture's model-first reasoning",
    intuition: "identify the object, its allowed behavior, and the evidence shown on the page",
    technical: "Use the definitions and symbols shown on the source page before importing an outside interpretation.",
    pitfall: "Do not generalize beyond the system assumptions visible on this page.",
    connection: "Carry the page's invariant into the next algorithm or consistency comparison.",
    question: title => `What claim is established by "${title}" and what source detail supports it?`,
    answer: "State the page-specific object or rule first, then cite the visible definition, trace, or system condition that supports it.",
    hint: "Point to the source detail before explaining its consequence."
  };
}

function enrichFile(file, lecture) {
  const set = readJson(file);
  const counts = new Map();
  const core = new Set(set.coreSlideNumbers || []);
  for (const slide of set.slides || []) {
    slide.title = titleFor(slide, lecture, counts);
    slide.lecturePriority = core.has(slide.slideNumber) ? "core" : "support";
    const topic = topicFor(slide);
    slide.explanation = {
      whatYouSee: `${slide.title} shows ${topic.see}.`,
      whyItMatters: `${topic.why} This page is the source evidence for that distinction.`,
      intuition: topic.intuition,
      technicalDetail: topic.technical,
      pitfall: topic.pitfall,
      connection: topic.connection
    };
    slide.socraticQuestions = [{
      type: topic.label,
      prompt: topic.question(slide.title),
      answer: topic.answer,
      hint: topic.hint
    }];
  }
  fs.writeFileSync(file, `${JSON.stringify(set, null, 2)}\n`);
  return set.slides.length;
}

function main() {
  const counts = [
    ["dsa5208-lec2.json", 2],
    ["dsa5208-lec3.json", 3]
  ].map(([file, lecture]) => [file, enrichFile(path.join(SLIDE_DIR, file), lecture)]);
  console.log(`DSA5208 SLIDE ENRICHMENT GREEN · ${counts.map(([file, count]) => `${file}:${count}`).join(", ")}`);
}

if (require.main === module) main();

module.exports = { TOPICS, normalizedLines, titleFor, topicFor, enrichFile };
