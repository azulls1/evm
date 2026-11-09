---
status: final
stepsCompleted: [requirements-inventory, epic-list, stories]
inputDocuments:
  - ../../specs/001-portal-valorganado/spec.md
  - ../../specs/001-portal-valorganado/tasks.md
  - prd.md
  - architecture.md
---

# ValorGanado · Control EVM - Epic Breakdown

## Overview

Épicas e historias del **portal** (capa B). Siguen las historias de usuario de spec-kit (US1–US7) más una
épica de plataforma y una de despliegue. Los requisitos no se copian: se citan por id (FR-/SC-) y las
tareas detalladas están en `tasks.md` (T001–T060).

> No confundir con las **Partes A y B del enunciado** (capa A: cortes de los meses 3 y 5, preguntas 1–5).
> Esas son *contenido* que el portal muestra, no trabajo de estas épicas.

## Requirements Inventory

### Functional Requirements

FR-001…FR-024 de `spec.md`.

### NonFunctional Requirements

SC-001…SC-009 de `spec.md`; regla de las dos capas y principios I–VII de la constitución.

### Additional Requirements

Datos en Supabase maestría con prefijo `ValorGanado_`; despliegue en `evm.iagentek.com.mx`; repositorio `github.com/azulls1/evm`.

### UX Design Requirements

Forest DS, WCAG 2.1 AA, 360 px, movimiento reducido (FR-023).

### FR Coverage Map

| Épica | Requisitos | Tareas spec-kit |
|---|---|---|
| 1 · Plataforma y datos | FR-001, FR-021, FR-022, FR-024, SC-007 | T001–T017 |
| 2 · Partes A y B (US1) | FR-003, FR-004, FR-008, FR-009, SC-001, SC-003 | T018–T024 |
| 3 · Resumen y cumplimiento (US2) | FR-010, FR-011, SC-002 | T025–T031 |
| 4 · Caso y método (US3) | FR-002, FR-005, FR-006 | T032–T035 |
| 5 · Laboratorio y simulación (US4, US5) | FR-007, FR-012–FR-016, SC-005 | T036–T047 |
| 6 · Entregables (US6) | FR-017, FR-018 | T048–T051 |
| 7 · Metodología (US7) | FR-019 | T052–T054 |
| 8 · Despliegue y calidad | FR-020, FR-021, FR-023, SC-004, SC-006, SC-008, SC-009 | T055–T060 |

## Epic List

1. Plataforma y datos
2. Partes A y B
3. Resumen y cumplimiento
4. Caso y método
5. Laboratorio y simulación del cierre
6. Entregables
7. Metodología
8. Despliegue y calidad
9. Enfoque híbrido · clásico + ágil

## Epic 1: Plataforma y datos

Base segura con el contenido cargado desde la fuente única y la API y el shell en pie.

### Story 1.1: Esquema y seguridad

As a alumno, I want las 4 tablas con RLS forzado, So that el contenido no quede expuesto por la API de Supabase.

**Given** `db/migraciones/` **When** se aplican **Then** existen 4 tablas `ValorGanado_*` con RLS forzado y una política para `valorganado_app` **And** `anon` no lee filas.

### Story 1.2: Semilla desde la fuente única

As a alumno, I want cargar `calculos.py` y `contenido.py` con un comando, So that el portal diga lo mismo que el .pdf.

**Given** `../fuente/` **When** corre `scripts/generar_semilla.py` y se aplica `003_contenido.sql` **Then** hay una fila `actividad2` con los datos del caso, las diez respuestas, las tres estrategias, el enunciado y la rúbrica **And** `fuente/contenido.json` queda igual para pruebas y servidor local.

### Story 1.3: API base y shell del portal

**Given** la base cargada **When** se abre el portal **Then** `/api/health` responde con db y redis **And** las 9 rutas son navegables con teclado desde la barra lateral.

## Epic 2: Partes A y B

### Story 2.1: Motor EVM probado contra la fuente

As a profesora evaluadora, I want que cada cifra salga de las fórmulas del Tema 5, So that pueda confiar en el cálculo.

**Given** los datos del enunciado **When** se corre `pytest` **Then** `evm.corte()` coincide con `calculos.corte()` en los meses 1–5 **And** el mes 3 da EV $42 550, CPI 0,734, SPI 0,788, EAC $130 450 y 7,61 meses, y el mes 5 EV $92 000, CPI 0,929, SPI 0,989, EAC $122 000 y 6,07 meses.

### Story 2.2: Páginas Parte A y Parte B

As a profesora evaluadora, I want ver el cálculo paso a paso y las cinco respuestas, So that califique C1 y C2 sin abrir el documento.

**Given** `/parte-a` o `/parte-b` **When** se abre **Then** se ven la tabla con sustituciones, los medidores, la curva S hasta el corte y las cinco preguntas con el enunciado literal **And** en la Parte B, CPI 0,734 → 0,929, SPI 0,788 → 0,989 y el periodo 4–5 con CPI 1,206 y SPI 1,268.

## Epic 3: Resumen y cumplimiento

### Story 3.1: Resumen

**Given** el caso **When** se abre Resumen **Then** se ven el veredicto de cada corte, BAC, EAC al mes 3 y al mes 5 con su sobrecoste, los cuatro medidores, la curva S con los cortes 3 y 5 y el contador de la rúbrica.

### Story 3.2: Cumplimiento contra el documento

As a alumno, I want ver cada requisito comprobado contra el .docx y el .pdf, So that corrija antes del cierre.

**Given** el contenido y el documento entregado **When** se abre Cumplimiento **Then** 15 de 15 cumplen, con 4 páginas y Calibri 12 / 1,5 leídos del documento **And** si una respuesta pierde su cifra, el requisito pasa a rojo.

## Epic 4: Caso y método

### Story 4.1: Planteamiento del caso

**Given** `/planteamiento` **When** se abre **Then** se ven PV, AC y avance por mes con acumulados, la trampa del avance (EV $16 100 y $25 300 si se usara el del mes), las preguntas y la rúbrica.

### Story 4.2: El método

**Given** `/metodo` **When** se abre **Then** se ven las fórmulas de las Tablas 9 a 12, la EAC a) marcada como la que pide la actividad y la duración ÷ SPI como estimación.

## Epic 5: Laboratorio y simulación del cierre

Ampliación del portal: nunca sustituye a las respuestas.

### Story 5.1: Escenarios inmediatos

As a visitante, I want cambiar el gasto y el avance de cada mes, So that vea cómo responden los índices.

**Given** el laboratorio **When** se edita un valor o se elige «¿Y sin medidas en el mes 3?» **Then** `POST /api/escenario` recalcula y la página se actualiza **And** el contrafactual da al mes 5 EAC $140 757 y 7,87 meses **And** un escenario incoherente muestra el motivo del 422.

### Story 5.2: Modelo Monte Carlo y worker

**Given** parámetros válidos **When** el worker ejecuta `valorganado.simular_cierre` **Then** guarda ritmo, valores deterministas, percentiles, probabilidades, histogramas y trayectorias **And** con la misma semilla el resultado es idéntico.

### Story 5.3: Simulación en la página

As a visitante, I want pasar de un solo EAC a una probabilidad, So that entienda el riesgo del cierre.

**Given** el laboratorio **When** se simula desde el mes 5 con ritmo reciente **Then** en < 3 s aparecen probabilidad en plazo ≈ 63 % y dentro del BAC ≈ 20 %, histogramas y abanico **And** se muestran junto al EAC (a) y `6 ÷ SPI` del documento.

## Epic 6: Entregables

### Story 6.1: Catálogo, paquete de entrega y ZIP con manifiesto

**Given** el catálogo **When** se abre Entregables **Then** se ven los archivos con SHA-256 y el contenido real del paquete de entrega **And** al generar un ZIP este contiene `MANIFIESTO_SHA256.txt` con hashes que coinciden con el catálogo.

## Epic 7: Metodología

### Story 7.1: Página Metodología

**Given** la página **When** se abre **Then** muestra las dos capas, el flujo spec-kit y BMAD con enlaces a sus archivos, y las figuras isométricas interactivas y diagramas propios.

## Epic 8: Despliegue y calidad

### Story 8.1: Stack y Traefik

**Given** `deploy/stack.yml` **When** se despliega **Then** los 4 servicios están 1/1 **And** las cabeceras, los límites de tasa y el de cuerpo están activos.

### Story 8.2: `deploy.sh` reproducible

**Given** un commit limpio y `deploy/.env.deploy` **When** se ejecuta `deploy/deploy.sh` **Then** cada servicio usa `:<sha>` **And** `/api/health` responde `ok` con TLS válido.

### Story 8.3: Servidor local sin base

**Given** `scripts/servidor_local.py` y `proxy.local.json` **When** se levantan **Then** el portal completo funciona en `localhost:4200` sin Postgres ni Redis.

### Story 8.4: Accesibilidad y responsive

**Given** las 9 rutas **When** se revisan con teclado, a 360 px y con movimiento reducido **Then** no hay errores críticos, desbordamiento horizontal ni animaciones.

## Epic 9: Enfoque híbrido · clásico + ágil

Lleva a la Actividad 2 la retroalimentación de la Actividad 1: el valor ganado (clásico) combinado con una
ejecución ágil, en el documento y en el portal. Especificación: `specs/002-enfoque-hibrido/`.

### Story 9.1: Estrategia híbrida en el documento

As a alumno, I want que la estrategia 3 de A5 y la conclusión combinen el marco clásico con iteraciones ágiles, So that la respuesta recoja la retroalimentación sin pasar de 4 páginas.

**Given** `fuente/contenido.py` **When** se ejecuta `fuente/construir.py` **Then** el PDF tiene 4 páginas en Calibri **And** el validador encuentra la estrategia híbrida citada al Tema 2 y la conclusión.

### Story 9.2: Velocidad y burn-up en la API

As a visitante, I want el pronóstico del plazo por velocidad y el burn-up calculados en el servidor, So that pueda compararlos con 6 ÷ SPI.

**Given** `/api/contenido` **When** se consulta **Then** `hibrido.pronosticos` da 8,11 / 7,34 meses al mes 3 y 6,25 / 5,93 al mes 5 **And** coinciden con `calculos.py` y con el recálculo independiente.

### Story 9.3: Página Enfoque híbrido

As a profesora, I want ver qué se toma de cada enfoque, cómo encajan y qué dicen sobre el plazo, So that la combinación se entienda con los datos del caso.

**Given** `/hibrido` **When** se elige el corte **Then** el burn-up y la tabla de tres estimaciones cambian **And** la ampliación queda rotulada como tal.

### Story 9.4: Figuras coherentes

**Given** la estrategia 3 nueva **When** se regeneran las figuras **Then** la espina de causas, el ciclo de control y el diagrama nuevo `ciclo-hibrido` la citan igual que el documento.

