from fastapi import APIRouter
from fastapi.responses import Response

from app.schemas.tts import TTSGenerateRequest
from app.services.tts_service import tts_service

router = APIRouter(prefix="/api/tts", tags=["tts"])


@router.post("/generate")
def generate_speech(request: TTSGenerateRequest):
    wav_bytes = tts_service.generate_speech(
        text=request.text,
        model=request.model,
        voice=request.voice,
        speed=request.speed,
    )
    return Response(content=wav_bytes, media_type="audio/wav")