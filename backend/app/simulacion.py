"""Simulación Monte Carlo del cierre del proyecto a partir de un corte (ampliación del portal, no del enunciado).

Las fórmulas del Tema 5 dan un solo número (EAC, duración ÷ SPI). Aquí se repite el resto del proyecto miles de
veces: cada mes futuro avanza un % y cuesta un importe por punto de avance, ambos sorteados alrededor de lo que se
observó en los meses medidos. El resultado es una distribución: probabilidad de terminar dentro del BAC y dentro
de los seis meses, y percentiles de coste y duración."""
import random
import statistics
import time

from . import evm

MAX_MESES = 36


def _ventana(d: evm.Datos, mes: int, ventana: str) -> tuple[list[float], list[float]]:
    """Meses que sirven de referencia del ritmo: todos hasta el corte o solo los dos últimos."""
    desde = max(0, mes - 2) if ventana == "reciente" else 0
    avance = d.avance_mes[desde:mes]
    coste_pct = [ac / av for ac, av in zip(d.ac_mes[desde:mes], avance) if av > 0]
    return avance, coste_pct


def _percentil(ordenados: list[float], p: float) -> float:
    k = (len(ordenados) - 1) * p
    i = int(k)
    return ordenados[i] if i + 1 >= len(ordenados) else ordenados[i] + (ordenados[i + 1] - ordenados[i]) * (k - i)


def _histograma(valores: list[float], n: int = 24) -> list[dict]:
    lo, hi = min(valores), max(valores)
    ancho = (hi - lo) / n or 1
    cuentas = [0] * n
    for v in valores:
        cuentas[min(n - 1, int((v - lo) / ancho))] += 1
    return [{"desde": lo + i * ancho, "hasta": lo + (i + 1) * ancho, "n": c} for i, c in enumerate(cuentas)]


def simular(d: evm.Datos, mes: int, iteraciones: int = 3000, variabilidad: float = 0.2,
            ventana: str = "todo", semilla: int | None = None) -> dict:
    t0 = time.perf_counter()
    d.validar()
    base = evm.corte(d, mes)
    rng = random.Random(semilla)
    avance, coste_pct = _ventana(d, mes, ventana)
    mu_av, mu_c = statistics.fmean(avance), statistics.fmean(coste_pct)
    # Dispersión: la observada o, si es menor, la variabilidad pedida sobre la media (nunca cero)
    sd_av = max(statistics.pstdev(avance) if len(avance) > 1 else 0, variabilidad * mu_av)
    sd_c = max(statistics.pstdev(coste_pct) if len(coste_pct) > 1 else 0, variabilidad * mu_c)

    costes, duraciones, trayectorias = [], [], []
    for it in range(iteraciones):
        hecho, gasto, meses = base["avance"], base["ac"], float(mes)
        tray = [{"mes": mes, "ev": base["ev"], "ac": base["ac"]}]
        while hecho < 100 - 1e-9 and meses < MAX_MESES:
            av = max(0.5, rng.gauss(mu_av, sd_av))
            c = max(0.0, rng.gauss(mu_c, sd_c))
            fraccion = min(1.0, (100 - hecho) / av)   # el último mes solo se trabaja lo que falta
            hecho += av * fraccion
            gasto += av * fraccion * c
            meses += fraccion
            if it < 40:
                tray.append({"mes": round(meses, 3), "ev": d.bac * min(hecho, 100) / 100, "ac": gasto})
        costes.append(gasto)
        duraciones.append(meses)
        if it < 40:
            trayectorias.append(tray)

    cs, ds = sorted(costes), sorted(duraciones)
    return {
        "mes_corte": mes, "iteraciones": iteraciones, "ventana": ventana, "variabilidad": variabilidad,
        "ritmo": {"avance_medio": mu_av, "avance_sd": sd_av, "coste_por_punto": mu_c, "coste_por_punto_sd": sd_c,
                  "coste_por_punto_plan": d.bac / 100},
        "deterministico": {k: base[k] for k in ("eac_a", "eac_b", "eac_c", "duracion", "cpi", "spi")},
        "coste": {"media": statistics.fmean(cs), "p10": _percentil(cs, .1), "p50": _percentil(cs, .5),
                  "p80": _percentil(cs, .8), "p90": _percentil(cs, .9),
                  "prob_dentro_bac": sum(c <= d.bac for c in cs) / iteraciones, "histograma": _histograma(cs)},
        "duracion": {"media": statistics.fmean(ds), "p10": _percentil(ds, .1), "p50": _percentil(ds, .5),
                     "p80": _percentil(ds, .8), "p90": _percentil(ds, .9),
                     "prob_en_plazo": sum(x <= d.duracion + 1e-9 for x in ds) / iteraciones,
                     "histograma": _histograma(ds)},
        "trayectorias": trayectorias,
        "bac": d.bac, "duracion_plan": d.duracion,
        "duracion_ms": round((time.perf_counter() - t0) * 1000),
    }
