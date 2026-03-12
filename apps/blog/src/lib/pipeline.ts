import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "./firebase";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface AgentExecution {
  agent: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  success: boolean;
  error?: string;
  entitiesProcessed: number;
  actionsPerformed: number;
}

export interface AgentStatus {
  name: string;
  status: "ok" | "warning" | "error" | "stale";
  lastRun: string;
  avgDuration: number;
  successRate7d: number;
  consecutiveFailures: number;
}

export interface DataFreshness {
  collection: string;
  lastUpdated: string;
  ageHours: number;
  status: "fresh" | "aging" | "stale";
}

export interface PipelineHealth {
  overallStatus: "healthy" | "degraded" | "down";
  agentStatuses: AgentStatus[];
  lastFullRun: string;
  nextScheduledRun: string;
  dataFreshness: DataFreshness[];
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const MONITORED_COLLECTIONS = [
  "tools",
  "models",
  "agents",
  "skills",
  "scripts",
  "benchmarks",
  "episodes",
  "healing_queue",
];

const AGENT_NAMES = [
  "audit",
  "heal",
  "enrich",
  "freshness",
  "changelog",
  "rank",
  "categorize",
  "validate-links",
  "media",
  "ingest",
  "auto-review",
  "webhook",
  "digest-email",
  "views",
  "trending",
  "runner",
];

/** Agent dependency DAG — edges are [dependency, dependent] */
const AGENT_EDGES: [string, string][] = [
  ["ingest", "audit"],
  ["audit", "heal"],
  ["heal", "enrich"],
  ["enrich", "rank"],
  ["enrich", "categorize"],
  ["rank", "trending"],
  ["ingest", "validate-links"],
  ["ingest", "freshness"],
  ["freshness", "changelog"],
  ["enrich", "media"],
  ["media", "digest-email"],
  ["rank", "webhook"],
  ["ingest", "views"],
  ["views", "trending"],
  ["audit", "auto-review"],
];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const RUN_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h scheduled interval

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

interface AgentLogDoc {
  agent: string;
  action: string;
  success: boolean;
  timestamp: { toDate?: () => Date; seconds?: number } | null;
  durationMs?: number;
  entitiesProcessed?: number;
  actionsPerformed?: number;
  error?: string;
}

function toISOString(
  ts: { toDate?: () => Date; seconds?: number } | null | undefined,
): string {
  if (!ts) return new Date(0).toISOString();
  if (typeof ts.toDate === "function") return ts.toDate().toISOString();
  if (typeof ts.seconds === "number")
    return new Date(ts.seconds * 1000).toISOString();
  return new Date(0).toISOString();
}

function toMs(
  ts: { toDate?: () => Date; seconds?: number } | null | undefined,
): number {
  if (!ts) return 0;
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  return 0;
}

function deriveAgentStatus(
  logs: AgentLogDoc[],
  now: number,
): Omit<AgentStatus, "name"> {
  if (logs.length === 0) {
    return {
      status: "stale",
      lastRun: new Date(0).toISOString(),
      avgDuration: 0,
      successRate7d: 0,
      consecutiveFailures: 0,
    };
  }

  const lastRun = toISOString(logs[0].timestamp);
  const lastRunMs = toMs(logs[0].timestamp);

  // Success rate over 7 days
  const recentLogs = logs.filter(
    (l) => now - toMs(l.timestamp) < SEVEN_DAYS_MS,
  );
  const successRate7d =
    recentLogs.length > 0
      ? Math.round(
          (recentLogs.filter((l) => l.success).length / recentLogs.length) *
            100,
        )
      : 0;

  // Average duration
  const durations = logs
    .filter((l) => typeof l.durationMs === "number")
    .map((l) => l.durationMs!);
  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  // Consecutive failures
  let consecutiveFailures = 0;
  for (const log of logs) {
    if (!log.success) consecutiveFailures++;
    else break;
  }

  // Determine status
  let status: AgentStatus["status"] = "ok";
  if (consecutiveFailures >= 3) {
    status = "error";
  } else if (consecutiveFailures >= 1 || successRate7d < 80) {
    status = "warning";
  } else if (now - lastRunMs > TWENTY_FOUR_HOURS_MS) {
    status = "stale";
  }

  return {
    status,
    lastRun,
    avgDuration,
    successRate7d,
    consecutiveFailures,
  };
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Aggregate pipeline health from agent_logs and collection metadata.
 */
export async function getPipelineHealth(): Promise<PipelineHealth> {
  const now = Date.now();

  // Fetch recent agent logs (last 200)
  let allLogs: AgentLogDoc[] = [];
  try {
    const logsQ = query(
      collection(db, "agent_logs"),
      orderBy("timestamp", "desc"),
      firestoreLimit(200),
    );
    const snap = await getDocs(logsQ);
    allLogs = snap.docs.map((d) => d.data() as AgentLogDoc);
  } catch (err) {
    console.error("[pipeline] Failed to fetch agent_logs:", err);
  }

  // Group by agent
  const grouped = new Map<string, AgentLogDoc[]>();
  for (const log of allLogs) {
    const arr = grouped.get(log.agent) || [];
    arr.push(log);
    grouped.set(log.agent, arr);
  }

  // Build agent statuses
  const agentStatuses: AgentStatus[] = AGENT_NAMES.map((name) => {
    const logs = grouped.get(name) || [];
    return { name, ...deriveAgentStatus(logs, now) };
  });

  // Overall status
  const errorCount = agentStatuses.filter((a) => a.status === "error").length;
  const warningCount = agentStatuses.filter(
    (a) => a.status === "warning",
  ).length;
  let overallStatus: PipelineHealth["overallStatus"] = "healthy";
  if (errorCount >= 3) overallStatus = "down";
  else if (errorCount >= 1 || warningCount >= 3) overallStatus = "degraded";

  // Last full run — most recent timestamp from runner agent
  const runnerLogs = grouped.get("runner") || [];
  const lastFullRun =
    runnerLogs.length > 0
      ? toISOString(runnerLogs[0].timestamp)
      : new Date(0).toISOString();

  // Next scheduled run — lastFullRun + interval
  const lastFullRunMs =
    runnerLogs.length > 0 ? toMs(runnerLogs[0].timestamp) : 0;
  const nextScheduledRun = new Date(
    Math.max(lastFullRunMs + RUN_INTERVAL_MS, now),
  ).toISOString();

  // Data freshness
  const dataFreshness = await getDataFreshness();

  return {
    overallStatus,
    agentStatuses,
    lastFullRun,
    nextScheduledRun,
    dataFreshness,
  };
}

/**
 * Get execution history for a specific agent.
 */
export async function getAgentExecutionHistory(
  agent: string,
  days: number = 7,
): Promise<AgentExecution[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const logsQ = query(
      collection(db, "agent_logs"),
      where("agent", "==", agent),
      orderBy("timestamp", "desc"),
      firestoreLimit(100),
    );
    const snap = await getDocs(logsQ);
    return snap.docs
      .map((d) => {
        const data = d.data() as AgentLogDoc;
        const startedAt = toISOString(data.timestamp);
        const durationMs =
          typeof data.durationMs === "number" ? data.durationMs : 0;
        return {
          agent: data.agent,
          startedAt,
          completedAt: new Date(
            new Date(startedAt).getTime() + durationMs,
          ).toISOString(),
          durationMs,
          success: data.success,
          error: data.error,
          entitiesProcessed:
            typeof data.entitiesProcessed === "number"
              ? data.entitiesProcessed
              : 0,
          actionsPerformed:
            typeof data.actionsPerformed === "number"
              ? data.actionsPerformed
              : 0,
        };
      })
      .filter((e) => new Date(e.startedAt) >= cutoff);
  } catch (err) {
    console.error(`[pipeline] Failed to fetch history for ${agent}:`, err);
    return [];
  }
}

/**
 * Check data freshness across all monitored collections.
 */
export async function getDataFreshness(): Promise<DataFreshness[]> {
  const now = Date.now();
  const results: DataFreshness[] = [];

  for (const col of MONITORED_COLLECTIONS) {
    try {
      // Get most recently updated doc
      const q = query(
        collection(db, col),
        orderBy("updatedAt", "desc"),
        firestoreLimit(1),
      );
      const snap = await getDocs(q);

      let lastUpdated: string;
      let ageMs: number;

      if (snap.empty) {
        lastUpdated = new Date(0).toISOString();
        ageMs = now;
      } else {
        const data = snap.docs[0].data();
        const updatedAt =
          data.updatedAt || data.lastVerified || data.timestamp;
        lastUpdated = toISOString(updatedAt);
        ageMs = now - new Date(lastUpdated).getTime();
      }

      const ageHours = Math.round(ageMs / (60 * 60 * 1000));

      let status: DataFreshness["status"] = "fresh";
      if (ageMs > TWENTY_FOUR_HOURS_MS) status = "stale";
      else if (ageMs > SIX_HOURS_MS) status = "aging";

      results.push({ collection: col, lastUpdated, ageHours, status });
    } catch (err) {
      console.error(`[pipeline] Failed to check freshness for ${col}:`, err);
      results.push({
        collection: col,
        lastUpdated: new Date(0).toISOString(),
        ageHours: Math.round(now / (60 * 60 * 1000)),
        status: "stale",
      });
    }
  }

  return results;
}

/**
 * Returns the agent dependency DAG as nodes and edges.
 */
export function getAgentDependencyGraph(): {
  nodes: string[];
  edges: [string, string][];
} {
  return {
    nodes: [...AGENT_NAMES],
    edges: [...AGENT_EDGES],
  };
}
