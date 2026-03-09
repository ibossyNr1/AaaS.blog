"use client";

import { useEffect, useRef } from "react";
import { Button, Card, Container, Section } from "@aaas/ui";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const statusCards = [
  { label: "Extract", value: "Strategic Fundamentals" },
  { label: "Map", value: "Context into AI Workflows" },
  { label: "Deploy", value: "Proprietary Tools & Agents" },
];

export function Hero() {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!orbRef.current) return;
      const x = (e.clientX - window.innerWidth / 2) / 50;
      const y = (e.clientY - window.innerHeight / 2) / 50;
      orbRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <Section className="relative pt-32 pb-24 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-circuit/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <Container className="relative z-10 max-w-[1600px]">
        <div className="relative">
          {/* Monolith Title */}
          <h1 className="monolith-title text-[clamp(4rem,12vw,10rem)] font-black leading-[0.85] tracking-[-0.04em] uppercase mb-8">
            CONTEXT<br />IS KING
          </h1>

          <p className="max-w-lg text-lg text-text/70 font-light leading-relaxed">
            Contextualize Strategy to Accelerate with AI.{" "}
            <span className="text-text/50">Turn business context into structured data to perfect any AI request.</span>
          </p>

          {/* Status Cards */}
          <div className="flex flex-col sm:flex-row gap-6 lg:gap-16 mt-16">
            {statusCards.map((card) => (
              <Card key={card.label} carved className="flex-1">
                <span className="font-mono text-[0.65rem] text-circuit uppercase tracking-wider block mb-4">
                  {card.label}
                </span>
                <span className="text-2xl font-medium text-text">
                  {card.value}
                </span>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 flex flex-wrap gap-4">
            <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
              <Button size="lg">Initialize System</Button>
            </a>
            <a href="/platform">
              <Button variant="secondary" size="lg">
                Explore Platform
              </Button>
            </a>
          </div>

          {/* Node Map — Pulsing Orb */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[600px] hidden lg:flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,243,255,0.15)_0%,transparent_70%)]" />
            <div
              ref={orbRef}
              className="relative w-20 h-20 rounded-full bg-base border border-circuit animate-orb-pulse flex items-center justify-center"
              style={{ boxShadow: "0 0 30px rgba(0,243,255,0.15), inset 0 0 20px rgba(0,243,255,0.15)" }}
            >
              <div className="w-1 h-1 rounded-full bg-circuit" />
            </div>
            <svg className="absolute w-full h-full" aria-hidden="true">
              <circle cx="50%" cy="50%" r="120" stroke="rgba(0,243,255,0.1)" fill="none" strokeDasharray="10 5" />
              <circle cx="50%" cy="50%" r="180" stroke="rgba(255,255,255,0.05)" fill="none" />
            </svg>
          </div>
        </div>
      </Container>
    </Section>
  );
}
