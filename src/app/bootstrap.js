/* Composition root for the canonical content runtime. */
(function (root) {
  "use strict";
  const transportFactory = root.ATLAS_CONTENT_TRANSPORT;
  const repositoryFactory = root.ATLAS_CONTENT_REPOSITORY;
  if (typeof transportFactory !== "function" || typeof repositoryFactory !== "function") {
    root.ATLAS_CONTENT_READY = Promise.reject(new Error("Canonical content runtime is not installed"));
    return;
  }
  const transport = transportFactory({ roots: ["content/", "dist/content/"] });
  root.ATLAS_CONTENT_READY = transport.loadManifest().then(manifest => {
    const schedules = Object.fromEntries((manifest.courses || []).map(course => [course.code, course.schedule]).filter(([, schedule]) => schedule));
    const repository = repositoryFactory({ catalog: manifest, transport, sourceTypes: manifest.sourceTypes, schedule: schedules });
    root.ATLAS_REPOSITORY = repository;
    root.ATLAS_CONTENT_TRANSPORT_INSTANCE = transport;
    return repository;
  }).catch(error => {
    root.ATLAS_CONTENT_ERROR = error;
    throw error;
  });
})(typeof window === "object" ? window : globalThis);
