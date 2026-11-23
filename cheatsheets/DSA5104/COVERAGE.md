# DSA5104 study-reference coverage

This is the maintenance/source companion, kept outside the printable reference.
The historical tables record the 41 initial requests and 29 follow-up requests
that introduced the concepts. They describe those earlier revisions, including
original question labels, field names and dataset checks.

The current PDF expresses those concepts as standalone rules and templates.
For example, its trigger now uses generic Score/Audit tables and two categories;
its MongoDB matching example supplies all four A--D documents. Printed labels,
old dataset IDs and question-dependent instructions have been removed.
[REVIEW.md](REVIEW.md) records this editorial pass and its acceptance checks.
Part I remains on page 1, Part II on page 2; body/code sizes remain 5.1/4.8 pt.

## Schema refinement: 7/7

| # | Requested change | Topic | Source and derived observation |
| --- | --- | --- | --- |
| 01 | Armstrong axioms and derived rules | 14 | F1: distinguish the FD closure from attribute closure; use all three axioms. |
| 02 | Enumerate all candidate keys, with completeness | 15 | F1, A1: mandatory C; AC, BC, CD are exactly the minimal keys. |
| 03 | Recursive BCNF split formula and worked decomposition | 16 | F2, A1: EF/CE/AB/AD/CD is a lossless BCNF result. |
| 04 | Projected dependencies | 16 | F2, A1: include implied dependencies; $D\to A$ and $AC\to D$ form a basis on ACD, not the entire projection. |
| 05 | Dependency-preservation closure propagation | 17 | F2, F3, A1: iterate fragments to a fixed point; BC reaches BCEF and cannot derive D. |
| 06 | Multiway lossless chase | 17 | F3: initialize distinguished/fresh symbols, unify globally, stop at an all-distinguished row or fixed point. Includes an AB/AC example. |
| 07 | FD/BCNF/lossless traps | 14–17, 12 | F1–F3: nontrivial FDs, empty determinants, binary iff test, spurious tuples, separate losslessness/DP, qualified 3NF guarantee, self-referencing FK. |

## XML and XQuery: 8/8

| # | Requested change | Topic | Source and derived observation |
| --- | --- | --- | --- |
| 08 | Well-formed/valid XML, namespaces, CDATA | 18 | X1: default namespace qualifies elements, not unprefixed attributes; attributes have no children. |
| 09 | DTD grammar, cardinalities, ID/IDREF | 18 | X1: ordered sequence versus choice; document-wide ID uniqueness and existing-ID reference. |
| 10 | XSD syntax, ref/type, occurrence defaults | 18 | X1: complete schema with typed title/credits, bounded occurrence and required ID. |
| 11 | XPath navigation, nodes, positions | 19 | X2: explicit tree/context distinguishes //x, .//x, ../x and /r/x; positions start at 1. |
| 12 | Predicate existence and order | 19 | X2: existence does not imply positive value; filter-then-first differs from first-then-filter. |
| 13 | FLWOR, for versus let | 20 | X2: counts (1,1) versus 2; braces evaluate constructor expressions. |
| 14 | General/value comparisons and quantifiers | 20 | X2, W1: existential pair comparison, singleton value comparison, node identity, empty-sequence quantifiers. |
| 15 | All three Assignment 1 templates | 20 | A1: filtered Title elements, one qualifying MName per museum, constructed MuseumCount including zero artworks. |

## MongoDB: 7/7

| # | Requested change | Topic | Source and derived observation |
| --- | --- | --- | --- |
| 16 | CRUD and operators | 21 | M1: insert/find/update/delete; comparison, logical, existence, array and update operators. |
| 17 | Projection, _id, null/missing | 21 | M1, A2, W2: exact Q1.1 filter/projection/sort; null matches missing too; inclusion/exclusion exception for _id. |
| 18 | Complete aggregation pipeline | 22 | M1, A2: Q1.2 match/group/having/project/sort; round the average before sorting. |
| 19 | Array matching and same-element conditions | 23 | M1: retained counterexample where independent dot conditions match but one `$elemMatch` does not. |
| 20 | Original first versus first qualifying item | 23–24 | A2, W2: Q2.1 selects 5 source documents; Q2.2 selects 3 and projects fields of every item. |
| 21 | Positional, `$elemMatch`, `$slice` and `$filter` projection | 24 | M1, W2: first match, explicit first match, positional slice, all qualifying elements; complete `$filter` pipeline. |
| 22 | Indexes, data model, schema and scaling | 21–22, 25 | M1: BSON, index prefix/multikey, embedding/references, replication/sharding, atomic writes; unwind and item-count trap. CAP label is explicitly the lecture's framing. |

## Spark and RDD: 4/4

| # | Requested change | Topic | Source and derived observation |
| --- | --- | --- | --- |
| 23 | RDD properties, lineage, persistence | 26 | B1, W3: immutable partitioned data, lineage recovery, lazy transformations and action-populated cache. |
| 24 | Transformations versus actions | 26 | B1, W3: classify map/flatMap/filter/group/reduce/sort and collect/count/take/write; warn about driver memory. |
| 25 | Worked map/filter/groupByKey/reduceByKey example | 26 | B1: three input pairs produce a:4,b:2; counts 3 versus 2; grouped values are unordered iterables. |
| 26 | Word count and shuffle | 26 | B1, W3: ordered procedure, intermediate pairs, a:2,b:1 result, local combining; includes brief MapReduce/DataFrame examples. |

## SQL, relational theory and access: 15/15

| # | Requested change | Topic | Source and derived observation |
| --- | --- | --- | --- |
| 27 | Logical order including windows and DISTINCT | 01, 08 | S1, review: derive windows before outer filtering; final ordering and LIMIT apply afterward. |
| 28 | Three-valued logic and empty aggregates | 02, 12 | S1, review: truth table, one ungrouped aggregate row, zero empty groups, CHECK accepts UNKNOWN. |
| 29 | Independent join multiplication | 03 | P2.Q7: separate school/crime aggregates before joining to community; numeric $2\times3$ counterexample. |
| 30 | Relational division template | 05, 11 | Review: complete double-NOT-EXISTS query, empty-required-set behavior and qualified count alternative. |
| 31 | Group averages and aggregation levels | 06 | P1/P2, review: CTE plus detail join or window; weighted mean uses non-NULL counts; numeric 40 versus 52.5 example. |
| 32 | Group-wise top-K/ranking | 08 | P2.Q4: filter NULL scores, DENSE_RANK within group, outer filter; keep tie-breaking out of the dense-rank key. |
| 33 | Window boundaries | 09 | P2.Q6: rolling SUM/AVG on 10,20,30,40, actual row counts, ROWS versus peer-aware RANGE. |
| 34 | Inconsistent known values per VIN | 07 | P1, review: `COUNT(DISTINCT make/model)>1`; four explicit known/NULL cases. |
| 35 | Correct conditional aggregation | 07 | P2.Q1, review: distinguish conditional count/sum from AVG/MIN/MAX; 100 versus 50 counterexample; retain compact grouping sets. |
| 36 | Rounding order | 10, 22 | P2.Q3/Q7/Q8, A2.Q1.2: unrounded mean comparison/growth rank, rounded distance filtering and rounded Mongo average sorting. |
| 37 | Types, numeric casts, date ranges | 04 | S1, P1, review: text versus numeric order, parsed text dates, half-open DATETIME month, TIMESTAMP time zone. |
| 38 | Relational algebra cardinalities/division | 11 | S1, review: product/select/project/join bounds, union compatibility, set division and example. |
| 39 | Constraints, roles and privileges | 12 | S1, review: PK/UNIQUE/NULL, self-reference, CASCADE/SET NULL, CHECK, GRANT OPTION; retain ER/views/ACID compactly. |
| 40 | Python DB access | 13 | Review: connection/cursor roles, parameter binding, explicit write commit, correctly indented PyMySQL and pandas/SQLAlchemy examples. |
| 41 | Correct mysqli_query return types | 13 | W4: result-producing queries return mysqli_result, other successes true, failures false or exceptions depending on reporting mode. |

## Historical follow-up PDF review: 29/29

That revision preserved the 26 topics and body/code sizes. XML/DTD used the end
of page 2 column 1; XSD continued in column 2. These positions remain unchanged.

| Item | Priority | Topic | Implemented correction or addition |
| --- | --- | --- | --- |
| 1.1 | P0 | 04 | Replace the incorrect Car Sales day/month/year pattern with exact February/year substrings and a 24-character prefix parser; explicitly retain recorded local clock time without timezone conversion (P1.Q1, actual source row). |
| 1.2 | P0 | 10 | Validate 1–99 or NULL, derive all five safety_icon bands on every UPDATE, then audit only a NULL-safe score change; actual project table/field names and error message (P2.Q9). |
| 1.3 | P0 | 18 | Use escaped hash glyphs outside the detokenizing inline-code macro; descriptions and listings now show one hash in PCDATA/REQUIRED/IMPLIED/FIXED. |
| 1.4 | P0 | 24 | Render all three slice projections as literal code; keep MongoDB dollar operators out of math mode. |
| 2.1 | P0 | 08 | Complete aggregate-first/rank-second CTE, tie example and same-block COUNT shorthand. Note P1.Q13's separate all-sales large-state cutoff and make-model grouping (P1.Q13/P2.Q7). |
| 2.2 | P1 | 07 | Complete Project 1 classification/GROUP BY query, exact price boundaries, first-branch/ELSE/NULL rules (P1.Q5). |
| 2.3 | P1 | 05 | ANY/ALL table covers both NULL-containing sets and empty input; counterexamples to substitution by MAX. RHS lists are explicitly subquery results. |
| 2.4 | P1 | 10 | Replace procedure comments with the executable rounded Haversine CTE, non-NULL coordinates, radius predicate and exact output/order columns (P2.Q8). |
| 2.5 | P1 | 06 | Replace number generation with graph transitive closure, six-pair worked result, DISTINCT termination and path/depth caveat (S2/W5). |
| 2.6 | P1 | 12 | Add ordinary/unique index DDL, role creation/privilege grant/role assignment/revoke; distinguish uniqueness and role activation. |
| 3.1 | P1 | 17 | Seven-row losslessness/BCNF/DP comparison; retain the key step in the standard 3NF guarantee. |
| 3.2 | P1 | 17 | Legal two-row instance satisfying its stated FD yields two spurious tuples through AB/BC, despite both fragments being BCNF; explicit four-row join. |
| 3.3 | P1 | 15 | Concrete candidate-key example with sizes one and two; both inclusion-minimal. |
| 4.1 | P1 | 18 | Add IDREFS and CDATA to the existing DTD, a four-type comparison and the one-ID-attribute rule (X1, pp. 43–48). |
| 4.2 | P1 | 18 | Scoped, relative-selector key/keyref example and unique/key/keyref/selector/field table; namespace note (X1, pp. 64–67; W6). |
| 4.3 | P1 | 19 | Typed id lookups, document-order node union and six XPath axes (X2, pp. 15–16; standard XPath axes). |
| 4.4 | P0 | 20 | Complete three-collection XQuery join with an explicit document binding and combination/grain explanation (X2, p. 22). |
| 4.5 | P1 | 20 | Complete distinct-department grouping/sorting constructor, aggregate/value/string functions and item-versus-distinct-title counting (X2, pp. 24–29). |
| 4.6 | P2 | 20 | Computed element/attribute constructors and an if/then/else expression (X2, pp. 21, 33). |
| 4.7 | P2 | 20 | Five-row DOM/SAX/publishing/shredding/storage comparison (X2, final processing/storage sections). |
| 5.1 | P1 | 21 | Complete replaceOne/upsert call, whole-document versus field update, immutable ID and replacement/operator distinction (M1, printed slide 81; W7). |
| 5.2 | P1 | 21 | Positional update and complete arrayFilters example; table for first/all/filtered elements, push/addToSet/pull. All/filtered positional forms are extensions beyond A2. |
| 5.3 | P1 | 22 | Count/out/merge stage fragments, set/addFields equivalence, terminal write stages and source persistence distinction (M1, printed slides 92–95; W8). |
| 5.4 | P1 | 22 | countDocuments(filter), distinct(field,filter), estimatedDocumentCount and metadata distinction (single-purpose aggregation in M1, printed slides 96–97; current method names in W11). |
| 5.5 | P1 | 25 | Text-index search, a hint naming the existing compound index before dropping it, and five explain terms (M1, printed slides 108–114). |
| 5.6 | P1 | 21 | BSON binary versus JSON text, additional BSON types and schema/type distinction. |
| 6.1 | P0 | 26 | Numeric RDD with collect/take/takeOrdered/negative-key/count/reduce results; take is not value top-K (B1, PDF p. 59 / printed slide 64; W9). |
| 6.2 | P1 | 26 | Add output cardinalities to the existing transformation table, including flatMap sum, union and distinct-key counts. |
| 6.3 | P1 | 26 | Narrow/wide dependencies, map/filter versus shuffle, and compatible-partitioner caveat (extension from shuffle/lineage; W10). |

## Course-source provenance

Raw PDFs, assignments, datasets and submitted work remain under the local
`/Users/macbook/Desktop/NUS/DSA5104` course folder. These are source identifiers,
not files redistributed by this repository. PDF page numbers below are 1-based
file pages; printed slide numbers can differ, especially in Lec11/Lec12.

| ID | sourceId and location | Use |
| --- | --- | --- |
| E1 | `DSA5104/Exam_recap.pdf`, pp. 1–2 | Prioritize FD/BCNF/decomposition, XML, MongoDB and RDD exam skills. |
| F1 | `DSA5104/Lec7_Schema Refinement-1.pdf`, pp. 20–26, 30–32 | Inference, closure and candidate-key tests. |
| F2 | `DSA5104/Lec8_Schema Refinement-2.pdf`, pp. 13–17, 26–28, 36–43 | Lossless splits, projected dependencies, preservation and BCNF. |
| F3 | `DSA5104/Lec8_Note_TestingLosslessDependencyPreserving Decompositions.pdf`, pp. 1–5 | Table chase and iterative fragment closure test. |
| A1 | `DSA5104/Assignment1.pdf`, pp. 1–2; `DSA5104/Assignment 1 Reference Answer.pdf`, pp. 1–2 | Exact six-attribute FD example and all three museum XQuery tasks. |
| X1 | `DSA5104/Lec9_XML-1.pdf`, pp. 33–34, 37–50, 52–59, 64–67 | Namespace, DTD/XSD syntax and scoped identity constraints. |
| X2 | `DSA5104/Lec10_XML-2.pdf`, pp. 1–34, 39–49; `DSA5104/Lec9_Kahoot questions_note_XML.pdf`, pp. 1–4; `DSA5104/Lec10_Kahoot_XPath_XQuery .pdf`, pp. 1–2 | Navigation, FLWOR, comparisons, processing/storage and exam traps. |
| M1 | `DSA5104/Lec11_Mongo.pdf`, p. 7, pp. 40–77, 83–95, 96–118 | Lecture CAP framing, CRUD/arrays, aggregation, indexes and modeling. |
| A2 | `DSA5104/Assignment 2/DSA5104_Assignment2.pdf`, pp. 1–3; `DSA5104/Assignment 2/sales.json`; `DSA5104/Assignment 2/tours.json` | Four exact query patterns and original first/first matching/all matching distinction. |
| B1 | `DSA5104/Lec12_BigData.pdf`, pp. 15–19, 32–37, 48–59 | MapReduce, RDD laziness, transformations/actions, reduceByKey and takeOrdered. PDF p. 59 (printed slide 64) was rendered because its code is an image. |
| P1 | `DSA5104/Project_1/proj1_questions.sql` | Car-sales SQL problems, type/date handling and inconsistent values. |
| P2 | `DSA5104/Project_2/proj2_part1_questions.sql`, Q1–Q9 | Conditional aggregation, ranking/windows, correct grain, rounding, Haversine and trigger requirements. |
| S1 | Existing Part I cheatsheet, retained and condensed; source course lectures `DSA5104/Lec1_IntroDBS.pdf` through `DSA5104/Lec6_ApplicationDevelopment.pdf` | DBMS/relational/SQL/application baseline; new Python examples follow the supplied review. |
| S2 | `DSA5104/Lec5_AdvancedSQL.pdf`, p. 49 | Recursive CTE and graph transitive closure. |

## Official semantic references

- W1: [W3C XQuery 3.1, comparison expressions](https://www.w3.org/TR/xquery-31/#id-comparisons) defines general, value and node comparisons; the general/value distinction in topic 20 follows these rules.
- W2: MongoDB's [positional projection](https://www.mongodb.com/docs/manual/reference/operator/projection/positional/), [array filtering](https://www.mongodb.com/docs/manual/reference/operator/aggregation/filter/) and [null/missing queries](https://www.mongodb.com/docs/manual/tutorial/query-for-null-fields/) support the first-versus-all projection and missing-field distinctions in topics 21–24.
- W3: [Apache Spark RDD programming guide](https://spark.apache.org/docs/latest/rdd-programming-guide.html#rdd-operations) distinguishes lazy transformations from actions and describes persistence and keyed aggregation.
- W4: [PHP mysqli_query return values and exceptions](https://www.php.net/manual/en/mysqli.query.php#refsect1-mysqli.query-returnvalues) supports the correction in topic 13.
- W5: [MySQL recursive CTEs](https://dev.mysql.com/doc/refman/8.4/en/with.html) permits UNION DISTINCT for transitive closure and duplicate elimination.
- W6: [W3C XML Schema identity constraints](https://www.w3.org/TR/xmlschema-1/) defines relative selectors/fields, required unique keys and references to key/unique constraints.
- W7: [MongoDB replaceOne](https://www.mongodb.com/docs/manual/reference/method/db.collection.replaceOne/) specifies replacement documents, upsert and immutable ID handling.
- W8: MongoDB's [out](https://www.mongodb.com/docs/manual/reference/operator/aggregation/out/) and [merge](https://www.mongodb.com/docs/manual/reference/operator/aggregation/merge/) describe terminal write-output stages.
- W9: [PySpark RDD.takeOrdered](https://spark.apache.org/docs/latest/api/python/reference/api/pyspark.RDD.takeOrdered.html) supports ordering by an optional key before selecting results.
- W10: [Spark NarrowDependency](https://spark.apache.org/docs/latest/api/java/org/apache/spark/NarrowDependency.html) defines limited parent dependencies for each child partition.
- W11: MongoDB's [countDocuments](https://www.mongodb.com/docs/manual/reference/method/db.collection.countDocuments/), [distinct](https://www.mongodb.com/docs/manual/reference/method/db.collection.distinct/) and [estimatedDocumentCount](https://www.mongodb.com/docs/manual/reference/method/db.collection.estimatedDocumentCount/) define filtered counts, unique field values and metadata estimates.
- W12: [MySQL SELECT INTO](https://dev.mysql.com/doc/refman/8.4/en/select-into.html) defines the one-row lookup, unchanged variables on no row, and the multiple-row error.
- W13: [MongoDB elemMatch projection](https://www.mongodb.com/docs/manual/reference/operator/projection/elemmatch/) returns the first matching array element and omits the array field when no element matches.
- W14: [MongoDB replica-set elections](https://www.mongodb.com/docs/manual/core/replica-set-elections/) explains majority voting, step-down during a partition, and configured secondary reads.
- W15: [W3C XQuery value comparisons](https://www.w3.org/TR/xquery-31/#id-value-comparisons) specifies operand cardinality after atomization and the empty-sequence result.
- W16: MySQL's [set operations](https://dev.mysql.com/doc/refman/8.4/en/set-operations.html), [INTERSECT](https://dev.mysql.com/doc/refman/8.4/en/intersect.html) and [EXCEPT](https://dev.mysql.com/doc/refman/8.4/en/except.html) define DISTINCT/ALL behavior, compatible query columns and result ordering; Topic 01 uses the supplied A/B bags for the six-result table.

## Previous revision's validation record

- pdfLaTeX compilation: two A4 portrait pages; no overfull/underfull boxes. Both pages rendered with Poppler and inspected by column.
- All 144 authored math expressions render with KaTeX in strict error mode, in addition to their LaTeX PDF rendering. MongoDB operators are checked as code, not counted as math.
- Exhaustive subset checks verify all three A1 keys, the five final BCNF fragments, the ACD projection basis and the failed BC dependency-preservation test.
- Small SQLite fixtures verify NULL logic, empty aggregates, conditional AVG/COUNT, frame boundaries, rank ties, division (including an empty required set), weighted means and join multiplication. These check portable SQL semantics; they are not a MySQL stored-program execution claim.
- lxml parses and validates the DTD/XSD examples, checks IDREFS/default attribute values and typed id lookup, and tests the new key/keyref constraints against valid, dangling, duplicate and missing-key cases. XPath context/union/axes are checked with small trees. XQuery templates were checked against A1's reference answer and the cited Lec10 examples; no XQuery engine was used.
- Offline calculations on the eight source sales documents verify Q2.1's five IDs and Q2.2's three IDs, plus first/all-match examples. MongoDB query execution and a Spark cluster run are outside this check; the worked examples were checked directly against the data and arithmetic.
- All five Python listings pass syntax parsing. The numeric RDD's first/ordered/negative-key results and transformation cardinalities are checked by independent list/set calculations. Context variables and external database connections are supplied by a caller when using the access examples.
- The exact Haversine CTE runs against a small SQLite fixture with registered math functions: known distance 111.19492664 km, rounded-boundary inclusion, missing coordinates and final ordering. The procedure/trigger DDL was not executed in MySQL.
- The trigger's actual CASE expression passes all 11 NULL/band-edge cases; its validation rejects -1/0/100. NULL-safe score transitions and the unconditional icon recomputation before conditional auditing are checked separately, including an icon-only incorrect update.
- The classification query and aggregate-first ranking run on SQLite fixtures, including all price boundaries and ties. ANY/ALL NULL cases are checked through their OR/AND three-valued semantics; the graph query uses SQLite UNION's distinct semantics and reaches six acyclic pairs or sixteen cyclic pairs at a fixed point. The Car Sales parser/predicate positions are verified against an actual source timestamp.
