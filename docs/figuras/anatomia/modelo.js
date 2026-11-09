/*
 * Modelo del control por valor ganado (fuente: entregables/datos/linea_base_y_mediciones.csv).
 * Un único modelo puro: la geometría del tablero y la lectura en vivo salen de aquí.
 * Proyecto de software de 6 meses, BAC = $115 000, revisado en los meses 3 y 5.
 */
(function (global) {
  "use strict";

  const BAC = 115000;
  const MESES = 6;
  // Acumulados al cierre de cada mes (índice 0 = mes 1).
  const PV = [23000, 38000, 54000, 73000, 93000, 115000];
  const AC = [21000, 39000, 58000, 78000, 99000];
  const AVANCE = [8, 23, 37, 58, 80]; // % del alcance terminado
  const CORTES = [3, 5]; // meses de revisión
  const ULTIMO = AC.length; // último mes con medición real

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // Valor en el mes m (real, 0…ULTIMO): interpolación lineal entre cierres, 0 al arrancar.
  function serie(lista, m) {
    const x = clamp(m, 0, lista.length);
    const i = Math.floor(x);
    const a = i === 0 ? 0 : lista[i - 1];
    if (i >= lista.length) return lista[lista.length - 1];
    const b = lista[i];
    return a + (b - a) * (x - i);
  }

  function estado(m) {
    const pv = serie(PV, m);
    const ac = serie(AC, m);
    const avance = serie(AVANCE, m);
    const ev = (BAC * avance) / 100;
    const cpi = ac > 0 ? ev / ac : 1;
    const spi = pv > 0 ? ev / pv : 1;
    return {
      mes: m,
      pv,
      ac,
      ev,
      avance,
      cv: ev - ac,
      sv: ev - pv,
      cpi,
      spi,
      eac: ac + (BAC - ev), // EAC con el desvío como atípico: AC + (BAC − EV)
      zonaCpi: zonaDe(cpi),
      zonaSpi: zonaDe(spi),
      semaforo: zonaDe(Math.min(cpi, spi)), // la torre enciende la zona del índice más bajo
    };
  }

  // Zonas del manómetro: roja < 0,9 ≤ ámbar ≤ 1 < verde.
  function zonaDe(indice) {
    if (indice < 0.9) return "roja";
    if (indice <= 1) return "ambar";
    return "verde";
  }

  // Formatos del portal: miles con espacio duro y decimales con coma.
  const miles = (n) => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const dinero = (n) => (n < 0 ? "−$" : "$") + miles(n);
  const decimal = (n, d = 3) => n.toFixed(d).replace(".", ",");

  const M = { BAC, MESES, PV, AC, AVANCE, CORTES, ULTIMO, clamp, serie, estado, zonaDe, miles, dinero, decimal };
  if (typeof module !== "undefined" && module.exports) module.exports = M;
  else global.EvmModelo = M;
})(this);
