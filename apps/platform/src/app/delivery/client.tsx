"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { OrbitalBackground } from "@/components/orbital-background";

const SCROLL_DURATION = 58; // seconds — synced to audio length

interface PitchBlock {
  type: "title" | "heading" | "paragraph" | "accent";
  text: string;
}

const PITCH: PitchBlock[] = [
  { type: "title", text: "AGENTS AS A SERVICE" },
  { type: "accent", text: "Every business runs on context.\nThe problem is — your AI doesn't have any." },
  { type: "paragraph", text: "Your strategy lives in documents nobody reads. Your brand voice lives in one person's head. Your industry knowledge lives in tribal memory. Your competitive edge lives in spreadsheets that expire quarterly." },
  { type: "accent", text: "AaaS changes this." },
  { type: "paragraph", text: "We take your business DNA — vision, brand, market positioning, competitive landscape, operational knowledge — and encode it into structured context that machines can actually use." },
  { type: "paragraph", text: "Then we deploy autonomous AI agents that don't guess. They know." },
  { type: "heading", text: "For Founders" },
  { type: "paragraph", text: "Stop briefing freelancers. Stop correcting AI outputs. Your agents produce marketing, sales materials, research, and operational workflows that sound like you, think like you, and execute like your best people — at machine scale." },
  { type: "heading", text: "For Partners & Ambassadors" },
  { type: "paragraph", text: "White-label the platform. Co-brand agent workforces for your clients. Every methodology you've built becomes an automated, scalable service. Your expertise, multiplied." },
  { type: "heading", text: "For Investors" },
  { type: "paragraph", text: "This is the infrastructure layer between business strategy and AI execution. Every company needs it. Nobody else is building it. Context is the moat — and we own the encoding." },
  { type: "accent", text: "The convergence model is simple." },
  { type: "paragraph", text: "Brand. Context. Industry. Strategy. Four dimensions orbiting a single autonomous core. When they converge, AI doesn't just execute — it understands." },
  { type: "accent", text: "This is not another AI tool.\nThis is the operating system for your autonomous workforce." },
  { type: "title", text: "Welcome to AaaS." },
];

export function DeliveryClient() {
  const [scrolling, setScrolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(0);

  const stopScroll = useCallback(() => {
    setScrolling(false);
    cancelAnimationFrame(animRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setProgress(0);
    if (scrollRef.current) {
      scrollRef.current.style.transform = "translateY(0)";
    }
  }, []);

  const startScroll = useCallback(() => {
    if (!scrollRef.current) return;
    setScrolling(true);

    // Start audio
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Autoplay may be blocked — scroll continues silently
      });
    }

    const scrollEl = scrollRef.current;
    const totalDistance = scrollEl.scrollHeight - window.innerHeight + 200;
    startTimeRef.current = performance.now();

    function animate(now: number) {
      const elapsed = (now - startTimeRef.current) / 1000;
      const t = Math.min(elapsed / SCROLL_DURATION, 1);
      // Ease: slow start, steady middle, slow end
      const eased = t < 0.05
        ? t * 20 * t  // slow ramp in
        : t > 0.95
          ? 1 - (1 - t) * 20 * (1 - t)  // slow ramp out
          : t;

      const y = eased * totalDistance;
      scrollEl.style.transform = `translateY(-${y}px)`;
      setProgress(t);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setScrolling(false);
      }
    }

    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && scrolling) stopScroll();
      if (e.key === " " && !scrolling) {
        e.preventDefault();
        startScroll();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [scrolling, startScroll, stopScroll]);

  // Clean up on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <>
      <OrbitalBackground />
      <audio ref={audioRef} src="/audio/aaas-pitch.mp3" preload="auto" />

      {/* Play button — visible when not scrolling */}
      {!scrolling && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 animate-fade-up">
          <button
            onClick={startScroll}
            className="group glass rounded-full px-8 py-4 border border-circuit/20 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_var(--circuit-dim)]"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-circuit">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="font-mono text-sm uppercase tracking-wider text-text">
              Start Pitch
            </span>
          </button>
          <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
            or press Space
          </span>
        </div>
      )}

      {/* Stop button + progress — visible while scrolling */}
      {scrolling && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
          <button
            onClick={stopScroll}
            className="glass rounded-full px-6 py-3 border border-accent-red/20 flex items-center gap-2 transition-all duration-300 hover:scale-105"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-accent-red">
              <path d="M6 6h12v12H6z" />
            </svg>
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
              Stop
            </span>
          </button>
          {/* Progress bar */}
          <div className="w-48 h-[2px] bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-circuit transition-[width] duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Scrolling content */}
      <div className="relative z-10 min-h-screen flex items-end justify-center overflow-hidden">
        <div
          ref={scrollRef}
          className="max-w-2xl mx-auto px-6 pt-[100vh] pb-[60vh] text-center"
          style={{ willChange: scrolling ? "transform" : "auto" }}
        >
          {PITCH.map((block, i) => {
            if (block.type === "title") {
              return (
                <h1
                  key={i}
                  className="monolith-title text-[clamp(2.5rem,8vw,5rem)] font-black leading-[0.9] tracking-[-0.04em] uppercase mb-16"
                >
                  {block.text}
                </h1>
              );
            }
            if (block.type === "heading") {
              return (
                <h2
                  key={i}
                  className="font-mono text-sm uppercase tracking-[0.4em] text-circuit mt-20 mb-6"
                >
                  {block.text}
                </h2>
              );
            }
            if (block.type === "accent") {
              return (
                <p
                  key={i}
                  className="text-2xl md:text-3xl font-light text-text leading-relaxed mb-12 whitespace-pre-line"
                >
                  {block.text}
                </p>
              );
            }
            return (
              <p
                key={i}
                className="text-lg text-text-muted leading-relaxed mb-10 max-w-xl mx-auto"
              >
                {block.text}
              </p>
            );
          })}
        </div>
      </div>
    </>
  );
}
