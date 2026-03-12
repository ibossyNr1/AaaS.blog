/**
 * Reporting Agent — Generates comprehensive weekly system reports.
 *
 * Aggregates entity stats, search metrics, agent performance, and anomaly summaries
 * into a structured report stored in the system_reports Firestore collection.
 */

import { db, logAgentAction } from "./logger";
import { FieldValue } from "firebase-admin/firestore";

const AGENT_NAME = "reporting";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface EntityStats {
  type: string;
  total: number;
  avgScore: number;
  withScores: number;
}

interface AgentPerformance {
  agent: string;
  runs: number;
  successes: number;
  failures: number;
  successRate: number;
  avgDurationMs: number;
}

interface SystemReport {
  reportId: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  entityStats: EntityStats[];
  totalEntities: number;
  searchMetrics: {
    totalSearches: number;
    avgDailySearches: number;
    topSearches: { term: string; count: number }[];
  };
  agentPerformance: AgentPerformance[];
  overallAgentSuccessRate: number;
  anomalySummary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  healthSummary: {
    lastCheckStatus: string;
    activeAlerts: number;
  };
}

const ENTITY_TYPES = ["tools", "models", "agents", "skills", "scripts", "benchmarks"] as const;

/* -------------------------------------------------------------------------- */
/*  Entity Stats                                                               */
/* -------------------------------------------------------------------------- */

async function gatherEntityStats(): Promise<{ stats: EntityStats[]; total: number }> {
  const stats: EntityStats[] = [];
  let total = 0;

  for (const entityType of ENTITY_TYPES) {
    try {
      const snap = await db.collection(entityType).get();
      const count = snap.size;
      total += count;

      let scoreSum = 0;
      let withScores = 0;

      for (const doc of snap.docs) {
        const data = doc.data();
        const score = data.score ?? data.qualityScore ?? data.rankScore;
        if (typeof score === "number") {
          scoreSum += score;
          withScores++;
        }
      }

      stats.push({
        type: entityType,
        total: count,
        avgScore: withScores > 0 ? Math.round((scoreSum / withScores) * 100) / 100 : 0,
        withScores,
      });
    } catch {
      stats.push({ type: entityType, total: 0, avgScore: 0, withScores: 0 });
    }
  }

  return { stats, total };
}

/* -------------------------------------------------------------------------- */
/*  Search Metrics                                                             */
/* -------------------------------------------------------------------------- */

async function gatherSearchMetrics(): Promise<SystemReport["searchMetrics"]> {
  const metrics = {
    totalSearches: 0,
    avgDailySearches: 0,
    topSearches: [] as { term: string; count: number }[],
  };

  try {
    const analyticsSnap = await db
      .collection("search_analytics")
      .orderBy("date", "desc")
      .limit(7)
      .get();

    if (!analyticsSnap.empty) {
      let totalVolume = 0;
      const termCounts = new Map<string, number>();

      for (const doc of analyticsSnap.docs) {
        const data = doc.data();
        const volume = data.totalSearches ?? data.searchCount ?? 0;
        totalVolume += volume;

        // Aggregate top terms if present
        const terms = data.topTerms ?? data.topSearches ?? [];
        for (const term of terms) {
          const key = typeof term === "string" ? term : term.term ?? term.query;
          const count = typeof term === "string" ? 1 : term.count ?? 1;
          if (key) {
            termCounts.set(key, (termCounts.get(key) || 0) + count);
          }
        }
      }

      metrics.totalSearches = totalVolume;
      metrics.avgDailySearches = analyticsSnap.size > 0
        ? Math.round(totalVolume / analyticsSnap.size)
        : 0;

      metrics.topSearches = Array.from(termCounts.entries())
        .map(([term, count]) => ({ term, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }
  } catch {
    // search_analytics may not exist
  }

  return metrics;
}

/* -------------------------------------------------------------------------- */
/*  Agent Performance                                                          */
/* -------------------------------------------------------------------------- */

async function gatherAgentPerformance(): Promise<AgentPerformance[]> {
  const performance: AgentPerformance[] = [];

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const logsSnap = await db
      .collection("agent_logs")
      .where("timestamp", ">=", cutoff.toISOString())
      .orderBy("timestamp", "desc")
      .limit(500)
      .get();

    const byAgent = new Map<string, { runs: number; successes: number; totalDuration: number }>();

    for (const doc of logsSnap.docs) {
      const data = doc.data();
      const agent = data.agent ?? data.agentName ?? "unknown";
      const current = byAgent.get(agent) || { runs: 0, successes: 0, totalDuration: 0 };

      current.runs++;
      if (data.success) current.successes++;
      if (typeof data.durationMs === "number") current.totalDuration += data.durationMs;

      byAgent.set(agent, current);
    }

    for (const [agent, stats] of byAgent) {
      performance.push({
        agent,
        runs: stats.runs,
        successes: stats.successes,
        failures: stats.runs - stats.successes,
        successRate: stats.runs > 0 ? Math.round((stats.successes / stats.runs) * 100) : 0,
        avgDurationMs: stats.runs > 0 ? Math.round(stats.totalDuration / stats.runs) : 0,
      });
    }

    performance.sort((a, b) => b.runs - a.runs);
  } catch {
    // agent_logs may not exist or lack index
  }

  return performance;
}

/* -------------------------------------------------------------------------- */
/*  Anomaly Summary                                                            */
/* -------------------------------------------------------------------------- */

async function gatherAnomalySummary(): Promise<SystemReport["anomalySummary"]> {
  const summary = { total: 0, critical: 0, warning: 0, info: 0 };

  try {
    const latestSnap = await db.collection("anomalies").doc("latest").get();
    if (latestSnap.exists) {
      const data = latestSnap.data()!;
      summary.total = data.totalAnomalies ?? 0;
      summary.critical = data.critical ?? 0;
      summary.warning = data.warning ?? 0;
      summary.info = data.info ?? 0;
    }
  } catch {
    // anomalies may not exist
  }

  return summary;
}

/* -------------------------------------------------------------------------- */
/*  Health Summary                                                             */
/* -------------------------------------------------------------------------- */

async function gatherHealthSummary(): Promise<SystemReport["healthSummary"]> {
  const summary = { lastCheckStatus: "unknown", activeAlerts: 0 };

  try {
    const healthSnap = await db.collection("health_checks").doc("latest").get();
    if (healthSnap.exists) {
      const data = healthSnap.data()!;
      summary.lastCheckStatus = data.overallStatus ?? data.status ?? "unknown";
    }
  } catch {
    // health_checks may not exist
  }

  try {
    const alertSnap = await db.collection("alert_summaries").doc("latest").get();
    if (alertSnap.exists) {
      const data = alertSnap.data()!;
      summary.activeAlerts = data.totalAlerts ?? 0;
    }
  } catch {
    // alert_summaries may not exist
  }

  return summary;
}

/* -------------------------------------------------------------------------- */
/*  Main Run                                                                   */
/* -------------------------------------------------------------------------- */

export async function run(): Promise<void> {
  console.log("Reporting Agent — generating weekly system report...\n");

  const now = new Date();
  const periodEnd = now.toISOString();
  const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const reportId = `report_${now.toISOString().slice(0, 10)}`;

  const [
    { stats: entityStats, total: totalEntities },
    searchMetrics,
    agentPerformance,
    anomalySummary,
    healthSummary,
  ] = await Promise.all([
    gatherEntityStats(),
    gatherSearchMetrics(),
    gatherAgentPerformance(),
    gatherAnomalySummary(),
    gatherHealthSummary(),
  ]);

  // Calculate overall agent success rate
  const totalRuns = agentPerformance.reduce((s, a) => s + a.runs, 0);
  const totalSuccesses = agentPerformance.reduce((s, a) => s + a.successes, 0);
  const overallAgentSuccessRate = totalRuns > 0
    ? Math.round((totalSuccesses / totalRuns) * 100)
    : 100;

  const report: SystemReport = {
    reportId,
    generatedAt: now.toISOString(),
    periodStart,
    periodEnd,
    entityStats,
    totalEntities,
    searchMetrics,
    agentPerformance,
    overallAgentSuccessRate,
    anomalySummary,
    healthSummary,
  };

  console.log(`  Total entities:     ${totalEntities}`);
  for (const stat of entityStats) {
    console.log(`    ${stat.type.padEnd(12)} ${stat.total} entities, avg score ${stat.avgScore}`);
  }
  console.log(`  Search volume (7d): ${searchMetrics.totalSearches}`);
  console.log(`  Agent runs (7d):    ${totalRuns}`);
  console.log(`  Agent success rate: ${overallAgentSuccessRate}%`);
  console.log(`  Active anomalies:   ${anomalySummary.total}`);
  console.log(`  Health status:      ${healthSummary.lastCheckStatus}`);

  // Write report
  await db.collection("system_reports").doc(reportId).set({
    ...report,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Also keep a "latest" pointer
  await db.collection("system_reports").doc("latest").set({
    ...report,
    createdAt: FieldValue.serverTimestamp(),
  });

  await logAgentAction(
    AGENT_NAME,
    "report_generated",
    {
      reportId,
      totalEntities,
      searchVolume: searchMetrics.totalSearches,
      agentRuns: totalRuns,
      agentSuccessRate: overallAgentSuccessRate,
      anomalies: anomalySummary.total,
      healthStatus: healthSummary.lastCheckStatus,
    },
    true,
  );

  console.log(`\nReport written: system_reports/${reportId}`);
}

if (require.main === module) {
  run();
}
