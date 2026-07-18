import React, { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, Cell, Tooltip, YAxis, XAxis } from "recharts";
import { 
  Upload, Database, Eye, FileSpreadsheet, ChevronRight, AlertTriangle, 
  Plus, Trash2, CheckCircle2, XCircle, RefreshCw, Layers, Globe, Cloud, Play, X, Info, Activity
} from "lucide-react";

export default function DataProfiler({ onNextStep, summary, setSummary }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("local");

  // Connection management states
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");
  const [schemaData, setSchemaData] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  // New Connection Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConnName, setNewConnName] = useState("");
  const [newConnType, setNewConnType] = useState("sqlite");
  const [newConnConfig, setNewConnConfig] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Load saved connections on mount or activeTab switch
  useEffect(() => {
    if (activeTab === "connections") {
      fetchConnections();
    }
  }, [activeTab]);

  const fetchConnections = async () => {
    setError("");
    try {
      const response = await fetch("/api/connections");
      if (response.ok) {
        const data = await response.json();
        setConnections(data);
      } else {
        setError("Failed to fetch connection profiles.");
      }
    } catch (err) {
      setError("Error connecting to backend API.");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file) => {
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setSummary(data);
      } else {
        setError(data.detail || "Error loading dataset. Check file formatting and structure.");
      }
    } catch (err) {
      setError("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async (datasetName) => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/upload/demo/${datasetName}`, {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        setSummary(data);
      } else {
        setError(data.detail || "Error loading demo dataset.");
      }
    } catch (err) {
      setError("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDtypeChange = async (colName, newDtype) => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/clean/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation_id: "change_dtype",
          column: colName,
          method: newDtype,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSummary(data);
      } else {
        setError(data.detail || "Error changing data type.");
      }
    } catch (err) {
      setError("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  // Connection Ingestion Flow
  const handleSelectConnection = async (conn) => {
    setSelectedConnection(conn);
    setSelectedItem("");
    setSchemaData(null);
    setCatalog([]);
    setCatalogLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/connections/${conn.id}/catalog`);
      if (response.ok) {
        const data = await response.json();
        setCatalog(data);
      } else {
        const errData = await response.json();
        setError(errData.detail || "Failed to retrieve connection catalog.");
      }
    } catch (err) {
      setError("Failed to reach backend catalog endpoint.");
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleSelectCatalogItem = async (itemName) => {
    setSelectedItem(itemName);
    setSchemaData(null);
    setSchemaLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/connections/${selectedConnection.id}/schema/${itemName}`);
      if (response.ok) {
        const data = await response.json();
        setSchemaData(data);
      } else {
        const errData = await response.json();
        setError(errData.detail || "Failed to load schema discovery details.");
      }
    } catch (err) {
      setError("Failed to contact schema discovery service.");
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleIngest = async () => {
    if (!selectedConnection || !selectedItem) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/connections/${selectedConnection.id}/ingest/${selectedItem}`, {
        method: "POST"
      });
      const data = await response.json();
      if (response.ok) {
        setSummary(data);
      } else {
        setError(data.detail || "Failed to ingest source data.");
      }
    } catch (err) {
      setError("Failed to trigger data ingestion on backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConnection = async (id, e) => {
    e.stopPropagation();
    setError("");
    try {
      const response = await fetch(`/api/connections/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        if (selectedConnection?.id === id) {
          setSelectedConnection(null);
          setCatalog([]);
          setSelectedItem("");
          setSchemaData(null);
        }
        fetchConnections();
      } else {
        setError("Failed to delete connection profile.");
      }
    } catch (err) {
      setError("Error deleting connection profile.");
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setError("");

    try {
      const response = await fetch("/api/connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newConnType,
          config: newConnConfig
        })
      });
      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      setError("Failed to communicate with connection test runner.");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    if (!newConnName.trim()) {
      setError("Connection name is required.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newConnName,
          type: newConnType,
          config: newConnConfig
        })
      });
      if (response.ok) {
        setShowAddForm(false);
        setNewConnName("");
        setNewConnConfig({});
        setTestResult(null);
        fetchConnections();
      } else {
        const errData = await response.json();
        setError(errData.detail || "Failed to save connection profile.");
      }
    } catch (err) {
      setError("Error saving connection profile to vault.");
    } finally {
      setLoading(false);
    }
  };

  const updateConfigField = (field, value) => {
    setNewConnConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getConnectionIcon = (type) => {
    switch(type) {
      case "sqlite":
      case "postgresql":
      case "mysql":
      case "sqlserver":
      case "oracle":
      case "snowflake":
      case "bigquery":
      case "redshift":
        return <Database size={18} className="icon-db" style={{ color: "var(--secondary-cyan)" }} />;
      case "s3":
      case "azure":
      case "gcs":
        return <Cloud size={18} className="icon-cloud" style={{ color: "var(--primary-purple)" }} />;
      case "rest":
      case "graphql":
        return <Globe size={18} className="icon-globe" style={{ color: "var(--accent-amber)" }} />;
      default:
        return <Layers size={18} style={{ color: "var(--text-muted)" }} />;
    }
  };

  const renderConfigFields = () => {
    switch(newConnType) {
      case "sqlite":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>SQLite Database File Path</label>
            <input 
              type="text" 
              className="text-input" 
              placeholder="e.g. backend/mock_sqlite.db" 
              value={newConnConfig.database_path || ""}
              onChange={(e) => updateConfigField("database_path", e.target.value)}
              style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-dark)" }}>Relative path from your workspace root.</span>
          </div>
        );
      case "postgresql":
      case "mysql":
      case "sqlserver":
      case "oracle":
      case "snowflake":
      case "bigquery":
      case "redshift":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-grid-3-1">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Host / Endpoint</label>
                <input 
                  type="text" 
                  placeholder="e.g. db.example.com" 
                  value={newConnConfig.host || ""}
                  onChange={(e) => updateConfigField("host", e.target.value)}
                  style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Port</label>
                <input 
                  type="text" 
                  placeholder="5432" 
                  value={newConnConfig.port || ""}
                  onChange={(e) => updateConfigField("port", e.target.value)}
                  style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
                />
              </div>
            </div>
            <div className="form-grid-2">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Database Name</label>
                <input 
                  type="text" 
                  placeholder="sales_warehouse" 
                  value={newConnConfig.database || ""}
                  onChange={(e) => updateConfigField("database", e.target.value)}
                  style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Username</label>
                <input 
                  type="text" 
                  placeholder="readonly_analyst" 
                  value={newConnConfig.username || ""}
                  onChange={(e) => updateConfigField("username", e.target.value)}
                  style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Password / Credential Token</label>
              <input 
                type="password" 
                placeholder="••••••••••••••••" 
                value={newConnConfig.password || ""}
                onChange={(e) => updateConfigField("password", e.target.value)}
                style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
              />
            </div>
          </div>
        );
      case "s3":
      case "azure":
      case "gcs":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Bucket or Container Name</label>
              <input 
                type="text" 
                placeholder="s3://analytics-data-lake" 
                value={newConnConfig.bucket || ""}
                onChange={(e) => updateConfigField("bucket", e.target.value)}
                style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
              />
            </div>
            <div className="form-grid-2">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Access Key ID</label>
                <input 
                  type="text" 
                  placeholder="AKIAIOSFODNN7EXAMPLE" 
                  value={newConnConfig.access_key || ""}
                  onChange={(e) => updateConfigField("access_key", e.target.value)}
                  style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Secret Access Key</label>
                <input 
                  type="password" 
                  placeholder="••••••••••••••••" 
                  value={newConnConfig.secret_key || ""}
                  onChange={(e) => updateConfigField("secret_key", e.target.value)}
                  style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
                />
              </div>
            </div>
          </div>
        );
      case "rest":
      case "graphql":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Base REST Endpoint URL</label>
              <input 
                type="text" 
                placeholder="https://api.stripe.com/v1" 
                value={newConnConfig.url || ""}
                onChange={(e) => updateConfigField("url", e.target.value)}
                style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Authorization Header Value (Optional)</label>
              <input 
                type="text" 
                placeholder="Bearer sk_live_..." 
                value={newConnConfig.auth_header || ""}
                onChange={(e) => updateConfigField("auth_header", e.target.value)}
                style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
              />
            </div>
          </div>
        );
      case "shopify":
      case "stripe":
      case "salesforce":
      case "hubspot":
      case "google_analytics":
      case "meta_ads":
      case "google_ads":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>API Token / Private Key</label>
              <input 
                type="password" 
                placeholder="shppa_... or sk_live_..." 
                value={newConnConfig.api_key || ""}
                onChange={(e) => updateConfigField("api_key", e.target.value)}
                style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Client / Account ID (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. acct_10328" 
                value={newConnConfig.client_id || ""}
                onChange={(e) => updateConfigField("client_id", e.target.value)}
                style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {!summary && (
        <div className="glass-card" style={{ maxWidth: "1000px", margin: "2rem auto", width: "100%" }}>
          <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Connect Data Source</h2>
          
          {/* Main Tab selector */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", marginBottom: "1.5rem" }}>
            <button 
              className={`tab-btn ${activeTab === "local" ? "active" : ""}`}
              onClick={() => setActiveTab("local")}
              style={{ flex: 1, padding: "0.75rem", background: "transparent", border: "none", borderBottom: activeTab === "local" ? "2px solid var(--primary-purple)" : "2px solid transparent", color: activeTab === "local" ? "white" : "var(--text-muted)", cursor: "pointer", transition: "all 0.2s", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
            >
              <Upload size={16} /> Local File
            </button>
            <button 
              className={`tab-btn ${activeTab === "connections" ? "active" : ""}`}
              onClick={() => setActiveTab("connections")}
              style={{ flex: 1, padding: "0.75rem", background: "transparent", border: "none", borderBottom: activeTab === "connections" ? "2px solid var(--primary-purple)" : "2px solid transparent", color: activeTab === "connections" ? "white" : "var(--text-muted)", cursor: "pointer", transition: "all 0.2s", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
            >
              <Database size={16} /> Database & Cloud Connections
            </button>
          </div>

          {/* Local tab view */}
          {activeTab === "local" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div
                className={`upload-zone ${dragActive ? "dragover" : ""}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input").click()}
              >
                <input
                  id="file-input"
                  type="file"
                  style={{ display: "none" }}
                  accept=".csv, .xlsx, .xls, .json, .parquet"
                  onChange={handleFileInput}
                  disabled={loading}
                />
                <div className="upload-icon">
                  {loading ? (
                    <div className="loader-spinner" style={{ width: "30px", height: "30px", margin: 0 }} />
                  ) : (
                    <Upload size={28} />
                  )}
                </div>
                {loading ? (
                  <div>
                    <h3>Parsing Data...</h3>
                    <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Analyzing structures, generating statistics, calculating missing data metrics...</p>
                  </div>
                ) : (
                  <div>
                    <h3>Drag & Drop Data File Here</h3>
                    <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Or click to browse files on your device</p>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-dark)", marginTop: "1rem", display: "block" }}>Supports CSV, XLSX, JSON, Parquet up to 50MB</span>
                  </div>
                )}
              </div>

              {!loading && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
                  <h4 style={{ margin: "0 0 1rem 0", color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Or Quick Start with Demo Datasets
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                    <div 
                      onClick={(e) => { e.stopPropagation(); handleLoadDemo("retail_sales"); }}
                      style={{ 
                        padding: "1.25rem", 
                        borderRadius: "10px", 
                        border: "1px solid var(--border-color)", 
                        background: "rgba(255,255,255,0.01)", 
                        cursor: "pointer", 
                        transition: "all 0.2s",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary-purple)"; e.currentTarget.style.background = "rgba(139, 92, 246, 0.03)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.background = "rgba(255,255,255,0.01)"; }}
                    >
                      <div style={{ fontWeight: 600, color: "white", fontSize: "0.95rem" }}>🛒 Retail Sales & Customer Map</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>150 transactions. Includes Lat/Long geo coordinates, quantities, and pricing data. Perfect for geospatial mapping & joins.</div>
                    </div>

                    <div 
                      onClick={(e) => { e.stopPropagation(); handleLoadDemo("product_reviews"); }}
                      style={{ 
                        padding: "1.25rem", 
                        borderRadius: "10px", 
                        border: "1px solid var(--border-color)", 
                        background: "rgba(255,255,255,0.01)", 
                        cursor: "pointer", 
                        transition: "all 0.2s",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--secondary-cyan)"; e.currentTarget.style.background = "rgba(6, 182, 212, 0.03)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.background = "rgba(255,255,255,0.01)"; }}
                    >
                      <div style={{ fontWeight: 600, color: "white", fontSize: "0.95rem" }}>💬 Product Reviews & Sentiment</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>120 customer feedback entries. Includes review text and ratings. Perfect for NLP & Sentiment analysis.</div>
                    </div>

                    <div 
                      onClick={(e) => { e.stopPropagation(); handleLoadDemo("saas_metrics"); }}
                      style={{ 
                        padding: "1.25rem", 
                        borderRadius: "10px", 
                        border: "1px solid var(--border-color)", 
                        background: "rgba(255,255,255,0.01)", 
                        cursor: "pointer", 
                        transition: "all 0.2s",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-amber)"; e.currentTarget.style.background = "rgba(245, 158, 11, 0.03)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.background = "rgba(255,255,255,0.01)"; }}
                    >
                      <div style={{ fontWeight: 600, color: "white", fontSize: "0.95rem" }}>📈 Daily SaaS Business Metrics</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>180 days of timeseries data. Includes active users, signups, MRR, and churn. Ideal for forecasting models.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connections tab view */}
          {activeTab === "connections" && (
            <div className="connections-layout">
              {/* Left Column: Connections list & Creation trigger */}
              <div style={{ borderRight: "1px solid var(--border-color)", paddingRight: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0, color: "var(--text-dark)" }}>Saved Sources</h4>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      setShowAddForm(true); 
                      setSelectedConnection(null); 
                      setCatalog([]);
                      setSelectedItem("");
                      setSchemaData(null);
                    }}
                    style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto", maxH: "400px", flex: 1 }}>
                  {connections.length === 0 ? (
                    <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-dark)", border: "1px dashed var(--border-color)", borderRadius: "8px" }}>
                      No saved connections. Click "Add" to configure one.
                    </div>
                  ) : (
                    connections.map(conn => {
                      const isActive = selectedConnection?.id === conn.id;
                      return (
                        <div 
                          key={conn.id}
                          onClick={() => { handleSelectConnection(conn); setShowAddForm(false); }}
                          style={{
                            padding: "0.75rem 1rem",
                            borderRadius: "8px",
                            background: isActive ? "rgba(139, 92, 246, 0.15)" : "rgba(255, 255, 255, 0.02)",
                            border: isActive ? "1px solid var(--primary-purple)" : "1px solid var(--border-color)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            transition: "all 0.2s"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                            {getConnectionIcon(conn.type)}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: "var(--text-dark)", fontSize: "0.85rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{conn.name}</div>
                              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{conn.type.toUpperCase()}</div>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => handleDeleteConnection(conn.id, e)}
                            style={{ background: "transparent", border: "none", color: "var(--text-dark)", cursor: "pointer", padding: "0.25rem" }}
                            onMouseEnter={(e) => e.target.style.color = "var(--accent-rose)"}
                            onMouseLeave={(e) => e.target.style.color = "var(--text-dark)"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Dynamic Form or Catalog Explorer */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {showAddForm ? (
                  /* Connection creation form */
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", background: "rgba(255,255,255,0.01)", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                      <h4 style={{ margin: 0, color: "var(--text-dark)" }}>Configure Connection</h4>
                      <button 
                        onClick={() => setShowAddForm(false)} 
                        style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="form-grid-2">
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Connection Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Sales SQLite" 
                          value={newConnName}
                          onChange={(e) => setNewConnName(e.target.value)}
                          style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Source Type</label>
                        <select 
                          value={newConnType}
                          onChange={(e) => { setNewConnType(e.target.value); setNewConnConfig({}); setTestResult(null); }}
                          style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-dark)" }}
                        >
                          <option value="sqlite">SQLite Database</option>
                          <option value="postgresql">PostgreSQL</option>
                          <option value="mysql">MySQL</option>
                          <option value="sqlserver">Microsoft SQL Server</option>
                          <option value="oracle">Oracle Database</option>
                          <option value="snowflake">Snowflake</option>
                          <option value="bigquery">Google BigQuery</option>
                          <option value="redshift">Amazon Redshift</option>
                          <option value="s3">AWS S3 Bucket</option>
                          <option value="azure">Azure Blob Storage</option>
                          <option value="gcs">Google Cloud Storage</option>
                          <option value="rest">REST API Client</option>
                          <option value="graphql">GraphQL API Client</option>
                          <option value="salesforce">Salesforce CRM</option>
                          <option value="hubspot">HubSpot CRM</option>
                          <option value="google_analytics">Google Analytics</option>
                          <option value="meta_ads">Meta Ads</option>
                          <option value="google_ads">Google Ads</option>
                          <option value="shopify">Shopify</option>
                          <option value="stripe">Stripe Payments</option>
                        </select>
                      </div>
                    </div>

                    {/* Render inputs based on type */}
                    {renderConfigFields()}

                    {/* Test Results indicator */}
                    {testResult && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        background: testResult.success ? "rgba(16, 185, 129, 0.05)" : "rgba(244, 63, 94, 0.05)",
                        border: testResult.success ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(244, 63, 94, 0.2)",
                        color: testResult.success ? "var(--accent-emerald)" : "var(--accent-rose)"
                      }}>
                        {testResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        <span>{testResult.message}</span>
                      </div>
                    )}

                    {/* Form actions */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" }}>
                      <button 
                        className="tab-btn" 
                        onClick={handleTestConnection}
                        disabled={testing}
                        style={{ background: "transparent", border: "1px solid var(--border-color)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", color: "var(--text-dark)" }}
                      >
                        {testing ? "Testing..." : "Test Connection"}
                      </button>
                      <button 
                        className="btn-primary" 
                        onClick={handleSaveConnection}
                        disabled={loading}
                        style={{ padding: "0.5rem 1.2rem", borderRadius: "8px" }}
                      >
                        {loading ? "Saving..." : "Save & Close"}
                      </button>
                    </div>
                  </div>
                ) : selectedConnection ? (
                  /* Catalog explorer & Schema preview panel */
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-card)", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                      {getConnectionIcon(selectedConnection.type)}
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Active Source:</span>
                      <strong style={{ fontSize: "0.85rem", color: "var(--text-dark)" }}>{selectedConnection.name}</strong>
                    </div>

                    {/* Database Catalog explorer */}
                    <div className="catalog-layout">
                      <div style={{ borderRight: "1px solid var(--border-color)", paddingRight: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-dark)", fontWeight: 600 }}>Catalog Items</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", overflowY: "auto", maxHeight: "300px" }}>
                          {catalogLoading ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                              <RefreshCw size={20} className="animate-spin" style={{ color: "var(--primary-purple)" }} />
                            </div>
                          ) : catalog.length === 0 ? (
                            <div style={{ fontSize: "0.8rem", color: "var(--text-dark)" }}>No tables or endpoints discovered.</div>
                          ) : (
                            catalog.map(item => {
                              const isSelected = selectedItem === item.name;
                              return (
                                <button
                                  key={item.name}
                                  onClick={() => handleSelectCatalogItem(item.name)}
                                  style={{
                                    padding: "0.5rem 0.75rem",
                                    borderRadius: "6px",
                                    textAlign: "left",
                                    background: isSelected ? "rgba(139, 92, 246, 0.1)" : "transparent",
                                    border: isSelected ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid transparent",
                                    color: isSelected ? "white" : "var(--text-muted)",
                                    fontSize: "0.8rem",
                                    cursor: "pointer",
                                    textOverflow: "ellipsis",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  {item.name}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Discovered Schema preview details */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", minHeight: "300px" }}>
                        {schemaLoading ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "0.5rem" }}>
                            <RefreshCw size={24} className="animate-spin" style={{ color: "var(--secondary-cyan)" }} />
                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Running schema discovery...</span>
                          </div>
                        ) : schemaData ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-dark)", fontWeight: 600 }}>Schema & Sample Preview</div>
                              <button 
                                className="btn-primary" 
                                onClick={handleIngest}
                                disabled={loading}
                                style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                              >
                                <Play size={12} /> {loading ? "Ingesting..." : "Ingest Source"}
                              </button>
                            </div>

                            {/* Schema Columns list */}
                            <div style={{ maxHeight: "120px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "6px", background: "rgba(0,0,0,0.15)", padding: "0.5rem" }}>
                              <table style={{ width: "100%", fontSize: "0.75rem", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                                    <th style={{ textAlign: "left", paddingBottom: "0.25rem", color: "var(--text-dark)" }}>Column</th>
                                    <th style={{ textAlign: "left", paddingBottom: "0.25rem", color: "var(--text-dark)" }}>Type</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {schemaData.columns.map(col => (
                                    <tr key={col.name} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                      <td style={{ color: "var(--text-dark)", padding: "0.2rem 0" }}>{col.name}</td>
                                      <td style={{ color: "var(--secondary-cyan)" }}>{col.type}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Preview Grid (Top 5 rows) */}
                            <div style={{ flex: 1, overflowX: "auto" }}>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-dark)", marginBottom: "0.25rem" }}>Sample Row Values</div>
                              <table style={{ width: "100%", fontSize: "0.7rem", borderCollapse: "collapse", border: "1px solid var(--border-color)" }}>
                                <thead>
                                  <tr style={{ background: "rgba(255, 255, 255, 0.02)" }}>
                                    {schemaData.columns.map(col => (
                                      <th key={col.name} style={{ borderBottom: "1px solid var(--border-color)", borderRight: "1px solid var(--border-color)", padding: "0.4rem", textAlign: "left", color: "var(--text-dark)" }}>
                                        {col.name}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {schemaData.preview.map((row, rIdx) => (
                                    <tr key={rIdx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                      {schemaData.columns.map(col => (
                                        <td key={col.name} style={{ borderRight: "1px solid var(--border-color)", padding: "0.4rem", color: row[col.name] === null ? "var(--text-dark)" : "var(--text-main)", fontStyle: row[col.name] === null ? "italic" : "normal" }}>
                                          {row[col.name] === null ? "null" : String(row[col.name])}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: "var(--text-dark)", border: "1px dashed var(--border-color)", borderRadius: "8px" }}>
                            <Info size={28} style={{ marginBottom: "0.5rem" }} />
                            <span>Select a catalog table to discover schemas and preview contents.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: "var(--text-dark)", border: "1px dashed var(--border-color)", borderRadius: "8px", minHeight: "350px" }}>
                    <Database size={36} style={{ marginBottom: "0.75rem" }} />
                    <span>Select an existing saved connection or configure a new source.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-rose)", background: "rgba(244, 63, 94, 0.05)", border: "1px solid rgba(244, 63, 94, 0.15)", padding: "0.75rem 1rem", borderRadius: "10px", marginTop: "1.5rem" }}>
              <AlertTriangle size={18} />
              <span style={{ fontSize: "0.85rem" }}>{error}</span>
            </div>
          )}
        </div>
      )}

      {summary && (
        <>
          <div className="glass-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Database style={{ color: "var(--secondary-cyan)" }} />
                <h3 style={{ margin: 0 }}>Dataset Profiling Overview: <span style={{ color: "var(--primary-purple)" }}>{summary.filename}</span></h3>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button className="tab-btn" onClick={() => setSummary(null)} style={{ background: "transparent", border: "1px solid var(--border-color)", padding: "0.5rem 1rem", borderRadius: "10px", cursor: "pointer", color: "var(--text-dark)" }}>
                  Connect Another Source
                </button>
                <button className="btn-primary" onClick={onNextStep}>
                  Next: Data Cleaning Panel <ChevronRight size={16} />
                </button>
              </div>
              </div>
            </div>

            {summary.schema_drift_warnings && summary.schema_drift_warnings.length > 0 && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", color: "var(--accent-amber)", background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.2)", padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
                <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "var(--accent-amber)" }}>Schema Drift Detected</h4>
                  <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", color: "var(--text-dark)" }}>This dataset's structure has changed compared to its historical profile. This may impact downstream analytics or pipelines.</p>
                  <ul style={{ margin: 0, paddingLeft: "1.5rem", fontSize: "0.8rem", color: "var(--text-main)" }}>
                    {summary.schema_drift_warnings.map((warning, idx) => (
                      <li key={idx} style={{ marginBottom: "0.25rem" }}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Total Records</div>
                <div className="stat-value">{summary.row_count.toLocaleString()}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Columns</div>
                <div className="stat-value">{summary.column_count}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Duplicate Rows</div>
                <div className="stat-value" style={{ color: summary.duplicate_count > 0 ? "var(--accent-rose)" : "var(--accent-emerald)" }}>
                  {summary.duplicate_count}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Cleaning History</div>
                <div className="stat-value" style={{ color: "var(--secondary-cyan)" }}>{summary.history_count} steps</div>
              </div>
              {summary.quality_score !== undefined && (
                <div className="stat-item" style={{ border: summary.quality_score >= 90 ? "1px solid rgba(16, 185, 129, 0.3)" : summary.quality_score >= 70 ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(244, 63, 94, 0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem" }}>
                  <div>
                    <div className="stat-label" style={{ marginBottom: "0.25rem" }}>Data Quality Score</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 700, color: summary.quality_score >= 90 ? "var(--accent-emerald)" : summary.quality_score >= 70 ? "var(--accent-amber)" : "var(--accent-rose)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      {summary.quality_score}<span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 500 }}>/100</span>
                    </div>
                  </div>
                  <div style={{ width: "60px", height: "60px", position: "relative" }}>
                    <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="3.5"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={summary.quality_score >= 90 ? "var(--accent-emerald)" : summary.quality_score >= 70 ? "var(--accent-amber)" : "var(--accent-rose)"}
                        strokeWidth="3.5"
                        strokeDasharray={`${summary.quality_score}, 100`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 1s ease-out" }}
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>

          <div className="glass-card">
            <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileSpreadsheet size={20} style={{ color: "var(--primary-purple)" }} /> Column Signatures
            </h3>
            
            <div className="columns-grid">
              {Object.entries(summary.columns).map(([colName, meta]) => {
                const isNullSafe = meta.null_count === 0;
                return (
                  <div key={colName} className="column-card">
                    <div className="column-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className="column-name" title={colName}>{colName}</span>
                        {meta.stats.outliers_count > 0 && (
                          <div title={`${meta.stats.outliers_count} extreme outliers detected`} style={{ color: "var(--accent-amber)", display: "flex", alignItems: "center", cursor: "help" }}>
                            <AlertTriangle size={16} />
                          </div>
                        )}
                      </div>
                      <select 
                        className="column-type" 
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "var(--secondary-cyan)", fontSize: "0.75rem", padding: "0.2rem", cursor: "pointer", outline: "none" }}
                        value={meta.dtype === "object" ? "Categorical" : meta.dtype.includes("datetime") ? "Datetime" : "Numeric"}
                        onChange={(e) => handleDtypeChange(colName, e.target.value)}
                        disabled={loading}
                      >
                        <option value="Numeric" style={{ background: "var(--bg-dark)", color: "white" }}>Numeric</option>
                        <option value="Categorical" style={{ background: "var(--bg-dark)", color: "white" }}>Categorical</option>
                        <option value="Datetime" style={{ background: "var(--bg-dark)", color: "white" }}>Datetime</option>
                      </select>
                    </div>

                    <div className="column-meta-row">
                      <span>Unique Values:</span>
                      <span style={{ fontWeight: 600, color: "var(--text-dark)" }}>{meta.unique_count}</span>
                    </div>

                    <div className="column-meta-row" style={{ display: "block" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Missing Rows:</span>
                        <span style={{ color: isNullSafe ? "var(--accent-emerald)" : "var(--accent-rose)", fontWeight: 600 }}>
                          {meta.null_count} ({meta.null_percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="progress-bar-bg">
                        <div
                          className={`progress-bar-fill ${isNullSafe ? "safe" : ""}`}
                          style={{ width: `${Math.min(100, isNullSafe ? 100 : meta.null_percentage)}%` }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                      <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-dark)", letterSpacing: "0.05em", display: "block", marginBottom: "0.4rem" }}>
                        Statistical Summary
                      </span>
                      {meta.stats.mean !== undefined ? (
                        <>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem 0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            <div>Count: <span style={{ color: "var(--text-dark)" }}>{meta.stats.count}</span></div>
                            <div>Mean: <span style={{ color: "var(--text-dark)" }}>{typeof meta.stats.mean === 'number' ? meta.stats.mean.toFixed(2) : 'N/A'}</span></div>
                            <div>Std: <span style={{ color: "var(--text-dark)" }}>{typeof meta.stats.std === 'number' ? meta.stats.std.toFixed(2) : 'N/A'}</span></div>
                            <div>Min: <span style={{ color: "var(--text-dark)" }}>{typeof meta.stats.min === 'number' ? meta.stats.min.toFixed(2) : 'N/A'}</span></div>
                            <div>25%: <span style={{ color: "var(--text-dark)" }}>{typeof meta.stats["25%"] === 'number' ? meta.stats["25%"].toFixed(2) : 'N/A'}</span></div>
                            <div>50%: <span style={{ color: "var(--text-dark)" }}>{typeof meta.stats["50%"] === 'number' ? meta.stats["50%"].toFixed(2) : 'N/A'}</span></div>
                            <div>75%: <span style={{ color: "var(--text-dark)" }}>{typeof meta.stats["75%"] === 'number' ? meta.stats["75%"].toFixed(2) : 'N/A'}</span></div>
                            <div>Max: <span style={{ color: "var(--text-dark)" }}>{typeof meta.stats.max === 'number' ? meta.stats.max.toFixed(2) : 'N/A'}</span></div>
                          </div>
                          {meta.stats.histogram && meta.stats.histogram.length > 0 && (
                            <div style={{ marginTop: "1rem", height: "40px", width: "100%" }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={meta.stats.histogram.map((count, i) => ({ index: i, count }))}>
                                  <Bar dataKey="count" fill="var(--primary-purple)" radius={[2, 2, 0, 0]} />
                                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '12px', padding: '4px 8px' }} formatter={(val) => [val, 'Count']} labelStyle={{display: 'none'}} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem 0.5rem", marginBottom: "0.5rem" }}>
                            <div>Count: <span style={{ color: "var(--text-dark)" }}>{meta.stats.count}</span></div>
                            <div>Unique: <span style={{ color: "var(--text-dark)" }}>{meta.stats.unique}</span></div>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={meta.stats.top}>Top: <span style={{ color: "var(--text-dark)" }}>{meta.stats.top ?? 'N/A'}</span></div>
                            <div>Freq: <span style={{ color: "var(--text-dark)" }}>{meta.stats.freq ?? 'N/A'}</span></div>
                          </div>
                          {meta.stats.top_values && meta.stats.top_values.length > 0 ? (
                            <div style={{ marginTop: "0.5rem" }}>
                              {meta.stats.top_values.map((item, idx) => {
                                const maxCount = Math.max(...meta.stats.top_values.map(i => i.count));
                                const widthPct = (item.count / maxCount) * 100;
                                return (
                                  <div key={idx} style={{ marginBottom: "0.4rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginBottom: "0.1rem" }}>
                                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, paddingRight: "0.5rem", color: "var(--text-muted)" }}>{item.value || "(empty)"}</span>
                                      <span style={{ color: "var(--text-dark)", fontWeight: 500 }}>{item.count}</span>
                                    </div>
                                    <div style={{ height: "4px", width: "100%", background: "rgba(255, 255, 255, 0.05)", borderRadius: "2px", overflow: "hidden" }}>
                                      <div style={{ height: "100%", width: `${widthPct}%`, background: "var(--secondary-cyan)", borderRadius: "2px" }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-dark)" }}>No distinct patterns</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="glass-card" style={{ overflowX: "auto" }}>
            <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Eye size={20} style={{ color: "var(--accent-emerald)" }} /> Data Preview (Top 10 Rows)
            </h3>
            <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.02)" }}>
                  {Object.keys(summary.columns).map((c) => (
                    <th key={c} style={{ borderBottom: "2px solid var(--border-color)", padding: "0.75rem 1rem", textAlign: "left", color: "var(--text-dark)" }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.preview.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    {Object.keys(summary.columns).map((col) => (
                      <td key={col} style={{ padding: "0.6rem 1rem", color: row[col] === null ? "var(--text-dark)" : "var(--text-main)", fontStyle: row[col] === null ? "italic" : "normal" }}>
                        {row[col] === null ? "null" : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

