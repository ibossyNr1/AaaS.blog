import type { Metadata } from "next";
import { Button, Card, Badge, Container, Section } from "@aaas/ui";
import { FadeUp } from "@/components/motion";
import { CTABlock } from "@/components/cta-block";

export const metadata: Metadata = {
  title: "Collaborate | Agent-as-a-Service",
  description: "Invest in or co-innovate with AaaS. Two paths to partnership.",
  openGraph: { title: "Collaborate with AaaS", description: "Build the Future With Us" },
};

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const equitySteps = [
  {
    number: "01",
    title: "Discover",
    description:
      "We evaluate your venture's potential, market opportunity, and how autonomous agents can accelerate your trajectory.",
  },
  {
    number: "02",
    title: "Deploy",
    description:
      "Full AaaS platform deployment with custom context engineering, agent workflows, and tool integrations tailored to your business.",
  },
  {
    number: "03",
    title: "Grow",
    description:
      "Ongoing strategic support, agent optimization, and infrastructure scaling as your venture grows. We succeed when you succeed.",
  },
];

export default function CollaboratePage() {
  return (
    <>
      {/* Hero */}
      <Section className="pt-32 pb-12">
        <Container className="text-center">
          <FadeUp>
            <Badge className="mb-4">
              Collaborate
            </Badge>
            <h1 className="monolith-title text-4xl md:text-6xl font-bold mb-4 uppercase tracking-tight">
              Build the Future With Us
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Two paths to partnership. Whether you&apos;re investing in AI
              infrastructure or building a venture that needs it — we&apos;re
              looking for aligned partners.
            </p>
          </FadeUp>
        </Container>
      </Section>

      {/* Two Cards */}
      <Section className="py-12">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FadeUp>
              <Card className="h-full flex flex-col glow-circuit">
                <Badge className="mb-4 self-start">
                  For Investors
                </Badge>
                <h2 className="text-2xl font-bold text-text mb-4">Invest</h2>
                <p className="text-text-muted leading-relaxed mb-6 flex-grow">
                  AaaS is building the operating system for autonomous business
                  operations. We&apos;re seeking strategic investors who
                  understand that the future of work is agentic — and want to be
                  part of building it.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Pre-seed stage with live product",
                    "Revenue-generating projects",
                    "Growing enterprise pipeline",
                    "Unique context engineering moat",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-text-muted"
                    >
                      <span className="text-circuit mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={BOOKING_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full">Investor Conversation</Button>
                </a>
              </Card>
            </FadeUp>

            <FadeUp delay={0.1}>
              <Card className="h-full flex flex-col glow-circuit">
                <Badge className="mb-4 self-start">
                  For Ventures
                </Badge>
                <h2 className="text-2xl font-bold text-text mb-4">
                  Co-Innovate
                </h2>
                <p className="text-text-muted leading-relaxed mb-6 flex-grow">
                  Have a venture that could be supercharged with autonomous
                  agents? We deploy our full platform in exchange for equity
                  alignment. Your domain expertise + our AI infrastructure.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Full AaaS platform deployment",
                    "Custom agent development",
                    "Equity-based partnership",
                    "Ongoing strategic advisory",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-text-muted"
                    >
                      <span className="text-circuit mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={BOOKING_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="secondary" className="w-full">
                    Explore Partnership
                  </Button>
                </a>
              </Card>
            </FadeUp>
          </div>
        </Container>
      </Section>

      {/* Equity Model Timeline */}
      <Section variant="surface">
        <Container>
          <FadeUp>
            <h2 className="monolith-title text-3xl md:text-4xl font-bold text-center mb-16 uppercase tracking-tight">
              The Equity Model
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {equitySteps.map((step, i) => (
              <FadeUp key={step.number} delay={i * 0.1}>
                <div className="text-center">
                  <div className="w-16 h-16 border border-circuit/20 bg-circuit/5 flex items-center justify-center mx-auto mb-6">
                    <span className="text-circuit font-mono font-bold text-lg">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-text mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </Container>
      </Section>

      <CTABlock />
    </>
  );
}
