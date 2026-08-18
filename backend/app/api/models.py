from fastapi import APIRouter

from app.services.tts_service import tts_service

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("")
def list_models():
    return {
        "tts": [tts_service.get_model_info(m) for m in tts_service.list_models()]
    }