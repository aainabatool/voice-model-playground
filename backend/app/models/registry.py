from app.models.tts.kokoro import KokoroModel

# Maps model_id -> model instance. Add new TTS models here as they're built.
TTS_REGISTRY = {
    "kokoro": KokoroModel(),
}


def get_tts_model(model_id: str):
    if model_id not in TTS_REGISTRY:
        raise ValueError(f"Unknown TTS model: {model_id}")
    return TTS_REGISTRY[model_id]


def list_tts_models() -> list[str]:
    return list(TTS_REGISTRY.keys())