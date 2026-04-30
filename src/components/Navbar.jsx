import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logo from "../pages/logo.png";

export default function Navbar({ generationStatus = "idle" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const NAV = [
    { name: "Create", path: "/create", icon: "+" },
    { name: "Gallery", path: "/gallery", icon: "🗂" },
    { name: "Templates", path: "/templates", icon: "▶" },
    { name: "Settings", path: "/settings", icon: "⚙" },
  ];

  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      const updatedSettings = event.detail;
      if (updatedSettings) {
        console.log("Settings updated:", updatedSettings);
      }
    };

    window.addEventListener("settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("settings-updated", handleSettingsUpdate);
  }, []);

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
          <img
            src={logo}
            alt="Reelify Logo"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              objectFit: "cover",
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>
              Reelify
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              AI-Powered Video Creation
            </div>
          </div>
        </div>

        {/* Quick Create button */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {generationStatus === "running" && (
            <span
              style={{
                padding: "7px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                color: "#6d28d9",
                background: "#ede9fe",
                border: "1px solid #ddd6fe",
              }}
            >
              Rendering...
            </span>
          )}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "#374151", fontSize: "14px" }}>
                Welcome, {user.username}
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  background: "white",
                  color: "#374151",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#f9fafb"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
              >
                Logout
              </button>
            </div>
          )}
        </div>
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
        {NAV.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px 8px 0 0",
              background: "transparent",
              cursor: "pointer",
              color: location.pathname === item.path ? "#7c3aed" : "#6b7280",
              fontWeight: location.pathname === item.path ? 600 : 400,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderBottom:
                location.pathname === item.path ? "2px solid #7c3aed" : "2px solid transparent",
              transition: "all 0.15s",
              textDecoration: "none",
            }}
          >
            <span>{item.icon}</span> {item.name}
          </Link>
        ))}
      </div>
    </header>
  );
}