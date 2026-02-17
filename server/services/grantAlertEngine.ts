import { opportunityDiscovery } from "./mcpClient";
import { storage } from "../storage";
import type { GrantOpportunity } from "@shared/mcp-schemas";
import type { ScanResult } from "@shared/mcp-schemas";

// ─── PCC Mission Keywords ────────────────────────────────────────────────────

const MISSION_KEYWORDS = [
  "intellectual disability",
  "developmental disability",
  "autism",
  "mental health",
  "community living",
  "supported employment",
  "social enterprise",
  "vocational training",
  "vocational rehabilitation",
  "hcbs",
  "home and community based",
  "community integration",
  "residential services",
  "disability services",
  "day program",
  "workforce development disability",
  "transition services",
  "self-determination",
  "person-centered",
  "supported decision-making",
  "direct support professional",
];

const GEOGRAPHIC_KEYWORDS = [
  "pennsylvania",
  "pa",
  "nationwide",
  "all states",
  "national",
  "united states",
  "us",
];

const RELEVANT_AGENCIES = [
  "hhs",
  "acl",
  "samhsa",
  "administration for community living",
  "department of health and human services",
  "department of education",
  "rsa",
  "rehabilitation services administration",
  "usda",
  "department of agriculture",
  "department of labor",
  "cms",
  "centers for medicare",
];

const PA_STATE_AGENCIES = [
  "pa dhs",
  "pa odp",
  "pa ddc",
  "pennsylvania developmental disabilities council",
  "dced",
  "department of community and economic development",
];

// ─── Relevance Scoring ───────────────────────────────────────────────────────

export interface RelevanceResult {
  score: number;
  reasons: string[];
  matchedKeywords: string[];
}

export function calculateRelevance(grant: GrantOpportunity): RelevanceResult {
  let score = 0;
  const reasons: string[] = [];
  const matchedKeywords: string[] = [];
  const searchText = [
    grant.title,
    grant.description,
    grant.agency,
    grant.fundingCategory,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Geographic match (+30)
  const geoMatches = GEOGRAPHIC_KEYWORDS.filter((kw) =>
    searchText.includes(kw.toLowerCase())
  );
  if (geoMatches.length > 0) {
    score += 30;
    reasons.push(`Geographic match: ${geoMatches.join(", ")}`);
    matchedKeywords.push(...geoMatches);
  }

  // Mission match (+30, scaled by number of keyword hits)
  const missionMatches = MISSION_KEYWORDS.filter((kw) =>
    searchText.includes(kw.toLowerCase())
  );
  if (missionMatches.length > 0) {
    const missionScore = Math.min(30, missionMatches.length * 10);
    score += missionScore;
    reasons.push(
      `Mission match (${missionMatches.length} keywords): ${missionMatches.slice(0, 5).join(", ")}`
    );
    matchedKeywords.push(...missionMatches);
  }

  // Agency match (+20)
  const allAgencies = [...RELEVANT_AGENCIES, ...PA_STATE_AGENCIES];
  const agencyMatches = allAgencies.filter((ag) =>
    searchText.includes(ag.toLowerCase())
  );
  if (agencyMatches.length > 0) {
    score += 20;
    reasons.push(`Agency match: ${agencyMatches.join(", ")}`);
    matchedKeywords.push(...agencyMatches);
  }

  // Funding fit (+10): PCC revenue $6.4M, reasonable grant range $5K-$2M
  const floor = grant.awardFloor ?? 0;
  const ceiling = grant.awardCeiling ?? Infinity;
  if (floor <= 2_000_000 && ceiling >= 5_000) {
    score += 10;
    reasons.push(
      `Funding range fits PCC scale: $${floor.toLocaleString()}-$${ceiling === Infinity ? "open" : ceiling.toLocaleString()}`
    );
  }

  // Category match (+10)
  const category = (grant.fundingCategory || "").toLowerCase();
  const categoryKeywords = [
    "health",
    "mental health",
    "disability",
    "community development",
    "education",
    "workforce",
    "housing",
    "agriculture",
    "social services",
  ];
  const catMatches = categoryKeywords.filter((c) => category.includes(c));
  if (catMatches.length > 0) {
    score += 10;
    reasons.push(`Category match: ${catMatches.join(", ")}`);
    matchedKeywords.push(...catMatches);
  }

  return {
    score: Math.min(100, score),
    reasons,
    matchedKeywords: Array.from(new Set(matchedKeywords)),
  };
}

// ─── Scan Logic ──────────────────────────────────────────────────────────────

const SCAN_QUERIES = [
  "disability services Pennsylvania",
  "HCBS community living waiver",
  "mental health vocational rehabilitation",
  "social enterprise disability employment",
  "supported employment autism developmental",
];

const RELEVANCE_THRESHOLD = 40;

export async function scanForNewGrants(): Promise<ScanResult> {
  const startTime = Date.now();
  let scanned = 0;
  let newAlerts = 0;

  for (const query of SCAN_QUERIES) {
    try {
      const result = await opportunityDiscovery({
        query,
        maxResults: 25,
        page: 1,
        grantsPerPage: 25,
      });

      for (const opp of result.opportunities) {
        scanned++;

        // Deduplicate by externalId
        if (opp.externalId) {
          const existing = await storage.getGrantOpportunity(opp.externalId);
          if (existing) continue;
        }

        // Calculate relevance
        const relevance = calculateRelevance(opp);
        if (relevance.score < RELEVANCE_THRESHOLD) continue;

        // Upsert the grant opportunity
        const saved = await storage.upsertGrantOpportunity({
          externalId: opp.externalId ?? null,
          title: opp.title,
          agency: opp.agency ?? null,
          fundingCategory: opp.fundingCategory ?? null,
          awardFloor: opp.awardFloor ?? null,
          awardCeiling: opp.awardCeiling ?? null,
          openDate: opp.openDate ?? null,
          closeDate: opp.closeDate ?? null,
          description: opp.description ?? null,
          rawData: opp.rawData ?? null,
          relevanceScore: relevance.score,
        });

        // Create the alert
        await storage.createGrantAlert({
          grantOpportunityId: saved.id,
          relevanceScore: relevance.score,
          relevanceReason: relevance.reasons.join("; "),
          matchedKeywords: relevance.matchedKeywords,
          status: "new",
        });

        newAlerts++;
      }
    } catch (error) {
      console.error(`Grant scan failed for query "${query}":`, error);
      // Continue scanning other queries even if one fails
    }
  }

  const duration = Date.now() - startTime;
  console.log(
    `Grant scan complete: ${scanned} evaluated, ${newAlerts} new alerts, ${duration}ms`
  );

  return { scanned, newAlerts, duration };
}

// ─── Scanner Lifecycle ───────────────────────────────────────────────────────

let scanInterval: ReturnType<typeof setInterval> | null = null;

export function startGrantScanner(): void {
  const intervalMs = parseInt(
    process.env.GRANT_SCAN_INTERVAL_MS || "21600000",
    10
  ); // default 6 hours

  if (scanInterval) {
    console.log("Grant scanner already running");
    return;
  }

  console.log(
    `Starting grant scanner (interval: ${(intervalMs / 1000 / 60 / 60).toFixed(1)}h)`
  );

  // Run an initial scan after a short delay (let the server fully start)
  setTimeout(async () => {
    try {
      await scanForNewGrants();
    } catch (error) {
      console.error("Initial grant scan failed:", error);
    }
  }, 30_000); // 30 second delay

  scanInterval = setInterval(async () => {
    try {
      await scanForNewGrants();
    } catch (error) {
      console.error("Scheduled grant scan failed:", error);
    }
  }, intervalMs);
}

export function stopGrantScanner(): void {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
    console.log("Grant scanner stopped");
  }
}
