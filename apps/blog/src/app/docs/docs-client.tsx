"use client";

import { useState } from "react";
import { Card, cn } from "@aaas/ui";
import { API_ENDPOINTS, AGENTS, FIRESTORE_COLLECTIONS } from "@/lib/doc-data";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type Tab = "overview" | "api" | "agents" | "data-model" | "getting-started";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "api", label: "API Reference" },
  { id: "agents", label: "Agents" },
  { id: "data-model", label: "Data Model" },
  { id: "getting-started", label: "Getting Started" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  PUT: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/15 text-red-400 border-red-500/30",
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const k = key(item);
    if (!result[k]) result[k] = [];
    result[k].push(item);
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/*  Tab Content                                                                */
/* -------------------------------------------------------------------------- */

function OverviewTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-2xl font-bold text-text">System Overview</h2>
        <p className="mb-4 leading-relaxed text-text-muted">
          The AaaS Knowledge Index is a schema-first AI ecosystem database that catalogs tools, models,
          agents, skills, scripts, and benchmarks. It provides real-time search, personalized discovery,
          and an autonomous agent workforce that keeps data fresh and enriched.
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-text">Tech Stack</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Framework", value: "Next.js 14 (App Router)" },
            { label: "Language", value: "TypeScript" },
            { label: "Database", value: "Cloud Firestore" },
            { label: "Vector Store", value: "Pinecone" },
            { label: "Hosting", value: "Firebase App Hosting" },
            { label: "AI", value: "Gemini + OpenAI Embeddings" },
            { label: "UI Library", value: "@aaas/ui (Monorepo)" },
            { label: "Styling", value: "Tailwind CSS v4" },
            { label: "Monorepo", value: "Turborepo" },
          ].map((item) => (
            <Card key={item.label} className="border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                {item.label}
              </p>
              <p className="mt-1 font-mono text-sm text-text">{item.value}</p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-text">Architecture</h3>
        <Card className="overflow-x-auto border border-border bg-surface p-6">
          <pre className="font-mono text-xs leading-relaxed text-text-muted">
{`
  +-------------------+     +---------------------+     +------------------+
  |                   |     |                     |     |                  |
  |   Browser Client  +---->+   Next.js App       +---->+   Cloud          |
  |   (React SPA)     |     |   (App Router)      |     |   Firestore      |
  |                   |     |                     |     |                  |
  +-------------------+     +----------+----------+     +------------------+
                                       |
                            +----------+----------+
                            |                     |
                            |   API Routes        |
                            |   /api/*            |
                            |                     |
                            +----------+----------+
                                       |
                    +------------------+------------------+
                    |                  |                  |
            +-------+------+  +-------+------+  +-------+------+
            |              |  |              |  |              |
            |  Pinecone    |  |  32 Agents   |  |  Webhooks    |
            |  (Vectors)   |  |  (Scheduled) |  |  (Events)    |
            |              |  |              |  |              |
            +--------------+  +--------------+  +--------------+
`}
          </pre>
        </Card>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-text">Key Features</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: "Entity Catalog", desc: "6 entity types with rich metadata, scoring, and relationships" },
            { title: "Hybrid Search", desc: "Keyword + semantic vector search with Pinecone integration" },
            { title: "Agent Workforce", desc: "32 autonomous agents handling enrichment, freshness, ranking, and more" },
            { title: "AI Assistant", desc: "Conversational queries powered by Gemini with context-aware responses" },
            { title: "Webhooks v2", desc: "Event-driven notifications with retry logic and delivery tracking" },
            { title: "Multi-tenant Workspaces", desc: "Team workspaces with roles, themes, and shared collections" },
            { title: "Achievements", desc: "Gamification system tracking user engagement milestones" },
            { title: "Analytics", desc: "Real-time analytics snapshots, time series, and anomaly detection" },
          ].map((f) => (
            <Card key={f.title} className="border border-border bg-surface p-4">
              <p className="mb-1 text-sm font-semibold text-text">{f.title}</p>
              <p className="text-xs leading-relaxed text-text-muted">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApiReferenceTab() {
  const grouped = groupBy(API_ENDPOINTS, (e) => e.category);
  const categories = Object.keys(grouped);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-text">API Reference</h2>
        <p className="mb-6 text-text-muted">
          All endpoints accept and return JSON. Authentication is via{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-circuit">
            x-api-key
          </code>{" "}
          or{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-circuit">
            x-user-id
          </code>{" "}
          headers where noted.
        </p>
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="mb-3 text-lg font-semibold text-text">{cat}</h3>
          <Card className="divide-y divide-border border border-border bg-surface p-0 overflow-hidden">
            {grouped[cat].map((ep, i) => (
              <div
                key={`${ep.method}-${ep.path}-${i}`}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span
                  className={cn(
                    "inline-flex w-16 shrink-0 items-center justify-center rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
                    METHOD_COLORS[ep.method],
                  )}
                >
                  {ep.method}
                </span>
                <code className="shrink-0 font-mono text-sm text-text">{ep.path}</code>
                <span className="hidden flex-1 text-sm text-text-muted sm:block">
                  {ep.description}
                </span>
                {ep.auth && (
                  <span className="ml-auto shrink-0 rounded-full bg-circuit/10 px-2 py-0.5 font-mono text-[10px] text-circuit">
                    {ep.auth}
                  </span>
                )}
              </div>
            ))}
          </Card>
        </div>
      ))}

      <Card className="border border-border bg-surface p-4">
        <p className="text-xs text-text-muted">
          Full OpenAPI 3.0.3 specification available at{" "}
          <a href="/api/docs/openapi" className="font-mono text-circuit underline underline-offset-2">
            /api/docs/openapi
          </a>
        </p>
      </Card>
    </div>
  );
}

function AgentsTab() {
  const grouped = groupBy(AGENTS, (a) => a.category);
  const categories = Object.keys(grouped);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-text">Agent Workforce</h2>
        <p className="mb-6 text-text-muted">
          {AGENTS.length} autonomous agents run on scheduled intervals to keep the knowledge index
          fresh, enriched, and ranked. Each agent is idempotent and logs execution results.
        </p>
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text">
            <span className="inline-block h-2 w-2 rounded-full bg-circuit" />
            {cat}
            <span className="text-sm font-normal text-text-muted">
              ({grouped[cat].length} agent{grouped[cat].length !== 1 ? "s" : ""})
            </span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {grouped[cat].map((agent) => (
              <Card key={agent.file} className="border border-border bg-surface p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-text">{agent.name}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                      agent.schedule === "Daily"
                        ? "bg-circuit/10 text-circuit"
                        : "bg-purple-500/10 text-purple-400",
                    )}
                  >
                    {agent.schedule}
                  </span>
                </div>
                <p className="mb-2 text-xs leading-relaxed text-text-muted">
                  {agent.description}
                </p>
                <p className="font-mono text-[10px] text-text-muted/60">{agent.file}</p>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DataModelTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-text">Data Model</h2>
        <p className="mb-6 text-text-muted">
          All data is stored in Cloud Firestore. The index comprises{" "}
          {FIRESTORE_COLLECTIONS.length} collections spanning entity data, analytics,
          user state, and system operations.
        </p>
      </div>

      <Card className="divide-y divide-border border border-border bg-surface p-0 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 bg-surface/80 px-4 py-2.5">
          <div className="col-span-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Collection
            </p>
          </div>
          <div className="col-span-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Description
            </p>
          </div>
          <div className="col-span-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Key Fields
            </p>
          </div>
        </div>

        {FIRESTORE_COLLECTIONS.map((col) => (
          <div key={col.name} className="grid grid-cols-12 gap-2 px-4 py-2.5">
            <div className="col-span-3">
              <code className="font-mono text-xs text-circuit">{col.name}</code>
            </div>
            <div className="col-span-3">
              <p className="text-xs text-text-muted">{col.description}</p>
            </div>
            <div className="col-span-6 flex flex-wrap gap-1">
              {col.keyFields.map((f) => (
                <span
                  key={f}
                  className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted border border-border"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function GettingStartedTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-2xl font-bold text-text">Getting Started</h2>
        <p className="mb-6 leading-relaxed text-text-muted">
          Follow this guide to set up the AaaS Knowledge Index locally for development.
        </p>
      </div>

      {/* Prerequisites */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-text">Prerequisites</h3>
        <Card className="border border-border bg-surface p-4">
          <ul className="space-y-2 text-sm text-text-muted">
            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-circuit" />
              Node.js 20+ and npm 10+
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-circuit" />
              Firebase CLI installed globally
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-circuit" />
              A Firebase project with Firestore enabled
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-circuit" />
              Pinecone account (for semantic search)
            </li>
          </ul>
        </Card>
      </div>

      {/* Clone & Install */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-text">1. Clone and Install</h3>
        <Card className="border border-border bg-surface p-4">
          <pre className="font-mono text-xs leading-relaxed text-text-muted">
{`git clone https://github.com/superforge/aaas.git
cd aaas
npm install          # installs all workspaces
npx turbo build      # builds shared packages`}
          </pre>
        </Card>
      </div>

      {/* Environment Variables */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-text">2. Environment Variables</h3>
        <p className="mb-3 text-sm text-text-muted">
          Create <code className="rounded bg-surface px-1 py-0.5 font-mono text-xs text-circuit">apps/blog/.env.local</code> with:
        </p>
        <Card className="border border-border bg-surface p-4">
          <pre className="font-mono text-xs leading-relaxed text-text-muted">
{`# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Pinecone (semantic search)
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX=aaas-entities
PINECONE_ENVIRONMENT=us-east-1

# AI
GOOGLE_AI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key

# Optional
NEXT_PUBLIC_BASE_URL=http://localhost:3000`}
          </pre>
        </Card>
      </div>

      {/* Run Locally */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-text">3. Run Locally</h3>
        <Card className="border border-border bg-surface p-4">
          <pre className="font-mono text-xs leading-relaxed text-text-muted">
{`cd apps/blog
npm run dev          # starts on http://localhost:3000`}
          </pre>
        </Card>
      </div>

      {/* Seed Data */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-text">4. Seed Data</h3>
        <Card className="border border-border bg-surface p-4">
          <pre className="font-mono text-xs leading-relaxed text-text-muted">
{`npx tsx apps/blog/src/seed/run-seed.ts`}
          </pre>
          <p className="mt-2 text-xs text-text-muted">
            Seeds 11 initial entities across all 6 entity types.
          </p>
        </Card>
      </div>

      {/* API Keys */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-text">5. API Access</h3>
        <Card className="border border-border bg-surface p-4">
          <p className="mb-2 text-sm text-text-muted">
            For authenticated endpoints, include one of these headers:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <code className="rounded bg-circuit/10 px-2 py-0.5 font-mono text-xs text-circuit">
                x-api-key
              </code>
              <span className="text-xs text-text-muted">
                For analytics, webhook, and admin endpoints
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="rounded bg-circuit/10 px-2 py-0.5 font-mono text-xs text-circuit">
                x-user-id
              </code>
              <span className="text-xs text-text-muted">
                For user-scoped endpoints (notifications, bookmarks, etc.)
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function DocsClient() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabContent: Record<Tab, React.ReactNode> = {
    overview: <OverviewTab />,
    api: <ApiReferenceTab />,
    agents: <AgentsTab />,
    "data-model": <DataModelTab />,
    "getting-started": <GettingStartedTab />,
  };

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-text">
            Documentation
          </h1>
          <p className="text-sm text-text-muted">
            Everything you need to build with the AaaS Knowledge Index
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <nav className="shrink-0 lg:w-56">
            <div className="sticky top-24 space-y-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-circuit/10 text-circuit"
                      : "text-text-muted hover:bg-surface hover:text-text",
                  )}
                >
                  {tab.label}
                </button>
              ))}

              <div className="my-4 border-t border-border" />

              <a
                href="/docs/architecture"
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
              >
                Architecture Diagram
              </a>
              <a
                href="/api/docs/openapi"
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
              >
                OpenAPI Spec
              </a>
              <a
                href="/status"
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
              >
                System Status
              </a>
            </div>
          </nav>

          {/* Content */}
          <main className="min-w-0 flex-1">{tabContent[activeTab]}</main>
        </div>
      </div>
    </div>
  );
}
