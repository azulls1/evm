import { Component, computed, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CurvaS } from '../componentes/curva-s';
import { Encabezado } from '../componentes/encabezado';
import { Figura } from '../componentes/figura';
import { Estado } from '../componentes/estado';
import { Icono } from '../componentes/icono';
import { Medidor } from '../componentes/medidor';
import { Revelar } from '../componentes/revelar';
import { Contenido, Corte } from '../core/modelos';
import { DiagramaFig } from '../componentes/diagrama';
import { dec, mx } from '../core/formato';

/** Parte A (mes 3) o Parte B (mes 5): cálculo paso a paso, medidores, curva S y las cinco respuestas. */
@Component({
  selector: 'app-parte',
  imports: [CurvaS, DiagramaFig, Encabezado, Figura, Estado, Icono, Medidor, Revelar, RouterLink],
  template: `
    <app-estado [cargando]="c.isLoading()" [error]="c.error()" [vacio]="!c.hasValue()" (reintentar)="c.reload()">
      @if (vista(); as v) {
        <app-encabezado [titulo]="'Parte ' + parte() + '. ' + v.p.titulo" [icono]="parte() === 'A' ? 'grafica' : 'burndown'"
                        [etiqueta]="(parte() === 'A' ? 'Criterio 1' : 'Criterio 2') + ' · 4 puntos · 40 %'">
          <span entrada>Corte al cierre del mes {{ v.k.mes }}: PV, AC y avance acumulados hasta ese mes. Cada número se recalcula en el servidor con las
            fórmulas del Tema 5 y es el mismo que aparece en el documento entregado.</span>
        </app-encabezado>

        <div class="grid gap-6 lg:grid-cols-[1fr_19rem]">
          <section class="panel overflow-x-auto">
            <h2 class="seccion">Cálculo paso a paso</h2>
            <table class="tabla">
              <thead><tr><th>Indicador</th><th>Sustitución</th><th class="!text-right">Resultado</th></tr></thead>
              <tbody class="stagger-children">
                @for (f of v.filas; track f.n) {
                  <tr [class.bg-acento-suave]="f.clave">
                    <td class="whitespace-nowrap font-medium text-forest">{{ f.n }}</td>
                    <td class="font-mono text-xs text-tenue">{{ f.s }}</td>
                    <td class="whitespace-nowrap text-right font-mono" [class.font-semibold]="f.clave" [class.text-forest]="f.clave">{{ f.r }}</td></tr>
                }
              </tbody>
            </table>
          </section>
          <section class="panel grid content-start gap-4">
            <h2 class="seccion">Al cierre del mes {{ v.k.mes }}</h2>
            <app-medidor nombre="CPI" [valor]="v.k.cpi" [lectura]="v.k.coste" />
            <app-medidor nombre="SPI" [valor]="v.k.spi" [lectura]="v.k.plazo" />
          </section>
        </div>

        <section class="panel mt-6" appRevelar>
          <h2 class="seccion">Curva S hasta el mes {{ v.k.mes }}</h2>
          <app-curva-s [serie]="v.serie" [bac]="v.d.datos.bac" [cortes]="[v.k.mes]" />
        </section>

        <h2 class="seccion mt-8">Las cinco preguntas</h2>
        <div class="grid gap-4">
          @for (q of v.p.preguntas; track q.n) {
            <article class="panel" appRevelar>
              <p class="font-mono text-[11px] text-moss">Pregunta {{ q.n }} del enunciado</p>
              <p class="mt-1 text-sm italic text-tenue">{{ q.enunciado }}</p>
              <h3 class="mt-3 font-display text-lg font-semibold text-forest">{{ q.pregunta }}</h3>
              <p class="mt-2 text-[15px] leading-relaxed text-evergreen">{{ q.respuesta }}</p>
              @if (q.n === 5 && v.p.estrategias) {
                <div class="mt-4 grid gap-3 md:grid-cols-3">
                  @for (e of v.p.estrategias; track e.titulo; let i = $index) {
                    <div class="rounded-xl border border-fog bg-[#F7F8F7] p-4 transition hover:-translate-y-0.5 hover:border-forest">
                      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-forest font-display text-sm font-semibold text-white">{{ i + 1 }}</span>
                      <p class="mt-3 font-medium text-forest">{{ e.titulo }}</p>
                      <p class="mt-1 text-sm leading-relaxed text-tenue">{{ e.texto }}</p>
                    </div>
                  }
                </div>
              }
            </article>
          }
        </div>

        @if (parte() === 'A') {
          <div class="mt-6" appRevelar><app-diagrama id="espina-causas" /></div>
          <div class="mt-6" appRevelar><app-figura carpeta="anatomia-control" titulo="El ciclo de control del mes 3" alto="66rem"
               pie="La medición cruza el umbral del 10 %, el relé dispara las tres estrategias y el mes 5 vuelve a la tolerancia" /></div>
        }

        @if (parte() === 'B') {
          @let a = v.d.analisis.cortes[v.d.partes.A.mes - 1];
          @let p = v.d.periodo_medidas;
          <section class="panel mt-6" appRevelar>
            <h2 class="seccion">¿Funcionaron las medidas del mes 3?</h2>
            <div class="grid gap-4 md:grid-cols-3">
              @for (x of [{ n: 'CPI', a: a.cpi, b: v.k.cpi }, { n: 'SPI', a: a.spi, b: v.k.spi }, { n: 'EAC', a: a.eac_a, b: v.k.eac_a }]; track x.n) {
                <div class="rounded-xl border border-fog p-4">
                  <p class="font-mono text-[10px] uppercase tracking-wider text-moss">{{ x.n }}</p>
                  <p class="mt-1 flex items-baseline gap-2 font-display text-xl text-forest">
                    <span class="text-tenue">{{ x.n === 'EAC' ? mx(x.a) : dec(x.a) }}</span>
                    <app-icono nombre="flecha" clase="h-4 w-4 text-bien" />
                    <span class="font-semibold">{{ x.n === 'EAC' ? mx(x.b) : dec(x.b) }}</span></p>
                  <p class="text-xs text-bien">{{ x.n === 'EAC' ? 'baja ' + mx(x.a - x.b) : 'sube ' + dec(x.b - x.a) }}</p>
                </div>
              }
            </div>
            <p class="mt-4 rounded-xl bg-bien-suave p-4 text-sm text-evergreen">Solo en los meses {{ p.desde }} y {{ p.hasta }}: valor ganado {{ mx(p.ev) }} con un gasto de
              {{ mx(p.ac) }} y un plan de {{ mx(p.pv) }} → <strong>CPI del periodo {{ dec(p.cpi) }}</strong> y <strong>SPI del periodo {{ dec(p.spi) }}</strong>,
              ambos por encima de 1. El efecto fue positivo.</p>
          </section>
          <div class="mt-6" appRevelar><app-diagrama id="cuadrante-cpi-spi" /></div>
          <div class="mt-6" appRevelar><app-diagrama id="cascada-eac" /></div>
        }

        <nav class="mt-8 flex flex-wrap justify-between gap-3">
          <a [routerLink]="parte() === 'A' ? '/metodo' : '/parte-a'" class="inline-flex items-center gap-2 rounded-lg border border-fog px-4 py-2 text-sm text-forest hover:border-forest">
            ← {{ parte() === 'A' ? 'El método' : 'Parte A' }}</a>
          <a [routerLink]="parte() === 'A' ? '/parte-b' : '/laboratorio'" class="boton">{{ parte() === 'A' ? 'Parte B · mes 5' : 'Laboratorio' }} →</a>
        </nav>
      }
    </app-estado>
  `,
})
export class PartePagina {
  /** Viene de la ruta (data: { parte }) gracias a withComponentInputBinding. */
  readonly parte = input<'A' | 'B'>('A');
  protected readonly c = httpResource<Contenido>(() => '/api/contenido');
  protected readonly mx = mx;
  protected readonly dec = dec;

  protected readonly vista = computed(() => {
    const d = this.c.value();
    if (!d) return null;
    const p = d.partes[this.parte()];
    const k = d.analisis.cortes[p.mes - 1];
    const bac = d.datos.bac;
    return { d, p, k, filas: filas(k, bac, d.datos.duracion), serie: d.analisis.serie.map((s) => (s.mes > p.mes ? { ...s, ac: null, ev: null } : s)) };
  });
}

function filas(k: Corte, bac: number, duracion: number) {
  return [
    { n: 'PV acumulado', s: `línea base de los meses 1 a ${k.mes}`, r: mx(k.pv), clave: false },
    { n: 'AC acumulado', s: `coste real de los meses 1 a ${k.mes}`, r: mx(k.ac), clave: false },
    { n: 'EV', s: `BAC × avance acumulado = ${mx(bac)} × ${k.avance} %`, r: mx(k.ev), clave: true },
    { n: 'CV', s: `EV − AC = ${mx(k.ev)} − ${mx(k.ac)}`, r: mx(k.cv), clave: false },
    { n: 'CPI', s: `EV ÷ AC = ${mx(k.ev)} ÷ ${mx(k.ac)}`, r: dec(k.cpi), clave: true },
    { n: 'SV', s: `EV − PV = ${mx(k.ev)} − ${mx(k.pv)}`, r: mx(k.sv), clave: false },
    { n: 'SPI', s: `EV ÷ PV = ${mx(k.ev)} ÷ ${mx(k.pv)}`, r: dec(k.spi), clave: true },
    { n: 'EAC (a)', s: `AC + (BAC − EV) = ${mx(k.ac)} + (${mx(bac)} − ${mx(k.ev)})`, r: mx(k.eac_a), clave: true },
    { n: 'EAC (b)', s: `BAC ÷ CPI = ${mx(bac)} ÷ ${dec(k.cpi)}`, r: mx(k.eac_b), clave: false },
    { n: 'EAC (c)', s: `AC + (BAC − EV) ÷ (CPI × SPI)`, r: mx(k.eac_c), clave: false },
    { n: 'TCPI', s: `(BAC − EV) ÷ (BAC − AC)`, r: dec(k.tcpi), clave: false },
    { n: 'Duración', s: `${duracion} meses ÷ SPI = ${duracion} ÷ ${dec(k.spi)}`, r: `${dec(k.duracion, 2)} meses`, clave: true },
  ];
}
