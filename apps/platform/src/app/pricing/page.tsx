"use client";

import { useState } from "react";
import { Button, Card, Badge, Container, Section, cn } from "@aaas/ui";
import { FadeUp } from "@/components/motion";
import { CTABlock } from "@/components/cta-block";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const plans = [
  {
    name: "Retainer",
    badge: null,
    description:
      "Dedicated agent workforce with monthly context engineering. Best for businesses that need ongoing autonomous operations.",
    features: [
      "Dedicated context engineering",
      "Custom agent workflows",
      "Priority support & iteration",
      "Monthly strategy reviews",
      "Unlimited agent tasks",
    ],
  },
  {
    name: "Pay-per-Task",
    badge: "Most Popular",
    description:
      "On-demand agent execution for specific projects. Pay only for what you use, scale as you grow.",
    features: [
      "No monthly commitment",
      "Per-task pricing",
      "Access to all agent capabilities",
      "Standard context setup",
      "Email support",
    ],
  },
  {
    name: "Build with AaaS",
    badge: null,
    description:
      "Equity partnership model for startups and ventures. We deploy our full platform in exchange for growth alignment.",
    features: [
      "Full platform deployment",
      "Equity-based partnership",
      "Co-innovation access",
      "Custom agent development",
      "Strategic advisory",
    ],
  },
];

const faqs = [
  {
    q: "How does context engineering work?",
    a: "We transform your business knowledge — strategy docs, brand guides, customer data, competitive analysis — into structured, machine-readable context. This ensures every agent understands your business deeply, producing outputs that are genuinely aligned with your goals.",
  },
  {
    q: "What tools can agents connect to?",
    a: "Agents connect via MCPs and APIs to your existing stack: GitHub, Slack, Google Workspace, databases, CRMs, and more. No vendor lock-in — your tools, amplified by AI agents.",
  },
  {
    q: "How is this different from ChatGPT or other AI tools?",
    a: "Generic AI tools respond to one-off prompts. AaaS agents have persistent context about your business, connect to your tools, and execute complex multi-step workflows autonomously. They're a workforce, not a chatbot.",
  },
  {
    q: "Can I try before committing?",
    a: "Yes — book a call and we'll scope a proof-of-concept project. You'll see agents in action on a real task from your business before any commitment.",
  },
  {
    q: "What's the equity model for 'Build with AaaS'?",
    a: "We deploy our full agent infrastructure for your venture in exchange for a minority equity stake. This aligns our incentives — we succeed when you succeed. Ideal for early-stage startups and innovation projects.",
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Hero */}
      <Section className="pt-32 pb-12">
        <Container className="text-center">
          <FadeUp>
            <Badge className="mb-4">
              Flexible Plans
            </Badge>
            <h1 className="monolith-title text-4xl md:text-6xl font-bold mb-4 uppercase tracking-tight">
              Investment in Intelligence
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              No hidden fees. No per-seat pricing. Choose the model that fits
              your stage and scale.
            </p>
          </FadeUp>
        </Container>
      </Section>

      {/* Pricing Cards */}
      <Section className="py-12">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {plans.map((plan, i) => (
              <FadeUp key={plan.name} delay={i * 0.1}>
                <Card
                  className={cn(
                    "relative flex flex-col",
                    plan.badge && "md:scale-105 md:z-10 glow-circuit"
                  )}
                >
                  {plan.badge && (
                    <Badge
                      className="absolute -top-3 left-1/2 -translate-x-1/2"
                    >
                      {plan.badge}
                    </Badge>
                  )}
                  <h3 className="text-2xl font-bold text-text mb-2">
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
                        <span className="text-circuit mt-0.5">✓</span>
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
                      variant={plan.badge ? "primary" : "secondary"}
                    >
                      Book a Call
                    </Button>
                  </a>
                </Card>
              </FadeUp>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section variant="surface">
        <Container className="max-w-3xl">
          <FadeUp>
            <h2 className="monolith-title text-3xl font-bold text-center mb-12 uppercase tracking-tight">
              Frequently Asked Questions
            </h2>
          </FadeUp>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FadeUp key={i} delay={i * 0.05}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left bg-surface border border-[rgba(255,255,255,0.05)] p-6 transition-all hover:border-circuit/30"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-text font-medium pr-4">{faq.q}</h3>
                    <span
                      className={cn(
                        "text-text-muted transition-transform shrink-0",
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
