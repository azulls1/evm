"""Tareas de Celery."""
import hashlib
import logging
import zipfile
from datetime import datetime

from . import consultas, evm, simulacion
from .celery_app import celery
from .config import config

log = logging.getLogger("valorganado.tareas")
PAQUETES_CONSERVADOS = 3


@celery.task(name="valorganado.simular_cierre")
def simular_cierre(simulacion_id: str, parametros: dict) -> dict:
    """Monte Carlo del cierre del proyecto desde el corte pedido; deja el resultado en ValorGanado_simulaciones."""
    try:
        e = parametros["escenario"]
        d = evm.Datos(e["bac"], e["duracion"], e["pv_mes"], e["ac_mes"], e["avance_mes"])
        r = simulacion.simular(d, parametros["mes"], iteraciones=parametros["iteraciones"],
                               variabilidad=parametros["variabilidad"], ventana=parametros["ventana"],
                               semilla=parametros.get("semilla"))
    except Exception:
        # El detalle va al log del worker; al visitante solo un mensaje genérico
        log.exception("Fallo al simular %s", simulacion_id)
        consultas.fallar_simulacion(simulacion_id, "No se pudo completar la simulación.")
        raise
    consultas.completar_simulacion(simulacion_id, r)
    consultas.purgar_simulaciones()
    return {"prob_dentro_bac": r["coste"]["prob_dentro_bac"], "duracion_ms": r["duracion_ms"]}


@celery.task(name="valorganado.generar_entregable")
def generar_entregable(paquete_id: str) -> dict:
    """Empaqueta todos los entregables del catálogo en un ZIP con su manifiesto SHA-256."""
    try:
        cfg = config()
        archivos = consultas.entregables()
        cfg.dir_paquetes.mkdir(parents=True, exist_ok=True)
        nombre = f"ValorGanado_Actividad2_HernandezMata_{datetime.now():%Y%m%d-%H%M%S}_{paquete_id[:8]}.zip"
        destino = cfg.dir_paquetes / nombre
        with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
            for a in archivos:
                z.write(cfg.dir_entregables / a["ruta"], arcname=f"ValorGanado_Actividad2/{a['ruta']}")
            z.writestr("ValorGanado_Actividad2/MANIFIESTO_SHA256.txt",
                       "".join(f"{a['sha256']}  {a['ruta']}\n" for a in archivos))
        sha = hashlib.sha256(destino.read_bytes()).hexdigest()
        consultas.completar_paquete(paquete_id, nombre, len(archivos) + 1, destino.stat().st_size, sha)
        _purgar(cfg.dir_paquetes)
        return {"archivo": nombre, "sha256": sha}
    except Exception:
        log.exception("Fallo al generar el paquete %s", paquete_id)
        consultas.fallar_paquete(paquete_id, "No se pudo generar el paquete.")
        raise


def _purgar(carpeta) -> None:
    """Conserva solo los últimos paquetes: borra registros viejos y cualquier ZIP que ya no esté registrado."""
    consultas.purgar_paquetes(PAQUETES_CONSERVADOS)
    vigentes = {p["archivo"] for p in consultas.paquetes_recientes(PAQUETES_CONSERVADOS + 5) if p.get("archivo")}
    for f in carpeta.glob("*.zip"):
        if f.name not in vigentes:
            f.unlink(missing_ok=True)
