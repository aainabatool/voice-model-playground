from abc import ABC, abstractmethod
from typing import Any


class TTSModel(ABC):
    """Base interface all TTS model adapters must implement."""

    @abstractmethod
    def load(self) -> None:
        """Load the model into memory. Called once, lazily, on first use."""
        raise NotImplementedError

    @abstractmethod
    def generate(self, text: str, voice: str, speed: float = 1.0) -> tuple[Any, int]:
        """Generate audio for the given text.

        Returns a tuple of (audio_array, sample_rate).
        """
        raise NotImplementedError

    def generate_stream(self, text: str, voice: str, speed: float = 1.0):
        """Yield (audio_chunk, sample_rate) tuples incrementally.

        Default implementation: no real streaming, just yields the single
        full result from generate(). Subclasses override for true chunking.
        """
        audio, sample_rate = self.generate(text, voice=voice, speed=speed)
        yield audio, sample_rate

    @abstractmethod
    def get_voices(self) -> list[str]:
        """Return the list of voice IDs this model supports."""
        raise NotImplementedError

    @abstractmethod
    def get_capabilities(self) -> dict:
        """Return a dict describing supported controls (e.g. speed, pitch)."""
        raise NotImplementedError


class STTModel(ABC):
    """Base interface all STT model adapters must implement."""

    @abstractmethod
    def load(self) -> None:
        """Load the model into memory. Called once, lazily, on first use."""
        raise NotImplementedError

    @abstractmethod
    def transcribe(self, audio_path: str) -> dict:
        """Transcribe audio at the given file path.

        Returns a dict with at least: text, language, duration.
        """
        raise NotImplementedError

    @abstractmethod
    def get_capabilities(self) -> dict:
        """Return a dict describing supported controls/metadata."""
        raise NotImplementedError