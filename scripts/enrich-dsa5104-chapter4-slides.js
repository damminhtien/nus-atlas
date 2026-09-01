#!/usr/bin/env node
/**
 * Add the canonical study layer to the DSA5104 Chapter 4 slide extraction.
 *
 * The extracted source text and page renders remain authoritative. Only the
 * explicitly selected high-yield pages receive authored focus/trap notes;
 * context and support pages stay available without generated teaching prose.
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const FILE = path.join(ROOT, "content", "courses", "DSA5104", "slides", "dsa5104-chapter4.json");
const SOURCE_ID = "DSA5104/chapter4.pdf";
const ASSET_ROOT = "assets/nus/dsa5104/chapter4";
const CORE_SLIDES = Array.from({ length: 87 }, (_, index) => index + 3);

const TITLES = {
  1: "Chapter 4: Intermediate SQL",
  2: "Outline",
  3: "Joined Relations",
  4: "Natural Join in SQL",
  5: "Natural Join in SQL (continued)",
  6: "Student Relation",
  7: "Takes Relation",
  8: "Student Natural Join Takes",
  9: "Dangerous in Natural Join",
  10: "Dangerous in Natural Join (continued)",
  11: "Natural Join with USING Clause",
  12: "Join Condition",
  13: "Outer Join",
  14: "Outer Join Examples",
  15: "Left Outer Join",
  16: "Right Outer Join",
  17: "Full Outer Join",
  18: "Full Outer Join in PostgreSQL",
  19: "Joined Types and Conditions",
  20: "Joined Relations: Examples",
  21: "Joined Relations: Examples",
  22: "Joined Relations: Examples",
  23: "Views",
  24: "View Definition",
  25: "View Definition and Use",
  26: "Views Defined Using Other Views",
  27: "Views Defined Using Other Views",
  28: "View Expansion",
  29: "View Expansion (continued)",
  30: "Materialized Views",
  31: "Update of a View",
  32: "Some Updates Cannot Be Translated Uniquely",
  33: "Some Updates Cannot Be Translated",
  34: "Some Updates Cannot Be Translated (continued)",
  35: "View Updates in SQL",
  36: "Transactions",
  37: "Transactions in MySQL",
  38: "Variables in MySQL",
  39: "Transactions: MySQL Example",
  40: "Integrity Constraints",
  41: "Constraints on a Single Relation",
  42: "NOT NULL Constraints",
  43: "UNIQUE Constraints",
  44: "The CHECK Clause",
  45: "The CHECK Clause: MySQL Example",
  46: "Referential Integrity",
  47: "Referential Integrity (continued)",
  48: "Cascading Actions in Referential Integrity",
  49: "Cascading Actions: ON UPDATE CASCADE",
  50: "Integrity Constraint Violation During Transactions",
  51: "Deferred Constraint Checking",
  52: "Deferred Constraint Checking (continued)",
  53: "Deferred Constraint Checking: SET NULL",
  54: "Temporarily Disabling Foreign-Key Checks",
  55: "Built-in Data Types in SQL",
  56: "Built-in Data Types in SQL (continued)",
  57: "Large-Object Types",
  58: "User-Defined Types",
  59: "Domains",
  60: "Index Creation",
  61: "Index Creation Example",
  62: "Index Creation Example",
  63: "Example of B+-Tree Index",
  64: "B+-Tree Index Files",
  65: "Example of a B+-Tree",
  66: "Queries on B+-Trees",
  67: "Example of Hash Index",
  68: "Static Hashing",
  69: "Handling of Bucket Overflows",
  70: "Index on a Non-Candidate Key",
  71: "Authorization",
  72: "Authorization (continued)",
  73: "Authorization Specification in SQL",
  74: "Privileges in SQL",
  75: "Revoking Authorization in SQL",
  76: "MySQL Authorization Example",
  77: "MySQL Authorization Example",
  78: "MySQL Authorization Example",
  79: "MySQL Authorization Example",
  80: "MySQL Authorization Example",
  81: "MySQL Authorization Example",
  82: "Roles",
  83: "Roles Example",
  84: "Authorization on Views",
  85: "MySQL Authorization Example",
  86: "MySQL Authorization Example",
  87: "MySQL Authorization Example",
  88: "MySQL Authorization Example: Remote Access",
  89: "Other Authorization Features",
  90: "End of Chapter 4",
  91: "Homework"
};

const HIGH_YIELD = {
  3: { focus: "A join combines two relations by constraining a Cartesian product and returns another relation.", trap: "Listing two relations is not a key-based join; without a condition the candidate pairs are a Cartesian product." },
  4: { focus: "Natural join matches equal values in every same-named attribute and removes the duplicate join columns from the result.", trap: "Natural join is unsafe when a same-named attribute is not an intended relationship key." },
  9: { focus: "Check every common attribute before using NATURAL JOIN; an accidental same-name match can silently remove valid tuples.", trap: "The query can run successfully and still be logically wrong because unrelated columns were equated." },
  10: { focus: "Use an explicit join predicate when student, takes, and course share same-named attributes with different meanings.", trap: "A natural join across all three relations may also match department names and omit cross-department course-taking rows." },
  11: { focus: "Use JOIN ... USING (column) when the equality columns are known and should be stated explicitly.", trap: "USING documents the intended common column; do not rely on every same-named column being semantically related." },
  12: { focus: "Use JOIN ... ON for a general predicate and qualify attributes when the relationship is not a simple same-name equality.", trap: "Do not confuse the join predicate with a later row filter; their placement matters for outer joins." },
  13: { focus: "An outer join preserves unmatched tuples and fills missing attributes with NULL instead of losing the tuple.", trap: "An inner join drops unmatched tuples; it cannot answer a question that asks for entities with no match." },
  15: { focus: "A LEFT OUTER JOIN keeps every tuple from the left relation and adds matching right-side data when available.", trap: "Swapping the left and right operands changes which unmatched entities are preserved." },
  17: { focus: "MySQL has no direct FULL OUTER JOIN syntax; combine left- and right-outer-join results with UNION when both sides must be preserved.", trap: "A LEFT JOIN alone loses right-only tuples, while a RIGHT JOIN alone loses left-only tuples." },
  19: { focus: "Choose natural, inner, or outer join from the required matching rule and whether unmatched tuples must survive.", trap: "Join type and join condition are separate decisions; a correct predicate does not make an inner join preserve unmatched rows." },
  21: { focus: "Translate a multi-table query with an explicit key path and keep output columns separate from matching conditions.", trap: "A plausible result on a small sample does not prove that every required join predicate is present." },
  23: { focus: "A view gives users a relation-shaped interface over a query while hiding or restricting parts of the underlying logical model.", trap: "A view is not automatically a stored copy of its rows; distinguish a logical view from a materialized view." },
  24: { focus: "CREATE VIEW names a query result, and later queries can use that name as a relation.", trap: "Creating a view defines a reusable query; it does not necessarily materialize or duplicate the underlying data." },
  25: { focus: "Use a view to expose only the columns or rows a user needs, such as instructor data without salary.", trap: "Access to a view does not imply access to every underlying relation or column." },
  30: { focus: "A materialized view stores a physically maintained result and trades faster reads for refresh and storage cost.", trap: "Materialized data can become stale; do not treat it as automatically identical to the current base tables." },
  31: { focus: "An update through a simple view may be translated to an underlying relation when the mapping is unambiguous.", trap: "A view update is not always uniquely translatable, especially when the view omits or combines base-table information." },
  35: { focus: "SQL implementations generally allow updates only for simple views whose base-row mapping is clear.", trap: "Projection, joins, aggregation, and computed or filtered results can make an update ambiguous or impossible." },
  36: { focus: "A transaction is a sequence of queries or updates treated as one logical unit with an all-or-nothing outcome.", trap: "Several statements are not automatically one transaction; the transaction boundary controls atomicity." },
  37: { focus: "In MySQL, autocommit makes each statement atomic by default; START TRANSACTION keeps the unit open until COMMIT or ROLLBACK.", trap: "Do not assume a later ROLLBACK undoes a statement that was already committed by autocommit." },
  40: { focus: "Integrity constraints prevent accidental database states that violate the declared data model.", trap: "A query returning rows does not prove that inserts, updates, and deletes preserve every constraint." },
  41: { focus: "For one relation, NOT NULL, PRIMARY KEY, UNIQUE, and CHECK constrain the legal values or tuples.", trap: "These constraints operate at different levels; UNIQUE is not the same as PRIMARY KEY and CHECK is not a foreign-key relationship." },
  42: { focus: "NOT NULL requires an attribute value to be present for every tuple in the relation.", trap: "NOT NULL addresses missing values; it does not by itself enforce uniqueness or referential integrity." },
  43: { focus: "UNIQUE requires no two tuples to share the specified combination of attribute values.", trap: "A UNIQUE constraint is not automatically the relation's primary key and does not define the parent key for a foreign key." },
  44: { focus: "CHECK (P) requires the predicate P to hold for every tuple inserted or updated in the relation.", trap: "A CHECK condition is a tuple-level rule; it is not a substitute for checking a value against another relation." },
  46: { focus: "Referential integrity requires each non-null foreign-key value to match a referenced key in the parent relation.", trap: "A child row cannot point at a missing parent row unless the foreign key is allowed to be NULL or an explicit action applies." },
  48: { focus: "ON DELETE and ON UPDATE actions define what happens to referencing rows when a parent key is changed or removed.", trap: "CASCADE is a configured action, not the default behavior for every foreign key." },
  50: { focus: "When several statements temporarily violate a constraint, the transaction must still finish in a state that satisfies the constraint.", trap: "Do not confuse deferred checking with ignoring the constraint; the final committed state must still be legal." },
  54: { focus: "Temporarily disabling foreign-key checks changes safety guarantees and should be treated as a controlled data-loading operation.", trap: "Turning checks off can load inconsistent rows; it is not a general fix for a broken relationship." },
  55: { focus: "Choose SQL data types from the intended values and precision, then account for NULL and DBMS-specific behavior.", trap: "A type declaration is part of the schema contract; it is not only a display-format choice." },
  60: { focus: "An index is a physical access structure that can locate qualifying tuples without scanning the entire relation.", trap: "An index can improve access cost but does not change the logical query result or replace an integrity constraint." },
  61: { focus: "CREATE INDEX names an index on a relation and one or more attributes used by retrieval paths.", trap: "Creating an index is a physical-design decision; it does not make the indexed attribute unique unless the constraint says so." },
  70: { focus: "An index can be useful on a non-candidate key because retrieval may still select a small part of a relation.", trap: "Indexing an attribute does not assert that its values identify one tuple." },
  71: { focus: "Authorization controls which users may read data, modify data, or change database schema objects.", trap: "Knowing a relation exists does not imply that every user may select from or modify it." },
  73: { focus: "GRANT assigns a privilege on a relation or view to a user, PUBLIC, or role.", trap: "Granting a privilege on a view does not automatically grant privileges on every underlying relation." },
  74: { focus: "Distinguish SELECT, INSERT, UPDATE, DELETE, REFERENCES, and schema privileges by the operation they authorize.", trap: "Read access is not write access, and REFERENCES is not the same as permission to query rows." },
  75: { focus: "REVOKE removes a previously granted privilege from a user or role according to the grant chain.", trap: "Revoking one privilege is not the same as dropping the relation or deleting its data." },
  82: { focus: "A role groups privileges so access can be managed for a named responsibility rather than one user at a time.", trap: "A role is an authorization object; it is not a database table or a relation containing users." },
  84: { focus: "A view can expose a restricted projection or selection while authorization controls who can use that interface.", trap: "Granting access to a view does not silently grant unrestricted access to its base tables." },
  89: { focus: "REFERENCES privilege controls who may create foreign-key references to a relation or its attributes.", trap: "The privilege to reference a table is different from the privilege to read or modify its tuples." }
};

function applyStudyLayer(data) {
  data.lessonIds = ["dsa5104-ch4-preview"];
  data.title = "Week 4 · Chapter 4: Intermediate SQL";
  data.summary = "All 91 supplied Chapter 4 lecture pages with source extraction, page renders, and a compact exam-focused study filter.";
  data.coreSlideNumbers = CORE_SLIDES;
  data.source = {
    sourceId: SOURCE_ID,
    sourceType: "lecture",
    fileName: "chapter4.pdf",
    pageCount: data.slides.length,
    access: "local-only",
    assetPolicy: "page-renders-only",
    courseCodePrintedOnSlide: "DSA5104",
    atlasCourseId: "DSA5104"
  };
  data.extraction = {
    sourceJson: "data/extracted/DSA5104/chapter4.json",
    parser: {
      triage: { tool: "pdftotext", pageCount: data.slides.length },
      primary: { tool: "pymupdf", version: "1.28.2" },
      fallback: { tool: "mineru", version: "not-installed-or-not-run", pages: [] }
    },
    markdownReaderView: "data/extracted/DSA5104/chapter4.md"
  };

  for (const slide of data.slides) {
    const page = Number(slide.slideNumber);
    const note = HIGH_YIELD[page];
    slide.title = TITLES[page] || `Chapter 4 slide ${page}`;
    slide.kind = "lecture-source";
    slide.status = "reviewed";
    slide.assetPath = `${ASSET_ROOT}/slide-${String(page).padStart(2, "0")}.jpg`;
    slide.sourceRef = { sourceId: SOURCE_ID, sourceType: "lecture", page, role: "Chapter 4 lecture slide", status: "current" };
    slide.lecturePriority = page === 91 ? "exercise" : [1, 2, 90].includes(page) ? "context" : "core";
    slide.studyPriority = note ? "high-yield" : page === 91 ? "exercise" : [1, 2, 90].includes(page) ? "context" : "support";
    slide.sourceNote = "Extracted text is a reader layer; the rendered slide remains authoritative.";
    delete slide.explanation;
    delete slide.socraticQuestions;
    if (note) slide.studyNote = note;
    else delete slide.studyNote;
    if (slide.extraction && Array.isArray(slide.extraction.blocks)) {
      slide.extraction.sourceId = SOURCE_ID;
      slide.extraction.page = page;
    }
  }
  return data;
}

if (require.main === module) {
  const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
  fs.writeFileSync(FILE, `${JSON.stringify(applyStudyLayer(data), null, 2)}\n`, "utf8");
  console.log(`DSA5104 CHAPTER 4 SLIDES GREEN · ${data.slides.length} pages enriched`);
}

module.exports = { applyStudyLayer, CORE_SLIDES, HIGH_YIELD };
