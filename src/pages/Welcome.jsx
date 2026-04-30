import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { buildApiUrl } from "../lib/api";
import bgImage from "./bg.png";

export default function Welcome() {
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

      const data = await response.json();

      if (response.ok) {
        // Store auth token/session
        login(data.user, data.token);
        navigate("/create"); // Redirect to main app
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setError("Network error. Please try again.");
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
      height: "100vh",
      background: `url(${bgImage}) center/cover no-repeat`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background overlay for better text readability */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(1px)"
      }}></div>
      {/* App Branding */}
      <div style={{
        textAlign: "center",
        marginBottom: "20px",
        color: "#1a1a2e",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "20px",
          background: "linear-gradient(135deg,#7c3aed,#a855f7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "36px",
          margin: "0 auto 20px",
          boxShadow: "0 8px 32px rgba(124, 58, 237, 0.3)"
        }}>
          📹
        </div>
        <h1 style={{
          fontSize: "32px",
          fontWeight: "700",
          margin: "0 0 8px 0",
          textShadow: "0 2px 4px rgba(0,0,0,0.1)",
          color: "#1a1a2e"
        }}>
          Reel Generator
        </h1>
        <p style={{
          fontSize: "16px",
          opacity: 0.9,
          margin: 0,
          textShadow: "0 1px 2px rgba(0,0,0,0.1)",
          color: "#374151"
        }}>
          AI-Powered Video Creation
        </p>
      </div>

      {/* Auth Form */}
      <div style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "20px",
        padding: "20px",
        width: "100%",
        maxWidth: "350px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        position: "relative",
        zIndex: 1
      }}>
        <h2 style={{
          textAlign: "center",
          margin: "0 0 30px 0",
          color: "#1a1a2e",
          fontSize: "24px",
          fontWeight: "600"
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
            fontSize: "14px",
            border: "1px solid #fecaca"
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
                color: "#374151",
                fontSize: "14px",
                fontWeight: "500"
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
                  border: "2px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "16px",
                  transition: "border-color 0.2s",
                  outline: "none",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              color: "#374151",
              fontSize: "14px",
              fontWeight: "500"
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
                border: "2px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: "16px",
                transition: "border-color 0.2s",
                outline: "none",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              color: "#374151",
              fontSize: "14px",
              fontWeight: "500"
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
                border: "2px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: "16px",
                transition: "border-color 0.2s",
                outline: "none",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: "30px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#374151",
                fontSize: "14px",
                fontWeight: "500"
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
                  border: "2px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "16px",
                  transition: "border-color 0.2s",
                  outline: "none",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
              marginBottom: "20px",
              opacity: isLoading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(124, 58, 237, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(124, 58, 237, 0.3)";
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
              color: "#7c3aed",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              textDecoration: "underline",
              padding: "8px",
              borderRadius: "6px",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(124, 58, 237, 0.1)"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: "20px",
        textAlign: "center",
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: "14px",
        position: "relative",
        zIndex: 1
      }}>
        <p>Secure authentication powered by AI</p>
      </div>
    </div>
  );
}