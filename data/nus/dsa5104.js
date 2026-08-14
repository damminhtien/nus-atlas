(function () {
  "use strict";
  const source = (sourceId, page) => ({ sourceId, page });
  window.NUS_CONTENT.DSA5104 = {
    modules: [
      { id: "dsa5104-foundations", title: "Foundations", lessons: [
        { id: "dsa5104-orientation", title: "Course map and data-management workflow", week: 1, minutes: 30, summary: "Move from data abstraction to a reproducible query and validation workflow.", objectives: ["Describe the role of a DBMS", "Separate schema from instance", "Track evidence from raw data to analysis"], sourceRefs: [source("DSA5104/chapter1.pdf", 1), source("DSA5104/chapter1.pdf", 6), source("DSA5104/chapter1_appendix_codex.pdf", 3)], visualIds: ["dsa5104-data-abstraction", "dsa5104-clean-automobile"], sections: [{ title: "Study lens", body: "Every database answer should state the model, the constraints, the query, and the validation evidence. The appendix deck is a useful example of making cleaning decisions auditable." }], questions: [
          { id: "dsa5104-o-q1", type: "mcq", prompt: "Which layer is closest to what an individual user sees?", choices: ["Physical level", "Logical level", "View level", "Storage manager"], answer: 2, explanation: "The view level presents tailored user-facing views over the logical schema." },
          { id: "dsa5104-o-q2", type: "short", prompt: "What is the difference between a database schema and an instance?", accepted: ["schema is structure and instance is data", "schema is the design and instance is the current contents", "schema structure instance contents"], solution: "The schema describes the structure/constraints; the instance is the current data stored under that schema.", explanation: "A schema changes relatively rarely; an instance changes as rows are inserted or updated." }
        ] }
      ]},
      { id: "dsa5104-models", title: "Models and design", lessons: [
        { id: "dsa5104-relational-model", title: "Relational model and ER translation", week: 2, minutes: 50, summary: "Read tables as relations, identify keys, and translate entities/relationships into a relational schema.", objectives: ["Identify attributes, tuples, and keys", "Map a one-to-many relationship", "Spot a missing integrity constraint"], sourceRefs: [source("DSA5104/chapter1.pdf", 14), source("DSA5104/Homework Solutions/Ch06 ER", 1)], visualIds: ["dsa5104-relational-model"], sections: [{ title: "Design checkpoint", body: "A relation has a schema and an instance. A primary key identifies tuples; a foreign key expresses a link to another relation. Draw the relationship before choosing columns." }], questions: [
          { id: "dsa5104-rm-q1", type: "mcq", prompt: "What does a foreign key primarily express?", choices: ["A sort order", "A reference to a candidate key in another relation", "A duplicate row", "A compressed column"], answer: 1, explanation: "A foreign key constrains values to refer to a key in a referenced relation." },
          { id: "dsa5104-rm-q2", type: "derivation", prompt: "How do you map a one-to-many relationship from Department to Student?", accepted: ["put department key as foreign key in student", "foreign key in student", "student has department_id foreign key"], solution: "Place the primary key of Department as a foreign key in Student, the many-side relation.", explanation: "The foreign key belongs on the many side for a simple one-to-many mapping." }
        ] }
      ]},
      { id: "dsa5104-sql", title: "Querying", lessons: [
        { id: "dsa5104-sql-foundations", title: "SQL foundations: select, join, group", week: 3, minutes: 55, summary: "Write queries that are explicit about rows, joins, grouping, and the meaning of NULL.", objectives: ["Filter rows before aggregation", "Join on keys rather than row position", "Explain WHERE versus HAVING"], sourceRefs: [source("DSA5104/chapter1.pdf", 23), source("DSA5104/Homework Solutions/Ch03 SQL", 1)], visualIds: [], sections: [{ title: "Query order", body: "Reason conceptually as FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. Use the SQL practice lab to run small examples against a browser-local sample database." }], questions: [
          { id: "dsa5104-sql-q1", type: "mcq", prompt: "Which clause filters groups after aggregation?", choices: ["WHERE", "ON", "HAVING", "ORDER BY"], answer: 2, explanation: "WHERE filters rows before grouping; HAVING filters grouped results." },
          { id: "dsa5104-sql-q2", type: "sql", prompt: "Write a query that returns department names with at least 2 students from Department and Student.", accepted: ["select d.name from department d join student s on s.department_id = d.id group by d.id, d.name having count(*) >= 2", "select d.name from department d join student s on s.department_id=d.id group by d.id,d.name having count(*)>=2"], solution: "SELECT d.name FROM Department d JOIN Student s ON s.department_id = d.id GROUP BY d.id, d.name HAVING COUNT(*) >= 2;", explanation: "Join on the foreign key, group by the department identity, then filter aggregate counts with HAVING." }
        ] }
      ]},
      { id: "dsa5104-modern", title: "Modern data systems", lessons: [
        { id: "dsa5104-semi-structured", title: "Semi-structured data and Spark SQL", week: 8, minutes: 45, summary: "Know when relational tables, JSON-like documents, and distributed SQL workflows fit different data shapes.", objectives: ["Recognize schema-on-read tradeoffs", "Relate DataFrame operations to SQL", "Ask a retrieval question before choosing storage"], sourceRefs: [source("DSA5104/chapter1.pdf", 5), source("DSA5104/chapter1.pdf", 7)], visualIds: [], sections: [{ title: "Tradeoff", body: "Semi-structured formats preserve nested variation but push more schema and validation work into the query pipeline. A distributed query engine changes the cost model, not the need for clear semantics." }], questions: [
          { id: "dsa5104-ms-q1", type: "mcq", prompt: "What is a common schema-on-read tradeoff?", choices: ["No validation is ever needed", "Flexibility at ingestion shifts more validation to query time", "It always uses less storage", "It removes all joins"], answer: 1, explanation: "Flexible ingestion can defer schema decisions, so consumers must validate and interpret data later." },
          { id: "dsa5104-ms-q2", type: "short", prompt: "Why should a distributed SQL plan still be inspected for data movement?", accepted: ["network shuffle is expensive", "data movement and shuffle cost", "because shuffle is expensive"], solution: "Network movement and shuffle can dominate a distributed query even when the SQL text looks simple.", explanation: "The distributed cost model adds partitioning, serialization, and network traffic." }
        ] }
      ]}
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
        { id: "sql-2", level: "Join", prompt: "Return each student with the department name.", starter: "SELECT s.name, d.name AS department\nFROM Student s\nJOIN Department d ON d.id = s.department_id\nORDER BY s.id;", expected: ["An|Data Science", "Binh|Data Science", "Chi|Computer Science", "Duc|Statistics"], explanation: "The join uses Student.department_id → Department.id." },
        { id: "sql-3", level: "Aggregation", prompt: "Find departments with at least two students.", starter: "SELECT d.name, COUNT(*) AS n\nFROM Department d\nJOIN Student s ON s.department_id = d.id\nGROUP BY d.id, d.name\nHAVING COUNT(*) >= 2;", expected: ["Data Science|2"], explanation: "HAVING filters the aggregate result after GROUP BY." },
        { id: "sql-4", level: "ER practice", prompt: "Which key pair prevents duplicate enrollments for one student and course?", starter: "-- Write the constraint in words or SQL", expected: ["primary key (student_id, course_code)", "composite primary key", "student_id, course_code"], explanation: "The composite key identifies one enrollment per student-course pair." }
      ]
    }
  };
})();
