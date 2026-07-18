import SkeletonLoader from './SkeletonLoader';
import React, { useState } from "react";
import { Search, ChevronRight, Target, Sparkles, AlertCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Cell } from "recharts";

export default function RCA({ onNextStep, summary }) {
  const [rcaConfig, setRcaConfig] = useState({ metric_col: "", slice_col: "" });
  const [rcaData, setRcaData] = useState(null);
  const [loadingRca, setLoadingRca] = useState(false);
  const [rcaError, setRcaError] = useState("");

  // AI State
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const columns = Object.keys(summary.columns || {});
  const numericColumns = columns.filter((col) => summary.columns[col].stats.mean !== undefined);
  const categoricalColumns = columns.filter((col) => summary.columns[col].stats.mean === undefined);

  const handleRcaSubmit = async (e) => {
    e.preventDefault();
    if (!rcaConfig.metric_col || !rcaConfig.slice_col) return;
    setLoadingRca(true); setRcaError(""); setRcaData(null);
    setAiInsight("");
    try {
      const response = await fetch("/api/ml/root_cause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rcaConfig)
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setRcaData(data);
      } else {
        setRcaError(data.message || "Failed to calculate root cause variance.");
      }
    } catch (err) { setRcaError("Network error."); } 
    finally { setLoadingRca(false); }
  };

  const generateAIInsight = async (dataPayload) => {
    setAiLoading(true);
    setAiError("");
    setAiInsight("");

    const topDrivers = dataPayload.drivers.slice(0, 3);
    const query = `Analyze this Root Cause Analysis (Dimensional Contribution). The total value of '${dataPayload.metric_col}' is ${dataPayload.total_value.toLocaleString()}. We sliced this by '${dataPayload.slice_col}'. The top 3 categories driving this total are: ${JSON.stringify(topDrivers)}. Write a concise, 3-bullet executive summary explaining exactly which categories are the primary drivers of this metric and what this means for the business.`;

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, data_preview: null })
      });
      const aiResponse = await response.json();
      if (response.ok && aiResponse.insights) {
        setAiInsight(aiResponse.insights);
      } else {
        setAiError(aiResponse.detail || aiResponse.message || "Failed to generate AI diagnosis.");
      }
    } catch (err) {
      setAiError("Network error requesting AI explanation.");
    } finally {
      setAiLoading(false);
    }
  };

  const parseBold = (str) => {
    const parts = str.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} style={{ color: "var(--text-dark)" }}>{part}</strong> : part);
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) return <h5 key={idx} style={{ color: "var(--text-dark)", marginTop: "1rem", marginBottom: "0.5rem", fontSize: "0.95rem" }}>{parseBold(line.replace("### ", ""))}</h5>;
      if (line.startsWith("## ")) return <h4 key={idx} style={{ color: "var(--text-dark)", marginTop: "1.25rem", marginBottom: "0.5rem", fontSize: "1.1rem" }}>{parseBold(line.replace("## ", ""))}</h4>;
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) return <li key={idx} style={{ color: "var(--text-muted)", marginLeft: "1.25rem", marginBottom: "0.4rem", listStyleType: "disc", fontSize: "0.9rem", lineHeight: "1.5" }}>{parseBold(line.trim().substring(2))}</li>;
      if (!line.trim()) return <div key={idx} style={{ height: "0.5rem" }} />;
      return <p key={idx} style={{ color: "var(--text-muted)", margin: "0 0 0.75rem 0", lineHeight: "1.5", fontSize: "0.9rem" }}>{parseBold(line)}</p>;
    });
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div className="glass-card" style={{ padding: "2rem" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h3 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Search size={24} style={{ color: "var(--accent-amber)" }} /> Root Cause Analysis
            </h3>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "600px" }}>
              Identify which specific categories or slices of your data are driving the total value of your core metrics.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "2rem", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: "2rem" }}>
            <div style={{ flex: "0 0 320px" }}>
              <form onSubmit={handleRcaSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", background: "var(--bg-card-hover)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ margin: 0, color: "var(--text-dark)" }}>Diagnostic Configuration</h4>
                <div className="form-group">
                  <label>Primary Metric (e.g., Revenue)</label>
                  <select value={rcaConfig.metric_col} onChange={e => setRcaConfig({...rcaConfig, metric_col: e.target.value})} required>
                    <option value="">Select Metric...</option>
                    {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Slice / Dimension (e.g., Region)</label>
                  <select value={rcaConfig.slice_col} onChange={e => setRcaConfig({...rcaConfig, slice_col: e.target.value})} required>
                    <option value="">Select Dimension...</option>
                    {categoricalColumns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn-primary" disabled={loadingRca} style={{ background: "linear-gradient(135deg, var(--accent-amber), #b45309)" }}>
                  {loadingRca ? "Analyzing Variance..." : "Run Root Cause Diagnostics"}
                </button>
              </form>
              {rcaError && <div style={{ color: "var(--accent-rose)", marginTop: "1rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><AlertCircle size={16} /> {rcaError}</div>}
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
              {!rcaData && !loadingRca && (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border-color)", borderRadius: "10px", color: "var(--text-muted)" }}>
                  Select a metric and a dimension to analyze.
                </div>
              )}
              {rcaData && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
                    <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Total {rcaData.metric_col}</div>
                      <div style={{ color: "var(--text-dark)", fontSize: "1.75rem", fontWeight: 600 }}>{rcaData.total_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    </div>
                    <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Top Driver Category</div>
                      <div style={{ color: "var(--accent-amber)", fontSize: "1.5rem", fontWeight: 600 }}>{rcaData.drivers.length > 0 ? rcaData.drivers[0].category : "N/A"}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>Contributes {rcaData.drivers.length > 0 ? rcaData.drivers[0].contribution_pct.toFixed(1) : 0}%</div>
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-card-hover)", borderRadius: "10px", border: "1px solid var(--border-color)", padding: "1.5rem", height: "300px" }}>
                    <h4 style={{ color: "var(--text-dark)", margin: "0 0 1rem 0", fontSize: "0.9rem" }}>% Contribution to Total</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rcaData.drivers.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="var(--text-dark)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                        <YAxis type="category" dataKey="category" stroke="var(--text-dark)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} width={120} />
                        <ChartTooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} content={({ active, payload }) => active && payload && payload.length ? <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "8px" }}><p style={{color:"white", margin:0, fontWeight: 600}}>{payload[0].payload.category}</p><p style={{color:"var(--accent-amber)", margin:"0.25rem 0 0 0", fontSize: "0.85rem"}}>Contribution: {payload[0].payload.contribution_pct.toFixed(2)}%</p><p style={{color:"var(--text-muted)", margin:"0.25rem 0 0 0", fontSize: "0.8rem"}}>Value: {payload[0].payload.value.toLocaleString(undefined, {maximumFractionDigits: 2})}</p></div> : null} />
                        <Bar dataKey="contribution_pct" radius={[0, 4, 4, 0]} barSize={20}>
                          {rcaData.drivers.slice(0, 10).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? "#f59e0b" : "#d97706"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* AI RCA Agent Section */}
          {rcaData && (
            <div style={{ background: "rgba(15, 23, 42, 0.3)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Sparkles size={18} style={{ color: "var(--accent-amber)" }} />
                  <h4 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1rem" }}>AI Root Cause Diagnosis</h4>
                </div>
                {!aiInsight && !aiLoading && (
                  <button className="btn-primary" onClick={() => generateAIInsight(rcaData)} style={{ fontSize: "0.85rem", padding: "0.5rem 1rem", background: "linear-gradient(135deg, var(--accent-amber), #b45309)" }}>Generate AI Diagnosis</button>
                )}
              </div>
              {aiLoading && <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}><SkeletonLoader height="30px" width="50%" /><SkeletonLoader height="150px" width="100%" /></div>}
              {aiError && <div style={{ color: "var(--accent-rose)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}><AlertCircle size={16} /> {aiError}</div>}
              {aiInsight && <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "8px", padding: "1rem 1.25rem", maxHeight: "250px", overflowY: "auto" }}>{renderMarkdown(aiInsight)}</div>}
            </div>
          )}

        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-primary" onClick={onNextStep}>
          Next: Dashboard & Charts <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
