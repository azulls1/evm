# -*- coding: utf-8 -*-
"""Cálculos de valor ganado (EVM) de la Actividad 2 individual (MDGP).
Fuente única de cifras: de aquí las toman contenido.py, el documento y el portal.
Fórmulas del Tema 5, apartado 5.9 (Tablas 9 a 12). Uso: python3 fuente/calculos.py"""
from fractions import Fraction as F

BAC = 115_000
DURACION_PLAN = 6  # meses
PV_MES = [23_000, 15_000, 16_000, 19_000, 20_000, 22_000]
AC_MES = [21_000, 18_000, 19_000, 20_000, 21_000]
AVANCE_MES = [8, 15, 14, 21, 22]  # % de trabajo realizado en cada mes (no acumulado)


def acumulado(v):
    s, r = 0, []
    for x in v:
        s += x; r.append(s)
    return r


PV_ACUM, AC_ACUM, AVANCE_ACUM = acumulado(PV_MES), acumulado(AC_MES), acumulado(AVANCE_MES)
assert PV_ACUM[-1] == BAC and AVANCE_ACUM[2] == 37 and AVANCE_ACUM[4] == 80


def corte(mes):
    """Indicadores EVM acumulados al cierre del mes indicado (1..5)."""
    i = mes - 1
    pv, ac = PV_ACUM[i], AC_ACUM[i]
    ev = F(BAC * AVANCE_ACUM[i], 100)          # EV = BAC × % de avance real acumulado
    cpi, spi = ev / ac, ev / pv                 # CPI = EV / AC ; SPI = EV / PV
    return {
        "mes": mes, "pv": pv, "ac": ac, "avance": AVANCE_ACUM[i], "ev": ev,
        "cv": ev - ac, "sv": ev - pv, "cpi": cpi, "spi": spi,
        "eac_a": ac + (BAC - ev),               # a) según presupuesto original  ← la que pide la pregunta 3
        "eac_b": BAC / cpi,                     # b) según CPI actual
        "eac_c": ac + (BAC - ev) / (cpi * spi), # c) considerando CPI y SPI
        "tcpi": (BAC - ev) / (BAC - ac),        # TCPI respecto al BAC
        "duracion": DURACION_PLAN / spi,        # proyección habitual: duración plan ÷ SPI
    }


def periodo(desde, hasta):
    """Desempeño solo de los meses desde..hasta (para juzgar las medidas del mes 3)."""
    ev = F(BAC * sum(AVANCE_MES[desde - 1:hasta]), 100)
    ac, pv = sum(AC_MES[desde - 1:hasta]), sum(PV_MES[desde - 1:hasta])
    return {"ev": ev, "ac": ac, "pv": pv, "cpi": ev / ac, "spi": ev / pv}


def por_velocidad(mes, desde=1):
    """Pronóstico ágil del plazo (enfoque híbrido): velocidad = % de avance terminado por mes (dos iteraciones de
    dos semanas) en los meses desde..mes; lo que falta se divide entre esa velocidad. Ampliación del portal."""
    tramo = AVANCE_MES[desde - 1:mes]
    v = F(sum(tramo), len(tramo))
    falta = 100 - AVANCE_ACUM[mes - 1]
    return {"mes": mes, "desde": desde, "velocidad": v, "falta": falta, "duracion": mes + falta / v}


def burnup():
    """Burn-up de la entrega en % del alcance: plan (PV acumulado ÷ BAC) y terminado (avance real acumulado)."""
    return [{"mes": m + 1, "plan": F(PV_ACUM[m] * 100, BAC),
             "terminado": AVANCE_ACUM[m] if m < len(AVANCE_ACUM) else None} for m in range(DURACION_PLAN)]


A, B = corte(3), corte(5)
P45 = periodo(4, 5)
# Pronósticos por velocidad: media desde el inicio y reciente (últimos dos meses = cuatro iteraciones)
VEL = {(3, 1): por_velocidad(3, 1), (3, 2): por_velocidad(3, 2), (5, 1): por_velocidad(5, 1), (5, 4): por_velocidad(5, 4)}


def mx(x, dec=0):
    """Formato de pesos: $130 450, con espacio de no separación para que la cifra no se parta entre renglones."""
    s = f"{abs(float(x)):,.{dec}f}".replace(",", "\u00a0")
    return ("−$" if x < 0 else "$") + s


def r(x, dec=3):
    return f"{float(x):.{dec}f}".replace(".", ",")


if __name__ == "__main__":
    for t, c in (("PARTE A — mes 3", A), ("PARTE B — mes 5", B)):
        print(f"\n{t}")
        print(f"  PV={mx(c['pv'])}  AC={mx(c['ac'])}  avance={c['avance']} %  EV={mx(c['ev'])}")
        print(f"  CV={mx(c['cv'])}  CPI={r(c['cpi'],4)}   SV={mx(c['sv'])}  SPI={r(c['spi'],4)}")
        print(f"  EAC a)={mx(c['eac_a'])}  b)={mx(c['eac_b'])}  c)={mx(c['eac_c'])}  TCPI={r(c['tcpi'],4)}")
        print(f"  Duración estimada = 6 / SPI = {r(c['duracion'],2)} meses  (desvío {r(c['duracion']-6,2)} meses ≈ {r((c['duracion']-6)*30,1)} días)")
    for (m, d), v in VEL.items():
        print(f"Velocidad mes {m} (meses {d}–{m}): {r(v['velocidad'],2)} %/mes → {r(v['duracion'],2)} meses")
    print(f"\nSolo meses 4–5: EV={mx(P45['ev'])} AC={mx(P45['ac'])} PV={mx(P45['pv'])}  CPI={r(P45['cpi'],3)}  SPI={r(P45['spi'],3)}")
