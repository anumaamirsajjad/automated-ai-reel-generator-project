const RECENT_REELS = [
  {
    id: 1,
    title: "Sunset Beach Paradise",
    status: "posted",
    views: "2.4K",
    likes: "312",
    time: "2 hours ago",
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
  },
  {
    id: 2,
    title: "City Night Lights",
    status: "posted",
    views: "1.8K",
    likes: "245",
    time: "5 hours ago",
    thumb: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=400&q=80",
  },
  {
    id: 3,
    title: "Mountain Adventure",
    status: "processing",
    views: "3.1K",
    likes: "428",
    time: "1 day ago",
    thumb: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80",
  },
  {
    id: 4,
    title: "Urban Street Art",
    status: "scheduled",
    views: "956",
    likes: "128",
    time: "Tomorrow 10:00 AM",
    thumb: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80",
  },
];

const STATUS_STYLE = {
  posted:     { bg: "#22c55e", color: "#fff" },
  draft:      { bg: "#6b7280", color: "#fff" },
  scheduled:  { bg: "#3b82f6", color: "#fff" },
  processing: { bg: "#f59e0b", color: "#fff" },
};

const STATS = [
  { label: "Total Reels",    value: "127",  change: "+12%", icon: "🎬", color: "#ede9fe" },
  { label: "Total Views",    value: "45.2K",change: "+23%", icon: "👁",  color: "#dbeafe" },
  { label: "Engagement",     value: "8.4K", change: "+18%", icon: "❤️", color: "#fce7f3" },
  { label: "Avg. Watch Time",value: "18s",  change: "+5%",  icon: "⏱",  color: "#fef3c7" },
];

const CHART_DATA = [
  { day: "Mon", views: 2400, engagement: 800  },
  { day: "Tue", views: 3200, engagement: 1100 },
  { day: "Wed", views: 2800, engagement: 950  },
  { day: "Thu", views: 4100, engagement: 1400 },
  { day: "Fri", views: 3600, engagement: 1200 },
  { day: "Sat", views: 5200, engagement: 1800 },
  { day: "Sun", views: 4800, engagement: 1600 },
];

export default function Dashboard({ setPage }) {
  const maxViews = Math.max(...CHART_DATA.map((d) => d.views));

  return (
    <div
      style={{
        padding: "40px 32px",
        maxWidth: 1300,
        margin: "0 auto",
        animation: "fadeUp 0.4s ease",
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Welcome ── */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1a1a2e", margin: "0 0 8px" }}>
          Welcome Back! 👋
        </h1>
        <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>
          Here's what's happening with your reels today
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {STATS.map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Icon bubble */}
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 48,
                height: 48,
                borderRadius: 12,
                background: s.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              {s.icon}
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6b7280" }}>
              {s.label}
            </p>
            <p style={{ margin: "0 0 6px", fontSize: 32, fontWeight: 700, color: "#1a1a2e" }}>
              {s.value}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#22c55e", fontWeight: 600 }}>
              ↗ {s.change}
            </p>
          </div>
        ))}
      </div>

      {/* ── Recent Reels + Quick Actions ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {/* Recent Reels */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 20,
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
                Recent Reels
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
                Your latest video creations
              </p>
            </div>
            <button
              onClick={() => setPage("Gallery")}
              style={{
                background: "none",
                border: "none",
                color: "#7c3aed",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              View All
            </button>
          </div>

          {RECENT_REELS.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 0",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              {/* Thumbnail */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src={r.thumb}
                  alt={r.title}
                  style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    left: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    background: STATUS_STYLE[r.status].bg,
                    color: "#fff",
                    padding: "2px 7px",
                    borderRadius: 6,
                  }}
                >
                  {r.status}
                </span>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 3px", fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>
                  {r.title}
                </p>
                <p style={{ margin: "0 0 6px", fontSize: 12, color: "#9ca3af" }}>
                  {r.time}
                </p>
                <div style={{ display: "flex", gap: 14 }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>👁 {r.views}</span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>❤️ {r.likes}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Prev / Next arrows */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
            {["‹", "›"].map((a) => (
              <button
                key={a}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: "none",
                  background: "#1a1a2e",
                  color: "#fff",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
            Quick Actions
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9ca3af" }}>
            Get started quickly
          </p>

          {[
            { icon: "🎬", label: "Create New Reel",   page: "Create"    },
            { icon: "⊞",  label: "Browse Templates",  page: "Templates" },
            { icon: "📤", label: "Schedule Post",      page: "Settings"  },
            { icon: "📊", label: "View Analytics",     page: "Dashboard" },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => setPage(a.page)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "14px 0",
                background: "none",
                border: "none",
                borderBottom: "1px solid #f3f4f6",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 16 }}>{a.icon}</span>
              <span style={{ fontSize: 14, color: "#1a1a2e", fontWeight: 500 }}>
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Performance Chart ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
          Performance Overview
        </h2>
        <p style={{ margin: "0 0 28px", fontSize: 13, color: "#9ca3af" }}>
          Last 7 days engagement metrics
        </p>

        {/* Bar chart */}
        <div style={{ display: "flex", alignItems: "flex-end", height: 160, gap: 0 }}>
          {CHART_DATA.map((d) => (
            <div
              key={d.day}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
            >
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  gap: 3,
                  alignItems: "flex-end",
                  height: 140,
                }}
              >
                <div
                  style={{
                    width: 14,
                    borderRadius: "4px 4px 0 0",
                    height: `${(d.views / maxViews) * 130}px`,
                    background: "linear-gradient(to top,#7c3aed,#a78bfa)",
                  }}
                />
                <div
                  style={{
                    width: 14,
                    borderRadius: "4px 4px 0 0",
                    height: `${(d.engagement / maxViews) * 130}px`,
                    background: "linear-gradient(to top,#3b82f6,#93c5fd)",
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{d.day}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#7c3aed" }} />
            <span style={{ fontSize: 12, color: "#6b7280" }}>Views</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#3b82f6" }} />
            <span style={{ fontSize: 12, color: "#6b7280" }}>Engagement</span>
          </div>
        </div>
      </div>
    </div>
  );
}