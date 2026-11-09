/*
 * Figura viva: la perilla elige el mes (1…5); los depósitos se llenan y las agujas giran.
 * Todo número visible sale de EvmModelo.estado(mes). Sin módulos ni scripts en línea (CSP script-src 'self').
 */
(function () {
  "use strict";
  const K = window.IsoKit;
  const M = window.EvmModelo;
  const stage = document.querySelector(".vg-stage");
  if (!K || !M || !stage) return;

  const GEO = JSON.parse(stage.getAttribute("data-geo"));
  const P = GEO.P;
  const svg = stage.querySelector("svg");
  const $ = (sel) => svg.querySelector(sel);
  const readout = document.querySelector('[data-part="lectura"]');
  const corner = document.querySelector("[data-readout]");
  const buttons = Array.from(document.querySelectorAll(".vg-stop"));
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  const params = new URLSearchParams(location.search);
  const clamp = M.clamp;

  const parts = {
    liquids: GEO.tanks.map((t) => ({ t, el: $(`[data-part="liquido"][data-tanque="${t.id}"]`) })),
    eac: $('[data-part="eac"]'),
    tab: $('[data-part="perilla-aleta"]'),
    pointer: $('[data-part="perilla-indice"]'),
    counter: $('[data-part="contador"]'),
    lamps: Array.from(svg.querySelectorAll('[data-part="lampara"]')),
    needles: GEO.gauges.map((g) => ({ g, el: $(`[data-part="aguja"][data-indice="${g.id}"]`), at: 0, rate: 0 })),
  };

  // ---------- geometría viva ----------
  const D2R = Math.PI / 180;
  const f2 = (n) => n.toFixed(2);
  const line = (a, b) => "M" + f2(a[0]) + " " + f2(a[1]) + "L" + f2(b[0]) + " " + f2(b[1]);
  const thetaOf = (v) => ((clamp(v, GEO.dial.lo, GEO.dial.hi) - 1) / ((GEO.dial.hi - GEO.dial.lo) / 2)) * GEO.dial.sweep * D2R;
  function facePoint(g, r, theta) {
    const a = theta - Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
    return K.iso([0, 1, 2].map((i) => g.o[i] + g.a[i] * g.s + r * (c * g.u[i] + s * g.v[i])), P);
  }
  const needlePath = (g, theta) => line(facePoint(g, g.tail, theta + Math.PI), facePoint(g, g.tip, theta));
  const knobAngle = (m) => (GEO.knob.az + 72 - 36 * (m - 1)) * D2R;
  function knobTab(m) {
    const phi = knobAngle(m), c = Math.cos(phi), s = Math.sin(phi), { x, y } = GEO.knob;
    const ring = [[8.4, -1.5], [13.4, -1.0], [13.4, 1.0], [8.4, 1.5]].map(([r, w]) => [x + c * r - s * w, y + s * r + c * w]);
    return K.solidSvg(K.extrude(ring, GEO.knob.boss, 2.4, P), { tone: "hi", lit: true });
  }
  function knobPointer(m) {
    const phi = knobAngle(m), { x, y, r, top } = GEO.knob;
    return K.lineOnTop([x - Math.cos(phi) * 2, y - Math.sin(phi) * 2], [x + Math.cos(phi) * (r - 1.4), y + Math.sin(phi) * (r - 1.4)], top + 0.05, P);
  }
  const liquidSvg = (t, value) => K.solidSvg(K.cylinder(t.x, t.y, GEO.liq.r, GEO.liq.z, Math.max(0.05, value / GEO.unit), P, 48), { tone: "hi", crease: "none" });

  // ---------- textos ----------
  const largo = (s) => `Mes ${s.mes} · PV ${M.dinero(s.pv)} · AC ${M.dinero(s.ac)} · EV ${M.dinero(s.ev)} · CPI ${M.decimal(s.cpi)} · SPI ${M.decimal(s.spi)} · EAC ${M.dinero(s.eac)}`;
  const corto = (s) => `Mes ${s.mes} · CPI ${M.decimal(s.cpi)} · SPI ${M.decimal(s.spi)}`;

  // ---------- estado ----------
  const fixed = params.has("mes") ? clamp(Math.round(Number(params.get("mes")) || 3), 1, M.ULTIMO) : null;
  const startM = fixed || Number(stage.getAttribute("aria-valuenow")) || 3;
  let shown = startM; // mes mostrado (sigue al objetivo con suavizado)
  let target = startM;
  let touring = !still.matches && !params.has("quieto") && fixed === null;
  let tourClock = 0;
  let frame = 0, last = 0, visible = false, idleTimer = 0, lastTarget = null, lastKey = "";
  const TOUR = [1, 2, 3, 4, 5];
  const HOLD = 3.2; // segundos por mes
  const tourAt = (t) => TOUR[Math.floor(t / HOLD) % TOUR.length];

  function draw(dt) {
    const s = M.estado(shown);
    const key = shown.toFixed(4);
    if (key !== lastKey) {
      lastKey = key;
      parts.liquids.forEach(({ t, el }) => { if (el) el.innerHTML = liquidSvg(t, s[t.id]); });
      if (parts.eac) parts.eac.setAttribute("transform", K.translateAlong(P, [0, 0, s.eac / GEO.unit]));
      if (parts.tab) parts.tab.innerHTML = knobTab(shown);
      if (parts.pointer) parts.pointer.setAttribute("d", knobPointer(shown));
      if (parts.counter) parts.counter.textContent = M.dinero(Math.round(s.eac / 10) * 10);
      parts.lamps.forEach((el) => el.toggleAttribute("data-on", el.getAttribute("data-zona") === s.semaforo));
    }
    // agujas: resorte suave con un leve sobrepaso, siguen el índice del mes mostrado
    parts.needles.forEach((n) => {
      const want = thetaOf(s[n.g.id]);
      if (still.matches || !dt) { n.at = want; n.rate = 0; }
      else {
        for (let i = 0; i < 4; i++) { n.rate += ((want - n.at) * 90 - n.rate * 15) * (dt / 4); n.at += n.rate * (dt / 4); }
        if (Math.abs(want - n.at) < 0.0004 && Math.abs(n.rate) < 0.0004) { n.at = want; n.rate = 0; }
      }
      if (n.el) n.el.setAttribute("d", needlePath(n.g, n.at));
    });
    if (target !== lastTarget) {
      lastTarget = target;
      const t = M.estado(target);
      readout.textContent = largo(t);
      if (corner) corner.textContent = corto(t);
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-mes")) === target)));
      stage.setAttribute("aria-valuenow", String(target));
      stage.setAttribute("aria-valuetext", largo(t));
    }
  }

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    if (touring) { tourClock += dt; target = tourAt(tourClock); }
    if (still.matches) shown = target;
    else {
      const step = (target - shown) * (1 - Math.exp(-dt / 0.45));
      const cap = 2.2 * dt;
      shown += clamp(step, -cap, cap);
      if (Math.abs(target - shown) < 0.0005) shown = target;
    }
    draw(dt);
    const settled = !touring && shown === target && parts.needles.every((n) => n.rate === 0);
    frame = visible && !settled ? requestAnimationFrame(tick) : 0;
  }
  const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
  const steer = (m) => {
    touring = false;
    target = clamp(Math.round(m), 1, M.ULTIMO);
    clearTimeout(idleTimer);
    if (!still.matches && !params.has("quieto") && fixed === null) {
      idleTimer = setTimeout(() => { touring = true; tourClock = TOUR.indexOf(target) * HOLD + HOLD - 0.01; run(); }, 10000);
    }
    run();
  };

  // ---------- entrada ----------
  buttons.forEach((b) => b.addEventListener("click", () => steer(Number(b.getAttribute("data-mes")))));
  stage.addEventListener("keydown", (e) => {
    let to = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") to = target + 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") to = target - 1;
    if (e.key === "Home") to = 1;
    if (e.key === "End") to = M.ULTIMO;
    if (/^[1-5]$/.test(e.key)) to = Number(e.key);
    if (to === null) return;
    e.preventDefault();
    steer(to);
  });
  let dragging = false;
  const fromPointer = (e) => {
    const box = svg.getBoundingClientRect();
    const f = clamp(((e.clientX - box.left) / box.width - 0.15) / 0.7, 0, 1);
    return 1 + f * (M.ULTIMO - 1);
  };
  stage.addEventListener("pointerdown", (e) => { dragging = true; try { stage.setPointerCapture(e.pointerId); } catch (_) {} steer(fromPointer(e)); });
  stage.addEventListener("pointermove", (e) => { if (dragging) steer(fromPointer(e)); });
  const release = () => { dragging = false; };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("focus", () => { if (touring) { touring = false; target = Math.round(shown); run(); } });
  if (still.addEventListener) still.addEventListener("change", () => { if (still.matches) touring = false; run(); });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
  } else { visible = true; run(); }
  if (touring) tourClock = TOUR.indexOf(startM) * HOLD;
  draw(0);
})();
