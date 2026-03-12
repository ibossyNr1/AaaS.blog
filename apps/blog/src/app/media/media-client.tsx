"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, Badge, cn } from "@aaas/ui";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AudioEpisode {
  id: string;
  entityType: string;
  entitySlug: string;
  title: string;
  type: "entity" | "channel" | "weekly";
  duration: number;
  createdAt: string;
  audioUrl: string | null;
}

interface VideoJob {
  id: string;
  entityType: string;
  entitySlug: string;
  title: string;
  status: "pending" | "rendering" | "complete" | "failed";
  createdAt: string;
  completedAt: string | null;
}

interface CoverageItem {
  type: string;
  total: number;
  covered: number;
  percentage: number;
}

interface MediaData {
  stats: {
    totalAudio: number;
    totalByType: { entity: number; channel: number; weekly: number };
    totalDuration: number;
    averageDuration: number;
    pendingVideos: number;
    completedVideos: number;
  };
  coverage: CoverageItem[];
  recentAudio: AudioEpisode[];
  recentVideos: VideoJob[];
  lastUpdated: string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const TYPE_LABELS: Record<string, string> = {
  tools: "Tools",
  models: "Models",
  agents: "Agents",
  skills: "Skills",
  scripts: "Scripts",
  benchmarks: "Benchmarks",
};

const VIDEO_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-400" },
  rendering: { bg: "bg-circuit/10", text: "text-circuit" },
  complete: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  failed: { bg: "bg-red-500/10", text: "text-accent-red" },
};

const AUDIO_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  entity: { bg: "bg-circuit/10", text: "text-circuit" },
  channel: { bg: "bg-purple-500/10", text: "text-purple-400" },
  weekly: { bg: "bg-amber-500/10", text: "text-amber-400" },
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}:${String(s).padStart(2, "0")}`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}:${String(rm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTotalDuration(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

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

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function MediaClient() {
  const [data, setData] = useState<MediaData | null>(null);
  const [error, setError] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/media/stats");
      if (!res.ok) throw new Error("fetch failed");
      const json: MediaData = await res.json();
      setData(json);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* -- Loading skeleton -- */
  if (!data && !error) {
    return (
      <div className="min-h-screen bg-base">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-surface" />
            <div className="h-4 w-96 rounded bg-surface" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-surface" />
              ))}
            </div>
            <div className="h-64 rounded-xl bg-surface" />
            <div className="h-64 rounded-xl bg-surface" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-surface" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -- Error state -- */
  if (error && !data) {
    return (
      <div className="min-h-screen bg-base">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <div className="h-4 w-4 rounded-full bg-red-500" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-text">
            Unable to Load Media Dashboard
          </h1>
          <p className="mb-6 text-text-muted">
            Could not reach the media stats endpoint. Please try again.
          </p>
          <button
            onClick={fetchData}
            className="rounded-lg bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface/80 border border-border"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, coverage, recentAudio, recentVideos } = data;

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-text">
            Media Dashboard
          </h1>
          <p className="text-sm text-text-muted">
            Audio and video production monitoring for the AaaS Knowledge Index
          </p>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">
              Audio Episodes
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-text">
              {stats.totalAudio}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {stats.totalByType.entity} entity / {stats.totalByType.channel} channel / {stats.totalByType.weekly} weekly
            </p>
          </Card>

          <Card className="border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">
              Total Duration
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-text">
              {formatTotalDuration(stats.totalDuration)}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              avg {formatDuration(stats.averageDuration)} per episode
            </p>
          </Card>

          <Card className="border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">
              Pending Videos
            </p>
            <p className={cn(
              "mt-1 font-mono text-2xl font-bold",
              stats.pendingVideos > 0 ? "text-amber-400" : "text-text",
            )}>
              {stats.pendingVideos}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              in queue or rendering
            </p>
          </Card>

          <Card className="border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">
              Completed Videos
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
              {stats.completedVideos}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              fully rendered
            </p>
          </Card>
        </div>

        {/* Recent Audio */}
        <div className="mb-8">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-muted">
            Recent Audio
          </h3>
          {recentAudio.length === 0 ? (
            <Card className="border border-border bg-surface p-6 text-center">
              <p className="text-sm text-text-muted">No audio episodes generated yet.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentAudio.map((ep) => {
                const typeStyle = AUDIO_TYPE_STYLES[ep.type] ?? AUDIO_TYPE_STYLES.entity;
                return (
                  <Card
                    key={ep.id}
                    className="flex items-center gap-4 border border-border bg-surface p-3"
                  >
                    {/* Play button */}
                    <button
                      onClick={() => {
                        if (!ep.audioUrl) return;
                        setPlayingId(playingId === ep.id ? null : ep.id);
                      }}
                      disabled={!ep.audioUrl}
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                        ep.audioUrl
                          ? "bg-circuit/10 text-circuit hover:bg-circuit/20"
                          : "bg-surface text-text-muted cursor-not-allowed",
                      )}
                      aria-label={playingId === ep.id ? "Pause" : "Play"}
                    >
                      {playingId === ep.id ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                          <rect x="2" y="1" width="3.5" height="12" rx="1" />
                          <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                          <path d="M3 1.5v11l9-5.5z" />
                        </svg>
                      )}
                    </button>

                    {/* Title + entity link */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">
                        {ep.title}
                      </p>
                      {ep.entityType && ep.entitySlug && (
                        <Link
                          href={`/${ep.entityType}/${ep.entitySlug}`}
                          className="text-xs text-circuit hover:underline"
                        >
                          {ep.entityType}/{ep.entitySlug}
                        </Link>
                      )}
                    </div>

                    {/* Type badge */}
                    <span
                      className={cn(
                        "hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider sm:inline-block",
                        typeStyle.bg,
                        typeStyle.text,
                      )}
                    >
                      {ep.type}
                    </span>

                    {/* Duration */}
                    <span className="shrink-0 font-mono text-xs text-text-muted">
                      {formatDuration(ep.duration)}
                    </span>

                    {/* Date */}
                    <span className="hidden shrink-0 text-xs text-text-muted sm:inline-block">
                      {shortDate(ep.createdAt)}
                    </span>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Video Queue */}
        <div className="mb-8">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-muted">
            Video Queue
          </h3>
          {recentVideos.length === 0 ? (
            <Card className="border border-border bg-surface p-6 text-center">
              <p className="text-sm text-text-muted">No video jobs in queue.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentVideos.map((job) => {
                const statusStyle = VIDEO_STATUS_STYLES[job.status] ?? VIDEO_STATUS_STYLES.pending;
                return (
                  <Card
                    key={job.id}
                    className="flex items-center gap-4 border border-border bg-surface p-3"
                  >
                    {/* Status indicator */}
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        statusStyle.bg,
                      )}
                    >
                      {job.status === "complete" ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" className={statusStyle.text}>
                          <polyline points="2,7 5.5,10.5 12,3.5" />
                        </svg>
                      ) : job.status === "failed" ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" className={statusStyle.text}>
                          <line x1="3" y1="3" x2="11" y2="11" />
                          <line x1="11" y1="3" x2="3" y2="11" />
                        </svg>
                      ) : job.status === "rendering" ? (
                        <div className={cn("h-3 w-3 rounded-full animate-pulse", "bg-circuit")} />
                      ) : (
                        <div className="h-3 w-3 rounded-full bg-amber-500" />
                      )}
                    </div>

                    {/* Title + entity */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">
                        {job.title}
                      </p>
                      {job.entityType && job.entitySlug && (
                        <Link
                          href={`/${job.entityType}/${job.entitySlug}`}
                          className="text-xs text-circuit hover:underline"
                        >
                          {job.entityType}/{job.entitySlug}
                        </Link>
                      )}
                    </div>

                    {/* Status badge */}
                    <Badge
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                        statusStyle.bg,
                        statusStyle.text,
                      )}
                    >
                      {job.status}
                    </Badge>

                    {/* Date */}
                    <span className="shrink-0 text-xs text-text-muted">
                      {job.completedAt
                        ? `done ${relativeTime(job.completedAt)}`
                        : `created ${relativeTime(job.createdAt)}`}
                    </span>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Coverage */}
        <div className="mb-8">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-muted">
            Audio Coverage by Entity Type
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {coverage.map((item) => (
              <Card key={item.type} className="border border-border bg-surface p-3 text-center">
                <p className="text-xs font-medium text-text-muted">
                  {TYPE_LABELS[item.type] ?? item.type}
                </p>
                <p className={cn(
                  "mt-1 font-mono text-xl font-bold",
                  item.percentage >= 80
                    ? "text-emerald-400"
                    : item.percentage >= 40
                      ? "text-amber-400"
                      : "text-text-muted",
                )}>
                  {item.percentage}%
                </p>
                <div className="mx-auto mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      item.percentage >= 80
                        ? "bg-emerald-500"
                        : item.percentage >= 40
                          ? "bg-amber-500"
                          : "bg-zinc-600",
                    )}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="mt-1.5 font-mono text-[10px] text-text-muted">
                  {item.covered}/{item.total}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-text-muted">
          <p>Auto-refreshes every 60 seconds. Data cached for 2 minutes.</p>
          <p className="mt-1 font-mono">
            Updated {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : "---"}
          </p>
        </div>
      </div>
    </div>
  );
}
