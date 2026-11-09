import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Encabezado } from '../componentes/encabezado';
import { Estado } from '../componentes/estado';
import { Icono } from '../componentes/icono';
import { Revelar } from '../componentes/revelar';
import { Contenido } from '../core/modelos';
import { DiagramaFig } from '../componentes/diagrama';

@Component({
  selector: 'app-metodo',
  imports: [DiagramaFig, Encabezado, Estado, Icono, Revelar],
  template: `
    <app-encabezado titulo="El método del valor ganado" icono="libro" etiqueta="Tema 5 · apartado 5.9">
      <span entrada>El método que propone el PMBOK® para medir de forma objetiva el desempeño en alcance, tiempo y costes. Estas son las
        variables y fórmulas de las Tablas 9 a 12 del Tema 5, con lo que significa cada una.</span>
    </app-encabezado>

    <app-estado [cargando]="c.isLoading()" [error]="c.error()" [vacio]="!c.hasValue()" (reintentar)="c.reload()">
      @if (c.value(); as d) {
        <section class="stagger-children grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          @for (v of variables; track v.sigla) {
            <article class="panel">
              <p class="font-display text-2xl font-semibold text-forest">{{ v.sigla }}</p>
              <p class="font-mono text-[10px] uppercase tracking-wider text-moss">{{ v.ingles }}</p>
              <p class="mt-2 text-sm font-medium text-evergreen">{{ v.nombre }}</p>
              <p class="mt-1 text-xs leading-relaxed text-tenue">{{ v.texto }}</p>
            </article>
          }
        </section>

        <div class="mt-6 grid gap-6 lg:grid-cols-2" appRevelar>
          <section class="panel">
            <h2 class="seccion">Costes · EV contra AC</h2>
            <dl class="grid gap-3 text-sm">
              <div><dt class="font-mono text-forest">CV = EV − AC</dt><dd class="text-tenue">Variación de coste: negativa si se ha gastado más de lo que vale el trabajo hecho.</dd></div>
              <div><dt class="font-mono text-forest">CPI = EV ÷ AC</dt><dd class="text-tenue">CPI &gt; 1: por debajo del presupuesto · = 1: según lo planificado · &lt; 1: por encima del presupuesto.</dd></div>
            </dl>
          </section>
          <section class="panel">
            <h2 class="seccion">Plazos · EV contra PV</h2>
            <dl class="grid gap-3 text-sm">
              <div><dt class="font-mono text-forest">SV = EV − PV</dt><dd class="text-tenue">Variación del cronograma: el valor del trabajo programado que aún no se ha hecho.</dd></div>
              <div><dt class="font-mono text-forest">SPI = EV ÷ PV</dt><dd class="text-tenue">SPI &gt; 1: adelantado · = 1: según lo planificado · &lt; 1: retrasado.</dd></div>
            </dl>
          </section>
        </div>

        <section class="panel mt-6" appRevelar>
          <h2 class="seccion">Proyecciones · estimación a la conclusión (EAC)</h2>
          <div class="grid gap-3 md:grid-cols-2">
            @for (e of eac; track e.letra) {
              <div class="rounded-xl border p-4" [class]="e.letra === 'a' ? 'border-forest bg-acento-suave' : 'border-fog'">
                <p class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-moss">{{ e.letra }}) {{ e.nombre }}
                  @if (e.letra === 'a') { <span class="rounded-full bg-forest px-2 py-0.5 text-[9px] text-white">la que pide la actividad</span> }</p>
                <p class="mt-1 font-mono text-forest">{{ e.formula }}</p>
                <p class="mt-1 text-xs text-tenue">{{ e.texto }}</p>
              </div>
            }
          </div>
          <p class="mt-4 text-sm text-tenue"><span class="font-mono text-forest">TCPI = (BAC − EV) ÷ (BAC − AC)</span> · cuánto rendimiento hace falta en
            lo que queda para cerrar dentro del presupuesto: &gt; 1 es malo (habría que gastar menos de lo previsto por unidad de trabajo).</p>
          <p class="mt-2 text-sm text-tenue"><span class="font-mono text-forest">Duración estimada ≈ duración prevista ÷ SPI</span> · el tema no da una fórmula
            de plazo; esta es la proyección habitual y se presenta como estimación.</p>
        </section>

        <div class="mt-6" appRevelar><app-diagrama id="flujo-evm" /></div>

        <section class="panel mt-6 border-l-4 border-l-forest" appRevelar>
          <h2 class="seccion flex items-center gap-2"><app-icono nombre="foco" clase="h-4 w-4" /> Regla para no confundirse</h2>
          <p class="text-[15px] text-evergreen">Los <strong>costes</strong> se juzgan comparando <strong>EV con AC</strong>; los <strong>plazos</strong>, comparando
            <strong>EV con PV</strong>. AC y PV nunca se comparan entre sí: gastar lo planificado no significa ir bien si no se ha hecho el trabajo.</p>
        </section>

        <section class="panel mt-6" appRevelar>
          <h2 class="seccion">Referencias</h2>
          <ul class="grid gap-2 text-sm text-evergreen">
            @for (ref of d.referencias; track ref) { <li class="pl-6 -indent-6">{{ ref }}</li> }
          </ul>
        </section>
      }
    </app-estado>
  `,
})
export class MetodoPagina {
  protected readonly c = httpResource<Contenido>(() => '/api/contenido');
  protected readonly variables = [
    { sigla: 'BAC', ingles: 'Budget at completion', nombre: 'Presupuesto a la conclusión', texto: 'Coste previsto para todo el proyecto; la suma de todos los PV.' },
    { sigla: 'PV', ingles: 'Planned value', nombre: 'Valor planificado', texto: 'Coste presupuestado según la línea base para cada periodo.' },
    { sigla: 'AC', ingles: 'Actual cost', nombre: 'Coste real', texto: 'Coste real devengado del trabajo realizado hasta un momento.' },
    { sigla: 'EV', ingles: 'Earned value', nombre: 'Valor ganado', texto: 'Coste presupuestado del trabajo realmente ejecutado: BAC × % de avance real acumulado.' },
  ];
  protected readonly eac = [
    { letra: 'a', nombre: 'según presupuesto original', formula: 'EAC = AC + (BAC − EV)', texto: 'El trabajo restante costará lo que se había presupuestado.' },
    { letra: 'b', nombre: 'según CPI actual', formula: 'EAC = BAC ÷ CPI', texto: 'Se mantendrá el mismo nivel de eficiencia o ineficiencia.' },
    { letra: 'c', nombre: 'considerando CPI y SPI', formula: 'EAC = AC + (BAC − EV) ÷ (CPI × SPI)', texto: 'Los retrasos también encarecen el trabajo futuro.' },
    { letra: 'd', nombre: 'nueva estimación', formula: 'EAC = AC + nueva estimación de lo que falta', texto: 'La más precisa, pero lenta y costosa de obtener.' },
  ];
}
