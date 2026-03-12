export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit as firestoreLimit,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { hybridSearch } from "@/lib/pinecone";
import type { Entity } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLLECTION_MAP: Record<string, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

const ALL_COLLECTIONS = Object.values(COLLECTION_MAP);
const VALID_TYPES = new Set(Object.keys(COLLECTION_MAP));

// ---------------------------------------------------------------------------
// Keyword scoring (mirrors existing search route)
// ---------------------------------------------------------------------------

function computeSearchScore(entity: Entity, q: string): number {
  const name = entity.name.toLowerCase();
  const desc = entity.description.toLowerCase();
  const provider = entity.provider.toLowerCase();
  const tags = entity.tags.map((t) => t.toLowerCase());

  let score = 0;
  if (name === q) score += 100;
  else if (name.startsWith(q)) score += 80;
  else if (name.includes(q)) score += 60;

  if (provider === q) score += 40;
  else if (provider.includes(q)) score += 20;

  for (const tag of tags) {
    if (tag === q) { score += 35; break; }
    else if (tag.includes(q)) { score += 15; break; }
  }

  if (desc.includes(q)) score += 10;
  score += (entity.scores?.composite ?? 0) / 20;

  return score;
}

// ---------------------------------------------------------------------------
// GET /api/search/hybrid
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  // Rate limiting
  const rl = await checkRateLimit(req);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: rl.error },
      { status: 429, headers: rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100) },
    );
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.toLowerCase().trim() || "";
  const type = searchParams.get("type") || "";
  const channel = searchParams.get("channel") || "";
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
  const semanticWeight = Math.min(Math.max(Number(searchParams.get("sw") || 0.6), 0), 1);
  const keywordWeight = 1 - semanticWeight;

  if (!q) {
    return NextResponse.json(
      { error: "Missing required query parameter: q" },
      { status: 400 },
    );
  }

  try {
    // --- Keyword search via Firestore ---
    const collections =
      type && VALID_TYPES.has(type) ? [COLLECTION_MAP[type]] : ALL_COLLECTIONS;
    const perCollection = Math.ceil(200 / collections.length);
    const allEntities: Entity[] = [];

    await Promise.all(
      collections.map(async (col) => {
        const constraints: QueryConstraint[] = [];
        if (channel) constraints.push(where("category", "==", channel));
        constraints.push(orderBy("scores.composite", "desc"));
        constraints.push(firestoreLimit(perCollection));

        const snap = await getDocs(query(collection(db, col), ...constraints));
        for (const d of snap.docs) {
          allEntities.push({ slug: d.id, ...d.data() } as Entity);
        }
      }),
    );

    // Score keyword results
    const keywordResults = allEntities
      .map((e) => ({ ...e, _searchScore: computeSearchScore(e, q) }))
      .filter((e) => e._searchScore > 0);

    // --- Hybrid merge ---
    const pineconeFilter: Record<string, unknown> = {};
    if (type) pineconeFilter.type = { $eq: type };
    if (channel) pineconeFilter.category = { $eq: channel };

    const results = await hybridSearch(q, keywordResults, {
      topK: limit,
      filter: Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined,
      semanticWeight,
      keywordWeight,
    });

    return NextResponse.json(
      {
        data: results,
        count: results.length,
        query: q,
        mode: "hybrid",
        weights: { semantic: semanticWeight, keyword: keywordWeight },
        filters: { type: type || null, channel: channel || null },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          ...rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100),
          "Cache-Control": "public, max-age=30",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Hybrid search failed" },
      { status: 500 },
    );
  }
}
