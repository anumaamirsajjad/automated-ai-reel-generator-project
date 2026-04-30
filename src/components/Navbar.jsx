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
        borderBottom: "2px solid #1DB5E6",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
            <div style={{ fontWeight: 900, fontSize: 18, color: "#1E3A8A", letterSpacing: "-0.5px" }}>
              Reelify
            </div>
            <div style={{ fontSize: 11, color: "#1E40AF", fontWeight: 600 }}>
              AI Video Creation
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
                color: "white",
                background: "linear-gradient(135deg, #1DB5E6, #2563EB)",
                border: "2px solid #1E3A8A",
              }}
            >
              Rendering...
            </span>
          )}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "#1E3A8A", fontSize: "14px", fontWeight: "700", letterSpacing: "0.5px" }}>
                Welcome, {user.username}
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                style={{
                  padding: "8px 16px",
                  border: "2px solid #1DB5E6",
                  borderRadius: 8,
                  background: "white",
                  color: "#1E3A8A",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  letterSpacing: "0.5px"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#E0F2FE";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "white";
                  e.target.style.transform = "translateY(0)";
                }}
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
              color: location.pathname === item.path ? "#1E3A8A" : "#6b7280",
              fontWeight: location.pathname === item.path ? 600 : 400,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderBottom:
                location.pathname === item.path ? "2px solid #1E3A8A" : "2px solid transparent",
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