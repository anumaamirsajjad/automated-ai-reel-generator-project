import { useState } from "react";

const REELS = [
  { id: 1,  title: "Sunset Beach Paradise", status: "posted",     views: "2.4K", likes: "312",  style: "Realistic",   date: "2024-02-14", thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80" },
  { id: 2,  title: "City Night Lights",      status: "posted",     views: "1.8K", likes: "245",  style: "Cyberpunk",   date: "2024-02-14", thumb: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=400&q=80" },
  { id: 3,  title: "Mountain Adventure",     status: "processing", views: "3.1K", likes: "428",  style: "Realistic",   date: "2024-02-13", thumb: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80" },
  { id: 4,  title: "Urban Street Art",       status: "scheduled",  views: "956",  likes: "128",  style: "Fantasy Art", date: "2024-02-13", thumb: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80" },
  { id: 5,  title: "Forest Morning",         status: "posted",     views: "4.2K", likes: "531",  style: "Watercolor",  date: "2024-02-12", thumb: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80" },
  { id: 6,  title: "Desert Sunset",          status: "draft",      views: "—",    likes: "—",    style: "Realistic",   date: "2024-02-12", thumb: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=80" },
  { id: 7,  title: "Cosmic Journey",         status: "posted",     views: "8.9K", likes: "1.1K", style: "Fantasy",     date: "2024-02-12", thumb: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80" },
  { id: 8,  title: "Tropical Paradise",      status: "posted",     views: "6.3K", likes: "789",  style: "Realistic",   date: "2024-02-11", thumb: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&q=80" },
  { id: 9,  title: "Neon Dreams",            status: "posted",     views: "11.2K",likes: "1.4K", style: "Cyberpunk",   date: "2024-02-11", thumb: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
];

const STATUS_STYLE = {
  posted:     { bg: "#22c55e", color: "#fff" },
  draft:      { bg: "#6b7280", color: "#fff" },
  scheduled:  { bg: "#3b82f6", color: "#fff" },
  processing: { bg: "#f59e0b", color: "#fff" },
};

const FILTERS = ["All", "posted", "draft", "scheduled", "processing"];

function GalleryCard({ reel }) {
  const [hovered, setHovered] = useState(false);
  const s = STATUS_STYLE[reel.status];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16, overflow: "hidden", background: "#fff", cursor: "pointer",
        boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.07)",
        transform: hovered ? "translateY(-4px)" : "none",
        transition: "all 0.25s",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", aspectRatio: "9/16" }}>
        <img
          src={reel.thumb}
          alt={reel.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Status badge */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: s.bg, color: s.color,
          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
        }}>{reel.status}</div>

        {/* Hover play overlay */}
        {hovered && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>▶</div>
          </div>
        )}
      </div>

      {/* Info below image */}
      <div style={{ padding: "12px 14px" }}>
        <p style={{ margin: "0 0 3px", fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>{reel.title}</p>
        <p style={{ margin: "0 0 6px", fontSize: 12, color: "#9ca3af" }}>{reel.style} • {reel.date}</p>
        {reel.views !== "—" && (
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>👁 {reel.views}</span>
            <span style={{ fontSize: 12, color: "#6b7280" }}>❤️ {reel.likes}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Gallery() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = REELS.filter((r) => {
    const matchFilter = filter === "All" || r.status === filter;
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ padding: "32px", maxWidth: 1400, margin: "0 auto", animation: "fadeUp 0.4s ease" }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 700, color: "#1a1a2e" }}>Video Gallery</h1>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: 14 }}>{filtered.length} reels found</p>
        </div>

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#fefce8", border: "1px solid #e5e7eb",
            borderRadius: 10, padding: "9px 14px",
          }}>
            <span style={{ color: "#9ca3af" }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reels..."
              style={{
                border: "none", outline: "none", background: "transparent",
                fontSize: 13, color: "#1a1a2e", width: 180, fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#fefce8", border: "1px solid #e5e7eb",
            borderRadius: 10, padding: "9px 14px",
          }}>
            <span style={{ color: "#9ca3af" }}>⚡</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                border: "none", outline: "none", background: "transparent",
                fontSize: 13, color: "#1a1a2e", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {FILTERS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Cards Grid ── */}
      {filtered.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "80px 0", color: "#9ca3af",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
          <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>No reels found</p>
          <p style={{ fontSize: 13, margin: 0 }}>Try a different filter or search term</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16 }}>
          {filtered.map((r) => <GalleryCard key={r.id} reel={r} />)}
        </div>
      )}
    </div>
  );
}
