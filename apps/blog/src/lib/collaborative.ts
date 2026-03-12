import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import type { EntityType } from "@/lib/types";

// --- Types ---

export interface BehaviorProfile {
  viewedEntities: string[]; // "type:slug" keys
  searchQueries: string[];
  followedChannels: string[];
  persona?: string;
}

export interface Recommendation {
  slug: string;
  type: string;
  name: string;
  reason: string;
  confidence: number; // 0-100
}

interface UserBehaviorDoc {
  views: { type: string; slug: string; timestamp: number }[];
  searches: { query: string; timestamp: number }[];
  updatedAt: unknown;
}

// --- Feature Vector ---

/** All known entity types used as vector dimensions. */
const ENTITY_TYPE_KEYS: EntityType[] = [
  "tool",
  "model",
  "agent",
  "skill",
  "script",
  "benchmark",
];

/**
 * Creates a simple feature vector from user behavior.
 * Dimensions: [6 entity-type view counts, search count, channel count, persona one-hot (5)]
 */
export function buildUserVector(profile: BehaviorProfile): number[] {
  // Entity type frequency
  const typeCounts: Record<string, number> = {};
  for (const key of profile.viewedEntities) {
    const type = key.split(":")[0];
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  const total = Math.max(profile.viewedEntities.length, 1);
  const typeFeatures = ENTITY_TYPE_KEYS.map(
    (t) => (typeCounts[t] || 0) / total
  );

  // Search activity (normalized)
  const searchFeature = Math.min(profile.searchQueries.length / 20, 1);

  // Channel engagement (normalized)
  const channelFeature = Math.min(profile.followedChannels.length / 10, 1);

  // Persona one-hot
  const personas = [
    "developer",
    "researcher",
    "executive",
    "agent-builder",
    "enterprise",
  ];
  const personaFeatures = personas.map((p) =>
    p === profile.persona ? 1 : 0
  );

  return [...typeFeatures, searchFeature, channelFeature, ...personaFeatures];
}

/**
 * Computes cosine similarity between two vectors.
 * Returns a value between 0 and 1.
 */
export function computeCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/** Builds a BehaviorProfile from a Firestore user_behavior document. */
function docToProfile(data: UserBehaviorDoc): BehaviorProfile {
  const viewedEntities = data.views.map((v) => `${v.type}:${v.slug}`);
  const searchQueries = data.searches.map((s) => s.query);
  return {
    viewedEntities,
    searchQueries,
    followedChannels: [],
  };
}

/**
 * Finds users with similar behavior from Firestore `user_behavior` collection.
 * Returns user IDs sorted by similarity (descending).
 */
export async function findSimilarUsers(
  userId: string,
  limit = 20
): Promise<string[]> {
  // Fetch the target user's behavior
  const userDoc = await getDoc(doc(db, "user_behavior", userId));
  if (!userDoc.exists()) return [];

  const userData = userDoc.data() as UserBehaviorDoc;
  const userProfile = docToProfile(userData);
  const userVector = buildUserVector(userProfile);

  // Fetch recent active users (limited sample for efficiency)
  const q = query(
    collection(db, "user_behavior"),
    orderBy("updatedAt", "desc"),
    firestoreLimit(100)
  );
  const snap = await getDocs(q);

  const similarities: { uid: string; score: number }[] = [];

  for (const d of snap.docs) {
    if (d.id === userId) continue;

    const otherData = d.data() as UserBehaviorDoc;
    const otherProfile = docToProfile(otherData);
    const otherVector = buildUserVector(otherProfile);
    const similarity = computeCosineSimilarity(userVector, otherVector);

    if (similarity > 0.1) {
      similarities.push({ uid: d.id, score: similarity });
    }
  }

  similarities.sort((a, b) => b.score - a.score);
  return similarities.slice(0, limit).map((s) => s.uid);
}

/**
 * Generates recommendations based on what similar users viewed but this user hasn't.
 */
export async function getCollaborativeRecommendations(
  userId: string,
  limit = 10
): Promise<Recommendation[]> {
  const userDoc = await getDoc(doc(db, "user_behavior", userId));
  if (!userDoc.exists()) return [];

  const userData = userDoc.data() as UserBehaviorDoc;
  const userViewed = new Set(
    userData.views.map((v) => `${v.type}:${v.slug}`)
  );

  const similarUserIds = await findSimilarUsers(userId, 15);
  if (similarUserIds.length === 0) return [];

  // Aggregate entity views from similar users
  const entityCounts: Record<string, { count: number; type: string; slug: string }> = {};

  for (const uid of similarUserIds) {
    const d = await getDoc(doc(db, "user_behavior", uid));
    if (!d.exists()) continue;

    const data = d.data() as UserBehaviorDoc;
    for (const view of data.views) {
      const key = `${view.type}:${view.slug}`;
      if (userViewed.has(key)) continue; // Skip entities this user already viewed

      if (!entityCounts[key]) {
        entityCounts[key] = { count: 0, type: view.type, slug: view.slug };
      }
      entityCounts[key].count++;
    }
  }

  // Sort by popularity among similar users
  const sorted = Object.entries(entityCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, limit);

  // Fetch entity names
  const recommendations: Recommendation[] = [];

  for (const [, { type, slug, count }] of sorted) {
    try {
      const entityDoc = await getDoc(doc(db, type, slug));
      const name = entityDoc.exists()
        ? (entityDoc.data().name as string) || slug
        : slug;

      const confidence = Math.min(Math.round((count / similarUserIds.length) * 100), 100);
      recommendations.push({
        slug,
        type,
        name,
        reason: "Popular among similar users",
        confidence,
      });
    } catch {
      // Skip entities that fail to load
    }
  }

  return recommendations;
}

/**
 * Returns trending entities among similar users, optionally filtered by type.
 */
export async function getPopularAmongSimilar(
  userId: string,
  entityType?: string
): Promise<Recommendation[]> {
  const recs = await getCollaborativeRecommendations(userId, 20);
  const filtered = entityType
    ? recs.filter((r) => r.type === entityType)
    : recs;

  return filtered.map((r) => ({
    ...r,
    reason: entityType
      ? `Trending ${entityType}s among similar users`
      : "Trending among similar users",
  }));
}

/**
 * Returns trending entities for anonymous users (fallback).
 * Aggregates the most-viewed entities across all recent user_behavior docs.
 */
export async function getTrendingFallback(
  entityType?: string,
  limit = 10
): Promise<Recommendation[]> {
  const q = query(
    collection(db, "user_behavior"),
    orderBy("updatedAt", "desc"),
    firestoreLimit(50)
  );
  const snap = await getDocs(q);

  const entityCounts: Record<string, { count: number; type: string; slug: string }> = {};

  for (const d of snap.docs) {
    const data = d.data() as UserBehaviorDoc;
    for (const view of data.views.slice(0, 20)) {
      if (entityType && view.type !== entityType) continue;
      const key = `${view.type}:${view.slug}`;
      if (!entityCounts[key]) {
        entityCounts[key] = { count: 0, type: view.type, slug: view.slug };
      }
      entityCounts[key].count++;
    }
  }

  const sorted = Object.entries(entityCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, limit);

  const recommendations: Recommendation[] = [];

  for (const [, { type, slug, count }] of sorted) {
    try {
      const entityDoc = await getDoc(doc(db, type, slug));
      const name = entityDoc.exists()
        ? (entityDoc.data().name as string) || slug
        : slug;

      recommendations.push({
        slug,
        type,
        name,
        reason: "Trending in the community",
        confidence: Math.min(count * 10, 100),
      });
    } catch {
      // Skip
    }
  }

  return recommendations;
}

/**
 * Returns the count of similar users and their top shared interests.
 */
export async function getSimilarUserStats(
  userId: string
): Promise<{ count: number; topInterests: string[] }> {
  const similarIds = await findSimilarUsers(userId, 50);

  // Aggregate their top entity types
  const typeCounts: Record<string, number> = {};
  for (const uid of similarIds.slice(0, 20)) {
    try {
      const d = await getDoc(doc(db, "user_behavior", uid));
      if (!d.exists()) continue;
      const data = d.data() as UserBehaviorDoc;
      for (const view of data.views.slice(0, 10)) {
        typeCounts[view.type] = (typeCounts[view.type] || 0) + 1;
      }
    } catch {
      // Skip
    }
  }

  const topInterests = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type);

  return { count: similarIds.length, topInterests };
}
