import test from "node:test";
import assert from "node:assert/strict";
import { canRevealPeerJudgments, canViewAttachment, isAdminByEmail, isUniqueViolation, judgmentInputSchema } from "./governance";

test("judgmentInputSchema enforces score bounds", () => {
  const low = judgmentInputSchema.safeParse({ score: 0, rationale: "x".repeat(20) });
  const high = judgmentInputSchema.safeParse({ score: 11, rationale: "x".repeat(20) });
  const ok = judgmentInputSchema.safeParse({ score: 7, rationale: "x".repeat(20) });

  assert.equal(low.success, false);
  assert.equal(high.success, false);
  assert.equal(ok.success, true);
});

test("judgmentInputSchema enforces rationale minimum length", () => {
  const result = judgmentInputSchema.safeParse({ score: 5, rationale: "too short" });
  assert.equal(result.success, false);
});

test("canRevealPeerJudgments only when decision is closed", () => {
  assert.equal(canRevealPeerJudgments("open"), false);
  assert.equal(canRevealPeerJudgments("draft"), false);
  assert.equal(canRevealPeerJudgments("closed"), true);
});

test("isUniqueViolation recognizes postgres unique errors", () => {
  assert.equal(isUniqueViolation({ code: "23505" }), true);
  assert.equal(isUniqueViolation({ code: "22000" }), false);
  assert.equal(isUniqueViolation(null), false);
});

test("canViewAttachment hides peer judgment attachments before close", () => {
  assert.equal(canViewAttachment({
    decisionStatus: "open",
    context: "judgment",
    ownerUserId: "u1",
    requestingUserId: "u2",
  }), false);
  assert.equal(canViewAttachment({
    decisionStatus: "open",
    context: "judgment",
    ownerUserId: "u1",
    requestingUserId: "u1",
  }), true);
  assert.equal(canViewAttachment({
    decisionStatus: "closed",
    context: "judgment",
    ownerUserId: "u1",
    requestingUserId: "u2",
  }), true);
});

test("isAdminByEmail requires explicit configured allowlist", () => {
  assert.equal(isAdminByEmail("admin@example.com", undefined), false);
  assert.equal(isAdminByEmail("admin@example.com", "admin@example.com"), true);
  assert.equal(isAdminByEmail("user@example.com", "admin@example.com"), false);
});
