import tempfile
from pathlib import Path

from app.models.registry import get_stt_model, list_stt_models


class STTService:
    def transcribe(self, audio_bytes: bytes, model: str, filename: str) -> dict:
        stt_model = get_stt_model(model)

        # Faster-Whisper reads from a file path, so we write the upload to a temp file
        suffix = Path(filename).suffix or ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            result = stt_model.transcribe(tmp_path)
        finally:
            Path(tmp_path).unlink(missing_ok=True)  # clean up temp file regardless of outcome

        result["model"] = model
        return result

    def list_models(self) -> list[str]:
        return list_stt_models()


stt_service = STTService()