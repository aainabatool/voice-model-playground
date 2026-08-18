import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import benchmark, models, stt, tts, ws_tts
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice_model_playground")

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tts.router)
app.include_router(stt.router)
app.include_router(benchmark.router)
app.include_router(models.router)
app.include_router(ws_tts.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Check server logs for details."},
    )


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.app_name}