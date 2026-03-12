/**
 * Achievement / Gamification System
 *
 * Defines achievements, checks progress, and awards unlocks.
 * Data is persisted in the Firestore `achievements` and `user_achievements` collections.
 */

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AchievementCategory =
  | "explorer"
  | "contributor"
  | "curator"
  | "social"
  | "streak";

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

export interface AchievementRequirement {
  type:
    | "entity_views"
    | "searches"
    | "submissions"
    | "follows"
    | "bookmarks"
    | "collections"
    | "login_streak"
    | "comparisons";
  threshold: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: AchievementTier;
  requirement: AchievementRequirement;
  points: number;
}

export interface UserAchievement {
  achievementId: string;
  userId: string;
  unlockedAt: string;
  progress: number;
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Predefined achievements
// ---------------------------------------------------------------------------

export const ACHIEVEMENTS: Achievement[] = [
  // ---- Explorer ----
  {
    id: "first-look",
    name: "First Look",
    description: "View your first entity",
    icon: "👁️",
    category: "explorer",
    tier: "bronze",
    requirement: { type: "entity_views", threshold: 1 },
    points: 10,
  },
  {
    id: "curious-mind",
    name: "Curious Mind",
    description: "View 10 entities",
    icon: "🔍",
    category: "explorer",
    tier: "bronze",
    requirement: { type: "entity_views", threshold: 10 },
    points: 25,
  },
  {
    id: "deep-diver",
    name: "Deep Diver",
    description: "View 50 entities",
    icon: "🤿",
    category: "explorer",
    tier: "silver",
    requirement: { type: "entity_views", threshold: 50 },
    points: 75,
  },
  {
    id: "cartographer",
    name: "Cartographer",
    description: "View 100 entities across all types",
    icon: "🗺️",
    category: "explorer",
    tier: "gold",
    requirement: { type: "entity_views", threshold: 100 },
    points: 150,
  },
  {
    id: "omniscient",
    name: "Omniscient",
    description: "View 500 entities",
    icon: "🌌",
    category: "explorer",
    tier: "platinum",
    requirement: { type: "entity_views", threshold: 500 },
    points: 500,
  },
  {
    id: "search-novice",
    name: "Search Novice",
    description: "Perform your first search",
    icon: "🔎",
    category: "explorer",
    tier: "bronze",
    requirement: { type: "searches", threshold: 1 },
    points: 10,
  },
  {
    id: "search-pro",
    name: "Search Pro",
    description: "Perform 50 searches",
    icon: "⚡",
    category: "explorer",
    tier: "silver",
    requirement: { type: "searches", threshold: 50 },
    points: 75,
  },

  // ---- Contributor ----
  {
    id: "first-submission",
    name: "First Submission",
    description: "Submit your first entity",
    icon: "📝",
    category: "contributor",
    tier: "bronze",
    requirement: { type: "submissions", threshold: 1 },
    points: 25,
  },
  {
    id: "regular-contributor",
    name: "Regular Contributor",
    description: "Submit 5 entities",
    icon: "✍️",
    category: "contributor",
    tier: "silver",
    requirement: { type: "submissions", threshold: 5 },
    points: 100,
  },
  {
    id: "prolific",
    name: "Prolific",
    description: "Submit 10 entities",
    icon: "🏗️",
    category: "contributor",
    tier: "gold",
    requirement: { type: "submissions", threshold: 10 },
    points: 200,
  },
  {
    id: "architect",
    name: "Architect",
    description: "Submit 25 entities",
    icon: "🏛️",
    category: "contributor",
    tier: "platinum",
    requirement: { type: "submissions", threshold: 25 },
    points: 500,
  },

  // ---- Curator ----
  {
    id: "collector",
    name: "Collector",
    description: "Create your first collection",
    icon: "📦",
    category: "curator",
    tier: "bronze",
    requirement: { type: "collections", threshold: 1 },
    points: 15,
  },
  {
    id: "curator",
    name: "Curator",
    description: "Create 5 collections",
    icon: "🎨",
    category: "curator",
    tier: "silver",
    requirement: { type: "collections", threshold: 5 },
    points: 75,
  },
  {
    id: "bookmark-starter",
    name: "Bookmark Starter",
    description: "Bookmark 5 entities",
    icon: "🔖",
    category: "curator",
    tier: "bronze",
    requirement: { type: "bookmarks", threshold: 5 },
    points: 15,
  },
  {
    id: "bookmark-master",
    name: "Bookmark Master",
    description: "Bookmark 25 entities",
    icon: "📚",
    category: "curator",
    tier: "gold",
    requirement: { type: "bookmarks", threshold: 25 },
    points: 100,
  },
  {
    id: "comparison-analyst",
    name: "Comparison Analyst",
    description: "Compare 10 entity pairs",
    icon: "⚖️",
    category: "curator",
    tier: "silver",
    requirement: { type: "comparisons", threshold: 10 },
    points: 50,
  },

  // ---- Social ----
  {
    id: "follower",
    name: "Follower",
    description: "Follow 5 entities",
    icon: "👥",
    category: "social",
    tier: "bronze",
    requirement: { type: "follows", threshold: 5 },
    points: 15,
  },
  {
    id: "community-builder",
    name: "Community Builder",
    description: "Follow 25 entities",
    icon: "🌐",
    category: "social",
    tier: "silver",
    requirement: { type: "follows", threshold: 25 },
    points: 75,
  },
  {
    id: "influencer",
    name: "Influencer",
    description: "Follow 100 entities",
    icon: "🌟",
    category: "social",
    tier: "gold",
    requirement: { type: "follows", threshold: 100 },
    points: 200,
  },

  // ---- Streak ----
  {
    id: "streak-3",
    name: "3-Day Streak",
    description: "Visit 3 days in a row",
    icon: "🔥",
    category: "streak",
    tier: "bronze",
    requirement: { type: "login_streak", threshold: 3 },
    points: 25,
  },
  {
    id: "streak-7",
    name: "7-Day Streak",
    description: "Visit 7 days in a row",
    icon: "💪",
    category: "streak",
    tier: "silver",
    requirement: { type: "login_streak", threshold: 7 },
    points: 75,
  },
  {
    id: "streak-30",
    name: "30-Day Streak",
    description: "Visit 30 days in a row",
    icon: "🏆",
    category: "streak",
    tier: "gold",
    requirement: { type: "login_streak", threshold: 30 },
    points: 300,
  },
  {
    id: "streak-100",
    name: "100-Day Streak",
    description: "Visit 100 days in a row",
    icon: "💎",
    category: "streak",
    tier: "platinum",
    requirement: { type: "login_streak", threshold: 100 },
    points: 1000,
  },
];

// ---------------------------------------------------------------------------
// Achievement checking
// ---------------------------------------------------------------------------

/**
 * Map action strings to requirement types for matching.
 */
const ACTION_TO_REQUIREMENT: Record<string, AchievementRequirement["type"]> = {
  view_entity: "entity_views",
  search: "searches",
  submit_entity: "submissions",
  follow: "follows",
  bookmark: "bookmarks",
  create_collection: "collections",
  login: "login_streak",
  compare: "comparisons",
};

/**
 * Check achievements for a user after an action.
 * Returns newly unlocked achievements.
 */
export async function checkAchievements(
  userId: string,
  action: string,
): Promise<UserAchievement[]> {
  const requirementType = ACTION_TO_REQUIREMENT[action];
  if (!requirementType) return [];

  // Get user's current progress for this action type
  const progressQ = query(
    collection(db, "user_progress"),
    where("userId", "==", userId),
    where("type", "==", requirementType),
  );
  const progressSnap = await getDocs(progressQ);

  let currentCount = 0;
  let progressDocId: string | null = null;

  if (!progressSnap.empty) {
    const data = progressSnap.docs[0].data();
    currentCount = (data.count as number) || 0;
    progressDocId = progressSnap.docs[0].id;
  }

  // Increment progress
  const newCount = currentCount + 1;

  if (progressDocId) {
    await updateDoc(doc(db, "user_progress", progressDocId), {
      count: newCount,
      updatedAt: new Date().toISOString(),
    });
  } else {
    await addDoc(collection(db, "user_progress"), {
      userId,
      type: requirementType,
      count: newCount,
      updatedAt: new Date().toISOString(),
    });
  }

  // Find eligible achievements
  const eligible = ACHIEVEMENTS.filter(
    (a) =>
      a.requirement.type === requirementType &&
      a.requirement.threshold <= newCount,
  );

  if (eligible.length === 0) return [];

  // Get already-unlocked achievements for this user
  const unlockedQ = query(
    collection(db, "user_achievements"),
    where("userId", "==", userId),
    where("completed", "==", true),
  );
  const unlockedSnap = await getDocs(unlockedQ);
  const unlockedIds = new Set(
    unlockedSnap.docs.map((d) => d.data().achievementId as string),
  );

  // Award new achievements
  const newlyUnlocked: UserAchievement[] = [];

  for (const achievement of eligible) {
    if (unlockedIds.has(achievement.id)) continue;

    const userAchievement: UserAchievement = {
      achievementId: achievement.id,
      userId,
      unlockedAt: new Date().toISOString(),
      progress: newCount,
      completed: true,
    };

    await addDoc(collection(db, "user_achievements"), userAchievement);
    newlyUnlocked.push(userAchievement);
  }

  return newlyUnlocked;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get all achievements for a user (both completed and in-progress).
 */
export async function getUserAchievements(
  userId: string,
): Promise<UserAchievement[]> {
  const q = query(
    collection(db, "user_achievements"),
    where("userId", "==", userId),
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserAchievement);
}

/**
 * Get the achievement leaderboard sorted by total points.
 */
export async function getLeaderboardByPoints(
  limit = 25,
): Promise<{ userId: string; points: number; achievementCount: number }[]> {
  // Get all completed user achievements
  const q = query(
    collection(db, "user_achievements"),
    where("completed", "==", true),
  );

  const snap = await getDocs(q);

  // Aggregate by user
  const userMap = new Map<
    string,
    { points: number; achievementCount: number }
  >();

  for (const d of snap.docs) {
    const data = d.data() as UserAchievement;
    const achievement = ACHIEVEMENTS.find(
      (a) => a.id === data.achievementId,
    );
    if (!achievement) continue;

    const entry = userMap.get(data.userId) ?? {
      points: 0,
      achievementCount: 0,
    };
    entry.points += achievement.points;
    entry.achievementCount += 1;
    userMap.set(data.userId, entry);
  }

  // Sort and limit
  return Array.from(userMap.entries())
    .map(([userId, stats]) => ({ userId, ...stats }))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
}
