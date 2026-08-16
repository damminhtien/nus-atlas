const test = require("node:test");
const assert = require("node:assert/strict");
const createTextbookReader = require("../src/features/nus/textbook-reader.js");

function makeRoot() {
  return { innerHTML: "", querySelector: () => ({ addEventListener() {} }) };
}

test("textbook reader stays PDF-first and keeps Atlas annotations out", () => {
  const root = makeRoot();
  const recorded = [];
  const feature = createTextbookReader({
    root,
    getCourse: () => ({ code: "DSA5105" }),
    getTextbook: () => ({
      pageCount: 129,
      source: { sourceId: "DSA5105/Textbook.pdf", sourceType: "textbook", role: "course textbook" },
      reader: { assetRoot: "assets/nus/dsa5105/textbook", assetPattern: "page-{page}.jpg", pageNumberPadding: 3 },
      chapters: [{ number: "2", title: "Supervised Learning", pageStart: 10, pageEnd: 80, sections: [] }]
    }),
    getStore: () => ({ readingFor: () => null, recordReading: value => recorded.push(value) }),
    pageHead: (_kicker, title, desc) => `<h1>${title}</h1><p>${desc}</p>`,
    sourceBadge: ref => `<span>${ref.sourceType}</span>`,
    button: (label, href) => `<a href="${href}">${label}</a>`,
    text: value => String(value || ""),
    esc: value => String(value || ""),
    notFound() {}
  });

  feature.render("DSA5105", 18);

  assert.match(root.innerHTML, /nus-textbook-reader-page/);
  assert.match(root.innerHTML, /PDF page 18/);
  assert.match(root.innerHTML, /assets\/nus\/dsa5105\/textbook\/page-018\.jpg/);
  assert.match(root.innerHTML, /Read the supplied textbook as a page-faithful PDF view/);
  assert.doesNotMatch(root.innerHTML, /Atlas layer/);
  assert.equal(recorded[0].position, 18);
});
