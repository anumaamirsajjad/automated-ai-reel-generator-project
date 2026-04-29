// import React, { useState, useEffect } from "react";
// // Dashboard data is loaded from the backend `/api/dashboard` endpoint.

// const STATUS_STYLE = {
//   posted:     { bg: "#22c55e", color: "#fff" },
//   draft:      { bg: "#6b7280", color: "#fff" },
//   scheduled:  { bg: "#3b82f6", color: "#fff" },
//   processing: { bg: "#f59e0b", color: "#fff" },
// };

// // Stats will be populated from the server; placeholder display handled in component.

// // Chart data comes from the api; users can upload CSV to override locally.

// export default function Dashboard({ setPage }) {
//   const [stats, setStats] = useState(null);
//   const [recent, setRecent] = useState([]);
//   const [chart, setChart] = useState([]);
//   const [favorites, setFavorites] = useState(() => {
//     try { return JSON.parse(localStorage.getItem("favorites") || "[]"); } catch { return []; }
//   });

//   const maxViews = chart.length ? Math.max(...chart.map((d) => d.reels || 0)) : 1;

//   // Fetch dashboard data
//   useEffect(() => {
//     let mounted = true;
//     fetch("/api/dashboard")
//       .then((r) => r.json())
//       .then((data) => {
//         if (!mounted) return;
//         if (data && data.success) {
//           setStats(data.stats || {});
//           setRecent(data.recent || []);
//           setChart(data.chart || []);
//         }
//       })
//       .catch(() => {});
//     return () => { mounted = false; };
//   }, []);

//   function toggleFavorite(filename) {
//     const next = favorites.includes(filename) ? favorites.filter((f) => f !== filename) : [...favorites, filename];
//     setFavorites(next);
//     try { localStorage.setItem("favorites", JSON.stringify(next)); } catch {}
//   }

//   async function trackEvent(type, filename) {
//     try {
//       await fetch('/api/event', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ type, filename }),
//       });
//     } catch {
//       // best effort
//     }
//   }

//   function handleCSVUpload(file) {
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = () => {
//       try {
//         const txt = reader.result || "";
//         const lines = String(txt).trim().split(/\r?\n/).slice(1);
//         const byDay = {};
//         for (const l of lines) {
//           const cols = l.split(",").map((c) => c.trim());
//           const date = cols[0];
//           if (!date) continue;
//           byDay[date] = (byDay[date] || 0) + 1;
//         }
//         const newChart = Object.keys(byDay).slice(0,7).map((d) => ({ day: d, reels: byDay[d] }));
//         setChart(newChart);
//       } catch (e) {
//         // ignore parse errors
//       }
//     };
//     reader.readAsText(file);
//   }

//   return (
//       <div
//       style={{
//         padding: "40px 32px",
//         maxWidth: 1300,
//         margin: "0 auto",
//         animation: "fadeUp 0.4s ease",
//       }}
//     >
//       <style>{`
//         @keyframes fadeUp {
//           from { opacity: 0; transform: translateY(16px); }
//           to   { opacity: 1; transform: translateY(0); }
//         }
//       `}</style>

//       {/* ── Welcome ── */}
//       <div style={{ textAlign: "center", marginBottom: 40 }}>
//         <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1a1a2e", margin: "0 0 8px" }}>
//           Welcome Back! 👋
//         </h1>
//         <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>
//           Here's what's happening with your reels today
//         </p>
//       </div>

//       {/* ── Stat Cards ── */}
//       <div
//         style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 28 }}
//       >
//         {[
//           { label: "Total Reels", icon: "🎬", color: "#ede9fe", value: stats?.totalReels ?? "—" },
//           { label: "Total Views", icon: "👁", color: "#dbeafe", value: stats?.totalViews ?? "—" },
//           { label: "Engagement", icon: "❤️", color: "#fce7f3", value: stats?.engagement ?? "—" },
//           { label: "Avg. Watch Time", icon: "⏱", color: "#fef3c7", value: stats?.avgWatchTime ?? "—" },
//         ].map((s) => (
//           <div key={s.label} style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", position: "relative", overflow: "hidden" }}>
//             <div style={{ position: "absolute", top: 16, right: 16, width: 48, height: 48, borderRadius: 12, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
//             <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6b7280" }}>{s.label}</p>
//             <p style={{ margin: "0 0 6px", fontSize: 32, fontWeight: 700, color: "#1a1a2e" }}>{s.value}</p>
//             <p style={{ margin: 0, fontSize: 13, color: "#22c55e", fontWeight: 600 }}></p>
//           </div>
//         ))}
//       </div>

//       {/* ── Recent Reels + Quick Actions ── */}
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "1fr 300px",
//           gap: 20,
//           marginBottom: 28,
//         }}
//       >
//         {/* Recent Reels */}
//         <div
//           style={{
//             background: "#fff",
//             borderRadius: 16,
//             padding: 24,
//             boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "flex-start",
//               marginBottom: 20,
//             }}
//           >
//             <div>
//               <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
//                 Recent Reels
//               </h2>
//               <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
//                 Your latest video creations
//               </p>
//             </div>
//             <button
//               onClick={() => setPage("Gallery")}
//               style={{
//                 background: "none",
//                 border: "none",
//                 color: "#7c3aed",
//                 fontWeight: 600,
//                 fontSize: 14,
//                 cursor: "pointer",
//               }}
//             >
//               View All
//             </button>
//           </div>

//           {recent.map((r) => (
//             <div key={r.filename} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid #f3f4f6" }}>
//               <div style={{ position: "relative", flexShrink: 0, width: 72, height: 72 }}>
//                 <video src={r.url} muted playsInline style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" }} />
//               </div>

//               <div style={{ flex: 1 }}>
//                 <p style={{ margin: "0 0 3px", fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>{r.filename}</p>
//                 <p style={{ margin: "0 0 6px", fontSize: 12, color: "#9ca3af" }}>{new Date(r.createdAt).toLocaleString()}</p>
//                 <div style={{ display: "flex", gap: 12 }}>
//                   <button onClick={async () => {
//                     const title = window.prompt("Title for gallery (leave empty to keep filename):", r.filename) || r.filename;
//                     if (title === null) return;
//                     const caption = window.prompt("Caption (optional):", "") || "";
//                     try {
//                       const res = await fetch('/api/gallery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: r.filename, title, caption }) });
//                       const data = await res.json();
//                       if (data && data.success) alert('Saved to gallery');
//                     } catch (e) { alert('Failed to save'); }
//                   }} style={{ fontSize: 12, padding: '6px 8px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>💾 Save</button>

//                   <a href={r.url} download onClick={() => trackEvent('download', r.filename)} style={{ fontSize: 12, padding: '6px 8px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', textDecoration: 'none', color: '#1a1a2e' }}>⬇ Download</a>

//                   <button onClick={() => toggleFavorite(r.filename)} style={{ fontSize: 12, padding: '6px 8px', borderRadius: 8, border: '1px solid #e5e7eb', background: favorites.includes(r.filename) ? '#fffbeb' : '#fff', cursor: 'pointer' }}>{favorites.includes(r.filename) ? '★ Favorited' : '☆ Favorite'}</button>
//                 </div>
//               </div>
//             </div>
//           ))}

//           {/* Prev / Next arrows */}
//           <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
//             {["‹", "›"].map((a) => (
//               <button
//                 key={a}
//                 style={{
//                   width: 36,
//                   height: 36,
//                   borderRadius: 8,
//                   border: "none",
//                   background: "#1a1a2e",
//                   color: "#fff",
//                   fontSize: 16,
//                   cursor: "pointer",
//                 }}
//               >
//                 {a}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Quick Actions */}
//         <div
//           style={{
//             background: "#fff",
//             borderRadius: 16,
//             padding: 24,
//             boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
//           }}
//         >
//           <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
//             Quick Actions
//           </h2>
//           <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9ca3af" }}>
//             Get started quickly
//           </p>

//           {[
//             { icon: "🎬", label: "Create New Reel",   page: "Create"    },
//             { icon: "⊞",  label: "Browse Templates",  page: "Templates" },
//             { icon: "📤", label: "Schedule Post",      page: "Settings"  },
//             { icon: "📊", label: "View Analytics",     page: "Dashboard" },
//           ].map((a) => (
//             <button
//               key={a.label}
//               onClick={() => setPage(a.page)}
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 12,
//                 width: "100%",
//                 padding: "14px 0",
//                 background: "none",
//                 border: "none",
//                 borderBottom: "1px solid #f3f4f6",
//                 cursor: "pointer",
//                 textAlign: "left",
//               }}
//             >
//               <span style={{ fontSize: 16 }}>{a.icon}</span>
//               <span style={{ fontSize: 14, color: "#1a1a2e", fontWeight: 500 }}>
//                 {a.label}
//               </span>
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* ── Performance Chart ── */}
//       <div
//         style={{
//           background: "#fff",
//           borderRadius: 16,
//           padding: 28,
//           boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
//         }}
//       >
//         <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
//           Performance Overview
//         </h2>
//         <p style={{ margin: "0 0 28px", fontSize: 13, color: "#9ca3af" }}>
//           Last 7 days engagement metrics
//         </p>

//         {/* Bar chart (reels per day) */}
//         <div style={{ display: "flex", alignItems: "flex-end", height: 160, gap: 0 }}>
//           {chart.map((d) => (
//             <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
//               <div style={{ width: "100%", display: "flex", justifyContent: "center", gap: 6, alignItems: "flex-end", height: 140 }}>
//                 <div style={{ width: 20, borderRadius: "4px 4px 0 0", height: `${(d.reels / Math.max(1, maxViews)) * 130}px`, background: "linear-gradient(to top,#7c3aed,#a78bfa)" }} />
//               </div>
//               <span style={{ fontSize: 11, color: "#9ca3af" }}>{d.day}</span>
//             </div>
//           ))}
//         </div>

//         {/* Legend */}
//         <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//             <div style={{ width: 12, height: 12, borderRadius: 3, background: "#7c3aed" }} />
//             <span style={{ fontSize: 12, color: "#6b7280" }}>Views</span>
//           </div>
//           <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//             <div style={{ width: 12, height: 12, borderRadius: 3, background: "#3b82f6" }} />
//             <span style={{ fontSize: 12, color: "#6b7280" }}>Engagement</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect } from "react";
// Dashboard data is loaded from the backend `/api/dashboard` endpoint.

const STATUS_STYLE = {
  posted:     { bg: "#22c55e", color: "#fff" },
  draft:      { bg: "#6b7280", color: "#fff" },
  scheduled:  { bg: "#3b82f6", color: "#fff" },
  processing: { bg: "#f59e0b", color: "#fff" },
};

export default function Dashboard({ setPage }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [chart, setChart] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("favorites") || "[]"); } catch { return []; }
  });

  const maxViews = chart.length ? Math.max(...chart.map((d) => d.reels || 0)) : 1;

  // Fetch dashboard data
  useEffect(() => {
    let mounted = true;
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data && data.success) {
          setStats(data.stats || {});
          setRecent(data.recent || []);
          setChart(data.chart || []);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  function toggleFavorite(filename) {
    const next = favorites.includes(filename)
      ? favorites.filter((f) => f !== filename)
      : [...favorites, filename];
    setFavorites(next);
    try { localStorage.setItem("favorites", JSON.stringify(next)); } catch {}
  }

  async function trackEvent(type, filename) {
    try {
      await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, filename }),
      });
    } catch {
      // best effort
    }
  }

  function handleCSVUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const txt = reader.result || "";
        const lines = String(txt).trim().split(/\r?\n/).slice(1);
        const byDay = {};
        for (const l of lines) {
          const cols = l.split(",").map((c) => c.trim());
          const date = cols[0];
          if (!date) continue;
          byDay[date] = (byDay[date] || 0) + 1;
        }
        const newChart = Object.keys(byDay).slice(0, 7).map((d) => ({ day: d, reels: byDay[d] }));
        setChart(newChart);
      } catch {
        // ignore parse errors
      }
    };
    reader.readAsText(file);
  }

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
        style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 28 }}
      >
        {[
          { label: "Total Reels",      icon: "🎬", color: "#ede9fe", value: stats?.totalReels      ?? "—" },
          { label: "Total Views",      icon: "👁",  color: "#dbeafe", value: stats?.totalViews      ?? "—" },
          { label: "Total Downloads",  icon: "⬇",  color: "#f0fdf4", value: stats?.totalDownloads  ?? "—" },
          { label: "Avg. Watch Time",  icon: "⏱",  color: "#fef3c7", value: stats?.avgWatchTime    ?? "—" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff", borderRadius: 16, padding: "24px",
              boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", top: 16, right: 16,
              width: 48, height: 48, borderRadius: 12,
              background: s.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>
              {s.icon}
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6b7280" }}>{s.label}</p>
            <p style={{ margin: "0 0 6px", fontSize: 32, fontWeight: 700, color: "#1a1a2e" }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 13, color: "#22c55e", fontWeight: 600 }}></p>
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
            background: "#fff", borderRadius: 16, padding: 24,
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", marginBottom: 20,
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
                background: "none", border: "none",
                color: "#7c3aed", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >
              View All
            </button>
          </div>

          {recent.map((r) => (
            <div
              key={r.filename}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 0", borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div style={{ position: "relative", flexShrink: 0, width: 72, height: 72 }}>
                <video
                  src={r.url}
                  muted
                  playsInline
                  style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 3px", fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>
                  {r.filename}
                </p>

                {/* ── per-reel counts ── */}
                <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600 }}>
                    👁 {r.viewCount ?? 0} views
                  </span>
                  <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
                    ⬇ {r.downloadCount ?? 0} downloads
                  </span>
                </div>

                <p style={{ margin: "0 0 6px", fontSize: 12, color: "#9ca3af" }}>
                  {new Date(r.createdAt).toLocaleString()}
                </p>

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={async () => {
                      const title = window.prompt("Title for gallery (leave empty to keep filename):", r.filename) || r.filename;
                      if (title === null) return;
                      const caption = window.prompt("Caption (optional):", "") || "";
                      try {
                        const res = await fetch('/api/gallery', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ filename: r.filename, title, caption }),
                        });
                        const data = await res.json();
                        if (data && data.success) alert('Saved to gallery');
                      } catch { alert('Failed to save'); }
                    }}
                    style={{
                      fontSize: 12, padding: '6px 8px', borderRadius: 8,
                      border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer',
                    }}
                  >
                    💾 Save
                  </button>

                  <a
                    href={r.url}
                    download
                    onClick={() => trackEvent('download', r.filename)}
                    style={{
                      fontSize: 12, padding: '6px 8px', borderRadius: 8,
                      border: '1px solid #e5e7eb', background: '#fff',
                      textDecoration: 'none', color: '#1a1a2e',
                    }}
                  >
                    ⬇ Download
                  </a>

                  <button
                    onClick={() => toggleFavorite(r.filename)}
                    style={{
                      fontSize: 12, padding: '6px 8px', borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      background: favorites.includes(r.filename) ? '#fffbeb' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    {favorites.includes(r.filename) ? '★ Favorited' : '☆ Favorite'}
                  </button>
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
                  width: 36, height: 36, borderRadius: 8,
                  border: "none", background: "#1a1a2e",
                  color: "#fff", fontSize: 16, cursor: "pointer",
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
            background: "#fff", borderRadius: 16, padding: 24,
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
            { icon: "🎬", label: "Create New Reel",  page: "Create"    },
            { icon: "⊞",  label: "Browse Templates", page: "Templates" },
            { icon: "📤", label: "Schedule Post",     page: "Settings"  },
            { icon: "📊", label: "View Analytics",    page: "Dashboard" },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => setPage(a.page)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "14px 0",
                background: "none", border: "none",
                borderBottom: "1px solid #f3f4f6",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <span style={{ fontSize: 16 }}>{a.icon}</span>
              <span style={{ fontSize: 14, color: "#1a1a2e", fontWeight: 500 }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Performance Chart ── */}
      <div
        style={{
          background: "#fff", borderRadius: 16, padding: 28,
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
          Performance Overview
        </h2>
        <p style={{ margin: "0 0 28px", fontSize: 13, color: "#9ca3af" }}>
          Last 7 days engagement metrics
        </p>

        {/* Bar chart (reels per day) */}
        <div style={{ display: "flex", alignItems: "flex-end", height: 160, gap: 0 }}>
          {chart.map((d) => (
            <div
              key={d.day}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
            >
              <div style={{
                width: "100%", display: "flex", justifyContent: "center",
                gap: 6, alignItems: "flex-end", height: 140,
              }}>
                <div style={{
                  width: 20, borderRadius: "4px 4px 0 0",
                  height: `${(d.reels / Math.max(1, maxViews)) * 130}px`,
                  background: "linear-gradient(to top,#7c3aed,#a78bfa)",
                }} />
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