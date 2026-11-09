# -*- coding: utf-8 -*-
"""Arma la carpeta entregables/ (lo que se hornea en la imagen del backend) y su catálogo:
- el .docx y el .pdf entregados (../entregable/), y el paquete de entrega con un LEEME que mapea la rúbrica;
- los datos del caso y los indicadores por corte en CSV, calculados desde fuente/calculos.py;
- las figuras y diagramas, las especificaciones (spec-kit) y los artefactos BMAD.
Escribe db/catalogo_entregables.sql (upsert de ValorGanado_entregables) que deploy.sh aplica en Supabase maestría.

Uso:  python3 scripts/preparar_entregables.py   (después de scripts/generar_semilla.py)
"""
import csv
import hashlib
import io
import os
import shutil
import sys
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
ACTIVIDAD = RAIZ.parent
DESTINO = RAIZ / "entregables"
NOMBRE_DOC = "Actividad2_Individual_HernandezMata_Adonai"
URL = "https://" + os.getenv("DOMINIO", "evm.iagentek.com.mx")
REPO = os.getenv("REPO", "https://github.com/azulls1/evm")

sys.path.insert(0, str(RAIZ / "fuente"))
import calculos as K  # noqa: E402
import contenido as C  # noqa: E402


def csv_texto(encabezado: list[str], filas: list[tuple]) -> str:
    b = io.StringIO()
    w = csv.writer(b)
    w.writerow(encabezado)
    w.writerows(filas)
    return "\ufeff" + b.getvalue()  # BOM: Excel abre los acentos bien


def leeme(c) -> str:
    return f"""# Actividad 2 individual — Gestión del valor ganado (EVM)

**{c.PORTADA['alumno']}**
**Asignatura:** {c.PORTADA['asignatura']} · {c.PORTADA['programa']}
**Profesora:** {c.PORTADA['profesora']}

## Archivos

| Archivo | Qué es |
|---|---|
| `{NOMBRE_DOC}.docx` | El documento de la actividad (4 páginas, Calibri 12, interlineado 1,5) |
| `{NOMBRE_DOC}.pdf` | El mismo documento en PDF |

## Dónde está cada criterio de la rúbrica

| Criterio | En el documento | En el portal |
|---|---|---|
| 1. Parte A (mes 3) | Parte A: tabla de cálculo y preguntas 1–5 | {URL}/parte-a |
| 2. Parte B (mes 5) | Parte B: tabla comparativa, preguntas 1–5 y figura 1 | {URL}/parte-b |
| 3. Presentación | 4 páginas, Calibri 12, interlineado 1,5 | {URL}/cumplimiento |

Retroalimentación de la Actividad 1 (complementar lo ágil con lo clásico): la estrategia 3 de la Parte A5 y la
conclusión combinan el control clásico del valor ganado con iteraciones ágiles. En el portal: {URL}/hibrido

Resultados: mes 3 → CPI {K.r(K.A['cpi'])}, SPI {K.r(K.A['spi'])}, EAC {K.mx(K.A['eac_a'])}; mes 5 → CPI {K.r(K.B['cpi'])}, SPI {K.r(K.B['spi'])}, EAC {K.mx(K.B['eac_a'])}.

Portal interactivo con el cálculo paso a paso, la curva S, el enfoque híbrido, un laboratorio de escenarios y la simulación del cierre:
**{URL}** · código: {REPO}
"""


def main() -> None:
    c = C
    catalogo: list[tuple] = []  # (ruta, nombre, tipo, criterio, detalle)

    def agregar(origen: Path | None, ruta: str, nombre: str, tipo: str, criterio: str, detalle: str, texto: str | None = None):
        d = DESTINO / ruta
        d.parent.mkdir(parents=True, exist_ok=True)
        if texto is not None:
            d.write_text(texto, encoding="utf-8")
        else:
            shutil.copy2(origen, d)
        catalogo.append((ruta, nombre, tipo, criterio, detalle))

    # 1) Documento entregado y paquete de entrega
    doc = ACTIVIDAD / "entregable"
    if not doc.exists():  # clon del repositorio sin la carpeta de la actividad: se reutiliza lo ya preparado
        print("Sin ../entregable: se conserva entregables/ tal como está en el repositorio")
        return
    if DESTINO.exists():
        shutil.rmtree(DESTINO)
    DESTINO.mkdir()
    agregar(doc / f"{NOMBRE_DOC}.docx", f"documento/{NOMBRE_DOC}.docx", "Documento de la actividad (Word)", "Documento",
            "Entrega", "Partes A y B con las diez preguntas · 4 páginas · Calibri 12 · interlineado 1,5")
    agregar(doc / f"{NOMBRE_DOC}.pdf", f"documento/{NOMBRE_DOC}.pdf", "Documento de la actividad (PDF)", "PDF",
            "Entrega", "El mismo documento en PDF, listo para leer")
    zip_ruta = DESTINO / "documento" / f"{NOMBRE_DOC}_Entrega.zip"
    # ZIP determinista: misma fecha interna (la del .docx) → mismo SHA-256 si el contenido no cambió
    import time
    fecha = time.localtime((doc / f"{NOMBRE_DOC}.docx").stat().st_mtime)[:6]
    with zipfile.ZipFile(zip_ruta, "w", zipfile.ZIP_DEFLATED) as z:
        for nombre, datos in [*((f"{NOMBRE_DOC}.{ext}", (doc / f"{NOMBRE_DOC}.{ext}").read_bytes()) for ext in ("docx", "pdf")),
                              ("LEEME.md", leeme(c).encode())]:
            info = zipfile.ZipInfo(f"{NOMBRE_DOC}/{nombre}", date_time=fecha)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, datos)
    catalogo.append((f"documento/{NOMBRE_DOC}_Entrega.zip", "Paquete de entrega", "Paquete", "Entrega",
                     "Documento .docx + .pdf y un LEEME que ubica cada criterio de la rúbrica"))

    # 2) Datos del caso e indicadores, calculados desde la misma fuente
    agregar(None, "datos/linea_base_y_mediciones.csv", "Datos del enunciado", "Datos", "Datos",
            "PV, AC y avance por mes, con sus acumulados",
            csv_texto(["mes", "pv", "pv_acumulado", "ac", "ac_acumulado", "avance_pct", "avance_acumulado_pct"],
                      [(m + 1, K.PV_MES[m], K.PV_ACUM[m],
                        *((K.AC_MES[m], K.AC_ACUM[m], K.AVANCE_MES[m], K.AVANCE_ACUM[m]) if m < len(K.AC_MES) else ("",) * 4))
                       for m in range(K.DURACION_PLAN)]))
    claves = ["pv", "ac", "avance", "ev", "cv", "sv", "cpi", "spi", "eac_a", "eac_b", "eac_c", "tcpi", "duracion"]
    agregar(None, "datos/indicadores_por_corte.csv", "Indicadores por corte", "Datos", "C1 · C2",
            "EV, CV, SV, CPI, SPI, EAC (a, b, c), TCPI y duración estimada al cierre de cada mes",
            csv_texto(["mes", *claves], [(m, *(round(float(K.corte(m)[k]), 6) for k in claves)) for m in range(1, len(K.AC_MES) + 1)]))
    # 3) Figuras
    agregar(ACTIVIDAD / "fuente" / "curva_s.png", "figuras/curva-s.png", "Curva S (figura 1 del documento)", "Figura",
            "C2", "PV, AC y EV acumulados con los cortes de los meses 3 y 5")
    for f in sorted((RAIZ / "docs/figuras/diagramas").glob("*.png")):
        agregar(f, f"figuras/{f.name}", f.stem.replace("-", " ").capitalize(), "Figura", "Figuras", "Diagrama · PNG 2x")
    titulos = {"anatomia-valor-ganado": "Tablero del valor ganado", "anatomia-control": "El ciclo de control del mes 3",
               "anatomia-cierre": "Tablero de Galton del cierre"}
    for f in sorted((RAIZ / "docs/figuras").glob("anatomia*/*.png")):
        agregar(f, f"figuras/{f.name}", titulos.get(f.stem, f.stem), "Figura", "Figuras", "Figura isométrica interactiva")

    # 4) Metodología: spec-kit y BMAD
    for f in sorted((RAIZ / "specs").rglob("*.md")):
        rel = f.relative_to(RAIZ)
        agregar(f, f"especificaciones/{rel}", rel.name, "Especificación", "spec-kit", str(rel.parent))
    constitucion = RAIZ / ".specify/memory/constitution.md"
    if constitucion.exists():
        agregar(constitucion, "especificaciones/constitution.md", "constitution.md", "Especificación", "spec-kit",
                "Principios del proyecto")
    for f in sorted([*(RAIZ / "_bmad-output").rglob("*.md"), *(RAIZ / "_bmad-output").rglob("*.yaml")]):
        rel = f.relative_to(RAIZ / "_bmad-output")
        agregar(f, f"bmad/{rel}", rel.name, "BMAD", "BMAD", str(rel.parent))

    # Catálogo con SHA-256
    filas = []
    for orden, (ruta, nombre, tipo, criterio, detalle) in enumerate(catalogo):
        datos = (DESTINO / ruta).read_bytes()
        filas.append((ruta, nombre, tipo, criterio, detalle, len(datos), hashlib.sha256(datos).hexdigest(), orden))

    def q(v):
        return str(v) if isinstance(v, int) else "'" + str(v).replace("'", "''") + "'"

    sql = ["-- GENERADO por scripts/preparar_entregables.py — catálogo de entregables", "begin;",
           'delete from public."ValorGanado_entregables";',
           'insert into public."ValorGanado_entregables" (ruta, nombre, tipo, criterio, detalle, bytes, sha256, orden) values',
           ",\n".join("    (" + ", ".join(q(v) for v in f) + ")" for f in filas) + ";", "commit;", ""]
    (RAIZ / "db" / "catalogo_entregables.sql").write_text("\n".join(sql), encoding="utf-8")
    total = sum(f[5] for f in filas)
    print(f"✓ entregables/: {len(filas)} archivos · {total / 1e6:.1f} MB · catálogo en db/catalogo_entregables.sql")


if __name__ == "__main__":
    main()
