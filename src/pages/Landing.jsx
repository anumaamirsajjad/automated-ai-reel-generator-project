import React from "react";
import { Link } from "react-router-dom";
import logo from "./logo.png";

export default function Landing() {
  const leftBadges = ["AI Powered", "Instant Reels", "Secure Platform"];
  const rightBadges = ["No Experience Needed", "Fast Workflow", "Creative Tools"];

  return (
    <div
      style={{
        height: "110vh",
        margin: 0,
        padding: 0,
        background: "linear-gradient(135deg, #1DB5E6 0%, #2563EB 50%, #1E3A8A 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "50%",
          top: "-100px",
          left: "-100px",
          animation: "float 8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "50%",
          bottom: "-50px",
          right: "-50px",
          animation: "float 10s ease-in-out infinite",
          animationDelay: "2s",
        }}
      />

      {/* Login button - top right corner */}
      <Link
        to="/auth?mode=login"
        style={{
          position: "absolute",
          top: "18px",
          right: "18px",
          padding: "12px 28px",
          background: "rgba(255, 255, 255, 0.95)",
          color: "#1E3A8A",
          textDecoration: "none",
          borderRadius: "50px",
          fontWeight: "800",
          fontSize: "14px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          transition: "all 0.3s ease",
          cursor: "pointer",
          border: "none",
          zIndex: 10,
          letterSpacing: "0.5px",
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.2)";
        }}
      >
        Login
      </Link>

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "1200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "22px",
          padding: "20px 24px",
        }}
      >
        <div className="landing-side-column">
          {leftBadges.map((badge) => (
            <div key={badge} className="landing-side-badge">{badge}</div>
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            color: "white",
            maxWidth: "760px",
            width: "100%",
          }}
        >
        {/* Logo */}
        <div
          style={{
            marginBottom: "24px",
            animation: "bounce 2s ease-in-out infinite",
          }}
        >
          <img
            src={logo}
            alt="Reelify Logo"
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "30px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Main heading */}
        <h1
          style={{
            fontSize: "clamp(44px, 7vw, 72px)",
            fontWeight: "900",
            marginBottom: "12px",
            textShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
            animation: "slideUp 1s ease-out",
            letterSpacing: "-1px",
            lineHeight: 1.05,
          }}
        >
          Welcome to <br /> <span style={{ color: "#22D3EE", fontWeight: "900" }}>Reelify</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "clamp(18px, 2.4vw, 24px)",
            fontWeight: "700",
            marginBottom: "10px",
            opacity: 0.98,
            animation: "slideUp 1s ease-out 0.2s both",
            letterSpacing: "-0.5px",
          }}
        >
          Create stunning AI-powered video reels in seconds
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: "clamp(14px, 1.8vw, 17px)",
            fontWeight: "500",
            opacity: 0.9,
            lineHeight: "1.6",
            marginBottom: "28px",
            animation: "slideUp 1s ease-out 0.4s both",
            letterSpacing: "0.3px",
          }}
        >
          Transform your ideas into captivating video content with our intelligent reel generation engine. 
          Perfect for creators, marketers, and businesses looking to stand out.
        </p>

        {/* Features */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "12px",
            marginBottom: "26px",
            animation: "slideUp 1s ease-out 0.6s both",
          }}
        >
          {[
            { label: "AI-Powered" },
            { label: "Lightning Fast" },
            { label: "Creative Tools" },
          ].map((feature, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                padding: "14px 12px",
                borderRadius: "16px",
                border: "2px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <div style={{ fontSize: "26px", marginBottom: "6px" }}>{feature.icon}</div>
              <div style={{ fontSize: "14px", fontWeight: "700", letterSpacing: "0.5px" }}>{feature.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Link
          to="/auth?mode=signup"
          style={{
            display: "inline-block",
            padding: "14px 40px",
            background: "white",
            color: "#1E3A8A",
            textDecoration: "none",
            borderRadius: "50px",
            fontWeight: "900",
            fontSize: "16px",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
            transition: "all 0.3s ease",
            border: "none",
            cursor: "pointer",
            animation: "slideUp 1s ease-out 0.8s both",
            letterSpacing: "0.5px",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-4px)";
            e.target.style.boxShadow = "0 16px 50px rgba(0, 0, 0, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.25)";
          }}
        >
          Get Started
        </Link>
        </div>

        <div className="landing-side-column">
          {rightBadges.map((badge) => (
            <div key={badge} className="landing-side-badge">{badge}</div>
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        .landing-side-column {
          width: 210px;
          display: none;
        }

        .landing-side-badge {
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.28);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-align: center;
          padding: 12px 14px;
          animation: slideUp 0.8s ease-out;
        }

        @media (max-width: 980px) {
          .landing-side-column {
            display: none;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(20px);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

//LANDING PAGE