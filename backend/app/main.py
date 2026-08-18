from fastapi import FastAPI

from app.api import models, tts
from app.core.config import settings

app = FastAPI(title=settings.app_name)

app.include_router(tts.router)
app.include_router(models.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.app_name}