"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, cn } from "@aaas/ui";
import { AgentStatusDot } from "@/components/agent-status-dot";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AgentStatus {
  name: string;
  label: string;
  lastRun: string | null;
  lastStatus: "success" | "failure" | "unknown";
  runs24h: { success: number; failure: number };
  schedule: "daily" | "weekly";
}

interface StatusData {
  systemHealth: "healthy" | "degraded" | "down";
  healthPercentage: number;
  agents: AgentStatus[];
  entityCounts: Record<string, number>;
  lastUpdated: string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const ENTITY_LABELS: Record<string, string> = {
  tools: "Tools",
  models: "Models",
  agents: "Agents",
  skills: "Skills",
  scripts: "Scripts",
  benchmarks: "Benchmarks",
};

const HEALTH_CONFIG = {
  healthy: {
    color: "bg-emerald-500",
    ring: "ring-emerald-500/20",
    text: "text-emerald-400",
    label: "All Systems Operational",
    bg: "bg-emerald-500/5 border-emerald-500/20",
  },
  degraded: {
    color: "bg-amber-500",
    ring: "ring-amber-500/20",
    text: "text-amber-400",
    label: "Degraded Performance",
    bg: "bg-amber-500/5 border-amber-500/20",
  },
  down: {
    color: "bg-red-500",
    ring: "ring-red-500/20",
    text: "text-red-400",
    label: "System Outage",
    bg: "bg-red-500/5 border-red-500/20",
  },
};

function mapAgentDotStatus(lastStatus: "success" | "failure" | "unknown"): "ok" | "warning" | "error" | "stale" {
  switch (lastStatus) {
    case "success": return "ok";
    case "failure": return "error";
    case "unknown": return "stale";
  }
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function StatusClient() {
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("fetch failed");
      const json: StatusData = await res.json();
      setData(json);
      setError(false);
      setLastFetch(new Date());
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (!data && !error) {
    return (
      <div className="min-h-screen bg-base">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-32 rounded-xl bg-surface" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 rounded-lg bg-surface" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-base">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <div className="h-4 w-4 rounded-full bg-red-500" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-text">
            Unable to Load Status
          </h1>
          <p className="mb-6 text-text-muted">
            Could not reach the status endpoint. Please try again.
          </p>
          <button
            onClick={fetchStatus}
            className="rounded-lg bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface/80 border border-border"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const health = HEALTH_CONFIG[data.systemHealth];
  const totalRuns24h = data.agents.reduce(
    (acc, a) => acc + a.runs24h.success + a.runs24h.failure,
    0,
  );
  const totalFailures24h = data.agents.reduce(
    (acc, a) => acc + a.runs24h.failure,
    0,
  );

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-text">
            System Status
          </h1>
          <p className="text-sm text-text-muted">
            AaaS Knowledge Index platform health and agent monitoring
          </p>
        </div>

        {/* Health Banner */}
        <Card className={cn("mb-8 border p-6", health.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("relative flex h-10 w-10 items-center justify-center")}>
                <div className={cn("h-5 w-5 rounded-full", health.color)} />
                <div
                  className={cn(
                    "absolute inset-0 rounded-full ring-4",
                    health.ring,
                  )}
                />
              </div>
              <div>
                <h2 className={cn("text-xl font-semibold", health.text)}>
                  {health.label}
                </h2>
                <p className="text-sm text-text-muted">
                  {data.healthPercentage}% of agents operational in last 24h
                </p>
              </div>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs text-text-muted">Last checked</p>
              <p className="font-mono text-sm text-text-muted">
                {lastFetch ? relativeTime(lastFetch.toISOString()) : "—"}
              </p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-border/40 pt-5">
            <div>
              <p className="text-xs uppercase tracking-wider text-text-muted">
                Agents
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-text">
                {data.agents.length}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-text-muted">
                Runs (24h)
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-text">
                {totalRuns24h}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-text-muted">
                Failures (24h)
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-text">
                <span className={totalFailures24h > 0 ? "text-red-400" : ""}>
                  {totalFailures24h}
                </span>
              </p>
            </div>
          </div>
        </Card>

        {/* Entity Counts */}
        <div className="mb-8">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-muted">
            Entity Index
          </h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {Object.entries(ENTITY_LABELS).map(([key, label]) => (
              <Card key={key} className="border border-border bg-surface p-3 text-center">
                <p className="font-mono text-xl font-bold text-text">
                  {data.entityCounts[key] ?? 0}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">{label}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Agent Status Grid */}
        <div className="mb-8">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-muted">
            Agent Health
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.agents.map((agent) => {
              const total = agent.runs24h.success + agent.runs24h.failure;
              const successPct =
                total > 0
                  ? Math.round((agent.runs24h.success / total) * 100)
                  : 0;

              return (
                <Card
                  key={agent.name}
                  className="border border-border bg-surface p-4"
                >
                  {/* Top row: name + badges */}
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <AgentStatusDot
                        status={mapAgentDotStatus(agent.lastStatus)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-text">
                          {agent.label}
                        </p>
                        <p className="font-mono text-xs text-text-muted">
                          {agent.name}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                        agent.schedule === "daily"
                          ? "bg-circuit/10 text-circuit"
                          : "bg-purple-500/10 text-purple-400",
                      )}
                    >
                      {agent.schedule}
                    </span>
                  </div>

                  {/* Last run */}
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <span className="text-text-muted">Last run</span>
                    <span
                      className={cn(
                        "font-mono",
                        agent.lastRun ? "text-text" : "text-text-muted",
                      )}
                    >
                      {relativeTime(agent.lastRun)}
                    </span>
                  </div>

                  {/* 24h run bar */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
                      <span>24h runs</span>
                      <span className="font-mono">
                        {agent.runs24h.success}
                        <span className="text-emerald-500">/</span>
                        {agent.runs24h.failure}
                        {agent.runs24h.failure > 0 && (
                          <span className="text-red-400"> fail</span>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      {total > 0 ? (
                        <div className="flex h-full">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${successPct}%` }}
                          />
                          {agent.runs24h.failure > 0 && (
                            <div
                              className="h-full bg-red-500 transition-all"
                              style={{ width: `${100 - successPct}%` }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="h-full w-full bg-zinc-700" />
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-text-muted">
          <p>
            Auto-refreshes every 60 seconds. Data cached for 2 minutes.
          </p>
          <p className="mt-1 font-mono">
            Updated {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
