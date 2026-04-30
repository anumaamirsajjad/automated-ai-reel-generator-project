import React, { useState, useEffect, useMemo } from "react";
import { buildApiUrl } from "../lib/api";

const GALLERY_URL = buildApiUrl("/api/gallery");
const LOCATION_URL = buildApiUrl("/api/location-suggestions");

function buildQueryString(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && String(value).trim()) {
      searchParams.set(key, String(value).trim());
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function formatDate(value) {
  if (!value) return "Just now";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

async function readJsonSafe(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return {
    success: false,
    error: text.slice(0, 200) || `Unexpected ${response.status} response`,
  };
}

function VideoCard({ item, onOpen, onDelete }) {
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => onOpen(item)}
        style={{
          border: "none",
          padding: 0,
          background: "transparent",
          textAlign: "left",
          cursor: "pointer",
          width: "100%",
        }}
      >
        <div
          style={{
            borderRadius: 18,
            overflow: "hidden",
            background: "#0f172a",
            boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          <div style={{ aspectRatio: "9 / 16", background: "#020617" }}>
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.title || item.originalFilename || "Video thumbnail"}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg,#1e293b,#0f172a)" }}>
                <div style={{ textAlign: "center", color: "#e2e8f0", padding: 16 }}>
                  <div style={{ fontSize: 34, marginBottom: 10 }}>▶</div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>Preview unavailable</div>
                  <div style={{ fontSize: 11, marginTop: 6, color: "#94a3b8" }}>Open to play this video</div>
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: 14, background: "linear-gradient(180deg,#fff, #f8fafc)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
              <strong style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.3 }}>{item.title}</strong>
              <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{formatDate(item.createdAt)}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {item.location && (
                <span style={badgeStyle("#eff6ff", "#2563eb")}>📍 {item.location}</span>
              )}
              {item.style && (
                <span style={badgeStyle("#f5f3ff", "#7c3aed")}>{item.style}</span>
              )}
            </div>
            {item.caption && (
              <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                {item.caption}
              </p>
            )}
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Delete "${item.title}"? This action cannot be undone.`)) {
            onDelete(item);
          }
        }}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "none",
          background: "rgba(239, 68, 68, 0.9)",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: "bold",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 10,
        }}
        title="Delete video"
      >
        ×
      </button>
    </div>
  );
}

function badgeStyle(background, color) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 8px",
    borderRadius: 999,
    background,
    color,
    fontSize: 11,
    fontWeight: 700,
  };
}

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [location, setLocation] = useState("");
  const [style, setStyle] = useState("");
  const [locationOptions, setLocationOptions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const response = await fetch(GALLERY_URL);
      const data = await response.json();
      if (data?.success) {
        setItems(Array.isArray(data.items) ? data.items : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!location.trim() || location.trim().length < 2) {
      setLocationOptions([]);
      return;
    }

    let active = true;
    const timeout = window.setTimeout(async () => {
      setLocationLoading(true);
      try {
        const response = await fetch(`${LOCATION_URL}?q=${encodeURIComponent(location.trim())}`);
        const data = await response.json();
        if (active) {
          setLocationOptions(Array.isArray(data?.items) ? data.items : []);
        }
      } catch {
        if (active) {
          setLocationOptions([]);
        }
      } finally {
        if (active) {
          setLocationLoading(false);
        }
      }
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [location]);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return items;
    return items.filter((item) => {
      const haystack = [item.title, item.caption, item.location, item.style, item.filename, item.hashtags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [items, query]);

  const handleUpload = async (event) => {
    event.preventDefault();
    setUploadError("");

    if (!file) {
      setUploadError("Choose a video file to upload.");
      return;
    }

    if (!title.trim()) {
      setUploadError("Title is required.");
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(`${GALLERY_URL}${buildQueryString({
        title,
        caption,
        hashtags,
        location,
        style,
        filename: file.name,
      })}`,
      {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "X-Filename": file.name,
        },
        body: file,
      });
      const data = await readJsonSafe(response);
      if (!data?.success) {
        throw new Error(data?.error || "Upload failed");
      }

      setFile(null);
      setTitle("");
      setCaption("");
      setHashtags("");
      setLocation("");
      setStyle("");
      setLocationOptions([]);
      await fetchGallery();
      setSelected(data.item);
    } catch (error) {
      setUploadError(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item) => {
    try {
      const response = await fetch(GALLERY_URL, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: item.id }),
      });
      const data = await readJsonSafe(response);
      if (data?.success) {
        await fetchGallery();
        if (selected && selected.id === item.id) {
          setSelected(null);
        }
      } else {
        alert("Failed to delete video: " + (data?.error || "Unknown error"));
      }
    } catch (error) {
      alert("Failed to delete video: " + error.message);
    }
  };

  const handlePickLocation = (value) => {
    setLocation(value);
    setLocationOptions([]);
  };

  const showLocationSuggestions = location.trim().length >= 2 && (locationLoading || locationOptions.length > 0);

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto", padding: "32px 24px 48px", animation: "fadeUp 0.35s ease" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 20, marginBottom: 26, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: "0 0 6px", color: "#7c3aed", fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", fontSize: 12 }}>
            Gallery
          </p>
          <h1 style={{ margin: 0, fontSize: 34, color: "#0f172a", letterSpacing: -0.8 }}>Your uploaded videos</h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
            Upload clips from your computer and store them in one organized gallery.
          </p>
        </div>

        <div style={{ minWidth: 280, flex: "1 1 360px", maxWidth: 420 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "12px 14px", boxShadow: "0 8px 24px rgba(15,23,42,0.06)" }}>
            <span style={{ color: "#94a3b8" }}>🔎</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, caption, location..."
              style={{ border: "none", outline: "none", flex: 1, fontSize: 14, color: "#0f172a", fontFamily: "inherit", background: "transparent" }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 24, alignItems: "start" }}>
        <form
          onSubmit={handleUpload}
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)",
            borderRadius: 24,
            padding: 24,
            border: "1px solid #ede9fe",
            boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
            position: "sticky",
            top: 20,
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, color: "#0f172a" }}>Upload video</h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
              Title is required. Caption, hashtags, location, and style are optional.
            </p>
          </div>

          <label style={fieldLabelStyle}>Video file</label>
          <label
            style={{
              display: "block",
              border: file ? "1.5px solid #c4b5fd" : "1.5px dashed #cbd5e1",
              background: file ? "#f5f3ff" : "rgba(255,255,255,0.75)",
              borderRadius: 18,
              padding: "18px 16px",
              cursor: "pointer",
              marginBottom: 16,
              transition: "all 0.18s ease",
            }}
          >
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed", fontSize: 20 }}>
                ⬆
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{file ? file.name : "Choose an MP4, MOV, WEBM, or M4V"}</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>Drag-and-drop is not required; click to browse.</div>
              </div>
            </div>
          </label>

          <label style={fieldLabelStyle}>Title <span style={{ color: "#ef4444" }}>*</span></label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this clip a title"
            style={textFieldStyle}
          />

          <label style={fieldLabelStyle}>Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
            rows={3}
            style={{ ...textFieldStyle, resize: "vertical", minHeight: 88 }}
          />

          <label style={fieldLabelStyle}>Hashtags</label>
          <input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#travel #cinematic #shortvideo"
            style={textFieldStyle}
          />

          <label style={fieldLabelStyle}>Location</label>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Search location with Google Maps"
              style={textFieldStyle}
            />
            {locationLoading && (
              <div style={{ position: "absolute", right: 12, top: 13, fontSize: 12, color: "#64748b" }}>Finding...</div>
            )}
            {showLocationSuggestions && locationOptions.length > 0 && (
              <div style={{ position: "absolute", zIndex: 5, top: 52, left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 40px rgba(15,23,42,0.12)" }}>
                {locationOptions.map((option) => (
                  <button
                    key={option.placeId || option.description}
                    type="button"
                    onClick={() => handlePickLocation(option.description)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      border: "none",
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: 13,
                      color: "#0f172a",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{option.description}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                      {option.source === "google" ? "Google Maps" : "Suggested location"}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!locationLoading && location.trim().length >= 2 && locationOptions.length === 0 && (
              <div style={{ position: "absolute", zIndex: 5, top: 52, left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, color: "#64748b", fontSize: 13, boxShadow: "0 20px 40px rgba(15,23,42,0.12)" }}>
                No matches yet. Try a city, region, or landmark.
              </div>
            )}
            {location.trim().length >= 2 && !locationLoading && locationOptions.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                Showing recommendations from Google Maps or fallback locations.
              </div>
            )}
          </div>

          <label style={fieldLabelStyle}>Style note</label>
          <input
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Optional style or collection note"
            style={textFieldStyle}
          />

          {uploadError && (
            <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 13 }}>
              {uploadError}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            style={{
              width: "100%",
              border: "none",
              borderRadius: 16,
              padding: "14px 16px",
              background: uploading ? "#cbd5e1" : "linear-gradient(135deg,#7c3aed,#2563eb)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 15,
              cursor: uploading ? "not-allowed" : "pointer",
              boxShadow: "0 14px 28px rgba(37,99,235,0.25)",
            }}
          >
            {uploading ? "Uploading..." : "Upload to Gallery"}
          </button>
        </form>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>Stored videos</h2>
              <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>{loading ? "Loading gallery..." : `${filteredItems.length} video(s)`}</p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#64748b" }}>Loading gallery...</div>
          ) : filteredItems.length === 0 ? (
            <div style={{
              borderRadius: 24,
              border: "1px dashed #cbd5e1",
              padding: "64px 20px",
              textAlign: "center",
              background: "#fff",
              color: "#64748b",
            }}>
              <div style={{ fontSize: 42, marginBottom: 10 }}>🎞</div>
              <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>No uploads yet</h3>
              <p style={{ margin: 0 }}>Upload a video from your PC to start building your gallery.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 18 }}>
              {filteredItems.map((item) => (
                <VideoCard key={item.id || item.filename} item={item} onOpen={setSelected} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
              zIndex: 10000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(960px, 100%)",
              background: "#fff",
              borderRadius: 24,
              overflow: "hidden",
              boxShadow: "0 24px 70px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, padding: 18, borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 18, color: "#0f172a" }}>{selected.title}</h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>{formatDate(selected.createdAt)}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {selected.location && <span style={badgeStyle("#eff6ff", "#2563eb")}>📍 {selected.location}</span>}
                  {selected.hashtags && <span style={badgeStyle("#ecfeff", "#0891b2")}>{selected.hashtags}</span>}
                  {selected.style && <span style={badgeStyle("#f5f3ff", "#7c3aed")}>{selected.style}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  borderRadius: 12,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ background: "#020617" }}>
              <video
                src={selected.url}
                poster={selected.thumbnailUrl || undefined}
                controls
                autoPlay
                playsInline
                style={{ width: "100%", maxHeight: "78vh", display: "block", objectFit: "contain" }}
              />
            </div>

            {(selected.caption || selected.originalFilename) && (
              <div style={{ padding: 18, borderTop: "1px solid #e2e8f0" }}>
                {selected.caption && <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>{selected.caption}</p>}
                {selected.originalFilename && <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 12 }}>Source file: {selected.originalFilename}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const fieldLabelStyle = {
  display: "block",
  marginBottom: 8,
  fontSize: 13,
  fontWeight: 700,
  color: "#334155",
};

const textFieldStyle = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 14,
  border: "1px solid #dbe3ef",
  background: "#fff",
  padding: "12px 14px",
  marginBottom: 16,
  outline: "none",
  fontSize: 14,
  color: "#0f172a",
  fontFamily: "inherit",
  boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
};
