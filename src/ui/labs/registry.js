/* Small plugin registry shared by canonical DSA visual-learning labs. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_LAB_REGISTRY = factory;
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
