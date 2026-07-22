import React, { useState } from "react";
import { MessageSquare, Upload, Sparkles, LineChart, Download, Terminal, FileCode, CheckCircle2, Award, Clipboard, BarChart2, Lightbulb, History, Cpu, Target, Menu, X, Moon, Sun, LogOut, Share2, Presentation, Link, Copy, HelpCircle, Settings, BookOpen } from "lucide-react";
import pptxgen from "pptxgenjs";
import { Joyride } from 'react-joyride';
import ChatSection from "./components/ChatSection";
import DataProfiler from "./components/DataProfiler";
import CleanPanel from "./components/CleanPanel";
import EDA from "./components/EDA";
import DeeperAnalysis from "./components/DeeperAnalysis";
import MachineLearning from "./components/MachineLearning";
import RCA from "./components/RCA";
import ChartExplorer from "./components/ChartExplorer";
import Insights from "./components/Insights";
import SQLStudio from "./components/SQLStudio";
import VisualReport from "./components/VisualReport";
import Login from "./components/Login";
import AuditLog from "./components/AuditLog";
import MasterAgent from "./components/MasterAgent";
import LandingPage from "./components/LandingPage";
import UserGuide from "./components/UserGuide";
import CaseStudies from "./components/CaseStudies";

const safeJSONParse = (key, defaultValue) => {
  const saved = localStorage.getItem(key);
  if (saved === null) return defaultValue;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return saved;
  }
};

export default function App() {
  const [activeStep, setActiveStep] = useState(() => safeJSONParse("activeStep", 1));
  
  // Scoping Chat States
  const [messages, setMessages] = useState(() => safeJSONParse("messages", []));
  const [report, setReport] = useState(() => safeJSONParse("report", null));

  // Data Profiler States
  const [summary, setSummary] = useState(() => safeJSONParse("summary", null));

  // Script Preview State
  const [fullScript, setFullScript] = useState("");

  // Print Mode State
  const [isPrinting, setIsPrinting] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => safeJSONParse("isAuthenticated", false));
  const [authToken, setAuthToken] = useState(() => safeJSONParse("authToken", null));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Landing Page State
  const [showLanding, setShowLanding] = useState(() => safeJSONParse("showLanding", true));

  // Prerequisite Modal State
  const [showPrereqModal, setShowPrereqModal] = useState(false);

  // Export Tab State
  const [exportTab, setExportTab] = useState("exports");
  const [shareLink, setShareLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  // Orchestration State
  const [pipelines, setPipelines] = useState([]);
  const [orchForm, setOrchForm] = useState({ name: "", description: "", cron: "" });
  const [loadingOrch, setLoadingOrch] = useState(false);

  const fetchPipelines = async () => {
    try {
      const res = await fetch("/api/pipelines");
      if (res.ok) setPipelines(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleSavePipeline = async (e) => {
    e.preventDefault();
    setLoadingOrch(true);
    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...orchForm, code: fullScript })
      });
      if (res.ok) {
        setOrchForm({ name: "", description: "", cron: "" });
        fetchPipelines();
      }
    } catch (e) { console.error(e); }
    setLoadingOrch(false);
  };
  
  const handleRunPipeline = async (id) => {
    try {
      await fetch(`/api/pipelines/${id}/run`, { method: "POST" });
      fetchPipelines();
    } catch (e) { console.error(e); }
  };

  const handleDeletePipeline = async (id) => {
    try {
      await fetch(`/api/pipelines/${id}`, { method: "DELETE" });
      fetchPipelines();
    } catch (e) { console.error(e); }
  };

  // Tour State
  const [runTour, setRunTour] = useState(() => safeJSONParse("runTour", true));

  // Theme State
  const [theme, setTheme] = useState(() => safeJSONParse("theme", "dark"));

  // User Guide State
  const [showUserGuide, setShowUserGuide] = useState(false);

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState({ configured: false, masked_key: "" });
  const [testResult, setTestResult] = useState(null);
  const [saveResult, setSaveResult] = useState(null);

  const fetchKeyStatus = async () => {
    try {
      const res = await fetch("/api/settings/gemini");
      if (res.ok) {
        const data = await res.json();
        setKeyStatus(data);
      }
    } catch (e) {
      console.error("Error fetching Gemini key status:", e);
    }
  };

  const handleTestKey = async () => {
    if (!geminiKey) return;
    setIsTestingKey(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/gemini/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: geminiKey })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: "API key is valid and verified!" });
      } else {
        setTestResult({ success: false, message: `Verification failed: ${data.error}` });
      }
    } catch (e) {
      setTestResult({ success: false, message: `Error: ${e.message}` });
    }
    setIsTestingKey(false);
  };

  const handleSaveKey = async () => {
    if (!geminiKey) return;
    setIsSavingKey(true);
    setSaveResult(null);
    try {
      const res = await fetch("/api/settings/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: geminiKey })
      });
      const data = await res.json();
      if (res.ok) {
        setSaveResult({ success: true, message: "API key updated and saved successfully!" });
        setGeminiKey("");
        fetchKeyStatus();
        setTimeout(() => {
          setShowSettingsModal(false);
          setSaveResult(null);
          setTestResult(null);
        }, 1500);
      } else {
        setSaveResult({ success: false, message: `Failed to save: ${data.detail || "Unknown error"}` });
      }
    } catch (e) {
      setSaveResult({ success: false, message: `Error: ${e.message}` });
    }
    setIsSavingKey(false);
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchKeyStatus();
    }
  }, [isAuthenticated]);

  // Persist state to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem("activeStep", JSON.stringify(activeStep));
    localStorage.setItem("messages", JSON.stringify(messages));
    localStorage.setItem("report", JSON.stringify(report));
    localStorage.setItem("summary", JSON.stringify(summary));
    localStorage.setItem("isAuthenticated", JSON.stringify(isAuthenticated));
    localStorage.setItem("authToken", JSON.stringify(authToken));
    localStorage.setItem("showLanding", JSON.stringify(showLanding));
    localStorage.setItem("runTour", JSON.stringify(runTour));
    localStorage.setItem("theme", JSON.stringify(theme));
  }, [activeStep, messages, report, summary, isAuthenticated, authToken, showLanding, runTour, theme]);

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setAuthToken(null);
    setSummary(null);
    setReport(null);
    setMessages([]);
    setActiveStep(1);
    setShowLanding(true);
  };

  // Inactivity timeout (1 hour)
  React.useEffect(() => {
    let inactivityTimer;
    let lastActivityTime = Date.now();
    const TIMEOUT_DURATION = 1 * 60 * 60 * 1000; // 1 hour
    
    const checkInactivity = () => {
      if (Date.now() - lastActivityTime >= TIMEOUT_DURATION) {
        handleLogout();
      }
    };

    const resetTimer = () => {
      lastActivityTime = Date.now();
    };

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Check inactivity every minute to avoid performance hit from resetting timeout on every mousemove
    inactivityTimer = setInterval(checkInactivity, 60000);
    
    activityEvents.forEach(event => document.addEventListener(event, resetTimer, { passive: true }));
    
    return () => {
      clearInterval(inactivityTimer);
      activityEvents.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, []);

  const handleExportPPTX = () => {
    const pptx = new pptxgen();

    let slide1 = pptx.addSlide();
    slide1.addText("VibeData Executive Analytics", { x: 1, y: 1, w: '80%', fontSize: 36, bold: true, color: '363636' });
    slide1.addText("Autogenerated AI Report", { x: 1, y: 2, w: '80%', fontSize: 24, color: '8b5cf6' });
    slide1.addText(`Date: ${new Date().toLocaleDateString()}`, { x: 1, y: 3, w: '80%', fontSize: 14, color: '64748b' });

    if (report && report.project_brief) {
        let slide2 = pptx.addSlide();
        slide2.addText("Executive Summary", { x: 0.5, y: 0.5, w: '90%', fontSize: 24, bold: true, color: '363636' });
        const cleanText = report.project_brief.replace(/#/g, '').replace(/\*/g, '');
        slide2.addText(cleanText, { x: 0.5, y: 1.2, w: '90%', fontSize: 14, color: '363636', align: 'left', valign: 'top' });
    }

    let slide3 = pptx.addSlide();
    slide3.addText("Dataset Overview", { x: 0.5, y: 0.5, w: '90%', fontSize: 24, bold: true, color: '363636' });
    slide3.addText(`Total Rows: ${(summary?.row_count || 0).toLocaleString()}`, { x: 1, y: 1.5, fontSize: 18, color: '0f172a' });
    slide3.addText(`Total Columns: ${summary?.column_count || 0}`, { x: 1, y: 2.2, fontSize: 18, color: '0f172a' });
    slide3.addText(`Missing Values: ${summary?.missing_cells || 0}`, { x: 1, y: 2.9, fontSize: 18, color: '0f172a' });

    pptx.writeFile({ fileName: `vibedata_presentation_${new Date().toISOString().split('T')[0]}.pptx` });
  };

  const handleGenerateLink = () => {
    const mockId = Math.random().toString(36).substring(2, 9);
    setShareLink(`https://vibedata.app/shared/d-${mockId}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const joyrideSteps = [
    {
      target: '.sidebar',
      content: 'Welcome to VibeData Enterprise! This sidebar tracks your 11-phase journey.',
      disableBeacon: true,
    },
    {
      target: '.step-item:nth-child(1)',
      content: 'Start here by chatting with our AI to scope out your business problem.',
    },
    {
      target: '.step-item:nth-child(2)',
      content: 'Then, upload your dataset or connect to your database.',
    }
  ];

  // Sync script state on export tab click
  const handleStepChange = async (step) => {
    // Intercept if step needs data and no data is loaded
    const needsData = (step >= 3 && step <= 11) || step === 98;
    if (needsData && !summary) {
      setShowPrereqModal(true);
      return;
    }

    if (step === 11) { // Step 11 maps to Phase 11 Export
      try {
        const response = await fetch("/api/export/script");
        if (response.ok) {
          const text = await response.text();
          setFullScript(text);
        }
      } catch (err) {
        console.error("Error fetching cleaning pipeline script", err);
      }
    }
    setActiveStep(step);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1: // Phase 1: Problem Definition
        return (
          <ChatSection
            onNextStep={() => handleStepChange(2)}
            messages={messages}
            setMessages={setMessages}
            report={report}
            setReport={setReport}
          />
        );
      case 2: // Phase 2: Load Data
        return (
          <DataProfiler
            onNextStep={() => handleStepChange(3)}
            summary={summary}
            setSummary={setSummary}
          />
        );
      case 3: // Phase 3: Clean Data
        if (!summary) return renderLoadWarning();
        return (
          <CleanPanel
            onNextStep={() => handleStepChange(4)}
            summary={summary}
            setSummary={setSummary}
          />
        );
      case 4: // Phase 4: SQL Studio
        if (!summary) return renderLoadWarning();
        return (
          <SQLStudio
            onNextStep={() => handleStepChange(5)}
            summary={summary}
          />
        );
      case 5: // Phase 5: EDA
        if (!summary) return renderLoadWarning();
        return (
          <EDA
            onNextStep={() => handleStepChange(6)}
            summary={summary}
          />
        );
      case 6: // Phase 6: Deeper Analysis
        if (!summary) return renderLoadWarning();
        return (
          <DeeperAnalysis
            onNextStep={() => handleStepChange(7)}
            summary={summary}
          />
        );
      case 7: // Phase 7: Machine Learning
        if (!summary) return renderLoadWarning();
        return (
          <MachineLearning
            onNextStep={() => handleStepChange(8)}
            summary={summary}
          />
        );
      case 8: // Phase 8: Root Cause Analysis
        if (!summary) return renderLoadWarning();
        return (
          <RCA
            onNextStep={() => handleStepChange(9)}
            summary={summary}
          />
        );
      case 9: // Phase 9: Dashboard Visualizations
        if (!summary) return renderLoadWarning();
        return (
          <ChartExplorer
            onNextStep={() => handleStepChange(10)}
            summary={summary}
          />
        );
      case 10: // Phase 10: Insights
        if (!summary) return renderLoadWarning();
        return (
          <Insights
            onNextStep={() => handleStepChange(11)}
            summary={summary}
            report={report}
          />
        );
      case 11: // Phase 11: Export & Communicate
        return renderExportRoom();
      case 97: // Case Studies
        return (
          <CaseStudies
            onLoadDemo={async (datasetKey) => {
              const res = await fetch(`/api/upload/demo/${datasetKey}`, { method: "POST" });
              if (res.ok) {
                const data = await res.json();
                setSummary(data);
                setActiveStep(2);
              }
            }}
            onNavigateStep={(step) => handleStepChange(step)}
          />
        );
      case 98: // Master Agent
        if (!summary) return renderLoadWarning();
        return <MasterAgent summary={summary} />;
      case 99: // Audit Log
        return <AuditLog />;
      default:
        return null;
    }
  };

  const renderLoadWarning = () => (
    <div className="glass-card" style={{ textAlign: "center", padding: "3.5rem", margin: "2.5rem auto", maxWidth: "550px" }}>
      <Upload size={48} style={{ color: "var(--accent-amber)", marginBottom: "1.25rem" }} />
      <h3>Dataset Connection Required</h3>
      <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.5rem" }}>
        Please upload your CSV or Excel dataset in Phase 2 before proceeding to analytical steps.
      </p>
      <button className="btn-primary" onClick={() => handleStepChange(2)} style={{ margin: "1.75rem auto 0 auto" }}>
        Go to Phase 2: Load Dataset
      </button>
    </div>
  );

  const renderExportRoom = () => {
    if (!summary) return renderLoadWarning();

    return (
      <div className="fade-in" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", overflowX: "auto" }}>
          <button 
            className={`tab-btn ${exportTab === "exports" ? "active" : ""}`} 
            onClick={() => setExportTab("exports")} 
            style={{ padding: "0.75rem 1.5rem", border: "none", borderBottom: exportTab === "exports" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: exportTab === "exports" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, whiteSpace: "nowrap" }}
          >
            <Download size={16} /> Export Hub
          </button>
          <button 
            className={`tab-btn ${exportTab === "pipeline" ? "active" : ""}`} 
            onClick={() => setExportTab("pipeline")} 
            style={{ padding: "0.75rem 1.5rem", border: "none", borderBottom: exportTab === "pipeline" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: exportTab === "pipeline" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, whiteSpace: "nowrap" }}
          >
            <Terminal size={16} /> Pipeline Preview
          </button>
          <button 
            className={`tab-btn ${exportTab === "orchestration" ? "active" : ""}`} 
            onClick={() => { setExportTab("orchestration"); fetchPipelines(); }} 
            style={{ padding: "0.75rem 1.5rem", border: "none", borderBottom: exportTab === "orchestration" ? "2px solid var(--primary-purple)" : "2px solid transparent", background: "transparent", color: exportTab === "orchestration" ? "white" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, whiteSpace: "nowrap" }}
          >
            <History size={16} /> Orchestration
          </button>
        </div>

        {/* Tab Content */}
        {exportTab === "exports" && (
          <div className="glass-card fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.75rem", margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
              <CheckCircle2 size={26} style={{ color: "var(--accent-emerald)" }} />
              <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Phase 11: Communication & Presentation</h2>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Below is the compiled data export bundle. Share the clean spreadsheet output alongside the autogenerated pandas script to maintain project reproducibility standards.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginTop: "0.5rem" }}>
              <div className="stat-item" style={{ textAlign: "center", padding: "1.75rem" }}>
                <Award size={32} style={{ color: "var(--primary-purple)", marginBottom: "0.75rem" }} />
                <h4 style={{ marginBottom: "0.5rem", color: "white" }}>Clean Spreadsheet</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                  Active dataset including all deduplications, cap caps, and custom calculated fields.
                </p>
                <a href="/api/export/csv" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", width: "100%", justifyContent: "center" }}>
                  <Download size={16} /> Download CSV
                </a>
              </div>

              <div className="stat-item" style={{ textAlign: "center", padding: "1.75rem" }}>
                <Clipboard size={32} style={{ color: "var(--secondary-cyan)", marginBottom: "0.75rem" }} />
                <h4 style={{ marginBottom: "0.5rem", color: "white" }}>Reproducible Pipeline</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                  Export the reproducible Pandas cleaning workflow.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <a href="/api/export/script" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", width: "100%", justifyContent: "center", background: "linear-gradient(135deg, var(--secondary-cyan), #0891b2)" }}>
                    <FileCode size={16} /> Download .py
                  </a>
                  <a href="/api/export/notebook" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", width: "100%", justifyContent: "center", background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                    <FileCode size={16} /> Download .ipynb
                  </a>
                </div>
              </div>

              <div className="stat-item" style={{ textAlign: "center", padding: "1.75rem" }}>
                <MessageSquare size={32} style={{ color: "var(--accent-amber)", marginBottom: "0.75rem" }} />
                <h4 style={{ marginBottom: "0.5rem", color: "var(--text-dark)" }}>Executive Summary</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                  The markdown project scoping report outlining objectives, metrics, and approach.
                </p>
                <button onClick={() => {
                  const element = document.createElement("a");
                  const markdownContent = report ? `${report.project_brief}\n\n${report.kpi_tree}\n\n${report.analytics_plan}\n\n${report.business_questions}` : "# Analytics Report\\nNo scoping report generated.";
                  const file = new Blob([markdownContent], {type: 'text/markdown'});
                  element.href = URL.createObjectURL(file);
                  element.download = "executive_summary.md";
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }} className="btn-primary" style={{ display: "inline-flex", width: "100%", justifyContent: "center", background: "linear-gradient(135deg, var(--accent-amber), #b45309)" }}>
                  <Download size={16} /> Download Report
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
              <div className="stat-item" style={{ textAlign: "center", padding: "1.75rem" }}>
                <Sparkles size={32} style={{ color: "var(--accent-emerald)", marginBottom: "0.75rem" }} />
                <h4 style={{ marginBottom: "0.5rem", color: "white" }}>Visual PDF Report</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                  Generate a printable PDF with your Executive Summary and visualizations.
                </p>
                <button onClick={() => setIsPrinting(true)} className="btn-primary" style={{ display: "inline-flex", width: "100%", justifyContent: "center", background: "linear-gradient(135deg, #10b981, #059669)" }}>
                  Generate PDF
                </button>
              </div>

              <div className="stat-item" style={{ textAlign: "center", padding: "1.75rem" }}>
                <Presentation size={32} style={{ color: "var(--accent-rose)", marginBottom: "0.75rem" }} />
                <h4 style={{ marginBottom: "0.5rem", color: "white" }}>PowerPoint Deck</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                  Export the key findings directly into a formatted .pptx slide deck.
                </p>
                <button onClick={handleExportPPTX} className="btn-primary" style={{ display: "inline-flex", width: "100%", justifyContent: "center", background: "linear-gradient(135deg, #e11d48, #be123c)" }}>
                  <Download size={16} /> Export PPTX
                </button>
              </div>

              <div className="stat-item" style={{ textAlign: "center", padding: "1.75rem" }}>
                <Share2 size={32} style={{ color: "#0ea5e9", marginBottom: "0.75rem" }} />
                <h4 style={{ marginBottom: "0.5rem", color: "white" }}>Live Share Link</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                  Generate a read-only dashboard link to share via Slack or Teams.
                </p>
                {!shareLink ? (
                    <button onClick={handleGenerateLink} className="btn-primary" style={{ display: "inline-flex", width: "100%", justifyContent: "center", background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
                      <Link size={16} /> Generate Link
                    </button>
                ) : (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input type="text" value={shareLink} readOnly style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-dark)", color: "var(--text-muted)", fontSize: "0.75rem" }} />
                        <button onClick={copyLink} className="btn-primary" style={{ padding: "0.5rem", background: linkCopied ? "var(--accent-emerald)" : "var(--primary-purple)" }}>
                            {linkCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                        </button>
                    </div>
                )}
              </div>
            </div>
          </div>
        )}

        {exportTab === "pipeline" && (
          <div className="glass-card fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", margin: 0 }}>
            <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Terminal size={18} style={{ color: "var(--primary-purple)" }} /> Python Pandas Pipeline Preview
            </h3>
            <pre className="code-preview-block" style={{ flex: 1, margin: 0, overflowY: "auto" }}>
              <code>{fullScript || "# Code is being processed..."}</code>
            </pre>
          </div>
        )}
        
        {exportTab === "orchestration" && (
          <div className="glass-card fade-in" style={{ flex: 1, display: "flex", gap: "2rem", margin: 0, overflow: "hidden" }}>
            <div style={{ flex: "0 0 350px", overflowY: "auto", paddingRight: "1rem" }}>
              <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><History size={20} style={{ color: "var(--primary-purple)" }} /> Orchestrate Pipeline</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Save your current automated cleaning workflow as a scheduled background job using standard Cron syntax.
              </p>
              <form onSubmit={handleSavePipeline} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label>Pipeline Name</label>
                  <input type="text" required value={orchForm.name} onChange={e => setOrchForm({...orchForm, name: e.target.value})} placeholder="e.g. Nightly Sales Cleaning" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input type="text" value={orchForm.description} onChange={e => setOrchForm({...orchForm, description: e.target.value})} placeholder="Optional description..." />
                </div>
                <div className="form-group">
                  <label>Cron Schedule (Optional)</label>
                  <input type="text" value={orchForm.cron} onChange={e => setOrchForm({...orchForm, cron: e.target.value})} placeholder="* * * * * (min hr day mo dow)" />
                </div>
                <button type="submit" className="btn-primary" disabled={loadingOrch} style={{ background: "linear-gradient(135deg, var(--primary-purple), #6d28d9)" }}>
                  {loadingOrch ? "Saving..." : "Save Pipeline"}
                </button>
              </form>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto" }}>
              <h4 style={{ color: "var(--text-dark)", margin: 0 }}>Saved Pipelines</h4>
              {pipelines.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--border-color)", borderRadius: "10px" }}>
                  No pipelines scheduled yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingRight: "0.5rem" }}>
                  {pipelines.map(p => (
                    <div key={p.id} style={{ background: "var(--bg-card-hover)", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                           {p.name} <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: p.status === "Success" ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)", color: p.status === "Success" ? "var(--accent-emerald)" : "var(--text-muted)" }}>{p.status}</span>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{p.description}</div>
                        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {p.cron && <span><History size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.2rem" }}/> Cron: {p.cron}</span>}
                          {p.last_run && <span>Last Run: {new Date(p.last_run).toLocaleString()}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => handleRunPipeline(p.id)} className="btn-secondary" style={{ padding: "0.4rem", borderColor: "rgba(16, 185, 129, 0.3)", color: "var(--accent-emerald)" }} title="Run Now"><Terminal size={14} /></button>
                        <button onClick={() => handleDeletePipeline(p.id)} className="btn-secondary" style={{ padding: "0.4rem", borderColor: "rgba(244, 63, 94, 0.3)", color: "var(--accent-rose)" }} title="Delete"><X size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const stepsList = [
    { num: 1, name: "Phase 1: Scope", icon: MessageSquare },
    { num: 2, name: "Phase 2: Collect", icon: Upload },
    { num: 3, name: "Phase 3: Clean", icon: Sparkles },
    { num: 4, name: "Phase 4: SQL Studio", icon: Terminal },
    { num: 5, name: "Phase 5: EDA", icon: BarChart2 },
    { num: 6, name: "Phase 6: Deep Analysis", icon: Clipboard },
    { num: 7, name: "Phase 7: ML Assistant", icon: Sparkles }, 
    { num: 8, name: "Phase 8: Root Cause", icon: Target },
    { num: 9, name: "Phase 9: Dashboard", icon: LineChart },
    { num: 10, name: "Phase 10: Insights", icon: Lightbulb },
    { num: 11, name: "Phase 11: Export", icon: Download },
  ];

  if (!isAuthenticated) {
    if (showLanding) {
      return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    }
    return <Login onLogin={(token) => { setAuthToken(token); setIsAuthenticated(true); }} onBack={() => setShowLanding(true)} />;
  }

  if (showUserGuide) {
    return (
      <div data-theme={theme}>
        <UserGuide onBack={() => setShowUserGuide(false)} />
      </div>
    );
  }

  return (
    <div className="app-container" data-theme={theme}>
      <Joyride
        steps={joyrideSteps}
        run={runTour}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={(data) => {
          const { status } = data;
          if (["finished", "skipped"].includes(status)) {
            setRunTour(false);
          }
        }}
        styles={{
          options: {
            primaryColor: '#7c3aed',
            textColor: '#1e293b',
          }
        }}
      />
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div>
          <div className="brand" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src="/logo.png" alt="VibeData Logo" style={{ width: 32, height: 32, borderRadius: "8px", objectFit: "cover" }} />
            <span className="brand-text sidebar-text">VibeData</span>
          </div>

          <nav>
            <ul className="nav-steps">
              {stepsList.map((step) => {
                const IconComponent = step.icon;
                
                return (
                  <li
                    key={step.num}
                    className={`step-item ${activeStep === step.num ? "active" : ""}`}
                    onClick={() => handleStepChange(step.num)}
                    style={{ cursor: "pointer", paddingLeft: "1rem" }}
                  >
                    <div className="step-icon-container"><IconComponent size={16} /></div>
                    <span className="sidebar-text" style={{ fontSize: "0.85rem", fontWeight: 600 }}>{step.name}</span>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem", paddingBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button onClick={() => setActiveStep(97)} className={`step-item ${activeStep === 97 ? "active" : ""}`} style={{ background: activeStep === 97 ? "rgba(139, 92, 246, 0.15)" : "transparent", border: "none", color: activeStep === 97 ? "white" : "var(--text-muted)", cursor: "pointer", paddingLeft: "1rem" }}>
              <div className="step-icon-container" style={{ color: "#a78bfa" }}><BookOpen size={16} /></div> <span className="sidebar-text" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Case Studies</span>
          </button>
          <button onClick={() => setActiveStep(99)} className="step-item" style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", paddingLeft: "1rem" }}>
              <div className="step-icon-container"><History size={16} /></div> <span className="sidebar-text" style={{ fontSize: "0.85rem", fontWeight: 600 }}>View Audit Log</span>
          </button>
          <button onClick={() => setActiveStep(98)} className="step-item" style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", paddingLeft: "1rem" }}>
              <div className="step-icon-container" style={{ color: "var(--accent-emerald)" }}><Cpu size={16} /></div> <span className="sidebar-text" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Autonomous Agent</span>
          </button>
          <button onClick={() => setRunTour(true)} className="step-item" style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", paddingLeft: "1rem" }}>
              <div className="step-icon-container" style={{ color: "var(--accent-amber)" }}><Lightbulb size={16} /></div> <span className="sidebar-text" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Replay Tour</span>
          </button>
        </div>

        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
          <div className="step-item" style={{ paddingLeft: "1rem", cursor: "default" }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--primary-purple)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "bold", marginLeft: "-4px" }}>
                DA
              </div>
            </div>
            <div className="sidebar-text" style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "opacity 0.2s" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-dark)", lineHeight: 1.2 }}>
                <p style={{ fontWeight: 600, color: "var(--text-main)" }}>Data Analyst</p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Connected</p>
              </div>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: "0.35rem", color: "var(--accent-rose)", borderColor: "rgba(225, 29, 72, 0.2)", background: "rgba(225, 29, 72, 0.05)" }} title="Logout">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-content" onClick={() => { if(isSidebarOpen) setIsSidebarOpen(false); }}>
        <header className="top-header">
          <div style={{ display: "flex", alignItems: "center" }}>
            <button className="mobile-toggle" onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(!isSidebarOpen); }}>
              <Menu size={24} />
            </button>
            <h2>
              {stepsList.find((s) => s.num === activeStep)?.name || "Phase"}
            </h2>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              onClick={() => { setShowSettingsModal(true); setTestResult(null); setSaveResult(null); }}
              style={{ background: "transparent", border: "1px solid var(--border-color)", padding: "0.5rem", borderRadius: "10px", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}
              title="Configure Gemini API Key"
              className="settings-toggle-btn"
            >
              <Settings size={18} />
            </button>
            <button 
              onClick={() => setShowUserGuide(true)}
              style={{ background: "transparent", border: "1px solid var(--border-color)", padding: "0.5rem", borderRadius: "10px", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}
              title="User Guide"
            >
              <HelpCircle size={18} />
            </button>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{ background: "transparent", border: "1px solid var(--border-color)", padding: "0.5rem", borderRadius: "10px", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "0.5rem 1rem", borderRadius: "10px", fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              Active Session
            </span>
          </div>
        </header>
 
        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {renderStepContent()}
        </main>
      </div>
       
      {/* Overlay Print Component */}
      {isPrinting && (
        <VisualReport summary={summary} report={report} onClose={() => setIsPrinting(false)} />
      )}
 
      {/* Prerequisite Modal */}
      {showPrereqModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowPrereqModal(false)}>
          <div className="glass-card fade-in" style={{ maxWidth: "450px", textAlign: "center", padding: "2.5rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: "60px", height: "60px", background: "rgba(245, 158, 11, 0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto", color: "var(--accent-amber)" }}>
              <Upload size={30} />
            </div>
            <h3 style={{ marginBottom: "0.75rem", fontSize: "1.3rem" }}>Dataset Connection Required</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "1.75rem", lineHeight: 1.5 }}>
              You need to load a dataset before accessing this phase. Please navigate to <strong>Phase 2: Load Data</strong> to upload your CSV/Excel file or connect a database.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button className="btn-secondary" onClick={() => setShowPrereqModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => { setShowPrereqModal(false); handleStepChange(2); }}>Go to Phase 2</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowSettingsModal(false)}>
          <div className="glass-card fade-in" style={{ maxWidth: "500px", width: "90%", padding: "2.5rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                <Settings size={22} style={{ color: "var(--primary-purple)" }} /> Configure Gemini API
              </h3>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              Enter your Google Gemini API Key below. This key will be verified and saved in your backend environment configuration.
            </p>

            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-main)", marginBottom: "0.5rem", display: "block" }}>
                Gemini API Key
              </label>
              <input 
                type="password" 
                value={geminiKey} 
                onChange={e => setGeminiKey(e.target.value)} 
                placeholder={keyStatus.configured ? `Currently: ${keyStatus.masked_key}` : "AIzaSy..."} 
                style={{ width: "100%", background: "var(--bg-dark)", border: "1px solid var(--border-color)", padding: "0.8rem 1rem", borderRadius: "10px", color: "white", outline: "none" }}
              />
            </div>

            <div style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Status: {keyStatus.configured ? (
                <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>Configured ({keyStatus.masked_key})</span>
              ) : (
                <span style={{ color: "var(--accent-rose)", fontWeight: 600 }}>Not Configured</span>
              )}
            </div>

            {testResult && (
              <div style={{ 
                padding: "0.8rem 1rem", 
                borderRadius: "8px", 
                marginBottom: "1.5rem", 
                fontSize: "0.85rem", 
                background: testResult.success ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${testResult.success ? "var(--accent-emerald)" : "var(--accent-rose)"}`,
                color: testResult.success ? "var(--accent-emerald)" : "var(--accent-rose)"
              }}>
                {testResult.message}
              </div>
            )}

            {saveResult && (
              <div style={{ 
                padding: "0.8rem 1rem", 
                borderRadius: "8px", 
                marginBottom: "1.5rem", 
                fontSize: "0.85rem", 
                background: saveResult.success ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${saveResult.success ? "var(--accent-emerald)" : "var(--accent-rose)"}`,
                color: saveResult.success ? "var(--accent-emerald)" : "var(--accent-rose)"
              }}>
                {saveResult.message}
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button 
                className="btn-secondary" 
                onClick={handleTestKey} 
                disabled={isTestingKey || !geminiKey || isSavingKey}
                style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem" }}
              >
                {isTestingKey ? "Testing..." : "Test Connection"}
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSaveKey} 
                disabled={isSavingKey || !geminiKey || isTestingKey}
                style={{ padding: "0.6rem 1.5rem", fontSize: "0.9rem" }}
              >
                {isSavingKey ? "Saving..." : "Save Key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
