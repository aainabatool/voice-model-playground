const API_BASE = "http://localhost:8000";

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