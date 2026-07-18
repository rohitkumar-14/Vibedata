import SkeletonLoader from './SkeletonLoader';
import React, { useState } from "react";
import { Table, Link, Activity, ChevronRight, Calculator, Sparkles, AlertCircle, TrendingUp, FlaskConical, Filter, BarChart } from "lucide-react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Cell, ComposedChart, Line, Legend } from "recharts";

export default function DeeperAnalysis({ onNextStep, summary }) {
  const [activeTab, setActiveTab] = useState("pivot");
  const [eli5Mode, setEli5Mode] = useState(false);

  // AI State
  const [aiInsights, setAiInsights] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [aiErrors, setAiErrors] = useState({});

  const columns = Object.keys(summary.columns || {});
  const numericColumns = columns.filter((col) => summary.columns[col].stats.mean !== undefined);
  const categoricalColumns = columns.filter((col) => summary.columns[col].stats.mean === undefined);

  // Pivot State
  const [pivotConfig, setPivotConfig] = useState({ index_col: "", columns_col: "", values_col: "", aggfunc: "mean" });
  const [pivotData, setPivotData] = useState(null);
  const [loadingPivot, setLoadingPivot] = useState(false);
  const [pivotError, setPivotError] = useState("");

  // Correlation State
  const [correlation, setCorrelation] = useState(null);
  const [loadingCorr, setLoadingCorr] = useState(false);
  const [corrError, setCorrError] = useState("");
  const [corrMethod, setCorrMethod] = useState("pearson");

  // Dimensionality State
  const [dimData, setDimData] = useState(null);
  const [loadingDim, setLoadingDim] = useState(false);
  const [dimError, setDimError] = useState("");
  const [dimAlgorithm, setDimAlgorithm] = useState("pca");

  // Linear Regression State
  const [regConfig, setRegConfig] = useState({ x_cols: [], y_col: "" });
  const [regData, setRegData] = useState(null);
  const [loadingReg, setLoadingReg] = useState(false);
  const [regError, setRegError] = useState("");

  // T-Test State
  const [ttestConfig, setTtestConfig] = useState({ group_col: "", value_col: "", group1: "", group2: "" });
  const [ttestData, setTtestData] = useState(null);
  const [loadingTtest, setLoadingTtest] = useState(false);
  const [ttestError, setTtestError] = useState("");
  
  // ANOVA State
  const [anovaConfig, setAnovaConfig] = useState({ group_col: "", value_col: "" });
  const [anovaData, setAnovaData] = useState(null);
  const [loadingAnova, setLoadingAnova] = useState(false);
  const [anovaError, setAnovaError] = useState("");

  // Chi-Square State
  const [chiConfig, setChiConfig] = useState({ col1: "", col2: "" });
  const [chiData, setChiData] = useState(null);
  const [loadingChi, setLoadingChi] = useState(false);
  const [chiError, setChiError] = useState("");

  // Logistic Regression State
  const [logRegConfig, setLogRegConfig] = useState({ x_cols: [], y_col: "" });
  const [logRegData, setLogRegData] = useState(null);
  const [loadingLogReg, setLoadingLogReg] = useState(false);
  const [logRegError, setLogRegError] = useState("");

  // Options for T-Test / ANOVA grouping
  const groupColMeta = ttestConfig.group_col ? summary.columns[ttestConfig.group_col] : null;
  const groupOptions = groupColMeta?.stats?.top_values?.map(tv => tv.value) || [];

  const handlePivotSubmit = async (e) => {
    e.preventDefault();
    if (!pivotConfig.values_col) return;
    setLoadingPivot(true); setPivotError(""); setPivotData(null);
    setAiInsights(prev => ({...prev, pivot: ""}));
    try {
      const response = await fetch("/api/pivot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pivotConfig)
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setPivotData(data);
      } else {
        setPivotError(data.message || "Failed to generate pivot table.");
      }
    } catch (err) { setPivotError("Network error."); } 
    finally { setLoadingPivot(false); }
  };

  const fetchCorrelation = async (method = corrMethod) => {
    setLoadingCorr(true); setCorrError(""); setCorrelation(null);
    setAiInsights(prev => ({...prev, correlation: ""}));
    try {
      const response = await fetch(`/api/stats/correlation?method=${method}`);
      const data = await response.json();
      if (response.ok) {
        setCorrelation(data);
      } else {
        setCorrError(data.detail || "Failed to fetch correlation matrix.");
      }
    } catch (err) { setCorrError("Network error."); } 
    finally { setLoadingCorr(false); }
  };

  const handleCorrMethodChange = (e) => {
    const newMethod = e.target.value;
    setCorrMethod(newMethod);
    fetchCorrelation(newMethod);
  };

  const fetchDimensionality = async () => {
    setLoadingDim(true); setDimError(""); setDimData(null);
    setAiInsights(prev => ({...prev, dimensionality: ""}));
    try {
      const response = await fetch("/api/stats/dimensionality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ algorithm: dimAlgorithm })
      });
      const data = await response.json();
      if (response.ok) {
        setDimData(data);
      } else {
        setDimError(data.detail || "Failed to fetch dimensionality reduction.");
      }
    } catch (err) { setDimError("Network error."); }
    finally { setLoadingDim(false); }
  };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    if (regConfig.x_cols.length === 0 || !regConfig.y_col) return;
    setLoadingReg(true); setRegError(""); setRegData(null);
    setAiInsights(prev => ({...prev, regression: ""}));
    try {
      const response = await fetch("/api/ml/regression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regConfig)
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setRegData(data);
      } else {
        setRegError(data.message || "Failed to calculate regression.");
      }
    } catch (err) { setRegError("Network error."); } 
    finally { setLoadingReg(false); }
  };

  const handleTtestSubmit = async (e) => {
    e.preventDefault();
    if (!ttestConfig.group_col || !ttestConfig.value_col || !ttestConfig.group1 || !ttestConfig.group2) return;
    setLoadingTtest(true); setTtestError(""); setTtestData(null);
    setAiInsights(prev => ({...prev, ttest: ""}));
    try {
      const response = await fetch("/api/stats/ttest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ttestConfig)
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setTtestData(data);
      } else {
        setTtestError(data.message || "Failed to calculate T-Test.");
      }
    } catch (err) { setTtestError("Network error."); } 
    finally { setLoadingTtest(false); }
  };

  const handleAnovaSubmit = async (e) => {
    e.preventDefault();
    if (!anovaConfig.group_col || !anovaConfig.value_col) return;
    setLoadingAnova(true); setAnovaError(""); setAnovaData(null);
    setAiInsights(prev => ({...prev, anova: ""}));
    try {
      const response = await fetch("/api/stats/anova", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(anovaConfig)
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setAnovaData(data);
      } else {
        setAnovaError(data.message || "Failed to calculate ANOVA.");
      }
    } catch (err) { setAnovaError("Network error."); } 
    finally { setLoadingAnova(false); }
  };

  const handleChiSubmit = async (e) => {
    e.preventDefault();
    if (!chiConfig.col1 || !chiConfig.col2) return;
    setLoadingChi(true); setChiError(""); setChiData(null);
    setAiInsights(prev => ({...prev, chisquare: ""}));
    try {
      const response = await fetch("/api/stats/chisquare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chiConfig)
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setChiData(data);
      } else {
        setChiError(data.message || "Failed to calculate Chi-Square.");
      }
    } catch (err) { setChiError("Network error."); } 
    finally { setLoadingChi(false); }
  };

  const handleLogRegSubmit = async (e) => {
    e.preventDefault();
    if (logRegConfig.x_cols.length === 0 || !logRegConfig.y_col) return;
    setLoadingLogReg(true); setLogRegError(""); setLogRegData(null);
    setAiInsights(prev => ({...prev, logistic: ""}));
    try {
      const response = await fetch("/api/ml/logistic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logRegConfig)
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setLogRegData(data);
      } else {
        setLogRegError(data.message || "Failed to calculate Logistic Regression.");
      }
    } catch (err) { setLogRegError("Network error."); } 
    finally { setLoadingLogReg(false); }
  };

  const generateAIInsight = async (tabName, query) => {
    setAiLoading(prev => ({ ...prev, [tabName]: true }));
    setAiErrors(prev => ({ ...prev, [tabName]: "" }));
    setAiInsights(prev => ({ ...prev, [tabName]: "" }));

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, data_preview: null })
      });
      const data = await response.json();
      if (response.ok && data.insights) {
        setAiInsights(prev => ({ ...prev, [tabName]: data.insights }));
      } else {
        setAiErrors(prev => ({ ...prev, [tabName]: data.detail || data.message || "Failed to generate AI insights." }));
      }
    } catch (err) {
      setAiErrors(prev => ({ ...prev, [tabName]: "Network error requesting AI explanation." }));
    } finally {
      setAiLoading(prev => ({ ...prev, [tabName]: false }));
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

  const renderAISection = (tabName, query) => {
    const insight = aiInsights[tabName];
    const loading = aiLoading[tabName];
    const error = aiErrors[tabName];

    return (
      <div style={{ marginTop: "1.5rem", background: "rgba(15, 23, 42, 0.3)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkles size={18} style={{ color: "var(--secondary-cyan)" }} />
            <h4 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1rem" }}>AI Analysis & Recommendations</h4>
          </div>
          {!insight && !loading && (
            <button className="btn-primary" onClick={() => generateAIInsight(tabName, query)} style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}>Ask AI to Interpret</button>
          )}
        </div>
        {loading && <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}><SkeletonLoader height="20px" width="60%" /><SkeletonLoader height="100px" width="100%" /></div>}
        {error && <div style={{ color: "var(--accent-rose)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}><AlertCircle size={16} /> {error}</div>}
        {insight && <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "8px", padding: "1rem 1.25rem", maxHeight: "250px", overflowY: "auto" }}>{renderMarkdown(insight)}</div>}
      </div>
    );
  };

  const getCellColor = (val) => {
    if (val === 1) return "rgba(139, 92, 246, 0.4)";
    if (val > 0.7) return "rgba(34, 197, 94, 0.4)";
    if (val > 0.4) return "rgba(34, 197, 94, 0.2)";
    if (val < -0.7) return "rgba(244, 63, 94, 0.4)";
    if (val < -0.4) return "rgba(244, 63, 94, 0.2)";
    return "rgba(255, 255, 255, 0.03)";
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div className="glass-card" style={{ padding: 0 }}>
        
        {/* Header Tabs */}
        <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid var(--border-color)", background: "var(--bg-card-hover)" }}>
          <button className={`tab-btn ${activeTab === "pivot" ? "active" : ""}`} onClick={() => setActiveTab("pivot")} style={{ flex: "0 0 auto", padding: "1rem 1.5rem", border: "none", borderBottom: activeTab === "pivot" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: activeTab === "pivot" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><Table size={16} /> Pivot Table</button>
          <button className={`tab-btn ${activeTab === "correlation" ? "active" : ""}`} onClick={() => { setActiveTab("correlation"); if(!correlation) fetchCorrelation(); }} style={{ flex: "0 0 auto", padding: "1rem 1.5rem", border: "none", borderBottom: activeTab === "correlation" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: activeTab === "correlation" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><Activity size={16} /> Correlation Matrix</button>
          <button className={`tab-btn ${activeTab === "dimensionality" ? "active" : ""}`} onClick={() => setActiveTab("dimensionality")} style={{ flex: "0 0 auto", padding: "1rem 1.5rem", border: "none", borderBottom: activeTab === "dimensionality" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: activeTab === "dimensionality" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><Activity size={16} /> Dimensionality</button>
          <button className={`tab-btn ${activeTab === "regression" ? "active" : ""}`} onClick={() => setActiveTab("regression")} style={{ flex: "0 0 auto", padding: "1rem 1.5rem", border: "none", borderBottom: activeTab === "regression" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: activeTab === "regression" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><TrendingUp size={16} /> Linear Regression</button>
          <button className={`tab-btn ${activeTab === "logistic" ? "active" : ""}`} onClick={() => setActiveTab("logistic")} style={{ flex: "0 0 auto", padding: "1rem 1.5rem", border: "none", borderBottom: activeTab === "logistic" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: activeTab === "logistic" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><TrendingUp size={16} /> Logistic Regression</button>
          <button className={`tab-btn ${activeTab === "ttest" ? "active" : ""}`} onClick={() => setActiveTab("ttest")} style={{ flex: "0 0 auto", padding: "1rem 1.5rem", border: "none", borderBottom: activeTab === "ttest" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: activeTab === "ttest" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><FlaskConical size={16} /> T-Test</button>
          <button className={`tab-btn ${activeTab === "anova" ? "active" : ""}`} onClick={() => setActiveTab("anova")} style={{ flex: "0 0 auto", padding: "1rem 1.5rem", border: "none", borderBottom: activeTab === "anova" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: activeTab === "anova" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><BarChart size={16} /> ANOVA</button>
          <button className={`tab-btn ${activeTab === "chisquare" ? "active" : ""}`} onClick={() => setActiveTab("chisquare")} style={{ flex: "0 0 auto", padding: "1rem 1.5rem", border: "none", borderBottom: activeTab === "chisquare" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: activeTab === "chisquare" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><Filter size={16} /> Chi-Square</button>
        </div>

        <div style={{ padding: "2rem" }}>
          
          {/* PIVOT TABLE */}
          {activeTab === "pivot" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "2rem" }}>
                <div style={{ flex: "0 0 250px" }}>
                  <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Table size={20} style={{ color: "var(--primary-purple)" }} /> Pivot Config</h3>
                  <form onSubmit={handlePivotSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group"><label>Rows</label><select value={pivotConfig.index_col} onChange={e => setPivotConfig({...pivotConfig, index_col: e.target.value})}><option value="">None</option>{categoricalColumns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>Columns</label><select value={pivotConfig.columns_col} onChange={e => setPivotConfig({...pivotConfig, columns_col: e.target.value})}><option value="">None</option>{categoricalColumns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>Values</label><select value={pivotConfig.values_col} onChange={e => setPivotConfig({...pivotConfig, values_col: e.target.value})}><option value="">None</option>{numericColumns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>Aggregation</label><select value={pivotConfig.aggfunc} onChange={e => setPivotConfig({...pivotConfig, aggfunc: e.target.value})}><option value="sum">Sum</option><option value="mean">Average</option><option value="count">Count</option><option value="max">Max</option><option value="min">Min</option></select></div>
                    <button type="submit" className="btn-primary" disabled={loadingPivot}>{loadingPivot ? "Generating..." : "Generate Pivot"}</button>
                  </form>
                  {pivotError && <div style={{ color: "var(--accent-rose)", marginTop: "1rem" }}>{pivotError}</div>}
                </div>
                <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", maxHeight: "450px", border: "1px solid var(--border-color)", borderRadius: "8px", background: "var(--bg-card-hover)" }}>
                  {pivotData ? (
                    <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse", whiteSpace: "nowrap" }}>
                      <thead style={{ position: "sticky", top: 0, background: "rgba(15, 23, 42, 0.95)", zIndex: 1 }}>
                        <tr><th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "var(--text-dark)", borderBottom: "1px solid var(--border-color)" }}>{pivotConfig.index_col}</th>{pivotData.columns.map(c => <th key={c} style={{ padding: "0.75rem 1rem", textAlign: "right", color: "var(--text-dark)", borderBottom: "1px solid var(--border-color)" }}>{c}</th>)}</tr>
                      </thead>
                      <tbody>
                        {pivotData.values.map((rowVals, rIdx) => (
                          <tr key={rIdx} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                            <td style={{ padding: "0.5rem 1rem", fontWeight: 600, color: "var(--text-muted)" }}>{pivotData.rows[rIdx]}</td>
                            {rowVals.map((val, cIdx) => <td key={cIdx} style={{ padding: "0.5rem 1rem", textAlign: "right", color: "var(--text-dark)" }}>{val.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Configure rows, columns, and values to generate a pivot table.</div>}
                </div>
              </div>
              {pivotData && renderAISection("pivot", `Analyze this Pivot Table output. Aggregation: ${pivotData.aggfunc} on '${pivotData.values_name}'. Rows are '${pivotData.index_name}', Columns are '${pivotData.columns_name}'. The columns are [${pivotData.columns.join(", ")}]. The row headers are [${pivotData.rows.join(", ")}]. Identify the highest and lowest intersecting values, any noticeable trends across categories, and suggest a business takeaway. Keep it concise.`)}
            </div>
          )}

          {/* CORRELATION MATRIX */}
          {activeTab === "correlation" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}><Activity size={20} style={{ color: "var(--primary-purple)" }} /> Correlation Matrix</h3>
                <select className="form-control" value={corrMethod} onChange={handleCorrMethodChange} style={{ width: "auto", background: "var(--bg-dark)", color: "white", border: "1px solid var(--border-color)", padding: "0.5rem 1rem", borderRadius: "8px" }}>
                  <option value="pearson">Pearson (Linear Numeric)</option>
                  <option value="spearman">Spearman (Non-linear Numeric)</option>
                  <option value="cramers_v">Cramer's V (Categorical Association)</option>
                </select>
              </div>
              <div style={{ background: "var(--bg-card-hover)", borderRadius: "10px", border: "1px solid var(--border-color)", padding: "1.5rem", minHeight: "300px", display: "flex", flexDirection: "column" }}>
                {loadingCorr ? <div style={{ margin: "auto", textAlign: "center" }}><div className="loader-spinner" style={{ margin: "0 auto 1rem auto" }}></div></div> : corrError ? <div style={{ margin: "auto", color: "var(--accent-rose)" }}>{corrError}</div> : correlation && correlation.columns.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ borderCollapse: "separate", borderSpacing: "2px", margin: "auto" }}>
                      <thead><tr><th></th>{correlation.columns.map(c => <th key={c} style={{ padding: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", writingMode: "vertical-rl", transform: "rotate(180deg)", textAlign: "left", height: "100px" }}>{c}</th>)}</tr></thead>
                      <tbody>
                        {correlation.values.map((rowVals, rIdx) => {
                          const rowCol = correlation.columns[rIdx];
                          return (
                            <tr key={rIdx}>
                              <td style={{ padding: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right", whiteSpace: "nowrap" }}>{rowCol}</td>
                              {rowVals.map((val, cIdx) => (
                                <td key={cIdx} style={{ backgroundColor: getCellColor(val), textAlign: "center", fontWeight: 600, width: "48px", height: "48px", borderRadius: "8px", color: Math.abs(val) > 0.4 ? "white" : "var(--text-muted)", fontSize: "0.8rem", cursor: "default" }} title={`${rowCol} & ${correlation.columns[cIdx]}: ${val.toFixed(4)}`}>{val.toFixed(2)}</td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <div style={{ fontStyle: "italic", color: "var(--text-dark)" }}>No numeric columns</div>}
              </div>
              {correlation && correlation.columns.length > 0 && renderAISection("correlation", `Analyze this ${corrMethod} Correlation Matrix. Variables: [${correlation.columns.join(", ")}]. Matrix: ${JSON.stringify(correlation.values)}. Identify strongest correlations.`)}
            </div>
          )}

          {/* DIMENSIONALITY REDUCTION */}
          {activeTab === "dimensionality" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "2rem" }}>
                <div style={{ flex: "0 0 250px" }}>
                  <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Activity size={20} style={{ color: "var(--primary-purple)" }} /> Dimensionality</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group">
                      <label>Algorithm</label>
                      <select value={dimAlgorithm} onChange={e => setDimAlgorithm(e.target.value)} className="form-control" style={{ background: "var(--bg-dark)", color: "white", border: "1px solid var(--border-color)", padding: "0.5rem", borderRadius: "4px" }}>
                        <option value="pca">PCA (Principal Component Analysis)</option>
                        <option value="tsne">t-SNE (t-Distributed Stochastic Neighbor Embedding)</option>
                      </select>
                    </div>
                    <button className="btn-primary" onClick={fetchDimensionality} disabled={loadingDim}>{loadingDim ? "Processing..." : "Project Data"}</button>
                  </div>
                  {dimError && <div style={{ color: "var(--accent-rose)", marginTop: "1rem" }}>{dimError}</div>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {dimData && dimData.length > 0 ? (
                    <div style={{ background: "var(--bg-card-hover)", borderRadius: "10px", border: "1px solid var(--border-color)", padding: "1.5rem", height: "400px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="x" type="number" name="Component 1" stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                          <YAxis dataKey="y" type="number" name="Component 2" stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                          <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => active && payload && payload.length ? <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "8px", color: "white" }}><p style={{ margin:0, fontWeight: "bold" }}>Label: {payload[0].payload.label}</p><p style={{color:"var(--secondary-cyan)", margin:0}}>X: {payload[0].payload.x.toFixed(2)}</p><p style={{color:"var(--primary-purple)", margin:0}}>Y: {payload[0].payload.y.toFixed(2)}</p></div> : null} />
                          <Scatter name="Data Projection" data={dimData} fill="var(--primary-purple)" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--border-color)", borderRadius: "8px" }}>Click "Project Data" to visualize numeric columns in 2D space.</div>
                  )}
                </div>
              </div>
              {dimData && dimData.length > 0 && renderAISection("dimensionality", `Analyze this ${dimAlgorithm.toUpperCase()} dimensionality reduction output. Data shows ${dimData.length} points plotted in 2D space. What can we infer about clusters or separability?`)}
            </div>
          )}

          {/* LINEAR REGRESSION */}
          {activeTab === "regression" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "2rem" }}>
                <div style={{ flex: "0 0 300px" }}>
                  <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><TrendingUp size={20} style={{ color: "var(--accent-emerald)" }} /> Linear Regression</h3>
                  <form onSubmit={handleRegSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group">
                      <label>Independent Variables (X)</label>
                      <select multiple value={regConfig.x_cols} onChange={e => {
                        const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                        setRegConfig({...regConfig, x_cols: options});
                      }} style={{ height: "120px" }}>
                        {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <small style={{color: "var(--text-muted)"}}>Hold Ctrl/Cmd to select multiple</small>
                    </div>
                    <div className="form-group">
                      <label>Dependent Variable (Y)</label>
                      <select value={regConfig.y_col} onChange={e => setRegConfig({...regConfig, y_col: e.target.value})}>
                        <option value="">Select...</option>
                        {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="btn-primary" disabled={loadingReg}>{loadingReg ? "Calculating..." : "Run Multivariate Regression"}</button>
                  </form>
                  {regError && <div style={{ color: "var(--accent-rose)", marginTop: "1rem" }}>{regError}</div>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {regData && (
                    <>
                      <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <h4 style={{ color: "var(--text-dark)", margin: 0 }}>Regression Fit Stats</h4>
                          <button onClick={() => setEli5Mode(!eli5Mode)} style={{ background: eli5Mode ? "var(--primary-purple)" : "transparent", border: "1px solid var(--primary-purple)", color: eli5Mode ? "white" : "var(--primary-purple)", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }}>
                            {eli5Mode ? "ELI5: ON" : "ELI5: OFF"}
                          </button>
                        </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: "1.5rem" }}>
                          <div className="stat-item">
                            <div className="stat-label">R-Squared (Test)</div>
                            <div className="stat-value" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                <span>{regData.r_squared.toFixed(4)}</span>
                                {eli5Mode && <span style={{ fontSize: "0.8rem", color: "var(--accent-emerald)", fontWeight: "normal" }}>This means the model is {(regData.r_squared * 100).toFixed(1)}% accurate at predicting {regConfig.y_col}.</span>}
                            </div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-label">RMSE</div>
                            <div className="stat-value">{regData.rmse.toFixed(4)}</div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-label">MAE</div>
                            <div className="stat-value">{regData.mae.toFixed(4)}</div>
                          </div>
                        </div>
                      </div>
                      {regData.points && regData.points.length > 0 && (
                        <div style={{ background: "var(--bg-card-hover)", borderRadius: "10px", border: "1px solid var(--border-color)", padding: "1.5rem", height: "300px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={regData.points} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                              <XAxis dataKey="x" type="number" stroke="var(--text-dark)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                              <YAxis dataKey="y" type="number" stroke="var(--text-dark)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                              <ChartTooltip content={({ active, payload }) => active && payload && payload.length ? <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "8px" }}><p style={{color:"white", margin:0}}>X: {payload[0].payload.x.toFixed(2)}</p><p style={{color:"var(--secondary-cyan)", margin:0}}>Y: {payload[0].payload.y.toFixed(2)}</p></div> : null} />
                              <Scatter name="Sample Data" dataKey="y" fill="#06b6d4" opacity={0.65} />
                              <Line name="Fitted Line" dataKey="y_pred" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={false} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              {regData && renderAISection("regression", `Analyze this Multivariate Linear Regression model where Independent variables are '${regConfig.x_cols.join(', ')}' and Dependent variable (Y) is '${regConfig.y_col}'. Equation: '${regData.equation}', R-squared: ${regData.r_squared.toFixed(4)}. Interpret relationship.`)}
            </div>
          )}

          {/* LOGISTIC REGRESSION */}
          {activeTab === "logistic" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "2rem" }}>
                <div style={{ flex: "0 0 300px" }}>
                  <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><TrendingUp size={20} style={{ color: "var(--primary-purple)" }} /> Logistic Regression</h3>
                  <form onSubmit={handleLogRegSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group">
                      <label>Independent Variables (X)</label>
                      <select multiple value={logRegConfig.x_cols} onChange={e => {
                        const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                        setLogRegConfig({...logRegConfig, x_cols: options});
                      }} style={{ height: "120px" }}>
                        {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <small style={{color: "var(--text-muted)"}}>Hold Ctrl/Cmd to select multiple</small>
                    </div>
                    <div className="form-group">
                      <label>Binary Target (Y)</label>
                      <select value={logRegConfig.y_col} onChange={e => setLogRegConfig({...logRegConfig, y_col: e.target.value})}>
                        <option value="">Select...</option>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="btn-primary" disabled={loadingLogReg}>{loadingLogReg ? "Training Model..." : "Train Multivariate Logistic Regression"}</button>
                  </form>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "1rem" }}>Target Y must have exactly 2 unique values to classify.</p>
                  {logRegError && <div style={{ color: "var(--accent-rose)", marginTop: "1rem" }}>{logRegError}</div>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {logRegData && (
                    <>
                      <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <h4 style={{ color: "var(--text-dark)", margin: 0 }}>Classification Stats</h4>
                          <button onClick={() => setEli5Mode(!eli5Mode)} style={{ background: eli5Mode ? "var(--primary-purple)" : "transparent", border: "1px solid var(--primary-purple)", color: eli5Mode ? "white" : "var(--primary-purple)", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }}>
                            {eli5Mode ? "ELI5: ON" : "ELI5: OFF"}
                          </button>
                        </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: "1.5rem" }}>
                          <div className="stat-item"><div className="stat-label">Model Accuracy</div><div className="stat-value" style={{ color: "var(--accent-emerald)" }}>{(logRegData.accuracy * 100).toFixed(1)}%</div></div>
                          <div className="stat-item"><div className="stat-label">ROC-AUC</div><div className="stat-value">{logRegData.roc_auc.toFixed(4)}</div></div>
                          <div className="stat-item"><div className="stat-label">F1-Score</div><div className="stat-value">{logRegData.f1_score.toFixed(4)}</div></div>
                          <div className="stat-item"><div className="stat-label">Precision</div><div className="stat-value">{logRegData.precision.toFixed(4)}</div></div>
                          <div className="stat-item"><div className="stat-label">Recall</div><div className="stat-value">{logRegData.recall.toFixed(4)}</div></div>
                          <div className="stat-item"><div className="stat-label">Target Class (1)</div><div className="stat-value" style={{ fontSize: "1rem" }}>{logRegData.target_class}</div></div>
                        </div>
                      </div>
                      {logRegData.curve && logRegData.curve.length > 0 && (
                        <div style={{ background: "var(--bg-card-hover)", borderRadius: "10px", border: "1px solid var(--border-color)", padding: "1.5rem", height: "300px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={logRegData.curve} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                              <XAxis dataKey="x" type="number" stroke="var(--text-dark)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                              <YAxis dataKey="probability" type="number" domain={[0, 1]} stroke="var(--text-dark)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                              <ChartTooltip content={({ active, payload }) => active && payload && payload.length ? <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "8px" }}><p style={{color:"white", margin:0}}>X: {payload[0].payload.x.toFixed(2)}</p><p style={{color:"var(--primary-purple)", margin:0}}>Prob({logRegData.target_class}): {(payload[0].payload.probability * 100).toFixed(1)}%</p></div> : null} />
                              <Line name="Probability Sigmoid" dataKey="probability" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              {logRegData && renderAISection("logistic", `Analyze this Multivariate Logistic Regression model. Independent variables (X): '${logRegConfig.x_cols.join(', ')}'. Binary Target (Y): '${logRegConfig.y_col}'. Target Class representing success (1): '${logRegData.target_class}'. Accuracy: ${(logRegData.accuracy * 100).toFixed(2)}%, ROC-AUC: ${logRegData.roc_auc.toFixed(4)}, F1-Score: ${logRegData.f1_score.toFixed(4)}. Interpret the results.`)}
            </div>
          )}

          {/* T-TEST */}
          {activeTab === "ttest" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "2rem" }}>
                <div style={{ flex: "0 0 300px" }}>
                  <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><FlaskConical size={20} style={{ color: "var(--accent-amber)" }} /> Independent T-Test</h3>
                  <form onSubmit={handleTtestSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group"><label>Grouping Variable (Categorical)</label><select value={ttestConfig.group_col} onChange={e => setTtestConfig({...ttestConfig, group_col: e.target.value})}>{categoricalColumns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>Test Variable (Numeric)</label><select value={ttestConfig.value_col} onChange={e => setTtestConfig({...ttestConfig, value_col: e.target.value})}>{numericColumns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>Group 1 Name</label><input type="text" value={ttestConfig.group1} onChange={e => setTtestConfig({...ttestConfig, group1: e.target.value})} required /></div>
                    <div className="form-group"><label>Group 2 Name</label><input type="text" value={ttestConfig.group2} onChange={e => setTtestConfig({...ttestConfig, group2: e.target.value})} required /></div>
                    <button type="submit" className="btn-primary" disabled={loadingTtest} style={{ background: "linear-gradient(135deg, var(--accent-amber), #b45309)" }}>{loadingTtest ? "Calculating..." : "Run T-Test"}</button>
                  </form>
                  {ttestError && <div style={{ color: "var(--accent-rose)", marginTop: "1rem" }}>{ttestError}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  {ttestData && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {ttestData.warnings && ttestData.warnings.length > 0 && (
                        <div style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid var(--accent-rose)", padding: "1rem", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-rose)", fontWeight: "bold" }}><AlertCircle size={18} /> Diagnostic Warnings</div>
                          {ttestData.warnings.map((w, i) => <div key={i} style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>• {w}</div>)}
                        </div>
                      )}
                      <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <h4 style={{ color: "var(--text-dark)", margin: 0 }}>T-Test Results</h4>
                        <button onClick={() => setEli5Mode(!eli5Mode)} style={{ background: eli5Mode ? "var(--primary-purple)" : "transparent", border: "1px solid var(--primary-purple)", color: eli5Mode ? "white" : "var(--primary-purple)", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }}>
                            {eli5Mode ? "ELI5: ON" : "ELI5: OFF"}
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))", gap: "1.5rem" }}>
                        <div className="stat-item">
                            <div className="stat-label">P-Value</div>
                            <div className="stat-value" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                <span style={{ color: ttestData.significant ? "var(--accent-emerald)" : "var(--text-muted)" }}>{ttestData.p_value.toFixed(4)}</span>
                                {eli5Mode && <span style={{ fontSize: "0.8rem", color: "var(--accent-emerald)", fontWeight: "normal" }}>{ttestData.significant ? `There is only a ${(ttestData.p_value * 100).toFixed(1)}% chance this difference is just luck. It's a real difference!` : `This difference is likely just random chance.`}</span>}
                            </div>
                        </div>
                        <div className="stat-item"><div className="stat-label">Statistically Significant?</div><div className="stat-value">{ttestData.significant ? "Yes (p < 0.05)" : "No"}</div></div>
                        <div className="stat-item"><div className="stat-label">{ttestConfig.group1} Mean</div><div className="stat-value">{ttestData.group1_mean.toFixed(2)}</div></div>
                        <div className="stat-item"><div className="stat-label">{ttestConfig.group2} Mean</div><div className="stat-value">{ttestData.group2_mean.toFixed(2)}</div></div>
                      </div>
                      
                      {ttestData.non_parametric && (
                        <>
                          <h5 style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "1.5rem", marginBottom: "1rem" }}>Non-Parametric Alternative ({ttestData.non_parametric.test_name})</h5>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))", gap: "1.5rem" }}>
                            <div className="stat-item"><div className="stat-label">Statistic</div><div className="stat-value">{ttestData.non_parametric.statistic.toFixed(4)}</div></div>
                            <div className="stat-item">
                                <div className="stat-label">P-Value</div>
                                <div className="stat-value" style={{ color: ttestData.non_parametric.significant ? "var(--accent-emerald)" : "var(--text-muted)" }}>{ttestData.non_parametric.p_value.toFixed(4)}</div>
                            </div>
                            <div className="stat-item"><div className="stat-label">Significant?</div><div className="stat-value">{ttestData.non_parametric.significant ? "Yes (p < 0.05)" : "No"}</div></div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              </div>
              {ttestData && renderAISection("ttest", `Analyze this Independent T-Test comparing '${ttestConfig.value_col}' across Group 1 ('${ttestConfig.group1}') and Group 2 ('${ttestConfig.group2}'). Means: ${ttestData.group1_mean.toFixed(2)} vs ${ttestData.group2_mean.toFixed(2)}. p-value: ${ttestData.p_value.toFixed(4)}.`)}
            </div>
          )}

          {/* ANOVA */}
          {activeTab === "anova" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "2rem" }}>
                <div style={{ flex: "0 0 300px" }}>
                  <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><BarChart size={20} style={{ color: "var(--secondary-cyan)" }} /> One-Way ANOVA</h3>
                  <form onSubmit={handleAnovaSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group"><label>Categorical Group (3+ Levels)</label><select value={anovaConfig.group_col} onChange={e => setAnovaConfig({...anovaConfig, group_col: e.target.value})}>{categoricalColumns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>Test Variable (Numeric)</label><select value={anovaConfig.value_col} onChange={e => setAnovaConfig({...anovaConfig, value_col: e.target.value})}>{numericColumns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <button type="submit" className="btn-primary" disabled={loadingAnova} style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}>{loadingAnova ? "Calculating..." : "Run ANOVA"}</button>
                  </form>
                  {anovaError && <div style={{ color: "var(--accent-rose)", marginTop: "1rem" }}>{anovaError}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  {anovaData && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {anovaData.warnings && anovaData.warnings.length > 0 && (
                        <div style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid var(--accent-rose)", padding: "1rem", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-rose)", fontWeight: "bold" }}><AlertCircle size={18} /> Diagnostic Warnings</div>
                          {anovaData.warnings.map((w, i) => <div key={i} style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>• {w}</div>)}
                        </div>
                      )}
                      <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <h4 style={{ color: "var(--text-dark)", margin: 0 }}>ANOVA Results</h4>
                        <button onClick={() => setEli5Mode(!eli5Mode)} style={{ background: eli5Mode ? "var(--primary-purple)" : "transparent", border: "1px solid var(--primary-purple)", color: eli5Mode ? "white" : "var(--primary-purple)", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }}>
                            {eli5Mode ? "ELI5: ON" : "ELI5: OFF"}
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
                        <div className="stat-item"><div className="stat-label">F-Statistic</div><div className="stat-value">{anovaData.f_stat.toFixed(4)}</div></div>
                        <div className="stat-item">
                            <div className="stat-label">P-Value</div>
                            <div className="stat-value" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                <span style={{ color: anovaData.significant ? "var(--accent-emerald)" : "var(--text-muted)" }}>{anovaData.p_value.toFixed(4)}</span>
                                {eli5Mode && <span style={{ fontSize: "0.8rem", color: "var(--accent-emerald)", fontWeight: "normal" }}>{anovaData.significant ? `The groups are genuinely different, not just by random chance.` : `Any differences between these groups are likely just random.`}</span>}
                            </div>
                        </div>
                        <div className="stat-item"><div className="stat-label">Statistically Significant?</div><div className="stat-value">{anovaData.significant ? "Yes (p < 0.05)" : "No"}</div></div>
                      </div>
                      
                      {anovaData.non_parametric && (
                        <>
                          <h5 style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>Non-Parametric Alternative ({anovaData.non_parametric.test_name})</h5>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
                            <div className="stat-item"><div className="stat-label">Statistic</div><div className="stat-value">{anovaData.non_parametric.statistic.toFixed(4)}</div></div>
                            <div className="stat-item">
                                <div className="stat-label">P-Value</div>
                                <div className="stat-value" style={{ color: anovaData.non_parametric.significant ? "var(--accent-emerald)" : "var(--text-muted)" }}>{anovaData.non_parametric.p_value.toFixed(4)}</div>
                            </div>
                            <div className="stat-item"><div className="stat-label">Significant?</div><div className="stat-value">{anovaData.non_parametric.significant ? "Yes (p < 0.05)" : "No"}</div></div>
                          </div>
                        </>
                      )}

                      <h5 style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Group Means:</h5>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {Object.entries(anovaData.group_means).map(([group, mean]) => (
                          <div key={group} style={{ background: "rgba(0,0,0,0.3)", padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
                            <span style={{ color: "var(--text-muted)", marginRight: "0.5rem" }}>{group}:</span>
                            <span style={{ color: "var(--text-dark)", fontWeight: 600 }}>{mean.toFixed(2)}</span>
                          </div>
                        ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {anovaData && renderAISection("anova", `Analyze this One-Way ANOVA comparing numeric variable '${anovaConfig.value_col}' across categorical groups in '${anovaConfig.group_col}'. F-statistic: ${anovaData.f_stat.toFixed(4)}, p-value: ${anovaData.p_value.toFixed(4)} (Significant: ${anovaData.significant}). Group means: ${JSON.stringify(anovaData.group_means)}. Explain whether there is a statistically significant variance between the groups and identify which groups are driving the variance. Use concise bullet points.`)}
            </div>
          )}

          {/* CHI-SQUARE */}
          {activeTab === "chisquare" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "2rem" }}>
                <div style={{ flex: "0 0 300px" }}>
                  <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Filter size={20} style={{ color: "var(--accent-rose)" }} /> Chi-Square Test</h3>
                  <form onSubmit={handleChiSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group"><label>Categorical Variable 1</label><select value={chiConfig.col1} onChange={e => setChiConfig({...chiConfig, col1: e.target.value})}>{categoricalColumns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>Categorical Variable 2</label><select value={chiConfig.col2} onChange={e => setChiConfig({...chiConfig, col2: e.target.value})}>{categoricalColumns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <button type="submit" className="btn-primary" disabled={loadingChi} style={{ background: "linear-gradient(135deg, #f43f5e, #be123c)" }}>{loadingChi ? "Calculating..." : "Run Chi-Square Test"}</button>
                  </form>
                  {chiError && <div style={{ color: "var(--accent-rose)", marginTop: "1rem" }}>{chiError}</div>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {chiData && (
                    <>
                      <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                        <h4 style={{ color: "var(--text-dark)", marginBottom: "1rem" }}>Chi-Square Results</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))", gap: "1.5rem" }}>
                          <div className="stat-item"><div className="stat-label">Chi-Square Statistic</div><div className="stat-value">{chiData.chi2_stat.toFixed(4)}</div></div>
                          <div className="stat-item"><div className="stat-label">Degrees of Freedom</div><div className="stat-value">{chiData.degrees_of_freedom}</div></div>
                          <div className="stat-item"><div className="stat-label">P-Value</div><div className="stat-value" style={{ color: chiData.significant ? "var(--accent-emerald)" : "var(--text-muted)" }}>{chiData.p_value.toFixed(4)}</div></div>
                          <div className="stat-item"><div className="stat-label">Independent?</div><div className="stat-value">{chiData.significant ? "No (Correlated)" : "Yes"}</div></div>
                        </div>
                      </div>
                      
                      <div style={{ background: "var(--bg-card-hover)", borderRadius: "10px", border: "1px solid var(--border-color)", padding: "1rem", overflowX: "auto" }}>
                        <h5 style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>Contingency Table</h5>
                        <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse", whiteSpace: "nowrap" }}>
                          <thead style={{ background: "var(--bg-card)" }}>
                            <tr>
                              <th style={{ padding: "0.5rem", textAlign: "left", color: "var(--accent-rose)" }}>{chiConfig.col1} \ {chiConfig.col2}</th>
                              {chiData.col2_categories.map(c => <th key={c} style={{ padding: "0.5rem", textAlign: "right", color: "var(--text-dark)" }}>{c}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {chiData.contingency_table.map((row, idx) => (
                              <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                <td style={{ padding: "0.5rem", fontWeight: 600, color: "var(--text-muted)" }}>{row[chiConfig.col1]}</td>
                                {chiData.col2_categories.map(c => <td key={c} style={{ padding: "0.5rem", textAlign: "right", color: "var(--text-dark)" }}>{row[c]}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {chiData && renderAISection("chisquare", `Analyze this Chi-Square Test of Independence between categorical variables '${chiConfig.col1}' and '${chiConfig.col2}'. Chi-Square Stat: ${chiData.chi2_stat.toFixed(4)}, p-value: ${chiData.p_value.toFixed(4)}. Significant dependence: ${chiData.significant}. Interpret whether these two categorical variables influence each other based on the p-value, and what that means for the business. Keep it concise with bullet points.`)}
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
