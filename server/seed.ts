import { db } from "./db";
import { decisions, comments, judgments } from "@shared/schema";

async function seed() {
  const existingDecisions = await db.select().from(decisions);
  if (existingDecisions.length > 0) {
    console.log("Database already seeded");
    return;
  }

  console.log("Seeding database...");

  const [d1] = await db.insert(decisions).values({
    title: "Q3 Strategic Pivot: Enterprise Focus",
    description: "Should we shift 40% of engineering resources to enterprise features for Q3? This involves delaying the consumer mobile app update.",
    category: "Strategy",
    status: "open",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  }).returning();

  const [d2] = await db.insert(decisions).values({
    title: "Hire Senior ML Engineer",
    description: "We have budget for one senior hire. Should we prioritize ML over Frontend for this quarter?",
    category: "Hiring",
    status: "draft",
  }).returning();

  const [d3] = await db.insert(decisions).values({
    title: "Office Relocation to Downtown",
    description: "Lease is expiring. Downtown office offers better amenities but 20% higher cost.",
    category: "Operations",
    status: "closed",
    outcome: "Approved",
    consensusreached: true,
  }).returning();

  console.log("Seeding complete!");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
