import { z } from "zod";

export const judgmentInputSchema = z.object({
  score: z.number().int().min(1).max(10),
  rationale: z.string().min(20, "Rationale must be at least 20 characters."),
});

export function canRevealPeerJudgments(status: string): boolean {
  return status === "closed";
}

export function isUniqueViolation(error: unknown): boolean {
  return !!error && typeof error === "object" && (error as any).code === "23505";
}

export function canViewAttachment(args: {
  decisionStatus: string;
  context: string;
  ownerUserId: string;
  requestingUserId: string;
}): boolean {
  if (args.decisionStatus === "closed") return true;
  if (args.context === "judgment") {
    return args.ownerUserId === args.requestingUserId;
  }
  return true;
}

export function isAdminByEmail(email: string | null | undefined, adminEmailsEnv: string | undefined): boolean {
  const configuredAdmins = (adminEmailsEnv || "")
    .split(",")
    .map((adminEmail) => adminEmail.trim().toLowerCase())
    .filter(Boolean);
  if (configuredAdmins.length === 0) return false;
  const normalizedEmail = (email || "").toLowerCase();
  return configuredAdmins.includes(normalizedEmail);
}
