"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@aaas/ui";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Anomaly {
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

interface AnomalyFeedProps {
  compact?: boolean;
  className?: string;
  maxItems?: number;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const POLL_INTERVAL = 60_000;

const SEVERITY_COLORS: Record<Anomaly["severity"], string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low: "text-circuit bg-circuit/10 border-circuit/20",
};

const SEVERITY_BADGE: Record<Anomaly["severity"], string> = {
  critical: "bg-red-500/20 text-red-400 border border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  low: "bg-circuit/20 text-circuit border border-circuit/30",
};

function typeIcon(type: Anomaly["type"]) {
  switch (type) {
    case "score_spike":
      return (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 12l4-6 3 4 5-8" />
          <path d="M12 2l2 0 0 2" />
        </svg>
      );
    case "score_drop":
      return (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4l4 6 3-4 5 8" />
          <path d="M12 14l2 0 0-2" />
        </svg>
      );
    case "traffic_surge":
      return (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 14V4M4 7l4-4 4 4" />
        </svg>
      );
    case "traffic_drop":
      return (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 2v10M4 9l4 4 4-4" />
        </svg>
      );
    case "stale_agent":
      return (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 5v4l2.5 1.5" />
        </svg>
      );
    case "mass_update":
      return (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="5" height="5" rx="1" />
          <rect x="9" y="2" width="5" height="5" rx="1" />
          <rect x="2" y="9" width="5" height="5" rx="1" />
          <rect x="9" y="9" width="5" height="5" rx="1" />
        </svg>
      );
    case "submission_flood":
      return (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 2v4M8 10v4M2 8h4M10 8h4" />
          <circle cx="8" cy="8" r="1.5" />
        </svg>
      );
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function AnomalyFeed({ compact = false, className, maxItems = 20 }: AnomalyFeedProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnomalies = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/anomalies");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Anomaly[] = await res.json();
      setAnomalies(data.slice(0, maxItems));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load anomalies");
    } finally {
      setLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAnomalies]);

  if (loading) {
    return (
      <div className={cn("rounded-lg border border-border bg-base/60 backdrop-blur-sm p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-circuit animate-pulse" />
          <span className="text-xs font-mono font-semibold text-text uppercase tracking-wider">
            Anomaly Feed
          </span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded bg-surface/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-lg border border-border bg-base/60 backdrop-blur-sm p-4", className)}>
        <p className="text-xs text-text-muted">Failed to load anomalies</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-base/60 backdrop-blur-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-circuit animate-pulse" />
          <span className="text-xs font-mono font-semibold text-text uppercase tracking-wider">
            Anomaly Feed
          </span>
        </div>
        {anomalies.length > 0 && (
          <span className="text-[10px] font-mono text-text-muted">
            {anomalies.length} active
          </span>
        )}
      </div>

      {/* Empty state */}
      {anomalies.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <svg className="w-8 h-8 mx-auto mb-2 text-circuit/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          <p className="text-xs text-text-muted">No anomalies detected</p>
          <p className="text-[10px] text-text-muted/60 mt-1">All systems nominal</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className={cn(
                "flex gap-2.5 items-start px-4 transition-colors hover:bg-surface/30",
                compact ? "py-2" : "py-3",
              )}
            >
              {/* Icon */}
              <div className={cn("mt-0.5", SEVERITY_COLORS[anomaly.severity].split(" ")[0])}>
                {typeIcon(anomaly.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "leading-snug",
                  compact ? "text-[11px]" : "text-xs",
                  "text-text",
                )}>
                  {anomaly.description}
                </p>

                <div className="flex items-center gap-2 mt-1">
                  {/* Severity badge */}
                  <span className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase",
                    SEVERITY_BADGE[anomaly.severity],
                  )}>
                    {anomaly.severity}
                  </span>

                  {/* Entity link */}
                  {anomaly.entity && (
                    <a
                      href={`/${anomaly.entity}`}
                      className="text-[10px] font-mono text-circuit hover:underline truncate"
                    >
                      {anomaly.entity}
                    </a>
                  )}

                  {/* Timestamp */}
                  <span className="text-[10px] font-mono text-text-muted/60 ml-auto shrink-0">
                    {relativeTime(anomaly.detectedAt)}
                  </span>
                </div>

                {/* Expected range — only in non-compact mode */}
                {!compact && (
                  <p className="text-[10px] text-text-muted/50 mt-0.5 font-mono">
                    expected: [{anomaly.expectedRange[0]}, {anomaly.expectedRange[1]}] — actual: {anomaly.value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
