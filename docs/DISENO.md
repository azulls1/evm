# ValorGanado · Control EVM — documento de diseño (fuente única)

Portal web que presenta, de forma interactiva y verificable, la **Actividad 2 individual** de *Metodología de
Diseño y Gestión de Proyectos* (UNIR México, maestría): el control de un proyecto de software de **6 meses** y
**BAC $115 000** con el **método del valor ganado (EVM)**, en el mes 3 (Parte A) y en el mes 5 (Parte B). Alumno:
Adonai Samael Hernández Mata · Profesora: Adriana Cervantes Castillo · 

- Producción: **https://evm.iagentek.com.mx** ( VPS iaGentek, Docker Swarm + Traefik)
- Repositorio: **github.com/azulls1/evm**
- Base de datos: **Supabase maestría** (`supabase-maestria_db`, esquema `public`, tablas `ValorGanado_*`, rol `valorganado_app`)
- Fuente de cifras y textos: `../fuente/calculos.py` y `../fuente/contenido.py` (los mismos archivos que generan el
  .docx y el .pdf entregados con `../fuente/construir.py`; copia sincronizada en `dev/fuente/`)

## 1. Dos capas

| Capa | Qué es | Dónde vive |
|---|---|---|
| **A · El caso** | Datos del enunciado y las diez respuestas del documento entregado | `fuente/` → `ValorGanado_contenido` |
| **B · El portal** | Este software, que presenta, recalcula y comprueba la capa A | código, `specs/`, `_bmad-output/` |

Lo que el portal agrega —**laboratorio de escenarios**, **contrafactual «¿y sin medidas en el mes 3?»** y
**simulación Monte Carlo del cierre**— se rotula como *ampliación del portal* y nunca sustituye a las
respuestas del documento (la pregunta 3 se responde con la EAC a) y la 4 con `6 ÷ SPI`).

## 2. Stack

| Capa | Tecnología |
|---|---|
| Frontend | Angular 22 (standalone, signals, `httpResource`, View Transitions) + Tailwind CSS 4 + Forest Design System |
| API | Python 3.11 · FastAPI · psycopg 3 (pool) · pypdf (lectura del PDF entregado) |
| Motor | `backend/app/evm.py`: fórmulas del Tema 5, mismas cifras que `fuente/calculos.py` (comprobado por pruebas) |
| Trabajos asíncronos | Celery 5.6 con Redis 7 (sin persistencia) como broker y backend de resultados |
| Datos | PostgreSQL 15 de Supabase maestría (secreto Swarm `valorganado_db_dsn_v1`) |
| Despliegue | Docker Swarm (stack `valorganado`), Traefik v3 con Let's Encrypt, red `iagenteknet` |

Servicios del stack: `web` (nginx sin privilegios :8080), `api` (uvicorn :8000, 2 procesos), `worker` (celery,
concurrencia 2), `redis` (direccionado como `valorganado_redis`). Traefik: `Host(dominio)` → web (prioridad 10);
`… && PathPrefix(/api)` → api (100); `… && Method(POST)` → api con límite estricto (110).

## 3. Trabajos de Celery

1. **`valorganado.simular_cierre`** — simulación Monte Carlo del resto del proyecto desde un corte. Cada mes futuro
   avanza un % y cuesta un importe por punto de avance, ambos sorteados con una normal alrededor del ritmo
   observado (todos los meses medidos o solo los dos últimos); la dispersión es la observada o, si es menor,
   `variabilidad × media`. Resultado: probabilidad de cerrar dentro del BAC y dentro de los 6 meses, media y
   P10/P50/P80/P90 de coste y duración, histogramas y hasta 40 trayectorias para el abanico de la curva S.
   Parámetros: `mes` (corte medido), `iteraciones` (500–10 000), `variabilidad` (0,05–0,6), `ventana`
   (`todo`|`reciente`), `semilla` y `escenario` opcionales. Solo biblioteca estándar (`random`, `statistics`).
2. **`valorganado.generar_entregable`** — empaqueta el catálogo de entregables en un ZIP con manifiesto SHA-256;
   conserva los 3 más recientes.

El laboratorio de escenarios **no** usa la cola: `POST /api/escenario` calcula al instante y no guarda nada.

## 4. Modelo de datos (Supabase maestría, `public`)

| Tabla | Contenido |
|---|---|
| `ValorGanado_contenido` | una fila (`actividad2`) en jsonb: portada, introducción, nota del avance, fórmulas, datos del caso, Partes A y B (preguntas literales y respuestas, estrategias), periodo 4–5, conclusión, referencias, enunciado y rúbrica |
| `ValorGanado_simulaciones` | cada simulación pedida: parámetros (con el escenario copiado), estado, resultado (jsonb); se conservan 200 |
| `ValorGanado_entregables` | catálogo de archivos entregables con tamaño y SHA-256 |
| `ValorGanado_paquetes` | ZIP generados por el worker |

La base guarda **datos**, no indicadores: EV, CPI, SPI, EAC, curva S y cumplimiento se recalculan en cada petición.
Seguridad: RLS forzado en todas las tablas, `anon`/`authenticated` sin privilegios, política única para `valorganado_app`.

## 5. Datos del caso y resultados

| Mes | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| PV del mes | $23 000 | $15 000 | $16 000 | $19 000 | $20 000 | $22 000 |
| PV acumulado | $23 000 | $38 000 | **$54 000** | $73 000 | **$93 000** | $115 000 |
| AC del mes | $21 000 | $18 000 | $19 000 | $20 000 | $21 000 | |
| AC acumulado | $21 000 | $39 000 | **$58 000** | $78 000 | **$99 000** | |
| Avance del mes | 8 % | 15 % | 14 % | 21 % | 22 % | |
| Avance acumulado | 8 % | 23 % | **37 %** | 58 % | **80 %** | |

El EV usa el avance **acumulado** (EV = BAC × % acumulado), no el del mes.

| Indicador | Mes 3 (Parte A) | Mes 5 (Parte B) |
|---|---|---|
| EV | $42 550 | $92 000 |
| CV · CPI | −$15 450 · **0,734** (por encima del presupuesto) | −$7 000 · **0,929** (por encima) |
| SV · SPI | −$11 450 · **0,788** (retrasado) | −$1 000 · **0,989** (ligeramente retrasado) |
| EAC a) `AC + (BAC − EV)` | **$130 450** | **$122 000** |
| EAC b) `BAC ÷ CPI` · c) `AC + (BAC − EV) ÷ (CPI × SPI)` | $156 757 · $183 332 | $123 750 · $124 019 |
| TCPI | 1,271 | 1,438 |
| Duración estimada `6 ÷ SPI` | **7,61 meses** | **6,07 meses** |

Solo meses 4–5 (efecto de las medidas del mes 3): EV $49 450, AC $41 000, PV $39 000 → **CPI 1,206** y **SPI 1,268**.
Contrafactual «sin medidas» (meses 4–5 al ritmo de los meses 1–3), al mes 5: EAC a) $140 757 y 7,87 meses.

## 6. API (`/api`)

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/health` | estado de db y redis |
| GET | `/contenido` | contenido completo + análisis recalculado (cortes 1–5, curva S) + periodo 4–5 |
| GET | `/resumen` | cortes A y B, periodo, curva S, conclusión, conteo de cumplimiento y de simulaciones |
| GET | `/cumplimiento` | 15 comprobaciones del enunciado y la rúbrica contra el contenido y el .docx/.pdf |
| POST | `/escenario` | análisis inmediato de un escenario del laboratorio (no se guarda) |
| POST | `/simulacion` | encola una simulación → 202 `{id, estado}` |
| GET | `/simulacion/{id}` · `/simulacion/ultima` | estado y resultado |
| GET/POST | `/entregables…` | catálogo, descarga, generación y descarga del ZIP |

Las escrituras exigen la cabecera `X-Requested-With: portal-valorganado` (anti-CSRF) y tienen límite por IP en
Traefik. Contrato completo en `specs/001-portal-valorganado/contracts/api.md`.

## 7. Páginas del portal

| Ruta | Página | Qué muestra |
|---|---|---|
| `/resumen` | Resumen | veredicto de cada corte, KPI, curva S con cortes 3 y 5, cuatro medidores, mapa de la rúbrica, conclusión |
| `/planteamiento` | Planteamiento del caso | tablas del enunciado con acumulados, la trampa del avance, preguntas y rúbrica |
| `/metodo` | El método | variables y fórmulas de las Tablas 9 a 12 del Tema 5, EAC a/b/c, TCPI, duración, referencias |
| `/parte-a` | Parte A · mes 3 (C1) | cálculo paso a paso, medidores, curva S, cinco respuestas y tres estrategias |
| `/parte-b` | Parte B · mes 5 (C2) | igual que la A, más «¿Funcionaron las medidas del mes 3?» |
| `/laboratorio` | Laboratorio (ampliación) | escenarios inmediatos (enunciado, sin medidas, propio) y simulación Monte Carlo |
| `/cumplimiento` | Cumplimiento | 15 comprobaciones con evidencia, anillo de progreso |
| `/metodologia` | Metodología | dos capas, spec-kit y BMAD, figuras isométricas interactivas y diagramas propios |
| `/entregables` | Entregables | paquete de entrega, catálogo con SHA-256, generación de ZIP |

Componentes propios: curva S (lectura por puntero, abanico de trayectorias), medidor semicircular de CPI/SPI
(zonas < 0,9 · 0,9–1 · > 1), histograma con P50/P80, KPI con conteo animado, estado de carga/vacío/error,
encabezado, iconos de trazo, paginador, aparición al desplazar, confeti, figura (iframe del mismo origen) y diagrama.

## 8. Identidad visual (Forest DS)

Modo claro. Fondo `#F7F8F7`, primario forest `#04202C`, evergreen `#304040`, pine/moss `#5B7065`, sage `#9EADA3`,
fog `#DFE4E0`, blanco. Éxito `#059669`, aviso `#D97706`, error `#DC2626`.
Curvas (las mismas de la figura 1 del documento): PV `#1F3A68`, AC `#C0392B`, EV `#2E8B57`.
Tipografías: **Sora** (títulos), **DM Sans** (texto), **JetBrains Mono** (datos y etiquetas).
Cifras con espacio de miles y coma decimal, como el documento ($130 450 · 0,734 · 7,61 meses).
Toda animación se desactiva con `prefers-reduced-motion: reduce`.

## 9. Cómo se construyó (metodología)

- **Desarrollo guiado por especificaciones (GitHub spec-kit)**: constitución → `spec.md` → `plan.md` → `tasks.md` en
  `specs/001-portal-valorganado/` y `.specify/memory/constitution.md`.
- **Método BMAD de planeación ágil**: product brief, PRD, arquitectura, épicas e historias y `sprint-status.yaml` en
  `_bmad-output/`.
- **Figuras isométricas interactivas y diagramas propios**: en `docs/figuras/`, servidos en `/figuras/` e incrustados
  en *Metodología*.

## 10. Desarrollo y despliegue

- Pruebas: `cd backend && .venv/bin/python -m pytest -q` (18 pruebas, sin base de datos).
- Portal en local sin Postgres ni Redis: `backend/.venv/bin/python scripts/servidor_local.py` y
  `cd frontend && npx ng serve --proxy-config proxy.local.json`.
- Despliegue: `deploy/deploy.sh` (datos del servidor en `deploy/.env.deploy`, fuera del repositorio).
- Detalle en `specs/001-portal-valorganado/quickstart.md`.
