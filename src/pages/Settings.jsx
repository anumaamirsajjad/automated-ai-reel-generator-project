import { useState, useEffect } from "react";
import { buildApiUrl } from "../lib/api";

function Toggle({ on, onChange, disabled = false }) {
  return (
    <div
      onClick={() => {
        if (!disabled) onChange(!on);
      }}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: "pointer",
        background: disabled ? "#e5e7eb" : on ? "#1a1a2e" : "#d1d5db",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
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

function ToggleRow({ label, desc, on, onChange, disabled = false }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "16px 0", borderBottom: "1px solid #f3f4f6",
    }}>
      <div>
        <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{label}</p>
        {desc && <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{desc}</p>}
      </div>
      <Toggle on={on} onChange={onChange} disabled={disabled} />
    </div>
  );
}



export default function Settings() {
  const [reminderTime,  setReminderTime]  = useState("09:00");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState("daily");
  const [selectedDates, setSelectedDates] = useState([]); // YYYY-MM-DD strings
  const [selectedDays, setSelectedDays] = useState([]); // 0-6 numbers (Sun=0)

  const [artStyle,      setArtStyle]      = useState("Realistic");
  const [duration,      setDuration]      = useState("10 seconds");
  const [quality,       setQuality]       = useState("High (1080p)");
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(true);

  const [showQuickTips,       setShowQuickTips]       = useState(true);
  const [focusPromptOnCreate, setFocusPromptOnCreate] = useState(true);

  const [saved,         setSaved]         = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  const buildSettingsPayload = () => ({
    reminderTime,
    reminderEnabled,
    reminderFrequency,
    selectedDates,
    selectedDays,
    artStyle,
    duration,
    quality,
    desktopNotificationsEnabled,
    showQuickTips,
    focusPromptOnCreate,
  });

  const hasUnsavedChanges = initialSnapshot !== null && initialSnapshot !== JSON.stringify(buildSettingsPayload());

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/settings"));
        if (!response.ok) return;

        const data = await response.json();
        const settings = data.settings || {};
        if (typeof settings.reminderTime === "string") setReminderTime(settings.reminderTime);
        if (typeof settings.reminderEnabled === "boolean") setReminderEnabled(settings.reminderEnabled);
        if (typeof settings.reminderFrequency === "string") setReminderFrequency(settings.reminderFrequency);
        if (Array.isArray(settings.selectedDates)) setSelectedDates(settings.selectedDates);
        if (Array.isArray(settings.selectedDays)) setSelectedDays(settings.selectedDays);
        if (typeof settings.artStyle === "string") setArtStyle(settings.artStyle);
        if (typeof settings.duration === "string") setDuration(settings.duration);
        if (typeof settings.quality === "string") setQuality(settings.quality);
        if (typeof settings.desktopNotificationsEnabled === "boolean") setDesktopNotificationsEnabled(settings.desktopNotificationsEnabled);
        if (typeof settings.showQuickTips === "boolean") setShowQuickTips(settings.showQuickTips);
        if (typeof settings.focusPromptOnCreate === "boolean") setFocusPromptOnCreate(settings.focusPromptOnCreate);

        const snapshot = {
          reminderTime: typeof settings.reminderTime === "string" ? settings.reminderTime : "09:00",
          reminderEnabled: typeof settings.reminderEnabled === "boolean" ? settings.reminderEnabled : true,
          reminderFrequency: typeof settings.reminderFrequency === "string" ? settings.reminderFrequency : "daily",
          selectedDates: Array.isArray(settings.selectedDates) ? settings.selectedDates : [],
          selectedDays: Array.isArray(settings.selectedDays) ? settings.selectedDays : [],
          artStyle: typeof settings.artStyle === "string" ? settings.artStyle : "Realistic",
          duration: typeof settings.duration === "string" ? settings.duration : "10 seconds",
          quality: typeof settings.quality === "string" ? settings.quality : "High (1080p)",
          desktopNotificationsEnabled: typeof settings.desktopNotificationsEnabled === "boolean" ? settings.desktopNotificationsEnabled : true,
          showQuickTips: typeof settings.showQuickTips === "boolean" ? settings.showQuickTips : true,
          focusPromptOnCreate: typeof settings.focusPromptOnCreate === "boolean" ? settings.focusPromptOnCreate : true,
        };
        setInitialSnapshot(JSON.stringify(snapshot));
      } catch {
        // Keep defaults if the backend is unavailable.
        setInitialSnapshot(JSON.stringify(buildSettingsPayload()));
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!reminderEnabled && desktopNotificationsEnabled) {
      setDesktopNotificationsEnabled(false);
    }
  }, [reminderEnabled, desktopNotificationsEnabled]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch {
      setNotificationPermission("denied");
    }
  };

  const handleSave = () => {
    if (!hasUnsavedChanges || saving) return;

    const saveSettings = async () => {
      const payload = buildSettingsPayload();

      try {
        setSaving(true);

        const response = await fetch(buildApiUrl("/api/settings"), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to save settings");
        }

        window.dispatchEvent(new CustomEvent("settings-updated", { detail: payload }));

        setSaved(true);
        setInitialSnapshot(JSON.stringify(payload));
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setSaved(false);
      } finally {
        setSaving(false);
      }
    };

    saveSettings();
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/settings"));
        if (response.ok) {
          const data = await response.json();
          setReminderTime(data.reminderTime || "09:00");
          setReminderEnabled(data.reminderEnabled || false);
          setReminderFrequency(data.reminderFrequency || "daily");
          setArtStyle(data.artStyle || "Realistic");
          setDuration(data.duration || "10 seconds");
          setQuality(data.quality || "High (1080p)");
          setShowQuickTips(data.showQuickTips || true);
          setFocusPromptOnCreate(data.focusPromptOnCreate || true);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const saveSettings = async (updatedSettings) => {
    try {
      setSaving(true);
      const response = await fetch(buildApiUrl("/api/settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      });
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: 900, margin: "0 auto", animation: "fadeUp 0.4s ease" }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 700, color: "#1a1a2e" }}>Settings</h1>
      <p style={{ margin: "0 0 28px", color: "#6b7280", fontSize: 14 }}>
        Manage your account and integration preferences
      </p>

      {/* Instagram account feature removed */}

      {/* ── Set a Reminder to Post ── */}
      <Section
        title="Set a Reminder to Post"
        desc="Get reminded when it's time to post your reels"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            Reminder Time
          </label>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            style={{
              width: "100%", padding: "12px 16px",
              background: "#fefce8", border: "1px solid #e5e7eb",
              borderRadius: 8, fontSize: 13, fontFamily: "inherit",
              outline: "none", boxSizing: "border-box",
            }}
          />
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#9ca3af" }}>
            You'll receive a reminder at the selected time according to the schedule below.
          </p>
        </div>

        <ToggleRow
          label="Desktop Notifications"
          desc="Turn reminder popups on or off"
          on={desktopNotificationsEnabled}
          onChange={(next) => {
            setDesktopNotificationsEnabled(next);
            if (next && notificationPermission === "default") {
              requestNotificationPermission();
            }
          }}
          disabled={!reminderEnabled}
        />
        {reminderEnabled && desktopNotificationsEnabled && (
          <div style={{ margin: "8px 0 12px", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fafafa" }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#4b5563" }}>
              Browser permission: <strong>{notificationPermission}</strong>
            </p>
            {notificationPermission !== "granted" && (
              <button
                onClick={requestNotificationPermission}
                style={{
                  padding: "7px 10px",
                  border: "none",
                  borderRadius: 8,
                  background: "#7c3aed",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Enable Browser Notifications
              </button>
            )}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            Frequency
          </label>
          <select
            value={reminderFrequency}
            onChange={(e) => setReminderFrequency(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff" }}
          >
            <option value="daily">Daily</option>
            <option value="specific-dates">Specific dates</option>
            <option value="specific-days">Specific days of week</option>
          </select>
        </div>

        {reminderFrequency === "specific-dates" && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Add Date
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="date" id="reminder-date-input" style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <button
                onClick={() => {
                  const el = document.getElementById("reminder-date-input");
                  if (!el || !el.value) return;
                  if (!selectedDates.includes(el.value)) setSelectedDates([...selectedDates, el.value]);
                  el.value = "";
                }}
                style={{ padding: "8px 12px", borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none" }}
              >Add</button>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selectedDates.map((d, i) => (
                <div key={d} style={{ background: "#f3f4f6", padding: "6px 10px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13 }}>{d}</span>
                  <button onClick={() => setSelectedDates(selectedDates.filter((_, idx) => idx !== i))} style={{ border: "none", background: "transparent", cursor: "pointer" }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {reminderFrequency === "specific-days" && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Select Days
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, idx) => {
                const active = selectedDays.includes(idx);
                return (
                  <button key={d} onClick={() => {
                    if (active) setSelectedDays(selectedDays.filter(sd => sd !== idx)); else setSelectedDays([...selectedDays, idx]);
                  }}
                    style={{
                      padding: "8px 12px", borderRadius: 8, border: active ? '1px solid #7c3aed' : '1px solid #e5e7eb',
                      background: active ? '#f5dfff' : '#fff', cursor: 'pointer'
                    }}>{d}</button>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <ToggleRow label="Enable Reminder" desc="Turn the reminder on or off" on={reminderEnabled} onChange={setReminderEnabled} />
        </div>
        {reminderEnabled && (
          <div style={{
            background: "#f0fdf4", border: "1px solid #dcfce7",
            borderRadius: 10, padding: "12px 16px",
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <span style={{ color: "#15803d", fontSize: 16, flexShrink: 0 }}>🔔</span>
            <div style={{ margin: 0, fontSize: 13, color: "#166534" }}>
              <div>Reminder time: <strong>{reminderTime}</strong></div>
              {reminderFrequency === 'daily' && <div>Frequency: <strong>Daily</strong></div>}
              {reminderFrequency === 'specific-dates' && <div>Dates: <strong>{selectedDates.length ? selectedDates.join(', ') : 'No dates set'}</strong></div>}
              {reminderFrequency === 'specific-days' && <div>Days: <strong>{selectedDays.length ? selectedDays.map(i => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]).join(', ') : 'No days selected'}</strong></div>}
            </div>
          </div>
        )}
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
            options={["5 seconds", "10 seconds", "15 seconds"]}
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
      </Section>

      {/* ── Workspace Features ── */}
      <Section
        title="Workspace Features"
        desc="Choose how the app behaves while you create"
      >
        <ToggleRow label="Show Quick Tips" desc="Display helper tips on the Create page" on={showQuickTips} onChange={setShowQuickTips} />
        <ToggleRow label="Focus Prompt on Open" desc="Place the cursor in the prompt box when Create opens" on={focusPromptOnCreate} onChange={setFocusPromptOnCreate} />
        <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb", color: "#475569", fontSize: 13, lineHeight: 1.5 }}>
          These settings are used by the Create page and saved with your generation defaults.
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
          disabled={!hasUnsavedChanges || saving}
          style={{
            padding: "11px 24px", border: "none", borderRadius: 10,
            background: saved
              ? "linear-gradient(135deg,#22c55e,#16a34a)"
              : "linear-gradient(135deg,#7c3aed,#6d28d9)",
            color: "#fff", fontWeight: 700, fontSize: 14,
            cursor: !hasUnsavedChanges || saving ? "not-allowed" : "pointer",
            opacity: !hasUnsavedChanges || saving ? 0.55 : 1,
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: "inherit", transition: "background 0.3s",
          }}
        >{saved ? "✓ Saved!" : saving ? "Saving..." : "💾 Save Changes"}</button>
      </div>
    </div>
  );
}


