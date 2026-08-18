from fastapi import APIRouter, File, Form, UploadFile

from app.schemas.benchmark import STTBenchmarkResult, TTSBenchmarkResult
from app.schemas.tts import TTSGenerateRequest
from app.services.stt_service import stt_service
from app.services.tts_service import tts_service

router = APIRouter(prefix="/api/benchmark", tags=["benchmark"])


@router.post("/tts", response_model=TTSBenchmarkResult)
def benchmark_tts(request: TTSGenerateRequest):
    result = tts_service.generate_speech_with_metrics(
        text=request.text,
        model=request.model,
        voice=request.voice,
        speed=request.speed,
    )
    # wav_bytes isn't part of the response schema — this endpoint reports
    # metrics only; use /api/tts/generate to get the actual audio
    return {
        "model": result["model"],
        "voice": result["voice"],
        "generation_time": result["generation_time"],
        "audio_duration": result["audio_duration"],
        "rtf": result["rtf"],
    }


@router.post("/stt", response_model=STTBenchmarkResult)
async def benchmark_stt(
    file: UploadFile = File(...),
    model: str = Form("faster-whisper"),
    reference_text: str | None = Form(None),
):
    audio_bytes = await file.read()
    result = stt_service.transcribe_with_metrics(
        audio_bytes, model=model, filename=file.filename, reference_text=reference_text
    )
    return result