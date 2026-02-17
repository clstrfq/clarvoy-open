import { z } from "zod";

// ─── EIN Validation ──────────────────────────────────────────────────────────
export const einSchema = z
  .string()
  .regex(/^\d{2}-?\d{7}$/, "EIN must be 9 digits (e.g., 81-1874043 or 811874043)");

// ─── Charity Schemas ─────────────────────────────────────────────────────────

export const charityLookupResultSchema = z.object({
  ein: z.string(),
  name: z.string(),
  city: z.string().nullable().optional(),
  state: z.string().max(2).nullable().optional(),
  zipCode: z.string().nullable().optional(),
  taxStatus: z.string().nullable().optional(),
  deductibility: z.string().nullable().optional(),
  classificationCodes: z.record(z.unknown()).nullable().optional(),
  nteeCode: z.string().nullable().optional(),
  filingRequirement: z.string().nullable().optional(),
  rulingDate: z.string().nullable().optional(),
  rawData: z.record(z.unknown()).nullable().optional(),
});

export const charitySearchItemSchema = z.object({
  ein: z.string(),
  name: z.string(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  nteeCode: z.string().nullable().optional(),
});

export const charitySearchParamsSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters"),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const charitySearchResultSchema = z.object({
  results: z.array(charitySearchItemSchema),
  total: z.number().int(),
  hasMore: z.boolean(),
});

export const charityVerificationSchema = z.object({
  ein: z.string(),
  organizationName: z.string(),
  isPublicCharity: z.boolean(),
  isTaxDeductible: z.boolean(),
  status: z.string(),
});

// ─── Grant Schemas ───────────────────────────────────────────────────────────

export const grantOpportunitySchema = z.object({
  externalId: z.string().nullable().optional(),
  title: z.string(),
  agency: z.string().nullable().optional(),
  fundingCategory: z.string().nullable().optional(),
  awardFloor: z.number().int().nullable().optional(),
  awardCeiling: z.number().int().nullable().optional(),
  openDate: z.string().nullable().optional(),
  closeDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  rawData: z.record(z.unknown()).nullable().optional(),
});

export const grantDiscoverInputSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters"),
  filters: z.record(z.unknown()).nullable().optional(),
  maxResults: z.number().int().min(1).max(100).default(25),
  page: z.number().int().min(1).default(1),
  grantsPerPage: z.number().int().min(1).max(100).default(25),
});

export const grantDiscoverResultSchema = z.object({
  opportunities: z.array(grantOpportunitySchema),
  total: z.number().int(),
  page: z.number().int(),
});

export const grantAgenciesInputSchema = z.object({
  includeOpportunities: z.boolean().default(false),
  focusAgencies: z.array(z.string()).nullable().optional(),
  fundingCategory: z.string().nullable().optional(),
  maxAgencies: z.number().int().min(1).max(50).default(10),
});

export const agencyInfoSchema = z.object({
  name: z.string(),
  focusAreas: z.array(z.string()).nullable().optional(),
  totalFunding: z.number().nullable().optional(),
  opportunityCount: z.number().int().nullable().optional(),
  opportunities: z.array(grantOpportunitySchema).nullable().optional(),
});

export const grantAgenciesResultSchema = z.object({
  agencies: z.array(agencyInfoSchema),
});

export const grantTrendsInputSchema = z.object({
  timeWindowDays: z.number().int().min(7).max(365).default(90),
  categoryFilter: z.string().nullable().optional(),
  agencyFilter: z.string().nullable().optional(),
  minAwardAmount: z.number().int().nullable().optional(),
  includeForecasted: z.boolean().default(false),
});

export const fundingTrendSchema = z.object({
  category: z.string(),
  totalAmount: z.number().nullable().optional(),
  opportunityCount: z.number().int().nullable().optional(),
  averageAward: z.number().nullable().optional(),
  trend: z
    .enum(["increasing", "decreasing", "stable", "insufficient_data"])
    .nullable()
    .optional(),
});

export const trendSummarySchema = z.object({
  totalOpportunities: z.number().int(),
  totalFunding: z.number(),
  topCategory: z.string().nullable().optional(),
  timeWindowDays: z.number().int(),
});

export const grantTrendsResultSchema = z.object({
  trends: z.array(fundingTrendSchema),
  summary: trendSummarySchema,
});

// ─── Grant Alert Schemas ─────────────────────────────────────────────────────

export const grantAlertStatusEnum = z.enum([
  "new",
  "reviewed",
  "dismissed",
  "applied",
]);

export const grantAlertSchema = z.object({
  id: z.number().int(),
  grantOpportunityId: z.number().int(),
  relevanceScore: z.number().min(0).max(100),
  relevanceReason: z.string().nullable().optional(),
  matchedKeywords: z.array(z.string()).nullable().optional(),
  status: grantAlertStatusEnum,
  notifiedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  grant: grantOpportunitySchema.optional(),
});

export const grantAlertListResultSchema = z.object({
  alerts: z.array(grantAlertSchema),
  total: z.number().int(),
  newCount: z.number().int(),
});

export const grantAlertStatusUpdateSchema = z.object({
  status: grantAlertStatusEnum,
});

export const grantAlertListParamsSchema = z.object({
  status: grantAlertStatusEnum.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ─── Organization Profile Schemas ────────────────────────────────────────────

export const orgGrantHistoryEntrySchema = z.object({
  id: z.number().int().optional(),
  funderName: z.string(),
  amount: z.number().int(),
  year: z.number().int(),
  sourceUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const orgProfileSchema = z.object({
  ein: z.string(),
  name: z.string(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  taxStatus: z.string().nullable().optional(),
  isPublicCharity: z.boolean().nullable().optional(),
  isTaxDeductible: z.boolean().nullable().optional(),
  nteeCode: z.string().nullable().optional(),
  revenue: z.number().nullable().optional(),
  expenses: z.number().nullable().optional(),
  assets: z.number().nullable().optional(),
  employeeCount: z.number().int().nullable().optional(),
  grantHistory: z.array(orgGrantHistoryEntrySchema),
  alertCount: z.number().int(),
});

// ─── MCP Status Schemas ─────────────────────────────────────────────────────

export const mcpServerStatusSchema = z.object({
  connected: z.boolean(),
  tools: z.array(z.string()).nullable().optional(),
  error: z.string().nullable().optional(),
});

export const mcpStatusSchema = z.object({
  grants: mcpServerStatusSchema,
  charity: mcpServerStatusSchema,
});

// ─── Scan Result Schema ──────────────────────────────────────────────────────

export const scanResultSchema = z.object({
  scanned: z.number().int(),
  newAlerts: z.number().int(),
  duration: z.number().optional(),
});

// ─── Typed Route Contracts ───────────────────────────────────────────────────
// Follows the same pattern as shared/routes.ts

import { errorSchemas } from "./routes";

export const mcpApi = {
  charity: {
    lookup: {
      method: "GET" as const,
      path: "/api/charity/lookup/:ein" as const,
      responses: {
        200: charityLookupResultSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
        502: errorSchemas.internal,
      },
    },
    search: {
      method: "GET" as const,
      path: "/api/charity/search" as const,
      input: charitySearchParamsSchema,
      responses: {
        200: charitySearchResultSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        502: errorSchemas.internal,
      },
    },
    verify: {
      method: "GET" as const,
      path: "/api/charity/verify/:ein" as const,
      responses: {
        200: charityVerificationSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
        502: errorSchemas.internal,
      },
    },
  },
  grants: {
    discover: {
      method: "POST" as const,
      path: "/api/grants/discover" as const,
      input: grantDiscoverInputSchema,
      responses: {
        200: grantDiscoverResultSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        502: errorSchemas.internal,
      },
    },
    agencies: {
      method: "POST" as const,
      path: "/api/grants/agencies" as const,
      input: grantAgenciesInputSchema,
      responses: {
        200: grantAgenciesResultSchema,
        401: errorSchemas.unauthorized,
        502: errorSchemas.internal,
      },
    },
    trends: {
      method: "POST" as const,
      path: "/api/grants/trends" as const,
      input: grantTrendsInputSchema,
      responses: {
        200: grantTrendsResultSchema,
        401: errorSchemas.unauthorized,
        502: errorSchemas.internal,
      },
    },
  },
  alerts: {
    list: {
      method: "GET" as const,
      path: "/api/grants/alerts" as const,
      input: grantAlertListParamsSchema,
      responses: {
        200: grantAlertListResultSchema,
        401: errorSchemas.unauthorized,
      },
    },
    updateStatus: {
      method: "POST" as const,
      path: "/api/grants/alerts/:id/status" as const,
      input: grantAlertStatusUpdateSchema,
      responses: {
        200: grantAlertSchema,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  org: {
    profile: {
      method: "GET" as const,
      path: "/api/org/profile" as const,
      responses: {
        200: orgProfileSchema,
        401: errorSchemas.unauthorized,
        502: errorSchemas.internal,
      },
    },
  },
  admin: {
    scanGrants: {
      method: "POST" as const,
      path: "/api/admin/scan-grants" as const,
      responses: {
        200: scanResultSchema,
        401: errorSchemas.unauthorized,
        502: errorSchemas.internal,
      },
    },
  },
  status: {
    method: "GET" as const,
    path: "/api/mcp/status" as const,
    responses: {
      200: mcpStatusSchema,
    },
  },
};

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type CharityLookupResult = z.infer<typeof charityLookupResultSchema>;
export type CharitySearchItem = z.infer<typeof charitySearchItemSchema>;
export type CharitySearchParams = z.infer<typeof charitySearchParamsSchema>;
export type CharitySearchResult = z.infer<typeof charitySearchResultSchema>;
export type CharityVerification = z.infer<typeof charityVerificationSchema>;

export type GrantOpportunity = z.infer<typeof grantOpportunitySchema>;
export type GrantDiscoverInput = z.infer<typeof grantDiscoverInputSchema>;
export type GrantDiscoverResult = z.infer<typeof grantDiscoverResultSchema>;
export type GrantAgenciesInput = z.infer<typeof grantAgenciesInputSchema>;
export type AgencyInfo = z.infer<typeof agencyInfoSchema>;
export type GrantAgenciesResult = z.infer<typeof grantAgenciesResultSchema>;
export type GrantTrendsInput = z.infer<typeof grantTrendsInputSchema>;
export type FundingTrend = z.infer<typeof fundingTrendSchema>;
export type TrendSummary = z.infer<typeof trendSummarySchema>;
export type GrantTrendsResult = z.infer<typeof grantTrendsResultSchema>;

export type GrantAlertStatus = z.infer<typeof grantAlertStatusEnum>;
export type GrantAlert = z.infer<typeof grantAlertSchema>;
export type GrantAlertListResult = z.infer<typeof grantAlertListResultSchema>;
export type GrantAlertStatusUpdate = z.infer<typeof grantAlertStatusUpdateSchema>;
export type GrantAlertListParams = z.infer<typeof grantAlertListParamsSchema>;

export type OrgGrantHistoryEntry = z.infer<typeof orgGrantHistoryEntrySchema>;
export type OrgProfile = z.infer<typeof orgProfileSchema>;

export type McpServerStatus = z.infer<typeof mcpServerStatusSchema>;
export type McpStatus = z.infer<typeof mcpStatusSchema>;
export type ScanResult = z.infer<typeof scanResultSchema>;
