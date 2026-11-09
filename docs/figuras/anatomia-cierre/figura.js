/*
 * Figura viva: tablero de Galton del cierre del proyecto (Monte Carlo desde un corte).
 * Sin módulos ni scripts en línea (CSP script-src 'self'). Usa window.IsoKit (iso-kit.js) y
 * window.CierreModelo (modelo.js, la misma lógica que backend/app/simulacion.py).
 *
 * Cada bola es un cierre simulado: lleva su coste final y su mes de cierre. Cae desde la tolva, rebota en 15 filas
 * de clavos y se apila en uno de 20 contenedores según el eje elegido (mes de cierre o coste final). El separador
 * rojo es el plan: siempre el borde del contenedor 2 (duración planificada o BAC).
 * Por omisión la figura corre su propio Monte Carlo con los datos del corte del mes 3 (3 000 cierres, variabilidad 0,2).
 *
 * ── Contrato postMessage (página padre → esta figura) ─────────────────────────────────────────────────────────
 * Solo se aceptan mensajes del mismo origen (e.origin === location.origin). Carga útil: el `resultado` de
 * simulacion.simular() (GET /api/simulacion/{id} → resultado) con un campo tipo añadido:
 *   {
 *     tipo: "cierre",
 *     coste:    { histograma: [{ desde, hasta, n }, …], p50, p80, prob_dentro_bac },
 *     duracion: { histograma: [{ desde, hasta, n }, …], p50, p80, prob_en_plazo },
 *     bac: 115000, duracion_plan: 6,                      // opcionales (por omisión 115 000 y 6)
 *     mes_corte: 3, iteraciones: 3000, variabilidad: 0.2, ventana: "todo"   // opcionales, solo para la lectura
 *   }
 * También se acepta { tipo: "cierre", resultado: {…} } o el registro completo { estado, resultado: {…} }.
 * Sobran campos extra; un mensaje mal formado se ignora. Al recibirlo la figura se reinicia y suelta 200 bolas
 * cuyos valores son cuantiles estratificados de cada histograma, así que las pilas convergen a esa distribución.
 * Ejemplo desde el padre:  iframe.contentWindow.postMessage({ tipo: "cierre", ...sim.resultado }, location.origin)
 * Al cargar, si está dentro de un iframe del mismo origen, avisa al padre con { tipo: "cierre-listo" }.
 * Parámetros de URL: ?quieto (pilas finales sin animación), ?n=… (bolas al inicio, 200 por omisión), ?eje=coste.
 * ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
 */
(function () {
  "use strict";
  const K = window.IsoKit;
  const M = window.CierreModelo;
  const stage = document.querySelector(".gc-stage");
  if (!K || !M || !stage) return;

  const GEO = JSON.parse(stage.getAttribute("data-geo"));
  const P = GEO.P;
  const svg = stage.querySelector("svg");
  const NS = "http://www.w3.org/2000/svg";
  const layer = svg.querySelector('[data-capa="bolas"]');
  const piles = Array.from({ length: GEO.nb }, (_, i) => svg.querySelector(`[data-pila="${i}"]`));
  const numbers = Array.from(svg.querySelectorAll('[data-part="numero"]'));
  const unit = svg.querySelector('[data-part="unidad"]');
  const tag = svg.querySelector('[data-part="placa"]');
  const out = {
    n: document.querySelector('[data-lectura="n"]'),
    p50: document.querySelector('[data-lectura="p50"]'),
    p80: document.querySelector('[data-lectura="p80"]'),
    bac: document.querySelector('[data-lectura="bac"]'),
    plazo: document.querySelector('[data-lectura="plazo"]'),
    src: document.querySelector('[data-lectura="fuente"]'),
  };
  const corner = document.querySelector("[data-readout]");
  const actions = Array.from(document.querySelectorAll("[data-accion]"));
  const axisButtons = Array.from(document.querySelectorAll("[data-eje]"));
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  const params = new URLSearchParams(location.search);
  const quiet = () => still.matches || params.has("quieto");

  // ---------- geometría ----------
  const R = GEO.ballR;
  const C = GEO.pegR + R; // centro de la bola apoyada en un clavo
  const ROWS = GEO.rows.length;
  const binC = (i) => GEO.xl + GEO.bw * (i + 0.5);
  const rPx = R * P.scale * Math.sqrt(1.6);
  const ROW_GAP = 2 * R * Math.sin(Math.PI / 3);
  const SLOTS = (function () {
    const list = [];
    const rows = Math.floor((GEO.binTop - GEO.floor - 2 * R) / ROW_GAP) + 1;
    for (let r = 0; r < rows; r++) {
      const n = r % 2 === 0 ? 3 : 2; // empaque hexagonal: filas de 3 y de 2
      const xs = Array.from({ length: n }, (_, j) => (j - (n - 1) / 2) * 2 * R).sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
      for (const dx of xs) list.push([dx, GEO.floor + R + r * ROW_GAP]);
    }
    return list;
  })();
  const CAP = SLOTS.length;
  const screen = (x, z) => K.iso([x, GEO.ballY, z], P);

  // ---------- estado ----------
  const g = M.rng(params.has("semilla") ? Number(params.get("semilla")) || 7 : (Date.now() ^ 0x5eed) >>> 0);
  const LOCAL = M.simular({ mes: 3 });
  let src = { servidor: false, res: LOCAL, bac: LOCAL.bac, plan: LOCAL.duracion_plan };
  let mode = params.get("eje") === "coste" ? "coste" : "duracion";
  let axis = M.eje(mode, src.bac, src.plan);
  let pool = [], poolAt = 0, batch = 0;
  let landed = []; // [coste, duración] de cada bola apilada
  let counts = new Array(GEO.nb).fill(0);
  let reserved = new Array(GEO.nb).fill(0);
  let drawn = new Array(GEO.nb).fill(0);
  let factor = 1;
  let flying = [];
  let queue = 0, spawnEvery = 0.06, spawnClock = 0;
  let frame = 0, last = 0, visible = false, started = false;

  const valueOf = (pair) => (mode === "coste" ? pair[0] : pair[1]);
  const inside = (pair) => (mode === "coste" ? pair[0] <= src.bac : pair[1] <= src.plan + 1e-9);

  function refill() {
    batch++;
    if (!src.servidor) {
      // el modelo local: los 3 000 cierres en orden; al agotarse, otra tanda con otra semilla
      pool = batch === 1 ? LOCAL.pares.slice() : M.simular({ mes: 3, semilla: 2026 + batch }).pares;
    } else {
      // servidor: cuantiles estratificados de cada histograma, barajados por separado
      const n = 400, off = batch === 1 ? 0.5 : g.u();
      const cs = M.muestras(src.res.coste.histograma, n, off);
      const ds = M.muestras(src.res.duracion.histograma, n, off);
      shuffle(cs); shuffle(ds);
      pool = cs.map((c, i) => [c, ds[i]]);
    }
    poolAt = 0;
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(g.u() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
  function nextPair() { if (poolAt >= pool.length) refill(); return pool[poolAt++]; }

  // ---------- bolas (SVG) ----------
  function ballNode(dentro) {
    const node = document.createElementNS(NS, "g");
    const body = document.createElementNS(NS, "circle");
    body.setAttribute("class", "gc-bola");
    body.setAttribute("r", rPx.toFixed(2));
    if (dentro) body.setAttribute("data-dentro", "");
    const shine = document.createElementNS(NS, "circle");
    shine.setAttribute("class", "gc-brillo");
    shine.setAttribute("r", (rPx * 0.36).toFixed(2));
    shine.setAttribute("cx", (-rPx * 0.34).toFixed(2));
    shine.setAttribute("cy", (-rPx * 0.38).toFixed(2));
    node.append(body, shine);
    return node;
  }
  const place = (node, x, z) => { const [sx, sy] = screen(x, z); node.setAttribute("transform", `translate(${sx.toFixed(2)} ${sy.toFixed(2)})`); };

  function drawPile(i) {
    const want = Math.min(CAP, Math.round(counts[i] * factor));
    const pile = piles[i];
    while (drawn[i] > want) { if (pile.lastChild) pile.removeChild(pile.lastChild); drawn[i]--; }
    while (drawn[i] < want) {
      const [dx, z] = SLOTS[drawn[i]];
      const node = ballNode(i < GEO.planI);
      place(node, binC(i) + dx, z);
      pile.appendChild(node);
      drawn[i]++;
    }
  }
  function refreshPiles(force) {
    const max = Math.max(...counts.map((c, i) => c + reserved[i]));
    const f = max > CAP ? CAP / max : 1;
    if (force || Math.abs(f - factor) > 1e-9) {
      factor = f;
      piles.forEach((pile, i) => { pile.textContent = ""; drawn[i] = 0; drawPile(i); });
    } else piles.forEach((_, i) => drawPile(i));
  }

  // ---------- lectura ----------
  const num = (v) => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : M.decimal(v, 1));
  const fmt = (v) => (mode === "coste" ? M.dinero(Math.round(v / 100) * 100) : `${M.decimal(v, 1)} meses`);
  const planTxt = () => `${num(src.plan)} meses`;
  function labels() {
    numbers.forEach((el) => {
      const i = GEO.planI + Number(el.getAttribute("data-n")) * 4;
      const v = axis.desde + axis.paso * i;
      el.textContent = mode === "coste" ? String(Math.round(v / 1000)) : num(v);
    });
    if (unit) unit.textContent = mode === "coste" ? "miles de $" : "meses";
    if (tag) tag.textContent = mode === "coste" ? `BAC ${M.dinero(src.bac)}` : `${num(src.plan)} MESES`.toUpperCase();
    axisButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.getAttribute("data-eje") === mode)));
  }
  function readout() {
    const n = landed.length;
    out.n.textContent = `${n.toLocaleString("es-MX").replace(/,/g, " ")} ${n === 1 ? "cierre" : "cierres"}` + (1 / factor >= 1.05 ? ` · 1 bola ≈ ${M.decimal(1 / factor, 1)} cierres` : "");
    const set = (el, label, value, good) => {
      el.innerHTML = "";
      el.append(label + " ");
      const b = document.createElement("b");
      b.textContent = value;
      el.appendChild(b);
      el.toggleAttribute("data-bien", Boolean(good));
    };
    if (!n) {
      set(out.p50, "P50", "—"); set(out.p80, "P80", "—");
      set(out.bac, "dentro del BAC", "—"); set(out.plazo, `en ${planTxt()}`, "—");
    } else {
      const vs = landed.map(valueOf).sort((a, b) => a - b);
      const lim = mode === "coste" ? src.bac : src.plan;
      const p50 = M.percentil(vs, 0.5), p80 = M.percentil(vs, 0.8);
      set(out.p50, "P50", fmt(p50), p50 <= lim);
      set(out.p80, "P80", fmt(p80), p80 <= lim);
      const pb = landed.filter((p) => p[0] <= src.bac).length / n;
      const pp = landed.filter((p) => p[1] <= src.plan + 1e-9).length / n;
      set(out.bac, "dentro del BAC", M.porcentaje(pb), pb >= 0.5);
      set(out.plazo, `en ${planTxt()}`, M.porcentaje(pp), pp >= 0.5);
      if (corner) corner.textContent = `P50 ${fmt(p50)} · P80 ${fmt(p80)}`;
    }
    const r = src.res;
    const full = mode === "coste" ? r.coste : r.duracion;
    const bits = [src.servidor ? "Resultado del servidor" : "Modelo en el navegador"];
    if (Number.isFinite(Number(r.mes_corte))) bits.push(`corte del mes ${Math.round(Number(r.mes_corte))}`);
    if (Number.isFinite(Number(r.iteraciones))) bits.push(`${M.miles(Number(r.iteraciones))} cierres`);
    if (Number.isFinite(Number(full.p50))) bits.push(`P50 ${fmt(Number(full.p50))}`);
    if (Number.isFinite(Number(full.p80))) bits.push(`P80 ${fmt(Number(full.p80))}`);
    const prob = mode === "coste" ? r.coste.prob_dentro_bac : r.duracion.prob_en_plazo;
    if (Number.isFinite(Number(prob))) bits.push(`${mode === "coste" ? "dentro del BAC" : "en plazo"} ${M.porcentaje(Number(prob))}`);
    out.src.textContent = bits.join(" · ");
    out.src.toggleAttribute("data-servidor", src.servidor);
  }

  // ---------- una bola: recorrido por los clavos ----------
  function walk(bin) {
    const hopX = GEO.hop.x;
    const U = Math.round((binC(bin) - hopX) / GEO.half);
    const lo = Math.round((GEO.xl + 5 - hopX) / GEO.half);
    const hi = Math.round((-GEO.xl - 5 - hopX) / GEO.half);
    let u = 0;
    const us = [0];
    for (let kk = 1; kk <= ROWS; kk++) {
      const rem = ROWS - kk;
      const want = (U * kk) / ROWS + (g.u() - 0.5) * 3;
      const pref = Math.abs(want - u) < 0.6 ? (g.u() < 0.5 ? -1 : 1) : Math.sign(want - u);
      const ok = (s, reach) => { const v = u + s; return v >= lo && v <= hi && Math.abs(U - v) <= reach * rem; };
      let step = [pref, -pref].find((s) => ok(s, 1));
      if (step === undefined) step = [pref, -pref, 3 * pref, -3 * pref].find((s) => ok(s, 3));
      if (step === undefined) step = Math.sign(U - u) * (Math.abs(U - u) >= 3 ? 3 : 1);
      u += step;
      us.push(u);
    }
    return us.map((v) => hopX + v * GEO.half);
  }

  function launch() {
    const pair = nextPair();
    const bin = M.contenedor(axis, valueOf(pair));
    const xs = walk(bin);
    const segs = [];
    const rows = GEO.rows;
    segs.push({ ax: xs[0], az: GEO.hop.z, bx: xs[0], bz: rows[0] + C, dur: 0.26, kind: "caida" });
    for (let kk = 1; kk <= ROWS; kk++) {
      const az = rows[kk - 1] + C;
      const bz = (kk < ROWS ? rows[kk] : rows[ROWS - 1] - (rows[0] - rows[1])) + C;
      const far = Math.abs(xs[kk] - xs[kk - 1]) > GEO.half * 1.5;
      segs.push({ ax: xs[kk - 1], az, bx: xs[kk], bz, dur: far ? 0.19 : 0.11, kind: "rebote", hop: far ? 2.4 : 1.0 });
    }
    const node = ballNode(inside(pair));
    layer.appendChild(node);
    place(node, xs[0], GEO.hop.z);
    flying.push({ pair, bin, segs, i: 0, t: 0, node, slot: null });
  }
  function finalSeg(ball) {
    const i = ball.bin;
    reserved[i]++;
    refreshPiles();
    const idx = Math.max(0, Math.min(CAP - 1, Math.round((counts[i] + reserved[i]) * factor) - 1));
    const [dx, z] = SLOTS[idx];
    const lastSeg = ball.segs[ball.segs.length - 1];
    ball.slot = true;
    ball.segs.push({ ax: lastSeg.bx, az: lastSeg.bz, bx: binC(i) + dx, bz: z, dur: 0.1 + Math.sqrt(Math.max(lastSeg.bz - z, 1)) * 0.04, kind: "caida" });
  }
  function land(ball) {
    reserved[ball.bin]--;
    counts[ball.bin]++;
    landed.push(ball.pair);
    ball.node.remove();
    refreshPiles();
    readout();
  }
  function instant(n) {
    for (let j = 0; j < n; j++) { const pair = nextPair(); landed.push(pair); counts[M.contenedor(axis, valueOf(pair))]++; }
    refreshPiles();
    readout();
  }

  // ---------- movimiento ----------
  function stepBall(ball, dt) {
    ball.t += dt;
    let s = ball.segs[ball.i];
    while (ball.t >= s.dur) {
      ball.t -= s.dur;
      ball.i++;
      if (ball.i === ball.segs.length && !ball.slot) finalSeg(ball);
      if (ball.i >= ball.segs.length) { land(ball); return false; }
      s = ball.segs[ball.i];
    }
    const t = ball.t / s.dur;
    let x, z;
    if (s.kind === "caida") { x = s.ax + (s.bx - s.ax) * t; z = s.az - (s.az - s.bz) * t * t; }
    else { x = s.ax + (s.bx - s.ax) * Math.sin((t * Math.PI) / 2); z = s.az - (s.az - s.bz) * t * t + s.hop * Math.sin(Math.PI * t); }
    place(ball.node, x, z);
    return true;
  }
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    if (queue > 0) {
      spawnClock += dt;
      while (queue > 0 && spawnClock >= spawnEvery) { spawnClock -= spawnEvery; queue--; launch(); }
    }
    flying = flying.filter((b) => stepBall(b, dt));
    frame = visible && (queue > 0 || flying.length > 0) ? requestAnimationFrame(tick) : 0;
  }
  const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };

  // ---------- acciones ----------
  function drop(n, every) {
    if (quiet()) { instant(n); return; }
    spawnEvery = every;
    if (queue === 0) spawnClock = every;
    queue += n;
    run();
  }
  function settleFlying() {
    // lo que va en vuelo cae de inmediato (al cambiar de eje o con movimiento reducido)
    const pending = queue;
    flying.forEach((b) => { b.node.remove(); if (b.slot) reserved[b.bin]--; landed.push(b.pair); counts[b.bin]++; });
    flying = [];
    queue = 0;
    return pending;
  }
  function reset() {
    queue = 0;
    flying.forEach((b) => b.node.remove());
    flying = [];
    landed = [];
    counts = new Array(GEO.nb).fill(0);
    reserved = new Array(GEO.nb).fill(0);
    factor = 1;
    piles.forEach((pile, i) => { pile.textContent = ""; drawn[i] = 0; });
    readout();
  }
  function setMode(m) {
    if (m === mode) return;
    const pending = settleFlying();
    mode = m;
    axis = M.eje(mode, src.bac, src.plan);
    counts = new Array(GEO.nb).fill(0);
    reserved = new Array(GEO.nb).fill(0);
    landed.forEach((p) => { counts[M.contenedor(axis, valueOf(p))]++; });
    refreshPiles(true);
    labels();
    readout();
    if (pending) drop(pending, spawnEvery);
  }
  const act = (what) => {
    started = true;
    if (what === "uno") drop(1, 0.06);
    else if (what === "cien") drop(100, 0.05);
    else if (what === "reiniciar") reset();
    else if (what === "eje") setMode(mode === "coste" ? "duracion" : "coste");
  };
  actions.forEach((b) => b.addEventListener("click", () => act(b.getAttribute("data-accion"))));
  axisButtons.forEach((b) => b.addEventListener("click", () => { started = true; setMode(b.getAttribute("data-eje")); }));
  stage.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    let what = null;
    if (e.key === " " || e.key === "Enter") what = "uno";
    else if (e.key === "s" || e.key === "S") what = "cien";
    else if (e.key === "r" || e.key === "R") what = "reiniciar";
    else if (e.key === "m" || e.key === "M") what = "eje";
    if (!what) return;
    e.preventDefault();
    act(what);
  });

  // ---------- resultado real desde la página padre ----------
  const finite = (v) => Number.isFinite(Number(v));
  function histOk(h) {
    if (!Array.isArray(h) || h.length < 1 || h.length > 500) return null;
    const list = h.map((b) => ({ desde: Number(b && b.desde), hasta: Number(b && b.hasta), n: Number(b && b.n) }));
    if (list.some((b) => !Number.isFinite(b.desde) || !Number.isFinite(b.hasta) || !Number.isFinite(b.n) || b.n < 0 || b.hasta < b.desde)) return null;
    return list.reduce((a, b) => a + b.n, 0) > 0 ? list : null;
  }
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin) return;
    let d = e.data;
    if (!d || typeof d !== "object") return;
    if (d.resultado && typeof d.resultado === "object") d = Object.assign({ tipo: d.tipo }, d.resultado);
    if (d.tipo !== undefined && d.tipo !== "cierre" && d.tipo !== "simulacion") return;
    if (!d.coste || !d.duracion) return;
    const hc = histOk(d.coste.histograma), hd = histOk(d.duracion.histograma);
    if (!hc || !hd) return;
    const bac = finite(d.bac) && Number(d.bac) > 0 ? Number(d.bac) : M.DATOS.bac;
    const plan = finite(d.duracion_plan) && Number(d.duracion_plan) > 0 ? Number(d.duracion_plan) : M.DATOS.duracion;
    const clean = (o, extra) => { const r = { histograma: null }; ["p50", "p80"].concat(extra).forEach((k) => { if (finite(o[k])) r[k] = Number(o[k]); }); return r; };
    const res = {
      mes_corte: finite(d.mes_corte) ? Number(d.mes_corte) : null,
      iteraciones: finite(d.iteraciones) ? Number(d.iteraciones) : null,
      coste: Object.assign(clean(d.coste, ["prob_dentro_bac"]), { histograma: hc }),
      duracion: Object.assign(clean(d.duracion, ["prob_en_plazo"]), { histograma: hd }),
    };
    src = { servidor: true, res, bac, plan };
    axis = M.eje(mode, bac, plan);
    batch = 0; pool = []; poolAt = 0;
    started = true;
    reset();
    labels();
    readout();
    drop(200, 0.035);
  });

  // ---------- arranque ----------
  const first = Math.max(0, Math.min(2000, params.has("n") ? Number(params.get("n")) || 0 : 200));
  labels();
  if (quiet()) { started = true; instant(first); }
  readout();
  if (still.addEventListener) still.addEventListener("change", () => { if (still.matches) instant(settleFlying()); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible && !started) { started = true; drop(first, 0.06); }
      if (visible) run();
    }, { rootMargin: "60px 0px" }).observe(stage);
  } else { visible = true; if (!started) { started = true; drop(first, 0.06); } }
  if (window.parent !== window) {
    let same = false;
    try { same = window.parent.location.origin === location.origin; } catch (_) { same = false; }
    if (same) window.parent.postMessage({ tipo: "cierre-listo" }, location.origin);
  }
})();
