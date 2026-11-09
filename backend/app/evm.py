"""Motor de valor ganado (EVM) con las fórmulas del Tema 5 (apartado 5.9, Tablas 9 a 12).
Es el mismo cálculo que fuente/calculos.py (que genera el documento); las pruebas comprueban que coinciden.
Sirve para cualquier escenario: el del enunciado o uno que el visitante modifique en el laboratorio."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Datos:
    bac: float
    duracion: int            # meses planificados
    pv_mes: list[float]      # línea base por mes (suma = BAC)
    ac_mes: list[float]      # coste real por mes (hasta el último mes medido)
    avance_mes: list[float]  # % de trabajo realizado en cada mes (no acumulado)

    def validar(self) -> None:
        if len(self.pv_mes) != self.duracion:
            raise ValueError("La línea base debe tener un valor por mes planificado")
        if abs(sum(self.pv_mes) - self.bac) > 0.5:
            raise ValueError("La suma de la línea base debe ser igual al BAC")
        if len(self.ac_mes) != len(self.avance_mes) or not 1 <= len(self.ac_mes) <= self.duracion:
            raise ValueError("Coste real y avance deben tener el mismo número de meses medidos")
        if sum(self.avance_mes) > 100 + 1e-9 or min(self.avance_mes) < 0 or min(self.ac_mes) < 0:
            raise ValueError("El avance acumulado no puede pasar del 100 % ni haber valores negativos")


def acumulado(v: list[float]) -> list[float]:
    s, r = 0.0, []
    for x in v:
        s += x
        r.append(s)
    return r


def corte(d: Datos, mes: int) -> dict:
    """Indicadores acumulados al cierre del mes indicado."""
    if not 1 <= mes <= len(d.ac_mes):
        raise ValueError("Mes fuera de las mediciones disponibles")
    i = mes - 1
    pv, ac = acumulado(d.pv_mes)[i], acumulado(d.ac_mes)[i]
    avance = acumulado(d.avance_mes)[i]
    ev = d.bac * avance / 100                       # EV = BAC × % de avance real acumulado
    cpi = ev / ac if ac else None                   # CPI = EV / AC
    spi = ev / pv if pv else None                   # SPI = EV / PV
    r = {
        "mes": mes, "pv": pv, "ac": ac, "avance": avance, "ev": ev,
        "cv": ev - ac, "sv": ev - pv, "cpi": cpi, "spi": spi,
        "eac_a": ac + (d.bac - ev),                 # a) según presupuesto original (la que pide la actividad)
        "eac_b": d.bac / cpi if cpi else None,      # b) según CPI actual
        "eac_c": ac + (d.bac - ev) / (cpi * spi) if cpi and spi else None,  # c) considerando CPI y SPI
        "tcpi": (d.bac - ev) / (d.bac - ac) if d.bac != ac else None,
        "duracion": d.duracion / spi if spi else None,                      # duración prevista ÷ SPI
    }
    r["vac"] = d.bac - r["eac_a"]
    r["coste"] = "por debajo del presupuesto" if cpi and cpi > 1 else "según lo planificado" if cpi == 1 else "por encima del presupuesto"
    r["plazo"] = "adelantado" if spi and spi > 1 else "según lo planificado" if spi == 1 else "retrasado"
    return r


def periodo(d: Datos, desde: int, hasta: int) -> dict:
    """Desempeño de un tramo de meses (p. ej. 4–5, para juzgar el efecto de las medidas del mes 3)."""
    sl = slice(desde - 1, hasta)
    ev = d.bac * sum(d.avance_mes[sl]) / 100
    ac, pv = sum(d.ac_mes[sl]), sum(d.pv_mes[sl])
    return {"desde": desde, "hasta": hasta, "ev": ev, "ac": ac, "pv": pv,
            "cpi": ev / ac if ac else None, "spi": ev / pv if pv else None}


def serie(d: Datos) -> list[dict]:
    """Curvas acumuladas mes a mes (la curva S): PV en todo el plan; AC y EV hasta el último mes medido."""
    pv, ac, av = acumulado(d.pv_mes), acumulado(d.ac_mes), acumulado(d.avance_mes)
    return [{"mes": m + 1, "pv": pv[m],
             "ac": ac[m] if m < len(ac) else None,
             "ev": d.bac * av[m] / 100 if m < len(av) else None} for m in range(d.duracion)]


def velocidad(d: Datos, mes: int, desde: int = 1) -> dict:
    """Pronóstico ágil del plazo (enfoque híbrido): velocidad = % de alcance terminado por mes en los meses desde..mes;
    duración = mes + lo que falta ÷ velocidad. Ampliación del portal: el documento usa 6 ÷ SPI."""
    if not 1 <= desde <= mes <= len(d.avance_mes):
        raise ValueError("Tramo fuera de las mediciones disponibles")
    tramo = d.avance_mes[desde - 1:mes]
    v = sum(tramo) / len(tramo)
    falta = 100 - sum(d.avance_mes[:mes])
    return {"mes": mes, "desde": desde, "ventana": "desde el inicio" if desde == 1 else f"meses {desde}–{mes}",
            "velocidad": v, "falta": falta, "duracion": mes + falta / v if v else None}


def burnup(d: Datos) -> list[dict]:
    """Burn-up de la entrega en % del alcance: plan (PV acumulado ÷ BAC) y terminado (avance real acumulado)."""
    pv, av = acumulado(d.pv_mes), acumulado(d.avance_mes)
    return [{"mes": m + 1, "plan": pv[m] / d.bac * 100, "terminado": av[m] if m < len(av) else None}
            for m in range(d.duracion)]


def analizar(d: Datos) -> dict:
    """Todos los cortes disponibles, la curva S y la comparación entre el primero y el último medidos."""
    d.validar()
    cortes = [corte(d, m) for m in range(1, len(d.ac_mes) + 1)]
    return {"cortes": cortes, "serie": serie(d)}
