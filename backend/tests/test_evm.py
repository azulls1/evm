"""El motor del portal debe dar exactamente las cifras del documento (fuente/calculos.py, aritmética exacta)."""
import pytest

import calculos as K
from app import evm


@pytest.mark.parametrize("mes", [1, 2, 3, 4, 5])
def test_coincide_con_la_fuente_del_documento(datos, mes):
    a, b = evm.corte(datos, mes), K.corte(mes)
    for k in ("pv", "ac", "ev", "cv", "sv", "cpi", "spi", "eac_a", "eac_b", "eac_c", "tcpi", "duracion"):
        assert a[k] == pytest.approx(float(b[k]), rel=1e-12), k


def test_parte_a_mes_3(datos):
    k = evm.corte(datos, 3)
    assert k["ev"] == 42_550 and k["eac_a"] == 130_450
    assert round(k["cpi"], 3) == 0.734 and k["coste"] == "por encima del presupuesto"
    assert round(k["spi"], 3) == 0.788 and k["plazo"] == "retrasado"
    assert round(k["duracion"], 2) == 7.61


def test_parte_b_mes_5(datos):
    k = evm.corte(datos, 5)
    assert k["ev"] == 92_000 and k["eac_a"] == 122_000
    assert round(k["cpi"], 3) == 0.929 and round(k["spi"], 3) == 0.989
    assert round(k["duracion"], 2) == 6.07


def test_medidas_del_mes_3_positivas(datos):
    p = evm.periodo(datos, 4, 5)
    assert (p["ev"], p["ac"], p["pv"]) == (49_450, 41_000, 39_000)
    assert p["cpi"] > 1 and p["spi"] > 1


def test_curva_s(datos):
    s = evm.serie(datos)
    assert len(s) == 6 and s[-1]["pv"] == 115_000 and s[-1]["ac"] is None and s[4]["ev"] == 92_000


@pytest.mark.parametrize("cambio, mensaje", [
    ({"pv_mes": [1, 2, 3, 4, 5, 6]}, "BAC"),
    ({"avance_mes": [50, 30, 20, 10, 5]}, "100"),
    ({"ac_mes": [1, 2, 3]}, "mismo número"),
])
def test_valida_escenarios_incoherentes(datos, cambio, mensaje):
    x = {**datos.__dict__, **cambio}
    with pytest.raises(ValueError, match=mensaje):
        evm.Datos(**x).validar()


@pytest.mark.parametrize("mes, desde", [(3, 1), (3, 2), (5, 1), (5, 4)])
def test_velocidad_coincide_con_la_fuente(datos, mes, desde):
    a, b = evm.velocidad(datos, mes, desde), K.por_velocidad(mes, desde)
    assert a["velocidad"] == pytest.approx(float(b["velocidad"]), rel=1e-12)
    assert a["duracion"] == pytest.approx(float(b["duracion"]), rel=1e-12)


def test_enfoque_hibrido_pronosticos(datos):
    # Con la velocidad de los meses 4–5 el proyecto cerraría antes de los seis meses; con la media, algo después
    assert round(evm.velocidad(datos, 5, 4)["duracion"], 2) == 5.93
    assert evm.velocidad(datos, 5, 1)["duracion"] == 6.25
    assert round(evm.velocidad(datos, 3, 1)["duracion"], 2) == 8.11


def test_burnup(datos):
    b = evm.burnup(datos)
    assert len(b) == 6 and b[0]["plan"] == 20 and b[-1]["plan"] == 100
    assert [x["terminado"] for x in b] == [8, 23, 37, 58, 80, None]
