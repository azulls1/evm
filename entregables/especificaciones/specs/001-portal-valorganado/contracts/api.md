# Contrato REST — `https://evm.iagentek.com.mx/api` (dominio provisional)

JSON UTF-8. Errores con forma `{"detail": "<mensaje en español>"}` y el código HTTP correspondiente (los de
validación de Pydantic, `{"detail": [ … ]}` con 422). Importes en pesos como número (`130450.0`), índices
como fracción (`0.7336…`); el frontend los formatea como el documento ($130 450, 0,734). Todas las cifras
se **recalculan** con `backend/app/evm.py` en cada respuesta. Implementación: `backend/app/main.py` (sin
`/docs`, `/redoc` ni `/openapi.json`).

| Método | Ruta | Éxito | Errores |
|---|---|---|---|
| GET | `/health` | 200 | 503 si falta db o redis |
| GET | `/contenido` | 200 | 404 si el contenido no está cargado |
| GET | `/resumen` | 200 | 404 |
| GET | `/cumplimiento` | 200 | 404 |
| POST | `/escenario` | 200 | 403 sin cabecera · 422 escenario incoherente · 429 límite |
| POST | `/simulacion` | **202** `{id, estado}` | 403 · 404 sin contenido · 422 rango o mes sin mediciones · 429 · 503 cola |
| GET | `/simulacion/ultima` | 200 | 404 si nunca hubo una completada |
| GET | `/simulacion/{id}` | 200 | 404 (también si el id no es uuid) |
| GET | `/entregables` | 200 | |
| GET | `/entregables/archivo?ruta=…[&ver=1]` | 200 binario | 404 si la ruta no está en el catálogo o sale de la carpeta |
| POST | `/entregables/generar` | **202** `{paquete_id}` o `{paquete_id, reutilizado: true}` | 403 · 429 · 503 |
| GET | `/entregables/paquete/{id}` | 200 | 404 |
| GET | `/entregables/paquete/{id}/descargar` | 200 `application/zip` | 404 si no existe o no está listo · 410 si el ZIP ya no está |

**Cabeceras**: toda petición `POST` exige `X-Requested-With: portal-valorganado` (si falta → 403 «Petición
no permitida»); el interceptor de `app.config.ts` la añade a toda llamada a `/api/`. CORS solo para los
orígenes de `CORS_ORIGINS` (en producción, el propio dominio; por defecto también `http://localhost:4200`),
métodos `GET` y `POST`. En Traefik: cuerpo ≤ 8192 bytes; tasa por IP de 20/s (ráfaga 60) en lecturas y de
60/min (ráfaga 10) en `POST`. Las descargas usan `Content-Disposition: attachment`; con `ver=1`, `inline`.

---

## GET `/health`

```json
{ "status": "ok", "db": true, "redis": true }
```

Con algún componente caído: `"status": "degradado"` y código 503. (El servidor local responde
`{"status": "ok", "db": "memoria", "redis": "inmediato"}`.)

## GET `/contenido`

La fila de `ValorGanado_contenido` (ver `data-model.md`) más el análisis recalculado:

```json
{
  "portada": { "alumno": "Adonai Samael Hernández Mata", "profesora": "Adriana Cervantes Castillo", "…": "…" },
  "introduccion": "El proyecto es un desarrollo de software de seis meses …",
  "nota_avance": "El avance real del enunciado viene mes a mes; para el EV se usa el acumulado (37 % al mes 3 y 80 % al mes 5) …",
  "formulas": [ { "indicador": "EAC según presupuesto original", "formula": "EAC = AC + (BAC − EV)" } ],
  "datos": { "bac": 115000, "duracion": 6, "pv_mes": [23000, 15000, 16000, 19000, 20000, 22000],
             "ac_mes": [21000, 18000, 19000, 20000, 21000], "avance_mes": [8, 15, 14, 21, 22] },
  "partes": {
    "A": { "mes": 3, "titulo": "Control del proyecto en el mes 3",
           "preguntas": [ { "n": 1, "pregunta": "1. ¿Va por encima o por debajo del presupuesto?",
                            "enunciado": "De acuerdo con el índice del desempeño del costo, …",
                            "respuesta": "Por encima. CPI = $42 550 ÷ $58 000 = 0,734, …" } ],
           "estrategias": [ { "titulo": "Acciones correctivas con umbrales de escalada (5.8).", "texto": "…" } ] },
    "B": { "mes": 5, "titulo": "Control del proyecto en el mes 5", "preguntas": [ "…" ] }
  },
  "periodo": { "desde": 4, "hasta": 5 },
  "conclusion": "…",
  "referencias": [ "Project Management Institute. (2021). …", "Universidad Internacional de La Rioja. (2026). …" ],
  "enunciado": { "comunes": [ "…" ], "A5": "…", "B5": "…",
                 "extension": "Extensión máxima: 4 páginas, fuente Calibri 12 e interlineado 1,5.",
                 "rubrica": [ { "criterio": "C1", "nombre": "Parte A", "descripcion": "…", "puntos": 4, "peso": 40 } ] },
  "actualizado_en": "2026-10-26T18:00:00Z",
  "analisis": {
    "cortes": [ "… un corte por cada mes medido (1 a 5), ver abajo …" ],
    "serie": [ { "mes": 1, "pv": 23000.0, "ac": 21000.0, "ev": 9200.0 },
               { "mes": 2, "pv": 38000.0, "ac": 39000.0, "ev": 26450.0 },
               { "mes": 3, "pv": 54000.0, "ac": 58000.0, "ev": 42550.0 },
               { "mes": 4, "pv": 73000.0, "ac": 78000.0, "ev": 66700.0 },
               { "mes": 5, "pv": 93000.0, "ac": 99000.0, "ev": 92000.0 },
               { "mes": 6, "pv": 115000.0, "ac": null, "ev": null } ]
  },
  "periodo_medidas": { "desde": 4, "hasta": 5, "ev": 49450.0, "ac": 41000, "pv": 39000,
                       "cpi": 1.2060975609756097, "spi": 1.2679487179487179 }
}
```

**Corte** (elemento de `analisis.cortes`, y `a`/`b` de `/resumen`). Mes 3:

```json
{ "mes": 3, "pv": 54000.0, "ac": 58000.0, "avance": 37.0, "ev": 42550.0,
  "cv": -15450.0, "sv": -11450.0, "cpi": 0.7336206896551725, "spi": 0.787962962962963,
  "eac_a": 130450.0, "eac_b": 156756.75675675675, "eac_c": 183331.72420363958,
  "tcpi": 1.2710526315789474, "duracion": 7.614571092831962, "vac": -15450.0,
  "coste": "por encima del presupuesto", "plazo": "retrasado" }
```

Mes 5: `ev` 92000, `cpi` 0.9293, `spi` 0.9892, `eac_a` 122000, `eac_b` 123750, `eac_c` 124019.02, `tcpi` 1.4375,
`duracion` 6.0652. `coste` ∈ {«por encima del presupuesto», «según lo planificado», «por debajo del
presupuesto»}; `plazo` ∈ {«retrasado», «según lo planificado», «adelantado»}. Si una división no está
definida (AC o PV en cero), el índice y sus derivados son `null`.

## GET `/resumen`

```json
{
  "portada": { "…": "…" },
  "bac": 115000, "duracion": 6,
  "a": { "mes": 3, "cpi": 0.7336, "spi": 0.7880, "eac_a": 130450.0, "duracion": 7.6146, "…": "corte completo" },
  "b": { "mes": 5, "cpi": 0.9293, "spi": 0.9892, "eac_a": 122000.0, "duracion": 6.0652, "…": "corte completo" },
  "periodo_medidas": { "desde": 4, "hasta": 5, "ev": 49450.0, "ac": 41000, "pv": 39000, "cpi": 1.2061, "spi": 1.2679 },
  "serie": [ "… igual que en /contenido …" ],
  "conclusion": "El valor ganado permitió detectar en el mes 3 …",
  "cumplimiento": { "cumplidos": 15, "total": 15 },
  "simulaciones": 12
}
```

`simulaciones` cuenta las simulaciones completadas guardadas.

## GET `/cumplimiento`

Lista de 15 requisitos, en este orden: A.1–A.5 (C1), B.1–B.5 (C2), D.1 (Datos), C3.1–C3.4 (C3). Si no hay
.docx en la carpeta de entregables, C3.1–C3.3 no se emiten.

```json
[
  { "id": "A.1", "criterio": "C1", "texto": "Mes 3 · CPI: ¿por encima o por debajo del presupuesto?",
    "cumplido": true, "aviso": false,
    "evidencia": "CPI = $42 550 ÷ $58 000 = 0,734 → por encima del presupuesto", "ruta": "/parte-a" },
  { "id": "B.5", "criterio": "C2", "texto": "¿Las medidas del mes 3 tuvieron efecto positivo o negativo? (justificado)",
    "cumplido": true, "aviso": false,
    "evidencia": "CPI 0,734 → 0,929 · SPI 0,788 → 0,989 · solo meses 4–5: CPI 1,206, SPI 1,268", "ruta": "/parte-b" },
  { "id": "D.1", "criterio": "Datos", "texto": "El EV usa el avance acumulado (no el del mes)",
    "cumplido": true, "aviso": false,
    "evidencia": "Mes 3: 37 % → EV $42 550 · Mes 5: 80 % → EV $92 000", "ruta": "/planteamiento" },
  { "id": "C3.1", "criterio": "C3", "texto": "Extensión máxima de 4 páginas",
    "cumplido": true, "aviso": false, "evidencia": "4 páginas en el PDF exportado por Word", "ruta": "/entregables" },
  { "id": "C3.2", "criterio": "C3", "texto": "Calibri 12 e interlineado 1,5",
    "cumplido": true, "aviso": false,
    "evidencia": "Calibri 12 pt · interlineado 1.5 · fuentes del PDF: Calibri, Calibri-Bold", "ruta": "/entregables" }
]
```

| Id | Qué comprueba |
|---|---|
| A.1 / B.1 | La respuesta contiene EV, AC y CPI recalculados y la lectura «encima»; el CPI está en el .docx |
| A.2 / B.2 | La respuesta contiene PV y SPI y «retras»; el SPI está en el .docx |
| A.3 / B.3 | La respuesta contiene `AC + (BAC − EV)` y el EAC a); el EAC está en el .docx |
| A.4 / B.4 | La respuesta contiene `6 ÷ SPI` con dos decimales y «retraso»; la cifra está en el .docx |
| A.5 | Al menos dos estrategias citan un apartado del curso («(5.x» o «(Tema n») |
| B.5 | Empieza por «Positivo» si y solo si CPI y SPI mejoraron, y cita CPI de ambos cortes y del periodo 4–5 |
| D.1 | Avance acumulado 37 % y 80 %, y ambos EV en el .docx |
| C3.1 | Páginas del PDF ≤ 4 (`pypdf`) |
| C3.2 | Estilo Normal del .docx en Calibri 12 con interlineado 1,5 |
| C3.3 | Los primeros 60 caracteres de cada respuesta aparecen en el .docx |
| C3.4 | Al menos dos referencias |

## POST `/escenario`

Cálculo inmediato de un escenario del laboratorio; no guarda nada.

```json
{ "bac": 115000, "duracion": 6,
  "pv_mes": [23000, 15000, 16000, 19000, 20000, 22000],
  "ac_mes": [21000, 18000, 19000, 19333, 19333],
  "avance_mes": [8, 15, 14, 12.33, 12.33] }
```

Rangos: `bac` > 0 y ≤ 1e9; `duracion` 2–24; `pv_mes` 2–24 valores; `ac_mes` y `avance_mes` 1–24 valores. Además
`Datos.validar()` exige: un PV por mes planificado, suma del PV = BAC (±0,5), AC y avance con el mismo número
de meses (≤ `duracion`), avance acumulado ≤ 100 % y nada negativo. Mensajes de 422 (en `detail[0].msg`):
«La línea base debe tener un valor por mes planificado», «La suma de la línea base debe ser igual al BAC»,
«Coste real y avance deben tener el mismo número de meses medidos», «El avance acumulado no puede pasar del
100 % ni haber valores negativos».

Respuesta 200 (`evm.analizar()`): `{ "cortes": [Corte, …], "serie": [ … ] }`. Con el ejemplo (contrafactual «sin
medidas»), el corte del mes 5 da `ev` 70909, `cpi` 0.7335, `spi` 0.7625, `eac_a` 140757 y `duracion` 7.87.

## POST `/simulacion`

```json
{ "mes": 5, "iteraciones": 3000, "variabilidad": 0.2, "ventana": "reciente", "semilla": 42, "escenario": null }
```

Rangos: `mes` 1–24 (por defecto 3; debe tener mediciones, si no → 422 «El mes de corte no tiene
mediciones»), `iteraciones` 500–10 000 (3000), `variabilidad` 0,05–0,6 (0,2), `ventana` `todo` | `reciente`
(`todo`), `semilla` 0–2³¹−1 u omitida, `escenario` un objeto como el de `/escenario` u omitido (se usan los
datos del enunciado; en ambos casos se copia en `parametros.escenario`).

Respuesta **202**: `{ "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7", "estado": "pendiente" }`. Si la cola no está
disponible: la fila queda en `error` y se responde 503 «La cola de trabajos no está disponible».

## GET `/simulacion/{id}` · `/simulacion/ultima`

Valores reales con los parámetros del ejemplo (semilla 42); los nombres de campo son los de
`simulacion.simular()`:

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "estado": "completada",
  "parametros": { "mes": 5, "iteraciones": 3000, "variabilidad": 0.2, "ventana": "reciente", "semilla": 42,
                  "escenario": { "bac": 115000, "duracion": 6, "…": "datos del enunciado" } },
  "error": null,
  "duracion_ms": 3,
  "creado_en": "2026-10-26T19:40:02Z",
  "completado_en": "2026-10-26T19:40:02Z",
  "resultado": {
    "mes_corte": 5, "iteraciones": 3000, "ventana": "reciente", "variabilidad": 0.2,
    "ritmo": { "avance_medio": 21.5, "avance_sd": 4.3, "coste_por_punto": 953.46,
               "coste_por_punto_sd": 190.69, "coste_por_punto_plan": 1150.0 },
    "deterministico": { "eac_a": 122000.0, "eac_b": 123750.0, "eac_c": 124019.02,
                        "duracion": 6.0652, "cpi": 0.9293, "spi": 0.9892 },
    "coste": { "media": 118074.8, "p10": 113358.8, "p50": 118071.7, "p80": 121115.9, "p90": 122643.4,
               "prob_dentro_bac": 0.1973,
               "histograma": [ { "desde": 103053.08, "hasta": 104189.55, "n": 1 }, "… 24 clases …" ] },
    "duracion": { "media": 5.956, "p10": 5.74, "p50": 5.935, "p80": 6.102, "p90": 6.195,
                  "prob_en_plazo": 0.628, "histograma": [ "… 24 clases …" ] },
    "trayectorias": [ [ { "mes": 5, "ev": 92000.0, "ac": 99000.0 },
                        { "mes": 5.958, "ev": 115000.0, "ac": 117409.84 } ], "… hasta 40 …" ],
    "bac": 115000, "duracion_plan": 6,
    "duracion_ms": 3
  }
}
```

Referencias con la misma semilla: mes 3 con `ventana: "todo"` → `prob_dentro_bac` ≈ 0,001, `prob_en_plazo` 0,
coste P50 ≈ $167 401, duración P50 ≈ 8,11 meses; mes 5 con `"todo"` → 0,115 y 0,208, P50 ≈ $127 229 y 6,25 meses.
Estados: `pendiente` → `completada` | `error` (con `"error": "No se pudo completar la simulación."`).

## GET `/entregables`

```json
{
  "archivos": [ { "ruta": "documento/Actividad2_Individual_HernandezMata_Adonai.pdf",
                  "nombre": "Documento de la actividad (PDF)", "tipo": "PDF", "criterio": "Entrega",
                  "detalle": "El mismo documento en PDF, listo para leer", "bytes": 121296,
                  "sha256": "c6ec5bf5fc960b191138235ea2a533150716866ee690d64cd927362d45a404f6" } ],
  "total_bytes": 478551,
  "entrega": { "ruta": "documento/Actividad2_Individual_HernandezMata_Adonai_Entrega.zip", "tipo": "Paquete", "…": "…",
               "contenido": [ { "nombre": "Actividad2_Individual_HernandezMata_Adonai.docx", "bytes": 90830 },
                              { "nombre": "Actividad2_Individual_HernandezMata_Adonai.pdf", "bytes": 121296 },
                              { "nombre": "LEEME.md", "bytes": "…" } ],
               "leeme": "# Actividad 2 individual — Gestión del valor ganado (EVM) …" },
  "ultimo_paquete": { "id": "…", "estado": "completada", "archivo": "…", "…": "…" },
  "recientes": [ { "id": "…", "estado": "completada", "…": "…" } ]
}
```

`entrega` es el registro de tipo `Paquete` del catálogo con su contenido **leído del propio ZIP**; `null` si
no existe. Descarga: `/api/entregables/archivo?ruta=<ruta>`; con `&ver=1` se sirve en línea.

## POST `/entregables/generar` → GET `/entregables/paquete/{id}`

Sin cuerpo. Valores ilustrativos. Respuesta **202**: `{ "paquete_id": "…" }`, o `{ "paquete_id": "…", "reutilizado": true }` si hay uno
pendiente de menos de 2 minutos o el último completado sigue vigente (posterior al catálogo desplegado y
presente en el volumen). Consulta:

```json
{ "id": "…", "estado": "completada",
  "archivo": "ValorGanado_Actividad2_HernandezMata_20261026-194100_7c9e6679.zip",
  "n_archivos": 30, "bytes": 2048311, "sha256": "…", "error": null,
  "creado_en": "2026-10-26T19:41:00Z", "completado_en": "2026-10-26T19:41:01Z" }
```

Descarga: `/api/entregables/paquete/{id}/descargar`. El ZIP (carpeta `ValorGanado_Actividad2/`) incluye
`MANIFIESTO_SHA256.txt` en formato de `sha256sum` (`<hash>  <ruta>`). Se conservan los 3 paquetes más recientes.
