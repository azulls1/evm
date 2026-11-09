import { Component, computed, input } from '@angular/core';

/** Histograma de una distribución simulada, con una línea de referencia (BAC o plazo) y los percentiles P50 y P80. */
@Component({
  selector: 'app-histograma',
  template: `
    <figure class="min-w-0">
      <svg viewBox="0 0 360 170" class="w-full" role="img" [attr.aria-label]="titulo()">
        @for (b of barras(); track $index) {
          <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="140 - b.y" rx="1.5"
                [attr.fill]="b.dentro ? '#2E8B57' : '#C0392B'" opacity=".8" class="barra-crece" [style.animation-delay]="$index * 18 + 'ms'" />
        }
        @if (xRef() != null) {
          <line [attr.x1]="xRef()" [attr.x2]="xRef()" y1="6" y2="140" stroke="#04202C" stroke-width="1.5" stroke-dasharray="4 3" />
          <text [attr.x]="xRef()! + 4" y="16" class="fill-forest font-mono text-[10px]">{{ etiquetaRef() }}</text>
        }
        @for (p of percentiles(); track p.n) {
          <line [attr.x1]="p.x" [attr.x2]="p.x" y1="140" y2="146" stroke="#5B7065" stroke-width="1.5" />
          <text [attr.x]="p.x" y="158" text-anchor="middle" class="fill-tenue font-mono text-[9px]">{{ p.n }}</text>
        }
        <text x="0" y="168" class="fill-tenue font-mono text-[9px]">{{ formato()(min()) }}</text>
        <text x="360" y="168" text-anchor="end" class="fill-tenue font-mono text-[9px]">{{ formato()(max()) }}</text>
      </svg>
      <figcaption class="mt-1 text-xs text-tenue">{{ titulo() }} · <span class="text-bien">verde</span>: dentro de {{ etiquetaRef() }}</figcaption>
    </figure>
  `,
})
export class Histograma {
  readonly datos = input.required<{ desde: number; hasta: number; n: number }[]>();
  readonly referencia = input<number | null>(null);
  readonly etiquetaRef = input('');
  readonly titulo = input('');
  readonly p50 = input<number | null>(null);
  readonly p80 = input<number | null>(null);
  readonly formato = input<(x: number) => string>((x) => String(x));

  protected readonly min = computed(() => this.datos()[0]?.desde ?? 0);
  protected readonly max = computed(() => this.datos().at(-1)?.hasta ?? 1);
  private x(v: number) { return ((v - this.min()) / (this.max() - this.min() || 1)) * 360; }
  protected readonly barras = computed(() => {
    const d = this.datos(), top = Math.max(...d.map((b) => b.n), 1), w = 360 / d.length;
    const ref = this.referencia();
    return d.map((b, i) => ({ x: i * w + 1, w: w - 2, y: 140 - (b.n / top) * 130, dentro: ref == null || (b.desde + b.hasta) / 2 <= ref }));
  });
  protected readonly xRef = computed(() => {
    const r = this.referencia();
    return r == null || r < this.min() || r > this.max() ? null : this.x(r);
  });
  protected readonly percentiles = computed(() =>
    [['P50', this.p50()], ['P80', this.p80()]].filter(([, v]) => v != null).map(([n, v]) => ({ n: n as string, x: this.x(v as number) })));
}
