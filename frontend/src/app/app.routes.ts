import { Routes } from '@angular/router';

const t = (s: string) => `${s} · ValorGanado`;

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'resumen' },
  { path: 'resumen', title: t('Resumen'), loadComponent: () => import('./paginas/resumen').then((m) => m.ResumenPagina) },
  { path: 'planteamiento', title: t('Planteamiento del caso'), loadComponent: () => import('./paginas/planteamiento').then((m) => m.PlanteamientoPagina) },
  { path: 'metodo', title: t('El método del valor ganado'), loadComponent: () => import('./paginas/metodo').then((m) => m.MetodoPagina) },
  { path: 'parte-a', title: t('Parte A · mes 3'), data: { parte: 'A' }, loadComponent: () => import('./paginas/parte').then((m) => m.PartePagina) },
  { path: 'parte-b', title: t('Parte B · mes 5'), data: { parte: 'B' }, loadComponent: () => import('./paginas/parte').then((m) => m.PartePagina) },
  { path: 'hibrido', title: t('Enfoque híbrido'), loadComponent: () => import('./paginas/hibrido').then((m) => m.HibridoPagina) },
  { path: 'laboratorio', title: t('Laboratorio'), loadComponent: () => import('./paginas/laboratorio').then((m) => m.LaboratorioPagina) },
  { path: 'cumplimiento', title: t('Cumplimiento'), loadComponent: () => import('./paginas/cumplimiento').then((m) => m.CumplimientoPagina) },
  { path: 'metodologia', title: t('Metodología'), loadComponent: () => import('./paginas/metodologia').then((m) => m.MetodologiaPagina) },
  { path: 'entregables', title: t('Entregables'), loadComponent: () => import('./paginas/entregables').then((m) => m.EntregablesPagina) },
  { path: '**', redirectTo: 'resumen' },
];
