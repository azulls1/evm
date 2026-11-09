import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { CurvaS } from '../componentes/curva-s';
import { Encabezado } from '../componentes/encabezado';
import { Estado } from '../componentes/estado';
import { Histograma } from '../componentes/histograma';
import { Icono } from '../componentes/icono';
import { Figura } from '../componentes/figura';
import { Kpi } from '../componentes/kpi';
import { Medidor } from '../componentes/medidor';
import { Analisis, Contenido, DatosCaso, ParametrosSimulacion, Simulacion } from '../core/modelos';
import { dec, mx, pct } from '../core/formato';

type Variante = 'enunciado' | 'sin-medidas' | 'propio';

/**
 * Laboratorio (ampliación del portal): 1) cambiar AC y avance de cada mes y ver al instante cómo cambian los
 * indicadores; 2) simular miles de cierres posibles del proyecto (Monte Carlo en el worker de Celery).
 */
@Component({
  selector: 'app-laboratorio',
  imports: [CurvaS, Encabezado, Estado, Figura, Histograma, Icono, Kpi, Medidor],
  template: `
    <app-encabezado titulo="Laboratorio de valor ganado" icono="dado" etiqueta="Ampliación del portal · no forma parte del enunciado">
      <span entrada>Cambia lo que gastó y lo que avanzó el proyecto cada mes y mira cómo responden los índices. Después, simula miles de
        cierres posibles para pasar de un solo número (EAC, 6 ÷ SPI) a una probabilidad de terminar dentro del presupuesto y del plazo.</span>
    </app-encabezado>

    <app-estado [cargando]="c.isLoading()" [error]="c.error()" [vacio]="!c.hasValue()" (reintentar)="c.reload()">
      @if (datos(); as d) {
        <!-- 1 · Escenarios -->
        <h2 class="seccion">1 · ¿Y si…? Escenarios inmediatos</h2>
        <div class="mb-3 flex flex-wrap gap-1 rounded-xl border border-fog bg-white p-1" role="tablist" aria-label="Escenario">
          @for (o of variantes; track o.id) {
            <button type="button" role="tab" [attr.aria-selected]="variante() === o.id" (click)="elegir(o.id)"
                    class="flex-1 rounded-lg px-3 py-2 text-sm transition" [class]="variante() === o.id ? 'bg-forest text-white shadow' : 'text-evergreen hover:bg-acento-suave'">{{ o.texto }}</button>
          }
        </div>
        <p class="mb-4 text-sm text-tenue">{{ descripcionVariante() }}</p>

        <div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <section class="panel overflow-x-auto">
            <table class="tabla min-w-[34rem]">
              <thead><tr><th>Mes</th>@for (m of meses(); track m) { <th class="!text-center">{{ m }}</th> }</tr></thead>
              <tbody>
                <tr><td class="text-tenue">PV (plan)</td>@for (v of d.pv_mes; track $index) { <td class="text-center font-mono text-xs text-tenue">{{ mx(v) }}</td> }</tr>
                <tr><td class="font-medium text-forest">AC del mes</td>
                  @for (m of meses(); track m) {
                    <td class="p-1">@if (m <= d.ac_mes.length) {
                      <input type="number" min="0" step="500" class="campo !px-1.5 !py-1 text-center font-mono text-xs" [value]="d.ac_mes[m - 1]"
                             [attr.aria-label]="'Coste real del mes ' + m" (change)="editar('ac_mes', m - 1, $event)" />
                    }</td>
                  }</tr>
                <tr><td class="font-medium text-forest">Avance del mes (%)</td>
                  @for (m of meses(); track m) {
                    <td class="p-1">@if (m <= d.avance_mes.length) {
                      <input type="number" min="0" max="100" step="1" class="campo !px-1.5 !py-1 text-center font-mono text-xs" [value]="d.avance_mes[m - 1]"
                             [attr.aria-label]="'Avance del mes ' + m" (change)="editar('avance_mes', m - 1, $event)" />
                    }</td>
                  }</tr>
              </tbody>
            </table>
            <div class="mt-4 flex flex-wrap items-center gap-4">
              <label class="flex items-center gap-3 text-sm text-evergreen">Corte en el mes
                <input type="range" min="1" [max]="d.ac_mes.length" [value]="corte()" (input)="corte.set(+$any($event.target).value)" class="accent-forest" />
                <span class="font-mono font-semibold text-forest">{{ corte() }}</span></label>
              <button type="button" class="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-fog px-3 py-1.5 text-xs text-forest hover:border-forest" (click)="elegir('enunciado')">
                <app-icono nombre="reiniciar" clase="h-3.5 w-3.5" /> Datos del enunciado</button>
            </div>
            @if (errorEscenario()) { <p class="mt-3 rounded-lg bg-mal-suave px-3 py-2 text-sm text-mal" role="alert">{{ errorEscenario() }}</p> }
          </section>

          <section class="panel grid content-start gap-3" aria-live="polite">
            @if (k(); as x) {
              <div class="grid grid-cols-2 gap-2">
                <app-medidor nombre="CPI" [valor]="x.cpi" [lectura]="x.coste" />
                <app-medidor nombre="SPI" [valor]="x.spi" [lectura]="x.plazo" />
              </div>
              <dl class="grid grid-cols-2 gap-2 text-sm">
                <div class="rounded-lg bg-acento-suave p-2"><dt class="font-mono text-[10px] text-moss">EV</dt><dd class="font-mono text-forest">{{ mx(x.ev) }}</dd></div>
                <div class="rounded-lg bg-acento-suave p-2"><dt class="font-mono text-[10px] text-moss">EAC (a)</dt><dd class="font-mono text-forest">{{ mx(x.eac_a) }}</dd></div>
                <div class="rounded-lg bg-acento-suave p-2"><dt class="font-mono text-[10px] text-moss">EAC (b)</dt><dd class="font-mono text-forest">{{ mx(x.eac_b) }}</dd></div>
                <div class="rounded-lg bg-acento-suave p-2"><dt class="font-mono text-[10px] text-moss">Duración</dt><dd class="font-mono text-forest">{{ dec(x.duracion, 2) }} meses</dd></div>
              </dl>
            }
          </section>
        </div>
        @if (analisis(); as a) {
          <section class="panel mt-6"><app-curva-s [serie]="a.serie" [bac]="d.bac" [cortes]="[corte()]" /></section>
        }

        <!-- 2 · Monte Carlo -->
        <h2 class="seccion mt-10">2 · Simular el cierre del proyecto (Monte Carlo)</h2>
        <section class="panel">
          <p class="mb-4 text-sm text-tenue">Desde el corte elegido, cada mes que falta avanza un porcentaje y cuesta un importe por punto de avance, sorteados alrededor de lo
            observado. Se repite el resto del proyecto miles de veces en el servidor (cola de trabajos con Celery) con los datos del escenario de arriba.</p>
          <div class="grid gap-4 md:grid-cols-4">
            <label class="grid gap-1 text-sm text-evergreen">Corte
              <select class="campo" [value]="corte()" (change)="corte.set(+$any($event.target).value)">
                @for (m of mesesMedidos(); track m) { <option [value]="m" [selected]="m === corte()">Mes {{ m }}</option> }
              </select></label>
            <label class="grid gap-1 text-sm text-evergreen">Ritmo de referencia
              <select class="campo" (change)="ventana.set($any($event.target).value)">
                <option value="todo">Todos los meses medidos</option>
                <option value="reciente">Solo los dos últimos meses</option>
              </select></label>
            <label class="grid gap-1 text-sm text-evergreen">Variabilidad · {{ pct(variabilidad(), 0) }}
              <input type="range" min="0.05" max="0.6" step="0.05" [value]="variabilidad()" (input)="variabilidad.set(+$any($event.target).value)" class="accent-forest" /></label>
            <label class="grid gap-1 text-sm text-evergreen">Iteraciones · {{ iteraciones() }}
              <input type="range" min="500" max="10000" step="500" [value]="iteraciones()" (input)="iteraciones.set(+$any($event.target).value)" class="accent-forest" /></label>
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" class="boton" [disabled]="corriendo() || !!errorEscenario()" (click)="simular()">
              <app-icono [nombre]="corriendo() ? 'reloj' : 'reproducir'" clase="h-4 w-4" /> {{ corriendo() ? 'Simulando…' : 'Simular cierres' }}</button>
            @if (errorSim()) { <span class="text-sm text-mal" role="alert">{{ errorSim() }}</span> }
            @if (res(); as s) { <span class="font-mono text-[11px] text-moss">{{ esUltima() ? 'última simulación guardada · ' : '' }}{{ s.resultado?.iteraciones }} cierres · {{ s.duracion_ms }} ms</span> }
          </div>
        </section>

        @if (res()?.resultado; as r) {
          <section class="stagger-children mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-live="polite">
            <app-kpi etiqueta="Dentro del BAC" [valor]="pct(r.coste.prob_dentro_bac)" [detalle]="'probabilidad de no pasar de ' + mx(r.bac)" icono="diana" />
            <app-kpi etiqueta="En plazo" [valor]="pct(r.duracion.prob_en_plazo)" [detalle]="'terminar en ' + r.duracion_plan + ' meses o menos'" icono="calendario" />
            <app-kpi etiqueta="Coste P50 · P80" [valor]="mx(r.coste.p50)" [detalle]="'P80 ' + mx(r.coste.p80) + ' · EAC (a) ' + mx(r.deterministico.eac_a)" icono="grafica" />
            <app-kpi etiqueta="Duración P50 · P80" [valor]="dec(r.duracion.p50, 2) + ' meses'" [detalle]="'P80 ' + dec(r.duracion.p80, 2) + ' · 6 ÷ SPI = ' + dec(r.deterministico.duracion, 2)" icono="reloj" />
          </section>
          <div class="mt-6 grid gap-6 lg:grid-cols-2">
            <section class="panel"><h3 class="seccion">Coste final</h3>
              <app-histograma [datos]="r.coste.histograma" [referencia]="r.bac" etiquetaRef="BAC" [p50]="r.coste.p50" [p80]="r.coste.p80" [formato]="mx" titulo="Coste a la conclusión en cada cierre simulado" /></section>
            <section class="panel"><h3 class="seccion">Duración</h3>
              <app-histograma [datos]="r.duracion.histograma" [referencia]="r.duracion_plan" etiquetaRef="6 meses" [p50]="r.duracion.p50" [p80]="r.duracion.p80" [formato]="meses2" titulo="Meses hasta terminar en cada cierre simulado" /></section>
          </div>
          @if (analisis(); as a) {
            <section class="panel mt-6"><h3 class="seccion">Abanico de cierres desde el mes {{ r.mes_corte }}</h3>
              <app-curva-s [serie]="a.serie" [bac]="r.bac" [cortes]="[r.mes_corte]" [trayectorias]="r.trayectorias" /></section>
          }
          <p class="mt-4 text-sm text-tenue">Ritmo usado: {{ dec(r.ritmo.avance_medio, 1) }} % de avance al mes y {{ mx(r.ritmo.coste_por_punto) }} por punto de avance
            (el plan supone {{ mx(r.ritmo.coste_por_punto_plan) }}). Con el ritmo de los dos últimos meses se ve el efecto de las medidas del mes 3.</p>
        }

        <h2 class="seccion mt-8">Cada bolita es un cierre simulado</h2>
        <app-figura carpeta="anatomia-cierre" titulo="Tablero de Galton del cierre" alto="64rem" [mensaje]="mensajeCierre()"
                    pie="Las bolitas caen con la incertidumbre del ritmo de avance y de gasto, y se apilan en el mes o el coste en que cierra el proyecto" />
      }
    </app-estado>
  `,
})
export class LaboratorioPagina {
  private readonly http = inject(HttpClient);
  protected readonly c = httpResource<Contenido>(() => '/api/contenido');
  protected readonly mx = mx;
  protected readonly dec = dec;
  protected readonly pct = pct;
  protected readonly meses2 = (x: number) => `${dec(x, 1)} m`;
  protected readonly variantes: { id: Variante; texto: string }[] = [
    { id: 'enunciado', texto: 'Datos del enunciado' },
    { id: 'sin-medidas', texto: '¿Y sin medidas en el mes 3?' },
    { id: 'propio', texto: 'Escenario propio' },
  ];
  protected readonly variante = signal<Variante>('enunciado');
  protected readonly propio = signal<DatosCaso | null>(null);
  protected readonly corte = signal(5);
  protected readonly ventana = signal<'todo' | 'reciente'>('todo');
  protected readonly variabilidad = signal(0.2);
  protected readonly iteraciones = signal(3000);
  protected readonly analisis = signal<Analisis | null>(null);
  protected readonly errorEscenario = signal('');

  /** Datos vigentes: los del enunciado, los de «sin medidas» (meses 4–5 al ritmo de los meses 1–3) o los editados. */
  protected readonly datos = computed<DatosCaso | null>(() => {
    const base = this.c.value()?.datos;
    if (!base) return null;
    if (this.variante() === 'propio' && this.propio()) return this.propio();
    if (this.variante() === 'sin-medidas') {
      const ac = base.ac_mes.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const av = base.avance_mes.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      return { ...base, ac_mes: [...base.ac_mes.slice(0, 3), Math.round(ac), Math.round(ac)], avance_mes: [...base.avance_mes.slice(0, 3), +av.toFixed(2), +av.toFixed(2)] };
    }
    return base;
  });
  protected readonly meses = computed(() => Array.from({ length: this.datos()?.duracion ?? 6 }, (_, i) => i + 1));
  protected readonly mesesMedidos = computed(() => Array.from({ length: this.datos()?.ac_mes.length ?? 5 }, (_, i) => i + 1));
  protected readonly k = computed(() => this.analisis()?.cortes[this.corte() - 1] ?? null);
  protected readonly descripcionVariante = computed(() => ({
    enunciado: 'Los valores reales del enunciado: el corte del mes 3 es la Parte A y el del mes 5, la Parte B.',
    'sin-medidas': 'Contrafactual: los meses 4 y 5 siguen al mismo ritmo promedio de los meses 1 a 3 (coste y avance). Compáralo con el enunciado para ver el efecto de las medidas.',
    propio: 'Edita el coste real y el avance de cada mes. Los indicadores se recalculan en el servidor con cada cambio.',
  })[this.variante()]);

  // Simulación
  private temporizador: ReturnType<typeof setTimeout> | undefined;
  protected readonly ultima = httpResource<Simulacion>(() => '/api/simulacion/ultima');
  protected readonly nueva = signal<Simulacion | null>(null);
  protected readonly res = computed(() => this.nueva() ?? (this.ultima.hasValue() ? this.ultima.value() : null));
  protected readonly esUltima = computed(() => !this.nueva());
  /** Resultado real de la simulación para el tablero de Galton (sin simulación, la figura calcula la suya desde el mes 3). */
  protected readonly mensajeCierre = computed(() => {
    const r = this.res()?.resultado;
    return r ? { tipo: 'cierre', ...r } : null;
  });
  protected readonly corriendo = signal(false);
  protected readonly errorSim = signal('');

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.temporizador));
    // Cada cambio del escenario se recalcula en el servidor (mismo motor que las Partes A y B)
    effect(() => {
      const d = this.datos();
      if (!d) return;
      this.http.post<Analisis>('/api/escenario', d).subscribe({
        next: (a) => { this.analisis.set(a); this.errorEscenario.set(''); if (this.corte() > d.ac_mes.length) this.corte.set(d.ac_mes.length); },
        error: (e) => this.errorEscenario.set(e?.error?.detail?.[0]?.msg?.replace('Value error, ', '') ?? 'Escenario no válido'),
      });
    });
  }

  protected elegir(v: Variante) {
    this.variante.set(v);
    if (v === 'propio' && !this.propio()) this.propio.set(structuredClone(this.c.value()!.datos));
    if (v === 'enunciado') this.propio.set(null);
  }

  protected editar(campo: 'ac_mes' | 'avance_mes', i: number, e: Event) {
    const v = Math.max(0, +(e.target as HTMLInputElement).value || 0);
    const actual = structuredClone(this.datos()!);
    actual[campo][i] = v;
    this.propio.set(actual);
    this.variante.set('propio');
  }

  protected simular() {
    this.corriendo.set(true);
    this.errorSim.set('');
    const p: ParametrosSimulacion = { mes: this.corte(), iteraciones: this.iteraciones(), variabilidad: this.variabilidad(), ventana: this.ventana(),
                                      escenario: this.variante() === 'enunciado' ? null : this.datos() };
    this.http.post<{ id: string }>('/api/simulacion', p).subscribe({
      next: ({ id }) => this.sondear(id, Date.now()),
      error: (e) => {
        this.corriendo.set(false);
        this.errorSim.set(e?.status === 429 ? 'Demasiadas simulaciones seguidas: espera un minuto.' : 'No se pudo encolar la simulación.');
      },
    });
  }

  private sondear(id: string, inicio: number) {
    this.http.get<Simulacion>(`/api/simulacion/${id}`).subscribe({
      next: (s) => {
        if (s.estado === 'pendiente' && Date.now() - inicio < 60000) {
          this.temporizador = setTimeout(() => this.sondear(id, inicio), 600);
          return;
        }
        this.corriendo.set(false);
        if (s.estado === 'completada') this.nueva.set(s);
        else this.errorSim.set(s.error ?? 'La simulación tardó demasiado; inténtalo de nuevo.');
      },
      error: () => { this.corriendo.set(false); this.errorSim.set('Se perdió la conexión con el servidor.'); },
    });
  }
}
