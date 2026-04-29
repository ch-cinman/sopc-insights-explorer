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
  { label: "Data is fragmented across systems",    pct: 31.1, color: "#2D80FF" },
  { label: "Lack of confidence in data quality",   pct: 25.5, color: "#34C1FF" },
  { label: "Insights aren't timely or actionable", pct: 17.4, color: "#96BFFF" },
  { label: "Compliance or regulatory concerns",    pct: 9.9,  color: "#FD92FF" },
  { label: "Unclear ownership or accountability",  pct: 9.3,  color: "#FEC9FF" },
  { label: "Other / not answered",                 pct: 6.8,  color: "#E5E7EF" },
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
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", lineHeight: 1.4 }}>
        What&apos;s the top challenge to acting on data?
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
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
              fill="var(--navy)"
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
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700, color: "var(--navy)" }}>{d.pct}%</span>{" "}
                {d.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#bbb" }}>
        2026 SoPC · All Respondents
      </div>
    </div>
  );
}

// ─── Viz 3: Bar Chart ─────────────────────────────────────────────────────────

function BarChart() {
  const [animated, setAnimated] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
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
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", lineHeight: 1.4 }}>
        Where does AI adoption stand by company size?
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {BAR_DATA.map((d, i) => (
          <div
            key={d.label}
            style={{
              opacity: hovered === null ? 1 : hovered === i ? 1 : 0.3,
              transition: "opacity 0.18s",
              cursor: "pointer",
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>
                {d.label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#34C1FF",
                  opacity: animated ? 1 : 0,
                  transition: "opacity 0.3s ease 0.85s",
                }}
              >
                {d.pct}%
              </span>
            </div>
            <div
              style={{
                background: "var(--light-blue)",
                borderRadius: 100,
                height: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "var(--sky)",
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
      <div style={{ fontSize: 11, color: "#bbb" }}>
        2026 SoPC · Company size segments
      </div>
    </div>
  );
}

// ─── Viz 3: Data Maturity ─────────────────────────────────────────────────────

function DataMaturity() {
  const [hovered, setHovered] = useState<number | null>(null);
  const STAGES = [
    { label: "Using data to power AI use cases",     pct: 8.7,  color: "#2D80FF" },
    { label: "Data informs workflows & decisions",   pct: 32.3, color: "#34C1FF" },
    { label: "Accessible but rarely changes ops",    pct: 12.4, color: "#96BFFF" },
    { label: "Ownership fragmented across systems",  pct: 46.6, color: "#E5E7EF" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", lineHeight: 1.4 }}>
        Where does data maturity stand today?
      </div>
      <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5, marginBottom: 4 }}>
        How commercial teams describe their current data state
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {STAGES.map((s, i) => (
          <div
            key={s.label}
            style={{
              opacity: hovered === null ? 1 : hovered === i ? 1 : 0.3,
              transition: "opacity 0.18s",
              cursor: "pointer",
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "var(--navy)", fontWeight: 500, lineHeight: 1.4, maxWidth: "75%" }}>
                {s.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.color, flexShrink: 0 }}>
                {s.pct}%
              </span>
            </div>
            <div style={{ background: "var(--light-blue)", borderRadius: 100, height: 9, overflow: "hidden" }}>
              <div style={{ background: s.color, height: "100%", borderRadius: 100, width: `${s.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>
        2026 SoPC · All Respondents
      </div>
    </div>
  );
}

// ─── Viz 4: Start Rate ────────────────────────────────────────────────────────

function StartRate() {
  const [hovered, setHovered] = useState<number | null>(null); // 0 = start, 1 = no-start
  const RATE = 67.5;
  const CX = 80, CY = 80, R = 62;
  const circumference = 2 * Math.PI * R;
  const filled = (RATE / 100) * circumference;

  const centerPct  = hovered === 1 ? "32.5%" : "67.5%";
  const centerSub  = hovered === 1 ? "don't start" : "start therapy";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", lineHeight: 1.4 }}>
        1 in 3 prescribed patients never start therapy
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <svg width={160} height={160} viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
          {/* Track — represents the no-start portion */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="#EAF2FF"
            strokeWidth={14}
            style={{ cursor: "pointer", transition: "opacity 0.18s" }}
            opacity={hovered === 0 ? 0.25 : 1}
            onMouseEnter={() => setHovered(1)}
            onMouseLeave={() => setHovered(null)}
          />
          {/* Fill — represents the start portion */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="var(--cta)"
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            strokeDashoffset={circumference * 0.25}
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ cursor: "pointer", transition: "opacity 0.18s" }}
            opacity={hovered === 1 ? 0.25 : 1}
            onMouseEnter={() => setHovered(0)}
            onMouseLeave={() => setHovered(null)}
          />
          {/* Center label */}
          <text x={CX} y={CY - 6} textAnchor="middle" fontSize={22} fontWeight={800} fill="var(--navy)" fontFamily="Averta PE, sans-serif">
            {centerPct}
          </text>
          <text x={CX} y={CY + 14} textAnchor="middle" fontSize={11} fill="#888" fontFamily="Averta PE, sans-serif">
            {centerSub}
          </text>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              opacity: hovered === null ? 1 : hovered === 0 ? 1 : 0.3,
              transition: "opacity 0.18s",
              cursor: "pointer",
            }}
            onMouseEnter={() => setHovered(0)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--cta)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#555" }}>
              <strong style={{ color: "var(--navy)" }}>67.5%</strong> start therapy (industry mean)
            </span>
          </div>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              opacity: hovered === null ? 1 : hovered === 1 ? 1 : 0.3,
              transition: "opacity 0.18s",
              cursor: "pointer",
            }}
            onMouseEnter={() => setHovered(1)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--light-blue)", border: "1.5px solid var(--blue-50)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#555" }}>
              <strong style={{ color: "var(--navy)" }}>32.5%</strong> never start despite being prescribed
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#aaa", lineHeight: 1.5, marginTop: 4 }}>
            Median: 70% · Range varies significantly by company size and TA
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#bbb" }}>
        2026 SoPC · All Respondents
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function StatsShowcase() {
  return (
    <>
      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <div style={{ background: "white", padding: "28px clamp(20px, 5vw, 72px) 8px" }}>
        {/* Section label */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span
            style={{
              fontSize: 13,
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

        {/* 2×2 grid */}
        <div className="stats-grid">
          {[
            <PieChart key="pie" />,
            <BarChart key="bar" />,
            <DataMaturity key="maturity" />,
            <StartRate key="startrate" />,
          ].map((viz, i) => (
            <div
              key={i}
              style={{
                border: "1px solid rgba(0,20,94,0.09)",
                borderRadius: 20,
                padding: "20px 22px",
                background: "white",
                minWidth: 0,
              }}
            >
              {viz}
            </div>
          ))}
        </div>

        {/* Subtext */}
        <p
          style={{
            textAlign: "center",
            fontSize: 14,
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
