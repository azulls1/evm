# Quickstart — Portal ValorGanado

Rutas relativas a la raíz del repositorio (`dev/`, remoto `github.com/azulls1/evm`). La fuente
académica está un nivel arriba, en `../fuente/calculos.py` y `../fuente/contenido.py`;
`scripts/generar_semilla.py` la copia a `dev/fuente/` para que un clon se pueda reproducir solo.

## Requisitos

Python 3.11 · Node 22+ (la imagen usa Node 24) + npm · para desplegar: Docker en el servidor, acceso SSH y
`deploy/.env.deploy` (plantilla en `deploy/.env.deploy.ejemplo`, fuera del repositorio).

## 1. Pruebas del backend (sin base de datos)

```bash
cd backend
python3.11 -m venv .venv && .venv/bin/pip install -r requirements.txt pytest
.venv/bin/python -m pytest -q
# → 18 passed: 12 del motor (test_evm.py), 4 de la simulación, 2 del cumplimiento
```

Las pruebas leen el contenido de `fuente/contenido.json` y los entregables de `entregables/`; si se cambió
la fuente, regenerarlos antes:

```bash
python3 scripts/generar_semilla.py        # → db/migraciones/003_contenido.sql y fuente/contenido.json
python3 scripts/preparar_entregables.py   # → entregables/ y db/catalogo_entregables.sql (requiere ../entregable/)
```

Para ver las cifras de la fuente del documento: `python3 fuente/calculos.py`.

## 2. Portal completo en local, sin Postgres ni Redis

`scripts/servidor_local.py` levanta la misma API de `backend/app` con las consultas en memoria (contenido de
`fuente/contenido.json`, catálogo de `db/catalogo_entregables.sql`) y Celery en modo inmediato, así que el
laboratorio, la simulación y el ZIP funcionan igual que en producción.

```bash
# Terminal 1 — API en http://127.0.0.1:8000 (puerto con PUERTO=…)
backend/.venv/bin/python scripts/servidor_local.py

# Terminal 2 — frontend en http://localhost:4200 con /api hacia la API local
cd frontend && npm ci && npx ng serve --proxy-config proxy.local.json
```

Sin `--proxy-config proxy.local.json`, `ng serve` usa `proxy.conf.json`, que manda `/api` al dominio público.
Los ZIP generados en local quedan en `.paquetes_local/`.

## 3. Comprobaciones antes de desplegar

```bash
cd backend && .venv/bin/python -m pytest -q          # 18 pruebas en verde
cd frontend && npx ng build                          # sin errores
curl -s localhost:8000/api/cumplimiento | jq 'map(select(.cumplido | not)) | length'
# → 0 (15 de 15 cumplen)
curl -s localhost:8000/api/resumen | jq '{cpi3: .a.cpi, spi3: .a.spi, eac3: .a.eac_a, cpi5: .b.cpi, eac5: .b.eac_a}'
# → 0.7336…, 0.7879…, 130450, 0.9292…, 122000
curl -s -X POST localhost:8000/api/escenario -H 'X-Requested-With: portal-valorganado' \
     -H 'Content-Type: application/json' \
     -d '{"bac":115000,"duracion":6,"pv_mes":[23000,15000,16000,19000,20000,22000],"ac_mes":[21000,18000,19000],"avance_mes":[8,15,14]}' \
     | jq '.cortes[2] | {ev, cpi, eac_a, duracion}'
# → 42550, 0.7336…, 130450, 7.6145…
curl -s -X POST localhost:8000/api/simulacion -H 'X-Requested-With: portal-valorganado' \
     -H 'Content-Type: application/json' -d '{"mes":5,"iteraciones":3000,"variabilidad":0.2,"ventana":"reciente","semilla":42}'
# → 202 {"id": "…", "estado": "pendiente"}; luego GET /api/simulacion/<id>
```

## 4. Cambiar el contenido académico

1. Editar **solo** `../fuente/calculos.py` (cifras) o `../fuente/contenido.py` (textos).
2. `python3 ../fuente/construir.py` (regenera la figura, el .docx y el .pdf exportado por Word, y valida 4
   páginas como máximo y solo Calibri).
3. `python3 scripts/generar_semilla.py && python3 scripts/preparar_entregables.py` (o directamente
   `deploy/deploy.sh`, que los corre).
4. Correr las pruebas y revisar la página *Cumplimiento*.

## 5. Despliegue en producción

Una sola vez: copiar `deploy/.env.deploy.ejemplo` a `deploy/.env.deploy` y llenar `DOMINIO`
(`evm.iagentek.com.mx`), `VPS`, `PUERTO`, `LLAVE`, `DESTINO`, `ARCHIVO_SECRETOS`,
`DB_SUPERUSUARIO` y `DB_CONTENEDOR`. La contraseña del rol (`VALORGANADO_DB_PASSWORD`) se genera sola en el
servidor la primera vez (archivo con permisos 600) y el secreto `valorganado_db_dsn_v1` lo crea `deploy.sh`
si falta.

Cada despliegue, desde la raíz del repo:

```bash
deploy/deploy.sh
```

`deploy.sh`:

1. Toma `TAG=$(git rev-parse --short=12 HEAD)` (o fecha si no hay git) y le añade `-dirty` si hay cambios sin
   commit en `backend`, `frontend`, `deploy`, `db` o `docs`.
2. Regenera la semilla y los entregables.
3. Sincroniza el repo con `rsync` (sin `.git`, `.venv`, `node_modules`, `dist`, `.env.deploy`).
4. En el servidor aplica `001_esquema.sql`, `003_contenido.sql`, `catalogo_entregables.sql` y, al final,
   `002_seguridad.sql`.
5. Construye `valorganado-backend:$TAG` (la usan `api` y `worker`) y `valorganado-frontend:$TAG`; crea el
   secreto del DSN si falta.
6. `docker stack deploy -c deploy/stack.yml valorganado` y fuerza la imagen nueva con `docker service update`.
7. Muestra réplicas e imagen de `valorganado_api`, `_worker`, `_web` y `_redis`, el estado de los
   contenedores, el código HTTP de la portada y `https://<dominio>/api/health`.

Rollback: `git checkout <sha-anterior> && deploy/deploy.sh` (`api` y `web` usan `update_config` con
`failure_action: rollback`).

Redis: la API y el worker usan `redis://valorganado_redis:6379`; en `iagenteknet` el nombre corto `redis`
resolvería al servicio de otro stack.

## 6. Verificación de seguridad

```bash
# anon de Supabase no ve filas (SC-007)
curl -s "https://<supabase-maestria>/rest/v1/ValorGanado_contenido" -H "apikey: $ANON_KEY"   # → [] o 401/403
# escritura sin cabecera → 403
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://evm.iagentek.com.mx/api/escenario
# cabeceras
curl -sI https://evm.iagentek.com.mx | grep -iE 'strict-transport|content-security|x-content-type'
# sin documentación interactiva → 404
curl -s -o /dev/null -w '%{http_code}\n' https://evm.iagentek.com.mx/api/docs
# cuerpo mayor a 8192 bytes en un POST → 413
```
