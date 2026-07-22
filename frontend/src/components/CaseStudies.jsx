import React, { useState } from "react";
import { 
  BookOpen, Sparkles, Target, ArrowRight, Play, CheckCircle2, 
  BarChart2, Cpu, Database, Terminal, FileText, Lightbulb, 
  Zap, ShieldAlert, Layers, TrendingUp, Users, ShoppingBag, DollarSign
} from "lucide-react";

export default function CaseStudies({ onLoadDemo, onNavigateStep }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeCaseId, setActiveCaseId] = useState("ecommerce-churn");
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const caseStudies = [
    {
      id: "ecommerce-churn",
      category: "E-Commerce",
      datasetKey: "ecommerce_churn",
      title: "Predicting E-Commerce Customer Churn & Revenue Retention",
      subtitle: "Identify churn drivers among 150+ customers and build a predictive ML classification model.",
      icon: <ShoppingBag size={22} className="text-purple-400" />,
      badgeColor: "rgba(139, 92, 246, 0.15)",
      badgeBorder: "rgba(139, 92, 246, 0.3)",
      textColor: "#a78bfa",
      metrics: [
        { label: "Churn Rate Impact", val: "18.4%" },
        { label: "Est. ARR at Risk", val: "$42,500" },
        { label: "Target Model", val: "Random Forest" }
      ],
      problemStatement: `A rapidly growing online retail platform noticed a sudden 18.4% surge in customer churn over the last two quarters. Executive management wants to understand: 
1. Which customer segments (age, tenure, category preference) have the highest churn risk?
2. How do support ticket counts and discount usage correlate with order frequency?
3. Can we train a predictive Machine Learning model to flag high-risk customers before they cancel?`,
      datasetOverview: [
        { col: "customer_id", type: "String", desc: "Unique identifier for customer" },
        { col: "age", type: "Integer", desc: "Customer age in years (18–65)" },
        { col: "tenure_months", type: "Integer", desc: "Months registered on platform" },
        { col: "orders_last_30d", type: "Integer", desc: "Number of orders placed in last 30 days" },
        { col: "total_spend_usd", type: "Float", desc: "Cumulative lifetime spend ($)" },
        { col: "support_tickets", type: "Integer", desc: "Support tickets logged by customer" },
        { col: "discount_usage_pct", type: "Float", desc: "Percentage of orders using promo codes" },
        { col: "churn", type: "Binary (0/1)", desc: "Target Flag: 1 = Churned, 0 = Active" }
      ],
      steps: [
        {
          num: 1,
          title: "Scoping Chat & Problem Definition",
          toolModule: "Scoping Chat",
          action: "Ask VibeData AI to frame the churn analysis framework.",
          prompt: "Analyze our customer churn dataset. What are the key hypotheses for customer loss and what data quality checks should we perform first?",
          expectedOutcome: "AI outlines hypotheses (e.g. high support tickets indicate product friction; low recent order count correlates with churn)."
        },
        {
          num: 2,
          title: "Data Profiling & Health Check",
          toolModule: "Data Profiler",
          action: "Inspect dataset completeness, distributions, and null values.",
          prompt: "Check Health Score, summary statistics, and column distributions.",
          expectedOutcome: "Identify dataset health score, missing values, and verify target distribution (approx. 20% positive churn cases)."
        },
        {
          num: 3,
          title: "Data Cleaning & Transformation",
          toolModule: "Clean Panel",
          action: "Clean support ticket outliers and encode preferred categories.",
          prompt: "Apply Mean Imputation for missing values, standard scaling on total_spend_usd, and drop duplicate customer records.",
          expectedOutcome: "Clean, model-ready dataset snapshot with reproducible Pandas script auto-generated."
        },
        {
          num: 4,
          title: "Exploratory Data Analysis (EDA) & RCA",
          toolModule: "EDA & Root Cause",
          action: "Analyze correlations and breakdown churn by support ticket counts.",
          prompt: "Run Root Cause Analysis with Metric = churn and Slice = support_tickets.",
          expectedOutcome: "Discovers that customers with >= 3 support tickets have a 68% higher churn rate than customers with 0–1 tickets."
        },
        {
          num: 5,
          title: "Machine Learning (Predictive Modeling)",
          toolModule: "Machine Learning",
          action: "Train Random Forest Classifier to predict customer churn.",
          prompt: "Select target = churn, features = [age, tenure_months, orders_last_30d, total_spend_usd, support_tickets, discount_usage_pct].",
          expectedOutcome: "Model achieves ~85%+ accuracy and outputs Feature Importance ranking support_tickets as top predictor."
        },
        {
          num: 6,
          title: "Executive Report & PPTX Export",
          toolModule: "Visual Report & SQL Studio",
          action: "Export key findings as an executive presentation deck.",
          prompt: "Generate automated PowerPoint slides detailing high-risk customer segments and recommended retention strategies.",
          expectedOutcome: "Downloadable presentation deck ready for stakeholder presentation."
        }
      ]
    },
    {
      id: "saas-ltv",
      category: "SaaS & Tech",
      datasetKey: "saas_ltv",
      title: "SaaS User Health Score & Customer Lifetime Value (LTV)",
      subtitle: "Analyze daily active usage, feature adoption rates, and subscription tier upgrades.",
      icon: <TrendingUp size={22} className="text-cyan-400" />,
      badgeColor: "rgba(6, 182, 212, 0.15)",
      badgeBorder: "rgba(6, 182, 212, 0.3)",
      textColor: "#38bdf8",
      metrics: [
        { label: "Target Metric", val: "Health Score" },
        { label: "User Accounts", val: "140 Accounts" },
        { label: "Primary Model", val: "K-Means Clustering" }
      ],
      problemStatement: `A B2B SaaS software provider wants to proactively prevent customer churn by introducing a Customer Health Score (1–100). The VP of Customer Success wants to:
1. Cluster users into high-engagement advocates vs. passive churn-risk accounts.
2. Evaluate if organic signup channels produce higher LTV than paid ad channels.
3. Generate SQL queries to extract all accounts with Health Score < 45 for success outreach.`,
      datasetOverview: [
        { col: "user_id", type: "String", desc: "Unique account identifier" },
        { col: "plan_type", type: "String", desc: "Free Tier, Starter, Growth, Enterprise" },
        { col: "signup_channel", type: "String", desc: "Organic, Google Ads, LinkedIn Ads, Referral" },
        { col: "daily_active_mins", type: "Float", desc: "Average daily active minutes spent in app" },
        { col: "feature_adoption_score", type: "Integer", desc: "Feature usage index (1–100)" },
        { col: "monthly_recurring_revenue", type: "Float", desc: "MRR ($) contributed by account" },
        { col: "health_score", type: "Integer", desc: "Calculated health index score" },
        { col: "churn_risk", type: "String", desc: "Low Risk, Medium Risk, High Churn Risk" }
      ],
      steps: [
        {
          num: 1,
          title: "Scoping & Domain Hypothesis",
          toolModule: "Scoping Chat",
          action: "Define SaaS health benchmarks and engagement thresholds.",
          prompt: "What feature adoption score and daily active minutes signify a healthy B2B SaaS user account?",
          expectedOutcome: "AI establishes benchmarks: >50 feature adoption and >20 mins daily active time correlates with high LTV."
        },
        {
          num: 2,
          title: "Feature Correlation Profiling",
          toolModule: "Data Profiler",
          action: "Examine correlation matrix between daily_active_mins and health_score.",
          prompt: "View Pearson Correlation matrix in Profiler.",
          expectedOutcome: "Strong positive correlation (+0.78) identified between feature adoption score and user retention health."
        },
        {
          num: 3,
          title: "Segmentation with K-Means Clustering",
          toolModule: "Machine Learning",
          action: "Cluster users into 3 distinct user personas based on usage metrics.",
          prompt: "Run K-Means Clustering with k=3 on features [daily_active_mins, feature_adoption_score, monthly_recurring_revenue].",
          expectedOutcome: "3 User Segments identified: 'Power Users', 'Steady Adopters', and 'At-Risk Passives'."
        },
        {
          num: 4,
          title: "SQL Studio Querying",
          toolModule: "SQL Studio",
          action: "Filter accounts requiring immediate Customer Success intervention.",
          prompt: "Execute: SELECT user_id, plan_type, signup_channel, health_score FROM dataset WHERE churn_risk = 'High Churn Risk' ORDER BY monthly_recurring_revenue DESC;",
          expectedOutcome: "Immediate actionable list of high-value accounts at risk of churning."
        }
      ]
    },
    {
      id: "marketing-roi",
      category: "Marketing & Growth",
      datasetKey: "marketing_roi",
      title: "Multi-Channel Marketing Campaign ROI & Attribution",
      subtitle: "Optimize ad spend allocation across Google, Facebook, LinkedIn, and Organic Search.",
      icon: <DollarSign size={22} className="text-emerald-400" />,
      badgeColor: "rgba(16, 185, 129, 0.15)",
      badgeBorder: "rgba(16, 185, 129, 0.3)",
      textColor: "#34d399",
      metrics: [
        { label: "Total Ad Spend", val: "$485,000" },
        { label: "Channels Analyzed", val: "5 Channels" },
        { label: "Goal", val: "ROI Maximization" }
      ],
      problemStatement: `A digital marketing agency manages $450k+ in quarterly media spend across 5 acquisition channels. The CMO needs to know:
1. Which advertising channels deliver the highest ROI Multiplier vs. highest Cost Per Click (CPC)?
2. Are high-budget campaigns generating profitable conversions or just vanity impressions?
3. How should budget be reallocated next quarter to maximize total deal revenue?`,
      datasetOverview: [
        { col: "campaign_id", type: "String", desc: "Unique ad campaign code" },
        { col: "channel", type: "String", desc: "Google Ads, Facebook, LinkedIn B2B, SEO, Email" },
        { col: "ad_spend_usd", type: "Float", desc: "Total ad dollars spent ($)" },
        { col: "impressions", type: "Integer", desc: "Total ad impressions served" },
        { col: "clicks", type: "Integer", desc: "Total clicks generated" },
        { col: "conversions", type: "Integer", desc: "Total converted leads/sales" },
        { col: "revenue_generated_usd", type: "Float", desc: "Total dollar revenue attributed" },
        { col: "cost_per_click", type: "Float", desc: "Calculated Cost Per Click ($)" },
        { col: "roi_multiplier", type: "Float", desc: "Revenue / Ad Spend ratio" }
      ],
      steps: [
        {
          num: 1,
          title: "Channel ROI Comparison",
          toolModule: "Chart Explorer & EDA",
          action: "Plot Bar Chart of Average ROI Multiplier grouped by Channel.",
          prompt: "Create a bar chart with X = channel, Y = roi_multiplier (Aggregation = Average).",
          expectedOutcome: "Reveals LinkedIn B2B yields highest average deal value despite higher CPC."
        },
        {
          num: 2,
          title: "Calculated Field & Efficiency Metrics",
          toolModule: "Clean Panel",
          action: "Calculate Return on Ad Spend (ROAS) and Conversion Rate %.",
          prompt: "Add calculated column: conversion_rate = (conversions / clicks) * 100.",
          expectedOutcome: "New metric created to evaluate channel funnel efficiency."
        },
        {
          num: 3,
          title: "Regression & Revenue Forecasting",
          toolModule: "Machine Learning / EDA",
          action: "Run Linear Regression to model Revenue as a function of Ad Spend & Clicks.",
          prompt: "Target = revenue_generated_usd, Predictors = [ad_spend_usd, clicks, conversions].",
          expectedOutcome: "Quantifies expected revenue gain for every additional $1,000 allocated to top-performing channels."
        }
      ]
    }
  ];

  const filteredStudies = selectedCategory === "All" 
    ? caseStudies 
    : caseStudies.filter(c => c.category === selectedCategory);

  const activeStudy = caseStudies.find(c => c.id === activeCaseId) || caseStudies[0];

  const handleLaunchCaseStudy = async (datasetKey) => {
    setIsLoadingDemo(true);
    try {
      if (onLoadDemo) {
        await onLoadDemo(datasetKey);
      }
      if (onNavigateStep) {
        onNavigateStep(2); // Navigate to Profiler / Scoping
      }
    } catch (e) {
      console.error("Error loading case study dataset:", e);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", color: "var(--text-main)" }} className="fade-in">
      
      {/* Top Banner Header */}
      <div className="glass-card" style={{ padding: "2.5rem", marginBottom: "2rem", position: "relative", overflow: "hidden", borderRadius: "20px", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.8rem" }}>
          <span style={{ background: "rgba(139, 92, 246, 0.2)", border: "1px solid rgba(139, 92, 246, 0.4)", color: "#a78bfa", padding: "0.35rem 0.85rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <BookOpen size={14} /> Interactive Learning & Case Studies
          </span>
          <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "0.35rem 0.85rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Sparkles size={14} /> 1-Click Live Hands-On Workspace
          </span>
        </div>

        <h1 style={{ fontSize: "2.2rem", margin: "0 0 0.8rem 0", fontWeight: 800, background: "linear-gradient(135deg, #fff 0%, #cbd5e1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Real-World Data Analysis Case Studies
        </h1>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: "850px", lineHeight: "1.6" }}>
          Master VibeData by following real-world analytics problem statements. Select a case study below, explore the step-by-step workflow, and click <strong>"Load Case Study Live"</strong> to execute the analysis with pre-configured datasets inside VibeData.
        </p>
      </div>

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem", overflowX: "auto" }}>
        {["All", "E-Commerce", "SaaS & Tech", "Marketing & Growth"].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "0.6rem 1.25rem",
              borderRadius: "12px",
              background: selectedCategory === cat ? "linear-gradient(135deg, #8b5cf6, #06b6d4)" : "rgba(255, 255, 255, 0.04)",
              color: selectedCategory === cat ? "white" : "var(--text-muted)",
              border: selectedCategory === cat ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Case Studies */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        {filteredStudies.map(cs => {
          const isActive = cs.id === activeCaseId;
          return (
            <div 
              key={cs.id}
              onClick={() => setActiveCaseId(cs.id)}
              className="glass-card"
              style={{
                padding: "1.75rem",
                borderRadius: "16px",
                cursor: "pointer",
                border: isActive ? `2px solid ${cs.textColor}` : "1px solid rgba(255,255,255,0.08)",
                background: isActive ? "rgba(255,255,255,0.04)" : "rgba(15, 23, 42, 0.6)",
                boxShadow: isActive ? `0 8px 30px ${cs.badgeColor}` : "none",
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                justify: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ padding: "0.6rem", borderRadius: "12px", background: cs.badgeColor, border: `1px solid ${cs.badgeBorder}` }}>
                    {cs.icon}
                  </div>
                  <span style={{ fontSize: "0.78rem", padding: "0.25rem 0.65rem", borderRadius: "12px", background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}>
                    {cs.category}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.15rem", margin: "0 0 0.5rem 0", color: "var(--text-dark)", lineHeight: "1.4" }}>
                  {cs.title}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 1.25rem 0", lineHeight: "1.5" }}>
                  {cs.subtitle}
                </p>
              </div>

              <div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                  {cs.metrics.map((m, idx) => (
                    <div key={idx} style={{ background: "rgba(0,0,0,0.25)", padding: "0.4rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", flex: 1, minWidth: "90px" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{m.label}</div>
                      <div style={{ fontWeight: 700, color: cs.textColor, marginTop: "0.1rem" }}>{m.val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: "0.83rem", color: cs.textColor, fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    {isActive ? "Viewing Walkthrough" : "Explore Case Study"} <ArrowRight size={14} />
                  </span>
                  {isActive && <CheckCircle2 size={16} style={{ color: cs.textColor }} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Case Study Detailed Deep-Dive View */}
      {activeStudy && (
        <div className="glass-card fade-in" style={{ padding: "2.5rem", borderRadius: "20px", border: `1px solid ${activeStudy.badgeBorder}`, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(16px)" }}>
          
          {/* Header & Launch Button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem", marginBottom: "2rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1.75rem" }}>
            <div style={{ maxWidth: "800px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: activeStudy.badgeColor, border: `1px solid ${activeStudy.badgeBorder}`, color: activeStudy.textColor, padding: "0.3rem 0.85rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                {activeStudy.icon} Active Case Study Walkthrough
              </div>
              <h2 style={{ fontSize: "1.8rem", margin: "0 0 0.5rem 0", color: "white", fontWeight: 800 }}>
                {activeStudy.title}
              </h2>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                {activeStudy.subtitle}
              </p>
            </div>

            <button
              onClick={() => handleLaunchCaseStudy(activeStudy.datasetKey)}
              disabled={isLoadingDemo}
              className="btn-primary"
              style={{
                padding: "1rem 1.75rem",
                borderRadius: "14px",
                fontSize: "1rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                boxShadow: `0 8px 24px ${activeStudy.badgeColor}`,
                background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                cursor: isLoadingDemo ? "wait" : "pointer"
              }}
            >
              {isLoadingDemo ? (
                <>Loading Dataset...</>
              ) : (
                <>
                  <Play size={18} fill="white" /> Load & Try This Case Study Live
                </>
              )}
            </button>
          </div>

          {/* Problem Statement Section */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem", borderRadius: "14px", marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.75rem 0", color: "var(--accent-amber)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Target size={18} /> Business Problem Statement & Context
            </h3>
            <div style={{ whiteSpace: "pre-line", color: "var(--text-main)", fontSize: "0.92rem", lineHeight: "1.7" }}>
              {activeStudy.problemStatement}
            </div>
          </div>

          {/* Dataset Schema Table */}
          <div style={{ marginBottom: "2.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 1rem 0", color: "white", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Database size={18} style={{ color: "var(--secondary-cyan)" }} /> Dataset Schema & Features Overview
            </h3>
            <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "0.85rem 1rem" }}>Column Name</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Data Type</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Description & Business Context</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStudy.datasetOverview.map((item, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                      <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", color: activeStudy.textColor, fontWeight: 600 }}>{item.col}</td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>{item.type}</td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--text-main)" }}>{item.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step-by-Step Interactive Guide */}
          <div>
            <h3 style={{ fontSize: "1.2rem", margin: "0 0 1.25rem 0", color: "white", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers size={20} style={{ color: "var(--primary-purple)" }} /> Step-by-Step VibeData Execution Plan
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {activeStudy.steps.map((st) => (
                <div 
                  key={st.num}
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "14px",
                    padding: "1.5rem",
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", color: "white", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>
                        {st.num}
                      </div>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", color: "white", fontWeight: 700 }}>
                        {st.title}
                      </h4>
                    </div>

                    <span style={{ background: "rgba(139, 92, 246, 0.12)", border: "1px solid rgba(139, 92, 246, 0.25)", color: "#a78bfa", padding: "0.25rem 0.75rem", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 600 }}>
                      Module: {st.toolModule}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 1rem 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {st.action}
                  </p>

                  {st.prompt && (
                    <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)", padding: "0.85rem 1rem", borderRadius: "10px", marginBottom: "0.85rem", fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--accent-amber)", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>
                        💡 Recommended Prompt / Input:
                      </span>
                      <code style={{ color: "#e2e8f0", fontFamily: "monospace" }}>"{st.prompt}"</code>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#34d399", fontSize: "0.85rem", background: "rgba(16, 185, 129, 0.08)", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <CheckCircle2 size={16} /> <strong>Expected Outcome:</strong> {st.expectedOutcome}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Footer inside Card */}
          <div style={{ marginTop: "2.5rem", textAlign: "center", background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.1))", padding: "2rem", borderRadius: "16px", border: "1px solid rgba(139,92,246,0.3)" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "white", fontSize: "1.25rem" }}>
              Ready to Solve This Case Study Hands-On?
            </h3>
            <p style={{ margin: "0 0 1.25rem 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Click below to instantly load the dataset into VibeData and execute the workflow step-by-step.
            </p>
            <button
              onClick={() => handleLaunchCaseStudy(activeStudy.datasetKey)}
              disabled={isLoadingDemo}
              className="btn-primary"
              style={{
                padding: "0.9rem 2rem",
                borderRadius: "12px",
                fontSize: "0.95rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <Play size={16} fill="white" /> Launch Live Case Study Workspace
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
