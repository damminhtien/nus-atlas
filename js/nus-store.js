/* Browser compatibility bootstrap for the core study-store. */
(function (root) {
  "use strict";
  if (!root.ATLAS_STUDY_STORE_FACTORY) throw new Error("Atlas study-store core is not loaded");
  root.ATLAS_STUDY_STORE = root.ATLAS_STUDY_STORE_FACTORY({
    storage: root.localStorage
  });
})(typeof window === "object" ? window : globalThis);
