/**
 * Weekly Digest Generator Agent
 *
 * Composes structured summary digests from the past week's activity.
 * Writes digest documents to the `digests` Firestore collection.
 *
 * Data gathered:
 *   - New entities added (addedDate across all entity collections)
 *   - Trending alerts (score changes from trending_alerts)
 *   - Approved submissions
 *   - Agent run summaries (success/failure counts from agent_logs)
 *
 * Schedule: weekly
 * Idempotent: yes — skips if digest already exists for the current week
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "digest-agent";

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

interface DigestEntity {
  name: string;
  type: string;
  slug: string;
  provider?: string;
}

interface DigestMover {
  name: string;
  type: string;
  slug: string;
  direction: string;
  delta: number;
  metric: string;
}

interface DigestAgentRuns {
  total: number;
  successful: number;
  failed: number;
}

interface WeeklyDigest {
  weekOf: string;
  weekEnd: string;
  newEntities: DigestEntity[];
  topMovers: DigestMover[];
  approvedSubmissions: number;
  agentRuns: DigestAgentRuns;
  highlights: string[];
  generatedAt: string;
}

function getWeekBounds(): { weekOf: string; weekEnd: string; cutoff: Date } {
  const now = new Date();
  const weekEnd = now.toISOString().split("T")[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekOf = weekAgo.toISOString().split("T")[0];
  return { weekOf, weekEnd, cutoff: weekAgo };
}

async function getNewEntities(cutoff: Date): Promise<DigestEntity[]> {
  const results: DigestEntity[] = [];
  const cutoffStr = cutoff.toISOString();

  for (const col of ENTITY_COLLECTIONS) {
    const snap = await db
      .collection(col)
      .where("addedDate", ">=", cutoffStr)
      .orderBy("addedDate", "desc")
      .get();

    for (const doc of snap.docs) {
      const data = doc.data();
      results.push({
        name: data.name || doc.id,
        type: data.type || col.replace(/s$/, ""),
        slug: doc.id,
        provider: data.provider || data.company || undefined,
      });
    }
  }

  return results;
}

async function getTrendingAlerts(cutoff: Date): Promise<DigestMover[]> {
  const snap = await db
    .collection("trending_alerts")
    .where("detectedAt", ">=", cutoff.toISOString())
    .orderBy("detectedAt", "desc")
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      name: d.entityName || "Unknown",
      type: d.entityType || "entity",
      slug: d.entitySlug || "",
      direction: d.direction || "up",
      delta: d.delta || 0,
      metric: d.metric || "composite",
    };
  });
}

async function getApprovedSubmissions(cutoff: Date): Promise<number> {
  const snap = await db
    .collection("submissions")
    .where("status", "==", "approved")
    .where("submittedAt", ">=", cutoff.toISOString())
    .get();

  return snap.size;
}

async function getAgentRunSummary(cutoff: Date): Promise<DigestAgentRuns> {
  const snap = await db
    .collection("agent_logs")
    .where("timestamp", ">=", cutoff)
    .get();

  let successful = 0;
  let failed = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.success === true) {
      successful++;
    } else {
      failed++;
    }
  }

  return { total: successful + failed, successful, failed };
}

function generateHighlights(
  newEntities: DigestEntity[],
  topMovers: DigestMover[],
  approvedSubmissions: number,
  agentRuns: DigestAgentRuns,
): string[] {
  const highlights: string[] = [];

  // New entities by type
  const byType = new Map<string, number>();
  for (const e of newEntities) {
    byType.set(e.type, (byType.get(e.type) || 0) + 1);
  }
  for (const [type, count] of byType) {
    highlights.push(`${count} new ${type}${count !== 1 ? "s" : ""} added`);
  }

  // Top movers
  const upMovers = topMovers.filter((m) => m.direction === "up");
  const downMovers = topMovers.filter((m) => m.direction === "down");

  if (upMovers.length > 0) {
    const best = upMovers.sort((a, b) => b.delta - a.delta)[0];
    highlights.push(`${best.name} score jumped +${best.delta}`);
  }
  if (downMovers.length > 0) {
    highlights.push(`${downMovers.length} entit${downMovers.length !== 1 ? "ies" : "y"} trending down`);
  }

  // Submissions
  if (approvedSubmissions > 0) {
    highlights.push(`${approvedSubmissions} submission${approvedSubmissions !== 1 ? "s" : ""} approved`);
  }

  // Agent health
  if (agentRuns.total > 0) {
    const rate = Math.round((agentRuns.successful / agentRuns.total) * 100);
    highlights.push(`Agent success rate: ${rate}% (${agentRuns.total} runs)`);
  }

  if (highlights.length === 0) {
    highlights.push("Quiet week — no significant changes detected");
  }

  return highlights;
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting weekly digest generation...`);

  try {
    const { weekOf, weekEnd, cutoff } = getWeekBounds();

    // Check if digest already exists for this week
    const existing = await db.collection("digests").doc(weekOf).get();
    if (existing.exists) {
      console.log(`[${AGENT_NAME}] Digest for week of ${weekOf} already exists. Skipping.`);
      await logAgentAction(AGENT_NAME, "digest_skipped", {
        weekOf,
        reason: "already_exists",
      }, true);
      return;
    }

    // Gather data in parallel
    console.log(`[${AGENT_NAME}] Gathering data for ${weekOf} to ${weekEnd}...`);

    const [newEntities, topMovers, approvedSubmissions, agentRuns] = await Promise.all([
      getNewEntities(cutoff),
      getTrendingAlerts(cutoff),
      getApprovedSubmissions(cutoff),
      getAgentRunSummary(cutoff),
    ]);

    console.log(`[${AGENT_NAME}] Data gathered:`);
    console.log(`  New entities: ${newEntities.length}`);
    console.log(`  Top movers: ${topMovers.length}`);
    console.log(`  Approved submissions: ${approvedSubmissions}`);
    console.log(`  Agent runs: ${agentRuns.total} (${agentRuns.successful} ok, ${agentRuns.failed} failed)`);

    // Generate highlights
    const highlights = generateHighlights(newEntities, topMovers, approvedSubmissions, agentRuns);

    // Compose digest
    const digest: WeeklyDigest = {
      weekOf,
      weekEnd,
      newEntities,
      topMovers,
      approvedSubmissions,
      agentRuns,
      highlights,
      generatedAt: new Date().toISOString(),
    };

    // Write to Firestore with weekOf as doc ID
    await db.collection("digests").doc(weekOf).set(digest);

    console.log(`[${AGENT_NAME}] Digest written to digests/${weekOf}`);

    await logAgentAction(AGENT_NAME, "digest_generated", {
      weekOf,
      weekEnd,
      newEntitiesCount: newEntities.length,
      topMoversCount: topMovers.length,
      approvedSubmissions,
      agentRuns,
      highlightsCount: highlights.length,
    }, true);

    console.log(`[${AGENT_NAME}] Weekly digest generation complete.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(AGENT_NAME, "digest_failed", {}, false, message);
    console.error(`[${AGENT_NAME}] Digest generation failed:`, message);
    throw err;
  }
}
