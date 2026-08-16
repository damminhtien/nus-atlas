(function () {
  "use strict";
  const source = (sourceId, page, sourceType = "lecture", role = "current lecture", status = sourceType === "lecture" ? "current" : "current-context") => ({ sourceId, page, sourceType, role, status });
  const lens = (status, whyExaminable, lecture, officialExercise = [], textbook = [], reference = []) => ({ status, whyExaminable, lecture, officialExercise, textbook, reference });
  const lecture = (page, role) => source("DSA5104/chapter1.pdf", page, "lecture", role, "current");
  const exercise = (sourceId, role) => source(sourceId, 1, "exercise", role, "current-context");
  const textbook = (page, role) => source("DSA5104/Database System Concepts, 7th edition", page, "textbook", role, "course-depth");
  const lectureLens = (why, lectureRefs, exerciseRefs = [], textbookRefs = []) => lens("core DSA5104", why, lectureRefs, exerciseRefs, textbookRefs);
  const contrast = (id, pair, prompt, choices, answer, explanation, sourceRefs) => ({ id, type: "contrast", kind: "concept-contrast", pair, prompt, choices, answer, explanation, estimatedSeconds: 45, difficulty: "medium", skill: "concept-contrast", cognitiveLevel: "distinguish", misconception: "Name the boundary between the two concepts before choosing.", sourceRefs });

  const lessons = [
    {
      id: "dsa5104-orientation", title: "Database systems, abstraction, and evidence", week: 1, minutes: 45,
      summary: "Build the database vocabulary: DBMS purpose, data models, abstraction levels, schema versus instance, and a reproducible evidence trail.",
      objectives: ["Explain why a DBMS is more than a file collection", "Distinguish physical, logical, and view levels", "Separate schema design from the current database instance"],
      sourceRefs: [lecture(1, "course scope and DBMS purpose"), lecture(12, "view of data"), lecture(18, "levels of abstraction"), lecture(22, "schema and instance")],
      visualIds: ["dsa5104-data-abstraction"],
      sections: [
        { title: "Lecture core · the database boundary", sourceType: "lecture", body: "A DBMS combines interrelated data with programs that provide convenient, efficient, concurrent, and controlled access. Start every answer by naming the data model, the constraints, and the evidence used to validate the result.", sourceRefs: [lecture(1, "DBMS purpose"), lecture(12, "data model and abstraction")], sourceLens: lectureLens("The opening lecture pages define the vocabulary used by every later SQL and design question. Homework depth adds concrete schemas without changing this scope.", [lecture(1, "DBMS purpose"), lecture(12, "data model and abstraction")], [], [textbook(1, "Introduction")]) },
        { title: "Schema, instance, and abstraction", sourceType: "lecture", body: "The schema is the design and constraint boundary; the instance is the data stored at a particular moment. Physical, logical, and view levels hide different kinds of implementation detail, so a view can change without exposing storage layout.", sourceRefs: [lecture(18, "abstraction levels"), lecture(22, "schema and instance")], sourceLens: lectureLens("Schema-versus-instance and abstraction-level distinctions are short-answer foundations: they test whether a learner can separate a model from its current contents.", [lecture(18, "abstraction levels"), lecture(22, "schema and instance")], [], [textbook(12, "data abstraction")]) }
      ],
      examples: [{ title: "Evidence trail for a database answer", sourceType: "lecture", steps: ["Name the relation schema and key constraints.", "State the query or transformation in a reproducible form.", "Show the expected output shape and one edge case.", "Validate with a small result or invariant."], answer: "A correct result is not enough: the model, assumptions, query, and validation evidence must be inspectable." }],
      contrastDrills: [
        contrast("dsa5104-contrast-schema-instance", "Schema vs instance", "A new row is inserted without changing the table definition. What changed?", ["The schema", "The instance", "The data model", "The view definition"], 1, "The instance is the current contents; the schema describes the structure and constraints.", [lecture(22, "schema and instance")]),
        contrast("dsa5104-contrast-abstraction", "Physical vs logical vs view level", "Which level is closest to the tailored data a particular application is allowed to see?", ["Physical", "Logical", "View", "Buffer"], 2, "The view level presents an application-specific projection and can also hide sensitive attributes.", [lecture(18, "levels of abstraction")])
      ],
      questions: [
        { id: "dsa5104-o-q1", type: "mcq", prompt: "Which layer is closest to what an individual user sees?", choices: ["Physical level", "Logical level", "View level", "Storage manager"], answer: 2, explanation: "The view level presents tailored user-facing views over the logical schema.", sourceRefs: [lecture(18, "view level")] },
        { id: "dsa5104-o-q2", type: "short", prompt: "What is the difference between a database schema and an instance?", accepted: ["schema is structure and instance is data", "schema is the design and instance is the current contents", "schema structure instance contents"], solution: "The schema describes structure and constraints; the instance is the current data stored under that schema.", explanation: "A schema changes relatively rarely; an instance changes as rows are inserted or updated.", sourceRefs: [lecture(22, "schema and instance")] }
      ]
    },
    {
      id: "dsa5104-relational-model", title: "Relational model and keys", week: 2, minutes: 55,
      summary: "Read tables as relations, distinguish schema from tuples, identify keys, and reason about integrity constraints.",
      objectives: ["Identify attributes, tuples, domains, and relations", "Distinguish primary, candidate, and foreign keys", "Explain why identity and referential integrity matter"],
      sourceRefs: [lecture(13, "data-model categories"), lecture(14, "relational model"), lecture(15, "sample database"), lecture(25, "integrity constraints"), exercise("DSA5104/Homework Solutions/Ch02_Introduction_to_the_Relational_Model/2.3.md", "relational-model exercise")],
      visualIds: ["dsa5104-relational-model"],
      sections: [
        { title: "Lecture core · relations are not spreadsheets", sourceType: "lecture", body: "A relation has a schema and an instance. Tuples are identified by attributes, and domains constrain the values that attributes may take. Row position is not identity: keys are.", sourceRefs: [lecture(14, "relational model"), lecture(15, "sample database")], sourceLens: lectureLens("The lecture establishes the relational vocabulary; Chapter 2 homework makes key and relational-algebra reasoning concrete.", [lecture(14, "relational model"), lecture(15, "sample database")], [exercise("DSA5104/Homework Solutions/Ch02_Introduction_to_the_Relational_Model/2.3.md", "key identification")], [textbook(55, "Relational model")]) },
        { title: "Identity and referential integrity", sourceType: "lecture", body: "A primary key chooses a stable unique identity for each tuple. A foreign key carries a referenced identity into another relation and constrains links to existing keys unless nullability is explicitly allowed.", sourceRefs: [lecture(25, "primary-key integrity constraint")], sourceLens: lectureLens("Key placement and integrity constraints are directly reusable in ER translation, SQL DDL, and exam design questions.", [lecture(25, "integrity constraints")], [exercise("DSA5104/Homework Solutions/Ch06_Database_Design_Using_the_ER_Model/6.10.md", "foreign-key constraints")], [textbook(70, "Integrity constraints")]) }
      ],
      examples: [{ title: "Department–Student relationship", sourceType: "exercise", steps: [String.raw`Department has primary key $\text{id}$.`, String.raw`Student stores $\text{department\_id}$ as a foreign key.`, "The foreign key belongs on the many side of a one-to-many relationship.", "A constraint check rejects a student row that references a missing department."], answer: "The design preserves one student per tuple while allowing many students to reference one department." }],
      contrastDrills: [
        contrast("dsa5104-contrast-key-fk", "Primary key vs foreign key", "Which constraint primarily expresses a link to an identity in another relation?", ["Primary key", "Foreign key", "Check constraint", "View"], 1, "A foreign key references a candidate or primary key in another relation; a primary key identifies tuples in its own relation.", [lecture(25, "integrity constraints")]),
        contrast("dsa5104-contrast-relational-er", "Relational model vs ER model", "Which representation is mainly used to design entities and relationships before implementation tables?", ["Relational model", "Entity–Relationship model", "Physical storage model", "Data dictionary"], 1, "The ER model is a design representation; the relational model is the table-based implementation model.", [lecture(13, "data-model categories")])
      ],
      questions: [
        { id: "dsa5104-rm-q1", type: "mcq", prompt: "What does a foreign key primarily express?", choices: ["A sort order", "A reference to a candidate key in another relation", "A duplicate row", "A compressed column"], answer: 1, explanation: "A foreign key constrains values to refer to a key in a referenced relation.", sourceRefs: [lecture(25, "foreign-key integrity")] },
        { id: "dsa5104-rm-q2", type: "derivation", prompt: "How do you map a one-to-many relationship from Department to Student?", accepted: ["put department key as foreign key in student", "foreign key in student", "student has department_id foreign key"], solution: "Place the primary key of Department as a foreign key in Student, the many-side relation.", explanation: "The foreign key belongs on the many side for a simple one-to-many mapping.", sourceRefs: [exercise("DSA5104/Homework Solutions/Ch06_Database_Design_Using_the_ER_Model/6.23.md", "ER-to-relational mapping")] }
      ]
    },
    {
      id: "dsa5104-database-design", title: "Database design and ER translation", week: 3, minutes: 60,
      summary: "Move from requirements to entities, relationships, relational schemas, and explicit integrity constraints.",
      objectives: ["Separate logical from physical design", "Translate one-to-many and many-to-many relationships", "Spot redundancy and missing constraints before writing SQL"],
      sourceRefs: [lecture(33, "logical and physical design"), lecture(44, "two-tier and three-tier applications"), lecture(45, "architecture trade-offs"), exercise("DSA5104/Homework Solutions/Ch06_Database_Design_Using_the_ER_Model/6.23.md", "ER design exercise")],
      sections: [
        { title: "Design is a chain of decisions", sourceType: "lecture", body: "Logical design chooses a good collection of relation schemas and distributes attributes according to business meaning and integrity requirements. Physical design chooses storage layout and access methods later.", sourceRefs: [lecture(33, "database design")], sourceLens: lectureLens("Design questions test whether you can preserve meaning and constraints through a representation change, not merely draw boxes.", [lecture(33, "logical and physical design")], [exercise("DSA5104/Homework Solutions/Ch06_Database_Design_Using_the_ER_Model/6.23.md", "schema and constraint design")], [textbook(350, "Database design")]) },
        { title: "Application boundary", sourceType: "lecture", body: "A two-tier application lets a client invoke database functionality directly; a three-tier application inserts an application server. The extra layer can improve development, scalability, reliability, and security, but it also introduces another boundary to reason about.", sourceRefs: [lecture(44, "application architecture"), lecture(45, "three-tier advantages")], sourceLens: lectureLens("Architecture is examinable when a data design must explain where validation, authorization, and query logic live.", [lecture(44, "application architecture"), lecture(45, "three-tier advantages")], [], [textbook(40, "Application architecture")]) }
      ],
      examples: [{ title: "Many-to-many relationship", sourceType: "exercise", steps: ["Represent each entity with its own relation and primary key.", "Create a relationship relation containing both referenced keys.", "Use the pair of keys as a composite primary key when one pair should occur once.", "Add foreign-key constraints to both entity relations."], answer: "A relationship relation preserves multiplicity without storing a repeating group inside either entity tuple." }],
      contrastDrills: [
        contrast("dsa5104-contrast-logical-physical", "Logical vs physical design", "Choosing relation schemas and constraints belongs to which design stage?", ["Logical design", "Physical design", "Query evaluation", "Transaction recovery"], 0, "Logical design chooses what the data means and how relations are structured; physical design chooses storage and access details.", [lecture(33, "logical and physical design")]),
        contrast("dsa5104-contrast-two-three-tier", "Two-tier vs three-tier architecture", "Which architecture inserts an application server between the client and the database?", ["Two-tier", "Three-tier", "Shared-nothing", "View level"], 1, "Three-tier architecture separates the client interface from direct database calls by introducing an application server.", [lecture(44, "application architecture")])
      ],
      questions: [
        { id: "dsa5104-dd-q1", type: "short", prompt: "Why should a many-to-many relationship usually become its own relation?", accepted: ["it stores both foreign keys", "relationship relation with two foreign keys", "avoid repeating groups"], solution: "A separate relation stores the identities of both participating entities and can use their pair as a composite key.", explanation: "This preserves multiplicity and makes the relationship attributes explicit.", sourceRefs: [exercise("DSA5104/Homework Solutions/Ch06_Database_Design_Using_the_ER_Model/6.23.md", "many-to-many mapping")] },
        { id: "dsa5104-dd-q2", type: "mcq", prompt: "Which decision is physical design?", choices: ["Choosing whether salary is an attribute", "Choosing relation schemas", "Choosing an index or storage layout", "Choosing the business meaning of a key"], answer: 2, explanation: "Physical design concerns layout and access methods after the logical schema is chosen.", sourceRefs: [lecture(33, "physical design")] }
      ]
    },
    {
      id: "dsa5104-sql-foundations", title: "SQL foundations: select, join, and group", week: 4, minutes: 65,
      summary: "Write declarative SQL that makes row filtering, joins, grouping, NULL behavior, and aggregate filtering explicit.",
      objectives: ["Write single-table and multi-table queries", "Join through keys rather than row position", "Explain WHERE, GROUP BY, HAVING, and NULL semantics"],
      sourceRefs: [lecture(25, "DDL and constraints"), lecture(28, "DML"), lecture(30, "SQL query language"), exercise("DSA5104/Homework Solutions/Ch03_Introduction_to_SQL/3.2.md", "SQL exercise")],
      visualIds: ["dsa5104-sql-flow"],
      sections: [
        { title: "Declarative query thinking", sourceType: "lecture", body: "SQL states what table result is required rather than prescribing every low-level access step. A query takes tables as input and returns a table, while the engine chooses an evaluation plan.", sourceRefs: [lecture(28, "declarative DML"), lecture(30, "SQL query language")], sourceLens: lectureLens("The lecture establishes SQL semantics; Chapter 3 solutions supply the multi-table and subquery depth that makes those semantics operational.", [lecture(28, "declarative DML"), lecture(30, "SQL query language")], [exercise("DSA5104/Homework Solutions/Ch03_Introduction_to_SQL/3.2.md", "SQL query practice")], [textbook(95, "SQL")]) },
        { title: "Row filtering versus group filtering", sourceType: "lecture", body: "Use `WHERE` for predicates on rows before grouping. Use `HAVING` for predicates on aggregate groups after `GROUP BY`. A robust answer also states how NULL values affect comparisons and aggregates.", sourceRefs: [lecture(30, "SQL query language")], sourceLens: lectureLens("WHERE versus HAVING is a high-frequency distinction because it tests the logical meaning of an aggregate query, not memorized syntax.", [lecture(30, "SQL query language")], [exercise("DSA5104/Homework Solutions/Ch03_Introduction_to_SQL/3.2.md", "aggregate query")], [textbook(105, "Aggregation")]) }
      ],
      examples: [{ title: "Departments with at least two students", sourceType: "exercise", steps: ["Join Student to Department through the key relationship.", "Group by the department identity and display name.", String.raw`Compute $\operatorname{COUNT}(*)$ for each group.`, "Use `HAVING COUNT(*) >= 2` to keep completed groups."], answer: "The aggregate predicate belongs in HAVING because the count does not exist until grouping has happened." }],
      contrastDrills: [
        contrast("dsa5104-contrast-ddl-dml", "DDL vs DML", "Which language category defines tables and integrity constraints?", ["DDL", "DML", "DCL only", "Transaction log"], 0, "DDL defines schema objects and constraints; DML queries and updates data under that schema.", [lecture(25, "DDL"), lecture(28, "DML")]),
        contrast("dsa5104-contrast-where-having", "WHERE vs HAVING", "A query should keep departments whose student count is at least two. Where should the aggregate predicate go?", ["WHERE", "ON", "HAVING", "ORDER BY"], 2, "HAVING filters groups after aggregation; WHERE filters individual rows before groups are formed.", [lecture(30, "SQL query language")])
      ],
      questions: [
        { id: "dsa5104-sql-q1", type: "mcq", prompt: "Which clause filters groups after aggregation?", choices: ["WHERE", "ON", "HAVING", "ORDER BY"], answer: 2, explanation: "WHERE filters rows before grouping; HAVING filters grouped results.", sourceRefs: [lecture(30, "SQL query language")] },
        { id: "dsa5104-sql-q2", type: "short", prompt: "Why should a join use keys rather than row position?", accepted: ["row order is not identity", "keys preserve identity under reorder", "join on primary and foreign keys"], solution: "Keys express identity and relationships; row order can change under filtering, sorting, partitioning, or storage changes.", explanation: "A key-based join preserves meaning across execution plans and data rearrangements.", sourceRefs: [lecture(25, "integrity constraints"), exercise("DSA5104/Homework Solutions/Ch03_Introduction_to_SQL/3.2.md", "join practice")] }
      ]
    },
    {
      id: "dsa5104-query-processing", title: "Query processor and storage manager", week: 5, minutes: 55,
      summary: "Trace SQL from parsing through optimization and evaluation, and connect physical storage decisions to query cost.",
      objectives: ["Name the query-processing stages", "Explain the storage manager's responsibilities", "Reason about indexes, blocks, and data movement"],
      sourceRefs: [lecture(34, "database engine"), lecture(36, "storage manager"), lecture(37, "block-transfer cost"), lecture(39, "query processor"), lecture(40, "query processing")],
      visualIds: ["dsa5104-query-pipeline"],
      sections: [
        { title: "Logical query, physical plan", sourceType: "lecture", body: "The query processor parses and translates a declarative query, chooses an evaluation plan, and executes it. The optimizer may rewrite the plan while preserving relational semantics.", sourceRefs: [lecture(39, "query processor"), lecture(40, "query processing")], sourceLens: lectureLens("The three-stage pipeline gives a compact explanation for why identical SQL can have different runtime costs and why indexes matter.", [lecture(39, "query processor"), lecture(40, "query processing")], [], [textbook(220, "Query processing")]) },
        { title: "Storage and block movement", sourceType: "lecture", body: "The storage manager mediates between low-level data and applications. Buffer, file, authorization/integrity, and transaction managers each contribute to efficient and safe access. Disk movement and block transfers can dominate the time of a logically simple query.", sourceRefs: [lecture(36, "storage manager"), lecture(37, "block-transfer cost"), lecture(38, "indexes")], sourceLens: lectureLens("These pages turn performance into a systems question: count blocks, indexes, buffering, and coordination rather than SQL tokens.", [lecture(36, "storage manager"), lecture(37, "block-transfer cost"), lecture(38, "indexes")], [], [textbook(440, "Storage and indexing")]) }
      ],
      examples: [{ title: "Query-processing trace", sourceType: "lecture", steps: ["Parse and translate the SQL into an internal representation.", "Enumerate plausible plans such as an index lookup or a scan.", "Choose a low-cost plan using statistics and physical access methods.", "Execute the plan and return a relation."], answer: "Optimization changes execution strategy, not the declared relational result." }],
      contrastDrills: [
        contrast("dsa5104-contrast-query-stages", "Parsing vs optimization vs evaluation", "Which stage chooses among alternative low-level plans?", ["Parsing and translation", "Optimization", "Evaluation", "View definition"], 1, "Optimization compares alternative evaluation plans; parsing builds the internal representation and evaluation runs the selected plan.", [lecture(40, "query processing")]),
        contrast("dsa5104-contrast-index-table", "Index lookup vs full scan", "What is the main purpose of an index?", ["Change the logical schema", "Provide pointers for faster access", "Guarantee a correct join", "Replace constraints"], 1, "An index provides an access path to data items; it does not replace logical integrity constraints.", [lecture(38, "indexes")])
      ],
      questions: [
        { id: "dsa5104-qp-q1", type: "mcq", prompt: "Which sequence matches the lecture's query-processing pipeline?", choices: ["Evaluation, parsing, optimization", "Parsing/translation, optimization, evaluation", "Optimization, DDL, backup", "Join, group, projection only"], answer: 1, explanation: "The query is parsed and translated, an evaluation plan is selected, then the plan is executed.", sourceRefs: [lecture(40, "query processing")] },
        { id: "dsa5104-qp-q2", type: "short", prompt: "Why can an index improve retrieval without changing the logical query result?", accepted: ["it changes access path not semantics", "index is physical access method", "same relation result different plan"], solution: "An index changes how the engine locates tuples, while the logical query still defines the same relation result.", explanation: "Physical optimization must preserve declarative semantics.", sourceRefs: [lecture(38, "indexes"), lecture(40, "query processing")] }
      ]
    },
    {
      id: "dsa5104-transactions-architecture", title: "Transactions, concurrency, and architecture", week: 6, minutes: 55,
      summary: "Explain atomic updates, concurrent access, transaction management, and the trade-offs of centralized, parallel, and distributed architectures.",
      objectives: ["Explain atomicity with a transfer example", "Separate transaction management from concurrency control", "Compare centralized, parallel, and distributed deployment models"],
      sourceRefs: [lecture(8, "integrity and failure motivation"), lecture(41, "transaction management"), lecture(42, "database architectures"), lecture(43, "database engine architecture")],
      sections: [
        { title: "One logical function, one consistent outcome", sourceType: "lecture", body: "A transaction is a collection of operations that performs one logical function. A transfer should either complete as a whole or leave the database unchanged; partial writes create an inconsistent state.", sourceRefs: [lecture(41, "transaction management")], sourceLens: lectureLens("Atomicity and concurrency are the bridge from a schema/query answer to a safe multi-user system.", [lecture(41, "transaction management")], [], [textbook(370, "Transactions")]) },
        { title: "Architecture changes the cost model", sourceType: "lecture", body: "Centralized, client-server, parallel, and distributed systems differ in where data and computation live and how nodes communicate. A shared-nothing design can scale, but network coordination and data movement become explicit costs.", sourceRefs: [lecture(42, "database architecture"), lecture(43, "engine architecture")], sourceLens: lectureLens("Architecture questions ask you to connect a logical operation to failure, coordination, and placement assumptions.", [lecture(42, "database architecture"), lecture(43, "engine architecture")], [], [textbook(760, "Parallel and distributed databases")]) }
      ],
      examples: [{ title: "Bank transfer as a transaction", sourceType: "lecture", steps: ["Read account A and subtract the amount.", "Write the new value of A.", "Read account B and add the amount.", "Write the new value of B.", "Commit only when the logical function is complete."], answer: "Transaction management protects the database from failure; concurrency control protects interactions among concurrent transactions." }],
      contrastDrills: [
        contrast("dsa5104-contrast-atomic-concurrent", "Atomicity vs concurrency control", "Which property says a transfer is all-or-nothing?", ["Atomicity", "Concurrency control", "Indexing", "Normalization"], 0, "Atomicity treats a transaction as one indivisible logical unit; concurrency control manages interactions among simultaneous transactions.", [lecture(41, "transaction management")]),
        contrast("dsa5104-contrast-central-distributed", "Centralized vs distributed database", "Which architecture explicitly includes geographical distribution or heterogeneous schemas?", ["Centralized", "Distributed", "Single-user view", "Logical schema"], 1, "The lecture distinguishes distributed databases by geographical placement and possible schema/data heterogeneity.", [lecture(42, "distributed databases")])
      ],
      questions: [
        { id: "dsa5104-ta-q1", type: "short", prompt: "Why should a bank transfer be one transaction rather than two independent updates?", accepted: ["avoid partial update", "all or nothing", "atomicity"], solution: "Atomicity prevents a failure between the two writes from leaving only one account updated.", explanation: "The transaction boundary matches the logical business function.", sourceRefs: [lecture(41, "transaction management")] },
        { id: "dsa5104-ta-q2", type: "mcq", prompt: "What does concurrency control primarily manage?", choices: ["The order and interaction of concurrent transactions", "The names of columns", "The syntax of SELECT", "The textbook index"], answer: 0, explanation: "Concurrency control coordinates concurrent transactions to preserve consistency.", sourceRefs: [lecture(41, "concurrency control")] }
      ]
    },
    {
      id: "dsa5104-semi-structured", title: "Semi-structured data and distributed SQL", week: 8, minutes: 50,
      summary: "Compare relational, XML/JSON-like, and distributed SQL workflows by schema, nesting, validation, and movement costs.",
      objectives: ["Recognize XML and JSON as semi-structured representations", "Explain schema-on-read trade-offs", "Relate a distributed SQL query to parsing, shuffle, and compute costs"],
      sourceRefs: [lecture(13, "semi-structured data model"), lecture(16, "XML and JSON examples"), lecture(17, "nested documents"), lecture(50, "big-data analysis beyond SQL")],
      visualIds: ["dsa5104-semi-structured"],
      sections: [
        { title: "Nested structure, delayed agreement", sourceType: "lecture", body: "XML uses user-defined tags, while JSON represents nested objects and arrays through key–value pairs. Semi-structured formats preserve variation and nesting, but consumers must do more interpretation and validation later.", sourceRefs: [lecture(13, "semi-structured model"), lecture(16, "XML and JSON"), lecture(17, "nested documents")], sourceLens: lectureLens("The lecture introduces semi-structured data as a model choice, not as a replacement for relational integrity in every workload.", [lecture(13, "semi-structured model"), lecture(16, "XML and JSON")], [], [textbook(1020, "Semi-structured data")]) },
        { title: "Distributed SQL is still semantic SQL", sourceType: "lecture", body: "A distributed query engine changes the physical cost model, not the need to define a clear result. Joins, grouping, and sorting can move data across partitions, so the plan should be inspected for shuffle, skew, and serialization.", sourceRefs: [lecture(50, "SQL and big-data systems")], sourceLens: lectureLens("This is the bridge from the introductory database engine to later distributed data systems: the same query semantics meet a different execution environment.", [lecture(50, "big-data analysis beyond SQL")], [], [textbook(1030, "Distributed query processing")]) }
      ],
      examples: [{ title: "Choosing a representation", sourceType: "lecture", steps: ["Use a relational schema when stable identity and constraints dominate.", "Use nested XML or JSON when variation and hierarchy are first-class.", "Define validation rules at the boundary where consumers need them.", "Measure parse and shuffle costs when the query runs across partitions."], answer: "Flexibility is not free: deferred schema decisions move work into query and validation stages." }],
      contrastDrills: [
        contrast("dsa5104-contrast-relational-semi", "Relational vs semi-structured", "Which representation naturally expresses nested variation with user-defined tags or key–value objects?", ["Relational table only", "Semi-structured XML/JSON", "B-tree index", "Transaction log"], 1, "XML and JSON represent nested or variable structure more directly; they do not remove the need for validation.", [lecture(13, "data-model categories"), lecture(16, "XML and JSON")]),
        contrast("dsa5104-contrast-read-write", "Schema-on-write vs schema-on-read", "What is the main trade-off of schema-on-read?", ["It validates everything before ingestion", "It delays some schema and validation work until query time", "It guarantees fewer joins", "It eliminates parsing"], 1, "Schema-on-read is flexible at ingestion but shifts interpretation and validation to downstream consumers.", [lecture(16, "semi-structured data")])
      ],
      questions: [
        { id: "dsa5104-ms-q1", type: "mcq", prompt: "What is a common schema-on-read trade-off?", choices: ["No validation is ever needed", "Flexibility at ingestion shifts more validation to query time", "It always uses less storage", "It removes all joins"], answer: 1, explanation: "Flexible ingestion can defer schema decisions, so consumers must validate and interpret data later.", sourceRefs: [lecture(16, "semi-structured data")] },
        { id: "dsa5104-ms-q2", type: "short", prompt: "Why should a distributed SQL plan still be inspected for data movement?", accepted: ["network shuffle is expensive", "data movement and shuffle cost", "because shuffle is expensive"], solution: "Network movement and shuffle can dominate a distributed query even when the SQL text looks simple.", explanation: "The distributed cost model adds partitioning, serialization, and network traffic.", sourceRefs: [lecture(50, "big-data analysis beyond SQL")] }
      ]
    }
  ];

  window.NUS_CONTENT.DSA5104 = {
    modules: [
      { id: "dsa5104-foundations", title: "Foundations", lessons: [lessons[0]] },
      { id: "dsa5104-models", title: "Models and design", lessons: [lessons[1], lessons[2]] },
      { id: "dsa5104-sql", title: "Querying", lessons: [lessons[3], lessons[4]] },
      { id: "dsa5104-modern", title: "Modern data systems", lessons: [lessons[5], lessons[6]] }
    ],
    sqlPractice: {
      schema: [
        { name: "Department", columns: ["id INTEGER PRIMARY KEY", "name TEXT NOT NULL"] },
        { name: "Student", columns: ["id INTEGER PRIMARY KEY", "name TEXT NOT NULL", "department_id INTEGER", "FOREIGN KEY (department_id) REFERENCES Department(id)"] },
        { name: "Enrollment", columns: ["student_id INTEGER", "course_code TEXT", "grade REAL", "PRIMARY KEY (student_id, course_code)"] }
      ],
      seed: { Department: [[1, "Data Science"], [2, "Computer Science"], [3, "Statistics"]], Student: [[101, "An", 1], [102, "Binh", 1], [103, "Chi", 2], [104, "Duc", 3]], Enrollment: [[101, "DSA5104", 85], [102, "DSA5104", 78], [103, "DSA5104", 91], [101, "DSA5105", 88], [104, "DSA5105", 73]] },
      exercises: [
        { id: "sql-1", level: "Warm-up", prompt: "List every student name in alphabetical order.", starter: "SELECT name FROM Student ORDER BY name;", expected: ["An", "Binh", "Chi", "Duc"], explanation: "Select one column and make ordering explicit." },
        { id: "sql-2", level: "Join", prompt: "Return each student with the department name.", starter: "SELECT s.name, d.name AS department\nFROM Student s\nJOIN Department d ON d.id = s.department_id\nORDER BY s.id;", expected: ["An|Data Science", "Binh|Data Science", "Chi|Computer Science", "Duc|Statistics"], explanation: "The join uses Student.department_id to Department.id." },
        { id: "sql-3", level: "Aggregation", prompt: "Find departments with at least two students.", starter: "SELECT d.name, COUNT(*) AS n\nFROM Department d\nJOIN Student s ON s.department_id = d.id\nGROUP BY d.id, d.name\nHAVING COUNT(*) >= 2;", expected: ["Data Science|2"], explanation: "HAVING filters the aggregate result after GROUP BY." },
        { id: "sql-4", level: "ER practice", prompt: "Which key pair prevents duplicate enrollments for one student and course?", starter: "-- Write the constraint in words or SQL", expected: ["primary key (student_id, course_code)", "composite primary key", "student_id, course_code"], explanation: "The composite key identifies one enrollment per student-course pair." }
      ]
    }
  };
})();
