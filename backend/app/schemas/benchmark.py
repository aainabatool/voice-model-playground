from pydantic import BaseModel


class TTSBenchmarkResult(BaseModel):
    model: str
    voice: str
    generation_time: float
    audio_duration: float
    rtf: float


class STTBenchmarkResult(BaseModel):
    model: str
    text: str
    language: str
    duration: float
    transcription_time: float
    wer: float | None = None
    cer: float | None = None