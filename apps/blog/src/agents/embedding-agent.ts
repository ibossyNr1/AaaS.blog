/**
 * Embedding Sync Agent
 *
 * Keeps vector embeddings in Pinecone synchronized with Firestore entity data.
 * For each entity, generates an embedding text from name + description + tags +
 * capabilities + provider, then upserts to Pinecone if the entity has been
 * updated since the last sync.
 *
 * Also detects deleted entities and removes their vectors from Pinecone.
 *
 * Schedule: daily (runs after similarity)
 * Idempotent: yes — tracks last sync timestamp per entity
 */

import { db, logAgentAction } from "./logger";
import { getEmbedding, upsertEntity, deleteEntity } from "@/lib/pinecone";

const AGENT_NAME = "embedding-agent";
const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];
const SYNC_COLLECTION = "embedding_sync";
const BATCH_LIMIT = 450;

interface SyncRecord {
  lastSyncedAt: string;
  vectorId: string;
  entityType: string;
  entitySlug: string;
}

function isPineconeConfigured(): boolean {
  return Boolean(process.env.PINECONE_API_KEY && process.env.PINECONE_HOST);
}

function buildEmbeddingText(data: Record<string, unknown>): string {
  const parts = [
    data.name,
    data.description,
    data.provider,
    ...(Array.isArray(data.tags) ? data.tags : []),
    ...(Array.isArray(data.capabilities) ? data.capabilities : []),
  ];
  return parts.filter(Boolean).join(" ");
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting embedding sync...`);
  const startTime = Date.now();

  // Gracefully handle missing Pinecone credentials
  if (!isPineconeConfigured()) {
    console.warn(`[${AGENT_NAME}] Pinecone not configured — skipping embedding sync`);
    await logAgentAction(AGENT_NAME, "skipped", {
      reason: "Pinecone credentials not configured",
    }, true);
    return;
  }

  // 1. Load existing sync records to detect changes and deletions
  const syncSnap = await db.collection(SYNC_COLLECTION).get();
  const syncMap = new Map<string, SyncRecord>();
  for (const doc of syncSnap.docs) {
    syncMap.set(doc.id, doc.data() as SyncRecord);
  }

  // 2. Process all entities
  const currentEntityIds = new Set<string>();
  let upsertedCount = 0;
  let skippedCount = 0;
  let deletedCount = 0;
  let errorCount = 0;

  for (const col of ENTITY_COLLECTIONS) {
    const snap = await db.collection(col).get();
    const entityType = col.replace(/s$/, "");

    for (const doc of snap.docs) {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const syncId = `${col}__${slug}`;
      currentEntityIds.add(syncId);

      // Check if entity has been updated since last sync
      const existingSync = syncMap.get(syncId);
      const entityUpdatedAt = data.updatedAt?.toDate?.()?.toISOString?.()
        || data.updatedAt
        || data.createdAt?.toDate?.()?.toISOString?.()
        || data.createdAt
        || "";

      if (existingSync && existingSync.lastSyncedAt >= entityUpdatedAt && entityUpdatedAt) {
        skippedCount++;
        continue;
      }

      // Entity is new or updated — generate embedding and upsert
      try {
        const entityForUpsert = {
          slug,
          type: entityType,
          name: data.name || doc.id,
          description: data.description || "",
          provider: data.provider || "",
          category: data.category || "",
          tags: data.tags || [],
          capabilities: data.capabilities || [],
          useCases: data.useCases || [],
          pricingModel: data.pricingModel || "",
          scores: data.scores || {},
        };

        await upsertEntity(entityForUpsert as Parameters<typeof upsertEntity>[0]);

        // Update sync record
        await db.collection(SYNC_COLLECTION).doc(syncId).set({
          lastSyncedAt: new Date().toISOString(),
          vectorId: `${entityType}::${slug}`,
          entityType,
          entitySlug: slug,
        });

        upsertedCount++;
        console.log(`[${AGENT_NAME}] Upserted: ${entityType}/${slug}`);
      } catch (err) {
        errorCount++;
        console.error(`[${AGENT_NAME}] Failed to upsert ${entityType}/${slug}:`, err);
      }
    }
  }

  // 3. Detect and remove deleted entities
  for (const [syncId, syncRecord] of syncMap) {
    if (!currentEntityIds.has(syncId)) {
      try {
        await deleteEntity(syncRecord.entityType, syncRecord.entitySlug);
        await db.collection(SYNC_COLLECTION).doc(syncId).delete();
        deletedCount++;
        console.log(`[${AGENT_NAME}] Deleted vector: ${syncRecord.entityType}/${syncRecord.entitySlug}`);
      } catch (err) {
        errorCount++;
        console.error(`[${AGENT_NAME}] Failed to delete vector for ${syncId}:`, err);
      }
    }
  }

  const durationMs = Date.now() - startTime;
  console.log(
    `[${AGENT_NAME}] Sync complete: ${upsertedCount} upserted, ${skippedCount} skipped, ${deletedCount} deleted, ${errorCount} errors (${(durationMs / 1000).toFixed(1)}s)`,
  );

  await logAgentAction(AGENT_NAME, "run_complete", {
    upsertedCount,
    skippedCount,
    deletedCount,
    errorCount,
    durationMs,
  }, errorCount === 0);
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
