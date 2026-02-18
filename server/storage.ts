import { db } from "./db";
import {
  decisions, judgments, comments, auditLogs, attachments, referenceClasses,
  nonprofitProfiles, grantOpportunities, decisionNonprofits, decisionGrants,
  grantAlerts, orgGrantHistory,
  type Decision, type InsertDecision,
  type Judgment, type InsertJudgment,
  type Comment, type InsertComment,
  type AuditLog, type Attachment, type InsertAttachment,
  type ReferenceClass, type InsertReferenceClass,
  type NonprofitProfile, type InsertNonprofitProfile,
  type GrantOpportunityRecord, type InsertGrantOpportunityRecord,
  type GrantAlertRecord, type InsertGrantAlertRecord,
  type OrgGrantHistoryRecord, type InsertOrgGrantHistoryRecord,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getDecisions(): Promise<Decision[]>;
  getDecision(id: number): Promise<Decision | undefined>;
  createDecision(decision: InsertDecision & { authorId?: string | null }): Promise<Decision>;
  updateDecision(id: number, decision: Partial<InsertDecision>): Promise<Decision>;
  deleteDecision(id: number): Promise<void>;

  createJudgment(judgment: InsertJudgment & { userId: string }): Promise<Judgment>;
  getJudgments(decisionId: number): Promise<Judgment[]>;
  getUserJudgment(decisionId: number, userId: string): Promise<Judgment | undefined>;

  createComment(comment: InsertComment & { userId: string }): Promise<Comment>;
  getComments(decisionId: number): Promise<Comment[]>;

  createAttachment(attachment: InsertAttachment & { userId: string; extractedText?: string | null }): Promise<Attachment>;
  getAttachments(decisionId: number): Promise<Attachment[]>;
  getAttachment(id: number): Promise<Attachment | undefined>;
  getAttachmentByObjectPath(objectPath: string): Promise<Attachment | undefined>;
  updateAttachmentText(id: number, extractedText: string): Promise<Attachment>;
  deleteAttachment(id: number): Promise<void>;

  createAuditLog(log: any): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;

  getReferenceClasses(): Promise<ReferenceClass[]>;
  getReferenceClass(id: number): Promise<ReferenceClass | undefined>;
  createReferenceClass(rc: InsertReferenceClass): Promise<ReferenceClass>;

  // Nonprofit profiles
  getNonprofitByEin(ein: string): Promise<NonprofitProfile | undefined>;
  upsertNonprofitProfile(profile: InsertNonprofitProfile): Promise<NonprofitProfile>;
  getDecisionNonprofits(decisionId: number): Promise<NonprofitProfile[]>;
  linkNonprofitToDecision(decisionId: number, nonprofitId: number, userId: string): Promise<void>;

  // Grant opportunities
  getGrantOpportunity(externalId: string): Promise<GrantOpportunityRecord | undefined>;
  upsertGrantOpportunity(opp: InsertGrantOpportunityRecord): Promise<GrantOpportunityRecord>;
  getDecisionGrants(decisionId: number): Promise<GrantOpportunityRecord[]>;
  linkGrantToDecision(decisionId: number, grantId: number, userId: string): Promise<void>;

  // Grant alerts
  getGrantAlerts(status?: string, limit?: number, offset?: number): Promise<{ alerts: GrantAlertRecord[]; total: number; newCount: number }>;
  getGrantAlert(id: number): Promise<GrantAlertRecord | undefined>;
  createGrantAlert(alert: InsertGrantAlertRecord): Promise<GrantAlertRecord>;
  updateGrantAlertStatus(id: number, status: string): Promise<GrantAlertRecord>;
  getAlertCount(status?: string): Promise<number>;

  // Org grant history
  getOrgGrantHistory(): Promise<OrgGrantHistoryRecord[]>;
  createOrgGrantHistory(entry: InsertOrgGrantHistoryRecord): Promise<OrgGrantHistoryRecord>;
}

export class DatabaseStorage implements IStorage {
  async getDecisions(): Promise<Decision[]> {
    return await db.select().from(decisions).orderBy(desc(decisions.createdAt));
  }

  async getDecision(id: number): Promise<Decision | undefined> {
    const [decision] = await db.select().from(decisions).where(eq(decisions.id, id));
    return decision;
  }

  async createDecision(insertDecision: InsertDecision & { authorId?: string | null }): Promise<Decision> {
    const [decision] = await db.insert(decisions).values(insertDecision).returning();
    return decision;
  }

  async updateDecision(id: number, update: Partial<InsertDecision>): Promise<Decision> {
    const [decision] = await db
      .update(decisions)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(decisions.id, id))
      .returning();
    return decision;
  }

  async deleteDecision(id: number): Promise<void> {
    await db.delete(decisions).where(eq(decisions.id, id));
  }

  async createJudgment(insertJudgment: InsertJudgment & { userId: string }): Promise<Judgment> {
    const [judgment] = await db.insert(judgments).values(insertJudgment).returning();
    return judgment;
  }

  async getJudgments(decisionId: number): Promise<Judgment[]> {
    return await db.select().from(judgments).where(eq(judgments.decisionId, decisionId));
  }

  async getUserJudgment(decisionId: number, userId: string): Promise<Judgment | undefined> {
    const [judgment] = await db
      .select()
      .from(judgments)
      .where(and(eq(judgments.decisionId, decisionId), eq(judgments.userId, userId)));
    return judgment;
  }

  async createComment(insertComment: InsertComment & { userId: string }): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  async getComments(decisionId: number): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.decisionId, decisionId)).orderBy(comments.createdAt);
  }

  async createAttachment(insertAttachment: InsertAttachment & { userId: string; extractedText?: string | null }): Promise<Attachment> {
    const [attachment] = await db.insert(attachments).values(insertAttachment).returning();
    return attachment;
  }

  async getAttachments(decisionId: number): Promise<Attachment[]> {
    return await db.select().from(attachments).where(eq(attachments.decisionId, decisionId)).orderBy(attachments.createdAt);
  }

  async getAttachment(id: number): Promise<Attachment | undefined> {
    const [attachment] = await db.select().from(attachments).where(eq(attachments.id, id));
    return attachment;
  }

  async getAttachmentByObjectPath(objectPath: string): Promise<Attachment | undefined> {
    const [attachment] = await db.select().from(attachments).where(eq(attachments.objectPath, objectPath));
    return attachment;
  }

  async updateAttachmentText(id: number, extractedText: string): Promise<Attachment> {
    const [attachment] = await db.update(attachments).set({ extractedText }).where(eq(attachments.id, id)).returning();
    return attachment;
  }

  async deleteAttachment(id: number): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
  }

  async createAuditLog(log: any): Promise<AuditLog> {
    const [entry] = await db.insert(auditLogs).values(log).returning();
    return entry;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  }

  async getReferenceClasses(): Promise<ReferenceClass[]> {
    return await db.select().from(referenceClasses).orderBy(referenceClasses.name);
  }

  async getReferenceClass(id: number): Promise<ReferenceClass | undefined> {
    const [rc] = await db.select().from(referenceClasses).where(eq(referenceClasses.id, id));
    return rc;
  }

  async createReferenceClass(rc: InsertReferenceClass): Promise<ReferenceClass> {
    const [entry] = await db.insert(referenceClasses).values(rc).returning();
    return entry;
  }

  // ─── Nonprofit Profiles ──────────────────────────────────────────────────

  async getNonprofitByEin(ein: string): Promise<NonprofitProfile | undefined> {
    const [profile] = await db.select().from(nonprofitProfiles).where(eq(nonprofitProfiles.ein, ein.replace(/-/g, "")));
    return profile;
  }

  async upsertNonprofitProfile(profile: InsertNonprofitProfile): Promise<NonprofitProfile> {
    const normalizedEin = profile.ein.replace(/-/g, "");
    const existing = await this.getNonprofitByEin(normalizedEin);
    if (existing) {
      const [updated] = await db
        .update(nonprofitProfiles)
        .set({ ...profile, ein: normalizedEin, fetchedAt: new Date() })
        .where(eq(nonprofitProfiles.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(nonprofitProfiles).values({ ...profile, ein: normalizedEin }).returning();
    return created;
  }

  async getDecisionNonprofits(decisionId: number): Promise<NonprofitProfile[]> {
    const rows = await db
      .select({ profile: nonprofitProfiles })
      .from(decisionNonprofits)
      .innerJoin(nonprofitProfiles, eq(decisionNonprofits.nonprofitProfileId, nonprofitProfiles.id))
      .where(eq(decisionNonprofits.decisionId, decisionId));
    return rows.map((r) => r.profile);
  }

  async linkNonprofitToDecision(decisionId: number, nonprofitId: number, userId: string): Promise<void> {
    await db.insert(decisionNonprofits).values({ decisionId, nonprofitProfileId: nonprofitId, addedBy: userId });
  }

  // ─── Grant Opportunities ─────────────────────────────────────────────────

  async getGrantOpportunity(externalId: string): Promise<GrantOpportunityRecord | undefined> {
    const [opp] = await db.select().from(grantOpportunities).where(eq(grantOpportunities.externalId, externalId));
    return opp;
  }

  async upsertGrantOpportunity(opp: InsertGrantOpportunityRecord): Promise<GrantOpportunityRecord> {
    if (opp.externalId) {
      const existing = await this.getGrantOpportunity(opp.externalId);
      if (existing) {
        const [updated] = await db
          .update(grantOpportunities)
          .set({ ...opp, fetchedAt: new Date() })
          .where(eq(grantOpportunities.id, existing.id))
          .returning();
        return updated;
      }
    }
    const [created] = await db.insert(grantOpportunities).values(opp).returning();
    return created;
  }

  async getDecisionGrants(decisionId: number): Promise<GrantOpportunityRecord[]> {
    const rows = await db
      .select({ grant: grantOpportunities })
      .from(decisionGrants)
      .innerJoin(grantOpportunities, eq(decisionGrants.grantOpportunityId, grantOpportunities.id))
      .where(eq(decisionGrants.decisionId, decisionId));
    return rows.map((r) => r.grant);
  }

  async linkGrantToDecision(decisionId: number, grantId: number, userId: string): Promise<void> {
    await db.insert(decisionGrants).values({ decisionId, grantOpportunityId: grantId, addedBy: userId });
  }

  // ─── Grant Alerts ────────────────────────────────────────────────────────

  async getGrantAlerts(
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ alerts: GrantAlertRecord[]; total: number; newCount: number }> {
    const conditions = status ? eq(grantAlerts.status, status) : undefined;

    const alerts = await db
      .select()
      .from(grantAlerts)
      .where(conditions)
      .orderBy(desc(grantAlerts.relevanceScore))
      .limit(limit)
      .offset(offset);

    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(grantAlerts)
      .where(conditions);

    const [{ count: newCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(grantAlerts)
      .where(eq(grantAlerts.status, "new"));

    return { alerts, total, newCount };
  }

  async getGrantAlert(id: number): Promise<GrantAlertRecord | undefined> {
    const [alert] = await db.select().from(grantAlerts).where(eq(grantAlerts.id, id));
    return alert;
  }

  async createGrantAlert(alert: InsertGrantAlertRecord): Promise<GrantAlertRecord> {
    const [created] = await db.insert(grantAlerts).values(alert).returning();
    return created;
  }

  async updateGrantAlertStatus(id: number, status: string): Promise<GrantAlertRecord> {
    const [updated] = await db
      .update(grantAlerts)
      .set({ status })
      .where(eq(grantAlerts.id, id))
      .returning();
    return updated;
  }

  async getAlertCount(status?: string): Promise<number> {
    const conditions = status ? eq(grantAlerts.status, status) : undefined;
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(grantAlerts)
      .where(conditions);
    return count;
  }

  // ─── Org Grant History ───────────────────────────────────────────────────

  async getOrgGrantHistory(): Promise<OrgGrantHistoryRecord[]> {
    return await db.select().from(orgGrantHistory).orderBy(desc(orgGrantHistory.year));
  }

  async createOrgGrantHistory(entry: InsertOrgGrantHistoryRecord): Promise<OrgGrantHistoryRecord> {
    const [created] = await db.insert(orgGrantHistory).values(entry).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
