/*
 * Modelo del ciclo de control del mes 3 (cifras de fuente/calculos.py; estrategias de fuente/contenido.py).
 * Un único modelo puro: las agujas, el relé, las palancas y la lectura salen de aquí.
 * Tema 5, apartado 5.8: medir, comparar con un umbral de tolerancia, actuar y volver a medir.
 */
(function (global) {
  "use strict";

  const BAC = 115000;
  const PV_MES = [23000, 15000, 16000, 19000, 20000, 22000];
  const AC_MES = [21000, 18000, 19000, 20000, 21000];
  const AVANCE_MES = [8, 15, 14, 21, 22];
  const UMBRAL = 0.1; // tolerancia: desvío máximo del 10 % respecto de 1
  const suma = (v) => v.reduce((a, b) => a + b, 0);

  // Acumulado al cierre de un mes, o solo de los meses desde..hasta
  function periodo(desde, hasta) {
    const ev = (BAC * suma(AVANCE_MES.slice(desde - 1, hasta))) / 100;
    const ac = suma(AC_MES.slice(desde - 1, hasta));
    const pv = suma(PV_MES.slice(desde - 1, hasta));
    return { ev, ac, pv, cpi: ev / ac, spi: ev / pv };
  }
  const corte = (mes) => { const p = periodo(1, mes); p.eac = p.ac + (BAC - p.ev); return p; };
  const MES3 = corte(3); // CPI 0,734 · SPI 0,788 · EAC 130 450
  const MES5 = corte(5); // CPI 0,929 · SPI 0,989 · EAC 122 000
  const P45 = periodo(4, 5); // solo meses 4–5: CPI 1,206 · SPI 1,268
  const desvio = (indice) => Math.abs(1 - indice);
  const fuera = (c) => desvio(c.cpi) > UMBRAL || desvio(c.spi) > UMBRAL;

  const PALANCAS = [
    { n: 1, nombre: "Acciones correctivas con umbrales y reuniones de estado", apartado: "5.8" },
    { n: 2, nombre: "Control de cambios de alcance", apartado: "5.7" },
    { n: 3, nombre: "Recursos y paquetes pequeños en un enfoque híbrido", apartado: "Temas 2 y 4, 5.8" },
  ];

  // Formatos del portal: miles con espacio duro y decimales con coma.
  const miles = (n) => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const dinero = (n) => (n < 0 ? "−$" : "$") + miles(n);
  const decimal = (n, d = 3) => n.toFixed(d).replace(".", ",");
  const pct = (v, d = 1) => decimal(v * 100, d) + " %";

  // Los siete pasos del ciclo. acum: lo que leen las agujas principales; periodo: la aguja azul (o null).
  const PASOS = [
    {
      titulo: "Medición del mes 3", acum: MES3, periodo: null, disparo: false, rearme: false, palancas: 0, contador: "MES 3", flujo: "medicion",
      texto: `CPI ${decimal(MES3.cpi)} y SPI ${decimal(MES3.spi)}: cada peso gastado rinde 73 centavos de trabajo y se ha hecho el ${Math.round(MES3.spi * 100)} % de lo planificado.`,
    },
    {
      titulo: "Umbral del 10 % superado", acum: MES3, periodo: null, disparo: true, rearme: false, palancas: 0, contador: "MES 3", flujo: "disparo",
      texto: `Desvío de ${pct(desvio(MES3.cpi))} en coste y de ${pct(desvio(MES3.spi))} en plazo, por encima de la tolerancia del 10 %: el relé dispara y el problema se escala a la dirección.`,
    },
    {
      titulo: "Palanca 1: acciones correctivas", acum: MES3, periodo: null, disparo: true, rearme: false, palancas: 1, contador: "MES 3", flujo: "accion",
      texto: "Análisis de la causa por paquete de trabajo, acciones acordadas y reuniones periódicas de estado con informe de valor ganado mensual e hitos de control (5.8).",
    },
    {
      titulo: "Palanca 2: control de cambios de alcance", acum: MES3, periodo: null, disparo: true, rearme: false, palancas: 2, contador: "MES 3", flujo: "accion",
      texto: "Se congela el alcance comprometido; toda solicitud nueva pasa por evaluación de impacto en coste y plazo, con aceptación formal de cada entregable y sin gold plating (5.7).",
    },
    {
      titulo: "Palanca 3: recursos y paquetes pequeños", acum: MES3, periodo: null, disparo: true, rearme: false, palancas: 3, contador: "MES 3", flujo: "accion",
      texto: "Los perfiles más productivos pasan a la ruta crítica y el trabajo restante se ejecuta en iteraciones ágiles de dos semanas con paquetes pequeños aceptados por el cliente, dentro del marco clásico de línea base y valor ganado (Temas 2 y 4, 5.8).",
    },
    {
      titulo: "Meses 4 y 5: el efecto", acum: MES3, periodo: P45, disparo: true, rearme: false, palancas: 3, contador: "MES 4-5", flujo: "retorno",
      texto: `Solo en esos dos meses se ganaron ${dinero(P45.ev)} gastando ${dinero(P45.ac)} con un plan de ${dinero(P45.pv)}: CPI del periodo ${decimal(P45.cpi)} y SPI del periodo ${decimal(P45.spi)}, ambos por encima de 1.`,
    },
    {
      titulo: "Mes 5: dentro de la tolerancia", acum: MES5, periodo: P45, disparo: false, rearme: true, palancas: 3, contador: "MES 5", flujo: "",
      texto: `CPI ${decimal(MES5.cpi)} y SPI ${decimal(MES5.spi)} (desvíos de ${pct(desvio(MES5.cpi))} y ${pct(desvio(MES5.spi))}): el relé se rearma. El EAC baja de ${dinero(MES3.eac)} a ${dinero(MES5.eac)}.`,
    },
  ];

  const M = { BAC, UMBRAL, MES3, MES5, P45, PALANCAS, PASOS, periodo, corte, desvio, fuera, miles, dinero, decimal, pct };
  if (typeof module !== "undefined" && module.exports) module.exports = M;
  else global.ControlModelo = M;
})(this);
