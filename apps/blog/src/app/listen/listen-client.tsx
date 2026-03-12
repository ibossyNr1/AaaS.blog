"use client";

import { useRef, useState } from "react";
import { Card, Badge, cn } from "@aaas/ui";
import type { Episode, AudioFormat } from "@/lib/media-types";
import { AUDIO_FORMATS } from "@/lib/media-types";

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

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type FilterTab = "all" | AudioFormat;

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "narration", label: "Narrations" },
  { key: "digest", label: "Digests" },
  { key: "podcast", label: "Podcasts" },
];

const FORMAT_LABELS: Record<AudioFormat, string> = {
  narration: "Narration",
  digest: "Digest",
  podcast: "Podcast",
};

/* -------------------------------------------------------------------------- */
/*  Episode Card                                                              */
/* -------------------------------------------------------------------------- */

function EpisodeCard({
  episode,
  isPlaying,
  onToggle,
}: {
  episode: Episode;
  isPlaying: boolean;
  onToggle: () => void;
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
        <button
          onClick={onToggle}
          className={cn(
            "shrink-0 w-9 h-9 rounded-full border flex items-center justify-center transition-colors",
            isPlaying
              ? "border-circuit bg-circuit/10 text-circuit"
              : "border-border text-text-muted hover:border-circuit hover:text-circuit",
          )}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="currentColor"
            >
              <rect x="2" y="1" width="4" height="12" rx="1" />
              <rect x="8" y="1" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="currentColor"
            >
              <polygon points="3,1 13,7 3,13" />
            </svg>
          )}
        </button>
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
/*  Audio Player Bar                                                          */
/* -------------------------------------------------------------------------- */

function PlayerBar({
  episode,
  audioRef,
  isPlaying,
  onToggle,
  onClose,
}: {
  episode: Episode;
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Play/Pause */}
        <button
          onClick={onToggle}
          className="shrink-0 w-10 h-10 rounded-full border border-circuit bg-circuit/10 text-circuit flex items-center justify-center"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 14 14"
              fill="currentColor"
            >
              <rect x="2" y="1" width="4" height="12" rx="1" />
              <rect x="8" y="1" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 14 14"
              fill="currentColor"
            >
              <polygon points="3,1 13,7 3,13" />
            </svg>
          )}
        </button>

        {/* Episode info */}
        <div className="flex-grow min-w-0">
          <p className="text-sm font-semibold text-text truncate">
            {episode.title}
          </p>
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            {FORMAT_LABELS[episode.format]} &middot;{" "}
            {formatDuration(episode.duration)}
          </p>
        </div>

        {/* Native audio controls */}
        <audio
          ref={audioRef}
          src={episode.audioUrl}
          controls
          className="hidden sm:block flex-shrink-0 h-8 max-w-xs"
        />

        {/* Close */}
        <button
          onClick={onClose}
          className="shrink-0 text-text-muted hover:text-text transition-colors text-lg leading-none"
          aria-label="Close player"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Client Component                                                     */
/* -------------------------------------------------------------------------- */

export function ListenClient({ episodes }: { episodes: Episode[] }) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null) as React.RefObject<HTMLAudioElement>;

  /* -- No episodes: show coming-soon state -- */
  if (episodes.length === 0) {
    return <ComingSoon />;
  }

  /* -- Filtering -- */
  const filtered =
    activeTab === "all"
      ? episodes
      : episodes.filter((e) => e.format === activeTab);

  const currentEpisode = episodes.find((e) => e.id === currentId) ?? null;

  /* -- Playback controls -- */
  function toggleEpisode(episode: Episode) {
    if (currentId === episode.id) {
      // Toggle play/pause on same episode
      if (playing) {
        audioRef.current?.pause();
        setPlaying(false);
      } else {
        audioRef.current?.play();
        setPlaying(true);
      }
    } else {
      // Switch to new episode
      setCurrentId(episode.id);
      setPlaying(true);
      // Audio element will re-render with new src; play after mount
      setTimeout(() => {
        audioRef.current?.play();
      }, 0);
    }
  }

  function togglePlayer() {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      audioRef.current?.play();
      setPlaying(true);
    }
  }

  function closePlayer() {
    audioRef.current?.pause();
    setCurrentId(null);
    setPlaying(false);
  }

  return (
    <div className="space-y-8">
      {/* ---- Format Filter Tabs ---- */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "px-3 py-1.5 text-xs font-mono uppercase tracking-wider border rounded transition-colors",
              activeTab === key
                ? "text-circuit border-circuit bg-circuit/10"
                : "text-text-muted border-border hover:border-circuit/30",
            )}
          >
            {label}
            <span className="ml-1.5 opacity-60">
              {key === "all"
                ? episodes.length
                : episodes.filter((e) => e.format === key).length}
            </span>
          </button>
        ))}
      </div>

      {/* ---- Episode Grid ---- */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((episode) => (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              isPlaying={currentId === episode.id && playing}
              onToggle={() => toggleEpisode(episode)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-text-muted text-sm">
          No episodes found for this format.
        </div>
      )}

      {/* ---- Sticky Player Bar ---- */}
      {currentEpisode && (
        <PlayerBar
          episode={currentEpisode}
          audioRef={audioRef}
          isPlaying={playing}
          onToggle={togglePlayer}
          onClose={closePlayer}
        />
      )}

      {/* Bottom padding when player is visible */}
      {currentEpisode && <div className="h-20" />}
    </div>
  );
}
