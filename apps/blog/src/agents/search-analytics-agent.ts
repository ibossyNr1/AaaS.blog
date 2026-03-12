/**
 * Search Analytics Agent
 *
 * Reads the `search_logs` collection, aggregates search data, and stores
 * analytics in a `search_analytics` Firestore document. This helps identify:
 * - Top queries (most searched terms)
 * - Zero-result queries (what people look for but can't find)
 * - Trending searches (queries with increasing frequency)
 *
 * Usage:
 *   npx tsx src/agents/search-analytics-agent.ts
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "search-analytics";

/** How many days of logs to analyze */
const LOOKBACK_DAYS = 30;

/** Max items per aggregation bucket */
const TOP_N = 50;

interface SearchLog {
  query: string;
  resultsCount: number;
  timestamp: string;
}

interface QueryAgg {
  query: string;
  count: number;
  avgResults: number;
  lastSeen: string;
}

interface SearchAnalytics {
  topQueries: QueryAgg[];
  zeroResultQueries: QueryAgg[];
  trendingQueries: { query: string; recentCount: number; previousCount: number; growth: number }[];
  totalSearches: number;
  uniqueQueries: number;
  avgResultsPerSearch: number;
  zeroResultRate: number;
  analyzedAt: string;
  lookbackDays: number;
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting search analytics aggregation...`);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);
  const cutoffISO = cutoff.toISOString();

  // Midpoint for trending detection (half the lookback window)
  const midpoint = new Date();
  midpoint.setDate(midpoint.getDate() - Math.floor(LOOKBACK_DAYS / 2));
  const midpointISO = midpoint.toISOString();

  // Fetch all search logs within lookback window
  const snap = await db
    .collection("search_logs")
    .where("timestamp", ">=", cutoffISO)
    .orderBy("timestamp", "desc")
    .get();

  const logs: SearchLog[] = snap.docs.map((d) => d.data() as SearchLog);

  console.log(`  Found ${logs.length} search logs in the past ${LOOKBACK_DAYS} days`);

  if (logs.length === 0) {
    console.log(`[${AGENT_NAME}] No logs to analyze. Exiting.`);
    await logAgentAction(AGENT_NAME, "analytics_skipped", { reason: "no_logs" }, true);
    return;
  }

  // Aggregate by normalized query
  const queryMap = new Map<string, { count: number; totalResults: number; lastSeen: string; recentCount: number; previousCount: number }>();

  for (const log of logs) {
    const normalized = log.query.toLowerCase().trim();
    if (!normalized) continue;

    const existing = queryMap.get(normalized) || {
      count: 0,
      totalResults: 0,
      lastSeen: log.timestamp,
      recentCount: 0,
      previousCount: 0,
    };

    existing.count++;
    existing.totalResults += log.resultsCount;
    if (log.timestamp > existing.lastSeen) {
      existing.lastSeen = log.timestamp;
    }

    // Split into recent vs previous halves for trending
    if (log.timestamp >= midpointISO) {
      existing.recentCount++;
    } else {
      existing.previousCount++;
    }

    queryMap.set(normalized, existing);
  }

  // Build aggregation arrays
  const allQueries: (QueryAgg & { recentCount: number; previousCount: number })[] = [];
  let totalResults = 0;

  for (const [q, agg] of queryMap.entries()) {
    totalResults += agg.totalResults;
    allQueries.push({
      query: q,
      count: agg.count,
      avgResults: Math.round((agg.totalResults / agg.count) * 10) / 10,
      lastSeen: agg.lastSeen,
      recentCount: agg.recentCount,
      previousCount: agg.previousCount,
    });
  }

  // Top queries by count
  const topQueries = [...allQueries]
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N)
    .map(({ recentCount, previousCount, ...rest }) => rest);

  // Zero-result queries
  const zeroResultQueries = allQueries
    .filter((q) => q.avgResults === 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N)
    .map(({ recentCount, previousCount, ...rest }) => rest);

  // Trending: queries with growth in recent half vs previous half
  const trendingQueries = allQueries
    .filter((q) => q.recentCount > 0 && q.count >= 3)
    .map((q) => {
      const growth = q.previousCount > 0
        ? (q.recentCount - q.previousCount) / q.previousCount
        : q.recentCount; // If no previous, growth = recentCount
      return {
        query: q.query,
        recentCount: q.recentCount,
        previousCount: q.previousCount,
        growth: Math.round(growth * 100) / 100,
      };
    })
    .filter((q) => q.growth > 0)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, TOP_N);

  const totalSearches = logs.length;
  const uniqueQueries = queryMap.size;
  const avgResultsPerSearch = totalSearches > 0
    ? Math.round((totalResults / totalSearches) * 10) / 10
    : 0;
  const zeroResultSearches = logs.filter((l) => l.resultsCount === 0).length;
  const zeroResultRate = totalSearches > 0
    ? Math.round((zeroResultSearches / totalSearches) * 1000) / 10
    : 0;

  const analytics: SearchAnalytics = {
    topQueries,
    zeroResultQueries,
    trendingQueries,
    totalSearches,
    uniqueQueries,
    avgResultsPerSearch,
    zeroResultRate,
    analyzedAt: new Date().toISOString(),
    lookbackDays: LOOKBACK_DAYS,
  };

  // Write to Firestore
  await db.collection("search_analytics").doc("latest").set(analytics);

  console.log(`\n[${AGENT_NAME}] Complete.`);
  console.log(`  Total searches: ${totalSearches}`);
  console.log(`  Unique queries: ${uniqueQueries}`);
  console.log(`  Avg results/search: ${avgResultsPerSearch}`);
  console.log(`  Zero-result rate: ${zeroResultRate}%`);
  console.log(`  Top queries: ${topQueries.length}`);
  console.log(`  Zero-result queries: ${zeroResultQueries.length}`);
  console.log(`  Trending queries: ${trendingQueries.length}`);

  await logAgentAction(AGENT_NAME, "analytics_complete", {
    totalSearches,
    uniqueQueries,
    avgResultsPerSearch,
    zeroResultRate,
    topQueriesCount: topQueries.length,
    zeroResultQueriesCount: zeroResultQueries.length,
    trendingQueriesCount: trendingQueries.length,
  }, true);
}

// Direct execution
if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`[${AGENT_NAME}] Fatal error:`, err);
      process.exit(1);
    });
}
