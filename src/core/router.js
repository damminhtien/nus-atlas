/* Small, framework-free route lifecycle for the Atlas SPA.
 * Rendering stays in feature modules; this boundary owns hash parsing and the
 * before/route/after lifecycle so the app shell does not own route selection. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_ROUTER = factory;
})(typeof globalThis === "object" ? globalThis : this, function createAtlasRouter(config) {
  const options = config || {};
  const location = options.location || (typeof globalThis === "object" ? globalThis.location : null);
  let navigationId = 0;

  function parseHash(hash) {
    return String(hash || "#/" ).slice(1).split("/").filter(Boolean);
  }

  function navigate(input) {
    const parts = Array.isArray(input) ? input.slice() : parseHash(location && location.hash);
    const id = ++navigationId;
    const context = Object.freeze({ id, isCurrent: () => id === navigationId });
    if (typeof options.beforeRoute === "function") options.beforeRoute(parts, context);
    let result;
    try {
      result = typeof options.renderRoute === "function" ? options.renderRoute(parts, context) : undefined;
    } catch (error) {
      if (typeof options.afterRoute === "function" && context.isCurrent()) options.afterRoute(parts, undefined, { ...context, error });
      throw error;
    }
    if (!result || typeof result.then !== "function") {
      if (typeof options.afterRoute === "function" && context.isCurrent()) options.afterRoute(parts, result, context);
      return result;
    }
    return Promise.resolve(result).then(value => {
      if (typeof options.afterRoute === "function" && context.isCurrent()) options.afterRoute(parts, value, context);
      return value;
    }, error => {
      if (typeof options.afterRoute === "function" && context.isCurrent()) options.afterRoute(parts, undefined, { ...context, error });
      throw error;
    });
  }

  return Object.freeze({ parseHash, navigate, currentNavigation: () => navigationId });
});
