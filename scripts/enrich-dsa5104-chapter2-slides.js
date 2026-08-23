#!/usr/bin/env node
/**
 * Enrich DSA5104 Chapter 2 (Introduction to the Relational Model) slides with
 * slide-specific study layers, matching the DSA5101/DSA5105 pattern.
 *
 * Adds assetPath, title, kind/status/priority metadata, and replaces the
 * generic extractor explanation + socraticQuestions with content-specific
 * study layers keyed to the Relational Model -> Keys -> Relational Algebra arc.
 *
 * Run: node scripts/enrich-dsa5104-chapter2-slides.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'content', 'courses', 'DSA5104', 'slides', 'dsa5104-chapter2.json');
const SOURCE_ID = 'DSA5104/chapter2.pdf';
const ASSET_ROOT = 'assets/nus/dsa5104/chapter2';

const CORE_SLIDES = [
  ...Array.from({ length: 39 }, (_, index) => index + 3),
  43,
  44
];

const TEXTBOOK_SOURCE = 'DSA5104/Database System Concepts, 7th edition';
const TEXTBOOK_RELATIONAL_MODEL = {
  sourceId: TEXTBOOK_SOURCE,
  sourceType: 'textbook',
  page: 2,
  role: 'Chapter 2 pointer: relations, keys, and integrity',
  status: 'course-depth'
};
const TEXTBOOK_DESIGN = {
  sourceId: TEXTBOOK_SOURCE,
  sourceType: 'textbook',
  page: 4,
  role: 'Chapter 7 pointer: relational design and decomposition',
  status: 'course-depth'
};

const TEXTBOOK_SLIDES = new Map([
  [4, TEXTBOOK_RELATIONAL_MODEL], [5, TEXTBOOK_RELATIONAL_MODEL], [7, TEXTBOOK_RELATIONAL_MODEL],
  [8, TEXTBOOK_RELATIONAL_MODEL], [11, TEXTBOOK_RELATIONAL_MODEL], [12, TEXTBOOK_RELATIONAL_MODEL],
  [14, TEXTBOOK_RELATIONAL_MODEL], [15, TEXTBOOK_RELATIONAL_MODEL], [17, TEXTBOOK_RELATIONAL_MODEL],
  [20, TEXTBOOK_RELATIONAL_MODEL], [21, TEXTBOOK_RELATIONAL_MODEL], [24, TEXTBOOK_RELATIONAL_MODEL],
  [27, TEXTBOOK_RELATIONAL_MODEL], [28, TEXTBOOK_RELATIONAL_MODEL], [30, TEXTBOOK_RELATIONAL_MODEL],
  [31, TEXTBOOK_RELATIONAL_MODEL], [32, TEXTBOOK_RELATIONAL_MODEL], [34, TEXTBOOK_RELATIONAL_MODEL],
  [37, TEXTBOOK_RELATIONAL_MODEL], [38, TEXTBOOK_RELATIONAL_MODEL], [39, TEXTBOOK_RELATIONAL_MODEL],
  [43, TEXTBOOK_DESIGN], [44, TEXTBOOK_DESIGN], [46, TEXTBOOK_RELATIONAL_MODEL]
]);

const KEY_FORMULAS = {
  4: { name: 'Relation schema', latex: 'R=(A_1,A_2,\\ldots,A_n)', purpose: 'Use it to name the attributes that define a relation; the instance supplies the current tuples.' },
  8: { name: 'Candidate-key uniqueness', latex: '\\forall t_1,t_2\\in r:\\ t_1[K]=t_2[K]\\Rightarrow t_1=t_2', purpose: 'Use it to test whether the attributes in K uniquely identify every tuple.' },
  14: { name: 'Relational-algebra closure', latex: 'E_1,E_2\\mapsto E', purpose: 'Every operation consumes relation-valued expressions and returns a relation, enabling composition.' },
  15: { name: 'Selection', latex: '\\sigma_p(r)', purpose: 'Use selection to keep rows of r whose tuple values satisfy predicate p.' },
  17: { name: 'Projection', latex: '\\pi_{A_1,\\ldots,A_k}(r)', purpose: 'Use projection to keep only the listed attributes; set semantics remove duplicate result tuples.' },
  21: { name: 'Cartesian product cardinality', latex: '|r\\times s|=|r|\\cdot|s|', purpose: 'Use it to anticipate the size of the all-pairs intermediate relation before a join predicate filters it.' },
  24: { name: 'Theta join', latex: 'r\\bowtie_\\theta s=\\sigma_\\theta(r\\times s)', purpose: 'Use it to explain a join as product followed by a predicate that keeps matching tuple pairs.' },
  27: { name: 'Join equivalence', latex: 'r\\bowtie_\\theta s=\\sigma_\\theta(r\\times s)', purpose: 'Use it to translate between the compact join operator and its product-plus-selection expansion.' },
  28: { name: 'Union compatibility', latex: 'r\\cup s\\text{ is valid only when arity and corresponding domains are compatible}', purpose: 'Use it before applying union; operands must describe compatible tuple shapes.' },
  30: { name: 'Intersection', latex: 'r\\cap s', purpose: 'Use it to retain tuples that occur in both compatible input relations.' },
  31: { name: 'Set difference', latex: 'r-s', purpose: 'Use it to retain tuples in r that are absent from s; reversing operands changes the answer.' },
  32: { name: 'Assignment', latex: 'T\\leftarrow E', purpose: 'Use it to name an intermediate relation-valued expression without changing stored database data.' },
  34: { name: 'Rename', latex: '\\rho_x(E)', purpose: 'Use it to name an expression or create a separately named copy for self-comparison.' },
  37: { name: 'Query equivalence', latex: 'E_1\\equiv E_2\\Longleftrightarrow\\forall D:\\ E_1(D)=E_2(D)', purpose: 'Use it to distinguish same-result expressions from merely similar-looking expressions.' },
  39: { name: 'Join rewrite', latex: 'r\\bowtie_\\theta s\\equiv\\sigma_\\theta(r\\times s)', purpose: 'Use it to recognize equivalent relational-algebra forms that an optimizer can transform.' }
};

const DEEP_OVERRIDES = {
  4: {
    explanation: {
      whatYouSee: 'The slide gives the formal relation schema and instance notation, then ties each tuple to one table row.',
      whyItMatters: 'Schema is the stable shape; instance is the changing state. Exam questions often ask which one changes after an insert.',
      intuition: 'Think of the schema as a type and the instance as the current value of that type.',
      technicalDetail: 'The schema is written as $R=(A_1,\\ldots,A_n)$; an instance $r(R)$ is a set of tuples over those attributes.',
      pitfall: 'Do not call a current table snapshot the schema, and do not infer identity from row position.',
      connection: 'Keys constrain tuples in an instance, while the schema tells you which attributes exist.'
    },
    socratic: { type: 'compare', prompt: 'If an INSERT adds one row, which object changes: the schema or the instance?', answer: 'The instance changes; the schema remains the same unless the table definition itself is altered.', hint: 'Separate structure from current contents.' }
  },
  8: {
    explanation: {
      whatYouSee: 'The slide layers four ideas: superkey, minimal candidate key, selected primary key, and foreign-key reference.',
      whyItMatters: 'Key questions test both uniqueness and minimality, then ask which relation owns or references the identity.',
      intuition: 'A superkey is sufficient; a candidate key is sufficient without extra attributes; the primary key is the chosen candidate.',
      technicalDetail: 'The foreign-key example places instructor.dept_name in the child/referencing relation and points to department.dept_name in the referenced relation.',
      pitfall: 'A superkey with redundant attributes is not a candidate key, and a foreign key identifies a link rather than a tuple in its own relation.',
      connection: 'These constraints become DDL declarations and explain why some inserts or deletes are rejected.'
    },
    socratic: { type: 'apply', prompt: 'Is {ID, name} a candidate key if {ID} already uniquely identifies instructor tuples?', answer: 'No. It is a superkey, but it is not minimal because removing name leaves the superkey {ID}.', hint: 'Check minimality, not only uniqueness.' }
  },
  12: {
    explanation: {
      whatYouSee: 'The slide separates declarative query languages from procedural relational algebra and notes that equivalent languages can have different execution plans.',
      whyItMatters: 'You must distinguish the result specification from the algorithm used to obtain it; this is the bridge from algebra to query optimization.',
      intuition: 'Declarative says what relation you want. A plan decides how to compute it.',
      technicalDetail: 'The lecture lists relational algebra, tuple relational calculus, and domain relational calculus as equivalent in expressive power, then focuses on relational algebra.',
      pitfall: 'Do not confuse declarative SQL syntax with the physical algorithm chosen by the database system.',
      connection: 'The algebra operators below give a formal intermediate language for reasoning about query meaning and rewrites.'
    },
    socratic: { type: 'compare', prompt: 'If two SQL queries return the same relation but use different join algorithms, what changed?', answer: 'The physical execution plan changed; the declarative query meaning and logical result did not.', hint: 'Separate what from how.' }
  },
  13: {
    explanation: {
      whatYouSee: 'The worked query filters instructors by department, joins them to teaches, and projects only the requested name and course columns.',
      whyItMatters: 'This is the canonical exam workflow: translate English into row filters, relation links, and output attributes.',
      intuition: 'Read the expression from the inside out: build matching tuples, keep the target department, then keep only requested columns.',
      technicalDetail: 'The lecture expression is a composition of join, selection, and projection; tuple and domain calculus express the same result declaratively.',
      pitfall: 'Do not project away the identifier before the join condition has used it.',
      connection: 'The next slides name the operators and make each part of this query explicit.'
    },
    socratic: { type: 'derive', prompt: 'Why must the instructor identifier survive until after the join?', answer: 'The identifier is the attribute used to match instructor with teaches; projecting it away before the join removes the evidence needed to form the link.', hint: 'Check which attribute appears in the join predicate.' }
  },
  15: {
    explanation: {
      whatYouSee: 'Selection applies a predicate to tuples and keeps the rows that satisfy it; it does not choose output columns.',
      whyItMatters: 'This is the row-filter operator. Confusing it with projection is one of the fastest ways to build the wrong relational-algebra expression.',
      intuition: 'Selection changes the set of tuples while preserving the relation schema.',
      technicalDetail: 'The notation is $\\sigma_p(r)$, where p is evaluated for each tuple of r.',
      pitfall: 'Selection is not SQL SELECT; the relational-algebra operator σ filters rows.',
      connection: 'Apply selection before projection when the predicate needs an attribute that will not appear in the final answer.'
    },
    socratic: { type: 'compare', prompt: 'Which operator should filter instructors with salary greater than 90,000: selection or projection?', answer: 'Selection, because the condition filters tuples; projection only chooses which attributes remain in the result.', hint: 'Rows versus columns.' }
  },
  17: {
    explanation: {
      whatYouSee: 'Projection keeps a chosen list of attributes and removes the others; the relation result still obeys set semantics.',
      whyItMatters: 'Projection determines the output schema and may collapse distinct input tuples into one output tuple.',
      intuition: 'Projecting is like looking at a table through fewer columns, then deduplicating the visible rows.',
      technicalDetail: 'The notation is $\\pi_{A_1,\\ldots,A_k}(r)$; duplicate result tuples are removed because relations are sets.',
      pitfall: 'Do not assume projection is row-preserving when two rows become identical after hidden attributes are removed.',
      connection: 'Projection is usually the final step that turns an intermediate relation into exactly the requested answer columns.'
    },
    socratic: { type: 'apply', prompt: 'Why can projection reduce the number of rows even though it removes columns?', answer: 'Two distinct tuples can agree on the retained attributes, so set semantics keep only one copy of the resulting tuple.', hint: 'Removing columns can remove the evidence that made rows distinct.' }
  },
  20: {
    explanation: {
      whatYouSee: 'The slide nests selection inside projection to express a multi-step query as one relation-valued expression.',
      whyItMatters: 'Closure is the reason relational algebra scales from simple operators to readable query pipelines.',
      intuition: 'Each operator hands a relation to the next operator, like typed function composition.',
      technicalDetail: 'For the Physics example, evaluate the selection on instructor first, then project name from the resulting relation.',
      pitfall: 'Do not read the expression as a flat list; the parentheses determine which relation each operator receives.',
      connection: 'Joins and set operators use the same closure principle, enabling larger expressions and equivalent rewrites.'
    },
    socratic: { type: 'trace', prompt: 'In a projection of a selection, which operation runs conceptually first?', answer: 'The inner selection produces a relation of qualifying tuples; the outer projection then keeps the requested attributes.', hint: 'Evaluate nested expressions from the inside out.' }
  },
  24: {
    explanation: {
      whatYouSee: 'The slide first shows the all-pairs product, then filters it by matching instructor.ID with teaches.ID.',
      whyItMatters: 'A join is meaningful because its predicate removes unrelated tuple pairs; without that predicate, the product contains false associations.',
      intuition: 'Product creates every candidate pair; the join condition acts as the identity gate.',
      technicalDetail: 'The lecture construction is $r\\bowtie_\\theta s=\\sigma_\\theta(r\\times s)$, instantiated with equal identifiers.',
      pitfall: 'Do not treat a Cartesian product as evidence that two tuples are related.',
      connection: 'The SQL form on the next slide and the compact predicate-join form on page 27 express the same logical operation.'
    },
    socratic: { type: 'derive', prompt: 'What logical step converts the instructor Cartesian product with teaches into the rows representing actual teaching assignments?', answer: 'Apply selection with the predicate $instructor.ID = teaches.ID$; that filtered product is the join result.', hint: 'Product first, matching predicate second.' }
  },
  27: {
    explanation: {
      whatYouSee: 'The slide names theta join and states its equivalence to selection over a Cartesian product.',
      whyItMatters: 'The identity lets you expand a join for derivation questions and recognize a join when it is written in primitive operations.',
      intuition: 'Join is a compact notation for “pair, then keep only pairs satisfying θ.”',
      technicalDetail: 'The predicate θ may compare attributes from the combined schemas of r and s; the output remains a relation.',
      pitfall: 'Do not assume every join predicate is equality; theta join allows a general predicate.',
      connection: 'This equivalence is also the basis for query rewrites and execution-plan alternatives later in the lecture.'
    },
    socratic: { type: 'compare', prompt: 'What is the difference between a Cartesian product and a theta join?', answer: 'The product keeps every tuple pair; a theta join keeps only pairs satisfying its predicate.', hint: 'Ask which operation enforces compatibility.' }
  },
  28: {
    explanation: {
      whatYouSee: 'Union combines tuple sets from two relations, but only when the tuple shapes and corresponding domains are compatible.',
      whyItMatters: 'Union is a set operator, not a way to merge arbitrary tables with unrelated columns.',
      intuition: 'Both inputs must speak the same tuple language before their tuples can be pooled.',
      technicalDetail: 'The lecture requires equal arity and compatible attribute domains; duplicate tuples appear only once in the set result.',
      pitfall: 'Matching column names alone is not enough if the arity or corresponding domains are incompatible.',
      connection: 'Intersection and difference use the same compatibility idea but retain different portions of the two input sets.'
    },
    socratic: { type: 'classify', prompt: 'Can you union instructor(ID, name, salary) with department(dept_name, building, budget)?', answer: 'Not as shown: the relations have the same arity but their corresponding domains and meanings are not compatible.', hint: 'Check arity and corresponding domains, not just column count.' }
  },
  31: {
    explanation: {
      whatYouSee: 'Set difference keeps tuples in the left relation that are absent from the right relation.',
      whyItMatters: 'Difference is directional, so reversing the operands changes the query from “in A not B” to “in B not A.”',
      intuition: 'Read $r-s$ as “start with r and subtract the overlap with s.”',
      technicalDetail: 'The operands must be compatible relations, just as for union and intersection.',
      pitfall: 'Do not treat difference as commutative; in general, $r-s\\ne s-r$.',
      connection: 'The Fall-not-Spring example is a direct set-based query over two projected section relations.'
    },
    socratic: { type: 'compare', prompt: 'What changes when a set-difference expression changes from Fall − Spring to Spring − Fall?', answer: 'The retained set changes direction: the first returns courses only in Fall, while the second returns courses only in Spring.', hint: 'Difference has a left operand and a right operand.' }
  },
  34: {
    explanation: {
      whatYouSee: 'Rename assigns a usable name to an unnamed expression result and can rename attributes as well.',
      whyItMatters: 'Self-comparison requires two distinguishable references to the same base relation.',
      intuition: 'Rename creates an alias, not a second independent database table.',
      technicalDetail: 'The operator $\\rho_x(E)$ returns expression E under name x; this makes attribute qualification and repeated references explicit.',
      pitfall: 'Do not confuse rename with assignment: rename changes the expression label, while assignment stores a temporary result name for a sequence of steps.',
      connection: 'The following salary example uses rename to compare one instructor tuple with another tuple from the same relation.'
    },
    socratic: { type: 'compare', prompt: 'Why is rename needed for a self-join?', answer: 'Without two names, the query cannot distinguish the two roles played by the same relation when comparing its tuples.', hint: 'One base relation, two query roles.' }
  },
  38: {
    explanation: {
      whatYouSee: 'The slide shows two different operation orders that produce the same relation for every database instance.',
      whyItMatters: 'Equivalence lets a DBMS search for a cheaper plan without changing the answer defined by the query.',
      intuition: 'The syntax can move while the denotation stays fixed.',
      technicalDetail: 'Query equivalence means $E_1\\equiv E_2$ when both expressions return the same relation for every database state.',
      pitfall: 'Do not call two expressions equivalent merely because they look similar or happen to match on one sample database.',
      connection: 'The next slide makes the product-plus-selection versus join equivalence explicit.'
    },
    socratic: { type: 'explain', prompt: 'Why can the optimizer reorder relational-algebra operations?', answer: 'It may choose an equivalent expression that preserves the logical result while reducing intermediate data or execution cost.', hint: 'Same result, cheaper path.' }
  },
  43: {
    explanation: {
      whatYouSee: 'The slide joins instructor with department into one wide relation and highlights repeated department facts across instructor rows.',
      whyItMatters: 'Redundancy creates update, insertion, and deletion anomalies; a good relational design keeps facts at the right grain.',
      intuition: 'If one department fact is copied into many instructor tuples, changing one copy is not enough.',
      technicalDetail: 'This is explicitly a preview from Chapter 7, not a new Chapter 2 derivation; it motivates decomposition before normalization is taught.',
      pitfall: 'Do not treat fewer tables as automatically simpler or better.',
      connection: 'The next slide decomposes the wide relation back into instructor and department schemas.'
    },
    socratic: { type: 'diagnose', prompt: 'Which anomaly appears if a department building is copied into many instructor rows and only some copies are updated?', answer: 'An update anomaly: the database can contain contradictory building values for the same department.', hint: 'Look for repeated facts that must change together.' }
  },
  44: {
    explanation: {
      whatYouSee: 'The slide proposes decomposition into instructor and department relations to remove repeated department facts.',
      whyItMatters: 'It connects the algebraic join view to schema design: decomposition trades one wide table for relations with clearer ownership of facts.',
      intuition: 'Store each fact once, then reconstruct combined views with a join when needed.',
      technicalDetail: 'The lecture labels this as a Chapter 7 preview; lossless reconstruction and dependency preservation belong to the deeper design treatment.',
      pitfall: 'Do not assume every decomposition is safe without checking whether the original information can be recovered.',
      connection: 'This design idea explains why keys, foreign keys, joins, and normalization belong to one conceptual chain.'
    },
    socratic: { type: 'evaluate', prompt: 'What must be checked before accepting a decomposition as a good design?', answer: 'Check that redundancy is reduced and that the required information and constraints can still be represented and recovered correctly.', hint: 'Less repetition is necessary, but not sufficient.' }
  },
  46: {
    explanation: {
      whatYouSee: 'The final slide separates runnable MySQL examples from optional, unmarked textbook questions 2.2, 2.6, 2.12, 2.13, and 2.15.',
      whyItMatters: 'These exercises turn the lecture vocabulary into practice: integrity violations, relational-algebra translation, keys, schema diagrams, and query composition.',
      intuition: 'Use the lecture slides to learn the operators, then use the homework questions to force complete derivations.',
      technicalDetail: 'The supplied solutions provide worked answers for the five listed textbook questions; the solution files are exercise depth, not additional lecture scope.',
      pitfall: 'Do not treat “optional and unmarked” as “irrelevant”; these are high-value retrieval prompts for the chapter core.',
      connection: 'The homework closes the loop from source slide to independent derivation and exposes which concepts still need review.'
    },
    socratic: { type: 'plan', prompt: 'Which practice sequence best matches the Chapter 2 learning arc?', answer: 'Run the slide SQL examples, then attempt the five textbook questions without notes, and finally compare each derivation with the supplied solution.', hint: 'Practice should move from guided execution to independent reasoning.' }
  }
};

// Compact per-slide study metadata: slideNumber -> [concept, why, pitfall, qType, qPrompt, qAnswer, qHint]
const META = {
  1: ['chapter title: Introduction to the Relational Model', 'names the chapter and the textbook (Database System Concepts, 7th ed.) that defines the relational model scope', 'treating the title slide as technical evidence', 'orient', 'What does Chapter 2 set out to teach?', 'The structure of relational databases, schema, keys, schema diagrams, and relational query languages including the relational algebra.', 'Read the title as a scope statement.'],
  2: ['chapter outline', 'maps the chapter: structure of relational databases, database schema, keys, schema diagrams, relational query languages, and the relational algebra', 'skipping the outline and losing the narrative structure', 'orient', 'What are the six building blocks Chapter 2 introduces?', 'Relation structure, database schema, keys, schema diagrams, relational query languages, and the relational algebra.', 'The outline is a roadmap.'],
  3: ['the instructor relation as a table', 'grounds the abstract relation in a concrete table with attributes (columns) and tuples (rows)', 'confusing the visual table layout with the mathematical relation', 'define', 'In the instructor relation, what do columns and rows represent?', 'Columns are attributes; rows are tuples of the relation.', 'Columns are attributes; rows are tuples.'],
  4: ['relation schema and instance', 'distinguishes the relation schema, which lists attributes, from the current instance, which is the set of tuples', 'conflating the schema (structure) with an instance (data at one time)', 'compare', 'What is the difference between a relation schema and a relation instance?', 'The schema lists the relation attributes; the instance is the current set of tuples stored in that relation.', 'Schema describes structure; instance contains data.'],
  5: ['attribute domains', 'defines the domain of an attribute as the set of allowed values, which constrains what data is legal', 'ignoring domain constraints when reasoning about valid tuples', 'define', 'What is the domain of an attribute?', 'The set of allowed values for that attribute.', 'A domain lists allowed values.'],
  6: ['relations are unordered', 'states that tuple order is irrelevant because tuples may be stored in any order, so relations are sets, not lists', 'assuming row order carries meaning as it does in a spreadsheet', 'explain', 'Why does tuple order not matter in a relation?', 'Because a relation is a set of tuples and tuples may be stored in any order; identity comes from attribute values, not position.', 'Sets have no order.'],
  7: ['database schema', 'defines the database schema as the logical structure of the database, the collection of relation schemas', 'confusing a single relation schema with the whole database schema', 'define', 'What is a database schema?', 'The logical structure of the database, i.e. the collection of relation schemas and their constraints.', 'Logical structure.'],
  8: ['keys: superkey, candidate key, primary key', 'introduces the central notion that a key is a set of attributes sufficient to identify a unique tuple, leading to candidate and primary keys', 'treating any attribute as a key without checking uniqueness and minimality', 'define', 'What is a superkey and how does it differ from a candidate key?', 'A superkey K is a set of attributes whose values uniquely identify tuples; a candidate key is a minimal superkey with no redundant attributes.', 'A minimal superkey is a candidate key.'],
  9: ['another primary key example', 'reinforces primary-key selection with a second concrete relation', 'assuming a relation has only one possible key', 'apply', 'Why might a relation have more than one candidate key?', 'Because several different minimal attribute sets may each uniquely identify tuples; one is chosen as the primary key.', 'Multiple minimal keys.'],
  10: ['keys in DDL.sql', 'shows how keys are actually declared in SQL DDL for the university database', 'reading the DDL without connecting it back to the key definitions', 'apply', 'How are primary and foreign keys expressed in the DDL.sql file?', 'Through primary key and foreign key constraints in the create table statements.', 'DDL declares keys.'],
  11: ['schema diagram for the university database', 'visualizes the university schema as relations with attributes and key/foreign-key links', 'reading a schema diagram as data rather than structure', 'orient', 'What does the university schema diagram show?', 'The relations, their attributes, primary keys, and foreign-key relationships among them.', 'A diagram maps structure.'],
  12: ['relational query languages', 'introduces procedural versus declarative (non-procedural) query languages and motivates the relational algebra as procedural', 'confusing a query language with SQL specifically', 'compare', 'What is the difference between procedural and declarative query languages?', 'Procedural languages specify how to compute the answer step by step; declarative languages specify what result is wanted.', 'How vs what.'],
  13: ['relational query examples', 'poses example queries such as finding Physics instructors with their course IDs to motivate the algebra operations', 'jumping to the answer without identifying which operations are needed', 'apply', 'Which operations are needed to find names of Physics instructors with the courses they teach?', 'A join of instructor and teaches, then a selection on department, then a projection to the desired attributes.', 'Join, select, project.'],
  14: ['the relational algebra', 'defines the relational algebra as a procedural language whose operations take relations as input and produce relations as output', 'treating the algebra as a programming language rather than a query language', 'define', 'What is the relational algebra?', 'A procedural language consisting of operations that take one or two relations as input and produce a new relation as output.', 'Relations in, relation out.'],
  15: ['the select operation', 'defines the select operation, which returns the tuples of a relation that satisfy a given predicate', 'confusing relational select (filter rows) with SQL select (project columns)', 'define', 'What does the select operation do?', 'It selects the tuples that satisfy a given predicate, filtering rows of a relation.', 'Filter rows.'],
  16: ['select operation comparisons', 'extends select with comparison operators (=, !=, >, >=, <, <=) combined by and/or/not', 'forgetting that predicates combine with boolean connectives', 'apply', 'How can selection predicates be combined?', 'Using and, or, and not to combine comparisons such as =, !=, >, >=, <, <=.', 'Boolean connectives.'],
  17: ['the project operation', 'defines the project operation, a unary operation that returns its argument relation with certain attributes removed', 'confusing project (drop columns) with relational select (drop rows)', 'define', 'What does the project operation do?', 'It returns the argument relation with only the listed attributes, dropping the other columns.', 'Keep columns.'],
  18: ['project operation example', 'projects away the dept_name attribute of instructor as a concrete example', 'forgetting that projection can introduce duplicate rows', 'apply', 'What is the result of projecting instructor without dept_name?', 'A relation of the remaining instructor attributes, possibly with duplicate rows.', 'Drop dept_name.'],
  19: ['projection and duplicate removal', 'asks how to remove duplicated rows after projection, connecting to set semantics and MySQL behavior', 'assuming projection always preserves duplicates', 'explain', 'Why can projection create duplicates and how are they removed?', 'Removing attributes can make distinct tuples identical; duplicates are removed because relations are sets (or via distinct in SQL).', 'Set semantics.'],
  20: ['composition of relational operations', 'shows that because each operation outputs a relation, operations can be composed into expressions', 'forgetting closure, which is what makes composition possible', 'explain', 'Why can relational-algebra operations be composed?', 'Because every operation takes relations as input and produces a relation as output (closure), so the result can feed the next operation.', 'Closure enables composition.'],
  21: ['the Cartesian-product operation', 'defines the Cartesian product (x), which pairs every tuple of one relation with every tuple of another', 'underestimating the size blow-up of a Cartesian product', 'define', 'What does the Cartesian product of two relations produce?', 'All possible pairings of a tuple from the first relation with a tuple from the second.', 'Every pair.'],
  22: ['instructor x teaches example', 'shows the instructor x teaches Cartesian product as a concrete table', 'reading the raw product as meaningful data before filtering', 'apply', 'Why is instructor x teaches mostly meaningless on its own?', 'Because it pairs every instructor with every teaches row, including mismatched ones, until filtered by a condition.', 'Needs a filter.'],
  23: ['instructor x teaches example continued', 'continues the Cartesian-product example to prepare the join', 'skipping the example and missing why join is needed', 'apply', 'What does the second product example reinforce?', 'That the raw Cartesian product contains many non-matching tuple pairs.', 'Product is too broad.'],
  24: ['the join operation', 'defines join as a Cartesian product followed by a selection that keeps only matching tuples', 'thinking join is a primitive unrelated to product and select', 'define', 'How is a join built from more basic operations?', 'As a Cartesian product of the two relations followed by a selection on the matching condition.', 'Product then select.'],
  25: ['join with a matching condition', 'applies the equality of the instructor and teaches identifiers to the product to form the join', 'forgetting the equality condition that makes the join meaningful', 'apply', 'What condition turns instructor x teaches into a useful join?', 'Select tuples whose instructor identifier matches the teaches identifier.', 'Match on ID.'],
  26: ['join expressed in SQL', 'shows the SQL code corresponding to the join condition', 'confusing the algebra join with the SQL syntax without mapping them', 'apply', 'How is the algebra join written in SQL?', 'As a query over instructor and teaches with a where clause that equates their identifier columns.', 'The where clause equates keys.'],
  27: ['join combines select and project', 'states that join lets us combine a select and a Cartesian product, and often a following projection', 'treating join as only a two-table operation', 'explain', 'What does the join operation combine?', 'A select operation and a Cartesian product, and it is often followed by a projection to the desired attributes.', 'Select + product.'],
  28: ['the union operation', 'defines union, which combines two relations, keeping tuples that appear in either or both', 'forgetting the union-compatibility requirement', 'define', 'What does the union of two relations return?', 'The set of tuples that appear in at least one of the two relations.', 'Either or both.'],
  29: ['union example', 'shows a union example projecting course_id from sections in Fall 2017 and Spring 2018', 'missing that both operands must have the same attributes', 'apply', 'What does the union of the two section queries return?', 'The course IDs offered in Fall 2017, in Spring 2018, or in both.', 'Combine offerings.'],
  30: ['the set-intersection operation', 'defines intersection, which finds tuples that appear in both relations', 'confusing intersection with union', 'define', 'What does set intersection return?', 'The tuples that appear in both relations.', 'In both.'],
  31: ['the set-difference operation', 'defines set difference, which finds tuples in one relation but not in the other', 'forgetting that set difference is order-sensitive', 'define', 'What does set difference R - S return?', 'The tuples that are in R but not in S.', 'In R, not S.'],
  32: ['the assignment operation', 'introduces assignment, which names intermediate results to break a complex expression into steps', 'treating assignment as changing data rather than naming a temporary result', 'define', 'What is the assignment operation for?', 'It assigns the result of a relational-algebra expression to a temporary relation name to simplify multi-step queries.', 'Name intermediate results.'],
  33: ['assignment example', 'uses assignment to find instructors in both the Physics and Music departments step by step', 'skipping the step decomposition and losing readability', 'apply', 'How does assignment simplify the Physics-and-Music query?', 'By naming intermediate results so each step can be written and read separately.', 'Step by step.'],
  34: ['the rename operation', 'introduces rename, which gives a name to a relational-algebra expression result and can rename attributes', 'forgetting that expressions otherwise have no name', 'define', 'Why is the rename operation needed?', 'Because relational-algebra expression results have no name; rename lets us refer to them and rename attributes.', 'Name results.'],
  35: ['rename for self-comparison', 'uses rename to find instructors who earn more than another named copy of the instructor relation', 'missing that rename enables comparing a relation with itself', 'apply', 'How does rename enable comparing instructors to each other?', 'By creating a renamed copy of instructor so two tuples of the same relation can be compared in one expression.', 'Self-comparison.'],
  36: ['rename self-comparison continued', 'continues the salary-comparison example using the renamed relation', 'confusing the two copies of the same relation', 'apply', 'What does the renamed copy let the query express?', 'A comparison between two different instructors from the same relation, such as who earns more.', 'Two copies, one relation.'],
  37: ['equivalent queries', 'states that a query can be written in more than one equivalent way in the relational algebra', 'assuming there is only one correct expression', 'explain', 'What does query equivalence mean?', 'Two expressions produce the same result on every database instance, even if written differently.', 'Same result, different form.'],
  38: ['equivalent queries continued', 'shows an alternative equivalent expression for the same query', 'memorizing one form without understanding equivalence', 'apply', 'Why show a second equivalent expression?', 'To demonstrate that different operation orders can yield the same answer.', 'Many valid orders.'],
  39: ['equivalent queries with join', 'compares equivalent forms that use a join versus a product plus selection', 'missing that pushing selections down can be more efficient', 'compare', 'How can the same query be written with a join or with product and select?', 'A join is equivalent to a Cartesian product followed by a selection on the join condition.', 'A join combines product with selection.'],
  40: ['inspecting query results', 'shows how to open result values in a viewer and use explain in the DBMS', 'confusing viewing results with the query logic itself', 'apply', 'What does the explain command reveal?', 'The query execution plan the DBMS will use to evaluate the query.', 'Plan, not just result.'],
  41: ['query execution plan', 'introduces the query execution plan shown by explain', 'treating the plan as decorative rather than performance-relevant', 'explain', 'Why inspect a query execution plan?', 'To understand how the DBMS evaluates a query and where cost is incurred.', 'How the query runs.'],
  42: ['generative AI tools note', 'mentions DeepSeek/ChatGPT as tools, without changing the technical content', 'treating a tool mention as course material', 'orient', 'What role do AI tools play in this slide?', 'They are mentioned as optional aids; they do not define examinable content.', 'Tools, not content.'],
  43: ['features of good relational designs', 'previews Chapter 7: combining all information into one relation causes repetition and update problems', 'thinking one big table is always simpler', 'explain', 'Why is a single combined relation a bad design?', 'Because it repeats information and creates insertion, deletion, and update anomalies.', 'Repetition causes anomalies.'],
  44: ['decomposition', 'previews Chapter 7: decomposition into smaller relations avoids repetition of information', 'decomposing without checking that information is preserved', 'explain', 'What is the purpose of decomposition?', 'To avoid repetition of information by splitting a relation into smaller, well-designed relations.', 'Normalize to avoid redundancy.'],
  45: ['end of Chapter 2', 'marks the end of the relational model chapter before the homework', 'skipping the boundary between lecture content and practice', 'orient', 'What has Chapter 2 covered by its end?', 'Relation structure, schema, keys, schema diagrams, query languages, and the relational algebra operations.', 'Structure then algebra.'],
  46: ['homework: run MySQL examples and optional textbook questions', 'assigns running the in-slide MySQL code and optional textbook questions 2.2, 2.6, 2.12, 2.13, 2.15 (page 60)', 'treating the optional questions as out of scope for exam practice', 'apply', 'What does the Chapter 2 homework ask you to do?', 'Write and run the MySQL example codes, and optionally work through textbook questions 2.2, 2.6, 2.12, 2.13, and 2.15.', 'Run code, then practice.']
};

function buildExplanation(meta, title, page) {
  const explanation = {
    whatYouSee: `The slide introduces ${meta[0]}. Use the rendered slide for the exact source notation and examples.`,
    whyItMatters: meta[1],
    intuition: `This slide focuses on ${meta[0]}. Read it as part of the relational-model arc: structure, keys, then the algebra.`,
    technicalDetail: `The slide is part of the DSA5104 Chapter 2 source (${SOURCE_ID}), page ${page}. The extracted text is a reader layer; the rendered slide remains authoritative.`,
    pitfall: `Do not fall into the trap of ${meta[2]}.`,
    connection: 'This slide connects to the surrounding slides in the relational-model narrative: relations and schema first, keys next, then the relational algebra.'
  };
  return { ...explanation, ...(DEEP_OVERRIDES[page] && DEEP_OVERRIDES[page].explanation) };
}

function buildSocratic(meta, page) {
  const override = DEEP_OVERRIDES[page] && DEEP_OVERRIDES[page].socratic;
  return override ? [override] : [{ type: meta[3], prompt: meta[4], answer: meta[5], hint: meta[6] }];
}

function titleFor(page, fallback) {
  const titles = {
    1: 'Chapter 2: Introduction to the Relational Model',
    2: 'Outline', 3: 'Example of an Instructor Relation', 4: 'Relation Schema and Instance',
    5: 'Attributes and Domains', 6: 'Relations are Unordered', 7: 'Database Schema', 8: 'Keys',
    9: 'Another Primary-Key Example', 10: 'Keys in DDL.sql', 11: 'Schema Diagram for the University Database',
    12: 'Relational Query Languages', 13: 'Query Examples', 14: 'The Relational Algebra', 15: 'The Select Operation',
    16: 'Select Operation (Cont.)', 17: 'The Project Operation', 18: 'Project Operation Example',
    19: 'Projection and Duplicate Removal', 20: 'Composition of Relational Operations', 21: 'The Cartesian-Product Operation',
    22: 'Instructor x Teaches', 23: 'Instructor x Teaches (Cont.)', 24: 'The Join Operation', 25: 'Join Operation (Cont.)',
    26: 'Join Operation in SQL', 27: 'Join Combines Select and Product', 28: 'The Union Operation', 29: 'Union Operation (Cont.)',
    30: 'The Set-Intersection Operation', 31: 'The Set-Difference Operation', 32: 'The Assignment Operation',
    33: 'Assignment Operation Example', 34: 'The Rename Operation', 35: 'Rename for Self-Comparison',
    36: 'Rename Self-Comparison (Cont.)', 37: 'Equivalent Queries', 38: 'Equivalent Queries (Cont.)',
    39: 'Equivalent Queries with Join', 40: 'Inspecting Query Results', 41: 'Query Execution Plan',
    42: 'Generative AI Tools Note', 43: 'Features of Good Relational Designs', 44: 'Decomposition',
    45: 'End of Chapter 2', 46: 'Homework'
  };
  return titles[page] || fallback || `Chapter 2 slide ${page}`;
}

function main() {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  data.lessonIds = ['dsa5104-relational-model', 'dsa5104-database-design'];
  data.title = 'Chapter 2 · Introduction to the Relational Model';
  data.summary = 'All 46 supplied Chapter 2 lecture pages with source extraction, relational-model explanations, key formulas, textbook pointers, and Socratic checkpoints.';
  data.coreSlideNumbers = CORE_SLIDES;
  data.source = {
    sourceId: SOURCE_ID, sourceType: 'lecture', fileName: 'chapter2.pdf', pageCount: data.slides.length,
    access: 'local-only', assetPolicy: 'page-renders-only', courseCodePrintedOnSlide: 'DSA5104', atlasCourseId: 'DSA5104'
  };
  data.extraction = {
    sourceJson: 'data/extracted/DSA5104/chapter2.json',
    parser: {
      triage: { tool: 'pdftotext', pageCount: data.slides.length },
      primary: { tool: 'pymupdf', version: '1.28.2' },
      fallback: { tool: 'mineru', version: 'not-installed-or-not-run', pages: [] }
    },
    markdownReaderView: 'data/extracted/DSA5104/chapter2.md'
  };
  let updated = 0;
  for (const slide of data.slides) {
    const page = slide.slideNumber;
    const meta = META[page];
    slide.title = titleFor(page, slide.title);
    slide.kind = 'lecture-source';
    slide.status = 'reviewed';
    slide.assetPath = `${ASSET_ROOT}/slide-${String(page).padStart(2, '0')}.jpg`;
    slide.sourceRef = { sourceId: SOURCE_ID, sourceType: 'lecture', page, role: 'Chapter 2 lecture slide', status: 'current' };
    slide.lecturePriority = page === 46 ? 'exercise' : CORE_SLIDES.includes(page) ? 'core' : 'context';
    slide.sourceNote = 'Extracted text is a reader layer; the rendered slide remains authoritative.';
    slide.textbookRefs = TEXTBOOK_SLIDES.has(page) ? [TEXTBOOK_SLIDES.get(page)] : [];
    slide.referenceRefs = [];
    if (KEY_FORMULAS[page]) slide.keyFormula = KEY_FORMULAS[page];
    else delete slide.keyFormula;
    if (slide.extraction && Array.isArray(slide.extraction.blocks)) {
      slide.extraction.sourceId = SOURCE_ID;
      slide.extraction.page = page;
    }
    if (meta) {
      slide.explanation = buildExplanation(meta, slide.title, page);
      slide.socraticQuestions = buildSocratic(meta, page);
      updated++;
    } else {
      console.warn(`No study metadata for slide ${page}; keeping extractor defaults.`);
    }
  }
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${updated}/${data.slides.length} chapter 2 slides with study layers.`);
}

main();
