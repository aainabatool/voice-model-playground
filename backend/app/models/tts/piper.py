import wave
import io
import re
from pathlib import Path

from app.models.base import TTSModel

VOICES_DIR = Path("piper_voices")


def _split_sentences(text: str) -> list[str]:
    """Naive sentence splitter — splits on ., !, ? followed by whitespace."""
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p for p in parts if p]


class PiperModel(TTSModel):
    """Adapter for Piper neural TTS voices."""

    # voice_id -> display sample rate (Piper voices are typically 22050Hz)
    VOICES = {
        "en_US-lessac-medium": 22050,
    }

    def __init__(self):
        self._loaded_voices = {}  # voice_id -> PiperVoice instance

    def load(self, voice_id: str = "en_US-lessac-medium") -> None:
        if voice_id in self._loaded_voices:
            return  # already loaded

        from piper import PiperVoice
        from piper.download_voices import download_voice

        VOICES_DIR.mkdir(exist_ok=True)
        model_path = VOICES_DIR / f"{voice_id}.onnx"
        if not model_path.exists():
            download_voice(voice_id, VOICES_DIR)

        self._loaded_voices[voice_id] = PiperVoice.load(str(model_path))

    def _synthesize_one(self, text: str, voice: str, speed: float):
        piper_voice = self._loaded_voices[voice]

        from piper import SynthesisConfig

        syn_config = SynthesisConfig(length_scale=1.0 / speed if speed else 1.0)

        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav_file:
            piper_voice.synthesize_wav(text, wav_file, syn_config=syn_config)

        buffer.seek(0)
        with wave.open(buffer, "rb") as wav_file:
            sample_rate = wav_file.getframerate()
            n_frames = wav_file.getnframes()
            raw_audio = wav_file.readframes(n_frames)

        import numpy as np
        audio = np.frombuffer(raw_audio, dtype=np.int16)
        return audio, sample_rate

    def generate(self, text: str, voice: str = "en_US-lessac-medium", speed: float = 1.0):
        if voice not in self._loaded_voices:
            self.load(voice)
        return self._synthesize_one(text, voice, speed)

    def generate_stream(self, text: str, voice: str = "en_US-lessac-medium", speed: float = 1.0):
        if voice not in self._loaded_voices:
            self.load(voice)

        sentences = _split_sentences(text)
        if not sentences:
            sentences = [text]  # fallback for text with no sentence punctuation

        for sentence in sentences:
            yield self._synthesize_one(sentence, voice, speed)

    def get_voices(self) -> list[str]:
        return list(self.VOICES.keys())

    def get_capabilities(self) -> dict:
        return {
            "speed": True,
            "pitch": False,
            "voices": self.get_voices(),
            "sample_rate": 22050,
            "streaming": True,
        }