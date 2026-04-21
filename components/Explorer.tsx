"use client";

import { useState, useRef, useEffect } from "react";
import type { CompanyType, TherapeuticArea, RoleFocus } from "@/data/types";
import { RESPONSES } from "@/data/responses";
import { OVERLAYS } from "@/data/overlays";
import { QUESTIONS, OPENING } from "@/data/questions";

// PostHog is accessed via window to keep import side-effect free in this component
declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
    };
  }
}

const COMPANY_SIZE_OPTIONS: { label: string; value: CompanyType }[] = [
  { label: "Small/Pre-commercial", value: "Emerging biotech" },
  { label: "Emerging", value: "Small biotech" },
  { label: "Mid-Sized", value: "Mid-size pharma" },
  { label: "Large", value: "Large pharma" },
];

function getCompanySizeLabel(value: CompanyType): string {
  return COMPANY_SIZE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

const THERAPEUTIC_AREAS: TherapeuticArea[] = [
  "Oncology",
  "Immunology & Inflammatory",
  "Cardiovascular & Metabolic",
  "Neurology & CNS",
  "All / Other",
];

const ROLE_FOCUSES: RoleFocus[] = [
  "Patient Services",
  "Market Access",
  "Field Access",
  "Commercial Ops / IT",
  "Executive",
];

const BOT_ICON = (
  <svg width="14" height="14" viewBox="0 0 26 26" fill="none">
    <path
      d="M13 21.5C13 21.5 3.5 15.5 3.5 9C3.5 6.5 5.5 4.5 8 4.5C10 4.5 11.5 5.5 13 7C14.5 5.5 16 4.5 18 4.5C20.5 4.5 22.5 6.5 22.5 9C22.5 15.5 13 21.5 13 21.5Z"
      fill="url(#lgh)"
    />
    <defs>
      <linearGradient
        id="lgh"
        x1="3.5"
        y1="4.5"
        x2="22.5"
        y2="21.5"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#00D4FF" />
        <stop offset="1" stopColor="#E040FB" />
      </linearGradient>
    </defs>
  </svg>
);

interface Message {
  type: "bot" | "user";
  html?: string;
  text?: string;
}

function getProfile(
  companyType: CompanyType,
  ta: TherapeuticArea | "",
  role: RoleFocus | ""
): string {
  const parts: string[] = [getCompanySizeLabel(companyType)];
  if (ta && ta !== "All / Other") parts.push(ta);
  if (role) parts.push(role);
  return parts.join(" · ");
}

// This function is the self-contained chat handler — swappable for an API call in v2
async function getChatResponse(
  question: string,
  companyType: CompanyType,
  ta: TherapeuticArea | "",
  role: RoleFocus | ""
): Promise<string> {
  const segData = RESPONSES[companyType];
  const qData = segData?.[question];
  let html = qData
    ? qData.core
    : `The 2026 survey doesn't isolate a specific finding for that question at this segment level. Download the full report for deeper data.<span class="src">Source: 2026 SoPC · Courier Health</span>`;

  const overlayData = OVERLAYS[companyType]?.[question];
  if (overlayData) {
    let note = "";
    if (ta && ta !== "All / Other" && overlayData.ta?.[ta]) {
      note = overlayData.ta[ta]!;
    } else if (role && overlayData.role?.[role]) {
      note = overlayData.role[role]!;
    }
    if (note) html += `<span class="ctx-note">${note}</span>`;
  }
  return html;
}

export default function Explorer() {
  // Intake state
  const [companyType, setCompanyType] = useState<CompanyType>("Emerging biotech");
  const [ta, setTa] = useState<TherapeuticArea | "">("");
  const [role, setRole] = useState<RoleFocus | "">("");

  // Chat state
  const [view, setView] = useState<"intake" | "chat">("intake");
  const [messages, setMessages] = useState<Message[]>([]);
  const [usedQuestions, setUsedQuestions] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [allExhausted, setAllExhausted] = useState(false);

  // Locked profile — set when entering chat, not changed mid-session
  const [activeCompany, setActiveCompany] = useState<CompanyType>("Emerging biotech");
  const [activeTa, setActiveTa] = useState<TherapeuticArea | "">("");
  const [activeRole, setActiveRole] = useState<RoleFocus | "">("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function startChat() {
    setActiveCompany(companyType);
    setActiveTa(ta);
    setActiveRole(role);
    setMessages([{ type: "bot", html: OPENING[companyType] }]);
    setUsedQuestions(new Set());
    setAllExhausted(false);
    setIsTyping(false);
    setView("chat");

    window.posthog?.capture("profile_selected", {
      company_type: companyType,
      therapeutic_area: ta || null,
      role_focus: role || null,
    });
  }

  function resetChat() {
    setView("intake");
    setMessages([]);
    setUsedQuestions(new Set());
    setAllExhausted(false);
    setIsTyping(false);
  }

  async function askQuestion(question: string) {
    if (isTyping) return;

    const nextUsed = new Set(usedQuestions).add(question);
    setUsedQuestions(nextUsed);
    setMessages((prev) => [...prev, { type: "user", text: question }]);
    setIsTyping(true);

    window.posthog?.capture("question_asked", {
      question_text: question,
      company_type: activeCompany,
      therapeutic_area: activeTa || null,
      role_focus: activeRole || null,
    });

    const html = await getChatResponse(question, activeCompany, activeTa, activeRole);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { type: "bot", html }]);

      const remaining = QUESTIONS[activeCompany].filter((q) => !nextUsed.has(q));
      if (remaining.length === 0) {
        setAllExhausted(true);
        window.posthog?.capture("all_questions_exhausted", {
          company_type: activeCompany,
        });
      }
    }, 800);
  }

  function handleReportClick() {
    window.posthog?.capture("report_cta_clicked");
  }

  const remainingQuestions = QUESTIONS[activeCompany]?.filter(
    (q) => !usedQuestions.has(q)
  ) ?? [];

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        background: "white",
        boxShadow: "0 0 60px rgba(10,23,68,0.12)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Gradient bar */}
      <div
        style={{
          height: 5,
          background: "linear-gradient(90deg,#3B82F6,#8B5CF6 40%,#E040FB 70%,#F472B6)",
          flexShrink: 0,
        }}
      />

      {/* Nav */}
      <nav
        style={{
          background: "white",
          padding: "14px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(10,23,68,0.08)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 800,
            fontSize: 15,
            color: "#0A1744",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <path
              d="M13 21.5C13 21.5 3.5 15.5 3.5 9C3.5 6.5 5.5 4.5 8 4.5C10 4.5 11.5 5.5 13 7C14.5 5.5 16 4.5 18 4.5C20.5 4.5 22.5 6.5 22.5 9C22.5 15.5 13 21.5 13 21.5Z"
              fill="url(#lg1)"
            />
            <defs>
              <linearGradient
                id="lg1"
                x1="3.5"
                y1="4.5"
                x2="22.5"
                y2="21.5"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#00D4FF" />
                <stop offset="1" stopColor="#E040FB" />
              </linearGradient>
            </defs>
          </svg>
          CourierHealth
        </div>
        <a href="#" onClick={handleReportClick}>
          <button
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#0A1744",
              background: "none",
              border: "1.5px solid #0A1744",
              borderRadius: 100,
              padding: "6px 16px",
              cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#0A1744";
              (e.currentTarget as HTMLButtonElement).style.color = "white";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
              (e.currentTarget as HTMLButtonElement).style.color = "#0A1744";
            }}
          >
            Download Full Report
          </button>
        </a>
      </nav>

      {/* Hero */}
      <div
        style={{
          background: "#0A1744",
          padding: "44px 40px 38px",
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#00D4FF",
            marginBottom: 12,
          }}
        >
          2026 State of Patient-Centricity · 170+ biopharma leaders · 80+ companies
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        >
          Find the benchmarks
          <br />
          that matter{" "}
          <em style={{ fontStyle: "normal", color: "#00D4FF" }}>for your org</em>
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
          Select your profile to surface relevant findings from Courier Health&apos;s 2026 survey.
        </p>
      </div>

      {/* Intake */}
      {view === "intake" && (
        <div style={{ background: "#0A1744", padding: "8px 40px 40px", flexShrink: 0 }}>
          <div style={{ height: 24 }} />

          {/* Step 1 — Company type */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#00D4FF",
                  color: "#0A1744",
                  fontSize: 11,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                Company Size
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingLeft: 32 }}>
              {COMPANY_SIZE_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setCompanyType(value)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 100,
                    border: companyType === value
                      ? "1.5px solid #00D4FF"
                      : "1.5px solid rgba(255,255,255,0.2)",
                    background: companyType === value ? "#00D4FF" : "transparent",
                    color: companyType === value ? "#0A1744" : "rgba(255,255,255,0.8)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "16px 0" }} />

          {/* Step 2 — Therapeutic area */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#00D4FF",
                  color: "#0A1744",
                  fontSize: 11,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                Therapeutic area{" "}
                <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>
                  · optional
                </span>
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingLeft: 32 }}>
              {THERAPEUTIC_AREAS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTa(ta === t ? "" : t)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 100,
                    border: ta === t
                      ? "1.5px solid #E040FB"
                      : "1.5px solid rgba(255,255,255,0.2)",
                    background: ta === t ? "#E040FB" : "transparent",
                    color: ta === t ? "white" : "rgba(255,255,255,0.8)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "16px 0" }} />

          {/* Step 3 — Role focus */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#00D4FF",
                  color: "#0A1744",
                  fontSize: 11,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                Role focus{" "}
                <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>
                  · optional
                </span>
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingLeft: 32 }}>
              {ROLE_FOCUSES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(role === r ? "" : r)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 100,
                    border: role === r
                      ? "1.5px solid rgba(255,255,255,0.5)"
                      : "1.5px solid rgba(255,255,255,0.2)",
                    background: role === r ? "rgba(255,255,255,0.18)" : "transparent",
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startChat}
            style={{
              marginLeft: 32,
              marginTop: 22,
              background: "#00D4FF",
              color: "#0A1744",
              border: "none",
              borderRadius: 100,
              padding: "12px 28px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "white";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#00D4FF";
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M2 6.5h9M6.5 2l4.5 4.5L6.5 11"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Explore my benchmarks
          </button>
        </div>
      )}

      {/* Chat area */}
      {view === "chat" && (
        <div style={{ display: "flex", flexDirection: "column", background: "#f8f9fd", flex: 1 }}>
          {/* Chat topbar */}
          <div
            style={{
              background: "white",
              padding: "12px 40px",
              borderBottom: "1px solid rgba(10,23,68,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
              flexWrap: "wrap",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="#1A6FD4" strokeWidth="1.5" />
              <circle cx="6" cy="6" r="1.8" fill="#1A6FD4" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0A1744" }}>
              Insights Explorer
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#EEF4FF",
                borderRadius: 100,
                padding: "4px 12px 4px 8px",
                marginLeft: 8,
              }}
            >
              <div
                style={{ width: 8, height: 8, borderRadius: "50%", background: "#00D4FF" }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0A1744" }}>
                {getProfile(activeCompany, activeTa, activeRole)}
              </span>
            </div>
            <button
              onClick={resetChat}
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: "#999",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Change profile
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              padding: "28px 40px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              flex: 1,
              overflowY: "auto",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 11,
                  maxWidth: "82%",
                  alignSelf: msg.type === "bot" ? "flex-start" : "flex-end",
                  flexDirection: msg.type === "user" ? "row-reverse" : "row",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: msg.type === "bot" ? "#0A1744" : "#D8E8FF",
                    fontSize: msg.type === "user" ? 11 : undefined,
                    fontWeight: msg.type === "user" ? 700 : undefined,
                    color: msg.type === "user" ? "#0A1744" : undefined,
                  }}
                >
                  {msg.type === "bot" ? BOT_ICON : "You"}
                </div>
                <div
                  style={{
                    borderRadius: 16,
                    padding: "12px 16px",
                    fontSize: 13,
                    lineHeight: 1.7,
                    background: msg.type === "bot" ? "white" : "#0A1744",
                    color: msg.type === "bot" ? "#0A1744" : "white",
                    border: msg.type === "bot" ? "1px solid rgba(10,23,68,0.09)" : "none",
                    borderBottomLeftRadius: msg.type === "bot" ? 4 : 16,
                    borderBottomRightRadius: msg.type === "user" ? 4 : 16,
                  }}
                  dangerouslySetInnerHTML={
                    msg.html !== undefined ? { __html: msg.html } : undefined
                  }
                >
                  {msg.text !== undefined ? msg.text : undefined}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div
                style={{
                  display: "flex",
                  gap: 11,
                  maxWidth: "82%",
                  alignSelf: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#0A1744",
                  }}
                />
                <div
                  style={{
                    background: "white",
                    border: "1px solid rgba(10,23,68,0.09)",
                    borderRadius: 16,
                    borderBottomLeftRadius: 4,
                    padding: "12px 16px",
                    display: "flex",
                    gap: 5,
                    alignItems: "center",
                  }}
                >
                  {[0, 200, 400].map((delay) => (
                    <div
                      key={delay}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#ccc",
                        animation: `bob 1.2s ${delay}ms infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Question chips */}
          <div
            style={{ padding: "12px 40px 24px", background: "#f8f9fd", flexShrink: 0 }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#bbb",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Ask about your segment
              <span style={{ flex: 1, height: 1, background: "rgba(10,23,68,0.08)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {allExhausted ? (
                <div
                  style={{
                    fontSize: 13,
                    color: "#aaa",
                    textAlign: "center",
                    padding: "20px 0",
                    fontStyle: "italic",
                  }}
                >
                  You&apos;ve explored all available findings for this profile.
                  <br />
                  <a href="#" style={{ color: "#1A6FD4" }} onClick={handleReportClick}>
                    Download the full report
                  </a>{" "}
                  to go deeper.
                </div>
              ) : (
                remainingQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => askQuestion(q)}
                    disabled={isTyping}
                    style={{
                      background: "white",
                      border: "1px solid rgba(10,23,68,0.1)",
                      borderRadius: 10,
                      padding: "11px 16px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#0A1744",
                      cursor: isTyping ? "default" : "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      textAlign: "left",
                      transition: "all 0.15s",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      opacity: isTyping ? 0.3 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isTyping) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#1A6FD4";
                        (e.currentTarget as HTMLButtonElement).style.background = "#EEF4FF";
                        (e.currentTarget as HTMLButtonElement).style.color = "#1A6FD4";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "rgba(10,23,68,0.1)";
                      (e.currentTarget as HTMLButtonElement).style.background = "white";
                      (e.currentTarget as HTMLButtonElement).style.color = "#0A1744";
                    }}
                  >
                    <span>{q}</span>
                    <span style={{ fontSize: 16, color: "#ccc", flexShrink: 0, lineHeight: 1 }}>
                      +
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          background: "white",
          borderTop: "1px solid rgba(10,23,68,0.08)",
          padding: "16px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 11, color: "#bbb", lineHeight: 1.5 }}>
          © 2026 Courier Health, Inc. · Based on survey of 162 biopharma commercial leaders
          across 87 companies.
          <br />
          This tool surfaces research findings only. No product recommendations are made.
        </span>
        <a href="#" onClick={handleReportClick}>
          <button
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#0A1744",
              textDecoration: "underline",
              cursor: "pointer",
              background: "none",
              border: "none",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Download the Full Report →
          </button>
        </a>
      </footer>
    </div>
  );
}
