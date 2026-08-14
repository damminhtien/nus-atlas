/* NUS study layer — AY2026/27 Semester 1 snapshot.
   Raw PDFs, Canvas exports, images, textbooks, and personal documents stay outside this repo. */
(function () {
  "use strict";
  window.NUS_CONTENT = window.NUS_CONTENT || {};
  window.NUS_SOURCE_POLICY = {
    rawDataRoot: "local/NUS",
    allowlist: ["DSA5101", "DSA5104", "DSA5105", "DSA5208"],
    publicBundle: "normalized notes, question metadata, source/page references, and derived visual observations only",
    excluded: ["admission", "application", "passport", "medical", "identity documents", "raw textbooks", "raw lecture PDFs"],
    sourceTypes: window.NUS_SOURCE_TYPES
  };
  window.NUS_COURSES = [
    {
      code: "DSA5101", title: "Introduction to Big Data for Industry", semester: "AY2026/27 · Semester 1", color: "#d68b43",
      description: "Big-data foundations: collection, cleaning, frequent patterns, search, recommendation, streams, and scalable ML practice.", prerequisites: [],
      workload: [3, 0, 1, 3, 3], department: "Mathematics", faculty: "Science",
      nusmods: { url: "https://nusmods.com/courses/DSA5101/introduction-to-big-data-for-industry", apiModule: "https://api.nusmods.com/v2/2026-2027/modules/DSA5101.json", apiSemester: "https://api.nusmods.com/v2/2026-2027/semesters/1/DSA5101/semesterData.json" },
      localSources: ["DSA5101/DSA5101 Course Information.pdf", "DSA5101/Lec1 - Assoc Rules, Frequent itemsets.pdf", "DSA5101/Assignments/DSA5101_Assignment_1.pdf", "DSA5101/Assignments/DSA5101_Assignment_2.pdf"]
    },
    {
      code: "DSA5104", title: "Principles of Data Management and Retrieval", semester: "AY2026/27 · Semester 1", color: "#4f9b84",
      description: "Database models, relational design, SQL, semi-structured data, data integration, Spark SQL, and retrieval-oriented data systems.", prerequisites: ["DSA5101"],
      workload: [3, 0, 0, 3, 4], department: "Mathematics", faculty: "Science",
      nusmods: { url: "https://nusmods.com/courses/DSA5104/principles-of-data-management-and-retrieval", apiModule: "https://api.nusmods.com/v2/2026-2027/modules/DSA5104.json", apiSemester: "https://api.nusmods.com/v2/2026-2027/semesters/1/DSA5104/semesterData.json" },
      localSources: ["DSA5104/chapter1.pdf", "DSA5104/chapter1_appendix_codex.pdf", "DSA5104/Homework Solutions/Ch06 ER", "DSA5104/chapter1_appendix_codex_data_analytics/reports/codex_data_analysis.pptx"]
    },
    {
      code: "DSA5105", title: "Principles of Machine Learning", semester: "AY2026/27 · Semester 1", color: "#8d68ad",
      description: "Learning theory and practice: ERM, linear and kernel methods, SVM, unsupervised learning, RL, spectral methods, and GNNs.", prerequisites: ["DSA5101"],
      workload: [3, 0, 0, 2, 5], department: "Mathematics", faculty: "Science",
      nusmods: { url: "https://nusmods.com/courses/DSA5105/principles-of-machine-learning", apiModule: "https://api.nusmods.com/v2/2026-2027/modules/DSA5105.json", apiSemester: "https://api.nusmods.com/v2/2026-2027/semesters/1/DSA5105/semesterData.json" },
      localSources: ["DSA5105/syllabus.pdf", "DSA5105/Lec1.pdf", "DSA5105/Ref/week1_DSA5105_lecture1_with_note.pdf", "DSA5105/Lec1_exercises.pdf", "DSA5105/Lec1_exercises-solutions.pdf", "DSA5105/Textbook.pdf", "DSA5105/Ref/DSA5105_Syllabus.pdf", "DSA5105/Ref/document.pdf"],
      lectureSources: window.NUS_DSA5105_SOURCES.lecture,
      textbookSources: window.NUS_DSA5105_SOURCES.textbook,
      referenceSources: window.NUS_DSA5105_SOURCES.ref,
      sourceNote: "The local Lec1.pdf cover visibly says DSA5102; folder and current syllabus context identify this study source as DSA5105. Verify before citing the slide title."
    },
    {
      code: "DSA5208", title: "Scalable Distributed Computing for Data Science", semester: "AY2026/27 · Semester 1", color: "#4787b5",
      description: "Distributed systems, time and ordering, consistency, Apache Spark, scalable algorithms, MLlib, GPU, and cloud workflows.", prerequisites: ["DSA5101"],
      workload: [3, 0, 0, 3, 4], department: "Mathematics", faculty: "Science",
      nusmods: { url: "https://nusmods.com/courses/DSA5208/scalable-distributed-computing-for-data-science", apiModule: "https://api.nusmods.com/v2/2026-2027/modules/DSA5208.json", apiSemester: "https://api.nusmods.com/v2/2026-2027/semesters/1/DSA5208/semesterData.json" },
      localSources: ["DSA5208/Lec0.pdf", "DSA5208/Lec1.pdf"]
    }
  ];
  window.NUS_CATALOG_META = {
    academicYear: "2026-2027", semester: 1, timezone: "Asia/Singapore",
    fetchedAt: "2026-08-14",
    source: "NUSMods static API snapshot; verify dates against NUS announcements before relying on them."
  };
})();
