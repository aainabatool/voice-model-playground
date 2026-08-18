import tempfile
from pathlib import Path

from app.models.registry import get_stt_model, list_stt_models
from app.utils.benchmark import compute_wer_cer, timer


class STTService:
    def transcribe(self, audio_bytes: bytes, model: str, filename: str) -> dict:
        stt_model = get_stt_model(model)

        suffix = Path(filename).suffix or ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            result = stt_model.transcribe(tmp_path)
        finally:
            Path(tmp_path).unlink(missing_ok=True)

        result["model"] = model
        return result

    def transcribe_with_metrics(
        self, audio_bytes: bytes, model: str, filename: str, reference_text: str | None = None
    ) -> dict:
        stt_model = get_stt_model(model)

        suffix = Path(filename).suffix or ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            with timer() as t:
                result = stt_model.transcribe(tmp_path)
        finally:
            Path(tmp_path).unlink(missing_ok=True)

        result["model"] = model
        result["transcription_time"] = t.elapsed

        if reference_text:
            result.update(compute_wer_cer(reference_text, result["text"]))

        return result

    def list_models(self) -> list[str]:
        return list_stt_models()


stt_service = STTService()