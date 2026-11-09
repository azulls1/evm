/*
 * Modelo del tablero de Galton del cierre (cifras de fuente/calculos.py; misma lógica que backend/app/simulacion.py).
 * Monte Carlo del resto del proyecto desde un corte: cada mes futuro avanza un % y cuesta un importe por punto de
 * avance, ambos sorteados alrededor de lo observado. Un único modelo puro: la figura y su lectura salen de aquí.
 */
(function (global) {
  "use strict";

  const DATOS = {
    bac: 115000,
    duracion: 6, // meses planificados
    pv_mes: [23000, 15000, 16000, 19000, 20000, 22000],
    ac_mes: [21000, 18000, 19000, 20000, 21000],
    avance_mes: [8, 15, 14, 21, 22], // % realizado en cada mes (no acumulado)
  };
  const MAX_MESES = 36;
  const NB = 20; // contenedores del tablero

  const suma = (v) => v.reduce((a, b) => a + b, 0);
  const media = (v) => suma(v) / v.length;
  const desv = (v) => { const m = media(v); return Math.sqrt(media(v.map((x) => (x - m) ** 2))); }; // poblacional

  function corte(d, mes) {
    const i = mes - 1;
    const pv = suma(d.pv_mes.slice(0, i + 1));
    const ac = suma(d.ac_mes.slice(0, i + 1));
    const avance = suma(d.avance_mes.slice(0, i + 1));
    const ev = (d.bac * avance) / 100;
    const cpi = ev / ac, spi = ev / pv;
    return { mes, pv, ac, avance, ev, cpi, spi, eac_a: ac + (d.bac - ev), eac_b: d.bac / cpi, duracion: d.duracion / spi };
  }

  // Generador con semilla (mulberry32) y normal de Box-Muller
  function rng(seed) {
    let a = seed >>> 0;
    let spare = null;
    const u = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const gauss = (mu, sd) => {
      if (spare !== null) { const s = spare; spare = null; return mu + sd * s; }
      let x, y, r;
      do { x = u() * 2 - 1; y = u() * 2 - 1; r = x * x + y * y; } while (r >= 1 || r === 0);
      const f = Math.sqrt((-2 * Math.log(r)) / r);
      spare = y * f;
      return mu + sd * x * f;
    };
    return { u, gauss };
  }

  function percentil(ordenados, p) {
    if (!ordenados.length) return NaN;
    const k = (ordenados.length - 1) * p;
    const i = Math.floor(k);
    return i + 1 >= ordenados.length ? ordenados[i] : ordenados[i] + (ordenados[i + 1] - ordenados[i]) * (k - i);
  }

  function histograma(valores, n = 24) {
    const lo = Math.min(...valores), hi = Math.max(...valores);
    const ancho = (hi - lo) / n || 1;
    const cuentas = new Array(n).fill(0);
    valores.forEach((v) => { cuentas[Math.min(n - 1, Math.floor((v - lo) / ancho))]++; });
    return cuentas.map((c, i) => ({ desde: lo + i * ancho, hasta: lo + (i + 1) * ancho, n: c }));
  }

  // Igual que simulacion.simular(): devuelve los mismos campos y, además, los pares (coste, duración) de cada cierre.
  function simular({ mes = 3, iteraciones = 3000, variabilidad = 0.2, ventana = "todo", semilla = 2026, datos = DATOS } = {}) {
    const d = datos;
    const base = corte(d, mes);
    const g = rng(semilla);
    const desde = ventana === "reciente" ? Math.max(0, mes - 2) : 0;
    const avance = d.avance_mes.slice(desde, mes);
    const costePct = d.ac_mes.slice(desde, mes).map((ac, j) => ac / avance[j]).filter((x, j) => avance[j] > 0);
    const muAv = media(avance), muC = media(costePct);
    const sdAv = Math.max(avance.length > 1 ? desv(avance) : 0, variabilidad * muAv);
    const sdC = Math.max(costePct.length > 1 ? desv(costePct) : 0, variabilidad * muC);
    const pares = [];
    for (let it = 0; it < iteraciones; it++) {
      let hecho = base.avance, gasto = base.ac, meses = mes;
      while (hecho < 100 - 1e-9 && meses < MAX_MESES) {
        const av = Math.max(0.5, g.gauss(muAv, sdAv));
        const c = Math.max(0, g.gauss(muC, sdC));
        const fr = Math.min(1, (100 - hecho) / av); // el último mes solo se trabaja lo que falta
        hecho += av * fr;
        gasto += av * fr * c;
        meses += fr;
      }
      pares.push([gasto, meses]);
    }
    const cs = pares.map((p) => p[0]).sort((a, b) => a - b);
    const ds = pares.map((p) => p[1]).sort((a, b) => a - b);
    const resumen = (v, extra) => Object.assign({ media: media(v), p10: percentil(v, 0.1), p50: percentil(v, 0.5), p80: percentil(v, 0.8), p90: percentil(v, 0.9), histograma: histograma(v) }, extra);
    return {
      mes_corte: mes, iteraciones, ventana, variabilidad, bac: d.bac, duracion_plan: d.duracion,
      deterministico: { eac_a: base.eac_a, eac_b: base.eac_b, duracion: base.duracion, cpi: base.cpi, spi: base.spi },
      coste: resumen(cs, { prob_dentro_bac: cs.filter((c) => c <= d.bac).length / iteraciones }),
      duracion: resumen(ds, { prob_en_plazo: ds.filter((x) => x <= d.duracion + 1e-9).length / iteraciones }),
      pares,
    };
  }

  // Eje del tablero: 20 contenedores; el plan (BAC o duración planificada) cae siempre en el borde del contenedor 2.
  // Duración: pasos de un cuarto de mes (plan ÷ 24). Coste: pasos de $7 500 por cada $115 000 de BAC.
  function eje(modo, bac, plan) {
    const paso = modo === "coste" ? (bac * 7.5) / 115 : plan / 24;
    const plano = modo === "coste" ? bac : plan;
    return { modo, paso, desde: plano - 2 * paso, plan: plano, nb: NB };
  }
  const contenedor = (e, v) => Math.max(0, Math.min(e.nb - 1, Math.floor((v - e.desde) / e.paso)));

  // n valores estratificados de un histograma {desde, hasta, n}: cuantiles (i + ½ + δ) / n, interpolados dentro del tramo.
  function muestras(hist, n, desfase = 0.5) {
    const total = suma(hist.map((h) => h.n));
    const out = [];
    let acc = 0, j = 0;
    for (let i = 0; i < n; i++) {
      const q = ((i + desfase) / n) * total;
      while (j < hist.length - 1 && acc + hist[j].n < q) { acc += hist[j].n; j++; }
      const h = hist[j];
      const f = h.n > 0 ? Math.min(1, Math.max(0, (q - acc) / h.n)) : 0.5;
      out.push(h.desde + (h.hasta - h.desde) * f);
    }
    return out;
  }

  // Formatos del portal: miles con espacio duro y decimales con coma.
  const miles = (n) => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const dinero = (n) => (n < 0 ? "−$" : "$") + miles(n);
  const decimal = (n, d = 1) => n.toFixed(d).replace(".", ",");
  const porcentaje = (p) => { const v = p * 100; return (v > 0 && v < 1 ? decimal(v, 1) : v > 99 && v < 100 ? decimal(v, 1) : String(Math.round(v))) + " %"; };

  const M = { DATOS, NB, MAX_MESES, corte, rng, percentil, histograma, simular, eje, contenedor, muestras, miles, dinero, decimal, porcentaje };
  if (typeof module !== "undefined" && module.exports) module.exports = M;
  else global.CierreModelo = M;
})(this);
