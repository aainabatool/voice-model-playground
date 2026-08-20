import { useState, useEffect, useRef } from "react";
import { fetchModels, generateSpeech, transcribeAudio, benchmarkTTS, streamSpeech } from "./services/api";
import "./App.css";

const MODEL_COLORS = {
  kokoro: "var(--kokoro)",
  piper: "var(--piper)",
};

function App() {
  const [connected, setConnected] = useState(true);

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
    "The future of AI is voice. Each sentence arrives as its own chunk."
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
        setConnected(true);
        if (data.tts.length > 0) {
          setModel(data.tts[0].id);
          setVoice(data.tts[0].voices[0]);
        }
      })
      .catch((err) => {
        setError(err.message);
        setConnected(false);
      });
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
        const result = await benchmarkTTS({ text, model: m.id, voice: m.voices[0], speed: 1.0 });
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
      onDone: () => setStreaming(false),
      onError: (message) => {
        setStreamError(message);
        setStreaming(false);
      },
    });
  }

  const maxSpeedScore =
    benchmarkResults.length > 0
      ? Math.max(...benchmarkResults.map((r) => 1 / r.rtf))
      : 1;

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo-mark">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 3v18M7 7v10M17 7v10M3 10v4M21 10v4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="brand-name">Voice Model Playground</div>
            <div className="brand-tag">Text-to-Speech &amp; Speech-to-Text Benchmarking</div>
          </div>
        </div>
        <div className="status">
          <span className={`status-dot ${connected ? "" : "offline"}`}></span>
          {connected ? "Backend connected" : "Backend unreachable"}
        </div>
      </header>

      <p className="intro">
        A local-first platform for comparing text-to-speech and speech-to-text models, with real
        latency/accuracy benchmarking and WebSocket streaming. Two TTS engines (Kokoro, Piper) and
        one STT engine (Faster-Whisper) run behind a shared adapter interface.
      </p>

      <div className="grid">
        <section id="synthesize" className="panel section">
          <div className="panel-header">
            <h2 className="panel-title">Text to Speech</h2>
            <p className="panel-desc">Generate audio using a selected engine and voice.</p>
          </div>

          <label className="field-label">Text</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />

          <div className="controls-row">
            <div className="control">
              <label className="field-label">Model</label>
              <select value={model} onChange={(e) => handleModelChange(e.target.value)}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.id}</option>
                ))}
              </select>
            </div>
            <div className="control">
              <label className="field-label">Voice</label>
              <select value={voice} onChange={(e) => setVoice(e.target.value)}>
                {voices.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="control">
              <label className="field-label">
                Speed <span className="speed-value">{speed.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <button className="btn" onClick={handleGenerate} disabled={loading || !text.trim()}>
            {loading ? "Generating…" : "Generate"}
          </button>

          {error && <p className="error">{error}</p>}
          {audioUrl && <audio controls src={audioUrl} />}
        </section>

        <section id="transcribe" className="panel section">
          <div className="panel-header">
            <h2 className="panel-title">Speech to Text</h2>
            <p className="panel-desc">Upload an audio file and transcribe it with Faster-Whisper.</p>
          </div>

          <div>
            <label className="file-label" htmlFor="stt-file">
              {sttFile ? "Change file" : "Choose audio file"}
            </label>
            <input
              id="stt-file"
              type="file"
              accept="audio/*"
              style={{ display: "none" }}
              onChange={(e) => setSttFile(e.target.files[0])}
            />
            {sttFile && <span className="file-name">{sttFile.name}</span>}
          </div>

          <div style={{ marginTop: "0.9rem" }}>
            <button className="btn" onClick={handleTranscribe} disabled={sttLoading || !sttFile}>
              {sttLoading ? "Transcribing…" : "Transcribe"}
            </button>
          </div>

          {sttError && <p className="error">{sttError}</p>}

          {sttResult && (
            <div className="output">
              <div className="result-row">
                <span className="result-label">Text</span>
                <span className="result-value">{sttResult.text}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Language</span>
                <span className="result-value">{sttResult.language}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Duration</span>
                <span className="result-value">{sttResult.duration.toFixed(2)}s</span>
              </div>
            </div>
          )}
        </section>

        <section id="compare" className="panel section">
          <div className="panel-header">
            <h2 className="panel-title">Model Comparison</h2>
            <p className="panel-desc">
              Real-time factor (RTF) across engines for the text above — lower is faster.
            </p>
          </div>

          <button className="btn" onClick={handleCompareModels} disabled={benchmarkLoading || !text.trim()}>
            {benchmarkLoading ? "Benchmarking…" : "Run Comparison"}
          </button>

          {benchmarkError && <p className="error">{benchmarkError}</p>}

          {benchmarkResults.length > 0 && (
            <div className="compare-list">
              {benchmarkResults.map((r) => {
                const speedScore = 1 / r.rtf;
                const widthPct = (speedScore / maxSpeedScore) * 100;
                const color = MODEL_COLORS[r.model] || "var(--accent)";
                return (
                  <div className="compare-row" key={r.model}>
                    <span className="compare-model">
                      <span className="model-dot" style={{ background: color }}></span>
                      {r.model}
                    </span>
                    <div className="compare-track">
                      <div
                        className="compare-fill"
                        style={{ width: `${widthPct}%`, background: color }}
                      ></div>
                    </div>
                    <span className="compare-rtf">{r.rtf.toFixed(3)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section id="stream" className="panel section">
          <div className="panel-header">
            <h2 className="panel-title">Streaming Synthesis</h2>
            <p className="panel-desc">
              Text is streamed sentence-by-sentence over a WebSocket as it's generated.
            </p>
          </div>

          <label className="field-label">Text</label>
          <textarea value={streamText} onChange={(e) => setStreamText(e.target.value)} rows={3} />

          <div style={{ marginTop: "0.9rem" }}>
            <button className="btn" onClick={handleStream} disabled={streaming || !streamText.trim()}>
              {streaming ? "Streaming…" : "Start Streaming"}
            </button>
          </div>

          {streamError && <p className="error">{streamError}</p>}

          <audio ref={audioRef} onEnded={handleAudioEnded} style={{ display: "none" }} />

          {streamChunks.length > 0 && (
            <>
              <div className="chunk-row">
                {streamChunks.map((_, i) => (
                  <div key={i} className="chunk-dot arrived">{i + 1}</div>
                ))}
              </div>
              <p className="result-label" style={{ marginTop: "0.7rem", display: "block" }}>
                {streamChunks.length} chunk{streamChunks.length !== 1 ? "s" : ""} received
              </p>
            </>
          )}
        </section>
      </div>

      <footer className="footer">
        <a href="https://github.com/aainabatool/voice-model-playground" target="_blank" rel="noreferrer">
          github.com/aainabatool/voice-model-playground
        </a>
      </footer>
    </div>
  );
}

export default App;