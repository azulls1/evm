from app import simulacion


def test_reproducible_con_semilla(datos):
    a = simulacion.simular(datos, 3, iteraciones=800, semilla=7)
    b = simulacion.simular(datos, 3, iteraciones=800, semilla=7)
    assert a["coste"]["p50"] == b["coste"]["p50"] and a["duracion"]["p80"] == b["duracion"]["p80"]


def test_distribuciones_coherentes(datos):
    r = simulacion.simular(datos, 3, iteraciones=2000, semilla=1)
    c, d = r["coste"], r["duracion"]
    assert c["p10"] <= c["p50"] <= c["p80"] <= c["p90"] and d["p10"] <= d["p50"] <= d["p90"]
    assert 0 <= c["prob_dentro_bac"] <= 1 and 0 <= d["prob_en_plazo"] <= 1
    assert sum(h["n"] for h in c["histograma"]) == 2000
    assert all(c >= r["deterministico"]["eac_a"] * 0.5 for c in (c["p10"],))  # nunca por debajo de lo ya gastado
    assert c["p10"] >= 58_000


def test_al_mes_5_es_mas_probable_terminar_en_plazo(datos):
    m3 = simulacion.simular(datos, 3, iteraciones=3000, semilla=3)
    m5 = simulacion.simular(datos, 5, iteraciones=3000, semilla=3)
    assert m5["duracion"]["prob_en_plazo"] > m3["duracion"]["prob_en_plazo"]
    assert m5["coste"]["p50"] < m3["coste"]["p50"]


def test_ventana_reciente_refleja_las_medidas(datos):
    """Con solo los meses 4–5 como referencia, el ritmo es mejor que con todo el historial."""
    todo = simulacion.simular(datos, 5, iteraciones=1500, semilla=2, ventana="todo")
    reciente = simulacion.simular(datos, 5, iteraciones=1500, semilla=2, ventana="reciente")
    assert reciente["ritmo"]["coste_por_punto"] < todo["ritmo"]["coste_por_punto"]
    assert reciente["ritmo"]["avance_medio"] > todo["ritmo"]["avance_medio"]
