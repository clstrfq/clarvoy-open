import type { IStorage } from "../storage";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const DEMO_USER_IDS = ["demo_reviewer_1", "demo_reviewer_2", "demo_reviewer_3"];

async function ensureDemoUsers() {
  const demoUsers = [
    { id: "demo_reviewer_1", firstName: "Dr. Sarah", lastName: "Chen", email: "sarah.chen@demo.clarvoy.org", username: "sarah_chen" },
    { id: "demo_reviewer_2", firstName: "Marcus", lastName: "Williams", email: "marcus.williams@demo.clarvoy.org", username: "marcus_williams" },
    { id: "demo_reviewer_3", firstName: "Elena", lastName: "Rodriguez", email: "elena.rodriguez@demo.clarvoy.org", username: "elena_rodriguez" },
  ];
  const demoPasswordHash = await bcrypt.hash("demo123", 12);
  for (const u of demoUsers) {
    const [existing] = await db.select().from(users).where(eq(users.id, u.id));
    if (!existing) {
      await db.insert(users).values({ ...u, passwordHash: demoPasswordHash });
    }
  }
}

const USE_CASES = [
  {
    title: "Waiver Slot Allocation: Who Gets Off the Waitlist?",
    description: "3 Consolidated Waiver slots have opened in your county. You have 14 adults on your internal priority list. The county requires you to recommend candidates based on urgency. Your board committee of 5 must independently score each candidate.\n\nKey considerations: Median PA waitlist time is 2.6 years. 38% of cases qualify as emergency category. Historical appeal rate is 12%. Average time from slot assignment to service start is 74 days.",
    category: "GRANT_ALLOCATION",
    status: "open",
    biases: ["Recency Bias", "Halo Effect", "Anchoring"],
    laws: ["Law 2 (Blind Input)", "Law 3 (Outside View)", "Law 6 (Cognitive Sovereignty)"],
    judgmentScores: [7, 8, 6],
    judgmentRationales: [
      "Candidate A has been on the waitlist longest (4.2 years) and meets emergency criteria. The urgency scoring methodology from PA DHS should weight duration and medical acuity equally.",
      "I recommend prioritizing Candidate C based on clinical acuity scores. While Candidate A has waited longer, C's caregiver situation is more precarious. However, I acknowledge the reference class data suggests duration-based allocation correlates with better outcomes.",
      "Scored based on a composite of wait time, medical complexity, and family support availability. The reference class shows 38% emergency category rate - we should ensure at least one slot goes to an emergency-tier candidate."
    ],
  },
  {
    title: "DSP Wage vs. Caseload Tradeoff",
    description: "Your Direct Support Professional (DSP) starting wage is $15.76/hr. Turnover is 47% annually. The state just raised the floor to $17.85/hr. The board must decide: (A) raise all DSP wages to $18.50/hr and reduce caseload capacity by 8 adults, (B) raise to $17.85/hr (state minimum) and maintain current capacity, or (C) create a tiered wage structure tied to credentialed training ($17.85 base, $19.50 with DSP-I certification, $21.00 with DSP-II).\n\nReference data: Turnover drops from 51% to 34% when wages exceed $17/hr. Average cost to replace one DSP is $4,872. Only 28% of PA orgs use tiered wages, but those see 18% turnover reduction.",
    category: "BUDGET_APPROVAL",
    status: "closed",
    biases: ["Status Quo Bias", "Loss Aversion", "Optimism Bias"],
    laws: ["Law 1 (Epistemic Rigor)", "Law 3 (Outside View)", "Guardrail 3 (Noise Injection)"],
    judgmentScores: [8, 5, 7],
    judgmentRationales: [
      "Option C (tiered wages) represents the best long-term investment. Monte Carlo shows 67% probability of net positive ROI by Year 2. The reference class supports credential-based differentiation, though only 28% of orgs have tried it.",
      "Option B (minimum compliance) is the safest path. We cannot risk losing 8 adults from service. The financial modeling shows too much uncertainty in Option A's projections. I rate this as moderate confidence.",
      "Option A is necessary despite the short-term capacity reduction. At 47% turnover, we are hemorrhaging institutional knowledge. The replacement cost data ($4,872/DSP) makes the math clear. Reducing capacity by 8 saves approximately $39K in annual turnover costs."
    ],
    outcome: "Option C approved with 12-month review checkpoint",
  },
  {
    title: "Aging Caregiver Emergency: Residential Placement Decision",
    description: "A 72-year-old single mother has been hospitalized and can no longer provide care for her 48-year-old son with Down syndrome. He has never lived outside the family home. Options: (A) emergency group home placement (available slot, 45 minutes from his community), (B) temporary respite care while pursuing closer placement (6-month estimated wait), or (C) Lifesharing arrangement with a trained host family in his neighborhood.\n\nThis decision exceeds the $50K annual cost threshold - Pre-Mortem analysis is mandatory. Each reviewer must describe a scenario in which their recommended option fails catastrophically.",
    category: "GRANT_ALLOCATION",
    status: "open",
    biases: ["Availability Bias", "Sunk Cost Fallacy", "Anchoring"],
    laws: ["Law 2 (Blind Input)", "Law 4 (Shadow Layer)", "Law 8 (Radical Transparency)"],
    judgmentScores: [6, 8, 7],
    judgmentRationales: [
      "Option B (respite + wait) preserves community connections. Pre-mortem: respite extends beyond 6 months, individual regresses behaviorally due to repeated transitions. Risk: 34% of 'temporary' placements become permanent.",
      "Option C (Lifesharing) offers the best person-centered outcome. Pre-mortem: host family burnout within 18 months (reference class shows 22% discontinuation rate). The individual's attachment patterns after 48 years with one caregiver create significant transition risk.",
      "Option A provides immediate stability. Pre-mortem: the 45-minute distance results in loss of community connections, day program attendance drops, and individual's mental health deteriorates. The group home's unfamiliar environment triggers behavioral crisis."
    ],
  },
  {
    title: "Day Program vs. Competitive Integrated Employment",
    description: "Federal policy (WIOA / CMS HCBS Final Rule) is pushing toward Competitive Integrated Employment (CIE) and away from facility-based day programs. 62% of your participants' families prefer the day program for safety and social reasons. Options: (A) fully transition to CIE model, (B) maintain hybrid (60% day program / 40% CIE), or (C) expand day program while adding a small CIE pilot.\n\nReference class: 178 similar transitions tracked. Average timeline is 36 months. Post-transition family satisfaction is 71%. 43% of participants employed at 12 months. 31% of organizations reverted to hybrid model. Average cost overrun vs. plan: 1.22x. Average time overrun: 1.41x.",
    category: "STRATEGIC_PLANNING",
    status: "open",
    biases: ["Confirmation Bias", "Groupthink", "Loss Aversion"],
    laws: ["Law 1 (Epistemic Rigor)", "Law 3 (Outside View)", "Law 6 (Cognitive Sovereignty)"],
    judgmentScores: [4, 7, 6],
    judgmentRationales: [
      "Option A is too risky given the reference class data showing 31% reversion rate. The 1.41x time overrun means a 3-year plan becomes 4.2 years. Family satisfaction at 71% means 29% are dissatisfied. We should not rush this transition.",
      "Option B (hybrid) is the pragmatic choice but I'm flagging my own potential groupthink bias. The reference class shows hybrid models have the highest long-term sustainability. CIE employment rates of 43% at 12 months suggest partial adoption is wise.",
      "Option C allows us to build CIE capacity without disrupting existing services. The pilot generates our own reference class data rather than relying solely on external benchmarks. This respects both federal direction and family preferences."
    ],
  },
  {
    title: "Federal Medicaid Funding Risk: Contingency Planning",
    description: "Congressional proposals threaten to convert Medicaid to a block grant or impose per-capita caps. Your organization receives 73% of revenue through Medicaid waiver reimbursements. Options: (A) build a 6-month cash reserve by reducing services now, (B) launch a diversified fundraising campaign targeting private donors and foundations, (C) form a regional coalition with 4 other providers for collective bargaining and shared services, or (D) maintain current operations and monitor the political landscape.\n\nHistorical reference class (n=23): Average cut when cuts occur is 8%. Maximum observed cut is 17%. Average implementation delay is 14 months. 9% of providers closed after a 10% cut. 14% merged. Average stabilization time post-cut is 18 months.",
    category: "BUDGET_APPROVAL",
    status: "open",
    biases: ["Optimism Bias", "Anchoring", "Status Quo Bias"],
    laws: ["Guardrail 3 (Noise Injection)", "Law 1 (Epistemic Rigor)", "Law 7 (Data Sovereignty)"],
    judgmentScores: [8, 6, 9],
    judgmentRationales: [
      "Option C (coalition) is the strongest strategic response. Monte Carlo simulation with funding perturbations shows coalition members survive 10% cuts 94% of the time vs. 78% for solo operators. The shared services model alone generates 12% cost savings.",
      "Option A + B combined: Build the reserve AND diversify. We cannot put all eggs in the coalition basket (what if partner orgs have different priorities?). The reference class shows 14-month implementation delay gives us runway to execute both.",
      "Option C with Option B as supplement. The data overwhelmingly supports collective action. The 9% closure rate after 10% cuts is alarming - and we are modeling scenarios up to 25% cuts. Status quo (Option D) is irresponsible given the evidence."
    ],
  },
  {
    title: "Supported Decision-Making vs. Guardianship Policy",
    description: "PA's Supported Decision-Making (SDM) movement is growing. Your organization currently requires full legal guardianship for adults in residential programs. Families and self-advocates request you adopt SDM. Options: (A) adopt SDM as default, requiring guardianship only when specifically indicated, (B) pilot SDM with 10 participants while maintaining guardianship requirement for others, or (C) maintain current guardianship-first policy with enhanced education.\n\nKey context: SDM aligns with HCBS Final Rule person-centered requirements. 47 states now have SDM legislation or pilots. PA is actively developing SDM frameworks. Self-advocacy organizations are monitoring provider policies.",
    category: "STRATEGIC_PLANNING",
    status: "closed",
    biases: ["Status Quo Bias", "Risk Aversion as Disguised Paternalism", "Confirmation Bias"],
    laws: ["Law 2 (Blind Input)", "Law 4 (Shadow Layer)", "Law 8 (Radical Transparency)"],
    judgmentScores: [9, 7, 5],
    judgmentRationales: [
      "Option A is the rights-based imperative. The Shadow Layer should flag any rationale that frames guardianship as 'safety' when it may actually reflect organizational liability concerns. Person-centered planning demands we presume competence.",
      "Option B (pilot) balances innovation with risk management. 10 participants gives us a meaningful sample size. We can measure outcomes, adjust, and scale. This generates our own reference class data within our specific population.",
      "Option C is the responsible choice. We have a duty of care. SDM is promising but unproven at scale in PA for adults with significant intellectual disabilities. The liability exposure of premature policy change is substantial."
    ],
    outcome: "Option B approved with self-advocate advisory committee established",
  },
  {
    title: "Accessible Housing Investment vs. Direct Service Expansion",
    description: "A property has become available for conversion into a 6-person community living arrangement. Total acquisition + renovation: $1.2M. Your organization has $400K in reserves and needs $800K through a capital campaign and/or PHFA grant. Alternatively, the $400K could fund 3 additional years of community-based supports for 12 adults on your waitlist.\n\nPre-Mortem required (exceeds $50K threshold). Reference class (n=94 PA nonprofit housing projects): Average cost overrun 1.28x ($1.2M becomes $1.54M). Average time overrun 1.45x. Capital campaign attainment rate: 82%. PHFA grant approval rate: 34%. Average time to occupancy: 22 months. Average annual maintenance per bed: $8,400.",
    category: "BUDGET_APPROVAL",
    status: "open",
    biases: ["Concrete vs. Abstract Bias", "Anchoring", "Sunk Cost (Prospective)"],
    laws: ["Law 1 (Epistemic Rigor)", "Law 3 (Outside View)", "Guardrail 3 (Noise Injection)"],
    judgmentScores: [5, 8, 6],
    judgmentRationales: [
      "The housing investment is a 30-year asset but the reference class is sobering: 1.28x cost overrun means $1.54M actual cost. Pre-mortem: PHFA denies grant (66% probability), capital campaign reaches only 60% of goal, project stalls at $720K invested with no path to completion.",
      "Direct service expansion serves 12 people immediately vs. 6 people in 22+ months. The cost-per-person-per-year for community supports (~$33K) is far more efficient than the housing per-bed cost. This is where Concrete vs. Abstract Bias is most dangerous - the building is photogenic, the services are invisible.",
      "Housing creates permanent infrastructure. Pre-mortem: if we don't buy now, the property sells to a developer and no comparable property emerges for 5+ years. Monte Carlo perturbation: even at 60% campaign attainment, the project is viable with bridge financing if we secure the PHFA grant."
    ],
  },
  {
    title: "Transportation Program: Build vs. Partner",
    description: "Transportation is the #1 barrier to employment and community participation for your adults. Options: (A) purchase 3 accessible vehicles and hire drivers ($285K year 1, ~$140K/yr ongoing), (B) partner with county shared-ride program and subsidize rides ($95K/yr but unreliable scheduling), or (C) contract with specialized transport vendor ($165K/yr with guaranteed scheduling).\n\nReference class (n=156): Average year 1 cost own fleet: $291K. Average ongoing annual cost own fleet: $152K. Average annual cost contracted: $158K. Average vehicle useful life: 7 years. 29% of orgs switched from own fleet to contracted. Shared-ride no-show rate: 18%. Contracted no-show rate: 6%.",
    category: "STRATEGIC_PLANNING",
    status: "closed",
    biases: ["Endowment Effect", "Recency Bias", "Optimism Bias"],
    laws: ["Law 1 (Epistemic Rigor)", "Law 3 (Outside View)", "Law 2 (Blind Input)"],
    judgmentScores: [6, 4, 8],
    judgmentRationales: [
      "Option C (contract) is the most cost-effective when you factor in the hidden costs of fleet ownership. The reference class shows own-fleet costs are $152K/yr ongoing vs. $158K contracted - nearly identical - but contracted eliminates driver recruitment, vehicle maintenance, insurance, and fuel volatility risk.",
      "Option A (own fleet) gives us control and flexibility. The 7-year vehicle life means the year-1 investment amortizes to ~$41K/year in vehicle costs alone. Pre-mortem: driver turnover (DSP-adjacent workforce) could be 30%+, leaving vehicles idle.",
      "Option C is clearly optimal. The 6% no-show rate vs. 18% for shared-ride is decisive for employment outcomes. 29% of orgs who tried own fleets switched to contracts - that's a strong signal. The Endowment Effect is real here: 'owning vehicles' feels powerful but the data doesn't support it."
    ],
    outcome: "Option C approved with performance SLA requirements",
  },
];

const REFERENCE_CLASSES = [
  {
    name: "PA HCBS Waiver Slot Allocation",
    source: "PA DHS Office of Developmental Programs",
    category: "GRANT_ALLOCATION",
    description: "Historical data on Consolidated Waiver slot allocation patterns across PA counties",
    metrics: { n: 847, avg_wait_months: 31.2, median_wait_months: 26, pct_emergency_category: 0.38, avg_cost_per_person_community: 119500, avg_cost_per_person_institutional: 602000, historical_appeal_rate: 0.12, avg_time_slot_to_service_start_days: 74 },
  },
  {
    name: "DSP Wage Impact Studies",
    source: "National Core Indicators / ANCOR / PHI National",
    category: "BUDGET_APPROVAL",
    description: "National DSP workforce studies and PA-specific wage impact data",
    metrics: { n: 312, avg_annual_turnover_below_17: 0.51, avg_annual_turnover_17_to_19: 0.34, avg_annual_turnover_above_19: 0.22, avg_cost_to_replace_one_dsp: 4872, avg_training_weeks_new_dsp: 6.2, pct_orgs_tiered_wage: 0.28, tiered_wage_turnover_reduction: 0.18 },
  },
  {
    name: "Aging Caregiver Emergency Placements",
    source: "PA DHS / National Alliance for Caregiving",
    category: "GRANT_ALLOCATION",
    description: "Emergency residential placement outcomes for adults with IDD when primary caregiver is no longer able to provide care",
    metrics: { n: 234, avg_transition_adjustment_months: 4.8, pct_temporary_became_permanent: 0.34, lifesharing_discontinuation_rate_18mo: 0.22, avg_behavioral_incidents_first_90_days: 3.7, pct_maintained_community_connections: 0.61, avg_annual_cost_group_home: 142000, avg_annual_cost_lifesharing: 68000 },
  },
  {
    name: "Sheltered Workshop to CIE Transitions",
    source: "APSE / StateData.info / PA ODP Employment Data",
    category: "STRATEGIC_PLANNING",
    description: "Outcomes from facility-based day program to Competitive Integrated Employment transitions",
    metrics: { n: 178, avg_transition_timeline_months: 36, pct_family_satisfaction_post_transition: 0.71, pct_participants_employed_12mo_post: 0.43, avg_hourly_wage_cie: 11.85, avg_cost_overrun_vs_plan: 1.22, avg_time_overrun_vs_plan: 1.41, pct_orgs_reverted_to_hybrid: 0.31 },
  },
  {
    name: "Medicaid Funding Disruption Historical",
    source: "KFF / MACPAC / PA Budget & Policy Center",
    category: "BUDGET_APPROVAL",
    description: "Historical Medicaid funding disruption events and provider impact data",
    metrics: { n: 23, avg_cut_when_cuts_occur_pct: 0.08, max_cut_observed_pct: 0.17, avg_implementation_delay_months: 14, pct_providers_closed_after_10pct_cut: 0.09, pct_providers_merged_after_10pct_cut: 0.14, avg_months_to_stabilize_post_cut: 18 },
  },
  {
    name: "Supported Decision-Making Adoption",
    source: "National Resource Center for SDM / Quality Trust DC",
    category: "STRATEGIC_PLANNING",
    description: "Outcomes from SDM implementation across disability service providers",
    metrics: { n: 89, states_with_sdm_legislation: 47, avg_pilot_duration_months: 18, pct_participants_reporting_improved_autonomy: 0.84, pct_guardians_reporting_comfort_post_pilot: 0.68, avg_liability_incidents_sdm_vs_guardianship_ratio: 0.92, pct_orgs_expanded_after_pilot: 0.73 },
  },
  {
    name: "PA Nonprofit Housing Development",
    source: "PHFA / PA Housing Alliance / UCP Housing Reports",
    category: "BUDGET_APPROVAL",
    description: "PA non-profit housing project cost and timeline data",
    metrics: { n: 94, avg_cost_overrun_pct: 1.28, avg_time_overrun_pct: 1.45, avg_capital_campaign_attainment_pct: 0.82, pct_phfa_grants_approved: 0.34, avg_time_to_occupancy_months: 22, avg_annual_maintenance_per_bed: 8400 },
  },
  {
    name: "Disability Transport Program Models",
    source: "Community Transportation Association / PA Rural Transit",
    category: "STRATEGIC_PLANNING",
    description: "Comparison of transportation program models for disability service providers",
    metrics: { n: 156, avg_year1_cost_own_fleet: 291000, avg_ongoing_annual_cost_own_fleet: 152000, avg_annual_cost_contracted: 158000, avg_vehicle_useful_life_years: 7, pct_orgs_switched_from_own_to_contract: 0.29, avg_rides_per_participant_per_month: 22, avg_no_show_rate_shared_ride: 0.18, avg_no_show_rate_contracted: 0.06 },
  },
];

export async function seedDemoData(storage: IStorage) {
  const existingDecisions = await storage.getDecisions();
  const hasDemoData = existingDecisions.some(d => d.isDemo);
  if (hasDemoData) {
    console.log("Demo data already exists, skipping seed.");
    return;
  }

  await ensureDemoUsers();

  for (const rc of REFERENCE_CLASSES) {
    await storage.createReferenceClass({ ...rc, isDemo: true });
  }
  console.log(`Seeded ${REFERENCE_CLASSES.length} reference classes`);

  const createdDecisionIds: number[] = [];

  for (const uc of USE_CASES) {
    const decision = await storage.createDecision({
      title: uc.title,
      description: uc.description,
      category: uc.category,
      status: uc.status,
      isDemo: true,
      outcome: uc.outcome || null,
      consensusreached: uc.status === "closed" ? true : false,
    });
    createdDecisionIds.push(decision.id);

    for (let i = 0; i < uc.judgmentScores.length; i++) {
      await storage.createJudgment({
        decisionId: decision.id,
        userId: DEMO_USER_IDS[i % DEMO_USER_IDS.length],
        score: uc.judgmentScores[i],
        rationale: uc.judgmentRationales[i],
      });
    }

    await storage.createAuditLog({
      userId: null,
      action: "DECISION_CREATED",
      entityType: "decision",
      entityId: decision.id,
      details: { isDemo: true, category: uc.category, title: uc.title },
      createdAt: randomDateInLastWeek(6),
    });

    for (const bias of uc.biases) {
      await storage.createAuditLog({
        userId: null,
        action: "BIAS_DETECTED",
        entityType: "decision",
        entityId: decision.id,
        details: {
          isDemo: true,
          biasType: bias,
          category: uc.category,
          severity: Math.floor(Math.random() * 40) + 50,
          description: `${bias} detected in "${uc.title}"`,
        },
        createdAt: randomDateInLastWeek(Math.floor(Math.random() * 7)),
      });
    }

    await storage.createAuditLog({
      userId: null,
      action: "JUDGMENT_SUBMITTED",
      entityType: "judgment",
      entityId: decision.id,
      details: {
        isDemo: true,
        category: uc.category,
        judgmentCount: uc.judgmentScores.length,
        meanScore: uc.judgmentScores.reduce((a, b) => a + b, 0) / uc.judgmentScores.length,
      },
      createdAt: randomDateInLastWeek(Math.floor(Math.random() * 5)),
    });

    if (uc.status === "closed") {
      await storage.createAuditLog({
        userId: null,
        action: "CONSENSUS_REACHED",
        entityType: "decision",
        entityId: decision.id,
        details: { isDemo: true, category: uc.category, outcome: uc.outcome },
        createdAt: randomDateInLastWeek(0),
      });
    }
  }

  const extraBiasEntries = [
    { biasType: "Sunk Cost Fallacy", category: "GRANT_ALLOCATION", day: 3, severity: 85 },
    { biasType: "Status Quo Bias", category: "STRATEGIC_PLANNING", day: 3, severity: 92 },
    { biasType: "Status Quo Bias", category: "BUDGET_APPROVAL", day: 2, severity: 78 },
    { biasType: "Anchoring", category: "GRANT_ALLOCATION", day: 4, severity: 71 },
    { biasType: "Loss Aversion", category: "BUDGET_APPROVAL", day: 1, severity: 88 },
    { biasType: "Optimism Bias", category: "STRATEGIC_PLANNING", day: 5, severity: 65 },
    { biasType: "Confirmation Bias", category: "STRATEGIC_PLANNING", day: 3, severity: 90 },
    { biasType: "Groupthink", category: "STRATEGIC_PLANNING", day: 3, severity: 87 },
    { biasType: "Halo Effect", category: "GRANT_ALLOCATION", day: 6, severity: 55 },
    { biasType: "Recency Bias", category: "GRANT_ALLOCATION", day: 1, severity: 73 },
    { biasType: "Availability Bias", category: "GRANT_ALLOCATION", day: 2, severity: 68 },
    { biasType: "Sunk Cost Fallacy", category: "BUDGET_APPROVAL", day: 4, severity: 80 },
    { biasType: "Concrete vs. Abstract Bias", category: "BUDGET_APPROVAL", day: 5, severity: 76 },
    { biasType: "Endowment Effect", category: "STRATEGIC_PLANNING", day: 6, severity: 62 },
    { biasType: "Risk Aversion as Disguised Paternalism", category: "STRATEGIC_PLANNING", day: 3, severity: 95 },
  ];

  for (const entry of extraBiasEntries) {
    const entityId = createdDecisionIds[Math.floor(Math.random() * createdDecisionIds.length)];
    await storage.createAuditLog({
      userId: null,
      action: "BIAS_DETECTED",
      entityType: "decision",
      entityId,
      details: {
        isDemo: true,
        biasType: entry.biasType,
        category: entry.category,
        severity: entry.severity,
        description: `${entry.biasType} pattern detected in ${entry.category} decisions`,
      },
      createdAt: randomDateInLastWeek(entry.day),
    });
  }

  console.log(`Seeded ${USE_CASES.length} demo decisions with judgments and ${24 + extraBiasEntries.length + USE_CASES.length * 2} audit log entries`);

  // ─── Seed PCC Grant History ────────────────────────────────────────────────
  const pccGrantHistory = [
    { funderName: "Partners Foundation", amount: 433353, year: 2022, sourceUrl: "https://www.propublica.org/", notes: "Multi-year unrestricted operating support" },
    { funderName: "Ackerman Foundation", amount: 50000, year: 2024, sourceUrl: null, notes: "Program support for vocational training" },
    { funderName: "Phoenixville Area Economic Development Corporation", amount: 45000, year: 2023, sourceUrl: null, notes: "Social enterprise development (260 Bridge Cafe expansion)" },
    { funderName: "The Tow Foundation", amount: 5000, year: 2023, sourceUrl: null, notes: "General operating support" },
    { funderName: "Eleanore Bennett Charitable Trust #1", amount: 2500, year: 2023, sourceUrl: null, notes: "Program support" },
  ];

  for (const entry of pccGrantHistory) {
    await storage.createOrgGrantHistory(entry);
  }
  console.log(`Seeded ${pccGrantHistory.length} PCC grant history entries`);
}

function randomDateInLastWeek(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
  return date;
}
