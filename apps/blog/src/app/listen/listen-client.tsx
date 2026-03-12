"use client";

import { useMemo, useState } from "react";
import { Card, Badge, cn } from "@aaas/ui";
import type { Episode, AudioFormat } from "@/lib/media-types";
import { AUDIO_FORMATS } from "@/lib/media-types";
import { useAudioQueue, type AudioTrack } from "@/components/audio-queue";
import { PodcastSubscribe } from "@/components/podcast-subscribe";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function episodeToTrack(ep: Episode): AudioTrack {
  return {
    id: ep.id,
    title: ep.title,
    subtitle: `${FORMAT_LABELS[ep.format]} · ${formatDuration(ep.duration)}`,
    src: ep.audioUrl,
    duration: ep.duration,
  };
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

type ContentTab = "narrations" | "digests" | "trends";
type SortKey = "newest" | "popular";

const CONTENT_TABS: { key: ContentTab; label: string; format: AudioFormat | null }[] = [
  { key: "narrations", label: "Entity Narrations", format: "narration" },
  { key: "digests", label: "Channel Digests", format: "digest" },
  { key: "trends", label: "Weekly Trends", format: "podcast" },
];

const FORMAT_LABELS: Record<AudioFormat, string> = {
  narration: "Narration",
  digest: "Digest",
  podcast: "Podcast",
};

const ENTITY_TYPES = [
  { key: "all", label: "All Types" },
  { key: "tool", label: "Tools" },
  { key: "model", label: "Models" },
  { key: "agent", label: "Agents" },
  { key: "skill", label: "Skills" },
  { key: "script", label: "Scripts" },
  { key: "benchmark", label: "Benchmarks" },
];

/* -------------------------------------------------------------------------- */
/*  Episode Card                                                              */
/* -------------------------------------------------------------------------- */

function EpisodeCard({
  episode,
  isPlaying,
  onPlay,
  onQueue,
}: {
  episode: Episode;
  isPlaying: boolean;
  onPlay: () => void;
  onQueue: () => void;
}) {
  return (
    <Card className="group flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="circuit">{FORMAT_LABELS[episode.format]}</Badge>
          <span className="text-xs font-mono text-text-muted">
            {formatDuration(episode.duration)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Play button */}
          <button
            onClick={onPlay}
            className={cn(
              "shrink-0 w-9 h-9 rounded-full border flex items-center justify-center transition-colors",
              isPlaying
                ? "border-circuit bg-circuit/10 text-circuit"
                : "border-border text-text-muted hover:border-circuit hover:text-circuit",
            )}
            aria-label={isPlaying ? "Now playing" : "Play"}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="2" y="1" width="4" height="12" rx="1" />
                <rect x="8" y="1" width="4" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <polygon points="3,1 13,7 3,13" />
              </svg>
            )}
          </button>
          {/* Queue button */}
          <button
            onClick={onQueue}
            className="shrink-0 w-9 h-9 rounded-full border border-border text-text-muted hover:border-circuit/30 hover:text-circuit flex items-center justify-center transition-colors"
            aria-label="Add to queue"
            title="Add to queue"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <h3
        className={cn(
          "text-sm font-semibold mb-1 transition-colors",
          isPlaying ? "text-circuit" : "text-text group-hover:text-circuit",
        )}
      >
        {isPlaying && (
          <span className="inline-block w-2 h-2 rounded-full bg-circuit mr-2 animate-pulse" />
        )}
        {episode.title}
      </h3>

      <p className="text-xs text-text-muted mb-3 line-clamp-2">
        {episode.description}
      </p>

      <div className="mt-auto flex items-center justify-between">
        <span className="text-[10px] font-mono text-text-muted">
          {formatDate(episode.publishedAt)}
        </span>
        <span className="text-[10px] font-mono text-text-muted">
          {episode.playCount.toLocaleString()} plays
        </span>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Coming Soon State                                                         */
/* -------------------------------------------------------------------------- */

function ComingSoon() {
  const formats = Object.entries(AUDIO_FORMATS) as [
    AudioFormat,
    (typeof AUDIO_FORMATS)[AudioFormat],
  ][];

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-2">
          Coming Soon
        </p>
        <h2 className="text-xl font-semibold text-text mb-2">
          Three audio formats, one ecosystem
        </h2>
        <p className="text-sm text-text-muted max-w-lg mx-auto">
          The Audio Hub will deliver AI ecosystem intelligence in three formats
          — from quick entity overviews to in-depth weekly discussions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {formats.map(([key, fmt]) => (
          <Card key={key} className="text-center">
            <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-3">
              {fmt.label}
            </p>
            <p className="text-sm text-text-muted">{fmt.description}</p>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <a
          href="https://agents-as-a-service.com/vault"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-circuit hover:underline font-mono"
        >
          Subscribe via Vault to get notified &rarr;
        </a>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Client Component                                                     */
/* -------------------------------------------------------------------------- */

export function ListenClient({ episodes }: { episodes: Episode[] }) {
  const [activeTab, setActiveTab] = useState<ContentTab>("narrations");
  const [entityFilter, setEntityFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const audioQueue = useAudioQueue();

  /* -- Derive unique channels from episodes -- */
  const channels = useMemo(() => {
    const set = new Set<string>();
    episodes.forEach((e) => {
      if (e.channel) set.add(e.channel);
    });
    return Array.from(set).sort();
  }, [episodes]);

  /* -- Tab config -- */
  const currentTabConfig = CONTENT_TABS.find((t) => t.key === activeTab)!;

  /* -- Filtering -- */
  const filtered = useMemo(() => {
    let list = episodes;

    // Filter by format (tab)
    if (currentTabConfig.format) {
      list = list.filter((e) => e.format === currentTabConfig.format);
    }

    // Filter by entity type (narrations only)
    if (activeTab === "narrations" && entityFilter !== "all") {
      list = list.filter((e) => e.sourceType === entityFilter);
    }

    // Filter by channel (digests only)
    if (activeTab === "digests" && channelFilter !== "all") {
      list = list.filter((e) => e.channel === channelFilter);
    }

    // Sort
    if (sortBy === "newest") {
      list = [...list].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
    } else {
      list = [...list].sort((a, b) => b.playCount - a.playCount);
    }

    return list;
  }, [episodes, currentTabConfig.format, activeTab, entityFilter, channelFilter, sortBy]);

  /* -- No episodes: show coming-soon state -- */
  if (episodes.length === 0) {
    return <ComingSoon />;
  }

  /* -- Playback -- */
  function handlePlay(episode: Episode) {
    audioQueue.playNow(episodeToTrack(episode));
    // Fire-and-forget play count
    fetch(`/api/episodes/${episode.id}/play`, { method: "POST" }).catch(() => {});
  }

  function handleQueue(episode: Episode) {
    audioQueue.addToQueue(episodeToTrack(episode));
  }

  return (
    <div className="space-y-6">
      {/* ---- Subscribe Widget ---- */}
      <PodcastSubscribe className="mb-2" />

      {/* ---- Content Tabs ---- */}
      <div className="flex flex-wrap gap-2 border-b border-border/30 pb-3">
        {CONTENT_TABS.map(({ key, label }) => {
          const count = episodes.filter(
            (e) =>
              CONTENT_TABS.find((t) => t.key === key)!.format === null ||
              e.format === CONTENT_TABS.find((t) => t.key === key)!.format,
          ).length;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                setEntityFilter("all");
                setChannelFilter("all");
              }}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-[13px]",
                activeTab === key
                  ? "text-circuit border-circuit"
                  : "text-text-muted border-transparent hover:text-text hover:border-border/50",
              )}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ---- Filters + Sort Row ---- */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Entity type filter (narrations) */}
        {activeTab === "narrations" && (
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono border border-border rounded bg-surface text-text-muted focus:border-circuit focus:outline-none"
          >
            {ENTITY_TYPES.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        )}

        {/* Channel filter (digests) */}
        {activeTab === "digests" && channels.length > 0 && (
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono border border-border rounded bg-surface text-text-muted focus:border-circuit focus:outline-none"
          >
            <option value="all">All Channels</option>
            {channels.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        )}

        {/* Sort */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Sort:
          </span>
          <button
            onClick={() => setSortBy("newest")}
            className={cn(
              "px-2 py-1 text-[10px] font-mono uppercase tracking-wider border rounded transition-colors",
              sortBy === "newest"
                ? "text-circuit border-circuit bg-circuit/10"
                : "text-text-muted border-border hover:border-circuit/30",
            )}
          >
            Newest
          </button>
          <button
            onClick={() => setSortBy("popular")}
            className={cn(
              "px-2 py-1 text-[10px] font-mono uppercase tracking-wider border rounded transition-colors",
              sortBy === "popular"
                ? "text-circuit border-circuit bg-circuit/10"
                : "text-text-muted border-border hover:border-circuit/30",
            )}
          >
            Popular
          </button>
        </div>
      </div>

      {/* ---- Episode Grid ---- */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((episode) => (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              isPlaying={audioQueue.currentTrack?.id === episode.id && audioQueue.playing}
              onPlay={() => handlePlay(episode)}
              onQueue={() => handleQueue(episode)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-text-muted text-sm">
          No episodes found matching your filters.
        </div>
      )}

      {/* Bottom padding when global player is visible */}
      {audioQueue.currentTrack && <div className="h-20" />}
    </div>
  );
}
