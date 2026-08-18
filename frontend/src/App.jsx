import { useState, useEffect } from "react";
import { fetchModels, generateSpeech } from "./services/api";
import "./App.css";

function App() {
  const [text, setText] = useState("The future of AI is voice.");
  const [voices, setVoices] = useState([]);
  const [voice, setVoice] = useState("af_heart");
  const [speed, setSpeed] = useState(1.0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModels()
      .then((data) => {
        const kokoro = data.tts.find((m) => m.id === "kokoro");
        if (kokoro) setVoices(kokoro.voices);
      })
      .catch((err) => setError(err.message));
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const url = await generateSpeech({ text, model: "kokoro", voice, speed });
      setAudioUrl(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="playground">
      <h1>Voice Playground</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Enter text to synthesize..."
      />

      <div className="controls">
        <label>
          Voice
          <select value={voice} onChange={(e) => setVoice(e.target.value)}>
            {voices.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label>
          Speed: {speed.toFixed(1)}x
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
        </label>
      </div>

      <button onClick={handleGenerate} disabled={loading || !text.trim()}>
        {loading ? "Generating..." : "Generate"}
      </button>

      {error && <p className="error">{error}</p>}

      {audioUrl && (
        <audio controls src={audioUrl} style={{ marginTop: "1rem" }} />
      )}
    </div>
  );
}

export default App;