import React, { useState } from "react";
import { buildApiUrl } from "../lib/api";

export default function Welcome() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? "/api/login" : "/api/register";
    try {
      const response = await fetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        alert("Success");
      } else {
        alert("Failed");
      }
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{isLogin ? "Sign In" : "Sign Up"}</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "0 auto" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: 10, padding: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: 10, padding: 10 }}
        />
        <button type="submit" style={{ padding: "10px 20px", cursor: "pointer" }}>
          {isLogin ? "Sign In" : "Sign Up"}
        </button>
      </form>
      <button
        onClick={() => setIsLogin(!isLogin)}
        style={{ marginTop: 10, cursor: "pointer" }}
      >
        {isLogin ? "Create an account" : "Already have an account? Sign In"}
      </button>
    </div>
  );
}