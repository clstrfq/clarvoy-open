import { db } from "./db";
import {
  decisions, judgments, comments, auditLogs, attachments, referenceClasses,
  type Decision, type InsertDecision,
  type Judgment, type InsertJudgment,
  type Comment, type InsertComment,
  type AuditLog, type Attachment, type InsertAttachment,
  type ReferenceClass, type InsertReferenceClass
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

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
  updateAttachmentText(id: number, extractedText: string): Promise<Attachment>;
  deleteAttachment(id: number): Promise<void>;

  createAuditLog(log: any): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;

  getReferenceClasses(): Promise<ReferenceClass[]>;
  getReferenceClass(id: number): Promise<ReferenceClass | undefined>;
  createReferenceClass(rc: InsertReferenceClass): Promise<ReferenceClass>;
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
}

export const storage = new DatabaseStorage();
