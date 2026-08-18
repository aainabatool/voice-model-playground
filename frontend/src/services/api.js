const API_BASE = "http://localhost:8000";
const WS_BASE = "ws://localhost:8000";

export async function fetchModels() {
  const res = await fetch(`${API_BASE}/api/models`);
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

export async function generateSpeech({ text, model, voice, speed }) {
  const res = await fetch(`${API_BASE}/api/tts/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, model, voice, speed }),
  });
  if (!res.ok) throw new Error("TTS generation failed");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function transcribeAudio(file, model = "faster-whisper") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", model);

  const res = await fetch(`${API_BASE}/api/stt/transcribe`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Transcription failed");
  return res.json();
}

export async function benchmarkTTS({ text, model, voice, speed }) {
  const res = await fetch(`${API_BASE}/api/benchmark/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, model, voice, speed }),
  });
  if (!res.ok) throw new Error("TTS benchmark failed");
  return res.json();
}

/**
 * Streams TTS audio over a WebSocket, calling onChunk(url) for each
 * audio chunk as it arrives, and onDone() when the stream finishes.
 * Returns a function to close the connection early if needed.
 */
export function streamSpeech({ text, model, voice, speed, onChunk, onDone, onError }) {
  const ws = new WebSocket(`${WS_BASE}/ws/tts`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ text, model, voice, speed }));
  };

  ws.onmessage = (event) => {
    if (typeof event.data === "string") {
      const data = JSON.parse(event.data);
      if (data.event === "done") {
        onDone();
        ws.close();
      } else if (data.event === "error") {
        onError(data.message);
        ws.close();
      }
    } else {
      // Binary chunk (Blob in browser WebSocket API)
      const url = URL.createObjectURL(event.data);
      onChunk(url);
    }
  };

  ws.onerror = () => {
    onError("WebSocket connection error");
  };

  return () => ws.close();
}