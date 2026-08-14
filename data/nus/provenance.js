(function () {
  "use strict";
  window.NUS_SOURCE_TYPES = {
    lecture: {
      label: "Lecture core",
      shortLabel: "Lecture",
      tone: "sage",
      priority: "Exam priority: current lecture and syllabus scope."
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
      { sourceId: "DSA5105/Lec1.pdf", sourceType: "lecture", role: "local lecture slides", status: "current-context" },
      { sourceId: "DSA5105/Exe1.pdf", sourceType: "lecture", role: "lecture exercise", status: "current" },
      { sourceId: "DSA5105/Exe1_with_solutions.pdf", sourceType: "lecture", role: "worked lecture exercise", status: "current" }
    ],
    textbook: [
      { sourceId: "DSA5105/Textbook.pdf", sourceType: "textbook", role: "course textbook", status: "course-depth" }
    ],
    ref: [
      { sourceId: "DSA5105/Ref/Understanding_Machine_Learning_From_Theory_to_Algorithms.pdf", sourceType: "ref", role: "optional PAC and learning-theory depth", status: "optional" },
      { sourceId: "DSA5105/Ref/Mathematics_of_Data_Science.pdf", sourceType: "ref", role: "optional PCA and high-dimensional depth", status: "draft" },
      { sourceId: "DSA5105/Ref/Chapter3_Graph_Neural_Networks.pdf", sourceType: "ref", role: "optional GNN reading", status: "optional" },
      { sourceId: "DSA5105/Ref/Reinforcement_Learning_an_Introduction.pdf", sourceType: "ref", role: "optional RL reading", status: "optional" },
      { sourceId: "DSA5105/Ref/DSA5105_Practice_Problems_1_Not_Graded.pdf", sourceType: "ref", role: "optional practice problems", status: "optional" }
    ]
  };
})();
