const CONTEXT = Object.freeze({
  chapter1: new Set([...Array.from({ length: 7 }, (_, index) => index + 1), 46, 47, 48, 49, 50, 51]),
  chapter2: new Set([1, 2, 42, 45]),
  chapter3: new Set([1, 2, 3, 98])
});

const EXERCISE = Object.freeze({
  chapter1: new Set([52]),
  chapter2: new Set([46]),
  chapter3: new Set([99])
});

const HIGH_YIELD = Object.freeze({
  chapter1: {
    8: { focus: "Name the file-system limitations a DBMS addresses: redundancy, difficult access, integrity, atomicity, concurrency, and security.", trap: "A DBMS is not merely a faster file store; its guarantees are part of the answer." },
    12: { focus: "Place a requirement at the view, logical, or physical level before explaining the DBMS behavior.", trap: "A user view is not the logical schema, and neither is the physical storage layout." },
    14: { focus: "Use the relational model vocabulary: relations contain tuples, attributes have domains, and constraints define legal states.", trap: "Do not infer tuple identity from row position or spreadsheet formatting." },
    18: { focus: "Distinguish the physical, logical, and view levels and state what detail each level hides.", trap: "Changing storage details should not require changing the logical schema or user view." },
    22: { focus: "Schema is the stable structure; instance is the current set of stored data. INSERT changes the instance.", trap: "DDL changes schema; a row insertion does not." },
    24: { focus: "Explain physical data independence as changing storage representation without changing the logical schema or views.", trap: "An index or record layout is a physical choice, not a new relation in the logical model." },
    25: { focus: "Classify DDL as schema definition and constraint declaration, separate from querying and tuple modification.", trap: "CREATE TABLE defines an empty relation shape; it does not populate the table." },
    28: { focus: "Classify DML as operations over the current tuples and keep it separate from schema definition.", trap: "INSERT, DELETE, and UPDATE do not redefine the relation schema." },
    30: { focus: "Remember the declarative boundary: SQL states the desired result while the DBMS chooses how to compute it.", trap: "SQL text is not the same thing as the physical execution plan." },
    33: { focus: "Separate logical design (relation schemas and constraints) from physical design (storage layout and access methods).", trap: "An index can improve access cost but does not replace a key or integrity constraint." },
    37: { focus: "Reason about performance in block transfers and data movement, not only in the number of SQL tokens.", trap: "A logically simple query can still be expensive when it moves many blocks." },
    39: { focus: "Trace the query processor: parse/translate the request, choose an evaluation plan, then execute it.", trap: "The optimizer may change the plan while preserving the query's logical result." },
    40: { focus: "Read a query plan as the DBMS's chosen evaluation strategy and use it to locate likely cost drivers.", trap: "The result table tells you what was returned; EXPLAIN tells you how it was obtained." },
    41: { focus: "Define a transaction as the logical unit that must preserve a consistent outcome across failure or concurrent access.", trap: "Atomicity is about the business operation, not simply the number of SQL statements." }
  },
  chapter2: {
    4: { focus: "Schema lists relation attributes; instance is the current set of tuples over that schema.", trap: "An INSERT changes the instance, while ALTER TABLE changes the schema." },
    5: { focus: "A domain is the set of permitted values for an attribute; use it when checking whether a tuple is legal.", trap: "A column label alone does not define all valid values." },
    6: { focus: "Treat relations as sets of tuples: tuple order is not semantic identity.", trap: "Do not use displayed row order to justify a relational-algebra result." },
    8: { focus: "Check key uniqueness and minimality: superkey, candidate key, and chosen primary key are not synonyms.", trap: "A superkey with an unnecessary attribute is not a candidate key." },
    10: { focus: "Map the key definitions to the University DDL: primary keys identify tuples and foreign keys reference existing keys.", trap: "A foreign key expresses a relationship; it is not automatically the primary key of the child relation." },
    11: { focus: "Read the University schema diagram as relations, attributes, primary keys, and foreign-key links.", trap: "The diagram is schema evidence, not a snapshot of the current rows." },
    14: { focus: "Relational algebra is closed: each operator consumes relation-valued input and returns a relation-valued result.", trap: "Closure is what permits a multi-step expression; do not treat an intermediate result as a scalar." },
    15: { focus: "Selection filters tuples with a predicate and preserves the relation's attributes.", trap: "Relational-algebra selection is row filtering; it is not SQL's SELECT clause." },
    17: { focus: "Projection keeps selected attributes and, under relation set semantics, removes duplicate result tuples.", trap: "Projection changes columns and can also reduce row count after duplicates collapse." },
    19: { focus: "Explain why removing attributes can make previously distinct tuples identical.", trap: "Do not assume projection is row-preserving just because it removes columns." },
    20: { focus: "Evaluate nested algebra inside out: selection, join/product, and projection must each receive the right relation shape.", trap: "Projecting away a join attribute too early makes the later predicate impossible." },
    21: { focus: "Cartesian product pairs every tuple in one relation with every tuple in the other; its cardinality is |r|·|s|.", trap: "The product alone does not establish a real relationship between tuples." },
    24: { focus: "Recognize a theta join as a product filtered by its matching predicate.", trap: "Without the predicate, the result is the full Cartesian product, including false associations." },
    25: { focus: "Use the actual key match, such as `instructor.ID = teaches.ID`, to turn the product into meaningful assignments.", trap: "Joining on an incidental same-name column can silently create the wrong pairs." },
    26: { focus: "Translate the algebra join into SQL by carrying the relation link into an explicit WHERE or JOIN condition.", trap: "Listing two tables without a matching predicate is a Cartesian product." },
    27: { focus: "Use `join = product + selection` when expanding or checking a relational-algebra derivation.", trap: "A join is not a magical pairing; its predicate supplies the semantics." },
    28: { focus: "Before UNION, verify equal arity and compatible corresponding domains; then reason about either-or membership.", trap: "Two tables with the same number of columns are not automatically union-compatible." },
    30: { focus: "Intersection keeps tuples present in both compatible relations.", trap: "Intersection is not the same as union: it requires membership in both inputs." },
    31: { focus: "Read r − s directionally: keep tuples in r that are absent from s.", trap: "Set difference is not commutative; reversing operands changes the question." },
    34: { focus: "Use rename to give an expression or repeated relation reference a distinct name.", trap: "Rename creates a query alias, not a second independent stored table." },
    35: { focus: "Use two renamed roles of one relation for self-comparison, such as comparing one instructor's salary with another's.", trap: "Without distinct aliases the two roles of the same relation cannot be separated." },
    37: { focus: "Query equivalence means equal results for every database instance, not merely equal output on one sample.", trap: "Similar-looking syntax or one matching example is not a proof of equivalence." },
    39: { focus: "Recognize the equivalent join and product-plus-selection forms and explain why a DBMS may choose either plan.", trap: "A physical rewrite is valid only when it preserves the logical result." },
    43: { focus: "Spot redundancy and update, insertion, and deletion anomalies in a relation that repeats the same fact.", trap: "Fewer tables do not automatically mean a better relational design." },
    44: { focus: "Use decomposition to separate facts at the right grain, then ask whether the intended information can still be reconstructed.", trap: "Splitting a table is not enough; preservation and lossless reconstruction still matter." }
  },
  chapter3: {
    5: { focus: "Classify DDL as schema definition: CREATE TABLE declares attributes and constraints rather than current rows.", trap: "Do not mix a schema-changing statement with a tuple-changing statement." },
    7: { focus: "Write CREATE TABLE with correct domains and constraints, then distinguish the empty schema from its future instance.", trap: "CREATE TABLE does not insert a tuple." },
    8: { focus: "Use PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE, and CHECK as explicit integrity mechanisms.", trap: "An application-side check is not equivalent to a database-enforced constraint." },
    12: { focus: "Predict a MySQL foreign-key violation from the referenced-key condition before running the INSERT.", trap: "The child value must match an existing referenced key unless the constraint permits NULL." },
    14: { focus: "DELETE removes qualifying tuples; identify the target relation and the exact WHERE predicate first.", trap: "DELETE without WHERE targets every tuple in the relation." },
    15: { focus: "DROP TABLE removes the relation definition as well as its stored data; contrast it with DELETE.", trap: "DROP is not a row-level cleanup operation." },
    19: { focus: "Translate an English request into the SQL shape: output columns, source relations, then row predicate.", trap: "SQL clause order is not the same as the order in which you should reason about the request." },
    20: { focus: "SELECT chooses result expressions; combine it with FROM and WHERE to specify the requested relation.", trap: "SELECT does not by itself mean DISTINCT." },
    24: { focus: "SQL may preserve duplicate result rows, unlike relational-algebra set semantics; decide when DISTINCT is required.", trap: "A duplicate-looking output may be correct if multiplicity is part of the SQL result." },
    28: { focus: "WHERE filters candidate rows using a predicate; it runs before grouping and cannot normally test a post-aggregation condition.", trap: "Use HAVING for group-level conditions, not WHERE." },
    29: { focus: "FROM supplies the input relations and, when no join predicate is given, forms their Cartesian product.", trap: "Multiple relations in FROM do not imply a key-based join." },
    31: { focus: "For a multi-table query, join on the intended keys, add row filters, and project only requested columns.", trap: "A correct-looking result on a tiny sample can hide a missing join predicate." },
    32: { focus: "Use table and column aliases to qualify attributes and make repeated relation roles unambiguous.", trap: "An alias changes the query name, not the underlying schema." },
    37: { focus: "Use LIKE patterns deliberately: % matches an arbitrary string and _ matches one character.", trap: "Pattern wildcards are not interchangeable with ordinary literal characters." },
    39: { focus: "Treat MySQL string comparison behavior as a collation question, not as a universal SQL rule.", trap: "SQL identifier case and string-value case are different issues." },
    40: { focus: "Use ORDER BY when output order is part of the requested result or when inspecting a deterministic answer.", trap: "Without ORDER BY, row order is not guaranteed." },
    41: { focus: "Read BETWEEN as an inclusive range predicate and check its endpoints.", trap: "Do not silently replace an inclusive range with a strict inequality." },
    42: { focus: "Choose UNION, INTERSECT, or EXCEPT from the English requirement: either, both, or left-only.", trap: "Set operations require compatible result shapes." },
    44: { focus: "Check that both set-operation operands return the same number of attributes with compatible types and meanings.", trap: "Matching column names alone is not sufficient compatibility." },
    45: { focus: "Treat NULL as missing/unknown rather than zero or an empty string; track its effect through comparisons and aggregates.", trap: "`NULL = NULL` is not a true nullness test." },
    46: { focus: "Use IS NULL and IS NOT NULL for nullness; ordinary comparisons with NULL produce UNKNOWN.", trap: "WHERE keeps TRUE rows, so UNKNOWN rows are filtered out." },
    48: { focus: "Apply three-valued logic in WHERE: TRUE survives, FALSE and UNKNOWN do not.", trap: "UNKNOWN is not the same value as FALSE, even though both are excluded by WHERE." },
    49: { focus: "Know the aggregate family and the distinction between COUNT(*), COUNT(column), and COUNT(DISTINCT column).", trap: "Most aggregates ignore NULL inputs, while COUNT(*) counts rows." },
    51: { focus: "GROUP BY partitions input rows; each aggregate is then computed per group.", trap: "Do not interpret an aggregate as one global value after grouping." },
    52: { focus: "Every selected non-aggregate expression must be represented in GROUP BY under the lecture's query rules.", trap: "Selecting an ungrouped column beside an aggregate is not a harmless formatting choice." },
    53: { focus: "Use WHERE for row filters before grouping and HAVING for conditions on completed groups.", trap: "Moving an aggregate predicate from HAVING to WHERE changes the query meaning or makes it invalid." },
    54: { focus: "Use the BIG 6 checklist: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY.", trap: "Write the clauses in SQL syntax order but reason through their row/group effects separately." },
    55: { focus: "Trace the complete grouped query from input rows to groups, HAVING filter, selected output, and ordering.", trap: "Do not apply HAVING before the groups or ORDER BY before the final result exists." },
    56: { focus: "Classify a subquery by its role: membership, comparison, existence, derived table, CTE, or scalar value.", trap: "The inner query's cardinality determines which outer operator is valid." },
    57: { focus: "A WHERE subquery supplies a set, Boolean existence test, or scalar value for the outer predicate.", trap: "Do not assume the inner query is independent when it references an outer alias." },
    58: { focus: "Use IN for value membership in the set returned by a subquery.", trap: "IN is not ordinary equality with a multi-row result." },
    60: { focus: "Use NOT IN cautiously when NULL can appear in the subquery result; compare it with a NULL-safe NOT EXISTS formulation.", trap: "One NULL can make a NOT IN predicate evaluate to UNKNOWN rather than TRUE." },
    62: { focus: "Translate SOME as ‘at least one’ and ALL as ‘every’ before writing the comparison query.", trap: "Swapping SOME and ALL reverses the strength of the condition." },
    63: { focus: "SOME is existential: one qualifying value in the inner result is enough.", trap: "A row need not beat every inner value to satisfy SOME." },
    66: { focus: "ALL is universal: the comparison must hold for every value in the inner result.", trap: "ALL is stronger than SOME; test the maximum/minimum intuition carefully." },
    69: { focus: "EXISTS tests whether the subquery returns at least one row; it does not count or return the inner values.", trap: "An EXISTS predicate is usually about a correlated witness, not about selecting inner columns." },
    70: { focus: "For a correlated EXISTS, identify the outer-to-inner predicate that ties each candidate row to its witness.", trap: "Without correlation, EXISTS may be true for every outer row once the inner relation is nonempty." },
    73: { focus: "Translate ‘for every’ into NOT EXISTS of a counterexample; this is the canonical SQL division pattern.", trap: "Checking that at least one required item exists does not prove that all required items exist." },
    74: { focus: "For taken-all-courses queries, search for a required course that the student has not taken and require no such counterexample.", trap: "The missing-item predicate is the heart of the universal condition." },
    77: { focus: "A subquery in FROM is a derived table and must have a usable alias for the outer query.", trap: "A derived table is an intermediate query result, not a persistent base table." },
    79: { focus: "WITH names temporary relations for one statement and makes multi-stage reasoning explicit.", trap: "A CTE does not create a persistent table or change the stored schema." },
    80: { focus: "Break nested aggregation into named CTE stages, then verify each intermediate relation before composing the final query.", trap: "Skipping an intermediate grain can compare incompatible totals and averages." },
    81: { focus: "A scalar subquery must provide one row and one column (or the DBMS-specific NULL behavior for no row).", trap: "A multi-row subquery cannot be used where one scalar value is required." },
    82: { focus: "Classify INSERT, DELETE, and UPDATE as tuple modifications and identify their target set before execution.", trap: "Mutation syntax is not safe merely because it parses." },
    83: { focus: "Preview a DELETE with the same WHERE predicate in SELECT and check the affected keys.", trap: "Omitting WHERE changes a targeted delete into a relation-wide delete." },
    84: { focus: "When a referenced key changes, reason from referential integrity and the configured ON UPDATE action.", trap: "A child row cannot be left pointing at a missing parent key." },
    85: { focus: "ON UPDATE CASCADE propagates a referenced-key change to matching foreign-key values.", trap: "Cascade is a configured integrity action, not the default for every key update." },
    86: { focus: "For a mutation driven by a subquery, separate the qualifying query from the state change and check DBMS restrictions.", trap: "Same-table DELETE/UPDATE subqueries can be restricted in MySQL even when the logical request is clear." },
    88: { focus: "Recognize the MySQL same-table mutation restriction and rewrite through a derived result or a safe two-step workflow when needed.", trap: "Do not treat one DBMS's restriction as a universal SQL semantic rule." },
    89: { focus: "INSERT supplies a new tuple; match values to columns or use an explicit column list to make the target shape clear.", trap: "Positional VALUES without a column list is fragile when schema order changes." },
    90: { focus: "Use INSERT ... SELECT when the new tuples come from a relational query, and check key/constraint effects.", trap: "The SELECT result must match the target column shape and domains." },
    91: { focus: "For UPDATE, define the target set with WHERE and the new values with SET; preview both before mutation.", trap: "UPDATE without WHERE changes every row." },
    93: { focus: "Apply the MySQL same-table UPDATE restriction to subquery-driven changes and choose a legal rewrite.", trap: "A query that is valid in another DBMS may not be accepted by MySQL." },
    94: { focus: "Use CASE or complementary predicates to express conditional updates without overlapping or missing branches.", trap: "Check the boundary condition and the fallback branch, not just the arithmetic." },
    95: { focus: "Read CASE in SET as a per-row choice of the new value based on the current row predicate.", trap: "CASE computes values; it does not replace the UPDATE target predicate." },
    96: { focus: "When a scalar aggregate drives UPDATE, check no-match behavior and the resulting NULL before writing the mutation.", trap: "SUM over no matching rows can produce NULL rather than numeric zero." }
  }
});

const POLICY = Object.freeze({
  highYieldDefinition: "Derived from supplied lecture definitions, canonical worked examples, edge cases, and project/homework relevance; it is not evidence from a past-year paper.",
  readerRule: "Only high-yield slides carry Atlas study notes. Support, context, and exercise slides remain available as source material but do not create extra study prose.",
  priorityOrder: ["high-yield", "support", "context", "exercise"]
});

function priorityFor(chapter, page) {
  if (EXERCISE[chapter].has(page)) return "exercise";
  if (CONTEXT[chapter].has(page)) return "context";
  if (HIGH_YIELD[chapter][page]) return "high-yield";
  return "support";
}

function applyStudyLayer(data, chapter) {
  const highYieldSlideNumbers = [];
  const coreSlideNumbers = [];
  for (const slide of data.slides || []) {
    const page = Number(slide.slideNumber);
    const studyPriority = priorityFor(chapter, page);
    slide.studyPriority = studyPriority;
    slide.lecturePriority = studyPriority === "exercise" ? "exercise" : studyPriority === "context" ? "context" : "core";
    delete slide.explanation;
    delete slide.socraticQuestions;
    if (studyPriority === "high-yield") {
      const note = HIGH_YIELD[chapter][page];
      slide.studyNote = { focus: note.focus, trap: note.trap };
      highYieldSlideNumbers.push(page);
    } else {
      delete slide.studyNote;
    }
    if (studyPriority === "high-yield" || studyPriority === "support") coreSlideNumbers.push(page);
  }
  data.coreSlideNumbers = coreSlideNumbers;
  data.highYieldSlideNumbers = highYieldSlideNumbers;
  data.studyPolicy = POLICY;
  return data;
}

module.exports = { applyStudyLayer, HIGH_YIELD, priorityFor };
