const test = require("node:test");
const assert = require("node:assert/strict");
const createSlideReaderFeature = require("../src/features/nus/slide-reader.js");

function makeRoot() {
  return {
    innerHTML: "",
    querySelector: () => ({ addEventListener() {} }),
    querySelectorAll: () => []
  };
}

test("slide reader keeps source collapsed and resolves textbook annotations", () => {
  const root = makeRoot();
  const feature = createSlideReaderFeature({
    root,
    getCourse: () => ({ code: "DSA5105" }),
    getSlideSet: () => ({
      courseId: "DSA5105",
      id: "week1",
      summary: "Week 1",
      lessonIds: ["dsa5105-erm"],
      source: { fileName: "Lecture.pdf", sourceId: "lecture.pdf", access: "local-only" },
      slides: [{
        slideNumber: 1,
        pdfPage: 1,
        title: "Learning setup",
        kind: "lecture",
        status: "reviewed",
        assetPath: "slide.jpg",
        sourceRef: { sourceId: "lecture.pdf", sourceType: "lecture", page: 1 },
        extraction: { blocks: [] },
        explanation: {
          whatYouSee: "A training set maps inputs to labels.",
          whyItMatters: "This defines the supervised learning problem."
        },
        textbookRefs: [{ sourceId: "Textbook.pdf", sourceType: "textbook", page: 13, role: "depth" }],
        referenceRefs: [],
        socraticQuestions: [{ type: "recall", prompt: "What is the target relationship?", hint: "Start with x and y.", answer: "Learn a mapping from inputs to outputs." }]
      }]
    }),
    getTextbook: () => ({
      chapters: [{
        number: "2",
        title: "Supervised Learning",
        pageStart: 10,
        pageEnd: 80,
        sections: [{ number: "2.2", title: "Linear Models", pageStart: 13, pageEnd: 17 }]
      }]
    }),
    pageHead: (_kicker, title) => `<h1>${title}</h1>`,
    sourceBadge: ref => `<span>${ref.sourceType || "source"}</span>`,
    sourceItem: ref => ref.sourceId,
    button: (label, href) => `<a href="${href}">${label}</a>`,
    text: value => String(value || ""),
    esc: value => String(value || ""),
    typeset() {},
    notFound() {}
  });

  feature.render("DSA5105", "week1", 1);

  assert.match(root.innerHTML, /nus-slide-source-panel/);
  assert.doesNotMatch(root.innerHTML, /<details[^>]+open/);
  assert.match(root.innerHTML, /Supervised Learning/);
  assert.match(root.innerHTML, /Linear Models/);
  assert.match(root.innerHTML, /Dynamic Atlas annotation/);
  assert.match(root.innerHTML, /Practice lesson/);
});
