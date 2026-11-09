"""Consultas SQL a las tablas ValorGanado_* de Supabase maestría."""
import re

from .db import todos, uno


def palabras(texto: str) -> int:
    """Mismo conteo que fuente/construir.py."""
    return len(re.findall(r"\b[\wÁÉÍÓÚÑáéíóúñü%-]+\b", texto))


# ── Contenido académico (una fila con todo lo que sale de fuente/contenido.py y fuente/calculos.py) ──
def contenido() -> dict | None:
    fila = uno('''select datos, actualizado_en from "ValorGanado_contenido" where id = 'actividad2' ''')
    return {**fila["datos"], "actualizado_en": fila["actualizado_en"]} if fila else None


# ── Simulaciones Monte Carlo del cierre del proyecto ───────────────────────
def crear_simulacion(parametros: dict) -> dict:
    from psycopg.types.json import Jsonb
    return uno('insert into "ValorGanado_simulaciones" (parametros) values (%s) returning id::text, estado',
               (Jsonb(parametros),))


def asignar_tarea_simulacion(sid: str, task_id: str) -> None:
    uno('update "ValorGanado_simulaciones" set task_id = %s where id = %s returning id', (task_id, sid))


def completar_simulacion(sid: str, resultado: dict) -> None:
    from psycopg.types.json import Jsonb
    uno('''update "ValorGanado_simulaciones" set estado = 'completada', resultado = %s, duracion_ms = %s,
           completado_en = now() where id = %s returning id''', (Jsonb(resultado), resultado["duracion_ms"], sid))


def fallar_simulacion(sid: str, error: str) -> None:
    uno('''update "ValorGanado_simulaciones" set estado = 'error', error = %s, completado_en = now()
           where id = %s returning id''', (error, sid))


def simulacion(sid: str) -> dict | None:
    return uno('''select id::text, estado, parametros, resultado, error, duracion_ms, creado_en, completado_en
                  from "ValorGanado_simulaciones" where id = %s''', (sid,))


def ultima_simulacion() -> dict | None:
    return uno('''select id::text, estado, parametros, resultado, error, duracion_ms, creado_en, completado_en
                  from "ValorGanado_simulaciones" where estado = 'completada' order by creado_en desc limit 1''')


def total_simulaciones() -> int:
    return uno('''select count(*) as n from "ValorGanado_simulaciones" where estado = 'completada' ''')["n"]


def purgar_simulaciones(conservar: int = 200) -> None:
    uno('''with viejas as (select id from "ValorGanado_simulaciones" order by creado_en desc offset %s)
           delete from "ValorGanado_simulaciones" where id in (select id from viejas) returning 1''', (conservar,))


# ── Entregables y paquetes ──────────────────────────────────────────────────
def entregables() -> list[dict]:
    return todos('select ruta, nombre, tipo, criterio, detalle, bytes, sha256 from "ValorGanado_entregables" order by orden, ruta')


def entregable_por_ruta(ruta: str) -> dict | None:
    return uno('select ruta from "ValorGanado_entregables" where ruta = %s', (ruta,))


def crear_paquete() -> dict:
    return uno('insert into "ValorGanado_paquetes" default values returning id::text, estado')


def asignar_tarea_paquete(pid: str, task_id: str) -> None:
    uno('update "ValorGanado_paquetes" set task_id = %s where id = %s returning id', (task_id, pid))


def completar_paquete(pid: str, archivo: str, n: int, bytes_: int, sha: str) -> None:
    uno('''update "ValorGanado_paquetes" set estado = 'completada', archivo = %s, n_archivos = %s, bytes = %s,
           sha256 = %s, completado_en = now() where id = %s returning id''', (archivo, n, bytes_, sha, pid))


def fallar_paquete(pid: str, error: str) -> None:
    uno('''update "ValorGanado_paquetes" set estado = 'error', error = %s, completado_en = now()
           where id = %s returning id''', (error, pid))


_COLS_PAQUETE = 'id::text, estado, archivo, n_archivos, bytes, sha256, error, creado_en, completado_en'


def paquete(pid: str) -> dict | None:
    return uno(f'select {_COLS_PAQUETE} from "ValorGanado_paquetes" where id = %s', (pid,))


def paquete_en_curso() -> dict | None:
    return uno(f'''select {_COLS_PAQUETE} from "ValorGanado_paquetes"
                   where estado = 'pendiente' and creado_en > now() - interval '2 minutes'
                   order by creado_en desc limit 1''')


def ultimo_paquete() -> dict | None:
    return uno(f'''select {_COLS_PAQUETE} from "ValorGanado_paquetes" where estado = 'completada'
                   order by completado_en desc limit 1''')


def paquetes_recientes(n: int = 5) -> list[dict]:
    return todos(f'select {_COLS_PAQUETE} from "ValorGanado_paquetes" order by creado_en desc limit %s', (n,))


def purgar_paquetes(conservar: int) -> None:
    uno('''with viejos as (select id from "ValorGanado_paquetes" order by creado_en desc offset %s)
           delete from "ValorGanado_paquetes" where id in (select id from viejos) returning 1''', (conservar,))
