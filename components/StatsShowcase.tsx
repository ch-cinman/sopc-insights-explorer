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
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const CARD_INNER: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  height: "100%",
};

const CALLOUT: React.CSSProperties = {
  background: "var(--light-blue)",
  borderLeft: "3px solid var(--blue)",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 13,
  color: "var(--navy)",
  lineHeight: 1.55,
};

const DIVIDER: React.CSSProperties = {
  height: 1,
  background: "rgba(0,20,94,0.08)",
};

const STAT_LABEL: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--navy)",
  lineHeight: 1.45,
  marginTop: 6,
};

// ─── New stat cards ───────────────────────────────────────────────────────────

function PatientJourneyCard() {
  return (
    <div style={CARD_INNER}>
      <div style={{ display: "flex", gap: 0, minHeight: 130 }}>
        <div style={{ flex: 1, paddingRight: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 800, color: "var(--sky)", lineHeight: 1 }}>30%</div>
          <div style={STAT_LABEL}>of patients never start their treatment</div>
        </div>
        <div style={{ width: 1, background: "rgba(0,20,94,0.08)", flexShrink: 0 }} />
        <div style={{ flex: 1, paddingLeft: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 800, color: "var(--sky)", lineHeight: 1 }}>66%</div>
          <div style={STAT_LABEL}>discontinue by month 12</div>
        </div>
      </div>
      <div style={DIVIDER} />
      <div style={CALLOUT}>
        The patient journey has two distinct failure points — access friction at the start, and engagement gaps over time.
      </div>
    </div>
  );
}

function VisibilityCard() {
  return (
    <div style={CARD_INNER}>
      <div style={{ minHeight: 130 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: "var(--blue)", lineHeight: 1 }}>1 in 4</div>
        <div style={STAT_LABEL}>respondents cite lack of visibility into patient and provider status as their top challenge</div>
      </div>
      <div style={DIVIDER} />
      <div style={CALLOUT}>
        Teams can&apos;t intervene on what they can&apos;t see — and most don&apos;t have a clear picture of where patients are getting stuck.
      </div>
    </div>
  );
}

function AIScaleCard() {
  return (
    <div style={CARD_INNER}>
      <div style={{ minHeight: 130 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: "var(--sky)", lineHeight: 1 }}>12%</div>
        <div style={STAT_LABEL}>of biopharma companies report AI adoption at scale</div>
      </div>
      <div style={DIVIDER} />
      <div style={CALLOUT}>
        Despite 83% using AI in some capacity, approved tools with cross-team governance remain the exception — not the rule.
      </div>
    </div>
  );
}

function KPIAwarenessCard() {
  return (
    <div style={CARD_INNER}>
      <div style={{ minHeight: 130 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: "var(--blue)", lineHeight: 1 }}>14%</div>
        <div style={STAT_LABEL}>of respondents don&apos;t know how their teams are measured</div>
      </div>
      <div style={DIVIDER} />
      <div style={CALLOUT}>
        Without shared KPI clarity, even aligned teams risk optimizing for different outcomes.
      </div>
    </div>
  );
}

// ─── Modal helpers & content ──────────────────────────────────────────────────

const MODAL_CALLOUT: React.CSSProperties = {
  background: "var(--light-blue)",
  borderLeft: "3px solid var(--blue)",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 13,
  color: "var(--navy)",
  lineHeight: 1.55,
  marginTop: 16,
};

const MODAL_SUBHEAD: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#999",
  marginTop: 20,
  marginBottom: 0,
  display: "block",
};

const MODAL_SOURCE: React.CSSProperties = {
  fontSize: 11,
  color: "#bbb",
  marginTop: 16,
  paddingTop: 8,
  borderTop: "1px solid rgba(0,20,94,0.06)",
  display: "block",
};

function ModalBarChart({ rows, color, meanPct, meanLabel }: {
  rows: { label: string; pct: number }[];
  color: string;
  meanPct?: number;
  meanLabel?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
      {rows.map((r) => (
        <div key={r.label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500, lineHeight: 1.3, maxWidth: "78%" }}>{r.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>{r.pct}%</span>
          </div>
          <div style={{ background: "var(--light-blue)", borderRadius: 100, height: 8, overflow: "hidden", position: "relative" }}>
            <div style={{ background: color, height: "100%", borderRadius: 100, width: `${r.pct}%` }} />
            {meanPct !== undefined && (
              <div style={{ position: "absolute", top: 0, bottom: 0, left: `${meanPct}%`, borderLeft: "1.5px dashed #999" }} />
            )}
          </div>
        </div>
      ))}
      {meanLabel && (
        <div style={{ fontSize: 11, color: "#aaa", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 14, borderTop: "1.5px dashed #aaa", flexShrink: 0 }} />
          {meanLabel}
        </div>
      )}
    </div>
  );
}

function JourneyModal() {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", lineHeight: 1.3, paddingRight: 24 }}>
        Breaking down patient access performance
      </div>
      <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "var(--sky)", lineHeight: 1 }}>30%</div>
          <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>never start treatment</div>
        </div>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "var(--sky)", lineHeight: 1 }}>66%</div>
          <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>discontinue by month 12</div>
        </div>
      </div>
      <span style={MODAL_SUBHEAD}>Mean start rate by company size</span>
      <ModalBarChart
        color="var(--blue)"
        meanPct={67.5}
        meanLabel="Industry mean 67.5%"
        rows={[
          { label: "Emerging Biotech", pct: 71.3 },
          { label: "Large Pharma", pct: 68.0 },
          { label: "Mid-Size Pharma", pct: 67.2 },
          { label: "Small Biotech", pct: 62.6 },
        ]}
      />
      <span style={MODAL_SUBHEAD}>Mean 12-month persistence by therapeutic area</span>
      <ModalBarChart
        color="var(--pink)"
        rows={[
          { label: "Cardiovascular & Metabolic", pct: 75.6 },
          { label: "Ultra-Rare", pct: 67.0 },
          { label: "Rare", pct: 65.7 },
          { label: "Neurology & CNS", pct: 62.8 },
          { label: "Oncology", pct: 59.7 },
          { label: "Immunology & Inflammatory", pct: 46.8 },
        ]}
      />
      <div style={MODAL_CALLOUT}>
        Immunology &amp; Inflammatory is the hardest hit on both metrics — lowest start rate (60.3%) and lowest persistence (46.8%) of any therapeutic area.
      </div>
      <span style={MODAL_SOURCE}>2026 SoPC · All Respondents</span>
    </div>
  );
}

function VisibilityModal() {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", lineHeight: 1.3, paddingRight: 24 }}>
        Why teams can&apos;t see what&apos;s happening
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: "var(--blue)", lineHeight: 1 }}>1 in 4</div>
        <div style={{ fontSize: 14, color: "#555", marginTop: 6, lineHeight: 1.4 }}>cite lack of visibility into patient and provider status as their top operational challenge</div>
      </div>
      <span style={MODAL_SUBHEAD}>Top challenge to acting on data — all respondents</span>
      <ModalBarChart
        color="var(--sky)"
        rows={[
          { label: "Data is fragmented across systems", pct: 31.1 },
          { label: "Lack of confidence in data quality", pct: 25.5 },
          { label: "Insights aren't timely or actionable", pct: 17.4 },
          { label: "Compliance or regulatory concerns", pct: 9.9 },
          { label: "Unclear ownership or accountability", pct: 9.3 },
        ]}
      />
      <span style={MODAL_SUBHEAD}>Data ownership fragmentation by company size — a key driver of visibility gaps</span>
      <ModalBarChart
        color="var(--blue)"
        rows={[
          { label: "Large Pharma", pct: 58.6 },
          { label: "Emerging Biotech", pct: 51.1 },
          { label: "Small Biotech", pct: 39.0 },
          { label: "Mid-Size Pharma", pct: 38.8 },
        ]}
      />
      <div style={MODAL_CALLOUT}>
        The visibility gap isn&apos;t a tooling problem — it&apos;s a data architecture problem. When ownership is fragmented across teams and systems, no single function can see the full patient picture.
      </div>
      <span style={MODAL_SOURCE}>2026 SoPC · All Respondents</span>
    </div>
  );
}

function AIModal() {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", lineHeight: 1.3, paddingRight: 24 }}>
        AI adoption across biopharma
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: "var(--sky)", lineHeight: 1 }}>12%</div>
        <div style={{ fontSize: 14, color: "#555", marginTop: 6, lineHeight: 1.4 }}>have approved tools, governance, and adoption across 2+ teams</div>
      </div>
      <span style={MODAL_SUBHEAD}>AI adoption at scale by company size</span>
      <ModalBarChart
        color="var(--blue)"
        rows={[
          { label: "Large Pharma", pct: 31.0 },
          { label: "Mid-Size Pharma", pct: 16.3 },
          { label: "Emerging Biotech", pct: 6.7 },
          { label: "Small Biotech", pct: 2.4 },
        ]}
      />
      <span style={MODAL_SUBHEAD}>Top AI use cases — among those using AI</span>
      <ModalBarChart
        color="var(--sky)"
        rows={[
          { label: "Automating routine tasks", pct: 65.2 },
          { label: "Recommending actions", pct: 58.4 },
          { label: "Highlighting risks", pct: 21.1 },
          { label: "Executing complex actions with human oversight", pct: 19.3 },
        ]}
      />
      <span style={MODAL_SUBHEAD}>Top barriers to AI adoption</span>
      <ModalBarChart
        color="var(--pink)"
        rows={[
          { label: "Security and compliance concerns", pct: 31.1 },
          { label: "Lack a clear use case", pct: 19.9 },
          { label: "No major barriers", pct: 18.0 },
        ]}
      />
      <div style={MODAL_CALLOUT}>
        The gap between AI intent and AI deployment is a governance problem, not a capability one — most barriers trace back to unclear ownership and compliance uncertainty.
      </div>
      <span style={MODAL_SOURCE}>2026 SoPC · All Respondents</span>
    </div>
  );
}

function KPIModal() {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", lineHeight: 1.3, paddingRight: 24 }}>
        A measurement landscape that varies widely
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: "var(--blue)", lineHeight: 1 }}>14%</div>
        <div style={{ fontSize: 14, color: "#555", marginTop: 6, lineHeight: 1.4 }}>don&apos;t know how their teams are measured</div>
      </div>
      <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginTop: 12 }}>
        But even among those who do know, there&apos;s no consensus on what matters most — KPI priorities shift significantly by company size, suggesting teams across the industry are optimizing for fundamentally different outcomes.
      </p>
      <span style={MODAL_SUBHEAD}>What the other 86% are measured on — industry-wide</span>
      <ModalBarChart
        color="var(--blue)"
        rows={[
          { label: "Time-to-start", pct: 42.2 },
          { label: "12-month persistence", pct: 39.1 },
          { label: "Time in each milestone (BV/PA/appeals)", pct: 32.3 },
          { label: "PA approval rate", pct: 31.1 },
          { label: "Start rate", pct: 25.5 },
          { label: "Patient satisfaction/NPS", pct: 14.3 },
        ]}
      />
      <span style={MODAL_SUBHEAD}>Top KPI by segment — no two segments agree</span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginTop: 10 }}>
        {[
          { company: "Small Biotech", kpi: "PA approval rate", pct: "39%" },
          { company: "Emerging Biotech", kpi: "12-month persistence", pct: "42.2%" },
          { company: "Mid-Size Pharma", kpi: "Time-to-start", pct: "42.9%" },
          { company: "Large Pharma", kpi: "12-month persistence", pct: "58.6%" },
        ].map(({ company, kpi, pct }) => (
          <div key={company} style={{ fontSize: 13, color: "var(--navy)", lineHeight: 1.5 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{company}</div>
            <div>{kpi} <span style={{ fontWeight: 700 }}>({pct})</span></div>
          </div>
        ))}
      </div>
      <div style={MODAL_CALLOUT}>
        No two company sizes share the same top KPI. Small biotech leads on PA approval rate, large pharma on persistence, mid-size on time-to-start — teams across the industry are measuring success differently, making industry benchmarking harder and cross-segment learning less actionable.
      </div>
      <span style={MODAL_SOURCE}>2026 SoPC · All Respondents</span>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function StatsShowcase() {
  const [useNewStats, setUseNewStats] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUseNewStats(params.get("stats") !== "legacy");
  }, []);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = activeModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activeModal]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setActiveModal(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

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
        .stat-card-clickable {
          transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
        }
        .stat-card-clickable:hover {
          box-shadow: 0 4px 20px rgba(0,20,94,0.1);
          border-color: rgba(0,20,94,0.22) !important;
          transform: translateY(-2px);
        }
        .stat-card-clickable:hover .card-expand-icon {
          color: var(--navy-50) !important;
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

        {/* Grid */}
        <div className="stats-grid">
          {useNewStats ? (
            [
              { viz: <PatientJourneyCard key="pj" />, modal: "journey" },
              { viz: <VisibilityCard key="v" />,      modal: "visibility" },
              { viz: <AIScaleCard key="ai" />,        modal: "ai" },
              { viz: <KPIAwarenessCard key="kpi" />,  modal: "kpi" },
            ].map(({ viz, modal }, i) => (
              <div
                key={i}
                className="stat-card-clickable"
                onClick={() => setActiveModal(modal)}
                style={{
                  border: "1px solid rgba(0,20,94,0.09)",
                  borderRadius: 20,
                  padding: "20px 22px",
                  background: "white",
                  minWidth: 0,
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <span className="card-expand-icon" style={{ position: "absolute", top: 12, right: 14, fontSize: 13, color: "#ccc", fontWeight: 700 }}>↗</span>
                {viz}
              </div>
            ))
          ) : (
            [<PieChart key="pie" />, <BarChart key="bar" />, <DataMaturity key="maturity" />, <StartRate key="startrate" />].map((viz, i) => (
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
            ))
          )}
        </div>
      </div>

      {activeModal && (
        <div
          onClick={() => setActiveModal(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,20,94,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", borderRadius: 20, padding: "32px",
              maxWidth: 560, width: "100%", maxHeight: "85vh",
              overflowY: "auto", position: "relative",
            }}
          >
            <button
              onClick={() => setActiveModal(null)}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "none", border: "none",
                cursor: "pointer", color: "#999",
                display: "flex", alignItems: "center", gap: 5,
                padding: 0,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1, verticalAlign: "middle" }}>Close</span>
              <span style={{ fontSize: 20, fontWeight: 400, lineHeight: 1, verticalAlign: "middle" }}>✕</span>
            </button>
            {activeModal === "journey" && <JourneyModal />}
            {activeModal === "visibility" && <VisibilityModal />}
            {activeModal === "ai" && <AIModal />}
            {activeModal === "kpi" && <KPIModal />}
          </div>
        </div>
      )}
    </>
  );
}
