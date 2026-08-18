from app.models.base import TTSModel


class KokoroModel(TTSModel):
    """Adapter for the Kokoro-82M TTS model."""

    SAMPLE_RATE = 24000

    # Kokoro's American-English voice pack (subset — extend as needed)
    VOICES = [
        "af_heart", "af_bella", "af_nicole", "af_sarah",
        "am_adam", "am_michael",
    ]

    def __init__(self):
        self._pipeline = None

    def load(self) -> None:
        if self._pipeline is not None:
            return  # already loaded
        from kokoro import KPipeline
        self._pipeline = KPipeline(lang_code="a")

    def generate(self, text: str, voice: str = "af_heart", speed: float = 1.0):
        if self._pipeline is None:
            self.load()

        generator = self._pipeline(text, voice=voice, speed=speed)
        # Kokoro yields per-chunk audio; concatenate for a single response
        import numpy as np
        chunks = [audio for _, _, audio in generator]
        audio = np.concatenate(chunks) if len(chunks) > 1 else chunks[0]
        return audio, self.SAMPLE_RATE

    def get_voices(self) -> list[str]:
        return self.VOICES

    def get_capabilities(self) -> dict:
        return {
            "speed": True,
            "pitch": False,  # Kokoro does not expose pitch control
            "voices": self.VOICES,
            "sample_rate": self.SAMPLE_RATE,
        }