import SkeletonLoader from './SkeletonLoader';
import React, { useState } from "react";
import { Cpu, Target, Network, ChevronRight, Sparkles, AlertCircle, TrendingUp, Type } from "lucide-react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, BarChart, Bar, Legend, Cell, LineChart, Line, ComposedChart } from "recharts";

export default function MachineLearning({ onNextStep, summary }) {
  const [activeTab, setActiveTab] = useState("importance");
  const [eli5Mode, setEli5Mode] = useState(false);

  // AI State
  const [aiInsights, setAiInsights] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [aiErrors, setAiErrors] = useState({});

  const columns = Object.keys(summary.columns || {});
  const numericColumns = columns.filter((col) => summary.columns[col].stats.mean !== undefined);

  // Feature Importance State
  const [impConfig, setImpConfig] = useState({ target_col: "" });
  const [impData, setImpData] = useState(null);
  const [loadingImp, setLoadingImp] = useState(false);
  const [impError, setImpError] = useState("");

  // KMeans State
  const [kmeansConfig, setKmeansConfig] = useState({ features: [], k: 3 });
  const [kmeansData, setKmeansData] = useState(null);
  const [loadingKmeans, setLoadingKmeans] = useState(false);
  const [kmeansError, setKmeansError] = useState("");
  const [kmeansDiagnostics, setKmeansDiagnostics] = useState(null);
  const [loadingKmeansDiag, setLoadingKmeansDiag] = useState(false);

  // Forecast State
  const datetimeColumns = columns.filter(col => summary.columns[col].dtype === "datetime64[ns]" || summary.columns[col].dtype?.includes("datetime"));
  const [forecastConfig, setForecastConfig] = useState({ date_col: datetimeColumns[0] || "", val_col: numericColumns[0] || "", periods: 30, algorithm: "holt-winters" });
  const [forecastData, setForecastData] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState("");

  // NLP State
  const textColumns = columns.filter((col) => summary.columns[col].dtype === "object" || summary.columns[col].dtype === "category");
  const [nlpConfig, setNlpConfig] = useState({ text_col: textColumns[0] || "" });
  const [nlpData, setNlpData] = useState(null);
  const [loadingNlp, setLoadingNlp] = useState(false);
  const [nlpError, setNlpError] = useState("");
  
  // Topic Modeling State
  const [topicConfig, setTopicConfig] = useState({ text_col: textColumns[0] || "", n_topics: 5 });
  const [topicData, setTopicData] = useState(null);
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [topicError, setTopicError] = useState("");

  const handleImpSubmit = async (e) => {
    e.preventDefault();
    if (!impConfig.target_col) return;
    setLoadingImp(true); setImpError(""); setImpData(null);
    setAiInsights(prev => ({...prev, importance: ""}));
    try {
      const response = await fetch("/api/ml/feature_importance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(impConfig)
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setImpData(data);
      } else {
        setImpError(data.message || "Failed to calculate Feature Importance.");
      }
    } catch (err) { setImpError("Network error."); } 
    finally { setLoadingImp(false); }
  };

  const handleKmeansSubmit = async (e) => {
    e.preventDefault();
    if (kmeansConfig.features.length < 2 || !kmeansConfig.k) return;
    setLoadingKmeans(true); setKmeansError(""); setKmeansData(null);
    setAiInsights(prev => ({...prev, kmeans: ""}));
    try {
      const response = await fetch("/api/ml/kmeans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kmeansConfig)
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setKmeansData(data);
      } else {
        setKmeansError(data.message || "Failed to calculate K-Means Clusters.");
      }
    } catch (err) { setKmeansError("Network error."); } 
    finally { setLoadingKmeans(false); }
  };

  const handleKmeansDiagnostics = async (e) => {
    e.preventDefault();
    if (kmeansConfig.features.length < 2) {
      setKmeansError("Select at least 2 features for diagnostics.");
      return;
    }
    setLoadingKmeansDiag(true); setKmeansError("");
    try {
      const response = await fetch("/api/ml/kmeans/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: kmeansConfig.features })
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setKmeansDiagnostics(data.diagnostics);
      } else {
        setKmeansError(data.message || "Failed to calculate diagnostics.");
      }
    } catch (err) { setKmeansError("Network error."); } 
    finally { setLoadingKmeansDiag(false); }
  };

  const handleForecastSubmit = async (e) => {
    e.preventDefault();
    if (!forecastConfig.date_col || !forecastConfig.val_col) return;
    setLoadingForecast(true); setForecastError(""); setForecastData(null);
    setAiInsights(prev => ({...prev, forecast: ""}));
    try {
      const response = await fetch("/api/ml/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forecastConfig)
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setForecastData(data);
      } else {
        setForecastError(data.message || "Failed to generate forecast.");
      }
    } catch (err) { setForecastError("Network error."); } 
    finally { setLoadingForecast(false); }
  };

  const handleNlpSubmit = async (e) => {
    e.preventDefault();
    if (!nlpConfig.text_col) return;
    setLoadingNlp(true); setNlpError(""); setNlpData(null);
    setAiInsights(prev => ({...prev, nlp: ""}));
    try {
      const response = await fetch("/api/ml/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nlpConfig)
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setNlpData(data);
      } else {
        setNlpError(data.message || "Failed to analyze sentiment.");
      }
    } catch (err) { setNlpError("Network error."); } 
    finally { setLoadingNlp(false); }
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    if (!topicConfig.text_col) return;
    setLoadingTopic(true); setTopicError(""); setTopicData(null);
    try {
      const response = await fetch("/api/ml/topic_modeling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(topicConfig)
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setTopicData(data);
      } else {
        setTopicError(data.message || "Failed to extract topics.");
      }
    } catch (err) { setTopicError("Network error."); } 
    finally { setLoadingTopic(false); }
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
            <h4 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1rem" }}>AI Model Interpretation</h4>
          </div>
          {!insight && !loading && (
            <button className="btn-primary" onClick={() => generateAIInsight(tabName, query)} style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}>Ask AI to Interpret</button>
          )}
        </div>
        {loading && <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}><SkeletonLoader height="30px" width="40%" /><SkeletonLoader height="200px" width="100%" /><SkeletonLoader height="100px" width="100%" /></div>}
        {error && <div style={{ color: "var(--accent-rose)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}><AlertCircle size={16} /> {error}</div>}
        {insight && <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "8px", padding: "1rem 1.25rem", maxHeight: "250px", overflowY: "auto" }}>{renderMarkdown(insight)}</div>}
      </div>
    );
  };

  const CLUSTER_COLORS = ["#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#6366f1", "#14b8a6", "#eab308"];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div className="glass-card" style={{ padding: 0 }}>
        
        {/* Header Tabs */}
        <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid var(--border-color)", background: "var(--bg-card-hover)", flexWrap: "nowrap", whiteSpace: "nowrap" }}>
          <button className={`tab-btn ${activeTab === "importance" ? "active" : ""}`} onClick={() => setActiveTab("importance")} style={{ flex: "0 0 auto", padding: "1rem 1.5rem", border: "none", borderBottom: activeTab === "importance" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: activeTab === "importance" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><Target size={16} /> Feature Importance</button>
          <button className={`tab-btn ${activeTab === "kmeans" ? "active" : ""}`} onClick={() => setActiveTab("kmeans")} style={{ flex: "0 0 auto", padding: "1rem 1.5rem", border: "none", borderBottom: activeTab === "kmeans" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: activeTab === "kmeans" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><Network size={16} /> K-Means Clustering</button>
          <button className={`tab-btn ${activeTab === "forecast" ? "active" : ""}`} onClick={() => setActiveTab("forecast")} style={{ flex: "0 0 auto", padding: "1rem 1.5rem", border: "none", borderBottom: activeTab === "forecast" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: activeTab === "forecast" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><TrendingUp size={16} /> Time-Series Forecast</button>
          <button className={`tab-btn ${activeTab === "nlp" ? "active" : ""}`} onClick={() => setActiveTab("nlp")} style={{ flex: "0 0 auto", padding: "1rem 1.5rem", border: "none", borderBottom: activeTab === "nlp" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: activeTab === "nlp" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><Type size={16} /> NLP & Sentiment</button>
        </div>

        <div style={{ padding: "2rem" }}>
          
          {/* FEATURE IMPORTANCE */}
          {activeTab === "importance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "2rem" }}>
                <div style={{ flex: "0 0 300px" }}>
                  <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Target size={20} style={{ color: "var(--accent-emerald)" }} /> Random Forest Importance</h3>
                  <form onSubmit={handleImpSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group"><label>Target Variable (to predict)</label><select value={impConfig.target_col} onChange={e => setImpConfig({...impConfig, target_col: e.target.value})}><option value="">Select Target...</option>{numericColumns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                      Model will drop rows with NaNs. It will automatically use a Classifier or Regressor depending on the uniqueness of the target column.
                    </p>
                    <button type="submit" className="btn-primary" disabled={loadingImp} style={{ background: "linear-gradient(135deg, var(--accent-emerald), #059669)" }}>{loadingImp ? "Training Model..." : "Calculate Importance"}</button>
                  </form>
                  {impError && <div style={{ color: "var(--accent-rose)", marginTop: "1rem" }}>{impError}</div>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {impData && (
                    <>
                      <div style={{ background: "var(--bg-card)", padding: "1rem 1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h4 style={{ color: "var(--text-dark)", margin: "0 0 0.25rem 0" }}>Random Forest {impData.model_type}</h4>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                {eli5Mode ? "Feature Importance shows exactly which columns had the biggest impact on the final prediction." : "Gini Importance Scores"}
                            </span>
                        </div>
                        <button onClick={() => setEli5Mode(!eli5Mode)} style={{ background: eli5Mode ? "var(--primary-purple)" : "transparent", border: "1px solid var(--primary-purple)", color: eli5Mode ? "white" : "var(--primary-purple)", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }}>
                            {eli5Mode ? "ELI5: ON" : "ELI5: OFF"}
                        </button>
                      </div>
                      <div style={{ background: "var(--bg-card-hover)", borderRadius: "10px", border: "1px solid var(--border-color)", padding: "1.5rem", height: "350px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={impData.importances} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" horizontal={true} vertical={false} />
                            <XAxis type="number" stroke="var(--text-dark)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                            <YAxis type="category" dataKey="feature" stroke="var(--text-dark)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} width={120} />
                            <ChartTooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} content={({ active, payload }) => active && payload && payload.length ? <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "8px", maxWidth: "200px" }}><p style={{color:"white", margin:0, fontWeight: 600}}>{payload[0].payload.feature}</p><p style={{color:"var(--accent-emerald)", margin:"0.25rem 0 0 0", fontSize: "0.85rem", lineHeight: "1.4"}}>{eli5Mode ? `This feature drove ${(payload[0].value * 100).toFixed(1)}% of the model's decision.` : `Importance: ${(payload[0].value * 100).toFixed(2)}%`}</p></div> : null} />
                            <Bar dataKey="importance" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {impData && renderAISection("importance", `Analyze this Random Forest ${impData.model_type} Feature Importance model predicting '${impConfig.target_col}'. The top features and their importance scores are: ${JSON.stringify(impData.importances.slice(0, 5))}. Interpret which features are driving the predictions and what this means for the business. Keep it concise with bullet points.`)}
            </div>
          )}

          {/* K-MEANS CLUSTERING */}
          {activeTab === "kmeans" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "2rem" }}>
                <div style={{ flex: "0 0 300px" }}>
                  <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Network size={20} style={{ color: "var(--secondary-cyan)" }} /> K-Means Clustering</h3>
                  <form onSubmit={handleKmeansSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group">
                      <label>Features (Dimensions)</label>
                      <select multiple value={kmeansConfig.features} onChange={e => {
                        const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                        setKmeansConfig({...kmeansConfig, features: options});
                      }} style={{ height: "120px" }}>
                        {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <small style={{color: "var(--text-muted)"}}>Hold Ctrl/Cmd to select multiple</small>
                    </div>
                    <div className="form-group"><label>Number of Clusters (K)</label><input type="number" min="2" max="10" value={kmeansConfig.k} onChange={e => setKmeansConfig({...kmeansConfig, k: parseInt(e.target.value) || 3})} /></div>
                    <button type="submit" className="btn-primary" disabled={loadingKmeans} style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}>{loadingKmeans ? "Clustering..." : "Run Multivariate K-Means"}</button>
                    <button onClick={handleKmeansDiagnostics} type="button" className="btn-secondary" disabled={loadingKmeansDiag} style={{ border: "1px solid var(--secondary-cyan)", color: "var(--secondary-cyan)", background: "transparent" }}>{loadingKmeansDiag ? "Calculating..." : "Run Diagnostics (Elbow Method)"}</button>
                  </form>
                  {kmeansError && <div style={{ color: "var(--accent-rose)", marginTop: "1rem" }}>{kmeansError}</div>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {kmeansDiagnostics && (
                    <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                      <h4 style={{ color: "var(--text-dark)", marginBottom: "1rem" }}>Diagnostic Metrics (Determine Optimal K)</h4>
                      <div style={{ height: "250px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={kmeansDiagnostics} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="k" stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)" }} name="Clusters (K)" />
                            <YAxis yAxisId="left" stroke="#8b5cf6" tick={{ fill: "var(--text-muted)" }} />
                            <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fill: "var(--text-muted)" }} />
                            <ChartTooltip contentStyle={{ background: "rgba(15, 23, 42, 0.9)", border: "none", borderRadius: "8px", color: "white" }} />
                            <Line yAxisId="left" type="monotone" dataKey="inertia" name="Inertia (Elbow)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                            <Line yAxisId="right" type="monotone" dataKey="silhouette_score" name="Silhouette Score" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                            <Legend />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {kmeansData && (
                    <>
                      <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                        <h4 style={{ color: "var(--text-dark)", marginBottom: "1rem" }}>Centroids Summary</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                          {kmeansData.centroids.map((c, i) => (
                            <div key={i} style={{ background: "rgba(0,0,0,0.3)", padding: "0.75rem 1rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}></div>
                                <span style={{ color: "var(--text-dark)", fontWeight: 600, fontSize: "0.85rem" }}>Cluster {i + 1}</span>
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                <div>X: {c.x.toFixed(2)}</div>
                                <div>Y: {c.y.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div style={{ background: "var(--bg-card-hover)", borderRadius: "10px", border: "1px solid var(--border-color)", padding: "1.5rem", height: "350px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                            <XAxis type="number" dataKey="x" name={kmeansData.x_label} stroke="var(--text-dark)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                            <YAxis type="number" dataKey="y" name={kmeansData.y_label} stroke="var(--text-dark)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                            <ChartTooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => active && payload && payload.length ? <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "8px" }}><p style={{color:"white", margin:0, fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem"}}><div style={{ width: "8px", height: "8px", borderRadius: "50%", background: CLUSTER_COLORS[payload[0].payload.cluster % CLUSTER_COLORS.length] }}></div> Cluster {payload[0].payload.cluster + 1}</p><p style={{color:"var(--text-muted)", margin:0, fontSize: "0.8rem"}}>{kmeansData.x_label}: {payload[0].payload.x.toFixed(2)}</p><p style={{color:"var(--text-muted)", margin:0, fontSize: "0.8rem"}}>{kmeansData.y_label}: {payload[0].payload.y.toFixed(2)}</p></div> : null} />
                            
                            {/* Render each cluster as a separate Scatter component so they get different colors */}
                            {Array.from({ length: kmeansData.k }).map((_, clusterIdx) => {
                              const clusterData = kmeansData.points.filter(p => p.cluster === clusterIdx);
                              return (
                                <Scatter 
                                  key={clusterIdx}
                                  name={`Cluster ${clusterIdx + 1}`} 
                                  data={clusterData} 
                                  fill={CLUSTER_COLORS[clusterIdx % CLUSTER_COLORS.length]} 
                                  opacity={0.8}
                                />
                              );
                            })}
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {kmeansData && renderAISection("kmeans", `Analyze this K-Means Clustering model (K=${kmeansData.k}) with features: '${kmeansConfig.features.join(", ")}'. The centroids (projected in 2D if features > 2) are: ${JSON.stringify(kmeansData.centroids)}. Interpret what these clusters represent conceptually. Are there distinct segments? What are the business implications of separating users/data into these specific groups? Keep it concise with bullet points.`)}
            </div>
          )}

          {/* TIME SERIES FORECASTING */}
          {activeTab === "forecast" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "2rem" }}>
                <div style={{ flex: "0 0 300px" }}>
                  <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><TrendingUp size={20} style={{ color: "var(--accent-amber)" }} /> Forecasting Engine</h3>
                  <form onSubmit={handleForecastSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group">
                      <label>Algorithm</label>
                      <select value={forecastConfig.algorithm} onChange={e => setForecastConfig({...forecastConfig, algorithm: e.target.value})}>
                        <option value="holt-winters">Holt-Winters (Exponential Smoothing)</option>
                        <option value="arima">ARIMA</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Date/Time Column</label><select value={forecastConfig.date_col} onChange={e => setForecastConfig({...forecastConfig, date_col: e.target.value})}><option value="">Select Date...</option>{datetimeColumns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>Value to Forecast</label><select value={forecastConfig.val_col} onChange={e => setForecastConfig({...forecastConfig, val_col: e.target.value})}><option value="">Select Value...</option>{numericColumns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>Forecast Periods (Steps)</label><input type="number" min="5" max="365" value={forecastConfig.periods} onChange={e => setForecastConfig({...forecastConfig, periods: parseInt(e.target.value) || 30})} /></div>
                    <button type="submit" className="btn-primary" disabled={loadingForecast} style={{ background: "linear-gradient(135deg, var(--accent-amber), #b45309)" }}>{loadingForecast ? "Training Model..." : "Generate Forecast"}</button>
                  </form>
                  {forecastError && <div style={{ color: "var(--accent-rose)", marginTop: "1rem" }}>{forecastError}</div>}
                  {datetimeColumns.length === 0 && <div style={{ color: "var(--accent-amber)", marginTop: "1rem", fontSize: "0.85rem" }}>Warning: No Date columns detected. Try converting a column in the Clean step first.</div>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {forecastData && (
                    <>
                      <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                        <h4 style={{ color: "var(--text-dark)", marginBottom: "0.5rem" }}>{forecastConfig.algorithm === "arima" ? "ARIMA" : "Exponential Smoothing"} Forecast</h4>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>Projected {forecastConfig.periods} periods into the future based on {forecastConfig.val_col} historical trends.</p>
                      </div>
                      
                      <div style={{ background: "var(--bg-card-hover)", borderRadius: "10px", border: "1px solid var(--border-color)", padding: "1.5rem", height: "400px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                            <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} stroke="var(--text-dark)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                            <YAxis stroke="var(--text-dark)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                            <ChartTooltip contentStyle={{ backgroundColor: "var(--bg-dark)", borderColor: "var(--border-color)", color: "var(--text-dark)" }} />
                            <Legend wrapperStyle={{ fontSize: "0.8rem", paddingTop: "1rem" }} />
                            
                            <Line data={forecastData.historical} type="monotone" dataKey="actual" name="Historical" stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            <Line data={forecastData.forecast} type="monotone" dataKey="forecast" name="Forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {forecastData && renderAISection("forecast", `Analyze this Time-Series forecast for '${forecastConfig.val_col}'. We forecasted ${forecastConfig.periods} periods into the future. Provide a brief business interpretation of the trend. Keep it concise.`)}
            </div>
          )}

          {/* NLP SENTIMENT */}
          {activeTab === "nlp" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "2rem" }}>
                <div style={{ flex: "0 0 300px" }}>
                  <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Type size={20} style={{ color: "var(--primary-purple)" }} /> Text Sentiment</h3>
                  <form onSubmit={handleNlpSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group"><label>Text Column</label><select value={nlpConfig.text_col} onChange={e => setNlpConfig({...nlpConfig, text_col: e.target.value})}><option value="">Select Text...</option>{textColumns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                      Analyzes text polarity using TextBlob. Best for reviews, feedback, or comments. Samples max 1000 rows.
                    </p>
                    <button type="submit" className="btn-primary" disabled={loadingNlp} style={{ background: "linear-gradient(135deg, var(--primary-purple), #6d28d9)" }}>{loadingNlp ? "Analyzing NLP..." : "Run Sentiment Analysis"}</button>
                  </form>
                  {nlpError && <div style={{ color: "var(--accent-rose)", marginTop: "1rem" }}>{nlpError}</div>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {nlpData && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                         <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                            <h4 style={{ margin: "0 0 1rem 0", color: "var(--text-dark)", fontSize: "0.95rem" }}>Sentiment Distribution</h4>
                            <div style={{ height: "200px" }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={nlpData.distribution} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                  <XAxis dataKey="sentiment" stroke="var(--text-muted)" style={{ fontSize: "0.7rem" }} />
                                  <YAxis stroke="var(--text-muted)" style={{ fontSize: "0.7rem" }} />
                                  <ChartTooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} contentStyle={{ background: "var(--bg-dark)", border: "1px solid var(--border-color)", borderRadius: "8px" }} />
                                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {nlpData.distribution.map((entry, index) => {
                                      const color = entry.sentiment === "Positive" ? "#10b981" : entry.sentiment === "Negative" ? "#f43f5e" : "#94a3b8";
                                      return <Cell key={`cell-${index}`} fill={color} />;
                                    })}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                         </div>
                         <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div style={{ background: "rgba(16, 185, 129, 0.05)", padding: "1.5rem", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.2)", flex: 1 }}>
                              <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--accent-emerald)", fontSize: "0.95rem" }}>Top Positive Themes</h4>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                {nlpData.top_positive_words.length > 0 ? nlpData.top_positive_words.map(w => <span key={w} style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.8rem" }}>{w}</span>) : <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Not enough data</span>}
                              </div>
                            </div>
                            <div style={{ background: "rgba(244, 63, 94, 0.05)", padding: "1.5rem", borderRadius: "10px", border: "1px solid rgba(244, 63, 94, 0.2)", flex: 1 }}>
                              <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--accent-rose)", fontSize: "0.95rem" }}>Top Negative Themes</h4>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                {nlpData.top_negative_words.length > 0 ? nlpData.top_negative_words.map(w => <span key={w} style={{ background: "rgba(244, 63, 94, 0.15)", color: "var(--accent-rose)", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.8rem" }}>{w}</span>) : <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Not enough data</span>}
                              </div>
                            </div>
                         </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {nlpData && renderAISection("nlp", `Analyze this Sentiment Analysis of '${nlpConfig.text_col}'. Distribution: ${JSON.stringify(nlpData.distribution)}. Top Positive Words: ${nlpData.top_positive_words.join(", ")}. Top Negative Words: ${nlpData.top_negative_words.join(", ")}. Provide a brief summary of the overall sentiment and what the top words suggest about user sentiment. Keep it concise.`)}
              
              <hr style={{ borderTop: "1px solid var(--border-color)", borderBottom: "none", margin: "2rem 0" }} />
              
              <div style={{ display: "flex", gap: "2rem" }}>
                <div style={{ flex: "0 0 300px" }}>
                  <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Network size={20} style={{ color: "var(--accent-emerald)" }} /> Topic Modeling (LDA)</h3>
                  <form onSubmit={handleTopicSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group"><label>Text Column</label><select value={topicConfig.text_col} onChange={e => setTopicConfig({...topicConfig, text_col: e.target.value})}><option value="">Select Text...</option>{textColumns.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>Number of Topics (K)</label><input type="number" min="2" max="10" value={topicConfig.n_topics} onChange={e => setTopicConfig({...topicConfig, n_topics: parseInt(e.target.value) || 5})} /></div>
                    <button type="submit" className="btn-primary" disabled={loadingTopic} style={{ background: "linear-gradient(135deg, var(--accent-emerald), #059669)" }}>{loadingTopic ? "Extracting Topics..." : "Run Topic Modeling"}</button>
                  </form>
                  {topicError && <div style={{ color: "var(--accent-rose)", marginTop: "1rem" }}>{topicError}</div>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {topicData && (
                    <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                      <h4 style={{ color: "var(--text-dark)", marginBottom: "1rem" }}>Extracted Topics</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {topicData.topics.map(topic => (
                          <div key={topic.topic_id} style={{ background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ fontWeight: 600, color: "var(--secondary-cyan)", marginBottom: "0.5rem" }}>Topic {topic.topic_id}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                              {topic.words.map(w => (
                                <span key={w.word} style={{ background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                  {w.word} <span style={{ opacity: 0.5, marginLeft: "0.25rem" }}>({w.weight.toFixed(2)})</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {topicData && renderAISection("topic", `Analyze this Topic Modeling extraction from column '${topicConfig.text_col}'. The topics and their top weighted words are: ${JSON.stringify(topicData.topics)}. Interpret what underlying concepts, sentiments, or themes each topic represents based on its top words. Suggest a 1-3 word label for each Topic. Keep it concise with bullet points.`)}
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
