import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, BookOpen, Layers, Sparkles, LineChart, Download, ShieldAlert, Cpu, Award } from 'lucide-react';

const markdownContent = `
# VibeData: Comprehensive User Guide

Welcome to **VibeData**, your enterprise-grade, end-to-end data analytics platform. This guide will walk you through every step of the data analysis pipeline, from uploading your first dataset to generating advanced machine learning forecasts.

---

## 🚀 Getting Started (Phase 1: Upload)

### 1. Uploading Data
* **Supported Formats:** \`.csv\`, \`.xlsx\`, \`.xls\`, \`.json\`, \`.parquet\`.
* **Action:** Drag and drop your file into the upload zone or click to browse.
* **Caution:** Ensure your data is well-formatted (e.g., header row on top). Large files (>50MB) may take a few moments to process depending on your machine's capabilities.
* **Demo Databases:** In the **Database & Cloud Connections** tab, VibeData comes preloaded with two local demo databases:
  1. **Demo Retail SQLite DB:** A relational retail store database containing \`customers\` (with location data), \`products\`, and \`orders\`. Perfect for testing joins and geospatial mapping.
  2. **Demo Marketing Analytics:** A marketing performance database containing \`campaigns\` and daily campaign \`performance\` logs. Ideal for forecasting and advertising metrics.
* **Demo Datasets:** In the **Local File** tab, you can select from three one-click demo datasets:
  1. **Retail Sales & Customer Map:** A transactional sales sheet with country, latitude, and longitude fields.
  2. **Product Reviews & Sentiment:** A feedback table with ratings and review text for NLP/Sentiment analysis.
  3. **Daily SaaS Business Metrics:** A chronological day-by-day business health sheet for time-series forecasting.
* **Mock Data:** If you want custom simulated data, click **"Use Mock Database"** or **"Use Mock API Data"** to practice with simulated enterprise data.

---

## 🧹 Data Cleaning & Preparation (Phases 2 & 3: Clean Panel)

Data quality is the foundation of good analytics. The Clean panel provides a robust suite of tools.

### 1. Data Merging (Relational Data)
* **What it does:** Allows you to combine a secondary dataset with your primary one (e.g., merging \`Sales\` and \`Customers\`).
* **Steps:**
  1. Go to the **Merge Datasets** tab.
  2. Upload your secondary dataset.
  3. Select the **Left Join Key** (from your primary data) and **Right Join Key** (from your secondary data).
  4. Choose your **Join Type** (Inner, Left, Right, Outer).
  5. Click **Execute Merge**.
* **Caution:** Always ensure the join keys share the same data type (e.g., both are Strings or both are Integers) to avoid empty results.

### 2. General Data Cleaning
* **Steps:**
  1. Select a specific column from the dropdown.
  2. Choose a cleaning operation (e.g., *Impute Nulls*, *Handle Outliers*, *Change Datatype*).
  3. Provide any required parameters (e.g., imputation method).
  4. Click **Apply Cleaning**.
* **Tip:** The system maintains a full history of your actions. If you make a mistake, you can always click the **Undo** button in the top right corner.

---

## 🔍 Data Exploration (Phase 5: EDA & Dashboards)

Visualize your data to uncover hidden trends.

### 1. AI Dashboard Generation
* **What it does:** Uses LLM (Large Language Models) to automatically build a custom dashboard based on your prompt.
* **Steps:**
  1. In the **Chart Explorer**, ensure the **AI Dashboard Agent** tab is active.
  2. Type a prompt (e.g., *"Show me sales over time and a breakdown of revenue by region"*).
  3. Click **Build Dashboard**.
* **Caution:** The AI bases its charts on the data schema. Be specific about the column names you want visualized for the best results.

### 2. Manual Builder & Geospatial Mapping
* **Steps:**
  1. Switch to the **Manual Builder** tab.
  2. Select your **X-Axis** (Dimension) and **Y-Axis** (Metric).
  3. The system will automatically generate Bar, Line, Area, and Scatter charts.
* **Geospatial Mapping:** 
  * If your data contains Latitude and Longitude columns, select them as your X and Y axes. 
  * The system will automatically generate a **Geospatial Map** widget plotting your points interactively.
* **Caution:** Ensure Latitude and Longitude columns are strictly numeric.

---

## 🤖 Advanced Analytics & Machine Learning (Phase 7)

VibeData offers powerful predictive and diagnostic ML tools out-of-the-box.

### 1. Feature Importance
* **What it does:** Uses a Random Forest algorithm to determine which columns have the biggest impact on a specific target metric.
* **Steps:** Select your Target Column and run the analysis.
* **Caution:** Works best when you have multiple numeric columns and one clear target (like \`sales\` or \`churn\`).

### 2. K-Means Clustering
* **What it does:** Groups your data into \`K\` distinct clusters based on similarities.
* **Steps:** Select an X-axis, a Y-axis, and the number of clusters (K).
* **Tip:** Use this to segment your customers (e.g., X = \`Age\`, Y = \`LTV\`).

### 3. Time-Series Forecasting (ARIMA / Holt-Winters)
* **What it does:** Predicts future trends based on historical data.
* **Steps:**
  1. Select a **Date/Time** column.
  2. Select a **Value** column (e.g., \`Revenue\`).
  3. Input the number of periods (steps) you want to forecast into the future.
  4. Click **Generate Forecast**.
* **Caution:** Your dataset *must* contain a valid Date or Datetime column. Forecasting requires a minimum of 10 historical data points to function properly.

### 4. Text & NLP Sentiment Analysis
* **What it does:** Analyzes text data to determine if the sentiment is Positive, Neutral, or Negative.
* **Steps:** Select a text column (e.g., \`customer_reviews\`) and click **Run Sentiment Analysis**.
* **Outputs:** A distribution chart and a breakdown of the top positive and negative themes (keywords).
* **Caution:** Processing very large text columns can be slow. The system automatically samples the first 1,000 rows to ensure performance.

---

## 💾 Exporting & Reproducibility (Phase 11)

VibeData doesn't lock you in. You can always export your work.

* **Export Cleaned Data:** Download your processed dataset as a \`.csv\`.
* **Export Python Script:** Download an executable \`.py\` file containing the exact Pandas code required to replicate every single cleaning and merge step you performed in the UI. Perfect for data engineers looking to automate your pipeline!

---

## ⚠️ General Best Practices & Cautions

1. **Session Timeout:** For security and performance, your data (Cookies/LocalStorage) may clear automatically after extended periods of inactivity. Always export your Python script or cleaned data if you plan to step away for more than 2 hours.
2. **Data Privacy:** While VibeData is robust, avoid uploading highly sensitive PII (Personally Identifiable Information) unless your environment is properly secured and compliant with your organization's data policies.
3. **Browser Performance:** Heavy computations (like rendering thousands of map points) rely on your browser's memory. If the UI feels sluggish, try using the **Data Sample Limit** slider in the EDA tab to reduce the rendering load.
`;

const evaluationContentPart1 = `
# VibeData Platform Evaluation: Analytical Lifecycle & Algorithmic Gap Analysis
*Prepared by: Senior Data Analyst Evaluation Panel*

This document reviews the analytical capabilities of **VibeData** across the complete data analysis lifecycle. The review evaluates current features, identifies core architectural and algorithmic gaps that prevent the platform from serving as an enterprise-grade production analytics engine, explains their technical impacts, and details proposed strategic enhancements.

---

## 📋 Executive Summary
VibeData provides an elegant, wizard-driven web platform designed to democratize data analytics, data cleaning, and exploratory data analysis (EDA). By combining interactive UI tools, basic statistical testing, out-of-the-box machine learning estimators, and an AI scoping assistant, VibeData enables analysts to rapidly ingest, profile, clean, and visualize small to medium datasets.

However, in its current state, VibeData operates primarily as an **in-memory desktop-class sandboxing utility** rather than a production-grade enterprise analytics system. Core gaps—such as strict in-memory execution boundaries, lack of automated statistical correction pipelines, absence of rigorous machine learning model diagnostics, basic forecasting algorithms, and simple chronological scheduling—limit its stability and correctness at scale.

---

## 🔄 Analytics Lifecycle: Current Capabilities

VibeData's analytical lifecycle is structured around an 11-step pipeline. Below is the interactive assessment of current feature completeness:
`;

const evaluationContentPart2 = `
---

## 🛑 Critical Algorithmic & Architectural Gaps

While VibeData covers the entire analytical lifecycle, it contains several critical algorithmic and architectural gaps that must be addressed before deployment.

### 1. In-Memory Execution Limits
> **Architectural Constraint: Single-Node In-Memory Compute**
> All cleaning, statistical testing, and machine learning models are executed directly in-memory using Pandas, SciPy, and Scikit-Learn on the backend server.

- **The Gap:** The \`DataService\` holds the active DataFrame in memory (\`self.current_df\`). If a dataset exceeds available system memory, or if multiple users run concurrent memory-intensive tasks (e.g., MICE Imputation, KNN, or t-SNE), the backend process will experience Out-Of-Memory (OOM) crashes.
- **The Impact:** The system cannot ingest or analyze large datasets (e.g., multi-gigabyte or terabyte-scale transaction logs), rendering it unusable for enterprise-scale workloads.

### 2. Statistical Assumption Violations
> **Normality & Homoscedasticity Assumptions**
> Parametric statistical tests (T-Test and ANOVA) assume that the underlying group distributions are normally distributed and share equal variance.

- **The Gap:** Although VibeData runs diagnostic checks (Shapiro-Wilk for normality, Levene's for equal variance) and surfaces warning alerts to the user, it **does not automatically correct the test workflow**. 
  - Standard One-way ANOVA (\`scipy.stats.f_oneway\`) is executed regardless of whether Levene's test is violated. It does not automatically switch to Welch's ANOVA, which adjusts the degrees of freedom when variances are unequal.
  - The application lacks automated p-value corrections (e.g., Bonferroni, Benjamini-Hochberg FDR) when multiple tests are conducted, increasing the risk of Type I errors (false positives).
- **The Impact:** Non-expert business analysts may ignore diagnostic warnings and publish statistically invalid conclusions.

### 3. Machine Learning Diagnostics & Target Constraints
> **Model Validity & Target Limitations**
> The platform runs predictive models without verifying statistical assumptions or supporting multi-class targets.

- **The Gap:**
  - **Regression Diagnostics:** Linear regression is calculated without verifying multicollinearity (Variance Inflation Factor - VIF), homoscedasticity of residuals (Breusch-Pagan test), or autocorrelation (Durbin-Watson test).
  - **Logistic Regression target constraint:** The Logistic Regression endpoint strictly requires a binary target variable (Y). It throws an error if Y has more than two classes, rather than defaulting to multinomial logistic regression.
- **The Impact:** Overfitted, collinear, or invalid models may be built and deployed without warning, resulting in poor generalizations.

### 4. Basic Forecasting Boundaries
- **The Gap:** The time-series forecasting engine applies simple Exponential Smoothing or fixed ARIMA(1,1,1) models. It does not:
  - Perform stationarity checks (e.g., Augmented Dickey-Fuller test) before fitting.
  - Automate parameter selection (such as Auto-ARIMA grid searches).
  - Return prediction confidence intervals (e.g., 95% upper/lower bounds).
- **The Impact:** Model accuracy suffers on complex datasets with multi-seasonal signals, and users cannot gauge forecast uncertainty.

### 5. Semantic Gaps in NLP (Text & Topic Modeling)
- **The Gap:**
  - **Sentiment Analysis:** Relies on TextBlob, a rule-based dictionary lookups method. It fails to capture semantic context, sarcasm, double negation, or slang. It also samples only 1,000 records, disregarding the remaining dataset.
  - **Topic Modeling:** Uses TF-IDF representation combined with Latent Dirichlet Allocation (LDA). TF-IDF is restricted to literal token matches, losing synonym relationships and semantic similarities.
- **The Impact:** Customer sentiment reviews are misclassified, and topic modeling yields noisy, uninterpretable clusters on complex enterprise text data.

### 6. Missing Distribution Drift Metrics
- **The Gap:** The Schema Drift service only validates structure (e.g., whether column names match or if data types have changed). It lacks **distributional drift detection** (e.g., Population Stability Index (PSI), Kullback-Leibler (KL) divergence, or Kolmogorov-Smirnov (KS) two-sample test).
- **The Impact:** The system cannot detect when input data distributions change over time (concept drift), leading to silent model degradation in production.

### 7. Fragile Pipeline Orchestration
- **The Gap:** Background cleaning pipelines are run via a local \`BackgroundScheduler\` (APScheduler) executing a plain python file. There is no support for:
  - Directed Acyclic Graphs (DAGs) representing multi-stage dependency flows.
  - Automatic task retries on failure.
  - Comprehensive logging, tracking, or alerting integrations.
- **The Impact:** If a scheduled API step fails due to a network timeout, the pipeline crashes mid-execution with no built-in failover or restart mechanisms.

---

## 🚀 Strategic Recommendations & Proposed Solutions

To transform VibeData from a desktop-class sandbox into an enterprise-ready analytics engine, we propose the following strategic additions:

### 1. High-Performance Compute Layer
- **Solution:** Integrate **Dask** or **Apache Spark** as the execution backend. 
- **Benefit:** Enables out-of-core operations, distributed computation, and lazy evaluation, allowing users to process multi-gigabyte datasets without OOM server crashes.

### 2. Adaptive Statistical Pipeline
- **Solution:** Implement an automated testing router that checks assumptions and adapts:
  - If normality fails → Auto-select Mann-Whitney U instead of T-Test, or Kruskal-Wallis instead of ANOVA.
  - If equal variance fails → Auto-apply Welch's ANOVA.
  - Integrate multiple testing corrections (e.g., Bonferroni, FDR) for high-dimensional column analysis.
- **Benefit:** Guarantees statistical validity without requiring manual user intervention.

### 3. Diagnostic-Driven ML Engine
- **Solution:**
  - Build a diagnostic step that calculates VIF, Durbin-Watson, and plots residuals before final model confirmation.
  - Expand Logistic Regression to use multinomial estimators (One-vs-Rest) for multi-class targets.
  - Implement Auto-ARIMA (using \`pmdarima\` or similar grid-search) and output 95% confidence bands for forecast visualizations.
- **Benefit:** Improves model reliability and extends predictive capabilities to complex classification tasks.

### 4. Semantic Text Analytics
- **Solution:** Replace TextBlob and TF-IDF with modern **embeddings-based sentiment models** (using HuggingFace Transformers or Google Gemini API embeddings).
- **Benefit:** Captures sarcasm, context, and semantic meaning, providing higher-quality insights on customer feedback data.

### 5. Distribution Drift Monitor
- **Solution:** Implement a daily distribution drift analyzer that calculates the **Population Stability Index (PSI)** and **Wasserstein Distance** between baseline schema distributions and new batches.
- **Benefit:** Proactively alerts analysts when production data changes, preventing model decay.

### 6. Production Workflow Orchestrator
- **Solution:** Replace APScheduler with a lightweight **Prefect** or **Apache Airflow** engine to manage scheduled cleaning jobs.
- **Benefit:** Provides a visual dashboard for job statuses, automated task retries, error notification hooks (Slack/Email), and transactional state management.
`;

const lifecycleData = [
  { phase: "Phase 1: Scoping", step: "Scope", capabilities: "Interactive AI Chatbot (Gemini-powered) that assists in scoping analytics projects.", status: "Complete" },
  { phase: "Phase 2: Ingestion", step: "Collect", capabilities: "Ingestion of local CSV, Excel, JSON, and Parquet files; support for connecting to a local SQLite database or polling REST APIs.", status: "Complete" },
  { phase: "Phase 3: Profiling", step: "Collect", capabilities: "Generates row/column counts, duplicate counts, null percentages, type inference, sparkline distributions, outlier counts, and a Data Quality Score.", status: "Complete" },
  { phase: "Phase 4: Cleaning", step: "Clean", capabilities: "Handles missing values (Mean, Median, KNN, MICE), outlier handling (IQR, MAD, Isolation Forest, LOF), date formatting, categorical encoding, scaling, column operations, and text standardizations.", status: "In-Memory" },
  { phase: "Phase 5: SQL Studio", step: "SQL Studio", capabilities: "Runs standard SQL queries against the active dataset using an in-memory SQLite connection; provides mock customer and product tables for relational join demos.", status: "Complete" },
  { phase: "Phase 6: EDA", step: "EDA", capabilities: "Visualizes fields with Bar, Line, Pie, Histograms, Boxplots, Scatters, and Geospatial Maps; generates automatic text summaries using Gemini.", status: "Complete" },
  { phase: "Phase 7: Hypothesis Tests", step: "Deeper Analysis", capabilities: "Performs Correlation (Pearson, Spearman, Cramer's V), Dimensionality Reduction (PCA, t-SNE), Independent T-Tests, One-way ANOVA, and Chi-Square tests.", status: "Complete" },
  { phase: "Phase 8: Machine Learning", step: "ML Assistant", capabilities: "Fits Linear Regression, Binary Logistic Regression, K-Means Clustering, Holt-Winters/ARIMA Forecasting, Sentiment Analysis, and LDA Topic Modeling.", status: "In-Memory" },
  { phase: "Phase 9: Root Cause", step: "Root Cause", capabilities: "Computes metric variance contributions across dimension slices.", status: "Complete" },
  { phase: "Phase 10: Reporting", step: "Dashboard / Insights", capabilities: "Generates manual dashboard layouts and AI-generated narrative dashboards.", status: "Complete" },
  { phase: "Phase 11: Export", step: "Export Hub", capabilities: "Exports processed CSV datasets and downloads reproducible Python scripts containing the exact Pandas operations executed during the session.", status: "Complete" }
];

function LifecycleTable() {
  const [search, setSearch] = useState("");
  
  const filtered = lifecycleData.filter(item => 
    item.phase.toLowerCase().includes(search.toLowerCase()) ||
    item.step.toLowerCase().includes(search.toLowerCase()) ||
    item.capabilities.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ margin: "2rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <input 
          type="text" 
          placeholder="Filter lifecycle steps..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "0.6rem 1rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            background: "rgba(255,255,255,0.02)",
            color: "white",
            fontSize: "0.85rem",
            outline: "none"
          }}
        />
      </div>
      <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid var(--border-color)", background: "rgba(0,0,0,0.15)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}>
              <th style={{ padding: "1rem 1.25rem", color: "white", fontWeight: "600", width: "180px" }}>Phase</th>
              <th style={{ padding: "1rem 1.25rem", color: "white", fontWeight: "600", width: "130px" }}>Wizard Step</th>
              <th style={{ padding: "1rem 1.25rem", color: "white", fontWeight: "600" }}>Current Capabilities</th>
              <th style={{ padding: "1rem 1.25rem", color: "white", fontWeight: "600", width: "110px", textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "1rem 1.25rem", fontWeight: "600", color: "var(--text-main)" }}>{item.phase}</td>
                <td style={{ padding: "1rem 1.25rem" }}>
                  <code style={{ background: "rgba(139, 92, 246, 0.15)", color: "var(--primary-purple)", padding: "0.2rem 0.4rem", borderRadius: "4px", fontFamily: "Fira Code, monospace", fontSize: "0.75rem" }}>{item.step}</code>
                </td>
                <td style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", lineHeight: "1.5" }}>{item.capabilities}</td>
                <td style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    fontWeight: "600",
                    background: item.status === "Complete" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: item.status === "Complete" ? "var(--accent-emerald)" : "var(--accent-amber)"
                  }}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const HeadingRenderer = ({ level, children }) => {
  const getText = (node) => {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(getText).join("");
    if (node.props && node.props.children) return getText(node.props.children);
    return "";
  };
  const text = getText(children);
  const id = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const Tag = `h${level}`;
  return <Tag id={id}>{children}</Tag>;
};

export default function UserGuide({ onBack }) {
  const [activeView, setActiveView] = useState("guide");

  const navItems = [
    { icon: Layers, label: "Getting Started", target: "getting-started-phase-1-upload" },
    { icon: Sparkles, label: "Data Cleaning", target: "data-cleaning-preparation-phases-2-3-clean-panel" },
    { icon: LineChart, label: "Data Exploration", target: "data-exploration-phase-5-eda-dashboards" },
    { icon: Cpu, label: "Advanced Analytics", target: "advanced-analytics-machine-learning-phase-7" },
    { icon: Download, label: "Exporting", target: "exporting-reproducibility-phase-11" },
    { icon: ShieldAlert, label: "Best Practices", target: "general-best-practices-cautions" }
  ];

  const auditItems = [
    { icon: Award, label: "Executive Summary", target: "executive-summary" },
    { icon: Cpu, label: "Lifecycle Review", target: "analytics-lifecycle-current-capabilities" },
    { icon: ShieldAlert, label: "Algorithmic Gaps", target: "critical-algorithmic-architectural-gaps" },
    { icon: Cpu, label: "Strategic Additions", target: "strategic-recommendations-proposed-solutions" }
  ];

  const scrollToTarget = (targetId) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const customComponents = {
    h1: ({ children }) => <HeadingRenderer level={1}>{children}</HeadingRenderer>,
    h2: ({ children }) => <HeadingRenderer level={2}>{children}</HeadingRenderer>,
    h3: ({ children }) => <HeadingRenderer level={3}>{children}</HeadingRenderer>,
    blockquote: ({ children }) => (
      <blockquote style={{
        borderLeft: "4px solid var(--primary-purple)",
        background: "rgba(139, 92, 246, 0.05)",
        padding: "1rem 1.5rem",
        margin: "1.5rem 0",
        borderRadius: "0 8px 8px 0",
        color: "var(--text-main)",
        fontSize: "0.95rem",
        lineHeight: "1.6"
      }}>
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div style={{ overflowX: "auto", margin: "2rem 0", borderRadius: "10px", border: "1px solid var(--border-color)", background: "rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem 1.25rem", borderBottom: "2px solid var(--border-color)", color: "white", fontWeight: "600" }}>
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.03)", color: "var(--text-muted)" }}>
        {children}
      </td>
    )
  };

  return (
    <div className="fade-in" style={{ height: "100vh", background: "var(--bg-dark)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Navbar for Docs */}
      <header style={{ display: "flex", alignItems: "center", padding: "1.25rem 2rem", borderBottom: "1px solid var(--border-color)", background: "var(--bg-card-solid)", position: "sticky", top: 0, zIndex: 100, flexShrink: 0 }}>
        <button onClick={onBack} className="btn-secondary" style={{ marginRight: "2rem", padding: "0.5rem 1rem", fontSize: "0.9rem", border: "1px solid transparent", background: "transparent", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: 0, fontSize: "1.3rem", color: "var(--text-main)", fontWeight: "600" }}>
          <BookOpen size={20} style={{ color: "var(--primary-purple)" }} /> VibeData Documentation & Analytics Audit
        </h2>
      </header>
      
      {/* Docs Layout */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        
        {/* Left Sidebar Table of Contents */}
        <div style={{ width: "280px", borderRight: "1px solid var(--border-color)", background: "rgba(24, 24, 27, 0.3)", padding: "2rem 1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
          
          {/* Main Tab Toggle */}
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "0.5rem", paddingLeft: "0.5rem" }}>
            Select View
          </div>
          
          <div 
            onClick={() => setActiveView("guide")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem", 
              padding: "0.6rem 0.75rem", 
              borderRadius: "8px", 
              color: activeView === "guide" ? "white" : "var(--text-main)", 
              background: activeView === "guide" ? "var(--primary-purple)" : "transparent",
              fontWeight: activeView === "guide" ? "600" : "normal",
              fontSize: "0.9rem", 
              cursor: "pointer", 
              transition: "all 0.2s",
              marginBottom: "0.25rem"
            }}
          >
            <BookOpen size={16} />
            User Guide
          </div>
          
          <div 
            onClick={() => setActiveView("evaluation")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem", 
              padding: "0.6rem 0.75rem", 
              borderRadius: "8px", 
              color: activeView === "evaluation" ? "white" : "var(--text-main)", 
              background: activeView === "evaluation" ? "var(--primary-purple)" : "transparent",
              fontWeight: activeView === "evaluation" ? "600" : "normal",
              fontSize: "0.9rem", 
              cursor: "pointer", 
              transition: "all 0.2s",
              marginBottom: "1.5rem"
            }}
          >
            <Award size={16} />
            Capabilities Audit
          </div>

          {/* Sub Navigation based on active view */}
          {activeView === "guide" && (
            <>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em", marginTop: "1rem", marginBottom: "0.5rem", paddingLeft: "0.5rem" }}>
                On this page
              </div>
              {navItems.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => scrollToTarget(item.target)}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "8px", color: "var(--text-main)", fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s" }} 
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--primary-purple)"; }} 
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-main)"; }}
                >
                  <item.icon size={14} style={{ color: "var(--text-muted)" }} />
                  {item.label}
                </div>
              ))}
            </>
          )}

          {activeView === "evaluation" && (
            <>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em", marginTop: "1rem", marginBottom: "0.5rem", paddingLeft: "0.5rem" }}>
                Audit Sections
              </div>
              {auditItems.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => scrollToTarget(item.target)}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "8px", color: "var(--text-main)", fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s" }} 
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--primary-purple)"; }} 
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-main)"; }}
                >
                  <item.icon size={14} style={{ color: "var(--text-muted)" }} />
                  {item.label}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "2.5rem 4rem", scrollBehavior: "smooth" }}>
          <div className="markdown-docs" style={{ maxWidth: "800px", margin: "0", padding: "0" }}>
            {activeView === "guide" ? (
              <ReactMarkdown components={customComponents}>{markdownContent}</ReactMarkdown>
            ) : (
              <>
                <ReactMarkdown components={customComponents}>{evaluationContentPart1}</ReactMarkdown>
                <LifecycleTable />
                <ReactMarkdown components={customComponents}>{evaluationContentPart2}</ReactMarkdown>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
