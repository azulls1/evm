# -*- coding: utf-8 -*-
"""Genera db/migraciones/003_contenido.sql a partir de fuente/contenido.py y fuente/calculos.py (la misma fuente
del .docx y el .pdf entregados). Así el portal nunca dice algo distinto del documento.

La fuente original vive en la carpeta de la actividad (../fuente); se copia a dev/fuente/ para que el repositorio
sea reproducible por sí solo.

Uso:  python3 scripts/generar_semilla.py
"""
import importlib
import json
import shutil
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
ORIGEN = RAIZ.parent / "fuente"
FUENTE = RAIZ / "fuente"
DESTINO = RAIZ / "db" / "migraciones" / "003_contenido.sql"

# Texto literal de las preguntas del enunciado (mexmiart08_act3.docx)
ENUNCIADO = {
    "comunes": [
        "De acuerdo con el índice del desempeño del costo, ¿el proyecto va por encima del presupuesto o por debajo?",
        "De acuerdo con el índice del desempeño del cronograma, ¿el proyecto va retrasado o adelantado?",
        "A este ritmo de gasto, ¿cuál será la estimación de coste al final del proyecto? Es decir, ¿cuál será el coste "
        "estimado del proyecto a su finalización (según el presupuesto original)?",
        "A este ritmo, ¿se finalizará el proyecto con retraso o adelanto respecto a los seis meses previstos en el calendario?",
    ],
    "A5": "¿Qué se podría hacer para controlar el proyecto? Debes basarte en al menos dos estrategias mencionadas a lo largo del curso.",
    "B5": "Según estos datos, ¿las medidas puestas en marcha en el mes 3 han tenido un efecto positivo o negativo? Justifica la respuesta.",
    "extension": "Extensión máxima: 4 páginas, fuente Calibri 12 e interlineado 1,5.",
    "rubrica": [
        {"criterio": "C1", "nombre": "Parte A", "descripcion": "Responder correctamente y de forma bien justificada las cinco preguntas de la parte A", "puntos": 4, "peso": 40},
        {"criterio": "C2", "nombre": "Parte B", "descripcion": "Responder correctamente y de forma bien justificada las cinco preguntas de la parte B", "puntos": 4, "peso": 40},
        {"criterio": "C3", "nombre": "Presentación", "descripcion": "Correcta redacción: clara, sin faltas de ortografía y ajustada a la extensión máxima", "puntos": 2, "peso": 20},
    ],
}


def sincronizar() -> None:
    if ORIGEN.is_dir():
        FUENTE.mkdir(exist_ok=True)
        for f in ("calculos.py", "contenido.py"):
            shutil.copy2(ORIGEN / f, FUENTE / f)


def preguntas(lista, parte: str) -> list[dict]:
    out = []
    for i, (q, a) in enumerate(lista, 1):
        out.append({"n": i, "pregunta": q, "enunciado": ENUNCIADO["comunes"][i - 1] if i <= 4 else ENUNCIADO[f"{parte}5"],
                    "respuesta": a})
    return out


def construir() -> dict:
    sys.path.insert(0, str(FUENTE))
    K = importlib.import_module("calculos")
    C = importlib.import_module("contenido")
    a = preguntas(C.PARTE_A, "A")
    a[4]["respuesta"] = C.ESTRATEGIAS_A_INTRO
    return {
        "portada": C.PORTADA,
        "introduccion": C.INTRODUCCION,
        "nota_avance": C.NOTA_AVANCE,
        "formulas": [{"indicador": i, "formula": f} for i, f in C.FORMULAS],
        "datos": {"bac": K.BAC, "duracion": K.DURACION_PLAN, "pv_mes": K.PV_MES, "ac_mes": K.AC_MES,
                  "avance_mes": K.AVANCE_MES},
        "partes": {
            "A": {"mes": K.A["mes"], "titulo": "Control del proyecto en el mes 3", "preguntas": a,
                  "estrategias": [{"titulo": t, "texto": x} for t, x in C.ESTRATEGIAS_A]},
            "B": {"mes": K.B["mes"], "titulo": "Control del proyecto en el mes 5", "preguntas": preguntas(C.PARTE_B, "B")},
        },
        "periodo": {"desde": 4, "hasta": 5},
        "conclusion": C.CONCLUSION,
        "hibrido": {**C.HIBRIDO,
                    "clasico": [{"elemento": e, "uso": u} for e, u in C.HIBRIDO["clasico"]],
                    "agil": [{"elemento": e, "uso": u} for e, u in C.HIBRIDO["agil"]],
                    "encaje": [{"paso": p, "texto": x} for p, x in C.HIBRIDO["encaje"]]},
        "referencias": C.REFERENCIAS,
        "enunciado": ENUNCIADO,
    }


def sql(c: dict) -> str:
    js = json.dumps(c, ensure_ascii=False).replace("'", "''")
    return f"""-- ════════════════════════════════════════════════════════════════════════════
-- ValorGanado · contenido. GENERADO por scripts/generar_semilla.py desde fuente/contenido.py: no editar a mano.
-- Idempotente: reemplaza el contenido académico; no toca simulaciones, entregables ni paquetes.
-- ════════════════════════════════════════════════════════════════════════════
begin;
insert into public."ValorGanado_contenido" (id, datos, actualizado_en)
values ('actividad2', '{js}'::jsonb, now())
on conflict (id) do update set datos = excluded.datos, actualizado_en = now();
commit;
"""


if __name__ == "__main__":
    sincronizar()
    c = construir()
    DESTINO.write_text(sql(c), encoding="utf-8")
    (RAIZ / "fuente" / "contenido.json").write_text(json.dumps(c, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{DESTINO.relative_to(RAIZ)}: {len(c['partes']['A']['preguntas'])} + {len(c['partes']['B']['preguntas'])} preguntas")
