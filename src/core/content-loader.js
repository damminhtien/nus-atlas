/* Browser loader for generated per-course content bundles.
 * The manifest is metadata-only; a bundle is fetched only when a course route
 * needs it. The loader returns the same package shape used by ContentRepository.
 */
(function (root) {
  "use strict";
  const pending = Object.create(null);

  function manifestEntry(courseId) {
    const packages = root.NUS_CONTENT_PACKAGES || {};
    if (packages[courseId]) return packages[courseId];
    const manifest = root.NUS_CONTENT_MANIFEST || {};
    return (manifest.courses || []).find(course => course.code === courseId) || null;
  }

  function load(courseId) {
    const current = root.NUS_CONTENT_PACKAGES && root.NUS_CONTENT_PACKAGES[courseId];
    if (current && current.content) return Promise.resolve(current);
    if (pending[courseId]) return pending[courseId];
    const entry = manifestEntry(courseId);
    if (!entry || !entry.asset || !root.document || typeof root.document.createElement !== "function") return Promise.resolve(null);
    pending[courseId] = new Promise((resolve, reject) => {
      const script = root.document.createElement("script");
      const separator = entry.asset.includes("?") ? "&" : "?";
      script.src = `${entry.asset}${separator}v=${encodeURIComponent(entry.version || entry.schemaVersion || "1")}`;
      script.onload = () => {
        const packageData = root.NUS_CONTENT_PACKAGES && root.NUS_CONTENT_PACKAGES[courseId];
        if (packageData && packageData.content) resolve(packageData);
        else reject(new Error(`Course bundle did not register: ${courseId}`));
        delete pending[courseId];
      };
      script.onerror = () => { delete pending[courseId]; reject(new Error(`Could not load course bundle: ${courseId}`)); };
      (root.document.head || root.document.body || root.document.documentElement).appendChild(script);
    });
    return pending[courseId];
  }

  root.NUS_CONTENT_PACKAGE_LOADER = Object.freeze({ load });
})(typeof window === "object" ? window : globalThis);
