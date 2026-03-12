"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Badge, cn } from "@aaas/ui";
import { MetricCard } from "@/components/metric-card";
import { AnalyticsSparkline } from "@/components/analytics-sparkline";
import type { AnalyticsSnapshot, EntityDelta } from "@/lib/analytics";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AgentMetric {
  agent: string;
  lastRun: string;
  successRate: number;
  avgDuration: number;
}

type Period = "24h" | "7d" | "30d";

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-surface rounded", className)} />;
}

/* -------------------------------------------------------------------------- */
/*  Period Selector                                                            */
/* -------------------------------------------------------------------------- */

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const options: Period[] = ["24h", "7d", "30d"];
  return (
    <div className="inline-flex rounded-lg border border-border overflow-hidden">
      {options.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "px-4 py-2 text-sm font-mono transition-colors",
            value === p
              ? "bg-circuit/20 text-circuit border-circuit"
              : "text-text-muted hover:text-text hover:bg-surface",
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Type Distribution Bar                                                      */
/* -------------------------------------------------------------------------- */

const TYPE_COLORS: Record<string, string> = {
  tool: "bg-blue-500",
  model: "bg-purple-500",
  agent: "bg-circuit",
  skill: "bg-green-500",
  script: "bg-yellow-500",
  benchmark: "bg-red-500",
};

function TypeDistribution({
  breakdown,
  total,
}: {
  breakdown: Record<string, number>;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="text-sm text-text-muted text-center py-8">
        No entity data available
      </div>
    );
  }

  const entries = Object.entries(breakdown).sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="h-8 rounded-lg overflow-hidden flex">
        {entries.map(([type, count]) => {
          const pct = (count / total) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={type}
              className={cn("h-full transition-all", TYPE_COLORS[type] || "bg-gray-500")}
              style={{ width: `${pct}%` }}
              title={`${type}: ${count} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {entries.map(([type, count]) => (
          <div key={type} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "w-3 h-3 rounded-sm",
                TYPE_COLORS[type] || "bg-gray-500",
              )}
            />
            <span className="text-text capitalize">{type}</span>
            <span className="text-text-muted font-mono">
              {count} ({((count / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Entity Growth Chart (CSS bars)                                             */
/* -------------------------------------------------------------------------- */

function GrowthChart({
  growers,
  decliners,
}: {
  growers: EntityDelta[];
  decliners: EntityDelta[];
}) {
  const items = [
    ...growers.map((g) => ({ ...g, direction: "up" as const })),
    ...decliners.map((d) => ({ ...d, direction: "down" as const })),
  ];

  if (items.length === 0) {
    return (
      <div className="text-sm text-text-muted text-center py-8">
        No score changes in this period
      </div>
    );
  }

  const maxDelta = Math.max(...items.map((i) => Math.abs(i.scoreDelta)), 1);

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const pct = (Math.abs(item.scoreDelta) / maxDelta) * 100;
        const isUp = item.direction === "up";
        return (
          <div key={`${item.type}-${item.slug}`} className="flex items-center gap-3">
            <div className="w-32 truncate text-sm text-text" title={item.name}>
              {item.name}
            </div>
            <Badge variant="circuit" className="text-[10px] shrink-0">
              {item.type}
            </Badge>
            <div className="flex-1 h-5 bg-surface rounded overflow-hidden">
              <div
                className={cn(
                  "h-full rounded transition-all",
                  isUp ? "bg-green-500/70" : "bg-red-500/70",
                )}
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <span
              className={cn(
                "text-sm font-mono w-16 text-right",
                isUp ? "text-green-500" : "text-red-500",
              )}
            >
              {isUp ? "+" : ""}
              {item.scoreDelta.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Search Trends                                                              */
/* -------------------------------------------------------------------------- */

function SearchTrends({ searches }: { searches: string[] }) {
  if (searches.length === 0) {
    return (
      <div className="text-sm text-text-muted text-center py-8">
        No search data in this period
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {searches.map((q, i) => (
        <div
          key={q}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface/50 transition-colors"
        >
          <span className="text-xs font-mono text-text-muted w-6 text-right">
            {i + 1}.
          </span>
          <span className="text-sm text-text flex-1 truncate">{q}</span>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Agent Performance Table                                                    */
/* -------------------------------------------------------------------------- */

function AgentTable({ agents }: { agents: AgentMetric[] }) {
  if (agents.length === 0) {
    return (
      <div className="text-sm text-text-muted text-center py-8">
        No agent data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-3 text-xs font-mono uppercase tracking-wider text-text-muted">
              Agent
            </th>
            <th className="text-right py-3 px-3 text-xs font-mono uppercase tracking-wider text-text-muted">
              Success Rate
            </th>
            <th className="text-right py-3 px-3 text-xs font-mono uppercase tracking-wider text-text-muted">
              Avg Duration
            </th>
            <th className="text-right py-3 px-3 text-xs font-mono uppercase tracking-wider text-text-muted">
              Last Run
            </th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr
              key={a.agent}
              className="border-b border-border/50 hover:bg-surface/30 transition-colors"
            >
              <td className="py-3 px-3 font-medium text-text">{a.agent}</td>
              <td className="py-3 px-3 text-right font-mono">
                <span
                  className={cn(
                    a.successRate >= 90
                      ? "text-green-500"
                      : a.successRate >= 70
                        ? "text-yellow-500"
                        : "text-red-500",
                  )}
                >
                  {a.successRate}%
                </span>
              </td>
              <td className="py-3 px-3 text-right font-mono text-text-muted">
                {a.avgDuration > 0 ? `${(a.avgDuration / 1000).toFixed(1)}s` : "--"}
              </td>
              <td className="py-3 px-3 text-right text-text-muted">
                {a.lastRun === "never"
                  ? "never"
                  : new Date(a.lastRun).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Dashboard Client                                                      */
/* -------------------------------------------------------------------------- */

export function AnalyticsClient() {
  const [period, setPeriod] = useState<Period>("7d");
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [agents, setAgents] = useState<AgentMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [snapRes, agentRes] = await Promise.all([
        fetch(`/api/analytics/snapshot?period=${period}`),
        fetch("/api/analytics/agents"),
      ]);

      if (snapRes.ok) {
        const data = await snapRes.json();
        setSnapshot(data);
      }
      if (agentRes.ok) {
        const data = await agentRes.json();
        setAgents(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Generate mock sparkline data from entity count for visual effect
  const sparklineData = snapshot
    ? Array.from({ length: 12 }, (_, i) =>
        Math.max(0, snapshot.entityCount - 12 + i + Math.round(Math.random() * 4 - 2)),
      )
    : [];

  return (
    <div className="space-y-8">
      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PeriodSelector value={period} onChange={setPeriod} />
        <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="accent-[var(--color-circuit)]"
          />
          Auto-refresh (30s)
        </label>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : snapshot ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total Entities"
            value={snapshot.entityCount}
            delta={snapshot.newEntities > 0 ? (snapshot.newEntities / Math.max(snapshot.entityCount - snapshot.newEntities, 1)) * 100 : undefined}
            deltaLabel={snapshot.newEntities > 0 ? `${snapshot.newEntities} new` : undefined}
            icon={
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x={3} y={3} width={7} height={7} rx={1} />
                <rect x={14} y={3} width={7} height={7} rx={1} />
                <rect x={3} y={14} width={7} height={7} rx={1} />
                <rect x={14} y={14} width={7} height={7} rx={1} />
              </svg>
            }
          />
          <MetricCard
            title="Avg Score"
            value={snapshot.avgCompositeScore.toFixed(1)}
            icon={
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            }
          />
          <MetricCard
            title="Search Volume"
            value={snapshot.searchVolume}
            icon={
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx={11} cy={11} r={8} />
                <path d="m21 21-4.3-4.3" />
              </svg>
            }
          />
          <MetricCard
            title="Active Users"
            value={snapshot.activeUsers}
            icon={
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx={9} cy={7} r={4} />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <MetricCard
            title="Agent Success"
            value={`${snapshot.agentSuccessRate}%`}
            icon={
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="M22 4 12 14.01l-3-3" />
              </svg>
            }
          />
        </div>
      ) : null}

      {/* Entity growth + Type distribution row */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : snapshot ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-text">Entity Growth</h2>
              <AnalyticsSparkline data={sparklineData} width={80} height={24} />
            </div>
            <GrowthChart
              growers={snapshot.topGrowers}
              decliners={snapshot.topDecliners}
            />
          </Card>

          <Card variant="glass" className="p-6">
            <h2 className="text-lg font-semibold text-text mb-5">
              Type Distribution
            </h2>
            <TypeDistribution
              breakdown={snapshot.typeBreakdown}
              total={snapshot.entityCount}
            />
          </Card>
        </div>
      ) : null}

      {/* Search trends + Agent performance row */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="glass" className="p-6">
            <h2 className="text-lg font-semibold text-text mb-5">
              Top Searches
            </h2>
            <SearchTrends searches={snapshot?.topSearches ?? []} />
          </Card>

          <Card variant="glass" className="p-6">
            <h2 className="text-lg font-semibold text-text mb-5">
              Agent Performance
            </h2>
            <AgentTable agents={agents} />
          </Card>
        </div>
      )}
    </div>
  );
}
