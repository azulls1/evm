import { Component, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Encabezado } from '../componentes/encabezado';
import { Estado } from '../componentes/estado';
import { Icono } from '../componentes/icono';
import { Revelar } from '../componentes/revelar';
import { Contenido } from '../core/modelos';
import { mx } from '../core/formato';
import { DiagramaFig } from '../componentes/diagrama';

@Component({
  selector: 'app-planteamiento',
  imports: [DiagramaFig, Encabezado, Estado, Icono, Revelar],
  template: `
    <app-encabezado titulo="Planteamiento del caso" icono="archivo" etiqueta="Datos del enunciado">
      <span entrada>Un desarrollo de software de seis meses con un coste total estimado de $115 000. Estas son las tablas del
        enunciado tal cual, con los acumulados que hacen falta para el método.</span>
    </app-encabezado>

    <app-estado [cargando]="c.isLoading()" [error]="c.error()" [vacio]="!c.hasValue()" (reintentar)="c.reload()">
      @if (c.value(); as d) {
        <section class="panel overflow-x-auto">
          <h2 class="seccion">Línea base de coste (PV) y mediciones reales</h2>
          <table class="tabla min-w-[44rem]">
            <thead><tr><th>Mes</th>@for (m of meses(); track m) { <th class="!text-right">{{ m }}</th> }<th class="!text-right">Total</th></tr></thead>
            <tbody>
              <tr><td class="font-medium text-forest">PV del mes</td>@for (v of d.datos.pv_mes; track $index) { <td class="text-right font-mono">{{ mx(v) }}</td> }<td class="text-right font-mono font-semibold">{{ mx(d.datos.bac) }}</td></tr>
              <tr class="bg-acento-suave/60"><td class="font-medium text-forest">PV acumulado</td>@for (v of acum(d.datos.pv_mes); track $index) { <td class="text-right font-mono">{{ mx(v) }}</td> }<td></td></tr>
              <tr><td class="font-medium text-forest">AC del mes</td>@for (m of meses(); track m) { <td class="text-right font-mono">{{ m <= d.datos.ac_mes.length ? mx(d.datos.ac_mes[m - 1]) : '' }}</td> }<td class="text-right font-mono font-semibold">{{ mx(suma(d.datos.ac_mes)) }}</td></tr>
              <tr class="bg-acento-suave/60"><td class="font-medium text-forest">AC acumulado</td>@for (m of meses(); track m) { <td class="text-right font-mono">{{ m <= d.datos.ac_mes.length ? mx(acum(d.datos.ac_mes)[m - 1]) : '' }}</td> }<td></td></tr>
              <tr><td class="font-medium text-forest">Avance del mes</td>@for (m of meses(); track m) { <td class="text-right font-mono">{{ m <= d.datos.avance_mes.length ? d.datos.avance_mes[m - 1] + ' %' : '' }}</td> }<td class="text-right font-mono font-semibold">{{ suma(d.datos.avance_mes) }} %</td></tr>
              <tr class="bg-acento-suave/60"><td class="font-medium text-forest">Avance acumulado</td>@for (m of meses(); track m) { <td class="text-right font-mono" [class.font-semibold]="m === 3 || m === 5" [class.text-forest]="m === 3 || m === 5">{{ m <= d.datos.avance_mes.length ? acum(d.datos.avance_mes)[m - 1] + ' %' : '' }}</td> }<td></td></tr>
            </tbody>
          </table>
          <p class="mt-3 text-xs text-tenue">La Parte A usa los meses 1 a 3 y la Parte B los meses 1 a 5. Las filas sombreadas son los acumulados que se comparan en cada corte.</p>
        </section>

        <section class="panel mt-6 border-l-4 border-l-aviso bg-aviso-suave" appRevelar>
          <h2 class="seccion flex items-center gap-2 !text-aviso"><app-icono nombre="alerta" clase="h-4 w-4" /> La trampa del enunciado</h2>
          <p class="text-sm leading-relaxed text-evergreen">{{ d.nota_avance }} Si se usara el avance de un solo mes (14 % o 22 %), el valor ganado saldría
            {{ mx(d.datos.bac * 0.14) }} y {{ mx(d.datos.bac * 0.22) }} en lugar de {{ mx(d.analisis.cortes[2].ev) }} y {{ mx(d.analisis.cortes[4].ev) }}, y todas las respuestas
            cambiarían.</p>
        </section>

        <h2 class="seccion mt-8">Las preguntas del enunciado</h2>
        <div class="grid gap-6 lg:grid-cols-2" appRevelar>
          @for (p of ['A', 'B']; track p) {
            <section class="panel">
              <h3 class="mb-3 font-display font-semibold text-forest">Parte {{ p }} · mes {{ p === 'A' ? d.partes.A.mes : d.partes.B.mes }}</h3>
              <ol class="grid gap-2 text-sm text-evergreen">
                @for (q of d.enunciado.comunes; track $index) { <li class="flex gap-2"><span class="font-mono text-moss">{{ $index + 1 }}.</span>{{ q }}</li> }
                <li class="flex gap-2"><span class="font-mono text-moss">5.</span>{{ p === 'A' ? d.enunciado.A5 : d.enunciado.B5 }}</li>
              </ol>
            </section>
          }
        </div>

        <div class="mt-6" appRevelar><app-diagrama id="gantt-linea-base" /></div>

        <section class="panel mt-6" appRevelar>
          <h2 class="seccion">Rúbrica</h2>
          <table class="tabla">
            <thead><tr><th>Criterio</th><th>Descripción</th><th class="!text-right">Puntos</th><th class="!text-right">Peso</th></tr></thead>
            <tbody>
              @for (q of d.enunciado.rubrica; track q.criterio) {
                <tr><td class="font-medium text-forest">{{ q.criterio }} · {{ q.nombre }}</td><td class="text-tenue">{{ q.descripcion }}</td>
                  <td class="text-right font-mono">{{ q.puntos }}</td><td class="text-right font-mono">{{ q.peso }} %</td></tr>
              }
            </tbody>
          </table>
          <p class="mt-3 text-xs text-tenue">{{ d.enunciado.extension }}</p>
        </section>
      }
    </app-estado>
  `,
})
export class PlanteamientoPagina {
  protected readonly c = httpResource<Contenido>(() => '/api/contenido');
  protected readonly mx = mx;
  protected readonly meses = computed(() => Array.from({ length: this.c.value()?.datos.duracion ?? 6 }, (_, i) => i + 1));
  protected acum(v: number[]) {
    let s = 0;
    return v.map((x) => (s += x));
  }
  protected suma(v: number[]) {
    return v.reduce((a, b) => a + b, 0);
  }
}
