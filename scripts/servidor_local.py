# -*- coding: utf-8 -*-
"""Servidor local de desarrollo SIN Postgres ni Redis: la misma API (backend/app) con las consultas en memoria
(el contenido sale de fuente/contenido.json) y Celery en modo inmediato. Solo para probar el portal en local.

Uso:  backend/.venv/bin/python scripts/servidor_local.py      (API en http://127.0.0.1:8000)
      cd frontend && npx ng serve --proxy-config proxy.local.json
"""
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "backend"))
os.environ.setdefault("ENTREGABLES_DIR", str(RAIZ / "entregables"))
os.environ.setdefault("PAQUETES_DIR", str(RAIZ / ".paquetes_local"))
os.environ.setdefault("DATABASE_URL", "postgresql://local/sin-base")

from app import consultas  # noqa: E402
from app.celery_app import celery  # noqa: E402

celery.conf.update(task_always_eager=True, task_store_eager_result=False)
CONTENIDO = json.loads((RAIZ / "fuente" / "contenido.json").read_text(encoding="utf-8"))
SIMS: dict[str, dict] = {}
PAQS: dict[str, dict] = {}
ahora = lambda: datetime.now(timezone.utc)  # noqa: E731

consultas.contenido = lambda: {**CONTENIDO, "actualizado_en": ahora()}
consultas.crear_simulacion = lambda p: SIMS.setdefault(i := str(uuid.uuid4()), {"id": i, "estado": "pendiente", "parametros": p, "resultado": None,
                                                                                 "error": None, "duracion_ms": None, "creado_en": ahora(), "completado_en": None})
consultas.asignar_tarea_simulacion = lambda sid, t: None
consultas.completar_simulacion = lambda sid, r: SIMS[sid].update(estado="completada", resultado=r, duracion_ms=r["duracion_ms"], completado_en=ahora())
consultas.fallar_simulacion = lambda sid, e: SIMS[sid].update(estado="error", error=e)
consultas.simulacion = lambda sid: SIMS.get(sid)
consultas.ultima_simulacion = lambda: next((s for s in reversed(SIMS.values()) if s["estado"] == "completada"), None)
consultas.total_simulaciones = lambda: sum(s["estado"] == "completada" for s in SIMS.values())
consultas.purgar_simulaciones = lambda conservar=200: None


def _catalogo():
    sql = (RAIZ / "db" / "catalogo_entregables.sql").read_text(encoding="utf-8")
    import re
    filas = re.findall(r"\(\s*'([^']*)', '([^']*)', '([^']*)', '([^']*)', '([^']*)', (\d+), '([0-9a-f]{64})', (\d+)\)", sql)
    return [{"ruta": f[0], "nombre": f[1], "tipo": f[2], "criterio": f[3], "detalle": f[4], "bytes": int(f[5]), "sha256": f[6]} for f in filas]


consultas.entregables = _catalogo
consultas.entregable_por_ruta = lambda ruta: next((a for a in _catalogo() if a["ruta"] == ruta), None)
consultas.crear_paquete = lambda: PAQS.setdefault(i := str(uuid.uuid4()), {"id": i, "estado": "pendiente", "archivo": None, "n_archivos": None, "bytes": None,
                                                                           "sha256": None, "error": None, "creado_en": ahora(), "completado_en": None})
consultas.asignar_tarea_paquete = lambda pid, t: None
consultas.completar_paquete = lambda pid, a, n, b, s: PAQS[pid].update(estado="completada", archivo=a, n_archivos=n, bytes=b, sha256=s, completado_en=ahora())
consultas.fallar_paquete = lambda pid, e: PAQS[pid].update(estado="error", error=e)
consultas.paquete = lambda pid: PAQS.get(pid)
consultas.paquete_en_curso = lambda: None
consultas.ultimo_paquete = lambda: next((p for p in reversed(PAQS.values()) if p["estado"] == "completada"), None)
consultas.paquetes_recientes = lambda n=5: list(reversed(PAQS.values()))[:n]
consultas.purgar_paquetes = lambda conservar: None

if __name__ == "__main__":
    import uvicorn
    from app import main
    main.health = lambda: {"status": "ok", "db": "memoria", "redis": "inmediato"}
    uvicorn.run(main.app, host="127.0.0.1", port=int(os.getenv("PUERTO", "8000")))
