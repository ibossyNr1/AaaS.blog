"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@aaas/ui";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Anomaly {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detectedAt: string;
}

const DISMISS_KEY = "aaas-anomaly-banner-dismissed";
const POLL_INTERVAL = 60_000;

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function AnomalyAlertBanner() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [dismissed, setDismissed] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const fetchCritical = useCallback(async () => {
    try {
      const [critRes, highRes] = await Promise.all([
        fetch("/api/analytics/anomalies?severity=critical"),
        fetch("/api/analytics/anomalies?severity=high"),
      ]);

      const critical: Anomaly[] = critRes.ok ? await critRes.json() : [];
      const high: Anomaly[] = highRes.ok ? await highRes.json() : [];
      const all = [...critical, ...high];

      setAnomalies(all);

      // If we got new anomalies since last dismiss, show again
      if (all.length > 0) {
        const dismissedTs = sessionStorage.getItem(DISMISS_KEY);
        if (dismissedTs) {
          const hasNewer = all.some(
            (a) => new Date(a.detectedAt).getTime() > Number(dismissedTs),
          );
          setDismissed(!hasNewer);
        } else {
          setDismissed(false);
        }
      } else {
        setDismissed(true);
      }
    } catch {
      // Non-critical — silently fail
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchCritical();
    const interval = setInterval(fetchCritical, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCritical]);

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }

  if (!loaded || dismissed || anomalies.length === 0) return null;

  const criticalCount = anomalies.filter((a) => a.severity === "critical").length;
  const highCount = anomalies.filter((a) => a.severity === "high").length;

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        "bg-gradient-to-r from-red-500/90 via-orange-500/80 to-red-500/90",
        "border-b border-red-500/30",
      )}
      role="alert"
    >
      {/* Pulse overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none" />

      <div className="relative flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Warning icon */}
          <svg
            className="w-5 h-5 text-white shrink-0"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M10 2l8 14H2L10 2z" />
            <path d="M10 8v3M10 13.5v.5" />
          </svg>

          <div className="text-sm text-white font-medium">
            <span className="font-semibold">
              {anomalies.length} anomal{anomalies.length === 1 ? "y" : "ies"} detected
            </span>
            <span className="hidden sm:inline text-white/80 ml-2">
              {criticalCount > 0 && `${criticalCount} critical`}
              {criticalCount > 0 && highCount > 0 && ", "}
              {highCount > 0 && `${highCount} high`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View details link */}
          <a
            href="/dashboard"
            className="text-xs text-white/90 hover:text-white underline underline-offset-2 font-mono transition-colors"
          >
            View details
          </a>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            aria-label="Dismiss alert"
          >
            <svg
              className="w-4 h-4 text-white/80"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
