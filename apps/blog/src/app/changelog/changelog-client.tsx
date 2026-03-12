"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, cn } from "@aaas/ui";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DigestData {
  period: "week" | "month";
  startDate: string;
  endDate: string;
  totalChanges: number;
  entitiesChanged: number;
  changesByType: Record<string, number>;
  changesByField: Record<string, number>;
  topChanged: Array<{
    type: string;
    slug: string;
    name: string;
    changeCount: number;
  }>;
  trendingUp: Array<{ name: string; type: string; slug: string; delta: number }>;
  trendingDown: Array<{ name: string; type: string; slug: string; delta: number }>;
}

type Period = "week" | "month";

const VALID_ENTITY_TYPES = new Set([
  "tool",
  "model",
  "agent",
  "skill",
  "script",
  "benchmark",
]);

/* -------------------------------------------------------------------------- */
/*  Bar chart colors                                                           */
/* -------------------------------------------------------------------------- */

const TYPE_COLORS: Record<string, string> = {
  tool: "bg-circuit",
  model: "bg-purple-500",
  agent: "bg-emerald-500",
  skill: "bg-amber-500",
  script: "bg-sky-500",
  benchmark: "bg-rose-500",
};

const FIELD_COLOR = "bg-circuit/70";

/* -------------------------------------------------------------------------- */
/*  Horizontal bar component                                                   */
/* -------------------------------------------------------------------------- */

function HorizontalBar({
  label,
  value,
  max,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, 2) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-text-muted w-24 truncate text-right shrink-0">
        {label}
      </span>
      <div className="flex-grow h-6 bg-surface rounded overflow-hidden relative">
        <div
          className={cn("h-full rounded transition-all duration-500", colorClass)}
          style={{ width: `${pct}%` }}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-text-muted">
          {value}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="flex flex-col items-center justify-center py-4 px-3 text-center">
      <span className="text-2xl md:text-3xl font-bold text-text tabular-nums">
        {value}
      </span>
      <span className="text-xs font-mono text-text-muted mt-1 uppercase tracking-wider">
        {label}
      </span>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Period toggle skeleton */}
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-surface rounded-full animate-pulse" />
        <div className="h-8 w-28 bg-surface rounded-full animate-pulse" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-48 bg-surface rounded-lg animate-pulse" />
        <div className="h-48 bg-surface rounded-lg animate-pulse" />
      </div>

      {/* Lists skeleton */}
      <div className="h-64 bg-surface rounded-lg animate-pulse" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-48 bg-surface rounded-lg animate-pulse" />
        <div className="h-48 bg-surface rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export function ChangelogClient() {
  const [data, setData] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("week");

  const fetchDigest = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/changelog-digest?period=${p}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DigestData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load digest");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDigest(period);
    const interval = setInterval(() => fetchDigest(period), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [period, fetchDigest]);

  const handlePeriodChange = (p: Period) => {
    if (p === period) return;
    setPeriod(p);
  };

  /* -- Render -------------------------------------------------------------- */

  const uniqueFields = data ? Object.keys(data.changesByField).length : 0;

  // Max values for bar scaling
  const maxByType = data
    ? Math.max(...Object.values(data.changesByType), 1)
    : 1;
  const maxByField = data
    ? Math.max(...Object.values(data.changesByField), 1)
    : 1;
  const maxTopChanged = data?.topChanged.length
    ? Math.max(...data.topChanged.map((e) => e.changeCount), 1)
    : 1;

  // Sort field entries by count descending, take top 10
  const sortedFields = data
    ? Object.entries(data.changesByField)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    : [];

  return (
    <div className="space-y-6">
      {/* Period toggle */}
      <div className="flex gap-2">
        {(["week", "month"] as const).map((p) => (
          <button
            key={p}
            onClick={() => handlePeriodChange(p)}
            className={cn(
              "text-xs font-mono px-4 py-2 rounded-full border transition-colors",
              period === p
                ? "border-circuit text-circuit bg-circuit/10"
                : "border-border text-text-muted hover:text-text hover:border-text-muted",
            )}
          >
            {p === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>

      {loading && <LoadingSkeleton />}

      {!loading && error && !data && (
        <Card className="text-center py-12">
          <p className="text-sm font-mono text-red-500 mb-2">
            Failed to load changelog digest
          </p>
          <p className="text-xs text-text-muted">{error}</p>
          <button
            onClick={() => fetchDigest(period)}
            className="mt-4 text-xs font-mono uppercase tracking-wider text-circuit hover:underline"
          >
            Retry
          </button>
        </Card>
      )}

      {!loading && data && (
        <>
          {/* Date range */}
          <p className="text-xs font-mono text-text-muted">
            {new Date(data.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            &mdash;{" "}
            {new Date(data.endDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Changes" value={data.totalChanges} />
            <StatCard label="Entities Changed" value={data.entitiesChanged} />
            <StatCard label="Fields Modified" value={uniqueFields} />
          </div>

          {/* Bar charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Changes by entity type */}
            <Card>
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">
                Changes by Entity Type
              </h2>
              {Object.keys(data.changesByType).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(data.changesByType)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count]) => (
                      <HorizontalBar
                        key={type}
                        label={type}
                        value={count}
                        max={maxByType}
                        colorClass={TYPE_COLORS[type] ?? "bg-zinc-500"}
                      />
                    ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-6">
                  No changes recorded
                </p>
              )}
            </Card>

            {/* Changes by field */}
            <Card>
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">
                Changes by Field
              </h2>
              {sortedFields.length > 0 ? (
                <div className="space-y-2">
                  {sortedFields.map(([field, count]) => (
                    <HorizontalBar
                      key={field}
                      label={field}
                      value={count}
                      max={maxByField}
                      colorClass={FIELD_COLOR}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-6">
                  No field-level changes
                </p>
              )}
            </Card>
          </div>

          {/* Top changed entities */}
          <Card>
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">
              Most Changed Entities
            </h2>
            {data.topChanged.length > 0 ? (
              <div className="space-y-2">
                {data.topChanged.map((entity, idx) => {
                  const hasLink = VALID_ENTITY_TYPES.has(entity.type);
                  return (
                    <div key={`${entity.type}-${entity.slug}`} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-text-muted w-6 text-right shrink-0">
                        {idx + 1}.
                      </span>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {hasLink ? (
                            <Link
                              href={`/${entity.type}/${entity.slug}`}
                              className="text-sm text-text hover:text-circuit transition-colors font-medium truncate"
                            >
                              {entity.name}
                            </Link>
                          ) : (
                            <span className="text-sm text-text font-medium truncate">
                              {entity.name}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-text-muted border border-border rounded px-1.5 py-0.5 shrink-0">
                            {entity.type}
                          </span>
                        </div>
                        <div className="h-4 bg-surface rounded overflow-hidden relative">
                          <div
                            className={cn(
                              "h-full rounded transition-all duration-500",
                              TYPE_COLORS[entity.type] ?? "bg-zinc-500",
                            )}
                            style={{
                              width: `${Math.max((entity.changeCount / maxTopChanged) * 100, 2)}%`,
                            }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-text-muted">
                            {entity.changeCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-text-muted text-center py-6">
                No entity changes recorded
              </p>
            )}
          </Card>

          {/* Trending movers */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Trending up */}
            <Card>
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
                <span className="text-emerald-500">&#9650;</span> Trending Up
              </h2>
              {data.trendingUp.length > 0 ? (
                <div className="space-y-3">
                  {data.trendingUp.map((item) => {
                    const hasLink = VALID_ENTITY_TYPES.has(item.type);
                    return (
                      <div
                        key={`${item.type}-${item.slug}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs shrink-0">
                            &#8593;
                          </span>
                          {hasLink ? (
                            <Link
                              href={`/${item.type}/${item.slug}`}
                              className="text-sm text-text hover:text-circuit transition-colors truncate"
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <span className="text-sm text-text truncate">
                              {item.name}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-text-muted border border-border rounded px-1.5 py-0.5 shrink-0">
                            {item.type}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 shrink-0">
                          +{Math.abs(item.delta).toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-6">
                  No upward trends this {period === "week" ? "week" : "month"}
                </p>
              )}
            </Card>

            {/* Trending down */}
            <Card>
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
                <span className="text-red-500">&#9660;</span> Trending Down
              </h2>
              {data.trendingDown.length > 0 ? (
                <div className="space-y-3">
                  {data.trendingDown.map((item) => {
                    const hasLink = VALID_ENTITY_TYPES.has(item.type);
                    return (
                      <div
                        key={`${item.type}-${item.slug}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs shrink-0">
                            &#8595;
                          </span>
                          {hasLink ? (
                            <Link
                              href={`/${item.type}/${item.slug}`}
                              className="text-sm text-text hover:text-circuit transition-colors truncate"
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <span className="text-sm text-text truncate">
                              {item.name}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-text-muted border border-border rounded px-1.5 py-0.5 shrink-0">
                            {item.type}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-red-400 shrink-0">
                          -{Math.abs(item.delta).toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-6">
                  No downward trends this {period === "week" ? "week" : "month"}
                </p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
