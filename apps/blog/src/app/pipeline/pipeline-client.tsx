"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Badge, cn } from "@aaas/ui";
import { AgentStatusDot } from "@/components/agent-status-dot";
import { FreshnessIndicator } from "@/components/freshness-indicator";
import type {
  PipelineHealth,
  AgentStatus,
  DataFreshness,
  AgentExecution,
} from "@/lib/pipeline";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const REFRESH_INTERVAL = 30_000;

const AGENT_LABELS: Record<string, string> = {
  audit: "Schema Auditor",
  heal: "Schema Healer",
  enrich: "Enrichment Agent",
  freshness: "Freshness Agent",
  changelog: "Changelog Agent",
  rank: "Ranking Agent",
  categorize: "Categorization Agent",
  "validate-links": "Link Validator",
  media: "Media Agent",
  ingest: "Ingestion Agent",
  "auto-review": "Auto Review Agent",
  webhook: "Webhook Delivery",
  "digest-email": "Digest Email Agent",
  views: "Views Agent",
  trending: "Trending Agent",
  runner: "Agent Runner",
};

const HEALTH_BANNER: Record<
  PipelineHealth["overallStatus"],
  { bg: string; border: string; text: string; label: string }
> = {
  healthy: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    label: "All Systems Operational",
  },
  degraded: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    label: "Degraded Performance",
  },
  down: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    label: "Pipeline Down",
  },
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "scheduled";
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-surface rounded", className)} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <SkeletonBlock className="h-16" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-32" />
        ))}
      </div>
      <SkeletonBlock className="h-48" />
      <SkeletonBlock className="h-64" />
    </div>
  );
}

function SuccessRateBar({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-grow h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            rate >= 90 && "bg-emerald-500",
            rate >= 70 && rate < 90 && "bg-amber-500",
            rate < 70 && "bg-red-500",
          )}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-text-muted w-8 text-right">
        {rate}%
      </span>
    </div>
  );
}

/* -- Health Banner --------------------------------------------------------- */

function HealthBanner({ status }: { status: PipelineHealth["overallStatus"] }) {
  const cfg = HEALTH_BANNER[status];
  return (
    <div
      className={cn(
        "rounded-lg border px-6 py-4 flex items-center gap-4",
        cfg.bg,
        cfg.border,
      )}
    >
      <span
        className={cn(
          "inline-block w-3 h-3 rounded-full",
          status === "healthy" && "bg-emerald-500",
          status === "degraded" && "bg-amber-500 animate-pulse",
          status === "down" && "bg-red-500 animate-pulse",
        )}
      />
      <div>
        <p className={cn("text-sm font-mono font-bold uppercase tracking-wider", cfg.text)}>
          {cfg.label}
        </p>
        <p className="text-xs font-mono text-text-muted mt-0.5">
          Pipeline status — auto-refresh every 30s
        </p>
      </div>
    </div>
  );
}

/* -- Agent Card ------------------------------------------------------------ */

function AgentCard({ agent }: { agent: AgentStatus }) {
  return (
    <Card variant="glass" className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-text font-semibold">
          {agent.name}
        </span>
        <AgentStatusDot status={agent.status} />
      </div>
      <p className="text-[10px] font-mono text-text-muted">
        {AGENT_LABELS[agent.name] || agent.name}
      </p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted font-mono">
          {relativeTime(agent.lastRun)}
        </span>
        <span className="text-text-muted font-mono">
          {formatDuration(agent.avgDuration)} avg
        </span>
      </div>
      <SuccessRateBar rate={agent.successRate7d} />
      {agent.consecutiveFailures > 0 && (
        <p className="text-[10px] font-mono text-red-400">
          {agent.consecutiveFailures} consecutive failure
          {agent.consecutiveFailures !== 1 ? "s" : ""}
        </p>
      )}
    </Card>
  );
}

/* -- Freshness Table ------------------------------------------------------- */

function FreshnessTable({ data }: { data: DataFreshness[] }) {
  return (
    <Card className="overflow-hidden !p-0">
      <div className="px-4 py-2 flex items-center gap-4 border-b border-border bg-surface/30">
        <span className="w-36 text-[10px] font-mono uppercase tracking-wider text-text-muted">
          Collection
        </span>
        <span className="flex-grow text-[10px] font-mono uppercase tracking-wider text-text-muted">
          Last Updated
        </span>
        <span className="w-20 text-[10px] font-mono uppercase tracking-wider text-text-muted text-right">
          Age
        </span>
        <span className="w-20 text-[10px] font-mono uppercase tracking-wider text-text-muted text-right">
          Status
        </span>
      </div>
      {data.map((row) => (
        <div
          key={row.collection}
          className="px-4 py-2.5 flex items-center gap-4 border-b border-border last:border-b-0 hover:bg-surface/30 transition-colors"
        >
          <span className="w-36 text-xs font-mono text-text font-semibold shrink-0">
            {row.collection}
          </span>
          <span className="flex-grow text-xs font-mono text-text-muted">
            {relativeTime(row.lastUpdated)}
          </span>
          <span className="w-20 text-xs font-mono text-text-muted text-right">
            {row.ageHours}h
          </span>
          <span className="w-20 text-right">
            <FreshnessIndicator
              ageHours={row.ageHours}
              collection={row.collection}
            />
          </span>
        </div>
      ))}
    </Card>
  );
}

/* -- Dependency Graph (CSS DAG) ------------------------------------------- */

interface GraphData {
  nodes: string[];
  edges: [string, string][];
}

function DependencyGraph({ graph }: { graph: GraphData }) {
  // Compute topological layers for layout
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();
  for (const n of graph.nodes) {
    inDegree.set(n, 0);
    outEdges.set(n, []);
  }
  for (const [from, to] of graph.edges) {
    inDegree.set(to, (inDegree.get(to) || 0) + 1);
    outEdges.get(from)?.push(to);
  }

  // BFS topological sort into layers
  const layers: string[][] = [];
  const assigned = new Set<string>();
  let queue = graph.nodes.filter((n) => (inDegree.get(n) || 0) === 0);

  while (queue.length > 0) {
    layers.push([...queue]);
    queue.forEach((n) => assigned.add(n));
    const next: string[] = [];
    for (const n of queue) {
      for (const neighbor of outEdges.get(n) || []) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
        if ((inDegree.get(neighbor) || 0) <= 0 && !assigned.has(neighbor)) {
          next.push(neighbor);
          assigned.add(neighbor);
        }
      }
    }
    queue = next;
  }

  // Any remaining nodes (cycles) go in a final layer
  const remaining = graph.nodes.filter((n) => !assigned.has(n));
  if (remaining.length > 0) layers.push(remaining);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-start gap-3 min-w-[600px] py-4">
        {layers.map((layer, li) => (
          <div key={li} className="flex flex-col items-center gap-2 flex-shrink-0">
            {/* Layer label */}
            <span className="text-[9px] font-mono uppercase tracking-wider text-text-muted mb-1">
              L{li}
            </span>
            {layer.map((node) => (
              <div
                key={node}
                className="relative flex items-center"
              >
                {/* Node */}
                <div className="px-3 py-1.5 rounded border border-border bg-surface text-[10px] font-mono text-text whitespace-nowrap">
                  {node}
                </div>
                {/* Arrow to next layer */}
                {li < layers.length - 1 &&
                  (outEdges.get(node) || []).length > 0 && (
                    <span className="text-text-muted ml-2 text-xs select-none">
                      &rarr;
                    </span>
                  )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -- Execution Timeline (Gantt) ------------------------------------------- */

function ExecutionTimeline({ executions }: { executions: AgentExecution[] }) {
  if (executions.length === 0) {
    return (
      <div className="text-center text-text-muted text-sm py-8 font-mono">
        No recent executions recorded.
      </div>
    );
  }

  // Find time bounds
  const times = executions.map((e) => new Date(e.startedAt).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(
    ...executions.map(
      (e) => new Date(e.startedAt).getTime() + Math.max(e.durationMs, 500),
    ),
  );
  const totalSpan = Math.max(maxTime - minTime, 1);

  // Group by agent
  const grouped = new Map<string, AgentExecution[]>();
  for (const e of executions) {
    const arr = grouped.get(e.agent) || [];
    arr.push(e);
    grouped.set(e.agent, arr);
  }

  return (
    <div className="space-y-1 overflow-x-auto">
      {Array.from(grouped.entries()).map(([agent, runs]) => (
        <div key={agent} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-[10px] font-mono text-text-muted text-right truncate">
            {agent}
          </span>
          <div className="flex-grow relative h-5 bg-surface/30 rounded overflow-hidden">
            {runs.map((run, i) => {
              const left =
                ((new Date(run.startedAt).getTime() - minTime) / totalSpan) *
                100;
              const width = Math.max(
                (Math.max(run.durationMs, 200) / totalSpan) * 100,
                0.5,
              );
              return (
                <div
                  key={`${run.startedAt}-${i}`}
                  className={cn(
                    "absolute top-0.5 bottom-0.5 rounded-sm transition-all",
                    run.success
                      ? "bg-emerald-500/70 hover:bg-emerald-500"
                      : "bg-red-500/70 hover:bg-red-500",
                  )}
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    minWidth: "3px",
                  }}
                  title={`${run.agent}: ${formatDuration(run.durationMs)} — ${run.success ? "OK" : "FAIL"}${run.error ? ` — ${run.error}` : ""}`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function PipelineClient() {
  const [health, setHealth] = useState<PipelineHealth | null>(null);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [healthRes, ...agentResults] = await Promise.all([
        fetch("/api/pipeline/health"),
        // Fetch recent history for timeline from a few key agents
        ...["ingest", "audit", "heal", "enrich", "rank", "media", "freshness"].map(
          (a) => fetch(`/api/pipeline/agent/${a}?days=3`).catch(() => null),
        ),
      ]);

      if (!healthRes.ok) throw new Error(`HTTP ${healthRes.status}`);
      const healthData: PipelineHealth = await healthRes.json();
      setHealth(healthData);

      // Collect all executions for timeline
      const allExecs: AgentExecution[] = [];
      for (const res of agentResults) {
        if (res && res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data)) allExecs.push(...json.data);
        }
      }
      // Sort by startedAt desc, limit to 50
      allExecs.sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      );
      setExecutions(allExecs.slice(0, 50));

      // Build graph from pipeline lib (hardcoded edges — fetched from health response indirectly)
      // We'll use a simple GET to provide the graph; for now inline it
      setGraph({
        nodes: healthData.agentStatuses.map((a) => a.name),
        edges: [
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
        ],
      });

      setError(null);
      setLastRefresh(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipeline data");
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  /* -- Loading / Error states ---------------------------------------------- */

  if (!health && !error) return <LoadingSkeleton />;

  if (error && !health) {
    return (
      <Card className="text-center py-12">
        <p className="text-sm font-mono text-red-500 mb-2">
          Failed to load pipeline data
        </p>
        <p className="text-xs text-text-muted">{error}</p>
        <button
          onClick={fetchAll}
          className="mt-4 text-xs font-mono uppercase tracking-wider text-circuit hover:underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!health) return null;

  /* -- Render -------------------------------------------------------------- */

  return (
    <div className="space-y-10">
      {/* Overall Health Banner */}
      <HealthBanner status={health.overallStatus} />

      {/* Run info */}
      <div className="flex flex-wrap gap-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block mb-1">
            Last Full Run
          </span>
          <span className="text-sm font-mono text-text">
            {relativeTime(health.lastFullRun)}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block mb-1">
            Next Scheduled
          </span>
          <span className="text-sm font-mono text-text">
            {relativeTime(health.nextScheduledRun)}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block mb-1">
            Agents
          </span>
          <span className="text-sm font-mono text-text">
            {health.agentStatuses.length}
          </span>
        </div>
      </div>

      {/* Agent Grid */}
      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
          Agent Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {health.agentStatuses.map((agent) => (
            <AgentCard key={agent.name} agent={agent} />
          ))}
        </div>
      </div>

      {/* Data Freshness */}
      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
          Data Freshness
        </h2>
        <FreshnessTable data={health.dataFreshness} />
      </div>

      {/* Agent Dependency Graph */}
      {graph && (
        <div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
            Agent Dependency Graph
          </h2>
          <Card variant="glass" className="overflow-hidden">
            <DependencyGraph graph={graph} />
          </Card>
        </div>
      )}

      {/* Execution Timeline */}
      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
          Execution Timeline
          <Badge variant="circuit" className="ml-2">
            3d
          </Badge>
        </h2>
        <Card variant="glass">
          <ExecutionTimeline executions={executions} />
        </Card>
      </div>

      {/* Last refreshed */}
      <p className="text-[10px] font-mono text-text-muted text-right">
        Last refreshed:{" "}
        {lastRefresh
          ? new Date(lastRefresh).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : "--"}{" "}
        (auto-refresh 30s)
      </p>
    </div>
  );
}
