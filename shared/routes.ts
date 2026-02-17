import { z } from 'zod';
import { insertDecisionSchema, insertJudgmentSchema, insertCommentSchema, decisions, judgments, comments, auditLogs } from './schema';

// Error Schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  decisions: {
    list: {
      method: 'GET' as const,
      path: '/api/decisions' as const,
      responses: {
        200: z.array(z.custom<typeof decisions.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/decisions/:id' as const,
      responses: {
        200: z.custom<typeof decisions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/decisions' as const,
      input: insertDecisionSchema,
      responses: {
        201: z.custom<typeof decisions.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/decisions/:id' as const,
      input: insertDecisionSchema.partial(),
      responses: {
        200: z.custom<typeof decisions.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/decisions/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  judgments: {
    create: {
      method: 'POST' as const,
      path: '/api/decisions/:decisionId/judgments' as const,
      input: insertJudgmentSchema.omit({ decisionId: true }),
      responses: {
        201: z.custom<typeof judgments.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/decisions/:decisionId/judgments' as const,
      responses: {
        200: z.array(z.custom<typeof judgments.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
  },
  comments: {
    create: {
      method: 'POST' as const,
      path: '/api/decisions/:decisionId/comments' as const,
      input: insertCommentSchema.omit({ decisionId: true }),
      responses: {
        201: z.custom<typeof comments.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/decisions/:decisionId/comments' as const,
      responses: {
        200: z.array(z.custom<typeof comments.$inferSelect>()),
      },
    },
  },
};

// MCP Integration API contracts (charity, grants, alerts, org profile)
export { mcpApi } from "./mcp-schemas";
export type {
  CharityLookupResult,
  CharitySearchItem,
  CharitySearchParams,
  CharitySearchResult,
  CharityVerification,
  GrantOpportunity,
  GrantDiscoverInput,
  GrantDiscoverResult,
  GrantAgenciesInput,
  AgencyInfo,
  GrantAgenciesResult,
  GrantTrendsInput,
  FundingTrend,
  TrendSummary,
  GrantTrendsResult,
  GrantAlertStatus,
  GrantAlert,
  GrantAlertListResult,
  GrantAlertStatusUpdate,
  GrantAlertListParams,
  OrgGrantHistoryEntry,
  OrgProfile,
  McpServerStatus,
  McpStatus,
  ScanResult,
} from "./mcp-schemas";

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
