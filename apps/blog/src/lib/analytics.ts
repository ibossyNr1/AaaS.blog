import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "./firebase";
import type { EntityType } from "./types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface EntityDelta {
  slug: string;
  type: string;
  name: string;
  scoreDelta: number;
  previousScore: number;
  currentScore: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface EngagementMetrics {
  pageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: { path: string; views: number }[];
}

export interface AnalyticsSnapshot {
  period: string;
  entityCount: number;
  typeBreakdown: Record<string, number>;
  avgCompositeScore: number;
  topGrowers: EntityDelta[];
  topDecliners: EntityDelta[];
  searchVolume: number;
  topSearches: string[];
  activeUsers: number;
  newEntities: number;
  agentSuccessRate: number;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const COLLECTION_MAP: Record<EntityType, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toDate(
  ts: { toDate?: () => Date; seconds?: number } | string | null | undefined,
): Date | null {
  if (!ts) return null;
  if (typeof ts === "string") return new Date(ts);
  if (typeof ts === "object" && "toDate" in ts && typeof ts.toDate === "function")
    return ts.toDate();
  if (typeof ts === "object" && "seconds" in ts && typeof ts.seconds === "number")
    return new Date(ts.seconds * 1000);
  return null;
}

function periodToMs(period: "24h" | "7d" | "30d"): number {
  const map = { "24h": 86400000, "7d": 604800000, "30d": 2592000000 };
  return map[period];
}

/* -------------------------------------------------------------------------- */
/*  getAnalyticsSnapshot                                                       */
/* -------------------------------------------------------------------------- */

export async function getAnalyticsSnapshot(
  period: "24h" | "7d" | "30d",
): Promise<AnalyticsSnapshot> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - periodToMs(period));

  /* -- Entities ------------------------------------------------------------ */
  let entityCount = 0;
  let totalComposite = 0;
  const typeBreakdown: Record<string, number> = {};
  let newEntities = 0;

  interface EntityRow {
    slug: string;
    type: string;
    name: string;
    composite: number;
    previousComposite: number;
  }
  const allEntities: EntityRow[] = [];

  for (const [type, col] of Object.entries(COLLECTION_MAP)) {
    try {
      const snap = await getDocs(collection(db, col));
      typeBreakdown[type] = snap.size;
      entityCount += snap.size;

      for (const doc of snap.docs) {
        const data = doc.data();
        const composite = data.scores?.composite ?? 0;
        const previousComposite = data.previousScores?.composite ?? composite;
        totalComposite += composite;

        allEntities.push({
          slug: data.slug || doc.id,
          type,
          name: data.name || doc.id,
          composite,
          previousComposite,
        });

        const addedDate = toDate(data.addedDate);
        if (addedDate && addedDate >= cutoff) {
          newEntities++;
        }
      }
    } catch {
      typeBreakdown[type] = 0;
    }
  }

  const avgCompositeScore =
    entityCount > 0 ? Math.round((totalComposite / entityCount) * 100) / 100 : 0;

  // Compute deltas and sort
  const withDelta = allEntities.map((e) => ({
    slug: e.slug,
    type: e.type,
    name: e.name,
    scoreDelta: Math.round((e.composite - e.previousComposite) * 100) / 100,
    previousScore: e.previousComposite,
    currentScore: e.composite,
  }));

  const topGrowers = [...withDelta]
    .sort((a, b) => b.scoreDelta - a.scoreDelta)
    .filter((e) => e.scoreDelta > 0)
    .slice(0, 5);

  const topDecliners = [...withDelta]
    .sort((a, b) => a.scoreDelta - b.scoreDelta)
    .filter((e) => e.scoreDelta < 0)
    .slice(0, 5);

  /* -- Search logs --------------------------------------------------------- */
  let searchVolume = 0;
  const searchCounts: Record<string, number> = {};

  try {
    const searchSnap = await getDocs(collection(db, "search_logs"));
    for (const doc of searchSnap.docs) {
      const data = doc.data();
      const ts = toDate(data.timestamp || data.createdAt);
      if (ts && ts >= cutoff) {
        searchVolume++;
        const q = (data.query || "").toLowerCase().trim();
        if (q) searchCounts[q] = (searchCounts[q] || 0) + 1;
      }
    }
  } catch {
    // collection may not exist yet
  }

  const topSearches = Object.entries(searchCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([q]) => q);

  /* -- Page views / active users ------------------------------------------ */
  let activeUsers = 0;
  try {
    const viewsSnap = await getDocs(collection(db, "page_view_counts"));
    const uniqueUsers = new Set<string>();
    for (const doc of viewsSnap.docs) {
      const data = doc.data();
      const ts = toDate(data.timestamp || data.createdAt);
      if (ts && ts >= cutoff && data.userId) {
        uniqueUsers.add(data.userId);
      }
    }
    activeUsers = uniqueUsers.size;
  } catch {
    // collection may not exist
  }

  /* -- Agent success rate -------------------------------------------------- */
  let agentSuccessRate = 0;
  try {
    const logsSnap = await getDocs(collection(db, "agent_logs"));
    let runs = 0;
    let successes = 0;
    for (const doc of logsSnap.docs) {
      const data = doc.data();
      const ts = toDate(data.timestamp);
      if (ts && ts >= cutoff) {
        runs++;
        if (data.success === true) successes++;
      }
    }
    agentSuccessRate = runs > 0 ? Math.round((successes / runs) * 10000) / 100 : 0;
  } catch {
    // collection may not exist
  }

  return {
    period,
    entityCount,
    typeBreakdown,
    avgCompositeScore,
    topGrowers,
    topDecliners,
    searchVolume,
    topSearches,
    activeUsers,
    newEntities,
    agentSuccessRate,
  };
}

/* -------------------------------------------------------------------------- */
/*  getEntityTimeSeries                                                        */
/* -------------------------------------------------------------------------- */

export async function getEntityTimeSeries(
  slug: string,
  type: string,
  metric: string,
  days: number,
): Promise<TimeSeriesPoint[]> {
  const points: TimeSeriesPoint[] = [];
  const col = `${type}_metrics`;

  try {
    const cutoff = new Date(Date.now() - days * 86400000);
    const q = query(
      collection(db, col),
      where("slug", "==", slug),
      where("date", ">=", cutoff.toISOString().split("T")[0]),
      orderBy("date", "asc"),
      firestoreLimit(days),
    );
    const snap = await getDocs(q);

    for (const doc of snap.docs) {
      const data = doc.data();
      points.push({
        date: data.date,
        value: data[metric] ?? data.scores?.[metric] ?? 0,
      });
    }
  } catch {
    // Generate empty time series if collection doesn't exist
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      points.push({ date: d.toISOString().split("T")[0], value: 0 });
    }
  }

  return points;
}

/* -------------------------------------------------------------------------- */
/*  getSearchTrends                                                            */
/* -------------------------------------------------------------------------- */

export async function getSearchTrends(
  days: number,
): Promise<{ query: string; count: number; trend: "up" | "down" | "stable" }[]> {
  const cutoff = new Date(Date.now() - days * 86400000);
  const midpoint = new Date(Date.now() - (days / 2) * 86400000);

  const firstHalf: Record<string, number> = {};
  const secondHalf: Record<string, number> = {};

  try {
    const snap = await getDocs(collection(db, "search_logs"));
    for (const doc of snap.docs) {
      const data = doc.data();
      const ts = toDate(data.timestamp || data.createdAt);
      if (!ts || ts < cutoff) continue;

      const q = (data.query || "").toLowerCase().trim();
      if (!q) continue;

      if (ts < midpoint) {
        firstHalf[q] = (firstHalf[q] || 0) + 1;
      } else {
        secondHalf[q] = (secondHalf[q] || 0) + 1;
      }
    }
  } catch {
    return [];
  }

  const allQueries = new Set([...Object.keys(firstHalf), ...Object.keys(secondHalf)]);
  const results: { query: string; count: number; trend: "up" | "down" | "stable" }[] = [];

  for (const q of allQueries) {
    const first = firstHalf[q] || 0;
    const second = secondHalf[q] || 0;
    const total = first + second;
    let trend: "up" | "down" | "stable" = "stable";
    if (second > first * 1.2) trend = "up";
    else if (second < first * 0.8) trend = "down";

    results.push({ query: q, count: total, trend });
  }

  return results.sort((a, b) => b.count - a.count).slice(0, 20);
}

/* -------------------------------------------------------------------------- */
/*  getAgentMetrics                                                            */
/* -------------------------------------------------------------------------- */

export async function getAgentMetrics(): Promise<
  { agent: string; lastRun: string; successRate: number; avgDuration: number }[]
> {
  const agentData: Record<
    string,
    { runs: number; successes: number; totalDuration: number; lastRun: Date | null }
  > = {};

  try {
    const snap = await getDocs(collection(db, "agent_logs"));

    for (const doc of snap.docs) {
      const data = doc.data();
      const agentName = data.agent || "unknown";
      const ts = toDate(data.timestamp);

      if (!agentData[agentName]) {
        agentData[agentName] = { runs: 0, successes: 0, totalDuration: 0, lastRun: null };
      }

      const entry = agentData[agentName];
      entry.runs++;
      if (data.success === true) entry.successes++;
      if (typeof data.duration === "number") entry.totalDuration += data.duration;
      if (ts && (!entry.lastRun || ts > entry.lastRun)) entry.lastRun = ts;
    }
  } catch {
    return [];
  }

  return Object.entries(agentData)
    .map(([agent, d]) => ({
      agent,
      lastRun: d.lastRun ? d.lastRun.toISOString() : "never",
      successRate: d.runs > 0 ? Math.round((d.successes / d.runs) * 10000) / 100 : 0,
      avgDuration: d.runs > 0 ? Math.round(d.totalDuration / d.runs) : 0,
    }))
    .sort((a, b) => b.successRate - a.successRate);
}
