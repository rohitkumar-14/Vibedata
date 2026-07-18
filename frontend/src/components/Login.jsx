import React, { useState } from "react";
import { Lock, ShieldCheck, Database, Key, Eye, EyeOff, ArrowLeft, Sparkles, Zap } from "lucide-react";

export default function Login({ onLogin, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (response.ok && data.token) {
        onLogin(data.token);
      } else {
        setError(data.detail || "Invalid credentials.");
      }
    } catch (err) {
      setError("Network error. Could not connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "var(--bg-dark)", padding: "1rem", position: "relative", overflow: "hidden" }}>
      
      {/* Background effects */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />

      {/* Back to landing */}
      {onBack && (
        <button onClick={onBack} style={{ position: "absolute", top: "2rem", left: "2rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "0.6rem 1rem", borderRadius: "10px", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", zIndex: 10, transition: "all 0.3s ease" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "white"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}

      <div className="glass-card fade-in" style={{ width: "100%", maxWidth: "420px", padding: "2.5rem", margin: 0, position: "relative", zIndex: 10 }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", marginBottom: "1.25rem", fontSize: "1.3rem", fontWeight: 800, color: "white", boxShadow: "0 8px 24px rgba(139, 92, 246, 0.3)" }}>
            V
          </div>
          <h2 style={{ margin: "0 0 0.5rem 0", color: "var(--text-dark)", fontSize: "1.5rem" }}>Welcome Back</h2>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem" }}>Sign in to your VibeData workspace</p>
          <div style={{ marginTop: "1rem", padding: "0.6rem", background: "rgba(139, 92, 246, 0.08)", border: "1px dashed rgba(139, 92, 246, 0.25)", borderRadius: "10px", fontSize: "0.8rem", color: "var(--text-main)", textAlign: "center" }}>
            <span style={{ color: "var(--primary-purple)", fontWeight: "bold" }}>Demo Login:</span> admin / admin123
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {error && (
            <div style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)", color: "var(--accent-rose)", padding: "0.75rem", borderRadius: "10px", fontSize: "0.85rem", textAlign: "center" }}>
              {error}
            </div>
          )}
            
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", marginBottom: "0.4rem", fontWeight: 500 }}>
              <ShieldCheck size={14} style={{ color: "var(--secondary-cyan)" }}/> Username
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusedField("username")}
              onBlur={() => setFocusedField(null)}
              placeholder="Enter corporate ID"
              required
              style={{ 
                padding: "0.85rem", 
                borderColor: focusedField === "username" ? "rgba(139,92,246,0.5)" : undefined,
                boxShadow: focusedField === "username" ? "0 0 0 3px rgba(139,92,246,0.1)" : undefined,
                transition: "border-color 0.2s, box-shadow 0.2s"
              }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", marginBottom: "0.4rem", fontWeight: 500 }}>
              <Key size={14} style={{ color: "var(--accent-amber)" }}/> Password
            </label>
            <div style={{ position: "relative" }}>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                required
                style={{ 
                  padding: "0.85rem", 
                  paddingRight: "3rem",
                  width: "100%",
                  borderColor: focusedField === "password" ? "rgba(139,92,246,0.5)" : undefined,
                  boxShadow: focusedField === "password" ? "0 0 0 3px rgba(139,92,246,0.1)" : undefined,
                  transition: "border-color 0.2s, box-shadow 0.2s"
                }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.25rem", display: "flex" }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "1rem", marginTop: "0.5rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem" }}>
            {loading ? <span className="loader-spinner" style={{ width: "20px", height: "20px" }}></span> : <><Lock size={16} /> Sign In</>}
          </button>
        </form>

        {/* Trust footer */}
        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          {[
            { icon: <ShieldCheck size={13} />, text: "Zero-Trust" },
            { icon: <Lock size={13} />, text: "Encrypted" },
            { icon: <Zap size={13} />, text: "SSO Ready" },
          ].map((badge, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>
              {badge.icon} {badge.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
