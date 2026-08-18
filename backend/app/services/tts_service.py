from app.models.registry import get_tts_model, list_tts_models
from app.utils.audio import audio_to_wav_bytes
from app.utils.benchmark import compute_rtf, timer


class TTSService:
    def generate_speech(self, text: str, model: str, voice: str, speed: float) -> bytes:
        tts_model = get_tts_model(model)
        audio, sample_rate = tts_model.generate(text, voice=voice, speed=speed)
        return audio_to_wav_bytes(audio, sample_rate)

    def generate_speech_with_metrics(self, text: str, model: str, voice: str, speed: float) -> dict:
        tts_model = get_tts_model(model)

        with timer() as t:
            audio, sample_rate = tts_model.generate(text, voice=voice, speed=speed)

        audio_duration = len(audio) / sample_rate
        wav_bytes = audio_to_wav_bytes(audio, sample_rate)

        return {
            "wav_bytes": wav_bytes,
            "generation_time": t.elapsed,
            "audio_duration": audio_duration,
            "rtf": compute_rtf(t.elapsed, audio_duration),
            "model": model,
            "voice": voice,
        }

    def generate_speech_stream(self, text: str, model: str, voice: str, speed: float):
        """Yield WAV-encoded audio chunks incrementally as they're generated."""
        tts_model = get_tts_model(model)
        for audio, sample_rate in tts_model.generate_stream(text, voice=voice, speed=speed):
            yield audio_to_wav_bytes(audio, sample_rate)

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