"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, cn } from "@aaas/ui";
import { AnomalyAlertBanner } from "@/components/anomaly-alert-banner";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AgentSummary {
  name: string;
  lastRunTime: string | null;
  lastStatus: boolean | null;
  runCount: number;
  lastAction: string | null;
}

interface RecentLog {
  timestamp: string | null;
  agent: string;
  action: string;
  success: boolean;
}

interface DashboardStats {
  agents: AgentSummary[];
  entityHealth: {
    totalEntities: number;
    avgCompleteness: number;
    brokenLinksCount: number;
    staleCount: number;
    healingQueuePending: number;
    countByType: Record<string, number>;
  };
  media: {
    totalEpisodes: number;
    formatCounts: Record<string, number>;
    coverage: number;
  };
  recentLogs: RecentLog[];
  timestamp: string;
}

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

function formatTimestamp(iso: string | null): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function StatusDot({ status }: { status: boolean | null }) {
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full shrink-0",
        status === true && "bg-emerald-500",
        status === false && "bg-red-500",
        status === null && "bg-neutral-500",
      )}
    />
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-surface rounded",
        className,
      )}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-10">
      <div>
        <SkeletonBlock className="h-4 w-32 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-28" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonBlock className="h-48" />
        <SkeletonBlock className="h-48" />
      </div>
      <SkeletonBlock className="h-64" />
    </div>
  );
}

function ProgressBar({ value, max = 100, variant = "circuit" }: { value: number; max?: number; variant?: "circuit" | "red" | "amber" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex-grow h-1.5 bg-surface rounded-full overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700",
          variant === "circuit" && "bg-circuit",
          variant === "red" && "bg-red-500",
          variant === "amber" && "bg-amber-500",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function DashboardSystemClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DashboardStats = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (!stats && !error) return <LoadingSkeleton />;

  if (error && !stats) {
    return (
      <Card className="text-center py-12">
        <p className="text-sm font-mono text-red-500 mb-2">
          Failed to load dashboard
        </p>
        <p className="text-xs text-text-muted">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 text-xs font-mono uppercase tracking-wider text-circuit hover:underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-10">
      {/* Urgent anomaly banner */}
      <AnomalyAlertBanner />

      {/* ---- Agent Status ---- */}
      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
          Agent Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.agents.map((agent) => (
            <Card key={agent.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-text font-semibold">
                  {agent.name}
                </span>
                <StatusDot status={agent.lastStatus} />
              </div>
              <p className="text-[10px] font-mono text-text-muted">
                {AGENT_LABELS[agent.name] || agent.name}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted font-mono">
                  {relativeTime(agent.lastRunTime)}
                </span>
                <span className="text-text-muted font-mono">
                  {agent.runCount} runs
                </span>
              </div>
              {agent.lastAction && (
                <p className="text-[10px] font-mono text-text-muted truncate">
                  {agent.lastAction}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* ---- Entity Health + Media Pipeline ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entity Health */}
        <Card>
          <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
            Entity Health
          </h2>
          <div className="space-y-4">
            {/* Total entities */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Total Entities
              </span>
              <span className="text-sm font-mono font-bold text-text">
                {stats.entityHealth.totalEntities}
              </span>
            </div>

            {/* Avg completeness */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                  Avg Completeness
                </span>
                <span className="text-sm font-mono font-bold text-circuit">
                  {stats.entityHealth.avgCompleteness}%
                </span>
              </div>
              <ProgressBar value={stats.entityHealth.avgCompleteness} />
            </div>

            {/* Broken links */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Broken Links
              </span>
              <span
                className={cn(
                  "text-sm font-mono font-bold",
                  stats.entityHealth.brokenLinksCount > 0
                    ? "text-red-500"
                    : "text-text",
                )}
              >
                {stats.entityHealth.brokenLinksCount}
              </span>
            </div>

            {/* Stale entities */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Stale Entities
              </span>
              <span
                className={cn(
                  "text-sm font-mono font-bold",
                  stats.entityHealth.staleCount > 0
                    ? "text-amber-500"
                    : "text-text",
                )}
              >
                {stats.entityHealth.staleCount}
              </span>
            </div>

            {/* Healing queue */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Healing Queue
              </span>
              <span
                className={cn(
                  "text-sm font-mono font-bold",
                  stats.entityHealth.healingQueuePending > 0
                    ? "text-amber-500"
                    : "text-circuit",
                )}
              >
                {stats.entityHealth.healingQueuePending} pending
              </span>
            </div>
          </div>
        </Card>

        {/* Media Pipeline */}
        <Card>
          <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
            Media Pipeline
          </h2>
          <div className="space-y-4">
            {/* Total episodes */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Total Episodes
              </span>
              <span className="text-sm font-mono font-bold text-text">
                {stats.media.totalEpisodes}
              </span>
            </div>

            {/* Narration */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Narration
              </span>
              <span className="text-sm font-mono font-bold text-text">
                {stats.media.formatCounts.narration || 0}
              </span>
            </div>

            {/* Digest */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Digest
              </span>
              <span className="text-sm font-mono font-bold text-text">
                {stats.media.formatCounts.digest || 0}
              </span>
            </div>

            {/* Podcast */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Podcast
              </span>
              <span className="text-sm font-mono font-bold text-text">
                {stats.media.formatCounts.podcast || 0}
              </span>
            </div>

            {/* Coverage */}
            <div className="space-y-1 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                  Coverage
                </span>
                <span className="text-sm font-mono font-bold text-circuit">
                  {stats.media.coverage}%
                </span>
              </div>
              <ProgressBar value={stats.media.coverage} />
            </div>
          </div>
        </Card>
      </div>

      {/* ---- Recent Agent Logs ---- */}
      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
          Recent Agent Logs
        </h2>
        <Card className="overflow-hidden !p-0">
          {/* Table header */}
          <div className="px-4 py-2 flex items-center gap-4 border-b border-border bg-surface/30">
            <span className="w-32 text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Timestamp
            </span>
            <span className="w-28 text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Agent
            </span>
            <span className="flex-grow text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Action
            </span>
            <span className="w-16 text-[10px] font-mono uppercase tracking-wider text-text-muted text-right">
              Status
            </span>
          </div>

          {/* Rows */}
          {stats.recentLogs.length > 0 ? (
            stats.recentLogs.map((log, i) => (
              <div
                key={`${log.agent}-${log.timestamp}-${i}`}
                className="px-4 py-2.5 flex items-center gap-4 border-b border-border last:border-b-0 hover:bg-surface/30 transition-colors"
              >
                <span className="w-32 text-xs font-mono text-text-muted shrink-0">
                  {formatTimestamp(log.timestamp)}
                </span>
                <span className="w-28 text-xs font-mono text-text font-semibold uppercase shrink-0">
                  {log.agent}
                </span>
                <span className="flex-grow text-xs font-mono text-text-muted truncate">
                  {log.action}
                </span>
                <span className="w-16 shrink-0 text-right">
                  <span
                    className={cn(
                      "inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded",
                      log.success
                        ? "text-emerald-400 bg-emerald-500/10"
                        : "text-red-400 bg-red-500/10",
                    )}
                  >
                    {log.success ? "OK" : "FAIL"}
                  </span>
                </span>
              </div>
            ))
          ) : (
            <div className="px-4 py-12 text-center text-text-muted text-sm">
              No agent logs recorded yet.
            </div>
          )}
        </Card>
      </div>

      {/* ---- Last updated ---- */}
      <p className="text-[10px] font-mono text-text-muted text-right">
        Last refreshed: {formatTimestamp(stats.timestamp)} (auto-refresh 60s)
      </p>
    </div>
  );
}
