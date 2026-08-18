from app.models.registry import get_tts_model, list_tts_models
from app.utils.audio import audio_to_wav_bytes


class TTSService:
    def generate_speech(self, text: str, model: str, voice: str, speed: float) -> bytes:
        tts_model = get_tts_model(model)
        audio, sample_rate = tts_model.generate(text, voice=voice, speed=speed)
        return audio_to_wav_bytes(audio, sample_rate)

    def get_model_info(self, model: str) -> dict:
        tts_model = get_tts_model(model)
        return {
            "id": model,
            "voices": tts_model.get_voices(),
            "capabilities": tts_model.get_capabilities(),
        }

    def list_models(self) -> list[str]:
        return list_tts_models()


tts_service = TTSService()