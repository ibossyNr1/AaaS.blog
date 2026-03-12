"use client";

import { useEffect, useState } from "react";
import { MiniPlayer } from "./mini-player";

interface AudioData {
  title: string;
  audioUrl: string;
  duration: number;
  generatedAt: string;
  script?: string;
}

interface EntityAudioProps {
  type: string;
  slug: string;
}

function Skeleton() {
  return (
    <section className="py-4">
      <div className="max-w-5xl mx-auto px-4">
        <div className="rounded-lg border border-border/40 bg-surface/60 px-3 py-2 flex items-center gap-2.5 animate-pulse">
          <div className="w-7 h-7 rounded-full bg-text-muted/20 shrink-0" />
          <div className="flex-grow h-1.5 rounded-full bg-text-muted/10" />
          <div className="w-20 h-3 rounded bg-text-muted/10 shrink-0" />
        </div>
      </div>
    </section>
  );
}

export function EntityAudio({ type, slug }: EntityAudioProps) {
  const [audio, setAudio] = useState<AudioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAudio() {
      try {
        const res = await fetch(`/api/entity/${type}/${slug}/audio`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data && data.audioUrl) {
          setAudio(data);
        }
      } catch {
        // Audio is non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAudio();
    return () => {
      cancelled = true;
    };
  }, [type, slug]);

  if (loading) return <Skeleton />;
  if (!audio) return null;

  return (
    <section className="py-4">
      <div className="max-w-5xl mx-auto px-4">
        <div className="space-y-1.5">
          <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-circuit">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            Audio Narration
          </h3>
          <MiniPlayer src={audio.audioUrl} title={audio.title} />
        </div>
      </div>
    </section>
  );
}
