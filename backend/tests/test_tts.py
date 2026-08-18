from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_generate_speech_kokoro_returns_valid_wav():
    response = client.post(
        "/api/tts/generate",
        json={"text": "Hello world.", "model": "kokoro", "voice": "af_heart", "speed": 1.0},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
    # A real WAV file starts with the RIFF header
    assert response.content[:4] == b"RIFF"
    assert len(response.content) > 1000  # sanity check: not an empty/tiny file


def test_generate_speech_invalid_model_returns_400():
    response = client.post(
        "/api/tts/generate",
        json={"text": "Hello world.", "model": "nonexistent", "voice": "af_heart", "speed": 1.0},
    )
    assert response.status_code == 400
    assert "Unknown TTS model" in response.json()["detail"]


def test_generate_speech_empty_text_returns_422():
    response = client.post(
        "/api/tts/generate",
        json={"text": "", "model": "kokoro", "voice": "af_heart", "speed": 1.0},
    )
    # Pydantic's min_length=1 constraint should reject this before it hits the model
    assert response.status_code == 422