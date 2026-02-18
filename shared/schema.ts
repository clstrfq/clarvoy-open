export * from "./models/auth";
export * from "./models/chat";
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, date, real, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
import { relations } from "drizzle-orm";

export const decisions = pgTable("decisions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("draft"),
  deadline: timestamp("deadline"),
  authorId: varchar("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  consensusreached: boolean("consensus_reached").default(false),
  outcome: text("outcome"),
  isDemo: boolean("is_demo").default(false),
});

export const judgments = pgTable("judgments", {
  id: serial("id").primaryKey(),
  decisionId: integer("decision_id").references(() => decisions.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  score: integer("score").notNull(),
  rationale: text("rationale").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
}, (table) => ({
  oneJudgmentPerUserPerDecision: uniqueIndex("judgments_decision_user_uidx").on(table.decisionId, table.userId),
}));

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  decisionId: integer("decision_id").references(() => decisions.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isAiGenerated: boolean("is_ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  decisionId: integer("decision_id").references(() => decisions.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  objectPath: text("object_path").notNull(),
  extractedText: text("extracted_text"),
  context: text("context").notNull().default("decision"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referenceClasses = pgTable("reference_classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  source: text("source").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  metrics: jsonb("metrics").notNull(),
  isDemo: boolean("is_demo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── MCP Integration Tables ──────────────────────────────────────────────────

export const nonprofitProfiles = pgTable("nonprofit_profiles", {
  id: serial("id").primaryKey(),
  ein: varchar("ein", { length: 12 }).notNull().unique(),
  name: text("name").notNull(),
  city: text("city"),
  state: varchar("state", { length: 2 }),
  taxStatus: text("tax_status"),
  isPublicCharity: boolean("is_public_charity"),
  isTaxDeductible: boolean("is_tax_deductible"),
  classificationCodes: jsonb("classification_codes"),
  nteeCode: varchar("ntee_code", { length: 10 }),
  revenue: real("revenue"),
  expenses: real("expenses"),
  assets: real("assets"),
  employeeCount: integer("employee_count"),
  rawData: jsonb("raw_data"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const grantOpportunities = pgTable("grant_opportunities", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  title: text("title").notNull(),
  agency: text("agency"),
  fundingCategory: text("funding_category"),
  awardFloor: integer("award_floor"),
  awardCeiling: integer("award_ceiling"),
  openDate: date("open_date"),
  closeDate: date("close_date"),
  description: text("description"),
  rawData: jsonb("raw_data"),
  relevanceScore: real("relevance_score"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const decisionNonprofits = pgTable("decision_nonprofits", {
  id: serial("id").primaryKey(),
  decisionId: integer("decision_id").references(() => decisions.id).notNull(),
  nonprofitProfileId: integer("nonprofit_profile_id").references(() => nonprofitProfiles.id).notNull(),
  addedBy: varchar("added_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const decisionGrants = pgTable("decision_grants", {
  id: serial("id").primaryKey(),
  decisionId: integer("decision_id").references(() => decisions.id).notNull(),
  grantOpportunityId: integer("grant_opportunity_id").references(() => grantOpportunities.id).notNull(),
  addedBy: varchar("added_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const grantAlerts = pgTable("grant_alerts", {
  id: serial("id").primaryKey(),
  grantOpportunityId: integer("grant_opportunity_id").references(() => grantOpportunities.id).notNull(),
  relevanceScore: real("relevance_score").notNull(),
  relevanceReason: text("relevance_reason"),
  matchedKeywords: jsonb("matched_keywords"),
  status: text("status").notNull().default("new"),
  notifiedAt: timestamp("notified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orgGrantHistory = pgTable("org_grant_history", {
  id: serial("id").primaryKey(),
  funderName: text("funder_name").notNull(),
  amount: integer("amount").notNull(),
  year: integer("year").notNull(),
  sourceUrl: text("source_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── MCP Insert Schemas & Types ──────────────────────────────────────────────

export const insertNonprofitProfileSchema = createInsertSchema(nonprofitProfiles).omit({ id: true, createdAt: true, fetchedAt: true });
export const insertGrantOpportunitySchema = createInsertSchema(grantOpportunities).omit({ id: true, createdAt: true, fetchedAt: true });
export const insertGrantAlertSchema = createInsertSchema(grantAlerts).omit({ id: true, createdAt: true });
export const insertOrgGrantHistorySchema = createInsertSchema(orgGrantHistory).omit({ id: true, createdAt: true });

export type NonprofitProfile = typeof nonprofitProfiles.$inferSelect;
export type InsertNonprofitProfile = z.infer<typeof insertNonprofitProfileSchema>;
export type GrantOpportunityRecord = typeof grantOpportunities.$inferSelect;
export type InsertGrantOpportunityRecord = z.infer<typeof insertGrantOpportunitySchema>;
export type GrantAlertRecord = typeof grantAlerts.$inferSelect;
export type InsertGrantAlertRecord = z.infer<typeof insertGrantAlertSchema>;
export type OrgGrantHistoryRecord = typeof orgGrantHistory.$inferSelect;
export type InsertOrgGrantHistoryRecord = z.infer<typeof insertOrgGrantHistorySchema>;

// ─── Relations ───────────────────────────────────────────────────────────────

export const decisionsRelations = relations(decisions, ({ one, many }) => ({
  author: one(users, {
    fields: [decisions.authorId],
    references: [users.id],
  }),
  judgments: many(judgments),
  comments: many(comments),
  attachments: many(attachments),
}));

export const judgmentsRelations = relations(judgments, ({ one }) => ({
  decision: one(decisions, {
    fields: [judgments.decisionId],
    references: [decisions.id],
  }),
  user: one(users, {
    fields: [judgments.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  decision: one(decisions, {
    fields: [comments.decisionId],
    references: [decisions.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  decision: one(decisions, {
    fields: [attachments.decisionId],
    references: [decisions.id],
  }),
  user: one(users, {
    fields: [attachments.userId],
    references: [users.id],
  }),
}));

export const insertDecisionSchema = createInsertSchema(decisions).omit({ id: true, createdAt: true, updatedAt: true, authorId: true });
export const insertJudgmentSchema = createInsertSchema(judgments, {
  score: z.number().int().min(1).max(10),
  rationale: z.string().min(20, "Rationale must be at least 20 characters."),
}).omit({ id: true, submittedAt: true, userId: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, userId: true, isAiGenerated: true });
export const insertAttachmentSchema = createInsertSchema(attachments).omit({ id: true, createdAt: true, userId: true, extractedText: true });
export const insertReferenceClassSchema = createInsertSchema(referenceClasses).omit({ id: true, createdAt: true });

export type Decision = typeof decisions.$inferSelect;
export type InsertDecision = z.infer<typeof insertDecisionSchema>;
export type Judgment = typeof judgments.$inferSelect;
export type InsertJudgment = z.infer<typeof insertJudgmentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type ReferenceClass = typeof referenceClasses.$inferSelect;
export type InsertReferenceClass = z.infer<typeof insertReferenceClassSchema>;

export type CreateDecisionRequest = InsertDecision;
export type UpdateDecisionRequest = Partial<InsertDecision>;
export type CreateJudgmentRequest = InsertJudgment;
export type CreateCommentRequest = InsertComment;

export interface DecisionWithDetails extends Decision {
  author?: typeof users.$inferSelect;
  judgments?: Judgment[];
  comments?: Comment[];
}
