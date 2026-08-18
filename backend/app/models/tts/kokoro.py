import re

from app.models.base import TTSModel


def _split_sentences(text: str) -> list[str]:
    """Naive sentence splitter — splits on ., !, ? followed by whitespace."""
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p for p in parts if p]


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

    def _synthesize_one(self, text: str, voice: str, speed: float):
        generator = self._pipeline(text, voice=voice, speed=speed)
        import numpy as np
        chunks = [audio for _, _, audio in generator]
        audio = np.concatenate(chunks) if len(chunks) > 1 else chunks[0]
        return audio, self.SAMPLE_RATE

    def generate(self, text: str, voice: str = "af_heart", speed: float = 1.0):
        if self._pipeline is None:
            self.load()
        return self._synthesize_one(text, voice, speed)

    def generate_stream(self, text: str, voice: str = "af_heart", speed: float = 1.0):
        if self._pipeline is None:
            self.load()

        sentences = _split_sentences(text)
        if not sentences:
            sentences = [text]  # fallback for text with no sentence punctuation

        for sentence in sentences:
            yield self._synthesize_one(sentence, voice, speed)

    def get_voices(self) -> list[str]:
        return self.VOICES

    def get_capabilities(self) -> dict:
        return {
            "speed": True,
            "pitch": False,  # Kokoro does not expose pitch control
            "voices": self.VOICES,
            "sample_rate": self.SAMPLE_RATE,
            "streaming": True,
        }