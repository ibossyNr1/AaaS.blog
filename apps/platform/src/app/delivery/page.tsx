import type { Metadata } from "next";
import { Container, Section } from "@aaas/ui";
import { FadeUp } from "@/components/motion";
import { CTABlock } from "@/components/cta-block";
import { SectionTopic } from "@/components/section-topic";
import { DeliveryClient } from "./client";

export const metadata: Metadata = {
  title: "Delivery — The Convergence Model | Agent-as-a-Service",
  description:
    "Brand, context, industry, and strategy converge into autonomous execution. The AaaS orbital model.",
  openGraph: {
    title: "The Convergence Model — AaaS",
    description: "Brand · Context · Industry · Strategy → Autonomous Execution",
  },
};

export default function DeliveryPage() {
  return (
    <>
      <DeliveryClient />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden min-h-screen flex items-center z-10">
        <Container className="relative z-10">
          <FadeUp>
            <SectionTopic>The Convergence Model</SectionTopic>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="monolith-title text-[clamp(3rem,10vw,7rem)] font-black leading-[0.85] tracking-[-0.04em] uppercase mb-6">
              Everything<br />Converges
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-lg font-light text-text-muted max-w-[560px] leading-relaxed">
              <span className="font-bold text-text">Brand, context, industry, and strategy.</span>
              <br />
              Four dimensions of business intelligence orbiting a single autonomous core.
              When they converge, your AI workforce doesn&apos;t just execute — it understands.
            </p>
          </FadeUp>
        </Container>
      </section>

      {/* Orbital Explanation — scrolls over background */}
      <Section className="relative z-10 py-32">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-4xl mx-auto">
            {[
              {
                label: "Brand",
                color: "text-circuit",
                description:
                  "Your voice, visual identity, values, and market positioning — encoded into every agent interaction. Consistency at machine scale.",
              },
              {
                label: "Context",
                color: "text-accent-red",
                description:
                  "847K+ vectors of proprietary knowledge. Your documents, processes, and institutional memory — structured for autonomous retrieval.",
              },
              {
                label: "Industry",
                color: "text-circuit",
                description:
                  "Vertical-specific compliance, terminology, workflows, and competitive dynamics. Your agents speak your industry's language.",
              },
              {
                label: "Strategy",
                color: "text-accent-red",
                description:
                  "Business objectives, KPIs, growth trajectories, and decision frameworks. Every autonomous action aligns with your strategic direction.",
              },
            ].map((item, i) => (
              <FadeUp key={item.label} delay={i * 0.1}>
                <div className="glass rounded-lg p-8">
                  <span className={`font-mono text-xs uppercase tracking-[0.3em] ${item.color}`}>
                    {item.label}
                  </span>
                  <p className="text-text-muted leading-relaxed mt-3">
                    {item.description}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </Container>
      </Section>

      {/* The Goal */}
      <Section className="relative z-10 py-32">
        <Container className="text-center">
          <FadeUp>
            <SectionTopic>The Center</SectionTopic>
            <h2 className="monolith-title text-[clamp(2rem,5vw,3.5rem)] font-black leading-[0.9] tracking-[-0.03em] uppercase mb-6">
              Autonomous<br />Execution
            </h2>
            <p className="text-text-muted max-w-[560px] mx-auto leading-relaxed">
              At the center of convergence sits your autonomous workforce — agents that
              don&apos;t just process tasks, but operate with the full dimensional
              understanding of your business. This is what makes AaaS different.
            </p>
          </FadeUp>
        </Container>
      </Section>

      <CTABlock />
    </>
  );
}
