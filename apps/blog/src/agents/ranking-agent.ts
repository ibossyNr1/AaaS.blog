/**
 * Ranking Agent
 *
 * Recalculates composite scores and citation counts for all entities
 * across all collections. The composite score formula:
 *
 *   composite = adoption * 0.4 + citations * 0.25 + quality * 0.2 + engagement * 0.15
 *
 * Citations are calculated by counting how many other entities reference
 * a given entity in their related_* fields (relatedTools, relatedModels,
 * relatedAgents, relatedSkills).
 *
 * Schedule: daily
 * Idempotent: yes — recalculates from scratch on every run
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "ranking-agent";

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

const RELATED_FIELDS = ["relatedTools", "relatedModels", "relatedAgents", "relatedSkills"];

/** Weights for composite score calculation */
const WEIGHTS = {
  adoption: 0.4,
  citations: 0.25,
  quality: 0.2,
  engagement: 0.15,
};

interface EntityRecord {
  collection: string;
  docId: string;
  slug: string;
  data: Record<string, unknown>;
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting ranking recalculation...`);

  let totalEntities = 0;
  let updatedEntities = 0;

  try {
    // Phase 1: Load all entities into memory
    const allEntities: EntityRecord[] = [];

    for (const collection of ENTITY_COLLECTIONS) {
      const snapshot = await db.collection(collection).get();
      for (const doc of snapshot.docs) {
        allEntities.push({
          collection,
          docId: doc.id,
          slug: doc.id, // Document ID is the slug
          data: doc.data(),
        });
      }
    }

    totalEntities = allEntities.length;
    console.log(`[${AGENT_NAME}] Loaded ${totalEntities} entities.`);

    // Phase 2: Calculate citation counts
    // A citation is when another entity references this entity by slug
    // in any of the related_* fields
    const citationCounts = new Map<string, number>();

    // Initialize all entities with 0 citations
    for (const entity of allEntities) {
      citationCounts.set(entity.slug, 0);
    }

    // Count inbound references
    for (const entity of allEntities) {
      for (const field of RELATED_FIELDS) {
        const refs = entity.data[field];
        if (Array.isArray(refs)) {
          for (const ref of refs) {
            if (typeof ref === "string" && citationCounts.has(ref)) {
              citationCounts.set(ref, (citationCounts.get(ref) || 0) + 1);
            }
          }
        }
      }
    }

    // Phase 3: Normalize citations to 0-100 scale
    const maxCitations = Math.max(1, ...Array.from(citationCounts.values()));

    // Phase 4: Recalculate composite scores and update Firestore
    for (const entity of allEntities) {
      const scores = (entity.data.scores as Record<string, number>) || {};
      const rawCitations = citationCounts.get(entity.slug) || 0;

      // Normalize citations to 0-100 scale
      const normalizedCitations = Math.round((rawCitations / maxCitations) * 100);

      // Calculate composite score
      const adoption = scores.adoption || 0;
      const quality = scores.quality || 0;
      const engagement = scores.engagement || 0;

      const composite = Math.round(
        adoption * WEIGHTS.adoption +
        normalizedCitations * WEIGHTS.citations +
        quality * WEIGHTS.quality +
        engagement * WEIGHTS.engagement,
      );

      // Check if anything changed
      const currentComposite = scores.composite || 0;
      const currentCitations = scores.citations || 0;

      if (
        composite !== currentComposite ||
        normalizedCitations !== currentCitations
      ) {
        await db
          .collection(entity.collection)
          .doc(entity.docId)
          .update({
            "scores.citations": normalizedCitations,
            "scores.composite": composite,
          });

        updatedEntities++;
        console.log(
          `  ${entity.collection}/${entity.docId}: composite ${currentComposite} -> ${composite}, citations ${currentCitations} -> ${normalizedCitations} (raw: ${rawCitations})`,
        );
      }
    }

    await logAgentAction(
      AGENT_NAME,
      "ranking_complete",
      { totalEntities, updatedEntities, maxCitations },
      true,
    );

    console.log(
      `[${AGENT_NAME}] Ranking complete. ${totalEntities} entities scored, ${updatedEntities} updated.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(
      AGENT_NAME,
      "ranking_failed",
      { totalEntities, updatedEntities },
      false,
      message,
    );
    console.error(`[${AGENT_NAME}] Ranking failed:`, message);
    throw err;
  }
}
