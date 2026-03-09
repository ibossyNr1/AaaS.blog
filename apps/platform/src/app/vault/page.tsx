"use client";

import { useState } from "react";
import { Card, Badge, Container, Section, cn } from "@aaas/ui";
import { FadeUp } from "@/components/motion";
import { CTABlock } from "@/components/cta-block";

const categories = [
  "All",
  "Personas",
  "Frameworks",
  "Templates",
  "Strategies",
  "Research",
];

const vaultEntries = [
  {
    type: "Persona",
    name: "Tech Startup Founder",
    metric: "Used by 12 agents",
    category: "Personas",
  },
  {
    type: "Framework",
    name: "Jobs-to-be-Done Analysis",
    metric: "340 applications",
    category: "Frameworks",
  },
  {
    type: "Template",
    name: "Cold Outreach Sequence",
    metric: "89.4k calls",
    category: "Templates",
  },
  {
    type: "Strategy",
    name: "Go-to-Market Playbook",
    metric: "127 deployments",
    category: "Strategies",
  },
  {
    type: "Research",
    name: "AI Market Landscape 2026",
    metric: "2.1k reads",
    category: "Research",
  },
  {
    type: "Persona",
    name: "Enterprise CTO",
    metric: "Used by 8 agents",
    category: "Personas",
  },
  {
    type: "Framework",
    name: "Brand Voice Matrix",
    metric: "560 applications",
    category: "Frameworks",
  },
  {
    type: "Template",
    name: "LinkedIn Viral Loop",
    metric: "142.1k calls",
    category: "Templates",
  },
  {
    type: "Strategy",
    name: "Pricing Model Canvas",
    metric: "93 deployments",
    category: "Strategies",
  },
];

const stats = [
  { value: "4,200+", label: "Total Entries" },
  { value: "5", label: "Categories" },
  { value: "142k+", label: "Total Usage" },
  { value: "12+", label: "Active Agents" },
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
      {/* Hero */}
      <Section className="pt-32 pb-12">
        <Container className="text-center">
          <FadeUp>
            <Badge className="mb-4">
              The Vault
            </Badge>
            <h1 className="monolith-title text-4xl md:text-6xl font-bold mb-4 uppercase tracking-tight">
              Structured Intelligence
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Browse the living knowledge base that powers every agent.
              Personas, frameworks, templates, and strategies — all
              machine-readable.
            </p>
          </FadeUp>
        </Container>
      </Section>

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
                className="w-full h-14 px-6 bg-surface border border-[rgba(255,255,255,0.05)] text-text font-mono placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-circuit/50 focus:border-circuit/30 transition-all"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 py-2 text-sm font-mono uppercase tracking-wider transition-all border",
                    activeCategory === cat
                      ? "border-circuit text-circuit bg-circuit/5"
                      : "border-[rgba(255,255,255,0.05)] text-text-muted hover:text-text hover:border-text/20"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </FadeUp>
        </Container>
      </Section>

      {/* Grid */}
      <Section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((entry, i) => (
              <FadeUp key={`${entry.name}-${i}`} delay={i * 0.05}>
                <Card className="cursor-pointer">
                  <Badge className="mb-3">
                    {entry.type}
                  </Badge>
                  <h3 className="text-lg font-semibold text-text mb-2">
                    {entry.name}
                  </h3>
                  <p className="text-sm text-text-muted font-mono">
                    {entry.metric}
                  </p>
                </Card>
              </FadeUp>
            ))}
          </div>
        </Container>
      </Section>

      {/* Stats */}
      <Section variant="surface" className="py-16">
        <Container>
          <FadeUp>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-bold font-mono text-circuit">
                    {s.value}
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
