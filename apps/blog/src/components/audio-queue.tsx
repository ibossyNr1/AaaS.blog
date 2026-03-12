"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@aaas/ui";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface AudioTrack {
  id: string;
  title: string;
  subtitle?: string;
  src: string;
  duration: number;
}

interface AudioQueueContextValue {
  currentTrack: AudioTrack | null;
  queue: AudioTrack[];
  playing: boolean;
  addToQueue: (track: AudioTrack) => void;
  playNow: (track: AudioTrack) => void;
  playNext: () => void;
  clearQueue: () => void;
  removeFromQueue: (id: string) => void;
  togglePlay: () => void;
  closePlayer: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                   */
/* -------------------------------------------------------------------------- */

const AudioQueueContext = createContext<AudioQueueContextValue | null>(null);

export function useAudioQueue(): AudioQueueContextValue {
  const ctx = useContext(AudioQueueContext);
  if (!ctx) throw new Error("useAudioQueue must be used within AudioQueueProvider");
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/*  Persistent Player Bar                                                     */
/* -------------------------------------------------------------------------- */

function GlobalPlayerBar({
  track,
  playing,
  currentTime,
  duration,
  onToggle,
  onNext,
  onClose,
  queueLength,
  showQueue,
  onToggleQueue,
  queue,
  onRemove,
}: {
  track: AudioTrack;
  playing: boolean;
  currentTime: number;
  duration: number;
  onToggle: () => void;
  onNext: () => void;
  onClose: () => void;
  queueLength: number;
  showQueue: boolean;
  onToggleQueue: () => void;
  queue: AudioTrack[];
  onRemove: (id: string) => void;
}) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Queue panel */}
      {showQueue && queue.length > 0 && (
        <div className="border-t border-border bg-surface/95 backdrop-blur-sm max-h-60 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
              Up Next ({queue.length})
            </h4>
            <ul className="space-y-1.5">
              {queue.map((t, i) => (
                <li key={`${t.id}-${i}`} className="flex items-center gap-3 text-sm">
                  <span className="text-[10px] font-mono text-text-muted w-4 text-right">
                    {i + 1}
                  </span>
                  <span className="text-text truncate flex-grow">{t.title}</span>
                  <span className="text-[10px] font-mono text-text-muted shrink-0">
                    {fmtTime(t.duration)}
                  </span>
                  <button
                    onClick={() => onRemove(t.id)}
                    className="text-text-muted hover:text-red-400 transition-colors text-xs shrink-0"
                    aria-label={`Remove ${t.title} from queue`}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Player bar */}
      <div className="border-t border-border bg-surface/95 backdrop-blur-sm">
        {/* Thin progress line */}
        <div className="h-0.5 bg-border/20">
          <div
            className="h-full bg-circuit transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={onToggle}
            className={cn(
              "shrink-0 w-9 h-9 rounded-full border flex items-center justify-center transition-colors",
              "border-circuit bg-circuit/10 text-circuit",
            )}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
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

          {/* Next */}
          {queueLength > 0 && (
            <button
              onClick={onNext}
              className="shrink-0 text-text-muted hover:text-circuit transition-colors"
              aria-label="Next track"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20 5 4" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>
          )}

          {/* Track info */}
          <div className="flex-grow min-w-0">
            <p className="text-sm font-semibold text-text truncate">
              {playing && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-circuit mr-1.5 animate-pulse" />
              )}
              {track.title}
            </p>
            {track.subtitle && (
              <p className="text-[10px] font-mono text-text-muted truncate">
                {track.subtitle}
              </p>
            )}
          </div>

          {/* Time */}
          <span className="shrink-0 text-[10px] font-mono text-text-muted tabular-nums hidden sm:block">
            {fmtTime(currentTime)} / {fmtTime(duration)}
          </span>

          {/* Queue toggle */}
          {queueLength > 0 && (
            <button
              onClick={onToggleQueue}
              className={cn(
                "shrink-0 px-2 py-1 text-[10px] font-mono uppercase tracking-wider border rounded transition-colors",
                showQueue
                  ? "text-circuit border-circuit bg-circuit/10"
                  : "text-text-muted border-border hover:border-circuit/30",
              )}
              aria-label="Toggle queue"
            >
              Queue ({queueLength})
            </button>
          )}

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
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Provider                                                                  */
/* -------------------------------------------------------------------------- */

export function AudioQueueProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [queue, setQueue] = useState<AudioTrack[]>([]);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showQueue, setShowQueue] = useState(false);

  /* -- Lazily create the audio element -- */
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("timeupdate", () => {
        setCurrentTime(audioRef.current?.currentTime ?? 0);
      });
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current?.duration ?? 0);
      });
      audioRef.current.addEventListener("ended", () => {
        setPlaying(false);
        // Auto-advance
        setQueue((prev) => {
          if (prev.length > 0) {
            const [next, ...rest] = prev;
            setCurrentTrack(next);
            setPlaying(true);
            if (audioRef.current) {
              audioRef.current.src = next.src;
              audioRef.current.play();
            }
            return rest;
          }
          setCurrentTrack(null);
          return [];
        });
      });
    }
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const addToQueue = useCallback((track: AudioTrack) => {
    setQueue((prev) => [...prev, track]);
    // If nothing is playing, start immediately
    setCurrentTrack((cur) => {
      if (!cur) {
        setPlaying(true);
        if (audioRef.current) {
          audioRef.current.src = track.src;
          audioRef.current.play();
        }
        return track;
      }
      return cur;
    });
  }, []);

  const playNow = useCallback((track: AudioTrack) => {
    setCurrentTrack(track);
    setPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = track.src;
      audioRef.current.play();
    }
  }, []);

  const playNext = useCallback(() => {
    setQueue((prev) => {
      if (prev.length === 0) {
        audioRef.current?.pause();
        setCurrentTrack(null);
        setPlaying(false);
        return [];
      }
      const [next, ...rest] = prev;
      setCurrentTrack(next);
      setPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = next.src;
        audioRef.current.play();
      }
      return rest;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [playing, currentTrack]);

  const closePlayer = useCallback(() => {
    audioRef.current?.pause();
    setCurrentTrack(null);
    setQueue([]);
    setPlaying(false);
    setCurrentTime(0);
    setShowQueue(false);
  }, []);

  return (
    <AudioQueueContext.Provider
      value={{
        currentTrack,
        queue,
        playing,
        addToQueue,
        playNow,
        playNext,
        clearQueue,
        removeFromQueue,
        togglePlay,
        closePlayer,
      }}
    >
      {children}

      {/* Global persistent player bar */}
      {currentTrack && (
        <GlobalPlayerBar
          track={currentTrack}
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          onToggle={togglePlay}
          onNext={playNext}
          onClose={closePlayer}
          queueLength={queue.length}
          showQueue={showQueue}
          onToggleQueue={() => setShowQueue((s) => !s)}
          queue={queue}
          onRemove={removeFromQueue}
        />
      )}
    </AudioQueueContext.Provider>
  );
}
