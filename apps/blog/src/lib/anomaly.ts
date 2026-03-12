/**
 * Anomaly Detection Algorithms
 *
 * Pure detection functions for identifying anomalies in entity scores,
 * traffic patterns, agent activity, and update frequency. Used by the
 * anomaly-agent and exposed via the anomalies API.
 */

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface Anomaly {
  id: string;
  type:
    | "score_spike"
    | "score_drop"
    | "traffic_surge"
    | "traffic_drop"
    | "stale_agent"
    | "mass_update"
    | "submission_flood";
  severity: "low" | "medium" | "high" | "critical";
  entity?: string;
  description: string;
  value: number;
  expectedRange: [number, number];
  detectedAt: string;
  resolved: boolean;
}

export interface AnomalyConfig {
  /** Percentage change in score that triggers an anomaly (default 20) */
  scoreThresholdPct: number;
  /** Percentage deviation from average traffic that triggers an anomaly (default 50) */
  trafficThresholdPct: number;
  /** Hours of inactivity before an agent is considered stale (default 48) */
  staleAgentHours: number;
  /** Number of entity updates in a 1-hour window that triggers mass_update (default 20) */
  massUpdateThreshold: number;
  /** Submissions per hour that triggers submission_flood (default 15) */
  submissionFloodPerHour: number;
}

export const DEFAULT_ANOMALY_CONFIG: AnomalyConfig = {
  scoreThresholdPct: 20,
  trafficThresholdPct: 50,
  staleAgentHours: 48,
  massUpdateThreshold: 20,
  submissionFloodPerHour: 15,
};

/* -------------------------------------------------------------------------- */
/*  Statistical helpers                                                        */
/* -------------------------------------------------------------------------- */

/** Compute the z-score of a value given mean and standard deviation. */
export function computeZScore(
  value: number,
  mean: number,
  stdDev: number,
): number {
  if (stdDev === 0) return value === mean ? 0 : Infinity;
  return (value - mean) / stdDev;
}

/** Return true when the absolute z-score exceeds the threshold (default 2). */
export function isAnomaly(zScore: number, threshold = 2): boolean {
  return Math.abs(zScore) > threshold;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function makeId(): string {
  return `anom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function severityFromPct(pct: number): Anomaly["severity"] {
  const abs = Math.abs(pct);
  if (abs >= 80) return "critical";
  if (abs >= 50) return "high";
  if (abs >= 30) return "medium";
  return "low";
}

/* -------------------------------------------------------------------------- */
/*  Detection functions                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Flag entities whose score changed more than `scoreThresholdPct` compared
 * to their previous score.
 */
export function detectScoreAnomalies(
  entities: {
    slug: string;
    type: string;
    name: string;
    score: number;
    prevScore: number;
  }[],
  config: AnomalyConfig = DEFAULT_ANOMALY_CONFIG,
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const now = new Date().toISOString();

  for (const e of entities) {
    if (e.prevScore === 0) continue; // skip entities without history
    const pctChange = ((e.score - e.prevScore) / e.prevScore) * 100;

    if (Math.abs(pctChange) >= config.scoreThresholdPct) {
      const direction = pctChange > 0 ? "spike" : "drop";
      const low = e.prevScore * (1 - config.scoreThresholdPct / 100);
      const high = e.prevScore * (1 + config.scoreThresholdPct / 100);

      anomalies.push({
        id: makeId(),
        type: direction === "spike" ? "score_spike" : "score_drop",
        severity: severityFromPct(pctChange),
        entity: `${e.type}/${e.slug}`,
        description: `${e.name} score ${direction}: ${e.prevScore.toFixed(1)} -> ${e.score.toFixed(1)} (${pctChange > 0 ? "+" : ""}${pctChange.toFixed(1)}%)`,
        value: e.score,
        expectedRange: [
          Math.round(low * 10) / 10,
          Math.round(high * 10) / 10,
        ],
        detectedAt: now,
        resolved: false,
      });
    }
  }

  return anomalies;
}

/**
 * Compare recent view count against a historical average and flag deviations
 * that exceed the traffic threshold percentage.
 */
export function detectTrafficAnomalies(
  recentViews: number,
  historicalAvg: number,
  config: AnomalyConfig = DEFAULT_ANOMALY_CONFIG,
): Anomaly[] {
  if (historicalAvg === 0) return [];

  const pctChange = ((recentViews - historicalAvg) / historicalAvg) * 100;
  if (Math.abs(pctChange) < config.trafficThresholdPct) return [];

  const direction = pctChange > 0 ? "surge" : "drop";
  const low = historicalAvg * (1 - config.trafficThresholdPct / 100);
  const high = historicalAvg * (1 + config.trafficThresholdPct / 100);

  return [
    {
      id: makeId(),
      type: direction === "surge" ? "traffic_surge" : "traffic_drop",
      severity: severityFromPct(pctChange),
      description: `Traffic ${direction}: ${recentViews} views vs ${historicalAvg.toFixed(0)} avg (${pctChange > 0 ? "+" : ""}${pctChange.toFixed(1)}%)`,
      value: recentViews,
      expectedRange: [Math.round(low), Math.round(high)],
      detectedAt: new Date().toISOString(),
      resolved: false,
    },
  ];
}

/**
 * Identify agents that haven't logged any activity within the staleness
 * threshold window.
 */
export function detectStaleAgents(
  agentLogs: { agent: string; timestamp: string }[],
  config: AnomalyConfig = DEFAULT_ANOMALY_CONFIG,
): Anomaly[] {
  const now = Date.now();
  const thresholdMs = config.staleAgentHours * 60 * 60 * 1000;

  // Find the most recent log per agent
  const latestByAgent = new Map<string, number>();
  for (const log of agentLogs) {
    const ts = new Date(log.timestamp).getTime();
    const existing = latestByAgent.get(log.agent);
    if (!existing || ts > existing) {
      latestByAgent.set(log.agent, ts);
    }
  }

  const anomalies: Anomaly[] = [];
  for (const [agent, lastTs] of latestByAgent) {
    const silentMs = now - lastTs;
    if (silentMs > thresholdMs) {
      const silentHours = Math.round(silentMs / (60 * 60 * 1000));
      anomalies.push({
        id: makeId(),
        type: "stale_agent",
        severity:
          silentHours >= config.staleAgentHours * 4
            ? "high"
            : silentHours >= config.staleAgentHours * 2
              ? "medium"
              : "low",
        entity: agent,
        description: `Agent "${agent}" last ran ${silentHours}h ago (threshold: ${config.staleAgentHours}h)`,
        value: silentHours,
        expectedRange: [0, config.staleAgentHours],
        detectedAt: new Date().toISOString(),
        resolved: false,
      });
    }
  }

  return anomalies;
}

/**
 * Detect unusually high numbers of entity updates within 1-hour windows.
 */
export function detectMassUpdates(
  changelog: { timestamp: string; entity: string }[],
  config: AnomalyConfig = DEFAULT_ANOMALY_CONFIG,
): Anomaly[] {
  if (changelog.length === 0) return [];

  // Bucket updates into 1-hour windows
  const buckets = new Map<number, { count: number; entities: Set<string> }>();
  for (const entry of changelog) {
    const ts = new Date(entry.timestamp).getTime();
    const hourBucket = Math.floor(ts / (60 * 60 * 1000));
    const existing = buckets.get(hourBucket);
    if (existing) {
      existing.count++;
      existing.entities.add(entry.entity);
    } else {
      buckets.set(hourBucket, { count: 1, entities: new Set([entry.entity]) });
    }
  }

  const anomalies: Anomaly[] = [];
  for (const [hourBucket, data] of buckets) {
    if (data.count >= config.massUpdateThreshold) {
      const bucketTime = new Date(hourBucket * 60 * 60 * 1000).toISOString();
      anomalies.push({
        id: makeId(),
        type: "mass_update",
        severity:
          data.count >= config.massUpdateThreshold * 3
            ? "critical"
            : data.count >= config.massUpdateThreshold * 2
              ? "high"
              : "medium",
        description: `${data.count} entity updates in 1h window at ${bucketTime} (${data.entities.size} unique entities, threshold: ${config.massUpdateThreshold})`,
        value: data.count,
        expectedRange: [0, config.massUpdateThreshold],
        detectedAt: new Date().toISOString(),
        resolved: false,
      });
    }
  }

  return anomalies;
}
