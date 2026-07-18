import React, { useState, useEffect } from "react";
import { Sparkles, Terminal, RotateCcw, Check, ArrowRight, Activity, Plus, PlusCircle, AlertCircle, AlertTriangle, Copy, Settings, Edit3, Type, Scissors, TrendingUp, Shield, Calendar, Trash2, RefreshCw, XOctagon, GitCompare, Hash, BarChart2, ChevronDown, ChevronRight as ChevRight, Search, Eye, GitMerge, Upload } from "lucide-react";

export default function CleanPanel({ onNextStep, summary, setSummary }) {
  const [activeTab, setActiveTab] = useState("tasks");
  const [taskData, setTaskData] = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [expandedCat, setExpandedCat] = useState(null);
  const [selectedCol, setSelectedCol] = useState({});
  const [selectedTech, setSelectedTech] = useState({});
  const [applyingKey, setApplyingKey] = useState(null);
  const [customInputs, setCustomInputs] = useState({});
  const [uniqueVals, setUniqueVals] = useState(null);
  const [uniqueLoading, setUniqueLoading] = useState(false);

  // AI suggestions (preserved)
  const [suggestions, setSuggestions] = useState([]);
  const [sugLoading, setSugLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [applyingId, setApplyingId] = useState(null);

  // Preview Modal states
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Calculated field (preserved)
  const [calcColName, setCalcColName] = useState("");
  const [calcExpr, setCalcExpr] = useState("");
  const [calcError, setCalcError] = useState("");
  const [calcLoading, setCalcLoading] = useState(false);

  // History
  const [historyList, setHistoryList] = useState([]);
  const [codeSnippet, setCodeSnippet] = useState("");
  const [loading, setLoading] = useState(false);

  // Merge state
  const [secondaryDataset, setSecondaryDataset] = useState(null);
  const [secondaryCols, setSecondaryCols] = useState([]);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeError, setMergeError] = useState("");
  const [joinConfig, setJoinConfig] = useState({ join_type: "left", left_on: "", right_on: "" });
  const [dragActiveMerge, setDragActiveMerge] = useState(false);

  const ICON_MAP = { AlertTriangle, Copy, Settings, Edit3, Type, Scissors, TrendingUp, Shield, Calendar, Trash2, RefreshCw, XOctagon, GitCompare, Hash, BarChart2 };

  useEffect(() => { fetchTasks(); fetchHistoryAndCode(); }, [summary.history_count]);

  const fetchTasks = async () => {
    setTaskLoading(true);
    try {
      const r = await fetch("/api/clean/tasks");
      if (r.ok) setTaskData(await r.json());
    } catch (e) { console.error(e); }
    finally { setTaskLoading(false); }
  };

  const fetchSuggestions = async () => {
    setSugLoading(true);
    try {
      const r = await fetch("/api/clean/suggest");
      const d = await r.json();
      if (r.ok) { setSuggestions(d.suggestions); const defs = {}; d.suggestions.forEach(s => { defs[s.id] = s.options[0]; }); setSelectedOptions(defs); }
    } catch (e) { console.error(e); }
    finally { setSugLoading(false); }
  };

  const fetchHistoryAndCode = async () => {
    try { const r = await fetch("/api/export/script"); if (r.ok) setCodeSnippet(await r.text()); } catch (e) { console.error(e); }
  };

  const fetchUnique = async (col) => {
    setUniqueLoading(true); setUniqueVals(null);
    try { const r = await fetch(`/api/clean/unique/${encodeURIComponent(col)}`); if (r.ok) setUniqueVals(await r.json()); } catch (e) { console.error(e); }
    finally { setUniqueLoading(false); }
  };

  const previewAction = async (opId, column, method, isSuggestion, sugg = null) => {
    setPendingAction({ opId, column, method, isSuggestion, sugg });
    setPreviewLoading(true);
    try {
      const r = await fetch("/api/clean/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation_id: String(opId), column, method }) });
      if (r.ok) {
        setPreviewData(await r.json());
      } else {
        alert("Failed to generate preview.");
        setPendingAction(null);
      }
    } catch (e) {
      alert("Error communicating with server.");
      setPendingAction(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmAndApply = async () => {
    if (!pendingAction) return;
    const { opId, column, method, isSuggestion } = pendingAction;
    const key = `${opId}_${column}_${method}`;
    setApplyingKey(key);
    if(isSuggestion) setApplyingId(opId);
    
    try {
      const r = await fetch("/api/clean/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation_id: String(opId), column, method }) });
      const d = await r.json();
      if (r.ok) { 
        setSummary(d); 
        setHistoryList(p => [...p, `${column}: ${method}`]); 
      }
      else alert(d.detail || "Error applying transformation");
    } catch (e) { alert("Failed to communicate with cleaning service."); }
    finally { 
        setApplyingKey(null); 
        setApplyingId(null);
        setPendingAction(null);
        setPreviewData(null);
    }
  };

  const handleApplySuggestion = (sugg) => {
    const m = selectedOptions[sugg.id];
    previewAction(sugg.id, sugg.column, m, true, sugg);
  };

  const handleCalc = async (e) => {
    e.preventDefault(); setCalcError(""); if (!calcColName.trim() || !calcExpr.trim()) return;
    setCalcLoading(true);
    try {
      const r = await fetch("/api/clean/calculate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ column: calcColName.trim(), expression: calcExpr.trim() }) });
      const d = await r.json();
      if (r.ok) { setSummary(d); setHistoryList(p => [...p, `Calc '${calcColName}' = ${calcExpr}`]); setCalcColName(""); setCalcExpr(""); }
      else setCalcError(d.detail || "Invalid formula.");
    } catch (e) { setCalcError("Server error."); }
    finally { setCalcLoading(false); }
  };

  const handleUndo = async () => {
    setLoading(true);
    try { const r = await fetch("/api/clean/undo", { method: "POST" }); const d = await r.json(); if (r.ok) { setSummary(d); setHistoryList(p => p.slice(0, -1)); } }
    catch (e) { alert("Undo failed."); }
    finally { setLoading(false); }
  };

  const handleRevert = async (idx) => {
    setLoading(true);
    try { 
        const r = await fetch(`/api/clean/revert/${idx}`, { method: "POST" }); 
        const d = await r.json(); 
        if (r.ok) { 
            setSummary(d); 
            setHistoryList(p => p.slice(0, idx)); 
        } 
    }
    catch (e) { alert("Revert failed."); }
    finally { setLoading(false); }
  };

  const handleDragMerge = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActiveMerge(true);
    else if (e.type === "dragleave") setDragActiveMerge(false);
  };

  const handleDropMerge = async (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActiveMerge(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) await uploadSecondaryFile(e.dataTransfer.files[0]);
  };

  const uploadSecondaryFile = async (file) => {
    setMergeError(""); setMergeLoading(true);
    const formData = new FormData(); formData.append("file", file);
    try {
      const response = await fetch("/api/join/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (response.ok) {
        setSecondaryDataset(data);
        setSecondaryCols(data.columns);
      } else {
        setMergeError(data.detail || "Error loading secondary dataset.");
      }
    } catch (err) { setMergeError("Network error."); } 
    finally { setMergeLoading(false); }
  };

  const executeMerge = async () => {
    if (!joinConfig.left_on || !joinConfig.right_on) { setMergeError("Please select columns to join on."); return; }
    setMergeError(""); setMergeLoading(true);
    try {
      const response = await fetch("/api/join/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinConfig)
      });
      const data = await response.json();
      if (response.ok) {
        setSummary(data);
        setHistoryList(p => [...p, `Merged '${secondaryDataset.filename}' (${joinConfig.join_type} join) on ${joinConfig.left_on} = ${joinConfig.right_on}`]);
        setActiveTab("history"); // redirect to history
        setSecondaryDataset(null); // reset
        setJoinConfig({ join_type: "left", left_on: "", right_on: "" });
      } else {
        setMergeError(data.detail || "Error merging datasets.");
      }
    } catch (err) { setMergeError("Network error."); }
    finally { setMergeLoading(false); }
  };

  const handleApplyTask = (cat, tech) => {
    const col = selectedCol[cat.id] || "";
    if (!col && !cat.applicable_cols.includes("__all__")) return alert("Select a column first.");

    let method = tech.method;
    const inp = customInputs[`${cat.id}_${tech.label}`] || "";

    if (method === "__input__") { if (!inp.trim()) return alert(`Enter: ${tech.input_label}`); method = inp.trim(); }
    else if (method === "__range_input__") { if (!inp.includes(",")) return alert("Enter min,max"); method = `cap_range:${inp.trim()}`; }
    else if (method === "__range_remove__") { if (!inp.includes(",")) return alert("Enter min,max"); method = `remove_range:${inp.trim()}`; }
    else if (method === "__replace_input__") { if (!inp.includes(">>>")) return alert("Enter old_value>>>new_value"); method = inp.trim(); }
    else if (method === "__cross_input__") { if (!inp.trim()) return alert("Select the second column"); method = `${tech.operator}:${inp.trim()}`; }

    const opId = tech.id.endsWith("_") ? `${tech.id}${col}` : tech.id;
    previewAction(opId, col, method, false);
  };

  const inputStyle = { padding: "0.5rem 0.7rem", borderRadius: "6px", fontSize: "0.8rem", background: "var(--bg-dark)", border: "1px solid var(--border-color)", color: "var(--text-main)", outline: "none", width: "100%" };
  const catHeaderStyle = (isOpen) => ({ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.75rem 1rem", borderRadius: "10px", cursor: "pointer", transition: "all 0.2s", background: isOpen ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)", border: isOpen ? "1px solid rgba(139,92,246,0.3)" : "1px solid var(--border-color)" });

  const renderTaskCategories = () => {
    if (taskLoading || !taskData) return <div style={{ textAlign: "center", padding: "2rem" }}><div className="loader-spinner" /><p>Loading cleaning tasks...</p></div>;

    return taskData.categories.map(cat => {
      const isOpen = expandedCat === cat.id;
      const IconComp = ICON_MAP[cat.icon] || Settings;
      const col = selectedCol[cat.id] || "";
      const cols = cat.applicable_cols.includes("__all__") ? [] : cat.applicable_cols.length > 0 ? cat.applicable_cols : taskData.columns;

      return (
        <div key={cat.id} style={{ marginBottom: "0.5rem" }}>
          <div style={catHeaderStyle(isOpen)} onClick={() => setExpandedCat(isOpen ? null : cat.id)}>
            <IconComp size={18} style={{ color: "var(--primary-purple)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>{cat.title}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{cat.description}</div>
            </div>
            {cat.id === "missing_data" && taskData.null_cols.length > 0 && <span style={{ background: "rgba(244,63,94,0.15)", color: "var(--accent-rose)", padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 600 }}>{taskData.null_cols.length} cols</span>}
            {cat.id === "duplicates" && taskData.duplicate_count > 0 && <span style={{ background: "rgba(245,158,11,0.15)", color: "var(--accent-amber)", padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 600 }}>{taskData.duplicate_count} rows</span>}
            {isOpen ? <ChevronDown size={16} style={{ color: "var(--text-muted)" }} /> : <ChevRight size={16} style={{ color: "var(--text-muted)" }} />}
          </div>

          {isOpen && (
            <div style={{ padding: "1rem", marginTop: "0.25rem", background: "rgba(0,0,0,0.15)", borderRadius: "0 0 10px 10px", border: "1px solid var(--border-color)", borderTop: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {/* Column selector */}
              {cols.length > 0 && (
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Column:</label>
                  <select value={col} onChange={e => { setSelectedCol(p => ({ ...p, [cat.id]: e.target.value })); if (cat.id === "fix_inconsistent" && e.target.value) fetchUnique(e.target.value); }} style={{ ...inputStyle, maxWidth: "220px" }}>
                    <option value="">— Select —</option>
                    {cols.map(c => <option key={c} value={c}>{c} {taskData.null_info[c] ? `(${taskData.null_info[c]} nulls)` : ""}</option>)}
                  </select>
                  {col && (
                    <button onClick={() => fetchUnique(col)} style={{ background: "transparent", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "0.35rem 0.6rem", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Eye size={12} /> Unique Values
                    </button>
                  )}
                </div>
              )}

              {/* Unique values preview */}
              {uniqueVals && uniqueVals.column === col && (
                <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "0.6rem", maxHeight: "120px", overflowY: "auto" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-dark)", marginBottom: "0.3rem" }}>Unique: {uniqueVals.total_unique}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                    {uniqueVals.values.map((v, i) => <span key={i} style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "4px", padding: "0.15rem 0.4rem", fontSize: "0.7rem", color: "var(--text-main)" }}>{v.value} <span style={{ color: "var(--text-muted)" }}>({v.count})</span></span>)}
                  </div>
                </div>
              )}

              {/* Techniques */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {cat.techniques.map(tech => {
                  const techKey = `${cat.id}_${tech.label}`;
                  const needsInput = ["__input__", "__range_input__", "__range_remove__", "__replace_input__", "__cross_input__"].includes(tech.method);
                  const apKey = `${tech.id}${col}_${tech.method}`;
                  const isApplying = applyingKey === apKey;

                  return (
                    <div key={tech.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", padding: "0.4rem 0.6rem", borderRadius: "6px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-main)", flex: "0 0 auto", minWidth: "160px" }}>{tech.label}</span>
                      {needsInput && (
                        <input
                          type="text"
                          placeholder={tech.input_label || "Enter value..."}
                          value={customInputs[techKey] || ""}
                          onChange={e => setCustomInputs(p => ({ ...p, [techKey]: e.target.value }))}
                          style={{ ...inputStyle, flex: "1 1 120px", maxWidth: "200px" }}
                        />
                      )}
                      {tech.method === "__cross_input__" && (
                        <select value={customInputs[techKey] || ""} onChange={e => setCustomInputs(p => ({ ...p, [techKey]: e.target.value }))} style={{ ...inputStyle, flex: "1 1 120px", maxWidth: "180px" }}>
                          <option value="">— Column B —</option>
                          {taskData.columns.filter(c => c !== col).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      )}
                      <button
                        onClick={() => handleApplyTask(cat, tech)}
                        disabled={isApplying || (!col && !cat.applicable_cols.includes("__all__"))}
                        className="btn-primary"
                        style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", borderRadius: "6px", whiteSpace: "nowrap", opacity: (!col && !cat.applicable_cols.includes("__all__")) ? 0.4 : 1 }}
                      >
                        {isApplying ? "..." : "Apply"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", height: "100%" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", flexWrap: "wrap" }}>
        {[
          { key: "tasks", icon: <Sparkles size={14} />, label: "Cleaning Tasks", color: "var(--primary-purple)" },
          { key: "merge", icon: <GitMerge size={14} />, label: "Merge Data", color: "var(--secondary-cyan)" },
          { key: "ai", icon: <Search size={14} />, label: "AI Suggestions", color: "var(--accent-amber)" },
          { key: "history", icon: <Terminal size={14} />, label: "Pipeline History", color: "var(--accent-emerald)" }
        ].map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); if (t.key === "ai" && suggestions.length === 0) fetchSuggestions(); }}
            style={{ background: activeTab === t.key ? t.color : "transparent", color: activeTab === t.key ? "white" : "var(--text-muted)", border: activeTab === t.key ? `1px solid ${t.color}` : "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.9rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s", fontSize: "0.85rem" }}
          >{t.icon} {t.label}</button>
        ))}
      </div>

      {/* TASKS TAB */}
      {activeTab === "tasks" && (
        <div className="glass-card" style={{ display: "flex", flex: "1", flexDirection: "column", overflow: "hidden", margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={20} style={{ color: "var(--primary-purple)" }} />
                <h3 style={{ margin: 0 }}>Data Cleaning Toolkit</h3>
              </div>
              {summary?.quality_score !== undefined && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: summary.quality_score >= 90 ? "rgba(16,185,129,0.15)" : summary.quality_score >= 70 ? "rgba(245,158,11,0.15)" : "rgba(244,63,94,0.15)", border: summary.quality_score >= 90 ? "1px solid rgba(16,185,129,0.3)" : summary.quality_score >= 70 ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(244,63,94,0.3)", padding: "0.3rem 0.75rem", borderRadius: "20px", color: summary.quality_score >= 90 ? "var(--accent-emerald)" : summary.quality_score >= 70 ? "var(--accent-amber)" : "var(--accent-rose)", fontWeight: "bold", fontSize: "0.8rem" }}>
                  <Activity size={14} /> {summary.quality_score}/100
                </div>
              )}
            </div>
            <button className="btn-primary" onClick={onNextStep}>Next: Deeper Analysis <ArrowRight size={16} /></button>
          </div>

          {/* Calculated Field */}
          <div style={{ border: "1px dashed var(--secondary-cyan)", background: "rgba(6,182,212,0.03)", borderRadius: "10px", padding: "0.75rem 1rem", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--secondary-cyan)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}><PlusCircle size={16} /> Create Calculated Column</div>
            <form onSubmit={handleCalc} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <input type="text" placeholder="New col name..." value={calcColName} onChange={e => setCalcColName(e.target.value)} style={{ ...inputStyle, flex: "0 1 150px" }} disabled={calcLoading} required />
              <input type="text" placeholder="Formula (e.g. col1 * 100)..." value={calcExpr} onChange={e => setCalcExpr(e.target.value)} style={{ ...inputStyle, flex: "1 1 200px" }} disabled={calcLoading} required />
              <button type="submit" className="btn-primary" style={{ padding: "0.45rem 0.8rem", borderRadius: "6px", fontSize: "0.8rem" }} disabled={calcLoading || !calcColName || !calcExpr}><Plus size={14} /> Calc</button>
            </form>
            {calcError && <div style={{ color: "var(--accent-rose)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.4rem" }}><AlertCircle size={12} /> {calcError}</div>}
          </div>

          {/* Scrollable task list */}
          <div style={{ flex: 1, overflowY: "auto", paddingRight: "0.25rem" }}>
            {renderTaskCategories()}
          </div>
        </div>
      )}

      {/* MERGE TAB */}
      {activeTab === "merge" && (
        <div className="glass-card fade-in" style={{ display: "flex", flex: "1", flexDirection: "column", overflow: "hidden", margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <GitMerge size={20} style={{ color: "var(--secondary-cyan)" }} />
              <h3 style={{ margin: 0 }}>Merge Datasets (SQL Joins)</h3>
            </div>
            <button className="btn-primary" onClick={onNextStep}>Next <ArrowRight size={16} /></button>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem", paddingRight: "0.5rem" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
              Join a secondary dataset to your primary active dataset ({summary?.row_count} rows).
            </p>
            
            {!secondaryDataset ? (
              <div
                className={`upload-zone ${dragActiveMerge ? "dragover" : ""}`}
                onDragEnter={handleDragMerge}
                onDragOver={handleDragMerge}
                onDragLeave={handleDragMerge}
                onDrop={handleDropMerge}
                onClick={() => document.getElementById("merge-file-input").click()}
                style={{ minHeight: "250px", display: "flex", flexDirection: "column", justifyContent: "center", cursor: "pointer", border: "2px dashed var(--border-color)", borderRadius: "10px", padding: "2rem", textAlign: "center", background: dragActiveMerge ? "rgba(139, 92, 246, 0.05)" : "transparent" }}
              >
                <input id="merge-file-input" type="file" style={{ display: "none" }} accept=".csv, .xlsx, .xls, .json, .parquet" onChange={(e) => { if (e.target.files[0]) uploadSecondaryFile(e.target.files[0]); }} disabled={mergeLoading} />
                <div className="upload-icon" style={{ margin: "0 auto 1rem auto", width: "60px", height: "60px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {mergeLoading ? <div className="loader-spinner" style={{ width: "30px", height: "30px", margin: 0 }} /> : <Upload size={28} style={{ color: "var(--text-muted)" }} />}
                </div>
                {mergeLoading ? <div><h3 style={{ color: "var(--text-main)" }}>Parsing Secondary Data...</h3></div> : <div><h3 style={{ color: "var(--text-main)", marginBottom: "0.5rem" }}>Upload Secondary Dataset to Join</h3><p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Drag & drop or click to browse</p></div>}
                {mergeError && <div style={{ color: "var(--accent-rose)", marginTop: "1rem", fontSize: "0.9rem" }}>{mergeError}</div>}
              </div>
            ) : (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.2)", padding: "1.25rem 1.5rem", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h4 style={{ margin: "0 0 0.4rem 0", color: "var(--text-main)", fontSize: "1.1rem" }}>{secondaryDataset.filename}</h4>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{secondaryDataset.row_count.toLocaleString()} rows • {secondaryCols.length} columns</span>
                  </div>
                  <button onClick={() => setSecondaryDataset(null)} className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>Change File</button>
                </div>
                
                <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--border-color)", padding: "1.75rem", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <h4 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1.1rem" }}>Configure Join</h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Primary Key (Left)</label>
                      <select value={joinConfig.left_on} onChange={e => setJoinConfig({...joinConfig, left_on: e.target.value})} style={{ padding: "0.75rem", borderRadius: "8px", background: "var(--bg-dark)", border: "1px solid var(--border-color)", color: "var(--text-main)", fontSize: "0.9rem" }}>
                        <option value="">— Select Column —</option>
                        {Object.keys(summary?.columns || {}).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Join Type</label>
                      <select value={joinConfig.join_type} onChange={e => setJoinConfig({...joinConfig, join_type: e.target.value})} style={{ padding: "0.75rem", borderRadius: "8px", background: "var(--bg-dark)", border: "1px solid var(--border-color)", color: "var(--text-main)", fontSize: "0.9rem" }}>
                        <option value="left">Left Join (Keep all primary rows)</option>
                        <option value="inner">Inner Join (Intersection only)</option>
                        <option value="right">Right Join (Keep all secondary rows)</option>
                        <option value="outer">Outer Join (Keep everything)</option>
                      </select>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Secondary Key (Right)</label>
                      <select value={joinConfig.right_on} onChange={e => setJoinConfig({...joinConfig, right_on: e.target.value})} style={{ padding: "0.75rem", borderRadius: "8px", background: "var(--bg-dark)", border: "1px solid var(--border-color)", color: "var(--text-main)", fontSize: "0.9rem" }}>
                        <option value="">— Select Column —</option>
                        {secondaryCols.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  {mergeError && <div style={{ color: "var(--accent-rose)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", background: "rgba(244, 63, 94, 0.1)", borderRadius: "8px" }}><AlertCircle size={16} /> {mergeError}</div>}
                  
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                    <button onClick={executeMerge} disabled={mergeLoading || !joinConfig.left_on || !joinConfig.right_on} className="btn-primary" style={{ padding: "0.75rem 1.75rem", background: "linear-gradient(135deg, var(--secondary-cyan), #0891b2)", border: "none", fontSize: "0.95rem" }}>
                      {mergeLoading ? "Merging..." : "Execute Merge"} <GitMerge size={18} style={{ marginLeft: "0.5rem" }} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI SUGGESTIONS TAB */}
      {activeTab === "ai" && (
        <div className="glass-card" style={{ display: "flex", flex: "1", flexDirection: "column", overflow: "hidden", margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Search size={20} style={{ color: "var(--accent-amber)" }} />
              <h3 style={{ margin: 0 }}>AI-Powered Recommendations</h3>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={fetchSuggestions} className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
                <RefreshCw size={12} /> Rescan
              </button>
              <button className="btn-primary" onClick={onNextStep}>Next <ArrowRight size={16} /></button>
            </div>
          </div>
          <div className="suggest-list" style={{ flex: 1, overflowY: "auto" }}>
            {sugLoading && suggestions.length === 0 ? (
              <div style={{ textAlign: "center", margin: "auto" }}><div className="loader-spinner" /><p>AI is analyzing your dataset...</p></div>
            ) : suggestions.length === 0 ? (
              <div style={{ textAlign: "center", margin: "auto", padding: "2rem", color: "var(--text-muted)" }}>
                <Check size={36} style={{ color: "var(--accent-emerald)", marginBottom: "1rem" }} />
                <h4>Dataset looks clean!</h4>
                <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>No critical issues found by AI analysis.</p>
              </div>
            ) : suggestions.map(sugg => (
              <div key={sugg.id} className="suggest-card">
                <div className="suggest-card-header"><span className="suggest-col-name">{sugg.column}</span><span className="suggest-issue-tag">{sugg.issue}</span></div>
                <p className="suggest-desc">{sugg.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div className="cleaning-choice-grid">
                    {sugg.options.map(opt => (
                      <button key={opt} className={`btn-choice ${selectedOptions[sugg.id] === opt ? "selected" : ""}`} onClick={() => setSelectedOptions(p => ({ ...p, [sugg.id]: opt }))}>{opt}</button>
                    ))}
                  </div>
                  <button onClick={() => handleApplySuggestion(sugg)} className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", background: "linear-gradient(135deg, var(--secondary-cyan), #0891b2)", boxShadow: "0 4px 15px var(--secondary-cyan-glow)", border: "none" }} disabled={applyingId === sugg.id}>
                    {applyingId === sugg.id ? "Applying..." : "Apply"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", margin: 0, background: "linear-gradient(to bottom, rgba(139,92,246,0.03), transparent)" }}>
          <div className="audit-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Terminal size={18} style={{ color: "var(--secondary-cyan)" }} />
                <h3 style={{ margin: 0 }}>Pipeline History</h3>
              </div>
              <button onClick={handleUndo} className="btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }} disabled={summary.history_count === 0 || loading}>
                <RotateCcw size={12} /> Undo
              </button>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", width: "100%", paddingRight: "0.5rem" }}>
              <div className="audit-timeline">
                {summary.history_count === 0 ? (
                  <div style={{ color: "var(--text-dark)", fontSize: "0.85rem", fontStyle: "italic", textAlign: "center", marginTop: "2rem" }}>No transformations applied yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {historyList.map((step, idx) => (
                      <div key={idx} className="timeline-step" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div className="timeline-desc" style={{ color: "var(--text-main)", fontWeight: 500 }}>{step}</div>
                        <button onClick={() => handleRevert(idx)} className="btn-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", background: "rgba(244,63,94,0.1)", color: "var(--accent-rose)", border: "1px solid rgba(244,63,94,0.3)" }}>
                          Revert
                        </button>
                      </div>
                    ))}
                    <div className="timeline-step" style={{ borderLeft: "2px dashed rgba(139,92,246,0.3)" }}><div className="timeline-desc" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Next actions waiting...</div></div>
                  </div>
                )}
              </div>
              <div style={{ marginTop: "auto" }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-dark)", letterSpacing: "0.05em", fontWeight: "bold", display: "block", marginBottom: "0.4rem" }}>Autogenerated Python Code (Pandas)</span>
                <pre className="code-preview-block" style={{ margin: 0, maxHeight: "180px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)" }}>
                  <code>{codeSnippet ? codeSnippet.split("# --- Applying Recorded Cleaning Operations ---")[1] || "# No operations recorded yet." : "# Load dataset first."}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {(previewLoading || previewData) && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glass-card fade-in" style={{ width: "90%", maxWidth: "800px", padding: "2rem", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 style={{ margin: 0, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Eye size={20} style={{ color: "var(--secondary-cyan)" }} /> Preview Changes
            </h2>
            
            {previewLoading ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <div className="loader-spinner" style={{ margin: "0 auto 1rem auto" }} />
                <p style={{ color: "var(--text-muted)" }}>Simulating operation...</p>
              </div>
            ) : previewData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", gap: "1.5rem" }}>
                  <div style={{ flex: 1, padding: "1.5rem", background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: "10px" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Before</div>
                    <div style={{ fontSize: "1.5rem", color: "var(--text-main)", fontWeight: "bold" }}>{previewData.before_rows.toLocaleString()} <span style={{ fontSize: "0.9rem", fontWeight: "normal", color: "var(--text-muted)" }}>rows</span></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}><ArrowRight size={24} style={{ color: "var(--text-muted)" }} /></div>
                  <div style={{ flex: 1, padding: "1.5rem", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "10px" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>After</div>
                    <div style={{ fontSize: "1.5rem", color: previewData.after_rows < previewData.before_rows ? "var(--accent-rose)" : "var(--accent-emerald)", fontWeight: "bold" }}>{previewData.after_rows.toLocaleString()} <span style={{ fontSize: "0.9rem", fontWeight: "normal", color: "var(--text-muted)" }}>rows</span></div>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--text-dark)" }}>Resulting Data Sample</h4>
                  <div style={{ overflowX: "auto", background: "rgba(0,0,0,0.3)", borderRadius: "8px", border: "1px solid var(--border-color)", padding: "1rem" }}>
                    <table className="pivot-table" style={{ width: "100%", textAlign: "left", fontSize: "0.8rem" }}>
                      <thead>
                        <tr>
                          {Object.keys(previewData.sample_data[0] || {}).slice(0, 8).map(k => <th key={k} style={{ padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--primary-purple)" }}>{k}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.sample_data.slice(0, 5).map((row, rIdx) => (
                          <tr key={rIdx}>
                            {Object.keys(row).slice(0, 8).map(k => <td key={k} style={{ padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "var(--text-main)" }}>{row[k]}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                  <button onClick={() => { setPendingAction(null); setPreviewData(null); }} className="btn-secondary">Cancel</button>
                  <button onClick={confirmAndApply} className="btn-primary" style={{ background: "linear-gradient(135deg, var(--accent-emerald), #059669)" }}>Confirm & Apply <Check size={16} /></button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
