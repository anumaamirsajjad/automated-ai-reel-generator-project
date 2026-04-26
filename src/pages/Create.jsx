import { useState } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const RAW_API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "").trim();
const API_BASE_URL = RAW_API_BASE_URL ? RAW_API_BASE_URL.replace(/\/+$/, "") : "";
const GENERATE_PATH = "/api/reel-generator";
const GENERATE_URL = API_BASE_URL ? `${API_BASE_URL}${GENERATE_PATH}` : GENERATE_PATH;
const REQUEST_TIMEOUT_MS = Number(process.env.REACT_APP_GENERATE_TIMEOUT_MS || 420000);
// You can still swap this backend endpoint to your n8n workflow later.
// ──────────────────────────────────────────────────────────────────────────────

const ART_STYLES = [
  { name: "Realistic",   thumb: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80" },
  { name: "Anime",       thumb: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&q=80" },
  { name: "Fantasy Art", thumb: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&q=80" },
  { name: "Cyberpunk",   thumb: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=200&q=80" },
  { name: "Watercolor",  thumb: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&q=80" },
  { name: "Sketch",      thumb: "https://images.unsplash.com/photo-1551913902-c92207136625?w=200&q=80" },
];

const SCENES = [
  "Sunset Beach",
  "City Night",
  "Magical Forest",
  "Outer Space",
  "Mountains",
  "Desert Dunes",
];

function durationToSeconds(duration) {
  return Number.parseInt(duration, 10) || 15;
}

// Maps reel duration to number of images for a cohesive reel.
function durationToSceneCount(duration) {
  const seconds = durationToSeconds(duration);

  if (seconds <= 5) return 2;
  if (seconds <= 10) return 4;
  return 6;
}

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: "pointer",
        background: on ? "#1a1a2e" : "#d1d5db",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

function SelectInput({ value, options, onChange }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "12px 16px", appearance: "none",
          background: "#fefce8", border: "1px solid #e5e7eb", borderRadius: 8,
          fontSize: 14, color: "#1a1a2e", cursor: "pointer", outline: "none",
          fontFamily: "inherit",
        }}
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <div style={{
        position: "absolute", right: 14, top: "50%",
        transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280",
      }}>▾</div>
    </div>
  );
}

// ─── Loading Steps Component ───────────────────────────────────────────────────
const LOADING_STEPS = [
  "Creating a realistic scene image",
  "Applying cinematic camera motion",
  "Encoding your reel",
  "Finalizing output",
];

function LoadingSteps({ currentStep }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", padding: "0 16px" }}>
      {LOADING_STEPS.map((label, i) => {
        const done   = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700,
              background: done ? "#7c3aed" : active ? "#3b82f6" : "#e5e7eb",
              color: done || active ? "#fff" : "#9ca3af",
              transition: "all 0.3s",
            }}>
              {done ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: 12,
              color: done ? "#7c3aed" : active ? "#1a1a2e" : "#9ca3af",
              fontWeight: active ? 600 : 400,
              transition: "color 0.3s",
            }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Create() {
  const [prompt, setPrompt]         = useState("");
  const [artStyle, setArtStyle]     = useState("Realistic");
  const [scene, setScene]           = useState("Sunset Beach");
  const [duration, setDuration]     = useState("10 seconds");
  const [ratio, setRatio]           = useState("9:16 (Vertical)");
  const [speed, setSpeed]           = useState(50);
  const [captions, setCaptions]     = useState(true);
  const [music, setMusic]           = useState(true);
  const [hashtags, setHashtags]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated]   = useState(false);
  const [videoUrl, setVideoUrl]     = useState(null);
  const [imageUrl, setImageUrl]     = useState(null);
  const [generatedHashtags, setGeneratedHashtags] = useState([]);
  const [settingsApplied, setSettingsApplied] = useState(null);
  const [error, setError]           = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Simulate step progress during generation
  const startStepTimer = () => {
    const timings = [4000, 7000, 6000]; // ms per step
    let step = 0;
    const advance = () => {
      step += 1;
      setLoadingStep(step);
      if (step < LOADING_STEPS.length - 1) {
        setTimeout(advance, timings[step] || 10000);
      }
    };
    setTimeout(advance, timings[0]);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    setGenerated(false);
    setVideoUrl(null);
    setImageUrl(null);
    setGeneratedHashtags([]);
    setSettingsApplied(null);
    setError(null);
    setLoadingStep(0);

    startStepTimer();

    // Map ratio string → short key for n8n
    const aspectRatioMap = {
      "9:16 (Vertical)":   "portrait",
      "16:9 (Horizontal)": "landscape",
      "1:1 (Square)":      "square",
    };

    const payload = {
      prompt,
      theme:       scene,
      style:       artStyle,
      mood:        "cinematic",
      sceneCount:  durationToSceneCount(duration),
      reelDurationSeconds: durationToSeconds(duration),
      sceneLength: durationToSeconds(duration) / durationToSceneCount(duration),
      aspectRatio: aspectRatioMap[ratio] || "portrait",
      captions,
      music,
      hashtags,
      speed,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let res;

      try {
        res = await fetch(GENERATE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Webhook error ${res.status}: ${text.slice(0, 200)}`);
      }

      const data = await res.json();

      if (data.success && data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setImageUrl(null);
        setGeneratedHashtags(Array.isArray(data.hashtags) ? data.hashtags : []);
        setSettingsApplied(data.settingsApplied || null);
        setGenerated(true);
        setLoadingStep(LOADING_STEPS.length); // all done
      } else if (data.success && data.imageUrl) {
        setImageUrl(data.imageUrl);
        setVideoUrl(null);
        setGeneratedHashtags(Array.isArray(data.hashtags) ? data.hashtags : []);
        setSettingsApplied(data.settingsApplied || null);
        setGenerated(true);
        setLoadingStep(LOADING_STEPS.length); // all done
      } else {
        throw new Error(data.error || "Backend returned an unexpected response");
      }
    } catch (err) {
      setImageUrl(null);
      setVideoUrl(null);
      setGenerated(false);
      setLoadingStep(0);

      const fallbackHint = API_BASE_URL
        ? "Check that REACT_APP_API_BASE_URL is reachable and backend is running."
        : "Check that backend is running on port 5000 and react-scripts proxy is active.";

      const reason = err?.name === "AbortError"
        ? `Request timed out after ${Math.round(REQUEST_TIMEOUT_MS / 1000)}s`
        : err?.message || "Unknown network error";

      setError(`Reel generation failed. Details: ${reason}. ${fallbackHint}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!videoUrl && !imageUrl) return;

    const a = document.createElement("a");
    a.href = videoUrl || imageUrl;
    a.download = videoUrl
      ? `reel_${scene.replace(/\s/g, "_")}_${Date.now()}.mp4`
      : `reel_preview_${scene.replace(/\s/g, "_")}_${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div style={{ padding: "32px", maxWidth: 1300, margin: "0 auto", animation: "fadeUp 0.4s ease" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>

        {/* ── Left Panel ── */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ color: "#7c3aed", fontSize: 20 }}>✦</span>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a2e" }}>Create New Reel</h2>
          </div>
          <p style={{ margin: "0 0 28px", color: "#6b7280", fontSize: 14 }}>
            Describe your vision and let AI bring it to life
          </p>

          {/* Prompt */}
          <label style={{ display: "block", fontWeight: 600, fontSize: 14, color: "#1a1a2e", marginBottom: 8 }}>
            Prompt <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your reel... e.g., 'A serene meditation journey through nature with peaceful music and inspiring captions'"
            style={{
              width: "100%", minHeight: 100, padding: "14px 16px",
              background: "#fefce8", border: "1px solid #e5e7eb", borderRadius: 10,
              fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none",
              color: "#1a1a2e", lineHeight: 1.6, boxSizing: "border-box", marginBottom: 28,
            }}
          />

          {/* Art Style */}
          <label style={{ display: "block", fontWeight: 600, fontSize: 15, color: "#1a1a2e", marginBottom: 14 }}>
            Art Style
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 28 }}>
            {ART_STYLES.map((s) => (
              <div
                key={s.name}
                onClick={() => setArtStyle(s.name)}
                style={{
                  borderRadius: 12, overflow: "hidden", cursor: "pointer",
                  border: `2px solid ${artStyle === s.name ? "#7c3aed" : "transparent"}`,
                  position: "relative",
                }}
              >
                <img src={s.thumb} alt={s.name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                {artStyle === s.name && (
                  <div style={{
                    position: "absolute", top: 4, right: 4,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "#7c3aed", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700,
                  }}>✓</div>
                )}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(to top,rgba(0,0,0,0.7),transparent)",
                  padding: "12px 6px 6px", textAlign: "center",
                  fontSize: 11, fontWeight: 600, color: "#fff",
                }}>{s.name}</div>
              </div>
            ))}
          </div>

          {/* Scene / Setting */}
          <label style={{ display: "block", fontWeight: 600, fontSize: 15, color: "#1a1a2e", marginBottom: 14 }}>
            Scene / Setting
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 28 }}>
            {SCENES.map((s) => (
              <div
                key={s}
                onClick={() => setScene(s)}
                style={{
                  padding: "20px 12px", borderRadius: 10, textAlign: "center",
                  cursor: "pointer", fontSize: 14, color: "#1a1a2e",
                  border: `1.5px solid ${scene === s ? "#7c3aed" : "#e5e7eb"}`,
                  background: scene === s ? "#f5f3ff" : "#fff",
                  fontWeight: scene === s ? 600 : 400, transition: "all 0.15s",
                }}
              >{s}</div>
            ))}
          </div>

          {/* Customization Options */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 16 }}>⚙</span>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>Customization Options</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Video Duration
              </label>
              <SelectInput
                value={duration}
                options={["5 seconds", "10 seconds", "15 seconds"]}
                onChange={setDuration}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Aspect Ratio
              </label>
              <SelectInput
                value={ratio}
                options={["9:16 (Vertical)", "16:9 (Horizontal)", "1:1 (Square)"]}
                onChange={setRatio}
              />
            </div>
          </div>

          {/* Speed Slider */}
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
            Animation Speed
          </label>
          <input
            type="range" min={0} max={100} value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
            style={{ width: "100%", accentColor: "#1a1a2e", marginBottom: 4 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Slow</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Fast</span>
          </div>

          {/* Toggles */}
          {[
            ["Auto-generate Caption", captions,  setCaptions],
            ["Add Background Music",  music,     setMusic],
            ["Generate Hashtags",     hashtags,  setHashtags],
          ].map(([label, val, setter]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: "#1a1a2e", fontWeight: 500 }}>{label}</span>
              <Toggle on={val} onChange={setter} />
            </div>
          ))}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
            style={{
              width: "100%", padding: "15px", marginTop: 8, border: "none", borderRadius: 12,
              background: prompt.trim() && !generating
                ? "linear-gradient(135deg,#7c3aed,#3b82f6)"
                : "#e5e7eb",
              color: prompt.trim() && !generating ? "#fff" : "#9ca3af",
              fontWeight: 700, fontSize: 16,
              cursor: prompt.trim() && !generating ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: prompt.trim() && !generating ? "0 4px 16px rgba(124,58,237,0.35)" : "none",
              transition: "all 0.2s",
            }}
          >
            {generating ? "⏳ Generating..." : "✦ Generate Reel"}
          </button>

          {/* Error Message */}
          {error && (
            <div style={{
              marginTop: 14, padding: "12px 16px", background: "#fef2f2",
              border: "1px solid #fecaca", borderRadius: 10,
              fontSize: 13, color: "#dc2626", lineHeight: 1.5,
            }}>
              ❌ <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* ── Right Panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Preview */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", flex: 1 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>Preview</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#9ca3af" }}>Your generated result will appear here</p>

            <div style={{
              border: `2px dashed ${generating ? "#7c3aed" : "#e5e7eb"}`,
              borderRadius: 12, aspectRatio: "9/16",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
              background: generating ? "#faf5ff" : "#f9fafb",
              overflow: "hidden", transition: "all 0.3s", position: "relative",
            }}>

              {/* State: Generating */}
              {generating && (
                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 16, width: "100%", padding: "24px 0",
                }}>
                  <div style={{
                    width: 36, height: 36,
                    border: "3px solid #e5e7eb",
                    borderTop: "3px solid #7c3aed",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    flexShrink: 0,
                  }} />
                  <LoadingSteps currentStep={loadingStep} />
                  <p style={{
                    color: "#7c3aed", fontSize: 12, fontWeight: 600,
                    animation: "shimmer 1.5s infinite", textAlign: "center",
                    padding: "0 16px",
                  }}>
                      Usually finishes in under 2 minutes...
                  </p>
                </div>
              )}

              {/* State: Done → show video */}
              {!generating && generated && videoUrl && (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "cover", borderRadius: 10,
                    display: "block",
                  }}
                />
              )}

              {/* State: Done -> show image fallback */}
              {!generating && generated && !videoUrl && imageUrl && (
                <img
                  src={imageUrl}
                  alt="Generated preview"
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "cover", borderRadius: 10,
                    display: "block",
                  }}
                />
              )}

              {/* State: Idle */}
              {!generating && !generated && (
                <>
                  <div style={{ fontSize: 36, color: "#d1d5db" }}>🖼</div>
                  <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "0 16px" }}>
                    Your generated reel will appear here
                  </p>
                </>
              )}
            </div>

            {/* Download + Regenerate buttons — shown after success */}
            {generated && (videoUrl || imageUrl) && !generating && (
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  onClick={handleDownload}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 10, border: "none",
                    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
                    color: "#fff", fontWeight: 700, fontSize: 14,
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 6,
                  }}
                >
                  ⬇ Download
                </button>
                <button
                  onClick={handleGenerate}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 10,
                    border: "1.5px solid #e5e7eb", background: "#fff",
                    color: "#1a1a2e", fontWeight: 600, fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  ↺ Regenerate
                </button>
              </div>
            )}

            {generated && settingsApplied && !generating && (
              <div style={{ marginTop: 14, padding: "10px 12px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                <p style={{ margin: "0 0 6px", fontSize: 12, color: "#374151", fontWeight: 600 }}>Applied Settings</p>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
                  {settingsApplied.sceneCount} scenes • style: {settingsApplied.style || "default"} • setting: {settingsApplied.theme || "auto"}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
                  captions: {settingsApplied.captions ? "on" : "off"} • music: {settingsApplied.music ? "on" : "off"} • speed: {settingsApplied.speed}
                </p>
              </div>
            )}

            {generated && generatedHashtags.length > 0 && !generating && (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {generatedHashtags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 12,
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: "#eef2ff",
                      color: "#4338ca",
                      border: "1px solid #c7d2fe",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span>💡</span>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>Quick Tips</h3>
            </div>
            {[
              "Be specific in your prompt for better results",
              "Mix different art styles for unique content",
              "Preview before posting to ensure quality",
            ].map((tip) => (
              <div key={tip} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <span style={{
                  background: "#f3f4f6", padding: "2px 8px", borderRadius: 6,
                  fontSize: 11, fontWeight: 600, color: "#6b7280",
                  flexShrink: 0, height: "fit-content",
                }}>Tip</span>
                <span style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}