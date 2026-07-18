import React, { useState, useEffect } from "react";
import { Sparkles, BarChart2, TrendingUp, Activity, ChevronRight, Sliders, PieChart as PieIcon, LayoutDashboard, Terminal } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';

const ResponsiveGridLayout = WidthProvider(Responsive);

const COLORS = ['#8b5cf6', '#0ea5e9', '#f43f5e', '#f59e0b', '#10b981', '#6366f1'];

export default function ChartExplorer({ onNextStep, summary }) {
  const [mode, setMode] = useState("ai"); // 'ai' or 'manual'
  const [limitRows, setLimitRows] = useState(10);
  
  // Manual Mode State
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [secondaryY, setSecondaryY] = useState("");

  // AI Mode State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  
  // Dashboard Layout (Array of Widget Configs)
  const [widgets, setWidgets] = useState([]);
  
  // Cross-filtering & Global Date Filter
  const [activeFilter, setActiveFilter] = useState(null);
  const [globalDateFilter, setGlobalDateFilter] = useState("All Time");
  const handleChartClick = (col, val) => {
      setActiveFilter({ col, val });
  };

  const columns = Object.keys(summary.columns || {});
  const numericColumns = columns.filter((col) => summary.columns[col].stats.mean !== undefined);
  const datetimeColumns = columns.filter(col => summary.columns[col].dtype === "datetime64[ns]" || summary.columns[col].dtype?.includes("datetime"));
  const hasDateColumn = datetimeColumns.length > 0;

  // Initialize Manual Defaults
  useEffect(() => {
    if (columns.length > 0 && mode === "manual" && widgets.length === 0) {
      const defaultX = columns[0];
      const defaultY1 = numericColumns.length > 0 ? numericColumns[0] : columns[0];
      const defaultY2 = numericColumns.length > 1 ? numericColumns[1] : defaultY1;
      
      setXAxis(defaultX);
      setYAxis(defaultY1);
      setSecondaryY(defaultY2);
      
      setWidgets([
        { chart_type: "bar", x_col: defaultX, y_col: defaultY1, title: `${defaultY1} by ${defaultX}` },
        { chart_type: "line", x_col: defaultX, y_col: defaultY2, title: `${defaultY2} Trends` },
        { chart_type: "area", x_col: defaultX, y_col: defaultY1, title: `Area Distribution (${defaultY1})` },
        { chart_type: "scatter", x_col: defaultX, y_col: defaultY1, title: `Scatter (${defaultY1})` },
        { chart_type: "map", x_col: defaultX, y_col: defaultY1, title: `Geospatial Map` }
      ]);
    }
  }, [summary, mode]);

  // Update Manual widgets when dropdowns change
  useEffect(() => {
    if (mode === "manual" && xAxis && yAxis && secondaryY) {
      setWidgets([
        { chart_type: "bar", x_col: xAxis, y_col: yAxis, title: `${yAxis} by ${xAxis}` },
        { chart_type: "line", x_col: xAxis, y_col: secondaryY, title: `${secondaryY} Trends` },
        { chart_type: "area", x_col: xAxis, y_col: yAxis, title: `Area Distribution (${yAxis})` },
        { chart_type: "scatter", x_col: xAxis, y_col: yAxis, title: `Scatter (${yAxis})` },
        { chart_type: "map", x_col: xAxis, y_col: yAxis, title: `Geospatial Map` }
      ]);
    }
  }, [xAxis, yAxis, secondaryY, mode]);

  // Handle AI Generation
  const generateDashboard = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    setAiError("");
    
    // Create a simplified schema dictionary to send to LLM
    const schema_json = JSON.stringify(Object.keys(summary.columns).reduce((acc, key) => {
        acc[key] = { dtype: summary.columns[key].dtype, unique_count: summary.columns[key].stats.unique_count || 0 };
        return acc;
    }, {}));

    try {
      const response = await fetch("/api/ml/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, dataset_schema: schema_json })
      });
      
      const data = await response.json();
      if (response.ok && data.widgets) {
        setWidgets(data.widgets);
      } else {
        setAiError(data.message || "Failed to generate dashboard layout.");
      }
    } catch (err) {
      setAiError("Network error. Make sure backend is running.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Global Data Filtering
  const filteredPreview = React.useMemo(() => {
    let data = summary.preview;
    if (hasDateColumn && globalDateFilter !== "All Time") {
      const dateCol = datetimeColumns[0];
      const now = new Date();
      data = data.filter(row => {
        const rowDate = new Date(row[dateCol]);
        if (isNaN(rowDate)) return true;
        const diffDays = (now - rowDate) / (1000 * 60 * 60 * 24);
        if (globalDateFilter === "Last 7 Days") return diffDays <= 7;
        if (globalDateFilter === "Last 30 Days") return diffDays <= 30;
        if (globalDateFilter === "Year to Date") return rowDate.getFullYear() === now.getFullYear();
        return true;
      });
    }
    return data;
  }, [summary.preview, globalDateFilter, hasDateColumn, datetimeColumns]);

  // Safe formatting of data for charting
  const chartData = filteredPreview.slice(0, limitRows).map((row) => {
    const formattedRow = { ...row };
    // Force string conversion for X axis categories to prevent Recharts from treating them purely numerically if they are IDs
    columns.forEach(col => {
        if (!numericColumns.includes(col) && row[col] !== null) {
             formattedRow[col] = String(row[col]);
        }
    });
    return formattedRow;
  });

  const renderWidget = (widget, index) => {
    const { chart_type, x_col, y_col, title } = widget;
    const isDate = summary.columns[x_col]?.dtype?.includes("datetime");
    
    // Fallback UI if columns are missing
    if (!columns.includes(x_col) || !columns.includes(y_col)) {
        return (
            <div key={index} className="glass-card" style={{ display: "flex", flexDirection: "column", height: "350px", margin: 0, padding: "1.5rem", justifyContent: "center", alignItems: "center" }}>
                <p style={{ color: "var(--accent-rose)" }}>Invalid Widget Config</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Missing column: {x_col} or {y_col}</p>
            </div>
        );
    }

    const renderChart = () => {
        switch (chart_type) {
            case "bar":
                return (
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis dataKey={x_col} stroke="var(--text-muted)" style={{ fontSize: "0.7rem" }} />
                        <YAxis stroke="var(--text-muted)" style={{ fontSize: "0.7rem" }} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--bg-dark)", borderColor: "var(--border-color)", color: "var(--text-dark)" }} />
                        <Bar dataKey={y_col} fill="var(--primary-purple)" radius={[4, 4, 0, 0]} onClick={(data) => handleChartClick(x_col, data[x_col])} style={{ cursor: 'pointer' }} />
                    </BarChart>
                );
            case "line":
                return (
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis dataKey={x_col} stroke="var(--text-muted)" style={{ fontSize: "0.7rem" }} />
                        <YAxis stroke="var(--text-muted)" style={{ fontSize: "0.7rem" }} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--bg-dark)", borderColor: "var(--border-color)", color: "var(--text-dark)" }} />
                        <Line type="monotone" dataKey={y_col} stroke="var(--secondary-cyan)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                );
            case "area":
                return (
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                        <linearGradient id={`colorY_${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-emerald)" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="var(--accent-emerald)" stopOpacity={0}/>
                        </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis dataKey={x_col} stroke="var(--text-muted)" style={{ fontSize: "0.7rem" }} />
                        <YAxis stroke="var(--text-muted)" style={{ fontSize: "0.7rem" }} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--bg-dark)", borderColor: "var(--border-color)", color: "var(--text-dark)" }} />
                        <Area type="monotone" dataKey={y_col} stroke="var(--accent-emerald)" fillOpacity={1} fill={`url(#colorY_${index})`} />
                    </AreaChart>
                );
            case "pie":
                if (isDate) {
                    return (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: "rgba(244,63,94,0.05)", border: "1px dashed rgba(244,63,94,0.3)", borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
                            <PieIcon size={32} style={{ color: "var(--accent-rose)", marginBottom: "1rem", opacity: 0.5 }} />
                            <h4 style={{ color: "var(--accent-rose)", margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>Not Recommended</h4>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: 0, maxWidth: "250px" }}>
                                Pie charts are confusing for time-series data. Best practice is to use <strong>Line</strong> or <strong>Area</strong> charts for timelines.
                            </p>
                        </div>
                    );
                }
                return (
                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Tooltip contentStyle={{ backgroundColor: "var(--bg-dark)", borderColor: "var(--border-color)", color: "var(--text-dark)" }} />
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey={y_col}
                            nameKey={x_col}
                            onClick={(data) => handleChartClick(x_col, data[x_col])}
                            style={{ cursor: "pointer" }}
                        >
                        {chartData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                        </Pie>
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "0.75rem", paddingTop: "1rem" }} />
                    </PieChart>
                );
            case "scatter":
                 return (
                    <ScatterChart margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis dataKey={x_col} type="category" stroke="var(--text-muted)" style={{ fontSize: "0.7rem" }} />
                        <YAxis dataKey={y_col} type="number" stroke="var(--text-muted)" style={{ fontSize: "0.7rem" }} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: "var(--bg-dark)", borderColor: "var(--border-color)", color: "var(--text-dark)" }} />
                        <Scatter name={title} data={chartData} fill="var(--accent-amber)" onClick={(data) => handleChartClick(x_col, data[x_col])} style={{ cursor: 'pointer' }} />
                    </ScatterChart>
                 );
            case "map":
                 // Check if lat/lon is somewhat valid. Just assume x_col is lon, y_col is lat. Or x_col is lat, y_col is lon.
                 // We will just try to render them.
                 // eslint-disable-next-line no-case-declarations
                 const validMapData = chartData.filter(d => !isNaN(parseFloat(d[x_col])) && !isNaN(parseFloat(d[y_col])));
                 if (validMapData.length === 0) {
                     return (
                         <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: "rgba(244,63,94,0.05)", borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
                            <p style={{ color: "var(--accent-rose)", fontSize: "0.8rem", margin: 0 }}>Coordinates must be numeric.</p>
                         </div>
                     );
                 }
                 // Center map on first point
                 // eslint-disable-next-line no-case-declarations
                 const center = [parseFloat(validMapData[0][x_col]), parseFloat(validMapData[0][y_col])]; 
                 return (
                     <div style={{ width: "100%", height: "100%", borderRadius: "8px", overflow: "hidden" }} className="map-container-wrapper">
                         <MapContainer center={center} zoom={4} style={{ height: "100%", width: "100%", background: "#1a1a2e" }} scrollWheelZoom={false}>
                             <TileLayer
                                 url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                 attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                             />
                             {validMapData.map((d, i) => (
                                 <CircleMarker 
                                     key={i} 
                                     center={[parseFloat(d[x_col]), parseFloat(d[y_col])]} 
                                     radius={6} 
                                     pathOptions={{ color: 'var(--primary-purple)', fillColor: 'var(--primary-purple)', fillOpacity: 0.7 }}
                                 >
                                     <LeafletTooltip direction="top" opacity={1} className="custom-leaflet-tooltip">
                                         <div style={{ padding: "5px", background: "var(--bg-dark)", color: "var(--text-dark)", border: "1px solid var(--border-color)", borderRadius: "4px" }}>
                                             <strong>Lat:</strong> {d[x_col]} <br/>
                                             <strong>Lon:</strong> {d[y_col]}
                                         </div>
                                     </LeafletTooltip>
                                 </CircleMarker>
                             ))}
                         </MapContainer>
                     </div>
                 );
            default:
                return <div>Unsupported chart type</div>;
        }
    };

    const getIcon = (type) => {
        switch(type) {
            case "bar": return <BarChart2 size={16} />;
            case "line": return <TrendingUp size={16} />;
            case "area": return <Activity size={16} />;
            case "pie": return <PieIcon size={16} />;
            case "scatter": return <Sparkles size={16} />;
            case "map": return <Sparkles size={16} />;
            default: return <BarChart2 size={16} />;
        }
    };

    return (
        <div className="glass-card fade-in" style={{ display: "flex", flexDirection: "column", height: "100%", margin: 0, padding: "1.5rem", overflow: "hidden" }}>
          <div className="drag-handle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", cursor: "grab" }}>
            <h4 style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {getIcon(chart_type)} {title}
                {isDate && (chart_type === "line" || chart_type === "area") && (
                    <span style={{ fontSize: "0.6rem", background: "rgba(16,185,129,0.15)", color: "var(--accent-emerald)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>BEST PRACTICE</span>
                )}
            </h4>
            <span style={{ fontSize: "0.7rem", color: "var(--text-dark)", background: "var(--bg-card-hover)", padding: "0.2rem 0.5rem", borderRadius: "10px" }}>{x_col} × {y_col}</span>
          </div>
          <div style={{ flex: 1, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </div>
    );
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* Global Date Filter Bar */}
      {hasDateColumn && (
          <div className="glass-card fade-in" style={{ padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem", marginBottom: 0 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Sliders size={14} /> Global Timeline:
              </span>
              {["All Time", "Last 7 Days", "Last 30 Days", "Year to Date"].map(filterOption => (
                  <button 
                      key={filterOption}
                      onClick={() => setGlobalDateFilter(filterOption)}
                      style={{ 
                          background: globalDateFilter === filterOption ? "var(--primary-purple)" : "transparent",
                          border: globalDateFilter === filterOption ? "1px solid var(--primary-purple)" : "1px solid var(--border-color)",
                          color: globalDateFilter === filterOption ? "white" : "var(--text-dark)",
                          padding: "0.25rem 0.75rem", borderRadius: "12px", fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s"
                      }}
                  >
                      {filterOption}
                  </button>
              ))}
          </div>
      )}

      {/* Controls Container */}
      <div className="glass-card" style={{ marginBottom: 0 }}>
        
        {/* Header Tabs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button className={`tab-btn ${mode === "ai" ? "active" : ""}`} onClick={() => {setMode("ai"); setWidgets([]);}} style={{ padding: "0.5rem 1rem", border: "none", borderBottom: mode === "ai" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: mode === "ai" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><Sparkles size={16} /> AI Dashboard Agent</button>
            <button className={`tab-btn ${mode === "manual" ? "active" : ""}`} onClick={() => {setMode("manual"); setWidgets([]);}} style={{ padding: "0.5rem 1rem", border: "none", borderBottom: mode === "manual" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: mode === "manual" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><Sliders size={16} /> Manual Builder</button>
          </div>
          <button className="btn-primary" onClick={onNextStep}>
            Next: AI Insights <ChevronRight size={16} />
          </button>
        </div>

        {/* AI Mode Input */}
        {mode === "ai" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <form onSubmit={generateDashboard} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <Terminal size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input 
                            type="text" 
                            placeholder="e.g., 'Create an executive dashboard showing revenue by region and profit over time...'" 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            style={{ width: "100%", padding: "1rem 1rem 1rem 3rem", background: "var(--bg-card-hover)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-dark)", fontSize: "0.95rem" }}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={isGenerating} style={{ padding: "1rem 2rem" }}>
                        {isGenerating ? "Generating..." : "Build Dashboard"}
                    </button>
                </form>
                {aiError && <p style={{ color: "var(--accent-rose)", margin: 0, fontSize: "0.9rem" }}>{aiError}</p>}
                
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Data Sample Limit:</span>
                    <input type="range" min="3" max={summary.preview.length} value={limitRows} onChange={(e) => setLimitRows(Number(e.target.value))} style={{ accentColor: "var(--primary-purple)", width: "150px" }} />
                    <span style={{ fontSize: "0.85rem", color: "var(--text-dark)" }}>{limitRows} rows</span>
                </div>
            </div>
        )}

        {/* Manual Mode Input */}
        {mode === "manual" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
                <div className="form-group" style={{ margin: 0 }}>
                    <label>X-Axis Dimension</label>
                    <select value={xAxis} onChange={(e) => setXAxis(e.target.value)}>{columns.map((col) => (<option key={col} value={col}>{col}</option>))}</select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label>Primary Metric (Y-Axis)</label>
                    <select value={yAxis} onChange={(e) => setYAxis(e.target.value)}>{numericColumns.map((col) => (<option key={col} value={col} disabled={col === xAxis}>{col}</option>))}</select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label>Secondary Metric</label>
                    <select value={secondaryY} onChange={(e) => setSecondaryY(e.target.value)}>{numericColumns.map((col) => (<option key={col} value={col}>{col}</option>))}</select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label>Data Limit ({limitRows})</label>
                    <input type="range" min="3" max={summary.preview.length} value={limitRows} onChange={(e) => setLimitRows(Number(e.target.value))} style={{ marginTop: "0.5rem", accentColor: "var(--primary-purple)" }} />
                </div>
            </div>
        )}
      </div>

      {/* Dynamic Widget Grid */}
      {widgets.length > 0 ? (
          <ResponsiveGridLayout
            className="layout"
            layouts={{
                lg: widgets.map((w, i) => ({ i: String(i), x: (i % 2) * 6, y: Math.floor(i / 2) * 4, w: 6, h: 4, minW: 4, minH: 3 }))
            }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={80}
            isDraggable={true}
            isResizable={true}
            draggableHandle=".drag-handle"
          >
            {widgets.map((widget, index) => (
                <div key={String(index)}>
                    {renderWidget(widget, index)}
                </div>
            ))}
          </ResponsiveGridLayout>
      ) : mode === "ai" && !isGenerating ? (
          <div style={{ height: "300px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border-color)", borderRadius: "10px", color: "var(--text-muted)" }}>
              <LayoutDashboard size={48} style={{ color: "var(--border-color)", marginBottom: "1rem" }} />
              <p>Type a prompt above to generate a custom dashboard.</p>
          </div>
      ) : mode === "ai" && isGenerating ? (
          <div style={{ height: "300px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border-color)", borderRadius: "10px" }}>
              <div className="loader-spinner" style={{ marginBottom: "1rem" }}></div>
              <p style={{ color: "var(--secondary-cyan)" }}>AI is designing your layout...</p>
          </div>
      ) : null}

      {/* Raw Data Preview (Cross-filtered) */}
      <div className="glass-card fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem" }}>
            <LayoutDashboard size={18} style={{ color: "var(--primary-purple)" }} /> Raw Data Preview
            {activeFilter && (
                <span style={{ fontSize: "0.75rem", background: "var(--primary-purple)", color: "white", padding: "0.2rem 0.6rem", borderRadius: "10px", marginLeft: "0.5rem" }}>
                    Filtered: {activeFilter.col} = {activeFilter.val}
                </span>
            )}
          </h3>
          {activeFilter && (
              <button onClick={() => setActiveFilter(null)} className="btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", background: "rgba(244,63,94,0.1)", color: "var(--accent-rose)", border: "1px solid rgba(244,63,94,0.3)" }}>
                  Clear Filter
              </button>
          )}
        </div>
        
        <div style={{ overflowX: "auto", background: "rgba(0,0,0,0.3)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <table className="pivot-table" style={{ width: "100%", textAlign: "left", fontSize: "0.8rem" }}>
                <thead>
                <tr>
                    {columns.slice(0, 10).map(col => <th key={col} style={{ padding: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--primary-purple)" }}>{col}</th>)}
                </tr>
                </thead>
                <tbody>
                {(activeFilter 
                    ? summary.preview.filter(row => String(row[activeFilter.col]) === String(activeFilter.val))
                    : summary.preview
                ).slice(0, 20).map((row, idx) => (
                    <tr key={idx}>
                    {columns.slice(0, 10).map(col => <td key={col} style={{ padding: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "var(--text-main)" }}>{row[col] !== null ? String(row[col]) : "null"}</td>)}
                    </tr>
                ))}
                </tbody>
            </table>
            {activeFilter && summary.preview.filter(row => String(row[activeFilter.col]) === String(activeFilter.val)).length === 0 && (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No data matches filter.</div>
            )}
        </div>
      </div>

    </div>
  );
}
