/**
 * Similarity Agent
 *
 * Computes entity similarity scores across the entire knowledge index.
 * For each entity, compares against all others using a weighted scoring
 * system based on shared tags, capabilities, integrations, category,
 * type, and related entity overlaps.
 *
 * Stores the top 5 most similar entities per entity in the
 * `entity_similarities` Firestore collection with document IDs
 * formatted as `{collection}__{slug}`.
 *
 * Schedule: daily (runs after categorize, since it reads entity data)
 * Idempotent: yes — overwrites existing similarity data for each entity
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "similarity-agent";
const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];
const SIMILARITIES_COLLECTION = "entity_similarities";
const TOP_N = 5;

// Scoring weights
const WEIGHT_SHARED_TAG = 20;
const WEIGHT_SHARED_CAPABILITY = 15;
const WEIGHT_SHARED_INTEGRATION = 10;
const WEIGHT_SAME_CATEGORY = 25;
const WEIGHT_SAME_TYPE = 10;
const WEIGHT_SHARED_RELATED = 15;

interface EntityRecord {
  collection: string;
  slug: string;
  name: string;
  type: string;
  category: string;
  tags: string[];
  capabilities: string[];
  integrations: string[];
  relatedTools: string[];
  relatedModels: string[];
  relatedAgents: string[];
  relatedSkills: string[];
}

interface SimilarityEntry {
  type: string;
  slug: string;
  name: string;
  score: number;
}

function arrOverlap(a: string[], b: string[]): number {
  if (!a?.length || !b?.length) return 0;
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((item) => setB.has(item.toLowerCase())).length;
}

function computeSimilarity(a: EntityRecord, b: EntityRecord): number {
  if (a.collection === b.collection && a.slug === b.slug) return 0;

  let raw = 0;

  // Shared tags
  raw += arrOverlap(a.tags, b.tags) * WEIGHT_SHARED_TAG;

  // Shared capabilities
  raw += arrOverlap(a.capabilities, b.capabilities) * WEIGHT_SHARED_CAPABILITY;

  // Shared integrations
  raw += arrOverlap(a.integrations, b.integrations) * WEIGHT_SHARED_INTEGRATION;

  // Same category
  if (a.category && b.category && a.category.toLowerCase() === b.category.toLowerCase()) {
    raw += WEIGHT_SAME_CATEGORY;
  }

  // Same type
  if (a.type && b.type && a.type.toLowerCase() === b.type.toLowerCase()) {
    raw += WEIGHT_SAME_TYPE;
  }

  // Shared related entities
  raw += arrOverlap(a.relatedTools, b.relatedTools) * WEIGHT_SHARED_RELATED;
  raw += arrOverlap(a.relatedModels, b.relatedModels) * WEIGHT_SHARED_RELATED;
  raw += arrOverlap(a.relatedAgents, b.relatedAgents) * WEIGHT_SHARED_RELATED;
  raw += arrOverlap(a.relatedSkills, b.relatedSkills) * WEIGHT_SHARED_RELATED;

  return raw;
}

function normalizeScores(entries: SimilarityEntry[]): SimilarityEntry[] {
  if (entries.length === 0) return [];
  const maxScore = Math.max(...entries.map((e) => e.score));
  if (maxScore === 0) return entries;
  return entries.map((e) => ({
    ...e,
    score: Math.round((e.score / maxScore) * 100),
  }));
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting similarity computation...`);
  const startTime = Date.now();

  // 1. Load all entities
  const allEntities: EntityRecord[] = [];

  for (const col of ENTITY_COLLECTIONS) {
    const snap = await db.collection(col).get();
    for (const doc of snap.docs) {
      const data = doc.data();
      allEntities.push({
        collection: col,
        slug: data.slug || doc.id,
        name: data.name || doc.id,
        type: data.type || col.replace(/s$/, ""),
        category: data.category || "",
        tags: data.tags || [],
        capabilities: data.capabilities || [],
        integrations: data.integrations || [],
        relatedTools: data.relatedTools || [],
        relatedModels: data.relatedModels || [],
        relatedAgents: data.relatedAgents || [],
        relatedSkills: data.relatedSkills || [],
      });
    }
  }

  console.log(`[${AGENT_NAME}] Loaded ${allEntities.length} entities across ${ENTITY_COLLECTIONS.length} collections`);

  if (allEntities.length === 0) {
    console.log(`[${AGENT_NAME}] No entities found. Nothing to compute.`);
    await logAgentAction(AGENT_NAME, "run_complete", { entitiesProcessed: 0 }, true);
    return;
  }

  // 2. Compute similarities for each entity
  let writtenCount = 0;
  let batch = db.batch();
  let batchCount = 0;
  const BATCH_LIMIT = 450; // Firestore batch limit is 500, leave headroom

  for (const entity of allEntities) {
    // Score against all other entities
    const scores: SimilarityEntry[] = [];

    for (const other of allEntities) {
      if (entity.collection === other.collection && entity.slug === other.slug) continue;

      const score = computeSimilarity(entity, other);
      if (score > 0) {
        scores.push({
          type: other.type,
          slug: other.slug,
          name: other.name,
          score,
        });
      }
    }

    // Sort by score descending, take top N
    scores.sort((a, b) => b.score - a.score);
    const topN = scores.slice(0, TOP_N);

    // Normalize scores to 0-100
    const normalized = normalizeScores(topN);

    // Write to Firestore
    const docId = `${entity.collection}__${entity.slug}`;
    const docRef = db.collection(SIMILARITIES_COLLECTION).doc(docId);

    batch.set(docRef, {
      entityType: entity.type,
      entitySlug: entity.slug,
      similarities: normalized,
      computedAt: new Date().toISOString(),
    });

    batchCount++;
    writtenCount++;

    // Commit batch when approaching limit, then create a new batch
    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      console.log(`[${AGENT_NAME}] Committed batch of ${batchCount} writes`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
    console.log(`[${AGENT_NAME}] Committed final batch of ${batchCount} writes`);
  }

  const durationMs = Date.now() - startTime;
  console.log(`[${AGENT_NAME}] Computed similarities for ${writtenCount} entities in ${(durationMs / 1000).toFixed(1)}s`);

  await logAgentAction(AGENT_NAME, "run_complete", {
    entitiesProcessed: writtenCount,
    totalEntities: allEntities.length,
    durationMs,
  }, true);
}

// Direct execution
if (require.main === module) {
  run()
    .then(() => {
      console.log(`[${AGENT_NAME}] Done.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`[${AGENT_NAME}] Fatal error:`, err);
      process.exit(1);
    });
}
