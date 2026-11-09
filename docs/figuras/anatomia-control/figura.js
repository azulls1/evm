/*
 * Figura viva: el ciclo de control del mes 3, paso a paso (1 a 7).
 * Medición → umbral del 10 % → tres palancas → efecto de los meses 4 y 5 → mes 5 dentro de la tolerancia.
 * Todo número visible sale de ControlModelo (modelo.js). Sin módulos ni scripts en línea (CSP script-src 'self').
 * Parámetros de URL: ?paso=1…7 (fija el paso inicial y no recorre solo), ?quieto (sin recorrido automático).
 */
(function () {
  "use strict";
  const K = window.IsoKit;
  const T = window.IsoTorno;
  const M = window.ControlModelo;
  const PL = window.ControlPalanca;
  const stage = document.querySelector(".cc-stage");
  if (!K || !T || !M || !PL || !stage) return;

  const GEO = JSON.parse(stage.getAttribute("data-geo"));
  const P = GEO.P;
  const svg = stage.querySelector("svg");
  const $ = (sel) => svg.querySelector(sel);
  const $$ = (sel) => Array.from(svg.querySelectorAll(sel));
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  const params = new URLSearchParams(location.search);
  const N = M.PASOS.length;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const D2R = Math.PI / 180;

  const ui = {
    titulo: document.querySelector('[data-lectura="titulo"]'),
    texto: document.querySelector('[data-lectura="texto"]'),
    cifras: document.querySelector('[data-lectura="cifras"]'),
    corner: document.querySelector("[data-readout]"),
    chips: Array.from(document.querySelectorAll(".cc-paso")),
    prev: document.querySelector('[data-accion="anterior"]'),
    next: document.querySelector('[data-accion="siguiente"]'),
  };
  const parts = {
    needles: GEO.gauges.map((g) => ({ g, acc: $(`[data-part="aguja"][data-indice="${g.id}"]`), per: $(`[data-part="aguja-periodo"][data-indice="${g.id}"]`), a: 0, ra: 0, p: 0, rp: 0 })),
    levers: GEO.levers.map((l) => ({ l, el: $(`[data-part="palanca"][data-palanca="${l.i}"]`), at: GEO.rest, drawn: null })),
    lights: $$('[data-part="luz"]'),
    lamps: $$('[data-part="lampara"]'),
    plunger: $('[data-part="embolo"]'),
    counter: $('[data-part="contador"]'),
  };

  // ---------- geometría viva ----------
  const f2 = (n) => n.toFixed(2);
  const thetaOf = (v) => ((clamp(v, GEO.dial.lo, GEO.dial.hi) - 1) / ((GEO.dial.hi - GEO.dial.lo) / 2)) * GEO.dial.sweep * D2R;
  function facePoint(g, r, theta, lift) {
    const a = theta - Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
    return K.iso([0, 1, 2].map((i) => g.o[i] + g.a[i] * (g.s + lift) + r * (c * g.u[i] + s * g.v[i])), P);
  }
  const needlePath = (g, th, tail, tip, lift) => { const a = facePoint(g, tail, th + Math.PI, lift), b = facePoint(g, tip, th, lift); return `M${f2(a[0])} ${f2(a[1])}L${f2(b[0])} ${f2(b[1])}`; };
  const pl = GEO.plunger;
  function plungerSvg(h) {
    const rod = h > 0.05 ? K.solidSvg(K.cylinder(pl.x, pl.y, 1.5, pl.z, h, P, 20), { tone: "mid", crease: "none" }) : "";
    return rod + K.solidSvg(K.cylinder(pl.x, pl.y, 2.8, pl.z + h, 2.4, P, 28, 0.4), { tone: "hi", className: "cc-boton" });
  }

  // ---------- estado ----------
  const fixed = params.has("paso") ? clamp(Math.round(Number(params.get("paso")) || 1), 1, N) - 1 : null;
  let step = fixed !== null ? fixed : Number(stage.getAttribute("aria-valuenow")) - 1 || 0;
  let touring = !still.matches && !params.has("quieto") && fixed === null;
  let tourClock = 0, idleTimer = 0;
  let plungerAt = M.PASOS[step].disparo ? pl.lift : 0, plungerDrawn = -1;
  let frame = 0, last = 0, visible = false, lastStep = -1;
  const HOLD = 4.2;
  // las agujas arrancan en 1,0 y bajan a la medición del mes 3 al entrar en pantalla
  parts.needles.forEach((n) => { n.a = still.matches ? thetaOf(M.PASOS[step].acum[n.g.id]) : 0; n.p = thetaOf(M.PASOS[step].periodo ? M.PASOS[step].periodo[n.g.id] : 1); });
  parts.levers.forEach((p) => { p.at = M.PASOS[step].palancas > p.l.i ? GEO.pull : GEO.rest; p.drawn = null; });

  const lectura = (p) => `CPI ${M.decimal(p.acum.cpi)} · SPI ${M.decimal(p.acum.spi)}` + (p.periodo ? ` · periodo 4–5: CPI ${M.decimal(p.periodo.cpi)} · SPI ${M.decimal(p.periodo.spi)}` : "") + " · umbral 10 %";

  function applyStep() {
    const s = M.PASOS[step];
    svg.setAttribute("data-flujo", s.flujo);
    parts.lamps.forEach((el) => {
      const z = el.getAttribute("data-zona");
      el.toggleAttribute("data-on", (z === "roja" && s.disparo) || (z === "verde" && s.rearme));
    });
    parts.lights.forEach((el) => el.toggleAttribute("data-on", s.palancas > Number(el.getAttribute("data-palanca"))));
    parts.needles.forEach((n) => { if (n.per) n.per.toggleAttribute("data-oculta", !s.periodo); });
    if (parts.counter) parts.counter.textContent = s.contador;
    ui.titulo.textContent = `${step + 1} · ${s.titulo}`;
    ui.texto.textContent = s.texto;
    ui.cifras.textContent = lectura(s);
    if (ui.corner) ui.corner.textContent = `Paso ${step + 1} de ${N}`;
    ui.chips.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-paso")) === step)));
    stage.setAttribute("aria-valuenow", String(step + 1));
    stage.setAttribute("aria-valuetext", `${s.titulo}. ${s.texto}`);
  }

  function draw(dt) {
    const s = M.PASOS[step];
    const instant = still.matches || !dt;
    let moving = false;
    // agujas: resorte suave con un leve sobrepaso
    parts.needles.forEach((n) => {
      const wa = thetaOf(s.acum[n.g.id]);
      const wp = thetaOf(s.periodo ? s.periodo[n.g.id] : 1);
      if (instant) { n.a = wa; n.ra = 0; n.p = wp; n.rp = 0; }
      else {
        for (let i = 0; i < 4; i++) {
          n.ra += ((wa - n.a) * 70 - n.ra * 13) * (dt / 4); n.a += n.ra * (dt / 4);
          n.rp += ((wp - n.p) * 70 - n.rp * 13) * (dt / 4); n.p += n.rp * (dt / 4);
        }
        if (Math.abs(wa - n.a) < 3e-4 && Math.abs(n.ra) < 3e-4) { n.a = wa; n.ra = 0; } else moving = true;
        if (Math.abs(wp - n.p) < 3e-4 && Math.abs(n.rp) < 3e-4) { n.p = wp; n.rp = 0; } else moving = true;
      }
      if (n.acc) n.acc.setAttribute("d", needlePath(n.g, n.a, 3.6, 18.2, 0.6));
      if (n.per) n.per.setAttribute("d", needlePath(n.g, n.p, 3, 16.8, 0.45));
    });
    // palancas: seguimiento exponencial hacia reposo o accionada
    parts.levers.forEach((p) => {
      const want = s.palancas > p.l.i ? GEO.pull : GEO.rest;
      p.at = instant ? want : p.at + (want - p.at) * (1 - Math.exp(-dt / 0.18));
      if (Math.abs(want - p.at) < 0.002) p.at = want; else moving = true;
      if (p.drawn === null || Math.abs(p.at - p.drawn) > 0.0005) { p.drawn = p.at; if (p.el) p.el.innerHTML = PL.palancaSvg(K, T, P, p.l, p.at); }
    });
    // émbolo del relé
    const wantH = s.disparo ? pl.lift : 0;
    plungerAt = instant ? wantH : plungerAt + (wantH - plungerAt) * (1 - Math.exp(-dt / 0.12));
    if (Math.abs(wantH - plungerAt) < 0.02) plungerAt = wantH; else moving = true;
    if (Math.abs(plungerAt - plungerDrawn) > 0.01 && parts.plunger) { plungerDrawn = plungerAt; parts.plunger.innerHTML = plungerSvg(plungerAt); }
    return moving;
  }

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    if (touring) {
      tourClock += dt;
      if (tourClock >= HOLD) { tourClock = 0; step = (step + 1) % N; }
    }
    if (step !== lastStep) { lastStep = step; applyStep(); }
    const moving = draw(dt);
    frame = visible && (touring || moving) ? requestAnimationFrame(tick) : 0;
  }
  const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
  function go(to) {
    touring = false;
    step = clamp(to, 0, N - 1);
    clearTimeout(idleTimer);
    if (!still.matches && !params.has("quieto") && fixed === null) {
      idleTimer = setTimeout(() => { touring = true; tourClock = 0; run(); }, 15000);
    }
    run();
  }

  // ---------- entrada ----------
  ui.prev.addEventListener("click", () => go(step - 1));
  ui.next.addEventListener("click", () => go(step + 1 >= N ? 0 : step + 1));
  ui.chips.forEach((b) => b.addEventListener("click", () => go(Number(b.getAttribute("data-paso")))));
  stage.addEventListener("keydown", (e) => {
    let to = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === " " || e.key === "Enter") to = step + 1 >= N && e.key !== "ArrowRight" && e.key !== "ArrowUp" ? 0 : step + 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") to = step - 1;
    if (e.key === "Home") to = 0;
    if (e.key === "End") to = N - 1;
    if (/^[1-7]$/.test(e.key)) to = Number(e.key) - 1;
    if (to === null) return;
    e.preventDefault();
    go(to);
  });
  stage.addEventListener("pointerdown", () => go(step + 1 >= N ? 0 : step + 1));
  if (still.addEventListener) still.addEventListener("change", () => { if (still.matches) touring = false; run(); });

  applyStep();
  lastStep = step;
  draw(0);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "80px 0px" }).observe(stage);
  } else { visible = true; run(); }
})();
