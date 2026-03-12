/**
 * Comparison Agent
 *
 * Auto-generates popular entity comparison pairs across the knowledge index.
 * For each entity type, finds pairs in the same category and scores their
 * "interestingness" based on close composite scores, high adoption,
 * and overlapping tags/capabilities.
 *
 * Stores the top 20 comparison pairs in the `comparisons` Firestore collection.
 *
 * Schedule: weekly (regenerates — clears and rebuilds)
 * Idempotent: yes — clears collection before writing
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "comparison-agent";
const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];
const COMPARISONS_COLLECTION = "comparisons";
const TOP_PAIRS = 20;

interface EntityRecord {
  collection: string;
  type: string;
  slug: string;
  name: string;
  provider: string;
  category: string;
  tags: string[];
  capabilities: string[];
  composite: number;
  adoption: number;
}

interface ComparisonRecord {
  id: string;
  entityA: { type: string; slug: string; name: string; provider: string; composite: number };
  entityB: { type: string; slug: string; name: string; provider: string; composite: number };
  category: string;
  interestScore: number;
  sharedTags: string[];
  scoreDiff: number;
  generatedAt: string;
}

function arrOverlap(a: string[], b: string[]): string[] {
  if (!a?.length || !b?.length) return [];
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((item) => setB.has(item.toLowerCase()));
}

function computeInterestScore(a: EntityRecord, b: EntityRecord): number {
  let score = 0;

  // Close composite scores = interesting competition (max 40 points)
  // The closer the scores, the higher the interest
  const diff = Math.abs(a.composite - b.composite);
  if (diff <= 5) score += 40;
  else if (diff <= 10) score += 30;
  else if (diff <= 20) score += 20;
  else if (diff <= 30) score += 10;

  // Both high adoption (max 30 points)
  const avgAdoption = (a.adoption + b.adoption) / 2;
  score += Math.min(30, Math.round(avgAdoption * 0.4));

  // Both high composite (max 20 points — popular entities are more interesting)
  const avgComposite = (a.composite + b.composite) / 2;
  score += Math.min(20, Math.round(avgComposite * 0.25));

  // Overlapping tags (max 20 points, 4pts per shared tag)
  const sharedTags = arrOverlap(a.tags, b.tags);
  score += Math.min(20, sharedTags.length * 4);

  // Overlapping capabilities (max 15 points, 3pts per shared cap)
  const sharedCaps = arrOverlap(a.capabilities, b.capabilities);
  score += Math.min(15, sharedCaps.length * 3);

  return score;
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting comparison generation...`);
  const startTime = Date.now();

  // 1. Load all entities
  const allEntities: EntityRecord[] = [];

  for (const col of ENTITY_COLLECTIONS) {
    const snap = await db.collection(col).get();
    for (const doc of snap.docs) {
      const data = doc.data();
      allEntities.push({
        collection: col,
        type: data.type || col.replace(/s$/, ""),
        slug: data.slug || doc.id,
        name: data.name || doc.id,
        provider: data.provider || "",
        category: data.category || "",
        tags: data.tags || [],
        capabilities: data.capabilities || [],
        composite: data.scores?.composite ?? 0,
        adoption: data.scores?.adoption ?? 0,
      });
    }
  }

  console.log(`[${AGENT_NAME}] Loaded ${allEntities.length} entities across ${ENTITY_COLLECTIONS.length} collections`);

  if (allEntities.length < 2) {
    console.log(`[${AGENT_NAME}] Not enough entities for comparisons.`);
    await logAgentAction(AGENT_NAME, "run_complete", { pairsGenerated: 0, reason: "not_enough_entities" }, true);
    return;
  }

  // 2. Generate pairs — only entities in the same category
  const pairs: ComparisonRecord[] = [];

  for (let i = 0; i < allEntities.length; i++) {
    for (let j = i + 1; j < allEntities.length; j++) {
      const a = allEntities[i];
      const b = allEntities[j];

      // Must share a category (non-empty)
      if (!a.category || !b.category) continue;
      if (a.category.toLowerCase() !== b.category.toLowerCase()) continue;

      const interestScore = computeInterestScore(a, b);
      if (interestScore <= 0) continue;

      const sharedTags = arrOverlap(a.tags, b.tags);
      const scoreDiff = Math.abs(a.composite - b.composite);

      // Canonical ordering: higher composite first, or alphabetical if tied
      const [first, second] =
        a.composite > b.composite || (a.composite === b.composite && a.name < b.name)
          ? [a, b]
          : [b, a];

      const id = `${first.type}_${first.slug}_vs_${second.type}_${second.slug}`;

      pairs.push({
        id,
        entityA: { type: first.type, slug: first.slug, name: first.name, provider: first.provider, composite: first.composite },
        entityB: { type: second.type, slug: second.slug, name: second.name, provider: second.provider, composite: second.composite },
        category: first.category,
        interestScore,
        sharedTags,
        scoreDiff,
        generatedAt: new Date().toISOString(),
      });
    }
  }

  // 3. Sort by interest score, take top N
  pairs.sort((a, b) => b.interestScore - a.interestScore);
  const topPairs = pairs.slice(0, TOP_PAIRS);

  console.log(`[${AGENT_NAME}] Found ${pairs.length} candidate pairs, selecting top ${topPairs.length}`);

  // 4. Clear existing comparisons
  const existingSnap = await db.collection(COMPARISONS_COLLECTION).get();
  if (existingSnap.size > 0) {
    let batch = db.batch();
    let count = 0;
    for (const doc of existingSnap.docs) {
      batch.delete(doc.ref);
      count++;
      if (count >= 450) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }
    if (count > 0) {
      await batch.commit();
    }
    console.log(`[${AGENT_NAME}] Cleared ${existingSnap.size} existing comparisons`);
  }

  // 5. Write new comparisons
  let batch = db.batch();
  let batchCount = 0;

  for (const pair of topPairs) {
    const docRef = db.collection(COMPARISONS_COLLECTION).doc(pair.id);
    batch.set(docRef, pair);
    batchCount++;

    if (batchCount >= 450) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  const durationMs = Date.now() - startTime;
  console.log(`[${AGENT_NAME}] Generated ${topPairs.length} comparisons in ${(durationMs / 1000).toFixed(1)}s`);

  await logAgentAction(AGENT_NAME, "run_complete", {
    totalEntities: allEntities.length,
    candidatePairs: pairs.length,
    pairsGenerated: topPairs.length,
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
