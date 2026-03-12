import type { Metadata } from "next";
import { Button, Card, Badge, Container, Section, TerminalFeed } from "@aaas/ui";
import { FadeUp } from "@/components/motion";
import { CTABlock } from "@/components/cta-block";
import { OrbitalBackground } from "@/components/orbital-background";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Projects | Agent-as-a-Service",
  description: "Live projects powered by AaaS infrastructure. Explore Enora-AI and more.",
  openGraph: { title: "AaaS Projects", description: "What We're Building" },
};

const otherProjects = [
  {
    title: "AaaS Vault",
    status: "Live",
    statusColor: "emerald" as const,
    description:
      "A living knowledge base of 4,200+ structured business assets — personas, frameworks, templates — all agent-ready and community-curated.",
    stats: "4,200+ entries",
  },
  {
    title: "Global Skill Repository",
    status: "Live",
    statusColor: "emerald" as const,
    description:
      "Community-driven library of reusable agent skills. From LinkedIn outreach to financial modeling — plug, configure, and deploy.",
    stats: "340+ skills",
  },
  {
    title: "Context Engine v2",
    status: "In Development",
    statusColor: "circuit" as const,
    description:
      "Next-gen context structuring with auto-discovery, real-time market data ingestion, and self-optimizing schemas that evolve with your business.",
    stats: "847K vectors",
  },
  {
    title: "Supra-forge Platform",
    status: "Planning",
    statusColor: "red" as const,
    description:
      "The venture studio orchestration layer. Multi-project management, shared context pools, and cross-venture intelligence sharing.",
    stats: "Q3 2026",
  },
];

export default function ProjectsPage() {
  return (
    <>
      <OrbitalBackground minimal planetScale={20} offset={{ x: -20, y: -5 }} />
      {/* Hero — Aura */}
      <Section className="relative pt-32 pb-16 overflow-hidden z-10">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-1/4 w-48 md:w-96 h-48 md:h-96 rounded-full bg-circuit/6 blur-3xl animate-aura-drift" />
          <div className="absolute bottom-0 left-1/3 w-36 md:w-72 h-36 md:h-72 rounded-full bg-accent-red/5 blur-3xl animate-aura-drift" style={{ animationDelay: "4s" }} />
        </div>

        <Container className="relative z-10 text-center">
          <FadeUp>
            <Badge variant="red" className="mb-4">Projects</Badge>
            <h1 className="monolith-title text-4xl md:text-6xl font-black mb-4 uppercase tracking-tight">
              What We&apos;re Building
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Live projects powered by AaaS infrastructure. Each one pushes the
              boundary of what autonomous agents can accomplish — and proves the
              platform in production.
            </p>
          </FadeUp>
        </Container>
      </Section>

      {/* Featured: Enora-AI — Glass */}
      <Section className="py-12 relative z-10" divider="red">
        <Container>
          <FadeUp>
            <Card variant="glass" spotlight className="relative overflow-hidden p-0">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                {/* Content */}
                <div className="lg:col-span-3 p-8 lg:p-12">
                  <div className="flex items-center gap-3 mb-6">
                    <Badge variant="red">Featured</Badge>
                    <Badge>Live</Badge>
                    <span className="w-2 h-2 rounded-full bg-circuit animate-pulse-dot shadow-[0_0_8px_rgb(var(--circuit-glow))]" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-text mb-4">
                    Enora-AI
                  </h2>
                  <p className="text-sm font-mono text-accent-red/60 uppercase tracking-wider mb-4">
                    Manufacturing Intelligence Platform
                  </p>
                  <p className="text-text-muted leading-relaxed mb-6 max-w-xl">
                    Lighthouse manufacturing intelligence platform built entirely on AaaS.
                    Enora ingests unstructured factory telemetry — sensor data, production
                    logs, quality reports, video feeds — applies ISO 9001 compliance frameworks,
                    and delivers actionable insights to production managers through an
                    autonomous agent workforce.
                  </p>
                  <p className="text-text-muted leading-relaxed mb-8 max-w-xl">
                    ERPs are blind to unstructured data. Enora sees everything. Deployed
                    &quot;Prompt Packs&quot; for ISO 9001 auditing, supply chain assessment,
                    and predictive maintenance — all running on the AaaS context engine.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    <Badge>Manufacturing</Badge>
                    <Badge variant="red">ISO 9001</Badge>
                    <Badge>Telemetry</Badge>
                    <Badge>Predictive</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div>
                      <div className="font-mono text-xl font-bold text-circuit">98.7%</div>
                      <div className="text-[10px] font-mono text-text-muted uppercase">Compliance</div>
                    </div>
                    <div>
                      <div className="font-mono text-xl font-bold text-accent-red">24/7</div>
                      <div className="text-[10px] font-mono text-text-muted uppercase">Monitoring</div>
                    </div>
                    <div>
                      <div className="font-mono text-xl font-bold text-accent-teal">-40%</div>
                      <div className="text-[10px] font-mono text-text-muted uppercase">Audit Time</div>
                    </div>
                  </div>
                  <a
                    href="https://www.supra-forge.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="red">Learn More About Enora</Button>
                  </a>
                </div>

                {/* Terminal feed */}
                <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-border p-6 flex items-center">
                  <TerminalFeed maxLines={10} className="w-full" />
                </div>
              </div>
            </Card>
          </FadeUp>
        </Container>
      </Section>

      {/* Project Bento Grid */}
      <Section variant="surface" divider className="relative z-10">
        <Container>
          <FadeUp>
            <h2 className="monolith-title text-3xl font-black text-center mb-12 uppercase tracking-tight">
              Ecosystem Projects
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {otherProjects.map((project, i) => (
              <FadeUp key={project.title} delay={i * 0.08}>
                <Card variant="glass" spotlight className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={project.statusColor === "red" ? "red" : "circuit"}>
                      {project.status}
                    </Badge>
                    <span className="font-mono text-xs text-circuit/40">{project.stats}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-text mb-3">
                    {project.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed flex-grow">
                    {project.description}
                  </p>
                </Card>
              </FadeUp>
            ))}

            {/* Your Project CTA */}
            <FadeUp delay={0.4}>
              <Card
                variant="glass"
                className="h-full flex flex-col items-center justify-center text-center md:col-span-2 border-dashed"
              >
                <p className="outline-text text-4xl font-black uppercase tracking-tight mb-4">
                  Your Project
                </p>
                <p className="text-sm text-text-muted mb-6 max-w-md">
                  Have a venture that could benefit from autonomous agents?
                  We deploy our full AaaS infrastructure in exchange for equity
                  alignment. Your domain expertise, our AI muscle.
                </p>
                <Link href="/collaborate">
                  <Button variant="red">Collaborate →</Button>
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
