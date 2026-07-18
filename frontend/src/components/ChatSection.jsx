import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, FileText, ChevronRight, Sparkles, User, Bot, LayoutTemplate, CheckCircle2, Database } from "lucide-react";

const SUGGESTIONS = [
  "I want to analyze customer churn trends",
  "Help me define KPIs for our sales pipeline",
  "Suggest a marketing experiment problem statement",
  "Draft analytics plan for user retention"
];

export default function ChatSection({ onNextStep, messages, setMessages, report, setReport }) {
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("brief");
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendChatMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages,
          newMessage: text,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => [...prev, { role: "model", content: data.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "model", content: `Error: ${data.detail || "Unable to reach server."}` },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Error: Failed to connect to server. Ensure backend is running." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const text = inputMsg;
    setInputMsg("");
    await sendChatMessage(text);
  };

  const handleGenerateReport = async () => {
    if (messages.length === 0) return;
    setReportLoading(true);
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await response.json();
      if (response.ok) {
        setReport(data.report);
      } else {
        alert(data.detail || "Failed to generate report");
      }
    } catch (err) {
      alert("Error contacting API to compile report.");
    } finally {
      setReportLoading(false);
    }
  };

  // Basic custom markdown-to-html renderer (since we avoid external dependencies)
  const renderMarkdown = (text) => {
    if (!text) return <p style={{color: "var(--text-muted)", textAlign: "center", padding: "2rem"}}>No content available for this section.</p>;
    
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("# ")) return <h1 key={idx} style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>{line.substring(2)}</h1>;
      if (line.startsWith("## ")) return <h2 key={idx} style={{ marginTop: "1.5rem", marginBottom: "0.75rem", color: "var(--primary-purple)" }}>{line.substring(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={idx} style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>{line.substring(4)}</h3>;
      
      if (line.startsWith("|") && idx > 0) {
        const cells = line.split("|").map(c => c.trim()).filter(c => c !== "");
        if (line.includes("---")) return null;
        const isHeader = idx === 0 || (idx > 1 && text.split("\n")[idx-1].includes("---"));
        return (
          <table key={idx} className="pivot-table" style={{ margin: "1rem 0" }}>
            <tbody>
              <tr>
                {cells.map((cell, cidx) => (
                  <td key={cidx} style={{ fontWeight: isHeader ? "600" : "400", background: isHeader ? "rgba(255,255,255,0.05)" : "transparent" }}>{cell}</td>
                ))}
              </tr>
            </tbody>
          </table>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return <li key={idx} style={{ marginLeft: "1.5rem", marginBottom: "0.5rem", color: "var(--text-main)" }}>{line.substring(2)}</li>;
      }
      if (/^\d+\.\s/.test(line)) {
        return <li key={idx} style={{ marginLeft: "1.5rem", listStyleType: "decimal", marginBottom: "0.5rem", color: "var(--text-main)" }}>{line.replace(/^\d+\.\s/, "")}</li>;
      }
      if (!line.trim()) {
        return <div key={idx} style={{ height: "1rem" }} />;
      }
      return <p key={idx} style={{ marginBottom: "0.75rem", lineHeight: "1.7", color: "var(--text-main)" }}>{line}</p>;
    });
  };

  return (
    <div className="report-panel fade-in">
      {/* Chat Column */}
      <div className="glass-card chat-container" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 10rem)", margin: 0, padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ background: "rgba(139, 92, 246, 0.15)", padding: "0.5rem", borderRadius: "10px", display: "flex" }}>
              <MessageSquare size={20} style={{ color: "var(--primary-purple)" }} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Scoping Discussion</h3>
          </div>
          <span style={{ fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.1)", color: "var(--accent-emerald)", padding: "0.3rem 0.8rem", borderRadius: "20px", fontWeight: "600", letterSpacing: "0.05em" }}>
            AI PARTNER ACTIVE
          </span>
        </div>

        <div className="chat-messages" style={{ flex: 1, overflowY: "auto", paddingRight: "0.5rem" }}>
          {messages.length === 0 && (
            <div className="fade-in" style={{ textAlign: "center", margin: "2rem auto", padding: "2rem", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "16px", maxWidth: "90%" }}>
              <div style={{ width: "60px", height: "60px", background: "rgba(139, 92, 246, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto" }}>
                <Sparkles size={28} style={{ color: "var(--primary-purple)" }} />
              </div>
              <h4 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Define your business problem</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: "1.5" }}>
                What are we analyzing today? The AI will partner with you to refine goals, metrics, and scope.
              </p>
              <div className="suggestion-chips-container" style={{ justifyContent: "center" }}>
                {SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => sendChatMessage(sug)}
                    disabled={loading}
                    style={{ textAlign: "left" }}
                  >
                    <Sparkles size={12} style={{ color: "var(--primary-purple)", marginRight: "0.4rem" }} />
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`chat-bubble ${msg.role === "user" ? "user" : "assistant"}`} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", maxWidth: "85%" }}>
              {msg.role === "model" && (
                <div style={{ flexShrink: 0, width: "32px", height: "32px", borderRadius: "50%", background: "var(--bg-dark)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={16} style={{ color: "var(--secondary-cyan)" }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                {msg.content.split("\n").map((para, pIdx) => (
                  <p key={pIdx} style={{ marginBottom: pIdx < msg.content.split("\n").length - 1 ? "0.5rem" : 0 }}>{para}</p>
                ))}
              </div>
              {msg.role === "user" && (
                <div style={{ flexShrink: 0, width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={16} style={{ color: "white" }} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-bubble assistant fade-in" style={{ display: "flex", alignItems: "center", gap: "1rem", maxWidth: "85%" }}>
              <div style={{ flexShrink: 0, width: "32px", height: "32px", borderRadius: "50%", background: "var(--bg-dark)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={16} style={{ color: "var(--secondary-cyan)" }} />
              </div>
              <div style={{ display: "flex", gap: "0.3rem" }}>
                <div className="loader-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-muted)", animation: "bounce 1.4s infinite ease-in-out both" }}></div>
                <div className="loader-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-muted)", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0.2s" }}></div>
                <div className="loader-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-muted)", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-area" style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", padding: "0.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <LayoutTemplate size={18} style={{ position: "absolute", left: "12px", color: "var(--text-muted)", pointerEvents: "none" }} />
            <select 
              onChange={(e) => {
                if(e.target.value) {
                  setInputMsg(e.target.value);
                  e.target.value = ""; 
                }
              }}
              style={{ padding: "0.75rem 1rem 0.75rem 2.5rem", borderRadius: "12px", border: "none", background: "transparent", color: "var(--text-main)", outline: "none", width: "40px", cursor: "pointer", appearance: "none" }}
              disabled={loading}
              title="Use Template"
            >
              <option value="" style={{ background: "var(--bg-dark)" }}></option>
              {SUGGESTIONS.map((s,i) => <option key={i} value={s} style={{ background: "var(--bg-dark)" }}>Template {i+1}: {s.substring(0,20)}...</option>)}
            </select>
          </div>
          
          <input
            type="text"
            className="chat-input"
            placeholder="Type your objective or reply..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            disabled={loading}
            style={{ flex: 1, background: "transparent", border: "none", color: "white", padding: "0.5rem", fontSize: "0.95rem" }}
          />
          <button type="submit" className="btn-primary" style={{ padding: "0.6rem 1.2rem", borderRadius: "12px" }} disabled={loading || !inputMsg.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Report Column */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 10rem)", margin: 0, padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ background: "rgba(6, 182, 212, 0.15)", padding: "0.5rem", borderRadius: "10px", display: "flex" }}>
              <FileText size={20} style={{ color: "var(--secondary-cyan)" }} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Scoping Report</h3>
          </div>
          <button
            onClick={handleGenerateReport}
            className="btn-primary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", background: "linear-gradient(135deg, var(--secondary-cyan), #0891b2)", boxShadow: "0 4px 15px rgba(6, 182, 212, 0.3)" }}
            disabled={messages.length === 0 || reportLoading}
          >
            {reportLoading ? "Compiling..." : <><Sparkles size={14}/> Compile Report</>}
          </button>
        </div>

        <div className="markdown-preview" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {reportLoading ? (
            <div className="fade-in" style={{ textAlign: "center", marginTop: "6rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div className="loader-spinner" style={{ width: "40px", height: "40px", borderColor: "var(--secondary-cyan)", borderRightColor: "transparent" }} />
              <p style={{ color: "var(--text-muted)" }}>Analyzing conversation history...<br/>Drafting report structure...</p>
            </div>
          ) : !report ? (
            <div className="fade-in" style={{ textAlign: "center", marginTop: "6rem", color: "var(--text-muted)", padding: "0 2rem" }}>
              <div style={{ width: "80px", height: "80px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto" }}>
                <FileText size={36} style={{ color: "rgba(255,255,255,0.2)" }} />
              </div>
              <h4 style={{ color: "var(--text-main)", marginBottom: "0.5rem" }}>Awaiting Data</h4>
              <p style={{ fontSize: "0.9rem", lineHeight: "1.5" }}>No report generated yet. Chat with the AI to define your problem, then click "Compile Report" to generate your scoping document.</p>
            </div>
          ) : (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Segmented Control Tabs */}
              <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", padding: "0.3rem", borderRadius: "12px", marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                {[
                  { id: "brief", label: "Brief" },
                  { id: "kpis", label: "KPIs" },
                  { id: "plan", label: "Plan" },
                  { id: "questions", label: "Questions" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      background: activeTab === tab.id ? "rgba(255,255,255,0.1)" : "transparent",
                      border: "none",
                      color: activeTab === tab.id ? "#fff" : "var(--text-muted)",
                      padding: "0.6rem 0.5rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: activeTab === tab.id ? "600" : "500",
                      fontSize: "0.85rem",
                      transition: "all 0.3s ease",
                      boxShadow: activeTab === tab.id ? "0 2px 10px rgba(0,0,0,0.2)" : "none"
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: "auto", paddingRight: "0.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                {activeTab === "brief" && renderMarkdown(report.project_brief)}
                {activeTab === "kpis" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {report.kpi_checklist && report.kpi_checklist.length > 0 && (
                      <div className="glass-card" style={{ padding: "1.5rem", background: "rgba(139, 92, 246, 0.05)", border: "1px solid rgba(139, 92, 246, 0.2)", margin: 0 }}>
                        <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "var(--text-dark)" }}>
                          <CheckCircle2 size={18} style={{ color: "var(--primary-purple)" }} /> KPI Extraction Checklist
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {report.kpi_checklist.map((kpi, i) => (
                            <label key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                              <input type="checkbox" style={{ accentColor: "var(--primary-purple)", width: "16px", height: "16px" }} />
                              <span style={{ fontSize: "0.95rem", color: "var(--text-main)" }}>{kpi}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>{renderMarkdown(report.kpi_tree)}</div>
                  </div>
                )}
                {activeTab === "plan" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {report.data_requirements && report.data_requirements.length > 0 && (
                      <div className="glass-card" style={{ padding: "1.5rem", background: "rgba(6, 182, 212, 0.05)", border: "1px solid rgba(6, 182, 212, 0.2)", margin: 0 }}>
                        <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "var(--text-dark)" }}>
                          <Database size={18} style={{ color: "var(--secondary-cyan)" }} /> Dataset Requirements
                        </h4>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                          To solve this problem, you will need to upload a dataset containing the following columns:
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {report.data_requirements.map((col, i) => (
                            <span key={i} style={{ background: "rgba(255,255,255,0.1)", padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.85rem", color: "var(--text-main)", border: "1px solid rgba(255,255,255,0.05)" }}>
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>{renderMarkdown(report.analytics_plan)}</div>
                  </div>
                )}
                {activeTab === "questions" && renderMarkdown(report.business_questions)}
              </div>
            </div>
          )}
        </div>

        {report && (
          <div className="fade-in" style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
            <button className="btn-primary" onClick={onNextStep} style={{ background: "linear-gradient(135deg, var(--accent-emerald), #059669)", boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)" }}>
              Phase 2: Upload Dataset <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

