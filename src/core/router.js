/* Small, framework-free route lifecycle for the Atlas SPA.
 * Rendering stays in feature modules; this boundary owns hash parsing and the
 * before/route/after lifecycle so the app shell does not own route selection. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_ROUTER = factory;
})(typeof globalThis === "object" ? globalThis : this, function createAtlasRouter(config) {
  const options = config || {};
  const location = options.location || (typeof globalThis === "object" ? globalThis.location : null);

  function parseHash(hash) {
    return String(hash || "#/" ).slice(1).split("/").filter(Boolean);
  }

  function navigate(input) {
    const parts = Array.isArray(input) ? input.slice() : parseHash(location && location.hash);
    if (typeof options.beforeRoute === "function") options.beforeRoute(parts);
    let result;
    try {
      result = typeof options.renderRoute === "function" ? options.renderRoute(parts) : undefined;
    } finally {
      if (typeof options.afterRoute === "function") options.afterRoute(parts, result);
    }
    return result;
  }

  return Object.freeze({ parseHash, navigate });
});
