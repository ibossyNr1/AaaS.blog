export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit as firestoreLimit,
  addDoc,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import type { Entity } from "@/lib/types";

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
const VALID_SORT = new Set(["relevance", "composite", "newest", "name"]);

/* ------------------------------------------------------------------ */
/*  Fuzzy scoring helpers                                              */
/* ------------------------------------------------------------------ */

type ScoredEntity = Entity & {
  _searchScore: number;
};

function computeSearchScore(entity: Entity, q: string): number {
  const name = entity.name.toLowerCase();
  const desc = entity.description.toLowerCase();
  const provider = entity.provider.toLowerCase();
  const tags = entity.tags.map((t) => t.toLowerCase());

  let score = 0;

  // Exact name match — highest
  if (name === q) {
    score += 100;
  } else if (name.startsWith(q)) {
    score += 80;
  } else if (name.includes(q)) {
    score += 60;
  }

  // Provider match
  if (provider === q) {
    score += 40;
  } else if (provider.includes(q)) {
    score += 20;
  }

  // Tag match
  for (const tag of tags) {
    if (tag === q) {
      score += 35;
      break;
    } else if (tag.includes(q)) {
      score += 15;
      break;
    }
  }

  // Description match
  if (desc.includes(q)) {
    score += 10;
  }

  // Boost by composite score (normalized 0-5)
  score += (entity.scores?.composite ?? 0) / 20;

  return score;
}

/* ------------------------------------------------------------------ */
/*  Log search query to Firestore                                      */
/* ------------------------------------------------------------------ */

async function logSearchQuery(queryText: string, resultsCount: number): Promise<void> {
  try {
    await addDoc(collection(db, "search_logs"), {
      query: queryText,
      resultsCount,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Never let logging fail the search
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/search                                                    */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  // --- Rate limiting ---
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
  const sort = searchParams.get("sort") || "relevance";
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);

  if (sort && !VALID_SORT.has(sort)) {
    return NextResponse.json(
      { error: `Invalid sort. Valid: ${Array.from(VALID_SORT).join(", ")}` },
      { status: 400 },
    );
  }

  if (!q) {
    return NextResponse.json(
      { error: "Missing required query parameter: q" },
      { status: 400 },
    );
  }

  try {
    const collections = type && VALID_TYPES.has(type)
      ? [COLLECTION_MAP[type]]
      : ALL_COLLECTIONS;

    const allEntities: Entity[] = [];
    const perCollection = Math.ceil(200 / collections.length);

    await Promise.all(
      collections.map(async (col) => {
        const constraints: QueryConstraint[] = [];

        if (channel) {
          constraints.push(where("category", "==", channel));
        }

        constraints.push(orderBy("scores.composite", "desc"));
        constraints.push(firestoreLimit(perCollection));

        const snap = await getDocs(query(collection(db, col), ...constraints));
        for (const d of snap.docs) {
          allEntities.push({ slug: d.id, ...d.data() } as Entity);
        }
      }),
    );

    // Score and filter with fuzzy matching
    const scored: ScoredEntity[] = [];
    for (const entity of allEntities) {
      const searchScore = computeSearchScore(entity, q);
      if (searchScore > 0) {
        scored.push({ ...entity, _searchScore: searchScore });
      }
    }

    // Sort
    if (sort === "relevance") {
      scored.sort((a, b) => b._searchScore - a._searchScore);
    } else if (sort === "composite") {
      scored.sort((a, b) => b.scores.composite - a.scores.composite);
    } else if (sort === "newest") {
      scored.sort((a, b) => b.addedDate.localeCompare(a.addedDate));
    } else if (sort === "name") {
      scored.sort((a, b) => a.name.localeCompare(b.name));
    }

    const final = scored.slice(0, limit);

    // Strip internal score field before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = final.map(({ _searchScore, ...rest }) => rest);

    // Log search query asynchronously (fire and forget)
    logSearchQuery(q, data.length);

    return NextResponse.json(
      {
        data,
        count: data.length,
        total: allEntities.length,
        query: q,
        filters: { type: type || null, channel: channel || null, sort },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          ...rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100),
          "Cache-Control": "public, max-age=60",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 },
    );
  }
}
