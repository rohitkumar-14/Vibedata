import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowRight, Database, Sparkles, LineChart, Download, ShieldCheck, Zap, 
  Activity, Terminal, Cpu, FileCode, CheckCircle2, BarChart2, Target, 
  Upload, MessageSquare, Lightbulb, Clipboard, GitBranch, Eye, 
  ChevronRight, Star, Globe, Lock, Layers, TrendingUp, HelpCircle, MapPin, 
  Calendar, Check, FileText, ChevronDown, User, Code, Briefcase, Plus, Minus
} from "lucide-react";

/* ── Animated counter hook ────────────────────────────────── */
function useCounter(end, duration = 2000) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const step = end / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= end) { setVal(end); clearInterval(timer); }
            else setVal(Math.floor(start));
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return { val, ref };
}

/* ── Main Component ───────────────────────────────────────── */
export default function LandingPage({ onGetStarted }) {
  const [activeDemo, setActiveDemo] = useState(0);
  const [activeUseCase, setActiveUseCase] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [isVisible, setIsVisible] = useState({});
  const cursorRef = useRef(null);

  // Cursor follower
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.landing-animate').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const stat1 = useCounter(11);
  const stat2 = useCounter(50);
  const stat3 = useCounter(100);

  const demoPhases = [
    {
      title: "AI Business Scoping",
      phaseNum: "Phase 01",
      desc: "Convert high-level business queries into standard analytical criteria. Define target metrics, build a KPI Tree, and construct a logical testing plan using natural conversation.",
      icon: <MessageSquare size={18} />,
      color: "#8b5cf6",
      accentBg: "rgba(139, 92, 246, 0.1)",
      preview: (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.75rem", fontWeight: "bold" }}>U</div>
            <div style={{ background: "rgba(255,255,255,0.04)", padding: "0.75rem 1rem", borderRadius: "0 12px 12px 12px", fontSize: "0.8rem", border: "1px solid rgba(255,255,255,0.06)", maxWidth: "80%" }}>
              "Help me analyze why customer churn has spiked in our European region."
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", flexDirection: "row-reverse" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.75rem", fontWeight: "bold" }}>AI</div>
            <div style={{ background: "rgba(139,92,246,0.08)", padding: "0.75rem 1rem", borderRadius: "12px 0 12px 12px", fontSize: "0.8rem", border: "1px solid rgba(139,92,246,0.2)", maxWidth: "80%", lineHeight: 1.45 }}>
              <strong>Analytic Scope Prepared:</strong>
              <div style={{ marginTop: "0.5rem", paddingLeft: "0.75rem", borderLeft: "2px solid #8b5cf6", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span>🎯 Target metric: <code>churn_rate</code></span>
                <span>💡 Hypothesis: Poor feature adoption & contract type</span>
                <span>🌳 KPI Tree branch: Account Management</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "One-Click Data Cleaning",
      phaseNum: "Phase 03",
      desc: "Instantly check for anomalies, duplicate records, null entries, and extreme outliers. Apply immediate data imputations or log capping rules with built-in reproducibility.",
      icon: <Sparkles size={18} />,
      color: "#f59e0b",
      accentBg: "rgba(245, 158, 11, 0.1)",
      preview: (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", height: "100%", justifyContent: "center" }}>
          <div style={{ display: "flex", justifycontent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
            <span>Auto-clean Scan Progress</span>
            <span style={{ color: "#10b981" }}>Complete</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden", marginBottom: "0.5rem" }}>
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, #f59e0b, #10b981)", borderRadius: 3 }} />
          </div>
          {[
            { label: "Missing values in 'Age'", action: "Imputed via Median (32)", color: "#f59e0b" },
            { label: "18 Outliers in 'TransactionValue'", action: "Capped at 99th Percentile", color: "#10b981" },
            { label: "Duplicated user IDs detected", action: "Removed 28 duplicate records", color: "#3b82f6" }
          ].map((item, idx) => (
            <div key={idx} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "0.6rem 0.85rem", fontSize: "0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{item.label}</span>
              <span style={{ color: item.color, fontWeight: 600, fontSize: "0.72rem", background: "rgba(255,255,255,0.02)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>{item.action}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Predictive Forecasting",
      phaseNum: "Phase 07",
      desc: "Perform time-series projections using state-of-the-art Holt-Winters Exponential Smoothing. Specify forecast periods and visualize trends directly inside the interface.",
      icon: <LineChart size={18} />,
      color: "#06b6d4",
      accentBg: "rgba(6, 182, 212, 0.1)",
      preview: (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
            <span>Holt-Winters Projections (Sales)</span>
            <span style={{ color: "#06b6d4" }}>Confidence Interval: 95%</span>
          </div>
          <div style={{ flex: 1, position: "relative", minHeight: "150px", display: "flex", alignItems: "flex-end", paddingBottom: "10px" }}>
            <svg viewBox="0 0 300 120" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M 0 90 Q 30 70 60 85 T 120 50 T 180 60 L 180 120 L 0 120 Z" fill="url(#chartGlow)" />
              <path d="M 0 90 Q 30 70 60 85 T 120 50 T 180 60" fill="none" stroke="#6366f1" strokeWidth="2.5" />
              
              <path d="M 180 60 Q 210 50 240 40 T 300 20 L 300 120 L 180 120 Z" fill="rgba(6, 182, 212, 0.08)" />
              <path d="M 180 60 Q 210 50 240 40 T 300 20" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="4 3" />
              
              <line x1="180" y1="10" x2="180" y2="120" stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" />
              <text x="185" y="15" fill="var(--text-muted)" fontSize="8">Forecast Start</text>
            </svg>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            <span>Jan - Jun (Actual)</span>
            <span style={{ color: "#06b6d4" }}>Jul - Dec (Forecasted)</span>
          </div>
        </div>
      )
    },
    {
      title: "Geospatial Analytics",
      phaseNum: "Phase 09",
      desc: "Map coordinate-based points (Latitude & Longitude) interactively on a built-in CartoDB dark canvas, highlighting location-based distribution metrics and client hotspots.",
      icon: <Globe size={18} />,
      color: "#10b981",
      accentBg: "rgba(16, 185, 129, 0.1)",
      preview: (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
            <span>Geospatial Hotspots Map</span>
            <span style={{ fontSize: "0.7rem", color: "#10b981" }}>● Active Map Rendering</span>
          </div>
          <div style={{ flex: 1, position: "relative", minHeight: "150px", overflow: "hidden", borderRadius: "6px", background: "#0c0c10", border: "1px solid rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", height: "100%", opacity: 0.15, position: "absolute", backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "15px 15px" }} />
            
            <div style={{ relative: "absolute", width: "80%", height: "80%" }}>
              <div style={{ position: "absolute", top: "30%", left: "40%", width: 22, height: 22, background: "rgba(16, 185, 129, 0.2)", borderRadius: "50%", border: "1px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 6, height: 6, background: "#10b981", borderRadius: "50%", animation: "ping 1.5s infinite" }} />
              </div>
              <div style={{ position: "absolute", top: "50%", left: "60%", width: 34, height: 34, background: "rgba(16, 185, 129, 0.15)", borderRadius: "50%", border: "1px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 8, height: 8, background: "#10b981", borderRadius: "50%" }} />
              </div>
            </div>
            
            <div style={{ position: "absolute", bottom: "10px", right: "10px", background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "0.4rem 0.6rem", fontSize: "0.68rem" }}>
              <strong>Point #482</strong><br/>
              Lat: 51.5074 | Lon: -0.1278
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Executable Pipeline Exports",
      phaseNum: "Phase 11",
      desc: "Never lose a step. Download your processed datasets or download an autogenerated Python script file that reproduces the entire cleaning, mapping, and model flow in pure Pandas code.",
      icon: <Download size={18} />,
      color: "#8b5cf6",
      accentBg: "rgba(139, 92, 246, 0.1)",
      preview: (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", height: "100%", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
            <FileCode size={16} color="#8b5cf6" />
            <span>vibedata_pipeline.py</span>
          </div>
          <pre style={{ background: "rgba(0,0,0,0.3)", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)", margin: 0, fontSize: "0.7rem", lineHeight: 1.4, color: "#a78bfa", fontFamily: "monospace", overflow: "hidden" }}>
{`# VibeData Pipeline Engine
import pandas as pd

df = pd.read_csv('source.csv')
# Impute Age Column
df['Age'] = df['Age'].fillna(df['Age'].median())
# Cap Outliers
df['Value'] = df['Value'].clip(upper=df['Value'].quantile(0.99))
`}
          </pre>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn-primary" style={{ flex: 1, padding: "0.45rem", fontSize: "0.75rem", background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>Download script.py</button>
          </div>
        </div>
      )
    }
  ];

  const valueProps = [
    { icon: <Database size={20} />, title: "Relational Modeling", desc: "Easily load multiple spreadsheets and combine them with visual Joins, Merges, and Unions without touching SQL code." },
    { icon: <Zap size={20} />, title: "Real-time AI Scoping", desc: "No more planning in Google Docs. Talk directly to the AI Assistant to scope KPIs and generate target hypotheses." },
    { icon: <GitBranch size={20} />, title: "Full Code Portability", desc: "Download clean Python scripts that replicate your exact data manipulations. Take your pipeline anywhere." },
    { icon: <Globe size={20} />, title: "Interactive Geospatial Maps", desc: "Identify regional hotspots instantly by converting Coordinate columns to active dark-themed map pins." },
    { icon: <TrendingUp size={20} />, title: "Auto Holt-Winters Model", desc: "Apply complex statistical forecasting algorithms (Holt-Winters / ARIMA) with a single click in the UI." },
    { icon: <ShieldCheck size={20} />, title: "2-Hour Autoclean Guard", desc: "No local data is kept forever. Stored data and cookies automatically self-clean after 2 hours of inactivity." }
  ];

  const useCases = [
    {
      title: "Data Analysts",
      icon: <User size={22} />,
      desc: "Accelerate exploratory data analysis from hours to seconds. Get automated distributions, heatmaps, and clean charts.",
      bulletPoints: [
        "Eliminate boilerplate data loading code.",
        "Interactive pivot tables and correlation matrices in one click.",
        "Auto-generate clean charts using simple drag-and-drop actions."
      ]
    },
    {
      title: "Analytics Engineers",
      icon: <Code size={22} />,
      desc: "Connect multiple tables and convert complex visual operations into robust, version-controlled SQL or Pandas scripts.",
      bulletPoints: [
        "Visual database joins, merges, and unions.",
        "Automatic Python pipeline logging for local environments.",
        "Full support for custom SQL queries directly against memory arrays."
      ]
    },
    {
      title: "Business Leaders",
      icon: <Briefcase size={22} />,
      desc: "Map problems directly to metric goals. Build structured presentation decks and share summaries with shareholders.",
      bulletPoints: [
        "Scoping chat translate goals into actionable trees.",
        "Instant PPTX slide exports.",
        "Self-contained visual PDF summaries for quick distribution."
      ]
    }
  ];

  const pricingPlans = [
    {
      name: "Community Edition",
      price: "$0",
      desc: "Ideal for individual analysts, students, and open-source data modeling.",
      features: [
        "Full 11-Phase Analytics Workspace",
        "Upload files up to 50MB",
        "One-Click Data Auto-Cleaning",
        "Interactive Charts & Maps",
        "Download clean Python scripts",
        "Local execution (data stays in browser)"
      ],
      ctaText: "Launch Local Workspace",
      popular: false
    },
    {
      name: "Cloud Professional",
      price: "$49",
      period: "/mo",
      desc: "For corporate analysts and engineers seeking cloud collaboration and AI tooling.",
      features: [
        "Everything in Community, plus:",
        "Unlimited file upload capacity",
        "Relational Database connector integrations",
        "Persistent secure cloud workspace",
        "Advanced LLM Scoping and Autocomplete",
        "Teams Live Collaboration Sharing Links"
      ],
      ctaText: "Start 14-Day Trial",
      popular: true
    }
  ];

  const faqItems = [
    {
      question: "Is my data stored on VibeData's servers?",
      answer: "No. The Community Edition of VibeData operates on a strict client-side model. All file processing, mathematical forecasting, and database operations are executed within your local session memory. Nothing is uploaded to our servers without your explicit action."
    },
    {
      question: "How does the reproducible Python pipeline work?",
      answer: "As you apply data cleaning rules (like removing nulls or capping outliers), VibeData records the logical step. It automatically constructs a clean Python script using standard Pandas code that matches these steps, allowing you to run the exact same workflow locally in your own IDE."
    },
    {
      question: "What forecasting models are built into the tool?",
      answer: "VibeData implements the Holt-Winters Exponential Smoothing algorithm via statsmodels. It automatically handles date-level aggregation, trend evaluation, and seasonality adjustments to output solid forecasts with 95% confidence intervals."
    },
    {
      question: "Why does the application self-clean after 2 hours of inactivity?",
      answer: "To protect your company data and conserve browser memory, VibeData implements an automatic session guard. If no mouse or keyboard inputs are logged for 2 hours, all local storage, temporary states, and active data tables are securely wiped."
    }
  ];

  return (
    <div className="landing-container" style={{ position: "relative" }}>
      {/* Background Grid Pattern */}
      <div style={{ 
        position: "absolute", 
        top: 0, left: 0, right: 0, bottom: 0, 
        zIndex: 0, 
        pointerEvents: "none",
        backgroundImage: "linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)", 
        backgroundSize: "40px 40px" 
      }} />

      {/* Floating blur background orbs */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      
      {/* Interactive Cursor Follower */}
      <div ref={cursorRef} style={{ position: "fixed", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 1, transform: "translate(-50%, -50%)", transition: "left 0.15s ease-out, top 0.15s ease-out" }} />
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.05) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />

      {/* ─── Navbar ─── */}
      <nav className="landing-nav fade-in" style={{ position: "sticky", top: 0, backdropFilter: "blur(20px)", background: "rgba(9,9,11,0.75)", zIndex: 100, borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem 6%" }}>
        <div className="brand" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img src="/logo.png" alt="VibeData Logo" style={{ width: 32, height: 32, borderRadius: "8px", objectFit: "cover" }} />
          <span className="brand-text" style={{ fontSize: "1.2rem" }}>VibeData</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button className="btn-secondary" onClick={onGetStarted} style={{ padding: "0.6rem 1.25rem", border: "1px solid rgba(255,255,255,0.05)", background: "transparent" }}>Sign In</button>
          <button className="btn-primary" onClick={onGetStarted} style={{ padding: "0.6rem 1.5rem" }}>
            Get Started <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      <main className="landing-main" style={{ zIndex: 10 }}>

        {/* ─── Hero Section ─── */}
        <section className="hero-section fade-in" style={{ padding: "8rem 0 5rem 0" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(139,92,246,0.08)", color: "#a78bfa", padding: "0.45rem 1rem", borderRadius: "100px", fontSize: "0.8rem", fontWeight: 600, marginBottom: "2rem", border: "1px solid rgba(139,92,246,0.2)" }}>
            <Sparkles size={13} /> Enterprise Intelligence Engine
          </div>

          <h1 className="hero-title" style={{ maxWidth: "900px", margin: "0 auto 1.5rem auto", fontWeight: 800 }}>
            From Messy Spreadsheets to{" "}
            <span style={{ background: "linear-gradient(135deg, #a78bfa, #22d3ee, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundSize: "200% 200%" }}>
              Executable Pipelines
            </span>
          </h1>

          <p className="hero-subtitle" style={{ maxWidth: "700px", margin: "0 auto 3rem auto" }}>
            VibeData is a comprehensive analytics suite that structures raw spreadsheets into sequential, reproducible data pipelines. Run statistical models, clean fields, write SQL queries, and generate presentation slides — backed by automatic Python logs.
          </p>

          <div className="hero-cta" style={{ justifyContent: "center" }}>
            <button className="btn-primary btn-large glow-effect" onClick={onGetStarted}>
              Launch Free Workspace <ArrowRight size={18} />
            </button>
            <a href="#demo" className="btn-secondary btn-large" style={{ textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              Explore Interactive Tour <ChevronDown size={18} />
            </a>
          </div>

          {/* Trust indicators */}
          <div className="hero-trust" style={{ marginTop: "2rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Check size={14} color="#10b981" /> No Credit Card Required</span>
            <span style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Check size={14} color="#10b981" /> 2-Hour Auto-clean Lock</span>
            <span style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Check size={14} color="#10b981" /> Full Code Export</span>
          </div>
        </section>

        {/* ─── Stats Section ─── */}
        <section className="landing-animate" id="stats" style={{ padding: "2rem 0", marginBottom: "4rem", opacity: isVisible['stats'] ? 1 : 0, transform: isVisible['stats'] ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
            <div ref={stat1.ref} style={{ padding: "1rem" }}>
              <div style={{ fontSize: "3rem", fontWeight: 800, color: "#8b5cf6" }}>{stat1.val}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>Structured Steps</div>
            </div>
            <div ref={stat2.ref} style={{ padding: "1rem", borderLeft: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "3rem", fontWeight: 800, color: "#06b6d4" }}>{stat2.val}+</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>Operations Logged</div>
            </div>
            <div ref={stat3.ref} style={{ padding: "1rem" }}>
              <div style={{ fontSize: "3rem", fontWeight: 800, color: "#10b981" }}>{stat3.val}%</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>Python Replicability</div>
            </div>
          </div>
        </section>

        {/* ─── Interactive Playground / Product Tour ─── */}
        <section id="demo" className="landing-animate" style={{ padding: "5rem 0", opacity: isVisible['demo'] ? 1 : 0, transform: isVisible['demo'] ? "translateY(0)" : "translateY(40px)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "2.5rem", marginBottom: "0.75rem", fontWeight: 700 }}>Interactive Platform Showcase</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto", fontSize: "1.05rem" }}>
              Click through the pipeline stages below to preview how VibeData manages your raw files.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem", background: "rgba(24, 24, 27, 0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "24px", overflow: "hidden", minHeight: "450px", backdropFilter: "blur(20px)", boxShadow: "0 30px 60px rgba(0, 0, 0, 0.4)" }}>
            
            {/* Sidebar navigation for demo */}
            <div style={{ padding: "2rem", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.05em", marginBottom: "1rem" }}>Pipeline Steps</div>
              {demoPhases.map((phase, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveDemo(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem",
                    borderRadius: "12px",
                    background: activeDemo === idx ? "rgba(255,255,255,0.04)" : "transparent",
                    border: "1px solid",
                    borderColor: activeDemo === idx ? "rgba(255,255,255,0.08)" : "transparent",
                    color: activeDemo === idx ? "white" : "var(--text-muted)",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.25s ease"
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "8px", 
                    background: activeDemo === idx ? phase.color + "15" : "rgba(255,255,255,0.02)", 
                    color: activeDemo === idx ? phase.color : "var(--text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.25s ease"
                  }}>
                    {phase.icon}
                  </div>
                  <div>
                    <span style={{ fontSize: "0.68rem", display: "block", color: phase.color, fontWeight: "bold" }}>{phase.phaseNum}</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{phase.title}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Content view of active demo */}
            <div style={{ padding: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "rgba(0,0,0,0.15)" }}>
              <div>
                <h3 style={{ fontSize: "1.5rem", color: "white", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: demoPhases[activeDemo].color }}>●</span> {demoPhases[activeDemo].title}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                  {demoPhases[activeDemo].desc}
                </p>
              </div>

              <div style={{ flex: 1, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "16px", padding: "1.5rem", minHeight: "220px", display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "inset 0 4px 20px rgba(0,0,0,0.3)" }}>
                {demoPhases[activeDemo].preview}
              </div>
            </div>

          </div>
        </section>

        {/* ─── Use Cases / Solutions Section ─── */}
        <section id="solutions" className="landing-animate" style={{ padding: "5rem 0", opacity: isVisible['solutions'] ? 1 : 0, transform: isVisible['solutions'] ? "translateY(0)" : "translateY(40px)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "2.5rem", marginBottom: "0.75rem", fontWeight: 700 }}>Tailored to Your Workflow</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "550px", margin: "0 auto", fontSize: "1.05rem" }}>
              See how VibeData fits into different roles across your engineering and analytical team.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem", background: "rgba(24, 24, 27, 0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "24px", overflow: "hidden", minHeight: "350px", backdropFilter: "blur(20px)" }}>
            
            {/* Left selector */}
            <div style={{ padding: "2rem", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {useCases.map((useCase, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveUseCase(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem",
                    borderRadius: "12px",
                    background: activeUseCase === idx ? "rgba(139, 92, 246, 0.08)" : "transparent",
                    border: "1px solid",
                    borderColor: activeUseCase === idx ? "rgba(139, 92, 246, 0.2)" : "transparent",
                    color: activeUseCase === idx ? "white" : "var(--text-muted)",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.25s ease"
                  }}
                >
                  <div style={{ color: activeUseCase === idx ? "#a78bfa" : "var(--text-muted)" }}>
                    {useCase.icon}
                  </div>
                  <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>{useCase.title}</span>
                </button>
              ))}
            </div>

            {/* Right details */}
            <div style={{ padding: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h3 style={{ fontSize: "1.6rem", color: "white", marginBottom: "0.75rem" }}>{useCases[activeUseCase].title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                {useCases[activeUseCase].desc}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {useCases[activeUseCase].bulletPoints.map((bp, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.9rem", color: "var(--text-main)" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", flexShrink: 0 }}>
                      <Check size={10} />
                    </div>
                    {bp}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ─── Features Grid Section ─── */}
        <section id="features" className="landing-animate" style={{ padding: "5rem 0", opacity: isVisible['features'] ? 1 : 0, transform: isVisible['features'] ? "translateY(0)" : "translateY(40px)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "2.5rem", marginBottom: "0.75rem", fontWeight: 700 }}>Robust Enterprise Infrastructure</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "550px", margin: "0 auto", fontSize: "1.05rem" }}>
              Explore structural features designed to handle large-scale corporate data safely.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {valueProps.map((prop, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "20px",
                  padding: "2rem",
                  transition: "all 0.3s ease",
                  cursor: "default"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(139, 92, 246, 0.03)";
                  e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.2)";
                  e.currentTarget.style.transform = "translateY(-5px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: "12px",
                  background: "rgba(139, 92, 246, 0.08)",
                  color: "#a78bfa",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "1.25rem"
                }}>
                  {prop.icon}
                </div>
                <h4 style={{ fontSize: "1.1rem", color: "white", marginBottom: "0.5rem", fontWeight: 600 }}>{prop.title}</h4>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{prop.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Pricing Section ─── */}
        <section id="pricing" className="landing-animate" style={{ padding: "5rem 0", opacity: isVisible['pricing'] ? 1 : 0, transform: isVisible['pricing'] ? "translateY(0)" : "translateY(40px)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "2.5rem", marginBottom: "0.75rem", fontWeight: 700 }}>Flexible Pricing Structures</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "550px", margin: "0 auto", fontSize: "1.05rem" }}>
              Work locally for free or scale your collaborative metrics dashboard with team sharing keys.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem", maxWidth: "900px", margin: "0 auto" }}>
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(24, 24, 27, 0.4)",
                  border: plan.popular ? "2px solid #8b5cf6" : "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "24px",
                  padding: "3rem 2.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  backdropFilter: "blur(20px)",
                  transform: plan.popular ? "scale(1.03)" : "none",
                  boxShadow: plan.popular ? "0 20px 40px var(--primary-purple-glow)" : "none"
                }}
              >
                {plan.popular && (
                  <span style={{ position: "absolute", top: -12, right: 24, background: "#8b5cf6", color: "white", padding: "0.3rem 0.85rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Most Popular
                  </span>
                )}
                <div>
                  <h4 style={{ fontSize: "1.25rem", color: "white", marginBottom: "1rem" }}>{plan.name}</h4>
                  <div style={{ display: "flex", alignItems: "baseline", marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "3rem", fontWeight: 800, color: "white", fontFamily: "Outfit" }}>{plan.price}</span>
                    {plan.period && <span style={{ color: "var(--text-muted)", marginLeft: "0.25rem" }}>{plan.period}</span>}
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "2rem" }}>{plan.desc}</p>
                  
                  <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.06)", marginBottom: "2rem" }} />
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "3rem" }}>
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} style={{ display: "flex", gap: "0.75rem", fontSize: "0.88rem", color: "var(--text-main)" }}>
                        <Check size={16} style={{ color: "#10b981", flexShrink: 0 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={onGetStarted}
                  className={plan.popular ? "btn-primary glow-effect" : "btn-secondary"}
                  style={{ width: "100%", padding: "1rem" }}
                >
                  {plan.ctaText}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FAQ Section ─── */}
        <section id="faq" className="landing-animate" style={{ padding: "5rem 0", opacity: isVisible['faq'] ? 1 : 0, transform: isVisible['faq'] ? "translateY(0)" : "translateY(40px)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "2.5rem", marginBottom: "0.75rem", fontWeight: 700 }}>Common Questions</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "550px", margin: "0 auto", fontSize: "1.05rem" }}>
              Find quick answers regarding session security, pipeline execution, and local calculations.
            </p>
          </div>

          <div style={{ maxWidth: "750px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {faqItems.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(24, 24, 27, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  transition: "all 0.3s ease"
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: "100%",
                    padding: "1.5rem 2rem",
                    background: "transparent",
                    border: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    color: "white",
                    textAlign: "left"
                  }}
                >
                  <span style={{ fontSize: "1.05rem", fontWeight: 600 }}>{faq.question}</span>
                  {openFaq === idx ? (
                    <Minus size={18} style={{ color: "#a78bfa" }} />
                  ) : (
                    <Plus size={18} style={{ color: "var(--text-muted)" }} />
                  )}
                </button>
                
                {/* Expandable answers using simple rendering */}
                {openFaq === idx && (
                  <div style={{ padding: "0 2rem 2rem 2rem", color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6, borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "1rem" }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── Final Call-To-Action ─── */}
        <section id="cta" className="landing-animate" style={{ padding: "5rem 0 7rem 0", opacity: isVisible['cta'] ? 1 : 0, transform: isVisible['cta'] ? "translateY(0)" : "translateY(40px)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.06))",
            border: "1px solid rgba(139,92,246,0.15)",
            borderRadius: "28px",
            padding: "4.5rem 2rem",
            maxWidth: "900px",
            margin: "0 auto",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <Sparkles size={32} style={{ color: "#a78bfa", marginBottom: "1.5rem" }} />
            <h2 style={{ fontSize: "2.25rem", color: "white", marginBottom: "1rem", fontWeight: 700 }}>Ready to Build Your First Data Pipeline?</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "600px", lineHeight: 1.6, marginBottom: "2.5rem", fontSize: "1.05rem" }}>
              Instantly connect datasets and scope business problems with AI. No long onboarding, no credit cards required.
            </p>
            <button className="btn-primary btn-large glow-effect" onClick={onGetStarted} style={{ padding: "1.1rem 3rem" }}>
              Start Free Analysis <ArrowRight size={18} />
            </button>
            
            <div style={{ display: "flex", gap: "2rem", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "2.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><ShieldCheck size={16} /> No credit card required</span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Zap size={16} /> Instant session startup</span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Lock size={16} /> Data is secured locally</span>
            </div>
          </div>
        </section>

      </main>

      {/* ─── Footer Section ─── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "4rem 6% 3rem 6%", background: "#060608", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "3rem", maxWidth: "1200px", margin: "0 auto" }}>
          
          <div style={{ maxWidth: "320px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <img src="/logo.png" alt="VibeData Logo" style={{ width: 28, height: 28, borderRadius: "6px", objectFit: "cover" }} />
              <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "white" }}>VibeData</span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
              AI-driven data analytics suite. Streamlining unstructured tables into reproducible operations.
            </p>
          </div>

          <div style={{ display: "flex", gap: "4rem", flexWrap: "wrap" }}>
            <div>
              <h5 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "white", marginBottom: "1rem" }}>Features</h5>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {["Conversational Scope", "Clean Panel", "SQL Studio", "Holt-Winters Forecast", "Geospatial Maps"].map(t => (
                  <li key={t}><a href="#demo" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "white"} onMouseLeave={e => e.target.style.color = "var(--text-muted)"}>{t}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h5 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "white", marginBottom: "1rem" }}>System</h5>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {["Documentation", "API Specifications", "Release Changelog", "Technical Support"].map(t => (
                  <li key={t}><a href="#" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "white"} onMouseLeave={e => e.target.style.color = "var(--text-muted)"}>{t}</a></li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "3rem", paddingTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1200px", margin: "3rem auto 0 auto", flexWrap: "wrap", gap: "1.5rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>© 2026 VibeData Enterprise. All rights reserved.</p>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {["Security Auditing", "Terms of Use", "Privacy Policy"].map(t => (
              <a key={t} href="#" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "white"} onMouseLeave={e => e.target.style.color = "var(--text-muted)"}>{t}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* ─── Inline Custom Keyframes ─── */}
      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          70%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

    </div>
  );
}
