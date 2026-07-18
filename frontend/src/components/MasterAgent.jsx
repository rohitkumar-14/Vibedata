import React, { useState } from "react";
import { Terminal, Cpu, Play, CheckCircle2, ChevronDown, ChevronRight, Loader } from "lucide-react";

export default function MasterAgent({ summary }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [executionLog, setExecutionLog] = useState([]);

  const handleOrchestrate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setPlan(null);
    setExecutionLog([]);

    // Simulate Agentic Orchestration for MVP
    setTimeout(() => {
        setPlan([
            { step: 1, agent: "Data Engineer", task: "Parse prompt and identify required tables", status: "completed" },
            { step: 2, agent: "SQL Specialist", task: "Generate custom aggregations for sales metrics", status: "completed" },
            { step: 3, agent: "ML Engineer", task: "Run anomaly detection on recent dates", status: "completed" },
            { step: 4, agent: "Visualization Analyst", task: "Compile findings into React Dashboard config", status: "completed" }
        ]);
        
        setExecutionLog([
            "[System] LangGraph Orchestrator Initialized.",
            `[User Intent] ${prompt}`,
            "[Master] Routing task to Data Engineer Agent...",
            "[Data Engineer] Schema analyzed. Identified relevant columns.",
            "[Master] Handoff to SQL Agent...",
            "[SQL Agent] Executed SELECT * FROM data GROUP BY region.",
            "[Master] Handoff to ML Agent...",
            "[ML Agent] Trained Random Forest. Identified key variance drivers.",
            "[Master] Final compilation via Reporting Agent...",
            "[System] Task completed successfully."
        ]);
        setLoading(false);
    }, 2500);
  };

  return (
    <div className="fade-in glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
        <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Cpu size={20} style={{ color: "var(--accent-emerald)" }} /> Autonomous Master Agent
        </h3>
        <span style={{ fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.1)", color: "var(--accent-emerald)", padding: "0.25rem 0.5rem", borderRadius: "4px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>LangGraph Orchestrator Active</span>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: 0 }}>
        Bypass manual pipeline steps. Instruct the Master Agent in natural language, and it will autonomously delegate tasks to the SQL, ML, and Dashboard sub-agents.
      </p>

      <div style={{ display: "flex", gap: "2rem" }}>
          <div style={{ flex: "1 1 50%" }}>
              <form onSubmit={handleOrchestrate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ position: "relative" }}>
                      <Terminal size={18} style={{ position: "absolute", left: "1rem", top: "1rem", color: "var(--text-muted)" }} />
                      <textarea 
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="e.g. 'Clean the dataset by dropping nulls, then build a model predicting sales, and generate a final PDF report of the findings.'"
                          style={{ width: "100%", height: "120px", padding: "1rem 1rem 1rem 3rem", background: "var(--bg-card-hover)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-dark)", fontSize: "0.95rem", resize: "none" }}
                          disabled={loading}
                      />
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading || !prompt.trim()} style={{ padding: "1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", background: "linear-gradient(135deg, #059669, #047857)" }}>
                      {loading ? <span className="loader-spinner" style={{width: "20px", height: "20px"}}></span> : <><Play size={16} /> Execute Autonomous Workflow</>}
                  </button>
              </form>

              {plan && (
                  <div className="fade-in" style={{ marginTop: "2rem" }}>
                      <h4 style={{ color: "var(--text-dark)", marginBottom: "1rem", fontSize: "0.95rem" }}>Agentic Execution Plan</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {plan.map((p, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", background: "var(--bg-card)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                                  <CheckCircle2 size={18} style={{ color: "var(--accent-emerald)" }} />
                                  <div>
                                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{p.agent}</div>
                                      <div style={{ fontSize: "0.9rem", color: "var(--text-dark)" }}>{p.task}</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>

          <div style={{ flex: "1 1 50%" }}>
              <div style={{ background: "#0f172a", border: "1px solid var(--border-color)", borderRadius: "8px", height: "100%", minHeight: "400px", padding: "1.5rem", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                      <Terminal size={14} /> Orchestrator Output Log
                  </div>
                  
                  <div style={{ flex: 1, fontFamily: "monospace", fontSize: "0.85rem", color: "#a5b4fc", display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto" }}>
                      {!loading && executionLog.length === 0 && (
                          <div style={{ color: "#475569" }}>&gt; Ready. Awaiting instructions...</div>
                      )}
                      
                      {loading && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-emerald)" }}>
                              <Loader size={14} className="spin" /> Computing agentic workflow...
                          </div>
                      )}

                      {executionLog.map((log, i) => (
                          <div key={i} className="fade-in" style={{ color: log.includes("Error") ? "#ef4444" : log.includes("System") ? "#94a3b8" : "#a5b4fc" }}>
                              &gt; {log}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
