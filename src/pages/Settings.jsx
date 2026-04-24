import { useState } from "react";

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
          fontSize: 14, color: "#1a1a2e", cursor: "pointer",
          outline: "none", fontFamily: "inherit",
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

function Section({ title, desc, children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 28,
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)", marginBottom: 20,
    }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>{title}</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#9ca3af" }}>{desc}</p>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, on, onChange }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "16px 0", borderBottom: "1px solid #f3f4f6",
    }}>
      <div>
        <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{label}</p>
        {desc && <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{desc}</p>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function SocialRow({ icon, name, handle, connected, onToggle }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 20px", border: "1px solid #f3f4f6",
      borderRadius: 12, marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "#f3f4f6", display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 22,
        }}>{icon}</div>
        <div>
          <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 15, color: "#1a1a2e" }}>{name}</p>
          <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
            {connected ? handle : "Not connected"}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {connected && (
          <span style={{
            background: "#dcfce7", color: "#15803d",
            padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
          }}>✓ Connected</span>
        )}
        <button
          onClick={onToggle}
          style={{
            padding: "8px 18px", border: "1.5px solid #e5e7eb", borderRadius: 8,
            background: "#fff", color: "#374151", fontWeight: 600,
            fontSize: 13, cursor: "pointer", fontFamily: "inherit",
          }}
        >{connected ? "Disconnect" : "Connect"}</button>
      </div>
    </div>
  );
}

export default function Settings() {
  const [igConnected,   setIgConnected]   = useState(true);
  const [fbConnected,   setFbConnected]   = useState(false);
  const [ttConnected,   setTtConnected]   = useState(false);
  const [ytConnected,   setYtConnected]   = useState(false);

  const [autoPost,      setAutoPost]      = useState(false);
  const [crossPost,     setCrossPost]     = useState(true);
  const [postTime,      setPostTime]      = useState("Post Immediately");
  const [optimalTime,   setOptimalTime]   = useState("Auto (AI-optimized)");

  const [artStyle,      setArtStyle]      = useState("Realistic");
  const [duration,      setDuration]      = useState("15 seconds");
  const [quality,       setQuality]       = useState("High (1080p)");
  const [autoCaptions,  setAutoCaptions]  = useState(true);
  const [autoHashtags,  setAutoHashtags]  = useState(true);
  const [bgMusic,       setBgMusic]       = useState(true);

  const [notifGen,      setNotifGen]      = useState(true);
  const [notifSched,    setNotifSched]    = useState(true);
  const [notifTemp,     setNotifTemp]     = useState(false);

  const [openaiKey,     setOpenaiKey]     = useState("");
  const [stabilityKey,  setStabilityKey]  = useState("");

  const [saved,         setSaved]         = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: "32px", maxWidth: 900, margin: "0 auto", animation: "fadeUp 0.4s ease" }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 700, color: "#1a1a2e" }}>Settings</h1>
      <p style={{ margin: "0 0 28px", color: "#6b7280", fontSize: 14 }}>
        Manage your account and integration preferences
      </p>

      {/* ── Social Media Accounts ── */}
      <Section
        title="Social Media Accounts"
        desc="Connect your social media accounts to enable automated posting"
      >
        <SocialRow icon="📸" name="Instagram"      handle="@your_username" connected={igConnected} onToggle={() => setIgConnected(!igConnected)} />
        <SocialRow icon="👤" name="Facebook"        handle=""               connected={fbConnected} onToggle={() => setFbConnected(!fbConnected)} />
        <SocialRow icon="🎵" name="TikTok"          handle=""               connected={ttConnected} onToggle={() => setTtConnected(!ttConnected)} />
        <SocialRow icon="▶️" name="YouTube Shorts"  handle=""               connected={ytConnected} onToggle={() => setYtConnected(!ytConnected)} />
      </Section>

      {/* ── Posting Preferences ── */}
      <Section
        title="Posting Preferences"
        desc="Configure how and when your content is posted"
      >
        <ToggleRow
          label="Auto-post After Generation"
          desc="Automatically post reels immediately after generation"
          on={autoPost} onChange={setAutoPost}
        />
        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            Default Posting Time
          </label>
          <SelectInput
            value={postTime}
            options={["Post Immediately", "Schedule for Later", "Best Time (AI)"]}
            onChange={setPostTime}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            Optimal Posting Time
          </label>
          <SelectInput
            value={optimalTime}
            options={["Auto (AI-optimized)", "Morning (8-10 AM)", "Afternoon (12-2 PM)", "Evening (6-8 PM)"]}
            onChange={setOptimalTime}
          />
        </div>
        <ToggleRow
          label="Cross-post to All Platforms"
          desc="Post to all connected platforms simultaneously"
          on={crossPost} onChange={setCrossPost}
        />
      </Section>

      {/* ── Generation Settings ── */}
      <Section
        title="Generation Settings"
        desc="Customize default generation parameters"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            Default Art Style
          </label>
          <SelectInput
            value={artStyle}
            options={["Realistic", "Anime", "Fantasy Art", "Cyberpunk", "Watercolor", "Sketch"]}
            onChange={setArtStyle}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            Default Video Duration
          </label>
          <SelectInput
            value={duration}
            options={["15 seconds", "30 seconds", "45 seconds", "60 seconds"]}
            onChange={setDuration}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            Video Quality
          </label>
          <SelectInput
            value={quality}
            options={["High (1080p)", "Medium (720p)", "Low (480p)"]}
            onChange={setQuality}
          />
        </div>
        <ToggleRow label="Auto-generate Captions" desc="Automatically create captions for all reels"  on={autoCaptions} onChange={setAutoCaptions} />
        <ToggleRow label="Auto-generate Hashtags" desc="Add relevant hashtags to increase reach"       on={autoHashtags} onChange={setAutoHashtags} />
        <ToggleRow label="Add Background Music"   desc="Include royalty-free music by default"         on={bgMusic}      onChange={setBgMusic}      />
      </Section>

      {/* ── Notifications ── */}
      <Section
        title="Notifications"
        desc="Choose what updates you want to receive"
      >
        <ToggleRow label="🔔 Generation Complete"      desc="Notify when reel generation is finished"          on={notifGen}   onChange={setNotifGen}   />
        <ToggleRow label="🕐 Scheduled Post Reminders" desc="Get reminded before scheduled posts go live"      on={notifSched} onChange={setNotifSched} />
        <ToggleRow label="🧩 New Templates"            desc="Get notified about new template releases"         on={notifTemp}  onChange={setNotifTemp}  />
      </Section>

      {/* ── API Configuration ── */}
      <Section
        title="API Configuration"
        desc="Configure external API keys for image generation (Optional)"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            OpenAI API Key
          </label>
          <input
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="sk-YOUR_API_KEY_HERE"
            style={{
              width: "100%", padding: "12px 16px",
              background: "#fefce8", border: "1px solid #e5e7eb",
              borderRadius: 8, fontSize: 13, fontFamily: "monospace",
              outline: "none", boxSizing: "border-box",
            }}
          />
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9ca3af" }}>
            Used for advanced AI image generation (optional)
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            Stability AI API Key
          </label>
          <input
            value={stabilityKey}
            onChange={(e) => setStabilityKey(e.target.value)}
            placeholder="sk-..."
            style={{
              width: "100%", padding: "12px 16px",
              background: "#fefce8", border: "1px solid #e5e7eb",
              borderRadius: 8, fontSize: 13, fontFamily: "monospace",
              outline: "none", boxSizing: "border-box",
            }}
          />
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9ca3af" }}>
            Alternative image generation service (optional)
          </p>
        </div>

        {/* Warning box */}
        <div style={{
          background: "#fefce8", border: "1px solid #fde68a",
          borderRadius: 10, padding: "12px 16px",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <span style={{ color: "#d97706", fontSize: 16, flexShrink: 0 }}>⚠</span>
          <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>
            API keys are stored securely and never shared. The app works with mock data by default.
          </p>
        </div>
      </Section>

      {/* ── Save / Reset Buttons ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
        <button style={{
          padding: "11px 24px", border: "1.5px solid #e5e7eb", borderRadius: 10,
          background: "#fff", color: "#374151", fontWeight: 600,
          fontSize: 14, cursor: "pointer", fontFamily: "inherit",
        }}>Reset to Defaults</button>

        <button
          onClick={handleSave}
          style={{
            padding: "11px 24px", border: "none", borderRadius: 10,
            background: saved
              ? "linear-gradient(135deg,#22c55e,#16a34a)"
              : "linear-gradient(135deg,#7c3aed,#6d28d9)",
            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: "inherit", transition: "background 0.3s",
          }}
        >{saved ? "✓ Saved!" : "💾 Save Changes"}</button>
      </div>
    </div>
  );
}