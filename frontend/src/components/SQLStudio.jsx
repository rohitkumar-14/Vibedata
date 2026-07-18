import React, { useState, useEffect } from "react";
import { Terminal, Play, MessageSquare, ChevronRight, Database, AlertTriangle, CheckCircle2, History, Sparkles, Code2 } from "lucide-react";
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-tomorrow.css';

export default function SQLStudio({ onNextStep, summary }) {
  const [nlQuery, setNlQuery] = useState("");
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM active_data LIMIT 10;");
  const [results, setResults] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingSQL, setLoadingSQL] = useState(false);
  const [error, setError] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [fixingError, setFixingError] = useState(false);
  const [querySuggestions, setQuerySuggestions] = useState([]);
  const [inlineSuggestions, setInlineSuggestions] = useState([]);

  const [activeSidebarTab, setActiveSidebarTab] = useState("schema");
  const [queryHistory, setQueryHistory] = useState([]);

  // Hardcode the dimension schemas we injected in the backend for UI rendering
  const dimensionSchemas = {
    dim_customers: [
      { name: "customer_id", type: "text" },
      { name: "region", type: "text" },
      { name: "tier", type: "text" }
    ],
    dim_products: [
      { name: "product_sku", type: "text" },
      { name: "category", type: "text" },
      { name: "unit_cost", type: "numeric" }
    ]
  };

  const handleGenerateSQL = async (e) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;
    
    setLoadingAI(true);
    setError("");
    
    try {
      const response = await fetch("/api/sql/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: nlQuery,
          schema_metadata: summary.columns || {}
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSqlQuery(data.sql);
      } else {
        setError(data.detail || "Failed to generate SQL.");
      }
    } catch (err) {
      setError("Network error communicating with AI service.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleExecuteSQL = async () => {
    if (!sqlQuery.trim()) return;
    
    setLoadingSQL(true);
    setError("");
    setAiExplanation("");
    setResults(null);
    
    try {
      const response = await fetch("/api/sql/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sqlQuery })
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setResults(data);
        // Add to history
        if (!queryHistory.includes(sqlQuery)) {
          setQueryHistory(prev => [sqlQuery, ...prev].slice(0, 20)); // keep last 20
        }
      } else {
        setError(data.message || data.detail || "Query execution failed.");
      }
    } catch (err) {
      setError("Network error executing SQL query.");
    } finally {
      setLoadingSQL(false);
    }
  };

  const handleFixSQL = async () => {
    if (!error || !sqlQuery) return;
    
    setFixingError(true);
    try {
      const response = await fetch("/api/sql/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broken_query: sqlQuery,
          error_message: error,
          schema_metadata: summary.columns || {}
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSqlQuery(data.sql);
        setAiExplanation(data.explanation || "Query fixed automatically.");
        setError(""); // Clear error so they can try again
      } else {
        setError("AI failed to fix the query: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      setError("Network error communicating with AI service.");
    } finally {
      setFixingError(false);
    }
  };

  // Run the default limit 10 query when the component mounts and generate suggestions
  useEffect(() => {
    if (summary) {
      handleExecuteSQL();
      
      if (summary.columns) {
        const cols = Object.keys(summary.columns);
        const numCols = cols.filter(c => summary.columns[c].stats?.mean !== undefined);
        const catCols = cols.filter(c => summary.columns[c].stats?.mean === undefined);
        
        const suggs = [];
        if (numCols.length > 0) {
          suggs.push(`Show the top 10 rows ordered by ${numCols[0]} descending`);
        }
        if (catCols.length > 0 && numCols.length > 0) {
          suggs.push(`Group by ${catCols[0]} and show the average ${numCols[0]}`);
        }
        if (cols.length >= 2) {
          suggs.push(`Show ${cols[0]} and ${cols[1]} where ${numCols.length > 0 ? numCols[0] + ' is greater than 0' : cols[0] + ' is not empty'}`);
        }
        setQuerySuggestions(suggs.slice(0, 3));
      }
    }
  }, []);

  // Compute inline IntelliSense suggestions as the user types
  useEffect(() => {
    const tokens = sqlQuery.split(/([\s,()=><]+)/);
    const lastWord = tokens[tokens.length - 1];
    
    if (lastWord && lastWord.trim().length >= 1) {
      const cols = summary?.columns ? Object.keys(summary.columns) : [];
      const allNames = ["SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "LIMIT", "JOIN", "ON", "AS", "active_data", "dim_customers", "dim_products", ...cols, "customer_id", "region", "tier", "product_sku", "category", "unit_cost"];
      
      const matches = allNames.filter(n => n.toLowerCase().startsWith(lastWord.toLowerCase()) && n.toLowerCase() !== lastWord.toLowerCase());
      setInlineSuggestions([...new Set(matches)].slice(0, 5));
    } else {
      setInlineSuggestions([]);
    }
  }, [sqlQuery, summary]);

  const handleKeyDown = (e) => {
    // Tab completion or indent
    if (e.key === 'Tab') {
      e.preventDefault();
      if (inlineSuggestions.length > 0) {
        const tokens = sqlQuery.split(/([\s,()=><]+)/);
        tokens[tokens.length - 1] = inlineSuggestions[0];
        setSqlQuery(tokens.join(""));
        return;
      }

      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      setSqlQuery(sqlQuery.substring(0, start) + "  " + sqlQuery.substring(end));
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Terminal size={22} style={{ color: "var(--primary-purple)" }} /> AI Assisted SQL Studio
          </h3>
          <button className="btn-primary" onClick={onNextStep}>
            Next: EDA <ChevronRight size={16} />
          </button>
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: 0 }}>
          Explore your dataset (table: <code>active_data</code>) by asking the AI to write SQL queries. You can also join with mock dimensions like <code>dim_customers</code>.
        </p>

        <div style={{ display: "flex", gap: "1.5rem" }}>
          
          {/* Main Studio Area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* NL to SQL Box */}
            <div style={{ background: "rgba(139, 92, 246, 0.05)", border: "1px solid rgba(139, 92, 246, 0.2)", borderRadius: "10px", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "var(--primary-purple)" }}>
                <MessageSquare size={16} /> <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Ask AI for SQL</span>
              </div>
              <form onSubmit={handleGenerateSQL} style={{ display: "flex", gap: "1rem" }}>
                <input
                  type="text"
                  placeholder="e.g., Join active_data with dim_customers and show revenue by region..."
                  value={nlQuery}
                  onChange={(e) => setNlQuery(e.target.value)}
                  style={{ flex: 1, padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)", fontSize: "0.9rem" }}
                  disabled={loadingAI}
                />
                <button type="submit" className="btn-primary" disabled={loadingAI || !nlQuery.trim()} style={{ whiteSpace: "nowrap" }}>
                  {loadingAI ? "Generating..." : "Generate SQL"}
                </button>
              </form>
              
              {/* Dynamic Suggestions */}
              {querySuggestions.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>Suggestions:</span>
                  {querySuggestions.map((sugg, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setNlQuery(sugg)}
                      style={{ 
                        background: "var(--bg-card)", border: "1px solid var(--border-color)", 
                        color: "var(--text-dark)", borderRadius: "12px", padding: "0.25rem 0.75rem", 
                        fontSize: "0.8rem", cursor: "pointer", transition: "var(--transition-smooth)" 
                      }}
                      onMouseEnter={(e) => e.target.style.borderColor = "var(--primary-purple)"}
                      onMouseLeave={(e) => e.target.style.borderColor = "var(--border-color)"}
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SQL Editor */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Code2 size={16} /> SQL Editor
                </label>
                <button className="btn-secondary" onClick={handleExecuteSQL} disabled={loadingSQL || !sqlQuery.trim()} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 1rem" }}>
                  <Play size={14} /> {loadingSQL ? "Running..." : "Execute Query"}
                </button>
              </div>
              
              {/* AI Explanation Banner */}
              {aiExplanation && (
                  <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px", padding: "1rem", color: "var(--accent-emerald)", display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                      <Sparkles size={18} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                      <div>
                          <strong style={{ display: "block", marginBottom: "0.25rem" }}>AI Fix Applied</strong>
                          <span style={{ color: "var(--text-dark)", lineHeight: "1.4" }}>{aiExplanation}</span>
                      </div>
                  </div>
              )}

              <div style={{ border: "1px solid var(--primary-purple)", borderRadius: inlineSuggestions.length > 0 ? "8px 8px 0 0" : "8px", background: "rgba(15, 23, 42, 0.8)", overflow: "hidden", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.2)" }}>
                <Editor
                  value={sqlQuery}
                  onValueChange={code => setSqlQuery(code)}
                  highlight={code => Prism.highlight(code, Prism.languages.sql, 'sql')}
                  padding={15}
                  style={{
                    fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
                    fontSize: "0.9rem",
                    minHeight: "150px",
                    color: "#e2e8f0"
                  }}
                />
              </div>
              
              {/* IntelliSense Ribbon */}
              {inlineSuggestions.length > 0 && (
                  <div style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 1rem", background: "var(--bg-card)", border: "1px solid var(--primary-purple)", borderTop: "none", borderBottomLeftRadius: "8px", borderBottomRightRadius: "8px", marginTop: "-0.5rem", zIndex: 5, position: "relative", alignItems: "center", overflowX: "auto", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", marginRight: "0.5rem" }}>Autosuggest (Tab to complete):</span>
                      {inlineSuggestions.map((sugg, idx) => (
                          <span key={idx} style={{ fontSize: "0.75rem", background: idx === 0 ? "rgba(139, 92, 246, 0.2)" : "rgba(255,255,255,0.05)", color: idx === 0 ? "var(--primary-purple)" : "var(--text-muted)", padding: "0.2rem 0.5rem", borderRadius: "10px", border: idx === 0 ? "1px solid var(--primary-purple)" : "1px solid transparent", cursor: "pointer", transition: "all 0.2s" }} onClick={() => {
                              const tokens = sqlQuery.split(/([\s,()=><]+)/);
                              tokens[tokens.length - 1] = sugg;
                              setSqlQuery(tokens.join(""));
                          }}>
                              {sugg}
                          </span>
                      ))}
                  </div>
              )}
            </div>

            {/* Error Display with AI Fix */}
            {error && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(244, 63, 94, 0.05)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-rose)" }}>
                  <AlertTriangle size={18} /> <span style={{ fontSize: "0.9rem", fontFamily: "monospace" }}>{error}</span>
                </div>
                <button 
                  onClick={handleFixSQL} 
                  disabled={fixingError}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "var(--text-dark)", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
                >
                  <Sparkles size={14} /> {fixingError ? "Fixing..." : "Auto-Fix with AI"}
                </button>
              </div>
            )}

            {/* Results Grid */}
            {results && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Query Results</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--accent-emerald)", display: "flex", alignItems: "center", gap: "0.25rem", background: "rgba(16, 185, 129, 0.1)", padding: "0.25rem 0.75rem", borderRadius: "12px" }}>
                    <CheckCircle2 size={12} /> Success ({results.row_count} rows)
                  </span>
                </div>
                
                <div style={{ width: "100%", overflowX: "auto", background: "var(--bg-card-hover)", border: "1px solid var(--border-color)", borderRadius: "8px", maxHeight: "350px", overflowY: "auto" }}>
                  {results.preview.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      Query returned 0 rows.
                    </div>
                  ) : (
                    <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse", whiteSpace: "nowrap" }}>
                      <thead>
                        <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, zIndex: 10 }}>
                          {results.columns.map((col, idx) => (
                            <th key={idx} style={{ padding: "0.75rem 1rem", textAlign: "left", color: "var(--text-dark)", fontWeight: 600, borderRight: "1px solid var(--border-color)" }}>
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.preview.map((row, rIdx) => (
                          <tr key={rIdx} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                            {results.columns.map((col, cIdx) => (
                              <td key={cIdx} style={{ padding: "0.5rem 1rem", color: row[col.name] === null ? "var(--text-dark)" : "var(--text-muted)", fontStyle: row[col.name] === null ? "italic" : "normal", borderRight: "1px solid rgba(255,255,255,0.02)" }}>
                                {row[col.name] === null ? "null" : String(row[col.name])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar (Schema / History) */}
          <div style={{ flex: "0 0 260px", display: "flex", flexDirection: "column", borderLeft: "1px solid var(--border-color)" }}>
            
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)" }}>
              <button 
                onClick={() => setActiveSidebarTab("schema")}
                style={{ flex: 1, padding: "0.75rem", background: "transparent", border: "none", borderBottom: activeSidebarTab === "schema" ? "2px solid var(--primary-purple)" : "2px solid transparent", color: activeSidebarTab === "schema" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", fontSize: "0.85rem" }}
              >
                <Database size={14} /> Schema
              </button>
              <button 
                onClick={() => setActiveSidebarTab("history")}
                style={{ flex: 1, padding: "0.75rem", background: "transparent", border: "none", borderBottom: activeSidebarTab === "history" ? "2px solid var(--primary-purple)" : "2px solid transparent", color: activeSidebarTab === "history" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", fontSize: "0.85rem" }}
              >
                <History size={14} /> History
              </button>
            </div>

            {activeSidebarTab === "schema" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem 0 0 1.5rem", overflowY: "auto", maxHeight: "600px" }}>
                
                {/* Active Data */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--secondary-cyan)", marginBottom: "0.5rem" }}>
                    <Database size={14} /> <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>active_data</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", paddingLeft: "1rem", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                    {summary && summary.columns && Object.values(summary.columns).map((col) => {
                      const isNum = col.stats?.mean !== undefined;
                      return (
                        <div key={col.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.25rem 0" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }} title={col.name}>{col.name}</span>
                          <span style={{ fontSize: "0.55rem", color: isNum ? "#22c55e" : "#3b82f6" }}>{isNum ? "NUM" : "STR"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dim Customers */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-dark)", marginBottom: "0.5rem" }}>
                    <Database size={14} /> <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>dim_customers</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", paddingLeft: "1rem", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                    {dimensionSchemas.dim_customers.map(col => (
                      <div key={col.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.25rem 0" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{col.name}</span>
                        <span style={{ fontSize: "0.55rem", color: col.type === 'numeric' ? "#22c55e" : "#3b82f6" }}>{col.type === 'numeric' ? "NUM" : "STR"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dim Products */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-dark)", marginBottom: "0.5rem" }}>
                    <Database size={14} /> <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>dim_products</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", paddingLeft: "1rem", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                    {dimensionSchemas.dim_products.map(col => (
                      <div key={col.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.25rem 0" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{col.name}</span>
                        <span style={{ fontSize: "0.55rem", color: col.type === 'numeric' ? "#22c55e" : "#3b82f6" }}>{col.type === 'numeric' ? "NUM" : "STR"}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {activeSidebarTab === "history" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1.5rem 0 0 1.5rem", overflowY: "auto", maxHeight: "600px" }}>
                {queryHistory.length === 0 ? (
                  <p style={{ color: "var(--text-dark)", fontSize: "0.85rem", fontStyle: "italic" }}>No queries executed yet.</p>
                ) : (
                  queryHistory.map((q, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSqlQuery(q)}
                      style={{ 
                        background: "var(--bg-card)", 
                        border: "1px solid var(--border-color)", 
                        borderRadius: "6px", 
                        padding: "0.75rem", 
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary-purple)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                    >
                      <pre style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                        {q.length > 80 ? q.substring(0, 80) + "..." : q}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
