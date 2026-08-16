const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const createAssessmentMapFeature = require("../src/features/nus/assessment-map.js");

function loadMap() {
  return JSON.parse(fs.readFileSync("content/courses/DSA5105/assessment-map.json", "utf8"));
}

test("DSA5105 assessment map covers the declared evidence graph", () => {
  const map = loadMap();
  const evidenceIds = new Set(map.evidence.map(item => item.id));
  const topicIds = new Set(map.topics.map(item => item.id));
  assert.equal(map.schemaVersion, "nus.assessment-map.v1");
  assert.ok(map.topics.length >= 10);
  assert.ok(map.evidence.some(item => item.evidenceLevel === "local-exam"));
  assert.ok(map.evidence.some(item => item.kind === "homework"));
  assert.ok(map.evidence.some(item => item.kind === "midterm"));
  map.topics.forEach(topic => {
    assert.ok(topic.lessonIds.length > 0, topic.id);
    topic.evidenceIds.forEach(id => assert.ok(evidenceIds.has(id), topic.id + " -> " + id));
  });
  map.studyOrder.forEach(lane => lane.topicIds.forEach(id => assert.ok(topicIds.has(id), lane.id + " -> " + id)));
});

test("assessment map feature renders lesson and evidence links", () => {
  const map = loadMap();
  const filter = { handler: null, addEventListener(_type, handler) { this.handler = handler; } };
  const topics = { innerHTML: "" };
  const root = {
    innerHTML: "",
    querySelector(selector) {
      if (selector === "#nus-assessment-map-filter") return filter;
      if (selector === "#nus-assessment-map-topics") return topics;
      return null;
    }
  };
  const feature = createAssessmentMapFeature({
    root,
    getAssessmentMap: () => map,
    getLessons: () => [{ id: "dsa5105-svm-dual-kkt", title: "SVM duality" }],
    pageHead: (_kicker, title) => "<h1>" + title + "</h1>",
    sourceItem: ref => "<span>" + ref.sourceId + "</span>",
    text: value => String(value || ""),
    esc: value => String(value || ""),
    button: (label, href) => '<a href="' + href + '">' + label + "</a>",
    notFound() {}
  });

  feature.render("DSA5105");

  assert.match(root.innerHTML, /Study what has actually been tested/);
  assert.match(root.innerHTML, /SVM duality/);
  assert.match(root.innerHTML, /Open public preview/);
  filter.value = "homework";
  filter.handler({ target: filter });
  assert.match(topics.innerHTML, /Homework/);
});
