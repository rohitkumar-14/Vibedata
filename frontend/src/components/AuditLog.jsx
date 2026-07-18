import React, { useState, useEffect } from "react";
import { History, Clock, User, Activity } from "lucide-react";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit");
      const data = await res.json();
      if (res.ok && data.logs) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error("Failed to fetch audit logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="fade-in glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
        <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <History size={20} style={{ color: "var(--primary-purple)" }} /> Enterprise Audit Log
        </h3>
        <button onClick={fetchLogs} className="btn-secondary" style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: 0 }}>
        Tracks data lineage and all user actions within the active session to maintain compliance and reproducibility.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
        {logs.length === 0 && !loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", border: "1px dashed var(--border-color)", borderRadius: "8px" }}>
                No actions logged in this session yet.
            </div>
        ) : (
            logs.map((log, idx) => (
                <div key={idx} style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "1.25rem", display: "flex", gap: "1.5rem" }}>
                    <div style={{ flex: "0 0 150px", display: "flex", flexDirection: "column", gap: "0.5rem", borderRight: "1px solid var(--border-color)", paddingRight: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}><Clock size={14} /> {log.timestamp.split(" ")[1]}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-dark)" }}><User size={14} /> {log.user}</div>
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <h4 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Activity size={16} style={{ color: "var(--secondary-cyan)" }} /> {log.action}</h4>
                        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>{log.details}</p>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
