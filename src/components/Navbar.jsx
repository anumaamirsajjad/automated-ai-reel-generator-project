export default function Navbar({ page, setPage }) {
  const NAV = ["Dashboard", "Create", "Gallery", "Templates", "Settings"];
  const ICONS = {
    Dashboard: "⊞",
    Create: "+",
    Gallery: "🗂",
    Templates: "▶",
    Settings: "⚙",
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: 64,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg,#7c3aed,#a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            📹
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>
              Reel Generator
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              AI-Powered Video Creation
            </div>
          </div>
        </div>

        {/* Quick Create button */}
        <button
          onClick={() => setPage("Create")}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: 10,
            background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 4px 12px rgba(124,58,237,0.35)",
          }}
        >
          + Quick Create
        </button>
      </div>

      {/* Nav tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 4,
          padding: "8px 0 0",
          borderTop: "1px solid #f3f4f6",
        }}
      >
        {NAV.map((n) => (
          <button
            key={n}
            onClick={() => setPage(n)}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px 8px 0 0",
              background: "transparent",
              cursor: "pointer",
              color: page === n ? "#7c3aed" : "#6b7280",
              fontWeight: page === n ? 600 : 400,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderBottom:
                page === n ? "2px solid #7c3aed" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            <span>{ICONS[n]}</span> {n}
          </button>
        ))}
      </div>
    </header>
  );
}