import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL, buildApiUrl } from "../lib/api";
import logo from "./logo.png";

async function readJsonSafe(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return {
    message: text.slice(0, 180) || `Request failed with status ${response.status}`,
  };
}

export default function Welcome() {
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    confirmPassword: ""
  });
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = (params.get("mode") || "").toLowerCase();
    if (mode === "signup") {
      setIsLogin(false);
    } else if (mode === "login") {
      setIsLogin(true);
    }
  }, [location.search]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(""); // Clear error on input change
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return false;
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return false;
    }
    if (!isLogin && !formData.username) {
      setError("Username is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/login" : "/api/register";
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : { username: formData.username, email: formData.email, password: formData.password };

    try {
      const response = await fetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJsonSafe(response);

      if (response.ok) {
        // Store auth token/session
        login(data.user, data.token);
        navigate("/create"); // Redirect to main app
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      const hint = API_BASE_URL
        ? `Cannot reach API at ${API_BASE_URL}.`
        : "Cannot reach backend at http://localhost:5000.";
      setError(`Network error. ${hint} Ensure the backend server is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({
      email: "",
      password: "",
      username: "",
      confirmPassword: ""
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1DB5E6 0%, #2563EB 50%, #1E3A8A 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 12px",
      position: "relative",
      overflowX: "hidden",
      overflowY: "auto",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInDown { from { opacity: 0; transform: translateY(-40px); } to { opacity: 1; transform: translateY(0); } }
        .center-stack {
          width: 100%;
          max-width: 380px;
          text-align: center;
          color: white;
          position: relative;
          z-index: 1;
        }
      `}</style>

      {/* Background overlay for better text readability */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.15)",
        backdropFilter: "blur(1px)"
      }}></div>

      <div className="center-stack">
          {/* App Branding */}
          <div style={{
            marginBottom: "18px",
            animation: "slideInDown 0.8s ease-out"
          }}>
            <div style={{
              animation: "bounce 3s ease-in-out infinite",
              display: "inline-block"
            }}>
              <img
                src={logo}
                alt="Reelify Logo"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "20px",
                  margin: "0 auto 16px",
                  objectFit: "cover",
                  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)",
                  border: "3px solid rgba(255, 255, 255, 0.3)"
                }}
              />
            </div>
            <h1 style={{
              fontSize: "44px",
              fontWeight: "900",
              margin: "0 0 6px 0",
              textShadow: "0 4px 12px rgba(0,0,0,0.2)",
              color: "white",
              letterSpacing: "-1px"
            }}>
              Reelify
            </h1>
            <p style={{
              fontSize: "15px",
              opacity: 0.95,
              margin: 0,
              textShadow: "0 2px 6px rgba(0,0,0,0.15)",
              color: "white",
              fontWeight: "600",
              letterSpacing: "0.5px"
            }}>
              Create AI-powered video reels
            </p>
          </div>

          {/* Auth Form */}
          <div style={{
            background: "rgba(219, 234, 254, 0.96)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "20px",
            width: "100%",
            maxWidth: "350px",
            margin: "0 auto",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            position: "relative",
            zIndex: 1,
            animation: "slideInUp 0.8s ease-out"
          }}>
        <h2 style={{
          textAlign: "center",
          margin: "0 0 30px 0",
          color: "#1E3A8A",
          fontSize: "26px",
          fontWeight: "900",
          letterSpacing: "-0.5px"
        }}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>

        {error && (
          <div style={{
            background: "#fee2e2",
            color: "#dc2626",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "13px",
            border: "2px solid #fca5a5",
            fontWeight: "600"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#1E3A8A",
                fontSize: "14px",
                fontWeight: "700",
                letterSpacing: "0.5px"
              }}>
                Username
              </label>
              <input
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleInputChange}
                required={!isLogin}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #1DB5E6",
                  borderRadius: "10px",
                  fontSize: "15px",
                  transition: "border-color 0.2s",
                  outline: "none",
                  boxSizing: "border-box",
                  backgroundColor: "#f0f7ff",
                  fontWeight: "500"
                }}
                onFocus={(e) => e.target.style.borderColor = "#2563EB"}
                onBlur={(e) => e.target.style.borderColor = "#1DB5E6"}
              />
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              color: "#1E3A8A",
              fontSize: "14px",
              fontWeight: "700",
              letterSpacing: "0.5px"
            }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #1DB5E6",
                borderRadius: "10px",
                fontSize: "15px",
                transition: "border-color 0.2s",
                outline: "none",
                boxSizing: "border-box",
                backgroundColor: "#f0f7ff",
                fontWeight: "500"
              }}
              onFocus={(e) => e.target.style.borderColor = "#2563EB"}
              onBlur={(e) => e.target.style.borderColor = "#1DB5E6"}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              color: "#1E3A8A",
              fontSize: "14px",
              fontWeight: "700",
              letterSpacing: "0.5px"
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #1DB5E6",
                borderRadius: "10px",
                fontSize: "15px",
                transition: "border-color 0.2s",
                outline: "none",
                boxSizing: "border-box",
                backgroundColor: "#f0f7ff",
                fontWeight: "500"
              }}
              onFocus={(e) => e.target.style.borderColor = "#2563EB"}
              onBlur={(e) => e.target.style.borderColor = "#1DB5E6"}
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: "30px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#1E3A8A",
                fontSize: "14px",
                fontWeight: "700",
                letterSpacing: "0.5px"
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required={!isLogin}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #1DB5E6",
                  borderRadius: "10px",
                  fontSize: "15px",
                  transition: "border-color 0.2s",
                  outline: "none",
                  boxSizing: "border-box",
                  backgroundColor: "#f0f7ff",
                  fontWeight: "500"
                }}
                onFocus={(e) => e.target.style.borderColor = "#2563EB"}
                onBlur={(e) => e.target.style.borderColor = "#1DB5E6"}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #1DB5E6, #2563EB)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "900",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 12px rgba(29, 181, 230, 0.4)",
              marginBottom: "20px",
              opacity: isLoading ? 0.7 : 1,
              letterSpacing: "0.5px"
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(29, 181, 230, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(29, 181, 230, 0.4)";
              }
            }}
          >
            {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
          </button>
        </form>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={toggleMode}
            style={{
              background: "none",
              border: "none",
              color: "#1E40AF",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              textDecoration: "underline",
              padding: "8px",
              borderRadius: "6px",
              transition: "background-color 0.2s",
              letterSpacing: "0.5px"
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(29, 181, 230, 0.1)"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: "14px",
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.9)",
            fontSize: "14px",
            position: "relative",
            zIndex: 1
          }}>
            <p style={{ margin: 0, fontWeight: 600, letterSpacing: "0.3px", animation: "slideInUp 1s ease-out" }}>Secure authentication powered by AI</p>
          </div>
        </div>
      </div>
    
    
  );
}