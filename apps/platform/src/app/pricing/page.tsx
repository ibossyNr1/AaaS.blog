"use client";

import { useState } from "react";
import { Button, Card, Badge, Container, Section, cn } from "@aaas/ui";
import { FadeUp } from "@/components/motion";
import { CTABlock } from "@/components/cta-block";
import { AuraBackground } from "@/components/aura-background";
import { SectionTopic } from "@/components/section-topic";
import { SectionDivider } from "@/components/section-divider";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const plans = [
  {
    name: "Retainer",
    badge: null,
    tagline: "Your dedicated agent workforce",
    description:
      "Monthly context engineering, custom agent workflows, unlimited task execution, and priority support. For businesses that need an always-on autonomous operations layer.",
    features: [
      "Dedicated context engineering sessions",
      "Custom agent workflow development",
      "Priority support & rapid iteration",
      "Monthly strategy reviews & optimization",
      "Unlimited agent tasks",
      "Access to all 6+ language models",
      "Custom MCP & API integrations",
    ],
    accent: "circuit" as const,
    cta: "Book Retainer Call",
  },
  {
    name: "Pay-per-Task",
    badge: "Most Popular",
    tagline: "Scale as you grow",
    description:
      "On-demand agent execution for specific projects. Pay only for the compute you use, with transparent token pricing via Open Router. Zero commitment, full capability.",
    features: [
      "No monthly commitment",
      "Transparent per-task pricing",
      "Access to all agent capabilities",
      "Standard context setup included",
      "Bring Your Own Key option",
      "Email support & documentation",
      "Community skill repository access",
    ],
    accent: "red" as const,
    cta: "Start Pay-per-Task",
  },
  {
    name: "Build with AaaS",
    badge: null,
    tagline: "Equity-aligned partnership",
    description:
      "We deploy our full platform for your venture in exchange for growth alignment. Your domain expertise + our AI infrastructure = shared upside.",
    features: [
      "Full platform deployment",
      "Equity-based partnership model",
      "Co-innovation & IP development",
      "Custom agent development",
      "Strategic advisory & mentorship",
      "Access to venture network",
      "Priority feature requests",
    ],
    accent: "circuit" as const,
    cta: "Explore Partnership",
  },
];

const tokenInfo = [
  { label: "Context Engineering", cost: "Included in all plans", status: "active" as const },
  { label: "Agent Compute", cost: "Via Open Router — transparent pricing", status: "active" as const },
  { label: "BYOK Option", cost: "Bring your own API keys for direct pricing", status: "active" as const },
  { label: "Skill Repository", cost: "Free community access", status: "complete" as const },
];

const faqs = [
  {
    q: "How does context engineering work?",
    a: "We transform your business knowledge — strategy docs, brand guides, customer data, competitive analysis — into structured, machine-readable context (847K+ vectors). This ensures every agent understands your business deeply, producing outputs that are genuinely aligned with your goals. Think of it as teaching an AI your entire company history, culture, and strategy in a format it can actually use.",
  },
  {
    q: "What tools can agents connect to?",
    a: "Agents connect via MCPs (Model Context Protocol) and APIs to your existing stack: GitHub, Slack, Google Workspace, databases, CRMs, custom APIs, and more. We're LLM-agnostic and tool-agnostic — no vendor lock-in. Your stack, amplified by autonomous intelligence.",
  },
  {
    q: "How is this different from ChatGPT or other AI tools?",
    a: "Generic AI tools respond to one-off prompts with no memory of your business. AaaS agents have persistent, structured context about your company. They connect to your tools, execute complex multi-step workflows autonomously, select the best model for each task, and get smarter over time. They're a workforce, not a chatbot.",
  },
  {
    q: "What's the 'Invisible Token' economy?",
    a: "You pay for outcomes, not tokens. Behind the scenes, we route tasks through the optimal model via Open Router — sometimes that's Opus for complex reasoning, sometimes Sonnet for fast content, sometimes GPT-4o for data analysis. You agree to a compute burn rate (daily/weekly/monthly limits), and we handle the optimization. Power users can bring their own API keys for direct pricing.",
  },
  {
    q: "Can I try before committing?",
    a: "Yes — book a call and we'll scope a proof-of-concept project. You'll see agents in action on a real task from your business before any commitment. We typically run a 2-week pilot that demonstrates measurable ROI.",
  },
  {
    q: "What's the equity model for 'Build with AaaS'?",
    a: "We deploy our full agent infrastructure for your venture in exchange for a minority equity stake (typically 5-15%). This aligns our incentives — we succeed when you succeed. We provide the platform, custom agent development, strategic advisory, and access to our venture network. Ideal for early-stage startups and innovation projects.",
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <AuraBackground />

      {/* Hero — Aura style */}
      <section className="relative pt-32 pb-16 overflow-hidden min-h-[60vh] flex items-center">
        <Container className="relative z-10">
          <FadeUp>
            <SectionTopic>Flexible Plans</SectionTopic>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="monolith-title text-[clamp(3rem,10vw,7rem)] font-black leading-[0.85] tracking-[-0.04em] uppercase mb-4">
              Investment in<br />Intelligence
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-lg font-light text-text-muted max-w-[560px] leading-relaxed">
              No hidden fees. No per-seat pricing. No token anxiety. Choose the
              model that fits your stage and scale — from single tasks to full
              autonomous operations.
            </p>
          </FadeUp>
        </Container>
      </section>

      <SectionDivider />

      {/* Pricing Cards */}
      <Section className="py-12">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan, i) => (
              <FadeUp key={plan.name} delay={i * 0.1}>
                <Card
                  variant="glass"
                  spotlight
                  accentColor={plan.accent}
                  className={cn(
                    "relative flex flex-col h-full",
                    plan.badge && "md:scale-[1.03] md:z-10 ring-1 ring-accent-red/20"
                  )}
                >
                  {plan.badge && (
                    <Badge
                      variant="red"
                      className="absolute -top-3 left-1/2 -translate-x-1/2"
                    >
                      {plan.badge}
                    </Badge>
                  )}
                  <p className="font-mono text-[0.6rem] text-text-muted uppercase tracking-wider mb-1">
                    {plan.tagline}
                  </p>
                  <h3 className="text-2xl font-bold text-text mb-3">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-text-muted mb-6 leading-relaxed">
                    {plan.description}
                  </p>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-text-muted"
                      >
                        <span className="text-circuit mt-0.5 shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={BOOKING_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      className="w-full"
                      variant={plan.badge ? "red" : "secondary"}
                    >
                      {plan.cta}
                    </Button>
                  </a>
                </Card>
              </FadeUp>
            ))}
          </div>
        </Container>
      </Section>

      <SectionDivider />

      {/* Token Economy — deploy-feed style */}
      <Section variant="bedrock">
        <Container>
          <FadeUp>
            <SectionTopic>Transparent Pricing</SectionTopic>
            <h2 className="monolith-title text-[clamp(2rem,5vw,3.5rem)] font-black leading-[0.9] tracking-[-0.03em] uppercase mb-4">
              The Invisible<br />Token Economy
            </h2>
            <p className="text-text-muted max-w-[560px] mb-12">
              You pay for outcomes. We optimize the compute. Open Router
              integration ensures you always get the best model at the best price.
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="max-w-3xl bg-surface border border-border p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="flex justify-between font-mono text-[0.6rem] text-text-muted uppercase tracking-[0.05rem] pb-3 border-b border-border">
                <span>TOKEN_ECONOMY_FEED</span>
                <span>STATUS: LIVE</span>
              </div>

              <div className="flex flex-col gap-5 mt-5">
                {tokenInfo.map((item) => (
                  <div
                    key={item.label}
                    className="h-9 flex items-center gap-3 font-mono text-xs border-b border-border pb-2 last:border-b-0"
                  >
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        item.status === "complete"
                          ? "bg-accent-red shadow-[0_0_8px_var(--accent-red-glow)]"
                          : "bg-circuit shadow-[0_0_8px_var(--circuit-dim)] animate-feed-pulse"
                      )}
                    />
                    <div className="w-40 shrink-0 whitespace-nowrap text-text">{item.label}</div>
                    <div className="flex-1 text-text-muted text-[0.7rem] truncate">{item.cost}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </Container>
      </Section>

      <SectionDivider />

      {/* FAQ */}
      <Section>
        <Container className="max-w-3xl">
          <FadeUp>
            <SectionTopic>Questions</SectionTopic>
            <h2 className="monolith-title text-[clamp(2rem,5vw,3.5rem)] font-black leading-[0.9] tracking-[-0.03em] uppercase mb-12">
              Frequently Asked
            </h2>
          </FadeUp>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FadeUp key={i} delay={i * 0.04}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left glass rounded-lg p-6 transition-all duration-300 hover:border-circuit/20"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-text font-medium pr-4">{faq.q}</h3>
                    <span
                      className={cn(
                        "text-text-muted transition-transform duration-300 shrink-0",
                        openFaq === i && "rotate-180"
                      )}
                    >
                      ▾
                    </span>
                  </div>
                  {openFaq === i && (
                    <p className="mt-4 text-sm text-text-muted leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </button>
              </FadeUp>
            ))}
          </div>
        </Container>
      </Section>

      <CTABlock />
    </>
  );
}
