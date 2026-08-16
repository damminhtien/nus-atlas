(function () {
  "use strict";
  const source = (sourceId, page, sourceType = "lecture", role = "current course material", status = "current") => ({ sourceId, page, sourceType, role, status });
  const lecture = (sourceId, page, role) => source(sourceId, page, "lecture", role, "current");
  const exercise = (sourceId, page, role) => source(sourceId, page, "exercise", role, "current-context");
  const textbook = (page, role) => source("DSA5101/Reference textbook MMDS 3rd Edition.pdf", page, "textbook", role, "course-depth");
  const lens = (status, whyExaminable, lectureRefs, exerciseRefs, textbookRefs, referenceRefs) => ({ status, whyExaminable, lecture: lectureRefs || [], officialExercise: exerciseRefs || [], textbook: textbookRefs || [], reference: referenceRefs || [] });
  const contrast = (id, pair, prompt, choices, answer, explanation, sourceRefs) => ({ id, type: "contrast", kind: "concept-contrast", pair, prompt, choices, answer, explanation, estimatedSeconds: 45, sourceRefs });
  window.NUS_CONTENT.DSA5101 = {
    modules: [
      { id: "dsa5101-foundations", title: "Foundations", lessons: [
        { id: "dsa5101-orientation", title: "Course map and assessment", week: 1, minutes: 25, summary: "Turn the course outline into a study loop: data representation, scalable computation, and evaluation.", objectives: ["Locate the four assessment milestones", "Separate lecture concepts from assignment deliverables", "Create a source-backed revision checklist"], sourceRefs: [lecture("DSA5101/DSA5101 Course Information.pdf", 1, "course scope"), lecture("DSA5101/DSA5101 Course Information.pdf", 2, "assessment weights")], visualIds: ["dsa5101-big-data-cost"], sections: [{ title: "Study lens", body: "For every algorithm, record the input model, the expensive pass over data, the memory bottleneck, and the failure mode." }], questions: [
          { id: "dsa5101-o-q1", type: "mcq", prompt: "Which assessment has the largest weight in the course information sheet?", choices: ["Assignment 1", "Assignment 2", "Project", "Final open-book exam"], answer: 3, explanation: "The final exam is listed as 50%; the project is 20% and each assignment is 15%." },
          { id: "dsa5101-o-q2", type: "short", prompt: "Name the two properties you should record when comparing a big-data algorithm's scalability.", accepted: ["passes and memory", "number of passes and memory", "passes through data and main memory"], solution: "Track passes through the data and the main-memory bottleneck; both are central to the lecture framing.", explanation: "A good answer mentions data passes and memory pressure." }
        ] }
      ]},
      { id: "dsa5101-patterns", title: "Patterns and similarity", lessons: [
        { id: "dsa5101-frequent-itemsets", title: "Support, confidence, and interest", week: 2, minutes: 45, summary: "Count baskets first, then generate rules from frequent itemsets without confusing support and confidence.", objectives: ["Compute support from a basket table", "Use downward closure to prune candidates", "Distinguish confidence from interest"], sourceRefs: [lecture("DSA5101/Lec1 - Assoc Rules, Frequent itemsets.pdf", 24, "frequent-itemset definition"), lecture("DSA5101/Lec1 - Assoc Rules, Frequent itemsets.pdf", 28, "association rules"), exercise("DSA5101/Assignments/DSA5101_Assignment_1.pdf", 1, "assignment calculation")], visualIds: ["dsa5101-support-baskets", "dsa5101-association-network"], sections: [{ title: "Core equations", body: String.raw`For an itemset $I$, support is the fraction of baskets containing $I$. For a rule $A\to B$, confidence is $\operatorname{supp}(A\cup B)/\operatorname{supp}(A)$. Interest compares confidence with the base rate $\operatorname{supp}(B)$.` }, { title: "Visual reading", body: "Read the basket table as a set of transactions, not as a graph. The network-like slide decoration is only a visual cue; the formal object is still a basket incidence relation." }], questions: [
          { id: "dsa5101-fi-q1", type: "calculation", prompt: "Eight baskets contain {m,b} in four baskets. What is support({m,b})? Give a count and a fraction.", accepted: ["4, 1/2", "4/8", "4 and 1/2", "0.5"], solution: "The count is 4 baskets; normalized support is 4/8 = 1/2 = 0.5.", explanation: "Support can be reported as a count or normalized fraction; label which one you use." },
          { id: "dsa5101-fi-q2", type: "mcq", prompt: "If an itemset is not frequent under a support threshold, what follows for every superset?", choices: ["It must be frequent", "It cannot be frequent", "Only pairs can be frequent", "Its confidence becomes one"], answer: 1, explanation: "Downward closure says every superset has support no greater than the subset." },
          { id: "dsa5101-fi-q3", type: "derivation", prompt: String.raw`Derive confidence for the rule $A\to B$ from support counts.`, accepted: ["support(a union b) / support(a)", "support(a union b) / support(a)", "support(A union B) / support(A)"], solution: String.raw`Among baskets containing $A$, the fraction that also contains $B$ is $\operatorname{supp}(A\cup B)/\operatorname{supp}(A)$.`, explanation: "The denominator is the antecedent count, not the total number of baskets." }
        ] }
      ]},
      { id: "dsa5101-minhash", title: "MinHash and LSH", lessons: [
        { id: "dsa5101-minhash-lsh", title: "MinHash signatures and LSH probability", week: 3, minutes: 50, summary: "Estimate Jaccard similarity compactly, then use banding to make near-neighbor search practical.", objectives: ["Relate MinHash collision probability to Jaccard similarity", "Compute an LSH candidate probability", "Explain false positives and false negatives"], sourceRefs: [exercise("DSA5101/Assignments/DSA5101_Assignment_1.pdf", 3, "MinHash signature"), exercise("DSA5101/Assignments/DSA5101_Assignment_1.pdf", 4, "LSH banding")], visualIds: ["dsa5101-minhash-bands"], sections: [{ title: "Probability checkpoint", body: String.raw`For one MinHash permutation, $\Pr[h(A)=h(B)]=J(A,B)$. With $b$ bands of $r$ rows and similarity $s$, the LSH candidate probability is $1-(1-s^r)^b$.` }], questions: [
          { id: "dsa5101-mh-q1", type: "mcq", prompt: "What does a single MinHash collision estimate?", choices: ["Cosine similarity", "Jaccard similarity", "Euclidean distance", "Support count"], answer: 1, explanation: "For a random permutation, the collision probability equals Jaccard similarity." },
          { id: "dsa5101-mh-q2", type: "calculation", prompt: "With similarity s=0.8, b=2 bands and r=2 rows, what is the LSH candidate probability?", accepted: ["0.8704", "87.04%", "0.8704 or 87.04%"], solution: "1 − (1 − 0.8²)² = 1 − 0.36² = 0.8704.", explanation: "First compute the probability of avoiding a match in one band, then across all bands." }
        ] }
      ]},
      { id: "dsa5101-scale", title: "Ranking and streams", lessons: [
        { id: "dsa5101-ranking-streams", title: "PageRank, DGIM, and Flajolet–Martin", week: 5, minutes: 55, summary: "Connect graph ranking and streaming sketches to the same design question: what can be remembered in one pass?", objectives: ["Explain PageRank as a stationary random walk", "Estimate a window count with DGIM", "Explain probabilistic cardinality estimation"], sourceRefs: [exercise("DSA5101/Assignments/DSA5101_Assignment_2.pdf", 2, "PageRank iteration"), exercise("DSA5101/Assignments/DSA5101_Assignment_2.pdf", 4, "streaming sketches")], visualIds: ["dsa5101-pagerank-stream"], sections: [{ title: "Compare the sketches", body: String.raw`DGIM estimates counts in a recent window with timestamped buckets. Flajolet–Martin estimates distinct elements using the longest observed zero-prefix in a hashed stream; its estimate is probabilistic rather than exact.` }], questions: [
          { id: "dsa5101-rs-q1", type: "mcq", prompt: "What is the role of the damping factor in PageRank?", choices: ["It removes all links", "It models random teleportation and prevents rank traps", "It counts distinct stream items", "It chooses the LSH band size"], answer: 1, explanation: "Teleportation makes the transition process ergodic and reduces sink/trap problems." },
          { id: "dsa5101-rs-q2", type: "short", prompt: "Why can a streaming sketch use less memory than storing every event?", accepted: ["it summarizes the stream", "compact approximate summary", "it stores a compact approximate summary"], solution: "It keeps a compact approximate summary with controlled error instead of every raw event.", explanation: "Mention approximation/error; the memory saving is not free." }
        ] }
      ]}
    ]
  };

  const lessons = window.NUS_CONTENT.DSA5101.modules.flatMap(module => module.lessons || []);
  const textbookByLesson = {
    "dsa5101-orientation": textbook(3, "scalable-algorithm framing"),
    "dsa5101-frequent-itemsets": textbook(214, "frequent-itemset depth"),
    "dsa5101-minhash-lsh": textbook(95, "MinHash and LSH depth"),
    "dsa5101-ranking-streams": textbook(155, "streaming and PageRank depth")
  };
  const drillSets = {
    "dsa5101-orientation": [
      ["dsa5101-c1", "Batch vs streaming", "A dataset does not fit in memory. Which design assumption should you test first?", ["Read all data repeatedly", "Bound the working state and process incrementally", "Ignore memory because Big-O is unchanged"], 1, "Streaming keeps a bounded summary and makes the number of passes explicit."],
      ["dsa5101-c2", "Exact vs approximate computation", "When is an approximate count acceptable?", ["Always", "When error is bounded and acceptable for the decision", "Only when the dataset is tiny"], 1, "Approximation is a contract about error and decision risk, not a synonym for correctness."],
    ],
    "dsa5101-frequent-itemsets": [
      ["dsa5101-c3", "Support vs confidence", "Which quantity asks how often the entire itemset appears in all baskets?", ["Support", "Confidence", "Lift"], 0, "Support uses the full transaction population; confidence conditions on the antecedent."],
      ["dsa5101-c4", "Confidence vs lift", "A rule has high confidence because its consequent is common everywhere. Which measure exposes that baseline?", ["Support", "Lift", "Candidate count"], 1, "Lift compares confidence with the consequent base rate."],
      ["dsa5101-c5", "Subset vs superset pruning", "An itemset is infrequent. What can be pruned safely?", ["Every subset", "Every superset", "Only rules with one consequent"], 1, "Downward closure says every superset has support no larger than the infrequent subset."],
    ],
    "dsa5101-minhash-lsh": [
      ["dsa5101-c6", "Jaccard vs cosine similarity", "Which similarity is estimated by MinHash collision probability?", ["Jaccard", "Cosine", "Euclidean"], 0, "A random-permutation MinHash collision estimates Jaccard similarity for sets."],
      ["dsa5101-c7", "MinHash vs LSH", "What is LSH banding primarily used for?", ["Exact similarity scoring", "Candidate generation", "Replacing all hashing"], 1, "LSH makes near-neighbor search cheaper by generating candidates; exact similarity can follow."],
      ["dsa5101-c8", "False positive vs false negative", "A dissimilar pair passes the LSH candidate filter. What is this?", ["False positive", "False negative", "True negative"], 0, "The filter admitted a pair that is not truly similar; verification controls the cost of this error."],
    ],
    "dsa5101-ranking-streams": [
      ["dsa5101-c9", "PageRank vs indegree", "Why can two pages with the same indegree receive different PageRank?", ["PageRank weights the source rank and out-degree", "PageRank ignores links", "Indegree is probabilistic"], 0, "PageRank transfers weighted rank mass rather than counting every incoming edge equally."],
      ["dsa5101-c10", "Exact storage vs sketch summary", "What does a streaming sketch trade for lower memory?", ["All error", "Controlled approximation error", "The ability to process a stream"], 1, "A sketch saves memory by summarizing the stream, so its error model must be stated."],
    ]
  };
  lessons.forEach(lesson => {
    lesson.sections.forEach(section => { section.sourceType = section.sourceType || "lecture"; });
    lesson.questions.forEach(question => { question.sourceRefs = question.sourceRefs || lesson.sourceRefs.slice(0, 2); });
    const book = textbookByLesson[lesson.id];
    const lectureRefs = lesson.sourceRefs.filter(ref => ref.sourceType === "lecture");
    const exerciseRefs = lesson.sourceRefs.filter(ref => ref.sourceType === "exercise");
    lesson.sections[0].sourceLens = lens("core DSA5101 concept", "Lecture and assignment material define the current study target; the MMDS index is attached as labeled depth, not merged into lecture scope.", lectureRefs, exerciseRefs, book ? [book] : []);
    lesson.contrastDrills = (drillSets[lesson.id] || []).map(([id, pair, prompt, choices, answer, explanation]) => contrast(id, pair, prompt, choices, answer, explanation, lesson.sourceRefs.slice(0, 2)));
  });
})();
