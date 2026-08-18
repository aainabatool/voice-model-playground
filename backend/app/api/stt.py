from fastapi import APIRouter, File, Form, UploadFile

from app.schemas.stt import STTResult
from app.services.stt_service import stt_service

router = APIRouter(prefix="/api/stt", tags=["stt"])


@router.post("/transcribe", response_model=STTResult)
async def transcribe_audio(
    file: UploadFile = File(...),
    model: str = Form("faster-whisper"),
):
    audio_bytes = await file.read()
    result = stt_service.transcribe(audio_bytes, model=model, filename=file.filename)
    return result