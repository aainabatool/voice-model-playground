from app.models.base import STTModel


class FasterWhisperModel(STTModel):
    """Adapter for the Faster-Whisper STT model."""

    def __init__(self, model_size: str = "tiny"):
        self.model_size = model_size
        self._model = None

    def load(self) -> None:
        if self._model is not None:
            return  # already loaded
        from faster_whisper import WhisperModel
        self._model = WhisperModel(self.model_size, device="cpu", compute_type="int8")

    def transcribe(self, audio_path: str) -> dict:
        if self._model is None:
            self.load()

        segments, info = self._model.transcribe(audio_path)
        text = " ".join(segment.text.strip() for segment in segments)

        return {
            "text": text.strip(),
            "language": info.language,
            "duration": info.duration,
        }

    def get_capabilities(self) -> dict:
        return {
            "model_size": self.model_size,
            "device": "cpu",
        }