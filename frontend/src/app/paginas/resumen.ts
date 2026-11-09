import { Component, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CurvaS } from '../componentes/curva-s';
import { Estado } from '../componentes/estado';
import { Icono, NombreIcono } from '../componentes/icono';
import { Kpi } from '../componentes/kpi';
import { Medidor } from '../componentes/medidor';
import { Revelar } from '../componentes/revelar';
import { Resumen } from '../core/modelos';
import { dec, mx } from '../core/formato';

@Component({
  selector: 'app-resumen',
  imports: [CurvaS, Estado, Icono, Kpi, Medidor, Revelar, RouterLink],
  template: `
    <app-estado [cargando]="r.isLoading()" [error]="r.error()" [vacio]="!r.hasValue()" (reintentar)="r.reload()">
      @if (r.value(); as d) {
        <section class="card-hero !p-6 !text-left sm:!p-10 animate-fadeInUp">
          <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div class="orbe absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#5B7065]/25 blur-3xl"></div>
            <div class="orbe orbe--lento absolute -bottom-28 left-16 h-64 w-64 rounded-full bg-[#9EADA3]/15 blur-3xl"></div>
          </div>
          <div class="relative grid gap-8 lg:grid-cols-[1fr_19rem] lg:items-end">
            <div>
              <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 font-mono text-[11px] text-white/85">
                <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"></span> Actividad 2 individual · {{ d.portada.alumno }}</span>
              <h1 class="mt-4 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">Control de un proyecto de software<br class="hidden sm:block" /> con el método del valor ganado</h1>
              <p class="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/75">Seis meses y un presupuesto de {{ mx(d.bac) }}. En el mes {{ d.a.mes }} el
                proyecto gasta más y avanza menos de lo previsto; en el mes {{ d.b.mes }} los mismos indicadores muestran que las
                medidas correctivas funcionaron. <span class="text-white">Cada cifra se recalcula en el servidor con las fórmulas del Tema 5.</span></p>
              <div class="mt-6 flex flex-wrap gap-3">
                <a routerLink="/parte-a" class="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-forest shadow-lg transition hover:-translate-y-0.5">
                  <app-icono nombre="grafica" clase="h-4 w-4" /> Parte A · mes {{ d.a.mes }}</a>
                <a routerLink="/parte-b" class="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-2.5 text-sm text-white transition hover:bg-white/10">
                  <app-icono nombre="burndown" clase="h-4 w-4" /> Parte B · mes {{ d.b.mes }}</a>
                <a routerLink="/laboratorio" class="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-2.5 text-sm text-white transition hover:bg-white/10">
                  <app-icono nombre="dado" clase="h-4 w-4" /> Laboratorio</a>
              </div>
            </div>
            <div class="rounded-xl border border-white/10 bg-white/5 p-4">
              <p class="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">Veredicto</p>
              <ul class="grid gap-3 text-sm">
                @for (v of veredicto(); track v.mes) {
                  <li class="animate-slideInRight" [style.animation-delay.ms]="300 + $index * 150">
                    <span class="font-mono text-[10px] text-white/55">Mes {{ v.mes }}</span>
                    <span class="block text-white">{{ v.texto }}</span></li>
                }
              </ul>
            </div>
          </div>
        </section>

        <section class="stagger-children mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Cifras clave">
          <app-kpi etiqueta="Presupuesto (BAC)" [valor]="mx(d.bac)" [detalle]="d.duracion + ' meses planificados'" icono="diana" />
          <app-kpi etiqueta="EAC al mes 3" [valor]="mx(d.a.eac_a)" [detalle]="'sobrecoste ' + mx(d.a.eac_a - d.bac)" icono="alerta" />
          <app-kpi etiqueta="EAC al mes 5" [valor]="mx(d.b.eac_a)" [detalle]="'sobrecoste ' + mx(d.b.eac_a - d.bac)" icono="checkCirculo" />
          <app-kpi etiqueta="Rúbrica" [valor]="d.cumplimiento.cumplidos + '/' + d.cumplimiento.total" detalle="requisitos comprobados" icono="escudo" />
        </section>

        <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]" appRevelar>
          <section class="panel">
            <h2 class="seccion">Curva S · PV, AC y EV acumulados</h2>
            <app-curva-s [serie]="d.serie" [bac]="d.bac" [cortes]="[d.a.mes, d.b.mes]" />
            <p class="mt-2 text-xs text-tenue">Pasa el puntero por la gráfica para leer cada mes. La distancia entre la curva verde (lo que vale el trabajo
              hecho) y la roja (lo gastado) es la variación de coste; entre la verde y la azul, la de plazo.</p>
          </section>
          <section class="panel">
            <h2 class="seccion">Índices de desempeño</h2>
            <div class="grid grid-cols-2 gap-2">
              <app-medidor nombre="CPI · mes 3" [valor]="d.a.cpi" [lectura]="d.a.coste" />
              <app-medidor nombre="SPI · mes 3" [valor]="d.a.spi" [lectura]="d.a.plazo" />
              <app-medidor nombre="CPI · mes 5" [valor]="d.b.cpi" [lectura]="d.b.coste" />
              <app-medidor nombre="SPI · mes 5" [valor]="d.b.spi" [lectura]="d.b.plazo" />
            </div>
          </section>
        </div>

        <section class="panel mt-6" appRevelar>
          <h2 class="seccion">Rúbrica · dónde está cada criterio</h2>
          <ul class="grid gap-1.5 md:grid-cols-3">
            @for (c of criterios; track c.ruta) {
              <li><a [routerLink]="c.ruta" class="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-acento-suave">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-acento-suave text-pine group-hover:bg-forest group-hover:text-white">
                  <app-icono [nombre]="c.icono" clase="h-4 w-4" /></span>
                <span class="flex-1 text-sm text-forest">{{ c.texto }}</span>
                <span class="font-mono text-[10px] text-moss">{{ c.id }}</span></a></li>
            }
          </ul>
        </section>

        <section class="panel mt-6 border-l-4 border-l-forest" appRevelar>
          <h2 class="seccion">Conclusión</h2>
          <p class="text-[15px] leading-relaxed text-evergreen">{{ d.conclusion }}</p>
        </section>
      }
    </app-estado>
  `,
})
export class ResumenPagina {
  protected readonly r = httpResource<Resumen>(() => '/api/resumen');
  protected readonly mx = mx;
  protected readonly veredicto = computed(() => {
    const d = this.r.value();
    if (!d) return [];
    return [d.a, d.b].map((c) => ({
      mes: c.mes,
      texto: `CPI ${dec(c.cpi)} y SPI ${dec(c.spi)}: ${c.coste}, ${c.plazo}. Terminaría en ${dec(c.duracion, 2)} meses.`,
    }));
  });
  protected readonly criterios: { id: string; texto: string; ruta: string; icono: NombreIcono }[] = [
    { id: 'C1 · 40 %', texto: 'Parte A · control en el mes 3', ruta: '/parte-a', icono: 'grafica' },
    { id: 'C2 · 40 %', texto: 'Parte B · control en el mes 5', ruta: '/parte-b', icono: 'burndown' },
    { id: 'C3 · 20 %', texto: 'Presentación y extensión', ruta: '/cumplimiento', icono: 'escudo' },
  ];
}
