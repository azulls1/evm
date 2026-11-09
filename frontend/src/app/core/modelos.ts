/** Tipos de la API (contrato en specs/001-portal-valorganado/contracts/api.md). */

export interface DatosCaso {
  bac: number;
  duracion: number;
  pv_mes: number[];
  ac_mes: number[];
  avance_mes: number[];
}

export interface Corte {
  mes: number;
  pv: number;
  ac: number;
  avance: number;
  ev: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  eac_a: number;
  eac_b: number;
  eac_c: number;
  tcpi: number;
  duracion: number;
  vac: number;
  coste: string;
  plazo: string;
}

export interface PuntoSerie {
  mes: number;
  pv: number;
  ac: number | null;
  ev: number | null;
}

export interface Periodo {
  desde: number;
  hasta: number;
  ev: number;
  ac: number;
  pv: number;
  cpi: number;
  spi: number;
}

export interface Analisis {
  cortes: Corte[];
  serie: PuntoSerie[];
}

export interface Pregunta {
  n: number;
  pregunta: string;
  enunciado: string;
  respuesta: string;
}

export interface Parte {
  mes: number;
  titulo: string;
  preguntas: Pregunta[];
  estrategias?: { titulo: string; texto: string }[];
}

export interface Portada {
  universidad: string;
  programa: string;
  asignatura: string;
  actividad: string;
  alumno: string;
  profesora: string;
  fecha: string;
}

export interface Contenido {
  portada: Portada;
  introduccion: string;
  nota_avance: string;
  formulas: { indicador: string; formula: string }[];
  datos: DatosCaso;
  partes: { A: Parte; B: Parte };
  periodo: { desde: number; hasta: number };
  conclusion: string;
  referencias: string[];
  enunciado: {
    comunes: string[];
    A5: string;
    B5: string;
    extension: string;
    rubrica: { criterio: string; nombre: string; descripcion: string; puntos: number; peso: number }[];
  };
  analisis: Analisis;
  periodo_medidas: Periodo;
  hibrido: Hibrido;
  actualizado_en: string;
}

/** Enfoque híbrido (clásico + ágil): textos de fuente/contenido.py y cálculos del motor EVM. */
export interface PronosticoVelocidad {
  mes: number;
  desde: number;
  ventana: string;
  velocidad: number;
  falta: number;
  duracion: number;
}

export interface PuntoBurnup {
  mes: number;
  plan: number;
  terminado: number | null;
}

export interface Hibrido {
  idea: string;
  clasico: { elemento: string; uso: string }[];
  agil: { elemento: string; uso: string }[];
  encaje: { paso: string; texto: string }[];
  iteraciones: { semanas: number; por_mes: number; total: number };
  nota: string;
  burnup: PuntoBurnup[];
  pronosticos: PronosticoVelocidad[];
}

export interface Resumen {
  portada: Portada;
  bac: number;
  duracion: number;
  a: Corte;
  b: Corte;
  periodo_medidas: Periodo;
  serie: PuntoSerie[];
  conclusion: string;
  cumplimiento: { cumplidos: number; total: number };
  simulaciones: number;
}

export interface Requisito {
  id: string;
  criterio: string;
  texto: string;
  cumplido: boolean;
  aviso: boolean;
  evidencia: string;
  ruta: string;
}

export interface ParametrosSimulacion {
  mes: number;
  iteraciones: number;
  variabilidad: number;
  ventana: 'todo' | 'reciente';
  semilla?: number | null;
  escenario?: DatosCaso | null;
}

export interface Distribucion {
  media: number;
  p10: number;
  p50: number;
  p80: number;
  p90: number;
  histograma: { desde: number; hasta: number; n: number }[];
}

export interface ResultadoSimulacion {
  mes_corte: number;
  iteraciones: number;
  ventana: 'todo' | 'reciente';
  variabilidad: number;
  ritmo: { avance_medio: number; avance_sd: number; coste_por_punto: number; coste_por_punto_sd: number; coste_por_punto_plan: number };
  deterministico: { eac_a: number; eac_b: number; eac_c: number; duracion: number; cpi: number; spi: number };
  coste: Distribucion & { prob_dentro_bac: number };
  duracion: Distribucion & { prob_en_plazo: number };
  trayectorias: { mes: number; ev: number; ac: number }[][];
  bac: number;
  duracion_plan: number;
  duracion_ms: number;
}

export interface Simulacion {
  id: string;
  estado: 'pendiente' | 'completada' | 'error';
  parametros: ParametrosSimulacion;
  resultado: ResultadoSimulacion | null;
  error: string | null;
  duracion_ms: number | null;
  creado_en: string;
  completado_en: string | null;
}

export interface ArchivoEntregable {
  ruta: string;
  nombre: string;
  tipo: string;
  criterio: string;
  detalle: string;
  bytes: number;
  sha256: string;
}

export interface Paquete {
  id: string;
  estado: 'pendiente' | 'completada' | 'error';
  archivo: string | null;
  n_archivos: number | null;
  bytes: number | null;
  sha256: string | null;
  error: string | null;
  creado_en: string;
  completado_en: string | null;
}

export interface Entregables {
  archivos: ArchivoEntregable[];
  total_bytes: number;
  entrega: (ArchivoEntregable & { contenido: { nombre: string; bytes: number }[]; leeme: string }) | null;
  ultimo_paquete: Paquete | null;
  recientes: Paquete[];
}

/** Colores de las tres curvas (los mismos de la figura 1 del documento). */
export const COLOR = { pv: '#1F3A68', ac: '#C0392B', ev: '#2E8B57' } as const;
