"""Cada requisito del enunciado y la rúbrica se comprueba contra el contenido y el .docx/.pdf entregados."""


def test_todos_los_requisitos_se_cumplen(sin_base):
    from app import cumplimiento
    req = cumplimiento.requisitos()
    fallan = [(q["id"], q["evidencia"]) for q in req if not q["cumplido"]]
    assert not fallan, fallan
    ids = {q["id"] for q in req}
    assert {f"A.{i}" for i in range(1, 6)} <= ids and {f"B.{i}" for i in range(1, 6)} <= ids
    assert {"C3.1", "C3.2", "C3.3", "D.1"} <= ids


def test_detecta_una_respuesta_equivocada(sin_base, contenido, monkeypatch):
    from app import consultas, cumplimiento
    contenido["partes"]["A"]["preguntas"][0]["respuesta"] = "Por debajo. CPI = 1,200."
    monkeypatch.setattr(consultas, "contenido", lambda: contenido)
    a1 = next(q for q in cumplimiento.requisitos() if q["id"] == "A.1")
    assert not a1["cumplido"]
