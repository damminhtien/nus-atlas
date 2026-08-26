const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const COURSE_ROOT = path.join(ROOT, "content", "courses", "DSA5104");
const LESSON_ROOT = path.join(COURSE_ROOT, "lessons");
const QUESTION_ROOT = path.join(COURSE_ROOT, "questions");
const ARTIFACT_ROOT = path.join(COURSE_ROOT, "artifacts");
const OLD_ID = "dsa5104-sql-foundations";
const lecture = (page, role) => ({ sourceId: "DSA5104/chapter3.pdf", page, sourceType: "lecture", role, status: "current" });
const exercise = (chapter, file, role) => ({ sourceId: `DSA5104/Homework Solutions/${chapter}/${file}.md`, page: 1, sourceType: "exercise", role, status: "current-context" });

const units = [
  { id: "dsa5104-sql-ddl", title: "Ch3.1 · DDL, integrity, and schema changes", minutes: 35, pages: [7, 11, 14, 17], summary: "Define relations and constraints, then distinguish schema changes from tuple mutations.", objectives: ["Write CREATE TABLE definitions with keys and constraints", "Distinguish DDL from DML", "Predict the effect of DROP and ALTER"], body: "DDL defines the relation schema and its integrity constraints. Before writing a statement, identify whether the operation changes the schema or only the current tuples.", example: "Create a table with a primary key and foreign key, then explain which constraint rejects an invalid reference.", formula: ["Schema contract", "Use it to separate a relation definition from its current tuples.", "\\mathrm{schema}\\;\\xrightarrow{\\mathrm{DDL}}\\;\\mathrm{relations}", "DDL creates or changes the schema; DML queries or changes data.", ["\\mathrm{DDL}", "schema definition"], 7], questionIds: ["dsa5104-sql-q1"] },
  { id: "dsa5104-sql-query-shape", title: "Ch3.2 · SELECT-FROM-WHERE and duplicates", minutes: 35, pages: [19, 24, 27, 31], summary: "Build a single-table query from its output, inputs, predicates, and duplicate policy.", objectives: ["Map an English request to SELECT, FROM, and WHERE", "Explain why projection can create duplicates", "Choose DISTINCT only when the request requires it"], body: "Read a query from the requested output backwards: name the projected attributes, list the relations that supply them, and then state the row predicate. Projection does not automatically remove duplicates.", example: "Write a query for course titles in one department, then decide whether duplicate elimination is required by the wording.", formula: ["Basic query shape", "Use it to map output attributes, input relations, and row predicates.", "\\operatorname{SELECT}\\;A\\;\\operatorname{FROM}\\;R\\;\\operatorname{WHERE}\\;P", "The output list, input relations, and row predicate have different jobs; do not hide a missing predicate in a later clause.", ["A", "projected attributes"], 19] },
  { id: "dsa5104-sql-joins", title: "Ch3.3 · Joins and set operations", minutes: 40, pages: [35, 37, 42, 44], summary: "Connect relations through keys and control duplicate behavior in set operations.", objectives: ["Write a key-based join", "Distinguish join predicates from incidental same-name columns", "Choose UNION or UNION ALL deliberately"], body: "A join states which tuples belong together. The safe invariant is a predicate over related keys or explicitly intended attributes; row order and accidental column names are not identity.", example: "Join student, takes, and course through their key path, then compare the result with a natural join that uses an unintended same-name attribute.", formula: ["Theta join", "Use it when the relationship between two relations must be stated explicitly.", "R\\bowtie_{\\theta}S", "The predicate theta controls which tuple pairs are combined. An outer join is a different operation because unmatched tuples are preserved.", ["R,S", "input relations"], 35] },
  { id: "dsa5104-sql-null", title: "Ch3.4 · NULL and three-valued logic", minutes: 30, pages: [45, 46, 48, 49], summary: "Reason about UNKNOWN, NULL predicates, and aggregate behavior before evaluating a query.", objectives: ["Explain why NULL is not an ordinary value", "Use IS NULL instead of equality with NULL", "Distinguish COUNT(*) from COUNT(column)"], body: "A comparison involving NULL normally yields UNKNOWN. WHERE keeps only TRUE, so an UNKNOWN row disappears even though UNKNOWN is not the same truth value as FALSE.", example: "Trace a LEFT JOIN row with a missing instructor and explain why `= NULL` fails while `IS NULL` succeeds.", formula: ["Three-valued logic", "Use it to predict whether a NULL comparison survives WHERE.", "\\{\\mathrm{TRUE},\\mathrm{FALSE},\\mathrm{UNKNOWN}\\}", "SQL predicates operate with three truth values; a WHERE filter retains only TRUE.", ["\\mathrm{UNKNOWN}", "result of an indeterminate comparison"], 46] },
  { id: "dsa5104-sql-aggregation", title: "Ch3.5 · Aggregation, GROUP BY, HAVING, and BIG 6", minutes: 45, pages: [50, 54, 56, 57], summary: "Evaluate aggregate queries in logical order and keep row predicates separate from group predicates.", objectives: ["Group by the attributes that identify a group", "Place aggregate predicates in HAVING", "Trace the BIG 6 query shape"], body: "WHERE filters rows before grouping. GROUP BY forms groups, aggregate functions summarize them, and HAVING filters completed groups. Keep this reasoning order separate from the SQL text order.", example: "Count students per department, then retain only groups meeting a threshold with HAVING.", formula: ["Logical aggregation order", "Use it to decide where a predicate belongs in an aggregate query.", "\\mathrm{WHERE}\\prec\\mathrm{GROUP\\ BY}\\prec\\mathrm{HAVING}", "The optimizer may rewrite the physical plan, but it must preserve this relational meaning.", ["\\prec", "conceptually happens before"], 54] },
  { id: "dsa5104-sql-nested", title: "Ch3.6 · Nested queries and quantifiers", minutes: 40, pages: [58, 63, 66, 69, 73], summary: "Use IN, SOME, ALL, EXISTS, and NOT EXISTS to express membership, witnesses, and universal conditions.", objectives: ["Distinguish value membership from row existence", "Translate SOME and ALL into witness reasoning", "Use NOT EXISTS to express absence of a counterexample"], body: "A nested query is a relation-valued component of a larger query. First describe what the inner result means, then decide whether the outer condition needs membership, a witness, or the absence of a counterexample.", example: "Express a universal requirement as NOT EXISTS a required item for which the candidate has no matching row.", formula: ["Universal condition", "Use it when a request says every required item must be present.", "\\neg\\exists x\\;[\\mathrm{required}(x)\\land\\neg\\mathrm{matched}(x)]", "Checking that no counterexample exists is often safer than relying on a nullable NOT IN subquery.", ["\\neg\\exists", "no counterexample exists"], 73] },
  { id: "dsa5104-sql-cte", title: "Ch3.7 · Common table expressions", minutes: 30, pages: [79, 80, 82], summary: "Name a statement-scoped intermediate result and compose readable multi-step queries.", objectives: ["Explain the scope of a CTE", "Separate an intermediate relation from a stored view", "Use a CTE to make a multi-stage query auditable"], body: "A CTE names a temporary relation for one statement. It improves the reasoning surface of a query without changing the stored schema or creating persistent data.", example: "Compute department totals in one CTE, then compare each total with the average of those totals in a second query step.", formula: ["CTE scope", "Use it to mark an intermediate relation that exists only for one statement.", "\\mathrm{WITH}\\;T\\;\\mathrm{AS}\\;(Q)\\;\\mathrm{SELECT}\\;...", "The name T is available to the statement that follows WITH and is not a permanent relation.", ["T", "statement-scoped relation"], 79] },
  { id: "dsa5104-sql-mutations", title: "Ch3.8 · INSERT, DELETE, UPDATE safety", minutes: 35, pages: [86, 88, 91, 94], summary: "Treat mutation predicates as a safety boundary and reason about referential actions.", objectives: ["Preview a mutation with a SELECT", "Explain the scope supplied by WHERE", "Predict cascade and constraint effects"], body: "A mutation is safe only when its target set is explicit. Before executing INSERT, DELETE, or UPDATE, write a SELECT with the same predicate, check the affected keys, and then apply the change deliberately.", example: "Preview an UPDATE with the same WHERE clause, verify the target key set, and explain what a cascading delete would remove.", formula: ["Mutation scope", "Use it to inspect the exact rows eligible for an update or delete.", "\\mathrm{UPDATE}\\;R\\;\\mathrm{SET}\\;A=f(A)\\;\\mathrm{WHERE}\\;P", "The predicate P defines the mutation target; omitting it can make every tuple eligible.", ["P", "mutation predicate"], 91] }
];

const plannedUnits = [
  { id: "dsa5104-ch4-preview", title: "Ch4 · Intermediate SQL exercise preview", chapter: "Ch04_Intermediate_SQL", topic: "intermediate SQL", week: 9, pages: [1], body: "This preview organizes the supplied Chapter 4 homework solutions around joins, views, outer joins, constraints, and authorization. No DSA5104 Chapter 4 lecture deck is currently supplied, so this remains exercise-only and is excluded from default Exam Mode.", formula: ["Intermediate SQL bridge", "Use the exercise set to connect multi-table queries to views and integrity constraints.", "R\\bowtie S\\;\\rightarrow\\;\\mathrm{view}\\;\\rightarrow\\;\\mathrm{constraint}", "The exercise solutions are practice depth, not evidence that this chapter is current lecture scope.", ["R,S", "relations joined by a stated predicate"]] },
  { id: "dsa5104-ch5-preview", title: "Ch5 · Advanced SQL exercise preview", chapter: "Ch05_Advanced_SQL", topic: "advanced SQL", week: 10, pages: [1], body: "This preview organizes the supplied Chapter 5 homework solutions around programming-language access, triggers, recursive queries, and advanced aggregation. The future DSA5104 lecture emphasis is not yet verified locally.", formula: ["Advanced SQL bridge", "Use it to recognize the exercise families before the official lecture source arrives.", "\\mathrm{query}\\;\\rightarrow\\;\\mathrm{program}\\;\\rightarrow\\;\\mathrm{trigger}", "Do not treat textbook exercises or a forecast as a confirmed DSA5104 lecture syllabus.", ["\\mathrm{trigger}", "database action caused by an event"]] },
  { id: "dsa5104-ch7-preview", title: "Ch7 · Schema refinement exercise preview", chapter: "Ch07_Relational_Database_Design", topic: "schema refinement", week: 11, pages: [1], body: "This preview organizes the supplied Chapter 7 homework solutions around functional dependencies, closure, BCNF, lossless decomposition, and dependency preservation. It is exercise-only until the official DSA5104 second-half lecture source is supplied.", formula: ["Decomposition bridge", "Use it to reason from a dependency to a smaller design while checking correctness.", "R\\;\\xrightarrow{\\mathrm{decompose}}\\;R_1,\\ldots,R_k", "A decomposition is useful only when the required information can be reconstructed and the intended dependencies are handled.", ["R_i", "decomposed relation"]] }
];

const CONTRAST_DRILLS = {
  "dsa5104-sql-ddl": [{
    id: "dsa5104-contrast-ddl-dml",
    type: "contrast",
    kind: "concept-contrast",
    pair: "DDL vs DML",
    prompt: "Which statement changes the relation definition rather than only its current rows?",
    choices: ["ALTER TABLE", "INSERT", "UPDATE", "DELETE"],
    answer: 0,
    explanation: "DDL changes schema metadata; INSERT, UPDATE, and DELETE change the current relation instance.",
    estimatedSeconds: 45,
    difficulty: "easy",
    skill: "concept-contrast",
    cognitiveLevel: "distinguish",
    misconception: "A SQL statement can mutate data or the schema; these are different layers.",
    sourceRefs: [lecture(7, "DDL scope")]
  }],
  "dsa5104-sql-query-shape": [
    {
      id: "dsa5104-contrast-is-vs-equals-string",
      type: "contrast",
      kind: "concept-contrast",
      pair: "IS vs = for strings",
      prompt: "You need instructors whose name is exactly 'AAA'. Which predicate is the ordinary string comparison?",
      choices: ["`name IS 'AAA'`", "`name = 'AAA'`", "`name IS NULL`", "`name LIKE 'A%'`"],
      answer: 1,
      explanation: "Use `=` to compare an ordinary string value. `IS` is for predicates such as `IS NULL`, `IS TRUE`, and `IS FALSE`; it is not the normal operator for matching a string literal.",
      estimatedSeconds: 45,
      difficulty: "easy",
      skill: "concept-contrast",
      cognitiveLevel: "distinguish",
      misconception: "Treating IS as a general replacement for the equality operator.",
      repair: "Use `=` for ordinary values and `IS NULL` or `IS NOT NULL` for NULL tests.",
      sourceRefs: [lecture(28, "equality predicate"), lecture(46, "NULL predicate exceptions")]
    },
    {
      id: "dsa5104-contrast-double-equals-equals",
      type: "contrast",
      kind: "concept-contrast",
      pair: "== vs =",
      prompt: "Which spelling should you use for an ordinary SQL equality predicate in the MySQL examples?",
      choices: ["`name == 'AAA'`", "`name = 'AAA'`", "`name := 'AAA'`", "`name IS 'AAA'`"],
      answer: 1,
      explanation: "The course SQL examples use `=` for equality. Do not import `==` from a programming language into an SQL predicate.",
      estimatedSeconds: 30,
      difficulty: "easy",
      skill: "syntax-contrast",
      cognitiveLevel: "distinguish",
      misconception: "Assuming an SQL predicate uses the same equality spelling as a programming language.",
      repair: "Write `column = value`, then reserve `IS NULL` and `IS NOT NULL` for NULL predicates.",
      sourceRefs: [lecture(28, "SQL equality predicate"), lecture(31, "multi-table WHERE predicate")]
    },
    {
      id: "dsa5104-contrast-backticks-vs-string-quotes",
      type: "contrast",
      kind: "concept-contrast",
      pair: "Identifier quoting vs string literal quoting",
      prompt: "Which expression compares the column name with the string value AAA in MySQL?",
      choices: ["`name` is the column identifier; compare it with 'AAA'", "`AAA` is the string literal; compare it with name", "'name' is the column identifier", "Backticks and single quotes mean the same thing"],
      answer: 0,
      explanation: "Backticks quote an identifier such as a column name; single quotes quote a string value. Therefore the column identifier `name` should be compared with the string literal 'AAA'.",
      estimatedSeconds: 45,
      difficulty: "medium",
      skill: "syntax-contrast",
      cognitiveLevel: "distinguish",
      misconception: "Treating backticks and single quotes as interchangeable string delimiters.",
      repair: "Use backticks only when quoting MySQL identifiers and single quotes for string literals.",
      sourceRefs: [lecture(20, "SQL names"), lecture(26, "string literal")]
    },
    {
      id: "dsa5104-contrast-equals-vs-like",
      type: "contrast",
      kind: "concept-contrast",
      pair: "= vs LIKE",
      prompt: "Which predicate finds names beginning with the characters Al?",
      choices: ["`name = 'Al%'`", "`name LIKE 'Al%'`", "`name IS 'Al%'`", "`name IN ('Al%')`"],
      answer: 1,
      explanation: "`LIKE` interprets `%` as a pattern wildcard matching zero or more characters. The equality operator `=` treats the percent sign as part of the literal value.",
      estimatedSeconds: 45,
      difficulty: "easy",
      skill: "query-predicate",
      cognitiveLevel: "distinguish",
      misconception: "Expecting % or _ to act as wildcards when the predicate uses =.",
      repair: "Use LIKE for patterns: % means zero or more characters and _ means exactly one character.",
      sourceRefs: [lecture(37, "LIKE patterns"), lecture(38, "pattern examples")]
    },
    {
      id: "dsa5104-contrast-collation-sensitivity",
      type: "contrast",
      kind: "concept-contrast",
      pair: "Case-insensitive vs case-sensitive collation",
      prompt: "In MySQL, will `name = 'Alice'` always differ from `name = 'alice'`?",
      choices: ["Yes, they are always unequal", "No; the comparison depends on the column's character set and collation", "No, they are always equal", "The query is always a syntax error"],
      answer: 1,
      explanation: "Text comparison behavior is controlled by the character set and collation. A case-insensitive collation can treat Alice and alice as equal, while a case-sensitive collation can distinguish them.",
      estimatedSeconds: 45,
      difficulty: "medium",
      skill: "dbms-semantics",
      cognitiveLevel: "distinguish",
      misconception: "Assuming string case sensitivity is a universal SQL rule independent of DBMS configuration.",
      repair: "Check the MySQL collation before predicting the result of a case-sensitive text comparison.",
      sourceRefs: [lecture(22, "MySQL character set and collation"), lecture(39, "MySQL pattern sensitivity")]
    },
    {
      id: "dsa5104-contrast-and-or-parentheses",
      type: "contrast",
      kind: "concept-contrast",
      pair: "AND/OR precedence vs explicit parentheses",
      prompt: "Which predicate means `(dept_name = 'Physics' OR dept_name = 'Music') AND salary > 50000`?",
      choices: [
        "`dept_name = 'Physics' OR dept_name = 'Music' AND salary > 50000`",
        "`(dept_name = 'Physics' OR dept_name = 'Music') AND salary > 50000`",
        "`dept_name = 'Physics' AND dept_name = 'Music' OR salary > 50000`",
        "`dept_name = 'Physics' OR (dept_name = 'Music' AND salary) > 50000`"
      ],
      answer: 1,
      explanation: "AND has higher precedence than OR, so the unparenthesized first choice means `Physics OR (Music AND salary > 50000)`. Parentheses make the intended grouping explicit.",
      estimatedSeconds: 45,
      difficulty: "medium",
      skill: "query-predicate",
      cognitiveLevel: "distinguish",
      misconception: "Reading a mixed AND/OR predicate left to right as if all operators had equal precedence.",
      repair: "When a condition mixes AND and OR, parenthesize the intended groups before checking the result.",
      sourceRefs: [lecture(28, "Boolean WHERE predicates"), lecture(31, "combined query predicates")]
    }
  ],
  "dsa5104-sql-aggregation": [{
    id: "dsa5104-contrast-where-having",
    type: "contrast",
    kind: "concept-contrast",
    pair: "WHERE vs HAVING",
    prompt: "Which clause belongs in a query that keeps departments with `AVG(salary) > 50000`?",
    choices: ["WHERE", "HAVING", "FROM", "SELECT"],
    answer: 1,
    explanation: "WHERE filters rows before grouping; HAVING filters completed groups using an aggregate such as `AVG(salary)`. ",
    estimatedSeconds: 45,
    difficulty: "easy",
    skill: "concept-contrast",
    cognitiveLevel: "distinguish",
    misconception: "An aggregate predicate belongs after grouping, not in the row-level WHERE stage.",
    repair: "Put row predicates in WHERE and aggregate predicates in HAVING.",
    sourceRefs: [lecture(53, "AVG and HAVING")]
  },
  {
    id: "dsa5104-contrast-count-star-vs-column",
    type: "contrast",
    kind: "concept-contrast",
    pair: "COUNT(*) vs COUNT(column)",
    prompt: "A table has salary values 90000, NULL, and 60000. Which statement counts all three rows?",
    choices: ["COUNT(*)", "COUNT(salary)", "AVG(salary)", "COUNT(salary IS NULL)"],
    answer: 0,
    explanation: "`COUNT(*)` counts rows. `COUNT(salary)` counts only non-NULL salary values, so it returns 2 for this table. Other aggregates such as `AVG(salary)` also ignore NULL values.",
    estimatedSeconds: 45,
    difficulty: "medium",
    skill: "aggregate-semantics",
    cognitiveLevel: "distinguish",
    misconception: "Assuming COUNT(column) counts rows even when the selected column contains NULL.",
    repair: "Use COUNT(*) for row count; use COUNT(column) when you specifically want the number of non-NULL values.",
    sourceRefs: [lecture(45, "NULL values"), lecture(49, "aggregate functions")]
  }],
  "dsa5104-sql-joins": [{
    id: "dsa5104-contrast-union-vs-union-all",
    type: "contrast",
    kind: "concept-contrast",
    pair: "UNION vs UNION ALL",
    prompt: "Two compatible queries return {1, 2} and {2, 3}. Which operator keeps both occurrences of 2?",
    choices: ["`UNION`", "`UNION ALL`", "`INTERSECT`", "`EXCEPT`"],
    answer: 1,
    explanation: "`UNION` removes duplicate tuples. `UNION ALL` retains every tuple from both inputs, so the value 2 appears twice in the result.",
    estimatedSeconds: 45,
    difficulty: "easy",
    skill: "set-operations",
    cognitiveLevel: "distinguish",
    misconception: "Treating UNION and UNION ALL as synonyms and overlooking duplicate policy.",
    repair: "Choose UNION for duplicate elimination and UNION ALL when multiplicity must be preserved.",
    sourceRefs: [lecture(42, "set operations"), lecture(44, "duplicate policy")]
  }],
  "dsa5104-sql-null": [
    {
      id: "dsa5104-contrast-equals-null-vs-is-null",
      type: "contrast",
      kind: "concept-contrast",
      pair: "= NULL vs IS NULL",
      prompt: "Which predicate finds instructors whose salary is unknown?",
      choices: ["`salary = NULL`", "`salary IS NULL`", "`salary == NULL`", "`salary <> NULL`"],
      answer: 1,
      explanation: "NULL is not an ordinary value. A comparison such as `salary = NULL` evaluates to UNKNOWN, while `IS NULL` is the predicate that tests for a NULL value.",
      estimatedSeconds: 45,
      difficulty: "easy",
      skill: "three-valued-logic",
      cognitiveLevel: "distinguish",
      misconception: "Treating NULL as a value that can be matched with =.",
      repair: "Use IS NULL to test for missing or unknown values.",
      sourceRefs: [lecture(46, "NULL comparison"), lecture(48, "UNKNOWN in WHERE")]
    },
    {
      id: "dsa5104-contrast-not-equals-null-vs-is-not-null",
      type: "contrast",
      kind: "concept-contrast",
      pair: "!= NULL vs IS NOT NULL",
      prompt: "Which predicate finds instructors whose salary is present?",
      choices: ["`salary != NULL`", "`salary IS NOT NULL`", "`NOT salary = NULL`", "`salary <> NULL`"],
      answer: 1,
      explanation: "salary != NULL and salary <> NULL compare with NULL and therefore evaluate to UNKNOWN, not TRUE. IS NOT NULL explicitly tests that a value is present.",
      estimatedSeconds: 45,
      difficulty: "easy",
      skill: "three-valued-logic",
      cognitiveLevel: "distinguish",
      misconception: "Assuming != NULL is the logical negation of IS NULL.",
      repair: "Use IS NOT NULL for presence; do not use != or <> to compare with NULL.",
      sourceRefs: [lecture(46, "NULL comparison"), lecture(48, "UNKNOWN in WHERE")]
    }
  ],
  "dsa5104-sql-nested": [{
    id: "dsa5104-contrast-not-in-vs-not-exists-null",
    type: "contrast",
    kind: "concept-contrast",
    pair: "NOT IN vs NOT EXISTS with NULL",
    prompt: "A subquery can return {101, 102, NULL}. Which form is safer for finding students with no matching advisor row?",
      choices: ["`ID NOT IN (subquery)`", "`NOT EXISTS (SELECT 1 FROM advisor ...)`", "`ID = NULL`", "`ID <> ALL (subquery)`"],
    answer: 1,
    explanation: "A NULL in the `NOT IN` result can make the comparison UNKNOWN, so expected rows may disappear. A correlated `NOT EXISTS` directly checks that no matching advisor row exists.",
    estimatedSeconds: 60,
    difficulty: "hard",
    skill: "nested-query-semantics",
    cognitiveLevel: "distinguish",
    misconception: "Assuming NOT IN remains a simple negation when its subquery contains NULL.",
    repair: "When NULL can enter the subquery, prefer a correlated NOT EXISTS or filter NULL explicitly before using NOT IN.",
    sourceRefs: [lecture(60, "NOT IN membership"), lecture(69, "EXISTS emptiness")]
  }],
  "dsa5104-sql-mutations": [{
    id: "dsa5104-contrast-delete-vs-drop",
    type: "contrast",
    kind: "concept-contrast",
    pair: "DELETE vs DROP",
    prompt: "Which statement removes the rows from student while keeping the table definition?",
    choices: ["`DELETE FROM student`", "`DROP TABLE student`", "`ALTER TABLE student DROP`", "`TRUNCATE DATABASE student`"],
    answer: 0,
    explanation: "`DELETE` removes tuples from a relation. `DROP TABLE` removes the table definition itself, including the schema object.",
    estimatedSeconds: 45,
    difficulty: "easy",
    skill: "ddl-dml-boundary",
    cognitiveLevel: "distinguish",
    misconception: "Treating row deletion and schema deletion as the same operation.",
    repair: "Use DELETE for tuples and DROP TABLE only when the relation itself should no longer exist.",
    sourceRefs: [lecture(14, "DELETE tuples"), lecture(15, "DROP table")]
  }]
};

function lens(refs, status, why) {
  return { status, whyExaminable: why, lecture: status === "core DSA5104" ? refs : [], officialExercise: refs.filter(ref => ref.sourceType === "exercise"), textbook: [{ sourceId: "DSA5104/Database System Concepts, 7th edition", page: 1, sourceType: "textbook", role: "textbook depth pointer", status: "course-depth" }], reference: [] };
}

function makeLesson(unit, index, planned = false) {
  const refs = planned ? [exercise(unit.chapter, "1", `${unit.topic} exercise set`)] : unit.pages.map(page => lecture(page, unit.title));
  const sourceLens = lens(refs, planned ? "exercise-only" : "core DSA5104", planned ? "The local solution set supplies practice depth only; no supplied lecture deck authorizes this topic as current Exam Mode scope." : "This unit is split directly from the supplied Chapter 3 lecture deck so retrieval and mistake repair stay topic-sized.");
  const formula = unit.formula;
  return {
    id: unit.id,
    courseId: "DSA5104",
    title: unit.title,
    moduleId: planned ? "dsa5104-planned" : "dsa5104-sql",
    scope: planned ? "planned" : "core",
    examEligible: !planned,
    contentStatus: planned ? "PLANNED · EXERCISE-ONLY · SOURCE PENDING" : "CURRENT LECTURE",
    week: unit.week || 4,
    orderInWeek: planned ? 1 : index + 1,
    minutes: planned ? 45 : unit.minutes,
    summary: unit.summary || unit.body,
    objectives: unit.objectives || ["Attempt the supplied exercise set", "Label the source boundary before using the material", "Record one common trap"],
    sourceRefs: refs,
    visualIds: !planned && index === 0 ? ["dsa5104-sql-flow"] : [],
    sections: [{ title: planned ? "Exercise-only boundary" : unit.title.replace(/^Ch3\.\d+ · /, ""), sourceType: planned ? "exercise" : "lecture", body: unit.body, sourceRefs: refs, sourceLens }],
    examples: [{ title: unit.example || "Source-first exercise move", sourceType: planned ? "exercise" : "lecture", steps: [unit.body, "State the output, input relations, predicate, and one edge case before checking the solution."], answer: "A strong answer names the semantic boundary and cites the source page or exercise file." }],
    criticalQuestions: [
      { prompt: planned ? "What evidence would upgrade this preview from exercise-only to current lecture scope?" : `What is the decisive semantic boundary in ${unit.title}?`, angle: "Name the operation, its input, its output, and the condition that would make the shortcut fail.", modelAnswer: planned ? "A supplied, verified DSA5104 lecture source with page-level provenance would be required." : "The answer should identify the operation's input/output boundary and one counterexample or edge case.", focus: "source and semantics" },
      { prompt: planned ? "Why should this material stay out of default Exam Mode today?" : "Which tempting shortcut would produce a plausible but incorrect answer?", angle: "Separate what the source says from what a familiar SQL pattern seems to imply.", modelAnswer: planned ? "Because the local source is a homework solution set, not a verified current lecture deck." : "The shortcut is unsafe when it changes row scope, duplicate policy, NULL treatment, or constraint meaning.", focus: "common trap" }
    ],
    math: [{ name: formula[0], purpose: formula[1], latex: formula[2], explanation: formula[3], symbols: formula[4].map(latex => ({ latex, meaning: latex === formula[4][0] ? "the key object in this unit" : "the associated semantic role" })), sourceType: planned ? "exercise" : "lecture", sourceRefs: [refs[0]] }],
    contrastDrills: CONTRAST_DRILLS[unit.id] || [],
    schemaVersion: "nus.lesson.v1"
  };
}

function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }

function split() {
  const oldLessonFile = path.join(LESSON_ROOT, `${OLD_ID}.json`);
  const oldQuestionFile = path.join(QUESTION_ROOT, `${OLD_ID}.json`);
  const base = fs.existsSync(oldLessonFile) ? JSON.parse(fs.readFileSync(oldLessonFile, "utf8")) : {};
  const oldQuestions = fs.existsSync(oldQuestionFile)
    ? JSON.parse(fs.readFileSync(oldQuestionFile, "utf8"))
    : units.flatMap(unit => {
      const file = path.join(QUESTION_ROOT, `${unit.id}.json`);
      return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
    });
  const targetByQuestion = { "dsa5104-sql-q1": "dsa5104-sql-aggregation", "dsa5104-sql-q2": "dsa5104-sql-joins", "dsa5104-bank-007": "dsa5104-sql-aggregation", "dsa5104-bank-008": "dsa5104-sql-aggregation" };
  const target = new Map(units.map(unit => [unit.id, []]));
  oldQuestions.forEach(question => {
    const lessonId = targetByQuestion[question.id] || "dsa5104-sql-aggregation";
    target.get(lessonId).push({ ...question, lessonId });
  });
  for (const [index, unit] of units.entries()) {
    const lesson = makeLesson(unit, index);
    const questions = target.get(unit.id) || [];
    lesson.questionIds = questions.map(question => question.id);
    writeJson(path.join(LESSON_ROOT, `${unit.id}.json`), lesson);
    writeJson(path.join(QUESTION_ROOT, `${unit.id}.json`), questions);
    writeJson(path.join(ARTIFACT_ROOT, `${unit.id}.json`), {
      lessonId: unit.id,
      schemaVersion: "nus.study-kit.v1",
      flashcards: [
        { front: unit.title, back: unit.summary },
        { front: "Source boundary?", back: "Lecture slides define current scope; homework and textbook pointers add practice depth." },
        { front: "First safety check?", back: unit.objectives ? unit.objectives[0] : "Name the requested result and its semantic boundary." }
      ],
      homework: [
        { prompt: `Explain the main move in ${unit.title} and cite the source page.`, rubric: "State the semantic operation, source boundary, and one edge case.", sourceRefs: [lesson.sourceRefs[0]] },
        { prompt: `Create one counterexample or test case for ${unit.title}.`, rubric: "Show the input, expected behavior, and the trap it catches.", sourceRefs: [lesson.sourceRefs[0]] }
      ],
      codeExercises: []
    });
  }
  for (const [index, unit] of plannedUnits.entries()) {
    const lesson = makeLesson({ ...unit, summary: unit.body, objectives: ["Use the supplied solution set as practice depth", "Label unsupported lecture assumptions", "Record one question for the official deck"] }, index, true);
    lesson.questionIds = [];
    writeJson(path.join(LESSON_ROOT, `${unit.id}.json`), lesson);
    writeJson(path.join(QUESTION_ROOT, `${unit.id}.json`), []);
    writeJson(path.join(ARTIFACT_ROOT, `${unit.id}.json`), {
      lessonId: unit.id,
      schemaVersion: "nus.study-kit.v1",
      flashcards: [{ front: unit.title, back: unit.body }, { front: "Current scope?", back: "Exercise-only preview; official lecture source pending." }, { front: "Exam default?", back: "Excluded from default Exam Mode until a current lecture source is verified." }],
      homework: [{ prompt: `Attempt the complete ${unit.topic} solution set before reading the answers.`, rubric: "Tag each item by skill and record unresolved assumptions.", sourceRefs: [lesson.sourceRefs[0]] }, { prompt: "Write one question that the future official lecture deck must answer.", rubric: "Name the missing source evidence and the technical ambiguity.", sourceRefs: [lesson.sourceRefs[0]] }],
      codeExercises: []
    });
  }
  fs.rmSync(oldLessonFile, { force: true });
  fs.rmSync(oldQuestionFile, { force: true });
  fs.rmSync(path.join(ARTIFACT_ROOT, `${OLD_ID}.json`), { force: true });
  return { core: units.map(unit => unit.id), planned: plannedUnits.map(unit => unit.id), baseKeys: Object.keys(base) };
}

if (require.main === module) console.log(JSON.stringify(split()));
module.exports = { split, units, plannedUnits };
