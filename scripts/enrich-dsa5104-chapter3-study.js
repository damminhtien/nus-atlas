#!/usr/bin/env node
/**
 * Add authored study metadata to the extracted DSA5104 Chapter 3 slide set.
 * Run after enrich-dsa5104-chapter3-slides.js.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const FILE = path.join(ROOT, "content/courses/DSA5104/slides/dsa5104-chapter3.json");
const SOURCE_ID = "DSA5104/chapter3.pdf";
const ASSET_ROOT = "assets/nus/dsa5104/chapter3";
const TEXTBOOK = {
  sourceId: "DSA5104/Database System Concepts, 7th edition",
  sourceType: "textbook",
  page: 3,
  role: "Chapter 3 pointer: SQL query language, aggregation, and subqueries",
  status: "course-depth"
};

const CORE_SLIDES = [
  ...Array.from({ length: 38 }, (_, i) => i + 4),
  ...Array.from({ length: 55 }, (_, i) => i + 43)
];

const TEXTBOOK_SLIDES = new Set([
  5, 7, 8, 17, 19, 24, 28, 31, 37, 42, 45, 49, 51, 54, 56, 58,
  62, 63, 66, 69, 73, 77, 79, 81, 83, 91, 99
]);

const FORMULAS = {
  7: ["SQL relation definition", "r=(A_1:D_1,\\\\ldots,A_n:D_n;\\\\mathcal C)", "Read CREATE TABLE as attributes, domains, and constraints."],
  19: ["Basic query shape", "\\\\text{SELECT }A_1,\\\\ldots,A_n\\\\ \\\\text{FROM }r_1,\\\\ldots,r_m\\\\ \\\\text{WHERE }P", "Decompose an English request into output attributes, input relations, and a row predicate."],
  24: ["SQL duplicate policy", "\\\\text{SELECT DISTINCT }Q\\\\subseteq\\\\text{SELECT ALL }Q", "Remember that SQL preserves duplicates by default and DISTINCT removes them."],
  29: ["FROM-clause product", "|r_1\\\\times\\\\cdots\\\\times r_m|=\\\\prod_{i=1}^{m}|r_i|", "Anticipate the all-pairs intermediate relation before WHERE filters it."],
  31: ["Key-based SQL join", "\\\\text{instructor.ID}=\\\\text{teaches.ID}", "Join rows by identity rather than physical row position."],
  42: ["SQL set operations", "R\\\\cup S,\\\\quad R\\\\cap S,\\\\quad R\\\\setminus S", "Choose either-or, both, or left-only membership between compatible results."],
  44: ["Set compatibility", "\\\\operatorname{arity}(R)=\\\\operatorname{arity}(S),\\\\quad \\\\operatorname{dom}(R_i)\\\\text{ compatible with }\\\\operatorname{dom}(S_i)", "Check tuple shape before UNION, INTERSECT, or EXCEPT."],
  45: ["NULL arithmetic", "x+\\\\mathrm{NULL}=\\\\mathrm{NULL}", "Predict why arithmetic involving an unknown value remains unknown."],
  48: ["WHERE truth rule", "\\\\mathrm{UNKNOWN}\\\\not\\\\equiv\\\\mathrm{TRUE}", "Explain why WHERE does not keep an UNKNOWN predicate result."],
  49: ["Aggregate family", "\\\\{\\\\operatorname{AVG},\\\\operatorname{MIN},\\\\operatorname{MAX},\\\\operatorname{SUM},\\\\operatorname{COUNT}\\\\}", "Identify the aggregate operation and the values it summarizes."],
  51: ["Grouping", "\\\\text{GROUP BY }G\\\\Rightarrow\\\\text{one group per distinct }G", "Reason about which rows share an aggregate computation."],
  54: ["SQL logical query order", "\\\\text{FROM}\\\\to\\\\text{WHERE}\\\\to\\\\text{GROUP BY}\\\\to\\\\text{HAVING}\\\\to\\\\text{SELECT}\\\\to\\\\text{ORDER BY}", "Place row predicates, group predicates, projection, and sorting at the correct semantic stage."],
  58: ["IN membership", "x\\\\in Q", "Test whether a scalar belongs to a subquery result."],
  63: ["SOME quantifier", "x\\\\mathbin{\\\\theta}\\\\operatorname{SOME}(Q)\\\\Longleftrightarrow\\\\exists q\\\\in Q:\\\\ x\\\\mathbin{\\\\theta}q", "Use SOME when one witness is enough."],
  66: ["ALL quantifier", "x\\\\mathbin{\\\\theta}\\\\operatorname{ALL}(Q)\\\\Longleftrightarrow\\\\forall q\\\\in Q:\\\\ x\\\\mathbin{\\\\theta}q", "Use ALL when every returned value must satisfy the comparison."],
  69: ["EXISTS test", "\\\\operatorname{EXISTS}(Q)\\\\Longleftrightarrow |Q|>0", "Test whether a correlated subquery has at least one witness."],
  73: ["NOT EXISTS division pattern", "A\\\\setminus B=\\\\varnothing\\\\Longleftrightarrow A\\\\subseteq B", "Express every-required-item conditions by excluding counterexamples."],
  77: ["Derived table", "\\\\text{FROM }Q\\\\text{ AS }T", "Name a FROM-subquery before using it as an intermediate relation."],
  79: ["Common table expression", "\\\\text{WITH }T\\\\text{ AS }Q", "Name a temporary relation to make multi-step SQL readable."],
  81: ["Scalar subquery contract", "Q\\\\to\\\\text{one row and one column}", "Use a subquery in scalar context only when its shape is valid."],
  83: ["DELETE statement", "\\\\text{DELETE FROM }R\\\\text{ WHERE }P", "Remove qualifying tuples while keeping the relation schema."],
  91: ["UPDATE statement", "\\\\text{UPDATE }R\\\\text{ SET }a:=f(a)\\\\text{ WHERE }P", "Change selected values; without WHERE every tuple is eligible."],
  94: ["Conditional update", "\\\\operatorname{CASE}\\\\ \\\\text{WHEN }P\\\\ \\\\text{THEN }a_1\\\\ \\\\text{ELSE }a_2\\\\ \\\\text{END}", "Apply different assignments to different row classes."]
};

const NOTES = {
  5: {
    whatYouSee: "DDL declares relation structure, domains, constraints, indexes, storage, and authorization metadata.",
    whyItMatters: "DDL changes the schema and its legal states; it is distinct from querying or modifying existing tuples.",
    intuition: "DDL defines the database type and rules; DML operates on current data.",
    technicalDetail: "The lecture places schema, attribute types, integrity constraints, indexes, physical storage, and security information inside the DDL scope.",
    pitfall: "Do not classify INSERT, DELETE, or UPDATE as DDL merely because they change persistent data.",
    connection: "CREATE TABLE, ALTER TABLE, and constraint declarations instantiate DDL on the next slides.",
    question: ["compare", "A new row is inserted without changing the table definition. Is this DDL or DML?", "It is DML: the instance changes while the schema remains unchanged.", "Structure versus current tuples."]
  },
  7: {
    whatYouSee: "CREATE TABLE combines a relation name, typed attributes, and integrity constraints into a schema declaration.",
    whyItMatters: "A correct DDL answer specifies domains and constraints; CREATE TABLE does not populate the relation.",
    intuition: "CREATE TABLE defines the container and rules. INSERT later supplies tuples that must obey them.",
    technicalDetail: "Each attribute is assigned a declared domain, with constraints such as primary key and foreign key alongside the attributes.",
    pitfall: "Do not confuse defining a relation with adding its first tuple.",
    connection: "The next slides instantiate key, foreign-key, and NOT NULL constraints.",
    question: ["derive", "What three kinds of information must CREATE TABLE communicate before any tuple is inserted?", "The relation name, each attribute and domain, and declared integrity constraints.", "Name, type, rules."]
  },
  19: {
    whatYouSee: "The slide gives the canonical SELECT-FROM-WHERE shape and states that the result is a relation.",
    whyItMatters: "It is the translation template for later queries: choose output attributes, identify sources, then filter candidate tuples.",
    intuition: "Start with the desired table, name its source relations, and write the predicate that keeps valid rows.",
    technicalDetail: "The abstract shape separates output attributes, input relations, and a row predicate; textual clause order is not every logical evaluation step.",
    pitfall: "Do not project away an attribute before a later predicate or join needs it.",
    connection: "The BIG 6 extends this template with grouping, aggregate filtering, and ordering.",
    question: ["trace", "For names of CS instructors earning above 70,000, what belongs in SELECT, FROM, and WHERE?", "SELECT name; FROM instructor; WHERE the department is Computer Science and salary is above 70,000.", "Output, source, predicate."]
  },
  24: {
    whatYouSee: "SQL preserves duplicate result rows by default; DISTINCT explicitly removes duplicates.",
    whyItMatters: "SQL is not automatically identical to relational-algebra set semantics, so duplicate handling can change counts and answers.",
    intuition: "SELECT ALL keeps every produced row; SELECT DISTINCT collapses equal output rows.",
    technicalDetail: "Removing projected attributes can make distinct source rows equal, so duplicate policy applies after the requested columns are formed.",
    pitfall: "Do not assume SELECT silently deduplicates.",
    connection: "COUNT and UNION ALL reuse this duplicate-preserving versus duplicate-eliminating distinction.",
    question: ["contrast", "Two source rows have the same projected department name. What changes between SELECT dept_name and SELECT DISTINCT dept_name?", "SELECT may return both copies; SELECT DISTINCT returns one copy.", "Ask whether duplicates are preserved."]
  },
  31: {
    whatYouSee: "The worked query joins instructor and teaches by matching their identifiers, then returns name and course_id.",
    whyItMatters: "This is the standard multi-table translation: join on keys, filter if needed, and project the requested columns.",
    intuition: "The key equality is the bridge; without it, FROM creates unrelated pairings.",
    technicalDetail: "The join predicate is $\\\\text{instructor.ID}=\\\\text{teaches.ID}$. The identifier is used for linkage, while name and course_id form the requested output.",
    pitfall: "Do not join tables by row position or omit the key predicate.",
    connection: "The same identity logic appears in Chapter 2 algebra and in the SQL homework exercises.",
    question: ["diagnose", "Why does FROM instructor, teaches alone not mean an instructor teaches the listed course?", "It creates every possible pair. The predicate $\\\\text{instructor.ID}=\\\\text{teaches.ID}$ keeps only related pairs.", "FROM creates candidates; WHERE establishes the relationship."]
  },
  42: {
    whatYouSee: "UNION, INTERSECT, and EXCEPT combine compatible query results for courses offered in different semesters.",
    whyItMatters: "Set operators express either-or, both, and left-only requirements, but operand compatibility is mandatory.",
    intuition: "Build two same-shaped result sets, then choose how membership should combine.",
    technicalDetail: "The examples project course_id from Fall 2017 and Spring 2018 before applying each set operator.",
    pitfall: "Do not use UNION for unrelated schemas or forget that EXCEPT is directional.",
    connection: "NOT EXISTS later reuses the set-difference idea to express universal requirements.",
    question: ["contrast", "Which operator returns courses offered in Fall 2017 but not Spring 2018?", "EXCEPT, with the Fall result on the left and the Spring result on the right.", "Left-only membership."]
  },
  45: {
    whatYouSee: "NULL means unknown or non-existent; arithmetic with NULL remains NULL, while IS NULL tests it explicitly.",
    whyItMatters: "NULL changes comparison, arithmetic, filtering, and aggregate behavior. It is not zero or an empty string.",
    intuition: "NULL is missing knowledge, not an ordinary value.",
    technicalDetail: "An ordinary comparison with NULL is not a valid NULL test because it yields UNKNOWN; use IS NULL.",
    pitfall: "Use IS NULL when you mean to find missing salaries.",
    connection: "The next slides explain three-valued logic and why WHERE discards UNKNOWN rows.",
    question: ["diagnose", "Why does an ordinary salary comparison fail to find missing salaries?", "The comparison evaluates to UNKNOWN, not TRUE. Use IS NULL for the explicit NULL test.", "NULL is not an ordinary value."]
  },
  54: {
    whatYouSee: "The BIG 6 places SELECT, FROM, WHERE, GROUP BY, HAVING, and ORDER BY into one aggregate-query pipeline.",
    whyItMatters: "It is a compact checklist for constructing and debugging SQL answers involving groups.",
    intuition: "Build rows, filter rows, form groups, filter groups, choose output columns, then sort.",
    technicalDetail: "The reasoning order is FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY; physical optimizers may use another plan.",
    pitfall: "Do not put an aggregate predicate in WHERE or treat ORDER BY as relation content.",
    connection: "The worked example shows the role of each clause.",
    question: ["trace", "Where do row and group predicates go in a query for average credits per section with at least two students?", "Use WHERE for row-level conditions, GROUP BY for section identity, HAVING for the count threshold, and ORDER BY for display.", "Rows first, groups second, display last."]
  },
  56: {
    whatYouSee: "A subquery is a complete SELECT-FROM-WHERE expression nested inside an outer query.",
    whyItMatters: "Subqueries create relation-valued or scalar intermediate results for larger conditions.",
    intuition: "Treat the inner query as a typed result: relation-valued in FROM or WHERE, scalar-valued in a scalar expression.",
    technicalDetail: "A SELECT subquery must produce one value per outer row; a FROM subquery is a derived table and needs a name.",
    pitfall: "Do not assume every subquery returns one value or that a FROM subquery can remain unnamed.",
    connection: "IN, SOME, ALL, EXISTS, CTEs, and scalar subqueries specialize this mechanism.",
    question: ["classify", "What must you check before placing a subquery directly in a SELECT expression?", "It must return one value for each outer row, normally one row and one column.", "Scalar context has a shape contract."]
  },
  63: {
    whatYouSee: "SOME makes a comparison true when at least one value from the subquery satisfies it.",
    whyItMatters: "SOME is existential quantification; confusing it with ALL reverses the condition's strength.",
    intuition: "One witness is enough for SOME; one counterexample defeats ALL.",
    technicalDetail: "For comparison theta, x theta SOME(Q) means there exists q in Q such that x theta q.",
    pitfall: "Do not read SOME as a synonym for ALL.",
    connection: "EXISTS provides a related witness test; NOT EXISTS expresses absence of a counterexample.",
    question: ["contrast", "If a salary is above one but not every salary in the subquery, does greater-than SOME or greater-than ALL succeed?", "Greater-than SOME succeeds; greater-than ALL fails because one comparison is false.", "Existential versus universal."]
  },
  66: {
    whatYouSee: "ALL makes a comparison true only when every value returned by the subquery satisfies it.",
    whyItMatters: "ALL captures a universal requirement and is stronger than SOME.",
    intuition: "To disprove ALL, find one violating value.",
    technicalDetail: "For comparison theta, x theta ALL(Q) means every q in Q satisfies x theta q.",
    pitfall: "Do not check only one convenient value unless it proves the universal claim.",
    connection: "NOT EXISTS later rewrites all-required conditions as no-missing-item conditions.",
    question: ["contrast", "What single observation disproves a predicate using ALL?", "One subquery value for which the comparison is false disproves ALL.", "Find a counterexample."]
  },
  73: {
    whatYouSee: "The query keeps students for whom no required Biology course is missing from their taken-course set.",
    whyItMatters: "This is the reusable division pattern: universal requirements become absence-of-counterexample queries.",
    intuition: "Required courses minus courses taken must be empty for each retained student.",
    technicalDetail: "The correlated subquery builds the student-specific taken set; NOT EXISTS checks that the required-minus-taken difference has no tuple.",
    pitfall: "Do not use a scalar equality test for a set-containment requirement.",
    connection: "This links EXCEPT, NOT EXISTS, correlation, and homework 3.28.",
    question: ["derive", "How does NOT EXISTS prove that a student took all required courses?", "It searches for a required course the student did not take; if no counterexample exists, the universal condition holds.", "No missing item."]
  },
  79: {
    whatYouSee: "WITH names a temporary relation visible only to the surrounding query.",
    whyItMatters: "CTEs make nested aggregation and multi-step logic readable without changing stored data.",
    intuition: "Name an intermediate result once, then query it as a relation.",
    technicalDetail: "A CTE has the form WITH T AS (Q) and can expose explicit column names for the derived relation.",
    pitfall: "Do not mistake a CTE for a permanent table.",
    connection: "Homework uses WITH for maximum-per-group and repeated-course queries.",
    question: ["compare", "What does a CTE change: the stored schema or the readability of one query?", "It changes neither stored schema nor data; it names a temporary query result within one statement.", "Temporary relation, statement scope."]
  },
  91: {
    whatYouSee: "UPDATE changes all rows, a salary-selected subset, or rows below a scalar average depending on its WHERE clause.",
    whyItMatters: "UPDATE is powerful and dangerous: WHERE determines the mutation set and SET determines the new values.",
    intuition: "Identify rows eligible for mutation before calculating the assignment.",
    technicalDetail: "The lecture contrasts PostgreSQL's same-table subquery behavior with MySQL restrictions; DBMS-specific behavior must be labeled.",
    pitfall: "Never omit WHERE accidentally when the intention is to update a subset.",
    connection: "DELETE and INSERT share the DML boundary; foreign-key and cascade rules constrain legal changes.",
    question: ["diagnose", "What happens when the WHERE clause is removed from an UPDATE that multiplies every salary by 1.05?", "Every instructor tuple becomes eligible for the five-percent raise.", "Mutation scope comes from WHERE."]
  },
  99: {
    whatYouSee: "The closing slide separates the lecture summary from optional homework and identifies the final consolidation targets.",
    whyItMatters: "Aggregation, the BIG 6, subqueries, and CTEs are the Chapter 3 practice targets named by the lecture.",
    intuition: "Use this page as a retrieval checklist, not as a new technical derivation.",
    technicalDetail: "The optional textbook set is 3.1, 3.3, 3.6, 3.11, 3.27, and 3.28 on page 115; some solutions use joins introduced in Chapter 4.",
    pitfall: "Do not promote optional textbook depth to lecture scope or treat the project announcement as theory.",
    connection: "The question bank maps the practice targets to source-backed retrieval and contrast drills.",
    question: ["plan", "Which four targets should you retrieve before attempting the optional Chapter 3 homework?", "Aggregation with GROUP BY and HAVING, the BIG 6 pipeline, nested subqueries, and common table expressions.", "Use the summary bullets."]
  }
};

function uniqueRefs(refs) {
  const seen = new Set();
  return (Array.isArray(refs) ? refs : []).filter(ref => {
    const key = [ref.sourceId, ref.page, ref.role].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyStudyLayer(input) {
  const data = input || JSON.parse(fs.readFileSync(FILE, "utf8"));
  data.summary = "All 99 supplied Chapter 3 lecture pages with source extraction, SQL explanations, named formulas, textbook pointers, and Socratic checkpoints.";
  data.coreSlideNumbers = CORE_SLIDES;
  data.source = Object.assign({}, data.source, {
    sourceId: SOURCE_ID,
    sourceType: "lecture",
    fileName: "chapter3.pdf",
    pageCount: data.slides.length,
    access: "local-only",
    assetPolicy: "page-renders-only",
    courseCodePrintedOnSlide: "DSA5104",
    atlasCourseId: "DSA5104"
  });
  data.extraction = Object.assign({}, data.extraction, {
    sourceJson: "data/extracted/DSA5104/chapter3.json",
    parser: {
      triage: { tool: "pdftotext", pageCount: data.slides.length },
      primary: { tool: "pymupdf", version: "1.28.2" },
      fallback: { tool: "mineru", version: "not-installed-or-not-run", pages: [] }
    },
    markdownReaderView: "data/extracted/DSA5104/chapter3.md"
  });

  for (const slide of data.slides) {
    const page = Number(slide.slideNumber);
    const note = NOTES[page];
    slide.kind = "lecture-source";
    slide.status = "reviewed";
    slide.assetPath = ASSET_ROOT + "/slide-" + String(page).padStart(2, "0") + ".jpg";
    slide.sourceRef = { sourceId: SOURCE_ID, sourceType: "lecture", page, role: "Chapter 3 lecture slide", status: "current" };
    slide.lecturePriority = page === 99 ? "exercise" : CORE_SLIDES.includes(page) ? "core" : "context";
    slide.sourceNote = "Extracted text is a reader layer; the rendered slide remains authoritative.";
    if (note) {
      slide.explanation = Object.assign({}, slide.explanation, note);
      const q = note.question;
      slide.socraticQuestions = [{ type: q[0], prompt: q[1], answer: q[2], hint: q[3] }];
      delete slide.explanation.question;
    }
    slide.textbookRefs = uniqueRefs(TEXTBOOK_SLIDES.has(page) ? (slide.textbookRefs || []).concat(TEXTBOOK) : slide.textbookRefs);
    slide.referenceRefs = uniqueRefs(slide.referenceRefs);
    if (FORMULAS[page]) {
      slide.keyFormula = { latex: FORMULAS[page][1], name: FORMULAS[page][0], purpose: FORMULAS[page][2], sourceType: "lecture", sourceRefs: [slide.sourceRef] };
    } else {
      delete slide.keyFormula;
    }
    if (slide.extraction && Array.isArray(slide.extraction.blocks)) {
      slide.extraction.sourceId = SOURCE_ID;
      slide.extraction.page = page;
    }
  }
  return data;
}

if (require.main === module) {
  const data = applyStudyLayer();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("Added Chapter 3 SQL study layers to " + data.slides.length + " slides.");
}

module.exports = { applyStudyLayer };
