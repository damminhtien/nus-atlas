/* Route table contract for the NUS feature. It deliberately knows no renderer;
 * handlers are injected by the feature entrypoint, which keeps routing separate
 * from the app shell and makes route coverage testable without a DOM. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_ROUTE_TABLE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createNusRouteTable(handlers) {
  const routes = { ...handlers };
  return Object.freeze({
    resolve(parts) {
      const key = parts && parts.length ? parts[0] : "dashboard";
      return typeof routes[key] === "function" ? routes[key] : null;
    },
    names() { return Object.keys(routes); }
  });
});
