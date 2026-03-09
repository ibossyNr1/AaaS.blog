"use client";

import { useState } from "react";
import { Button, Card, Badge, Container, Section, cn } from "@aaas/ui";
import { FadeUp } from "@/components/motion";
import { CTABlock } from "@/components/cta-block";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const evolutionSteps = [
  {
    title: "Scout",
    description:
      "Agents continuously scan markets, competitors, and opportunities using your strategic context as a filter.",
  },
  {
    title: "Evaluate",
    description:
      "Findings are analyzed against your business goals, risk tolerance, and competitive positioning.",
  },
  {
    title: "Integrate",
    description:
      "Validated insights are woven into your context layer, making every future agent action smarter.",
  },
  {
    title: "Optimize",
    description:
      "Agents refine their own workflows based on outcomes, continuously improving execution quality.",
  },
];

const capabilities = [
  {
    title: "Research",
    description:
      "Market analysis, competitor tracking, trend identification, and deep-dive reports — all contextualized to your industry.",
  },
  {
    title: "Marketing",
    description:
      "Content creation, campaign strategy, social media management, and brand voice consistency at scale.",
  },
  {
    title: "Analytics",
    description:
      "Data synthesis, performance dashboards, insight extraction, and predictive modeling from your business data.",
  },
  {
    title: "Sales",
    description:
      "Lead research, outreach sequences, proposal generation, and CRM management — personalized to each prospect.",
  },
  {
    title: "Operations",
    description:
      "Workflow automation, compliance monitoring, process documentation, and operational intelligence.",
  },
  {
    title: "Development",
    description:
      "Code generation, architecture planning, documentation, testing, and DevOps automation.",
  },
];

export default function PlatformPage() {
  const [activeEvolution, setActiveEvolution] = useState(0);

  return (
    <>
      {/* Hero */}
      <Section className="pt-32 pb-12">
        <Container className="text-center">
          <FadeUp>
            <Badge className="mb-4">
              The Platform
            </Badge>
            <h1 className="monolith-title text-4xl md:text-6xl font-bold mb-4 uppercase tracking-tight">
              Context-First Agent Architecture
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Every agent runs on your structured business context. No generic
              prompts. No hallucinated strategy. Real understanding, real
              execution.
            </p>
          </FadeUp>
        </Container>
      </Section>

      {/* Evolution Loop */}
      <Section id="how-it-works" variant="surface">
        <Container>
          <FadeUp>
            <h2 className="monolith-title text-3xl md:text-4xl font-bold text-center mb-16 uppercase tracking-tight">
              The Evolution Loop
            </h2>
          </FadeUp>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {evolutionSteps.map((step, i) => (
              <button
                key={step.title}
                onClick={() => setActiveEvolution(i)}
                className={cn(
                  "px-6 py-3 text-sm font-mono uppercase tracking-wider transition-all border",
                  i === activeEvolution
                    ? "border-circuit text-circuit bg-circuit/5 shadow-[0_0_15px_var(--circuit-dim)]"
                    : "border-[rgba(255,255,255,0.05)] text-text-muted hover:text-text hover:border-text/20"
                )}
              >
                {step.title}
              </button>
            ))}
          </div>

          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-semibold text-text mb-4">
              {evolutionSteps[activeEvolution].title}
            </h3>
            <p className="text-text-muted leading-relaxed">
              {evolutionSteps[activeEvolution].description}
            </p>
          </div>
        </Container>
      </Section>

      {/* Capability Grid */}
      <Section>
        <Container>
          <FadeUp>
            <h2 className="monolith-title text-3xl md:text-4xl font-bold text-center mb-4 uppercase tracking-tight">
              What Agents Can Do
            </h2>
            <p className="text-text-muted text-center mb-16 max-w-xl mx-auto">
              Six capability domains, infinite applications — all powered by
              your business context.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {capabilities.map((cap, i) => (
              <FadeUp key={cap.title} delay={i * 0.08}>
                <Card className="h-full">
                  <h3 className="text-lg font-semibold text-text mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {cap.description}
                  </p>
                </Card>
              </FadeUp>
            ))}
          </div>
        </Container>
      </Section>

      {/* Adaptability */}
      <Section variant="surface">
        <Container className="text-center">
          <FadeUp>
            <h2 className="monolith-title text-3xl md:text-4xl font-bold mb-6 uppercase tracking-tight">
              Agents That Grow With You
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
              As your business evolves, your agents evolve too. New products,
              new markets, new strategies — the context layer adapts, and
              agents immediately reflect the change.
            </p>
            <a
              href={BOOKING_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg">See It In Action</Button>
            </a>
          </FadeUp>
        </Container>
      </Section>

      <CTABlock />
    </>
  );
}
