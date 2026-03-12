"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@aaas/ui";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface AudioPlayerProps {
  src: string;
  title: string;
  subtitle?: string;
  duration?: number;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

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
/*  Icons                                                                     */
/* -------------------------------------------------------------------------- */

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
      <polygon points="3,1 13,7 3,13" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
      <rect x="2" y="1" width="4" height="12" rx="1" />
      <rect x="8" y="1" width="4" height="12" rx="1" />
    </svg>
  );
}

function SkipIcon({ direction, className }: { direction: "back" | "forward"; className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {direction === "back" ? (
        <>
          <polyline points="11 17 6 12 11 7" />
          <polyline points="18 17 13 12 18 7" />
        </>
      ) : (
        <>
          <polyline points="13 17 18 12 13 7" />
          <polyline points="6 17 11 12 6 7" />
        </>
      )}
    </svg>
  );
}

function VolumeIcon({ muted, className }: { muted: boolean; className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {!muted && (
        <>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </>
      )}
      {muted && <line x1="23" y1="9" x2="17" y2="15" />}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function AudioPlayer({ src, title, subtitle, duration: initialDuration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration ?? 0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [dragging, setDragging] = useState(false);

  /* -- Audio events -- */
  const onLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const onTimeUpdate = useCallback(() => {
    if (!dragging && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [dragging]);

  const onEnded = useCallback(() => {
    setPlaying(false);
    setCurrentTime(0);
  }, []);

  /* -- Controls -- */
  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }

  function skip(seconds: number) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
  }

  function cycleSpeed() {
    const idx = SPEEDS.indexOf(speed as (typeof SPEEDS)[number]);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  function toggleMute() {
    setMuted((m) => {
      if (audioRef.current) audioRef.current.muted = !m;
      return !m;
    });
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
      audioRef.current.muted = v === 0;
      setMuted(v === 0);
    }
  }

  /* -- Progress bar seeking -- */
  function seekFromEvent(e: React.MouseEvent | MouseEvent) {
    if (!progressRef.current || !audioRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const t = pct * duration;
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  }

  function onProgressMouseDown(e: React.MouseEvent) {
    setDragging(true);
    seekFromEvent(e);

    const onMove = (ev: MouseEvent) => seekFromEvent(ev);
    const onUp = () => {
      setDragging(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  /* -- Keyboard shortcuts -- */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(10);
          break;
      }
    }
    // Only bind if this player is the primary one
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl border border-border/40 bg-surface/60 p-5 space-y-4">
      {/* Hidden native audio */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
      />

      {/* Title row */}
      <div className="flex items-center gap-3">
        {playing && (
          <span className="inline-block w-2 h-2 rounded-full bg-circuit animate-pulse shrink-0" />
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text truncate">{title}</h3>
          {subtitle && (
            <p className="text-xs text-text-muted truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div
          ref={progressRef}
          className="relative h-2 rounded-full bg-border/40 cursor-pointer group"
          onMouseDown={onProgressMouseDown}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          tabIndex={0}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-circuit transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-circuit border-2 border-base opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-text-muted">
          <span>{fmtTime(currentTime)}</span>
          <span>{fmtTime(duration)}</span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: speed */}
        <button
          onClick={cycleSpeed}
          className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-border rounded hover:border-circuit hover:text-circuit transition-colors text-text-muted"
          aria-label={`Playback speed ${speed}x`}
        >
          {speed}x
        </button>

        {/* Center: skip back / play / skip forward */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => skip(-10)}
            className="text-text-muted hover:text-circuit transition-colors"
            aria-label="Skip back 10 seconds"
          >
            <SkipIcon direction="back" />
          </button>

          <button
            onClick={togglePlay}
            className={cn(
              "w-10 h-10 rounded-full border flex items-center justify-center transition-colors",
              playing
                ? "border-circuit bg-circuit/10 text-circuit"
                : "border-border text-text-muted hover:border-circuit hover:text-circuit",
            )}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button
            onClick={() => skip(10)}
            className="text-text-muted hover:text-circuit transition-colors"
            aria-label="Skip forward 10 seconds"
          >
            <SkipIcon direction="forward" />
          </button>
        </div>

        {/* Right: volume */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className="text-text-muted hover:text-circuit transition-colors"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            <VolumeIcon muted={muted} />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 accent-[rgb(var(--circuit))] bg-border/40 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-circuit"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
