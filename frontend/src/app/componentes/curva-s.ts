import { Component, computed, input, signal } from '@angular/core';
import { COLOR, PuntoSerie } from '../core/modelos';
import { mx, milesCorto } from '../core/formato';

interface Trayectoria { mes: number; ev: number; ac: number }

const W = 720, H = 320, M = { t: 16, r: 18, b: 34, l: 64 };

/**
 * Curva S del valor ganado: PV (plan), AC (coste real) y EV (valor ganado) acumulados, con los cortes marcados.
 * Al pasar el puntero se leen los tres valores del mes y sus diferencias (CV = EV − AC, SV = EV − PV).
 * Opcional: trayectorias simuladas (abanico) y la línea del BAC.
 */
@Component({
  selector: 'app-curva-s',
  template: `
    <figure class="min-w-0">
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="w-full select-none" role="img" [attr.aria-label]="descripcion()"
           (pointermove)="mover($event)" (pointerleave)="foco.set(null)">
        <!-- rejilla y ejes -->
        @for (y of ticksY(); track y) {
          <line [attr.x1]="M.l" [attr.x2]="W - M.r" [attr.y1]="sy(y)" [attr.y2]="sy(y)" stroke="#DFE4E0" stroke-width="1" />
          <text [attr.x]="M.l - 8" [attr.y]="sy(y) + 4" text-anchor="end" class="fill-tenue font-mono text-[11px]">{{ milesCorto(y) }}</text>
        }
        @for (m of meses(); track m) {
          <text [attr.x]="sx(m)" [attr.y]="H - 12" text-anchor="middle" class="fill-tenue font-mono text-[11px]">{{ m }}</text>
        }
        <text [attr.x]="W - M.r" [attr.y]="H - 12" text-anchor="end" class="fill-moss font-mono text-[10px]">mes</text>

        <!-- BAC -->
        <line [attr.x1]="M.l" [attr.x2]="W - M.r" [attr.y1]="sy(bac())" [attr.y2]="sy(bac())" stroke="#1F3A68" stroke-dasharray="2 4" stroke-width="1" opacity=".5" />
        <text [attr.x]="M.l + 6" [attr.y]="sy(bac()) - 6" class="fill-pine font-mono text-[10px]">BAC {{ mx(bac()) }}</text>

        <!-- cortes -->
        @for (c of cortes(); track c) {
          <line [attr.x1]="sx(c)" [attr.x2]="sx(c)" [attr.y1]="M.t" [attr.y2]="H - M.b" stroke="#9EADA3" stroke-dasharray="3 3" />
          <text [attr.x]="sx(c)" [attr.y]="M.t + 10" text-anchor="middle" class="fill-pine font-mono text-[10px]">corte · mes {{ c }}</text>
        }

        <!-- abanico de trayectorias simuladas -->
        @for (t of trayectorias(); track $index) {
          <polyline [attr.points]="linea(t, 'ac')" fill="none" [attr.stroke]="COLOR.ac" stroke-width="1" opacity=".14" />
          <polyline [attr.points]="linea(t, 'ev')" fill="none" [attr.stroke]="COLOR.ev" stroke-width="1" opacity=".14" />
        }

        <!-- las tres curvas -->
        <polyline [attr.points]="puntos('pv')" fill="none" [attr.stroke]="COLOR.pv" stroke-width="2.5" pathLength="1" class="trazo" />
        <polyline [attr.points]="puntos('ac')" fill="none" [attr.stroke]="COLOR.ac" stroke-width="2.5" pathLength="1" class="trazo trazo--2" />
        <polyline [attr.points]="puntos('ev')" fill="none" [attr.stroke]="COLOR.ev" stroke-width="2.5" stroke-dasharray="0" pathLength="1" class="trazo trazo--3" />
        @for (p of serie(); track p.mes) {
          @if (p.ev != null) { <circle [attr.cx]="sx(p.mes)" [attr.cy]="sy(p.ev)" r="3.5" [attr.fill]="COLOR.ev" class="punto-pop" /> }
          @if (p.ac != null) { <circle [attr.cx]="sx(p.mes)" [attr.cy]="sy(p.ac)" r="3.5" [attr.fill]="COLOR.ac" class="punto-pop" /> }
        }

        <!-- lectura al pasar el puntero -->
        @if (foco(); as f) {
          <line [attr.x1]="sx(f.mes)" [attr.x2]="sx(f.mes)" [attr.y1]="M.t" [attr.y2]="H - M.b" stroke="#04202C" stroke-width="1" opacity=".35" />
          <g [attr.transform]="'translate(' + (sx(f.mes) > W * 0.6 ? sx(f.mes) - 196 : sx(f.mes) + 10) + ',' + (M.t + 18) + ')'">
            <rect width="186" [attr.height]="f.ac != null ? 112 : 46" rx="8" fill="#fff" stroke="#DFE4E0" />
            <text x="10" y="18" class="fill-forest font-display text-[12px] font-semibold">Mes {{ f.mes }}</text>
            <text x="10" y="36" class="font-mono text-[11px]" [attr.fill]="COLOR.pv">PV {{ mx(f.pv) }}</text>
            @if (f.ac != null && f.ev != null) {
              <text x="10" y="52" class="font-mono text-[11px]" [attr.fill]="COLOR.ac">AC {{ mx(f.ac) }}</text>
              <text x="10" y="68" class="font-mono text-[11px]" [attr.fill]="COLOR.ev">EV {{ mx(f.ev) }}</text>
              <text x="10" y="86" class="fill-tenue font-mono text-[11px]">CV {{ mx(f.ev - f.ac) }}</text>
              <text x="10" y="102" class="fill-tenue font-mono text-[11px]">SV {{ mx(f.ev - f.pv) }}</text>
            }
          </g>
        }
      </svg>
      <figcaption class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-tenue">
        <span class="flex items-center gap-1.5"><span class="h-0.5 w-5" [style.background]="COLOR.pv"></span>PV · valor planificado</span>
        <span class="flex items-center gap-1.5"><span class="h-0.5 w-5" [style.background]="COLOR.ac"></span>AC · coste real</span>
        <span class="flex items-center gap-1.5"><span class="h-0.5 w-5" [style.background]="COLOR.ev"></span>EV · valor ganado</span>
        @if (trayectorias().length) { <span>· líneas tenues: {{ trayectorias().length }} cierres simulados</span> }
      </figcaption>
    </figure>
  `,
})
export class CurvaS {
  readonly serie = input.required<PuntoSerie[]>();
  readonly bac = input.required<number>();
  readonly cortes = input<number[]>([]);
  readonly trayectorias = input<Trayectoria[][]>([]);
  protected readonly W = W;
  protected readonly H = H;
  protected readonly M = M;
  protected readonly COLOR = COLOR;
  protected readonly mx = mx;
  protected readonly milesCorto = milesCorto;
  protected readonly foco = signal<PuntoSerie | null>(null);

  private readonly maxMes = computed(() => Math.max(this.serie().length, ...this.trayectorias().flatMap((t) => t.map((p) => Math.ceil(p.mes)))));
  private readonly maxY = computed(() => {
    const v = [this.bac(), ...this.serie().flatMap((p) => [p.pv, p.ac ?? 0]), ...this.trayectorias().flatMap((t) => t.map((p) => p.ac))];
    return Math.ceil((Math.max(...v) * 1.06) / 25000) * 25000;
  });
  protected readonly meses = computed(() => Array.from({ length: this.maxMes() + 1 }, (_, i) => i));
  protected readonly ticksY = computed(() => Array.from({ length: this.maxY() / 25000 + 1 }, (_, i) => i * 25000));
  protected readonly descripcion = computed(() => {
    const u = [...this.serie()].reverse().find((p) => p.ev != null);
    return u ? `Curva S. Al mes ${u.mes}: PV ${mx(u.pv)}, AC ${mx(u.ac)}, EV ${mx(u.ev)}.` : 'Curva S del proyecto';
  });

  protected sx(m: number) { return M.l + (m / this.maxMes()) * (W - M.l - M.r); }
  protected sy(v: number) { return H - M.b - (v / this.maxY()) * (H - M.t - M.b); }

  protected puntos(k: 'pv' | 'ac' | 'ev') {
    const ps = this.serie().filter((p) => p[k] != null);
    return [`${this.sx(0)},${this.sy(0)}`, ...ps.map((p) => `${this.sx(p.mes)},${this.sy(p[k]!)}`)].join(' ');
  }
  protected linea(t: Trayectoria[], k: 'ac' | 'ev') {
    return t.map((p) => `${this.sx(p.mes)},${this.sy(p[k])}`).join(' ');
  }
  protected mover(e: PointerEvent) {
    const svg = e.currentTarget as SVGSVGElement;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const m = Math.round(((x - M.l) / (W - M.l - M.r)) * this.maxMes());
    this.foco.set(this.serie().find((p) => p.mes === m) ?? null);
  }
}
