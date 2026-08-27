const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_SOURCE_ROOT = "/Users/macbook/Desktop/NUS/DSA5104/Homework Solutions";
const CHAPTERS = [
  ["Ch01_Introduction", "dsa5104-orientation", "database systems"],
  ["Ch02_Introduction_to_the_Relational_Model", "dsa5104-relational-model", "relational model"],
  ["Ch03_Introduction_to_SQL", "dsa5104-sql-aggregation", "SQL"],
  ["Ch04_Intermediate_SQL", "dsa5104-ch4-preview", "intermediate SQL"],
  ["Ch05_Advanced_SQL", "dsa5104-ch5-preview", "advanced SQL"],
  ["Ch06_Database_Design_Using_the_ER_Model", "dsa5104-database-design", "ER design"],
  ["Ch07_Relational_Database_Design", "dsa5104-ch7-preview", "relational database design"]
];

const SQL3_LESSONS = {
  "3.1": "dsa5104-sql-query-shape", "3.2": "dsa5104-sql-aggregation", "3.3": "dsa5104-sql-mutations", "3.4": "dsa5104-sql-mutations",
  "3.5": "dsa5104-sql-aggregation", "3.6": "dsa5104-sql-query-shape", "3.7": "dsa5104-sql-joins", "3.8": "dsa5104-sql-joins",
  "3.9": "dsa5104-sql-query-shape", "3.10": "dsa5104-sql-mutations", "3.11": "dsa5104-sql-joins", "3.12": "dsa5104-sql-mutations",
  "3.13": "dsa5104-sql-ddl", "3.14": "dsa5104-sql-query-shape", "3.15": "dsa5104-sql-aggregation", "3.16": "dsa5104-sql-query-shape",
  "3.17": "dsa5104-sql-mutations", "3.18": "dsa5104-sql-ddl", "3.19": "dsa5104-sql-null", "3.20": "dsa5104-sql-null",
  "3.21": "dsa5104-sql-aggregation", "3.22": "dsa5104-sql-nested", "3.23": "dsa5104-sql-cte", "3.24": "dsa5104-sql-query-shape",
  "3.25": "dsa5104-sql-query-shape", "3.26": "dsa5104-sql-aggregation", "3.27": "dsa5104-sql-cte", "3.28": "dsa5104-sql-nested",
  "3.29": "dsa5104-sql-query-shape", "3.30": "dsa5104-sql-null", "3.31": "dsa5104-sql-null", "3.32": "dsa5104-sql-null",
  "3.33": "dsa5104-sql-query-shape", "3.34": "dsa5104-sql-aggregation", "3.35": "dsa5104-sql-cte"
};

// Keep a deliberate 20% open-response slice for skills that are best learned
// by writing the SQL, drawing the design, or showing the derivation. A source
// answer that is explicitly incomplete is also kept open-response so Atlas
// never turns an unfinished answer into a misleading MCQ key.
const INCOMPLETE_SOURCE_IDS = new Set([
  "dsa5104-homework-ch04-4-21",
  "dsa5104-homework-ch05-5-12", "dsa5104-homework-ch05-5-13",
  "dsa5104-homework-ch05-5-14", "dsa5104-homework-ch05-5-17",
  "dsa5104-homework-ch06-6-25", "dsa5104-homework-ch06-6-26",
  "dsa5104-homework-ch07-7-33", "dsa5104-homework-ch07-7-34"
]);
const OPEN_RESPONSE_IDS = new Set([
  "dsa5104-homework-ch02-2-8",
  "dsa5104-homework-ch03-3-1", "dsa5104-homework-ch03-3-3", "dsa5104-homework-ch03-3-13",
  "dsa5104-homework-ch03-3-18", "dsa5104-homework-ch03-3-28",
  "dsa5104-homework-ch04-4-6", "dsa5104-homework-ch04-4-7",
  "dsa5104-homework-ch05-5-7", "dsa5104-homework-ch05-5-8", "dsa5104-homework-ch05-5-12", "dsa5104-homework-ch05-5-21",
  "dsa5104-homework-ch06-6-1", "dsa5104-homework-ch06-6-2", "dsa5104-homework-ch06-6-3",
  "dsa5104-homework-ch06-6-13", "dsa5104-homework-ch06-6-15",
  "dsa5104-homework-ch06-6-16", "dsa5104-homework-ch06-6-21", "dsa5104-homework-ch06-6-22",
  "dsa5104-homework-ch06-6-23", "dsa5104-homework-ch06-6-24", "dsa5104-homework-ch06-6-26",
  "dsa5104-homework-ch07-7-6", "dsa5104-homework-ch07-7-7", "dsa5104-homework-ch07-7-21",
  "dsa5104-homework-ch07-7-22", "dsa5104-homework-ch07-7-30", "dsa5104-homework-ch07-7-32",
  "dsa5104-homework-ch07-7-42", "dsa5104-homework-ch07-7-44"
]);
INCOMPLETE_SOURCE_IDS.forEach(id => OPEN_RESPONSE_IDS.add(id));
const TARGET_MCQ_PERCENT = 80;

const SOURCE_REPAIRS = [
  [/\uFB00/g, "ff"], [/\uFB01/g, "fi"], [/\uFB02/g, "fl"], [/\uFB03/g, "ffi"], [/\uFB04/g, "ffl"],
  [/\bMertis\b/gi, "merits"], [/\bmoren\b/gi, "more"], [/\bappearn\b/gi, "appear"],
  [/\bstuent\b/gi, "student"], [/\bcommerical\b/gi, "commercial"],
  [/\bmanagmenent\b/gi, "management"], [/\bimples\b/gi, "implies"],
  [/\bdecompsition\b/gi, "decomposition"], [/\bDescrie\b/g, "Describe"],
  [/\bdeltions\b/gi, "deletions"], [/\bconstriant\b/gi, "constraint"],
  [/\binstuctors\b/gi, "instructors"], [/\bstoared\b/gi, "stored"],
  [/\binital\b/gi, "initial"], [/\bdefiniton\b/gi, "definition"],
  [/\bcardinalties\b/gi, "cardinalities"], [/\bpartion_id\b/gi, "partition_id"],
  [/\btiems\b/gi, "items"], [/\bfrom from\b/gi, "from"], [/\bthe the\b/gi, "the"],
  [/\bto to\b/gi, "to"],
  [/\bconstriants\b/gi, "constraints"], [/\bdecompsitions\b/gi, "decompositions"],
  [/\bconccurent\b/gi, "concurrent"], [/\bdependecy\b/gi, "dependency"],
  [/\bfolowing\b/gi, "following"], [/\bfollwing\b/gi, "following"],
  [/\binitalize\b/gi, "initialize"], [/\bmaxium\b/gi, "maximum"],
  [/\bunintersting\b/gi, "uninteresting"], [/\bONe\b/g, "One"],
  [/no duplicates names/gi, "no duplicate names"], [/make sur\b/gi, "make sure"],
  [/\n\s*Bonus:\s*To check[\s\S]*$/i, ""],
  [/the above picture was created using figma and arctype/gi, "The source answer is a schema diagram."],
  [/the above picture shows (?:an? )?e-r diagram/gi, "The source answer shows an E-R diagram"],
  [/Given the relations?\s+_?a\(name,address,title\)_?\s+and\s+_?b\(name,address,salary\)_?/gi, "Given relations a and b, where a has columns name, address, title and b has columns name, address, salary"],
  [/Given a relation\s+_?s\(a,b,c\)_?/gi, "Given relation s with columns a, b, and c"],
  [/Given relation\s+_?s\(a,b,c\)_?/gi, "Given relation s with columns a, b, and c"],
  [/Given a relation\s+_?S\(student,subject,marks\)_?/gi, "Given relation S with columns student, subject, and marks"],
  [/COALESCE\(value \[, \.\.\.\]\)/gi, "COALESCE(value [, dn])"],
  [/date_of_birth,\.\.\.,emergency_contact/gi, "date_of_birth, other_attributes, emergency_contact"],
  [/\n\s*\.\n\s*\.\n\s*\.\n(?=\s*dn,?)/g, "\n    dn\n"]
];

const SUMMARY_OVERRIDES = {
  "dsa5104-homework-ch01-1-13": "Column-oriented storage supports analytics, and MapReduce supports parallel processing of large or semi-structured data.",
  "dsa5104-homework-ch02-2-4": "No. One observed instance with unique names does not prove that name is a superkey; uniqueness must hold for every valid instance.",
  "dsa5104-homework-ch03-3-32": "Exclude instructors who gave an A and require at least one other non-null grade.",
  "dsa5104-homework-ch05-5-24": "Evaluate GROUP BY ROLLUP and label subtotal rows with GROUPING for readable output.",
  "dsa5104-homework-ch06-6-20": "Create schemas for each ER diagram, including entity keys, relationship tables, and foreign-key references.",
  "dsa5104-homework-ch07-7-3": "Use mutual key dependencies for one-to-one; use only student key to instructor key for many-to-one.",
  "dsa5104-homework-ch07-7-23": "Repetition duplicates facts and causes update anomalies; inability to represent information means the schema cannot store a valid enterprise state.",
  "dsa5104-homework-ch07-7-39": "Yes. Moving from 2NF to 3NF can remove transitive redundancy through a lossless, dependency-preserving decomposition.",
  "dsa5104-homework-ch01-1-1": "Two disadvantages are the cost and complexity of setting up a DBMS, and the risk that this complexity hurts performance.",
  "dsa5104-homework-ch01-1-3": "Define requirements; model data and relationships; specify integrity constraints; design physical storage; define regular applications; then implement and test the database.",
  "dsa5104-homework-ch01-1-4": "Video files are mostly append-only, but their metadata can suffer redundancy and difficult search; uploads still need atomicity and access control.",
  "dsa5104-homework-ch01-1-6": "Examples include Google Maps, Facebook, Medium, and Bitcoin.",
  "dsa5104-homework-ch01-1-7": "A file-processing system is application-specific; a DBMS is reusable and adds querying, integrity, concurrency, recovery, and security.",
  "dsa5104-homework-ch01-1-9": "A DBMS provides security, atomicity, efficient queries, durability, and concurrency control; without them data may be exposed, inconsistent, lost, or stale.",
  "dsa5104-homework-ch01-1-12": "Two-tier places the application at the client and database at the server; three-tier adds an application server and is better for web security and scalability.",
  "dsa5104-homework-ch01-1-14": "NoSQL emerged for data-intensive applications, rapid development, flexible schemas, and distributed scale; traditional DBMSs emphasize relational structure and strong consistency.",
  "dsa5104-homework-ch01-1-15": "A social network can use User, Message or Chat, and Friendship tables; Friendship stores two foreign keys to User.",
  "dsa5104-homework-ch02-2-1": "Primary keys are employee(person_name), works(person_name, company_name), and company(company_name).",
  "dsa5104-homework-ch02-2-2": "Reject an instructor whose dept_name has no matching department, or delete a department still referenced by an instructor or student.",
  "dsa5104-homework-ch02-2-6": "Use projection after selection for Miami, selection after joining employee with works for salary, and combine both predicates for the third query.",
  "dsa5104-homework-ch02-2-10": "A relation is a current set of tuples; a relation schema is its definition: attribute names together with their domains.",
  "dsa5104-homework-ch02-2-12": "Primary keys are branch_name, ID, loan_number, (ID, loan_number), account_number, and (ID, account_number); foreign keys link branch, borrower, and depositor to their referenced relations.",
  "dsa5104-homework-ch03-3-2": "Use SUM(credits * points) for total grade points, divide by total credits for GPA, group by student for all GPAs, and exclude null grades through the join.",
  "dsa5104-homework-ch03-3-4": "Count DISTINCT owners of cars involved in 2017 accidents, then delete the owner's 2010 cars with a condition on the owner ID.",
  "dsa5104-homework-ch03-3-5": "Use CASE for F/C/B/A score bands, then group the resulting grades and count students in each grade.",
  "dsa5104-homework-ch03-3-7": "The query works only when both r1 and r2 are non-empty; if either is empty, the Cartesian product is empty and no p.a1 value is returned.",
  "dsa5104-homework-ch03-3-8": "Use EXCEPT for account-but-not-loan customers, a self-join or scalar subqueries for the same address, and joins through account/depositor for Harrison branches.",
  "dsa5104-homework-ch03-3-11": "Use DISTINCT joins for Comp. Sci. students, NOT EXISTS for students with no pre-2017 course, GROUP BY for department maxima, then MIN of those maxima.",
  "dsa5104-homework-ch03-3-19": "Null can represent an unknown value or a value that does not exist or is not applicable.",
  "dsa5104-homework-ch03-3-20": "For non-null values, k NOT EQUAL TO ALL (subquery) and k NOT IN (subquery) apply the same condition: k differs from every returned value.",
  "dsa5104-homework-ch03-3-23": "Replace each CTE with an equivalent derived table in FROM: one computes department totals and the other computes their average.",
  "dsa5104-homework-ch03-3-24": "Join student to advisor and instructor, then keep Accounting students whose advisor is in Physics.",
  "dsa5104-homework-ch03-3-27": "Group takes by student and course, keep counts greater than one, then group by student and require at least three repeated courses.",
  "dsa5104-homework-ch03-3-29": "Filter History students whose names start with D and use a correlated count of distinct Music courses to keep counts below five.",
  "dsa5104-homework-ch03-3-31": "Select instructors for whom no taught section has grade A; NOT EXISTS also keeps instructors who have never taught.",
  "dsa5104-homework-ch03-3-33": "Select DISTINCT Comp. Sci. courses where EXISTS a section whose time slot ends at or after 12:00.",
  "dsa5104-homework-ch03-3-35": "Aggregate enrollment by section, then select every section whose count equals the maximum count.",
  "dsa5104-homework-ch04-4-3": "Rewrite each outer join as a UNION of the matching inner join and the unmatched rows padded with NULL values.",
  "dsa5104-homework-ch04-4-5": "Test with a Physics instructor teaching an Elec. Eng. course so a mistaken natural join on dept_name drops a valid row; also include unmatched rows and shared names.",
  "dsa5104-homework-ch04-4-8": "Group by instructor, semester, year, and time slot; flag more than one distinct classroom, and enforce the same condition with CREATE ASSERTION.",
  "dsa5104-homework-ch04-4-10": "Use FULL OUTER JOIN with both name and address as matching columns, then COALESCE each pair of shared columns.",
  "dsa5104-homework-ch04-4-13": "SELECT on a view needs the view privilege; UPDATE needs permission on the base relation; INSERT can add a row filtered out by the view's WHERE clause.",
  "dsa5104-homework-ch04-4-15": "Use INNER JOIN USING (building, room_number) and select the shared columns once.",
  "dsa5104-homework-ch04-4-18": "A left join finds employees with no manager row or a null manager identifier; the no-join version excludes employees with a manager.",
  "dsa5104-homework-ch04-4-20": "Define tot_credits(year, num_credits) by joining takes with course, grouping by year, and summing credits.",
  "dsa5104-homework-ch04-4-22": "Replace COALESCE(d1, d2, dn) with CASE branches for each non-null argument and ELSE NULL.",
  "dsa5104-homework-ch04-4-24": "No. A already has the privilege, so B's grant adds no new privilege and creates no effective cycle.",
  "dsa5104-homework-ch04-4-26": "Integrity constraints preserve valid data; authorization constraints control which users may read or change data.",
  "dsa5104-homework-ch05-5-1": "The JDBC program follows the manager chain from 'dog' until it reaches an employee with no manager.",
  "dsa5104-homework-ch05-5-2": "Use ResultSet metadata to print column headings, then iterate through the result rows and print each column value.",
  "dsa5104-homework-ch05-5-3": "Use an iterative JDBC loop with a visited set to expand prerequisites until no new courses remain, preventing cycles.",
  "dsa5104-homework-ch05-5-4": "Embedded SQL suits a compiled host-language program with mostly static queries; use SQL alone for direct queries and a general-purpose API for dynamic logic.",
  "dsa5104-homework-ch05-5-5": "Use triggers on both teaches and section to reject inserts or updates that create two classrooms for one instructor, term, and time slot.",
  "dsa5104-homework-ch05-5-6": "Triggers on depositor and account inserts should add each newly valid joined row to the materialized branch_cust view.",
  "dsa5104-homework-ch05-5-9": "Use RANK() OVER (ORDER BY shares_traded DESC) to rank each trading day.",
  "dsa5104-homework-ch05-5-10": "Use GROUP BY ROLLUP(year, month, day) with SUM(shares_traded), SUM(num_trades), and SUM(dollar_volume).",
  "dsa5104-homework-ch05-5-11": "Use one GROUP BY with ROLLUP(a), ROLLUP(b), ROLLUP(c), and ROLLUP(d) to enumerate all CUBE subtotal combinations.",
  "dsa5104-homework-ch05-5-15": "Define avg_salary(company) and compare each company's result with avg_salary('First Bank').",
  "dsa5104-homework-ch05-5-22": "Assign NTILE(20) over ORDER BY a, then group by partition_id and sum c for each histogram bin.",
  "dsa5104-homework-ch05-5-23": "Aggregate monthly volume first, then use a windowed three-row average ordered by year and month.",
  "dsa5104-homework-ch06-6-6": "Represent the ternary relationship with a relation containing the participating keys; the binary decomposition must preserve the required relationship combinations.",
  "dsa5104-homework-ch06-6-7": "Use the student identifier as the advisor primary key, and enforce a unique instructor identifier so each instructor advises at most one student.",
  "dsa5104-homework-ch06-6-9": "Use the student identifier as the advisor primary key and enforce a unique instructor identifier in advisor.",
  "dsa5104-homework-ch06-6-8": "The section key is (course_id, sec_id, semester, year); the mapping relation keeps that composite key and course_id as a foreign key.",
  "dsa5104-homework-ch06-6-27": "Disjoint specialization permits an entity in at most one subtype; overlapping specialization permits membership in multiple subtypes.",
  "dsa5104-homework-ch06-6-28": "Total specialization requires every supertype entity to belong to a subtype; partial specialization allows some to belong to none.",
  "dsa5104-homework-ch07-7-1": "The common attributes are AB; since A determines BC and B determines D, AB determines all of R and is a key for one decomposed schema, proving a lossless join.",
  "dsa5104-homework-ch04-4-4": "Use one tuple in r, a tuple in s with a different B value, and a tuple in t with a matching B value; the first join can yield NULL for C and a non-null D.",
  "dsa5104-homework-ch07-7-4": "Start from alpha determines beta. Augment with alpha, combine with alpha determines gamma, and use transitivity to derive that alpha determines both beta and gamma.",
  "dsa5104-homework-ch07-7-5": "Start from alpha determines beta. Augment with gamma, combine with gamma and beta determines delta, and use transitivity to derive that alpha and gamma determine delta.",
  "dsa5104-homework-ch07-7-8": "The optimized closure algorithm maintains counts for functional dependencies and adds an attribute only when its determinant is complete; induction proves it computes the closure of alpha.",
  "dsa5104-homework-ch07-7-9": "Find duplicate C values for equal B values to test whether B determines C; enforce it with an assertion that rejects such a pair.",
  "dsa5104-homework-ch07-7-11": "Make α a primary key of r1 and a foreign key in r2; an erroneous update can leave r2 referencing a missing or inconsistent r1 tuple.",
  "dsa5104-homework-ch07-7-12": "Each tuple of u projects into every component relation, and joining those projections contains the original tuple; therefore u is a subset of the join.",
  "dsa5104-homework-ch07-7-13": "The decomposition loses dependency preservation because at least one original dependency cannot be checked using a single decomposed relation.",
  "dsa5104-homework-ch07-7-14": "For the three dependencies where each attribute determines the other two, choosing different right-hand attributes during splitting produces multiple canonical covers.",
  "dsa5104-homework-ch07-7-15": "Deleting two attributes judged extraneous at once can remove the inference path needed for the original dependency; delete and recheck one attribute at a time.",
  "dsa5104-homework-ch07-7-16": "Add a relation containing a candidate key to the dependency-preserving 3NF decomposition; the key makes the projection join lossless.",
  "dsa5104-homework-ch07-7-17": "Use a relation with attributes A, B, C, and D plus dependencies A determines B, C determines D, and B determines C; different BCNF orders yield at least three lossless decompositions.",
  "dsa5104-homework-ch07-7-18": "A nonprime attribute transitively dependent on a key violates 3NF, and every 3NF violation has exactly that transitive-dependency form; the definitions are equivalent.",
  "dsa5104-homework-ch07-7-20": "Use a relation with attributes A, B, and C and a nontrivial multivalued dependency from A to B: it is in BCNF because there are no nontrivial FDs, but not in 4NF.",
  "dsa5104-homework-ch07-7-22": "Apply the BCNF decomposition algorithm; one valid decomposition is R1(A,B,C,E) and R2(B,D).",
  "dsa5104-homework-ch07-7-24": "A dependency from alpha to beta is trivial when beta is a subset of alpha, because every relation satisfies it by reflexivity.",
  "dsa5104-homework-ch07-7-25": "Reflexivity follows from subset inclusion; augmentation preserves equal X-values after adding Z; transitivity chains equal X-values through Y.",
  "dsa5104-homework-ch07-7-26": "Use alpha as A, gamma as B, and beta as C with tuples (1,1,1) and (1,2,1): both determinants give the same beta, but alpha does not determine gamma.",
  "dsa5104-homework-ch07-7-27": "If alpha determines beta and gamma, reflexivity and transitivity give alpha determines beta and alpha determines gamma.",
  "dsa5104-homework-ch07-7-28": "Using the dependencies from Exercise 7.6, the closure of B is {B, D}.",
  "dsa5104-homework-ch07-7-29": "Use two tuples that agree on C but differ on A, B, D, or E; their projections join to a spurious tuple, so the decomposition is lossy.",
  "dsa5104-homework-ch07-7-31": "AB determines CD but is not a superkey because its closure omits G; this violates BCNF. Decompose using that dependency and then test preservation.",
  "dsa5104-homework-ch07-7-35": "Use the Exercise 7.1 schema and decomposition (A,B,C), (C,D,E); both components are in BCNF, but their join can create a spurious tuple.",
  "dsa5104-homework-ch07-7-36": "With only two attributes, every nontrivial dependency has a determinant that is a key, so every such schema is in BCNF.",
  "dsa5104-homework-ch07-7-37": "The goals are avoiding redundancy, making information easy to retrieve, and avoiding information loss.",
  "dsa5104-homework-ch07-7-38": "Choose a non-BCNF design when BCNF decomposition would lose dependency preservation or make important constraints expensive to enforce.",
  "dsa5104-homework-ch07-7-40": "No. The multivalued dependency from A to BC does not imply the dependencies from A to B and from A to C; give a counterexample relation.",
  "dsa5104-homework-ch07-7-41": "4NF removes multivalued-dependency redundancy that BCNF can leave behind, so it can produce a better design.",
  "dsa5104-homework-ch07-7-43": "Create a materialized view grouped by B with COUNT(DISTINCT C); enforce that each group has at most one distinct C value."
};

function normalizeSourceText(value) {
  return SOURCE_REPAIRS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), String(value || ""));
}

function stripSourceEmphasis(value) {
  const protectedParts = [];
  const token = match => {
    protectedParts.push(match);
    return `\u0000${protectedParts.length - 1}\u0000`;
  };
  let text = String(value || "")
    .replace(/```[\s\S]*?```|\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g, token)
    .replace(/(?<![A-Za-z0-9\\])_([A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+)_(?!\w)/g, "$1")
    .replace(/(?<![A-Za-z0-9\\])_([A-Za-z][A-Za-z0-9]*(?:[ -][A-Za-z0-9]+)*)_(?!\w)/g, "$1")
    .replace(/(?<![A-Za-z0-9\\])_([A-Za-z][A-Za-z0-9_(),. -]*[A-Za-z0-9)])_(?!\w)/g, "$1");
  return text.replace(/\u0000(\d+)\u0000/g, (_match, index) => protectedParts[Number(index)]);
}

function lessonFor(chapter, exercise) {
  if (chapter === "Ch03_Introduction_to_SQL") return SQL3_LESSONS[exercise] || "dsa5104-sql-query-shape";
  return CHAPTERS.find(entry => entry[0] === chapter)[1];
}

function parseArgs(argv) {
  const sourceIndex = argv.indexOf("--source-root");
  return {
    sourceRoot: sourceIndex >= 0 && argv[sourceIndex + 1]
      ? path.resolve(argv[sourceIndex + 1])
      : path.resolve(process.env.DSA5104_HOMEWORK_ROOT || DEFAULT_SOURCE_ROOT)
  };
}

function normalizeMath(value) {
  return value
    .replace(/\\(Pi|sigma|bowtie)\\_([A-Za-z0-9,]+)/g, (_match, operator, attributes) => `\\${operator}_{${attributes}}`)
    .replace(/\$(?=\d)(?![^\n]*\$)/g, "USD ")
    .replace(/grade\s+_?F_?\s+if\s+_?score_?\s+\$\s+if\s+40\s+\$\\leq\$\s+_?score_?\s+\$\s+if\s+80\s+\$\\leq\$\s+_?score_?/i,
      "grade F if $score < 40$, grade C if $40 \\leq score < 60$, grade B if $60 \\leq score < 80$, and grade A otherwise")
    .replace(/\$\$([\s\S]*?)\$\$/g, (_match, body) => "$$" + body.replace(/(?<!\\)\$/g, "") + "$$")
    .replace(/\\text\{if \\alpha \\rightarrow \\beta and \\alpha \\rightarrow \\gamma then \\alpha \\rightarrow \\beta \\gamma \}/g,
      String.raw`\text{if } \alpha \rightarrow \beta \text{ and } \alpha \rightarrow \gamma \text{ then } \alpha \rightarrow \beta \gamma`)
    .replace(/\\text\{if \\alpha \\rightarrow \\beta and \\gamma\\beta \\rightarrow \\delta then \\alpha\\gamma \\rightarrow \\delta \}/g,
      String.raw`\text{if } \alpha \rightarrow \beta \text{ and } \gamma\beta \rightarrow \delta \text{ then } \alpha\gamma \rightarrow \delta`)
    .replace(/\$\$([\s\S]*?)\$\$/g, (_match, body) => "$$" + body.replace(/\.\.\./g, String.raw`\ldots`) + "$$")
    .replace(/\$([^$\n]+)\$/g, (_match, body) => "$" + body.replace(/\.\.\./g, String.raw`\ldots`) + "$");
}

function cleanMarkdown(value) {
  return stripSourceEmphasis(normalizeSourceText(normalizeMath(value)
    .replace(/\r\n?/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi, "\n[See source figure: $1]\n")
    .replace(/<img\b[^>]*>/gi, "\n[See source figure]\n")
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<\/?(?:u|i|em|strong|b|small|sub|sup)>/gi, "")
    .replace(/^>\s?/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*-{5,}\s*$/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim()));
}

function splitExercise(markdown) {
  const normalized = markdown.replace(/\r\n?/g, "\n");
  const separator = normalized.search(/^\s*-{5,}\s*$/m);
  if (separator >= 0) {
    const separatorEnd = normalized.indexOf("\n", separator);
    return {
      prompt: cleanMarkdown(normalized.slice(0, separator)),
      solution: cleanMarkdown(normalized.slice(separatorEnd < 0 ? normalized.length : separatorEnd))
    };
  }
  const lines = normalized.split("\n");
  const solutionLine = lines.findIndex(line => line.trim() && !/^\s*>/.test(line));
  if (solutionLine < 0) throw new Error("homework file has no solution body");
  return {
    prompt: cleanMarkdown(lines.slice(0, solutionLine).join("\n")),
    solution: cleanMarkdown(lines.slice(solutionLine).join("\n"))
  };
}

function questionType(prompt) {
  if (/\b(prove|show that|compute|calculate|closure|normalize|decomposition|candidate keys?)\b/i.test(prompt)) return "derivation";
  if (/\b(write|construct|design|define|express|give an? (SQL|example|E-R|ER))\b/i.test(prompt)) return "calculation";
  return "short";
}

function difficulty(prompt, solution) {
  if (/\b(prove|BCNF|4NF|lossless|dependency-preserving|JDBC|ODBC|trigger|recursive|normalize)\b/i.test(prompt)) return "hard";
  if (prompt.length + solution.length > 700) return "medium";
  return "easy";
}

function cognitiveLevel(prompt) {
  if (/\b(prove|show that|explain why|discuss|compare|distinction|difference)\b/i.test(prompt)) return "analyze";
  if (/\b(write|construct|design|compute|calculate|normalize|give|list)\b/i.test(prompt)) return "apply";
  return "understand";
}

function questionId(chapter, exercise) {
  const chapterNumber = chapter.match(/^Ch(\d+)/)[1];
  return `dsa5104-homework-ch${chapterNumber}-${exercise.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`;
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableShuffle(values, seed) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = stableHash(String(seed) + ":" + index) % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function choiceText(value) {
  return normalizeSourceText(value)
    .replace(/\[See source figure[^\]]*\]/gi, "")
    .replace(/```[^\n]*\n?([\s\S]*?)```/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/\$\$?([\s\S]*?)\$\$?/g, "$1")
    .replace(/\\(?:begin|end)\{aligned\}/g, "")
    .replace(/\\(?:Pi|pi)\\?_\{([^{}]+)\}/g, "projection on [$1]")
    .replace(/\\(?:sigma|Sigma)\\?_\{([^{}]+)\}/g, "selection where [$1]")
    .replace(/\\bowtie\\?_\{([^{}]+)\}/g, "join on [$1]")
    .replace(/\\(?:Pi|pi)\\?_([A-Za-z0-9,]+)/g, "projection on [$1]")
    .replace(/\\(?:sigma|Sigma)\\?_([A-Za-z0-9,]+)/g, "selection [$1]")
    .replace(/\\bowtie\\?_([A-Za-z0-9,]+)/g, "join [$1]")
    .replace(/\\div\b/g, "division")
    .replace(/\\(?:mathrm|operatorname|text)\s*\{([^{}]*)\}/g, "$1")
    .replace(/\\(rightarrow|to)\b/g, " → ")
    .replace(/\\(leq|le)\b/g, " ≤ ")
    .replace(/\\(geq|ge)\b/g, " ≥ ")
    .replace(/\\(neq)\b/g, " ≠ ")
    .replace(/>=/g, " at least ")
    .replace(/<=/g, " at most ")
    .replace(/>/g, " greater than ")
    .replace(/</g, " less than ")
    .replace(/[→←]/g, " leads to ")
    .replace(/[≤]/g, " at most ")
    .replace(/[≥]/g, " at least ")
    .replace(/[≠]/g, " differs from ")
    .replace(/\\\\/g, "; ")
    .replace(/\\_/g, "_")
    .replace(/\\([,;:])/g, "$1")
    .replace(/\\(?=\s)/g, "")
    .replace(/\\([A-Za-z]+)/g, "$1")
    .replace(/\\/g, "")
    .replace(/[{}]/g, "")
    .replace(/\|/g, "; ")
    .replace(/(?:^|\n)\s*[*-]\s+/g, "; ")
    .replace(/[∈]/g, " belongs to ")
    .replace(/[≈]/g, " approximately ")
    .replace(/<>/g, " not equal ")
    .replace(/-{2,}/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:)])/g, "$1")
    .replace(/([([])\s+/g, "$1")
    .replace(/;{2,}/g, ";")
    .replace(/^[;,\s]+|[;,\s]+$/g, "")
    .replace(/([A-Za-z0-9)])_(?![A-Za-z0-9])/g, "$1")
    .trim();
}

function compactCode(value) {
  return normalizeSourceText(value)
    .replace(/\s+/g, " ")
    .replace(/\s*;\s*/g, "; ")
    .trim();
}

function codeApproachSummary(value) {
  const code = compactCode(value);
  if (code.length <= 150) return `Code approach: \`${code}\``;
  if (/getMetaData\s*\(|ResultSetMetaData/i.test(code)) return "Use ResultSet metadata to print column headings, then iterate through the result rows and print each column value.";
  if (/\bCREATE\s+TRIGGER\b/i.test(code)) return "Uses CREATE TRIGGER on the affected tables to maintain the requested data.";
  if (/\bWITH\s+RECURSIVE\b/i.test(code)) return "Uses a recursive CTE to compute the requested hierarchy or transitive result.";
  if (/\bCREATE\s+VIEW\b/i.test(code)) return "Defines a view over the requested query and preserves its grouping or filtering logic.";
  if (/\bCREATE\s+TABLE\b/i.test(code)) return "Defines the requested tables with primary-key and foreign-key constraints.";
  if (/\bSELECT\b/i.test(code)) return "Uses SELECT with the required filters, joins, grouping, or ordering.";
  if (/\b(?:UPDATE|DELETE|INSERT)\b/i.test(code)) return "Uses the requested data mutation with an explicit condition and integrity checks.";
  if (/JDBC|JAVA|DRIVERManager|IMPORT\s+JAVA/i.test(code)) return "Uses a JDBC program to retrieve and print the requested database result.";
  const prefix = (code.match(/^(CREATE\s+TRIGGER|CREATE\s+VIEW|CREATE\s+TABLE|WITH\s+RECURSIVE|SELECT|UPDATE|DELETE|INSERT|IMPORT|PUBLIC\s+STATIC)/i) || [""])[0].toUpperCase();
  const target = [...code.matchAll(/\b(?:ON|FROM|INTO|UPDATE)\s+([A-Za-z_][A-Za-z0-9_]*)/gi)]
    .map(match => match[1]).filter((name, index, names) => names.indexOf(name) === index).slice(0, 2).join(" and ");
  if (prefix === "CREATE TRIGGER") return `Uses CREATE TRIGGER on ${target || "the affected tables"} to maintain the requested data.`;
  if (prefix === "WITH RECURSIVE") return "Uses a recursive CTE to compute the requested hierarchy or transitive result.";
  if (prefix === "CREATE VIEW") return "Defines a view over the requested query and preserves its grouping or filtering logic.";
  if (prefix === "CREATE TABLE") return "Defines the requested tables with primary-key and foreign-key constraints.";
  if (prefix === "SELECT") return "Uses SELECT with the required filters, joins, grouping, or ordering.";
  if (/^(UPDATE|DELETE|INSERT)/.test(prefix)) return `Uses ${prefix} with the requested condition and integrity checks.`;
  if (/JDBC|JAVA|IMPORT/.test(prefix)) return "Uses a JDBC program to retrieve and print the requested database result.";
  return "Applies the requested operation and checks the stated constraints.";
}

function shortenSummary(value, limit = 220) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  const listItems = [...text.matchAll(/(?:^|\s)(\d+[.)]\s+)(.*?)(?=\s+\d+[.)]\s+|$)/g)].map(match => `${match[1]}${match[2].trim()}`);
  if (listItems.length > 1) {
    let list = "";
    for (const item of listItems) {
      const next = list ? `${list} ${item}` : item;
      if (next.length > limit) break;
      list = next;
    }
    if (list) return list.replace(/[,:;]$/, ".");
  }
  const sentence = text.slice(0, limit).match(/^.*?[.!?](?:\s|$)/);
  if (sentence && !/^\s*(?:\d+|[a-d])[.)]\s*$/.test(sentence[0].trim()) && !/(?:below|following|as follows|include|are):?\.$/i.test(sentence[0].trim()) && !/\b(?:Comp|Fig|e|i|No|Dr)\.$/i.test(sentence[0].trim())) {
    let complete = sentence[0].trim();
    if (complete.length < 60) {
      const next = text.slice(sentence[0].length).trim().match(/^.*?[.!?](?:\s|$)/);
      if (next && complete.length + next[0].trim().length + 1 <= limit) complete += ` ${next[0].trim()}`;
    }
    return complete;
  }
  const listLike = /^\s*(?:\d+[.)]|[*-])/.test(text);
  const clauseBoundary = listLike ? -1 : Math.max(text.lastIndexOf(";", limit - 1), text.lastIndexOf(".", limit - 1));
  const clause = clauseBoundary > 80 ? text.slice(0, clauseBoundary + 1).trim() : "";
  if (clause && !/(?:\b(?:a|an|and|are|as|because|but|from|if|is|of|on|or|that|the|their|to|unless|when|which|with)\.)$/i.test(clause)) return clause;
  const boundary = text.lastIndexOf(" ", limit - 1);
  let shortened = text.slice(0, boundary > 80 ? boundary : limit).trim().replace(/[,:;]$/, "");
  shortened = shortened.replace(/\s+\d+[.)]$/, "").trim();
  while (/(?:\b(?:a|an|and|are|as|because|but|by|for|from|if|is|of|on|or|that|the|their|to|unless|when|which|with)\.?|[([{,:;])$/i.test(shortened)) {
    shortened = shortened.replace(/\s+\S+$/, "");
  }
  return `${shortened}.`;
}

function codeBlocks(value) {
  return [...String(value || "").matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map(match => match[1]).filter(Boolean);
}

function bestCodeBlock(value) {
  const blocks = codeBlocks(value);
  return blocks.find(block => /^(?:CREATE|WITH|SELECT|UPDATE|DELETE|INSERT|ALTER|IMPORT|PUBLIC\s+STATIC)/i.test(block.trim())) || blocks[0] || "";
}

function proseWithoutCode(value) {
  return String(value || "")
    .replace(/```[^\n]*\n[\s\S]*?```/g, " ")
    .replace(/\[See source figure[^\]]*\]/gi, " ")
    .trim();
}

function firstSolutionPart(value) {
  const text = proseWithoutCode(value);
  const parts = [...text.matchAll(/(?:^|\n)\s*[a-d][.)]\s*([\s\S]*?)(?=\n\s*[a-d][.)]\s|$)/gi)];
  return parts.length ? parts[0][1].trim() : text;
}

function solutionSummary(question) {
  if (SUMMARY_OVERRIDES[question.id]) return SUMMARY_OVERRIDES[question.id];
  const rawProse = firstSolutionPart(question.solution);
  const prose = shortenSummary(choiceText(rawProse));
  const blocks = codeBlocks(question.solution);
  const preferCode = /^(?:but|output|that is|just in case|note:|the above|the following|i think|one method|another method|one way|another way)/i.test(prose);
  if (/above picture|created using|figma|arctype/i.test(prose)) return "The worked answer is the supplied schema diagram; inspect every relation, key, and foreign-key edge.";
  if (/^bonus:/i.test(prose)) return "Optional verification query compares the relevant results; it is not the main answer.";
  if (prose && !/^Source note:/i.test(prose) && !/^can be rewritten as/i.test(prose) && !preferCode) return prose;
  if (blocks.length) return codeApproachSummary(bestCodeBlock(question.solution));
  return prose || "Follow the source solution and satisfy every stated constraint.";
}

function isWeakSummary(value) {
  return /^(?:Uses SELECT with the required filters, joins, grouping, or ordering\.|Applies the requested operation and checks the stated constraints\.|Note: It is not reasonable to expect students to enumerate all of F\^\+\.)$/i.test(String(value || "").trim());
}

function chapterKey(question) {
  const match = question.id.match(/(ch\d+)-/);
  return match ? match[1] : "";
}

function makeChoices(question, pool) {
  const correct = solutionSummary(question);
  const candidates = pool
    .filter(candidate => candidate.id !== question.id && chapterKey(candidate) === chapterKey(question) && !INCOMPLETE_SOURCE_IDS.has(candidate.id))
    .sort((left, right) => {
      const leftAffinity = (left.lessonId === question.lessonId ? 2 : 0) + (left.originalType === question.originalType ? 1 : 0);
      const rightAffinity = (right.lessonId === question.lessonId ? 2 : 0) + (right.originalType === question.originalType ? 1 : 0);
      return rightAffinity - leftAffinity || stableHash(question.id + ":" + left.id) - stableHash(question.id + ":" + right.id);
    })
    .map(solutionSummary)
    .filter(candidate => candidate && candidate !== correct && !isWeakSummary(candidate));
  const distractors = [...new Set(candidates)].slice(0, 3);
  const fallbacks = [
    "The solution ignores the stated schema and returns all records without applying the requested condition.",
    "The solution changes the database design instead of answering the requested exercise.",
    "The solution applies an unrelated database concept and does not satisfy the stated constraints."
  ];
  for (const fallback of fallbacks) {
    if (distractors.length >= 3) break;
    if (!distractors.includes(fallback) && fallback !== correct) distractors.push(fallback);
  }
  const choices = stableShuffle([correct, ...distractors], question.id);
  return { choices, answer: choices.indexOf(correct) };
}

function collectFiles(sourceRoot) {
  return CHAPTERS.flatMap(([chapter]) => {
    const directory = path.join(sourceRoot, chapter);
    if (!fs.existsSync(directory)) throw new Error(`missing homework directory: ${directory}`);
    return fs.readdirSync(directory)
      .filter(file => file.endsWith(".md"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map(file => ({ chapter, file, absolutePath: path.join(directory, file) }));
  });
}

function buildQuestion(item) {
  const [chapter, _defaultLessonId, topic] = CHAPTERS.find(entry => entry[0] === item.chapter);
  const lessonId = lessonFor(item.chapter, path.basename(item.file, ".md"));
  const exercise = path.basename(item.file, ".md");
  const { prompt, solution } = splitExercise(fs.readFileSync(item.absolutePath, "utf8"));
  const id = questionId(chapter, exercise);
  const sourceIncomplete = INCOMPLETE_SOURCE_IDS.has(id);
  const normalizedSolution = sourceIncomplete
    ? [
      id === "dsa5104-homework-ch04-4-21" ? "" : solution.replace(/^.*\bTODO\b.*$/gim, "").replace(/^.*I think there is an error with the question.*$/gim, "").replace(/\n{3,}/g, "\n\n").trim(),
      id === "dsa5104-homework-ch04-4-21"
        ? "Source note: the supplied answer reports that the prompt references a view that is not defined in Exercise 4.18. Verify the exercise reference before attempting it."
        : "Source note: the supplied teacher solution is incomplete. Treat this as an open-response practice prompt; do not use the source note as a complete answer key."
    ].filter(Boolean).join("\n\n")
    : solution;
  return {
    id,
    lessonId,
    courseId: "DSA5104",
    type: questionType(prompt),
    originalType: questionType(prompt),
    origin: "teacher-assigned",
    assessmentMode: OPEN_RESPONSE_IDS.has(id) ? "open-response" : "mcq-summary",
    prompt,
    solution: normalizedSolution,
    explanation: `Teacher-assigned homework exercise from the ${topic} practice set. Use the source solution to check the reasoning after attempting the question.`,
    difficulty: difficulty(prompt, solution),
    skill: topic,
    cognitiveLevel: cognitiveLevel(prompt),
    estimatedSeconds: Math.max(90, Math.min(360, 60 + Math.ceil((prompt.length + solution.length) / 180))),
    misconception: "Do not copy the final answer without checking the assumptions, intermediate steps, and required constraints.",
    visualHook: "Write the entities, operators, clauses, or dependency steps on a small scratch diagram before checking the solution.",
    sourceRefs: [{
      sourceId: `DSA5104/Homework Solutions/${chapter}/${item.file}`,
      page: 1,
      sourceType: "exercise",
      role: "teacher-assigned homework solution",
      status: "current-context"
    }],
    schemaVersion: "nus.question.v1",
    reviewStatus: sourceIncomplete ? "source-solution-incomplete" : "ready"
  };
}

function convertQuestion(question, pool) {
  if (OPEN_RESPONSE_IDS.has(question.id) || INCOMPLETE_SOURCE_IDS.has(question.id)) return question;
  const originalType = question.originalType || question.type;
  const { choices, answer } = makeChoices(question, pool);
  return {
    ...question,
    type: "mcq",
    prompt: "Select the option that best answers the exercise below.\n\n" + question.prompt,
    choices,
    answer,
    estimatedSeconds: Math.max(45, Math.min(75, Math.round(question.estimatedSeconds / 3))),
    explanation: "MCQ adaptation of the teacher-assigned exercise (original response type: " + originalType + "). The correct option is a concise solution summary; open the worked solution below to study the exact SQL, design, or derivation."
  };
}

function ingest(sourceRoot) {
  const bankPath = path.join(ROOT, "content", "courses", "DSA5104", "questions", "bank.json");
  const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
  const files = collectFiles(sourceRoot);
  const retained = bank.questions.filter(question => !/^dsa5104-homework-ch\d+-/.test(question.id));
  const drafts = files.map(buildQuestion);
  const homework = drafts.map(question => convertQuestion(question, drafts));
  const convertedToMcq = homework.filter(question => question.type === "mcq").length;
  const openResponseRetained = homework.length - convertedToMcq;
  if (convertedToMcq * 100 !== homework.length * TARGET_MCQ_PERCENT) {
    throw new Error("MCQ conversion policy failed: " + convertedToMcq + "/" + homework.length + " is not exactly " + TARGET_MCQ_PERCENT + "%");
  }
  const sourceDirectories = CHAPTERS.map(([chapter]) => `DSA5104/Homework Solutions/${chapter}`);
  const nextBank = {
    ...bank,
    purpose: "Source-backed retrieval, exam prompts, and the complete teacher-assigned DSA5104 homework set.",
    homeworkCoverage: {
      sourceRoot: "DSA5104/Homework Solutions",
      sourceDirectories,
      questionCount: homework.length,
      convertedToMcq,
      openResponseRetained,
      targetMcqPercent: TARGET_MCQ_PERCENT,
      policy: "Exactly 80% of teacher-assigned homework questions use concise MCQ solution summaries; 20% remain open response for writing practice or because the supplied source answer is incomplete."
    },
    questions: [...retained, ...homework]
  };
  fs.writeFileSync(bankPath, `${JSON.stringify(nextBank, null, 2)}\n`);
  return {
    total: homework.length,
    convertedToMcq,
    openResponseRetained,
    byChapter: Object.fromEntries(CHAPTERS.map(([chapter]) => [chapter, files.filter(item => item.chapter === chapter).length]))
  };
}

if (require.main === module) {
  const { sourceRoot } = parseArgs(process.argv.slice(2));
  const result = ingest(sourceRoot);
  console.log("DSA5104 homework ingest complete · " + result.total + " questions · " + result.convertedToMcq + " MCQ · " + result.openResponseRetained + " open response");
  Object.entries(result.byChapter).forEach(([chapter, count]) => console.log(`  ${chapter}: ${count}`));
}

module.exports = {
  INCOMPLETE_SOURCE_IDS,
  OPEN_RESPONSE_IDS,
  choiceText,
  solutionSummary,
  isWeakSummary,
  cleanMarkdown,
  splitExercise,
  collectFiles,
  buildQuestion,
  convertQuestion,
  makeChoices,
  ingest
};
