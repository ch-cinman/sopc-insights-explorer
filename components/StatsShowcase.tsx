"use client";

import { useState, useEffect, useRef } from "react";

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
    };
  }
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PIE_DATA = [
  { label: "Data is fragmented across systems",    pct: 31.1, color: "#378ADD" },
  { label: "Lack of confidence in data quality",   pct: 25.5, color: "#0F6DFD" },
  { label: "Insights aren't timely or actionable", pct: 17.4, color: "#93c5fd" },
  { label: "Compliance or regulatory concerns",    pct: 9.9,  color: "#E040FB" },
  { label: "Unclear ownership or accountability",  pct: 9.3,  color: "#c084fc" },
  { label: "Other / not answered",                 pct: 6.8,  color: "#e5e7eb" },
];

const ANSWERS = [
  { label: "Less than 30%", correct: false },
  { label: "Around 45%",    correct: false },
  { label: "Nearly 60%",    correct: true  },
  { label: "Over 75%",      correct: false },
];

const BAR_DATA = [
  { label: "Large pharma",     pct: 31   },
  { label: "Mid-size pharma",  pct: 16.3 },
  { label: "Emerging biotech", pct: 6.7  },
  { label: "Small biotech",    pct: 2.4  },
];

// ─── SVG helpers ──────────────────────────────────────────────────────────────

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

// ─── Viz 1: Pie Chart ─────────────────────────────────────────────────────────

function PieChart() {
  const [hovered, setHovered] = useState<number | null>(null);
  const CX = 90, CY = 90, R = 78;

  const angles: { start: number; end: number; mid: number }[] = [];
  let cum = 0;
  for (const d of PIE_DATA) {
    const sweep = (d.pct / 100) * 360;
    angles.push({ start: cum, end: cum + sweep, mid: cum + sweep / 2 });
    cum += sweep;
  }

  const hov = hovered !== null ? PIE_DATA[hovered] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#00145E", lineHeight: 1.4 }}>
        What&apos;s the top challenge to acting on data?
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <svg width={180} height={180} viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
          {PIE_DATA.map((d, i) => {
            const { start, end, mid } = angles[i];
            const isHov = hovered === i;
            const opacity = hovered === null ? 0.7 : isHov ? 1 : 0.22;
            const midRad = ((mid - 90) * Math.PI) / 180;
            const tx = isHov ? (Math.cos(midRad) * 7).toFixed(2) : "0";
            const ty = isHov ? (Math.sin(midRad) * 7).toFixed(2) : "0";
            return (
              <path
                key={i}
                d={slicePath(CX, CY, R, start, end)}
                fill={d.color}
                opacity={opacity}
                transform={`translate(${tx},${ty})`}
                style={{ cursor: "pointer", transition: "opacity 0.18s, transform 0.18s" }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
          {/* Donut hole */}
          <circle cx={CX} cy={CY} r={30} fill="white" />
          {hov && (
            <text
              x={CX}
              y={CY + 5}
              textAnchor="middle"
              fontSize={13}
              fontWeight={800}
              fill="#00145E"
              fontFamily="Averta PE, sans-serif"
            >
              {hov.pct}%
            </text>
          )}
        </svg>
        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 2 }}>
          {PIE_DATA.map((d, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 5,
                cursor: "pointer",
                opacity: hovered === null ? 1 : hovered === i ? 1 : 0.3,
                transition: "opacity 0.18s",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: d.color,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <div style={{ fontSize: 9.5, color: "#555", lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700, color: "#00145E" }}>{d.pct}%</span>{" "}
                {d.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 9.5, color: "#bbb" }}>
        2026 SoPC · All Respondents (n=161)
      </div>
    </div>
  );
}

// ─── Viz 2: Gauge Stat ────────────────────────────────────────────────────────

const GAUGE_R       = 76;
const GAUGE_CX      = 100;
const GAUGE_CY      = 90;
const GAUGE_ARC_LEN = Math.PI * GAUGE_R; // ≈ 238.76
const GAUGE_VALUE   = 58;                // 46.6 + 12.4

function GaugeStat() {
  const [selected, setSelected]   = useState<number | null>(null);
  const [revealed, setRevealed]   = useState(false);
  const [shaking, setShaking]     = useState<number | null>(null);

  const fillLen   = (GAUGE_VALUE / 100) * GAUGE_ARC_LEN;
  const dashOffset = revealed ? GAUGE_ARC_LEN - fillLen : GAUGE_ARC_LEN;

  // Counter-clockwise sweep (flag=0) → goes through the TOP of the semicircle
  const trackPath = `M ${GAUGE_CX - GAUGE_R},${GAUGE_CY} A ${GAUGE_R},${GAUGE_R} 0 0 0 ${GAUGE_CX + GAUGE_R},${GAUGE_CY}`;

  function handleAnswer(i: number) {
    if (revealed) return;
    setSelected(i);
    window.posthog?.capture("stat_guess_answered", {
      answer_selected: ANSWERS[i].label,
      was_correct:     ANSWERS[i].correct,
    });
    if (ANSWERS[i].correct) {
      setRevealed(true);
    } else {
      setShaking(i);
      setTimeout(() => {
        setShaking(null);
        setRevealed(true);
      }, 650);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#00145E", lineHeight: 1.4 }}>
        What % of biopharma companies say their data is fragmented or doesn&apos;t inform
        day-to-day operations?
      </div>

      {/* Gauge arc */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width={200} height={100} viewBox="0 0 200 100">
          <path
            d={trackPath}
            fill="none"
            stroke="#EAF2FF"
            strokeWidth={13}
            strokeLinecap="round"
          />
          <path
            d={trackPath}
            fill="none"
            stroke="#0F6DFD"
            strokeWidth={13}
            strokeLinecap="round"
            strokeDasharray={`${GAUGE_ARC_LEN} ${GAUGE_ARC_LEN}`}
            strokeDashoffset={dashOffset}
            style={{ transition: revealed ? "stroke-dashoffset 1.1s ease-out" : "none" }}
          />
        </svg>
      </div>

      {/* Revealed stat or answer pills */}
      <div style={{ textAlign: "center", minHeight: 70 }}>
        {revealed ? (
          <>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#00145E", lineHeight: 1 }}>
              {GAUGE_VALUE}%
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#555",
                lineHeight: 1.5,
                margin: "5px auto 0",
                maxWidth: 200,
              }}
            >
              of commercial teams say data doesn&apos;t inform day-to-day operations
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                marginTop: 6,
                color:
                  selected !== null && ANSWERS[selected].correct ? "#00B8E0" : "#999",
              }}
            >
              {selected !== null && ANSWERS[selected].correct
                ? "That\u2019s right."
                : "The actual number might surprise you."}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {ANSWERS.map((a, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                style={{
                  padding: "6px 13px",
                  borderRadius: 100,
                  border: "1.5px solid rgba(0,20,94,0.18)",
                  background: "white",
                  color: "#00145E",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Averta PE', sans-serif",
                  animation: shaking === i ? "shake 0.4s ease-in-out" : "none",
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: 9.5, color: "#bbb" }}>
        2026 SoPC · All Respondents (n=161)
      </div>
    </div>
  );
}

// ─── Viz 3: Bar Chart ─────────────────────────────────────────────────────────

function BarChart() {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#00145E", lineHeight: 1.4 }}>
        Approved AI tools with governance across 2+ teams
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {BAR_DATA.map((d) => (
          <div key={d.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#00145E" }}>
                {d.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#378ADD",
                  opacity: animated ? 1 : 0,
                  transition: "opacity 0.3s ease 0.85s",
                }}
              >
                {d.pct}%
              </span>
            </div>
            <div
              style={{
                background: "#EAF2FF",
                borderRadius: 100,
                height: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "#378ADD",
                  height: "100%",
                  borderRadius: 100,
                  width: animated ? `${d.pct}%` : "0%",
                  transition: "width 0.8s ease-out",
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9.5, color: "#bbb" }}>
        2026 SoPC · Company size segments
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function StatsShowcase() {
  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-5px); }
          40%      { transform: translateX(5px); }
          60%      { transform: translateX(-3px); }
          80%      { transform: translateX(3px); }
        }
      `}</style>

      <div style={{ background: "white", padding: "28px clamp(20px, 5vw, 72px) 8px" }}>
        {/* Section label */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#999",
              whiteSpace: "nowrap",
            }}
          >
            By the numbers
          </span>
          <span style={{ flex: 1, height: 1, background: "rgba(0,20,94,0.08)" }} />
        </div>

        {/* Three cards */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[<PieChart key="pie" />, <GaugeStat key="gauge" />, <BarChart key="bar" />].map(
            (viz, i) => (
              <div
                key={i}
                style={{
                  flex: "1 1 280px",
                  border: "1px solid rgba(0,20,94,0.09)",
                  borderRadius: 20,
                  padding: "20px 22px",
                  background: "white",
                  minWidth: 0,
                }}
              >
                {viz}
              </div>
            )
          )}
        </div>

        {/* Subtext */}
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#aaa",
            margin: "16px 0 8px",
            lineHeight: 1.5,
          }}
        >
          These findings apply across all segments. Select your profile below for benchmarks
          specific to your organization.
        </p>
      </div>
    </>
  );
}
