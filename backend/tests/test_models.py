from fastapi.testclient import TestClient

from app.main import app
from app.models.registry import get_tts_model, get_stt_model, list_tts_models, list_stt_models

client = TestClient(app)


def test_list_models_endpoint():
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert "tts" in data
    model_ids = [m["id"] for m in data["tts"]]
    assert "kokoro" in model_ids
    assert "piper" in model_ids


def test_get_tts_model_valid():
    model = get_tts_model("kokoro")
    assert model is not None


def test_get_tts_model_invalid_raises_400():
    import pytest
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        get_tts_model("nonexistent-model")
    assert exc_info.value.status_code == 400


def test_get_stt_model_invalid_raises_400():
    import pytest
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        get_stt_model("nonexistent-model")
    assert exc_info.value.status_code == 400


def test_list_tts_models_includes_registered():
    models = list_tts_models()
    assert "kokoro" in models
    assert "piper" in models


def test_list_stt_models_includes_registered():
    models = list_stt_models()
    assert "faster-whisper" in models