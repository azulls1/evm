"""Las pruebas no usan base de datos: el contenido sale de fuente/contenido.json (lo genera scripts/generar_semilla.py)
y los entregables de dev/entregables (los arma scripts/preparar_entregables.py)."""
import json
import sys
from pathlib import Path

import pytest

DEV = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(DEV / "backend"))
sys.path.insert(0, str(DEV / "fuente"))


@pytest.fixture
def contenido():
    return json.loads((DEV / "fuente" / "contenido.json").read_text(encoding="utf-8"))


@pytest.fixture
def datos(contenido):
    from app import evm
    x = contenido["datos"]
    return evm.Datos(x["bac"], x["duracion"], x["pv_mes"], x["ac_mes"], x["avance_mes"])


@pytest.fixture
def sin_base(monkeypatch, contenido):
    """consultas.contenido() devuelve el JSON local y los entregables se leen de dev/entregables."""
    from app import config, consultas
    monkeypatch.setattr(consultas, "contenido", lambda: contenido)
    monkeypatch.setenv("ENTREGABLES_DIR", str(DEV / "entregables"))
    config.config.cache_clear()
    yield
    config.config.cache_clear()
