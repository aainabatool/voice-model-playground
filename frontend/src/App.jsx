import { useState, useEffect } from "react";
import { fetchModels, generateSpeech, transcribeAudio } from "./services/api";
import "./App.css";

function App() {
  const [text, setText] = useState("The future of AI is voice.");
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("kokoro");
  const [voice, setVoice] = useState("af_heart");
  const [speed, setSpeed] = useState(1.0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sttFile, setSttFile] = useState(null);
  const [sttResult, setSttResult] = useState(null);
  const [sttLoading, setSttLoading] = useState(false);
  const [sttError, setSttError] = useState(null);

  useEffect(() => {
    fetchModels()
      .then((data) => {
        setModels(data.tts);
        if (data.tts.length > 0) {
          setModel(data.tts[0].id);
          setVoice(data.tts[0].voices[0]);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const currentModel = models.find((m) => m.id === model);
  const voices = currentModel ? currentModel.voices : [];

  function handleModelChange(newModelId) {
    setModel(newModelId);
    const found = models.find((m) => m.id === newModelId);
    if (found && found.voices.length > 0) {
      setVoice(found.voices[0]);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const url = await generateSpeech({ text, model, voice, speed });
      setAudioUrl(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTranscribe() {
    if (!sttFile) return;
    setSttLoading(true);
    setSttError(null);
    try {
      const result = await transcribeAudio(sttFile);
      setSttResult(result);
    } catch (err) {
      setSttError(err.message);
    } finally {
      setSttLoading(false);
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
          Model
          <select value={model} onChange={(e) => handleModelChange(e.target.value)}>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id}
              </option>
            ))}
          </select>
        </label>

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

      <hr style={{ margin: "2rem 0" }} />

      <h2>Speech to Text</h2>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setSttFile(e.target.files[0])}
      />
      <button onClick={handleTranscribe} disabled={sttLoading || !sttFile}>
        {sttLoading ? "Transcribing..." : "Transcribe"}
      </button>

      {sttError && <p className="error">{sttError}</p>}

      {sttResult && (
        <div style={{ marginTop: "1rem" }}>
          <p><strong>Text:</strong> {sttResult.text}</p>
          <p><strong>Language:</strong> {sttResult.language}</p>
          <p><strong>Duration:</strong> {sttResult.duration.toFixed(2)}s</p>
        </div>
      )}
    </div>
  );
}

export default App;