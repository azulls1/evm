# Implementation Plan: Enfoque híbrido · clásico + ágil

**Branch**: `002-enfoque-hibrido` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

## Summary

Cambio de redacción en la capa A (estrategia 3 de A5, conclusión y referencia al Tema 2) y una ruta nueva en
la capa B. Todo sale de la fuente única: `fuente/calculos.py` (`por_velocidad`, `burnup`) y
`fuente/contenido.py` (`HIBRIDO`); la API lo recalcula con `evm.velocidad` y `evm.burnup`.

## Constitution Check

- I. Fuente única: textos y cifras nuevos en `fuente/` ✅
- II. Las respuestas siguen las fórmulas del Tema 5; velocidad y burn-up rotulados como ampliación ✅
- III. Verificable: validador independiente, requisito A.6 y pruebas ✅
- IV–VII. Mismo stack, mismo despliegue, accesibilidad y español de México ✅

## Cambios por capa

| Capa | Archivo | Cambio |
|---|---|---|
| Fuente | `fuente/calculos.py` | `por_velocidad(mes, desde)`, `burnup()`, `VEL` |
| Fuente | `fuente/contenido.py` | estrategia 3, introducción de A5, conclusión, referencia y `HIBRIDO` |
| Documento | `fuente/construir.py` | sin cambios (sigue validando 4 páginas y Calibri) |
| Validación | `fuente/validar_entregables.py` | estrategia híbrida en el .docx y pronósticos en la API |
| Backend | `app/evm.py`, `app/main.py` | `velocidad`, `burnup`; `hibrido` en `/api/contenido` |
| Backend | `app/cumplimiento.py` | requisito A.6; estrategias citadas aceptan «Temas» |
| Semilla | `scripts/generar_semilla.py` | `hibrido` en `003_contenido.sql` |
| Frontend | `paginas/hibrido.ts`, `componentes/burnup.ts` | ruta `/hibrido`, burn-up interactivo |
| Figuras | `herramientas/diagramas/generar.py` | diagrama `ciclo-hibrido`; espina con la estrategia 3 nueva |
| Figuras | `herramientas/diagramas/exportar_png_ql.py` | PNG 2x con fuentes incrustadas, sin navegador |

## Contrato

`GET /api/contenido` añade:

```json
"hibrido": {
  "idea": "…", "clasico": [{"elemento": "…", "uso": "…"}], "agil": […], "encaje": [{"paso": "…", "texto": "…"}],
  "iteraciones": {"semanas": 2, "por_mes": 2, "total": 12}, "nota": "…",
  "burnup": [{"mes": 1, "plan": 20.0, "terminado": 8}, …],
  "pronosticos": [{"mes": 3, "desde": 1, "ventana": "desde el inicio", "velocidad": 12.33, "falta": 63, "duracion": 8.11}, …]
}
```
