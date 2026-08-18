import { useState, useEffect, useRef } from "react";
import { fetchModels, generateSpeech, transcribeAudio, benchmarkTTS, streamSpeech } from "./services/api";
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

  const [benchmarkResults, setBenchmarkResults] = useState([]);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState(null);

  const [streamText, setStreamText] = useState(
    "The future of AI is voice. This is a streaming test. Each sentence arrives as its own chunk. This proves incremental delivery works."
  );
  const [streamChunks, setStreamChunks] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const playingRef = useRef(false);

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

  async function handleCompareModels() {
    setBenchmarkLoading(true);
    setBenchmarkError(null);
    setBenchmarkResults([]);
    try {
      const results = [];
      for (const m of models) {
        const result = await benchmarkTTS({
          text,
          model: m.id,
          voice: m.voices[0],
          speed: 1.0,
        });
        results.push(result);
      }
      setBenchmarkResults(results);
    } catch (err) {
      setBenchmarkError(err.message);
    } finally {
      setBenchmarkLoading(false);
    }
  }

  function playNextInQueue() {
    if (playingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;

    playingRef.current = true;
    if (audioRef.current) {
      audioRef.current.src = next;
      audioRef.current.play();
    }
  }

  function handleAudioEnded() {
    playingRef.current = false;
    playNextInQueue();
  }

  function handleStream() {
    setStreaming(true);
    setStreamError(null);
    setStreamChunks([]);
    queueRef.current = [];
    playingRef.current = false;

    streamSpeech({
      text: streamText,
      model,
      voice,
      speed,
      onChunk: (url) => {
        setStreamChunks((prev) => [...prev, url]);
        queueRef.current.push(url);
        playNextInQueue();
      },
      onDone: () => {
        setStreaming(false);
      },
      onError: (message) => {
        setStreamError(message);
        setStreaming(false);
      },
    });
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

      <hr style={{ margin: "2rem 0" }} />

      <h2>Compare Models</h2>
      <p>Runs the text above through every available TTS engine and compares speed.</p>
      <button onClick={handleCompareModels} disabled={benchmarkLoading || !text.trim()}>
        {benchmarkLoading ? "Benchmarking..." : "Compare Models"}
      </button>

      {benchmarkError && <p className="error">{benchmarkError}</p>}

      {benchmarkResults.length > 0 && (
        <table style={{ marginTop: "1rem", borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #555" }}>Model</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #555" }}>Gen Time (s)</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #555" }}>Audio Duration (s)</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #555" }}>RTF</th>
            </tr>
          </thead>
          <tbody>
            {benchmarkResults.map((r) => (
              <tr key={r.model}>
                <td>{r.model}</td>
                <td>{r.generation_time.toFixed(3)}</td>
                <td>{r.audio_duration.toFixed(2)}</td>
                <td>{r.rtf.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <hr style={{ margin: "2rem 0" }} />

      <h2>Streaming (WebSocket)</h2>
      <p>Text is split into sentences and streamed as separate audio chunks, playing back-to-back as they arrive.</p>
      <textarea
        value={streamText}
        onChange={(e) => setStreamText(e.target.value)}
        rows={3}
        placeholder="Enter text to stream..."
      />
      <br />
      <button onClick={handleStream} disabled={streaming || !streamText.trim()}>
        {streaming ? "Streaming..." : "Start Streaming"}
      </button>

      {streamError && <p className="error">{streamError}</p>}

      <audio ref={audioRef} onEnded={handleAudioEnded} style={{ marginTop: "1rem" }} />

      {streamChunks.length > 0 && (
        <p style={{ marginTop: "0.5rem" }}>
          Chunks received: {streamChunks.length}
        </p>
      )}
    </div>
  );
}

export default App;