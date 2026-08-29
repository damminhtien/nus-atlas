/* Cross-device study-state sync. The server is authoritative after login;
 * localStorage remains the offline mirror for the canonical study store. */
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
  function mergeRecordMap(left, right, chooser) {
    const merged = { ...object(right) };
    new Set([...Object.keys(object(left)), ...Object.keys(object(right))]).forEach(key => {
      merged[key] = chooser(object(left)[key], object(right)[key]);
    });
    return merged;
  }

  function time(value) {
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function mergeActivePractice(left, right) {
    const local = object(left), remote = object(right);
    if (!Object.keys(local).length) return Object.keys(remote).length ? clone(remote) : null;
    if (!Object.keys(remote).length) return clone(local);
    if (local.attemptId !== remote.attemptId) return time(local.updatedAt) >= time(remote.updatedAt) ? clone(local) : clone(remote);
    const primary = time(local.updatedAt) >= time(remote.updatedAt) ? local : remote;
    const secondary = primary === local ? remote : local;
    const answerMap = new Map();
    [...array(secondary.answers), ...array(primary.answers)].forEach(answer => {
      if (!answer || !answer.questionId) return;
      const previous = answerMap.get(answer.questionId);
      if (!previous || time(answer.answeredAt) >= time(previous.answeredAt)) answerMap.set(answer.questionId, clone(answer));
    });
    return {
      ...clone(secondary),
      ...clone(primary),
      questionIds: [...new Set([...array(primary.questionIds), ...array(secondary.questionIds)])],
      generatedSeeds: { ...object(secondary.generatedSeeds), ...object(primary.generatedSeeds) },
      answers: [...answerMap.values()],
      updatedAt: primary.updatedAt || secondary.updatedAt || null
    };
  }

  function mergeStudy(left, right) {
    const local = object(left), remote = object(right);
    const merged = { ...remote, ...local };
    ["tasks", "questHistory"].forEach(key => { merged[key] = unionMap(local[key], remote[key]); });
    merged.lessons = mergeBooleanMap(local.lessons, remote.lessons);
    merged.events = { ...object(remote.events), ...object(local.events) };
    merged.attempts = uniqueArray(local.attempts, remote.attempts, item => String(item && (item.attemptId || item.at) || JSON.stringify(item)));
    merged.activePractice = mergeActivePractice(local.activePractice, remote.activePractice);
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
  function snapshot() {
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
      study: studyStore && studyStore.raw ? clone(studyStore.raw) : null,
      preferences
    };
  }

  function applySnapshot(value) {
    const state = object(value);
    suspended = true;
    try {
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
