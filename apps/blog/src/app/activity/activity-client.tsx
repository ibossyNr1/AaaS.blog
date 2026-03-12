"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, cn } from "@aaas/ui";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ActivityItem {
  id: string;
  type: "agent_log" | "trending" | "submission";
  timestamp: string;
  title: string;
  detail: string;
  icon: "agent" | "trending_up" | "trending_down" | "submission" | "approved" | "rejected";
  entityType?: string;
  entitySlug?: string;
  success?: boolean;
}

type FilterType = "all" | "agent_log" | "trending" | "submission";

const VALID_ENTITY_TYPES = new Set([
  "tool",
  "model",
  "agent",
  "skill",
  "script",
  "benchmark",
]);

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Agent Logs", value: "agent_log" },
  { label: "Trending", value: "trending" },
  { label: "Submissions", value: "submission" },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function relativeTime(iso: string): string {
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
/*  Icon component                                                             */
/* -------------------------------------------------------------------------- */

function ActivityIcon({ icon }: { icon: ActivityItem["icon"] }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono shrink-0";

  switch (icon) {
    case "agent":
      return (
        <span className={cn(base, "bg-circuit/20 text-circuit")}>
          <span className="w-2.5 h-2.5 rounded-full bg-circuit" />
        </span>
      );
    case "trending_up":
      return (
        <span className={cn(base, "bg-emerald-500/20 text-emerald-400")}>
          ↑
        </span>
      );
    case "trending_down":
      return (
        <span className={cn(base, "bg-red-500/20 text-red-400")}>
          ↓
        </span>
      );
    case "submission":
      return (
        <span className={cn(base, "bg-amber-500/20 text-amber-400")}>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        </span>
      );
    case "approved":
      return (
        <span className={cn(base, "bg-emerald-500/20 text-emerald-400")}>
          ✓
        </span>
      );
    case "rejected":
      return (
        <span className={cn(base, "bg-red-500/20 text-red-400")}>
          ✕
        </span>
      );
    default:
      return (
        <span className={cn(base, "bg-surface text-text-muted")}>
          •
        </span>
      );
  }
}

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function LoadingSkeleton() {
  return (
    <Card className="!p-0 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 px-4 py-4 border-b border-border last:border-0"
        >
          <div className="w-8 h-8 rounded-full bg-surface animate-pulse shrink-0" />
          <div className="flex-grow space-y-2">
            <div className="h-3.5 w-48 bg-surface rounded animate-pulse" />
            <div className="h-2.5 w-32 bg-surface rounded animate-pulse" />
          </div>
          <div className="h-3 w-14 bg-surface rounded animate-pulse shrink-0" />
        </div>
      ))}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function ActivityClient() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/activity");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ActivityItem[] = await res.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 30_000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  const filtered =
    filter === "all" ? items : items.filter((item) => item.type === filter);

  if (loading) return <LoadingSkeleton />;

  if (error && items.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-sm font-mono text-red-500 mb-2">
          Failed to load activity feed
        </p>
        <p className="text-xs text-text-muted">{error}</p>
        <button
          onClick={fetchActivity}
          className="mt-4 text-xs font-mono uppercase tracking-wider text-circuit hover:underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "text-xs font-mono px-3 py-1.5 rounded-full border transition-colors",
              filter === f.value
                ? "border-circuit text-circuit bg-circuit/10"
                : "border-border text-text-muted hover:text-text hover:border-text-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <Card className="!p-0 overflow-hidden">
        {filtered.length > 0 ? (
          filtered.map((item) => {
            const hasLink =
              item.entityType &&
              item.entitySlug &&
              VALID_ENTITY_TYPES.has(item.entityType);

            return (
              <div
                key={item.id}
                className="flex items-start gap-4 px-4 py-4 border-b border-border last:border-0 hover:bg-surface/30 transition-colors"
              >
                <ActivityIcon icon={item.icon} />
                <div className="flex-grow min-w-0">
                  {hasLink ? (
                    <Link
                      href={`/${item.entityType}/${item.entitySlug}`}
                      className="text-sm text-text hover:text-circuit transition-colors font-medium truncate block"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <p className="text-sm text-text font-medium truncate">
                      {item.title}
                    </p>
                  )}
                  <p className="text-xs text-text-muted truncate mt-0.5">
                    {item.detail}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-text-muted whitespace-nowrap shrink-0 pt-0.5">
                  {relativeTime(item.timestamp)}
                </span>
              </div>
            );
          })
        ) : (
          <div className="px-4 py-12 text-center text-text-muted text-sm">
            No activity recorded yet.
          </div>
        )}
      </Card>
    </div>
  );
}
