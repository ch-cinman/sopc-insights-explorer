import type { QuestionsMap, OpeningMap } from "./types";

export const QUESTIONS: QuestionsMap = {
  "Emerging biotech": [
    "What is the biggest data challenge for my segment?",
    "How does AI adoption compare across company sizes?",
    "What KPIs matter most to teams like mine?",
    "How are teams structured — internal vs. outsourced?",
    "Where is investment going in 2026?",
    "What does the survey say about patient access performance?",
    "How aligned are commercial and IT/Ops teams?"
  ],
  "Small biotech": [
    "What is the biggest data challenge for my segment?",
    "How does AI adoption compare across company sizes?",
    "What KPIs matter most to teams like mine?",
    "How are teams structured — internal vs. outsourced?",
    "Where is investment going in 2026?",
    "What does the survey say about patient access performance?",
    "How aligned are commercial and IT/Ops teams?"
  ],
  "Mid-size pharma": [
    "What is the biggest data challenge for my segment?",
    "How does AI adoption compare across company sizes?",
    "What KPIs matter most to teams like mine?",
    "How are teams structured — internal vs. outsourced?",
    "Where is investment going in 2026?",
    "What does the survey say about patient access performance?",
    "How aligned are commercial and IT/Ops teams?"
  ],
  "Large pharma": [
    "What is the biggest data challenge for my segment?",
    "How does AI adoption compare across company sizes?",
    "What KPIs matter most to teams like mine?",
    "How are teams structured — internal vs. outsourced?",
    "Where is investment going in 2026?",
    "What does the survey say about patient access performance?",
    "How aligned are commercial and IT/Ops teams?"
  ]
};

export const OPENING: OpeningMap = {
  "Emerging biotech": `Here are findings from the <strong>2026 State of Patient-Centricity</strong> survey relevant to <span class="seg">Emerging Biotech</span> commercial leaders. Your segment has the highest rate of no major AI adoption barriers of any company size — yet <span class="sc">28.9%</span> still have no formal AI tools or initiatives in place. The path is clear; the infrastructure just hasn't been built yet. Select a question below to explore specific benchmarks for your segment.`,
  "Small biotech": `Here are findings from the <strong>2026 State of Patient-Centricity</strong> survey relevant to <span class="seg">Small Biotech</span> commercial leaders. Your segment has the highest rate of internal FRM teams of any company size at <span class="sc">90.2%</span>, yet reports the lowest mean patient start rate at <span class="sc">62.6%</span>. The field execution is there — the access friction is happening upstream. Select a question below to explore specific benchmarks for your segment.`,
  "Mid-size pharma": `Here are findings from the <strong>2026 State of Patient-Centricity</strong> survey relevant to <span class="seg">Mid-Size Pharma</span> commercial leaders. Your segment leads all company sizes on AI action recommendation at <span class="sc">75.5%</span> — the most operationally mature AI use case in the survey. Yet only <span class="sc">14.3%</span> report full cross-functional alignment, the lowest of any segment. The capability is ahead of the coordination. Select a question below to explore specific benchmarks for your segment.`,
  "Large pharma": `Here are findings from the <strong>2026 State of Patient-Centricity</strong> survey relevant to <span class="seg">Large Pharma</span> commercial leaders. Your segment measures 12-month persistence more intensively than any other — <span class="sc">58.6%</span> cite it as a top KPI — yet reports the lowest mean persistence outcome of any company size at <span class="sc">53.3%</span>. The measurement priority is clear; closing the gap between intention and outcome is the work. Select a question below to explore specific benchmarks for your segment.`
};
