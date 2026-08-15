/* Browser compatibility bootstrap for the core study-store. */
(function (root) {
  "use strict";
  if (!root.NUS_STUDY_STORE) throw new Error("NUS study-store core is not loaded");
  root.NUS_STORE = root.NUS_STUDY_STORE({
    storage: root.localStorage,
    atlasStore: root.Store || null
  });
})(typeof window === "object" ? window : globalThis);
