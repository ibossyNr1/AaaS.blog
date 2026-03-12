/**
 * Clustering Agent
 *
 * Computes entity clusters, topic maps, and discovery paths.
 * Fetches all entities from Firestore, runs clustering algorithms,
 * and stores results in dedicated collections.
 *
 * Schedule: weekly
 * Idempotent: yes — overwrites existing cluster/topic/path data
 *
 * Firestore collections written:
 *   - entity_clusters
 *   - topic_maps
 *   - discovery_paths
 */

import { db, logAgentAction } from "./logger";
import {
  clusterEntities,
  buildTopicMapFromEntities,
  generateDiscoveryPathsFromEntities,
} from "../lib/clustering";
import type { Entity } from "../lib/types";

const AGENT_NAME = "clustering-agent";
const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting clustering computation...`);
  const startTime = Date.now();

  // 1. Load all entities
  const allEntities: Entity[] = [];

  for (const col of ENTITY_COLLECTIONS) {
    const snap = await db.collection(col).get();
    for (const doc of snap.docs) {
      const data = doc.data();
      allEntities.push({
        slug: data.slug || doc.id,
        type: data.type || col.replace(/s$/, ""),
        ...data,
      } as Entity);
    }
  }

  console.log(`[${AGENT_NAME}] Loaded ${allEntities.length} entities across ${ENTITY_COLLECTIONS.length} collections`);

  if (allEntities.length === 0) {
    console.log(`[${AGENT_NAME}] No entities found. Nothing to compute.`);
    await logAgentAction(AGENT_NAME, "run_complete", { entitiesProcessed: 0 }, true);
    return;
  }

  // 2. Compute clusters
  console.log(`[${AGENT_NAME}] Computing entity clusters...`);
  const clusters = clusterEntities(allEntities);
  console.log(`[${AGENT_NAME}] Generated ${clusters.length} clusters`);

  // Write clusters to Firestore
  let batch = db.batch();
  let batchCount = 0;
  const BATCH_LIMIT = 450;

  // Clear existing clusters first
  const existingClusters = await db.collection("entity_clusters").get();
  for (const doc of existingClusters.docs) {
    batch.delete(doc.ref);
    batchCount++;
    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) {
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  }

  for (const cluster of clusters) {
    const ref = db.collection("entity_clusters").doc(cluster.id);
    batch.set(ref, {
      ...cluster,
      computedAt: new Date().toISOString(),
    });
    batchCount++;
    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) {
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  }

  // 3. Build topic map
  console.log(`[${AGENT_NAME}] Building topic map...`);
  const topicMap = buildTopicMapFromEntities(allEntities);
  console.log(`[${AGENT_NAME}] Generated ${topicMap.topics.length} topics with ${topicMap.connections.length} connections`);

  // Store topic map as a single document
  await db.collection("topic_maps").doc("latest").set({
    ...topicMap,
    computedAt: new Date().toISOString(),
    entityCount: allEntities.length,
  });

  // 4. Generate discovery paths
  console.log(`[${AGENT_NAME}] Generating discovery paths...`);
  const paths = generateDiscoveryPathsFromEntities(allEntities);
  console.log(`[${AGENT_NAME}] Generated ${paths.length} discovery paths`);

  // Clear existing paths
  const existingPaths = await db.collection("discovery_paths").get();
  for (const doc of existingPaths.docs) {
    batch.delete(doc.ref);
    batchCount++;
    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) {
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  }

  for (const path of paths) {
    const ref = db.collection("discovery_paths").doc(path.id);
    batch.set(ref, {
      ...path,
      computedAt: new Date().toISOString(),
    });
    batchCount++;
    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) {
    await batch.commit();
  }

  const durationMs = Date.now() - startTime;
  console.log(`[${AGENT_NAME}] Completed in ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`[${AGENT_NAME}]   Clusters: ${clusters.length}`);
  console.log(`[${AGENT_NAME}]   Topics: ${topicMap.topics.length}`);
  console.log(`[${AGENT_NAME}]   Paths: ${paths.length}`);

  await logAgentAction(AGENT_NAME, "run_complete", {
    entitiesProcessed: allEntities.length,
    clustersGenerated: clusters.length,
    topicsGenerated: topicMap.topics.length,
    connectionsGenerated: topicMap.connections.length,
    pathsGenerated: paths.length,
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
