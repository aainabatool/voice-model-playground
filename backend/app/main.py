from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import models, stt, tts
from app.core.config import settings

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tts.router)
app.include_router(stt.router)
app.include_router(models.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.app_name}