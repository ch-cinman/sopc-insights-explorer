"use client";

import { useState, useRef, useEffect } from "react";
import type { CompanyType, TherapeuticArea, RoleFocus } from "@/data/types";
import { RESPONSES } from "@/data/responses";
import { OVERLAYS } from "@/data/overlays";
import { QUESTIONS, OPENING, QUESTION_LABELS, QUESTION_LABELS_BY_SEGMENT } from "@/data/questions";
import StatsShowcase from "@/components/StatsShowcase";

// PostHog is accessed via window to keep import side-effect free in this component
declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
    };
  }
}

const COMPANY_SIZE_OPTIONS: { label: string; value: CompanyType }[] = [
  { label: "Small & Pre-Commercial", value: "Small biotech" },
  { label: "Emerging", value: "Emerging biotech" },
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
  "Other",
];

const ROLE_FOCUSES: RoleFocus[] = [
  "Patient Services",
  "Access & Reimbursement",
  "Commercial Ops & IT",
];

const STEP_CIRCLE: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "var(--cta)",
  color: "var(--navy)",
  fontSize: 13,
  fontWeight: 800,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const FILTER_BTN_BASE: React.CSSProperties = {
  padding: "7px 16px",
  borderRadius: 100,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.15s",
};

const BOT_ICON = (
  <img src="/favicon.ico" alt="" style={{ width: 15, height: 15, objectFit: "contain" }} />
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
    if (ta && ta !== "Other" && overlayData.ta?.[ta]) {
      html += `<span class="ctx-note ctx-note-ta"><span style="font-weight:700;color:var(--navy)">${ta} context:</span> ${overlayData.ta[ta]}</span>`;
    }
    if (role && overlayData.role?.[role]) {
      html += `<span class="ctx-note ctx-note-role"><span style="font-weight:700;color:var(--navy)">${role} lens:</span> ${overlayData.role[role]}</span>`;
    }
  }
  return html;
}

export default function Explorer() {
  // Intake state
  const [companyType, setCompanyType] = useState<CompanyType | ("")>("");
  const [companySizeError, setCompanySizeError] = useState(false);
  const [ta, setTa] = useState<TherapeuticArea | "">("");
  const [role, setRole] = useState<RoleFocus | "">("");

  // Chat state
  const [view, setView] = useState<"intake" | "chat">("intake");
  const [isExiting, setIsExiting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [usedQuestions, setUsedQuestions] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [allExhausted, setAllExhausted] = useState(false);

  // Locked profile — set when entering chat, not changed mid-session
  const [activeCompany, setActiveCompany] = useState<CompanyType>("Emerging biotech" as CompanyType);
  const [activeTa, setActiveTa] = useState<TherapeuticArea | "">("");
  const [activeRole, setActiveRole] = useState<RoleFocus | "">("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function startChat() {
    if (!companyType) {
      setCompanySizeError(true);
      return;
    }
    setCompanySizeError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsExiting(true);
    setTimeout(() => {
      setActiveCompany(companyType as CompanyType);
      setActiveTa(ta);
      setActiveRole(role);
      setMessages([]);
      setUsedQuestions(new Set());
      setAllExhausted(false);
      setIsExiting(false);
      setIsTyping(true);
      setView("chat");
      window.posthog?.capture("profile_selected", {
        company_type: companyType,
        therapeutic_area: ta || null,
        role_focus: role || null,
      });
      setTimeout(() => {
        setIsTyping(false);
        setMessages([{ type: "bot", html: OPENING[companyType as CompanyType] }]);
      }, 1600);
    }, 300);
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
        width: "100%",
        background: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Gradient bar */}
      <div
        style={{
          height: 5,
          background: "linear-gradient(90deg,#2D80FF,#34C1FF 40%,#FD92FF 70%,#FEC9FF)",
          flexShrink: 0,
        }}
      />

      {/* Nav */}
      <nav
        style={{
          background: "white",
          padding: "14px clamp(20px, 5vw, 72px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(0,20,94,0.08)",
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
            color: "var(--navy)",
          }}
        >
          <img src="/logo.avif" alt="Courier Health" style={{ height: 26, width: "auto" }} />
        </div>
        <a href="#" onClick={handleReportClick}>
          <button
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "white",
              background: "var(--navy)",
              border: "none",
              borderRadius: 5,
              padding: "9px 20px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#010C3A";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--navy)";
            }}
          >
            Download Full Report
          </button>
        </a>
      </nav>

      {/* Hero */}
      <div
        style={{
          background: "var(--navy)",
          padding: "44px clamp(20px, 5vw, 72px) 38px",
          textAlign: "center",
          flexShrink: 0,
          display: view === "chat" ? "none" : undefined,
          opacity: isExiting ? 0 : 1,
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--cta)",
            marginBottom: 12,
          }}
        >
          2026 State of Patient-Centricity · 170+ biopharma leaders · 80+ companies
        </div>
        <h1
          style={{
            fontSize: 52.8,
            fontWeight: 700,
            color: "white",
            lineHeight: "64px",
            marginBottom: 8,
          }}
        >
          Find the benchmarks
          <br />
          that matter{" "}
          <em style={{ fontStyle: "normal", color: "var(--cta)" }}>for your org</em>
        </h1>
      </div>

      {/* Stats showcase + intake */}
      <div style={{ display: view === "chat" ? "none" : undefined, opacity: isExiting ? 0 : 1, transition: "opacity 0.3s ease" }}>
        <StatsShowcase />

        {/* Intake */}
        <div style={{ background: "var(--navy)", padding: "8px clamp(20px, 5vw, 72px) 40px", flexShrink: 0 }}>
          <div style={{ height: 24 }} />

          <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 24, lineHeight: 1.4 }}>
            Select your profile below for benchmarks specific to your organization
          </div>

          {/* Step 1 — Company type */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={STEP_CIRCLE}>1</div>
              <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                Company Size
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingLeft: 32 }}>
              {COMPANY_SIZE_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => { setCompanyType(value); setCompanySizeError(false); }}
                  style={{
                    ...FILTER_BTN_BASE,
                    border: companyType === value
                      ? "1.5px solid var(--cta)"
                      : "1.5px solid rgba(255,255,255,0.2)",
                    background: companyType === value ? "var(--cta)" : "transparent",
                    color: companyType === value ? "var(--navy)" : "rgba(255,255,255,0.8)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {companySizeError && (
              <p style={{ paddingLeft: 32, marginTop: 8, fontSize: 13, color: "#FF7B7B", fontWeight: 500 }}>
                Please select a Company Size
              </p>
            )}
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "16px 0" }} />

          {/* Step 2 — Therapeutic area */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={STEP_CIRCLE}>2</div>
              <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                Therapeutic Area{" "}
                <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>
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
                    ...FILTER_BTN_BASE,
                    border: ta === t
                      ? "1.5px solid var(--pink)"
                      : "1.5px solid rgba(255,255,255,0.2)",
                    background: ta === t ? "var(--pink)" : "transparent",
                    color: ta === t ? "var(--navy)" : "rgba(255,255,255,0.8)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {ta === t && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setTa(""); }}
                      style={{ fontSize: 15, lineHeight: 1, opacity: 0.7, fontWeight: 700 }}
                    >
                      ✕
                    </span>
                  )}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "16px 0" }} />

          {/* Step 3 — Role focus */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={STEP_CIRCLE}>3</div>
              <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                Team{" "}
                <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>
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
                    ...FILTER_BTN_BASE,
                    border: role === r
                      ? "1.5px solid var(--sky)"
                      : "1.5px solid rgba(255,255,255,0.2)",
                    background: role === r ? "var(--sky)" : "transparent",
                    color: role === r ? "var(--navy)" : "rgba(255,255,255,0.8)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {role === r && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setRole(""); }}
                      style={{ fontSize: 15, lineHeight: 1, opacity: 0.7, fontWeight: 700 }}
                    >
                      ✕
                    </span>
                  )}
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
              background: "var(--cta)",
              color: "white",
              border: "none",
              borderRadius: 5,
              padding: "12px 28px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#1A6CE8";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--cta)";
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
            Explore My Benchmarks
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div
        style={{
          display: view === "chat" ? "flex" : "none",
          flexDirection: "column",
          background: "#f8f9fd",
          flex: 1,
          animation: view === "chat" ? "fadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1)" : undefined,
        }}
      >
          {/* Chat topbar */}
          <div
            style={{
              background: "white",
              padding: "12px clamp(20px, 5vw, 72px)",
              borderBottom: "1px solid rgba(0,20,94,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
              flexWrap: "wrap",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="var(--cta)" strokeWidth="1.5" />
              <circle cx="6" cy="6" r="1.8" fill="var(--cta)" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>
              Insights Explorer
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "var(--light-blue)",
                borderRadius: 100,
                padding: "4px 12px 4px 8px",
                marginLeft: 8,
              }}
            >
              <div
                style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--cta)" }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>
                {getProfile(activeCompany, activeTa, activeRole)}
              </span>
            </div>
            <button
              onClick={resetChat}
              style={{
                marginLeft: "auto",
                fontSize: 13,
                color: "#999",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Explore more findings
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              padding: "28px clamp(20px, 5vw, 72px) 16px",
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
                    background: msg.type === "bot" ? "var(--navy)" : "var(--blue-10)",
                    fontSize: msg.type === "user" ? 11 : undefined,
                    fontWeight: msg.type === "user" ? 700 : undefined,
                    color: msg.type === "user" ? "var(--navy)" : undefined,
                  }}
                >
                  {msg.type === "bot" ? BOT_ICON : "You"}
                </div>
                <div
                  style={{
                    borderRadius: 16,
                    padding: "12px 16px",
                    fontSize: 15,
                    lineHeight: 1.7,
                    background: msg.type === "bot" ? "white" : "var(--navy)",
                    color: msg.type === "bot" ? "var(--navy)" : "white",
                    border: msg.type === "bot" ? "1px solid rgba(0,20,94,0.09)" : "none",
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
                    background: "var(--navy)",
                  }}
                >
                  <img src="/favicon.ico" alt="" style={{ width: 15, height: 15, objectFit: "contain" }} />
                </div>
                <div
                  style={{
                    background: "white",
                    border: "1px solid rgba(0,20,94,0.09)",
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
            style={{ padding: "12px clamp(20px, 5vw, 72px) 24px", background: "#f8f9fd", flexShrink: 0 }}
          >
            <div
              style={{
                fontSize: 13,
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
              <span style={{ flex: 1, height: 1, background: "rgba(0,20,94,0.08)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {allExhausted ? (
                <div
                  style={{
                    fontSize: 15,
                    color: "#aaa",
                    textAlign: "center",
                    padding: "20px 0",
                    fontStyle: "italic",
                  }}
                >
                  You&apos;ve explored all available findings for this profile.
                  <br />
                  <a href="#" style={{ color: "var(--cta)" }} onClick={handleReportClick}>
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
                      border: "1px solid rgba(0,20,94,0.1)",
                      borderRadius: 10,
                      padding: "11px 16px",
                      fontSize: 15,
                      fontWeight: 500,
                      color: "var(--navy)",
                      cursor: isTyping ? "default" : "pointer",
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
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--cta)";
                        (e.currentTarget as HTMLButtonElement).style.background = "var(--light-blue)";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--cta)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "rgba(0,20,94,0.1)";
                      (e.currentTarget as HTMLButtonElement).style.background = "white";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--navy)";
                    }}
                  >
                    <span>{QUESTION_LABELS[activeRole]?.[q] ?? QUESTION_LABELS_BY_SEGMENT[activeCompany]?.[q] ?? q}</span>
                    <span style={{ fontSize: 16, color: "#ccc", flexShrink: 0, lineHeight: 1 }}>
                      +
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          background: "white",
          borderTop: "1px solid rgba(0,20,94,0.08)",
          padding: "16px clamp(20px, 5vw, 72px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 13, color: "#bbb", lineHeight: 1.5 }}>
          © 2026 Courier Health, Inc.
          <br />
          This tool surfaces research findings only. No product recommendations are made.
        </span>
        <a href="#" onClick={handleReportClick}>
          <button
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--navy)",
              textDecoration: "underline",
              cursor: "pointer",
              background: "none",
              border: "none",
            }}
          >
            Download the Full Report →
          </button>
        </a>
      </footer>
    </div>
  );
}
