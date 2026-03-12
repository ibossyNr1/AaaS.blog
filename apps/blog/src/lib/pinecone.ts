/**
 * Pinecone semantic search integration layer.
 *
 * Gracefully degrades when credentials are missing — all public helpers
 * return empty results instead of throwing.
 */

import type { Entity } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SemanticSearchResult {
  slug: string;
  type: string;
  name: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface SearchOptions {
  topK?: number;
  filter?: Record<string, unknown>;
}

export interface HybridSearchOptions extends SearchOptions {
  semanticWeight?: number;
  keywordWeight?: number;
}

type ScoredEntity = Entity & { _searchScore?: number };

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const PINECONE_HOST = process.env.PINECONE_HOST || ""; // e.g. "https://aaas-knowledge-index-xxxxx.svc.pinecone.io"

const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY || "";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

function isPineconeConfigured(): boolean {
  return Boolean(PINECONE_API_KEY && PINECONE_HOST);
}

// ---------------------------------------------------------------------------
// Embedding
// ---------------------------------------------------------------------------

/**
 * Generate an embedding vector for the given text.
 *
 * Uses the OpenAI-compatible embeddings API (works with OpenAI, Azure,
 * or any provider exposing the same interface).
 *
 * Falls back to a simple term-frequency vector when no API key is set.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!EMBEDDING_API_KEY) {
    return getTfVector(text);
  }

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EMBEDDING_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text.slice(0, 8000),
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!res.ok) {
      console.error("[pinecone] Embedding API error:", res.status, await res.text());
      return getTfVector(text);
    }

    const json = await res.json();
    return json.data?.[0]?.embedding ?? getTfVector(text);
  } catch (err) {
    console.error("[pinecone] Embedding request failed:", err);
    return getTfVector(text);
  }
}

/**
 * Simple deterministic TF vector used as a fallback when no embedding
 * API is available. NOT suitable for production semantic search but lets
 * the pipeline work end-to-end in development.
 */
function getTfVector(text: string): number[] {
  const vec = new Float64Array(EMBEDDING_DIMENSIONS);
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash + token.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % EMBEDDING_DIMENSIONS;
    vec[idx] += 1;
  }
  // L2-normalize
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  const result: number[] = new Array(EMBEDDING_DIMENSIONS);
  for (let i = 0; i < vec.length; i++) result[i] = vec[i] / norm;
  return result;
}

// ---------------------------------------------------------------------------
// Pinecone REST helpers
// ---------------------------------------------------------------------------

async function pineconeRequest(
  path: string,
  method: string,
  body?: unknown,
): Promise<unknown> {
  const url = `${PINECONE_HOST}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Api-Key": PINECONE_API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinecone ${method} ${path} failed (${res.status}): ${text}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Entity helpers — build text + metadata for indexing
// ---------------------------------------------------------------------------

function entityToText(entity: ScoredEntity): string {
  const parts = [
    entity.name,
    entity.description,
    entity.provider,
    ...entity.tags,
    ...entity.capabilities,
    ...entity.useCases,
  ];
  return parts.filter(Boolean).join(" ");
}

function entityToMetadata(
  entity: ScoredEntity,
): Record<string, string | number | boolean | string[]> {
  return {
    slug: entity.slug,
    type: entity.type,
    name: entity.name,
    provider: entity.provider,
    category: entity.category,
    tags: entity.tags,
    composite: entity.scores?.composite ?? 0,
    pricingModel: entity.pricingModel,
  };
}

function entityVectorId(type: string, slug: string): string {
  return `${type}::${slug}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Upsert a single entity into the Pinecone index.
 */
export async function upsertEntity(entity: ScoredEntity): Promise<void> {
  if (!isPineconeConfigured()) {
    console.warn("[pinecone] Not configured — skipping upsert");
    return;
  }

  const embedding = await getEmbedding(entityToText(entity));

  await pineconeRequest("/vectors/upsert", "POST", {
    vectors: [
      {
        id: entityVectorId(entity.type, entity.slug),
        values: embedding,
        metadata: entityToMetadata(entity),
      },
    ],
  });
}

/**
 * Delete an entity from the Pinecone index.
 */
export async function deleteEntity(type: string, slug: string): Promise<void> {
  if (!isPineconeConfigured()) {
    console.warn("[pinecone] Not configured — skipping delete");
    return;
  }

  await pineconeRequest("/vectors/delete", "POST", {
    ids: [entityVectorId(type, slug)],
  });
}

/**
 * Semantic search — returns the top-K most similar entities.
 */
export async function semanticSearch(
  query: string,
  opts: SearchOptions = {},
): Promise<SemanticSearchResult[]> {
  if (!isPineconeConfigured()) {
    return [];
  }

  const { topK = 20, filter } = opts;

  try {
    const embedding = await getEmbedding(query);

    const body: Record<string, unknown> = {
      vector: embedding,
      topK,
      includeMetadata: true,
    };

    if (filter && Object.keys(filter).length > 0) {
      body.filter = filter;
    }

    const response = (await pineconeRequest("/query", "POST", body)) as {
      matches?: Array<{
        id: string;
        score: number;
        metadata?: Record<string, unknown>;
      }>;
    };

    return (response.matches ?? []).map((m) => ({
      slug: (m.metadata?.slug as string) ?? m.id.split("::")[1] ?? m.id,
      type: (m.metadata?.type as string) ?? m.id.split("::")[0] ?? "unknown",
      name: (m.metadata?.name as string) ?? "",
      score: m.score,
      metadata: m.metadata ?? {},
    }));
  } catch (err) {
    console.error("[pinecone] Semantic search failed:", err);
    return [];
  }
}

/**
 * Hybrid search — combines semantic similarity scores with keyword relevance.
 *
 * `keywordResults` should be pre-scored Entity objects from the existing
 * Firestore-based search.  Results are merged by (slug, type) and
 * re-ranked with configurable weights.
 */
export async function hybridSearch(
  query: string,
  keywordResults: Array<Entity & { _searchScore?: number }>,
  opts: HybridSearchOptions = {},
): Promise<SemanticSearchResult[]> {
  const {
    topK = 20,
    filter,
    semanticWeight = 0.6,
    keywordWeight = 0.4,
  } = opts;

  // Run semantic search
  const semanticResults = await semanticSearch(query, { topK, filter });

  // Build a merged score map keyed by "type::slug"
  const merged = new Map<
    string,
    { slug: string; type: string; name: string; score: number; metadata: Record<string, unknown> }
  >();

  // Normalize semantic scores (0-1, Pinecone cosine similarity is already 0-1)
  for (const sr of semanticResults) {
    const key = `${sr.type}::${sr.slug}`;
    merged.set(key, {
      ...sr,
      score: sr.score * semanticWeight,
    });
  }

  // Normalize keyword scores relative to the max keyword score
  const maxKeywordScore = Math.max(1, ...keywordResults.map((e) => e._searchScore ?? 0));
  for (const kr of keywordResults) {
    const key = `${kr.type}::${kr.slug}`;
    const normalizedKw = ((kr._searchScore ?? 0) / maxKeywordScore) * keywordWeight;

    const existing = merged.get(key);
    if (existing) {
      existing.score += normalizedKw;
    } else {
      merged.set(key, {
        slug: kr.slug,
        type: kr.type,
        name: kr.name,
        score: normalizedKw,
        metadata: {
          slug: kr.slug,
          type: kr.type,
          name: kr.name,
          provider: kr.provider,
          category: kr.category,
          tags: kr.tags,
          composite: kr.scores?.composite ?? 0,
        },
      });
    }
  }

  // Sort by merged score descending
  const sorted = Array.from(merged.values()).sort((a, b) => b.score - a.score);

  return sorted.slice(0, topK);
}
