---

description: "Lista de tareas — Portal ValorGanado · Control EVM"
---

# Tasks: Portal ValorGanado · Control EVM

**Input**: `specs/001-portal-valorganado/` (plan, spec, research, data-model, contracts)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: 18 pruebas del backend con `pytest` (`test_evm.py`, `test_simulacion.py`, `test_cumplimiento.py`),
`ng build`, revisión con el servidor local y verificación en producción; el contenido y las cifras se
comprueban además en `/api/cumplimiento`.

**Organization**: por historia de usuario del **portal** (US1–US7). Estas tareas son de la capa B; no
confundir con las Partes A y B del enunciado (capa A), que son contenido.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ir en paralelo (archivos distintos, sin dependencias)
- **[Story]**: historia del portal (US1…US7)

## Path Conventions

`backend/app/`, `backend/tests/`, `frontend/src/app/{paginas,componentes,core}/` (un archivo `.ts` por
página o componente), `fuente/`, `db/migraciones/`, `scripts/`, `deploy/`.

---

## Phase 1: Setup

- [X] T001 Inicializar el repositorio en `dev/` (remoto `github.com/azulls1/evm`) con `.gitignore` y `.dockerignore` (`.venv/`, `node_modules/`, `dist/`, `.env.deploy`, `.paquetes_local/`)
- [X] T002 Preparar el desarrollo guiado por especificaciones (GitHub spec-kit: `.specify/`, constitución → spec → plan → tareas) y el método BMAD de planeación ágil (`_bmad-output/`: brief, PRD, arquitectura, épicas, estado del sprint)
- [X] T003 Redactar `docs/DISENO.md` como documento de diseño de referencia
- [X] T004 [P] Esqueleto de `backend/` (FastAPI, `requirements.txt` con pypdf, `Dockerfile` único para api y worker con usuario 10001)
- [X] T005 [P] Esqueleto de `frontend/` (Angular 22 standalone, Tailwind 4, `nginx.conf` sin privilegios en :8080, `Dockerfile` node:24 → nginx-unprivileged:1.29)
- [X] T006 [P] Forest DS en `frontend/src/forest/` y tokens (colores, Sora / DM Sans / JetBrains Mono) en `frontend/src/styles.css`

---

## Phase 2: Foundational

**⚠️ CRITICAL**: ninguna historia empieza antes de terminar esta fase.

- [X] T007 `db/migraciones/001_esquema.sql`: 4 tablas `ValorGanado_*` (contenido de una fila, simulaciones, entregables, paquetes) e índice por fecha (data-model.md)
- [X] T008 `db/migraciones/002_seguridad.sql`: rol `valorganado_app`, RLS habilitado y forzado, revocar `anon`/`authenticated`, una política por tabla, grants en tablas y secuencias
- [X] T009 `scripts/generar_semilla.py`: sincroniza `../fuente/{calculos,contenido}.py` a `fuente/`, agrega el enunciado literal y la rúbrica, y genera `db/migraciones/003_contenido.sql` (una transacción, `on conflict do update`) y `fuente/contenido.json`
- [X] T010 [P] `backend/app/config.py` (DSN desde `DATABASE_URL` o `/run/secrets/valorganado_db_dsn`; Redis, carpetas y CORS desde el entorno) y `backend/app/db.py` (pool psycopg 3)
- [X] T011 [P] `backend/app/main.py`: CORS (`GET`, `POST`; cabeceras `content-type`, `x-requested-with`), dependencia `desde_el_portal` (`X-Requested-With: portal-valorganado` → 403), errores `{"detail": …}` en español, sin `/docs` ni `/openapi.json`
- [X] T012 [P] `backend/app/celery_app.py`: Celery 5.6 + Redis (db 0 broker, db 1 resultados), JSON, `acks_late`, prefetch 1, `time_limit=60`
- [X] T013 `GET /api/health` con db y redis; 503 «degradado» si falta alguno (FR-024)
- [X] T014 [P] `frontend/src/app/core/modelos.ts` (tipos del contrato) y `core/formato.ts` (`mx`, `dec`, `pct`, `milesCorto`, `mes`: espacio de miles y coma decimal como el documento)
- [X] T015 [P] `frontend/src/app/app.config.ts`: interceptor de la cabecera `portal-valorganado`, `withComponentInputBinding`, `withViewTransitions` y recarga única si falta un *chunk* de un despliegue anterior
- [X] T016 [P] `componentes/estado.ts` (carga, vacío, error con reintento), `encabezado.ts`, `icono.ts` (trazos propios, sin librería) y `kpi.ts` (FR-022)
- [X] T017 Shell del portal (`app.ts`, `app.html`): barra lateral con grupos Principal · La actividad · En vivo · Entrega, insignia de cumplimiento calculada, `lang="es-MX"`, «Saltar al contenido», menú móvil y pie con el repositorio

**Checkpoint**: base cargada, API en pie, shell navegable.

---

## Phase 3: User Story 1 — Leer las Partes A y B con el cálculo paso a paso (P1) 🎯 MVP

**Goal**: C1 y C2 con las cifras recalculadas y el texto exacto del documento. **Independent Test**: comparación con el .pdf y recálculo manual.

- [X] T018 [US1] `backend/app/evm.py`: `Datos.validar()`, `corte()` (EV con avance acumulado, CV, SV, CPI, SPI, EAC a/b/c, TCPI, duración ÷ SPI, VAC, lecturas de coste y plazo), `periodo()`, `serie()` y `analizar()` (FR-008)
- [X] T019 [P] [US1] `backend/tests/conftest.py` (contenido desde `fuente/contenido.json`, fixture `sin_base`) y `backend/tests/test_evm.py`: coincidencia con `fuente/calculos.py` en los meses 1–5 (rel 1e-12), Parte A, Parte B, medidas de los meses 4–5 y curva S (FR-009)
- [X] T020 [US1] `GET /api/contenido`: contenido + `analisis` (cortes y serie) + `periodo_medidas` recalculados
- [X] T021 [P] [US1] `componentes/curva-s.ts`: PV, AC y EV acumulados en SVG con cortes marcados, lectura por puntero (PV, AC, EV, CV, SV), línea del BAC y abanico opcional de trayectorias
- [X] T022 [P] [US1] `componentes/medidor.ts`: medidor semicircular 0,5–1,5 con zonas < 0,9 · 0,9–1 · > 1 y aguja animada
- [X] T023 [US1] `paginas/parte.ts` (rutas `parte-a` y `parte-b` con `data: { parte }`): tabla paso a paso con sustituciones, medidores, curva S recortada al corte, cinco preguntas con el enunciado literal, estrategias de A5 y bloque «¿Funcionaron las medidas del mes 3?» en la Parte B (FR-003, FR-004)
- [X] T024 [US1] Verificar que las diez respuestas son idénticas a `contenido.py` y al .docx (SC-001, comprobación C3.3)

**Checkpoint**: C1 y C2 revisables en el portal.

---

## Phase 4: User Story 2 — Verificar el cumplimiento (P1)

**Goal**: rúbrica comprobada contra el contenido y el documento. **Independent Test**: una respuesta equivocada pasa a rojo.

- [X] T025 [US2] `backend/app/cumplimiento.py`: 15 comprobaciones (A.1–A.5, B.1–B.5, D.1, C3.1–C3.4); lectura del .docx (texto, estilo Normal) y del PDF con `pypdf` (páginas, fuentes incrustadas) (FR-010, FR-011)
- [X] T026 [P] [US2] `backend/tests/test_cumplimiento.py`: todos los requisitos cumplen; una respuesta A.1 alterada se detecta
- [X] T027 [US2] Rutas `GET /api/resumen` (cortes A y B, periodo, serie, conclusión, conteo de cumplimiento y simulaciones) y `GET /api/cumplimiento`
- [X] T028 [P] [US2] `componentes/revelar.ts` (aparición al desplazar) y conteo animado en `kpi.ts`, ambos inactivos con movimiento reducido
- [X] T029 [US2] `paginas/resumen.ts`: portada con veredicto por corte, KPI (BAC, EAC al mes 3 y al mes 5, rúbrica), curva S con cortes 3 y 5, cuatro medidores, mapa de la rúbrica y conclusión
- [X] T030 [US2] `paginas/cumplimiento.ts`: anillo de progreso, KPI, requisitos agrupados por criterio con evidencia y enlace, confeti si nada bloquea (`componentes/confeti.ts`)
- [X] T031 [US2] Verificar `/api/cumplimiento`: 15 de 15 en verde, C3.1 = 4 páginas, C3.2 = Calibri 12 e interlineado 1,5 (SC-002)

**Checkpoint**: SC-002 y SC-003 verificables.

---

## Phase 5: User Story 3 — Entender el caso y el método (P2)

- [X] T032 [P] [US3] `paginas/planteamiento.ts`: tablas del enunciado con acumulados y totales, acumulados de los meses 3 y 5 resaltados, aviso «La trampa del enunciado», preguntas de ambas partes y rúbrica (FR-002, FR-005)
- [X] T033 [P] [US3] `paginas/metodo.ts`: PV, AC, EV y BAC; CV/CPI; SV/SPI; EAC a/b/c con la a) marcada; TCPI; duración como estimación; referencias (FR-006)
- [X] T034 [US3] Comprobación D.1 (avance acumulado 37 % y 80 %, EV en el .docx) enlazada a `/planteamiento`
- [X] T035 [US3] Navegación encadenada El método → Parte A → Parte B → Laboratorio

---

## Phase 6: User Story 4 — Explorar escenarios en el laboratorio (P2)

**Goal**: sensibilidad del método, rotulada como ampliación. **Independent Test**: «sin medidas» al mes 5 → EAC $140 757 y 7,87 meses.

- [X] T036 [US4] Modelo `Escenario` (Pydantic: `bac` > 0 y ≤ 1e9, `duracion` 2–24, listas de 1 a 24) con validador que llama a `Datos.validar()`; ruta `POST /api/escenario` protegida por la cabecera (FR-012)
- [X] T037 [P] [US4] Pruebas de escenarios incoherentes en `test_evm.py` (línea base que no suma el BAC, avance > 100 %, meses distintos)
- [X] T038 [US4] `paginas/laboratorio.ts` sección 1: pestañas Datos del enunciado · ¿Y sin medidas en el mes 3? · Escenario propio, tabla editable de AC y avance, control del corte, recálculo en el servidor con cada cambio, medidores, EV, EAC a/b, duración y curva S (FR-013)
- [X] T039 [US4] Mensaje de error 422 legible en español y botón para volver a los datos del enunciado
- [X] T040 [US4] Rótulo «Ampliación del portal · no forma parte del enunciado» en el encabezado (FR-007)

---

## Phase 7: User Story 5 — Simular el cierre del proyecto (P2)

**Goal**: Monte Carlo asíncrono. **Independent Test**: misma semilla → mismo resultado; ventana reciente mejor que todo al mes 5.

- [X] T041 [US5] `backend/app/simulacion.py`: función pura con `random` y `statistics` (avance y coste por punto con `gauss`, ventana `todo`/`reciente`, dispersión mínima por variabilidad, último mes fraccionario, tope de 36 meses, percentiles, histogramas de 24 clases, 40 trayectorias, semilla) (FR-016)
- [X] T042 [P] [US5] `backend/tests/test_simulacion.py`: reproducibilidad con semilla, percentiles ordenados y probabilidades en [0, 1], mes 5 con más probabilidad en plazo y menor P50 que el mes 3, ventana reciente con mejor ritmo
- [X] T043 [US5] Tarea `valorganado.simular_cierre` en `backend/app/tareas.py` (completa o falla la fila con mensaje genérico, purga a 200)
- [X] T044 [US5] Rutas `POST /api/simulacion` (202; 403, 422, 503), `GET /api/simulacion/{id}` y `GET /api/simulacion/ultima` (FR-014, FR-015)
- [X] T045 [P] [US5] `componentes/histograma.ts`: barras dentro/fuera de la referencia (BAC o 6 meses), marcas P50 y P80
- [X] T046 [US5] `paginas/laboratorio.ts` sección 2: controles con los mismos rangos, sondeo cada 600 ms (tope 60 s), KPI de probabilidad y percentiles, dos histogramas, abanico sobre la curva S, ritmo usado, última simulación y mensajes 429/503
- [X] T047 [US5] Medir SC-005: 3000 iteraciones en milisegundos dentro del worker

**Checkpoint**: laboratorio completo.

---

## Phase 8: User Story 6 — Descargar los entregables (P3)

- [X] T048 [US6] `scripts/preparar_entregables.py`: copia el .docx y el .pdf de `../entregable/`, arma el ZIP determinista de entrega con LEEME, genera los CSV desde `calculos.py`, copia la curva S, las figuras, `specs/`, la constitución y `_bmad-output/`, y escribe `db/catalogo_entregables.sql` con SHA-256
- [X] T049 [US6] Rutas `GET /api/entregables` (catálogo, total, entrega con contenido leído del ZIP y LEEME, último paquete, recientes) y `GET /api/entregables/archivo?ruta=…[&ver=1]` (solo rutas registradas y dentro de la carpeta) (FR-017)
- [X] T050 [US6] Tarea `valorganado.generar_entregable` (ZIP + `MANIFIESTO_SHA256.txt`, conserva 3, purga huérfanos) y rutas `POST /api/entregables/generar` (reutiliza el vigente), `GET /api/entregables/paquete/{id}` y `/descargar` (404, 410) (FR-018)
- [X] T051 [US6] `paginas/entregables.ts` con KPI, entrega para el profesor, catálogo filtrable y paginado (`componentes/paginador.ts`) y botón «Generar ZIP»

---

## Phase 9: User Story 7 — Conocer cómo se construyó (P3)

- [X] T052 [P] [US7] `paginas/metodologia.ts`: las dos capas, flujo spec-kit y BMAD, archivos de cada uno tomados de `/api/entregables` con vista en línea (FR-019)
- [X] T053 [P] [US7] `componentes/figura.ts` (iframe del mismo origen bajo `/figuras/`) y `componentes/diagrama.ts` (por id desde `/figuras/diagramas/indice.json`, ampliación en diálogo); nginx sirve `/figuras/` con `frame-ancestors 'self'`
- [X] T054 [P] [US7] Artefactos: `.specify/memory/constitution.md`, `specs/001-portal-valorganado/*`, `_bmad-output/*` y `docs/DISENO.md`

---

## Phase 10: Polish & Cross-Cutting Concerns

- [X] T055 `deploy/stack.yml`: servicios `web`, `api`, `worker`, `redis` (direccionado como `valorganado_redis`), redes `interna`, `iagenteknet` y `supabase_maestria_internal`, secreto `valorganado_db_dsn_v1`, volumen `paquetes`, límites de memoria y CPU, *healthcheck* del worker con `celery inspect ping`
- [X] T056 Labels Traefik: routers web (10), api (100) y api-escritura (110), middlewares `valorganado-hsts`, `-cabeceras-api`, `-limite` (20/s, ráfaga 60), `-limite-escritura` (60/min, ráfaga 10) y `-cuerpo` (8192 bytes) (R9)
- [X] T057 `deploy/deploy.sh` y `deploy/.env.deploy.ejemplo`: semilla y entregables, rsync, migraciones (seguridad al final), contraseña generada en el servidor, build `:<sha>`, secreto, stack deploy, imagen forzada y verificación
- [X] T058 `scripts/servidor_local.py` y `frontend/proxy.local.json`: la misma API sin Postgres ni Redis para revisar el portal en local (R8)
- [X] T059 [P] Revisión de teclado, foco, contraste y movimiento reducido en las 9 rutas; revisión a 360 px, 768 px y 1440 px (FR-023, SC-009)
- [X] T060 Ejecutar `quickstart.md` de punta a punta en local (pruebas, `ng build`, servidor local) y marcar `sprint-status.yaml`

> Fuera de esta lista y ya hecho: dominio definitivo `evm.iagentek.com.mx`, repositorio en GitHub y
> primer despliegue (SC-007, SC-008).

---

## Dependencies & Execution Order

- Setup (1) → Foundational (2) → US1 y US2 (P1) → US3 → US4 → US5 (usa el motor, `Escenario` y el worker) → US6, US7 → Polish.
- US2 depende de US1 (el cumplimiento usa `evm.corte()` y `evm.periodo()`).
- US4 y US5 comparten `paginas/laboratorio.ts`; US5 depende de T012 (Celery) y T036 (`Escenario`).
- US6 depende de T012 y de T048 (catálogo); US7 depende de US6 (lista sus archivos desde `/api/entregables`).
- Dentro de cada historia: cálculo → prueba → ruta → componentes [P] → página.

## Parallel Example: User Story 1

```bash
Task: "Componente componentes/curva-s.ts"
Task: "Componente componentes/medidor.ts"
Task: "Pruebas backend/tests/test_evm.py"
```

## Implementation Strategy

MVP = Fases 1–4 (Partes A y B + cumplimiento): basta para que la profesora revise el trabajo. Después,
incrementos US3 → US4/US5 → US6/US7, cada uno desplegable con `deploy/deploy.sh`.
