/* Static JSON transport for the compiled content artifact. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_CONTENT_TRANSPORT = factory;
})(typeof globalThis === "object" ? globalThis : this, function createContentTransport(options) {
  const config = options || {};
  const fetcher = config.fetcher || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
  const roots = config.roots || ["content/", "dist/content/"];
  let manifestPromise = null;
  let activeRoot = roots[0];
  const jsonCache = new Map();

  if (!fetcher) throw new Error("A fetch implementation is required for content transport");

  async function requestJson(url) {
    if (jsonCache.has(url)) return jsonCache.get(url);
    const response = await fetcher(url, { headers: { accept: "application/json" } });
    if (!response || !response.ok) throw new Error(`Content request failed (${response && response.status || "network"}): ${url}`);
    const value = await response.json();
    jsonCache.set(url, value);
    return value;
  }

  async function loadManifest() {
    if (manifestPromise) return manifestPromise;
    manifestPromise = (async () => {
      let lastError = null;
      for (const root of roots) {
        try {
          const value = await requestJson(`${root.replace(/\/$/, "")}/manifest.json`);
          activeRoot = root.replace(/\/$/, "");
          return value;
        }
        catch (error) { lastError = error; }
      }
      throw lastError || new Error("Compiled content manifest is unavailable");
    })();
    return manifestPromise;
  }

  function assetUrl(asset) {
    if (/^(?:https?:)?\//.test(asset)) return asset;
    return `${activeRoot}/${String(asset).replace(/^\//, "")}`;
  }

  async function entryFor(courseId) {
    const manifest = await loadManifest();
    return (manifest.courses || []).find(course => course.code === courseId) || null;
  }

  async function loadCourse(courseId) {
    const entry = await entryFor(courseId);
    if (!entry) return null;
    const outline = await requestJson(assetUrl(entry.outline));
    const courseData = await requestJson(assetUrl(entry.courseAsset));
    return { ...courseData, outline, content: { modules: outline.modules || [] } };
  }

  async function loadLesson(courseId, lessonId) {
    const entry = await entryFor(courseId);
    if (!entry || !entry.lessonAssets || !entry.lessonAssets[lessonId]) return null;
    const payload = await requestJson(assetUrl(entry.lessonAssets[lessonId]));
    const questions = entry.questionAssets && entry.questionAssets[lessonId]
      ? await requestJson(assetUrl(entry.questionAssets[lessonId]))
      : { questions: [] };
    const studyKit = entry.studyKitAssets && entry.studyKitAssets[lessonId]
      ? await requestJson(assetUrl(entry.studyKitAssets[lessonId]))
      : null;
    return { lesson: payload.lesson || payload, questions: questions.questions || [], studyKit };
  }

  return Object.freeze({ loadManifest, entryFor, loadCourse, loadLesson });
});
