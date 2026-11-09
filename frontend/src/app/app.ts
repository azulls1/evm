import { Component, computed, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icono, NombreIcono } from './componentes/icono';
import { Requisito } from './core/modelos';

interface Enlace {
  ruta: string;
  texto: string;
  icono: NombreIcono;
  criterio?: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icono],
  templateUrl: './app.html',
})
export class App {
  protected readonly menuAbierto = signal(false);
  private readonly cumplimiento = httpResource<Requisito[]>(() => '/api/cumplimiento');
  /** Insignia del menú calculada desde la API, no escrita a mano. */
  protected readonly insignias = computed<Record<string, string>>(() => {
    const c = this.cumplimiento.value();
    const r: Record<string, string> = {};
    if (c) r['/cumplimiento'] = `${c.filter((q) => q.cumplido).length}/${c.length}`;
    return r;
  });
  protected readonly grupos: { titulo: string; enlaces: Enlace[] }[] = [
    { titulo: 'Principal', enlaces: [{ ruta: '/resumen', texto: 'Resumen', icono: 'inicio' }] },
    {
      titulo: 'La actividad',
      enlaces: [
        { ruta: '/planteamiento', texto: 'Planteamiento', icono: 'archivo' },
        { ruta: '/metodo', texto: 'El método', icono: 'libro' },
        { ruta: '/parte-a', texto: 'Parte A · mes 3', icono: 'grafica', criterio: 'C1' },
        { ruta: '/parte-b', texto: 'Parte B · mes 5', icono: 'burndown', criterio: 'C2' },
        { ruta: '/hibrido', texto: 'Enfoque híbrido', icono: 'enlace' },
      ],
    },
    { titulo: 'En vivo', enlaces: [{ ruta: '/laboratorio', texto: 'Laboratorio', icono: 'dado' }] },
    {
      titulo: 'Entrega',
      enlaces: [
        { ruta: '/cumplimiento', texto: 'Cumplimiento', icono: 'escudo' },
        { ruta: '/metodologia', texto: 'Metodología', icono: 'capas' },
        { ruta: '/entregables', texto: 'Entregables', icono: 'descarga' },
      ],
    },
  ];
}
