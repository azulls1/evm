# Feature Specification: Portal ValorGanado · Control EVM

**Feature Branch**: `001-portal-valorganado`

**Created**: 2026-10-26

**Status**: Implementado

**Input**: User description: "Portal web (dominio evm.iagentek.com.mx) que presente de
forma interactiva y verificable la Actividad 2 individual de MDGP: el control con el método del valor
ganado de un proyecto de software de 6 meses y BAC $115 000, en el mes 3 (Parte A) y en el mes 5
(Parte B), con cinco preguntas cada una. Debe mostrar el caso, el método, el cálculo paso a paso de cada
parte con la curva S, comprobar el enunciado y la rúbrica contra el documento entregado, ofrecer un
laboratorio de escenarios y una simulación Monte Carlo del cierre, explicar cómo se construyó y permitir
descargar los entregables."

> **Dos capas.** Esta especificación describe el **portal** (capa B). El caso del enunciado (capa A:
> datos, Partes A y B, preguntas 1–5) es el **contenido** que el portal presenta, y su fuente única es
> `fuente/calculos.py` + `fuente/contenido.py`. El laboratorio, el contrafactual «sin medidas» y la
> simulación son **ampliación del portal** y nunca sustituyen a las respuestas del documento. Ver
> `.specify/memory/constitution.md`.

## User Scenarios & Testing *(mandatory)*

Actores: **la profesora evaluadora** (Adriana Cervantes Castillo; califica con la rúbrica C1 Parte A 40 %,
C2 Parte B 40 %, C3 Presentación 20 %), **el alumno** (Adonai Samael Hernández Mata; revisa que todo
coincida antes de entregar) y **el visitante** (consulta el
portal sin cuenta).

### User Story 1 - Leer las Partes A y B con el cálculo paso a paso (Priority: P1)

La profesora abre *Parte A · mes 3* y *Parte B · mes 5*. En cada una ve la tabla de cálculo con la
sustitución de cada fórmula, los medidores de CPI y SPI, la curva S hasta el corte y las cinco preguntas
con el texto literal del enunciado y la respuesta del documento entregado.

**Why this priority**: es lo que se califica (C1 y C2 suman el 80 %); sin esto el portal no tiene razón de ser.

**Independent Test**: comparar cada respuesta de la página con el .pdf entregado (deben coincidir carácter
por carácter) y rehacer a mano el cálculo de la tabla con los datos del enunciado.

**Acceptance Scenarios**:

1. **Given** la base cargada desde `fuente/contenido.py` (vía `scripts/generar_semilla.py`), **When** se abre
   *Parte A*, **Then** la tabla muestra PV $54 000, AC $58 000, EV = $115 000 × 37 % = $42 550,
   CV −$15 450, CPI 0,734, SV −$11 450, SPI 0,788, EAC (a) $130 450, EAC (b) $156 757, EAC (c) $183 332,
   TCPI 1,271 y duración 6 ÷ 0,788 = 7,61 meses, con las filas clave resaltadas.
2. **Given** *Parte B*, **When** se abre, **Then** la tabla muestra PV $93 000, AC $99 000, EV $92 000,
   CPI 0,929, SPI 0,989, EAC (a) $122 000 y duración 6,07 meses.
3. **Given** cualquiera de las dos partes, **When** se recorren las cinco preguntas, **Then** cada una muestra
   la pregunta literal del enunciado, el título corto y la respuesta del documento; en la pregunta 5 de la
   Parte A aparecen además las tres estrategias con su apartado (5.8, 5.7, Tema 4 y 5.8).
4. **Given** *Parte B*, **When** se baja a «¿Funcionaron las medidas del mes 3?», **Then** se ven CPI 0,734 →
   0,929, SPI 0,788 → 0,989, EAC $130 450 → $122 000 y, solo en los meses 4 y 5, EV $49 450, AC $41 000,
   PV $39 000, CPI del periodo 1,206 y SPI del periodo 1,268.
5. **Given** la curva S, **When** se pasa el puntero por un mes, **Then** se leen PV, AC, EV, CV y SV de ese
   mes; en la Parte A las curvas AC y EV se cortan en el mes 3.

---

### User Story 2 - Verificar el cumplimiento del enunciado y la rúbrica (Priority: P1)

La profesora o el alumno abre *Resumen* y *Cumplimiento* y ve, comprobado en el servidor, que cada
respuesta da la cifra correcta, que esa cifra está en el .docx entregado, que el EV usa el avance
acumulado y que el documento respeta la extensión y el formato.

**Why this priority**: convierte la rúbrica en una lista comprobable y detecta errores antes de la entrega.

**Independent Test**: cambiar en local la respuesta A.1 a «Por debajo. CPI = 1,200.» y comprobar que el
requisito A.1 pasa a rojo (`backend/tests/test_cumplimiento.py::test_detecta_una_respuesta_equivocada`).

**Acceptance Scenarios**:

1. **Given** los datos cargados, **When** se abre *Resumen*, **Then** se ven BAC $115 000 y 6 meses, EAC al
   mes 3 $130 450 (sobrecoste $15 450), EAC al mes 5 $122 000 (sobrecoste $7 000), los cuatro medidores
   (CPI y SPI de cada corte), la curva S con los cortes 3 y 5, el veredicto de cada corte y el contador
   «15/15» de la rúbrica.
2. **Given** *Cumplimiento*, **When** se abre, **Then** se listan las 15 comprobaciones agrupadas (C1, C2,
   Datos, C3), cada una con su evidencia medida (p. ej. «CPI = $42 550 ÷ $58 000 = 0,734 → por encima del
   presupuesto») y un enlace a la página donde está.
3. **Given** el .docx y el .pdf de `entregables/documento/`, **When** se evalúa C3, **Then** C3.1 lee 4
   páginas del PDF, C3.2 lee Calibri 12 e interlineado 1,5 del estilo Normal y las fuentes incrustadas en el
   PDF, y C3.3 confirma que las diez respuestas aparecen tal cual en el .docx.
4. **Given** el menú lateral, **When** carga, **Then** la insignia de *Cumplimiento* muestra cumplidos/total
   calculados por la API, no escritos a mano.

---

### User Story 3 - Entender el caso y el método (Priority: P2)

El visitante abre *Planteamiento del caso* y *El método* para entender de dónde salen las cifras: las
tablas del enunciado con sus acumulados, la «trampa» del avance mes a mes, las preguntas, la rúbrica y
las fórmulas de las Tablas 9 a 12 del Tema 5.

**Why this priority**: da contexto a C1 y C2 y justifica las decisiones (avance acumulado, EAC variante a);
no es contenido nuevo.

**Independent Test**: sumar a mano los acumulados (PV 23 000, 38 000, 54 000, 73 000, 93 000, 115 000; avance
8, 23, 37, 58, 80 %) y comparar con la tabla.

**Acceptance Scenarios**:

1. **Given** *Planteamiento*, **When** se abre, **Then** se ven PV, AC y avance por mes con sus acumulados y
   totales, con los acumulados del mes 3 y del mes 5 resaltados.
2. **Given** el aviso «La trampa del enunciado», **When** se lee, **Then** explica que con el avance de un
   solo mes el EV saldría $16 100 y $25 300 en lugar de $42 550 y $92 000.
3. **Given** *El método*, **When** se abre, **Then** se ven PV, AC, EV y BAC; CV y CPI; SV y SPI; las tres
   variantes de EAC con la a) marcada como «la que pide la actividad»; TCPI; la duración estimada como
   estimación; y las referencias.

---

### User Story 4 - Explorar escenarios en el laboratorio (Priority: P2)

*Ampliación del portal.* El visitante abre *Laboratorio* y elige entre «Datos del enunciado», «¿Y sin
medidas en el mes 3?» y «Escenario propio»; edita el coste real y el avance de cada mes y ve al instante,
recalculados en el servidor, los medidores, EV, EAC (a), EAC (b), duración y la curva S del corte elegido.

**Why this priority**: muestra la sensibilidad del método y deja ver el efecto de las medidas del mes 3
por contraste; no se califica.

**Independent Test**: elegir «¿Y sin medidas…?» y comprobar que al mes 5 el EAC (a) es $140 757 y la
duración 7,87 meses (frente a $122 000 y 6,07 con los datos reales).

**Acceptance Scenarios**:

1. **Given** el laboratorio, **When** se cambia un valor de AC o de avance, **Then** el escenario se envía a
   `POST /api/escenario` y los indicadores se actualizan sin recargar.
2. **Given** «¿Y sin medidas en el mes 3?», **When** se elige, **Then** los meses 4 y 5 toman el promedio de
   los meses 1–3 (AC $19 333 y avance 12,33 % por mes) y la página lo explica como contrafactual.
3. **Given** un escenario incoherente (avance acumulado > 100 % o línea base que no suma el BAC), **When** se
   envía, **Then** la API responde 422 y la página muestra el motivo en español.
4. **Given** el encabezado, **When** se abre, **Then** se ve el rótulo «Ampliación del portal · no forma
   parte del enunciado».

---

### User Story 5 - Simular el cierre del proyecto (Priority: P2)

*Ampliación del portal.* Desde el corte elegido, el visitante lanza una simulación Monte Carlo (cola de
trabajos) y pasa de un solo número (EAC, 6 ÷ SPI) a una distribución: probabilidad de terminar dentro del
BAC y dentro de los seis meses, percentiles de coste y duración, histogramas y un abanico de trayectorias
sobre la curva S.

**Why this priority**: añade una lectura de riesgo; depende del motor y del worker; no se califica.

**Independent Test**: con semilla fija, dos corridas dan el mismo P50; con ritmo «solo los dos últimos
meses» al mes 5, el coste por punto de avance es menor y el avance medio mayor que con «todos los meses»
(`backend/tests/test_simulacion.py`).

**Acceptance Scenarios**:

1. **Given** parámetros válidos, **When** se pulsa *Simular cierres*, **Then** la petición se acepta (202) y
   la página sondea el estado hasta «completada» sin recargar.
2. **Given** una simulación completada, **When** se ve el resultado, **Then** aparecen las probabilidades
   «Dentro del BAC» y «En plazo», coste P50/P80 junto al EAC (a), duración P50/P80 junto a 6 ÷ SPI, los dos
   histogramas con la línea de referencia y el abanico de hasta 40 trayectorias.
3. **Given** parámetros fuera de rango (iteraciones 500–10 000, variabilidad 0,05–0,6, ventana `todo` o
   `reciente`), **When** se envían a la API, **Then** responde 422; los controles de la página no los permiten.
4. **Given** una visita nueva, **When** se abre el laboratorio, **Then** se muestra la última simulación
   completada guardada.
5. **Given** el corte del mes 3 con todos los meses como referencia, **When** se simula, **Then** la
   probabilidad de terminar dentro del BAC es prácticamente nula, coherente con un EAC (b) de $156 757.

---

### User Story 6 - Descargar los entregables (Priority: P3)

El alumno o la profesora descarga el .docx, el .pdf, el paquete de entrega (con un LEEME que ubica cada
criterio), los datos en CSV, la curva S, las especificaciones y los artefactos de planeación, o pide un
ZIP con todo y su manifiesto SHA-256.

**Why this priority**: comodidad y trazabilidad; la entrega oficial es el documento.

**Independent Test**: descargar el ZIP generado, recalcular `sha256sum` de cada archivo y compararlo con
`MANIFIESTO_SHA256.txt` y con la huella del catálogo.

**Acceptance Scenarios**:

1. **Given** el catálogo, **When** se abre *Entregables*, **Then** cada archivo muestra nombre, tipo, criterio,
   tamaño y SHA-256, con descarga y vista en línea (`ver=1`).
2. **Given** la «Entrega para el profesor», **When** se abre, **Then** se lista el contenido real del paquete
   de entrega (leído del propio archivo) y su LEEME.
3. **Given** *Generar ZIP*, **When** se pulsa, **Then** se encola un trabajo o se reutiliza el vigente, y al
   terminar aparece la descarga del ZIP con `MANIFIESTO_SHA256.txt`.

---

### User Story 7 - Conocer cómo se construyó (Priority: P3)

El visitante abre *Metodología* y ve las dos capas (el caso y el portal), el flujo de desarrollo guiado
por especificaciones (GitHub spec-kit) y del método BMAD de planeación ágil con enlaces a cada artefacto,
y las figuras isométricas interactivas y diagramas propios.

**Why this priority**: transparencia sobre el proceso; no se califica.

**Independent Test**: cada artefacto listado en la página existe en el catálogo de entregables y se abre en
línea.

**Acceptance Scenarios**:

1. **Given** *Metodología*, **When** se abre, **Then** se ve el flujo Brief y PRD → Constitución → Spec →
   Arquitectura → Plan y contratos → Épicas y tareas → Código y despliegue, y las listas de archivos de
   spec-kit y BMAD tomadas de `/api/entregables`.
2. **Given** las figuras de `docs/figuras/`, **When** se abre la página, **Then** la figura isométrica se
   incrusta como iframe del mismo origen y los diagramas de `indice.json` se amplían al hacer clic.

---

### Edge Cases

- **Base no disponible**: `/api/health` responde 503 con `db: false`; cada página muestra error con
  reintento, nunca ceros como si fueran cifras.
- **Contenido no cargado**: `/api/contenido`, `/api/resumen` y `/api/cumplimiento` responden 404 «El
  contenido de la actividad no está cargado».
- **Redis o worker caídos**: lecturas y laboratorio siguen funcionando (el escenario se calcula en la
  API); `POST /simulacion` y `POST /entregables/generar` responden 503 y la fila queda en `error`. Una
  simulación pendiente más de 60 s deja de sondearse.
- **Mes de corte sin mediciones** en la simulación: 422 «El mes de corte no tiene mediciones».
- **Índices sin definir** (AC o PV en cero en un escenario propio): CPI, SPI y los derivados vuelven `null`
  y se muestran como «—».
- **Ráfaga de simulaciones**: Traefik devuelve 429 por IP; la página dice «Demasiadas simulaciones
  seguidas: espera un minuto» y no reintenta sola.
- **Escritura sin `X-Requested-With: portal-valorganado`**: 403 «Petición no permitida».
- **Archivo fuera del catálogo o ruta con `..`**: 404. **Paquete inexistente o no listo**: 404; **ZIP ya
  purgado del volumen**: 410.
- **Pestaña abierta de un despliegue anterior**: si falta un *chunk*, el router recarga la página una vez.
- **Pantalla de 360 px**: tablas con desplazamiento horizontal propio, sin desbordar la página.

## Requirements *(mandatory)*

### Functional Requirements

**Contenido (capa A presentada)**

- **FR-001**: El portal MUST mostrar el texto académico exactamente como está en `fuente/contenido.py` y las
  preguntas literales del enunciado.
- **FR-002**: El portal MUST mostrar las tablas del enunciado (PV, AC y avance por mes) con sus acumulados.
- **FR-003**: Las Partes A y B MUST mostrar la tabla de cálculo con la sustitución de cada fórmula
  (PV, AC, EV, CV, CPI, SV, SPI, EAC a/b/c, TCPI y duración) y resaltar las que pide la actividad.
- **FR-004**: Las Partes A y B MUST mostrar las cinco preguntas con la respuesta del documento; la A5 con las
  tres estrategias y la B5 con la comparación de índices y el desempeño de los meses 4–5.
- **FR-005**: El portal MUST explicar que el EV usa el avance **acumulado** y cuánto cambiaría con el del mes.
- **FR-006**: *El método* MUST presentar las fórmulas de las Tablas 9 a 12 del Tema 5 y marcar la EAC a)
  como la que pide la pregunta 3 y la duración ÷ SPI como estimación.
- **FR-007**: Todo lo que no está en el documento (laboratorio, contrafactual, simulación) MUST rotularse
  como «ampliación del portal» y MUST NOT sustituir a las respuestas.

**Cálculo y verificación**

- **FR-008**: La API MUST recalcular todos los indicadores con `backend/app/evm.py` a partir de los datos del
  caso en cada petición; la base MUST NOT guardar resultados y el frontend MUST NOT contener cifras fijas.
- **FR-009**: El motor MUST coincidir con `fuente/calculos.py` en los cortes 1 a 5 (tolerancia relativa 1e-12).
- **FR-010**: La API MUST evaluar 15 comprobaciones (A.1–A.5, B.1–B.5, D.1, C3.1–C3.4) contra el contenido y
  el .docx/.pdf entregados, con evidencia medida y estado.
- **FR-011**: La API MUST leer del documento entregado las páginas (PDF), la fuente, el tamaño y el
  interlineado del estilo Normal (.docx) y las fuentes incrustadas en el PDF.

**Laboratorio y simulación (ampliación)**

- **FR-012**: El visitante MUST poder enviar un escenario propio (`bac` > 0, `duracion` 2–24, listas de 1 a
  24 valores) y recibir el análisis completo sin que se guarde; un escenario incoherente → 422.
- **FR-013**: El laboratorio MUST ofrecer el contrafactual «sin medidas»: meses 4 y 5 al ritmo promedio de
  los meses 1–3.
- **FR-014**: El visitante MUST poder lanzar una simulación con `mes` 1–24, `iteraciones` 500–10 000,
  `variabilidad` 0,05–0,6, `ventana` `todo`|`reciente`, `semilla` opcional y `escenario` opcional (sin
  escenario, los datos del enunciado); fuera de rango → 422.
- **FR-015**: La simulación MUST ejecutarse en la cola de trabajos (Celery) y quedar registrada con
  parámetros, estado y resultado; se conservan las 200 más recientes.
- **FR-016**: El resultado MUST incluir el ritmo usado, los valores deterministas (EAC a/b/c, duración, CPI,
  SPI), media y percentiles P10/P50/P80/P90 de coste y duración, probabilidad dentro del BAC y en plazo,
  histogramas de 24 clases y hasta 40 trayectorias.

**Entregables y metodología**

- **FR-017**: El portal MUST listar los entregables con tipo, criterio, tamaño y SHA-256 y servir solo las
  rutas registradas en el catálogo.
- **FR-018**: El visitante MUST poder pedir un ZIP de los entregables con manifiesto SHA-256, generado en
  segundo plano; se conservan los 3 más recientes.
- **FR-019**: El portal MUST mostrar *Metodología* con las dos capas, los artefactos de spec-kit y BMAD, y las
  figuras isométricas interactivas y diagramas propios.

**Transversales**

- **FR-020**: Toda la interfaz y los mensajes de error MUST estar en español de México.
- **FR-021**: Las escrituras MUST exigir `X-Requested-With: portal-valorganado` y estar limitadas por IP.
- **FR-022**: Cada vista MUST tener estados de carga, vacío y error con reintento.
- **FR-023**: El portal MUST cumplir WCAG 2.1 AA, ser usable desde 360 px y anular toda animación con
  `prefers-reduced-motion: reduce`.
- **FR-024**: El portal MUST exponer `/api/health` con el estado de la base y de Redis.

### Key Entities

- **Contenido**: una sola fila (`id = 'actividad2'`) con portada, introducción, nota del avance, fórmulas,
  datos del caso, Partes A y B, periodo de las medidas (meses 4–5), conclusión, referencias y enunciado.
- **Datos del caso**: BAC, duración planificada, PV por mes, AC y avance por mes medido.
- **Corte**: indicadores acumulados al cierre de un mes (calculado, no guardado).
- **Periodo**: desempeño de un tramo de meses (calculado, no guardado).
- **Requisito de cumplimiento**: comprobación con criterio, evidencia, estado y ruta (calculado).
- **Simulación**: corrida Monte Carlo pedida por un visitante, con parámetros y resultado.
- **Entregable**: archivo descargable con su huella SHA-256.
- **Paquete**: ZIP generado con los entregables y su manifiesto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las diez respuestas del portal coincide con el .docx entregado (C3.3 en verde).
- **SC-002**: *Cumplimiento* muestra 15 de 15 comprobaciones en verde.
- **SC-003**: Las cifras del portal coinciden con un recálculo manual: mes 3 CPI 0,734, SPI 0,788, EAC
  $130 450, 7,61 meses; mes 5 CPI 0,929, SPI 0,989, EAC $122 000, 6,07 meses; meses 4–5 CPI 1,206, SPI 1,268.
- **SC-004**: Las 18 pruebas del backend pasan (`pytest`): 12 del motor, 4 de la simulación y 2 del cumplimiento.
- **SC-005**: Una simulación de 3000 iteraciones se completa y se muestra en menos de 3 s.
- **SC-006**: Cualquier página carga su contenido en menos de 2 s en una conexión 4G.
- **SC-007**: Una consulta con la llave `anon` de Supabase a cualquier tabla `ValorGanado_*` devuelve 0
  filas o error de permisos.
- **SC-008**: Un despliegue con `deploy/deploy.sh` deja los 4 servicios 1/1 con la imagen del commit y el
  dominio responde con TLS válido y `/api/health` en `ok`.
- **SC-009**: Con `prefers-reduced-motion: reduce` no se ejecuta ninguna animación y todas las páginas
  muestran su contenido completo.

## Assumptions

- El portal es público y de solo lectura; no requiere cuentas.
- La EAC de la pregunta 3 es la variante a) del Tema 5 (`AC + (BAC − EV)`), porque el enunciado dice
  «según el presupuesto original»; las variantes b) y c) se muestran como contraste.
- La duración estimada es `6 ÷ SPI`, una estimación habitual: el Tema 5 no da fórmula de plazo.
- El avance del enunciado viene mes a mes; para el EV se usa el acumulado (37 % y 80 %).
- La profesora evalúa el documento; el portal es material de apoyo.
- El .docx entregado usa Calibri 12 e interlineado 1,5 y el .pdf lo exporta Microsoft Word desde ese mismo
  .docx (`../fuente/construir.py`); ambos ocupan 4 páginas.
- El dominio definitivo es `evm.iagentek.com.mx`.
