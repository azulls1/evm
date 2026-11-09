# Feature Specification: Enfoque híbrido · clásico + ágil

**Feature Branch**: `002-enfoque-hibrido`

**Created**: 2026-11-08

**Status**: Implementado

**Input**: User description: "La retroalimentación de la Actividad 1 dice que en la realidad conviene
complementar las metodologías ágiles con las clásicas para mejorar los resultados. Llevar esa idea a la
Actividad 2: el valor ganado es una técnica clásica; mostrar en el documento y en el portal cómo se combina
con una ejecución ágil, sin pasar de 4 páginas y sin cambiar ninguna cifra de las respuestas."

> **Dos capas.** En la capa A (documento) el cambio es de redacción: la estrategia 3 de A5 pasa a ser el
> enfoque híbrido (Temas 2 y 4, 5.8) y la conclusión recoge la lección. En la capa B (portal) se añade la
> ruta `/hibrido` con un burn-up y un pronóstico del plazo por velocidad, que son **ampliación del portal**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el enfoque híbrido en la respuesta A5 (Priority: P1)

La profesora lee la pregunta 5 de la Parte A y encuentra, como tercera estrategia, un marco clásico (línea
base, valor ganado, control de cambios) con ejecución en iteraciones ágiles de dos semanas, citado al Tema 2.

**Why this priority**: es la parte calificada (C1) y responde directamente a la retroalimentación recibida.

**Independent Test**: `fuente/validar_entregables.py` comprueba en el .docx la estrategia híbrida y la
conclusión; `/api/cumplimiento` muestra el requisito A.6.

**Acceptance Scenarios**:

1. **Given** el .docx entregado, **When** se lee A5, **Then** hay tres estrategias con su apartado del curso y
   la tercera combina el marco clásico con iteraciones ágiles.
2. **Given** el PDF, **When** se cuentan las páginas, **Then** siguen siendo 4 como máximo en Calibri 12 a 1,5.

### User Story 2 - Entender qué se toma de cada enfoque (Priority: P2)

El visitante abre *Enfoque híbrido* y ve qué aporta el enfoque clásico (PMBOK®, Tema 5) y qué aporta el ágil
(Scrum, Tema 2), cómo encajan en cinco pasos y el diagrama del ciclo híbrido.

**Independent Test**: los textos de la página salen de `fuente/contenido.py` (`HIBRIDO`) vía `/api/contenido`.

### User Story 3 - Comparar las estimaciones del plazo (Priority: P2)

El visitante elige el corte (mes 3 o mes 5) y ve el burn-up con el pronóstico por velocidad media y reciente,
y una tabla que compara la estimación clásica (6 ÷ SPI) con las dos ágiles.

**Independent Test**: el validador independiente recalcula los cuatro pronósticos desde el enunciado y los
compara con la API; las pruebas comparan el motor con `fuente/calculos.py`.

**Acceptance Scenarios**:

1. **Given** el mes 3, **When** se calcula, **Then** velocidad media 12,33 %/mes → 8,11 meses; reciente
   (meses 2–3) 14,50 %/mes → 7,34 meses; clásico 7,61 meses.
2. **Given** el mes 5, **When** se calcula, **Then** media 16,00 %/mes → 6,25 meses; reciente (meses 4–5)
   21,50 %/mes → 5,93 meses; clásico 6,07 meses.

### Edge Cases

- El documento está al límite de 4 páginas: el texto nuevo sustituye al anterior, no se añade.
- La velocidad se mide en % del alcance terminado por mes (dos iteraciones); no se inventan datos por
  iteración que el enunciado no da.
- Un escenario del laboratorio con avance 0 en el tramo no tiene velocidad: el motor devuelve `null`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-101**: La estrategia 3 de A5 MUST combinar línea base y valor ganado (clásico) con iteraciones ágiles
  y citar el Tema 2; la conclusión MUST recoger la combinación de enfoques.
- **FR-102**: El documento MUST seguir en 4 páginas como máximo, Calibri 12 a 1,5, con las mismas cifras.
- **FR-103**: `/api/contenido` MUST incluir `hibrido` con textos, burn-up y pronósticos calculados por
  `evm.burnup` y `evm.velocidad`.
- **FR-104**: La ruta `/hibrido` MUST mostrar las dos columnas, los cinco pasos, el diagrama `ciclo-hibrido`,
  el burn-up con selector de corte y la tabla de tres estimaciones, rotulando la ampliación como tal.
- **FR-105**: `/api/cumplimiento` MUST incluir el requisito A.6 (enfoque híbrido) comprobado contra el .docx.
- **FR-106**: La figura del ciclo de control y la espina de causas MUST citar la estrategia 3 con su nombre nuevo.

### Key Entities

- **Hibrido** (en `ValorGanado_contenido.datos`): idea, clasico[], agil[], encaje[], iteraciones, nota.
- **PronosticoVelocidad** (calculado): mes, desde, ventana, velocidad, falta, duracion.
- **PuntoBurnup** (calculado): mes, plan (%), terminado (%).

## Success Criteria *(mandatory)*

- **SC-101**: validador independiente sin fallas, incluidas las comprobaciones del enfoque híbrido.
- **SC-102**: cumplimiento 16/16 en el portal desplegado.
- **SC-103**: pruebas del backend en verde (velocidad y burn-up = `calculos.py`).

## Assumptions

- Seis meses ≈ doce iteraciones de dos semanas (dos por mes).
- El umbral de escalada es un desvío del 10 % (CPI o SPI por debajo de 0,90), como en el documento.
