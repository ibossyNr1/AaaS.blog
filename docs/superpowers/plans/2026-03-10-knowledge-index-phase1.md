# AaaS Knowledge Index — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the static blog (aaas-blog.web.app) into a schema-first knowledge index with entity data layer, structured landing pages, navigation, channel pages, and a read-only content API.

**Architecture:** Firestore-backed entity database with typed data access layer. Next.js static export generates structured HTML pages with JSON-LD schema markup for each entity. The shared `@aaas/ui` design system provides all visual components. A read-only API is served via Next.js API routes (requires switching from pure static export to Firebase App Hosting for server-side routes).

**Tech Stack:** Next.js 14, TypeScript, Firestore (firebase-admin for data seeding, client SDK for reads), Tailwind CSS via @aaas/ui, JSON-LD for structured data, Firebase App Hosting.

**Spec:** `docs/superpowers/specs/2026-03-10-aaas-knowledge-index-design.md`

---

## File Structure

### New files to create:

```
apps/blog/src/
├── lib/
│   ├── types.ts                    # Entity type definitions (Tool, Model, Agent, Skill, Script, Benchmark)
│   ├── schemas.ts                  # JSON-LD schema generators per entity type
│   ├── firebase.ts                 # Firebase client initialization
│   ├── entities.ts                 # Data access: fetch entities from Firestore
│   └── channels.ts                 # Channel definitions and helpers
├── components/
│   ├── entity-card.tsx             # Universal entity card (renders any entity type)
│   ├── entity-header.tsx           # Entity page header with type badge, name, provider
│   ├── entity-schema-table.tsx     # Structured data table for entity fields
│   ├── entity-relations.tsx        # Cross-linked related entities section
│   ├── entity-scores.tsx           # Visual score bars (adoption, quality, etc.)
│   ├── entity-json-ld.tsx          # JSON-LD injection component (sanitized)
│   ├── channel-card.tsx            # Channel overview card for homepage
│   ├── trending-strip.tsx          # Horizontal trending entities strip
│   ├── entity-type-filter.tsx      # Filter pills (Tool, Model, Agent, etc.)
│   └── index-navbar.tsx            # Expanded navigation (replaces blog-navbar)
├── app/
│   ├── page.tsx                    # Homepage (rewrite: trending, channels, latest)
│   ├── layout.tsx                  # Root layout (update metadata, nav, footer)
│   ├── tool/[slug]/page.tsx        # Tool entity page
│   ├── model/[slug]/page.tsx       # Model entity page
│   ├── agent/[slug]/page.tsx       # Agent entity page
│   ├── skill/[slug]/page.tsx       # Skill entity page
│   ├── script/[slug]/page.tsx      # Script entity page
│   ├── benchmark/[slug]/page.tsx   # Benchmark entity page
│   ├── channel/[topic]/page.tsx    # Channel listing page
│   ├── explore/page.tsx            # Full search + filter page
│   └── api/
│       ├── entities/route.ts       # GET /api/entities (list, search, filter)
│       └── entity/[type]/[slug]/route.ts  # GET /api/entity/:type/:slug
└── seed/
    └── seed-data.ts                # Initial seed entities (20-30 entries)
```

### Files to modify:

```
apps/blog/next.config.mjs           # Remove `output: "export"`, add Firestore env
apps/blog/package.json              # Add firebase, firebase-admin deps
apps/blog/src/app/layout.tsx        # Update metadata, swap navbar, update footer
apps/blog/src/components/blog-navbar.tsx → replaced by index-navbar.tsx
firebase.json                       # Update blog hosting config for App Hosting
```

### Files to delete (replaced):

```
apps/blog/src/lib/data.ts           # Hardcoded posts → replaced by Firestore
apps/blog/src/app/[slug]/page.tsx   # Old post pages → replaced by entity type pages
```

---

## Chunk 1: Data Layer (Types, Firebase, Seed Data)

### Task 1: Define entity types

**Files:**
- Create: `apps/blog/src/lib/types.ts`

- [ ] **Step 1: Create the entity type definitions**

```typescript
// apps/blog/src/lib/types.ts

/** Score breakdown for leaderboard ranking */
export interface EntityScores {
  adoption: number;    // 0-100
  quality: number;     // 0-100
  freshness: number;   // 0-100
  citations: number;   // 0-100
  engagement: number;  // 0-100, from PostHog analytics (page views, audio listens, time-on-page)
  composite: number;   // Weighted: adoption*0.4 + citations*0.25 + quality*0.2 + engagement*0.15
}

/** Base fields shared by all entity types */
export interface BaseEntity {
  slug: string;
  type: EntityType;
  name: string;
  category: string;          // Primary topic channel slug
  tags: string[];
  description: string;
  provider: string;
  version: string;
  pricingModel: "free" | "freemium" | "paid" | "open-source";
  license: string;
  url: string;
  apiAvailable: boolean;
  apiDocsUrl: string;
  capabilities: string[];
  integrations: string[];
  useCases: string[];
  relatedTools: string[];
  relatedModels: string[];
  relatedAgents: string[];
  relatedSkills: string[];
  scores: EntityScores;
  schemaCompleteness: number; // 0-100
  lastVerified: string;       // ISO date
  lastUpdated: string;        // ISO date
  addedDate: string;          // ISO date
  addedBy: string;            // Agent ID
  // Note: changelog is stored as a Firestore subcollection, not on the entity document.
  // Access via getEntityChangelog() in entities.ts if needed. Excluded from client type to avoid unbounded arrays.
}

export type EntityType = "tool" | "model" | "agent" | "skill" | "script" | "benchmark";

export interface ToolEntity extends BaseEntity {
  type: "tool";
  sdkLanguages: string[];
  deploymentOptions: string[];
  rateLimits: string;
  dataPrivacy: string;
}

export interface ModelEntity extends BaseEntity {
  type: "model";
  parameterCount: string;
  contextWindow: string;
  modalities: string[];
  trainingDataCutoff: string;
  benchmarkScores: Record<string, number>;
}

export interface AgentEntity extends BaseEntity {
  type: "agent";
  autonomyLevel: "supervised" | "semi-autonomous" | "fully-autonomous";
  toolsUsed: string[];
  skills: string[];
  trustScore: number;
  contributionCount: number;
}

export interface SkillEntity extends BaseEntity {
  type: "skill";
  supportedAgents: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisites: string[];
  implementationGuideUrl: string;
}

export interface ScriptEntity extends BaseEntity {
  type: "script";
  language: string;
  dependencies: string[];
  executionEnvironment: string;
  estimatedRuntime: string;
}

export interface BenchmarkEntity extends BaseEntity {
  type: "benchmark";
  evaluatedModels: string[];
  metrics: string[];
  methodology: string;
  lastRunDate: string;
  resultsTable: Record<string, Record<string, number>>;
}

/** Union type for any entity */
export type Entity = ToolEntity | ModelEntity | AgentEntity | SkillEntity | ScriptEntity | BenchmarkEntity;

/** Entity type metadata for UI rendering */
export const ENTITY_TYPES: Record<EntityType, { label: string; plural: string; color: string }> = {
  tool: { label: "Tool", plural: "Tools", color: "blue" },
  model: { label: "Model", plural: "Models", color: "purple" },
  agent: { label: "Agent", plural: "Agents", color: "green" },
  skill: { label: "Skill", plural: "Skills", color: "gold" },
  script: { label: "Script", plural: "Scripts", color: "pink" },
  benchmark: { label: "Benchmark", plural: "Benchmarks", color: "circuit" },
};

/** Channel definition */
export interface Channel {
  slug: string;
  name: string;
  description: string;
  entityCount: number;
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd /Users/user/.gemini/AaaS && npx tsc --noEmit -p apps/blog/tsconfig.json 2>&1 | head -20`
Expected: No errors (or only pre-existing ones unrelated to types.ts)

- [ ] **Step 3: Commit**

```bash
git add apps/blog/src/lib/types.ts
git commit -m "feat(blog): add entity type definitions for knowledge index"
```

---

### Task 2: Define channels

**Files:**
- Create: `apps/blog/src/lib/channels.ts`

- [ ] **Step 1: Create channel definitions**

```typescript
// apps/blog/src/lib/channels.ts
import type { Channel } from "./types";

/** Initial topic channels — expandable as entity volume grows */
export const CHANNELS: Channel[] = [
  { slug: "llms", name: "LLMs", description: "Large language models, fine-tuning, RAG, and inference", entityCount: 0 },
  { slug: "ai-tools", name: "AI Tools & APIs", description: "Developer tools, SDKs, and API services for AI", entityCount: 0 },
  { slug: "ai-agents", name: "AI Agents", description: "Autonomous agents, assistants, and multi-agent systems", entityCount: 0 },
  { slug: "computer-vision", name: "Computer Vision", description: "Image recognition, generation, video analysis", entityCount: 0 },
  { slug: "prompt-engineering", name: "Prompt Engineering", description: "Prompt design, context engineering, and optimization", entityCount: 0 },
  { slug: "ai-infrastructure", name: "AI Infrastructure", description: "MLOps, training pipelines, deployment, and scaling", entityCount: 0 },
  { slug: "ai-safety", name: "AI Ethics & Safety", description: "Alignment, bias, governance, and responsible AI", entityCount: 0 },
  { slug: "ai-business", name: "AI Business & Strategy", description: "AI adoption, ROI, market trends, and case studies", entityCount: 0 },
  { slug: "ai-code", name: "AI for Code", description: "Code generation, review, debugging, and developer tools", entityCount: 0 },
  { slug: "speech-audio", name: "Speech & Audio AI", description: "TTS, STT, voice cloning, and audio processing", entityCount: 0 },
];

export function getChannel(slug: string): Channel | undefined {
  return CHANNELS.find((c) => c.slug === slug);
}

export function getChannelName(slug: string): string {
  return getChannel(slug)?.name ?? slug;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/blog/src/lib/channels.ts
git commit -m "feat(blog): add topic channel definitions"
```

---

### Task 3: Firebase client setup

**Files:**
- Create: `apps/blog/src/lib/firebase.ts`
- Modify: `apps/blog/package.json`

- [ ] **Step 1: Install Firebase SDK**

Run: `cd /Users/user/.gemini/AaaS/apps/blog && npm install firebase`

- [ ] **Step 2: Create Firebase client initialization**

```typescript
// apps/blog/src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "aaas-platform",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
```

- [ ] **Step 3: Commit**

```bash
git add apps/blog/src/lib/firebase.ts apps/blog/package.json apps/blog/package-lock.json
git commit -m "feat(blog): add Firebase client initialization"
```

---

### Task 4: Data access layer

**Files:**
- Create: `apps/blog/src/lib/entities.ts`

- [ ] **Step 1: Create entity data access functions**

```typescript
// apps/blog/src/lib/entities.ts
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit as firestoreLimit } from "firebase/firestore";
import { db } from "./firebase";
import type { Entity, EntityType } from "./types";

const COLLECTION_MAP: Record<EntityType, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

/** Fetch a single entity by type and slug */
export async function getEntity(type: EntityType, slug: string): Promise<Entity | null> {
  const ref = doc(db, COLLECTION_MAP[type], slug);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { ...snap.data(), slug: snap.id, type } as Entity;
}

/** Fetch all entities of a given type, sorted by composite score descending */
export async function getEntitiesByType(type: EntityType, max = 50): Promise<Entity[]> {
  const q = query(
    collection(db, COLLECTION_MAP[type]),
    orderBy("scores.composite", "desc"),
    firestoreLimit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), slug: d.id, type } as Entity));
}

/** Fetch entities in a channel (category), across all types */
export async function getEntitiesByChannel(channelSlug: string, max = 50): Promise<Entity[]> {
  const results: Entity[] = [];
  for (const [type, col] of Object.entries(COLLECTION_MAP)) {
    const q = query(
      collection(db, col),
      where("category", "==", channelSlug),
      orderBy("scores.composite", "desc"),
      firestoreLimit(max)
    );
    const snap = await getDocs(q);
    results.push(...snap.docs.map((d) => ({ ...d.data(), slug: d.id, type: type as EntityType } as Entity)));
  }
  return results.sort((a, b) => b.scores.composite - a.scores.composite).slice(0, max);
}

/** Fetch trending entities across all types (top N by composite score) */
export async function getTrendingEntities(max = 12): Promise<Entity[]> {
  const results: Entity[] = [];
  for (const [type, col] of Object.entries(COLLECTION_MAP)) {
    const q = query(
      collection(db, col),
      orderBy("scores.composite", "desc"),
      firestoreLimit(max)
    );
    const snap = await getDocs(q);
    results.push(...snap.docs.map((d) => ({ ...d.data(), slug: d.id, type: type as EntityType } as Entity)));
  }
  return results.sort((a, b) => b.scores.composite - a.scores.composite).slice(0, max);
}

/** Fetch recently added entities */
export async function getRecentEntities(max = 12): Promise<Entity[]> {
  const results: Entity[] = [];
  for (const [type, col] of Object.entries(COLLECTION_MAP)) {
    const q = query(
      collection(db, col),
      orderBy("addedDate", "desc"),
      firestoreLimit(max)
    );
    const snap = await getDocs(q);
    results.push(...snap.docs.map((d) => ({ ...d.data(), slug: d.id, type: type as EntityType } as Entity)));
  }
  return results.sort((a, b) => b.addedDate.localeCompare(a.addedDate)).slice(0, max);
}

/** Get all entity slugs for a given type (for static params generation) */
export async function getAllSlugs(type: EntityType): Promise<string[]> {
  const snap = await getDocs(collection(db, COLLECTION_MAP[type]));
  return snap.docs.map((d) => d.id);
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd /Users/user/.gemini/AaaS && npx tsc --noEmit -p apps/blog/tsconfig.json 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add apps/blog/src/lib/entities.ts
git commit -m "feat(blog): add Firestore entity data access layer"
```

---

### Task 5: Seed data

**Files:**
- Create: `apps/blog/src/seed/seed-data.ts`

- [ ] **Step 1: Create seed data with 12 representative entities**

This file defines the initial entities to populate the index. It includes at least 2 entities per type across multiple channels. See the full seed data in the spec — include entries for: Pinecone (tool), LangChain (tool), Cursor (tool), Claude 4 (model), GPT-5 (model), Claude Code (agent), Devin (agent), RAG Retrieval (skill), Web Scraping (skill), RAG Pipeline Setup (script), SWE-bench (benchmark).

Each entity must conform to its respective type interface from `types.ts`. Use realistic data with proper cross-references between entities.

- [ ] **Step 2: Verify types match**

Run: `cd /Users/user/.gemini/AaaS && npx tsc --noEmit -p apps/blog/tsconfig.json 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add apps/blog/src/seed/seed-data.ts
git commit -m "feat(blog): add seed data with 12 representative entities across all types"
```

---

### Task 5b: Firestore seed script

**Files:**
- Create: `apps/blog/src/seed/run-seed.ts`
- Modify: `apps/blog/package.json` (add `firebase-admin` as devDependency)

- [ ] **Step 1: Install firebase-admin**

Run: `cd /Users/user/.gemini/AaaS/apps/blog && npm install -D firebase-admin`

- [ ] **Step 2: Create runnable seed script**

```typescript
// apps/blog/src/seed/run-seed.ts
// Run with: npx tsx apps/blog/src/seed/run-seed.ts
// Requires: GOOGLE_APPLICATION_CREDENTIALS env var, or Firebase emulator running
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { seedEntities } from "./seed-data";

initializeApp({ projectId: "aaas-platform" });
const db = getFirestore();

const COLLECTION_MAP: Record<string, string> = {
  tool: "tools", model: "models", agent: "agents",
  skill: "skills", script: "scripts", benchmark: "benchmarks",
};

async function seed() {
  for (const entity of seedEntities) {
    const { slug, type, ...data } = entity;
    const col = COLLECTION_MAP[type];
    await db.collection(col).doc(slug).set({ ...data, type });
    console.log(`Seeded ${type}/${slug}`);
  }
  console.log(`Done. ${seedEntities.length} entities seeded.`);
}

seed().catch(console.error);
```

- [ ] **Step 3: Run seed against emulator or Firestore**

Run: `cd /Users/user/.gemini/AaaS/apps/blog && npx tsx src/seed/run-seed.ts`
Expected: All entities seeded without errors

- [ ] **Step 4: Commit**

```bash
git add apps/blog/src/seed/run-seed.ts apps/blog/package.json
git commit -m "feat(blog): add Firestore seed script for initial entity data"
```

### Task 5c: Create Firestore indexes

**Files:**
- Create: `firestore.indexes.json`

- [ ] **Step 1: Define required composite indexes**

```json
{
  "indexes": [
    {
      "collectionGroup": "tools",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "scores.composite", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "models",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "scores.composite", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "agents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "scores.composite", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "skills",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "scores.composite", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "scripts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "scores.composite", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "benchmarks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "scores.composite", "order": "DESCENDING" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Deploy indexes**

Run: `firebase deploy --only firestore:indexes`

- [ ] **Step 3: Commit**

```bash
git add firestore.indexes.json
git commit -m "feat: add Firestore composite indexes for entity queries"
```

---

## Chunk 2: JSON-LD Schema & Shared Components

### Task 6: JSON-LD schema generator

**Files:**
- Create: `apps/blog/src/lib/schemas.ts`

- [ ] **Step 1: Create JSON-LD generators for each entity type**

```typescript
// apps/blog/src/lib/schemas.ts
import type { Entity, EntityType } from "./types";

/** Generate JSON-LD structured data for any entity */
export function generateJsonLd(entity: Entity): Record<string, unknown> {
  const base = {
    "@context": "https://schema.org",
    "@type": mapEntityTypeToSchemaOrg(entity.type),
    name: entity.name,
    description: entity.description,
    url: entity.url,
    provider: {
      "@type": "Organization",
      name: entity.provider,
    },
    dateCreated: entity.addedDate,
    dateModified: entity.lastUpdated,
    keywords: entity.tags.join(", "),
    version: entity.version,
  };

  switch (entity.type) {
    case "tool":
      return {
        ...base,
        "@type": "SoftwareApplication",
        applicationCategory: "AI Tool",
        operatingSystem: "Cloud",
        offers: {
          "@type": "Offer",
          price: entity.pricingModel === "free" ? "0" : undefined,
          priceCurrency: "USD",
        },
        programmingLanguage: entity.sdkLanguages,
      };
    case "model":
      return {
        ...base,
        "@type": "SoftwareApplication",
        applicationCategory: "AI Model",
        additionalProperty: [
          { "@type": "PropertyValue", name: "contextWindow", value: entity.contextWindow },
          { "@type": "PropertyValue", name: "parameterCount", value: entity.parameterCount },
          { "@type": "PropertyValue", name: "modalities", value: entity.modalities.join(", ") },
        ],
      };
    case "agent":
      return {
        ...base,
        "@type": "SoftwareApplication",
        applicationCategory: "AI Agent",
        additionalProperty: [
          { "@type": "PropertyValue", name: "autonomyLevel", value: entity.autonomyLevel },
        ],
      };
    case "benchmark":
      return {
        ...base,
        "@type": "Dataset",
        measurementTechnique: entity.methodology,
      };
    default:
      return base;
  }
}

function mapEntityTypeToSchemaOrg(type: EntityType): string {
  switch (type) {
    case "tool":
    case "model":
    case "agent":
    case "script":
      return "SoftwareApplication";
    case "skill":
      return "HowTo";
    case "benchmark":
      return "Dataset";
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/blog/src/lib/schemas.ts
git commit -m "feat(blog): add JSON-LD schema generators for entity types"
```

---

### Task 7: Entity card component

**Files:**
- Create: `apps/blog/src/components/entity-card.tsx`

- [ ] **Step 1: Create the universal entity card**

```typescript
// apps/blog/src/components/entity-card.tsx
import Link from "next/link";
import { Card, Badge } from "@aaas/ui";
import type { Entity } from "@/lib/types";
import { ENTITY_TYPES } from "@/lib/types";
import { getChannelName } from "@/lib/channels";

interface EntityCardProps {
  entity: Entity;
}

export function EntityCard({ entity }: EntityCardProps) {
  const typeInfo = ENTITY_TYPES[entity.type];

  return (
    <Link href={`/${entity.type}/${entity.slug}`}>
      <Card className="h-full flex flex-col group cursor-pointer">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="circuit">
            {typeInfo.label}
          </Badge>
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
            {getChannelName(entity.category)}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-text mb-1 group-hover:text-circuit transition-colors">
          {entity.name}
        </h3>
        <p className="text-xs text-text-muted mb-3">
          by {entity.provider}
        </p>
        <p className="text-sm text-text-muted leading-relaxed flex-grow line-clamp-3">
          {entity.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {entity.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono text-text-muted bg-surface px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="text-xs font-mono text-circuit">
            {entity.scores.composite}
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/blog/src/components/entity-card.tsx
git commit -m "feat(blog): add universal entity card component"
```

---

### Task 8: Entity page shared components

**Files:**
- Create: `apps/blog/src/components/entity-header.tsx`
- Create: `apps/blog/src/components/entity-schema-table.tsx`
- Create: `apps/blog/src/components/entity-scores.tsx`
- Create: `apps/blog/src/components/entity-relations.tsx`
- Create: `apps/blog/src/components/entity-json-ld.tsx`

- [ ] **Step 1: Create entity header**

```typescript
// apps/blog/src/components/entity-header.tsx
import { Badge, Container, Section } from "@aaas/ui";
import type { Entity } from "@/lib/types";
import { ENTITY_TYPES } from "@/lib/types";
import { getChannelName } from "@/lib/channels";

export function EntityHeader({ entity }: { entity: Entity }) {
  const typeInfo = ENTITY_TYPES[entity.type];

  return (
    <Section className="pt-28 pb-8">
      <Container className="max-w-4xl">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="circuit">{typeInfo.label}</Badge>
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
            {getChannelName(entity.category)}
          </span>
          <span className="text-xs text-text-muted">
            v{entity.version}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
          {entity.name}
        </h1>
        <p className="text-sm text-text-muted mb-4">
          by {entity.provider} · {entity.pricingModel} · Last verified {entity.lastVerified}
        </p>
        <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
          {entity.description}
        </p>
        {entity.url && (
          <a
            href={entity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-sm text-circuit hover:underline font-mono"
          >
            {entity.url} ↗
          </a>
        )}
      </Container>
    </Section>
  );
}
```

- [ ] **Step 2: Create schema table**

The `EntitySchemaTable` component renders a definition list of all entity fields. Includes a `Row` helper and a `TypeSpecificRows` switch for per-type fields. See entity-schema-table.tsx in the file structure.

Key pattern: `<dt>` for labels (mono, uppercase, muted), `<dd>` for values. Array fields joined with commas. Wrapped in a `Card` with "Specifications" header.

- [ ] **Step 3: Create score bars**

The `EntityScores` component shows a Card with the composite score and 5 individual score bars (adoption, quality, freshness, citations, engagement). Each bar: label, filled div with width based on score percentage, numeric value. Engagement starts at 0 for all seed entities (no analytics data yet).

- [ ] **Step 4: Create relations component**

The `EntityRelations` component shows cross-linked related entities as clickable badges grouped by type (Tools, Models, Agents, Skills). Each badge links to the related entity page.

- [ ] **Step 5: Create JSON-LD injector**

```typescript
// apps/blog/src/components/entity-json-ld.tsx
import type { Entity } from "@/lib/types";
import { generateJsonLd } from "@/lib/schemas";

export function EntityJsonLd({ entity }: { entity: Entity }) {
  const jsonLd = generateJsonLd(entity);
  // JSON-LD is safe: generated from our own typed data, not user input.
  // JSON.stringify handles escaping of special characters.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

**Security note:** The JSON-LD content is generated from our own Firestore data via `generateJsonLd()`, not from user input. `JSON.stringify` handles proper escaping. This is the standard Next.js pattern for JSON-LD injection.

- [ ] **Step 6: Commit all entity page components**

```bash
git add apps/blog/src/components/entity-header.tsx apps/blog/src/components/entity-schema-table.tsx apps/blog/src/components/entity-scores.tsx apps/blog/src/components/entity-relations.tsx apps/blog/src/components/entity-json-ld.tsx
git commit -m "feat(blog): add entity page components (header, schema table, scores, relations, JSON-LD)"
```

---

## Chunk 3: Entity Pages & Navigation

### Task 9: Entity page template (shared layout for all 6 types)

**Files:**
- Create: `apps/blog/src/components/entity-page.tsx`
- Create: `apps/blog/src/app/tool/[slug]/page.tsx`
- Create: `apps/blog/src/app/model/[slug]/page.tsx`
- Create: `apps/blog/src/app/agent/[slug]/page.tsx`
- Create: `apps/blog/src/app/skill/[slug]/page.tsx`
- Create: `apps/blog/src/app/script/[slug]/page.tsx`
- Create: `apps/blog/src/app/benchmark/[slug]/page.tsx`

- [ ] **Step 1: Create a shared entity page layout**

`EntityPage` component: accepts `type` and `slug`, fetches entity via `getEntity()`, returns `notFound()` if missing. Composes: `EntityJsonLd`, `EntityHeader`, `EntitySchemaTable`, `EntityScores`, `EntityRelations`, plus a CTA section linking to Vault.

- [ ] **Step 2: Create all 6 entity type pages**

Each page is a thin wrapper. Pattern (same for all 6, just change the type string):

```typescript
// apps/blog/src/app/tool/[slug]/page.tsx
import { EntityPage } from "@/components/entity-page";
import { getAllSlugs, getEntity } from "@/lib/entities";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const slugs = await getAllSlugs("tool");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const entity = await getEntity("tool", params.slug);
  if (!entity) return {};
  return {
    title: `${entity.name} — AaaS Knowledge Index`,
    description: entity.description,
    openGraph: {
      title: entity.name,
      description: entity.description,
      url: `https://aaas.blog/tool/${entity.slug}`,
    },
  };
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  return <EntityPage type="tool" slug={params.slug} />;
}
```

Repeat for: `model`, `agent`, `skill`, `script`, `benchmark` — changing the type string and URL path.

- [ ] **Step 3: Commit**

```bash
git add apps/blog/src/components/entity-page.tsx apps/blog/src/app/tool/ apps/blog/src/app/model/ apps/blog/src/app/agent/ apps/blog/src/app/skill/ apps/blog/src/app/script/ apps/blog/src/app/benchmark/
git commit -m "feat(blog): add entity pages for all 6 types with shared layout"
```

---

### Task 10: Navigation overhaul

**Files:**
- Create: `apps/blog/src/components/index-navbar.tsx`
- Modify: `apps/blog/src/app/layout.tsx`

- [ ] **Step 1: Create expanded navigation**

`IndexNavbar`: Fixed header with backdrop blur. Logo reads "AaaS .index". Desktop nav: Explore, Leaderboard, Listen links + separator + channel links (LLMs, AI Tools, AI Agents, AI Code) + separator + Platform external link. Mobile: hamburger menu with same links, channels section separated by border.

- [ ] **Step 2: Update root layout**

In `apps/blog/src/app/layout.tsx`:
- Replace `BlogNavbar` import with `IndexNavbar`
- Update metadata title to "AaaS Knowledge Index | The AI Ecosystem Database"
- Update metadata description to "Schema-first knowledge index of AI tools, models, agents, skills, and benchmarks."
- Update OpenGraph title/description

- [ ] **Step 3: Commit**

```bash
git add apps/blog/src/components/index-navbar.tsx apps/blog/src/app/layout.tsx
git commit -m "feat(blog): replace blog navbar with knowledge index navigation"
```

---

### Task 11: Homepage rewrite

**Files:**
- Modify: `apps/blog/src/app/page.tsx`

- [ ] **Step 1: Rewrite homepage**

Replace blog homepage with knowledge index landing:
- Hero section: "The AI Ecosystem Index" title, description, Explore + Vault links
- Trending section: 6 entities in 3-col grid via `EntityCard`, link to leaderboard
- Channels section (surface variant): 5-col grid of channel cards linking to `/channel/[slug]`
- Latest Additions: 9 recent entities in 3-col grid
- CTA: SYS_LOG footer with submit link

- [ ] **Step 2: Commit**

```bash
git add apps/blog/src/app/page.tsx
git commit -m "feat(blog): rewrite homepage as knowledge index landing page"
```

---

### Task 12: Channel page

**Files:**
- Create: `apps/blog/src/app/channel/[topic]/page.tsx`

- [ ] **Step 1: Create channel listing page**

Uses `generateStaticParams()` from CHANNELS array. Fetches entities via `getEntitiesByChannel()`. Shows channel name, description, entity count, and grid of EntityCards. Empty state if no entities.

- [ ] **Step 2: Commit**

```bash
git add apps/blog/src/app/channel/
git commit -m "feat(blog): add channel listing pages"
```

---

### Task 13: Explore page

**Files:**
- Create: `apps/blog/src/app/explore/page.tsx`
- Create: `apps/blog/src/components/entity-type-filter.tsx`

- [ ] **Step 1: Create entity type filter**

Client component with "All" + 6 entity type buttons. Selected state: circuit color border + bg. Calls `onChange` callback with type or "all".

- [ ] **Step 2: Create explore page**

Server component. Fetches all entities (up to 50). Renders filter pills + entity grid. Initial version is server-rendered; client-side filtering can be added as enhancement.

- [ ] **Step 3: Commit**

```bash
git add apps/blog/src/app/explore/ apps/blog/src/components/entity-type-filter.tsx
git commit -m "feat(blog): add explore page with entity type filtering"
```

---

## Chunk 4: Cleanup, API Routes & Config Updates

**Important ordering note:** Task 11 (homepage rewrite) removes all imports from `data.ts`. Task 14 (cleanup) must run before Task 15 (config changes) to ensure no broken references to old files exist.

### Task 14: Clean up old blog files

**Files:**
- Delete: `apps/blog/src/lib/data.ts`
- Delete: `apps/blog/src/app/[slug]/page.tsx`
- Delete: `apps/blog/src/components/blog-navbar.tsx`

- [ ] **Step 1: Remove old blog data and routes**

```bash
rm apps/blog/src/lib/data.ts
rm -rf apps/blog/src/app/\[slug\]/
rm apps/blog/src/components/blog-navbar.tsx
```

- [ ] **Step 2: Verify no broken imports**

Run: `cd /Users/user/.gemini/AaaS && npx tsc --noEmit -p apps/blog/tsconfig.json 2>&1 | head -30`
Fix any remaining imports that reference deleted files.

- [ ] **Step 3: Commit**

```bash
git add -A apps/blog/src/
git commit -m "refactor(blog): remove old blog files replaced by knowledge index"
```

---

### Task 15: Next.js config update

**Files:**
- Modify: `apps/blog/next.config.mjs`

- [ ] **Step 1: Remove static export**

Remove `output: "export"` from `next.config.mjs`. This enables API routes and server components. Deployment shifts from Firebase Hosting static to Firebase App Hosting.

**Note on rendering:** With `output: "export"` removed, `generateStaticParams()` pre-renders known entities at build time. New entities added to Firestore after build will be dynamically server-rendered on first request. For production, consider adding `revalidate` export to entity pages for ISR (Incremental Static Regeneration).

- [ ] **Step 2: Commit**

```bash
git add apps/blog/next.config.mjs
git commit -m "feat(blog): switch from static export to server rendering for API routes"
```

---

### Task 15: Read-only API routes

**Files:**
- Create: `apps/blog/src/app/api/entities/route.ts`
- Create: `apps/blog/src/app/api/entity/[type]/[slug]/route.ts`

- [ ] **Step 1: Create entity list endpoint**

`GET /api/entities` — accepts query params: `type` (filter by entity type), `channel` (filter by channel), `limit` (max 100, default 50). Returns `{ data: Entity[], count: number, timestamp: string }`. Validates type against allowed set.

- [ ] **Step 2: Create single entity endpoint**

`GET /api/entity/:type/:slug` — validates type, fetches entity, returns 404 if not found. Returns `{ data: Entity, timestamp: string }`.

- [ ] **Step 3: Commit**

```bash
git add apps/blog/src/app/api/
git commit -m "feat(blog): add read-only API routes for entity access"
```

---

### Task 17: Update Firebase config

**Files:**
- Modify: `firebase.json`

- [ ] **Step 1: Update blog hosting for server rendering**

With server rendering enabled, Firebase Hosting (static) can no longer serve the blog. Switch to Firebase App Hosting which is already configured via `apphosting.yaml`. Remove the blog entry from `firebase.json` hosting array (static hosting) — App Hosting will handle it via `apphosting.yaml` with the existing config (0-2 instances, 512MB memory). Keep the static hosting entries for `platform` and `design` unchanged.

- [ ] **Step 2: Commit**

```bash
git add firebase.json
git commit -m "feat: update Firebase config for blog server rendering"
```

---

### Task 18: Placeholder pages

**Files:**
- Create: `apps/blog/src/app/leaderboard/page.tsx`
- Create: `apps/blog/src/app/listen/page.tsx`
- Create: `apps/blog/src/app/submit/page.tsx`
- Create: `apps/blog/src/app/me/page.tsx`
- Create: `apps/blog/src/app/author/[id]/page.tsx`

- [ ] **Step 1: Create placeholder pages**

Each page: correct metadata, heading, "coming in Phase N" message, relevant CTA link. Leaderboard (Phase 2), Listen/Audio Hub (Phase 3), Submit with API endpoint preview (Phase 2), Dashboard (Phase 2), Author/Agent profiles (Phase 2).

- [ ] **Step 2: Commit**

```bash
git add apps/blog/src/app/leaderboard/ apps/blog/src/app/listen/ apps/blog/src/app/submit/ apps/blog/src/app/me/ apps/blog/src/app/author/
git commit -m "feat(blog): add placeholder pages for leaderboard, listen, submit, dashboard, and author profiles"
```

---

### Task 19: Update footer

**Files:**
- Modify: `apps/blog/src/components/blog-footer.tsx`

- [ ] **Step 1: Expand footer**

4-column grid: Index (Explore, Leaderboard, Submit), Channels (LLMs, AI Tools, AI Agents, AI Code), Media (Audio Hub, YouTube soon, Podcast soon), Platform (AaaS Platform, Vault, API). Bottom bar: SYS_LOG message + copyright.

- [ ] **Step 2: Commit**

```bash
git add apps/blog/src/components/blog-footer.tsx
git commit -m "feat(blog): expand footer for knowledge index navigation"
```

---

### Task 20: Final verification

- [ ] **Step 1: Type check**

Run: `cd /Users/user/.gemini/AaaS && npx tsc --noEmit -p apps/blog/tsconfig.json`
Expected: No errors

- [ ] **Step 2: Build test**

Run: `cd /Users/user/.gemini/AaaS && npm run build:blog`
Expected: Build succeeds (may have warnings about missing Firestore data)

- [ ] **Step 3: Dev server test**

Run: `cd /Users/user/.gemini/AaaS && npm run dev:blog`
Verify: Homepage renders, navigation works, entity pages render (with data), API routes respond

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(blog): complete Phase 1 knowledge index frontend scaffold"
```

---

## Phase 1 Summary

After completing all tasks, the blog will have:

- **12 seed entities** across 6 types (Tools, Models, Agents, Skills, Scripts, Benchmarks)
- **Structured entity pages** with JSON-LD, schema tables, score bars, and cross-links
- **Homepage** with trending entities, channel grid, and latest additions
- **10 channel pages** for topic-based browsing
- **Explore page** with entity listing
- **Read-only API** at `/api/entities` and `/api/entity/:type/:slug`
- **Placeholder pages** for leaderboard, listen, submit, and dashboard
- **Updated navigation** and footer reflecting the knowledge index identity

### Next phases:
- **Phase 2:** Leaderboard system, personalization (role-based), Vault integration, Firestore seeding pipeline
- **Phase 3:** Audio pipeline (SuperTonic TTS), faceless video generation, podcast feeds
- **Phase 4:** Self-healing agents, content submission API with auth, external agent ingestion
