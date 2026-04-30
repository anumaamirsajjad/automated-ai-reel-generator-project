import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../lib/api";

const TEMPLATES_URL = buildApiUrl("/api/templates");

const FORM_DEFAULTS = {
  name: "",
  description: "",
  category: "General",
  prompt: "",
  style: "Realistic",
  theme: "Sunset Beach",
  duration: "10 seconds",
  quality: "High (1080p)",
  aspectRatio: "9:16 (Vertical)",
  speed: 50,
  autoCaptions: true,
  autoHashtags: true,
  bgMusic: true,
  popular: false,
};

async function readJsonSafe(response) {
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return {
    success: false,
    error: text.slice(0, 200) || `Request failed with status ${response.status}`,
  };
}

function getTemplateFallbackTheme(category) {
  const iconMap = { "business": "📈", "travel": "🌍", "food": "🍳", "inspiration": "✨", "technology": "⚡" };
  const key = String(category || "").toLowerCase();
  const icon = iconMap[key] || "🎬";
  return { bg: "#F0F9FF", icon, color: "#1E3A8A" };
}

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(FORM_DEFAULTS);

  const categories = useMemo(() => {
    const dynamic = [...new Set(templates.map((t) => t.category).filter(Boolean))].sort();
    return ["All", ...dynamic];
  }, [templates]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (cat !== "All" && t.category !== cat) return false;
      if (!needle) return true;
      const haystack = [t.name, t.description, t.category, t.prompt].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [templates, cat, search]);

  const loadTemplates = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(TEMPLATES_URL);
      const data = await readJsonSafe(response);
      if (!data?.success) {
        throw new Error(data?.error || "Failed to load templates");
      }
      setTemplates(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(FORM_DEFAULTS);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      description: item.description || "",
      category: item.category || "General",
      prompt: item.prompt || "",
      style: item.style || "Realistic",
      theme: item.theme || "Sunset Beach",
      duration: item.duration || "10 seconds",
      quality: item.quality || "High (1080p)",
      aspectRatio: item.aspectRatio || "9:16 (Vertical)",
      speed: Number.isFinite(Number(item.speed)) ? Number(item.speed) : 50,
      autoCaptions: Boolean(item.autoCaptions),
      autoHashtags: Boolean(item.autoHashtags),
      bgMusic: Boolean(item.bgMusic),
      popular: Boolean(item.popular),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    if (busy) return;
    setShowForm(false);
    setEditingId(null);
    setForm(FORM_DEFAULTS);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const target = editingId ? `${TEMPLATES_URL}/${editingId}` : TEMPLATES_URL;
      const method = editingId ? "PUT" : "POST";
      const response = await fetch(target, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          speed: Number(form.speed) || 50,
        }),
      });
      const data = await readJsonSafe(response);
      if (!data?.success) {
        throw new Error(data?.error || "Failed to save template");
      }
      await loadTemplates();
      closeForm();
    } catch (err) {
      setError(err.message || "Failed to save template");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete template "${item.name}"?`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${TEMPLATES_URL}/${item.id}`, { method: "DELETE" });
      const data = await readJsonSafe(response);
      if (!data?.success) {
        throw new Error(data?.error || "Failed to delete template");
      }
      await loadTemplates();
    } catch (err) {
      setError(err.message || "Failed to delete template");
    } finally {
      setBusy(false);
    }
  };

  const handleUse = async (item) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${TEMPLATES_URL}/${item.id}/use`, { method: "POST" });
      const data = await readJsonSafe(response);
      if (!data?.success || !data?.apply) {
        throw new Error(data?.error || "Failed to apply template");
      }
      localStorage.setItem("selectedTemplateDraft", JSON.stringify(data.apply));
      navigate("/create");
    } catch (err) {
      setError(err.message || "Failed to apply template");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: 1300, margin: "0 auto", animation: "fadeUp 0.4s ease" }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 30, fontWeight: 700, color: "#1a1a2e" }}>
          Template Library
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 15 }}>
          Create, manage, and reuse reel blueprints across your workflow
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates"
          style={{
            flex: "1 1 260px",
            maxWidth: 420,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            fontSize: 14,
            background: "#fff",
            fontFamily: "inherit",
          }}
        />
        <button
          type="button"
          onClick={openCreate}
          disabled={busy}
          style={{
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            background: "#111827",
            color: "#fff",
            fontWeight: 700,
            cursor: busy ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          + New Template
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* ── Category Pills ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              padding: "7px 18px", borderRadius: 20, cursor: "pointer",
              border: `1.5px solid ${cat === c ? "#1a1a2e" : "#e5e7eb"}`,
              background: cat === c ? "#1a1a2e" : "#fff",
              color: cat === c ? "#fff" : "#374151",
              fontWeight: cat === c ? 600 : 400,
              fontSize: 14, transition: "all 0.15s",
              fontFamily: "inherit",
            }}
          >{c}</button>
        ))}
      </div>

      {/* ── Template Cards Grid ── */}
      {loading ? (
        <div style={{ padding: "64px 0", textAlign: "center", color: "#6b7280" }}>Loading templates...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "64px 0", textAlign: "center", color: "#6b7280" }}>No templates found.</div>
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20, marginBottom: 40 }}>
        {filtered.map((t) => (
          <div
            key={t.id}
            style={{
              background: "#F0F9FF", borderRadius: 16, overflow: "hidden", border: "2px solid #93C5FD",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              transition: "box-shadow 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.13)";
              e.currentTarget.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Thumbnail */}
            <div style={{ position: "relative" }}>
              <div style={{ width: "100%", height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: t.thumbnailUrl ? "#000" : getTemplateFallbackTheme(t.category).bg }}>
                {t.thumbnailUrl ? (
                  <img
                    src={t.thumbnailUrl}
                    alt={t.name}
                    style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div style={{ textAlign: "center", color: getTemplateFallbackTheme(t.category).color, padding: 14 }}>
                    <div style={{ fontSize: 26, marginBottom: 6 }}>{getTemplateFallbackTheme(t.category).icon}</div>
                    <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{(t.name || "T").charAt(0).toUpperCase()}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>Template Preview</div>
                    <div style={{ fontSize: 11, color: "#1E40AF", marginTop: 3 }}>{t.category || "General"}</div>
                  </div>
                )}
              </div>
              {/* Duration badge */}
              <div style={{
                position: "absolute", top: 10, left: 10,
                background: "rgba(0,0,0,0.6)", color: "#fff",
                padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              }}>{t.duration || "10 seconds"}</div>

              {/* Popular badge */}
              {t.popular && (
                <div style={{
                  position: "absolute", top: 10, left: 52,
                  background: "#f59e0b", color: "#fff",
                  padding: "3px 10px", borderRadius: 6,
                  fontSize: 12, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 4,
                }}>⭐ Popular</div>
              )}
            </div>

            {/* Card body */}
            <div style={{ padding: "16px 20px 20px" }}>
              <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
                {t.name}
              </h3>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6b7280" }}>{t.description || "No description"}</p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{
                  padding: "3px 10px", border: "1px solid #e5e7eb",
                  borderRadius: 6, fontSize: 12, color: "#374151",
                }}>{t.category}</span>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>{Number(t.uses || 0).toLocaleString()} uses</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleUse(t)}
                  disabled={busy}
                  style={actionButtonStyle("#111827", "#fff", busy)}
                >Use</button>
                <button
                  type="button"
                  onClick={() => openEdit(t)}
                  disabled={busy}
                  style={actionButtonStyle("#f3f4f6", "#111827", busy)}
                >Edit</button>
                <button
                  type="button"
                  onClick={() => handleDelete(t)}
                  disabled={busy}
                  style={actionButtonStyle("#fef2f2", "#991b1b", busy)}
                >Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* ── Custom Template CTA ── */}
      <div style={{
        background: "linear-gradient(135deg, #BAE6FD, #A5D6FF)",
        border: "2px dashed #7DD3FC", borderRadius: 20,
        padding: "48px 32px", textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, margin: "0 auto 16px", color: "white",
        }}>⊞</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "white" }}>
          Need a Custom Template?
        </h3>
        <p style={{ margin: "0 0 24px", color: "rgba(255, 255, 255, 0.85)", fontSize: 14, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
          Save your favorite reel configurations as reusable presets for your team.
        </p>
        <button
          type="button"
          onClick={openCreate}
          style={{
            padding: "12px 28px", border: "2px solid white", borderRadius: 10,
            background: "rgba(255, 255, 255, 0.2)", color: "white", fontWeight: 700, fontSize: 14,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >Create Custom Template</button>
      </div>

      {showForm && (
        <div
          onClick={closeForm}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 10000,
          }}
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(760px, 100%)",
              maxHeight: "90vh",
              overflow: "auto",
              background: "#fff",
              borderRadius: 18,
              padding: 20,
              boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ margin: "0 0 14px", color: "#111827" }}>{editingId ? "Edit Template" : "Create Template"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} required />
              <Field label="Category" value={form.category} onChange={(value) => setForm((prev) => ({ ...prev, category: value }))} />
              <Field label="Prompt" value={form.prompt} onChange={(value) => setForm((prev) => ({ ...prev, prompt: value }))} multiline required />
              <Field label="Description" value={form.description} onChange={(value) => setForm((prev) => ({ ...prev, description: value }))} multiline />
              <Field label="Style" value={form.style} onChange={(value) => setForm((prev) => ({ ...prev, style: value }))} />
              <Field label="Theme/Scene" value={form.theme} onChange={(value) => setForm((prev) => ({ ...prev, theme: value }))} />
              <SelectField label="Duration" value={form.duration} options={["5 seconds", "10 seconds", "15 seconds"]} onChange={(value) => setForm((prev) => ({ ...prev, duration: value }))} />
              <SelectField label="Quality" value={form.quality} options={["High (1080p)", "Medium (720p)", "Low (480p)"]} onChange={(value) => setForm((prev) => ({ ...prev, quality: value }))} />
              <SelectField label="Aspect Ratio" value={form.aspectRatio} options={["9:16 (Vertical)", "16:9 (Horizontal)", "1:1 (Square)"]} onChange={(value) => setForm((prev) => ({ ...prev, aspectRatio: value }))} />
              <Field label="Speed (0-100)" type="number" value={String(form.speed)} onChange={(value) => setForm((prev) => ({ ...prev, speed: Number(value) || 0 }))} />
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12 }}>
              <Check label="Auto Captions" checked={form.autoCaptions} onChange={(checked) => setForm((prev) => ({ ...prev, autoCaptions: checked }))} />
              <Check label="Auto Hashtags" checked={form.autoHashtags} onChange={(checked) => setForm((prev) => ({ ...prev, autoHashtags: checked }))} />
              <Check label="Background Music" checked={form.bgMusic} onChange={(checked) => setForm((prev) => ({ ...prev, bgMusic: checked }))} />
              <Check label="Popular" checked={form.popular} onChange={(checked) => setForm((prev) => ({ ...prev, popular: checked }))} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button type="button" onClick={closeForm} disabled={busy} style={actionButtonStyle("#f3f4f6", "#111827", busy)}>Cancel</button>
              <button type="submit" disabled={busy} style={actionButtonStyle("#111827", "#fff", busy)}>{busy ? "Saving..." : "Save Template"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function actionButtonStyle(bg, color, disabled) {
  return {
    border: "none",
    borderRadius: 9,
    padding: "9px 10px",
    background: bg,
    color,
    fontWeight: 700,
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
  };
}

function Field({ label, value, onChange, multiline, required, type = "text" }) {
  return (
    <label style={{ display: "block", fontSize: 12, color: "#374151" }}>
      <span style={{ display: "block", marginBottom: 6 }}>{label}{required ? " *" : ""}</span>
      {multiline ? (
        <textarea
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={{ width: "100%", boxSizing: "border-box", border: "2px solid #93C5FD", borderRadius: 8, padding: 8, fontFamily: "inherit", backgroundColor: "#F0F9FF", color: "#1E3A8A", fontWeight: 500 }}
        />
      ) : (
        <input
          required={required}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", border: "2px solid #93C5FD", borderRadius: 8, padding: 8, fontFamily: "inherit", backgroundColor: "#F0F9FF", color: "#1E3A8A", fontWeight: 500 }}
        />
      )}
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label style={{ display: "block", fontSize: 12, color: "#374151" }}>
      <span style={{ display: "block", marginBottom: 6 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", border: "2px solid #93C5FD", borderRadius: 8, padding: 8, fontFamily: "inherit", backgroundColor: "#F0F9FF", color: "#1E3A8A", fontWeight: 500 }}
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
