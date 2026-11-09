/** Formatos con la misma convención del documento: miles con espacio y decimales con coma. */
const miles = (n: number, decimales = 0) => {
  const [ent, frac] = n.toFixed(decimales).split('.');
  return ent.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + (frac ? ',' + frac : '');
};

/** 130450 → "$130 450"; -15450 → "−$15 450" */
export const mx = (x: number | null | undefined, decimales = 0) =>
  x == null ? '—' : (x < 0 ? '−$' : '$') + miles(Math.abs(x), decimales);

/** 0.73362 → "0,734" */
export const dec = (x: number | null | undefined, decimales = 3) =>
  x == null ? '—' : x.toFixed(decimales).replace('.', ',');

/** 0.4123 → "41,2 %" */
export const pct = (x: number | null | undefined, decimales = 1) =>
  x == null ? '—' : `${(x * 100).toFixed(decimales).replace('.', ',')} %`;

/** 130450 → "$130 mil" (ejes de gráficas) */
export const milesCorto = (x: number) => `$${Math.round(x / 1000)} mil`;

/** 1 → "Mes 1" */
export const mes = (m: number) => `Mes ${Number.isInteger(m) ? m : m.toFixed(1).replace('.', ',')}`;
