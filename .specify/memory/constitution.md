<!--
Sync Impact Report
- Versión: (plantilla) → 1.0.0 — ratificación inicial para el portal ValorGanado · Control EVM
- Principios añadidos: I–VII (todos nuevos)
- Secciones añadidas: «Dos capas: el caso y el portal», «Restricciones técnicas», «Flujo de trabajo», «Gobernanza»
- Plantillas revisadas: plan-template.md ✅ (Constitution Check usa I–VII) · spec-template.md ✅ · tasks-template.md ✅
- Dominio definitivo: `evm.iagentek.com.mx`
-->

# Constitución de ValorGanado · Control EVM

Portal web que presenta, de forma interactiva y verificable, la Actividad 2 individual de *Metodología de
Diseño y Gestión de Proyectos* (UNIR México, maestría; alumno Adonai Samael Hernández Mata; profesora
Adriana Cervantes Castillo): el control de un proyecto de software de seis meses y presupuesto (BAC) de
$115 000 con el método del valor ganado (EVM), en el mes 3 (Parte A) y en el mes 5 (Parte B). Documento de
diseño de referencia: `docs/DISENO.md`.

## Dos capas: el caso y el portal (regla de lectura)

Este repositorio contiene **dos niveles que nunca se mezclan**:

| Capa | Qué es | Estado | Identificadores |
|---|---|---|---|
| **A · El caso del enunciado** (producto académico) | Datos del proyecto de software (PV, AC y avance por mes) y las diez respuestas del documento entregado. Fuente única: `fuente/calculos.py` (cifras) y `fuente/contenido.py` (textos). | **Resuelto y entregado** en el .docx/.pdf | Partes `A` y `B`, preguntas `1…5`, meses `1…6`, criterios `C1`, `C2`, `C3` |
| **B · El portal ValorGanado** (este software) | La aplicación web que **presenta, recalcula y comprueba** la capa A. Se construye con desarrollo guiado por especificaciones (GitHub spec-kit) y el método BMAD de planeación ágil. | Implementado | `US1…US6`, `FR-xxx`, `SC-xxx`, `T0xx`, épicas `N.M` |

Lo que el portal **agrega** y el documento no tiene —el **laboratorio de escenarios**, el **contrafactual
«¿y sin medidas en el mes 3?»** y la **simulación Monte Carlo del cierre**— se rotula siempre en la
interfaz como **ampliación del portal** y **nunca sustituye** a las respuestas del documento: la pregunta
3 se responde con `EAC = AC + (BAC − EV)` y la pregunta 4 con `6 ÷ SPI`, aunque la simulación dé otra
distribución. Ningún artefacto de la capa B (spec, plan, tareas, épicas, `sprint-status.yaml`) describe
el proyecto del enunciado como si fuera trabajo del portal.

## Principios

### I. Fuente única: el portal dice lo mismo que el documento

- Toda cifra del caso sale **solo** de `fuente/calculos.py` (aritmética exacta con `fractions.Fraction`) y
  todo texto académico (introducción, fórmulas, nota del avance acumulado, diez respuestas, tres
  estrategias, conclusión y referencias) **solo** de `fuente/contenido.py`. Son los mismos archivos que
  generan el .docx y el .pdf entregados (`../fuente/construir.py`).
- El portal no reescribe, resume ni «mejora» ese texto. Un cambio se hace en `../fuente/`, se regenera el
  documento y se recarga la base con `scripts/generar_semilla.py`, que copia la fuente a `dev/fuente/`,
  produce `db/migraciones/003_contenido.sql` y `fuente/contenido.json`.
- El enunciado literal (preguntas comunes, A5, B5, extensión y rúbrica) vive en `scripts/generar_semilla.py`
  y se guarda junto al contenido; el frontend no lo repite.

### II. Cifras recalculadas por el motor, nunca escritas a mano

- La base guarda **datos** (BAC, duración, PV, AC y avance por mes), no resultados. La API recalcula EV,
  CV, SV, CPI, SPI, EAC (a, b y c), TCPI, VAC, duración estimada, la curva S y el desempeño de los meses
  4–5 con `backend/app/evm.py` en cada petición.
- El motor del portal debe dar **exactamente** las cifras de `fuente/calculos.py`: las pruebas
  (`backend/tests/test_evm.py`) lo comparan corte por corte con tolerancia relativa 1e-12.
- El frontend no contiene cifras del caso: solo formatea lo que recibe (`core/formato.ts`, espacio de
  miles y coma decimal, igual que el documento: CPI 0,734, EAC $130 450, 7,61 meses).
- La página *Cumplimiento* evalúa 15 comprobaciones (A.1–A.5, B.1–B.5, D.1, C3.1–C3.4): recalcula cada
  cifra, la busca en la respuesta del portal y en el .docx entregado, y lee páginas y fuente del propio
  documento. Nada se marca a mano.

### III. Seguridad por defecto

- RLS **habilitado y forzado** en todas las tablas `ValorGanado_*`; `anon` y `authenticated` sin
  privilegios; una sola política por tabla para el rol `valorganado_app`. El contenido y el catálogo los
  escriben solo las migraciones del despliegue; la API los lee y solo escribe simulaciones y paquetes.
- Credenciales solo como **secreto de Swarm** `valorganado_db_dsn_v1` (montado en
  `/run/secrets/valorganado_db_dsn`); nunca en git, imágenes ni variables visibles. Los datos del servidor
  viven en `deploy/.env.deploy`, fuera del repositorio.
- Toda escritura (`POST`) exige la cabecera `X-Requested-With: portal-valorganado` (si falta, 403): obliga a
  un *preflight* CORS y solo se admite el origen del portal.
- Traefik aplica HSTS, cabeceras de la API (`nosniff`, `frameDeny`, `no-referrer`), **límites de tasa** por
  IP (lecturas 20/s con ráfaga 60; escrituras 60/min con ráfaga 10) y límite de cuerpo de 8192 bytes. nginx
  añade al SPA la CSP (`frame-ancestors 'none'`), `Permissions-Policy` y COOP; solo `/figuras/` admite
  `frame-ancestors 'self'`.
- Parámetros validados con rangos cerrados (Pydantic); descargas solo de rutas registradas en el catálogo;
  sin documentación interactiva de la API en producción; contenedores sin root; no se guardan IP ni datos
  de visitantes.

### IV. Accesibilidad y Forest DS

- Identidad Forest DS (paleta y tipografías de `docs/DISENO.md` §8), modo claro. Las tres curvas usan los
  colores de la figura 1 del documento: PV `#1F3A68`, AC `#C0392B`, EV `#2E8B57`.
- WCAG 2.1 AA: contraste ≥ 4.5:1 en texto, foco visible, navegación por teclado, `lang="es-MX"`, enlace
  «Saltar al contenido», tablas con encabezados y gráficas SVG con `role="img"` y descripción textual.
- Cada vista tiene estados de carga, vacío y error con reintento (`componentes/estado.ts`). Usable desde 360 px.
- Toda animación (View Transitions, aparición al desplazar, conteo de KPI, confeti) se desactiva con
  `prefers-reduced-motion: reduce` y el contenido nunca depende de ella.

### V. Despliegue reproducible

- Las imágenes se etiquetan con el **sha corto del commit** (`:<sha>`, sufijo `-dirty` si hay cambios sin
  commit); el stack nunca usa `:latest`.
- `deploy/deploy.sh` es la única vía de despliegue: regenera semilla y entregables, migra, construye,
  crea el secreto si falta, despliega, fuerza la imagen nueva y verifica réplicas, imagen, contenedores,
  portada HTTPS y `/api/health`.
- Migraciones SQL numeradas e idempotentes en `db/migraciones/`; `002_seguridad.sql` se reaplica al final
  de cada despliegue.

### VI. Español en todo

- Interfaz, mensajes de error de la API, rutas del portal, nombres de tablas y columnas, código y
  documentación en español de México. Las siglas del método (PV, AC, EV, CPI, SPI, EAC, TCPI, BAC) se
  mantienen como en el Tema 5 y el PMBOK®.

### VII. Simplicidad

- Cuatro servicios (`web`, `api`, `worker`, `redis`) y nada más. Sin cuentas de usuario: el portal es de
  lectura pública; las únicas escrituras son simulaciones y paquetes ZIP. El laboratorio calcula sin
  guardar nada. La simulación usa solo la biblioteca estándar de Python.

## Restricciones técnicas

Angular 22 + Tailwind CSS 4 · Python 3.11 + FastAPI + psycopg 3 + pypdf · Celery 5.6 + Redis 7 ·
PostgreSQL 15 de Supabase maestría (`supabase-maestria_db`, esquema `public`, prefijo `ValorGanado_`) ·
Docker Swarm + Traefik v3 en el VPS iaGentek, redes `iagenteknet` y `supabase_maestria_internal`, dominio
`evm.iagentek.com.mx`, repositorio `github.com/azulls1/evm`.

## Flujo de trabajo

1. Desarrollo guiado por especificaciones (GitHub spec-kit): constitución → `specs/001-portal-valorganado/spec.md`
   → `plan.md` → `tasks.md`.
2. Método BMAD de planeación ágil: `_bmad-output/planning-artifacts/` (brief, PRD, arquitectura, épicas)
   referencia a spec-kit por id; no repite requisitos.
3. Cada tarea cerrada se marca en `tasks.md` y su historia en `sprint-status.yaml`.
4. Antes de desplegar: `ng build` sin errores, las 18 pruebas del backend (`pytest`) en verde y la página
   *Cumplimiento* con las 15 comprobaciones en verde.

## Gobernanza

Esta constitución prevalece sobre cualquier otro documento del portal. Una enmienda exige: cambio en este
archivo, nueva versión semántica (MAJOR = principio eliminado o redefinido, MINOR = principio o sección
nueva, PATCH = redacción) y revisión del *Constitution Check* de `plan.md`. Toda revisión de código
verifica la regla de las dos capas y los principios I–VII.

**Version**: 1.0.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-26
