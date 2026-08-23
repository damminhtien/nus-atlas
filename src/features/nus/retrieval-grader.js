/* Thin client for the external answer-grading service. The Google key stays on
 * the service; this browser client only sends a question and one answer. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_RETRIEVAL_GRADER = factory;
})(typeof globalThis === "object" ? globalThis : this, function createRetrievalGrader(config) {
  const options = config || {};
  const endpoint = options.endpoint || (typeof document === "object" && (document.querySelector("meta[name='atlas-grader-endpoint']") || {}).content) || "";
  const fetchImpl = options.fetchImpl || (typeof fetch === "function" ? fetch.bind(globalThis) : null);

  async function grade(payload) {
    if (!endpoint || !fetchImpl) throw new Error("External grader is not configured");
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 12000) : null;
    try {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        ...(controller ? { signal: controller.signal } : {})
      });
      if (!response.ok) throw new Error(`External grader returned ${response.status}`);
      const result = await response.json();
      if (!result || typeof result.correct !== "boolean") throw new Error("External grader returned an invalid result");
      return {
        correct: result.correct,
        score: Number.isFinite(Number(result.score)) ? Math.min(1, Math.max(0, Number(result.score))) : null,
        feedback: String(result.feedback || "")
      };
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  return Object.freeze({ endpoint, grade });
});
