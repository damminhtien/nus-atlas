/* Cross-device Atlas state sync. The server is authoritative after login;
 * localStorage remains only as an offline mirror used by the existing stores. */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_SYNC_CLIENT = factory({
    root,
    storage: root.localStorage,
    sessionStorage: root.sessionStorage,
    endpoint: (root.document && (root.document.querySelector("meta[name='atlas-sync-endpoint']") || {}).content) || ""
  });
})(typeof globalThis === "object" ? globalThis : this, function createSyncClient(options) {
  const config = options || {};
  const root = config.root || globalThis;
  const storage = config.storage || null;
  const sessionStorage = config.sessionStorage || null;
  const endpoint = String(config.endpoint || "").trim();
  const fetchImpl = config.fetchImpl || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
  const TOKEN_KEY = "atlas.sync.session.v1";
  const ACCOUNT_KEY = "atlas.sync.account.v1";
  const PREFERENCE_KEYS = [
    "atlas.textScale",
    "atlas.theme",
    "atlas.reduceMotion",
    "atlas.contrast",
    "nus.reader-mode",
    "nus.sidebar-collapsed",
    "nus.visual-cues.v1",
    "atlas.reading-position.v1"
  ];
  const listeners = new Set();
  let revision = 0;
  let timer = null;
  let busy = false;
  let suspended = false;
  let currentStatus = sessionToken() ? "ready" : "signed-out";

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function array(value) { return Array.isArray(value) ? value : []; }
  function latest(a, b, field) {
    if (typeof a === "string" || typeof b === "string") return a || b || null;
    const left = object(a), right = object(b);
    if (!a && !b) return null;
    return String(right[field] || "") > String(left[field] || "") ? clone(right) : clone(left);
  }
  function unionMap(left, right) { return { ...object(right), ...object(left) }; }
  function mergeBooleanMap(left, right) {
    const merged = { ...object(right), ...object(left) };
    new Set([...Object.keys(object(left)), ...Object.keys(object(right))]).forEach(key => {
      merged[key] = !!object(left)[key] || !!object(right)[key];
    });
    return merged;
  }
  function uniqueArray(left, right, id) {
    const values = [...array(right), ...array(left)];
    const seen = new Set();
    return values.filter(item => {
      const key = id(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function chooseCard(left, right) {
    const a = object(left), b = object(right);
    if ((Number(a.reps) || 0) !== (Number(b.reps) || 0)) return (Number(a.reps) || 0) > (Number(b.reps) || 0) ? clone(a) : clone(b);
    return (Number(a.due) || 0) >= (Number(b.due) || 0) ? clone(a) : clone(b);
  }
  function mergeRecordMap(left, right, chooser) {
    const merged = { ...object(right) };
    new Set([...Object.keys(object(left)), ...Object.keys(object(right))]).forEach(key => {
      merged[key] = chooser(object(left)[key], object(right)[key]);
    });
    return merged;
  }

  function mergeLegacy(left, right) {
    const local = object(left), remote = object(right);
    const merged = { ...remote, ...local };
    ["xp", "cardsReviewed", "missedFixed", "perfectQuizzes", "focusSessions", "quickChecks", "maxStreak", "streak", "freezes"].forEach(key => {
      merged[key] = Math.max(Number(local[key]) || 0, Number(remote[key]) || 0);
    });
    ["lessons", "achievements", "hwRevealed", "mastery", "notes", "bookmarks", "missed", "vizSeen", "solvedCode", "deepDivesSeen"].forEach(key => {
      if (key === "mastery") merged[key] = mergeRecordMap(local[key], remote[key], (a, b) => {
        const leftScore = Number(a && a.s != null ? a.s : a && a.score) || 0;
        const rightScore = Number(b && b.s != null ? b.s : b && b.score) || 0;
        if (leftScore !== rightScore) return leftScore > rightScore ? clone(a || b) : clone(b || a);
        return String(a && (a.ts || a.lastAt) || "") >= String(b && (b.ts || b.lastAt) || "") ? clone(a || b) : clone(b || a);
      });
      else if (key === "lessons") merged[key] = mergeBooleanMap(local[key], remote[key]);
      else if (key === "notes") merged[key] = { ...object(remote[key]), ...object(local[key]) };
      else merged[key] = unionMap(local[key], remote[key]);
    });
    merged.activity = Object.fromEntries([...new Set([...Object.keys(object(local.activity)), ...Object.keys(object(remote.activity))])].map(key => [key, Math.max(Number(local.activity && local.activity[key]) || 0, Number(remote.activity && remote.activity[key]) || 0)]));
    merged.activeDays = unionMap(local.activeDays, remote.activeDays);
    merged.cards = mergeRecordMap(local.cards, remote.cards, chooseCard);
    merged.tests = uniqueArray(local.tests, remote.tests, item => String(item && (item.attemptId || item.id || item.at) || JSON.stringify(item)));
    merged.lastActive = String(local.lastActive || "") >= String(remote.lastActive || "") ? local.lastActive || remote.lastActive || null : remote.lastActive || local.lastActive || null;
    merged.lastLesson = latest(local.lastLesson, remote.lastLesson, "at");
    merged.goalXp = Number(local.goalXp) || Number(remote.goalXp) || 50;
    merged.newPerSession = Number(local.newPerSession) || Number(remote.newPerSession) || 30;
    return merged;
  }

  function mergeStudy(left, right) {
    const local = object(left), remote = object(right);
    const merged = { ...remote, ...local };
    ["tasks", "questHistory"].forEach(key => { merged[key] = unionMap(local[key], remote[key]); });
    merged.lessons = mergeBooleanMap(local.lessons, remote.lessons);
    merged.events = { ...object(remote.events), ...object(local.events) };
    merged.attempts = uniqueArray(local.attempts, remote.attempts, item => String(item && (item.attemptId || item.at) || JSON.stringify(item)));
    merged.mastery = mergeRecordMap(local.mastery, remote.mastery, (a, b) => {
      const leftScore = Number(a && a.score) || 0, rightScore = Number(b && b.score) || 0;
      if (leftScore !== rightScore) return leftScore > rightScore ? clone(a || b) : clone(b || a);
      return String(a && a.lastAt || "") >= String(b && b.lastAt || "") ? clone(a || b) : clone(b || a);
    });
    merged.retrieval = mergeRecordMap(local.retrieval, remote.retrieval, (a, b) => latest(a, b, "lastAt"));
    merged.reading = mergeRecordMap(local.reading, remote.reading, (a, b) => {
      const localItem = object(a), remoteItem = object(b);
      return {
        ...remoteItem,
        ...localItem,
        position: Math.max(Number(localItem.position) || 0, Number(remoteItem.position) || 0),
        furthest: Math.max(Number(localItem.furthest) || 0, Number(remoteItem.furthest) || 0),
        completed: !!localItem.completed || !!remoteItem.completed,
        lastAt: String(localItem.lastAt || "") >= String(remoteItem.lastAt || "") ? localItem.lastAt || remoteItem.lastAt : remoteItem.lastAt || localItem.lastAt
      };
    });
    merged.lastStudy = String(local.lastStudy || "") >= String(remote.lastStudy || "") ? local.lastStudy || remote.lastStudy || null : remote.lastStudy || local.lastStudy || null;
    merged.lastLesson = latest(local.lastLesson, remote.lastLesson, "at");
    return merged;
  }

  function mergeSnapshots(local, remote) {
    const left = object(local), right = object(remote);
    return {
      schemaVersion: "atlas.sync.v1",
      legacy: mergeLegacy(left.legacy, right.legacy),
      study: mergeStudy(left.study, right.study),
      preferences: { ...object(right.preferences), ...object(left.preferences) }
    };
  }

  function readToken() {
    try { return sessionStorage && sessionStorage.getItem(TOKEN_KEY) || ""; } catch (_) { return ""; }
  }
  function sessionToken() { return readToken(); }
  function writeToken(token) {
    try { if (sessionStorage) sessionStorage.setItem(TOKEN_KEY, token); } catch (_) {}
  }
  function clearToken() {
    try { if (sessionStorage) sessionStorage.removeItem(TOKEN_KEY); } catch (_) {}
  }
  function readAccount() {
    try { return storage && String(storage.getItem(ACCOUNT_KEY) || "").trim().toLowerCase() || ""; } catch (_) { return ""; }
  }
  function writeAccount(username) {
    try { if (storage) storage.setItem(ACCOUNT_KEY, String(username || "").trim().toLowerCase()); } catch (_) {}
  }
  function setStatus(status, detail) {
    currentStatus = status;
    listeners.forEach(listener => { try { listener({ status, detail: detail || "", revision }); } catch (_) {} });
  }
  function readJson(value) { try { return value ? JSON.parse(value) : null; } catch (_) { return null; } }

  function snapshot() {
    const store = root.Store;
    const studyStore = root.ATLAS_STUDY_STORE;
    const preferences = {};
    PREFERENCE_KEYS.forEach(key => {
      try {
        const value = storage && storage.getItem(key);
        if (value != null) preferences[key] = value;
      } catch (_) {}
    });
    return {
      schemaVersion: "atlas.sync.v1",
      legacy: store && typeof store.exportData === "function" ? readJson(store.exportData()) : null,
      study: studyStore && studyStore.raw ? clone(studyStore.raw) : null,
      preferences
    };
  }

  function applySnapshot(value) {
    const state = object(value);
    suspended = true;
    try {
      if (state.legacy && root.Store && typeof root.Store.importData === "function") root.Store.importData(JSON.stringify(state.legacy));
      if (state.study && root.ATLAS_STUDY_STORE && typeof root.ATLAS_STUDY_STORE.importData === "function") root.ATLAS_STUDY_STORE.importData(state.study);
      Object.entries(object(state.preferences)).forEach(([key, item]) => {
        if (PREFERENCE_KEYS.includes(key) && storage) {
          try { storage.setItem(key, String(item)); } catch (_) {}
        }
      });
    } finally {
      suspended = false;
    }
  }

  async function request(method, body) {
    if (!endpoint || !fetchImpl) throw new Error("Sync endpoint is not configured");
    const token = readToken();
    const response = await fetchImpl(endpoint, {
      method,
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body == null ? undefined : JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || `Sync request failed with ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  async function putSnapshot(value, baseRevision, retry = true) {
    try {
      const result = await request("PUT", { state: value, baseRevision });
      revision = Number(result.revision) || baseRevision + 1;
      return result;
    } catch (error) {
      if (error.status !== 409 || !retry || !error.payload || !error.payload.state) throw error;
      const merged = mergeSnapshots(snapshot(), error.payload.state);
      applySnapshot(merged);
      return putSnapshot(merged, Number(error.payload.revision) || 0, false);
    }
  }

  async function syncNow() {
    if (busy || !readToken()) return false;
    busy = true;
    setStatus("syncing");
    try {
      const remote = await request("POST", { action: "pull" });
      const merged = mergeSnapshots(snapshot(), remote.state);
      applySnapshot(merged);
      await putSnapshot(merged, Number(remote.revision) || 0);
      setStatus("synced");
      return true;
    } catch (error) {
      if (error.status === 401) {
        clearToken();
        revision = 0;
        setStatus("signed-out", "Your sync session expired. Sign in again.");
      } else setStatus("error", error.message);
      return false;
    } finally {
      busy = false;
    }
  }

  async function login(username, password) {
    if (!endpoint) throw new Error("Sync endpoint is not configured");
    busy = true;
    setStatus("syncing");
    try {
      const response = await request("POST", { action: "login", username, password });
      if (!response.token || !response.username) throw new Error("Sync service returned an invalid session");
      writeToken(response.token);
      revision = Number(response.revision) || 0;
      const local = snapshot();
      // Never merge account A's local mirror into account B's remote snapshot.
      const account = String(response.username).trim().toLowerCase();
      const merged = mergeSnapshots(!readAccount() || readAccount() === account ? local : null, response.state);
      applySnapshot(merged);
      writeAccount(account);
      await putSnapshot(merged, revision);
      setStatus("synced");
      return { username: response.username, revision };
    } catch (error) {
      clearToken();
      setStatus("error", error.message);
      throw error;
    } finally {
      busy = false;
    }
  }

  function schedule() {
    if (suspended || !readToken() || busy) return;
    clearTimeout(timer);
    timer = setTimeout(() => { syncNow(); }, 900);
  }

  function logout() {
    clearToken();
    revision = 0;
    setStatus("signed-out");
  }

  return Object.freeze({
    endpoint,
    status: () => currentStatus,
    revision: () => revision,
    isSignedIn: () => !!readToken(),
    snapshot,
    applySnapshot,
    mergeSnapshots,
    login,
    syncNow,
    schedule,
    logout,
    onStatus(listener) { if (typeof listener !== "function") return () => {}; listeners.add(listener); return () => listeners.delete(listener); }
  });
});
