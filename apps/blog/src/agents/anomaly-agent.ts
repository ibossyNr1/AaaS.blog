/**
 * Anomaly Detection Agent — Daily anomaly scanner.
 *
 * Runs daily to detect statistical anomalies across entity scores,
 * traffic patterns, agent activity, and update frequency. Stores
 * detected anomalies in the `anomalies` Firestore collection and
 * auto-resolves anomalies older than 7 days.
 */

import { db, logAgentAction } from "./logger";
import { FieldValue } from "firebase-admin/firestore";
import {
  detectScoreAnomalies,
  detectTrafficAnomalies,
  detectStaleAgents,
  detectMassUpdates,
  DEFAULT_ANOMALY_CONFIG,
  type Anomaly,
} from "../lib/anomaly";

const AGENT_NAME = "anomaly";
const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];
const AUTO_RESOLVE_DAYS = 7;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toISOString(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "object" && val !== null && "toDate" in val) {
    const d = (val as { toDate: () => Date }).toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
  }
  if (typeof val === "string") return val;
  return new Date().toISOString();
}

/* -------------------------------------------------------------------------- */
/*  Score anomalies                                                            */
/* -------------------------------------------------------------------------- */

async function gatherScoreData() {
  const entities: { slug: string; type: string; name: string; score: number; prevScore: number }[] = [];

  for (const col of ENTITY_COLLECTIONS) {
    try {
      const snap = await db.collection(col).get();
      for (const doc of snap.docs) {
        const d = doc.data();
        const score = (d.score as number) ?? (d.overallScore as number) ?? 0;
        const prevScore = (d.prevScore as number) ?? (d.previousScore as number) ?? 0;
        if (score > 0) {
          entities.push({
            slug: doc.id,
            type: col,
            name: (d.name as string) ?? doc.id,
            score,
            prevScore: prevScore || score, // if no prev, use current (no anomaly)
          });
        }
      }
    } catch {
      // Collection may not exist — skip
    }
  }

  return entities;
}

/* -------------------------------------------------------------------------- */
/*  Traffic anomalies                                                          */
/* -------------------------------------------------------------------------- */

async function gatherTrafficData(): Promise<{ recentViews: number; historicalAvg: number }> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Recent (24h) page views
    const recentSnap = await db
      .collection("page_views")
      .where("timestamp", ">=", oneDayAgo)
      .get();
    const recentViews = recentSnap.size;

    // Historical (30-day) average
    const histSnap = await db
      .collection("page_views")
      .where("timestamp", ">=", thirtyDaysAgo)
      .get();
    const historicalAvg = histSnap.size > 0 ? histSnap.size / 30 : 0;

    return { recentViews, historicalAvg };
  } catch {
    return { recentViews: 0, historicalAvg: 0 };
  }
}

/* -------------------------------------------------------------------------- */
/*  Stale agent detection                                                      */
/* -------------------------------------------------------------------------- */

async function gatherAgentLogData(): Promise<{ agent: string; timestamp: string }[]> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const snap = await db
      .collection("agent_logs")
      .where("timestamp", ">=", sevenDaysAgo)
      .orderBy("timestamp", "desc")
      .limit(1000)
      .get();

    return snap.docs.map((doc) => {
      const d = doc.data();
      return {
        agent: (d.agent as string) ?? "unknown",
        timestamp: toISOString(d.timestamp),
      };
    });
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*  Mass update detection                                                      */
/* -------------------------------------------------------------------------- */

async function gatherChangelogData(): Promise<{ timestamp: string; entity: string }[]> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const snap = await db
      .collection("changelog")
      .where("timestamp", ">=", twentyFourHoursAgo)
      .orderBy("timestamp", "desc")
      .limit(500)
      .get();

    return snap.docs.map((doc) => {
      const d = doc.data();
      return {
        timestamp: toISOString(d.timestamp),
        entity: (d.entity as string) ?? (d.entitySlug as string) ?? "unknown",
      };
    });
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*  Auto-resolve old anomalies                                                 */
/* -------------------------------------------------------------------------- */

async function autoResolveOldAnomalies(): Promise<number> {
  const cutoff = new Date(Date.now() - AUTO_RESOLVE_DAYS * 24 * 60 * 60 * 1000);
  let resolved = 0;

  try {
    const snap = await db
      .collection("anomalies")
      .where("resolved", "==", false)
      .where("detectedAt", "<=", cutoff.toISOString())
      .limit(200)
      .get();

    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.update(doc.ref, {
        resolved: true,
        resolvedAt: FieldValue.serverTimestamp(),
        resolvedReason: "auto_expired",
      });
      resolved++;
    }

    if (resolved > 0) {
      await batch.commit();
    }
  } catch {
    // Index may not exist yet — log and continue
    console.warn("[anomaly] Failed to auto-resolve old anomalies (index may be missing)");
  }

  return resolved;
}

/* -------------------------------------------------------------------------- */
/*  Store anomalies                                                            */
/* -------------------------------------------------------------------------- */

async function storeAnomalies(anomalies: Anomaly[]): Promise<number> {
  if (anomalies.length === 0) return 0;

  const batch = db.batch();
  let count = 0;

  for (const anomaly of anomalies) {
    const ref = db.collection("anomalies").doc(anomaly.id);
    batch.set(ref, {
      ...anomaly,
      storedAt: FieldValue.serverTimestamp(),
    });
    count++;

    // Firestore batch limit is 500
    if (count % 450 === 0) {
      await batch.commit();
    }
  }

  await batch.commit();
  return count;
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                       */
/* -------------------------------------------------------------------------- */

export async function run(): Promise<void> {
  console.log("[anomaly] Starting anomaly detection scan...");

  const allAnomalies: Anomaly[] = [];

  // 1. Score anomalies
  try {
    const scoreData = await gatherScoreData();
    const scoreAnomalies = detectScoreAnomalies(scoreData, DEFAULT_ANOMALY_CONFIG);
    allAnomalies.push(...scoreAnomalies);
    console.log(`[anomaly] Score anomalies: ${scoreAnomalies.length} (from ${scoreData.length} entities)`);
  } catch (err) {
    console.error("[anomaly] Score detection failed:", err instanceof Error ? err.message : err);
  }

  // 2. Traffic anomalies
  try {
    const trafficData = await gatherTrafficData();
    const trafficAnomalies = detectTrafficAnomalies(
      trafficData.recentViews,
      trafficData.historicalAvg,
      DEFAULT_ANOMALY_CONFIG,
    );
    allAnomalies.push(...trafficAnomalies);
    console.log(`[anomaly] Traffic anomalies: ${trafficAnomalies.length} (${trafficData.recentViews} recent vs ${trafficData.historicalAvg.toFixed(0)} avg)`);
  } catch (err) {
    console.error("[anomaly] Traffic detection failed:", err instanceof Error ? err.message : err);
  }

  // 3. Stale agent detection
  try {
    const agentLogs = await gatherAgentLogData();
    const staleAnomalies = detectStaleAgents(agentLogs, DEFAULT_ANOMALY_CONFIG);
    allAnomalies.push(...staleAnomalies);
    console.log(`[anomaly] Stale agent anomalies: ${staleAnomalies.length} (from ${agentLogs.length} log entries)`);
  } catch (err) {
    console.error("[anomaly] Stale agent detection failed:", err instanceof Error ? err.message : err);
  }

  // 4. Mass update detection
  try {
    const changelogData = await gatherChangelogData();
    const massUpdateAnomalies = detectMassUpdates(changelogData, DEFAULT_ANOMALY_CONFIG);
    allAnomalies.push(...massUpdateAnomalies);
    console.log(`[anomaly] Mass update anomalies: ${massUpdateAnomalies.length} (from ${changelogData.length} changelog entries)`);
  } catch (err) {
    console.error("[anomaly] Mass update detection failed:", err instanceof Error ? err.message : err);
  }

  // 5. Store detected anomalies
  const stored = await storeAnomalies(allAnomalies);
  console.log(`[anomaly] Stored ${stored} anomalies`);

  // 6. Auto-resolve old anomalies
  const resolved = await autoResolveOldAnomalies();
  console.log(`[anomaly] Auto-resolved ${resolved} old anomalies`);

  // 7. Summary by severity
  const bySeverity = {
    critical: allAnomalies.filter((a) => a.severity === "critical").length,
    high: allAnomalies.filter((a) => a.severity === "high").length,
    medium: allAnomalies.filter((a) => a.severity === "medium").length,
    low: allAnomalies.filter((a) => a.severity === "low").length,
  };

  const byType = allAnomalies.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log(`[anomaly] Summary: ${allAnomalies.length} total — ${bySeverity.critical} critical, ${bySeverity.high} high, ${bySeverity.medium} medium, ${bySeverity.low} low`);

  await logAgentAction(AGENT_NAME, "anomaly_scan_complete", {
    totalDetected: allAnomalies.length,
    stored,
    autoResolved: resolved,
    bySeverity,
    byType,
  }, true);

  console.log("[anomaly] Anomaly detection complete.");
}

/* -------------------------------------------------------------------------- */
/*  CLI entry point                                                            */
/* -------------------------------------------------------------------------- */

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[anomaly] Fatal error:", err);
      process.exit(1);
    });
}
