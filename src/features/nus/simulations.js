/* DSA5208 distributed-systems simulations. State is local to this feature and
 * evidence writes are injected, keeping the renderer independent of storage. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_SIMULATIONS_FEATURE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createNusSimulationsFeature(config) {
  const options = config || {};
  const host = options.root;
  const pageHead = options.pageHead || (() => "");
  const esc = options.esc || (value => String(value == null ? "" : value));
  const getStore = options.getStore || (() => null);
  let clock = { p1: 0, p2: 0, vector1: [0, 0], vector2: [0, 0], events: [] };
  let delivery = { mode: "FIFO", log: [] };

  function vectorRelation(first, second) {
    const le = (left, right) => left.every((value, index) => value <= right[index]);
    const lt = (left, right) => le(left, right) && left.some((value, index) => value < right[index]);
    return lt(first, second) ? "P1's current event happens-before P2's." : lt(second, first) ? "P2's current event happens-before P1's." : "The vectors are incomparable: treat the events as concurrent.";
  }
  function evidence(name, lessonId) {
    const store = getStore();
    if (store && typeof store.recordSimulation === "function") store.recordSimulation(name, "DSA5208", lessonId);
  }
  function render() {
    const state = clock;
    let body = pageHead("DSA5208 · interactive", "Distributed systems simulations", "Step through ordering, logical clocks, consistency choices, and a Spark-style pipeline. The state is local to this page and intentionally small enough to reason about by hand.");
    body += `<div class="nus-sim-grid"><section class="nus-card nus-sim reveal"><div class="nus-assessment-line"><span>Lamport scalar clock</span><button class="btn ghost" id="nus-clock-reset">Reset</button></div><p>Advance local events or send a message from P1 to P2. Receive uses max(local, received)+1.</p><div class="nus-processes"><div><b>P1</b><strong>${state.p1}</strong><button class="btn ghost" id="nus-p1-event">Local event</button><button class="btn ghost" id="nus-send">Send → P2</button></div><div><b>P2</b><strong>${state.p2}</strong><button class="btn ghost" id="nus-p2-event">Local event</button><button class="btn ghost" id="nus-receive">Receive</button></div></div><div class="nus-event-log">${state.events.slice(-5).map(event => `<span>${esc(event)}</span>`).join("")}</div></section>`;
    body += `<section class="nus-card nus-sim reveal"><div class="nus-assessment-line"><span>Vector clock</span><button class="btn ghost" id="nus-vector-reset">Reset</button></div><p>Compare vectors componentwise. If neither dominates, the events are concurrent.</p><div class="nus-vector-row"><span>P1 <b>(${state.vector1.join(", ")})</b></span><button class="btn ghost" id="nus-vector-p1">P1 event</button><span>P2 <b>(${state.vector2.join(", ")})</b></span><button class="btn ghost" id="nus-vector-p2">P2 event</button></div><p class="nus-callout" id="nus-vector-note">${vectorRelation(state.vector1, state.vector2)}</p></section>`;
    body += `<section class="nus-card nus-sim reveal"><div class="nus-assessment-line"><span>Consistency model prompt</span><span class="pill violet">reasoning</span></div><label>Scenario<select id="nus-consistency"><option>Bank balance read-after-write</option><option>Social feed replica</option><option>Analytics dashboard</option></select></label><div id="nus-consistency-answer" class="nus-output success">Choose a scenario to see the minimum useful guarantee.</div></section>`;
    body += `<section class="nus-card nus-sim reveal"><div class="nus-assessment-line"><span>FIFO / non-FIFO / causal delivery</span><span class="pill gold">message order</span></div><label>Delivery model<select id="nus-delivery-mode"><option>FIFO</option><option>Non-FIFO</option><option>Causal</option></select></label><button class="btn ghost" id="nus-play-delivery">Play delivery trace</button><div class="nus-delivery-trace">${delivery.log.map(event => `<span>${esc(event)}</span>`).join("")}</div></section>`;
    body += `<section class="nus-card nus-sim reveal"><div class="nus-assessment-line"><span>Spark pipeline map</span><span class="pill sage">partition reasoning</span></div><div class="nus-pipeline"><span>read</span><i>→</i><span>map/filter<br><small>partition-local</small></span><i>→</i><span id="nus-shuffle-node">groupByKey<br><small>shuffle</small></span><i>→</i><span>aggregate<br><small>reduce</small></span></div><p class="nus-muted">Click the shuffle stage to explain why network movement appears.</p><button class="btn ghost" id="nus-explain-shuffle">Explain shuffle</button><div id="nus-shuffle-note"></div></section></div>`;
    host.innerHTML = body;
    bind();
  }
  function bind() {
    const add = (key, label) => { clock[key] += 1; clock.events.push(label); render(); };
    host.querySelector("#nus-p1-event").addEventListener("click", () => add("p1", "P1 local event"));
    host.querySelector("#nus-p2-event").addEventListener("click", () => add("p2", "P2 local event"));
    host.querySelector("#nus-send").addEventListener("click", () => { clock.p1 += 1; clock.events.push(`P1 sends timestamp ${clock.p1}`); render(); });
    host.querySelector("#nus-receive").addEventListener("click", () => { clock.p2 = Math.max(clock.p2, clock.p1) + 1; clock.events.push(`P2 receives → ${clock.p2}`); evidence("lamport-receive"); render(); });
    host.querySelector("#nus-clock-reset").addEventListener("click", () => { clock = { ...clock, p1: 0, p2: 0, events: [] }; render(); });
    host.querySelector("#nus-vector-reset").addEventListener("click", () => { clock = { ...clock, vector1: [0, 0], vector2: [0, 0] }; render(); });
    host.querySelector("#nus-vector-p1").addEventListener("click", () => { clock.vector1[0] += 1; render(); });
    host.querySelector("#nus-vector-p2").addEventListener("click", () => { clock.vector2[1] += 1; if (clock.vector1.some(Boolean) && clock.vector2.some(Boolean)) evidence("vector-clock"); render(); });
    host.querySelector("#nus-consistency").addEventListener("change", event => {
      const answers = { "Bank balance read-after-write": "Use a strong/session guarantee for the writer's own read; stale replicas can show an incorrect balance.", "Social feed replica": "Eventual consistency is often acceptable if the UI tolerates a short delay and updates converge.", "Analytics dashboard": "A bounded-staleness or eventual model may be enough; state freshness and error tolerance explicitly." };
      host.querySelector("#nus-consistency-answer").textContent = answers[event.target.value];
      evidence(`consistency-${event.target.value}`);
    });
    host.querySelector("#nus-delivery-mode").addEventListener("change", event => { delivery.mode = event.target.value; });
    host.querySelector("#nus-play-delivery").addEventListener("click", () => {
      const traces = { FIFO: ["P1 sends m1", "P1 sends m2", "P2 delivers m1", "P2 delivers m2"], "Non-FIFO": ["P1 sends m1", "P1 sends m2", "P2 delivers m2", "P2 delivers m1"], Causal: ["P1 sends m1", "P2 receives m1", "P2 sends m2", "P3 delivers m1 before m2"] };
      delivery.log = traces[delivery.mode]; evidence(`delivery-${delivery.mode}`); render();
    });
    host.querySelector("#nus-explain-shuffle").addEventListener("click", () => { host.querySelector("#nus-shuffle-note").innerHTML = `<p class="nus-muted">Keys must meet on the same partition before aggregation. That exchange adds serialization, network traffic, skew risk, and a synchronization barrier.</p>`; evidence("spark-shuffle"); });
  }

  return Object.freeze({ render, vectorRelation });
});
