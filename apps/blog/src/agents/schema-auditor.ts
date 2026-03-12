/**
 * Schema Auditor Agent
 *
 * Scans all 6 entity collections, calculates schema completeness for each
 * entity, updates the schemaCompleteness field, and flags entities below
 * 60% completeness by adding them to the `healing_queue` collection.
 *
 * Schedule: daily
 * Idempotent: yes — recalculates completeness on every run
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "schema-auditor";

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

/**
 * Required fields that every entity must have for 100% completeness.
 * Array/object fields are checked for non-empty content.
 */
const REQUIRED_FIELDS = [
  "name",
  "description",
  "provider",
  "version",
  "url",
  "category",
  "tags",
  "capabilities",
  "scores",
] as const;

/**
 * Score fields that must all be > 0 for full completeness.
 */
const SCORE_FIELDS = ["adoption", "quality", "freshness", "citations", "engagement", "composite"] as const;

function calculateCompleteness(data: Record<string, unknown>): {
  score: number;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  let filled = 0;
  let total = 0;

  for (const field of REQUIRED_FIELDS) {
    total++;
    const value = data[field];

    if (field === "tags" || field === "capabilities") {
      if (Array.isArray(value) && value.length > 0) {
        filled++;
      } else {
        missingFields.push(field);
      }
    } else if (field === "scores") {
      if (value && typeof value === "object") {
        const scores = value as Record<string, number>;
        let allScoresPresent = true;
        for (const sf of SCORE_FIELDS) {
          total++;
          if (typeof scores[sf] === "number" && scores[sf] > 0) {
            filled++;
          } else {
            allScoresPresent = false;
            missingFields.push(`scores.${sf}`);
          }
        }
        if (allScoresPresent) {
          filled++; // count the parent 'scores' field itself
        }
      } else {
        missingFields.push("scores");
        // Count all score sub-fields as missing too
        for (const sf of SCORE_FIELDS) {
          total++;
          missingFields.push(`scores.${sf}`);
        }
      }
    } else {
      if (value !== undefined && value !== null && value !== "") {
        filled++;
      } else {
        missingFields.push(field);
      }
    }
  }

  const score = total > 0 ? Math.round((filled / total) * 100) : 0;
  return { score, missingFields };
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting schema audit...`);

  let totalEntities = 0;
  let updatedEntities = 0;
  let flaggedEntities = 0;

  try {
    for (const collection of ENTITY_COLLECTIONS) {
      const snapshot = await db.collection(collection).get();

      for (const doc of snapshot.docs) {
        totalEntities++;
        const data = doc.data();
        const { score, missingFields } = calculateCompleteness(data);

        // Update schemaCompleteness on the entity
        if (data.schemaCompleteness !== score) {
          await doc.ref.update({ schemaCompleteness: score });
          updatedEntities++;
        }

        // Flag entities below 60% completeness
        if (score < 60) {
          flaggedEntities++;

          const queueRef = db.collection("healing_queue").doc(`${collection}--${doc.id}`);
          const existing = await queueRef.get();

          // Only add if not already in the queue (idempotent)
          if (!existing.exists) {
            await queueRef.set({
              entityCollection: collection,
              entityId: doc.id,
              entityName: data.name || doc.id,
              reason: "low_completeness",
              schemaCompleteness: score,
              missingFields,
              queuedAt: new Date().toISOString(),
              retryAfter: null,
              attempts: 0,
            });
          } else {
            // Update the completeness score and missing fields
            await queueRef.update({
              schemaCompleteness: score,
              missingFields,
            });
          }
        }

        console.log(
          `  ${collection}/${doc.id}: ${score}% complete${score < 60 ? " [FLAGGED]" : ""}`,
        );
      }
    }

    await logAgentAction(AGENT_NAME, "audit_complete", {
      totalEntities,
      updatedEntities,
      flaggedEntities,
    }, true);

    console.log(
      `[${AGENT_NAME}] Audit complete. ${totalEntities} entities scanned, ${updatedEntities} updated, ${flaggedEntities} flagged.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(AGENT_NAME, "audit_failed", { totalEntities }, false, message);
    console.error(`[${AGENT_NAME}] Audit failed:`, message);
    throw err;
  }
}
