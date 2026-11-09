import { Component, computed, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Burnup } from '../componentes/burnup';
import { DiagramaFig } from '../componentes/diagrama';
import { Encabezado } from '../componentes/encabezado';
import { Estado } from '../componentes/estado';
import { Icono } from '../componentes/icono';
import { Revelar } from '../componentes/revelar';
import { Contenido } from '../core/modelos';
import { dec } from '../core/formato';

/**
 * Enfoque híbrido: el control clásico del valor ganado (PMBOK®, Tema 5) combinado con la ejecución ágil (Tema 2).
 * Textos de fuente/contenido.py (los mismos del documento) y cálculos del motor EVM: burn-up y pronóstico por velocidad.
 */
@Component({
  selector: 'app-hibrido',
  imports: [Burnup, DiagramaFig, Encabezado, Estado, Icono, Revelar, RouterLink],
  template: `
    <app-encabezado titulo="Enfoque híbrido: clásico + ágil" icono="enlace" etiqueta="Tema 2 · Tema 5 · estrategia 3 de A5">
      <span entrada>El valor ganado es una técnica clásica; lo que hizo que funcionara entre el mes 3 y el 5 fue combinarla con una ejecución ágil.
        Esta página muestra qué se toma de cada enfoque, cómo encajan y qué dicen los dos sobre el plazo.</span>
    </app-encabezado>

    <app-estado [cargando]="c.isLoading()" [error]="c.error()" [vacio]="!c.hasValue()" (reintentar)="c.reload()">
      @if (vista(); as v) {
        <section class="panel border-l-4 border-l-forest" appRevelar>
          <h2 class="seccion flex items-center gap-2"><app-icono nombre="foco" clase="h-4 w-4" /> La idea</h2>
          <p class="text-[15px] leading-relaxed text-evergreen">{{ v.h.idea }}</p>
        </section>

        <!-- Qué se toma de cada enfoque -->
        <div class="mt-6 grid gap-6 lg:grid-cols-2">
          @for (col of v.columnas; track col.titulo) {
            <section class="panel" appRevelar>
              <p class="font-mono text-[10px] uppercase tracking-[0.14em] text-moss">{{ col.etiqueta }}</p>
              <h2 class="seccion mt-1">{{ col.titulo }}</h2>
              <ul class="stagger-children grid gap-3">
                @for (e of col.items; track e.elemento) {
                  <li class="flex gap-3">
                    <span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-acento-suave text-forest">
                      <app-icono [nombre]="col.icono" clase="h-3.5 w-3.5" /></span>
                    <span><span class="block text-sm font-medium text-evergreen">{{ e.elemento }}</span>
                      <span class="block text-xs leading-relaxed text-tenue">{{ e.uso }}</span></span>
                  </li>
                }
              </ul>
            </section>
          }
        </div>

        <!-- Cómo encajan -->
        <section class="panel mt-6" appRevelar>
          <h2 class="seccion">Cómo encajan, paso a paso</h2>
          <ol class="stagger-children grid gap-3 md:grid-cols-5">
            @for (p of v.h.encaje; track p.paso; let i = $index) {
              <li class="relative rounded-xl border border-fog p-4">
                <p class="font-mono text-[11px] text-moss">{{ i + 1 }} · {{ p.paso }}</p>
                <p class="mt-1 text-sm leading-relaxed text-evergreen">{{ p.texto }}</p>
              </li>
            }
          </ol>
        </section>

        <div class="mt-6" appRevelar><app-diagrama id="ciclo-hibrido" /></div>

        <!-- Burn-up y pronósticos -->
        <h2 class="seccion mt-8">El mismo proyecto visto en iteraciones</h2>
        <div class="mb-3 flex flex-wrap gap-1 rounded-xl border border-fog bg-white p-1" role="tablist" aria-label="Corte del pronóstico">
          @for (m of [3, 5]; track m) {
            <button type="button" role="tab" [attr.aria-selected]="corte() === m" (click)="corte.set(m)"
                    class="flex-1 rounded-lg px-3 py-2 text-sm transition" [class]="corte() === m ? 'bg-forest text-white shadow' : 'text-evergreen hover:bg-acento-suave'">
              Pronóstico desde el mes {{ m }} ({{ m === 3 ? 'Parte A' : 'Parte B' }})</button>
          }
        </div>
        <div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <section class="panel" appRevelar>
            <h2 class="seccion">Burn-up de la entrega · {{ v.h.iteraciones.total }} iteraciones de {{ v.h.iteraciones.semanas }} semanas</h2>
            <app-burnup [serie]="v.h.burnup" [pronosticos]="v.delCorte" [plazo]="v.d.datos.duracion" [porMes]="v.h.iteraciones.por_mes" />
          </section>
          <section class="panel grid content-start gap-3" appRevelar>
            <h2 class="seccion">Velocidad al mes {{ corte() }}</h2>
            @for (p of v.delCorte; track p.desde) {
              <div class="rounded-xl border border-fog p-3">
                <p class="font-mono text-[10px] uppercase tracking-wider text-moss">{{ p.ventana }}</p>
                <p class="mt-1 font-display text-2xl font-semibold text-forest">{{ dec(p.velocidad, 1) }} <span class="text-sm font-normal text-tenue">% por mes</span></p>
                <p class="text-xs text-tenue">Falta el {{ p.falta }} % → {{ p.mes }} + {{ p.falta }} ÷ {{ dec(p.velocidad, 2) }} =
                  <strong class="text-evergreen">{{ dec(p.duracion, 2) }} meses</strong></p>
              </div>
            }
          </section>
        </div>

        <section class="panel mt-6 overflow-x-auto" appRevelar>
          <h2 class="seccion">¿Cuándo termina? Tres estimaciones del plazo</h2>
          <table class="tabla">
            <thead><tr><th>Enfoque</th><th>Cálculo</th><th class="!text-right">Mes 3</th><th class="!text-right">Mes 5</th></tr></thead>
            <tbody>
              @for (f of v.tabla; track f.nombre) {
                <tr [class.bg-acento-suave]="f.documento">
                  <td class="font-medium text-forest">{{ f.nombre }}
                    @if (f.documento) { <span class="ml-1 rounded-full bg-forest px-2 py-0.5 text-[9px] text-white">la del documento</span> }</td>
                  <td class="font-mono text-xs text-tenue">{{ f.calculo }}</td>
                  <td class="whitespace-nowrap text-right font-mono">{{ dec(f.m3, 2) }} meses</td>
                  <td class="whitespace-nowrap text-right font-mono">{{ dec(f.m5, 2) }} meses</td>
                </tr>
              }
            </tbody>
          </table>
          <p class="mt-4 text-sm leading-relaxed text-evergreen">En el mes 3 los tres cálculos coinciden en un retraso claro (entre {{ dec(v.rango3[0], 2) }} y
            {{ dec(v.rango3[1], 2) }} meses). En el mes 5 rodean el plazo (entre {{ dec(v.rango5[0], 2) }} y {{ dec(v.rango5[1], 2) }} meses) y la
            estimación clásica del documento, {{ dec(v.m5, 2) }} meses, queda en medio: dos métodos independientes que llegan a lo mismo dan más
            confianza en la conclusión de la <a routerLink="/parte-b" class="text-forest underline underline-offset-2">Parte B</a>.</p>
        </section>

        <!-- Lo que dice el documento -->
        <section class="panel mt-6" appRevelar>
          <h2 class="seccion">En el documento entregado</h2>
          @if (v.estrategia; as e) {
            <p class="font-mono text-[11px] text-moss">Parte A · pregunta 5 · estrategia 3</p>
            <p class="mt-1 text-[15px] leading-relaxed text-evergreen"><strong>{{ e.titulo }}</strong> {{ e.texto }}</p>
          }
          <p class="mt-4 font-mono text-[11px] text-moss">Conclusión</p>
          <p class="mt-1 text-[15px] leading-relaxed text-evergreen">{{ v.d.conclusion }}</p>
        </section>

        <p class="mt-6 flex items-start gap-2 text-xs leading-relaxed text-tenue">
          <app-icono nombre="alerta" clase="mt-0.5 h-4 w-4" /> {{ v.h.nota }}</p>
      }
    </app-estado>
  `,
})
export class HibridoPagina {
  protected readonly c = httpResource<Contenido>(() => '/api/contenido');
  protected readonly corte = signal(3);
  protected readonly dec = dec;

  protected readonly vista = computed(() => {
    const d = this.c.value();
    if (!d?.hibrido) return null;
    const h = d.hibrido;
    const pr = (m: number, desde: number) => h.pronosticos.find((p) => p.mes === m && p.desde === desde)!.duracion;
    const spi = (m: number) => d.analisis.cortes[m - 1].duracion;
    const tabla = [
      { nombre: 'Clásico (Tema 5)', calculo: 'duración prevista ÷ SPI', m3: spi(3), m5: spi(5), documento: true },
      { nombre: 'Ágil · velocidad media', calculo: 'mes + falta ÷ velocidad desde el inicio', m3: pr(3, 1), m5: pr(5, 1), documento: false },
      { nombre: 'Ágil · velocidad reciente', calculo: 'mes + falta ÷ velocidad de los dos últimos meses', m3: pr(3, 2), m5: pr(5, 4), documento: false },
    ];
    const rango = (k: 'm3' | 'm5') => [Math.min(...tabla.map((f) => f[k])), Math.max(...tabla.map((f) => f[k]))];
    return {
      d, h, tabla, rango3: rango('m3'), rango5: rango('m5'), m5: spi(5),
      delCorte: h.pronosticos.filter((p) => p.mes === this.corte()),
      estrategia: d.partes.A.estrategias?.find((e) => e.titulo.toLowerCase().includes('híbrido')),
      columnas: [
        { etiqueta: 'PMBOK® · Tema 5', titulo: 'Del enfoque clásico', icono: 'escudo' as const, items: h.clasico },
        { etiqueta: 'Scrum · Tema 2', titulo: 'Del enfoque ágil', icono: 'reiniciar' as const, items: h.agil },
      ],
    };
  });
}
