#!/usr/bin/env node
/**
 * Enrich DSA5104 Chapter 3 (Introduction to SQL) slides with slide-specific
 * study layers, matching the DSA5101/DSA5105 pattern.
 *
 * Adds assetPath, title, kind/status/priority metadata, and replaces the
 * generic extractor explanation + socraticQuestions with content-specific
 * study layers keyed to the SQL arc: DDL -> basic queries -> advanced queries
 * -> set operations -> nulls -> aggregation -> nested subqueries -> updates.
 *
 * Run: node scripts/enrich-dsa5104-chapter3-slides.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'content', 'courses', 'DSA5104', 'slides', 'dsa5104-chapter3.json');
const SOURCE_ID = 'DSA5104/chapter3.pdf';
const ASSET_ROOT = 'assets/nus/dsa5104/chapter3';

// Compact per-slide study metadata: slideNumber -> [concept, why, pitfall, qType, qPrompt, qAnswer, qHint]
const META = {
  1: ['chapter title: Introduction to SQL', 'names the chapter and textbook that define the SQL scope', 'treating the title slide as technical evidence', 'orient', 'What does Chapter 3 set out to teach?', 'The SQL query language: history, data definition, basic queries, set operations, nulls, aggregation, nested subqueries, and database modification.', 'Read the title as a scope statement.'],
  2: ['chapter outline', 'maps the chapter: overview, DDL, basic query structure, additional operations, set operations, nulls, aggregation, nested subqueries, and modification', 'skipping the outline and losing the narrative structure', 'orient', 'What are the main parts of Chapter 3?', 'Overview, SQL data definition, basic query structure, additional operations, set operations, nulls, aggregate functions, nested subqueries, and modification of the database.', 'The outline is a roadmap.'],
  3: ['SQL history', 'traces SQL from the IBM Sequel language in the System R project to ANSI/ISO standard SQL', 'assuming SQL was invented by a standards body rather than by IBM', 'orient', 'Where did SQL originate?', 'As the IBM Sequel language developed in the System R project, later renamed SQL and standardized by ANSI/ISO.', 'IBM System R origin.'],
  4: ['SQL parts', 'categorizes SQL into DML, DDL, view definition, transaction control, embedded/dynamic SQL, and authorization', 'treating all SQL statements as one undifferentiated language', 'define', 'What are the main parts of SQL?', 'Data manipulation (DML), data definition (DDL), view definition, transaction control, embedded and dynamic SQL, and authorization.', 'Six parts.'],
  5: ['data definition language (DDL)', 'defines the DDL for specifying relation schemas, domains, integrity constraints, and security information', 'confusing DDL (structure) with DML (data manipulation)', 'define', 'What does the SQL DDL specify?', 'The schema for each relation, attribute types and domains, integrity constraints, indexes, physical storage, and security/authorization information.', 'Structure, not data.'],
  6: ['domain types in SQL', 'lists char(n), varchar(n), int, smallint, numeric(p,d), real, double precision, and float(n)', 'confusing fixed-length char(n) with variable-length varchar(n)', 'define', 'What is the difference between char(n) and varchar(n)?', 'char(n) is a fixed-length string padded to n; varchar(n) is a variable-length string up to n.', 'Fixed vs variable length.'],
  7: ['create table construct', 'shows the create table command that defines an SQL relation and its attributes', 'forgetting that create table only names the schema, not the data', 'define', 'What does create table do?', 'It defines a new SQL relation by giving its name, attributes, and types.', 'Define a relation schema.'],
  8: ['integrity constraints in create table', 'lists primary key, foreign key, and other constraint types declared in create table', 'confusing key constraints with domain constraints', 'compare', 'What kinds of integrity constraints can be declared in create table?', 'Primary key, foreign key, not null, unique, and check constraints, among others.', 'Keys and checks.'],
  9: ['student relation definition', 'shows the create table student statement with its attributes and constraints', 'reading the DDL without connecting it to the university schema', 'apply', 'What attributes and constraints does the student table declare?', 'ID, name, dept name, and total credits, with ID as the primary key.', 'ID primary key.'],
  10: ['course relation definition', 'shows the create table course statement with course_id as a key', 'forgetting that foreign-key references create dependencies between tables', 'apply', 'How does the course table reference the department table?', 'Through a foreign-key constraint on dept_name referencing department.', 'FK to department.'],
  11: ['inserting into tables', 'shows insert into instructor with values, the SQL statement that adds a tuple', 'forgetting that insertion can violate constraints', 'apply', 'What does insert into instructor values (...) do?', 'It adds a new tuple to the instructor relation.', 'Add a row.'],
  12: ['foreign-key violation handling in MySQL', 'shows how MySQL handles an insert that violates a foreign-key constraint', 'assuming every DBMS behaves identically on constraint violations', 'compare', 'How does MySQL handle a foreign-key constraint violation on insert?', 'It rejects the statement with an error because MySQL enforces the constraint.', 'Error on violation.'],
  13: ['foreign-key violation handling in PostgreSQL', 'shows how PostgreSQL can be configured for constraint behavior, e.g. deferring checks', 'forgetting that constraint enforcement strategy is DBMS-configurable', 'compare', 'How can PostgreSQL differ from MySQL on constraint violations?', 'PostgreSQL supports deferrable constraints and different enforcement strategies.', 'DBMS-specific behavior.'],
  14: ['deleting from tables', 'shows delete from, which removes tuples from a relation', 'confusing delete from (DML) with drop table (DDL)', 'define', 'What does delete from student do?', 'It removes all tuples from the student relation, leaving the empty relation.', 'Remove rows, keep table.'],
  15: ['drop table', 'shows drop table r, which removes the table and its schema entirely', 'confusing drop table with delete from', 'compare', 'What does drop table r do that delete from r does not?', 'Drop table removes the entire relation including its schema; delete from only removes tuples.', 'Schema vs data.'],
  16: ['drop table and storage engines', 'notes InnoDB behavior and the distinction between delete and drop', 'ignoring the underlying storage-engine semantics', 'explain', 'Why does the slide contrast delete from and drop table with InnoDB?', 'To emphasize that dropping removes structure while deleting only clears rows, and engine behavior can affect this.', 'Engine semantics matter.'],
  17: ['alter table add', 'shows alter table r add A D, which adds an attribute to a relation schema', 'forgetting that alter changes the schema, not the data', 'define', 'What does alter table r add A D do?', 'It adds a new attribute A of domain D to relation r.', 'Add a column.'],
  18: ['alter table drop', 'shows alter table r drop A, which removes an attribute from a relation schema', 'forgetting that dropping an attribute may violate constraints', 'define', 'What does alter table r drop A do?', 'It removes attribute A from the schema of relation r.', 'Drop a column.'],
  19: ['basic query structure', 'states the canonical form: select A1..An from r1..rm where P', 'forgetting the evaluation order of select/from/where', 'define', 'What is the basic structure of an SQL query?', 'select attributes, from relations, where predicate. The where filters rows before projection.', 'select-from-where.'],
  20: ['the select clause', 'lists the attributes desired in the result of a query', 'confusing SQL select (columns) with relational algebra select (rows)', 'define', 'What does the SQL select clause list?', 'The attributes to appear in the query result.', 'Choose columns.'],
  21: ['case sensitivity of SQL names', 'notes that SQL names are case insensitive, but string values may depend on the DBMS', 'assuming string literals are case insensitive everywhere', 'explain', 'Are SQL names case sensitive?', 'No, SQL names are case insensitive; string value comparison depends on the DBMS collation.', 'Names vs values.'],
  22: ['making tuples case sensitive in MySQL', 'shows how the MySQL character set and collation control case sensitivity of string comparisons', 'ignoring collation when comparing strings', 'apply', 'How can MySQL be made to compare strings case sensitively?', 'By choosing a case-sensitive collation for the column or comparison.', 'Collation controls it.'],
  23: ['case-sensitive collation example', 'continues the MySQL collation example', 'forgetting that the DBMS default collation applies unless overridden', 'apply', 'Why does the DBMS default collation matter?', 'It determines whether string comparisons are case sensitive by default.', 'Default collation.'],
  24: ['duplicates in select results', 'states that SQL allows duplicates in relations and query results by default', 'assuming SQL uses pure set semantics like the algebra', 'compare', 'Does SQL remove duplicates by default?', 'No, SQL keeps duplicates by default (multiset semantics); distinct removes them.', 'Multiset by default.'],
  25: ['the asterisk in select', 'shows select * as shorthand for all attributes', 'reading * as a functional requirement rather than shorthand', 'define', 'What does select * mean?', 'It returns all attributes of the relations in the from clause.', 'All columns.'],
  26: ['literals in select', 'shows that an attribute can be a literal with no from clause', 'forgetting that literals are constants in the result', 'apply', 'Can select include a constant value?', 'Yes, a literal can appear as a column in the result, even with no from clause.', 'Constants allowed.'],
  27: ['arithmetic expressions in select', 'shows arithmetic expressions over attribute values in the select clause', 'forgetting that expressions can combine multiple attributes', 'apply', 'Can the select clause contain arithmetic?', 'Yes, e.g. salary/12, producing a derived column in the result.', 'Compute columns.'],
  28: ['the where clause', 'specifies the conditions the result tuples must satisfy', 'confusing where (filter) with select (project)', 'define', 'What does the where clause do?', 'It specifies predicates that tuples must satisfy to appear in the result.', 'Filter rows.'],
  29: ['the from clause', 'lists the relations involved in the query, whose Cartesian product is formed', 'forgetting that from forms a Cartesian product before filtering', 'define', 'What does the from clause list?', 'The relations involved in the query; their Cartesian product is the starting point.', 'Sources, product.'],
  30: ['from clause Cartesian product', 'shows select * from instructor, teaches producing the Cartesian product', 'being surprised by the size of the product before filtering', 'apply', 'What does select * from instructor, teaches return?', 'The Cartesian product of the two relations (every pairing).', 'Every pairing.'],
  31: ['query examples with joins', 'finds instructors who taught a course, joining instructor and teaches on ID', 'forgetting to write the join condition in the where clause', 'apply', 'How do you find instructors who taught a course?', 'Join instructor and teaches by matching their identifier columns, then select and project the needed attributes.', 'Equate IDs.'],
  32: ['the rename operation in SQL', 'shows SQL renaming of relations and attributes using as', 'forgetting that rename is critical for self-joins', 'define', 'Why does SQL allow renaming relations and attributes?', 'To disambiguate self-joins and give meaningful names to results.', 'Names for clarity.'],
  33: ['self-join example: emp-super', 'uses a self-join on the emp-super relation to find Bob\'s supervisor', 'forgetting to use two aliases for the same relation', 'apply', 'How do you find Bob\'s supervisor using a self-join?', 'Rename emp-super to two aliases and join where one person_id equals another\'s supervisor_id, matching Bob.', 'Two aliases.'],
  34: ['self-join supervisor example continued', 'continues the emp-super self-join example', 'confusing the two copies of the same relation', 'apply', 'What does the self-join example continue to demonstrate?', 'How the same relation can be joined with itself through two aliases.', 'Same table, two roles.'],
  35: ['self-join indirect supervisors', 'extends the example to indirect supervision relationships', 'stopping at one hop when the query needs multiple levels', 'apply', 'How would you find higher-level supervisors?', 'By chaining additional joins over aliases of the same relation.', 'Chain more joins.'],
  36: ['recursive queries preview', 'notes that recursive queries are covered in Chapter 5 (page 217)', 'assuming self-joins cover all transitive queries', 'orient', 'When are recursive queries formally introduced?', 'In Chapter 5, page 217 of the textbook.', 'Later chapter.'],
  37: ['string operations', 'introduces SQL string-matching with patterns like % and _', 'confusing % (any substring) with _ (single character)', 'define', 'What do % and _ mean in SQL LIKE patterns?', '% matches any substring (including empty); _ matches exactly one character.', 'Percent matches many; underscore matches one.'],
  38: ['pattern matching examples', 'shows "Intro%" matching strings beginning with Intro', 'forgetting the escaping rules for literal % and _', 'apply', 'What does the pattern "Intro%" match?', 'Any string that begins with the prefix Intro.', 'Prefix match.'],
  39: ['MySQL pattern case sensitivity', 'notes that LIKE patterns are case insensitive in MySQL by default', 'assuming all DBMSes share the same default', 'compare', 'Are LIKE patterns case sensitive in MySQL?', 'No, by default MySQL LIKE patterns are case insensitive.', 'DBMS default.'],
  40: ['ordering display of tuples', 'shows order by to sort result tuples', 'forgetting to apply order by last after the result is formed', 'define', 'What does order by do?', 'It sorts the tuples of the query result by the listed attributes.', 'Sort the result.'],
  41: ['where clause predicates: between', 'shows the between comparison operator', 'forgetting that between is inclusive of both endpoints', 'define', 'What does between do in SQL?', 'It tests whether a value lies within an inclusive range.', 'Inclusive range.'],
  42: ['set operations in SQL', 'shows union to combine Fall 2017 and Spring 2018 course results', 'forgetting that union removes duplicates by default', 'define', 'What does union do?', 'It combines the results of two queries, removing duplicate tuples by default.', 'Combine, dedupe.'],
  43: ['set operation results', 'shows the combined result of a union query', 'reading the result without checking the operation semantics', 'apply', 'What does the union result look like?', 'The combined set of tuples from both queries with duplicates removed.', 'Union set.'],
  44: ['set operations continued', 'covers union, intersect, and except and their constraint that both operands have the same attributes', 'forgetting set-operand compatibility', 'define', 'What is required of both operands of intersect or except?', 'They must have the same attribute sets (union compatibility).', 'Same attributes.'],
  45: ['null values', 'states that tuples may have null, meaning an unknown or missing value', 'forgetting that null is not zero and not empty string', 'define', 'What does a null value represent?', 'An unknown or missing value for an attribute of a tuple.', 'Unknown value.'],
  46: ['comparisons with null', 'states that any comparison involving null evaluates to unknown', 'assuming null compares equal to null', 'explain', 'What is the result of comparing a value to null?', 'Unknown, not true or false, because null represents an unknown value.', 'Three-valued logic.'],
  47: ['check constraints and null', 'shows how a CHECK constraint treats null conditions', 'forgetting that check constraints may allow nulls', 'apply', 'How do CHECK constraints interact with null?', 'A check condition evaluates to unknown for null rows, which is neither true nor false.', 'Unknown passes.'],
  48: ['null in where clauses', 'states that a where predicate that evaluates to unknown is treated as false', 'forgetting to filter nulls explicitly with is null', 'apply', 'How does SQL treat a where predicate that evaluates to unknown?', 'As false, so the row is excluded; use is null to test explicitly for null.', 'Unknown behaves false.'],
  49: ['aggregate functions', 'introduces avg, min, max, sum, and count over a multiset of values', 'confusing count(*) with count(distinct attribute)', 'define', 'What are the SQL aggregate functions?', 'Average (avg), minimum (min), maximum (max), sum (sum), and count (count).', 'Five aggregates.'],
  50: ['aggregate examples', 'finds the average salary of instructors in the Computer Science department', 'forgetting that aggregates ignore nulls except count(*)', 'apply', 'How do you find the average salary of CS instructors?', 'select avg(salary) from instructor where dept_name = \'Comp. Sci.\'.', 'Avg with filter.'],
  51: ['group by aggregation', 'groups tuples by attributes before aggregating within each group', 'forgetting that group by partitions rows before aggregation', 'define', 'What does group by do?', 'It partitions the tuples into groups sharing the listed attribute values, then aggregates within each group.', 'Partition then aggregate.'],
  52: ['aggregation constraints on select', 'states that attributes in select outside aggregates must appear in group by', 'writing a select that mixes one attribute with an aggregate without grouping', 'define', 'What constraint applies to group by queries?', 'Every non-aggregated attribute in the select clause must appear in the group by clause.', 'Group by covers select.'],
  53: ['the having clause', 'filters groups after aggregation, like a where clause for groups', 'confusing having (filter groups) with where (filter rows)', 'compare', 'What is the difference between where and having?', 'Where filters individual rows before grouping; having filters the resulting groups after aggregation.', 'Rows vs groups.'],
  54: ['the BIG 6', 'introduces the canonical six-clause structure: select, from, where, group by, having, order by', 'forgetting the evaluation order of the six clauses', 'orient', 'What are the six main clauses of an SQL query?', 'select, from, where, group by, having, order by.', 'The BIG 6.'],
  55: ['the BIG 6 worked example', 'works through a query using all six clauses on course sections from 2017', 'letting the example become a memorization exercise', 'apply', 'How do the six clauses cooperate in one query?', 'From forms the product, where filters rows, group by partitions, having filters groups, select projects, order by sorts.', 'Six-step pipeline.'],
  56: ['nested subqueries', 'introduces subqueries as select-from-where expressions nested within a larger query', 'forgetting that subqueries can appear in where, from, and select', 'define', 'What is a nested subquery?', 'A complete select-from-where expression embedded inside another query.', 'Query in a query.'],
  57: ['subqueries in the where clause', 'places subqueries in the where clause, e.g. using in', 'treating every subquery as a standalone query', 'apply', 'Where in a query can a subquery appear?', 'In the where clause, the from clause, or the select clause.', 'Three positions.'],
  58: ['set membership with in', 'finds courses offered in Fall 2017 and in Spring 2018 using in', 'confusing in (set membership) with equality', 'define', 'What does the in operator test?', 'Whether a value is a member of the set produced by a subquery.', 'Membership test.'],
  59: ['set membership example result', 'shows the result of the in-query', 'reading the result without grasping the set semantics', 'apply', 'What does the in query return?', 'Courses present in both the Fall 2017 and Spring 2018 offerings.', 'Both sets.'],
  60: ['not in and string exclusion', 'finds instructors whose names are neither Mozart nor Einstein using not in', 'forgetting that not in with nulls behaves in three-valued logic', 'apply', 'How do you exclude a fixed set of names?', 'Use where name not in (\'Mozart\', \'Einstein\').', 'Not in set.'],
  61: ['set membership continued', 'continues the not in example and its result', 'misreading not in for not exists', 'apply', 'What does the not in result exclude?', 'Instructors named Mozart or Einstein.', 'Exclude listed names.'],
  62: ['set comparison in where', 'introduces comparison operators combined with subqueries, including SOME and ALL', 'forgetting that set comparisons require some/all quantification', 'define', 'How do SQL comparisons extend to sets?', 'Using SOME (at least one element) and ALL (every element) after a comparison.', 'SOME versus ALL.'],
  63: ['the some clause', 'finds instructors with salary greater than that of some (at least one) instructor', 'confusing some with all', 'define', 'What does the SOME comparison mean?', 'The condition is true when at least one tuple in the comparison relation satisfies the chosen comparison.', 'At least one.'],
  64: ['definition of some', 'states the existential meaning of the SOME clause', 'forgetting that some is existential quantification', 'define', 'Write the formal meaning of the SOME clause.', 'The SOME condition holds if there exists at least one tuple in the relation for which the comparison is true.', 'Existential.'],
  65: ['some clause example', 'shows a worked some query and its result', 'confusing the some result with the all result', 'apply', 'What does the some example return?' , 'Instructors with a salary above at least one other instructor\'s salary.', 'Above one.'],
  66: ['the all clause', 'finds instructors with salary greater than the salary of every instructor', 'confusing all with some', 'define', 'What does the ALL comparison mean?', 'The condition is true only when every tuple in the comparison relation satisfies the chosen comparison.', 'All tuples.'],
  67: ['definition of all', 'states the universal meaning of the ALL clause', 'forgetting that all is universal quantification', 'define', 'Write the formal meaning of the ALL clause.', 'The ALL condition holds if every tuple in the relation satisfies the comparison.', 'Universal.'],
  68: ['all clause example', 'shows a worked all query and its result', 'misapplying the all semantics in edge cases', 'apply', 'What does the all example return?', 'Instructors whose salary is greater than the maximum salary in the comparison set.', 'Above all.'],
  69: ['test for empty relations', 'introduces exists, which is true if the subquery result is nonempty', 'confusing exists with count checking', 'define', 'What does exists test?', 'Whether its argument subquery returns at least one tuple.', 'Nonempty.'],
  70: ['use of exists', 'expresses the courses-in-both-semesters query using exists', 'forgetting that exists requires correlation in many examples', 'apply', 'How does exists express the both-semesters query?', 'By testing for a correlated section row in the other semester.', 'Correlated exists.'],
  71: ['exists example continued', 'continues the correlated exists example', 'missing the correlation variable that links inner and outer queries', 'apply', 'Why is the exists subquery correlated?', 'Because its inner query references the outer section variable.', 'Outer refers inner.'],
  72: ['exists example result', 'shows the result of the correlated exists query', 'reading the result without the correlation logic', 'apply', 'What does the exists query return?', 'Course sections offered in both Fall 2017 and Spring 2018.', 'Both semesters.'],
  73: ['not exists', 'finds students who have taken all courses in the Biology department using not exists', 'forgetting that not exists is the standard way to express division', 'define', 'What is not exists used for?', 'To test that a subquery is empty, often for expressing division (all-quantified queries).', 'Division.'],
  74: ['not exists example continued', 'continues the all-courses-in-Biology example using not exists', 'treating it as a special trick rather than a general division pattern', 'apply', 'How does not exists express taken-all-courses?', 'By testing that no Biology course exists that the student has not taken.', 'No counterexample.'],
  75: ['test for absence of duplicates', 'introduces unique, which tests whether a subquery has no duplicate tuples', 'confusing unique with distinct in select', 'define', 'What does the unique construct test?', 'Whether its subquery result contains no duplicate tuples.', 'No duplicates.'],
  76: ['unique example result', 'shows a worked unique query and result', 'forgetting that unique is about duplicates, not emptiness', 'apply', 'What does the unique example return?', 'Course offerings that occurred at most once in 2017.', 'At most once.'],
  77: ['subqueries in the from clause', 'shows subquery expressions used directly in the from clause', 'forgetting that a from-subquery must be named', 'define', 'How is a subquery used in the from clause?', 'As a derived table expression that must be given an alias.', 'Named derived table.'],
  78: ['from-clause subquery example', 'finds the average instructor salary by department using a from-subquery', 'confusing the aggregated subquery with a base table', 'apply', 'Why nest the aggregation inside the from clause?', 'To compute a derived table that the outer query can then query further.', 'Derived intermediate.'],
  79: ['with clause (CTEs)', 'introduces common table expressions with the with clause for naming temporary relations', 'treating with as optional when it improves readability', 'define', 'What does the with clause do?', 'It defines named temporary relations usable within a single query (common table expressions).', 'Named CTEs.'],
  80: ['complex queries using with', 'finds departments whose total salary exceeds the average using with', 'skipping the step-by-step CTE decomposition', 'apply', 'How does the with clause break down a complex query?', 'It names intermediate relations so the final query stays readable.', 'CTE steps.'],
  81: ['scalar subquery', 'uses a subquery where a single value is expected', 'forgetting that a scalar subquery must return exactly one value or null', 'define', 'What is a scalar subquery?', 'A subquery used where a single value is expected, returning one row and one column.', 'One value.'],
  82: ['modification of the database', 'covers deletion, insertion, and updating of tuples', 'confusing the three modification statements', 'orient', 'What are the three database modification operations in SQL?', 'Delete tuples, insert tuples, and update values of tuples.', 'Insert, delete, update.'],
  83: ['deletion', 'shows delete from statements, including conditional deletion', 'forgetting that delete without a where removes all tuples', 'apply', 'What does delete from instructor without a where clause do?', 'It deletes all tuples from the instructor relation.', 'Delete all.'],
  84: ['updating a referenced key', 'discusses updating a primary key referenced by a foreign key, with on update behavior', 'forgetting that key updates must respect referential integrity', 'explain', 'What happens when you update a referenced key?', 'By default the update may be restricted; on update cascade propagates the change to referencing rows.', 'Referential integrity.'],
  85: ['on update cascade', 'adds on update cascade and rebuilds the database to propagate key updates', 'forgetting that cascade changes propagate automatically', 'apply', 'What does on update cascade do?', 'It automatically updates referencing foreign-key values when the referenced key changes.', 'Propagate updates.'],
  86: ['deletion with subqueries', 'deletes instructors whose salary is less than the average salary', 'forgetting that the inner query is evaluated against the pre-delete state in some systems', 'apply', 'How do you delete below-average instructors?', 'Delete instructor rows whose salary is below the average returned by a subquery over instructor.', 'Subquery in delete.'],
  87: ['deletion in PostgreSQL', 'notes that PostgreSQL tests all tuples before performing the deletion, so the subquery sees the original state', 'assuming every DBMS evaluates subqueries the same way', 'compare', 'How does PostgreSQL evaluate delete with a subquery?', 'It tests all tuples against the average first, then deletes, so the average is the pre-delete value.', 'Test-then-delete.'],
  88: ['deletion in MySQL', 'contrasts MySQL behavior, which may refuse the subquery-delete on the same table', 'forgetting that MySQL restricts such same-table subqueries', 'compare', 'Why does MySQL refuse some same-table delete subqueries?', 'Because MySQL does not allow a subquery on the target table of a delete/update in some forms.', 'Same-table restriction.'],
  89: ['insertion', 'shows insert into course values (...)', 'forgetting that all attributes must be supplied or defaulted', 'apply', 'How do you add a tuple to the course table?', 'insert into course values (\'CS-437\', \'Database Systems\', \'Comp. Sci.\', 4).', 'Values in order.'],
  90: ['insertion with select', 'inserts into student a selection from another relation or computation', 'forgetting that select-insert can move rows between relations', 'apply', 'How can insertion combine with a query?', 'With insert into r select ... to copy rows from another relation.', 'Insert from query.'],
  91: ['updates', 'gives a 5% salary raise to all instructors', 'forgetting that update without where changes every row', 'apply', 'How do you give every instructor a 5% raise?', 'Update every instructor row by multiplying its salary by 1.05.', 'Scale all rows.'],
  92: ['update with subquery test in PostgreSQL', 'notes that PostgreSQL evaluates subqueries before updating', 'assuming the update sees newly updated values', 'compare', 'When does PostgreSQL evaluate a subquery in update?', 'Before performing the updates, so it sees the original state.', 'Pre-update state.'],
  93: ['MySQL restriction on same-table update', 'shows that MySQL refuses some same-table update subqueries', 'treating one DBMS restriction as universal SQL', 'compare', 'Why does MySQL refuse the same-table update subquery?', 'Because MySQL does not allow modifying a table while selecting from it in the same statement in some forms.', 'Same-table restriction.'],
  94: ['conditional updates', 'raises salaries by 3% for instructors above USD 90,000 and by 5% for the rest', 'forgetting to express conditional logic in update', 'apply', 'How do you apply different raises based on salary?', 'Use a CASE expression in the SET clause or use two updates with complementary conditions.', 'Case in set.'],
  95: ['case statement for conditional updates', 'rewrites the conditional raise using case', 'confusing case in update with case in select', 'apply', 'How does case express the conditional raise?', 'Set the salary with CASE: choose the 3% branch for high salaries and the 5% branch otherwise.', 'Conditional set.'],
  96: ['updates with scalar subqueries', 'recomputes tot_creds for students from the takes relation using a scalar subquery', 'forgetting to handle students with no course taken', 'apply', 'How is tot_creds recomputed from the takes table?', 'With update student set tot_creds = (select sum(credits) from ...) and null for no courses.', 'Scalar subquery update.'],
  97: ['scalar update result', 'shows the resulting tot_creds values and null handling', 'forgetting that a subquery summing no rows yields null', 'apply', 'What does tot_creds become for a student with no courses?', 'Null, unless coalesce or a default handles it.', 'Null for none.'],
  98: ['end of Chapter 3', 'marks the end of the SQL chapter', 'skipping the boundary between lecture content and practice', 'orient', 'What has Chapter 3 covered by its end?', 'SQL DDL, basic queries, set operations, nulls, aggregation, nested subqueries, and database modification.', 'DDL to updates.'],
  99: ['project announcement and summary', 'announces Project 1 timing and summarizes the chapter; the homework lists textbook questions 3.1, 3.3, 3.6, 3.11, 3.27, 3.28 (page 115)', 'treating logistics as examinable content', 'orient', 'What does the homework ask you to practice?', 'Running the slide MySQL code and, optionally, textbook questions 3.1, 3.3, 3.6, 3.11, 3.27, and 3.28 on page 115.', 'Run code, then practice.']
};

function buildExplanation(meta, title, page) {
  return {
    whatYouSee: `The slide introduces ${meta[0]}. Use the rendered slide for the exact source notation and examples.`,
    whyItMatters: meta[1],
    intuition: `This slide focuses on ${meta[0]}. Read it as part of the SQL arc: DDL and basic queries, then set operations, nulls, aggregation, nested subqueries, and updates.`,
    technicalDetail: `The slide is part of the DSA5104 Chapter 3 source (${SOURCE_ID}), page ${page}. The extracted text is a reader layer; the rendered slide remains authoritative.`,
    pitfall: `Do not fall into the trap of ${meta[2]}.`,
    connection: 'This slide connects to the surrounding slides in the SQL narrative: how schema is defined, how queries are written (select-from-where), and how the database is modified.'
  };
}

function buildSocratic(meta) {
  return [{ type: meta[3], prompt: meta[4], answer: meta[5], hint: meta[6] }];
}

function titleFor(page, fallback) {
  const titles = {
    1: 'Chapter 3: Introduction to SQL',
    2: 'Outline', 3: 'History', 4: 'SQL Parts', 5: 'Data Definition Language', 6: 'Domain Types in SQL',
    7: 'Create Table Construct', 8: 'Integrity Constraints in Create Table', 9: 'Student Relation Definition',
    10: 'Course Relation Definition', 11: 'Inserting into Tables', 12: 'FK Violation in MySQL',
    13: 'FK Violation in PostgreSQL', 14: 'Deleting from Tables', 15: 'Drop Table', 16: 'Drop Table and Storage Engines',
    17: 'Alter Table (Add)', 18: 'Alter Table (Drop)', 19: 'Basic Query Structure', 20: 'The Select Clause',
    21: 'Case Sensitivity of SQL Names', 22: 'Case-Sensitive Tuples in MySQL', 23: 'Case-Sensitive Collation Example',
    24: 'Duplicates in Select Results', 25: 'The Asterisk in Select', 26: 'Literals in Select',
    27: 'Arithmetic Expressions in Select', 28: 'The Where Clause', 29: 'The From Clause',
    30: 'From-Clause Cartesian Product', 31: 'Query Examples with Joins', 32: 'The Rename Operation in SQL',
    33: 'Self-Join Example (emp-super)', 34: 'Self-Join Supervisor Example', 35: 'Self-Join Indirect Supervisors',
    36: 'Recursive Queries Preview', 37: 'String Operations', 38: 'Pattern Matching Examples',
    39: 'MySQL Pattern Case Sensitivity', 40: 'Ordering Display of Tuples', 41: 'Where-Clause Predicates (Between)',
    42: 'Set Operations in SQL', 43: 'Set Operation Results', 44: 'Set Operations Continued', 45: 'Null Values',
    46: 'Comparisons with Null', 47: 'Check Constraints and Null', 48: 'Null in Where Clauses',
    49: 'Aggregate Functions', 50: 'Aggregate Examples', 51: 'Group By Aggregation',
    52: 'Aggregation Constraints on Select', 53: 'The Having Clause', 54: 'The BIG 6',
    55: 'The BIG 6 Worked Example', 56: 'Nested Subqueries', 57: 'Subqueries in the Where Clause',
    58: 'Set Membership (in)', 59: 'Set Membership Example Result', 60: 'Not In and String Exclusion',
    61: 'Set Membership Continued', 62: 'Set Comparison in Where', 63: 'The Some Clause',
    64: 'Definition of Some', 65: 'Some Clause Example', 66: 'The All Clause', 67: 'Definition of All',
    68: 'All Clause Example', 69: 'Test for Empty Relations', 70: 'Use of Exists', 71: 'Exists Example Continued',
    72: 'Exists Example Result', 73: 'Not Exists', 74: 'Not Exists Example Continued',
    75: 'Test for Absence of Duplicates', 76: 'Unique Example Result', 77: 'Subqueries in the From Clause',
    78: 'From-Clause Subquery Example', 79: 'With Clause (CTEs)', 80: 'Complex Queries Using With',
    81: 'Scalar Subquery', 82: 'Modification of the Database', 83: 'Deletion', 84: 'Updating a Referenced Key',
    85: 'On Update Cascade', 86: 'Deletion with Subqueries', 87: 'Deletion in PostgreSQL',
    88: 'Deletion in MySQL', 89: 'Insertion', 90: 'Insertion with Select', 91: 'Updates',
    92: 'Update with Subquery in PostgreSQL', 93: 'MySQL Same-Table Update Restriction',
    94: 'Conditional Updates', 95: 'Case Statement for Conditional Updates',
    96: 'Updates with Scalar Subqueries', 97: 'Scalar Update Result', 98: 'End of Chapter 3',
    99: 'Project Announcement and Summary'
  };
  return titles[page] || fallback || `Chapter 3 slide ${page}`;
}

function main() {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  data.lessonIds = ['dsa5104-sql-foundations', 'dsa5104-query-processing'];
  data.title = 'Chapter 3 · Introduction to SQL';
  data.summary = 'SQL data definition, basic query structure, set operations, null values, aggregation, nested subqueries, and database modification (insert, delete, update).';
  data.source = {
    sourceId: SOURCE_ID, sourceType: 'lecture', fileName: 'chapter3.pdf', pageCount: data.slides.length,
    access: 'local-only', assetPolicy: 'page-renders-only', courseCodePrintedOnSlide: 'DSA5104', atlasCourseId: 'DSA5104'
  };
  data.extraction = {
    sourceJson: 'data/extracted/DSA5104/chapter3.json',
    parser: {
      triage: { tool: 'pdftotext', pageCount: data.slides.length },
      primary: { tool: 'pymupdf', version: '1.28.2' },
      fallback: { tool: 'mineru', version: 'not-installed-or-not-run', pages: [] }
    },
    markdownReaderView: 'data/extracted/DSA5104/chapter3.md'
  };
  let updated = 0;
  for (const slide of data.slides) {
    const page = slide.slideNumber;
    const meta = META[page];
    slide.title = titleFor(page, slide.title);
    slide.kind = 'lecture-source';
    slide.status = 'reviewed';
    slide.assetPath = `${ASSET_ROOT}/slide-${String(page).padStart(2, '0')}.jpg`;
    slide.sourceRef = { sourceId: SOURCE_ID, sourceType: 'lecture', page, role: 'Chapter 3 lecture slide', status: 'current' };
    slide.lecturePriority = page === 99 ? 'exercise' : 'core';
    slide.sourceNote = 'Extracted text is a reader layer; the rendered slide remains authoritative.';
    if (slide.extraction && Array.isArray(slide.extraction.blocks)) {
      slide.extraction.sourceId = SOURCE_ID;
      slide.extraction.page = page;
    }
    const text = (slide.extraction && slide.extraction.blocks || []).map(b => b.text || '').filter(Boolean).join(' ');
    if (meta) {
      slide.explanation = buildExplanation(meta, slide.title, page);
      slide.socraticQuestions = buildSocratic(meta);
      updated++;
    } else {
      console.warn(`No study metadata for slide ${page}; keeping extractor defaults.`);
    }
  }
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${updated}/${data.slides.length} chapter 3 slides with study layers.`);
}

main();
