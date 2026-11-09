"""API REST — contrato en specs/001-portal-valorganado/contracts/api.md."""
import logging
import zipfile
from contextlib import asynccontextmanager
from typing import Literal

import redis
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, model_validator

from . import consultas, cumplimiento, db, evm
from .config import config

log = logging.getLogger("valorganado")


@asynccontextmanager
async def ciclo_vida(_: FastAPI):
    yield
    db.cerrar()


# Sin documentación interactiva en producción: no se publica el mapa de la API
app = FastAPI(title="ValorGanado · Control EVM", version="1.0.0", lifespan=ciclo_vida,
              docs_url=None, openapi_url=None, redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=config().cors, allow_methods=["GET", "POST"],
                   allow_headers=["content-type", "x-requested-with"])

CABECERA_PORTAL = "portal-valorganado"


def desde_el_portal(request: Request) -> None:
    """Las acciones que escriben exigen una cabecera propia: obliga a un preflight CORS, así que otra web no
    puede dispararlas desde el navegador de un visitante (solo se permite el origen del portal)."""
    if request.headers.get("x-requested-with") != CABECERA_PORTAL:
        raise HTTPException(403, "Petición no permitida")


def _contenido() -> dict:
    c = consultas.contenido()
    if not c:
        raise HTTPException(404, "El contenido de la actividad no está cargado")
    return c


def _datos(c: dict) -> evm.Datos:
    x = c["datos"]
    return evm.Datos(x["bac"], x["duracion"], x["pv_mes"], x["ac_mes"], x["avance_mes"])


# ── Salud ───────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    estado = {"db": False, "redis": False}
    try:
        estado["db"] = db.uno("select 1 as ok")["ok"] == 1
    except Exception as e:
        log.warning("db no responde: %s", e)
    try:
        estado["redis"] = bool(redis.Redis.from_url(config().redis_url, socket_timeout=2).ping())
    except Exception as e:
        log.warning("redis no responde: %s", e)
    ok = all(estado.values())
    return JSONResponse({"status": "ok" if ok else "degradado", **estado}, status_code=200 if ok else 503)


# ── Contenido de la actividad ───────────────────────────────────────────────
@app.get("/api/contenido")
def contenido():
    """Textos del documento (de fuente/contenido.py) + el análisis recalculado por el motor EVM."""
    c = _contenido()
    d = _datos(c)
    hibrido = {**c.get("hibrido", {}), "burnup": evm.burnup(d),
               "pronosticos": [evm.velocidad(d, m, desde) for m, desde in ((3, 1), (3, 2), (5, 1), (5, 4))
                               if m <= len(d.avance_mes)]}
    return {**c, "analisis": evm.analizar(d), "hibrido": hibrido,
            "periodo_medidas": evm.periodo(d, c["periodo"]["desde"], c["periodo"]["hasta"])}


@app.get("/api/resumen")
def resumen():
    c = _contenido()
    d = _datos(c)
    a, b = (evm.corte(d, c["partes"][x]["mes"]) for x in ("A", "B"))
    req = cumplimiento.requisitos()
    return {"portada": c["portada"], "bac": d.bac, "duracion": d.duracion, "a": a, "b": b,
            "periodo_medidas": evm.periodo(d, c["periodo"]["desde"], c["periodo"]["hasta"]),
            "serie": evm.serie(d), "conclusion": c["conclusion"],
            "cumplimiento": {"cumplidos": sum(q["cumplido"] for q in req), "total": len(req)},
            "simulaciones": consultas.total_simulaciones()}


@app.get("/api/cumplimiento")
def get_cumplimiento():
    _contenido()
    return cumplimiento.requisitos()


# ── Laboratorio: escenarios propios (cálculo inmediato, sin guardar nada) ──
class Escenario(BaseModel):
    bac: float = Field(gt=0, le=1e9)
    duracion: int = Field(ge=2, le=24)
    pv_mes: list[float] = Field(min_length=2, max_length=24)
    ac_mes: list[float] = Field(min_length=1, max_length=24)
    avance_mes: list[float] = Field(min_length=1, max_length=24)

    @model_validator(mode="after")
    def coherente(self):
        try:
            evm.Datos(**self.model_dump()).validar()
        except ValueError as e:
            raise ValueError(str(e)) from e
        return self


@app.post("/api/escenario", dependencies=[Depends(desde_el_portal)])
def escenario(e: Escenario):
    return evm.analizar(evm.Datos(**e.model_dump()))


# ── Simulación Monte Carlo del cierre (Celery) ──────────────────────────────
class PeticionSimulacion(BaseModel):
    mes: int = Field(3, ge=1, le=24)
    iteraciones: int = Field(3000, ge=500, le=10000)
    variabilidad: float = Field(0.2, ge=0.05, le=0.6)
    ventana: Literal["todo", "reciente"] = "todo"
    semilla: int | None = Field(None, ge=0, le=2**31 - 1)
    escenario: Escenario | None = None   # sin escenario: los datos del enunciado


@app.post("/api/simulacion", status_code=202, dependencies=[Depends(desde_el_portal)])
def simular(peticion: PeticionSimulacion):
    from .tareas import simular_cierre

    parametros = peticion.model_dump()
    datos = parametros["escenario"] or _contenido()["datos"]
    if peticion.mes > len(datos["ac_mes"]):
        raise HTTPException(422, "El mes de corte no tiene mediciones")
    parametros["escenario"] = {k: datos[k] for k in ("bac", "duracion", "pv_mes", "ac_mes", "avance_mes")}
    s = consultas.crear_simulacion(parametros)
    try:
        r = simular_cierre.apply_async(args=[s["id"], parametros], task_id=s["id"])
    except Exception as e:
        log.exception("No se pudo encolar la simulación")
        consultas.fallar_simulacion(s["id"], "La cola de trabajos no está disponible.")
        raise HTTPException(503, "La cola de trabajos no está disponible") from e
    consultas.asignar_tarea_simulacion(s["id"], r.id)
    return {"id": s["id"], "estado": s["estado"]}


@app.get("/api/simulacion/ultima")
def simulacion_ultima():
    s = consultas.ultima_simulacion()
    if not s:
        raise HTTPException(404, "Todavía no hay simulaciones")
    return s


@app.get("/api/simulacion/{sid}")
def simulacion(sid: str):
    try:
        s = consultas.simulacion(sid)
    except Exception:
        s = None  # un id que no es uuid
    if not s:
        raise HTTPException(404, "Simulación no encontrada")
    return s


# ── Entregables ─────────────────────────────────────────────────────────────
def _entrega(archivos: list[dict]) -> dict | None:
    """El paquete oficial de entrega, con su contenido leído del propio archivo (no de una lista fija)."""
    registro = next((a for a in archivos if a["tipo"] == "Paquete"), None)
    if not registro:
        return None
    ruta = config().dir_entregables / registro["ruta"]
    if not ruta.is_file():
        return None
    with zipfile.ZipFile(ruta) as z:
        contenido_zip = [{"nombre": i.filename.split("/", 1)[-1], "bytes": i.file_size} for i in z.infolist() if not i.is_dir()]
        leeme = next((z.read(i).decode() for i in z.namelist() if i.endswith("LEEME.md")), "")
    return {**registro, "contenido": contenido_zip, "leeme": leeme}


@app.get("/api/entregables")
def entregables():
    archivos = consultas.entregables()
    return {"archivos": archivos, "total_bytes": sum(a["bytes"] for a in archivos), "entrega": _entrega(archivos),
            "ultimo_paquete": consultas.ultimo_paquete(), "recientes": consultas.paquetes_recientes()}


@app.get("/api/entregables/archivo")
def entregable_archivo(ruta: str, ver: bool = False):
    """Descarga (o muestra en línea, con ver=1) un archivo del catálogo. Solo se sirven rutas registradas."""
    registro = consultas.entregable_por_ruta(ruta)
    base = config().dir_entregables.resolve()
    destino = (base / ruta).resolve() if registro else None
    if not registro or base not in destino.parents or not destino.is_file():
        raise HTTPException(404, "Archivo no encontrado")
    if ver:
        return FileResponse(destino, content_disposition_type="inline", filename=destino.name)
    return FileResponse(destino, filename=destino.name)


@app.post("/api/entregables/generar", status_code=202, dependencies=[Depends(desde_el_portal)])
def entregables_generar():
    from .tareas import generar_entregable

    # Si ya se está generando uno, o el último sigue vigente (posterior al catálogo desplegado), se reutiliza
    en_curso = consultas.paquete_en_curso()
    if en_curso:
        return {"paquete_id": en_curso["id"], "reutilizado": True}
    ultimo = consultas.ultimo_paquete()
    if ultimo and (config().dir_paquetes / ultimo["archivo"]).is_file() and \
            ultimo["completado_en"].timestamp() > _version_catalogo():
        return {"paquete_id": ultimo["id"], "reutilizado": True}

    p = consultas.crear_paquete()
    try:
        r = generar_entregable.apply_async(args=[p["id"]], task_id=p["id"])
    except Exception as e:
        log.exception("No se pudo encolar el paquete")
        consultas.fallar_paquete(p["id"], "La cola de trabajos no está disponible.")
        raise HTTPException(503, "La cola de trabajos no está disponible") from e
    consultas.asignar_tarea_paquete(p["id"], r.id)
    return {"paquete_id": p["id"]}


def _version_catalogo() -> float:
    base = config().dir_entregables
    return max((f.stat().st_mtime for f in base.rglob("*") if f.is_file()), default=0.0)


@app.get("/api/entregables/paquete/{pid}")
def entregables_paquete(pid: str):
    try:
        p = consultas.paquete(pid)
    except Exception:
        p = None
    if not p:
        raise HTTPException(404, "Paquete no encontrado")
    return p


@app.get("/api/entregables/paquete/{pid}/descargar")
def entregables_descargar(pid: str):
    try:
        p = consultas.paquete(pid)
    except Exception:
        p = None
    if not p or p["estado"] != "completada":
        raise HTTPException(404, "El paquete no existe o todavía no está listo")
    destino = config().dir_paquetes / p["archivo"]
    if not destino.is_file():
        raise HTTPException(410, "El archivo del paquete ya no está en el servidor; genera uno nuevo")
    return FileResponse(destino, filename=p["archivo"], media_type="application/zip")
