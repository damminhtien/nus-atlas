/* Small plugin registry shared by visual-learning labs.
 * Renderers stay in the legacy-compatible component file for now; the registry
 * gives them a stable boundary so each renderer can move to its own module later.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.NUS_LAB_REGISTRY = factory;
})(typeof globalThis === "object" ? globalThis : this, function createLabRegistry() {
  const renderers = Object.create(null);
  return Object.freeze({
    register(type, renderer) {
      if (!type || typeof renderer !== "function") throw new TypeError("A lab renderer needs a type and function");
      if (renderers[type]) throw new Error(`Lab renderer already registered: ${type}`);
      renderers[type] = renderer;
      return this;
    },
    get(type) { return renderers[type] || null; },
    has(type) { return typeof renderers[type] === "function"; },
    types() { return Object.keys(renderers); }
  });
});
