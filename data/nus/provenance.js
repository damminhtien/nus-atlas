(function () {
  "use strict";
  window.NUS_SOURCE_TYPES = {
    lecture: {
      label: "Lecture core",
      shortLabel: "Lecture",
      tone: "sage",
      priority: "Exam priority: current lecture and syllabus scope."
    },
    exercise: {
      label: "Official exercise depth",
      shortLabel: "Exercise",
      tone: "gold",
      priority: "Official exercise and solution depth; use it to prepare derivations beyond the lecture statement."
    },
    textbook: {
      label: "Textbook depth",
      shortLabel: "Textbook",
      tone: "violet",
      priority: "Derivation and background depth; confirm examinability against lecture."
    },
    ref: {
      label: "Reference / optional",
      shortLabel: "Reference",
      tone: "gold",
      priority: "Optional support or advanced reading; not assumed to be lecture scope."
    }
  };

  window.NUS_DSA5105_SOURCES = {
    lecture: [
      { sourceId: "DSA5105/syllabus.pdf", sourceType: "lecture", role: "current syllabus", status: "current" },
      { sourceId: "DSA5105/Lec1_annotated.pdf", sourceType: "lecture", role: "canonical annotated Week 1 lecture", status: "current" },
      { sourceId: "DSA5105/Lec1.pdf", sourceType: "lecture", role: "unannotated Week 1 comparison copy", status: "comparison" },
      { sourceId: "DSA5105/Ref/week1_DSA5105_lecture1_with_note.pdf", sourceType: "lecture", role: "alternate Week 1 annotated export", status: "comparison" }
    ],
    exercise: [
      { sourceId: "DSA5105/Lec1_exercises.pdf", sourceType: "exercise", role: "Week 1 official exercise sheet", status: "current-context" },
      { sourceId: "DSA5105/Lec1_exercises-solutions.pdf", sourceType: "exercise", role: "Week 1 official worked solutions", status: "current-context" }
    ],
    textbook: [
      { sourceId: "DSA5105/Textbook.pdf", sourceType: "textbook", role: "course textbook", status: "course-depth" }
    ],
    ref: [
      { sourceId: "DSA5105/Ref/Understanding_Machine_Learning_From_Theory_to_Algorithms.pdf", sourceType: "ref", role: "optional PAC and learning-theory depth", status: "optional" },
      { sourceId: "DSA5105/Ref/Mathematics_of_Data_Science.pdf", sourceType: "ref", role: "optional PCA and high-dimensional depth", status: "draft" },
      { sourceId: "DSA5105/Ref/Chapter3_Graph_Neural_Networks.pdf", sourceType: "ref", role: "optional GNN reading", status: "optional" },
      { sourceId: "DSA5105/Ref/Reinforcement_Learning_an_Introduction.pdf", sourceType: "ref", role: "optional RL reading", status: "optional" },
      { sourceId: "DSA5105/Ref/DSA5105_Practice_Problems_1_Not_Graded.pdf", sourceType: "ref", role: "optional practice problems", status: "optional" },
      { sourceId: "DSA5105/Ref/DSA5105_Syllabus.pdf", sourceType: "ref", role: "Fall 2025 schedule context", status: "historical-context" },
      { sourceId: "DSA5105/Ref/document.pdf", sourceType: "ref", role: "local past-exam alignment", status: "assessment-derived" }
    ]
  };
})();
