import { useState } from "react";

const TEMPLATES = [
  { id: 1, name: "Daily Motivation",   desc: "Inspirational quotes with dynamic visuals",    category: "Inspiration", uses: "4,521", duration: "15s", popular: true,  thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80" },
  { id: 2, name: "Product Showcase",   desc: "Highlight your products with smooth animations",category: "Business",    uses: "3,891", duration: "30s", popular: true,  thumb: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80" },
  { id: 3, name: "Travel Adventure",   desc: "Stunning travel destinations and experiences",  category: "Travel",      uses: "5,234", duration: "30s", popular: true,  thumb: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80" },
  { id: 4, name: "Recipe Tutorial",    desc: "Step-by-step cooking instructions",             category: "Food",        uses: "2,109", duration: "60s", popular: false, thumb: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80" },
  { id: 5, name: "Workout Routine",    desc: "Energetic fitness content with music",          category: "Health",      uses: "3,445", duration: "30s", popular: true,  thumb: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80" },
  { id: 6, name: "Tech Review",        desc: "Modern tech product reviews and demos",         category: "Technology",  uses: "1,876", duration: "45s", popular: false, thumb: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80" },
  { id: 7, name: "Fashion Lookbook",   desc: "Stylish outfit combinations and trends",        category: "Fashion",     uses: "1,432", duration: "30s", popular: false, thumb: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80" },
  { id: 8, name: "Life Hacks",         desc: "Quick tips and tricks for everyday life",       category: "Lifestyle",   uses: "2,847", duration: "30s", popular: false, thumb: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&q=80" },
  { id: 9, name: "Art Process",        desc: "Creative art making and time-lapses",           category: "Art",         uses: "523",   duration: "60s", popular: false, thumb: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80" },
];

const CATEGORIES = ["All","Inspiration","Business","Travel","Food","Health","Technology","Fashion","Lifestyle","Art"];

export default function Templates({ setPage }) {
  const [cat, setCat] = useState("All");

  const filtered = TEMPLATES.filter((t) => cat === "All" || t.category === cat);

  return (
    <div style={{ padding: "32px", maxWidth: 1300, margin: "0 auto", animation: "fadeUp 0.4s ease" }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 30, fontWeight: 700, color: "#1a1a2e" }}>
          Template Library
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 15 }}>
          Choose from pre-designed templates for faster content creation
        </p>
      </div>

      {/* ── Category Pills ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
        {CATEGORIES.map((c) => (
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 40 }}>
        {filtered.map((t) => (
          <div
            key={t.id}
            style={{
              background: "#fff", borderRadius: 16, overflow: "hidden",
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
              <img
                src={t.thumb}
                alt={t.name}
                style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
              />
              {/* Duration badge */}
              <div style={{
                position: "absolute", top: 10, left: 10,
                background: "rgba(0,0,0,0.6)", color: "#fff",
                padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              }}>{t.duration}</div>

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
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6b7280" }}>{t.desc}</p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{
                  padding: "3px 10px", border: "1px solid #e5e7eb",
                  borderRadius: 6, fontSize: 12, color: "#374151",
                }}>{t.category}</span>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>{t.uses} uses</span>
              </div>

              <button
                onClick={() => setPage("Create")}
                style={{
                  width: "100%", padding: "11px", border: "none", borderRadius: 10,
                  background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                  color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "inherit",
                }}
              >⊞ Use Template</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Custom Template CTA ── */}
      <div style={{
        background: "linear-gradient(135deg,#f5f3ff,#ede9fe)",
        border: "2px dashed #c4b5fd", borderRadius: 20,
        padding: "48px 32px", textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, margin: "0 auto 16px",
        }}>⊞</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>
          Need a Custom Template?
        </h3>
        <p style={{ margin: "0 0 24px", color: "#6b7280", fontSize: 14, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
          Save your favorite reel configurations as templates for faster creation in the future
        </p>
        <button
          onClick={() => setPage("Create")}
          style={{
            padding: "12px 28px", border: "1.5px solid #1a1a2e", borderRadius: 10,
            background: "#fff", color: "#1a1a2e", fontWeight: 600, fontSize: 14,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >Create Custom Template</button>
      </div>
    </div>
  );
}
// template page
