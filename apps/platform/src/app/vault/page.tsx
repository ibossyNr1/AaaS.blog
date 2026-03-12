"use client";

import { useState } from "react";
import { Container, DataTape, cn } from "@aaas/ui";
import { FadeUp, CountUp } from "@/components/motion";
import { CTABlock } from "@/components/cta-block";

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
      {/* Monolith Container */}
      <div className="monolith-container border-t border-b border-border mt-16">
        <div className="grid grid-cols-12 gap-px bg-border">

          {/* Bedrock Hero — full width */}
          <div
            className="col-span-12 relative overflow-hidden bg-base min-h-[60vh] flex flex-col justify-center px-8 md:px-16 py-20"
            style={{
              background: "radial-gradient(circle at 50% -20%, rgb(var(--basalt-bright)) 0%, rgb(var(--basalt-deep)) 70%)",
            }}
          >
            {/* Tectonic grid */}
            <div
              className="absolute top-8 right-8 w-[280px] h-[280px] pointer-events-none opacity-[0.12]"
              style={{
                backgroundImage: "linear-gradient(rgb(var(--basalt-bright)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--basalt-bright)) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                transform: "perspective(500px) rotateX(60deg) rotateZ(-20deg)",
              }}
            />
            <FadeUp>
              <h1
                className="monolith-title font-black leading-[0.85] tracking-[-0.05em] uppercase mb-8"
                style={{ fontSize: "clamp(3.5rem, 12vw, 9rem)" }}
              >
                THE<br />VAULT.
              </h1>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end max-w-4xl">
                <p className="text-text-muted font-mono text-sm leading-relaxed max-w-[500px]">
                  A living knowledge base of 4,200+ structured business assets — personas, frameworks, templates,
                  strategies, and prompt packs. All machine-readable. All agent-ready. The collective intelligence
                  of every AaaS deployment, distilled and structured.
                </p>
                <div className="flex gap-4">
                  <a href="/collaborate" className="bedrock-btn inline-block">
                    Access The Vault
                  </a>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Data Tape */}
          <div className="col-span-12 bg-base">
            <DataTape items={tapeItems} />
          </div>

          {/* Stats strip — 4 blocks */}
          {stats.map((s) => (
            <div key={s.label} className="col-span-6 md:col-span-3 bg-base p-8 text-center">
              <div className="text-3xl font-bold font-mono text-circuit">
                <CountUp end={s.value} suffix={s.suffix} />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted mt-2">
                {s.label}
              </div>
            </div>
          ))}

          {/* Search + Filters — full width */}
          <div className="col-span-12 bg-base p-8">
            <Container className="max-w-3xl">
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Search the vault..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-14 px-6 bg-surface rounded-sm text-text font-mono border border-border placeholder:text-text-muted focus:outline-none focus:border-circuit/50 transition-all"
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
                        ? "border-accent-red text-accent-red bg-accent-red/5 shadow-[0_0_12px_var(--accent-red-dim)]"
                        : "border-border text-text-muted hover:text-text hover:border-text/20"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </Container>
          </div>

          {/* Vault entries — monolith grid */}
          {filtered.map((entry, i) => (
            <div
              key={`${entry.name}-${i}`}
              className="col-span-12 md:col-span-6 lg:col-span-4 bg-base p-8 group relative overflow-hidden transition-all duration-500 ease-liquid hover:bg-surface cursor-pointer"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
                e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
              }}
            >
              {/* Mouse spotlight */}
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(244, 63, 108, 0.1) 0%, transparent 50%)",
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-accent-red">
                    {entry.type}
                  </span>
                  <span className="font-mono text-[10px] text-text-muted">
                    {entry.metric}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-text uppercase mb-2 group-hover:text-circuit transition-colors">
                  {entry.name}
                </h3>
                <p className="text-xs font-mono text-text-muted leading-relaxed">
                  {entry.description}
                </p>
              </div>
            </div>
          ))}

          {/* Self-Optimizing Repository — wide block */}
          <div
            className="col-span-12 lg:col-span-8 bg-base p-8 md:p-12 relative overflow-hidden"
            style={{
              background: "radial-gradient(circle at 80% 20%, rgb(var(--basalt-bright) / 0.5) 0%, rgb(var(--basalt-deep)) 60%)",
            }}
          >
            <FadeUp>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-accent-red mb-4 block">
                Innovation Engine
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-text uppercase leading-[0.9] tracking-tight mb-6">
                Self-Optimizing<br />Repository
              </h2>
              <p className="text-text-muted font-mono text-sm leading-relaxed max-w-[500px] mb-8">
                Every client is effectively an R&D engineer for AaaS. When users create
                effective skills and workflows, they&apos;re automatically evaluated,
                sanitized, and merged back — making the platform smarter for everyone.
              </p>
            </FadeUp>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {selfOptimizingSteps.map((step, i) => (
                <FadeUp key={step.number} delay={i * 0.1}>
                  <div className="text-center">
                    <div className="font-mono text-2xl font-bold text-circuit mb-2">{step.number}</div>
                    <h3 className="font-bold text-text uppercase text-sm mb-2">{step.title}</h3>
                    <p className="text-[11px] font-mono text-text-muted leading-relaxed">{step.text}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>

          {/* System readout — side block */}
          <div className="col-span-12 lg:col-span-4 bg-base p-8 flex flex-col justify-center border-t lg:border-t-0 border-border">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-circuit mb-4 block">
              System Readout
            </span>
            <div className="font-mono text-xs text-text-muted leading-[1.8] border border-border p-6 whitespace-pre-line">
{`VAULT_STATUS: ONLINE
ENTRIES_INDEXED: 4,200+
CATEGORIES: 7
GOVERNANCE: AUTOMATED
SANITIZATION: ACTIVE
SYNC_INTERVAL: REAL-TIME
AGENT_ACCESS: UNIVERSAL
SUBSTRATE: BEDROCK_v2.4`}
            </div>
          </div>

        </div>
      </div>

      <CTABlock />
    </>
  );
}
