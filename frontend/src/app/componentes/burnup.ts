import { Component, computed, input, signal } from '@angular/core';
import { COLOR, PronosticoVelocidad, PuntoBurnup } from '../core/modelos';
import { dec } from '../core/formato';

const W = 720, H = 300, M = { t: 18, r: 18, b: 34, l: 48 };

/**
 * Burn-up de la entrega (vista ágil del mismo proyecto): % del alcance planificado y terminado mes a mes, con la
 * línea del alcance (100 %), el plazo de seis meses y los pronósticos por velocidad desde el corte elegido.
 */
@Component({
  selector: 'app-burnup',
  template: `
    <figure class="min-w-0">
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="w-full select-none" role="img" [attr.aria-label]="descripcion()"
           (pointermove)="mover($event)" (pointerleave)="foco.set(null)">
        @for (y of [0, 25, 50, 75, 100]; track y) {
          <line [attr.x1]="M.l" [attr.x2]="W - M.r" [attr.y1]="sy(y)" [attr.y2]="sy(y)" stroke="#DFE4E0" stroke-width="1" />
          <text [attr.x]="M.l - 8" [attr.y]="sy(y) + 4" text-anchor="end" class="fill-tenue font-mono text-[11px]">{{ y }} %</text>
        }
        @for (m of meses(); track m) {
          <text [attr.x]="sx(m)" [attr.y]="H - 12" text-anchor="middle" class="fill-tenue font-mono text-[11px]">{{ m }}</text>
        }
        <text [attr.x]="W - M.r" [attr.y]="H - 12" text-anchor="end" class="fill-moss font-mono text-[10px]">mes</text>

        <!-- alcance comprometido y plazo -->
        <line [attr.x1]="M.l" [attr.x2]="W - M.r" [attr.y1]="sy(100)" [attr.y2]="sy(100)" stroke="#04202C" stroke-width="1.2" />
        <text [attr.x]="M.l + 6" [attr.y]="sy(100) - 6" class="fill-forest font-mono text-[10px]">alcance comprometido · 100 %</text>
        <line [attr.x1]="sx(plazo())" [attr.x2]="sx(plazo())" [attr.y1]="M.t" [attr.y2]="H - M.b" stroke="#9EADA3" stroke-dasharray="3 3" />
        <text [attr.x]="sx(plazo()) + 4" [attr.y]="H - M.b - 6" class="fill-pine font-mono text-[10px]">plazo · {{ plazo() }} meses</text>

        <!-- pronósticos por velocidad desde el corte -->
        @for (p of pronosticos(); track p.desde) {
          <line [attr.x1]="sx(p.mes)" [attr.y1]="sy(100 - p.falta)" [attr.x2]="sx(p.duracion)" [attr.y2]="sy(100)"
                [attr.stroke]="p.desde === 1 ? '#5B7065' : COLOR.ev" stroke-width="1.6" stroke-dasharray="5 4" class="trazo" pathLength="1" />
          <circle [attr.cx]="sx(p.duracion)" [attr.cy]="sy(100)" r="4.5" fill="#fff" [attr.stroke]="p.desde === 1 ? '#5B7065' : COLOR.ev" stroke-width="1.6" />
          <text [attr.x]="sx(p.duracion)" [attr.y]="sy(100) + (p.desde === 1 ? 18 : 32)" text-anchor="middle"
                class="font-mono text-[10px]" [attr.fill]="p.desde === 1 ? '#5B7065' : COLOR.ev">{{ dec(p.duracion, 2) }}</text>
        }

        <polyline [attr.points]="puntos('plan')" fill="none" [attr.stroke]="COLOR.pv" stroke-width="2.2" pathLength="1" class="trazo" />
        <polyline [attr.points]="puntos('terminado')" fill="none" [attr.stroke]="COLOR.ev" stroke-width="2.6" pathLength="1" class="trazo trazo--2" />
        @for (p of serie(); track p.mes) {
          @if (p.terminado != null) { <circle [attr.cx]="sx(p.mes)" [attr.cy]="sy(p.terminado)" r="3.5" [attr.fill]="COLOR.ev" class="punto-pop" /> }
        }

        @if (foco(); as f) {
          <line [attr.x1]="sx(f.mes)" [attr.x2]="sx(f.mes)" [attr.y1]="M.t" [attr.y2]="H - M.b" stroke="#04202C" stroke-width="1" opacity=".35" />
          <g [attr.transform]="'translate(' + (sx(f.mes) > W * 0.6 ? sx(f.mes) - 178 : sx(f.mes) + 10) + ',' + (M.t + 22) + ')'">
            <rect width="168" [attr.height]="f.terminado != null ? 78 : 46" rx="8" fill="#fff" stroke="#DFE4E0" />
            <text x="10" y="18" class="fill-forest font-display text-[12px] font-semibold">Mes {{ f.mes }} · {{ f.mes * porMes() }} iteraciones</text>
            <text x="10" y="36" class="font-mono text-[11px]" [attr.fill]="COLOR.pv">plan {{ dec(f.plan, 1) }} %</text>
            @if (f.terminado != null) {
              <text x="10" y="52" class="font-mono text-[11px]" [attr.fill]="COLOR.ev">terminado {{ f.terminado }} %</text>
              <text x="10" y="68" class="fill-tenue font-mono text-[11px]">brecha {{ dec(f.terminado - f.plan, 1) }} pts</text>
            }
          </g>
        }
      </svg>
      <figcaption class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-tenue">
        <span class="flex items-center gap-1.5"><span class="h-0.5 w-5" [style.background]="COLOR.pv"></span>Plan (PV ÷ BAC)</span>
        <span class="flex items-center gap-1.5"><span class="h-0.5 w-5" [style.background]="COLOR.ev"></span>Terminado y aceptado</span>
        <span class="flex items-center gap-1.5"><span class="w-5 border-t-2 border-dashed border-[#5B7065]"></span>Velocidad media</span>
        <span class="flex items-center gap-1.5"><span class="w-5 border-t-2 border-dashed" [style.border-color]="COLOR.ev"></span>Velocidad reciente</span>
      </figcaption>
    </figure>
  `,
})
export class Burnup {
  readonly serie = input.required<PuntoBurnup[]>();
  readonly pronosticos = input<PronosticoVelocidad[]>([]);
  readonly plazo = input(6);
  readonly porMes = input(2);
  protected readonly W = W;
  protected readonly H = H;
  protected readonly M = M;
  protected readonly COLOR = COLOR;
  protected readonly dec = dec;
  protected readonly foco = signal<PuntoBurnup | null>(null);
  /** Eje fijo hasta el mes 9 para comparar los dos cortes con la misma escala. */
  private readonly maxMes = computed(() => Math.max(9, Math.ceil(Math.max(...this.pronosticos().map((p) => p.duracion), this.plazo()))));
  protected readonly meses = computed(() => Array.from({ length: this.maxMes() + 1 }, (_, i) => i));
  protected readonly descripcion = computed(() => {
    const u = [...this.serie()].reverse().find((p) => p.terminado != null);
    const pr = this.pronosticos().map((p) => `${p.ventana}: ${dec(p.duracion, 2)} meses`).join('; ');
    return u ? `Burn-up. Al mes ${u.mes}: ${u.terminado} % terminado frente a ${dec(u.plan, 1)} % planificado. Pronósticos: ${pr}.` : 'Burn-up';
  });

  protected sx(m: number) { return M.l + (m / this.maxMes()) * (W - M.l - M.r); }
  protected sy(v: number) { return H - M.b - (v / 108) * (H - M.t - M.b); }
  protected puntos(k: 'plan' | 'terminado') {
    const ps = this.serie().filter((p) => p[k] != null);
    return [`${this.sx(0)},${this.sy(0)}`, ...ps.map((p) => `${this.sx(p.mes)},${this.sy(p[k]!)}`)].join(' ');
  }
  protected mover(e: PointerEvent) {
    const svg = e.currentTarget as SVGSVGElement;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const m = Math.round(((x - M.l) / (W - M.l - M.r)) * this.maxMes());
    this.foco.set(this.serie().find((p) => p.mes === m) ?? null);
  }
}
