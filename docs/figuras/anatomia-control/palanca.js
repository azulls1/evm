/*
 * Una palanca del bastidor: barra que gira sobre un eje paralelo a x, con cubo, pasador, varilla de trinquete y
 * empuñadura moleteada. La usan el generador (para el estado inicial) y la figura viva (en cada cuadro).
 * theta: ángulo desde la vertical, positivo hacia el observador (+y). L = { x, py, pz }.
 */
(function (global) {
  "use strict";
  const LEN = 56; // del eje al arranque de la empuñadura
  const GRIP = 12;
  const TAIL = 5;
  const T2 = 1.1; // media anchura de la barra en x

  function palancaSvg(K, T, P, L, theta) {
    const s = Math.sin(theta), c = Math.cos(theta);
    const dir = [0, s, c];
    const nor = [0, c, -s];
    const yz = (r, w) => [r * s + w * c, r * c - w * s];
    const F = { o: [L.x - T2, L.py, L.pz], a: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] };
    const along = (r, dx = 0) => [L.x + dx, L.py + dir[1] * r, L.pz + dir[2] * r];
    const out = [];
    // cubo sobre el eje
    out.push(K.solidSvg(T.disc(-0.7, 2 * T2 + 0.7, 4.4, T.frameAlong([L.x - T2, L.py, L.pz], [1, 0, 0]), P), { tone: "mid" }));
    // barra ahusada (de 3,6 a 2,4 de ancho), con contrapeso corto detrás del eje
    const bar = [yz(-TAIL, 2.2), yz(LEN, 1.2), yz(LEN, -1.2), yz(-TAIL, -2.2)];
    out.push(K.solidSvg(T.prismOf(F, bar, 0, 2 * T2, P), { tone: "hi", crease: "none" }));
    // varilla del trinquete sobre la cara +x, con su gatillo bajo la empuñadura
    const fx = L.x + T2 + 0.02;
    const rod = (r, w) => [fx, L.py + r * s + w * c, L.pz + r * c - w * s];
    out.push(K.lineSvg(K.pathOf([K.iso(rod(9, 0.5), P), K.iso(rod(LEN - 4, 0.3), P)]), { tone: "mid" }));
    out.push(K.dotsSvg([K.iso(rod(9, 0.5), P), K.iso(rod(LEN - 4, 0.3), P)], { size: 0.5 }));
    const trig = [yz(LEN - 7, 1.2), yz(LEN - 2, 1.2), yz(LEN - 2, 3.4), yz(LEN - 6, 3.0)];
    out.push(K.solidSvg(T.prismOf(F, trig, 0.3, 2 * T2 - 0.3, P), { tone: "mid", crease: "none" }));
    // pasador del eje
    out.push(K.solidSvg(T.disc(2 * T2 + 0.7, 2 * T2 + 1.5, 1.7, T.frameAlong([L.x - T2, L.py, L.pz], [1, 0, 0]), P), { tone: "hi", lit: true }));
    // empuñadura moleteada y pomo
    const G = T.frameAlong(along(LEN), dir);
    out.push(K.solidSvg(T.disc(0, GRIP, 2.5, G, P), { tone: "hi", crease: "lo", className: "cc-empunadura" }));
    out.push(K.lineSvg(T.ribsOf(G, 1.2, GRIP - 1.2, 2.5, 16, P, { seams: true }), { tone: "lo" }));
    out.push(K.solidSvg(T.sphereOf(along(LEN + GRIP + 1.6), 2.7, P), { tone: "hi", className: "cc-pomo" }));
    void nor;
    return out.join("");
  }

  const api = { palancaSvg, LEN, GRIP };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.ControlPalanca = api;
})(this);
