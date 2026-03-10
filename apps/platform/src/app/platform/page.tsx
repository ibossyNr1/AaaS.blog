"use client";

import { useState } from "react";
import { Card, Container, Section, KineticBar, cn } from "@aaas/ui";
import { FadeUp } from "@/components/motion";
import { CTABlock } from "@/components/cta-block";
import { MetaballField } from "@/components/metaball-field";
import { MergeBackground } from "@/components/merge-background";
import { ClickFlash } from "@/components/click-flash";
import { SectionTopic } from "@/components/section-topic";
import { SectionDivider } from "@/components/section-divider";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const evolutionSteps = [
  {
    title: "Scout",
    icon: "⟐",
    description:
      "Agents continuously scan markets, competitors, and opportunities using your strategic context as a filter. They don't just search — they search with purpose, guided by your business DNA.",
  },
  {
    title: "Evaluate",
    icon: "◈",
    description:
      "Findings are analyzed against your business goals, risk tolerance, and competitive positioning. Multi-model evaluation ensures no signal is missed, no noise gets through.",
  },
  {
    title: "Integrate",
    icon: "⬡",
    description:
      "Validated insights are woven into your context layer, making every future agent action smarter. The system literally learns from its own discoveries.",
  },
  {
    title: "Optimize",
    icon: "◉",
    description:
      "Agents refine their own workflows based on outcomes, continuously improving execution quality. What took 10 steps becomes 3. What took hours becomes minutes.",
  },
];

const capabilities = [
  {
    title: "Research & Intelligence",
    description:
      "Market analysis, competitor tracking, trend identification, and deep-dive reports — all contextualized to your industry. Agents synthesize across hundreds of sources in minutes.",
    badge: "claude-opus-4-6",
    accent: "circuit" as const,
  },
  {
    title: "Marketing & Content",
    description:
      "Content creation, campaign strategy, social media management, and brand voice consistency at scale. Every piece sounds like you because agents know your brand matrix.",
    badge: "multi-model",
    accent: "red" as const,
  },
  {
    title: "Analytics & Insights",
    description:
      "Data synthesis, performance dashboards, insight extraction, and predictive modeling from your business data. Agents don't just report — they recommend.",
    badge: "gpt-4o",
    accent: "circuit" as const,
  },
  {
    title: "Sales & Outreach",
    description:
      "Lead research, outreach sequences, proposal generation, and CRM management — personalized to each prospect using your full context layer.",
    badge: "claude-sonnet-4-6",
    accent: "red" as const,
  },
  {
    title: "Operations & Compliance",
    description:
      "Workflow automation, compliance monitoring (ISO 9001+), process documentation, and operational intelligence. The nervous system of your business.",
    badge: "multi-model",
    accent: "circuit" as const,
  },
  {
    title: "Development & DevOps",
    description:
      "Code generation, architecture planning, documentation, testing, and deployment automation. Agents ship production-grade code with your conventions baked in.",
    badge: "claude-opus-4-6",
    accent: "red" as const,
  },
];

const models = [
  { name: "Claude Opus 4.6", provider: "Anthropic", use: "Complex reasoning & strategy" },
  { name: "Claude Sonnet 4.6", provider: "Anthropic", use: "Fast execution & content" },
  { name: "GPT-4o", provider: "OpenAI", use: "Analysis & data synthesis" },
  { name: "Gemini 2.5 Pro", provider: "Google", use: "Multi-modal & research" },
  { name: "Llama 3.3", provider: "Meta", use: "Open-source workflows" },
  { name: "Mistral Large", provider: "Mistral", use: "European compliance tasks" },
];

const liveAgents = [
  { name: "ctx-engine", role: "Context vectorization", fill: 92, status: "active" as const, model: "opus", billing: "$0.00" },
  { name: "mkt-writer", role: "Content generation", fill: 67, status: "active" as const, model: "sonnet", billing: "$0.00" },
  { name: "lead-scout", role: "Lead qualification", fill: 35, status: "learning" as const, model: "gpt-4o", billing: "$0.00" },
  { name: "audit-bot", role: "ISO 9001 scanning", fill: 100, status: "complete" as const, model: "opus", billing: "+$3.20" },
  { name: "data-synth", role: "Report generation", fill: 48, status: "active" as const, model: "gemini", billing: "$0.00" },
];

export default function PlatformPage() {
  const [activeEvolution, setActiveEvolution] = useState(0);

  return (
    <>
      <MergeBackground />
      <ClickFlash />

      {/* Hero — with metaball field */}
      <section className="relative pt-32 pb-16 overflow-hidden min-h-[80vh] flex items-center">
        <MetaballField />

        <Container className="relative z-10">
          <FadeUp>
            <SectionTopic>The Platform</SectionTopic>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="monolith-title text-[clamp(3rem,10vw,7rem)] font-black leading-[0.85] tracking-[-0.04em] uppercase mb-4">
              Context-First<br />Agent Architecture
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <KineticBar className="max-w-md my-6" />
          </FadeUp>
          <FadeUp delay={0.3}>
            <p className="text-lg font-light text-text-muted max-w-[560px] leading-relaxed mb-8">
              Every agent runs on your structured business context. No generic
              prompts. No hallucinated strategy. Real understanding, real
              execution — powered by the world&apos;s best language models.
            </p>
          </FadeUp>
          <FadeUp delay={0.4}>
            <div className="flex flex-wrap gap-3">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.15rem] px-3 py-1 border border-circuit text-circuit bg-circuit/5">LLM Agnostic</span>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.15rem] px-3 py-1 border border-accent-red text-accent-red bg-accent-red/5">MCP Native</span>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.15rem] px-3 py-1 border border-circuit text-circuit bg-circuit/5">Self-Optimizing</span>
            </div>
          </FadeUp>
        </Container>
      </section>

      <SectionDivider />

      {/* Lock-On Mechanism */}
      <Section variant="bedrock">
        <Container>
          <FadeUp>
            <SectionTopic>The Lock-On Effect</SectionTopic>
            <h2 className="monolith-title text-[clamp(2rem,5vw,3.5rem)] font-black leading-[0.9] tracking-[-0.03em] uppercase mb-6">
              Your Business<br />Nervous System
            </h2>
            <p className="text-text-muted max-w-[560px] leading-relaxed mb-8">
              Unlike vendor lock-in that traps you with proprietary formats, AaaS creates
              <span className="text-circuit"> Lock-On</span> — your agents become so deeply
              integrated with your workflows, so precisely tuned to your context, that the
              system becomes indispensable. Not because you can&apos;t leave, but because
              nothing else understands your business this well.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
              {[
                { label: "Context Depth", value: "847K vectors", sub: "Your business DNA" },
                { label: "Tool Integrations", value: "Unlimited", sub: "MCPs + APIs" },
                { label: "Model Access", value: "6+ LLMs", sub: "Best model per task" },
              ].map((item) => (
                <Card key={item.label} variant="glass" className="text-center">
                  <div className="font-mono text-2xl font-bold text-circuit mb-1">{item.value}</div>
                  <div className="font-mono text-xs text-text-muted uppercase tracking-wider">{item.label}</div>
                  <div className="text-[10px] text-text-muted mt-1">{item.sub}</div>
                </Card>
              ))}
            </div>
          </FadeUp>
        </Container>
      </Section>

      <SectionDivider />

      {/* Evolution Loop */}
      <Section id="how-it-works">
        <Container>
          <FadeUp>
            <SectionTopic>Evolution Loop</SectionTopic>
            <h2 className="monolith-title text-[clamp(2rem,5vw,3.5rem)] font-black leading-[0.9] tracking-[-0.03em] uppercase mb-12">
              The Evolution Loop
            </h2>
          </FadeUp>

          <div className="flex flex-wrap gap-3 mb-12">
            {evolutionSteps.map((step, i) => (
              <button
                key={step.title}
                onClick={() => setActiveEvolution(i)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-mono uppercase tracking-wider transition-all duration-500 ease-liquid border rounded-sm",
                  i === activeEvolution
                    ? "border-circuit text-circuit bg-circuit/5 shadow-[0_0_20px_var(--circuit-dim)]"
                    : "border-border text-text-muted hover:text-text hover:border-text/20"
                )}
              >
                <span className="text-lg">{step.icon}</span>
                {step.title}
              </button>
            ))}
          </div>

          <div className="max-w-2xl">
            <h3 className="text-2xl font-semibold text-text mb-4">
              {evolutionSteps[activeEvolution]!.title}
            </h3>
            <p className="text-text-muted leading-relaxed">
              {evolutionSteps[activeEvolution]!.description}
            </p>
          </div>
        </Container>
      </Section>

      <SectionDivider />

      {/* Capability Grid */}
      <Section>
        <Container>
          <FadeUp>
            <SectionTopic>Agent Capabilities</SectionTopic>
            <h2 className="monolith-title text-[clamp(2rem,5vw,3.5rem)] font-black leading-[0.9] tracking-[-0.03em] uppercase mb-4">
              What Agents Can Do
            </h2>
            <p className="text-text-muted mb-12 max-w-[560px]">
              Six capability domains, infinite applications — all powered by
              your business context and the right model for each task.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, i) => (
              <FadeUp key={cap.title} delay={i * 0.08}>
                <Card variant="glass" spotlight accentColor={cap.accent} className="h-full">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-text">
                      {cap.title}
                    </h3>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-circuit/50 bg-circuit/5 px-2 py-0.5 rounded shrink-0 ml-2">
                      {cap.badge}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {cap.description}
                  </p>
                </Card>
              </FadeUp>
            ))}
          </div>
        </Container>
      </Section>

      <SectionDivider />

      {/* Model Agnostic Section */}
      <Section>
        <Container>
          <FadeUp>
            <SectionTopic>LLM Agnostic</SectionTopic>
            <h2 className="monolith-title text-[clamp(2rem,5vw,3.5rem)] font-black leading-[0.9] tracking-[-0.03em] uppercase mb-4">
              Best Model for<br />Every Task
            </h2>
            <p className="text-text-muted max-w-[560px] mb-12">
              AaaS automatically selects the optimal language model for each task.
              Complex reasoning? Opus. Fast content? Sonnet. Data analysis? GPT-4o.
              Your agents always use the sharpest tool.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model, i) => (
              <FadeUp key={model.name} delay={i * 0.06}>
                <Card variant="glass" className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-circuit animate-pulse-dot mt-2 shrink-0" />
                  <div>
                    <div className="font-mono text-sm font-medium text-text">{model.name}</div>
                    <div className="text-xs text-text-muted">{model.provider}</div>
                    <div className="text-xs text-circuit/60 mt-1">{model.use}</div>
                  </div>
                </Card>
              </FadeUp>
            ))}
          </div>
        </Container>
      </Section>

      <SectionDivider />

      {/* Live Agent Feed — deploy-feed style */}
      <Section>
        <Container>
          <FadeUp>
            <SectionTopic>Live Status</SectionTopic>
            <h2 className="monolith-title text-[clamp(2rem,5vw,3.5rem)] font-black leading-[0.9] tracking-[-0.03em] uppercase mb-4">
              Active Agent<br />Roster
            </h2>
            <p className="text-text-muted max-w-[560px] mb-12">
              A live snapshot of agents currently deployed across the network.
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="max-w-3xl bg-surface border border-border p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              {/* Feed header */}
              <div className="flex justify-between font-mono text-[0.6rem] text-text-muted uppercase tracking-[0.05rem] pb-3 border-b border-border">
                <span>LIVE_AGENT_FEED</span>
                <span>LATENCY: 12ms</span>
              </div>

              {/* Engine rows */}
              <div className="flex flex-col gap-5 mt-5">
                {liveAgents.map((agent) => (
                  <div
                    key={agent.name}
                    className="h-9 flex items-center gap-3 font-mono text-xs border-b border-border pb-2 last:border-b-0"
                  >
                    {/* Status dot */}
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        agent.status === "complete"
                          ? "bg-accent-red shadow-[0_0_8px_var(--accent-red-glow)]"
                          : agent.status === "learning"
                            ? "bg-accent-red shadow-[0_0_8px_var(--accent-red-glow)] animate-feed-pulse"
                            : "bg-circuit shadow-[0_0_8px_var(--circuit-dim)] animate-feed-pulse"
                      )}
                    />
                    {/* Agent name */}
                    <div className="w-28 shrink-0 whitespace-nowrap">{agent.name}</div>
                    {/* Model badge */}
                    <span className="text-[0.55rem] text-circuit/50 bg-circuit/5 px-1.5 py-px shrink-0 hidden sm:block">
                      {agent.model}
                    </span>
                    {/* Progress track */}
                    <div className="flex-1 h-0.5 bg-surface-bright relative">
                      <div
                        className={cn(
                          "absolute left-0 top-0 h-full transition-[width] duration-[2s] ease-in-out",
                          agent.status === "complete"
                            ? "bg-accent-red"
                            : agent.status === "learning"
                              ? "bg-accent-red"
                              : "bg-circuit"
                        )}
                        style={{ width: `${agent.fill}%` }}
                      />
                    </div>
                    {/* Billing tag */}
                    <div
                      className={cn(
                        "text-[0.65rem] px-1.5 py-px shrink-0",
                        agent.status === "complete"
                          ? "bg-accent-red-dim text-accent-red"
                          : "bg-circuit-dim text-circuit"
                      )}
                    >
                      {agent.billing}
                    </div>
                  </div>
                ))}
              </div>

              {/* Feed total */}
              <div className="pt-4 mt-4 border-t border-border flex justify-between font-mono text-xs">
                <span className="text-text-muted">TOTAL_SETTLEMENT</span>
                <span className="text-circuit font-bold">$3.20 USD</span>
              </div>
            </div>
          </FadeUp>
        </Container>
      </Section>

      <SectionDivider />

      {/* Adaptability */}
      <Section variant="bedrock">
        <Container>
          <FadeUp>
            <SectionTopic>Continuous Alignment</SectionTopic>
            <h2 className="monolith-title text-[clamp(2rem,5vw,3.5rem)] font-black leading-[0.9] tracking-[-0.03em] uppercase mb-6">
              Agents That<br />Grow With You
            </h2>
            <p className="text-text-muted max-w-[560px] mb-8 leading-relaxed">
              As your business evolves, your agents evolve too. New products,
              new markets, new strategies — the context layer adapts instantly,
              and agents immediately reflect the change. No retraining. No
              re-prompting. Just continuous alignment.
            </p>
            <a
              href={BOOKING_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-14 py-5 border border-accent-red text-accent-red font-mono text-sm uppercase tracking-[0.3rem] hover:bg-accent-red hover:text-base hover:shadow-[0_0_40px_var(--accent-red-glow)] hover:scale-[1.03] transition-all duration-[400ms] ease-liquid"
            >
              See It In Action
            </a>
          </FadeUp>
        </Container>
      </Section>

      <CTABlock />
    </>
  );
}
