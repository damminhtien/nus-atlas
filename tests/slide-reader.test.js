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
      coreSlideNumbers: [1],
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
        keyFormula: { name: "Training-set model", latex: "\\mathcal D=\\{(x_i,y_i)\\}", purpose: "Use it to keep observed examples separate from the unknown target rule." },
        textbookRefs: [{ sourceId: "Textbook.pdf", sourceType: "textbook", page: 13, role: "depth" }],
        referenceRefs: [],
        socraticQuestions: [{ type: "recall", prompt: "What is the target relationship?", hint: "Start with x and y.", answer: "Learn a mapping from inputs to outputs." }]
      }, {
        slideNumber: 2,
        pdfPage: 2,
        title: "Hypothesis space",
        kind: "lecture",
        status: "reviewed",
        assetPath: "slide-02.jpg",
        sourceRef: { sourceId: "lecture.pdf", sourceType: "lecture", page: 2 },
        extraction: { blocks: [] },
        explanation: { whatYouSee: "A hypothesis space limits the functions we can choose." },
        textbookRefs: [],
        referenceRefs: [],
        socraticQuestions: []
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
    notFound() {},
    readingTimer: { render: () => '<aside class="nus-reading-timer">timer</aside>', bind() {} }
  });

  feature.render("DSA5105", "week1", 1);

  assert.match(root.innerHTML, /nus-slide-source-panel/);
  assert.match(root.innerHTML, /nus-slide-reader-page/);
  assert.doesNotMatch(root.innerHTML, /<details[^>]+open/);
  assert.match(root.innerHTML, /Supervised Learning/);
  assert.match(root.innerHTML, /Linear Models/);
  assert.match(root.innerHTML, /Dynamic Atlas annotation/);
  assert.match(root.innerHTML, /Training-set model/);
  assert.match(root.innerHTML, /Use it for/);
  assert.match(root.innerHTML, /Textbook reading lens/);
  assert.doesNotMatch(root.innerHTML, /nus-socratic-checkpoint/);
  assert.match(root.innerHTML, /nus-slide-focus-bar/);
  assert.match(root.innerHTML, /data-slide-nav="next"/);
  assert.match(root.innerHTML, /data-slide-number="1"/);
  assert.doesNotMatch(root.innerHTML, /nus-slide-socratic/);
  assert.match(root.innerHTML, /slide 1/);
  assert.match(root.innerHTML, /Practice lesson/);
  assert.match(root.innerHTML, /Focus reading/);
  assert.match(root.innerHTML, /<kbd>F<\/kbd>/);
  assert.match(root.innerHTML, /nus-reading-timer/);
  assert.match(root.innerHTML, /Core slide/);
});

test("slide reader shows saved progress and a resume action", () => {
  const root = makeRoot();
  const saved = {
    resourceId: "slide:DSA5105:week1",
    kind: "slide",
    courseCode: "DSA5105",
    position: 2,
    furthest: 2,
    total: 4,
    completed: false
  };
  const calls = [];
  const feature = createSlideReaderFeature({
    root,
    getCourse: () => ({ code: "DSA5105" }),
    getSlideSet: () => ({
      courseId: "DSA5105",
      id: "week1",
      summary: "Week 1",
      lessonIds: [],
      source: { fileName: "Lecture.pdf", sourceId: "lecture.pdf", access: "local-only" },
      slides: [1, 2, 3, 4].map(slideNumber => ({
        slideNumber,
        pdfPage: slideNumber,
        title: `Slide ${slideNumber}`,
        kind: "lecture",
        status: "reviewed",
        assetPath: `slide-${slideNumber}.jpg`,
        sourceRef: { sourceId: "lecture.pdf", sourceType: "lecture", page: slideNumber },
        extraction: { blocks: [] },
        explanation: { whatYouSee: "A claim." },
        textbookRefs: [],
        referenceRefs: [],
        socraticQuestions: []
      }))
    }),
    getTextbook: () => null,
    getStore: () => ({
      readingFor: id => id === "slide:DSA5105:week1" ? saved : null,
      recordReading: input => { calls.push(input); Object.assign(saved, input, { furthest: Math.max(saved.furthest, input.position) }); return saved; }
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

  assert.equal(calls[0].position, 1);
  assert.match(root.innerHTML, /Lecture reading progress/);
  assert.match(root.innerHTML, /Continue from slide 2/);
  assert.match(root.innerHTML, /through slide 2 of 4/);
  assert.match(root.innerHTML, /Lecture reading progress colour key/);
  assert.match(root.innerHTML, /50–74% · Halfway/);
});
