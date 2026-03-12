"use client";

import { useState } from "react";
import { Card, cn } from "@aaas/ui";
import { AGENTS } from "@/lib/doc-data";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface LayerSection {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  borderColor: string;
  bgColor: string;
  items: string[];
}

interface AgentCategory {
  name: string;
  color: string;
  agents: string[];
}

/* -------------------------------------------------------------------------- */
/*  Data                                                                       */
/* -------------------------------------------------------------------------- */

const LAYERS: LayerSection[] = [
  {
    id: "client",
    title: "Client Layer",
    subtitle: "Browser / SDK / Webhooks",
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/5",
    items: [
      "React SPA (Next.js App Router)",
      "Server-rendered pages with streaming",
      "JavaScript SDK for third-party integration",
      "Webhook consumers receiving event payloads",
      "OpenAPI spec for code generation",
    ],
  },
  {
    id: "api",
    title: "API Layer",
    subtitle: "Next.js API Routes",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/5",
    items: [
      "RESTful API routes under /api/*",
      "Rate limiting via x-api-key validation",
      "User context via x-user-id header",
      "Server-side caching with revalidation",
      "SSE endpoint for real-time events",
    ],
  },
  {
    id: "services",
    title: "Service Layer",
    subtitle: "Business Logic & AI",
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/5",
    items: [
      "Entity CRUD with validation",
      "Hybrid search (keyword + semantic)",
      "AI conversational query (Gemini)",
      "Recommendation engine (collaborative filtering)",
      "Achievement & gamification engine",
    ],
  },
  {
    id: "data",
    title: "Data Layer",
    subtitle: "Firestore + Pinecone",
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/5",
    items: [
      "Cloud Firestore (38 collections)",
      "Pinecone vector index (1536-dim embeddings)",
      "Real-time listeners for live updates",
      "Composite indexes for complex queries",
      "Security rules with public read access",
    ],
  },
  {
    id: "agents",
    title: "Agent Layer",
    subtitle: "32 Autonomous Agents",
    color: "text-circuit",
    borderColor: "border-circuit/30",
    bgColor: "bg-circuit/5",
    items: [
      "Scheduled execution (daily / weekly)",
      "Idempotent operations with logging",
      "Auto-healing for data issues",
      "Enrichment pipeline (metadata, summaries, embeddings)",
      "Analytics aggregation and anomaly detection",
    ],
  },
];

function getAgentCategories(): AgentCategory[] {
  const grouped: Record<string, string[]> = {};
  for (const a of AGENTS) {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a.name);
  }

  const colorMap: Record<string, string> = {
    Core: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Freshness: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Ranking: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Classification: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    Intelligence: "bg-circuit/15 text-circuit border-circuit/30",
    Comparison: "bg-pink-500/15 text-pink-400 border-pink-500/30",
    Media: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    Pipeline: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    Analytics: "bg-red-500/15 text-red-400 border-red-500/30",
    Engagement: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  };

  return Object.entries(grouped).map(([name, agents]) => ({
    name,
    color: colorMap[name] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    agents,
  }));
}

const INTEGRATIONS = [
  {
    title: "Webhooks",
    description: "Event-driven HTTP callbacks for entity changes, agent completions, and system events",
    details: ["Configurable event filters", "Automatic retries with exponential backoff", "HMAC signature verification", "Delivery logs and debugging"],
  },
  {
    title: "Plugins",
    description: "Workspace-scoped integrations for extending platform capabilities",
    details: ["Custom data sources", "Third-party tool connectors", "Workspace-level configuration", "Permission-scoped access"],
  },
  {
    title: "SDK",
    description: "JavaScript/TypeScript SDK for programmatic access to the knowledge index",
    details: ["Type-safe API client", "Auto-generated from OpenAPI spec", "Search and entity operations", "Webhook management helpers"],
  },
  {
    title: "Embeds",
    description: "Embeddable widgets for displaying entities, leaderboards, and badges",
    details: ["Entity card embeds", "Leaderboard widgets", "Badge images (SVG)", "Customizable themes"],
  },
];

/* -------------------------------------------------------------------------- */
/*  Components                                                                 */
/* -------------------------------------------------------------------------- */

function ExpandableSection({
  title,
  subtitle,
  color,
  borderColor,
  bgColor,
  items,
  index,
  totalLayers,
}: LayerSection & { index: number; totalLayers: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      {/* Connector arrow */}
      {index < totalLayers - 1 && (
        <div className="absolute left-1/2 -bottom-6 z-10 flex -translate-x-1/2 flex-col items-center">
          <div className="h-4 w-px bg-border" />
          <div className="h-0 w-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-border" />
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full rounded-lg border p-4 text-left transition-all",
          borderColor,
          bgColor,
          expanded && "ring-1 ring-offset-0",
          expanded && borderColor.replace("/30", "/50"),
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={cn("text-base font-semibold", color)}>{title}</h3>
            <p className="text-xs text-text-muted">{subtitle}</p>
          </div>
          <span
            className={cn(
              "text-lg transition-transform",
              color,
              expanded ? "rotate-45" : "rotate-0",
            )}
          >
            +
          </span>
        </div>

        {expanded && (
          <ul className="mt-4 space-y-1.5 border-t border-border/30 pt-3">
            {items.map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-text-muted">
                <span className={cn("inline-block h-1 w-1 rounded-full", color.replace("text-", "bg-"))} />
                {item}
              </li>
            ))}
          </ul>
        )}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function ArchitectureClient() {
  const agentCategories = getAgentCategories();

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-2 flex items-center gap-2">
            <a
              href="/docs"
              className="text-sm text-text-muted transition-colors hover:text-circuit"
            >
              Docs
            </a>
            <span className="text-text-muted/40">/</span>
            <span className="text-sm text-text">Architecture</span>
          </div>
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-text">
            System Architecture
          </h1>
          <p className="text-sm text-text-muted">
            Interactive overview of the AaaS Knowledge Index infrastructure
          </p>
        </div>

        {/* System Layers */}
        <section className="mb-16">
          <h2 className="mb-6 text-lg font-semibold text-text">System Layers</h2>
          <p className="mb-6 text-sm text-text-muted">
            Click each layer to expand and see details. Data flows top to bottom
            from client requests through the API and service layers into persistent storage.
          </p>

          <div className="space-y-8">
            {LAYERS.map((layer, i) => (
              <ExpandableSection
                key={layer.id}
                {...layer}
                index={i}
                totalLayers={LAYERS.length}
              />
            ))}
          </div>
        </section>

        {/* Agent Ecosystem */}
        <section className="mb-16">
          <h2 className="mb-3 text-lg font-semibold text-text">Agent Ecosystem</h2>
          <p className="mb-6 text-sm text-text-muted">
            {AGENTS.length} agents organized into {agentCategories.length} categories. Each agent
            runs autonomously on a schedule and logs results to Firestore.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {agentCategories.map((cat) => (
              <Card key={cat.name} className={cn("border p-4", cat.color.split(" ")[2], cat.color.split(" ")[0])}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className={cn("text-sm font-semibold", cat.color.split(" ")[1])}>
                    {cat.name}
                  </h3>
                  <span className="font-mono text-xs text-text-muted">
                    {cat.agents.length} agent{cat.agents.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.agents.map((name) => (
                    <span
                      key={name}
                      className="rounded bg-base/50 px-2 py-0.5 font-mono text-[10px] text-text-muted"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Data Flow */}
        <section className="mb-16">
          <h2 className="mb-3 text-lg font-semibold text-text">Data Flow</h2>
          <Card className="overflow-x-auto border border-border bg-surface p-6">
            <pre className="font-mono text-[11px] leading-relaxed text-text-muted">
{`
  User Request                    Agent Scheduler
       |                                |
       v                                v
  +---------+                    +------------+
  | Next.js |                    | 32 Agents  |
  |  Route  |                    | (cron)     |
  +----+----+                    +-----+------+
       |                               |
       v                               v
  +---------+    +---------+    +------------+
  | Service |<-->| Search  |<-->| Pinecone   |
  |  Logic  |    | Engine  |    | (Vectors)  |
  +----+----+    +---------+    +------------+
       |
       v
  +---------+    +---------+    +------------+
  |Firestore|<-->|Webhooks |<-->| Consumers  |
  | (38 col)|    | Engine  |    | (HTTP)     |
  +---------+    +---------+    +------------+
       |
       v
  +---------+
  | Events  |----> SSE Stream ---> Client
  | Timeline|
  +---------+
`}
            </pre>
          </Card>
        </section>

        {/* Integration Points */}
        <section className="mb-16">
          <h2 className="mb-3 text-lg font-semibold text-text">Integration Points</h2>
          <p className="mb-6 text-sm text-text-muted">
            External systems connect to the knowledge index through these integration mechanisms.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {INTEGRATIONS.map((integration) => (
              <Card key={integration.title} className="border border-border bg-surface p-5">
                <h3 className="mb-1 text-sm font-semibold text-text">{integration.title}</h3>
                <p className="mb-3 text-xs leading-relaxed text-text-muted">
                  {integration.description}
                </p>
                <ul className="space-y-1">
                  {integration.details.map((d) => (
                    <li key={d} className="flex items-center gap-2 text-xs text-text-muted">
                      <span className="inline-block h-1 w-1 rounded-full bg-circuit" />
                      {d}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Stats */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">By the Numbers</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "API Endpoints", value: "40+" },
              { label: "Agents", value: "32" },
              { label: "Firestore Collections", value: "38" },
              { label: "Entity Types", value: "6" },
            ].map((stat) => (
              <Card key={stat.label} className="border border-border bg-surface p-4 text-center">
                <p className="font-mono text-2xl font-bold text-circuit">{stat.value}</p>
                <p className="mt-1 text-xs text-text-muted">{stat.label}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
