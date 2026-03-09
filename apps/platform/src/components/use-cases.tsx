"use client";

import { useState } from "react";
import { Button, Container, Section, cn } from "@aaas/ui";
import { FadeUp } from "./motion";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const cases = [
  {
    label: "Startups",
    headline: "Replace 5 SaaS tools with one agentic workforce.",
    body: "From market research to outreach to financial modeling — agents handle it. Get the operational capacity of a 10-person team without the headcount.",
  },
  {
    label: "SMBs",
    headline: "Scale operations without scaling costs.",
    body: "Automate repetitive workflows, generate reports, manage compliance, and execute marketing campaigns — all contextualized to your business.",
  },
  {
    label: "Consultants",
    headline: "Deliver 10x more value to every client.",
    body: "Deploy agent workflows for each client engagement. Research, analysis, and deliverable generation — done in hours, not weeks.",
  },
  {
    label: "Corporate Innovation",
    headline: "Prototype and validate at startup speed.",
    body: "Innovation departments use AaaS to rapidly test new initiatives with dedicated agent teams. From concept to proof-of-concept in days.",
  },
  {
    label: "Universities",
    headline: "Teach entrepreneurship with real AI infrastructure.",
    body: "Students build and run ventures on AaaS. Real agents, real tools, real market execution — the ultimate learning-by-doing platform.",
  },
];

export function UseCases() {
  const [active, setActive] = useState(0);

  return (
    <Section>
      <Container>
        <FadeUp>
          <h2 className="monolith-title text-3xl md:text-4xl font-bold text-center mb-12 uppercase tracking-tight">
            Built For Your World
          </h2>
        </FadeUp>

        {/* Tabs — monolith style */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {cases.map((c, i) => (
            <button
              key={c.label}
              onClick={() => setActive(i)}
              className={cn(
                "px-4 py-2 text-sm font-mono uppercase tracking-wider transition-all duration-300 border",
                i === active
                  ? "border-circuit text-circuit bg-circuit/5 shadow-[0_0_15px_rgba(0,243,255,0.15)]"
                  : "border-[rgba(255,255,255,0.05)] text-text-muted hover:text-text hover:border-text/20"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-semibold text-text mb-4">
            {cases[active].headline}
          </h3>
          <p className="text-text-muted leading-relaxed mb-8">
            {cases[active].body}
          </p>
          <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
            <Button>Book a Call</Button>
          </a>
        </div>
      </Container>
    </Section>
  );
}
