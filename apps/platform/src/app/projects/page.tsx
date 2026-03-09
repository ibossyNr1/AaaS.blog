import type { Metadata } from "next";
import { Button, Card, Badge, Container, Section } from "@aaas/ui";
import { FadeUp } from "@/components/motion";
import { CTABlock } from "@/components/cta-block";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Projects | Agent-as-a-Service",
  description: "Live projects powered by AaaS infrastructure. Explore Enora.ai and more.",
  openGraph: { title: "AaaS Projects", description: "What We're Building" },
};

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const otherProjects = [
  {
    title: "AaaS Vault",
    status: "Live",
    description:
      "A living knowledge base of 4,200+ structured business assets — personas, frameworks, templates — all agent-ready.",
  },
  {
    title: "Global Skill Repository",
    status: "Live",
    description:
      "Community-driven library of reusable agent skills. From LinkedIn outreach to financial modeling — plug and play.",
  },
  {
    title: "Context Engine v2",
    status: "In Development",
    description:
      "Next-gen context structuring with auto-discovery, real-time market data ingestion, and self-optimizing schemas.",
  },
];

export default function ProjectsPage() {
  return (
    <>
      {/* Hero */}
      <Section className="pt-32 pb-12">
        <Container className="text-center">
          <FadeUp>
            <Badge className="mb-4">
              Projects
            </Badge>
            <h1 className="monolith-title text-4xl md:text-6xl font-bold mb-4 uppercase tracking-tight">
              What We&apos;re Building
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Live projects powered by AaaS infrastructure. Each one pushes the
              boundary of what autonomous agents can accomplish.
            </p>
          </FadeUp>
        </Container>
      </Section>

      {/* Featured: Enora.ai */}
      <Section className="py-12">
        <Container>
          <FadeUp>
            <Card className="relative overflow-hidden glow-circuit">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge>Featured</Badge>
                    <Badge>Live</Badge>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
                    Enora.ai
                  </h2>
                  <p className="text-text-muted leading-relaxed mb-6 max-w-2xl">
                    Lighthouse manufacturing intelligence platform. Enora
                    ingests unstructured factory telemetry, applies ISO 9001
                    compliance frameworks, and delivers actionable insights to
                    production managers — all through an autonomous agent
                    workforce built on AaaS.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Badge>Manufacturing</Badge>
                    <Badge>Compliance</Badge>
                    <Badge>Telemetry</Badge>
                  </div>
                </div>
                <div className="lg:text-right shrink-0">
                  <a
                    href={BOOKING_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button>Learn More</Button>
                  </a>
                </div>
              </div>
            </Card>
          </FadeUp>
        </Container>
      </Section>

      {/* Other Projects */}
      <Section variant="surface">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherProjects.map((project, i) => (
              <FadeUp key={project.title} delay={i * 0.1}>
                <Card className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge>{project.status}</Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-text mb-2">
                    {project.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed flex-grow">
                    {project.description}
                  </p>
                </Card>
              </FadeUp>
            ))}

            {/* Your Project CTA */}
            <FadeUp delay={0.3}>
              <Card className="h-full flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-semibold text-text mb-2">
                  Your Project?
                </h3>
                <p className="text-sm text-text-muted mb-6">
                  Have a venture that could benefit from autonomous agents?
                  Let&apos;s build it together.
                </p>
                <Link href="/collaborate">
                  <Button variant="secondary">Collaborate →</Button>
                </Link>
              </Card>
            </FadeUp>
          </div>
        </Container>
      </Section>

      <CTABlock />
    </>
  );
}
