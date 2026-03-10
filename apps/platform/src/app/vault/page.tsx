"use client";

import { useState } from "react";
import { Card, Badge, Container, Section, DataTape, cn } from "@aaas/ui";
import { FadeUp, CountUp } from "@/components/motion";
import { CTABlock } from "@/components/cta-block";
import { CircuitBackground } from "@/components/circuit-background";

const categories = [
  "All",
  "Personas",
  "Frameworks",
  "Templates",
  "Strategies",
  "Research",
  "Prompt Packs",
];

const vaultEntries = [
  {
    type: "Persona",
    name: "Tech Startup Founder",
    metric: "Used by 12 agents",
    category: "Personas",
    description: "Complete behavioral profile, decision patterns, pain points, and communication preferences for B2B SaaS founders.",
  },
  {
    type: "Framework",
    name: "Jobs-to-be-Done Analysis",
    metric: "340 applications",
    category: "Frameworks",
    description: "Structured JTBD framework with outcome-driven innovation scoring and competitive displacement mapping.",
  },
  {
    type: "Template",
    name: "Cold Outreach Sequence",
    metric: "89.4k calls",
    category: "Templates",
    description: "12-touch multi-channel outreach sequence with context-adaptive personalization hooks and follow-up logic.",
  },
  {
    type: "Strategy",
    name: "Go-to-Market Playbook",
    metric: "127 deployments",
    category: "Strategies",
    description: "Full GTM execution plan: ICP definition, channel strategy, messaging matrix, and launch timeline.",
  },
  {
    type: "Research",
    name: "AI Market Landscape 2026",
    metric: "2.1k reads",
    category: "Research",
    description: "Comprehensive market map of 400+ AI companies, funding trends, technology shifts, and competitive dynamics.",
  },
  {
    type: "Persona",
    name: "Enterprise CTO",
    metric: "Used by 8 agents",
    category: "Personas",
    description: "Technical leadership profile: evaluation criteria, vendor selection patterns, security concerns, and budget cycles.",
  },
  {
    type: "Framework",
    name: "Brand Voice Matrix",
    metric: "560 applications",
    category: "Frameworks",
    description: "Multi-dimensional brand voice definition: tone spectrum, vocabulary constraints, messaging pillars, and channel adaptation rules.",
  },
  {
    type: "Template",
    name: "LinkedIn Viral Loop",
    metric: "142.1k calls",
    category: "Templates",
    description: "Comment-to-lead viral content template with engagement triggers, CTA optimization, and automated funnel entry.",
  },
  {
    type: "Strategy",
    name: "Pricing Model Canvas",
    metric: "93 deployments",
    category: "Strategies",
    description: "Value-based pricing framework with competitive positioning, tier design, and psychological anchor optimization.",
  },
  {
    type: "Prompt Pack",
    name: "ISO 9001 Audit Suite",
    metric: "47 deployments",
    category: "Prompt Packs",
    description: "Complete ISO 9001 compliance audit prompts: gap analysis, document review, corrective action tracking.",
  },
  {
    type: "Prompt Pack",
    name: "Supply Chain Assessment",
    metric: "28 deployments",
    category: "Prompt Packs",
    description: "Multi-tier supplier evaluation with risk scoring, compliance verification, and alternative sourcing recommendations.",
  },
  {
    type: "Research",
    name: "Agentic Framework Comparison",
    metric: "890 reads",
    category: "Research",
    description: "Head-to-head analysis of LangChain, CrewAI, AutoGen, and custom orchestration approaches. Performance benchmarks included.",
  },
];

const stats = [
  { value: 4200, suffix: "+", label: "Total Entries" },
  { value: 7, suffix: "", label: "Categories" },
  { value: 142, suffix: "k+", label: "Total Usage" },
  { value: 12, suffix: "+", label: "Active Agents" },
];

const selfOptimizingSteps = [
  { number: "01", title: "Create", text: "Users build custom skills, workflows, and context modules for their specific business challenges." },
  { number: "02", title: "Validate", text: "Automated governance evaluates effectiveness, robustness, and quality before promotion." },
  { number: "03", title: "Sanitize", text: "Private data is stripped. Universal patterns are extracted. The skill becomes portable." },
  { number: "04", title: "Merge", text: "Validated skills are pushed to the main repository. Every client benefits. The vault grows smarter." },
];

const tapeItems = [
  "PERSONAS: 840+",
  "FRAMEWORKS: 620+",
  "TEMPLATES: 1,200+",
  "STRATEGIES: 380+",
  "RESEARCH: 760+",
  "PROMPT PACKS: 400+",
  "UPDATED: REAL-TIME",
  "AGENT-READY: ALL ENTRIES",
];

export default function VaultPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = vaultEntries.filter((entry) => {
    const matchesCategory =
      activeCategory === "All" || entry.category === activeCategory;
    const matchesSearch =
      !search ||
      entry.name.toLowerCase().includes(search.toLowerCase()) ||
      entry.type.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <CircuitBackground />
      {/* Hero — Metaball */}
      <Section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 left-1/3 w-48 md:w-96 h-48 md:h-96 rounded-full bg-circuit/6 blur-3xl animate-aura-drift" />
          <div className="absolute bottom-0 right-1/4 w-36 md:w-72 h-36 md:h-72 rounded-full bg-accent-red/5 blur-3xl animate-aura-drift" style={{ animationDelay: "2s" }} />
        </div>

        <Container className="relative z-10 text-center">
          <FadeUp>
            <Badge className="mb-4">The Vault</Badge>
            <h1 className="monolith-title text-4xl md:text-6xl font-bold mb-4 uppercase tracking-tight">
              Structured<br />Intelligence
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Browse the living knowledge base that powers every agent.
              4,200+ structured business assets — personas, frameworks, templates,
              strategies, and prompt packs — all machine-readable, all agent-ready.
            </p>
          </FadeUp>
        </Container>
      </Section>

      <DataTape items={tapeItems} />

      {/* Search + Filters */}
      <Section className="py-8">
        <Container className="max-w-3xl">
          <FadeUp>
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search the vault..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-14 px-6 glass rounded-lg text-text font-mono placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-circuit/50 transition-all"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 py-2 text-sm font-mono uppercase tracking-wider transition-all duration-300 border rounded-sm",
                    activeCategory === cat
                      ? "border-circuit text-circuit bg-circuit/5 shadow-[0_0_12px_var(--circuit-dim)]"
                      : "border-border text-text-muted hover:text-text hover:border-text/20"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </FadeUp>
        </Container>
      </Section>

      {/* Bento Grid */}
      <Section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((entry, i) => (
              <FadeUp key={`${entry.name}-${i}`} delay={i * 0.04}>
                <Card variant="glass" spotlight className="cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={entry.type === "Prompt Pack" ? "red" : "circuit"}>
                      {entry.type}
                    </Badge>
                    <span className="font-mono text-[10px] text-text-muted">
                      {entry.metric}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-text mb-2 group-hover:text-circuit transition-colors">
                    {entry.name}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {entry.description}
                  </p>
                </Card>
              </FadeUp>
            ))}
          </div>
        </Container>
      </Section>

      {/* Self-Optimizing Repository */}
      <Section variant="bedrock" divider="red">
        <Container>
          <FadeUp>
            <div className="text-center mb-12">
              <Badge variant="red" className="mb-4">Innovation Engine</Badge>
              <h2 className="monolith-title text-3xl md:text-4xl font-bold mb-4 uppercase tracking-tight">
                Self-Optimizing Repository
              </h2>
              <p className="text-text-muted max-w-2xl mx-auto">
                Every client is effectively an R&D engineer for AaaS. When users create
                effective skills and workflows, they&apos;re automatically evaluated,
                sanitized, and merged back — making the platform smarter for everyone.
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {selfOptimizingSteps.map((step, i) => (
              <FadeUp key={step.number} delay={i * 0.1}>
                <Card variant="glass" className="text-center">
                  <div className="font-mono text-2xl font-bold text-circuit mb-3">{step.number}</div>
                  <h3 className="font-semibold text-text mb-2">{step.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{step.text}</p>
                </Card>
              </FadeUp>
            ))}
          </div>
        </Container>
      </Section>

      {/* Stats */}
      <Section variant="surface" className="py-16" divider>
        <Container>
          <FadeUp>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((s) => (
                <div key={s.label} className="group">
                  <div className="text-3xl font-bold font-mono text-circuit group-hover:text-glow transition-all">
                    <CountUp end={s.value} suffix={s.suffix} />
                  </div>
                  <div className="font-mono text-xs uppercase tracking-wider text-text-muted mt-2">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
        </Container>
      </Section>

      <CTABlock />
    </>
  );
}
