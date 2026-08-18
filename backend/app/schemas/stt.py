from pydantic import BaseModel


class STTResult(BaseModel):
    text: str
    language: str
    duration: float
    model: str