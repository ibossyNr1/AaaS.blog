"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Card, Container, Section, Badge } from "@aaas/ui";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";
const TEASER_URL =
  "https://firebasestorage.googleapis.com/v0/b/studio-1743338608-800f1.firebasestorage.app/o/Video%2FAaaS_Teaser.mp4?alt=media&token=f0c4e84a-5b3e-466d-acb2-c6eb85af8dfb";

const statusCards = [
  { label: "Extract", value: "Strategic Fundamentals", icon: "01" },
  { label: "Map", value: "Context into AI Workflows", icon: "02" },
  { label: "Deploy", value: "Proprietary Tools & Agents", icon: "03" },
];

export function Hero() {
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!showVideo) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowVideo(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showVideo]);

  useEffect(() => {
    if (showVideo) {
      requestAnimationFrame(() => videoRef.current?.play());
    }
  }, [showVideo]);

  return (
    <>
      <Section className="relative pt-32 pb-24 overflow-hidden">
        {/* Dual accent glows */}
        <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-circuit/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-accent-red/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <Container className="relative z-10 max-w-[1600px]">
          <div className="relative">
            {/* System status badge */}
            <Badge className="mb-6 animate-fade-up">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse-dot inline-block mr-2" />
              System Online — 12 Agents Active
            </Badge>

            {/* Monolith Title */}
            <h1 className="monolith-title text-[clamp(4rem,12vw,10rem)] font-black leading-[0.85] tracking-[-0.04em] uppercase mb-8">
              CONTEXT<br />IS KING
            </h1>

            <p className="max-w-lg text-lg leading-relaxed mb-4">
              <span className="font-bold text-text">Your business context, structured for machines.</span>
              <br />
              <span className="text-text/50 font-light">
                Deploy autonomous AI agents that truly understand your strategy,
                brand, market, and operations — then execute with surgical precision.
              </span>
            </p>

            {/* Video play trigger */}
            <button
              onClick={() => setShowVideo(true)}
              className="group flex items-center gap-4 mb-12 cursor-pointer"
            >
              <span className="w-12 h-12 rounded-full glass border border-circuit/20 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_25px_var(--circuit-dim)]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-circuit ml-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="outline-text text-[clamp(1.2rem,3vw,2rem)] font-black uppercase tracking-tight opacity-50 group-hover:opacity-80 transition-opacity duration-300">
                AaaS Explained in 1 Min
              </span>
            </button>

            {/* Status Cards — Glass variant */}
            <div className="flex flex-col sm:flex-row gap-6 lg:gap-8 mt-8">
              {statusCards.map((card) => (
                <Card
                  key={card.label}
                  variant="glass"
                  spotlight
                  className="flex-1 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="font-mono text-[0.65rem] text-circuit uppercase tracking-wider">
                      {card.label}
                    </span>
                    <span className="font-mono text-[0.55rem] text-text-muted">
                      {card.icon}
                    </span>
                  </div>
                  <span className="text-xl font-medium text-text leading-tight">
                    {card.value}
                  </span>
                </Card>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-16 flex flex-wrap gap-4">
              <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
                <Button variant="red" size="lg">Initialize System</Button>
              </a>
              <a href="/platform">
                <Button variant="secondary" size="lg">
                  Explore Platform
                </Button>
              </a>
            </div>

          </div>
        </Container>
      </Section>

      {/* Video modal */}
      {showVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVideo(false);
          }}
        >
          <div className="relative w-full max-w-4xl mx-4">
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-10 right-0 text-text-muted hover:text-text text-sm font-mono transition-colors"
            >
              ESC to close
            </button>
            <video
              ref={videoRef}
              src={TEASER_URL}
              controls
              className="w-full rounded-xl shadow-2xl"
              onEnded={() => setShowVideo(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
