/* Add reviewed study layers to the mechanically extracted Spark lecture. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SLIDE_FILE = path.join(ROOT, "content", "courses", "DSA5208", "slides", "dsa5208-lec4.json");
const SOURCE_ID = "DSA5208/Lec4.pdf";

function study(title, label, see, why, intuition, technical, pitfall, connection, prompt, answer, hint, priority = "core") {
  return { title, label, see, why, intuition, technical, pitfall, connection, prompt, answer, hint, priority };
}

const PAGES = {
  1: study(
    "Lecture 4 source overview", "lecture source boundary", "the lecture identity and the Apache Spark scope", "the opening page establishes which supplied lecture is authoritative", "anchor Spark claims to this source before adding implementation detail", "This page is provenance context for the 42-page Lecture 4 source.", "Do not infer an entire Spark syllabus from the title page.", "The next page gives the source's section map.", "What does the Lecture 4 source overview establish before Spark details begin?", "It establishes the lecture identity and topic boundary, not a technical execution guarantee.", "Separate provenance from the later definitions.", "support"
  ),
  2: study(
    "Lecture roadmap", "lecture roadmap", "the four sections: Spark, DataFrames, GPU acceleration, and summary", "the roadmap prevents a section heading from being mistaken for an execution rule", "use the map to locate the definition, API, execution, and accelerator pages", "The page is an index of the supplied source sections.", "Do not cite a roadmap entry as evidence for a detailed algorithm.", "Each entry is expanded by the pages that follow it.", "Which four source sections does the Lecture roadmap separate?", "It separates the Spark introduction, structured DataFrame APIs, GPU acceleration, and the summary.", "Treat navigation as scope, not derivation.", "support"
  ),
  3: study(
    "What is Apache Spark?", "Spark analytics scope", "the definition of Spark as a unified engine for large-scale data analytics", "the storage boundary matters: Spark is an analytics engine and can run over systems such as HDFS", "separate the compute engine from the storage system it reads or writes", "The source describes unified APIs, cluster scale, and support for Python, SQL, Scala, Java, and R.", "Do not describe Spark as a replacement storage system merely because it reads distributed files.", "The following pages name the tools built around this engine.", "What boundary does What is Apache Spark? draw between analytics and storage?", "Spark provides the analytics engine; it does not itself provide the storage system, although it can use systems such as HDFS.", "Ask what executes computation and what stores data."
  ),
  4: study(
    "Components of Spark", "Spark component map", "the high-level tools Spark exposes for SQL, pandas workloads, ML, graphs, and streaming", "the component map connects one engine to several workload-specific APIs", "choose the component by workload rather than treating every Spark task as a SQL query", "Spark SQL, Pandas API on Spark, MLlib, GraphX, and Structured Streaming cover distinct data-processing needs.", "Do not assume that a component name alone specifies a physical execution plan.", "The DataFrame API pages provide the concrete structured-processing path.", "Which component in Components of Spark is intended for graph processing, and which is intended for streaming?", "GraphX is for graph processing, while Structured Streaming is for incremental and stream processing.", "Match the component to its workload."
  ),
  5: study(
    "History of Apache Spark", "Spark history", "a timeline from the AMPLab research project to current Spark releases", "the history explains why DataFrames, adaptive execution, and multi-language APIs appear in the modern stack", "read the timeline as context for capabilities, not as a performance proof", "The source records milestones including Spark 2.0, Spark 3.0, Spark Connect, and the stated 4.x release context.", "Do not turn a release milestone into a guarantee about every deployment.", "The next pages move from history to a concrete PySpark workload.", "Why is History of Apache Spark context rather than an execution algorithm?", "It records project and feature milestones; it does not define how a particular DataFrame job executes.", "Separate chronology from semantics.", "support"
  ),
  6: study(
    "First example with PySpark", "Spark workload framing", "a large flight-delay table with missing values and a concrete aggregation question", "the example ties Spark APIs to a data volume and a question that needs distributed processing", "start with the dataset, the invariant, and the requested result before choosing operations", "The source states 5,819,079 rows, 31 columns, an approximately 565M CSV, and missing information.", "Do not claim that a large row count alone proves a specific speedup.", "The next page translates the question into PySpark operations.", "What two data-analysis tasks are posed by First example with PySpark?", "Find the carrier with the least average delay and sort the data by arrival delay in descending order.", "Identify the group key and the sort key."
  ),
  7: study(
    "First example with PySpark", "PySpark DataFrame workflow", "CSV loading, carrier aggregation, and writing an ordered result", "the code shows a complete path from input data to a persisted output", "compose a small number of named transformations, then inspect which call requests a result", "The source uses csv, groupBy with avg, orderBy, and write.csv for the flight example.", "Do not assume that defining the DataFrame variables has already read the full CSV.", "The structured API and lazy-evaluation pages explain when this code executes.", "Which operation in First example with PySpark computes the average per carrier?", "groupBy on AIRLINE followed by agg(avg(ARRIVAL_DELAY)) computes the per-carrier average.", "Find the grouping column and the aggregation function."
  ),
  8: study(
    "Structured APIs for DataFrames roadmap", "structured API roadmap", "the source map for DataFrames, execution, GPU acceleration, and summary", "the roadmap separates API semantics from the later execution and accelerator sections", "locate the concept before tracing its physical cost", "This page is a navigation index, not a new DataFrame operation.", "Do not infer lazy or GPU behavior from the section title alone.", "The next pages define DataFrames and their row and column operations.", "What does Structured APIs for DataFrames roadmap tell you to study next?", "It points to DataFrames and APIs first, then execution of those APIs, followed by GPU acceleration and summary.", "Use the roadmap to choose the next source page.", "support"
  ),
  9: study(
    "DataFrames and some APIs", "DataFrame API roadmap", "the transition from the DataFrame representation to execution and acceleration", "the repeated section map keeps API operations distinct from their runtime implementation", "read this as a boundary between what the API expresses and how Spark executes it", "The page lists the DataFrame/API subsection and the later execution and GPU sections.", "Do not treat a section list as a definition of partitioning.", "The following pages show the DataFrame representation and API calls.", "Why is DataFrames and some APIs not itself a DataFrame definition?", "It is a section map; the definition and partition behavior are stated on the following DataFrames page.", "Look for the page that defines rows, columns, and partitions.", "support"
  ),
  10: study(
    "DataFrames", "DataFrame partitions", "a table of rows and columns split into partitions across computer nodes", "partitioning is the bridge between a logical table and parallel cluster work", "think of one table as several row groups that workers can process", "Each partition contains a collection of DataFrame rows and may be stored on a different node.", "Do not confuse a column with a partition; columns describe fields while partitions divide rows.", "Schemas and row/column APIs refine this representation next.", "What does DataFrames say a partition contains?", "A partition contains a collection of rows from the DataFrame and may be stored on a different computer node.", "Rows are distributed; columns remain logical fields."
  ),
  11: study(
    "Schemas, columns and rows", "DataFrame schema and rows", "a schema with names and types plus row-level inspection and construction", "explicit schema information controls how Spark interprets CSV values", "separate the table contract from the individual records inside it", "The source uses printSchema, schema fields, first, take, Row, and createDataFrame.", "Do not edit a schema field and assume the existing DataFrame has already been re-read with it.", "The next page isolates columns as expressions tied to a DataFrame.", "What two kinds of information does Schemas, columns and rows make explicit?", "It makes the DataFrame schema and its records explicit: names/types define the contract, while rows hold individual values.", "Separate metadata from records."
  ),
  12: study(
    "Schemas, columns and rows", "DataFrame column expressions", "columns as logical constructions that only make sense within a DataFrame", "a column expression can be selected or transformed without being a standalone data object", "treat df.YEAR and expressions such as df.YEAR minus a constant as plans over a DataFrame", "The source demonstrates selecting a column, inspecting columns, and forming a derived column expression.", "Do not treat a column expression as an independent table or materialized vector.", "The next page combines column expressions with select and withColumn.", "Why does Schemas, columns and rows say a column cannot exist outside a DataFrame context?", "A column expression refers to a field of a particular DataFrame and gains meaning from that schema.", "Ask which DataFrame supplies the field."
  ),
  13: study(
    "Select, add and remove columns", "column projection and derivation", "select, withColumn, withColumnRenamed, and drop operations", "these APIs change the visible or derived columns without changing the original source file", "The source shows selecting columns, adding an ON TIME expression, renaming ARRIVAL_DELAY, and dropping YEAR.", "The output DataFrame has a planned schema that may add, rename, or remove columns.", "Do not describe a renamed or dropped column as a mutation of the CSV source.", "Row filters and unions are introduced on the next API page.", "Which operation in Select, add and remove columns creates a derived ON TIME field?", "select or withColumn can create ON TIME from the predicate ARRIVAL_DELAY less than zero.", "Find the expression that turns a predicate into a named column."
  ),
  14: study(
    "Filter, sample, add rows", "row filtering and union", "filter/where predicates, sampling with a seed, and adding rows by union", "row operations return new DataFrames, so the transformation chain stays explicit", "The source uses filter and where for predicates, sample for a fraction, and union after creating a compatible DataFrame.", "filter keeps rows satisfying a predicate, sample selects a fraction, and union combines compatible schemas.", "Do not append rows by assigning to an existing DataFrame as if it were a mutable list.", "Sorting and null placement build on the row operations shown here.", "How does Filter, sample, add rows add records to a DataFrame?", "It creates a new compatible DataFrame and unions it with the existing DataFrame.", "Look for createDataFrame followed by union."
  ),
  15: study(
    "Sort and limit", "ordering and null placement", "sort/orderBy, explicit null placement, and limit", "sorting is a visible result operation whose null policy can change the first rows", "state the sort key and missing-value policy before inspecting the result", "The source demonstrates ascending/descending order, secondary AIRLINE order, null placement, and limit.", "Do not assume descending order alone defines where missing values appear.", "Aggregation will produce grouped values that can be sorted by their aggregate.", "What extra decision does Sort and limit require when ARRIVAL_DELAY contains missing values?", "It requires an explicit choice for where nulls appear, such as nulls first or nulls last.", "Separate direction from null placement."
  ),
  16: study(
    "Aggregation functions", "grouped aggregation", "count, distinct counts, extrema, averages, and groupBy aggregation", "aggregation changes many rows into summary values at a chosen grouping grain", "name the grain first, then apply each aggregate within that grain", "The source contrasts whole-DataFrame aggregates with per-AIRLINE max, min, and average delay.", "Do not interpret an aggregate as a row-preserving transformation.", "Lazy evaluation determines when the aggregation is actually computed.", "What changes when Aggregation functions adds groupBy before max, min, and avg?", "The functions are evaluated separately within each AIRLINE group instead of once over the entire DataFrame.", "Identify the grouping key before reading the aggregate."
  ),
  17: study(
    "Execution of structured APIs roadmap", "execution roadmap", "the source map for lazy evaluation, transformations, actions, and plans", "the roadmap separates API declarations from the execution stages that give them cost", "trace a DataFrame call from declaration to action before discussing performance", "This page indexes the execution subsection and does not itself execute a job.", "Do not claim that the roadmap has inspected the cluster plan.", "Lazy evaluation is defined on the next page.", "Which execution concepts are grouped by Execution of structured APIs roadmap?", "It groups lazy evaluation, transformations, actions, and logical/physical planning under structured API execution.", "Use the map to order the execution explanation.", "support"
  ),
  18: study(
    "Lazy evaluation", "lazy DataFrame plan", "transformations building a plan and actions such as count or first triggering computation", "lazy evaluation lets Spark optimize a chain before reading and computing the data", "separate constructing a recipe from asking Spark to serve a result", "The source uses explain to inspect the plan and identifies count and first as computation-triggering actions.", "Do not say that read.csv plus filter has already scanned the entire file.", "Transformations and actions formalize this boundary on the following pages.", "Which call in Lazy evaluation turns the declared DataFrame plan into requested computation?", "An action such as count or first triggers computation; explain inspects the plan without serving the final result.", "Find the calls that request a value."
  ),
  19: study(
    "Transformations", "lazy transformations", "transformations producing new DataFrames without immediately generating data", "the transformation boundary explains why a chain can be optimized before execution", "treat each transformation as a new recipe rather than a materialized result", "The source defines transformations as lazy operations that produce new DataFrames.", "Do not count every transformation as a completed cluster job.", "Narrow and wide transformations refine the cost model next.", "What does Transformations produce before an action is called?", "It produces a new DataFrame description or plan, not immediately generated output data.", "Ask whether an action has occurred."
  ),
  20: study(
    "Narrow transformations", "narrow partition dependency", "a filter or withColumn where each input partition contributes to at most one output partition", "narrow dependencies avoid repartitioning data across multiple output partitions", "follow one input partition and ask whether it needs to feed several outputs", "The source names filter and withColumn as narrow transformations.", "Do not label every operation that returns a DataFrame as wide.", "Wide transformations introduce a different partition dependency.", "Why is filter listed as a narrow transformation?", "Each input partition can be processed into at most one corresponding output partition without a cross-partition shuffle.", "Follow the partition dependency, not the API name alone."
  ),
  21: study(
    "Wide transformations", "wide partition dependency", "a transformation such as sort or grouped aggregation that can reorganize data across partitions", "wide dependencies may require data movement before the next stage can proceed", "look for records crossing partition boundaries to meet a global ordering or grouping need", "The source contrasts wide work with narrow work and gives sort and aggregation as examples.", "Do not use the narrow dependency definition for a global sort or grouped aggregation.", "A wide transformation is the stage boundary visible in the job graph.", "What makes Sort a wide transformation in the lecture's execution model?", "Sorting may need records from several input partitions to be reorganized before ordered output partitions can be produced.", "Check whether the operation needs cross-partition coordination."
  ),
  22: study(
    "Actions", "action trigger", "actions that view, collect, or write the result of transformations", "actions are the boundary where Spark must produce an observable result", "classify a call by its output: console value, native object, or external data source", "The source lists count, collect, and saveAsTextFile as action examples.", "Do not confuse an API that describes a transformation with one that requests output.", "Actions create jobs and expose the stage/task structure.", "Which category does collect belong to in Actions?", "collect is an action that gathers the computed data into native objects.", "Ask where the result goes."
  ),
  23: study(
    "Logical and physical plans", "logical versus physical plan", "the pipeline from user code to logical plan to physical plan and cluster execution", "the distinction separates what computation means from how the cluster performs it", "first state the relational intent, then inspect the chosen operators", "A logical plan names transformations abstractly; a physical plan selects executable functions and strategies.", "Do not treat two physical plans as different query meanings automatically.", "Logical and physical planning explain how Spark chooses among those representations.", "What does Logical and physical plans add after user code?", "It separates an abstract logical plan from a concrete physical plan before execution on the cluster.", "Compare what is computed with how it runs."
  ),
  24: study(
    "Logical planning", "logical plan analysis", "parsed, analyzed, and optimized logical plans connected to the Catalog", "analysis catches invalid columns and types while optimization improves the valid plan", "treat planning as a sequence of increasingly informed checks", "The source says parsing builds a tree, analysis resolves names/types with the Catalog, and Catalyst can combine filters or reorder operations.", "Do not assume a parsed plan has verified that every column exists.", "The optimized logical plan becomes input to physical planning.", "What new information does the analyzed logical plan add to the parsed plan?", "It resolves column names, regular expressions, and data types using the Catalog.", "Separate syntax parsing from data-aware analysis."
  ),
  25: study(
    "Physical planning", "cost-based physical selection", "multiple physical plans evaluated by a cost model before cluster execution", "the same logical result can have different physical costs", "compare candidate operators by their execution cost rather than by source-code order", "The source describes candidate physical plans, a cost model, and a selected best plan, with AQE as a caveat.", "Do not call the cost-model choice permanently final when AQE can adapt it.", "The selected plan is broken into jobs, stages, and tasks.", "Why does Physical planning generate more than one candidate plan?", "Different physical implementations can satisfy the same optimized logical plan with different costs.", "Separate semantic equivalence from physical cost."
  ),
  26: study(
    "Jobs, stages and tasks", "Spark execution hierarchy", "an action creating a job, stages containing tasks, and workers executing partition-level tasks in parallel", "the hierarchy maps a user action to concrete parallel work", "trace action to job, stage, and task before reasoning about runtime", "A task operates on a partitioned subset; a wide transformation can separate stages.", "Do not call every DataFrame variable a job or every row a task.", "The GPU section later compares a different low-level data layout, not a new Spark job definition.", "What is the smallest execution unit named by Jobs, stages and tasks?", "A task is a single operation executed on a partitioned subset of data by a worker node.", "Find the unit tied to one partitioned subset."
  ),
  27: study(
    "Apache Spark with GPU acceleration roadmap", "GPU acceleration roadmap", "the transition from Spark's layout to CUDA-X operations and the summary", "the roadmap makes layout and operator implementation the bridge to acceleration", "first compare data representation, then compare the filter and projection implementations", "This page is a navigation index for the GPU subsection.", "Do not claim GPU acceleration changes every Spark operator in the same way.", "The next page introduces the RAPIDS/CUDA-X accelerator named by the source.", "What comparison does Apache Spark with GPU acceleration roadmap prepare?", "It prepares a comparison of Spark and CUDA-X data layouts and their filter and projection implementations.", "Look for layout and operator pages.", "support"
  ),
  28: study(
    "RAPIDS/CUDA-X Accelerator for Apache Spark", "CUDA-X accelerator scope", "the source's zero-code acceleration claim and its relationship to CUDA-X libraries", "the accelerator boundary is useful only when the supported operation and deployment are made explicit", "read zero-code as a source claim about supported workflows, not as a universal speed guarantee", "The source describes CUDA-X as optimized domain-specific libraries and presents acceleration for tabular and ML workflows.", "Do not promise acceleration for an unsupported operator or hardware configuration.", "The following pages explain the row/column layout that enables the described path.", "What qualification should accompany the zero-code claim on RAPIDS/CUDA-X Accelerator for Apache Spark?", "It applies to supported workflows and configurations; it is not a guarantee that every operation or deployment is accelerated.", "Separate a compatibility claim from a benchmark claim."
  ),
  29: study(
    "Row-based and column-based storages", "data layout", "the difference between row-oriented Spark storage and column-oriented CUDA-X storage", "layout determines which values can be accessed together by vectorized hardware", "draw the same table twice: records across rows, then fields grouped into columns", "Row-based storage keeps a record together; column-based storage groups values of one field together.", "Do not confuse a logical DataFrame column with a physical columnar layout.", "The next pages connect column adjacency to throughput and cache locality.", "What physical distinction does Row-based and column-based storages make?", "It contrasts records stored together by row with values of each field stored together by column.", "Ask which values are adjacent in memory."
  ),
  30: study(
    "Why column-based storage?", "GPU-friendly column layout", "adjacent column values processed by many GPU threads with one vector operation", "contiguous values let parallel hardware apply the same operation efficiently", "match one column to one repeated operation across many rows", "The source attributes high throughput to adjacent values and vector-wide operations.", "Do not infer that columnar storage alone removes all transfer or kernel costs.", "The CPU cache-locality comparison is added on the next page.", "Why does Why column-based storage? favor adjacent column values for GPUs?", "Thousands of GPU threads can access adjacent values and apply the same operation across a vector.", "Connect adjacency to parallel access."
  ),
  31: study(
    "Why column-based storage?", "CPU cache locality", "the source's claim that columnar layout can also help CPU aggregation", "the benefit is not limited to GPUs when an operation repeatedly scans one field", "read the layout benefit as an access-pattern argument, not a device slogan", "The source attributes CPU benefits to better cache locality for aggregation operations.", "Do not generalize one layout claim into a universal win for every workload.", "The toy benchmark makes the hardware and operation explicit.", "What mechanism does Why column-based storage? give for CPU aggregation?", "It points to better cache locality when an aggregation scans adjacent values in one column.", "Name the memory-access mechanism.", "support"
  ),
  32: study(
    "Why column-based storage?", "columnar benchmark", "a toy sum benchmark where the stated column-based time is lower than the row-based time", "the example makes the access-pattern hypothesis measurable while retaining its hardware context", "compare the operation, data size, device, and measured times before drawing a conclusion", "The source reports a 10,000,000-row toy sum and measurements on an Intel i7-13800H laptop.", "Do not present this single laptop measurement as a universal performance bound.", "The next pages move from layout to filter implementation.", "What evidence is needed before interpreting the benchmark on Why column-based storage?", "Keep the operation, row count, hardware, and measured times together; the result is an illustrative comparison, not a universal guarantee.", "Preserve the benchmark conditions."
  ),
  33: study(
    "filter() operation in Spark", "Spark filter semantics", "filter returning a new DataFrame containing rows satisfying a predicate", "the operator's semantic contract is independent of its low-level row representation", "state the predicate and the retained rows before discussing implementation", "The source defines filter as a row-preserving selection by predicate, with a new DataFrame result.", "Do not describe filter as an in-place deletion from the source DataFrame.", "Implementation pages show how Spark evaluates each row.", "What is the output contract of filter() operation in Spark?", "It returns a new DataFrame containing only rows whose values satisfy the given predicate.", "Focus on retained rows and a new DataFrame."
  ),
  34: study(
    "filter() operation in Spark", "row-wise filter implementation", "retrieving a row, evaluating a predicate, and appending a qualifying UnsafeRow", "the implementation connects the semantic filter to work inside one partition", "follow one row through predicate test and conditional output", "The source describes a row-by-row check and append path using UnsafeRow.", "Do not say that a rejected row is appended to the output.", "WholeStageCodegen explains how this procedure is wrapped in generated execution code.", "What condition causes filter() operation in Spark to append an UnsafeRow?", "The UnsafeRow is appended only when the predicate evaluates to true for the retrieved row.", "Follow the true branch."
  ),
  35: study(
    "filter() operation in Spark", "WholeStageCodegen filter path", "the generated-code wrapper and the reason Spark may copy a row into UnsafeRow", "the low-level representation explains how a semantic row filter becomes efficient generated code", "separate the input row type from the output representation expected by generated code", "The source says WholeStageCodegen can be inspected with explain(codegen) and that copying handles representation and field-count differences.", "Do not assume every input row is already an UnsafeRow.", "CUDA-X uses a batch mask rather than this row-wise Spark path.", "Why can filter() operation in Spark copy a qualifying input row?", "The input may not already be an UnsafeRow, and generated code may change the number of fields, so Spark creates the expected output representation.", "Check the input and generated-code contracts."
  ),
  36: study(
    "filter() operation in CUDA-X", "GPU mask and scan", "a batch filter using parallel predicate checks, a mask, and exclusive scan positions", "the mask/position pair turns many independent predicate results into compact output locations", "write one bit per row, then compute where each passing row belongs", "A mask value of one marks a passing row; exclusive scan supplies the destination position.", "Do not treat the mask as the final output table; it only records predicate results.", "The fallback page states what happens when cuDF cannot support the predicate.", "How does filter() operation in CUDA-X place passing rows?", "It checks the predicate in parallel, builds a mask, and uses exclusive-scan positions to write passing rows compactly.", "Separate predicate result from output position."
  ),
  37: study(
    "filter() operation in CUDA-X", "GPU fallback boundary", "fallback to Spark for unsupported cuDF operations and batch coalescing", "accelerated execution has a compatibility boundary that must be visible in a performance claim", "trace supported path versus fallback path before comparing implementations", "The source says unsupported predicates convert through ColumnarToRow and use the Spark version; small batches may be coalesced.", "Do not claim that every filter remains on the GPU after an unsupported expression appears.", "Projection has a separate columnar advantage on the next pages.", "What happens when filter() operation in CUDA-X contains an operation unsupported by cuDF?", "The filter falls back to the Spark implementation after the DataFrame is converted through ColumnarToRow.", "Find the unsupported-operation branch."
  ),
  38: study(
    "Projecting DataFrames", "DataFrame projection APIs", "selecting/reordering columns, creating columns, and renaming columns", "projection changes the visible schema or derives fields without requiring row filtering", "separate selecting existing fields from evaluating a new expression", "The source uses select, withColumn, and withColumnRenamed as projection examples.", "Do not confuse projection with filtering: projection changes columns, while filtering changes retained rows.", "Spark's row representation is described on the next page.", "Which operation in Projecting DataFrames creates a new column from existing columns?", "withColumn creates a named column by evaluating an expression over existing columns.", "Look for an expression assigned a new column name."
  ),
  39: study(
    "Projecting DataFrames", "Spark projection implementation", "planning a new schema and creating an UnsafeRow for each input row", "the implementation shows why Spark's row-based representation may require row construction", "first determine the output schema, then build each output row from selected fields or expressions", "The source says planning generates the schema and execution creates a new UnsafeRow per partition row.", "Do not claim that selecting columns is free in Spark's row-based path.", "CUDA-X can avoid new rows for a pure select/reorder under columnar storage.", "Why does Projecting DataFrames create a new schema during planning?", "The planner must define the output fields before execution selects, reorders, or computes values for each row.", "Separate schema planning from row materialization."
  ),
  40: study(
    "Project in CUDA-X", "columnar projection", "selecting or reordering columns without creating new rows when no derived expression is needed", "columnar references can preserve existing vectors instead of rebuilding records", "ask whether the projection only selects/reorders or also computes a new field", "The source contrasts a pure column selection with a projection that includes a derived col4 expression.", "Do not extend the no-new-row claim to projections that compute new values.", "The summary closes by reconnecting layout to operator behavior.", "When can Project in CUDA-X avoid creating new rows?", "It can avoid new rows when the projection only selects or reorders existing columns; derived expressions still require computation.", "Check whether a new column is evaluated."
  ),
  41: study(
    "Lecture 4 summary roadmap", "lecture summary roadmap", "the summary headings for DataFrames, lazy evaluation, and GPU acceleration", "the summary map keeps representation, execution, and hardware layout as separate revision threads", "review the semantic API, its execution trigger, and its physical layout in that order", "This page lists the source's summary categories without adding a new operation.", "Do not use the summary headings as evidence for a benchmark or guarantee.", "The final page states the concrete takeaways.", "How does Lecture 4 summary roadmap organize the lecture's main ideas?", "It groups DataFrame operations, lazy execution and plan structure, and CUDA-X layout/operator acceleration.", "Name the three categories before recalling details.", "support"
  ),
  42: study(
    "Summary", "Lecture 4 summary", "DataFrame operations, lazy transformations/plans, and GPU acceleration through columnar layout", "the summary connects API semantics to execution planning and physical data layout", "revise from operation to trigger to implementation rather than memorizing isolated API names", "The source highlights row/column manipulation, sorting, aggregation, lazy evaluation, narrow/wide transformations, logical/physical plans, and CUDA-X.", "Do not claim that choosing an API alone determines the physical plan or speedup.", "These distinctions prepare later Spark and scalable-algorithm material.", "What chain does Summary ask you to retain from a DataFrame call to its execution cost?", "Connect the DataFrame operation to lazy planning, the action that triggers work, the resulting stages/tasks, and the row or column layout used by the implementation.", "Trace semantics, trigger, plan, and layout."
  )
};

const CORE_SLIDE_NUMBERS = Object.entries(PAGES)
  .filter(([, page]) => page.priority === "core")
  .map(([number]) => Number(number));

function enrich() {
  const set = JSON.parse(fs.readFileSync(SLIDE_FILE, "utf8"));
  if (!Array.isArray(set.slides) || set.slides.length !== Object.keys(PAGES).length) throw new Error("Lec4 slide extraction does not contain 42 pages");
  set.lessonIds = ["dsa5208-spark"];
  set.coreSlideNumbers = CORE_SLIDE_NUMBERS;
  set.source = {
    ...set.source,
    sourceId: SOURCE_ID,
    sourceType: "lecture",
    pageCount: set.slides.length,
    fileName: "Lec4.pdf",
    access: "local-only",
    assetPolicy: "page-renders-only",
    courseCodePrintedOnSlide: "DSA5208",
    atlasCourseId: "DSA5208",
    sha256: "4185b4779dbed01d5121adde196b4ad7de41c4a4c2f0dbeeb25d84a5bad47519"
  };
  for (const slide of set.slides) {
    const page = PAGES[slide.slideNumber];
    if (!page) throw new Error(`Missing Lec4 study layer for page ${slide.slideNumber}`);
    delete slide.studyPriority;
    slide.assetPath = `assets/nus/dsa5208/lec4/page-${String(slide.slideNumber).padStart(2, "0")}.jpg`;
    slide.sourceRef = { sourceId: SOURCE_ID, sourceType: "lecture", page: slide.slideNumber, role: page.label, status: "current" };
    slide.title = page.title;
    slide.explanation = {
      whatYouSee: `${page.title} shows ${page.see}.`,
      whyItMatters: `${page.why}. This page is the source evidence for that distinction.`,
      intuition: page.intuition,
      technicalDetail: page.technical,
      pitfall: page.pitfall,
      connection: page.connection
    };
    slide.socraticQuestions = [{ type: page.label, prompt: page.prompt, answer: page.answer, hint: page.hint }];
    slide.kind = "lecture-source";
    slide.status = "reviewed";
    slide.lecturePriority = page.priority;
  }
  fs.writeFileSync(SLIDE_FILE, `${JSON.stringify(set, null, 2)}\n`);
  console.log(`DSA5208 LEC4 ENRICHMENT GREEN · ${set.slides.length} pages · ${CORE_SLIDE_NUMBERS.length} core`);
  return set;
}

if (require.main === module) enrich();

module.exports = { CORE_SLIDE_NUMBERS, PAGES, enrich };
