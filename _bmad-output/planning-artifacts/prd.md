---
title: ValorGanado · Control EVM
created: 2026-10-26
updated: 2026-10-26
status: final
inputDocuments:
  - product-brief.md
  - ../../specs/001-portal-valorganado/spec.md
  - ../../docs/DISENO.md
---

# PRD: ValorGanado · Control EVM

## 0. Document Purpose

PRD del **portal** (capa B) para quien lo construye y lo revisa. Los requisitos funcionales **son los de
`specs/001-portal-valorganado/spec.md`** y se citan por su id (`FR-001…FR-024`, `SC-001…SC-009`); aquí se
agrupan por funcionalidad, se fijan el vocabulario y los recorridos, y se marcan los no-objetivos. El
diseño técnico está en `architecture.md` y en `specs/…/plan.md`.

## 1. Vision

Que la profesora y el alumno vean el control del proyecto tal como se entregó, pero con cada cifra
recalculada, cada fórmula sustituida, la rúbrica comprobada contra el documento y la posibilidad de
preguntar «¿y si…?». El portal no agrega contenido académico a las respuestas: las presenta, las verifica
y, aparte y rotulado, las amplía.

## 2. Target User

### 2.1 Jobs To Be Done

- Evaluar C1 y C2 sin rehacer el cálculo a mano.
- Confirmar antes de entregar que el documento dice lo mismo que el cálculo y respeta 4 páginas, Calibri 12 y
  1,5.
- Entender por qué el EV usa el avance acumulado y qué EAC pide la pregunta 3.
- Ver qué habría pasado sin las medidas del mes 3 y qué tan probable es cerrar dentro del BAC.
- Descargar exactamente lo que se entregó.

### 2.2 Non-Users (v1)

Gestores que quieran controlar un proyecto real con varios paquetes de trabajo: el portal modela un solo
proyecto con datos mensuales.

### 2.3 Key User Journeys

- **UJ-1. La profesora revisa la actividad en diez minutos.** Abre *Resumen* (veredicto de cada corte, EAC al
  mes 3 y al mes 5, medidores, curva S), recorre Planteamiento → El método → Parte A → Parte B y termina en
  *Cumplimiento*, donde ve 15 de 15 en verde, incluidas las 4 páginas y Calibri 12 / 1,5 leídos del propio
  PDF y .docx.
- **UJ-2. El alumno corrige una redacción antes del cierre.** Edita `../fuente/contenido.py`, regenera el
  documento con `../fuente/construir.py`, corre `scripts/generar_semilla.py` y abre *Cumplimiento* en el
  servidor local. **Edge case:** si una respuesta deja de contener la cifra recalculada o el .docx ya no la
  tiene, ese requisito aparece en rojo con la evidencia.
- **UJ-3. Un visitante prueba el contrafactual.** En *Laboratorio* elige «¿Y sin medidas en el mes 3?» y ve
  que al mes 5 el EAC (a) sería $140 757 y la duración 7,87 meses, frente a $122 000 y 6,07 con los datos
  reales: el efecto de las medidas, por contraste.
- **UJ-4. Un visitante simula el cierre.** Desde el mes 5, con ritmo «solo los dos últimos meses», lanza 3000
  cierres y ve ≈ 63 % de probabilidad de terminar en plazo y ≈ 20 % de cerrar dentro del BAC; con «todos los
  meses», ≈ 21 % y ≈ 11 %.
- **UJ-5. La profesora descarga el paquete.** En *Entregables* abre la paquete de entrega (con su LEEME) o
  genera un ZIP y comprueba los SHA-256 con el manifiesto.

## 3. Glossary

- **Capa A** — el caso del enunciado: datos y diez respuestas; fuente única `fuente/`.
- **Capa B** — el portal ValorGanado.
- **Corte** — indicadores acumulados al cierre de un mes (Parte A = mes 3, Parte B = mes 5).
- **Periodo de las medidas** — meses 4 y 5, cuando actúan las acciones correctivas del mes 3.
- **EAC (a)** — `AC + (BAC − EV)`, la que pide la pregunta 3; **(b)** `BAC ÷ CPI`; **(c)** `AC + (BAC − EV) ÷ (CPI × SPI)`.
- **Duración estimada** — `6 ÷ SPI`, estimación (el Tema 5 no da fórmula de plazo).
- **Ampliación del portal** — lo que no está en el documento: laboratorio, contrafactual y simulación.
- **Contrafactual «sin medidas»** — meses 4 y 5 al ritmo promedio de los meses 1–3.
- **Requisito de cumplimiento** — regla del enunciado o de la rúbrica evaluada contra el contenido y el documento.
- **Simulación** — corrida Monte Carlo del resto del proyecto desde un corte.
- **Entregable** — archivo descargable con SHA-256; **paquete** — ZIP de entregables con manifiesto.

## 4. Features

### 4.1 Partes A y B
Tabla de cálculo con sustituciones, medidores, curva S y cinco respuestas por parte; comparación de índices
y periodo 4–5 en la Parte B. Realizes UJ-1. **FR:** FR-001, FR-003, FR-004, FR-008, FR-009.

### 4.2 Caso y método
Tablas del enunciado con acumulados, la trampa del avance, preguntas, rúbrica y fórmulas del Tema 5.
Realizes UJ-1. **FR:** FR-002, FR-005, FR-006.

### 4.3 Resumen y cumplimiento
Veredicto, KPI y 15 comprobaciones con evidencia medida contra el documento. Realizes UJ-1, UJ-2.
**FR:** FR-010, FR-011.

### 4.4 Laboratorio de escenarios (ampliación)
Escenario del enunciado, contrafactual y escenario propio con recálculo inmediato. Realizes UJ-3.
**FR:** FR-007, FR-012, FR-013.

### 4.5 Simulación del cierre (ampliación)
Monte Carlo en segundo plano con resultado persistido. Realizes UJ-4. **FR:** FR-014–FR-016.
**NFR:** < 3 s de punta a punta para 3000 iteraciones (SC-005).

### 4.6 Entregables y metodología
Catálogo con SHA-256, paquete de entrega, ZIP con manifiesto y página de metodología. Realizes UJ-5.
**FR:** FR-017–FR-019.

### 4.7 Enfoque híbrido · clásico + ágil (incremento 2, `specs/002-enfoque-hibrido`)
Responde a la retroalimentación de la Actividad 1 («complementar las metodologías ágiles con las clásicas»):
estrategia 3 de A5 y conclusión del documento con el enfoque híbrido; ruta `/hibrido` con qué aporta cada
enfoque, cómo encajan, el diagrama del ciclo híbrido, un burn-up y el pronóstico del plazo por velocidad
frente a 6 ÷ SPI. Realizes UJ-1. **FR:** FR-101–FR-106.

## 5. Non-Goals (Explicit)

- No reemplaza las respuestas del documento: la simulación es una lectura de riesgo, no la EAC de la pregunta 3.
- No modela un proyecto real con paquetes de trabajo, recursos ni calendario semanal.
- No edita contenido en línea ni tiene cuentas; el laboratorio no guarda escenarios.
- No sustituye al documento entregado.

## 6. MVP Scope

### 6.1 In Scope
Épicas 1–3 de `epics.md` (plataforma y datos, Partes A y B, resumen y cumplimiento).

### 6.2 Out of Scope for MVP
Caso y método, laboratorio, simulación, entregables y metodología (épicas 4–7): se agregan como incrementos
y ya están hechos. El despliegue y la calidad transversal (épica 8) acompañan cada incremento.

## 7. Success Metrics

**Primary**
- **SM-1**: diez de diez respuestas iguales al .docx. Validates FR-001 (SC-001).
- **SM-2**: cumplimiento 16/16 (con A.6, enfoque híbrido). Validates FR-010, FR-105 (SC-002, SC-102).
- **SM-3**: cifras del portal = recálculo manual y = `calculos.py`. Validates FR-008, FR-009 (SC-003, SC-004).

**Secondary**
- **SM-4**: simulación < 3 s (SC-005); páginas < 2 s en 4G (SC-006).

**Counter-metrics (do not optimize)**
- **SM-C1**: probabilidad de la simulación. No se ajustan la variabilidad ni la ventana por defecto para que
  «salga bien»; es una lectura del riesgo, no una meta. Counterbalances SM-4.

## 8. Cross-Cutting NFRs

- Seguridad: RLS forzado, secreto Swarm `valorganado_db_dsn_v1`, cabeceras, límite por IP, cabecera
  `X-Requested-With: portal-valorganado` (FR-021, SC-007).
- Accesibilidad: WCAG 2.1 AA, 360 px, movimiento reducido (FR-023, SC-009).
- Idioma: español de México; cifras con espacio de miles y coma decimal (FR-020).
- Despliegue reproducible por sha de commit (SC-008).

## 9. Aesthetic and Tone

Forest DS en modo claro (fondo `#F7F8F7`, forest `#04202C`, pine `#5B7065`, sage `#9EADA3`); Sora / DM Sans /
JetBrains Mono; curvas PV `#1F3A68`, AC `#C0392B`, EV `#2E8B57` como en la figura 1 del documento. Tono sobrio y
académico; los rótulos dicen «ampliación del portal» y «estimación» donde corresponde.

## 10. Open Questions

Resueltas: dominio definitivo `evm.iagentek.com.mx`; repositorio `github.com/azulls1/evm` y primer despliegue hechos.

## 11. Assumptions Index

- EAC variante a) por la letra «según el presupuesto original» (research R1).
- Duración `6 ÷ SPI` como estimación (research R2).
- Avance acumulado para el EV (research R3).
- Simulación basada en el ritmo observado, con la biblioteca estándar (research R5).
