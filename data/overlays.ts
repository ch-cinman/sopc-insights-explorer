import type { OverlaysMap } from "./types";

export const OVERLAYS: OverlaysMap = {
  "Emerging biotech": {
    "What is the biggest data challenge for my segment?": {
      ta: {
        "Immunology & Inflammatory": "In immunology specifically, fragmentation is especially acute because PA status, SP pull-through, and HUB case data rarely land in the same place — creating blind spots exactly when access teams need real-time clarity on patient status.",
        "Oncology": "For oncology teams, data fragmentation often compounds with buy-and-bill complexity, where reimbursement data and clinical data sit in entirely separate systems with no shared workflow.",
        "Neurology & CNS": "CNS products face an additional layer: long diagnostic journeys mean patient data is often incomplete or inconsistent by the time it reaches the commercial team, compounding fragmentation challenges.",
        "Cardiovascular & Metabolic": "Cardiovascular teams tend to have stronger start rates than other TAs, but fragmentation still shows up in persistence tracking — where data drop-off between fill 1 and ongoing refill is a recurring visibility gap."
      },
      role: {
        "Market Access": "For market access leaders, fragmented data most often surfaces as an inability to see payer coverage changes and PA approval rates in real time — forcing teams to act on lagging information.",
        "Patient Services": "Patient services teams feel this as a disconnect between HUB case updates and SP fulfillment data — making it difficult to intervene proactively when patients are at risk of not starting.",
        "Field Access": "FRMs report that data fragmentation forces manual reconciliation across HUB portals, SP reports, and CRM entries — consuming time that should go toward provider relationships.",
        "Commercial Ops / IT": "From an IT and ops perspective, the survey found compliance and regulatory concerns are the second-highest data challenge at 27.3% for this function — reflecting the burden of managing governance across fragmented systems."
      }
    },
    "How does AI adoption compare across company sizes?": {
      ta: {
        "Oncology": "Oncology teams within emerging biotechs are more likely to use AI for risk-highlighting than other TAs — consistent with the clinical urgency that characterizes the category.",
        "Neurology & CNS": "CNS-focused teams are disproportionately in evaluation mode — 29.2% of Neurology respondents are evaluating AI vendors without yet deploying, suggesting a wait-and-see posture common in this TA.",
        "Immunology & Inflammatory": "Immunology teams show above-average interest in AI for recommending next-best actions at 62.5% — one of the highest rates of any segment — reflecting the complexity of PA and step-therapy navigation.",
        "Cardiovascular & Metabolic": "Cardiovascular teams are among the most AI-active in pilot programs, with 37.5% actively piloting — and notably, 31.2% report no major adoption barriers, the highest barrier-free rate of any TA."
      },
      role: {
        "Commercial Ops / IT": "IT and Ops leaders across all sizes cite lack of a clear use case as their top AI barrier at 40.9% — higher than any other function, and a structural challenge that falls squarely on this team to resolve.",
        "Executive": "Executive sponsors at emerging biotechs face a real tension: 28.9% of the segment has no formal AI tools in place at all, meaning executive investment decisions are often being made before the organizational infrastructure to absorb them exists.",
        "Market Access": "Market access teams are among the most interested in AI for action recommendation, but at emerging companies the path to deployment is blocked by alignment gaps — 38% of all emerging biotech respondents cite stakeholder misalignment as their top technology barrier."
      }
    },
    "What KPIs matter most to teams like mine?": {
      ta: {
        "Oncology": "Oncology teams weight time-to-start and 12-month persistence nearly equally at 46.7% and 50% respectively across the TA. Provider satisfaction/NPS also ranks unusually high at 30%, reflecting the physician relationship intensity of oncology access.",
        "Immunology & Inflammatory": "Immunology stands out for prioritizing start rate (42.5%) over 12-month persistence (20%) — the inverse of most other TAs. This reflects competitive market dynamics where securing the first fill is the primary commercial battlefield.",
        "Cardiovascular & Metabolic": "Cardiovascular teams lead all TAs on both patient start rate (73.5% mean) and 12-month persistence (75.6% mean). Patient satisfaction/NPS ranks at 43.8% — the highest of any TA — suggesting a more patient-centered measurement culture.",
        "Neurology & CNS": "CNS teams prioritize 12-month persistence above all else at 58.3% — the second-highest TA. This aligns with the chronic, long-term nature of most neurological conditions and the high cost of patient drop-off."
      },
      role: {
        "Patient Services": "Patient services leaders weight 12-month persistence and start rate most heavily. The industry mean persistence rate is 57.3% — with meaningful variation across TAs — suggesting significant room for improvement regardless of segment.",
        "Market Access": "Market access leaders prioritize PA approval rate and time in each milestone — reflecting the function's focus on the access funnel rather than downstream patient behavior.",
        "Field Access": "FRMs tend to anchor on time-to-start as the primary measure of field impact — at 42.2% across all respondents, it remains the most cited KPI industry-wide.",
        "Commercial Ops / IT": "IT/Ops respondents believe time-to-start is their business counterparts' most important KPI at 68.2% — notably higher than business respondents actually cited it (38.7%), revealing a perception gap around what commercial teams value most."
      }
    },
    "How are teams structured — internal vs. outsourced?": {
      ta: {
        "Oncology": "Oncology has among the highest rates of internal field access teams at 86.7% — slightly above the 83.2% industry average. The buy-and-bill dynamic in many oncology products drives a preference for internal reimbursement expertise.",
        "Immunology & Inflammatory": "Immunology teams show strong insourcing of field access at 82.5%, but patient services remains more mixed — 27.5% report a hybrid model, compared to 21.1% industry-wide.",
        "Neurology & CNS": "CNS teams have the highest rate of mixed patient services models at 33.3% — suggesting this TA is still navigating the insourcing transition, particularly for patient support functions.",
        "Cardiovascular & Metabolic": "Cardiovascular has a notably higher rate of external field access at 25% vs. the 8.7% industry average — the highest of any TA — possibly reflecting the broader prescriber base and different access dynamics in CV vs. rare disease categories."
      },
      role: {
        "Field Access": "For field access leaders, the insourcing picture is clear: 83.2% of companies now manage FRM functions internally. The primary remaining barrier to full insourcing is product fit — 2.5% say it doesn't make sense for their product type.",
        "Patient Services": "Patient services insourcing is progressing but slower than field access — 53.4% internal overall, with 24.8% still fully external and 21.1% in a hybrid model. Budget is the most cited barrier to completing the transition at 9.3%."
      }
    },
    "Where is investment going in 2026?": {
      ta: {
        "Oncology": "Oncology teams rank provider education as the dominant priority at 56.7% — the highest of any TA — followed by payer dynamics and automation/AI both at 36.7%. The prescriber relationship remains central to oncology access strategy.",
        "Immunology & Inflammatory": "Immunology teams balance provider education (42.5%) with automation/AI (40%) almost equally — reflecting both the relationship-intensive nature of the category and the operational complexity of managing high-volume PA workflows.",
        "Cardiovascular & Metabolic": "Cardiovascular teams split investment equally between patient education and provider education at 43.8% each — and rank direct-to-patient programs at 31.2%, above the 24.8% industry average.",
        "Neurology & CNS": "CNS teams stand out: 54.2% prioritize automation and AI — the highest rate of any TA. This likely reflects the long patient journey in neurology and the opportunity to use automation to maintain engagement across years of therapy."
      },
      role: {
        "Patient Services": "Patient services teams show stronger emphasis on patient education and direct-to-patient programs than other roles — consistent with their ownership of the patient experience after therapy initiation.",
        "Market Access": "Market access leaders weight payer dynamics above the segment average, reflecting their primary responsibility for navigating formulary and coverage challenges — particularly relevant in competitive TA categories.",
        "Commercial Ops / IT": "IT and Ops respondents rank patient education as their top investment area at 54.5% — notably higher than business respondents (30.7%), suggesting IT sees patient-facing digital tools as the most addressable investment opportunity."
      }
    },
    "What does the survey say about patient access performance?": {
      ta: {
        "Oncology": "Oncology reports the highest patient start rate of any TA at 77.9% mean — significantly above the 67.5% industry average. Established HUB and SP infrastructure and treatment urgency both contribute to the stronger performance.",
        "Immunology & Inflammatory": "Immunology shows the lowest start rate of any TA at 60.3% mean and the lowest 12-month persistence at 46.8% mean. Competitive dynamics and step-therapy requirements create meaningful access friction both at initiation and over time.",
        "Cardiovascular & Metabolic": "Cardiovascular teams lead all TAs on persistence at 75.6% mean — well above the 57.3% industry average. Chronic disease management and strong DTP program investment likely contribute to better long-term patient retention.",
        "Neurology & CNS": "CNS teams report solid start rates (74.6% mean) and persistence (62.8% mean) — both above industry average. The high insourcing rate for patient services in this TA may contribute to better downstream patient engagement."
      },
      role: {
        "Patient Services": "Patient services leaders are most attuned to persistence data. The industry median 12-month persistence is 60%, with rare disease showing the strongest persistence at 65.7% mean — suggesting product type is a meaningful driver of long-term patient retention.",
        "Market Access": "From a market access lens, start rates directly reflect the effectiveness of BV and PA processes. The 67.5% industry mean start rate means roughly 1 in 3 prescribed patients still don't start therapy — a significant access gap.",
        "Field Access": "Time-to-start is the proximate measure of field impact. The emphasis on this KPI at 42.2% industry-wide reflects how central it is to field performance measurement — and how much FRMs are held accountable for the front end of the access journey."
      }
    },
    "How aligned are commercial and IT/Ops teams?": {
      ta: {
        "Immunology & Inflammatory": "Immunology teams report notably low rates of very high alignment — only 5% report being fully aligned across goals, context, and priorities. The TA's operational complexity across PA, SP, and HUB workflows may be widening the gap between commercial intent and IT execution.",
        "Oncology": "Oncology teams show stronger alignment than average — 23.3% report being very aligned, above the industry average of 19.9%. The urgency of the category may be creating more cross-functional pressure to coordinate effectively.",
        "Neurology & CNS": "CNS has the highest rate of limited alignment at 12.5% — suggesting functional silos are more pronounced in this TA, possibly reflecting the longer commercial timelines and more complex payer environments for neurological conditions."
      },
      role: {
        "Commercial Ops / IT": "IT and Ops respondents describe alignment with business counterparts similarly to how business describes it with IT — most are mostly or somewhat aligned, with few on either extreme. The gap is in depth of shared context, not in stated goals.",
        "Executive": "For executive leaders, the alignment question has board-level implications: misalignment between commercial and IT/Ops functions is one of the top barriers to technology deployment, and it's a leadership problem as much as an operational one."
      }
    }
  }
};
