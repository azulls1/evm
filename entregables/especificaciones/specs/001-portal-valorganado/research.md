# Research — Fase 0

Cada decisión resuelve una incógnita del caso o del contexto técnico. Formato: Decisión · Justificación ·
Alternativas.

## R1. Qué EAC responde la pregunta 3

- **Decisión**: la respuesta usa la **variante a) del Tema 5**, `EAC = AC + (BAC − EV)`: $130 450 al mes 3 y
  $122 000 al mes 5. Las variantes b) `BAC ÷ CPI` ($156 757 y $123 750) y c) `AC + (BAC − EV) ÷ (CPI × SPI)`
  ($183 332 y $124 019) se calculan y se muestran como contraste en la tabla de cada parte, en *El método*
  (con la a) marcada como «la que pide la actividad») y en el laboratorio.
- **Justificación**: el enunciado pregunta por el coste estimado a la finalización «**según el presupuesto
  original**», que es exactamente el supuesto de la variante a): el trabajo restante costará lo
  presupuestado. Mostrar b) deja ver que a) es el escenario optimista (la respuesta A3 lo dice) y que al
  mes 5 ambas casi coinciden, señal de que la eficiencia se estabilizó. La comprobación A.3/B.3 exige que la
  respuesta contenga la fórmula `AC + (BAC − EV)` y la cifra.
- **Alternativas**: EAC b) como respuesta principal (contradice la letra del enunciado); dar solo un número
  sin contraste (pierde la lectura de riesgo).

## R2. Cómo proyectar la duración (pregunta 4)

- **Decisión**: `duración estimada = duración planificada ÷ SPI = 6 ÷ SPI`: 7,61 meses al mes 3 (≈ 1,6 meses,
  cerca de siete semanas de retraso) y 6,07 meses al mes 5 (≈ dos días). La respuesta y *El método* la
  presentan explícitamente como **estimación**.
- **Justificación**: el Tema 5 no da una fórmula de plazo; dividir la duración entre el SPI es la proyección
  habitual y es coherente con la lectura del SPI (a SPI 0,788 se produce el 78,8 % de lo planificado por
  unidad de tiempo). Declararlo evita presentar como fórmula del curso algo que no lo es.
- **Alternativas**: programación ganada (*earned schedule*, fuera del temario y sin datos semanales); dar
  solo «con retraso» sin cifra (respuesta pobre para C1/C2).

## R3. Avance mes a mes frente a acumulado

- **Decisión**: el EV se calcula con el avance **acumulado** (8 + 15 + 14 = 37 % al mes 3; 80 % al mes 5) y PV
  y AC también acumulados al mismo corte. El portal lo explica en *Planteamiento* («La trampa del
  enunciado») y la comprobación D.1 lo verifica.
- **Justificación**: el enunciado da el avance «realizado en cada mes», no el total; usar el del mes (14 % o
  22 %) daría EV $16 100 y $25 300 y cambiaría todas las respuestas. EV, PV y AC deben medirse a la misma
  fecha de corte para que CPI y SPI tengan sentido.
- **Alternativas**: ninguna razonable; es la definición del método (EV = BAC × % de avance real acumulado).

## R4. Una fila jsonb y cifras recalculadas en cada petición

- **Decisión**: todo el contenido académico va en **una sola fila** de `ValorGanado_contenido`
  (`id = 'actividad2'`, columna `datos jsonb`), generada por `scripts/generar_semilla.py`. La fila guarda los
  **datos** del caso (BAC, duración, PV, AC y avance por mes) y los textos, nunca los indicadores: la API los
  recalcula con `backend/app/evm.py` en cada petición. El motor del portal usa `float`; la fuente del
  documento usa `fractions.Fraction`; `test_evm.py` comprueba que coinciden en los cinco cortes con
  tolerancia relativa 1e-12.
- **Justificación**: el contenido es un documento, no datos relacionales: una fila evita un esquema de diez
  tablas para treinta campos y hace imposible que el portal y el documento difieran (ambos salen de la misma
  importación). Recalcular garantiza que una cifra mal escrita en la base o en el frontend no pueda existir, y
  permite que el mismo motor sirva al laboratorio con escenarios arbitrarios. La aritmética exacta de la
  fuente evita redondeos acumulados en el documento; el `float` del portal es suficiente para mostrar tres
  decimales.
- **Alternativas**: tablas normalizadas por pregunta y por mes (complejidad sin beneficio); guardar los
  indicadores (cifras escritas, violaría el principio II); JSON estático en el frontend (no permitiría el
  laboratorio ni el cumplimiento en el servidor).

## R5. Modelo de la simulación Monte Carlo del cierre

- **Decisión**: desde el corte, cada mes futuro avanza un % sorteado con `random.gauss(μ_av, σ_av)` (mínimo
  0,5 puntos) y cuesta un importe por punto de avance sorteado con `random.gauss(μ_c, σ_c)` (mínimo 0). Las
  medias salen de los meses medidos: **todos** (`ventana = "todo"`) o **solo los dos últimos** (`"reciente"`,
  que en el mes 5 refleja las medidas del mes 3). La dispersión es la observada o, si es menor,
  `variabilidad × media` (nunca cero). El último mes solo trabaja la fracción que falta para el 100 %. Tope de
  36 meses. Salidas: ritmo usado, valores deterministas, media y P10/P50/P80/P90 de coste y duración,
  probabilidad dentro del BAC y en plazo, histogramas de 24 clases y las primeras 40 trayectorias.
  Implementado con **`random` y `statistics` de la biblioteca estándar**; `random.Random(semilla)` hace la
  corrida reproducible.
- **Justificación**: las fórmulas del Tema 5 dan un solo número; la simulación muestra la incertidumbre
  alrededor de él con el ritmo realmente observado, sin inventar parámetros que el caso no tiene. Con semilla
  42 y 3000 iteraciones: al mes 3 la probabilidad de cerrar dentro del BAC es ≈ 0 % (P50 ≈ $167 000, coherente
  con EAC b) $156 757); al mes 5 con todos los meses ≈ 11 % (P50 ≈ $127 000) y con los dos últimos ≈ 20 %
  y 63 % en plazo (P50 ≈ $118 000, 5,9 meses). La corrida dura milisegundos en Python puro; NumPy
  añadiría ~30 MB a la imagen sin ganancia perceptible.
- **Alternativas**: lognormal sobre la duración (pide una estimación por tarea que el caso no tiene);
  distribución triangular o PERT (tres estimaciones inexistentes); NumPy (peso de imagen).

## R6. Trabajos asíncronos: Celery + Redis

- **Decisión**: Celery 5.6 con Redis 7 como broker (db 0) y backend de resultados (db 1); dos tareas
  (`valorganado.simular_cierre`, `valorganado.generar_entregable`). La API inserta la fila
  (`estado = pendiente`), encola con el mismo id y responde 202; el worker actualiza la fila. El frontend
  sondea cada 600 ms con tope de 60 s. `task_acks_late`, `worker_prefetch_multiplier = 1`,
  `task_time_limit = 60`, concurrencia 2, `result_expires = 3600`. Redis sin persistencia y con
  `allkeys-lru`.
- **Justificación**: la simulación y el ZIP no deben bloquear Uvicorn; la fila en Postgres es la fuente del
  estado (sobrevive a reinicios de Redis) y permite «última simulación». El laboratorio, en cambio, es
  inmediato (`POST /escenario`): calcular seis meses no justifica una cola.
- **Lección del despliegue**: en la red compartida `iagenteknet` el nombre corto `redis` resuelve al
  servicio de otro stack; la API y el worker usan `redis://valorganado_redis:6379`.
- **Alternativas**: `BackgroundTasks` de FastAPI (muere con el proceso, sin límite de concurrencia); RQ o
  Dramatiq (otra herramienta que operar); WebSocket para el estado (innecesario para < 1 s).

## R7. Cumplimiento comprobado contra el documento (pypdf)

- **Decisión**: `backend/app/cumplimiento.py` evalúa 15 comprobaciones. Para A.1–A.4 y B.1–B.4 recalcula la
  cifra con el motor, la busca en la respuesta del portal **y** en el texto del .docx (extraído de
  `word/document.xml`), y valida la lectura cualitativa («por encima», «retras»). A.5 cuenta las estrategias
  que citan apartado del curso (≥ 2). B.5 exige «Positivo» si y solo si CPI y SPI mejoraron, con las cifras de
  ambos cortes y del periodo 4–5. D.1 verifica el avance acumulado. C3.1 cuenta las páginas del PDF con
  **`pypdf`**; C3.2 lee fuente, tamaño e interlineado del estilo Normal del .docx y las fuentes incrustadas en
  el PDF; C3.3 busca los primeros 60 caracteres de cada respuesta en el .docx; C3.4 cuenta referencias.
- **Justificación**: la rúbrica penaliza la extensión (máximo 4 páginas) y el formato; el número de páginas
  solo es fiable en el PDF que exporta Word, no en el .docx. `pypdf` es puro Python, sin binarios del sistema.
  Leer el .docx como ZIP con expresiones regulares evita `python-docx` para tres datos.
- **Alternativas**: `python-docx` (dependencia para tres lecturas); LibreOffice para contar páginas (imagen
  enorme y conteo distinto al de Word); marcar el cumplimiento a mano (viola el principio II).

## R8. Desarrollo local sin base de datos

- **Decisión**: `scripts/servidor_local.py` levanta **la misma API** de `backend/app` reemplazando las
  funciones de `consultas.py` por versiones en memoria (contenido de `fuente/contenido.json`, catálogo leído
  de `db/catalogo_entregables.sql`) y Celery en modo inmediato (`task_always_eager`). El frontend se sirve con
  `ng serve --proxy-config proxy.local.json`, que manda `/api` a `http://127.0.0.1:8000`.
- **Justificación**: permite revisar el portal completo (incluidas simulación y ZIP) sin Postgres, Redis ni
  túneles, y con el mismo código que en producción. Las pruebas usan la misma idea con `monkeypatch`.
- **Alternativas**: `docker compose` local con Postgres y Redis (más pasos para una revisión visual);
  apuntar a producción (no permite probar cambios del backend).

## R9. Seguridad en el borde y Supabase maestría

- **Decisión**: Postgres 15 del stack existente `supabase-maestria` (prefijo `ValorGanado_`, rol
  `valorganado_app`, RLS forzado, DSN como secreto `valorganado_db_dsn_v1`). Middlewares propios por labels en
  `deploy/stack.yml`: `valorganado-hsts` (1 año, sin subdominios), `valorganado-cabeceras-api` (`nosniff`,
  `frameDeny`, `no-referrer`), `valorganado-limite` (20/s, ráfaga 60), `valorganado-limite-escritura` (60/min,
  ráfaga 10, router `POST` con prioridad 110) y `valorganado-cuerpo` (8192 bytes). Routers: `Host` → `web`
  (prioridad 10), `Host && PathPrefix(/api)` → `api` (prioridad 100). nginx añade CSP y demás cabeceras al SPA.
- **Justificación**: una base ya respaldada evita operar otro Postgres para una fila; el rol y RLS impiden que
  la API REST de Supabase (`anon`) exponga los datos; la seguridad en el borde es igual para todos los servicios
  y la API solo valida rangos y la cabecera `X-Requested-With: portal-valorganado`.
- **Alternativas**: Postgres propio en el stack (más memoria y mantenimiento); límites en la app con
  `slowapi` (estado por réplica, lógica duplicada).
