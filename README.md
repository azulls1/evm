<div align="center">

# 📈 ValorGanado · Control EVM

**El control de un proyecto de software con el método del valor ganado, convertido en un portal interactivo y verificable**

![Angular](https://img.shields.io/badge/Angular-22-04202C?logo=angular&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-304040?logo=tailwindcss&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-0.141-5B7065?logo=fastapi&logoColor=white) ![Celery](https://img.shields.io/badge/Celery-5.6-04202C?logo=celery&logoColor=white) ![Redis](https://img.shields.io/badge/Redis-7-304040?logo=redis&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-Postgres_15-5B7065?logo=supabase&logoColor=white) ![Docker Swarm](https://img.shields.io/badge/Docker_Swarm-Traefik-04202C?logo=docker&logoColor=white)

**[🌐 Portal en vivo](https://evm.iagentek.com.mx)** · **[📦 Entregables](https://evm.iagentek.com.mx/entregables)** · **[🛡️ Cumplimiento](https://evm.iagentek.com.mx/cumplimiento)**

*UNIR México · Metodología de Diseño y Gestión de Proyectos · Actividad 2 individual*
*Adonai Samael Hernández Mata · Profesora: Adriana Cervantes Castillo · Noviembre de 2026*

</div>

## ✨ En una mirada

| | Mes 3 (Parte A) | Mes 5 (Parte B) |
|---|---|---|
| **EV** = BAC × % avance acumulado | $42 550 (37 %) | $92 000 (80 %) |
| **CPI** = EV ÷ AC | **0,734** · por encima del presupuesto | **0,929** · por encima, mucho menos |
| **SPI** = EV ÷ PV | **0,788** · retrasado | **0,989** · casi en plazo |
| **EAC** = AC + (BAC − EV) | **$130 450** | **$122 000** |
| **Duración** ≈ 6 ÷ SPI | **7,61 meses** | **6,07 meses** |

Las medidas del mes 3 **funcionaron**: solo en los meses 4 y 5, CPI = 1,206 y SPI = 1,268 (ambos por encima de 1).

> [!TIP]
> **Clásico + ágil.** La retroalimentación de la Actividad 1 pedía complementar las metodologías ágiles con las clásicas.
> Aquí el valor ganado (clásico, PMBOK®) se combina con iteraciones ágiles de dos semanas: es la estrategia 3 de la
> Parte A5 y la conclusión del documento, y tiene su propia página: [Enfoque híbrido](https://evm.iagentek.com.mx/hibrido).

## 📌 Qué es

La actividad pide controlar un proyecto de software de **seis meses** y **$115 000** con el método de gestión del valor
ganado (Tema 5, apartado 5.9) en dos cortes: el mes 3 y el mes 5, con cinco preguntas en cada uno. El documento entregado
(4 páginas, Calibri 12, interlineado 1,5) responde las diez; este portal lo presenta paso a paso y lo amplía.

> [!NOTE]
> **Una sola fuente de verdad.** Las cifras salen de `fuente/calculos.py` (aritmética exacta con fracciones) y los textos de
> `fuente/contenido.py`: los mismos archivos que generan el .docx y el .pdf. La API vuelve a calcular todo con su propio
> motor (`backend/app/evm.py`) y las pruebas comprueban que ambos dan exactamente lo mismo.

## ✅ Cómo cubre la rúbrica

Cada requisito se **comprueba en el servidor**: las cifras de las diez respuestas se recalculan y se buscan en el texto y en
el .docx entregado; las páginas y la fuente se leen del propio documento. [Ver cumplimiento en vivo](https://evm.iagentek.com.mx/cumplimiento).

| Criterio | Qué pide | Evidencia |
|---|---|---|
| **1. Parte A (40 %)** | Cinco preguntas del mes 3, correctas y justificadas | CPI, SPI, EAC, duración y tres estrategias de control del curso, la tercera con enfoque híbrido · [/parte-a](https://evm.iagentek.com.mx/parte-a) · [/hibrido](https://evm.iagentek.com.mx/hibrido) |
| **2. Parte B (40 %)** | Cinco preguntas del mes 5, correctas y justificadas | Los mismos indicadores y el efecto de las medidas con el desempeño de los meses 4–5 · [/parte-b](https://evm.iagentek.com.mx/parte-b) |
| **3. Presentación (20 %)** | Redacción clara y extensión máxima | 4 de 4 páginas, Calibri 12, interlineado 1,5 · [/entregables](https://evm.iagentek.com.mx/entregables) |

## 🧪 Lo interactivo

- **Curva S** de PV, AC y EV con lectura mes a mes (CV y SV al pasar el puntero) y medidores de CPI y SPI.
- **Laboratorio de escenarios**: cambia el coste real y el avance de cada mes y el servidor recalcula los indicadores al
  instante. Incluye el contrafactual **«¿y sin medidas en el mes 3?»**: los meses 4 y 5 al ritmo de los meses 1 a 3.
- **Enfoque híbrido**: qué se toma del enfoque clásico y del ágil, cómo encajan, el diagrama del ciclo híbrido, un
  **burn-up** de las doce iteraciones y el **pronóstico del plazo por velocidad** frente a 6 ÷ SPI (al mes 5: 5,93 a 6,25
  meses, con el 6,07 del documento en medio).
- **Simulación Monte Carlo del cierre** (cola de trabajos con Celery): desde el corte elegido, miles de cierres posibles dan
  la probabilidad de terminar dentro del BAC y en seis meses, y los percentiles P50 y P80 de coste y duración.

> [!IMPORTANT]
> El laboratorio y la simulación son **ampliaciones del portal**: no sustituyen a las respuestas del documento, que siguen
> exactamente las fórmulas del Tema 5.

## 🏗️ Arquitectura

```
Navegador ──HTTPS──▶ Traefik v3 ──▶ web   (nginx sin privilegios · Angular 22 + Tailwind 4)
                                └─▶ api   (FastAPI · motor EVM · cumplimiento)
                                        ├─▶ Redis 7 ──▶ worker (Celery: Monte Carlo, ZIP de entregables)
                                        └─▶ PostgreSQL 15 · Supabase maestría (tablas ValorGanado_* con RLS forzado)
```

Docker Swarm en un nodo, imágenes etiquetadas con el sha del commit, credenciales solo como secreto de Swarm, límites de
tasa por IP en Traefik y cabeceras de seguridad (CSP, HSTS, `X-Frame-Options`) en nginx y Traefik.

## 🧭 Metodología

Desarrollo guiado por especificaciones (GitHub spec-kit) y el método BMAD de planeación ágil:

- `.specify/memory/constitution.md` — principios del proyecto.
- `specs/001-portal-valorganado/` — spec, plan, investigación, modelo de datos, contrato de la API, tareas y lista de requisitos.
- `specs/002-enfoque-hibrido/` — segundo incremento: spec, plan, tareas y lista de requisitos del enfoque híbrido.
- `_bmad-output/` — brief, PRD, arquitectura, nueve épicas y estado del sprint.
- `docs/figuras/` — tres figuras isométricas interactivas (tablero del valor ganado, ciclo de control del mes 3 y tablero de Galton del cierre, que recibe el resultado real de la simulación) y nueve diagramas propios (arquitectura, flujo EVM, cuadrante CPI–SPI, línea de tiempo, secuencia de la simulación, línea base frente a lo real, cascada del EAC, espina de causas y ciclo híbrido).

## 📁 Estructura del repositorio

```
fuente/        calculos.py y contenido.py (copia sincronizada de la fuente del documento) + contenido.json
backend/       FastAPI, motor EVM, simulación, cumplimiento, Celery y 24 pruebas
frontend/      Angular 22 + Tailwind 4 (Forest Design System)
db/            migraciones idempotentes: esquema, seguridad, contenido y catálogo de entregables
scripts/       generar_semilla.py · preparar_entregables.py · servidor_local.py
entregables/   documento .docx/.pdf, paquete de entrega, datos CSV, figuras y especificaciones (con SHA-256)
deploy/        stack.yml y deploy.sh (Docker Swarm)
docs/          diseño y figuras
```

## ▶️ Reproducir

```bash
# Pruebas del backend
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt pytest && .venv/bin/python -m pytest -q

# Portal en local sin base de datos (consultas en memoria y Celery inmediato)
backend/.venv/bin/python scripts/servidor_local.py
cd frontend && npm ci && npx ng serve --proxy-config proxy.local.json   # http://localhost:4200

# Despliegue (requiere deploy/.env.deploy, fuera del repositorio)
deploy/deploy.sh
```
