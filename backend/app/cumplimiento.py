"""Cumplimiento del enunciado y de la rúbrica, comprobado en el servidor: cada cifra de las respuestas se vuelve a
calcular con el motor EVM y se busca en el texto del portal y en el .docx entregado (nada se marca a mano)."""
import logging
import re
import zipfile

from pypdf import PdfReader

from . import consultas, evm
from .config import config

logging.getLogger("pypdf").setLevel(logging.ERROR)  # avisos inofensivos del PDF que exporta Word


def mx(x: float) -> str:
    """Mismo formato que fuente/calculos.py: $130 450 con espacio de no separación."""
    return ("−$" if x < 0 else "$") + f"{abs(x):,.0f}".replace(",", " ")


def r(x: float, dec: int = 3) -> str:
    return f"{x:.{dec}f}".replace(".", ",")


def _req(id_: str, criterio: str, texto: str, cumplido: bool, evidencia: str, ruta: str, aviso: bool = False) -> dict:
    return {"id": id_, "criterio": criterio, "texto": texto, "cumplido": cumplido, "aviso": aviso,
            "evidencia": evidencia, "ruta": ruta}


def _norm(t: str) -> str:
    return t.replace(" ", " ").replace(" ", " ")


def _documento() -> dict | None:
    """Texto, estilo Normal y páginas del documento entregado (.docx y su .pdf exportado por Word)."""
    base = config().dir_entregables
    docx = next(iter(sorted(base.glob("**/*.docx"))), None)
    pdf = next(iter(sorted(base.glob("documento/*.pdf"))), None)
    if not docx:
        return None
    with zipfile.ZipFile(docx) as z:
        estilos = z.read("word/styles.xml").decode()
        documento = z.read("word/document.xml").decode()
    normal = re.search(r'<w:style [^>]*w:styleId="Normal".*?</w:style>', estilos, re.S)
    bloque = normal.group(0) if normal else ""
    fuente = re.search(r'w:ascii="([^"]+)"', bloque)
    tam = re.search(r'<w:sz w:val="(\d+)"', bloque)
    lineas = re.findall(r'<w:spacing [^>]*w:line="(\d+)"', documento + bloque)
    texto = " ".join(re.findall(r"<w:t(?: [^>]*)?>([^<]*)</w:t>", documento))
    lector = PdfReader(pdf) if pdf else None
    fuentes_pdf = set()
    if lector:
        for p in lector.pages:
            for f in (p.get("/Resources", {}).get("/Font", {}) or {}).values():
                fuentes_pdf.add(str(f.get_object().get("/BaseFont", "")).split("+")[-1].lstrip("/"))
    return {"archivo": docx.name, "texto": _norm(texto), "fuente": fuente.group(1) if fuente else None,
            "puntos": int(tam.group(1)) / 2 if tam else None,
            "interlineado": max((int(x) for x in lineas), default=240) / 240,
            "paginas": len(lector.pages) if lector else None, "fuentes_pdf": sorted(fuentes_pdf)}


def _datos(c: dict) -> evm.Datos:
    x = c["datos"]
    return evm.Datos(x["bac"], x["duracion"], x["pv_mes"], x["ac_mes"], x["avance_mes"])


def requisitos() -> list[dict]:
    c = consultas.contenido()
    d = _datos(c)
    doc = _documento()
    en_doc = (lambda s: _norm(s) in doc["texto"]) if doc else (lambda s: False)
    out: list[dict] = []

    for parte, crit in (("A", "C1"), ("B", "C2")):
        info = c["partes"][parte]
        k = evm.corte(d, info["mes"])
        resp = {p["n"]: _norm(p["respuesta"]) for p in info["preguntas"]}
        ruta = f"/parte-{parte.lower()}"
        m = info["mes"]

        cifras = [mx(k["ev"]), mx(k["ac"]), r(k["cpi"])]
        ok = all(_norm(s) in resp[1] for s in cifras) and k["coste"].split()[1] in resp[1].lower()
        out.append(_req(f"{parte}.1", crit, f"Mes {m} · CPI: ¿por encima o por debajo del presupuesto?", ok and en_doc(r(k["cpi"])),
                        f"CPI = {mx(k['ev'])} ÷ {mx(k['ac'])} = {r(k['cpi'])} → {k['coste']}", ruta))

        ok = all(_norm(s) in resp[2] for s in (mx(k["pv"]), r(k["spi"]))) and "retras" in resp[2].lower()
        out.append(_req(f"{parte}.2", crit, f"Mes {m} · SPI: ¿retrasado o adelantado?", ok and en_doc(r(k["spi"])),
                        f"SPI = {mx(k['ev'])} ÷ {mx(k['pv'])} = {r(k['spi'])} → {k['plazo']}", ruta))

        ok = _norm(mx(k["eac_a"])) in resp[3] and "AC + (BAC − EV)" in resp[3]
        out.append(_req(f"{parte}.3", crit, f"Mes {m} · EAC según el presupuesto original", ok and en_doc(mx(k["eac_a"])),
                        f"EAC = AC + (BAC − EV) = {mx(k['eac_a'])} (variante a del Tema 5)", ruta))

        ok = r(k["duracion"], 2) in resp[4] and "retraso" in resp[4].lower()
        out.append(_req(f"{parte}.4", crit, f"Mes {m} · ¿terminará con retraso o adelanto?", ok and en_doc(r(k["duracion"], 2)),
                        f"6 ÷ SPI = {r(k['duracion'], 2)} meses frente a {d.duracion} previstos", ruta))

        if parte == "A":
            est = info["estrategias"]
            citadas = [e for e in est if re.search(r"\((?:Temas? \d|5\.\d)", e["titulo"])]
            out.append(_req("A.5", crit, "Al menos dos estrategias de control vistas en el curso", len(citadas) >= 2,
                            f"{len(citadas)} estrategias, cada una con su apartado: " + "; ".join(e["titulo"].split(" (")[0] for e in citadas), ruta))
            hib = next((e for e in est if "híbrido" in e["titulo"].lower()), None)
            ok = bool(hib) and all(w in hib["texto"].lower() for w in ("clásico", "valor ganado", "iteraciones")) \
                and "combinar enfoques" in c["conclusion"].lower() and en_doc("enfoque híbrido")
            out.append(_req("A.6", crit, "Complementa el control clásico con prácticas ágiles (enfoque híbrido)", ok,
                            "Estrategia 3: línea base y valor ganado (clásico) + iteraciones de dos semanas con paquetes "
                            "aceptados (ágil), citada al Tema 2; la conclusión lo recoge", "/hibrido"))
        else:
            a = evm.corte(d, c["partes"]["A"]["mes"])
            p = evm.periodo(d, c["periodo"]["desde"], c["periodo"]["hasta"])
            mejora = k["cpi"] > a["cpi"] and k["spi"] > a["spi"]
            ok = resp[5].lower().startswith("positivo") == mejora and all(s in resp[5] for s in (r(a["cpi"]), r(k["cpi"]), r(p["cpi"])))
            out.append(_req("B.5", crit, "¿Las medidas del mes 3 tuvieron efecto positivo o negativo? (justificado)", ok,
                            f"CPI {r(a['cpi'])} → {r(k['cpi'])} · SPI {r(a['spi'])} → {r(k['spi'])} · solo meses "
                            f"{p['desde']}–{p['hasta']}: CPI {r(p['cpi'])}, SPI {r(p['spi'])}", ruta))

    # Trampa del enunciado: el avance viene por mes, el EV usa el acumulado
    a, b = (evm.corte(d, c["partes"][x]["mes"]) for x in ("A", "B"))
    out.append(_req("D.1", "Datos", "El EV usa el avance acumulado (no el del mes)",
                    a["avance"] == 37 and b["avance"] == 80 and en_doc(mx(a["ev"])) and en_doc(mx(b["ev"])),
                    f"Mes 3: {a['avance']:g} % → EV {mx(a['ev'])} · Mes 5: {b['avance']:g} % → EV {mx(b['ev'])}", "/planteamiento"))

    # C3 · Presentación
    if doc:
        out.append(_req("C3.1", "C3", "Extensión máxima de 4 páginas", (doc["paginas"] or 99) <= 4,
                        f"{doc['paginas']} páginas en el PDF exportado por Word", "/entregables"))
        out.append(_req("C3.2", "C3", "Calibri 12 e interlineado 1,5",
                        doc["fuente"] == "Calibri" and doc["puntos"] == 12 and abs(doc["interlineado"] - 1.5) < 0.01,
                        f"{doc['fuente']} {doc['puntos']:g} pt · interlineado {doc['interlineado']:g} · fuentes del PDF: "
                        + ", ".join(doc["fuentes_pdf"]), "/entregables"))
        faltan = [p["n"] for x in ("A", "B") for p in c["partes"][x]["preguntas"]
                  if p["respuesta"] and _norm(p["respuesta"][:60]) not in doc["texto"]]
        out.append(_req("C3.3", "C3", "El documento entregado dice lo mismo que el portal", not faltan,
                        "las 10 respuestas aparecen tal cual en el .docx" if not faltan else f"Difieren: {faltan}", "/entregables"))
    out.append(_req("C3.4", "C3", "Cita las fuentes del método", len(c["referencias"]) >= 2,
                    f"{len(c['referencias'])} referencias (PMBOK® 7.ª ed. y Temas 2, 4 y 5)", "/metodo"))
    return out
