import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Entity, EntityType } from "./types";
import { CHANNELS } from "./channels";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface EntityReference {
  slug: string;
  type: string;
  name: string;
  relevance: number;
}

export interface AIQueryResult {
  answer: string;
  entities: EntityReference[];
  sources: string[];
  confidence: number;
  suggestedFollowUps: string[];
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  entities?: EntityReference[];
}

export type QueryIntent = "compare" | "recommend" | "explain" | "discover" | "general";

interface ParsedIntent {
  type: QueryIntent;
  entities: string[];
  attributes: string[];
}

type ScoredEntity = Entity & { _matchScore: number };

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const COLLECTION_MAP: Record<EntityType, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

const ALL_COLLECTIONS = Object.values(COLLECTION_MAP);
const TYPE_KEYWORDS: Record<string, EntityType> = {
  tool: "tool", tools: "tool", sdk: "tool", api: "tool",
  model: "model", models: "model", llm: "model", llms: "model",
  agent: "agent", agents: "agent", assistant: "agent", assistants: "agent",
  skill: "skill", skills: "skill",
  script: "script", scripts: "script",
  benchmark: "benchmark", benchmarks: "benchmark",
};

const COMPARE_PATTERNS = [/compare/i, /\bvs\.?\b/i, /versus/i, /difference between/i, /better.+or/i];
const RECOMMEND_PATTERNS = [/best/i, /recommend/i, /suggest/i, /top\s+\d/i, /which.+should/i, /what.+good/i];
const EXPLAIN_PATTERNS = [/what is/i, /explain/i, /how does/i, /tell me about/i, /describe/i, /what are/i];
const DISCOVER_PATTERNS = [/trending/i, /new/i, /latest/i, /popular/i, /show me/i, /find/i, /list/i];

/* ------------------------------------------------------------------ */
/*  Intent extraction                                                  */
/* ------------------------------------------------------------------ */

export function extractQueryIntent(queryStr: string): ParsedIntent {
  const q = queryStr.toLowerCase().trim();

  let type: QueryIntent = "general";

  if (COMPARE_PATTERNS.some((p) => p.test(q))) {
    type = "compare";
  } else if (RECOMMEND_PATTERNS.some((p) => p.test(q))) {
    type = "recommend";
  } else if (EXPLAIN_PATTERNS.some((p) => p.test(q))) {
    type = "explain";
  } else if (DISCOVER_PATTERNS.some((p) => p.test(q))) {
    type = "discover";
  }

  // Extract entity type references
  const attributes: string[] = [];
  const words = q.split(/\s+/);
  for (const word of words) {
    const clean = word.replace(/[^a-z0-9-]/g, "");
    if (TYPE_KEYWORDS[clean]) {
      attributes.push(TYPE_KEYWORDS[clean]);
    }
  }

  // Extract potential entity names — look for capitalized words or quoted strings
  const entities: string[] = [];
  const quotedMatch = queryStr.match(/"([^"]+)"/g);
  if (quotedMatch) {
    entities.push(...quotedMatch.map((m) => m.replace(/"/g, "")));
  }

  // Look for "vs" patterns: "X vs Y"
  const vsMatch = queryStr.match(/(.+?)\s+(?:vs\.?|versus)\s+(.+)/i);
  if (vsMatch) {
    entities.push(vsMatch[1].trim(), vsMatch[2].trim());
  }

  // Extract channel references
  for (const ch of CHANNELS) {
    if (q.includes(ch.slug) || q.includes(ch.name.toLowerCase())) {
      attributes.push(`channel:${ch.slug}`);
    }
  }

  return { type, entities, attributes };
}

/* ------------------------------------------------------------------ */
/*  Fetch entities based on query keywords                             */
/* ------------------------------------------------------------------ */

async function fetchRelevantEntities(
  queryStr: string,
  intent: ParsedIntent,
  maxResults = 10,
): Promise<ScoredEntity[]> {
  const q = queryStr.toLowerCase();
  const targetTypes = intent.attributes.filter((a) => !a.startsWith("channel:"));
  const targetChannels = intent.attributes
    .filter((a) => a.startsWith("channel:"))
    .map((a) => a.replace("channel:", ""));

  const collections =
    targetTypes.length > 0
      ? targetTypes.map((t) => COLLECTION_MAP[t as EntityType]).filter(Boolean)
      : ALL_COLLECTIONS;

  const perCollection = Math.ceil(50 / collections.length);
  const allEntities: Entity[] = [];

  await Promise.all(
    collections.map(async (col) => {
      const constraints = [];
      if (targetChannels.length === 1) {
        constraints.push(where("category", "==", targetChannels[0]));
      }
      constraints.push(orderBy("scores.composite", "desc"));
      constraints.push(firestoreLimit(perCollection));

      const snap = await getDocs(query(collection(db, col), ...constraints));
      for (const d of snap.docs) {
        allEntities.push({ slug: d.id, ...d.data() } as Entity);
      }
    }),
  );

  // Score each entity against the query
  const scored: ScoredEntity[] = [];
  const keywords = q.split(/\s+/).filter((w) => w.length > 2);

  for (const entity of allEntities) {
    let score = 0;
    const name = entity.name.toLowerCase();
    const desc = entity.description.toLowerCase();
    const tags = entity.tags.map((t) => t.toLowerCase());

    // Direct name mentions in query
    if (q.includes(name)) {
      score += 100;
    } else if (name.split(/\s+/).some((w) => q.includes(w) && w.length > 2)) {
      score += 50;
    }

    // Named entity references from intent parsing
    for (const eName of intent.entities) {
      const en = eName.toLowerCase();
      if (name.includes(en) || en.includes(name)) {
        score += 80;
      }
    }

    // Keyword matches
    for (const kw of keywords) {
      if (name.includes(kw)) score += 20;
      if (desc.includes(kw)) score += 5;
      if (entity.provider.toLowerCase().includes(kw)) score += 15;
      if (tags.some((t) => t.includes(kw))) score += 10;
      if (entity.capabilities?.some((c) => c.toLowerCase().includes(kw))) score += 8;
      if (entity.useCases?.some((u) => u.toLowerCase().includes(kw))) score += 6;
    }

    // Composite score boost
    score += (entity.scores?.composite ?? 0) / 20;

    if (score > 0) {
      scored.push({ ...entity, _matchScore: score });
    }
  }

  scored.sort((a, b) => b._matchScore - a._matchScore);
  return scored.slice(0, maxResults);
}

/* ------------------------------------------------------------------ */
/*  Build context string from entities                                 */
/* ------------------------------------------------------------------ */

export function buildContextFromEntities(entities: ScoredEntity[]): string {
  return entities
    .map((e) => {
      const lines = [
        `[${e.type.toUpperCase()}] ${e.name} (by ${e.provider})`,
        `  Score: ${e.scores.composite}/100 | Category: ${e.category}`,
        `  ${e.description}`,
        e.tags.length > 0 ? `  Tags: ${e.tags.join(", ")}` : "",
        e.capabilities?.length > 0 ? `  Capabilities: ${e.capabilities.join(", ")}` : "",
        e.pricingModel ? `  Pricing: ${e.pricingModel}` : "",
      ];
      return lines.filter(Boolean).join("\n");
    })
    .join("\n\n");
}

/* ------------------------------------------------------------------ */
/*  Response generation (rule-based fallback)                          */
/* ------------------------------------------------------------------ */

function generateRuleBasedResponse(
  queryStr: string,
  intent: ParsedIntent,
  entities: ScoredEntity[],
): AIQueryResult {
  if (entities.length === 0) {
    return {
      answer:
        "I couldn't find any entities matching your query. Try searching with different keywords, or browse the index by category.",
      entities: [],
      sources: [],
      confidence: 0.3,
      suggestedFollowUps: [
        "Show me trending tools",
        "What models are available?",
        "List all AI agents",
      ],
    };
  }

  const refs: EntityReference[] = entities.map((e) => ({
    slug: e.slug,
    type: e.type,
    name: e.name,
    relevance: Math.min(e._matchScore / 100, 1),
  }));

  const sources = entities.map((e) => `/${e.type}/${e.slug}`);
  let answer: string;
  let confidence: number;

  switch (intent.type) {
    case "compare": {
      if (entities.length >= 2) {
        const top = entities.slice(0, Math.min(entities.length, 4));
        answer = `Here's a comparison of the top matches:\n\n${top
          .map(
            (e, i) =>
              `**${i + 1}. ${e.name}** (${e.provider}) — Score: ${e.scores.composite}/100\n${e.description}${e.pricingModel ? ` | Pricing: ${e.pricingModel}` : ""}`,
          )
          .join("\n\n")}`;
        confidence = 0.7;
      } else {
        answer = `I found **${entities[0].name}** by ${entities[0].provider}. ${entities[0].description}\n\nI could only find one match for your comparison. Try specifying both names.`;
        confidence = 0.5;
      }
      break;
    }

    case "recommend": {
      const top = entities.slice(0, 5);
      answer = `Based on the index data, here are the top recommendations:\n\n${top
        .map(
          (e, i) =>
            `**${i + 1}. ${e.name}** — Score: ${e.scores.composite}/100\n${e.description}`,
        )
        .join("\n\n")}`;
      confidence = 0.75;
      break;
    }

    case "explain": {
      const primary = entities[0];
      const details = [
        `**${primary.name}** is a ${primary.type} by ${primary.provider}.`,
        primary.description,
        primary.pricingModel ? `Pricing model: ${primary.pricingModel}.` : "",
        primary.capabilities?.length > 0
          ? `Key capabilities: ${primary.capabilities.slice(0, 5).join(", ")}.`
          : "",
        primary.tags.length > 0
          ? `Tags: ${primary.tags.join(", ")}.`
          : "",
        `Composite score: ${primary.scores.composite}/100.`,
      ];
      answer = details.filter(Boolean).join(" ");
      confidence = 0.8;
      break;
    }

    case "discover": {
      answer = `Here's what I found in the index:\n\n${entities
        .slice(0, 6)
        .map(
          (e, i) =>
            `**${i + 1}. ${e.name}** (${e.type}) — ${e.scores.composite}/100\n${e.description}`,
        )
        .join("\n\n")}`;
      confidence = 0.7;
      break;
    }

    default: {
      const primary = entities[0];
      answer = `The top result for your query is **${primary.name}** by ${primary.provider} (${primary.type}). ${primary.description}`;
      if (entities.length > 1) {
        answer += `\n\nI also found ${entities.length - 1} more related ${entities.length - 1 === 1 ? "entity" : "entities"}.`;
      }
      confidence = 0.6;
      break;
    }
  }

  // Generate follow-up suggestions based on the results
  const followUps = generateFollowUps(intent, entities);

  return {
    answer,
    entities: refs,
    sources,
    confidence,
    suggestedFollowUps: followUps,
  };
}

function generateFollowUps(intent: ParsedIntent, entities: ScoredEntity[]): string[] {
  const followUps: string[] = [];

  if (entities.length > 0) {
    const first = entities[0];

    if (intent.type !== "explain") {
      followUps.push(`Tell me more about ${first.name}`);
    }

    if (intent.type !== "compare" && entities.length >= 2) {
      followUps.push(`Compare ${entities[0].name} vs ${entities[1].name}`);
    }

    if (intent.type !== "recommend") {
      followUps.push(`What are the best ${first.type}s?`);
    }

    // Suggest related type exploration
    const types = new Set(entities.map((e) => e.type));
    for (const t of types) {
      if (followUps.length < 4) {
        followUps.push(`Show me trending ${t}s`);
      }
    }
  }

  if (followUps.length < 3) {
    followUps.push("What's trending this week?");
    followUps.push("Compare the top AI coding assistants");
  }

  return followUps.slice(0, 4);
}

/* ------------------------------------------------------------------ */
/*  LLM-enhanced response (when AI_API_KEY is available)               */
/* ------------------------------------------------------------------ */

async function generateLLMResponse(
  queryStr: string,
  intent: ParsedIntent,
  entities: ScoredEntity[],
  context?: ConversationMessage[],
): Promise<AIQueryResult | null> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;

  const entityContext = buildContextFromEntities(entities);

  const systemPrompt = `You are the AaaS Knowledge Index assistant. You help users discover AI tools, models, agents, skills, scripts, and benchmarks. Answer questions using the provided entity data. Be concise and factual. Reference entities by name. If the data doesn't contain the answer, say so. Format responses with markdown.`;

  const conversationHistory =
    context
      ?.slice(-6)
      .map((m) => ({ role: m.role, content: m.content })) ?? [];

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...conversationHistory,
    {
      role: "user" as const,
      content: `Context from the AaaS Knowledge Index:\n\n${entityContext}\n\nUser query: ${queryStr}`,
    },
  ];

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content;
    if (!answer) return null;

    const refs: EntityReference[] = entities.map((e) => ({
      slug: e.slug,
      type: e.type,
      name: e.name,
      relevance: Math.min(e._matchScore / 100, 1),
    }));

    const sources = entities.map((e) => `/${e.type}/${e.slug}`);
    const followUps = generateFollowUps(intent, entities);

    return {
      answer,
      entities: refs,
      sources,
      confidence: 0.9,
      suggestedFollowUps: followUps,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Main entry point                                                   */
/* ------------------------------------------------------------------ */

export async function processNaturalQuery(
  queryStr: string,
  context?: ConversationMessage[],
): Promise<AIQueryResult> {
  const intent = extractQueryIntent(queryStr);
  const entities = await fetchRelevantEntities(queryStr, intent);

  // Try LLM-enhanced response first
  const llmResult = await generateLLMResponse(queryStr, intent, entities, context);
  if (llmResult) return llmResult;

  // Fallback to rule-based
  return generateRuleBasedResponse(queryStr, intent, entities);
}
