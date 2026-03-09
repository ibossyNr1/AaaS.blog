import { Card, Container, Section } from "@aaas/ui";
import { FadeUp } from "./motion";
import Link from "next/link";

const pillars = [
  {
    title: "Context Engineering",
    description:
      "Turn strategy docs, brand guides, and domain knowledge into structured, machine-readable context. Your agents understand your business — not just generic prompts.",
    link: "/platform#context",
  },
  {
    title: "Connect Any Tool",
    description:
      "MCPs, APIs, GitHub, Slack, databases — agents use your full toolchain. No walled gardens, no vendor lock-in. Your stack, amplified.",
    link: "/platform#tools",
  },
  {
    title: "Execute Autonomously",
    description:
      "Agents complete complex tasks end-to-end, learning from every cycle. From market research to outreach to compliance — they handle the work.",
    link: "/platform#execute",
  },
];

export function ThreePillars() {
  return (
    <Section>
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, i) => (
            <FadeUp key={pillar.title} delay={i * 0.1}>
              <Card className="h-full flex flex-col">
                <h3 className="text-xl font-semibold text-text mb-3">
                  {pillar.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed flex-grow">
                  {pillar.description}
                </p>
                <Link
                  href={pillar.link}
                  className="mt-6 text-sm font-mono uppercase tracking-wider text-circuit hover:text-glow transition-all"
                >
                  Learn more →
                </Link>
              </Card>
            </FadeUp>
          ))}
        </div>
      </Container>
    </Section>
  );
}
