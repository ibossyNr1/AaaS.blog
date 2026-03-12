/**
 * Discovery Agent
 *
 * Generates personalized discovery suggestions for active users.
 * Analyzes user behavior patterns (viewed entities in the last 7 days)
 * and uses collaborative filtering to suggest entities they haven't seen
 * but might like.
 *
 * Stores suggestions in `discovery_suggestions/{userId}` Firestore docs.
 *
 * Schedule: daily (runs after clustering)
 * Idempotent: yes — overwrites existing suggestions for each user
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "discovery-agent";
const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];
const BEHAVIOR_COLLECTION = "user_behavior";
const SUGGESTIONS_COLLECTION = "discovery_suggestions";
const LOOKBACK_DAYS = 7;
const MAX_SUGGESTIONS = 10;
const SIMILAR_USER_THRESHOLD = 3; // Minimum shared views to consider users "similar"

interface UserProfile {
  userId: string;
  viewedEntities: Set<string>; // "type::slug" keys
  viewedTags: Map<string, number>;
  viewedCategories: Map<string, number>;
  viewedTypes: Map<string, number>;
}

interface Suggestion {
  type: string;
  slug: string;
  name: string;
  reason: string;
  score: number;
}

interface EntityRecord {
  type: string;
  slug: string;
  name: string;
  category: string;
  tags: string[];
  description: string;
}

function getDateThreshold(): Date {
  const d = new Date();
  d.setDate(d.getDate() - LOOKBACK_DAYS);
  return d;
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting discovery suggestion generation...`);
  const startTime = Date.now();
  const threshold = getDateThreshold();

  // 1. Load all active user behavior
  const behaviorSnap = await db.collection(BEHAVIOR_COLLECTION).get();
  const userProfiles: UserProfile[] = [];

  for (const doc of behaviorSnap.docs) {
    const data = doc.data();
    const views = data.views || data.recentViews || [];
    const recentViews: Array<{ type: string; slug: string; tags?: string[]; category?: string; viewedAt?: string }> = [];

    for (const view of views) {
      const viewDate = view.viewedAt ? new Date(view.viewedAt) : null;
      if (viewDate && viewDate >= threshold) {
        recentViews.push(view);
      }
    }

    if (recentViews.length === 0) continue;

    const profile: UserProfile = {
      userId: doc.id,
      viewedEntities: new Set(),
      viewedTags: new Map(),
      viewedCategories: new Map(),
      viewedTypes: new Map(),
    };

    for (const view of recentViews) {
      const key = `${view.type}::${view.slug}`;
      profile.viewedEntities.add(key);

      // Track tag preferences
      for (const tag of view.tags || []) {
        profile.viewedTags.set(tag, (profile.viewedTags.get(tag) || 0) + 1);
      }

      // Track category preferences
      if (view.category) {
        profile.viewedCategories.set(
          view.category,
          (profile.viewedCategories.get(view.category) || 0) + 1,
        );
      }

      // Track type preferences
      if (view.type) {
        profile.viewedTypes.set(view.type, (profile.viewedTypes.get(view.type) || 0) + 1);
      }
    }

    userProfiles.push(profile);
  }

  console.log(`[${AGENT_NAME}] Found ${userProfiles.length} active users in the last ${LOOKBACK_DAYS} days`);

  if (userProfiles.length === 0) {
    console.log(`[${AGENT_NAME}] No active users found. Nothing to generate.`);
    await logAgentAction(AGENT_NAME, "run_complete", { usersProcessed: 0 }, true);
    return;
  }

  // 2. Load all entities for suggestion candidates
  const allEntities: EntityRecord[] = [];
  for (const col of ENTITY_COLLECTIONS) {
    const snap = await db.collection(col).get();
    const entityType = col.replace(/s$/, "");
    for (const doc of snap.docs) {
      const data = doc.data();
      allEntities.push({
        type: entityType,
        slug: data.slug || doc.id,
        name: data.name || doc.id,
        category: data.category || "",
        tags: data.tags || [],
        description: data.description || "",
      });
    }
  }

  console.log(`[${AGENT_NAME}] Loaded ${allEntities.length} candidate entities`);

  // 3. Generate suggestions for each user
  let usersProcessed = 0;
  let totalSuggestions = 0;

  for (const profile of userProfiles) {
    const suggestions: Suggestion[] = [];

    // A) Content-based filtering — score entities by tag/category/type overlap
    for (const entity of allEntities) {
      const entityKey = `${entity.type}::${entity.slug}`;
      if (profile.viewedEntities.has(entityKey)) continue; // Already viewed

      let score = 0;
      let reasons: string[] = [];

      // Tag overlap
      let tagOverlap = 0;
      for (const tag of entity.tags) {
        const weight = profile.viewedTags.get(tag) || 0;
        if (weight > 0) {
          tagOverlap += weight;
        }
      }
      if (tagOverlap > 0) {
        score += tagOverlap * 10;
        reasons.push("matches your interests");
      }

      // Category match
      const categoryWeight = profile.viewedCategories.get(entity.category) || 0;
      if (categoryWeight > 0) {
        score += categoryWeight * 5;
        reasons.push(`popular in ${entity.category}`);
      }

      // Type preference
      const typeWeight = profile.viewedTypes.get(entity.type) || 0;
      if (typeWeight > 0) {
        score += typeWeight * 3;
      }

      if (score > 0) {
        suggestions.push({
          type: entity.type,
          slug: entity.slug,
          name: entity.name,
          reason: reasons[0] || "recommended for you",
          score,
        });
      }
    }

    // B) Collaborative filtering — find similar users and suggest their views
    for (const otherProfile of userProfiles) {
      if (otherProfile.userId === profile.userId) continue;

      // Count shared views
      let sharedViews = 0;
      for (const key of profile.viewedEntities) {
        if (otherProfile.viewedEntities.has(key)) sharedViews++;
      }

      if (sharedViews < SIMILAR_USER_THRESHOLD) continue;

      // Suggest entities the similar user viewed but this user hasn't
      for (const key of otherProfile.viewedEntities) {
        if (profile.viewedEntities.has(key)) continue;

        const [type, slug] = key.split("::");
        const entity = allEntities.find((e) => e.type === type && e.slug === slug);
        if (!entity) continue;

        const existing = suggestions.find((s) => s.type === type && s.slug === slug);
        if (existing) {
          existing.score += sharedViews * 8;
        } else {
          suggestions.push({
            type,
            slug,
            name: entity.name,
            reason: "users like you also viewed this",
            score: sharedViews * 8,
          });
        }
      }
    }

    // Sort by score, take top N
    suggestions.sort((a, b) => b.score - a.score);
    const topSuggestions = suggestions.slice(0, MAX_SUGGESTIONS);

    // Store suggestions
    if (topSuggestions.length > 0) {
      await db.collection(SUGGESTIONS_COLLECTION).doc(profile.userId).set({
        userId: profile.userId,
        suggestions: topSuggestions,
        generatedAt: new Date().toISOString(),
        viewedEntityCount: profile.viewedEntities.size,
      });

      totalSuggestions += topSuggestions.length;
    }

    usersProcessed++;
  }

  const durationMs = Date.now() - startTime;
  console.log(
    `[${AGENT_NAME}] Generated ${totalSuggestions} suggestions for ${usersProcessed} users (${(durationMs / 1000).toFixed(1)}s)`,
  );

  await logAgentAction(AGENT_NAME, "run_complete", {
    usersProcessed,
    totalSuggestions,
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
