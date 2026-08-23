/* DSA5104 SQL practice feature. It owns editor state and the optional SQLite
 * runtime; the NUS entrypoint only injects data and presentation helpers. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_SQL_FEATURE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createNusSqlFeature(config) {
  const options = config || {};
  const host = options.root;
  const getContent = options.getContent || (() => ({}));
  const getPractice = options.getPractice || (() => {
    const course = getContent("DSA5104");
    return course && course.sqlPractice;
  });
  const pageHead = options.pageHead || (() => "");
  const card = options.card || (() => "");
  const esc = options.esc || (value => String(value == null ? "" : value));
  const text = options.text || esc;
  const notFound = options.notFound || (() => "");
  const getRoute = options.getRoute || (() => typeof location === "object" ? location.hash : "");
  let state = { index: 0, result: null, error: null, ran: false, reveal: false };
  let sqlPromise = null;
  let selectionGeneration = 0;

  function practiceSpec() {
    return getPractice() || {};
  }

  function render() {
    const spec = practiceSpec();
    if (!spec || !Array.isArray(spec.exercises) || !spec.exercises.length) return notFound();
    const exercise = spec.exercises[state.index] || spec.exercises[0];
    let body = pageHead("DSA5104 · practice", "SQL studio", "A small SQLite database runs in your browser. Use it to practice schema reading, joins, grouping, aggregation, and ER constraints without sending queries to a server. Compatibility note: this is SQLite/WASM for the MVP; MySQL-specific functions and DDL may differ.");
    const artifacts = (spec.officialArtifacts || []).map(artifact => `<a class="nus-list-row" href="${esc(artifact.assetPath)}" download><div><b>${esc(artifact.title)}</b><span>${esc(artifact.status || "Official source artifact")} · ${esc(artifact.sourceId)}</span></div><span>↓</span></a>`).join("");
    body += `<div class="nus-sql-layout"><aside>${card("Schema", spec.schema.map(table => `<div class="nus-schema-table"><b>${esc(table.name)}</b>${table.columns.map(column => `<code>${esc(column)}</code>`).join("")}</div>`).join(""), "reveal")}${card("Exercises", spec.exercises.map((item, index) => `<button class="nus-exercise-link ${index === state.index ? "active" : ""}" data-sql-index="${index}"><span>${index + 1}</span><div><b>${esc(item.level)}</b><small>${esc(item.prompt)}</small></div></button>`).join(""), "reveal")}${artifacts ? card("Official source artifacts", artifacts, "reveal") : ""}</aside><main><section class="nus-card nus-sql-editor reveal"><div class="nus-assessment-line"><span>${esc(exercise.level)} · Exercise ${state.index + 1}/${spec.exercises.length}</span><span>${state.ran ? "Query executed" : "Not run"}</span></div><h3>${esc(exercise.prompt)}</h3><textarea id="nus-sql-input" rows="9">${esc(exercise.starter)}</textarea><div class="nus-lesson-actions"><button class="btn primary" id="nus-run-sql">Run query</button><button class="btn ghost" id="nus-reveal-sql" ${state.ran ? "" : "disabled"}>Reveal solution</button></div>${state.error ? `<div class="nus-output error">${text(state.error)}</div>` : ""}${state.result ? `<div class="nus-output ${state.result.pass ? "success" : "error"}"><b>${state.result.pass ? "Looks right" : "Check the result"}</b><pre>${esc(state.result.text)}</pre><p>${text(exercise.explanation)}</p>${state.reveal ? `<details open><summary>Solution</summary><pre>${esc(exercise.solution || exercise.starter)}</pre></details>` : ""}</div>` : ""}</section></main></div>`;
    host.innerHTML = body;
    host.querySelectorAll("[data-sql-index]").forEach(button => button.addEventListener("click", () => {
      selectionGeneration += 1;
      state = { index: Number(button.dataset.sqlIndex), result: null, error: null, ran: false, reveal: false };
      render();
    }));
    host.querySelector("#nus-run-sql").addEventListener("click", () => execute(exercise));
    host.querySelector("#nus-reveal-sql").addEventListener("click", () => { state.reveal = true; render(); });
  }

  function loadSqlJs() {
    const documentRef = host && host.ownerDocument ? host.ownerDocument : (typeof document === "object" ? document : null);
    const view = documentRef && documentRef.defaultView ? documentRef.defaultView : (typeof window === "object" ? window : null);
    if (view && view.initSqlJs) return Promise.resolve(view.initSqlJs);
    if (sqlPromise) return sqlPromise;
    if (!documentRef) return Promise.reject(new Error("SQL Studio needs a browser document."));
    sqlPromise = new Promise((resolve, reject) => {
      const script = documentRef.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.js";
      script.onload = () => {
        const init = (view && view.initSqlJs) || (typeof window === "object" && window.initSqlJs);
        if (init) resolve(init);
        else {
          sqlPromise = null;
          reject(new Error("The browser SQL engine loaded without its initializer."));
        }
      };
      script.onerror = () => {
        sqlPromise = null;
        reject(new Error("Could not load the browser SQL engine. Check your connection and try again."));
      };
      documentRef.head.appendChild(script);
    });
    return sqlPromise;
  }

  function resultLines(rows) {
    return rows ? rows.values.map(row => row.map(value => value == null ? "" : String(value)).join("|")) : [];
  }

  function createDatabase(SQL, spec) {
    const db = new SQL.Database();
    (spec.schema || []).forEach(table => {
      const columns = (table.columns || []).join(", ");
      db.run(`CREATE TABLE ${table.name} (${columns});`);
    });
    Object.entries(spec.seed || {}).forEach(([table, rows]) => rows.forEach(row => {
      const marks = row.map(() => "?").join(",");
      db.run(`INSERT INTO ${table} VALUES (${marks})`, row);
    }));
    return db;
  }

  async function execute(exercise) {
    const exerciseIndex = state.index;
    const generation = selectionGeneration;
    const route = getRoute();
    const isCurrent = () => generation === selectionGeneration && state.index === exerciseIndex && getRoute() === route;
    const input = host.querySelector("#nus-sql-input").value.trim();
    if (!input) {
      state = { ...state, error: "Enter a SQL query or answer before running.", result: null, ran: true };
      render();
      return;
    }
    state = { ...state, error: null, result: null, ran: true };
    if (exercise.id === "sql-4") {
      const normalized = input.toLowerCase().replace(/\s+/g, " ");
      if (!isCurrent()) return;
      state.result = { pass: (exercise.expected || []).some(value => normalized.includes(value)), text: input || "No answer" };
      render();
      return;
    }
    let db = null;
    try {
      const init = await loadSqlJs();
      const SQL = await init({ locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${file}` });
      db = createDatabase(SQL, practiceSpec());
      const rows = db.exec(input)[0];
      const values = resultLines(rows);
      if (!isCurrent()) return;
      state.result = { pass: values.join("\n") === (exercise.expected || []).join("\n"), text: rows ? [rows.columns.join(" | "), ...values].join("\n") : "Query returned no rows" };
    } catch (error) {
      if (isCurrent()) state.error = error.message || "SQL error";
    } finally {
      if (db) db.close();
    }
    if (isCurrent()) render();
  }

  return Object.freeze({ render, execute });
});
