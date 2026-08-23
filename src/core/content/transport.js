/* Static JSON transport for the compiled content artifact. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_CONTENT_TRANSPORT = factory;
})(typeof globalThis === "object" ? globalThis : this, function createContentTransport(options) {
  const config = options || {};
  const xhrFetcher = typeof XMLHttpRequest === "function" ? (url => new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.setRequestHeader("accept", "application/json");
    request.onload = () => resolve({ ok: request.status >= 200 && request.status < 300, status: request.status, json: async () => JSON.parse(request.responseText) });
    request.onerror = () => reject(new Error(`Content request failed: ${url}`));
    request.send();
  })) : null;
  const fetcher = config.fetcher || (typeof fetch === "function" ? fetch.bind(globalThis) : xhrFetcher);
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
    return { ...courseData, outline, content: { modules: outline.modules || [], collections: outline.collections || [], timelineLessonIds: outline.timelineLessonIds || [] } };
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
    const lab = payload.labAsset ? await requestJson(assetUrl(`${entry.code}/${payload.labAsset}`)) : null;
    const visuals = payload.visualAsset ? await requestJson(assetUrl(`${entry.code}/${payload.visualAsset}`)) : null;
    return { lesson: payload.lesson || payload, questions: questions.questions || [], studyKit, labs: lab && lab.labs || {}, visuals: visuals && visuals.visuals || {} };
  }

  async function loadSlides(courseId) {
    const entry = await entryFor(courseId);
    if (!entry) return [];
    const assets = entry.slideAssets || {};
    const payloads = await Promise.all(Object.entries(assets).sort(([a], [b]) => a.localeCompare(b)).map(async ([id, asset]) => {
      const payload = await requestJson(assetUrl(asset));
      return payload.slideSet || { id };
    }));
    return payloads;
  }

  async function loadTextbook(courseId) {
    const entry = await entryFor(courseId);
    if (!entry || !entry.textbookAsset) return null;
    const payload = await requestJson(assetUrl(entry.textbookAsset));
    return payload.textbook || payload;
  }

  async function loadSourceManifest(courseId) {
    const entry = await entryFor(courseId);
    if (!entry || !entry.sourceManifestAsset) return null;
    const payload = await requestJson(assetUrl(entry.sourceManifestAsset));
    return payload.sourceManifest || payload;
  }

  return Object.freeze({ loadManifest, entryFor, loadCourse, loadLesson, loadSlides, loadTextbook, loadSourceManifest });
});
