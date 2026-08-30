/* Browser composition root. Resolve every runtime dependency here, then start
 * the application shell with an explicit dependency graph. */
(function (root) {
  "use strict";

  function required(name) {
    const value = root[name];
    if (typeof value !== "function") throw new Error(`${name} is not configured`);
    return value;
  }

  const transportFactory = required("ATLAS_CONTENT_TRANSPORT");
  const repositoryFactory = required("ATLAS_CONTENT_REPOSITORY");
  const storeFactory = required("ATLAS_STUDY_STORE_FACTORY");
  const syncClientFactory = required("ATLAS_SYNC_CLIENT_FACTORY");
  const componentsFactory = required("ATLAS_COMPONENTS_FACTORY");
  const nusUiFactory = required("ATLAS_NUS_UI_FACTORY");
  const appShellFactory = required("ATLAS_APP_SHELL_FACTORY");

  const transport = transportFactory({ roots: ["content/", "dist/content/"] });
  root.ATLAS_CONTENT_READY = transport.loadManifest().then(manifest => {
    const schedules = Object.fromEntries((manifest.courses || [])
      .map(course => [course.code, course.schedule])
      .filter(([, schedule]) => schedule));
    const repository = repositoryFactory({
      catalog: manifest,
      transport,
      sourceTypes: manifest.sourceTypes,
      schedule: schedules
    });
    const store = storeFactory({ storage: root.localStorage });
    const syncClient = syncClientFactory({
      storage: root.localStorage,
      sessionStorage: root.sessionStorage,
      endpoint: (root.document.querySelector("meta[name='atlas-sync-endpoint']") || {}).content || "",
      studyStore: store
    });
    store.setSyncScheduler(syncClient.schedule);
    const components = componentsFactory({
      repository,
      store,
      labRegistry: root.ATLAS_LAB_REGISTRY
    });
    const features = {
      presentation: root.ATLAS_PRESENTATION,
      examSchedule: root.ATLAS_EXAM_SCHEDULE_FEATURE,
      planner: root.ATLAS_PLANNER_FEATURE,
      exam: root.ATLAS_EXAM_FEATURE,
      examSelection: root.ATLAS_EXAM_SELECTION,
      examSession: root.ATLAS_EXAM_SESSION,
      examGenerators: root.ATLAS_EXAM_GENERATORS,
      examRenderer: root.ATLAS_EXAM_RENDERER,
      dsa5101Generators: root.ATLAS_DSA5101_GENERATORS,
      assessmentMap: root.ATLAS_ASSESSMENT_MAP_FEATURE,
      retrieval: root.ATLAS_RETRIEVAL_FEATURE,
      retrievalGrader: root.ATLAS_RETRIEVAL_GRADER,
      contrastDrills: root.ATLAS_CONTRAST_DRILLS_FEATURE,
      sql: root.ATLAS_SQL_FEATURE,
      simulations: root.ATLAS_SIMULATIONS_FEATURE,
      readingTimer: root.ATLAS_READING_TIMER,
      slideReader: root.ATLAS_SLIDE_READER_FEATURE,
      textbookReader: root.ATLAS_TEXTBOOK_READER_FEATURE,
      routeTable: root.ATLAS_ROUTE_TABLE,
      components,
      nusUI: nusUiFactory
    };

    root.ATLAS_APP_READY = appShellFactory({
      window: root,
      document: root.document,
      root: root.document.getElementById("app"),
      repository,
      store,
      router: root.ATLAS_ROUTER,
      accessGate: root.ATLAS_ACCESS_GATE,
      accessReady: root.ATLAS_ACCESS_READY,
      syncUi: root.ATLAS_SYNC_UI,
      syncClient,
      features
    });
    return repository;
  }).catch(error => {
    root.ATLAS_CONTENT_ERROR = error;
    const app = root.document && root.document.getElementById("app");
    if (app) app.innerHTML = `<section class="empty-state"><h1>Atlas content unavailable</h1><p>${String(error.message || "Refresh to try again.").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]))}</p></section>`;
    throw error;
  });
})(typeof window === "object" ? window : globalThis);
