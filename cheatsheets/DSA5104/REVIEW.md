# DSA5104 standalone-reference review

The printable artifact is an exam reference for a new question. It must supply
its own notation, schemas, assumptions, decision rules and examples. Course
question labels for topics 15 through 24 and historical dataset checks belong
in COVERAGE.md.
The existing 26 topics, two A4 portrait pages and 5.1/4.8 pt body/code sizes are
retained.

## Editorial changes

| Concern | Current treatment |
| --- | --- |
| Task names | Use descriptive task names for printed examples. Topics 15 through 24 also use these names in the source. Internal topic references point to material on the same sheet. |
| Question-specific rounding | A wording/order table chooses Rank then Round, Calculate then Round, Round then Filter, or Round then Sort. The 12.341/12.344 example supplies both input and rank results. |
| SQL truth contexts | Topic 02 defines TRUE/FALSE/UNKNOWN, groups six NULL comparison results in one table, and compares WHERE/HAVING with CHECK in another. NULL-safe equality is identified as MySQL syntax; the context table's UNKNOWN outcomes are bold. |
| SQL set operators | Topic 01 replaces the short UNION/UNION ALL reminder with one six-operator table on complete A/B inputs. ALL multiplicity rules and the final-ORDER-BY condition accompany it. |
| SQL quantified predicates | Topic 05 consolidates EXISTS/NOT EXISTS/ANY/ALL into one table with TRUE conditions and empty-input results. Quantifier equations define vacuous truth; the NULL table retains only its nonempty cases. |
| NOT EXISTS recognition | Topic 05 maps no/none/has never to one anti-join and every/all to absence of violations, using its existing double-NOT-EXISTS template for required-item coverage. The universal-negation rule names a Boolean existence predicate; nullable comparison predicates have an explicit UNKNOWN policy. |
| Foreign key actions | Topic 12 replaces the short action prose with an ON DELETE/ON UPDATE table scoped to InnoDB. SET NULL requires nullable FK columns; NO ACTION/RESTRICT are immediate. Separate Parent/Child DDL illustrates update cascading without the self-reference restriction, which is stated beside the table. |
| View storage and refresh | Topic 12 replaces the two storage/refresh sentences with an ordinary/materialized view table. It distinguishes query evaluation from stored results, notes possible staleness until maintenance, and identifies MySQL 8.4's table-plus-refresh simulation rather than a native materialized view. |
| Transactions and ACID | Topic 12 defines a transaction as an ordered sequence of SQL statements, expands the four ACID properties, and specifies current-transaction COMMIT/ROLLBACK behavior. Isolation and durability retain the DBMS guarantees qualification. Nearby prose is shortened to retain the two-page layout and existing fonts. |
| Dataset-independent examples | Topic 23 shows all four sample documents, A through D, alongside their matching results. Topic 10 uses a generic lookup parameter. |
| Hidden schema assumptions | Give shared museum, Trip and Sale schemas. Local SQL schemas and lookup cardinality are stated beside their patterns. Flexible collection c is explicitly separate from the present-field Trip/Sale schemas. |
| Misleading partial code | Distinguish syntax sketches, expression fragments and pipeline fragments from complete queries. Keep an implemented procedure lookup, a complete calculated-distance CTE, and a complete Validate/Derive/Audit trigger. |
| Transferability | Use generic Score/Audit and Point schemas, defined parameters, consistent quantity/duration/birthYear fields and explicit NULL/empty/tie/boundary rules. |
| Retrieval and duplication | Use WHEN, RULE, PATTERN, TRAP, EXAMPLE and COND where useful. Keep full rounding decisions in 10 and pipeline-specific order in 22; full array matching in 23 and projections in 24. |

The procedure and derived-field trigger were already implemented in the input
revision. This pass generalizes their schemas and separates the lookup procedure
from filtering a calculated column; it does not reintroduce a comment in place
of the distance calculation.

## Shared example contracts

Topics 15--17 use the printed $R_0=ABCDEF$ and
$F_0=\{A\to B,BC\to D,D\to A,C\to E,E\to F\}$. The constructed BCNF result is
$D_{\mathrm{BCNF}}=\{AB,AD,CD,CE,EF\}$.
$D_{\mathrm{test}}=\{AB,ACD,CE,EF\}$ is a separately given decomposition used to test
dependency preservation. The two names prevent an accidental substitution.

The museum tree specifies Museum*, Artwork*, required singleton children and
attributes, and string-valued Artist/Title leaves. The three patterns therefore
need no external DTD. The university join/group patterns state their separate,
namespace-free schema and singleton child-field assumption.

Trip uses userType, duration, birthYear and stationId. Sale uses saleId and an
ordered, possibly empty items array of name/quantity/price objects. All those
fields are present; the numeric fields and unique saleId are stated explicitly.
The null/missing examples use scalar or absent x in the independent flexible
collection c, with the array-element extension of the type check stated locally.

For the four printed sales, quantity at least 3 AND price at least 80 gives:

| Operation | Result |
| --- | --- |
| Independent dot conditions | A,B,C |
| Same-item elemMatch | A,C |
| Original item 0 qualifies | C |
| Empty items | D |
| Positional first match | A:[a1], C:[c0] |
| Projection elemMatch with an empty document filter | A:[a1], C:[c0]; B/D remain without an items field |
| All matches with filter, after document match | A:[a1,a2], C:[c0] |
| Dotted projection after testing item 0 | C retains c0,c1 |

## Acceptance criteria

| Gate | Evidence required |
| --- | --- |
| Standalone | Rules and examples need only the printed sheet and the new problem's inputs. |
| Source independence | Extracted PDF text contains no external question labels, Assignment/Project references, quiz names or slide citations. |
| Defined notation | Bind important symbols, query schemas, predicates, parameters and initialized application contexts locally or by an explicit internal reference. |
| Complete examples | Worked examples supply input, operation and result; snippets without full statements are labeled as templates/fragments. |
| Transferability | SQL/XML/MongoDB patterns name their input shapes and allow names/literal filters to be replaced. |
| Correctness | Recompute changed SQL, FD, XML, MongoDB and RDD examples; validate authored math. |
| Edge cases | Check NULL, empty input, duplicates, ties and numeric boundaries relevant to each pattern. |
| Retrievability | Task-oriented headings and role labels identify when to use the pattern. |
| No dead data | No unexplained historical IDs or results requiring an absent dataset. |
| No misleading code | The distance expression and derived attribute are implemented; generic sketches and stage fragments are identified. |
| Information density | Avoid duplicated paragraphs while keeping short local reminders necessary to interpret syntax. |
| Print readability | Two A4 pages; unchanged fonts; no clipped/overlapping text, broken symbols or overfull boxes in the inspected render. |

The print check is a digital preflight and visual inspection; no physical
printer test is claimed.

## Current fixture checks

- SQLite executes the current aggregate/rank and classification queries, the
  lookup/filter body and the full Point-distance CTE with registered math
  functions. Checks include NULL anti-joins, raw/rounded ties, price cutoffs,
  missing coordinates, radius boundaries and final distance ordering.
- Six scalar NULL comparison results are checked with SQLite: four as printed,
  and the two MySQL null-safe examples through SQLite's equivalent IS operator.
  The MySQL syntax/semantics are checked against W17; WHERE fixtures retain only
  TRUE and discard FALSE/NULL.
- EXISTS/NOT EXISTS are checked on empty input and NULL-valued rows in SQLite.
  ANY/ALL results are recomputed from SQLite scalar comparisons under
  three-valued OR/AND, including empty input and NULLs, and checked against W18.
- The existing double-NOT-EXISTS query is checked on full, partial and absent
  coverage, duplicate links/requirements and empty requirements. Nullable
  predicates verify the difference between NOT P and P IS NOT TRUE.
- Parent/Child DDL is checked in SQLite after removing the MySQL ENGINE clause.
  Isolated fixtures check DELETE and key UPDATE for all four listed actions,
  including multiple matching children, an unrelated child and rejection while
  referenced. InnoDB timing and self-reference restrictions are checked against
  W19; these are not MySQL engine execution checks.
- A SQLite fixture checks reads through the displayed Passing view after base-table
  changes, contrasts it with a stored result table, and refreshes that table.
  ENGINE and WITH CHECK OPTION are omitted for this portable read check; this
  is a table/refresh simulation, not a native materialized-view engine test.
- SQLite fixtures check rollback to the pre-transaction state, committed values
  after reopening a connection, rollback without undoing an earlier commit, and
  explicit rollback after a constraint failure. Statement order is checked with
  noncommuting updates. These are portable transaction checks, not InnoDB crash
  recovery or isolation-level tests; W21 supplies the MySQL-specific semantics.
- The six set-operator results are recomputed from the printed A/B bags with
  independent set/count calculations. SQLite checks UNION, UNION ALL, INTERSECT
  and EXCEPT; the two remaining ALL variants use multiset calculations, checked
  against the cited MySQL semantics rather than a MySQL execution claim.
- The trigger's actual CASE and validation predicate cover NULL, 1, 49, 50, 99
  and invalid -1/0/100. Separate transitions check category-only repair, changed
  scores and NULL-safe auditing; derivation precedes the conditional audit.
- Exhaustive subsets recover the three shared candidate keys; projected
  closures verify all five BCNF fragments and the failed BC-to-D preservation
  check for the separately given decomposition. The legal lossy instance
  produces exactly two spurious tuples.
- Local XML fixtures check museum Title filtering, one output per qualifying
  parent and zero-artwork groups. lxml validates the DTD/XSD and checks typed ID
  resolution, IDREFS and the default CDATA attribute.
- Direct calculations on the four printed sales reproduce every matching and
  projection result above. A three-trip fixture supplies all inputs for the
  aggregation example. Ten complete MongoDB JavaScript blocks pass syntax
  parsing; all five Python listings parse.
- The RDD examples are recomputed with independent list/set calculations.
  All 173 authored PDF math expressions, plus seven in the two study
  companions, render with KaTeX in strict error mode.

These checks do not execute MySQL procedure/trigger DDL, an XQuery engine,
MongoDB or a Spark cluster. SQLite checks portable SQL behavior; the other
worked results are independently recomputed from the displayed inputs.
