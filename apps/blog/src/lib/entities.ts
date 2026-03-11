import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Entity, EntityType, RegisteredAgent } from "./types";

const COLLECTION_MAP: Record<EntityType, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

const ALL_COLLECTIONS = Object.values(COLLECTION_MAP);

/** Fetch a single entity by type and slug */
export async function getEntity(type: EntityType, slug: string): Promise<Entity | null> {
  const col = COLLECTION_MAP[type];
  const ref = doc(db, col, slug);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { slug: snap.id, ...snap.data() } as Entity;
}

/** Fetch entities of a given type, sorted by composite score descending */
export async function getEntitiesByType(type: EntityType, max = 50): Promise<Entity[]> {
  const col = COLLECTION_MAP[type];
  const q = query(
    collection(db, col),
    orderBy("scores.composite", "desc"),
    firestoreLimit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ slug: d.id, ...d.data() }) as Entity);
}

/** Fetch entities across all types for a given channel (category), sorted by composite score */
export async function getEntitiesByChannel(channelSlug: string, max = 50): Promise<Entity[]> {
  const results: Entity[] = [];

  const perCollection = Math.ceil(max / ALL_COLLECTIONS.length);

  await Promise.all(
    ALL_COLLECTIONS.map(async (col) => {
      const q = query(
        collection(db, col),
        where("category", "==", channelSlug),
        orderBy("scores.composite", "desc"),
        firestoreLimit(perCollection),
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        results.push({ slug: d.id, ...d.data() } as Entity);
      }
    }),
  );

  return results
    .sort((a, b) => b.scores.composite - a.scores.composite)
    .slice(0, max);
}

/** Get top entities across all types by composite score */
export async function getTrendingEntities(max = 20): Promise<Entity[]> {
  const results: Entity[] = [];

  const perCollection = Math.ceil(max / ALL_COLLECTIONS.length);

  await Promise.all(
    ALL_COLLECTIONS.map(async (col) => {
      const q = query(
        collection(db, col),
        orderBy("scores.composite", "desc"),
        firestoreLimit(perCollection),
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        results.push({ slug: d.id, ...d.data() } as Entity);
      }
    }),
  );

  return results
    .sort((a, b) => b.scores.composite - a.scores.composite)
    .slice(0, max);
}

/** Get newest entities across all types */
export async function getRecentEntities(max = 20): Promise<Entity[]> {
  const results: Entity[] = [];

  const perCollection = Math.ceil(max / ALL_COLLECTIONS.length);

  await Promise.all(
    ALL_COLLECTIONS.map(async (col) => {
      const q = query(
        collection(db, col),
        orderBy("addedDate", "desc"),
        firestoreLimit(perCollection),
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        results.push({ slug: d.id, ...d.data() } as Entity);
      }
    }),
  );

  return results
    .sort((a, b) => b.addedDate.localeCompare(a.addedDate))
    .slice(0, max);
}

/** Get all slugs for a given entity type (for generateStaticParams) */
export async function getAllSlugs(type: EntityType): Promise<string[]> {
  const col = COLLECTION_MAP[type];
  const snap = await getDocs(collection(db, col));
  return snap.docs.map((d) => d.id);
}

/** Get leaderboard for a specific entity type or all types */
export async function getLeaderboard(type: EntityType | "all", max = 25): Promise<Entity[]> {
  if (type === "all") {
    return getTrendingEntities(max);
  }
  return getEntitiesByType(type, max);
}

/** Get entities added by a specific agent */
export async function getEntitiesByAgent(agentId: string, max = 50): Promise<Entity[]> {
  const results: Entity[] = [];

  await Promise.all(
    ALL_COLLECTIONS.map(async (col) => {
      const q = query(
        collection(db, col),
        where("addedBy", "==", agentId),
        orderBy("addedDate", "desc"),
        firestoreLimit(max),
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        results.push({ slug: d.id, ...d.data() } as Entity);
      }
    }),
  );

  return results
    .sort((a, b) => b.addedDate.localeCompare(a.addedDate))
    .slice(0, max);
}

/** Fetch a registered agent profile */
export async function getAgent(agentId: string): Promise<RegisteredAgent | null> {
  const ref = doc(db, "registered_agents", agentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as RegisteredAgent;
}

/** Get entities matching specific channels (for persona-based recommendations) */
export async function getEntitiesForChannels(channels: string[], max = 12): Promise<Entity[]> {
  const results: Entity[] = [];
  const perChannel = Math.ceil(max / channels.length);

  await Promise.all(
    channels.map(async (channelSlug) => {
      const channelResults = await getEntitiesByChannel(channelSlug, perChannel);
      results.push(...channelResults);
    }),
  );

  // Deduplicate and sort by composite score
  const seen = new Set<string>();
  return results
    .filter((e) => {
      const key = `${e.type}-${e.slug}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.scores.composite - a.scores.composite)
    .slice(0, max);
}
