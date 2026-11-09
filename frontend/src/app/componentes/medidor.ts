import { Component, computed, input } from '@angular/core';
import { dec } from '../core/formato';

/**
 * Medidor semicircular de un índice de desempeño (CPI o SPI). La aguja marca el valor; 1 es «según lo planificado».
 * Zona roja < 0,9 · ámbar 0,9–1 · verde > 1 (umbral del 10 % de las escaladas del Tema 5).
 */
@Component({
  selector: 'app-medidor',
  template: `
    <figure class="flex flex-col items-center">
      <svg viewBox="-8 -10 216 128" class="w-full max-w-[15rem]" role="img" [attr.aria-label]="nombre() + ' ' + dec(valor()) + ': ' + lectura()">
        <path [attr.d]="arco(0.5, 0.9)" fill="none" stroke="#F3C9C4" stroke-width="16" />
        <path [attr.d]="arco(0.9, 1)" fill="none" stroke="#F8E3B5" stroke-width="16" />
        <path [attr.d]="arco(1, 1.5)" fill="none" stroke="#BFE5D2" stroke-width="16" />
        @for (t of [0.5, 0.75, 1, 1.25, 1.5]; track t) {
          <text [attr.x]="punto(t, 97).x" [attr.y]="punto(t, 97).y + 3" text-anchor="middle" class="fill-tenue font-mono text-[9px]">{{ dec(t, 2) }}</text>
        }
        <g class="aguja" [style.transform]="'rotate(' + giro() + 'deg)'" style="transform-origin: 100px 100px">
          <line x1="100" y1="100" x2="100" y2="26" stroke="#04202C" stroke-width="3" stroke-linecap="round" />
        </g>
        <circle cx="100" cy="100" r="7" fill="#04202C" />
      </svg>
      <figcaption class="-mt-1 text-center">
        <span class="block font-display text-2xl font-semibold tabular-nums" [class]="color()">{{ dec(valor()) }}</span>
        <span class="block font-mono text-[10px] uppercase tracking-wider text-moss">{{ nombre() }}</span>
        <span class="mt-0.5 block text-xs text-tenue">{{ lectura() }}</span>
      </figcaption>
    </figure>
  `,
  styles: [`.aguja { transition: transform 1.2s cubic-bezier(.34,1.56,.64,1); }`],
})
export class Medidor {
  readonly nombre = input.required<string>();
  readonly valor = input.required<number>();
  readonly lectura = input('');
  protected readonly dec = dec;
  /** 0,5 → −90° · 1 → 0° · 1,5 → +90° */
  protected readonly giro = computed(() => (Math.max(0.5, Math.min(1.5, this.valor())) - 1) * 180);
  protected readonly color = computed(() => (this.valor() >= 1 ? 'text-bien' : this.valor() >= 0.9 ? 'text-aviso' : 'text-mal'));

  protected punto(v: number, r = 80) {
    const a = Math.PI * (1 - (v - 0.5));
    return { x: 100 + r * Math.cos(a), y: 100 - r * Math.sin(a) };
  }
  protected arco(a: number, b: number) {
    const p = this.punto(a), q = this.punto(b);
    return `M ${p.x} ${p.y} A 80 80 0 0 1 ${q.x} ${q.y}`;
  }
}
