# Tasks: Enfoque híbrido · clásico + ágil

**Input**: [spec.md](./spec.md) · [plan.md](./plan.md)

## Fase 1 · Fuente y documento (US1)

- [X] T101 `por_velocidad` y `burnup` en `fuente/calculos.py` con aritmética exacta
- [X] T102 Estrategia 3 híbrida, introducción de A5, conclusión y referencia al Tema 2 en `fuente/contenido.py`
- [X] T103 Regenerar el .docx y el .pdf con `fuente/construir.py`: 4/4 páginas, solo Calibri (FR-102)
- [X] T104 Comprobaciones del enfoque híbrido en `fuente/validar_entregables.py` (SC-101)

## Fase 2 · API (US2, US3)

- [X] T105 `evm.velocidad` y `evm.burnup`; `hibrido` en `/api/contenido` (FR-103)
- [X] T106 Requisito A.6 en `app/cumplimiento.py` (FR-105)
- [X] T107 Pruebas: velocidad = `calculos.py`, pronósticos y burn-up (SC-103)
- [X] T108 `hibrido` en la semilla (`scripts/generar_semilla.py`)

## Fase 3 · Portal y figuras (US2, US3)

- [X] T109 [P] Componente `burnup.ts` con lectura al pasar el puntero
- [X] T110 [P] Página `/hibrido` y entrada en el menú (FR-104)
- [X] T111 [P] Diagrama `ciclo-hibrido` y espina de causas con la estrategia 3 nueva (FR-106)
- [X] T112 [P] Figura del ciclo de control: palanca 3 con el nombre nuevo (FR-106)

## Fase 4 · Entrega

- [X] T113 Entregables y paquete de entrega regenerados (`scripts/preparar_entregables.py`)
- [X] T114 Despliegue y validación contra el portal en vivo (SC-102)
