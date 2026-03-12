/**
 * Freshness Agent
 *
 * Scans all entities and flags those whose `lastVerified` date is older
 * than 30 days as stale. Stale entities are added to the `healing_queue`
 * collection with reason "stale" so the healer can re-verify them.
 *
 * Schedule: daily
 * Idempotent: yes — only adds new entries, does not duplicate existing queue items
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "freshness-agent";

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

/** Number of days before an entity is considered stale */
const STALE_THRESHOLD_DAYS = 30;

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting freshness scan...`);

  const now = new Date();
  const threshold = new Date(now.getTime() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

  let totalEntities = 0;
  let staleEntities = 0;
  let alreadyQueued = 0;
  let newlyFlagged = 0;

  try {
    for (const collection of ENTITY_COLLECTIONS) {
      const snapshot = await db.collection(collection).get();

      for (const doc of snapshot.docs) {
        totalEntities++;
        const data = doc.data();

        // Parse lastVerified — handle missing or invalid dates
        let lastVerified: Date | null = null;
        if (data.lastVerified) {
          const parsed = new Date(data.lastVerified);
          if (!isNaN(parsed.getTime())) {
            lastVerified = parsed;
          }
        }

        // Flag as stale if lastVerified is missing or older than threshold
        const isStale = !lastVerified || lastVerified < threshold;

        if (!isStale) {
          continue;
        }

        staleEntities++;

        const daysSinceVerified = lastVerified
          ? Math.floor((now.getTime() - lastVerified.getTime()) / (24 * 60 * 60 * 1000))
          : null;

        const queueId = `${collection}--${doc.id}`;
        const queueRef = db.collection("healing_queue").doc(queueId);
        const existing = await queueRef.get();

        if (existing.exists) {
          // Already in queue — update staleness info but don't duplicate
          const existingData = existing.data()!;
          if (existingData.reason !== "stale") {
            // Entity is in queue for another reason, don't overwrite
            console.log(
              `  ${collection}/${doc.id}: stale (${daysSinceVerified ?? "never verified"} days) — already queued for "${existingData.reason}"`,
            );
          }
          alreadyQueued++;
          continue;
        }

        await queueRef.set({
          entityCollection: collection,
          entityId: doc.id,
          entityName: data.name || doc.id,
          reason: "stale",
          daysSinceVerified,
          lastVerified: data.lastVerified || null,
          queuedAt: now.toISOString(),
          retryAfter: null,
          attempts: 0,
        });

        newlyFlagged++;
        console.log(
          `  ${collection}/${doc.id}: stale (${daysSinceVerified !== null ? `${daysSinceVerified} days` : "never verified"}) — added to healing queue`,
        );
      }
    }

    await logAgentAction(
      AGENT_NAME,
      "freshness_scan_complete",
      { totalEntities, staleEntities, newlyFlagged, alreadyQueued },
      true,
    );

    console.log(
      `[${AGENT_NAME}] Freshness scan complete. ${totalEntities} scanned, ${staleEntities} stale (${newlyFlagged} newly flagged, ${alreadyQueued} already queued).`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(
      AGENT_NAME,
      "freshness_scan_failed",
      { totalEntities, staleEntities },
      false,
      message,
    );
    console.error(`[${AGENT_NAME}] Freshness scan failed:`, message);
    throw err;
  }
}
