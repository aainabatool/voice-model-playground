from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.tts_service import tts_service

router = APIRouter(tags=["tts-streaming"])


@router.websocket("/ws/tts")
async def tts_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            request = await websocket.receive_json()
            text = request.get("text", "")
            model = request.get("model", "kokoro")
            voice = request.get("voice", "af_heart")
            speed = request.get("speed", 1.0)

            try:
                for wav_chunk in tts_service.generate_speech_stream(text, model, voice, speed):
                    await websocket.send_bytes(wav_chunk)
                await websocket.send_json({"event": "done"})
            except Exception as exc:
                await websocket.send_json({"event": "error", "message": str(exc)})

    except WebSocketDisconnect:
        pass