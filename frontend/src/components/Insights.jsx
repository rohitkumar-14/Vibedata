import React, { useState, useEffect } from "react";
import { Sparkles, ChevronRight, Lightbulb, Target, AlertTriangle, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function Insights({ onNextStep, summary }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(insight);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchInsights = async () => {
    setLoading(true);
    setError("");
    setInsight("");
    try {
      const query = `Based on the entire dataset summary, identify potential root causes for any anomalies, summarize key findings, and provide 3 actionable business recommendations.`;
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          data_preview: summary,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setInsight(data.insights);
      } else {
        setError("Unable to generate insights from the AI engine at this time.");
      }
    } catch (err) {
      setError("Failed to connect to AI server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (summary) {
      fetchInsights();
    }
  }, []);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div className="glass-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Lightbulb size={24} style={{ color: "var(--accent-amber)" }} /> Phase 10: Insights & Recommendations
          </h3>
          <button className="btn-primary" onClick={onNextStep}>
            Next: Communication & Export <ChevronRight size={16} />
          </button>
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "2rem" }}>
          The AI engine analyzes the dataset's statistical profile, distributions, and correlations to automatically identify potential root causes and generate actionable business recommendations.
        </p>

        <div style={{ display: "flex", gap: "2rem", flexDirection: "column" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-dark)" }}>
              <Sparkles size={18} style={{ color: "var(--primary-purple)" }} /> Executive AI Analysis
            </h4>
            <button onClick={fetchInsights} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} disabled={loading}>
              {loading ? "Generating Observations..." : "Regenerate Insights"}
            </button>
          </div>

          {loading ? (
             <div style={{ textAlign: "center", padding: "4rem" }}>
               <div className="loader-spinner" style={{ margin: "0 auto 1rem auto" }}></div>
               <p style={{ color: "var(--text-muted)" }}>Synthesizing data profile, calculating key metrics, and formulating recommendations...</p>
             </div>
          ) : error ? (
            <div style={{ color: "var(--accent-rose)", background: "rgba(244, 63, 94, 0.05)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(244, 63, 94, 0.15)" }}>
              <AlertTriangle size={18} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "middle" }} />
              {error}
            </div>
          ) : insight ? (
            <div className="insight-text-box fade-in" style={{ position: "relative", background: "rgba(255, 255, 255, 0.02)", borderLeft: "4px solid var(--secondary-cyan)", padding: "2rem", borderRadius: "0 10px 10px 0" }}>
              <button 
                onClick={handleCopy}
                style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "0.4rem 0.6rem", display: "flex", alignItems: "center", gap: "0.4rem", color: copied ? "var(--accent-emerald)" : "var(--text-muted)", cursor: "pointer", transition: "all 0.2s" }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span style={{ fontSize: "0.75rem" }}>{copied ? "Copied" : "Copy"}</span>
              </button>
              <div className="markdown-insight">
                <ReactMarkdown>{insight}</ReactMarkdown>
              </div>
            </div>
          ) : null}

          {/* Quick Actions Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginTop: "1rem" }}>
            <div className="glass-card" style={{ margin: 0, background: "rgba(139, 92, 246, 0.05)", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
              <Target size={24} style={{ color: "var(--primary-purple)", marginBottom: "1rem" }} />
              <h4 style={{ color: "var(--text-dark)", marginBottom: "0.5rem" }}>Identify Root Causes</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Highlights correlations (e.g., regional manager changes affecting West region sales) driving the primary metrics.</p>
            </div>
            <div className="glass-card" style={{ margin: 0, background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <Lightbulb size={24} style={{ color: "var(--accent-emerald)", marginBottom: "1rem" }} />
              <h4 style={{ color: "var(--text-dark)", marginBottom: "0.5rem" }}>Actionable Recommendations</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Provides clear, quantified next steps based on the data findings (e.g., new marketing strategy).</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
