import React, { useState, useEffect } from "react";
import SkeletonLoader from './SkeletonLoader';
import { BarChart2, ChevronRight, Activity, Sparkles, AlertCircle, TrendingUp, AlertTriangle, Calendar, PieChart, Activity as ActivityIcon, Maximize2, Grid } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart as RePieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from "recharts";

export default function EDA({ onNextStep, summary }) {
  const [activeTab, setActiveTab] = useState("bar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chartData, setChartData] = useState(null);

  // Selections
  const [col1, setCol1] = useState("");
  const [col2, setCol2] = useState("");
  const [agg, setAgg] = useState("sum");

  // AI
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const columns = Object.keys(summary.columns || {});
  const numericColumns = columns.filter((col) => summary.columns[col].stats.mean !== undefined);
  const catColumns = columns.filter((col) => summary.columns[col].stats.mean === undefined);
  
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#84cc16', '#f97316'];

  useEffect(() => {
    if (columns.length > 0) {
      if (!col1) setCol1(catColumns.length > 0 ? catColumns[0] : columns[0]);
      if (!col2) setCol2(numericColumns.length > 0 ? numericColumns[0] : columns[0]);
    }
  }, [summary]);

  useEffect(() => {
    fetchData();
  }, [activeTab, col1, col2, agg]);

  const fetchData = async () => {
    if (!col1) return;
    setLoading(true); setError(""); setChartData(null); setAiInsight(""); setAiError("");
    try {
      let r, d;
      if (activeTab === "bar" || activeTab === "histogram") {
        r = await fetch(`/api/stats/distribution/${encodeURIComponent(col1)}`);
        d = await r.json();
        if (r.ok && d.status !== "error") {
          setChartData(d.labels.map((label, i) => ({ name: label, count: d.counts[i] })));
        } else throw new Error(d.message);
      } else if (activeTab === "pie") {
        r = await fetch(`/api/stats/pie/${encodeURIComponent(col1)}`);
        d = await r.json();
        if (r.ok) setChartData(d.slices); else throw new Error(d.detail);
      } else if (activeTab === "line") {
        r = await fetch("/api/stats/timeseries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date_col: col1, val_col: col2, aggfunc: agg }) });
        d = await r.json();
        if (r.ok && d.status === "success") setChartData(d.points); else throw new Error(d.message);
      } else if (activeTab === "box") {
        r = await fetch(`/api/stats/boxplot/${encodeURIComponent(col1)}`);
        d = await r.json();
        if (r.ok) setChartData(d); else throw new Error(d.detail);
      } else if (activeTab === "scatter") {
        if (!col2) return;
        if (col1 === col2) throw new Error("X and Y axes must be different columns for a Scatter Plot.");
        r = await fetch("/api/stats/scatter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ x_col: col1, y_col: col2 }) });
        d = await r.json();
        if (r.ok) setChartData(d); else throw new Error(d.detail);
      } else if (activeTab === "heatmap") {
        r = await fetch("/api/stats/correlation");
        d = await r.json();
        if (r.ok && d.status !== "error") setChartData(d); else throw new Error(d.message);
      }
    } catch (e) { setError(e.message || "Failed to load chart data"); }
    finally { setLoading(false); }
  };

  const getAI = async (query) => {
    setAiLoading(true); setAiError("");
    try {
      const r = await fetch("/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, data_preview: null }) });
      const d = await r.json();
      if (r.ok) setAiInsight(d.insights); else throw new Error(d.detail);
    } catch (e) { setAiError(e.message); }
    finally { setAiLoading(false); }
  };

  const handleAI = () => {
    let q = "";
    if (activeTab === "bar" || activeTab === "histogram") q = `Analyze this distribution of '${col1}': ${JSON.stringify(chartData?.slice(0, 10))}. What does it say about skewness, common categories, or data shape?`;
    else if (activeTab === "pie") q = `Analyze this pie chart of '${col1}': ${JSON.stringify(chartData)}. Which categories dominate and what's the business impact?`;
    else if (activeTab === "line") q = `Analyze this time series. Date: ${col1}, Value: ${col2}. Data: ${JSON.stringify(chartData?.slice(0, 5))} ... ${JSON.stringify(chartData?.slice(-5))}. Identify trends and seasonality.`;
    else if (activeTab === "box") q = `Analyze this box plot of '${col1}'. Min: ${chartData?.min}, Q1: ${chartData?.q1}, Median: ${chartData?.median}, Q3: ${chartData?.q3}, Max: ${chartData?.max}. Explain outliers and spread.`;
    else if (activeTab === "scatter") q = `Analyze scatter plot. X: ${col1}, Y: ${col2}. Correlation is ${chartData?.correlation}. Explain the relationship between these two variables.`;
    else if (activeTab === "heatmap") q = `Analyze this correlation matrix. Variables: ${chartData?.variables}. Strongest positive and negative correlations? Which ones suffer from multicollinearity?`;
    getAI(q);
  };

  const tabs = [
    { id: "bar", icon: <BarChart2 size={16}/>, label: "Bar Chart", desc: "Compare categories", allowed: catColumns },
    { id: "line", icon: <TrendingUp size={16}/>, label: "Line Chart", desc: "Trends over time", allowed: columns },
    { id: "pie", icon: <PieChart size={16}/>, label: "Pie Chart", desc: "Percentage distribution", allowed: catColumns },
    { id: "histogram", icon: <ActivityIcon size={16}/>, label: "Histogram", desc: "Distribution of values", allowed: numericColumns },
    { id: "box", icon: <Maximize2 size={16}/>, label: "Box Plot", desc: "Detect outliers", allowed: numericColumns },
    { id: "scatter", icon: <Scatter size={16}/>, label: "Scatter Plot", desc: "Relationships", allowed: numericColumns },
    { id: "heatmap", icon: <Grid size={16}/>, label: "Heatmap", desc: "Correlation analysis", allowed: [] }
  ];

  const renderChart = () => {
    if (loading) return <div style={{textAlign:"center", padding:"3rem"}}><div className="loader-spinner"/></div>;
    if (error) return <div style={{color:"var(--accent-rose)", padding:"2rem"}}><AlertCircle/> {error}</div>;
    if (!chartData) return null;

    if (activeTab === "bar" || activeTab === "histogram") {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-muted)" angle={-35} textAnchor="end" tick={{fontSize:11}} interval={0} />
            <YAxis stroke="var(--text-muted)" tick={{fontSize:11}} />
            <Tooltip contentStyle={{background:"rgba(15,23,42,0.9)", border:"1px solid var(--border-color)", borderRadius:"8px", color:"#fff"}} />
            <Bar dataKey="count" fill="var(--primary-purple)" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (activeTab === "pie") {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <RePieChart>
            <Tooltip contentStyle={{background:"rgba(15,23,42,0.9)", border:"1px solid var(--border-color)", borderRadius:"8px", color:"#fff"}} />
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({name, pct}) => `${name} (${pct}%)`}>
              {chartData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
          </RePieChart>
        </ResponsiveContainer>
      );
    }
    if (activeTab === "line") {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="var(--text-muted)" tick={{fontSize:11}} angle={-25} textAnchor="end" />
            <YAxis stroke="var(--text-muted)" tick={{fontSize:11}} />
            <Tooltip contentStyle={{background:"rgba(15,23,42,0.9)", border:"1px solid var(--border-color)", borderRadius:"8px", color:"#fff"}} />
            <Line type="monotone" dataKey="value" stroke="var(--accent-emerald)" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (activeTab === "box") {
      if (!chartData || chartData.min === undefined) return null;
      // Custom minimal box plot using raw HTML/CSS since recharts doesn't have a native one
      const min = chartData.min; const max = chartData.max; const range = max - min;
      const pct = (val) => range === 0 ? 50 : ((val - min) / range) * 100;
      return (
        <div style={{height: 350, display:"flex", alignItems:"center", padding: "2rem"}}>
          <div style={{flex:1, position:"relative", height:"40px", marginTop:"100px"}}>
            {/* Axis */}
            <div style={{position:"absolute", top:"50px", left:0, right:0, height:"2px", background:"var(--text-muted)"}} />
            <div style={{position:"absolute", top:"55px", left:0, color:"var(--text-muted)", fontSize:"0.8rem", transform:"translateX(-50%)"}}>{min.toFixed(2)}</div>
            <div style={{position:"absolute", top:"55px", right:0, color:"var(--text-muted)", fontSize:"0.8rem", transform:"translateX(50%)"}}>{max.toFixed(2)}</div>
            
            {/* Whiskers */}
            <div style={{position:"absolute", top:"20px", height:"2px", background:"var(--secondary-cyan)", left:`${pct(chartData.whisker_low)}%`, width:`${pct(chartData.q1) - pct(chartData.whisker_low)}%`}} />
            <div style={{position:"absolute", top:"20px", height:"2px", background:"var(--secondary-cyan)", left:`${pct(chartData.q3)}%`, width:`${pct(chartData.whisker_high) - pct(chartData.q3)}%`}} />
            
            {/* Whisker Ends */}
            <div style={{position:"absolute", top:"10px", height:"20px", width:"2px", background:"var(--secondary-cyan)", left:`${pct(chartData.whisker_low)}%`}} />
            <div style={{position:"absolute", top:"10px", height:"20px", width:"2px", background:"var(--secondary-cyan)", left:`${pct(chartData.whisker_high)}%`}} />
            
            {/* Box */}
            <div style={{position:"absolute", top:0, height:"40px", background:"rgba(6,182,212,0.2)", border:"2px solid var(--secondary-cyan)", left:`${pct(chartData.q1)}%`, width:`${pct(chartData.q3) - pct(chartData.q1)}%`}} />
            
            {/* Median */}
            <div style={{position:"absolute", top:0, height:"40px", width:"3px", background:"var(--accent-amber)", left:`${pct(chartData.median)}%`}} />
            
            {/* Outliers */}
            {chartData.outliers && chartData.outliers.map((o, i) => (
              <div key={i} style={{position:"absolute", top:"17px", width:"6px", height:"6px", borderRadius:"50%", background:"var(--accent-rose)", left:`${pct(o)}%`, transform:"translateX(-50%)"}} title={`Outlier: ${o}`} />
            ))}
          </div>
        </div>
      );
    }
    if (activeTab === "scatter") {
      if (!chartData || !chartData.points) return null;
      return (
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" dataKey="x" name={chartData.x_col} stroke="var(--text-muted)" tick={{fontSize:11}} />
            <YAxis type="number" dataKey="y" name={chartData.y_col} stroke="var(--text-muted)" tick={{fontSize:11}} />
            <ZAxis type="number" range={[50, 50]} />
            <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{background:"rgba(15,23,42,0.9)", border:"1px solid var(--border-color)", borderRadius:"8px", color:"#fff"}} />
            <Scatter name="Points" data={chartData.points} fill="var(--primary-purple)" opacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }
    if (activeTab === "heatmap") {
      if (!chartData || !chartData.columns) return null;
      const vars = chartData.columns;
      const mat = chartData.values;
      return (
        <div style={{ overflowX:"auto", overflowY:"auto", maxHeight: "400px" }}>
          <table style={{ borderCollapse:"collapse", minWidth:"100%" }}>
            <thead>
              <tr>
                <th style={{padding:"0.5rem", border:"1px solid var(--border-color)"}}></th>
                {vars.map(v => <th key={v} style={{padding:"0.5rem", border:"1px solid var(--border-color)", fontSize:"0.8rem", color:"var(--text-muted)"}}><div>{v.substring(0,10)}</div></th>)}
              </tr>
            </thead>
            <tbody>
              {vars.map((v1, i) => (
                <tr key={v1}>
                  <td style={{padding:"0.5rem", border:"1px solid var(--border-color)", fontSize:"0.8rem", color:"var(--text-muted)", fontWeight:600}}>{v1.substring(0,10)}</td>
                  {vars.map((v2, j) => {
                    const val = mat[i][j];
                    const bg = val > 0 ? `rgba(16,185,129,${val})` : `rgba(244,63,94,${Math.abs(val)})`;
                    return <td key={v2} style={{padding:"0.5rem", border:"1px solid var(--border-color)", background:bg, color:"#fff", textAlign:"center", fontSize:"0.8rem", fontWeight:500}} title={`${v1} vs ${v2}: ${val.toFixed(2)}`}>{val.toFixed(2)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Horizontal Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => {
            setActiveTab(t.id);
            if (t.allowed.length > 0 && !t.allowed.includes(col1)) setCol1(t.allowed[0]);
          }}
          style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: activeTab === t.id ? "1px solid var(--primary-purple)" : "1px solid var(--border-color)", background: activeTab === t.id ? "var(--primary-purple)" : "transparent", color: activeTab === t.id ? "#fff" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", transition: "all 0.2s" }}>
            {t.icon} <span style={{fontSize:"0.85rem", fontWeight:500}}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        {/* Controls Sidebar */}
        <div style={{ flex: "0 0 280px", display: "flex", flexDirection: "column", gap: "1rem", background: "var(--bg-card)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
          <h4 style={{ margin:0, color:"var(--text-dark)" }}>Chart Settings</h4>
          <p style={{ margin:0, fontSize:"0.8rem", color:"var(--text-muted)" }}>{tabs.find(t => t.id === activeTab)?.desc}</p>
          
          {activeTab !== "heatmap" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>{activeTab === 'scatter' ? "X-Axis Column" : activeTab === 'line' ? "Date/X Column" : "Target Column"}</label>
              <select value={col1} onChange={e => setCol1(e.target.value)} style={{ padding: "0.5rem", background: "var(--bg-dark)", border: "1px solid var(--border-color)", color: "var(--text-main)", borderRadius: "6px" }}>
                {tabs.find(t=>t.id===activeTab)?.allowed?.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {(activeTab === "line" || activeTab === "scatter") && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>{activeTab === 'scatter' ? "Y-Axis Column" : "Value Column"}</label>
              <select value={col2} onChange={e => setCol2(e.target.value)} style={{ padding: "0.5rem", background: "var(--bg-dark)", border: "1px solid var(--border-color)", color: "var(--text-main)", borderRadius: "6px" }}>
                {numericColumns.map(c => <option key={c} value={c} disabled={activeTab === 'scatter' && c === col1}>{c}</option>)}
              </select>
            </div>
          )}

          {activeTab === "line" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>Aggregation</label>
              <select value={agg} onChange={e => setAgg(e.target.value)} style={{ padding: "0.5rem", background: "var(--bg-dark)", border: "1px solid var(--border-color)", color: "var(--text-main)", borderRadius: "6px" }}>
                <option value="sum">Sum</option>
                <option value="mean">Average</option>
                <option value="count">Count</option>
              </select>
            </div>
          )}
        </div>

        {/* Chart Area */}
        <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "rgba(15,23,42,0.3)", borderRadius: "10px", border: "1px solid var(--border-color)", padding: "1.5rem" }}>
            {renderChart()}
          </div>

          {/* AI Narrative */}
          <div style={{ background: "rgba(139,92,246,0.05)", borderRadius: "10px", border: "1px solid rgba(139,92,246,0.3)", padding: "1.5rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <Sparkles size={18} style={{ color: "var(--primary-purple)" }} />
                <h4 style={{ margin:0, color:"var(--text-dark)" }}>AI Narrative</h4>
              </div>
              <button className="btn-secondary" onClick={handleAI} disabled={aiLoading || !chartData} style={{ padding:"0.4rem 0.8rem", fontSize:"0.8rem" }}>
                {aiLoading ? "Analyzing..." : "Ask AI"}
              </button>
            </div>
            
            {aiError && <div style={{color:"var(--accent-rose)", fontSize:"0.85rem"}}>{aiError}</div>}
            
            {aiInsight ? (
              <div style={{ color:"var(--text-main)", fontSize:"0.9rem", lineHeight:1.6 }} dangerouslySetInnerHTML={{__html: aiInsight.replace(/\n/g, "<br/>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}} />
            ) : (
              <div style={{ color:"var(--text-muted)", fontSize:"0.85rem", fontStyle:"italic" }}>
                Click "Ask AI" to generate insights about this chart...
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-primary" onClick={onNextStep}>
          Next: Machine Learning <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
