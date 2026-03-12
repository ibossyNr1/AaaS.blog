/**
 * Schema Healer Agent
 *
 * Reads from the `healing_queue` collection and attempts to fill missing
 * fields on flagged entities. Currently operates in "mark" mode — it labels
 * missing fields as `"[unverified]"` and logs what needs to be filled.
 *
 * In production, this agent would call an LLM to research and populate
 * the missing data, then mark fields as unverified for human review.
 *
 * If a field cannot be filled, the entry is deferred for 7 days.
 *
 * Schedule: daily (runs after schema-auditor)
 * Idempotent: yes — skips entries with future retryAfter dates
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "schema-healer";
const RETRY_DAYS = 7;
const MAX_ATTEMPTS = 5;

/**
 * Fields that can be auto-filled with placeholder values.
 * Array fields get a placeholder array, string fields get "[unverified]".
 */
const PLACEHOLDER_VALUES: Record<string, unknown> = {
  name: "[unverified]",
  description: "[unverified] No description available.",
  provider: "[unverified]",
  version: "0.0.0",
  url: "",
  category: "uncategorized",
  tags: ["unverified"],
  capabilities: ["unverified"],
};

function getPlaceholderForField(field: string): unknown {
  // Handle scores sub-fields
  if (field.startsWith("scores.")) {
    return 0;
  }
  return PLACEHOLDER_VALUES[field] ?? "[unverified]";
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting healing pass...`);

  const now = new Date();
  let processed = 0;
  let healed = 0;
  let deferred = 0;
  let skipped = 0;

  try {
    const queueSnap = await db.collection("healing_queue").get();

    if (queueSnap.empty) {
      console.log(`[${AGENT_NAME}] Healing queue is empty. Nothing to do.`);
      await logAgentAction(AGENT_NAME, "heal_pass", { processed: 0 }, true);
      return;
    }

    for (const queueDoc of queueSnap.docs) {
      const queueData = queueDoc.data();
      processed++;

      // Skip entries with future retry dates
      if (queueData.retryAfter) {
        const retryDate = new Date(queueData.retryAfter);
        if (retryDate > now) {
          console.log(
            `  Skipping ${queueData.entityCollection}/${queueData.entityId} — retry after ${queueData.retryAfter}`,
          );
          skipped++;
          continue;
        }
      }

      // Skip entries that have exceeded max attempts
      if (queueData.attempts >= MAX_ATTEMPTS) {
        console.log(
          `  Skipping ${queueData.entityCollection}/${queueData.entityId} — max attempts (${MAX_ATTEMPTS}) reached`,
        );
        skipped++;
        continue;
      }

      const entityRef = db
        .collection(queueData.entityCollection)
        .doc(queueData.entityId);
      const entitySnap = await entityRef.get();

      if (!entitySnap.exists) {
        console.log(
          `  Entity ${queueData.entityCollection}/${queueData.entityId} no longer exists — removing from queue`,
        );
        await queueDoc.ref.delete();
        continue;
      }

      const entityData = entitySnap.data()!;
      const missingFields: string[] = queueData.missingFields || [];

      if (missingFields.length === 0) {
        // Nothing to heal — remove from queue
        await queueDoc.ref.delete();
        healed++;
        continue;
      }

      // Build the update payload
      const updates: Record<string, unknown> = {};
      const filledFields: string[] = [];
      const unfilledFields: string[] = [];

      for (const field of missingFields) {
        if (field.startsWith("scores.")) {
          // Handle nested score fields
          const scoreKey = field.replace("scores.", "");
          const currentScores =
            (entityData.scores as Record<string, number>) || {};
          if (
            typeof currentScores[scoreKey] !== "number" ||
            currentScores[scoreKey] <= 0
          ) {
            // In production: LLM would estimate scores based on entity data
            // For now: leave at 0 and log
            unfilledFields.push(field);
          } else {
            filledFields.push(field);
          }
        } else {
          const currentValue = entityData[field];
          const isEmpty =
            currentValue === undefined ||
            currentValue === null ||
            currentValue === "" ||
            (Array.isArray(currentValue) && currentValue.length === 0);

          if (isEmpty) {
            // In production: call LLM to research and fill
            // For now: use placeholder values
            const placeholder = getPlaceholderForField(field);
            updates[field] = placeholder;
            filledFields.push(field);
          } else {
            filledFields.push(field);
          }
        }
      }

      // Apply updates if we have any
      if (Object.keys(updates).length > 0) {
        await entityRef.update(updates);
        console.log(
          `  Healed ${queueData.entityCollection}/${queueData.entityId}: filled ${filledFields.length} fields with placeholders`,
        );
      }

      // If all fields are handled, remove from queue
      if (unfilledFields.length === 0) {
        await queueDoc.ref.delete();
        healed++;
        console.log(
          `  Removed ${queueData.entityCollection}/${queueData.entityId} from healing queue`,
        );
      } else {
        // Defer for retry
        const retryAfter = new Date(
          now.getTime() + RETRY_DAYS * 24 * 60 * 60 * 1000,
        );
        await queueDoc.ref.update({
          attempts: (queueData.attempts || 0) + 1,
          retryAfter: retryAfter.toISOString(),
          missingFields: unfilledFields,
          lastAttempt: now.toISOString(),
        });
        deferred++;
        console.log(
          `  Deferred ${queueData.entityCollection}/${queueData.entityId} — ${unfilledFields.length} fields still missing, retry after ${retryAfter.toISOString()}`,
        );
      }
    }

    await logAgentAction(
      AGENT_NAME,
      "heal_pass",
      { processed, healed, deferred, skipped },
      true,
    );

    console.log(
      `[${AGENT_NAME}] Healing complete. ${processed} processed, ${healed} healed, ${deferred} deferred, ${skipped} skipped.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(AGENT_NAME, "heal_failed", { processed }, false, message);
    console.error(`[${AGENT_NAME}] Healing failed:`, message);
    throw err;
  }
}
