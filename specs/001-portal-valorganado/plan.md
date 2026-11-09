# Implementation Plan: Portal ValorGanado · Control EVM

**Branch**: `001-portal-valorganado` | **Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-portal-valorganado/spec.md`

## Summary

Portal de lectura pública que presenta, recalcula y comprueba el control con valor ganado de un proyecto
de software (6 meses, BAC $115 000) en los meses 3 y 5. `scripts/generar_semilla.py` convierte
`fuente/calculos.py` y `fuente/contenido.py` (la misma fuente del .docx y el .pdf) en una sola fila jsonb
de `ValorGanado_contenido` (`db/migraciones/003_contenido.sql`). Una API FastAPI recalcula todos los
indicadores con el motor `evm.py` en cada petición y comprueba el enunciado y la rúbrica contra el
documento entregado (15 comprobaciones, con `pypdf` para leer el PDF). Un worker Celery (broker Redis)
corre la simulación Monte Carlo del cierre y arma el ZIP de entregables. Un frontend Angular 22 +
Tailwind 4 con Forest DS muestra 9 rutas. Todo en Docker Swarm detrás de Traefik en
`evm.iagentek.com.mx`.

## Technical Context

**Language/Version**: Python 3.11 (API, worker, scripts) · TypeScript 6.0 (Angular 22.2)

**Primary Dependencies**: FastAPI 0.141, Uvicorn 0.54, Pydantic 2, psycopg 3 + `psycopg_pool`, Celery 5.6
con `redis`, `pypdf` (la simulación y el motor usan solo la biblioteca estándar) · Angular 22 (standalone,
signals, `httpResource`, View Transitions), Tailwind CSS 4.3

**Storage**: PostgreSQL 15 de Supabase maestría (servicio `supabase-maestria_db`), esquema `public`,
prefijo `ValorGanado_`, rol `valorganado_app`, DSN en el secreto Swarm `valorganado_db_dsn_v1`. Redis 7
sin persistencia (`maxmemory 64mb`, `allkeys-lru`), solo broker (db 0) y resultados (db 1) de Celery,
direccionado como `valorganado_redis` (en la red compartida `iagenteknet` el nombre corto `redis`
resuelve al de otro stack). Volumen `valorganado_paquetes` compartido entre `api` y `worker` para los ZIP.

**Testing**: `pytest` sin base de datos (el contenido sale de `fuente/contenido.json` y los entregables de
`dev/entregables/`): `test_evm.py` (12: coincidencia con `calculos.py` en los meses 1–5, Parte A, Parte B,
medidas de los meses 4–5, curva S y tres escenarios incoherentes), `test_simulacion.py` (4: semilla,
coherencia de percentiles, mes 5 mejor que mes 3, ventana reciente) y `test_cumplimiento.py` (2: todo
cumple y una respuesta equivocada se detecta) · `ng build` · servidor local sin base
(`scripts/servidor_local.py`) y verificación de `/api/health` en `deploy.sh`.

**Target Platform**: VPS iaGentek (Linux x86-64, Docker Swarm de un nodo), Traefik v3 + Let's Encrypt,
red `iagenteknet`.

**Project Type**: web-service + SPA + worker de cola.

**Performance Goals**: simulación de 3000 iteraciones en milisegundos dentro del worker (< 3 s de punta a
punta con el sondeo, SC-005); lecturas < 100 ms en la API; primera carga del SPA < 2 s en 4G (SC-006).

**Constraints**: sin autenticación de usuarios; contenido de solo lectura para la app; cuerpo ≤ 8192
bytes; `api` y `worker` ≤ 384 MiB y 1 CPU, `web` ≤ 128 MiB, `redis` ≤ 96 MiB; worker con concurrencia 2 y
`task_time_limit` de 60 s.

**Scale/Scope**: 4 tablas, una fila de contenido, 9 rutas (8 componentes de página), 12 componentes, uso
de demostración (decenas de visitas).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo lo cumple el plan | Estado |
|---|---|---|
| Dos capas | Capa A solo en `fuente/` y en `ValorGanado_contenido`; capa B en `specs/` y `_bmad-output/`; laboratorio y simulación con rótulo «ampliación del portal» (FR-007) | ✅ |
| I. Fuente única | `generar_semilla.py` importa `calculos.py` y `contenido.py`; ningún texto académico en el frontend | ✅ |
| II. Cifras recalculadas | La fila guarda datos, no resultados; `evm.py` recalcula en cada petición; `test_evm.py` lo compara con `calculos.py`; `cumplimiento.py` busca cada cifra en el .docx | ✅ |
| III. Seguridad | `002_seguridad.sql` (RLS forzado, revocar `anon`/`authenticated`, una política), secreto Swarm, middlewares Traefik, cabecera `portal-valorganado`, contenedores no root | ✅ |
| IV. Accesibilidad / Forest DS | Tokens en `styles.css` (`@theme`) sobre `src/forest/`, `estado.ts`, SVG con `role="img"`, `sinMovimiento()` | ✅ |
| V. Despliegue reproducible | `deploy/deploy.sh` regenera semilla y entregables, etiqueta `:<sha>` y verifica servicio, réplicas, imagen, salud y HTTPS | ✅ |
| VI. Español | UI, errores (`{"detail": "…"}`), rutas, tablas, código y documentación | ✅ |
| VII. Simplicidad | 4 servicios; Celery solo para la simulación y el ZIP; el laboratorio no guarda nada | ✅ |

Re-evaluado tras la Fase 1: sin violaciones; no hace falta *Complexity Tracking*.

## Project Structure

### Documentation (this feature)

```text
specs/001-portal-valorganado/
├── plan.md              # este archivo
├── research.md          # Fase 0: decisiones R1–R9
├── data-model.md        # Fase 1: 4 tablas ValorGanado_* y estructuras calculadas
├── quickstart.md        # Fase 1: pruebas, servidor local y despliegue
├── contracts/api.md     # Fase 1: contrato REST /api
├── checklists/requisitos.md
└── tasks.md             # Fase 2: T001–T060
```

### Source Code (repository root)

```text
fuente/
├── calculos.py          # copia sincronizada de ../fuente: BAC, PV, AC, avance; corte(), periodo() con Fraction
├── contenido.py         # copia sincronizada: portada, fórmulas, respuestas A y B, estrategias, conclusión
└── contenido.json       # GENERADO por scripts/generar_semilla.py (lo usan las pruebas y el servidor local)

backend/
├── app/
│   ├── main.py          # FastAPI: 13 rutas, CORS, dependencia anti-CSRF desde_el_portal, Escenario, PeticionSimulacion
│   ├── config.py        # DSN desde DATABASE_URL o /run/secrets/valorganado_db_dsn (DATABASE_URL_FILE)
│   ├── db.py            # pool psycopg 3 (filas como dict, autocommit)
│   ├── consultas.py     # SQL de contenido, simulaciones, entregables y paquetes
│   ├── evm.py           # motor: Datos.validar(), corte(), periodo(), serie(), analizar()
│   ├── cumplimiento.py  # 15 comprobaciones contra el contenido y el .docx/.pdf (pypdf)
│   ├── simulacion.py    # Monte Carlo del cierre (random + statistics, función pura)
│   ├── celery_app.py    # Celery + Redis, acks tardíos, prefetch 1, límite de 60 s
│   └── tareas.py        # valorganado.simular_cierre · valorganado.generar_entregable
├── tests/               # conftest.py, test_evm.py, test_simulacion.py, test_cumplimiento.py
├── requirements.txt
└── Dockerfile           # imagen única para api (uvicorn) y worker (celery); usuario 10001

frontend/
├── src/app/
│   ├── paginas/         # resumen, planteamiento, metodo, parte (A y B), laboratorio,
│   │                    # cumplimiento, metodologia, entregables
│   ├── componentes/     # curva-s, medidor, histograma, kpi, encabezado, estado, icono,
│   │                    # paginador, revelar, confeti, figura, diagrama
│   ├── core/            # modelos.ts, formato.ts (mx, dec, pct), movimiento.ts
│   ├── app.routes.ts    # 9 rutas con carga diferida (parte-a y parte-b comparten componente)
│   └── app.config.ts    # HttpClient + interceptor X-Requested-With + View Transitions + recarga por versión
├── src/forest/          # Forest Design System
├── src/styles.css       # Tailwind 4 + tokens Forest DS
├── proxy.conf.json      # /api → dominio público
├── proxy.local.json     # /api → http://127.0.0.1:8000 (servidor local)
├── nginx.conf, seguridad-headers*.conf
└── Dockerfile           # node:24 → nginx-unprivileged:1.29 en :8080

db/migraciones/
├── 001_esquema.sql      # 4 tablas ValorGanado_*
├── 002_seguridad.sql    # rol valorganado_app, RLS forzado, política, grants (se reaplica al final)
└── 003_contenido.sql    # GENERADO por scripts/generar_semilla.py
db/catalogo_entregables.sql  # GENERADO por scripts/preparar_entregables.py

scripts/
├── generar_semilla.py       # sincroniza ../fuente y genera 003_contenido.sql + contenido.json
├── preparar_entregables.py  # entregables/ (docx, pdf, ZIP de entrega, CSV, figuras, specs, BMAD) + catálogo SHA-256
└── servidor_local.py        # la misma API sin Postgres ni Redis (consultas en memoria, Celery inmediato)

deploy/
├── stack.yml            # web, api, worker, redis; labels y middlewares Traefik; secreto; volumen
├── deploy.sh            # semilla + entregables, rsync, migraciones, build :<sha>, stack deploy, verificación
└── .env.deploy.ejemplo  # plantilla de los datos del servidor (el real queda fuera del repo)

docs/
├── DISENO.md
└── figuras/             # figuras isométricas interactivas y diagramas propios (indice.json)
```

**Structure Decision**: aplicación web (backend + frontend) más fuente, migraciones, generadores y
despliegue en carpetas propias. La fuente académica vive fuera del repo del portal (`../fuente/`), se
copia a `dev/fuente/` para que un clon se pueda reproducir solo y entra a la base únicamente por
`scripts/generar_semilla.py`.

## Fases

- **Fase 0** — `research.md`: R1 EAC variante a, R2 duración ÷ SPI, R3 avance acumulado, R4 una fila jsonb
  y cifras recalculadas, R5 Monte Carlo con la biblioteca estándar, R6 Celery + Redis, R7 cumplimiento con
  pypdf, R8 servidor local sin base, R9 seguridad en el borde y Supabase maestría.
- **Fase 1** — `data-model.md`, `contracts/api.md`, `quickstart.md`.
- **Fase 2** — `tasks.md` por historia de usuario (US1–US7).

## Complexity Tracking

Sin violaciones.
