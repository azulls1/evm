---
title: ValorGanado · Control EVM
type: product-brief
created: 2026-10-26
updated: 2026-10-26
status: final
inputDocuments:
  - ../../docs/DISENO.md
  - ../../../fuente/calculos.py
  - ../../../fuente/contenido.py
  - ../../../README.md
---

# Product Brief: ValorGanado · Control EVM

## Executive Summary

ValorGanado es un portal web, en `evm.iagentek.com.mx`, que presenta de forma
interactiva y verificable la Actividad 2 individual de *Metodología de Diseño y Gestión de Proyectos* (UNIR
México; alumno Adonai Samael Hernández Mata; profesora Adriana Cervantes Castillo): el control de un
proyecto de software de seis meses y BAC de $115 000 con el método del valor ganado (EVM), en el mes 3
(Parte A) y en el mes 5 (Parte B).

El documento entregado (4 páginas, Calibri 12, interlineado 1,5) responde las diez preguntas, pero es
estático: no deja rehacer el cálculo, ver cómo se mueven los índices si cambia un dato ni comprobar que
cada cifra es correcta y está en el documento. El portal toma **exactamente** las mismas cifras y textos,
los recalcula con un motor propio, comprueba la rúbrica contra el .docx y el .pdf, y deja explorar
escenarios y la incertidumbre del cierre.

## Dos capas: el caso y el portal

| | Capa A · El caso del enunciado | Capa B · Portal ValorGanado |
|---|---|---|
| Qué es | Proyecto de software de 6 meses, BAC $115 000; Partes A (mes 3) y B (mes 5), cinco preguntas cada una | Este software |
| Estado | Resuelto y entregado en el .docx/.pdf | Implementado y desplegado en `evm.iagentek.com.mx` |
| Método | Valor ganado del Tema 5 (apartado 5.9, Tablas 9 a 12) | Desarrollo guiado por especificaciones (GitHub spec-kit) + método BMAD de planeación ágil |
| Dónde vive | `fuente/calculos.py` + `fuente/contenido.py` → `ValorGanado_contenido` | `specs/`, `_bmad-output/`, código |

Lo que el portal agrega (laboratorio de escenarios, contrafactual «sin medidas», Monte Carlo del cierre) se
rotula como **ampliación** y nunca sustituye a las respuestas del documento. Este brief, el PRD, la
arquitectura y las épicas son de la **capa B**.

## The Problem

- La profesora califica C1 (Parte A, 40 %) y C2 (Parte B, 40 %) por respuestas «correctas y bien
  justificadas»: tiene que rehacer el cálculo para saber si un CPI de 0,734 es correcto.
- El enunciado tiene una trampa: el avance viene **mes a mes** y el EV necesita el **acumulado**. Un error ahí
  cambia las diez respuestas y no se nota en el documento.
- La pregunta 3 pide la EAC «según el presupuesto original» y la 4 una duración sin fórmula en el temario:
  la justificación de esas decisiones no cabe en cuatro páginas.
- C3 (20 %) castiga pasar de 4 páginas o salirse de Calibri 12 / 1,5, y eso se rompe al editar.
- Un EAC es un solo número: no dice qué tan probable es cerrar dentro del presupuesto.

## The Solution

Un portal de lectura con 9 rutas: Resumen, Planteamiento del caso, El método, Parte A · mes 3 (C1), Parte
B · mes 5 (C2), Laboratorio, Cumplimiento, Metodología y Entregables. Cada cifra se recalcula en el
servidor; cada parte muestra la sustitución de cada fórmula, medidores de CPI y SPI y la curva S; la
rúbrica se comprueba sola (15 comprobaciones, incluidas las páginas y la fuente leídas del propio PDF); el
laboratorio permite cambiar el gasto y el avance de cada mes y simular miles de cierres posibles.

## What Makes This Different

- **Una sola fuente**: `calculos.py` (aritmética exacta con fracciones) y `contenido.py` generan el .docx, el
  .pdf y el portal; no hay dos versiones de una cifra ni de un texto.
- **Verificable**: el motor del portal se prueba contra la fuente del documento; la rúbrica se comprueba
  contra el .docx y el .pdf entregados; los entregables llevan SHA-256.
- **Honesto sobre el alcance**: las decisiones del método (EAC variante a, duración ÷ SPI como estimación,
  avance acumulado) se explican; todo lo que el portal añade se rotula como ampliación.

## Who This Serves

- **Profesora evaluadora** (Adriana Cervantes Castillo): revisa C1, C2 y C3 con el cálculo a la vista y la
  rúbrica comprobada, en minutos.
- **Alumno** (Adonai Samael Hernández Mata): detecta inconsistencias antes de la entrega
  (16-nov-2026, 23:59).
- **Visitante**: entiende el método del valor ganado jugando con los datos.

## Success Criteria

- 100 % de las diez respuestas iguales al .docx entregado.
- Cumplimiento: 15 de 15 comprobaciones en verde.
- Cifras correctas: mes 3 CPI 0,734, SPI 0,788, EAC $130 450, 7,61 meses; mes 5 CPI 0,929, SPI 0,989, EAC
  $122 000, 6,07 meses; meses 4–5 CPI 1,206, SPI 1,268.
- 18 pruebas del backend en verde; accesibilidad AA; `anon` de Supabase sin acceso a las tablas.

## Scope

**Dentro**: las 9 rutas, API calculada, laboratorio con escenarios y contrafactual, simulación Monte Carlo
en cola de trabajos, ZIP de entregables con manifiesto, servidor local sin base y despliegue en Swarm.

**Fuera**: cuentas y edición en línea del contenido; otros métodos de control (programación ganada,
análisis de reservas); entregar desde el portal.

## Vision

Segunda aplicación del mismo molde de la Actividad 1: contenido académico y cifras en una fuente única,
un portal que los presenta, los recalcula y los verifica, y la metodología (spec-kit + BMAD) documentada
como parte del entregable.
