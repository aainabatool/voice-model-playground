from pydantic import BaseModel, Field


class TTSGenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    model: str = "kokoro"
    voice: str = "af_heart"
    speed: float = Field(1.0, ge=0.5, le=2.0)


class ModelInfo(BaseModel):
    id: str
    voices: list[str]
    capabilities: dict