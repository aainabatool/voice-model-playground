from fastapi import HTTPException

from app.models.stt.whisper import FasterWhisperModel
from app.models.tts.kokoro import KokoroModel
from app.models.tts.piper import PiperModel

# Maps model_id -> model instance. Add new TTS models here as they're built.
TTS_REGISTRY = {
    "kokoro": KokoroModel(),
    "piper": PiperModel(),
}

STT_REGISTRY = {
    "faster-whisper": FasterWhisperModel(model_size="tiny"),
}


def get_tts_model(model_id: str):
    if model_id not in TTS_REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown TTS model '{model_id}'. Available: {list(TTS_REGISTRY.keys())}",
        )
    return TTS_REGISTRY[model_id]


def list_tts_models() -> list[str]:
    return list(TTS_REGISTRY.keys())


def get_stt_model(model_id: str):
    if model_id not in STT_REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown STT model '{model_id}'. Available: {list(STT_REGISTRY.keys())}",
        )
    return STT_REGISTRY[model_id]


def list_stt_models() -> list[str]:
    return list(STT_REGISTRY.keys())