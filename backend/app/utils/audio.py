import io

import soundfile as sf


def audio_to_wav_bytes(audio, sample_rate: int) -> bytes:
    """Encode a numpy audio array as in-memory WAV bytes."""
    buffer = io.BytesIO()
    sf.write(buffer, audio, sample_rate, format="WAV")
    buffer.seek(0)
    return buffer.read()